"""Wi-Fi, appli affichée, file de notifications, programmes actifs."""
from __future__ import annotations

from homeassistant.components.sensor import SensorEntity, SensorStateClass
from homeassistant.const import PERCENTAGE, EntityCategory

from .const import DOMAIN
from .entity import LaMetricEntity, SchedulerEntity, wifi_value


async def async_setup_entry(hass, entry, async_add_entities):
    rt = hass.data[DOMAIN][entry.entry_id]
    async_add_entities([Wifi(rt), Ip(rt), Firmware(rt), CurrentApp(rt), Queue(rt), Active(rt)])


class Wifi(LaMetricEntity, SensorEntity):
    _attr_icon = "mdi:wifi"
    _attr_native_unit_of_measurement = PERCENTAGE
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_entity_category = EntityCategory.DIAGNOSTIC

    def __init__(self, rt):
        super().__init__(rt, "wifi_signal")

    @property
    def native_value(self):
        return wifi_value(self.device, "strength", "signal_strength", "rssi")

    @property
    def extra_state_attributes(self):
        return {"ssid": wifi_value(self.device, "essid", "ssid")}


class Ip(LaMetricEntity, SensorEntity):
    _attr_icon = "mdi:ip-network"
    _attr_entity_category = EntityCategory.DIAGNOSTIC
    _attr_entity_registry_enabled_default = False

    def __init__(self, rt):
        super().__init__(rt, "ip_address")

    @property
    def native_value(self):
        return wifi_value(self.device, "ipv4", "ip", "address_ipv4") or self.rt.client.host


class Firmware(LaMetricEntity, SensorEntity):
    _attr_icon = "mdi:chip"
    _attr_entity_category = EntityCategory.DIAGNOSTIC

    def __init__(self, rt):
        super().__init__(rt, "firmware")

    @property
    def native_value(self):
        return self.device.get("os_version")

    @property
    def extra_state_attributes(self):
        upd = self.device.get("update_available") or self.device.get("update") or {}
        return {"update_available": (upd.get("version") if isinstance(upd, dict) else upd) or None}


class CurrentApp(LaMetricEntity, SensorEntity):
    _attr_icon = "mdi:television-guide"

    def __init__(self, rt):
        super().__init__(rt, "current_app")

    @property
    def native_value(self):
        w = self.coordinator.current_widget()
        return w["title"] if w else None

    @property
    def extra_state_attributes(self):
        w = self.coordinator.current_widget() or {}
        return {"package": w.get("package"), "widget": w.get("widget")}


class Queue(LaMetricEntity, SensorEntity):
    _attr_icon = "mdi:message-badge"
    _attr_state_class = SensorStateClass.MEASUREMENT

    def __init__(self, rt):
        super().__init__(rt, "queue")

    @property
    def native_value(self):
        return len((self.coordinator.data or {}).get("queue") or [])


class Active(SchedulerEntity, SensorEntity):
    _attr_icon = "mdi:calendar-check"

    def __init__(self, rt):
        super().__init__(rt, "active_programmes")

    @property
    def native_value(self):
        return len(self.rt.scheduler.state.get("active") or [])

    @property
    def extra_state_attributes(self):
        s = self.rt.scheduler
        names = [p["name"] for p in s.programmes if p["id"] in (s.state.get("active") or [])]
        return {"programmes": names, "night": s.state.get("night"), "error": s.state.get("error"),
                "pushed_at": s.state.get("pushed_at")}
