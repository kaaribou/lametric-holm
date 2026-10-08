"""Mode de luminosité, mode de défilement des applis, appli affichée."""
from __future__ import annotations

from homeassistant.components.select import SelectEntity
from homeassistant.const import EntityCategory

from homeassistant.exceptions import HomeAssistantError

from .api import LaMetricError
from .const import DEVICE_MODES, DOMAIN
from .entity import LaMetricEntity, dig


async def async_setup_entry(hass, entry, async_add_entities):
    rt = hass.data[DOMAIN][entry.entry_id]
    async_add_entities([BrightnessMode(rt), DeviceMode(rt), ActiveApp(rt)])


class BrightnessMode(LaMetricEntity, SelectEntity):
    _attr_icon = "mdi:brightness-auto"
    _attr_options = ["auto", "manual"]
    _attr_entity_category = EntityCategory.CONFIG

    def __init__(self, rt):
        super().__init__(rt, "brightness_mode")

    @property
    def current_option(self):
        return dig(self.device, "display", "brightness_mode")

    async def async_select_option(self, option: str) -> None:
        try:
            await self.rt.client.set_display(brightness_mode=option)
        except LaMetricError as err:
            raise HomeAssistantError(str(err)) from err
        self.patch("display", "brightness_mode", value=option)


class DeviceMode(LaMetricEntity, SelectEntity):
    """auto : les applis défilent seules ; manual : on change d'appli au bouton ; schedule / kiosk."""
    _attr_icon = "mdi:view-carousel"
    _attr_options = DEVICE_MODES
    _attr_entity_category = EntityCategory.CONFIG

    def __init__(self, rt):
        super().__init__(rt, "device_mode")

    @property
    def current_option(self):
        mode = self.device.get("mode")
        return mode if mode in DEVICE_MODES else None

    async def async_select_option(self, option: str) -> None:
        try:
            await self.rt.client.set_mode(option)
        except LaMetricError as err:
            raise HomeAssistantError(str(err)) from err
        self.patch("mode", value=option)


class ActiveApp(LaMetricEntity, SelectEntity):
    _attr_icon = "mdi:apps"

    def __init__(self, rt):
        super().__init__(rt, "active_app")

    def _labels(self) -> list[tuple[str, dict]]:
        seen: dict[str, int] = {}
        out = []
        for w in self.coordinator.widgets():
            n = seen.get(w["title"], 0) + 1
            seen[w["title"]] = n
            out.append((w["title"] if n == 1 else f"{w['title']} {n}", w))
        return out

    @property
    def options(self):
        return [label for label, _ in self._labels()] or ["—"]

    @property
    def current_option(self):
        return next((label for label, w in self._labels() if w["visible"]), None)

    async def async_select_option(self, option: str) -> None:
        w = next((w for label, w in self._labels() if label == option), None)
        if not w:
            return
        try:
            await self.rt.client.activate(w["package"], w["widget"])
        except LaMetricError as err:
            raise HomeAssistantError(str(err)) from err
        await self.coordinator.refresh_apps()
