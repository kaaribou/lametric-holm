"""Programmes : ce que le LaMetric affiche, quand, et à quel rythme.

Deux façons d'afficher un programme :
- « app » : ses écrans rejoignent l'appli My Data DIY (affichage continu, poussé en local) tant que le
  programme est actif ; les écrans de tous les programmes actifs se suivent dans l'ordre choisi ;
- « notification » : une notification est envoyée à intervalle régulier (ou une fois à chaque ouverture
  de la plage) tant que le programme est actif.

Un programme est actif selon les jours, les plages horaires (heure fixe ou lever/coucher du soleil
± décalage, plages qui passent minuit acceptées) et des conditions sur des entités. Le mode nuit
filtre les notifications (priorité minimale, silence) et peut baisser la luminosité.
"""
from __future__ import annotations

import copy
from functools import partial
import hashlib
import json
import logging
import time
import uuid
from datetime import date, datetime, timedelta
from typing import Any, Callable

from homeassistant.core import CALLBACK_TYPE, Event, HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.helpers.event import async_call_later, async_track_state_change_event, async_track_time_interval
from homeassistant.helpers.storage import Store
from homeassistant.helpers.sun import get_astral_event_date
from homeassistant.helpers.template import Template
from homeassistant.util import dt as dt_util

from .api import LaMetricError
from .const import ALARM_SOUNDS, DOMAIN, SIGNAL_UPDATED, STORAGE_VERSION

_LOGGER = logging.getLogger(__name__)

RANK = {"info": 0, "warning": 1, "critical": 2}
TICK = timedelta(seconds=30)
REPUSH_S = 600          # renvoi périodique des écrans même sans changement (redémarrage du LaMetric…)
MIN_PUSH_S = 4          # au plus un envoi toutes les 4 s
CHART_CACHE_S = 300

DEFAULT_SETTINGS: dict[str, Any] = {
    "engine": True,
    "idle": [{"icon": "", "text": "HOLM"}],
    "night": {
        "enabled": False,
        "from": {"kind": "time", "time": "22:30", "offset": 0},
        "to": {"kind": "time", "time": "07:00", "offset": 0},
        "min_priority": "critical",
        "mute": True,
        "brightness": None,
        "apply_to_notify": True,
    },
    "default_sound": "",
}

DEFAULT_PROGRAMME: dict[str, Any] = {
    "name": "Nouveau programme",
    "enabled": True,
    "mode": "app",
    "frames": [{"type": "text", "icon": "", "text": "Bonjour"}],
    "days": [0, 1, 2, 3, 4, 5, 6],
    "windows": [],
    "conditions": [],
    "notification": {"interval": 30, "priority": "info", "icon_type": "none", "sound": "", "repeat": 1,
                     "cycles": 1, "lifetime": 0},
}


# ---------------------------------------------------------------- notifications
def build_notification(frames: list[dict], priority: str = "info", icon_type: str = "none", sound: str | None = None,
                       repeat: int = 1, cycles: int = 1, lifetime: int | None = None) -> dict:
    """Corps d'une notification LaMetric à partir d'écrans déjà calculés."""
    model: dict[str, Any] = {"frames": frames, "cycles": int(cycles)}
    if sound:
        if str(sound).startswith(("http://", "https://")):
            model["sound"] = {"url": sound, "type": "mp3", "fallback": {"category": "notifications", "id": "notification"}}
        else:
            model["sound"] = {"category": "alarms" if sound in ALARM_SOUNDS else "notifications", "id": sound,
                              "repeat": int(repeat or 1)}
    body: dict[str, Any] = {"priority": priority if priority in RANK else "info", "icon_type": icon_type or "none",
                            "model": model}
    if lifetime:
        body["lifetime"] = int(lifetime)
    return body


# ---------------------------------------------------------------- plages horaires
def _parse_hm(value: str) -> tuple[int, int]:
    try:
        h, m = str(value or "0:0").split(":")[:2]
        return max(0, min(23, int(h))), max(0, min(59, int(m)))
    except ValueError:
        return 0, 0


class Scheduler:
    def __init__(self, hass: HomeAssistant, entry_id: str, coordinator, widget_id: Callable[[], str | None]) -> None:
        self.hass = hass
        self.entry_id = entry_id
        self.coordinator = coordinator
        self._widget_id = widget_id
        self._store = Store(hass, STORAGE_VERSION, f"{DOMAIN}.{entry_id}")
        self.programmes: list[dict] = []
        self.settings: dict = copy.deepcopy(DEFAULT_SETTINGS)
        self.saved_display: dict | None = None
        self._unsubs: list[CALLBACK_TYPE] = []
        self._state_unsub: CALLBACK_TYPE | None = None
        self._debounce: CALLBACK_TYPE | None = None
        self._last_hash = ""
        self._last_push = 0.0
        self._last_sent: dict[str, float] = {}
        self._was_active: set[str] = set()
        self._night = None
        self._chart_cache: dict[tuple, tuple[float, list[int]]] = {}
        self._running = False
        self.override: tuple[list[dict], float] | None = None   # écrans imposés par le service push_frames
        # état lisible par la carte et les capteurs
        self.state: dict[str, Any] = {"active": [], "frames": [], "night": False, "error": None, "pushed_at": None,
                                      "widget": None, "sent": {}}

    # ---------------------------------------------------------------- stockage
    async def async_load(self) -> None:
        data = await self._store.async_load() or {}
        self.programmes = [self._normalize(p) for p in data.get("programmes", [])]
        st = copy.deepcopy(DEFAULT_SETTINGS)
        for k, v in (data.get("settings") or {}).items():
            if k == "night" and isinstance(v, dict):
                st["night"].update(v)
            else:
                st[k] = v
        self.settings = st
        self.saved_display = data.get("saved_display")

    @callback
    def _save(self) -> None:
        self._store.async_delay_save(lambda: {"programmes": self.programmes, "settings": self.settings,
                                              "saved_display": self.saved_display}, 1)

    def _normalize(self, p: dict) -> dict:
        out = copy.deepcopy(DEFAULT_PROGRAMME)
        out.update({k: v for k, v in p.items() if k != "notification"})
        out["notification"].update(p.get("notification") or {})
        out["id"] = p.get("id") or uuid.uuid4().hex[:8]
        out["mode"] = out["mode"] if out["mode"] in ("app", "notification") else "app"
        out["days"] = [int(d) for d in out.get("days") or [] if 0 <= int(d) <= 6]
        return out

    # ---------------------------------------------------------------- CRUD
    def get(self, pid: str) -> dict | None:
        return next((p for p in self.programmes if p["id"] == pid), None)

    async def save_programme(self, programme: dict) -> dict:
        prog = self._normalize(programme)
        for i, p in enumerate(self.programmes):
            if p["id"] == prog["id"]:
                self.programmes[i] = prog
                break
        else:
            self.programmes.append(prog)
        self._changed()
        return prog

    async def delete_programme(self, pid: str) -> None:
        self.programmes = [p for p in self.programmes if p["id"] != pid]
        self._last_sent.pop(pid, None)
        self._changed()

    async def reorder(self, ids: list[str]) -> None:
        pos = {pid: i for i, pid in enumerate(ids)}
        self.programmes.sort(key=lambda p: pos.get(p["id"], 999))
        self._changed()

    async def set_enabled(self, pid: str, enabled: bool) -> None:
        p = self.get(pid)
        if p:
            p["enabled"] = bool(enabled)
            self._changed()

    async def update_settings(self, changes: dict) -> None:
        for k, v in changes.items():
            if k == "night" and isinstance(v, dict):
                self.settings["night"].update(v)
            elif k in DEFAULT_SETTINGS:
                self.settings[k] = v
        self._changed()

    async def set_override(self, frames: list[dict] | None, minutes: float = 5) -> None:
        """Écrans affichés à la place des programmes pendant quelques minutes (None = annuler)."""
        self.override = (frames, time.monotonic() + max(0.5, float(minutes)) * 60) if frames else None
        self._last_hash = ""
        await self.tick()
        if self.override:
            self.request_tick(float(minutes) * 60 + 1)

    async def set_engine(self, on: bool) -> None:
        self.settings["engine"] = bool(on)
        self._changed()

    @callback
    def _changed(self) -> None:
        self._save()
        self._track_entities()
        self._last_hash = ""   # recalcul et renvoi immédiat
        self.request_tick(0.5)
        self._notify()

    # ---------------------------------------------------------------- cycle
    @callback
    def start(self) -> None:
        self._running = True
        self._unsubs.append(async_track_time_interval(self.hass, self._interval, TICK))
        self._track_entities()
        self.request_tick(5)

    @callback
    def stop(self) -> None:
        self._running = False
        for u in self._unsubs:
            u()
        self._unsubs.clear()
        if self._state_unsub:
            self._state_unsub()
            self._state_unsub = None
        if self._debounce:
            self._debounce()
            self._debounce = None

    async def _interval(self, _now=None) -> None:
        await self.tick()

    @callback
    def request_tick(self, delay: float = 2) -> None:
        if not self._running:
            return
        if self._debounce:
            self._debounce()

        async def _run(_now):
            self._debounce = None
            await self.tick()

        self._debounce = async_call_later(self.hass, delay, _run)

    @callback
    def _track_entities(self) -> None:
        if self._state_unsub:
            self._state_unsub()
            self._state_unsub = None
        ents: set[str] = set()
        for p in self.programmes:
            if not p.get("enabled"):
                continue
            for c in p.get("conditions") or []:
                if c.get("entity"):
                    ents.add(c["entity"])
            if p["mode"] == "app":
                for f in p.get("frames") or []:
                    if f.get("entity") and f.get("type") != "chart":
                        ents.add(f["entity"])
                    for key in ("text", "current"):
                        ents.update(_template_entities(str(f.get(key) or "")))
        if ents and self._running:
            self._state_unsub = async_track_state_change_event(self.hass, sorted(ents), self._on_state)

    @callback
    def _on_state(self, _event: Event) -> None:
        self.request_tick(3)

    @callback
    def _notify(self) -> None:
        async_dispatcher_send(self.hass, SIGNAL_UPDATED.format(self.entry_id))

    # ---------------------------------------------------------------- calcul des plages
    def _resolve(self, spec: dict, day: date) -> datetime:
        kind = (spec or {}).get("kind", "time")
        offset = timedelta(minutes=int((spec or {}).get("offset") or 0))
        if kind in ("sunrise", "sunset"):
            ev = get_astral_event_date(self.hass, kind, day)
            if ev is not None:
                return dt_util.as_local(ev) + offset
            kind_default = "07:00" if kind == "sunrise" else "19:00"   # nuit polaire : valeur de repli
            h, m = _parse_hm(kind_default)
        else:
            h, m = _parse_hm(spec.get("time", "00:00"))
        start = dt_util.start_of_local_day(day)
        return start + timedelta(hours=h, minutes=m) + offset

    def segments(self, windows: list[dict], day: date) -> list[tuple[datetime, datetime]]:
        start = dt_util.start_of_local_day(day)
        end = dt_util.start_of_local_day(day + timedelta(days=1))
        if not windows:
            return [(start, end)]
        segs = []
        for w in windows:
            a = self._resolve(w.get("from") or {}, day)
            b = self._resolve(w.get("to") or {}, day)
            if b > a:
                segs.append((max(a, start), min(b, end)))
            else:   # passe minuit
                segs.append((start, min(b, end)))
                segs.append((max(a, start), end))
        return [(a, b) for a, b in segs if b > a]

    def in_windows(self, windows: list[dict], now: datetime) -> bool:
        return any(a <= now < b for a, b in self.segments(windows, now.date()))

    def _conditions_ok(self, conds: list[dict]) -> bool:
        for c in conds or []:
            st = self.hass.states.get(c.get("entity") or "")
            if st is None:
                return False
            val = st.attributes.get(c["attribute"]) if c.get("attribute") else st.state
            if not _compare("" if val is None else str(val), c.get("op", "eq"), c.get("value")):
                return False
        return True

    def is_active(self, p: dict, now: datetime) -> bool:
        if not p.get("enabled"):
            return False
        if p.get("days") is not None and now.weekday() not in p["days"]:
            return False
        if not self.in_windows(p.get("windows") or [], now):
            return False
        return self._conditions_ok(p.get("conditions") or [])

    def is_night(self, now: datetime | None = None) -> bool:
        n = self.settings["night"]
        if not n.get("enabled"):
            return False
        return self.in_windows([{"from": n["from"], "to": n["to"]}], now or dt_util.now())

    def timeline(self, day: date | None = None) -> dict:
        """Plages de la journée en minutes depuis minuit (hors conditions), pour la frise de la carte."""
        day = day or dt_util.now().date()
        base = dt_util.start_of_local_day(day)

        def mins(segs):
            return [[int((a - base).total_seconds() // 60), int((b - base).total_seconds() // 60)] for a, b in segs]

        out = {"programmes": {}, "night": []}
        for p in self.programmes:
            ok_day = day.weekday() in (p.get("days") or [])
            out["programmes"][p["id"]] = mins(self.segments(p.get("windows") or [], day)) if ok_day else []
        n = self.settings["night"]
        if n.get("enabled"):
            out["night"] = mins(self.segments([{"from": n["from"], "to": n["to"]}], day))
        sr = get_astral_event_date(self.hass, "sunrise", day)
        ss = get_astral_event_date(self.hass, "sunset", day)
        out["sun"] = [int((dt_util.as_local(x) - base).total_seconds() // 60) if x else None for x in (sr, ss)]
        return out

    # ---------------------------------------------------------------- rendu des écrans
    def _render_tpl(self, text: str) -> str:
        if "{{" not in text and "{%" not in text:
            return text
        try:
            return str(Template(text, self.hass).async_render(parse_result=False))
        except Exception as err:  # noqa: BLE001 — un modèle faux ne doit pas tout bloquer
            return f"⚠ {err}"[:60]

    def _entity_value(self, entity: str, decimals: Any = None, attribute: str | None = None) -> tuple[str, str, float | None]:
        st = self.hass.states.get(entity or "")
        if st is None:
            return "?", "", None
        if attribute:
            raw = st.attributes.get(attribute)
            unit = attr_unit(st, attribute)
        else:
            raw = st.state
            unit = st.attributes.get("unit_of_measurement") or ""
        if raw is None:
            return "?", unit, None
        try:
            num = float(raw)
        except (ValueError, TypeError):
            text = str(raw)
            if not attribute and st.domain == "weather":
                text = WEATHER_FR.get(text, text)
            return text, unit, None
        if decimals not in (None, ""):
            d = int(decimals)
            txt = f"{num:.{d}f}" if d > 0 else str(int(round(num)))
        else:
            txt = str(int(num)) if num == int(num) else f"{num:.1f}"
        return txt, unit, num

    async def render_frames(self, frames: list[dict]) -> list[dict]:
        """Écrans au format LaMetric (sans index)."""
        out: list[dict] = []
        for f in frames or []:
            kind = f.get("type", "text")
            icon = norm_icon(f.get("icon"))
            try:
                if kind == "goal":
                    cur = f.get("current")
                    if f.get("entity"):
                        _t, unit, num = self._entity_value(f["entity"], None, f.get("attribute"))
                        cur = num if num is not None else 0
                        unit = f.get("unit") or unit
                    else:
                        cur = _num(self._render_tpl(str(cur or 0)))
                        unit = f.get("unit") or ""
                    if f.get("hide_if_zero") and not cur:
                        continue
                    fr = {"goalData": {"start": int(_num(f.get("start", 0))), "current": int(round(_num(cur))),
                                       "end": int(_num(f.get("end", 100))), "unit": str(unit)[:4]}}
                elif kind == "chart":
                    data = await self._chart(f.get("entity") or "", int(f.get("hours") or 12), int(f.get("points") or 16),
                                             f.get("attribute") or None)
                    if not data:
                        continue
                    fr = {"chartData": data}
                    icon = None
                else:
                    text = str(f.get("text") or "")
                    if f.get("entity"):
                        val, unit, num = self._entity_value(f["entity"], f.get("decimals"), f.get("attribute"))
                        if f.get("hide_if_zero") and (num == 0 or val in ("unavailable", "unknown")):
                            continue
                        if not text:
                            text = f"{val} {unit}".strip()
                        else:
                            text = text.replace("{value}", val).replace("{unit}", unit)
                    text = self._render_tpl(text).strip()
                    if not text and not icon:
                        continue
                    fr = {"text": text}
            except Exception as err:  # noqa: BLE001
                _LOGGER.debug("Écran ignoré (%s) : %s", f, err)
                continue
            if icon:
                fr["icon"] = icon
            out.append(fr)
        return out

    async def _chart(self, entity: str, hours: int, points: int, attribute: str | None = None) -> list[int]:
        if not entity:
            return []
        hours = max(1, min(hours, 168))
        points = max(4, min(points, 36))
        key = (entity, hours, points, attribute)
        hit = self._chart_cache.get(key)
        if hit and time.monotonic() - hit[0] < CHART_CACHE_S:
            return hit[1]
        try:
            from homeassistant.components.recorder import get_instance, history
        except ImportError:
            return []
        end = dt_util.utcnow()
        start = end - timedelta(hours=hours)
        try:
            if attribute:   # un attribut change sans changer l'état : il faut toutes les mises à jour
                res = await get_instance(self.hass).async_add_executor_job(partial(
                    history.get_significant_states, self.hass, start, end, [entity],
                    include_start_time_state=True, significant_changes_only=False, minimal_response=False,
                    no_attributes=False))
            else:
                res = await get_instance(self.hass).async_add_executor_job(
                    history.state_changes_during_period, self.hass, start, end, entity, True, False, None, True)
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("Historique indisponible pour %s : %s", entity, err)
            return []
        samples: list[tuple[datetime, float]] = []
        for st in res.get(entity, []):
            try:
                if attribute:
                    samples.append((max(st.last_updated, start), float(st.attributes.get(attribute))))
                else:
                    samples.append((max(st.last_changed, start), float(st.state)))
            except (ValueError, TypeError):
                continue
        if not samples:
            return []
        step = (end - start) / points
        data: list[int] = []
        j, cur = 0, None
        for i in range(points):
            b0, b1 = start + step * i, start + step * (i + 1)
            acc, t = 0.0, b0
            while j < len(samples) and samples[j][0] <= b0:
                cur = samples[j][1]
                j += 1
            k = j
            while k < len(samples) and samples[k][0] < b1:
                if cur is not None:
                    acc += cur * (samples[k][0] - t).total_seconds()
                t, cur = samples[k][0], samples[k][1]
                k += 1
            j = k
            if cur is not None:
                acc += cur * (b1 - t).total_seconds()
            data.append(int(round(acc / step.total_seconds())) if cur is not None else 0)
        if min(data) < 0:   # les barres ne savent pas afficher de négatif : on décale
            low = min(data)
            data = [v - low for v in data]
        self._chart_cache[key] = (time.monotonic(), data)
        return data

    # ---------------------------------------------------------------- envoi
    def widget_id(self) -> str | None:
        return self._widget_id()

    async def tick(self) -> None:
        if not self._running:
            return
        now = dt_util.now()
        await self._night_transition(now)
        night = self.is_night(now)
        active = [p for p in self.programmes if self.is_active(p, now)] if self.settings.get("engine", True) else []
        ids = {p["id"] for p in active}
        self.state["active"] = [p["id"] for p in active]
        self.state["night"] = night

        # 1) affichage continu : appli My Data
        frames: list[dict] = []
        for p in active:
            if p["mode"] == "app":
                frames += await self.render_frames(p.get("frames") or [])
        if self.override and self.override[1] > mono_now():
            frames = copy.deepcopy(self.override[0])
        elif self.override:
            self.override = None
        if not frames:
            frames = await self.render_frames([{"type": "text", **f} for f in self.settings.get("idle") or []]) or \
                [{"text": "HOLM"}]
        frames = frames[:20]
        for i, f in enumerate(frames):
            f["index"] = i
        self.state["frames"] = frames
        if self.settings.get("engine", True) or self.override:
            await self._push(frames)

        # 2) notifications programmées
        mono = time.monotonic()
        for p in active:
            if p["mode"] != "notification":
                continue
            cfg = p.get("notification") or {}
            every = float(cfg.get("interval") or 0) * 60
            last = self._last_sent.get(p["id"])
            due = (p["id"] not in self._was_active) if every <= 0 else (last is None or mono - last >= every)
            if not due:
                continue
            self._last_sent[p["id"]] = mono
            rendered = await self.render_frames(p.get("frames") or [])
            if not rendered:
                continue
            body = build_notification(rendered, cfg.get("priority", "info"), cfg.get("icon_type", "none"),
                                      cfg.get("sound") or None, cfg.get("repeat", 1), cfg.get("cycles", 1),
                                      int(cfg.get("lifetime") or 0) * 1000 or None)
            body = self.filter_night(body, now)
            if body is None:
                continue
            try:
                await self.coordinator.client.notify(body)
                self.state["sent"][p["id"]] = dt_util.utcnow().isoformat()
            except LaMetricError as err:
                self.state["error"] = str(err)
        self._was_active = ids
        self._notify()

    async def _push(self, frames: list[dict], force: bool = False) -> None:
        wid = self.widget_id()
        self.state["widget"] = wid
        if not wid:
            self.state["error"] = "Appli My Data DIY introuvable sur le LaMetric (à installer, en mode « HTTP Push » local)"
            return
        digest = hashlib.sha1(json.dumps(frames, sort_keys=True, ensure_ascii=False).encode()).hexdigest()
        mono = time.monotonic()
        if not force and digest == self._last_hash and mono - self._last_push < REPUSH_S:
            return
        if not force and mono - self._last_push < MIN_PUSH_S:
            self.request_tick(MIN_PUSH_S)
            return
        try:
            await self.coordinator.client.push_widget(wid, frames)
            self._last_hash, self._last_push = digest, mono
            self.state["error"] = None
            self.state["pushed_at"] = dt_util.utcnow().isoformat()
        except LaMetricError as err:
            self.state["error"] = str(err)

    # ---------------------------------------------------------------- nuit
    def filter_night(self, body: dict, now: datetime | None = None) -> dict | None:
        """Applique le mode nuit à une notification ; None = à ne pas envoyer."""
        n = self.settings["night"]
        if not self.is_night(now):
            return body
        prio = RANK.get(body.get("priority", "info"), 0)
        if prio < RANK.get(n.get("min_priority", "critical"), 2):
            _LOGGER.debug("Notification retenue (mode nuit) : %s", body)
            return None
        if n.get("mute") and prio < 2:
            body = copy.deepcopy(body)
            body.get("model", {}).pop("sound", None)
        return body

    async def _night_transition(self, now: datetime) -> None:
        night = self.is_night(now)
        if self._night is None:   # premier passage après démarrage
            self._night = night
            if not night and self.saved_display:
                await self._restore_display()
            return
        if night == self._night:
            return
        self._night = night
        level = self.settings["night"].get("brightness")
        if night and level not in (None, ""):
            disp = (self.coordinator.device or {}).get("display") or {}
            self.saved_display = {"brightness": disp.get("brightness"), "brightness_mode": disp.get("brightness_mode")}
            self._save()
            try:
                await self.coordinator.client.set_display(brightness=int(level), brightness_mode="manual")
            except LaMetricError as err:
                _LOGGER.warning("Luminosité de nuit non appliquée : %s", err)
        elif not night and self.saved_display:
            await self._restore_display()

    async def _restore_display(self) -> None:
        saved, self.saved_display = self.saved_display or {}, None
        self._save()
        data = {k: v for k, v in saved.items() if v is not None}
        if data:
            try:
                await self.coordinator.client.set_display(**data)
            except LaMetricError as err:
                _LOGGER.warning("Luminosité de jour non rétablie : %s", err)


# ---------------------------------------------------------------- outils
def norm_icon(value: Any) -> str | None:
    """« 4516 » ou 4516 → « i4516 » (format de l'intégration officielle) ; i…, a… et data: inchangés."""
    text = str(value if value is not None else "").strip()
    if not text:
        return None
    return f"i{text}" if text.isdigit() else text


WEATHER_FR = {
    "clear-night": "Nuit claire", "cloudy": "Nuageux", "exceptional": "Exceptionnel", "fog": "Brouillard",
    "hail": "Grêle", "lightning": "Orage", "lightning-rainy": "Orage", "partlycloudy": "Éclaircies",
    "pouring": "Averses", "rainy": "Pluie", "snowy": "Neige", "snowy-rainy": "Neige/pluie", "sunny": "Soleil",
    "windy": "Vent", "windy-variant": "Vent",
}

_ATTR_UNIT_KEYS = {
    "temperature": "temperature_unit", "apparent_temperature": "temperature_unit", "dew_point": "temperature_unit",
    "current_temperature": "temperature_unit", "pressure": "pressure_unit", "wind_speed": "wind_speed_unit",
    "wind_gust_speed": "wind_speed_unit", "visibility": "visibility_unit", "precipitation": "precipitation_unit",
}


def attr_unit(st, attribute: str) -> str:
    """Unité d'un attribut : météo (temperature_unit…), %, ou rien."""
    key = _ATTR_UNIT_KEYS.get(attribute)
    if key and st.attributes.get(key):
        return str(st.attributes[key])
    if attribute in ("temperature", "current_temperature", "target_temperature", "apparent_temperature", "dew_point"):
        return "°C"
    if attribute in ("humidity", "current_humidity", "cloud_coverage", "uv_index_percent", "battery_level", "brightness_pct"):
        return "%" if attribute != "uv_index_percent" else ""
    return ""


def mono_now() -> float:
    return time.monotonic()


def _num(value: Any) -> float:
    try:
        return float(str(value).replace(",", ".").strip())
    except (ValueError, TypeError):
        return 0.0


def _compare(state: str, op: str, value: Any) -> bool:
    if op in ("gt", "lt", "ge", "le"):
        try:
            a, b = float(state), float(str(value).replace(",", "."))
        except (ValueError, TypeError):
            return False
        return {"gt": a > b, "lt": a < b, "ge": a >= b, "le": a <= b}[op]
    if op == "ne":
        return str(state) != str(value)
    return str(state) == str(value)


def _template_entities(text: str) -> set[str]:
    """Entités citées dans un modèle (states('x.y'), states.x.y, is_state('x.y'…)) — suivi des changements."""
    import re
    found = set(re.findall(r"""['"]([a-z_]+\.[a-z0-9_]+)['"]""", text))
    found |= {m.replace("states.", "", 1) for m in re.findall(r"states\.[a-z_]+\.[a-z0-9_]+", text)}
    return found
