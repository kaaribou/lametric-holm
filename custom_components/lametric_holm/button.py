"""Appli suivante / précédente, effacer les notifications."""
from __future__ import annotations

from homeassistant.components.button import ButtonEntity

from homeassistant.exceptions import HomeAssistantError

from .api import LaMetricError
from .const import DOMAIN
from .entity import LaMetricEntity

BUTTONS = {
    "next_app": "mdi:skip-next",
    "prev_app": "mdi:skip-previous",
    "dismiss_current": "mdi:message-minus",
    "dismiss_all": "mdi:message-off",
}


async def async_setup_entry(hass, entry, async_add_entities):
    rt = hass.data[DOMAIN][entry.entry_id]
    async_add_entities([Btn(rt, k, icon) for k, icon in BUTTONS.items()])


class Btn(LaMetricEntity, ButtonEntity):
    def __init__(self, rt, key, icon):
        super().__init__(rt, key)
        self._key = key
        self._attr_icon = icon

    async def async_press(self) -> None:
        c = self.rt.client
        try:
            if self._key == "next_app":
                await c.app_next()
            elif self._key == "prev_app":
                await c.app_prev()
            elif self._key == "dismiss_current":
                cur = await c.current_notification()
                if cur and cur.get("id") is not None:
                    await c.dismiss(str(cur["id"]))
            else:
                await c.dismiss_all()
        except LaMetricError as err:
            raise HomeAssistantError(str(err)) from err
        await self.coordinator.refresh_apps()
