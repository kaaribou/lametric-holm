"""Échanges avec la carte : état en direct, programmes, aperçu, recherche d'icônes, commandes."""
from __future__ import annotations

import asyncio
import logging
import time
import unicodedata
from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.storage import Store

from .api import LaMetricError
from .const import ALARM_SOUNDS, DOMAIN, NOTIFICATION_SOUNDS, SIGNAL_UPDATED, VERSION
from .entity import dig, wifi_value
from .scheduler import build_notification

_LOGGER = logging.getLogger(__name__)
ICONS_URL = "https://developer.lametric.com/api/v2/icons"
ICONS_MAX_AGE = 7 * 86400


def _rt(hass: HomeAssistant, msg: dict):
    from . import runtime_for
    return runtime_for(hass, msg.get("entry_id"))


def snapshot(hass: HomeAssistant, rt) -> dict:
    """Tout ce que la carte affiche."""
    dev = rt.coordinator.device
    s = rt.scheduler
    return {
        "version": VERSION,
        "entries": [{"entry_id": r.entry.entry_id, "title": r.entry.title} for r in hass.data[DOMAIN].values()],
        "entry_id": rt.entry.entry_id,
        "available": rt.coordinator.last_update_success,
        "device": {
            "name": dev.get("name"), "model": dev.get("model"), "os_version": dev.get("os_version"),
            "mode": dev.get("mode"),
            "brightness": dig(dev, "display", "brightness"), "brightness_mode": dig(dev, "display", "brightness_mode"),
            "brightness_range": dig(dev, "display", "brightness_range", default={"min": 0, "max": 100}),
            "screensaver": dig(dev, "display", "screensaver", default={}),
            "volume": dig(dev, "audio", "volume"),
            "volume_range": dig(dev, "audio", "volume_range", default={"min": 0, "max": 100}),
            "bluetooth": dig(dev, "bluetooth", "active"), "bluetooth_name": dig(dev, "bluetooth", "name"),
            "wifi": wifi_value(dev, "strength", "signal_strength", "rssi"), "ssid": wifi_value(dev, "essid", "ssid"),
            "host": rt.client.host,
        },
        "widgets": rt.coordinator.widgets(),
        "queue": (rt.coordinator.data or {}).get("queue") or [],
        "programmes": s.programmes,
        "settings": s.settings,
        "state": s.state,
        "timeline": s.timeline(),
        "sounds": {"notifications": NOTIFICATION_SOUNDS, "alarms": ALARM_SOUNDS},
    }


@callback
def async_register_ws(hass: HomeAssistant) -> None:
    for handler in (ws_subscribe, ws_save, ws_delete, ws_reorder, ws_settings, ws_render, ws_icons, ws_send,
                    ws_device, ws_push):
        websocket_api.async_register_command(hass, handler)


def _err(connection, msg, err: Exception) -> None:
    connection.send_error(msg["id"], "lametric_holm", str(err))


@websocket_api.websocket_command({vol.Required("type"): "lametric_holm/subscribe", vol.Optional("entry_id"): str})
@websocket_api.async_response
async def ws_subscribe(hass, connection, msg) -> None:
    try:
        rt = _rt(hass, msg)
    except ValueError as err:
        return _err(connection, msg, err)
    pending: dict[str, Any] = {"handle": None}

    @callback
    def push() -> None:
        pending["handle"] = None
        connection.send_message(websocket_api.event_message(msg["id"], snapshot(hass, rt)))

    @callback
    def changed(*_a) -> None:   # regroupe les rafales de mises à jour
        if pending["handle"] is None:
            pending["handle"] = hass.loop.call_later(0.3, push)

    unsubs = [async_dispatcher_connect(hass, SIGNAL_UPDATED.format(rt.entry.entry_id), changed),
              rt.coordinator.async_add_listener(changed)]

    @callback
    def unsub() -> None:
        for u in unsubs:
            u()
        if pending["handle"]:
            pending["handle"].cancel()

    connection.subscriptions[msg["id"]] = unsub
    connection.send_result(msg["id"])
    push()


@websocket_api.websocket_command({vol.Required("type"): "lametric_holm/programme/save", vol.Optional("entry_id"): str,
                                  vol.Required("programme"): dict})
@websocket_api.async_response
async def ws_save(hass, connection, msg) -> None:
    try:
        prog = await _rt(hass, msg).scheduler.save_programme(msg["programme"])
    except (ValueError, TypeError) as err:
        return _err(connection, msg, err)
    connection.send_result(msg["id"], prog)


@websocket_api.websocket_command({vol.Required("type"): "lametric_holm/programme/delete", vol.Optional("entry_id"): str,
                                  vol.Required("programme_id"): str})
@websocket_api.async_response
async def ws_delete(hass, connection, msg) -> None:
    await _rt(hass, msg).scheduler.delete_programme(msg["programme_id"])
    connection.send_result(msg["id"])


@websocket_api.websocket_command({vol.Required("type"): "lametric_holm/programme/reorder", vol.Optional("entry_id"): str,
                                  vol.Required("ids"): [str]})
@websocket_api.async_response
async def ws_reorder(hass, connection, msg) -> None:
    await _rt(hass, msg).scheduler.reorder(msg["ids"])
    connection.send_result(msg["id"])


@websocket_api.websocket_command({vol.Required("type"): "lametric_holm/settings", vol.Optional("entry_id"): str,
                                  vol.Required("changes"): dict})
@websocket_api.async_response
async def ws_settings(hass, connection, msg) -> None:
    await _rt(hass, msg).scheduler.update_settings(msg["changes"])
    connection.send_result(msg["id"])


@websocket_api.websocket_command({vol.Required("type"): "lametric_holm/render", vol.Optional("entry_id"): str,
                                  vol.Required("frames"): list})
@websocket_api.async_response
async def ws_render(hass, connection, msg) -> None:
    try:
        frames = await _rt(hass, msg).scheduler.render_frames(msg["frames"])
    except ValueError as err:
        return _err(connection, msg, err)
    connection.send_result(msg["id"], {"frames": frames})


@websocket_api.websocket_command({vol.Required("type"): "lametric_holm/send", vol.Optional("entry_id"): str,
                                  vol.Required("frames"): list, vol.Optional("priority", default="info"): str,
                                  vol.Optional("icon_type", default="none"): str, vol.Optional("sound"): vol.Any(str, None),
                                  vol.Optional("repeat", default=1): int, vol.Optional("cycles", default=1): int})
@websocket_api.async_response
async def ws_send(hass, connection, msg) -> None:
    rt = _rt(hass, msg)
    try:
        frames = await rt.scheduler.render_frames(msg["frames"])
        if not frames:
            raise LaMetricError("Rien à afficher")
        nid = await rt.client.notify(build_notification(frames, msg["priority"], msg["icon_type"], msg.get("sound") or None,
                                                         msg["repeat"], msg["cycles"]))
    except LaMetricError as err:
        return _err(connection, msg, err)
    await rt.coordinator.async_request_refresh()
    connection.send_result(msg["id"], {"id": nid})


@websocket_api.websocket_command({vol.Required("type"): "lametric_holm/push", vol.Optional("entry_id"): str})
@websocket_api.async_response
async def ws_push(hass, connection, msg) -> None:
    rt = _rt(hass, msg)
    rt.scheduler._last_hash = ""
    rt.scheduler._last_push = 0
    await rt.scheduler.tick()
    connection.send_result(msg["id"], {"error": rt.scheduler.state.get("error")})


@websocket_api.websocket_command({vol.Required("type"): "lametric_holm/device", vol.Optional("entry_id"): str,
                                  vol.Required("action"): str, vol.Optional("value"): vol.Any(str, int, float, bool, dict, None),
                                  vol.Optional("package"): str, vol.Optional("widget"): str})
@websocket_api.async_response
async def ws_device(hass, connection, msg) -> None:
    rt = _rt(hass, msg)
    c, a, v = rt.client, msg["action"], msg.get("value")
    try:
        if a == "brightness":
            await c.set_display(brightness=int(v), brightness_mode="manual")
        elif a == "brightness_mode":
            await c.set_display(brightness_mode=str(v))
        elif a == "screensaver":
            await c.set_display(screensaver=v if isinstance(v, dict) else {"enabled": bool(v)})
        elif a == "volume":
            await c.set_volume(int(v))
        elif a == "bluetooth":
            await c.set_bluetooth(active=bool(v))
        elif a == "mode":
            await c.set_mode(str(v))
        elif a == "next":
            await c.app_next()
        elif a == "prev":
            await c.app_prev()
        elif a == "activate":
            await c.activate(msg["package"], msg["widget"])
        elif a == "dismiss":
            await c.dismiss(str(v))
        elif a == "dismiss_all":
            await c.dismiss_all()
        else:
            raise LaMetricError(f"Action inconnue : {a}")
    except (LaMetricError, KeyError, ValueError, TypeError) as err:
        return _err(connection, msg, err)
    await rt.coordinator.refresh_apps()
    connection.send_result(msg["id"])


# ---------------------------------------------------------------- icônes LaMetric
class IconCache:
    """Catalogue des icônes LaMetric (l'API ne sait pas chercher : on le garde en cache, rafraîchi chaque semaine)."""

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self.icons: list[dict] = []
        self.loaded_at = 0.0
        self._lock = asyncio.Lock()
        self._store = Store(hass, 1, f"{DOMAIN}.icons")

    async def ensure(self) -> None:
        async with self._lock:
            if self.icons and time.time() - self.loaded_at < ICONS_MAX_AGE:
                return
            if not self.icons:
                data = await self._store.async_load() or {}
                self.icons = [{"id": i, "code": c, "title": t} for i, c, t in data.get("icons") or [] if isinstance(i, int)]
                self.loaded_at = float(data.get("at") or 0)
                if self.icons and time.time() - self.loaded_at < ICONS_MAX_AGE:
                    return
            fresh = await self._download()
            if fresh:
                self.icons, self.loaded_at = fresh, time.time()
                await self._store.async_save({"icons": [[i["id"], i["code"], i["title"]] for i in fresh], "at": self.loaded_at})

    async def _download(self) -> list[dict]:
        """Tout le catalogue en une requête (≈ 75 000 icônes, classées par popularité)."""
        session = async_get_clientsession(self.hass)
        try:
            async with session.get(ICONS_URL, params={"page": 0, "page_size": 200000, "order": "popular",
                                                      "fields": "id,title,code,type"}, timeout=120) as r:
                if r.status != 200:
                    return []
                body = await r.json(content_type=None)
        except Exception as err:  # noqa: BLE001
            _LOGGER.warning("Catalogue d'icônes LaMetric indisponible : %s", err)
            return []
        out: list[dict] = []
        seen: set = set()
        for it in (body or {}).get("data") or []:
            iid = it.get("id")
            if iid is None or iid in seen:
                continue
            seen.add(iid)
            code = it.get("code") or (("a" if str(it.get("type", "")).lower() in ("movie", "animation") else "i") + str(iid))
            out.append({"id": iid, "code": code, "title": it.get("title") or ""})
        return out

    def _index(self) -> None:
        self._folded = [_fold(i["title"]) for i in self.icons]

    def search(self, query: str, limit: int) -> list[dict]:
        words = _fold(query).split()
        if len(getattr(self, "_folded", [])) != len(self.icons):
            self._index()
        if not words:
            hits = self.icons
        else:
            hits = []
            for icon, title in zip(self.icons, self._folded):
                if all(w in title or w == str(icon["id"]) or w == icon["code"] for w in words):
                    hits.append(icon)
                    if len(hits) >= limit:
                        break
        res = []
        for i in hits[:limit]:
            res.append({**i, "thumb": f"https://developer.lametric.com/content/apps/icon_thumbs/{i['id']}_icon_thumb_sm.png"})
        return res


def _fold(text: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", str(text).lower()) if unicodedata.category(c) != "Mn")


@websocket_api.websocket_command({vol.Required("type"): "lametric_holm/icons", vol.Optional("entry_id"): str, vol.Optional("query", default=""): str,
                                  vol.Optional("limit", default=80): int})
@websocket_api.async_response
async def ws_icons(hass, connection, msg) -> None:
    cache: IconCache = hass.data.setdefault(f"{DOMAIN}_icons", IconCache(hass))
    await cache.ensure()
    connection.send_result(msg["id"], {"icons": cache.search(msg["query"], max(1, min(msg["limit"], 300))),
                                       "total": len(cache.icons)})
