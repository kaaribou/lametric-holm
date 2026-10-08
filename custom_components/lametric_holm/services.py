"""Services : notifications riches, applis du LaMetric (réveil, minuteur, radio…), écrans à la demande."""
from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.core import HomeAssistant, ServiceCall, ServiceResponse, SupportsResponse
from homeassistant.exceptions import HomeAssistantError
import homeassistant.helpers.config_validation as cv

from .api import LaMetricError
from .const import DOMAIN, ICON_TYPES, PRIORITIES
from .scheduler import build_notification

DEVICE = vol.Optional("device")

NOTIFY_SCHEMA = vol.Schema({
    DEVICE: cv.string,
    vol.Optional("message"): cv.string,
    vol.Optional("icon"): cv.string,
    vol.Optional("frames"): vol.All(cv.ensure_list, [dict]),
    vol.Optional("priority", default="info"): vol.In(PRIORITIES),
    vol.Optional("icon_type", default="none"): vol.In(ICON_TYPES),
    vol.Optional("sound"): cv.string,
    vol.Optional("repeat", default=1): vol.All(vol.Coerce(int), vol.Range(min=0, max=10)),
    vol.Optional("cycles", default=1): vol.All(vol.Coerce(int), vol.Range(min=0, max=50)),
    vol.Optional("lifetime"): vol.All(vol.Coerce(int), vol.Range(min=1)),
    vol.Optional("ignore_night", default=False): cv.boolean,
})


def _rt(hass: HomeAssistant, call: ServiceCall):
    from . import runtime_for
    try:
        return runtime_for(hass, call.data.get("device"))
    except ValueError as err:
        raise HomeAssistantError(str(err)) from err


async def _frames(rt, call: ServiceCall) -> list[dict]:
    out: list[dict] = []
    if call.data.get("message"):
        out += await rt.scheduler.render_frames([{"type": "text", "icon": call.data.get("icon", ""),
                                                  "text": call.data["message"]}])
    for f in call.data.get("frames") or []:
        if "goalData" in f or "chartData" in f:   # écran déjà au format LaMetric
            out.append(dict(f))
            continue
        f = dict(f)
        if "type" not in f:
            f["type"] = "chart" if f.get("hours") else ("goal" if "end" in f else "text")
        out += await rt.scheduler.render_frames([f])
    if not out:
        raise HomeAssistantError("Rien à afficher : indiquez « message » ou « frames »")
    return out


def async_register_services(hass: HomeAssistant) -> None:
    async def notify(call: ServiceCall) -> ServiceResponse:
        rt = _rt(hass, call)
        body = build_notification(await _frames(rt, call), call.data["priority"], call.data["icon_type"],
                                  call.data.get("sound") or rt.scheduler.settings.get("default_sound") or None,
                                  call.data["repeat"], call.data["cycles"],
                                  call.data["lifetime"] * 1000 if call.data.get("lifetime") else None)
        if not call.data["ignore_night"]:
            body = rt.scheduler.filter_night(body)
            if body is None:
                return {"sent": False, "reason": "night"}
        try:
            nid = await rt.client.notify(body)
        except LaMetricError as err:
            raise HomeAssistantError(str(err)) from err
        await rt.coordinator.async_request_refresh()
        return {"sent": True, "id": nid}

    hass.services.async_register(DOMAIN, "notify", notify, NOTIFY_SCHEMA, supports_response=SupportsResponse.OPTIONAL)

    async def dismiss(call: ServiceCall) -> None:
        rt = _rt(hass, call)
        try:
            if call.data.get("all"):
                await rt.client.dismiss_all()
            elif call.data.get("id"):
                await rt.client.dismiss(str(call.data["id"]))
            else:
                cur = await rt.client.current_notification()
                if cur and cur.get("id") is not None:
                    await rt.client.dismiss(str(cur["id"]))
        except LaMetricError as err:
            raise HomeAssistantError(str(err)) from err
        await rt.coordinator.async_request_refresh()

    hass.services.async_register(DOMAIN, "dismiss", dismiss, vol.Schema({
        DEVICE: cv.string, vol.Optional("all", default=False): cv.boolean, vol.Optional("id"): cv.string}))

    async def _app(rt, package: str, action: str | None, params: dict | None = None, activate: bool = True,
                   widget: str | None = None) -> None:
        wid = widget or rt.coordinator.find_widget(package)
        if not wid:
            await rt.coordinator.refresh_apps()
            wid = rt.coordinator.find_widget(package)
        if not wid:
            raise HomeAssistantError(f"Appli {package} absente du LaMetric")
        try:
            if action:
                await rt.client.action(package, wid, action, params or None, activate)
            else:
                await rt.client.activate(package, wid)
        except LaMetricError as err:
            raise HomeAssistantError(str(err)) from err
        await rt.coordinator.refresh_apps()

    async def activate_app(call: ServiceCall) -> None:
        rt = _rt(hass, call)
        pkg = call.data.get("package") or ""
        if not pkg and call.data.get("app"):
            name = call.data["app"].lower()
            hit = next((w for w in rt.coordinator.widgets() if w["title"].lower() == name), None)
            if not hit:
                raise HomeAssistantError(f"Appli « {call.data['app']} » introuvable")
            pkg, call_widget = hit["package"], hit["widget"]
            return await _app(rt, pkg, None, widget=call_widget)
        await _app(rt, pkg, None, widget=call.data.get("widget"))

    hass.services.async_register(DOMAIN, "activate_app", activate_app, vol.Schema({
        DEVICE: cv.string, vol.Optional("app"): cv.string, vol.Optional("package"): cv.string,
        vol.Optional("widget"): cv.string}))

    async def app_action(call: ServiceCall) -> None:
        rt = _rt(hass, call)
        await _app(rt, call.data["package"], call.data["action"], call.data.get("params"),
                   call.data.get("activate", True), call.data.get("widget"))

    hass.services.async_register(DOMAIN, "app_action", app_action, vol.Schema({
        DEVICE: cv.string, vol.Required("package"): cv.string, vol.Required("action"): cv.string,
        vol.Optional("widget"): cv.string, vol.Optional("params"): dict, vol.Optional("activate", default=True): cv.boolean}))

    async def alarm(call: ServiceCall) -> None:
        rt = _rt(hass, call)
        params: dict[str, Any] = {"enabled": call.data.get("enabled", True)}
        if call.data.get("time"):
            t = call.data["time"]
            params["time"] = t.strftime("%H:%M:%S") if hasattr(t, "strftime") else str(t)
        if "wake_with_radio" in call.data:
            params["wake_with_radio"] = call.data["wake_with_radio"]
        await _app(rt, "com.lametric.clock", "clock.alarm", params, call.data.get("activate", False))

    hass.services.async_register(DOMAIN, "alarm", alarm, vol.Schema({
        DEVICE: cv.string, vol.Optional("enabled", default=True): cv.boolean, vol.Optional("time"): cv.time,
        vol.Optional("wake_with_radio"): cv.boolean, vol.Optional("activate", default=False): cv.boolean}))

    async def timer(call: ServiceCall) -> None:
        rt = _rt(hass, call)
        act = call.data.get("action", "start")
        if act == "start" and call.data.get("duration"):
            d = call.data["duration"]
            secs = int(d.total_seconds()) if hasattr(d, "total_seconds") else int(d)
            await _app(rt, "com.lametric.countdown", "countdown.configure", {"duration": secs, "start_now": True})
        else:
            await _app(rt, "com.lametric.countdown", f"countdown.{act}")

    hass.services.async_register(DOMAIN, "timer", timer, vol.Schema({
        DEVICE: cv.string, vol.Optional("action", default="start"): vol.In(["start", "pause", "reset"]),
        vol.Optional("duration"): cv.time_period}))

    async def stopwatch(call: ServiceCall) -> None:
        rt = _rt(hass, call)
        await _app(rt, "com.lametric.stopwatch", f"stopwatch.{call.data['action']}")

    hass.services.async_register(DOMAIN, "stopwatch", stopwatch, vol.Schema({
        DEVICE: cv.string, vol.Required("action"): vol.In(["start", "pause", "reset"])}))

    async def radio(call: ServiceCall) -> None:
        rt = _rt(hass, call)
        await _app(rt, "com.lametric.radio", f"radio.{call.data['action']}")

    hass.services.async_register(DOMAIN, "radio", radio, vol.Schema({
        DEVICE: cv.string, vol.Required("action"): vol.In(["play", "stop", "next", "prev"])}))

    async def clockface(call: ServiceCall) -> None:
        rt = _rt(hass, call)
        params = {"type": call.data.get("type", "weather")}
        if call.data.get("icon"):
            params = {"icon": call.data["icon"]}
        await _app(rt, "com.lametric.clock", "clock.clockface", params, False)

    hass.services.async_register(DOMAIN, "clockface", clockface, vol.Schema({
        DEVICE: cv.string, vol.Optional("type", default="weather"): vol.In(["weather", "page_a_day", "none"]),
        vol.Optional("icon"): cv.string}))

    async def push_frames(call: ServiceCall) -> None:
        rt = _rt(hass, call)
        frames = await _frames(rt, call) if (call.data.get("frames") or call.data.get("message")) else None
        await rt.scheduler.set_override(frames, call.data.get("minutes", 5))
        if call.data.get("activate", True) and frames:
            await _app(rt, "com.lametric.diy.devwidget", None, widget=rt.scheduler.widget_id())

    hass.services.async_register(DOMAIN, "push_frames", push_frames, vol.Schema({
        DEVICE: cv.string, vol.Optional("message"): cv.string, vol.Optional("icon"): cv.string,
        vol.Optional("frames"): vol.All(cv.ensure_list, [dict]),
        vol.Optional("minutes", default=5): vol.All(vol.Coerce(float), vol.Range(min=0.5, max=1440)),
        vol.Optional("activate", default=True): cv.boolean}))

    async def programme(call: ServiceCall) -> None:
        rt = _rt(hass, call)
        key = call.data["programme"]
        p = rt.scheduler.get(key) or next((x for x in rt.scheduler.programmes if x["name"].lower() == key.lower()), None)
        if not p:
            raise HomeAssistantError(f"Programme « {key} » introuvable")
        action = call.data.get("action", "enable")
        if action in ("enable", "disable"):
            await rt.scheduler.set_enabled(p["id"], action == "enable")
        else:   # « send » : affiche tout de suite le programme, en notification
            cfg = p.get("notification") or {}
            frames = await rt.scheduler.render_frames(p.get("frames") or [])
            if frames:
                try:
                    await rt.client.notify(build_notification(frames, cfg.get("priority", "info"),
                                                              cfg.get("icon_type", "none"), cfg.get("sound") or None,
                                                              cfg.get("repeat", 1), cfg.get("cycles", 1)))
                except LaMetricError as err:
                    raise HomeAssistantError(str(err)) from err

    hass.services.async_register(DOMAIN, "programme", programme, vol.Schema({
        DEVICE: cv.string, vol.Required("programme"): cv.string,
        vol.Optional("action", default="enable"): vol.In(["enable", "disable", "send"])}))
