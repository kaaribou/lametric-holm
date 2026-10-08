"""Ajout du LaMetric : reprise des réglages de l'intégration officielle, ou saisie manuelle."""
from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry, ConfigFlow, OptionsFlow
from homeassistant.core import callback
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers import selector

from .api import LaMetricAuthError, LaMetricClient, LaMetricError
from .const import CONF_API_KEY, CONF_HOST, DOMAIN, MYDATA_PACKAGE, OFFICIAL_DOMAIN

CONF_ENTRY = "official_entry"
CONF_SCAN = "scan_interval"
CONF_WIDGET = "mydata_widget"


class LaMetricHolmFlow(ConfigFlow, domain=DOMAIN):
    VERSION = 1

    def __init__(self) -> None:
        self._found: dict[str, dict] = {}

    async def _probe(self, host: str, api_key: str) -> tuple[dict | None, str | None]:
        client = LaMetricClient(async_get_clientsession(self.hass, verify_ssl=False), host, api_key)
        try:
            return await client.device(), None
        except LaMetricAuthError:
            return None, "invalid_auth"
        except LaMetricError:
            return None, "cannot_connect"

    async def _create(self, host: str, api_key: str, device: dict):
        uid = str(device.get("serial_number") or device.get("id") or host)
        await self.async_set_unique_id(uid)
        self._abort_if_unique_id_configured(updates={CONF_HOST: host, CONF_API_KEY: api_key})
        return self.async_create_entry(title=device.get("name") or "LaMetric",
                                       data={CONF_HOST: host, CONF_API_KEY: api_key})

    async def async_step_user(self, user_input: dict | None = None):
        self._found = {}
        for entry in self.hass.config_entries.async_entries(OFFICIAL_DOMAIN):
            host, key = entry.data.get(CONF_HOST), entry.data.get(CONF_API_KEY)
            if host and key:
                self._found[entry.entry_id] = {"title": entry.title, CONF_HOST: host, CONF_API_KEY: key}
        if self._found:
            return self.async_show_menu(step_id="user", menu_options=["reuse", "manual"])
        return await self.async_step_manual()

    async def async_step_reuse(self, user_input: dict | None = None):
        errors: dict[str, str] = {}
        if user_input is not None or len(self._found) == 1:
            eid = (user_input or {}).get(CONF_ENTRY) or next(iter(self._found))
            src = self._found[eid]
            device, err = await self._probe(src[CONF_HOST], src[CONF_API_KEY])
            if device:
                return await self._create(src[CONF_HOST], src[CONF_API_KEY], device)
            errors["base"] = err
            if len(self._found) == 1:
                return await self.async_step_manual(None, errors, src)
        options = [selector.SelectOptionDict(value=k, label=f"{v['title']} ({v[CONF_HOST]})") for k, v in self._found.items()]
        return self.async_show_form(step_id="reuse", errors=errors, data_schema=vol.Schema({
            vol.Required(CONF_ENTRY): selector.SelectSelector(selector.SelectSelectorConfig(options=options)),
        }))

    async def async_step_manual(self, user_input: dict | None = None, errors: dict | None = None, defaults: dict | None = None):
        errors = dict(errors or {})
        defaults = defaults or {}
        if user_input is not None:
            host = user_input[CONF_HOST].strip()
            device, err = await self._probe(host, user_input[CONF_API_KEY].strip())
            if device:
                return await self._create(host, user_input[CONF_API_KEY].strip(), device)
            errors["base"] = err
            defaults = user_input
        return self.async_show_form(step_id="manual", errors=errors, data_schema=vol.Schema({
            vol.Required(CONF_HOST, default=defaults.get(CONF_HOST, "")): str,
            vol.Required(CONF_API_KEY, default=defaults.get(CONF_API_KEY, "")): selector.TextSelector(
                selector.TextSelectorConfig(type=selector.TextSelectorType.PASSWORD)),
        }))

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        return LaMetricHolmOptions()


class LaMetricHolmOptions(OptionsFlow):
    async def async_step_init(self, user_input: dict[str, Any] | None = None):
        if user_input is not None:
            if user_input.get(CONF_WIDGET) == "auto":
                user_input[CONF_WIDGET] = ""
            return self.async_create_entry(data=user_input)
        widgets: list[str] = []
        runtime = (self.hass.data.get(DOMAIN) or {}).get(self.config_entry.entry_id)
        if runtime:
            widgets = runtime.coordinator.mydata_widgets()
        opts = [selector.SelectOptionDict(value="auto", label="Automatique")]
        opts += [selector.SelectOptionDict(value=w, label=f"My Data — {w}") for w in widgets]
        cur = self.config_entry.options.get(CONF_WIDGET) or "auto"
        if cur not in [o["value"] for o in opts]:
            opts.append(selector.SelectOptionDict(value=cur, label=cur))
        return self.async_show_form(step_id="init", data_schema=vol.Schema({
            vol.Required(CONF_SCAN, default=self.config_entry.options.get(CONF_SCAN, 30)): selector.NumberSelector(
                selector.NumberSelectorConfig(min=10, max=300, step=5, unit_of_measurement="s", mode=selector.NumberSelectorMode.BOX)),
            vol.Required(CONF_WIDGET, default=cur): selector.SelectSelector(
                selector.SelectSelectorConfig(options=opts, custom_value=True)),
        }), description_placeholders={"package": MYDATA_PACKAGE})
