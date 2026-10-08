"""Entité de notification : notify.send_message vers le LaMetric (mode nuit respecté)."""
from __future__ import annotations

from homeassistant.components.notify import NotifyEntity
from homeassistant.exceptions import HomeAssistantError

from .api import LaMetricError
from .const import DOMAIN
from .entity import LaMetricEntity
from .scheduler import build_notification


async def async_setup_entry(hass, entry, async_add_entities):
    rt = hass.data[DOMAIN][entry.entry_id]
    async_add_entities([Notify(rt)])


class Notify(LaMetricEntity, NotifyEntity):
    _attr_icon = "mdi:message-text"

    def __init__(self, rt):
        super().__init__(rt, "notify")

    async def async_send_message(self, message: str, title: str | None = None) -> None:
        frames = []
        if title:
            frames.append({"text": title})
        frames.append({"text": message})
        s = self.rt.scheduler
        body = build_notification(frames, sound=s.settings.get("default_sound") or None)
        if s.settings["night"].get("apply_to_notify", True):
            body = s.filter_night(body)
            if body is None:
                return
        try:
            await self.rt.client.notify(body)
        except LaMetricError as err:
            raise HomeAssistantError(str(err)) from err
