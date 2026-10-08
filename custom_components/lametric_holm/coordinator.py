"""Lecture périodique de l'état du LaMetric."""
from __future__ import annotations

import logging
import time
from datetime import timedelta

from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .api import LaMetricClient, LaMetricError
from .const import DOMAIN, MYDATA_PACKAGE

_LOGGER = logging.getLogger(__name__)


class LaMetricCoordinator(DataUpdateCoordinator[dict]):
    def __init__(self, hass: HomeAssistant, client: LaMetricClient, name: str, entry=None) -> None:
        super().__init__(hass, _LOGGER, config_entry=entry, name=f"{DOMAIN} {name}", update_interval=timedelta(seconds=30))
        self.client = client
        self._apps_at = 0.0
        self.apps: dict = {}

    async def _async_update_data(self) -> dict:
        try:
            dev = await self.client.device()
            if time.monotonic() - self._apps_at > 120 or not self.apps:
                self.apps = await self.client.apps()
                self._apps_at = time.monotonic()
            queue = await self.client.notifications()
        except LaMetricError as err:
            raise UpdateFailed(str(err)) from err
        return {"device": dev, "apps": self.apps, "queue": queue}

    async def refresh_apps(self) -> None:
        self._apps_at = 0
        await self.async_request_refresh()

    # ---------- aides ----------
    @property
    def device(self) -> dict:
        return (self.data or {}).get("device") or {}

    def widgets(self) -> list[dict]:
        """Toutes les applis installées (une ligne par widget), dans l'ordre de l'horloge."""
        out = []
        for pkg, app in (self.apps or {}).items():
            for wid, w in (app.get("widgets") or {}).items():
                out.append({"package": pkg, "widget": wid, "index": w.get("index", 99), "visible": bool(w.get("visible")),
                            "vendor": app.get("vendor", ""), "actions": list((app.get("actions") or {}).keys()),
                            "title": app_title(pkg, app)})
        out.sort(key=lambda x: (x["index"] if x["index"] >= 0 else 999, x["package"]))
        return out

    def current_widget(self) -> dict | None:
        return next((w for w in self.widgets() if w["visible"]), None)

    def find_widget(self, package: str) -> str | None:
        app = (self.apps or {}).get(package) or {}
        ids = list((app.get("widgets") or {}).keys())
        return ids[0] if ids else None

    def mydata_widgets(self) -> list[str]:
        app = (self.apps or {}).get(MYDATA_PACKAGE) or {}
        return list((app.get("widgets") or {}).keys())


_TITLES = {
    "com.lametric.clock": "Horloge", "com.lametric.weather": "Météo", "com.lametric.radio": "Radio",
    "com.lametric.countdown": "Minuteur", "com.lametric.stopwatch": "Chronomètre", "com.lametric.diy.devwidget": "My Data",
    "com.lametric.calendar": "Calendrier", "com.lametric.alarm": "Réveil",
}


def app_title(package: str, app: dict | None = None) -> str:
    if package in _TITLES:
        return _TITLES[package]
    app = app or {}
    for key in ("title", "name"):
        if app.get(key):
            return str(app[key])
    if app.get("vendor"):
        return f"Appli {app['vendor']}"
    tail = package.split(".")[-1]
    return tail[:1].upper() + tail[1:] if not all(c in "0123456789abcdef" for c in tail) else package
