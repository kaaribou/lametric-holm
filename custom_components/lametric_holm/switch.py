"""Bluetooth, économiseur d'écran, moteur des programmes, mode nuit."""
from __future__ import annotations

from homeassistant.components.switch import SwitchEntity
from homeassistant.const import EntityCategory

from homeassistant.exceptions import HomeAssistantError

from .api import LaMetricError
from .const import DOMAIN
from .entity import LaMetricEntity, SchedulerEntity, dig


async def async_setup_entry(hass, entry, async_add_entities):
    rt = hass.data[DOMAIN][entry.entry_id]
    async_add_entities([Bluetooth(rt), Screensaver(rt), Engine(rt), Night(rt)])


class Bluetooth(LaMetricEntity, SwitchEntity):
    _attr_icon = "mdi:bluetooth"
    _attr_entity_category = EntityCategory.CONFIG

    def __init__(self, rt):
        super().__init__(rt, "bluetooth")

    @property
    def available(self):
        return super().available and dig(self.device, "bluetooth", "available", default=True) is not False

    @property
    def is_on(self):
        return dig(self.device, "bluetooth", "active")

    async def _set(self, on: bool):
        try:
            await self.rt.client.set_bluetooth(active=on)
        except LaMetricError as err:
            raise HomeAssistantError(str(err)) from err
        self.patch("bluetooth", "active", value=on)

    async def async_turn_on(self, **kw):
        await self._set(True)

    async def async_turn_off(self, **kw):
        await self._set(False)


class Screensaver(LaMetricEntity, SwitchEntity):
    _attr_icon = "mdi:monitor-off"
    _attr_entity_category = EntityCategory.CONFIG

    def __init__(self, rt):
        super().__init__(rt, "screensaver")

    @property
    def is_on(self):
        return dig(self.device, "display", "screensaver", "enabled")

    @property
    def extra_state_attributes(self):
        modes = dig(self.device, "display", "screensaver", "modes", default={}) or {}
        tb = modes.get("time_based") or {}
        return {"time_based": tb.get("enabled"), "start": tb.get("local_start_time") or tb.get("start_time"),
                "end": tb.get("local_end_time") or tb.get("end_time"),
                "when_dark": (modes.get("when_dark") or {}).get("enabled")}

    async def _set(self, on: bool):
        try:
            await self.rt.client.set_display(screensaver={"enabled": on})
        except LaMetricError as err:
            raise HomeAssistantError(str(err)) from err
        self.patch("display", "screensaver", "enabled", value=on)

    async def async_turn_on(self, **kw):
        await self._set(True)

    async def async_turn_off(self, **kw):
        await self._set(False)


class Engine(SchedulerEntity, SwitchEntity):
    _attr_icon = "mdi:calendar-clock"

    def __init__(self, rt):
        super().__init__(rt, "programmes")

    @property
    def available(self):
        return True

    @property
    def is_on(self):
        return bool(self.rt.scheduler.settings.get("engine", True))

    async def async_turn_on(self, **kw):
        await self.rt.scheduler.set_engine(True)

    async def async_turn_off(self, **kw):
        await self.rt.scheduler.set_engine(False)


class Night(SchedulerEntity, SwitchEntity):
    _attr_icon = "mdi:weather-night"

    def __init__(self, rt):
        super().__init__(rt, "night_mode")

    @property
    def available(self):
        return True

    @property
    def is_on(self):
        return bool(self.rt.scheduler.settings["night"].get("enabled"))

    @property
    def extra_state_attributes(self):
        return {"in_night": self.rt.scheduler.state.get("night")}

    async def async_turn_on(self, **kw):
        await self.rt.scheduler.update_settings({"night": {"enabled": True}})

    async def async_turn_off(self, **kw):
        await self.rt.scheduler.update_settings({"night": {"enabled": False}})
