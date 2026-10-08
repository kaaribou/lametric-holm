"""Base commune des entités."""
from __future__ import annotations

from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import callback
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN, SIGNAL_UPDATED, VERSION


def dig(data: dict | None, *path: str, default: Any = None) -> Any:
    cur: Any = data or {}
    for p in path:
        if not isinstance(cur, dict):
            return default
        cur = cur.get(p)
        if cur is None:
            return default
    return cur


def wifi_value(device: dict, *keys: str) -> Any:
    wifi = (device or {}).get("wifi") or {}
    for k in keys:
        if wifi.get(k) not in (None, ""):
            return wifi[k]
    return None


class LaMetricEntity(CoordinatorEntity):
    _attr_has_entity_name = True

    def __init__(self, runtime, key: str) -> None:
        super().__init__(runtime.coordinator)
        self.rt = runtime
        entry: ConfigEntry = runtime.entry
        base = entry.unique_id or entry.entry_id
        self._attr_unique_id = f"{base}_{key}"
        self._attr_translation_key = key
        dev = runtime.coordinator.device
        several = len(runtime.coordinator.hass.config_entries.async_entries(DOMAIN)) > 1
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, base)},
            name="HOLM LaMetric" if not several else f"HOLM LaMetric {entry.title}",
            manufacturer="LaMetric",
            model=dev.get("model") or "LaMetric Time",
            sw_version=dev.get("os_version"),
            serial_number=dev.get("serial_number"),
            configuration_url="https://developer.lametric.com",
        )

    @property
    def device(self) -> dict:
        return self.coordinator.device

    def patch(self, *path: str, value: Any) -> None:
        """Mise à jour immédiate de l'état connu, avant la prochaine lecture."""
        cur = self.coordinator.data.setdefault("device", {})
        for p in path[:-1]:
            cur = cur.setdefault(p, {})
        cur[path[-1]] = value
        self.coordinator.async_update_listeners()


class SchedulerEntity(LaMetricEntity):
    """Entité qui suit aussi l'état des programmes."""

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        self.async_on_remove(async_dispatcher_connect(
            self.hass, SIGNAL_UPDATED.format(self.rt.entry.entry_id), self._sched_update))

    @callback
    def _sched_update(self) -> None:
        self.async_write_ha_state()


__all__ = ["LaMetricEntity", "SchedulerEntity", "dig", "wifi_value", "VERSION"]
