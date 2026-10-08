"""Client de l'API locale du LaMetric Time (API v2)."""
from __future__ import annotations

import asyncio
import logging
from typing import Any

import aiohttp

_LOGGER = logging.getLogger(__name__)
_TIMEOUT = aiohttp.ClientTimeout(total=10)


class LaMetricError(Exception):
    """Erreur lisible renvoyée à l'utilisateur."""


class LaMetricAuthError(LaMetricError):
    """Clé d'API refusée."""


class LaMetricClient:
    """Accès HTTPS (port 4343, certificat auto-signé) avec repli HTTP (8080)."""

    def __init__(self, session: aiohttp.ClientSession, host: str, api_key: str) -> None:
        self._session = session
        self.host = host
        self._auth = aiohttp.BasicAuth("dev", api_key)
        self._base: str | None = None

    async def _bases(self) -> list[str]:
        if self._base:
            return [self._base]
        return [f"https://{self.host}:4343", f"http://{self.host}:8080"]

    async def request(self, method: str, path: str, json: Any = None) -> Any:
        last: Exception | None = None
        for base in await self._bases():
            try:
                async with self._session.request(method, base + path, json=json, auth=self._auth, ssl=False,
                                                 timeout=_TIMEOUT, headers={"Accept": "application/json"}) as r:
                    if r.status == 401:
                        raise LaMetricAuthError("Clé d'API refusée par le LaMetric")
                    body = await r.json(content_type=None) if r.content_length != 0 else None
                    if r.status >= 400:
                        msg = ""
                        if isinstance(body, dict) and body.get("errors"):
                            msg = "; ".join(str(e.get("message")) for e in body["errors"])
                        raise LaMetricError(f"LaMetric : erreur {r.status} {msg}".strip())
                    self._base = base
                    return body
            except LaMetricError:
                raise
            except (aiohttp.ClientError, asyncio.TimeoutError, ValueError) as err:
                last = err
                if self._base:  # l'adresse retenue ne répond plus : on réessaie toutes les variantes la fois suivante
                    self._base = None
        raise LaMetricError(f"LaMetric injoignable ({last})")

    # ---------- état ----------
    async def device(self) -> dict:
        return await self.request("GET", "/api/v2/device")

    async def apps(self) -> dict:
        return await self.request("GET", "/api/v2/device/apps") or {}

    async def notifications(self) -> list:
        return await self.request("GET", "/api/v2/device/notifications") or []

    # ---------- réglages ----------
    async def set_display(self, **data) -> Any:
        return await self.request("PUT", "/api/v2/device/display", data)

    async def set_volume(self, volume: int) -> Any:
        return await self.request("PUT", "/api/v2/device/audio", {"volume": int(volume)})

    async def set_bluetooth(self, **data) -> Any:
        return await self.request("PUT", "/api/v2/device/bluetooth", data)

    async def set_mode(self, mode: str) -> Any:
        return await self.request("PUT", "/api/v2/device", {"mode": mode})

    # ---------- applis ----------
    async def app_next(self) -> Any:
        return await self.request("PUT", "/api/v2/device/apps/next")

    async def app_prev(self) -> Any:
        return await self.request("PUT", "/api/v2/device/apps/prev")

    async def activate(self, package: str, widget: str) -> Any:
        return await self.request("PUT", f"/api/v2/device/apps/{package}/widgets/{widget}/activate")

    async def action(self, package: str, widget: str, action_id: str, params: dict | None = None, activate: bool = True) -> Any:
        body: dict = {"id": action_id, "activate": activate}
        if params:
            body["params"] = params
        return await self.request("POST", f"/api/v2/device/apps/{package}/widgets/{widget}/actions", body)

    # ---------- notifications ----------
    async def notify(self, payload: dict) -> str | None:
        out = await self.request("POST", "/api/v2/device/notifications", payload)
        return ((out or {}).get("success") or {}).get("id")

    async def dismiss(self, notification_id: str) -> Any:
        return await self.request("DELETE", f"/api/v2/device/notifications/{notification_id}")

    async def dismiss_all(self) -> int:
        n = 0
        for item in await self.notifications():
            try:
                await self.dismiss(str(item["id"]))
                n += 1
            except LaMetricError:
                pass
        return n

    async def current_notification(self) -> dict | None:
        try:
            return await self.request("GET", "/api/v2/device/notifications/current")
        except LaMetricError:
            return None

    # ---------- appli « My Data DIY » (push local) ----------
    async def push_widget(self, widget_id: str, frames: list[dict]) -> Any:
        return await self.request("POST", f"/api/v2/widget/update/com.lametric.diy.devwidget/{widget_id}", {"frames": frames})
