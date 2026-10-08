"""Luminosité et volume."""
from __future__ import annotations

from homeassistant.components.number import NumberEntity, NumberMode
from homeassistant.const import PERCENTAGE, EntityCategory

from homeassistant.exceptions import HomeAssistantError

from .api import LaMetricError
from .const import DOMAIN
from .entity import LaMetricEntity, dig


async def async_setup_entry(hass, entry, async_add_entities):
    rt = hass.data[DOMAIN][entry.entry_id]
    async_add_entities([Brightness(rt), Volume(rt)])


class Brightness(LaMetricEntity, NumberEntity):
    _attr_icon = "mdi:brightness-6"
    _attr_native_unit_of_measurement = PERCENTAGE
    _attr_mode = NumberMode.SLIDER

    def __init__(self, rt):
        super().__init__(rt, "brightness")

    @property
    def native_min_value(self):
        return dig(self.device, "display", "brightness_range", "min", default=0)

    @property
    def native_max_value(self):
        return dig(self.device, "display", "brightness_range", "max", default=100)

    @property
    def native_value(self):
        return dig(self.device, "display", "brightness")

    async def async_set_native_value(self, value: float) -> None:
        try:
            # régler la luminosité passe l'écran en mode manuel, comme sur l'appli LaMetric
            await self.rt.client.set_display(brightness=int(value), brightness_mode="manual")
        except LaMetricError as err:
            raise HomeAssistantError(str(err)) from err
        self.patch("display", "brightness", value=int(value))
        self.patch("display", "brightness_mode", value="manual")


class Volume(LaMetricEntity, NumberEntity):
    _attr_icon = "mdi:volume-high"
    _attr_native_unit_of_measurement = PERCENTAGE
    _attr_mode = NumberMode.SLIDER

    def __init__(self, rt):
        super().__init__(rt, "volume")

    @property
    def native_min_value(self):
        return dig(self.device, "audio", "volume_range", "min", default=0)

    @property
    def native_max_value(self):
        return dig(self.device, "audio", "volume_range", "max", default=100)

    @property
    def native_value(self):
        return dig(self.device, "audio", "volume")

    async def async_set_native_value(self, value: float) -> None:
        try:
            await self.rt.client.set_volume(int(value))
        except LaMetricError as err:
            raise HomeAssistantError(str(err)) from err
        self.patch("audio", "volume", value=int(value))
