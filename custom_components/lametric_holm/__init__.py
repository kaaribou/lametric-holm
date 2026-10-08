"""HOLM LaMetric — pilotage complet du LaMetric Time et programmation de ce qu'il affiche."""
from __future__ import annotations

import hashlib
import logging
import os
from dataclasses import dataclass
from datetime import timedelta

from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .api import LaMetricClient
from .const import CARD_URL, CONF_API_KEY, CONF_HOST, DOMAIN, STATIC_PATH, VERSION
from .coordinator import LaMetricCoordinator
from .scheduler import Scheduler
from .services import async_register_services
from .websocket import async_register_ws

_LOGGER = logging.getLogger(__name__)
PLATFORMS = [Platform.BUTTON, Platform.NOTIFY, Platform.NUMBER, Platform.SELECT, Platform.SENSOR, Platform.SWITCH]


@dataclass
class Runtime:
    entry: ConfigEntry
    client: LaMetricClient
    coordinator: LaMetricCoordinator
    scheduler: Scheduler


def runtime_for(hass: HomeAssistant, entry_id: str | None = None) -> Runtime:
    """Appareil visé : celui demandé, sinon le premier configuré."""
    items: dict = hass.data.get(DOMAIN) or {}
    if entry_id:
        if entry_id in items:
            return items[entry_id]
        for rt in items.values():   # accepte aussi le nom de l'appareil
            if rt.entry.title == entry_id:
                return rt
        raise ValueError(f"LaMetric inconnu : {entry_id}")
    if not items:
        raise ValueError("Aucun LaMetric configuré")
    return next(iter(items.values()))


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    session = async_get_clientsession(hass, verify_ssl=False)
    client = LaMetricClient(session, entry.data[CONF_HOST], entry.data[CONF_API_KEY])
    coordinator = LaMetricCoordinator(hass, client, entry.title, entry)
    coordinator.update_interval = timedelta(seconds=int(entry.options.get("scan_interval", 30)))
    await coordinator.async_config_entry_first_refresh()

    def widget_id() -> str | None:
        wanted = entry.options.get("mydata_widget") or ""
        found = coordinator.mydata_widgets()
        if wanted:
            return wanted
        return found[0] if found else None

    scheduler = Scheduler(hass, entry.entry_id, coordinator, widget_id)
    await scheduler.async_load()

    first = DOMAIN not in hass.data
    hass.data.setdefault(DOMAIN, {})[entry.entry_id] = Runtime(entry, client, coordinator, scheduler)
    if first:
        async_register_ws(hass)
        async_register_services(hass)
        await hass.http.async_register_static_paths([
            StaticPathConfig(STATIC_PATH, os.path.join(os.path.dirname(__file__), "www"), False),
        ])
        card = os.path.join(os.path.dirname(__file__), "www", "holm-lametric-card.js")
        digest = await hass.async_add_executor_job(_file_hash, card)
        url = f"{CARD_URL}?v={VERSION}-{digest}"
        if not await _register_resource(hass, url):
            add_extra_js_url(hass, url)

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    scheduler.start()
    entry.async_on_unload(scheduler.stop)
    entry.async_on_unload(entry.add_update_listener(_options_updated))
    return True


async def _register_resource(hass: HomeAssistant, url: str) -> bool:
    """Déclare la carte comme ressource Lovelace (mode stockage) ; met à jour la version si besoin."""
    try:
        data = hass.data.get("lovelace")
        resources = getattr(data, "resources", None) or (data.get("resources") if isinstance(data, dict) else None)
        if resources is None or not hasattr(resources, "async_create_item"):
            return False
        if not getattr(resources, "loaded", True):
            await resources.async_load()
            resources.loaded = True
        mine = [r for r in resources.async_items() if str(r.get("url", "")).split("?")[0] == CARD_URL]
        if not mine:
            await resources.async_create_item({"res_type": "module", "url": url})
        else:
            if mine[0].get("url") != url:
                await resources.async_update_item(mine[0]["id"], {"res_type": "module", "url": url})
            for extra in mine[1:]:
                await resources.async_delete_item(extra["id"])
        return True
    except Exception as err:  # noqa: BLE001 — repli sur add_extra_js_url
        _LOGGER.debug("Ressource Lovelace non enregistrée (%s), chargement par extra_js_url", err)
        return False


def _file_hash(path: str) -> str:
    try:
        with open(path, "rb") as f:
            return hashlib.sha1(f.read()).hexdigest()[:8]
    except OSError:
        return "0"


async def _options_updated(hass: HomeAssistant, entry: ConfigEntry) -> None:
    rt = hass.data[DOMAIN].get(entry.entry_id)
    if rt:
        rt.coordinator.update_interval = timedelta(seconds=int(entry.options.get("scan_interval", 30)))
        rt.scheduler._last_hash = ""
        rt.scheduler.request_tick(1)


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if ok:
        hass.data[DOMAIN].pop(entry.entry_id, None)
    return ok
