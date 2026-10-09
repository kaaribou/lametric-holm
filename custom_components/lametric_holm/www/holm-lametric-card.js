/* HOLM LaMetric Card — écran, programmes, notifications et réglages du LaMetric Time.
 * Fait partie de HOLM — Home Orchestration & Living Management. https://github.com/kaaribou/lametric-holm — licence MIT
 *   type: custom:holm-lametric-card
 *   title: LaMetric      tab: screen | programmes | notify | settings      view: full | screen      show_frame: true
 */
(() => {
const VERSION = "1.1.0";
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clone = (o) => JSON.parse(JSON.stringify(o));
const fold = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "");
const DAYS = ["L", "M", "M", "J", "V", "S", "D"];
const DAYS_LONG = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
const KIND = { time: "Heure", sunrise: "Lever du soleil", sunset: "Coucher du soleil" };
const PRIO = { info: "Info", warning: "Important", critical: "Critique" };
const OPS = { eq: "=", ne: "≠", gt: ">", lt: "<", ge: "≥", le: "≤" };
const TABS = [["screen", "mdi:television", "Écran"], ["programmes", "mdi:calendar-clock", "Programmes"], ["notify", "mdi:message-text", "Notifier"], ["settings", "mdi:cog", "Réglages"]];

// ------------------------------------------------------------------ police pixel (5 lignes)
const G = {
  A: ".#./#.#/###/#.#/#.#", B: "##./#.#/##./#.#/##.", C: ".##/#../#../#../.##", D: "##./#.#/#.#/#.#/##.", E: "###/#../##./#../###",
  F: "###/#../##./#../#..", G: ".##/#../#.#/#.#/.##", H: "#.#/#.#/###/#.#/#.#", I: "###/.#./.#./.#./###", J: "..#/..#/..#/#.#/.#.",
  K: "#.#/#.#/##./#.#/#.#", L: "#../#../#../#../###", M: "#...#/##.##/#.#.#/#...#/#...#", N: "#..#/##.#/#.##/#..#/#..#",
  O: ".#./#.#/#.#/#.#/.#.", P: "##./#.#/##./#../#..", Q: ".#./#.#/#.#/##./.##", R: "##./#.#/##./#.#/#.#", S: ".##/#../.#./..#/##.",
  T: "###/.#./.#./.#./.#.", U: "#.#/#.#/#.#/#.#/###", V: "#.#/#.#/#.#/#.#/.#.", W: "#...#/#...#/#.#.#/##.##/#...#", X: "#.#/#.#/.#./#.#/#.#",
  Y: "#.#/#.#/.#./.#./.#.", Z: "###/..#/.#./#../###",
  a: ".../.##/#.#/#.#/.##", b: "#../##./#.#/#.#/##.", c: ".../.##/#../#../.##", d: "..#/.##/#.#/#.#/.##", e: ".../.#./###/#../.##",
  f: ".##/#../##./#../#..", g: ".../.##/#.#/.##/##.", h: "#../##./#.#/#.#/#.#", i: "#/./#/#/#", j: ".#/../.#/.#/#.",
  k: "#../#.#/##./##./#.#", l: "#/#/#/#/#", m: "...../####./#.#.#/#.#.#/#.#.#", n: ".../##./#.#/#.#/#.#", o: ".../.#./#.#/#.#/.#.",
  p: ".../##./#.#/##./#..", q: ".../.##/#.#/.##/..#", r: ".../#.#/##./#../#..", s: ".../.##/#../..#/##.", t: ".#./###/.#./.#./..#",
  u: ".../#.#/#.#/#.#/.##", v: ".../#.#/#.#/#.#/.#.", w: "...../#...#/#.#.#/#.#.#/.#.#.", x: ".../#.#/.#./#.#/#.#", y: ".../#.#/#.#/.##/##.",
  z: ".../###/.#./#../###",
  0: "###/#.#/#.#/#.#/###", 1: ".#./##./.#./.#./###", 2: "##./..#/.#./#../###", 3: "##./..#/.#./..#/##.", 4: "#.#/#.#/###/..#/..#",
  5: "###/#../##./..#/##.", 6: ".##/#../###/#.#/###", 7: "###/..#/.#./.#./.#.", 8: "###/#.#/###/#.#/###", 9: "###/#.#/###/..#/##.",
  " ": "../../../../..", ".": "././././#", ",": "./././#/#", ":": "./#/./#/.", ";": "./#/./#/#",
  "-": ".../.../###/.../...", "+": ".../.#./###/.#./...", "/": "..#/..#/.#./#../#..", "%": "#.#/..#/.#./#../#.#", "°": "##/##/../../..",
  "!": "#/#/#/./#", "?": "##./..#/.#./.../.#.", "(": ".#/#./#./#./.#", ")": "#./.#/.#/.#/#.", "'": "#/#/./././", '"': "#.#/#.#/.../.../...",
  "€": ".##/#../###/#../.##", "=": ".../###/.../###/...", "<": "..#/.#./#../.#./..#", ">": "#../.#./..#/.#./#..", "_": ".../.../.../.../###",
  "*": "#.#/.#./#.#/.../...", "#": "#.#/###/#.#/###/#.#", "&": ".#./#.#/.#./#.#/.##", "@": ".#./#.#/#.#/#../.##", "$": ".##/##./.#./.##/##.",
};
const GLYPH = {};
for (const [k, v] of Object.entries(G)) GLYPH[k] = v.split("/").map((r) => [...r].map((c) => c === "#"));
const glyph = (ch) => GLYPH[ch] || GLYPH[fold(ch)] || GLYPH[fold(ch).toUpperCase()] || GLYPH["?"];
const textWidth = (t) => [...String(t)].reduce((w, ch) => w + glyph(ch)[0].length + 1, 0) - 1;

// ------------------------------------------------------------------ icônes LaMetric
const ICONS = new Map();
const iconUrl = (code) => {
  if (!code) return null;
  if (String(code).startsWith("data:")) return code;
  const id = String(code).replace(/^[ia]/, "");
  return /^\d+$/.test(id) ? `https://developer.lametric.com/content/apps/icon_thumbs/${id}_icon_thumb_sm.png` : null;
};
const iconImg = (code) => {
  const url = iconUrl(code);
  if (!url) return null;
  if (!ICONS.has(url)) { const im = new Image(); im.referrerPolicy = "no-referrer"; im.src = url; ICONS.set(url, im); }
  const im = ICONS.get(url);
  return im.complete && im.naturalWidth ? im : null;
};

// ------------------------------------------------------------------ écran LED 37×8
const LEDS = new Set();
let ledTimer = null;
class Led {
  constructor(canvas) {
    this.c = canvas; this.frames = []; this.t0 = performance.now();
    this.buf = document.createElement("canvas"); this.buf.width = 37; this.buf.height = 8; this.buf.getContext("2d", { willReadFrequently: true });
    LEDS.add(this);
    if (!ledTimer) ledTimer = setInterval(() => { for (const l of LEDS) { if (!l.c.isConnected) LEDS.delete(l); else l.draw(); } if (!LEDS.size) { clearInterval(ledTimer); ledTimer = null; } }, 60);
  }
  set(frames) {
    const key = JSON.stringify(frames || []);
    if (key === this.key) return;
    this.key = key; this.frames = frames || []; this.t0 = performance.now(); this.draw();
  }
  dur(f) {
    if (f.chartData || f.goalData) return 3500;
    const area = f.icon ? 28 : 37, w = textWidth(f.text || "");
    return w <= area ? 3500 : 900 + ((w + area) / 22) * 1000;
  }
  draw() {
    const b = this.buf.getContext("2d");
    b.clearRect(0, 0, 37, 8);
    const fr = this.frames;
    if (fr.length) {
      const total = fr.reduce((s, f) => s + this.dur(f), 0);
      let t = (performance.now() - this.t0) % total, i = 0;
      while (t > this.dur(fr[i])) { t -= this.dur(fr[i]); i += 1; }
      this.paint(b, fr[i], t);
    }
    const c = this.c, ctx = c.getContext("2d"), W = c.width, H = c.height, px = W / 37;
    ctx.fillStyle = "#0b0b0b"; ctx.fillRect(0, 0, W, H);
    const data = (() => { try { return b.getImageData(0, 0, 37, 8).data; } catch (e) { return null; } })();
    if (data) {
      for (let y = 0; y < 8; y++) for (let x = 0; x < 37; x++) {
        const k = (y * 37 + x) * 4, a = data[k + 3];
        ctx.fillStyle = a > 40 ? `rgb(${data[k]},${data[k + 1]},${data[k + 2]})` : "#1c1c1c";
        ctx.fillRect(x * px + px * 0.1, y * px + px * 0.1, px * 0.8, px * 0.8);
      }
    } else {   // icône d'un autre site : on ne peut pas relire les pixels, on dessine directement
      ctx.fillStyle = "#1c1c1c"; ctx.fillRect(0, 0, W, H); ctx.imageSmoothingEnabled = false; ctx.drawImage(this.buf, 0, 0, W, H);
      ctx.strokeStyle = "#0b0b0b"; ctx.lineWidth = px * 0.2;
      for (let x = 0; x <= 37; x++) { ctx.beginPath(); ctx.moveTo(x * px, 0); ctx.lineTo(x * px, H); ctx.stroke(); }
      for (let y = 0; y <= 8; y++) { ctx.beginPath(); ctx.moveTo(0, y * px); ctx.lineTo(W, y * px); ctx.stroke(); }
    }
  }
  paint(b, f, t) {
    if (f.chartData) {
      const d = f.chartData, n = d.length, max = Math.max(1, ...d), min = Math.min(0, ...d);
      const bw = Math.max(1, Math.floor(37 / n) - 1), off = Math.floor((37 - n * (bw + 1) + 1) / 2);
      b.fillStyle = "#ffffff";
      d.forEach((v, i) => { const h = Math.max(v > min ? 1 : 0, Math.round(((v - min) / (max - min || 1)) * 8)); b.fillRect(off + i * (bw + 1), 8 - h, bw, h); });
      return;
    }
    let x0 = 0, area = 37;
    const im = iconImg(f.icon);
    if (f.icon) { x0 = 9; area = 28; if (im) { b.imageSmoothingEnabled = false; b.drawImage(im, 0, 0, 8, 8); } else { b.fillStyle = "#3a3a3a"; b.fillRect(1, 1, 6, 6); } }
    let text = f.text || "";
    if (f.goalData) {
      const g = f.goalData; text = `${g.current}${g.unit || ""}`;
      const span = (g.end - g.start) || 1, frac = Math.max(0, Math.min(1, (g.current - g.start) / span));
      b.fillStyle = "#3b3b3b"; b.fillRect(x0, 7, area, 1);
      b.fillStyle = "#53d769"; b.fillRect(x0, 7, Math.round(area * frac), 1);
    }
    const w = textWidth(text);
    let x = w <= area ? x0 + Math.floor((area - w) / 2) : x0 + area - Math.max(0, (t - 600) / 1000 * 22);
    b.save(); b.beginPath(); b.rect(x0, 0, area, 8); b.clip();
    b.fillStyle = "#ffffff";
    for (const ch of [...String(text)]) {
      const g = glyph(ch);
      g.forEach((row, ry) => row.forEach((on, rx) => { if (on) b.fillRect(Math.round(x) + rx, 1 + ry, 1, 1); }));
      x += g[0].length + 1;
    }
    b.restore();
  }
}

// ------------------------------------------------------------------ modèles de programmes
const blankFrame = (type = "text") => type === "goal" ? { type, icon: "", entity: "", start: 0, end: 100, unit: "" }
  : type === "chart" ? { type, entity: "", hours: 12, points: 16 } : { type: "text", icon: "", text: "", entity: "" };
const newProgramme = (over = {}) => ({
  name: "Nouveau programme", enabled: true, mode: "app", frames: [blankFrame()], days: [0, 1, 2, 3, 4, 5, 6], windows: [], conditions: [],
  notification: { interval: 30, priority: "info", icon_type: "none", sound: "", repeat: 1, cycles: 1, lifetime: 0 }, ...over,
});
const WINDOW_PRESETS = [
  ["Toute la journée", []],
  ["Le jour", [{ from: { kind: "sunrise", offset: 30 }, to: { kind: "sunset", offset: -30 } }]],
  ["La nuit", [{ from: { kind: "sunset", offset: 0 }, to: { kind: "sunrise", offset: 0 } }]],
  ["Matin", [{ from: { kind: "time", time: "06:30", offset: 0 }, to: { kind: "time", time: "09:00", offset: 0 } }]],
  ["Soirée", [{ from: { kind: "time", time: "18:00", offset: 0 }, to: { kind: "time", time: "22:30", offset: 0 } }]],
];
const fmtSpec = (s) => (!s ? "?" : s.kind === "time" ? (s.time || "00:00") : `${s.kind === "sunrise" ? "lever" : "coucher"}${s.offset ? (s.offset > 0 ? " +" : " ") + s.offset + " min" : ""}`);
const fmtDays = (d) => {
  const s = [...(d || [])].sort();
  if (s.length === 7) return "tous les jours";
  if (s.join() === "0,1,2,3,4") return "en semaine";
  if (s.join() === "5,6") return "le week-end";
  if (!s.length) return "aucun jour";
  return s.map((i) => DAYS_LONG[i].slice(0, 3)).join(", ");
};
const fmtWindows = (w) => (!w || !w.length ? "toute la journée" : w.map((x) => `${fmtSpec(x.from)} → ${fmtSpec(x.to)}`).join(", "));
const DOMAIN_ICON = { sensor: "mdi:eye", binary_sensor: "mdi:checkbox-blank-circle-outline", weather: "mdi:weather-partly-cloudy", climate: "mdi:thermostat",
  light: "mdi:lightbulb", switch: "mdi:toggle-switch", cover: "mdi:window-shutter", person: "mdi:account", sun: "mdi:white-balance-sunny", input_number: "mdi:ray-vertex",
  input_boolean: "mdi:toggle-switch-outline", input_select: "mdi:format-list-bulleted", input_text: "mdi:form-textbox", number: "mdi:ray-vertex", counter: "mdi:counter",
  select: "mdi:format-list-bulleted", media_player: "mdi:speaker", device_tracker: "mdi:map-marker", zone: "mdi:map-marker-radius", fan: "mdi:fan", lock: "mdi:lock", vacuum: "mdi:robot-vacuum" };
const ENT_FILTERS = [["all", "Tout"], ["sensor", "Capteurs"], ["weather", "Météo"], ["binary_sensor", "Binaires"], ["climate", "Climat"], ["other", "Autres"]];
const ATTR_FR = { temperature: "Température", apparent_temperature: "Ressentie", humidity: "Humidité", pressure: "Pression", wind_speed: "Vent", wind_gust_speed: "Rafales",
  wind_bearing: "Direction du vent", cloud_coverage: "Nuages", uv_index: "Indice UV", visibility: "Visibilité", dew_point: "Point de rosée", precipitation: "Pluie",
  current_temperature: "Température actuelle", current_humidity: "Humidité actuelle", hvac_action: "Action", brightness: "Luminosité", battery_level: "Batterie",
  elevation: "Élévation", azimuth: "Azimut", next_rising: "Prochain lever", next_setting: "Prochain coucher", media_title: "Titre", media_artist: "Artiste", volume_level: "Volume" };
const ATTR_SKIP = new Set(["friendly_name", "icon", "entity_picture", "unit_of_measurement", "device_class", "state_class", "supported_features", "attribution", "editable", "id",
  "temperature_unit", "pressure_unit", "wind_speed_unit", "visibility_unit", "precipitation_unit", "restored", "assumed_state", "options", "min", "max", "step", "mode", "icon_color"]);
const getPath = (o, p) => p.split(".").reduce((a, k) => (a == null ? a : a[k]), o);
const setPath = (o, p, v) => { const ks = p.split("."); let a = o; ks.slice(0, -1).forEach((k, i) => { if (a[k] == null) a[k] = /^\d+$/.test(ks[i + 1]) ? [] : {}; a = a[k]; }); a[ks[ks.length - 1]] = v; };

class HolmLaMetricCard extends HTMLElement {
  setConfig(c) {
    this._c = { title: "LaMetric", tab: "screen", view: "full", show_frame: true, ...c };
    this._tab = this._tab || this._c.tab;
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
      this.shadowRoot.innerHTML = `<style>${CSS}</style><ha-card><div id="main"></div></ha-card><div id="modal"></div>`;
      this.shadowRoot.addEventListener("click", (e) => this._click(e));
      this.shadowRoot.addEventListener("input", (e) => this._input(e));
      this.shadowRoot.addEventListener("change", (e) => this._input(e, true));
      this.shadowRoot.addEventListener("focusout", () => setTimeout(() => { if (this._dirty && !this._typing()) this._render(); }, 50));
    }
    this.shadowRoot.querySelector("ha-card").classList.toggle("noframe", this._c.show_frame === false);
    this._nt = this._nt || { frames: [blankFrame()], priority: "info", icon_type: "none", sound: "", cycles: 1, minutes: 5 };
    this._render();
  }
  set hass(h) {
    const first = !this._hass;
    this._hass = h;
    if (first && this.isConnected) this._subscribe();
  }
  connectedCallback() { if (this._hass && !this._sub) this._subscribe(); }
  disconnectedCallback() { if (this._sub) { this._sub.then((u) => u && u()).catch(() => {}); this._sub = null; } }
  getCardSize() { return this._c && this._c.view === "screen" ? 3 : 8; }
  _subscribe() {
    const msg = { type: "lametric_holm/subscribe" };
    if (this._c.entry_id) msg.entry_id = this._c.entry_id;
    this._sub = this._hass.connection.subscribeMessage((m) => { this._s = m; if (!this._st) this._st = clone(m.settings); this._render(); }, msg)
      .catch((e) => { this._err = e.message || String(e); this._render(); return null; });
  }
  _ws(type, data = {}) {
    const m = { type: `lametric_holm/${type}`, ...data };
    if (this._s && this._s.entry_id) m.entry_id = this._s.entry_id;
    return this._hass.callWS(m);
  }
  _toast(text, bad) {
    const ev = new Event("hass-notification", { bubbles: true, composed: true });
    ev.detail = { message: text };
    this.dispatchEvent(ev);
    if (bad) console.warn("HOLM LaMetric:", text);
  }
  _typing() {
    const a = this.shadowRoot.activeElement;
    return a && a.closest("#main") && /INPUT|SELECT|TEXTAREA/.test(a.tagName) && a.type !== "range" && a.type !== "checkbox";
  }

  // ---------------------------------------------------------------- rendu principal
  _render() {
    const root = this.shadowRoot && this.shadowRoot.getElementById("main");
    if (!root) return;
    if (this._typing() || this._sliding) { this._dirty = true; return; }
    this._dirty = false;
    const s = this._s;
    if (!s) { root.innerHTML = `<div class="empty">${this._err ? `HOLM LaMetric : ${esc(this._err)}<br>L'intégration est-elle installée ?` : "Connexion au LaMetric…"}</div>`; return; }
    const compact = this._c.view === "screen";
    const nOn = (s.state.active || []).length;
    root.innerHTML = `
      ${compact ? "" : `<div class="hd"><div class="tt"><ha-icon icon="mdi:dots-grid"></ha-icon>${esc(this._c.title)}<i class="dot ${s.available ? "ok" : "ko"}" title="${s.available ? "Connecté" : "Injoignable"}"></i></div>
      <div class="tabs">${TABS.map(([k, ic, l]) => `<button class="tab ${this._tab === k ? "otn" : ""}" data-a="tab" data-v="${k}"><ha-icon icon="${ic}"></ha-icon><span>${l}</span>${k === "programmes" && nOn ? `<em>${nOn}</em>` : ""}</button>`).join("")}</div></div>`}
      ${compact || this._tab === "screen" ? this._screen(compact) : this._tab === "programmes" ? this._programmes() : this._tab === "notify" ? this._notify() : this._settings()}`;
    this._mount();
  }
  _mount() {
    const s = this._s;
    this.shadowRoot.querySelectorAll("canvas[data-led]").forEach((c) => {
      if (!c._led) c._led = new Led(c);
      const k = c.dataset.led;
      c._led.set(k === "screen" ? s.state.frames : k === "nt" ? this._ntPrev || [] : k === "ed" ? this._edPrev || [] : []);
    });
  }
  _led(key, cls = "") { return `<div class="ledbox ${cls}"><canvas data-led="${key}" width="740" height="160"></canvas></div>`; }

  _screen(compact) {
    const s = this._s, d = s.device, st = s.state;
    const act = s.programmes.filter((p) => (st.active || []).includes(p.id));
    const cur = s.widgets.find((w) => w.visible);
    const range = (r) => `min="${(r || {}).min ?? 0}" max="${(r || {}).max ?? 100}"`;
    return `
      ${this._led("screen", "big")}
      <div class="chips">
        ${st.night ? `<span class="chip night"><ha-icon icon="mdi:weather-night"></ha-icon>Mode nuit</span>` : ""}
        ${!s.settings.engine ? `<span class="chip off"><ha-icon icon="mdi:pause-circle"></ha-icon>Programmes en pause</span>` : act.length ? act.map((p) => `<span class="chip on"><ha-icon icon="${p.mode === "app" ? "mdi:view-carousel" : "mdi:message-badge"}"></ha-icon>${esc(p.name)}</span>`).join("") : `<span class="chip">Aucun programme actif : écran d'attente</span>`}
        ${cur ? `<span class="chip cur"><ha-icon icon="mdi:eye"></ha-icon>${esc(cur.title)}</span>` : ""}
      </div>
      ${st.error ? `<div class="warn"><ha-icon icon="mdi:alert"></ha-icon>${esc(st.error)}</div>` : ""}
      <div class="ctl">
        <label class="row"><ha-icon icon="mdi:brightness-6"></ha-icon><input type="range" ${range(d.brightness_range)} value="${d.brightness ?? 0}" data-dev="brightness"><b>${d.brightness ?? "–"}%</b>
          <button class="mini ${d.brightness_mode === "auto" ? "otn" : ""}" data-a="dev" data-k="brightness_mode" data-v="${d.brightness_mode === "auto" ? "manual" : "auto"}">Auto</button></label>
        <label class="row"><ha-icon icon="mdi:volume-high"></ha-icon><input type="range" ${range(d.volume_range)} value="${d.volume ?? 0}" data-dev="volume"><b>${d.volume ?? "–"}%</b>
          <button class="mini ${d.bluetooth ? "otn" : ""}" data-a="dev" data-k="bluetooth" data-v="${d.bluetooth ? "0" : "1"}" title="Bluetooth"><ha-icon icon="mdi:bluetooth"></ha-icon></button></label>
      </div>
      <div class="bar">
        <button class="ib" data-a="dev" data-k="prev" title="Appli précédente"><ha-icon icon="mdi:skip-previous"></ha-icon></button>
        <div class="apps">${s.widgets.map((w) => `<button class="app ${w.visible ? "otn" : ""}" data-a="activate" data-p="${esc(w.package)}" data-w="${esc(w.widget)}">${esc(w.title)}</button>`).join("")}</div>
        <button class="ib" data-a="dev" data-k="next" title="Appli suivante"><ha-icon icon="mdi:skip-next"></ha-icon></button>
      </div>
      ${compact ? "" : `
      <div class="sec"><b>File de notifications</b>${s.queue.length ? `<button class="lnk" data-a="dev" data-k="dismiss_all">Tout effacer</button>` : ""}</div>
      ${s.queue.length ? `<div class="queue">${s.queue.map((n) => {
        const fr = ((n.model || {}).frames || [])[0] || {};
        return `<div class="qi"><span class="pr ${n.priority}">${PRIO[n.priority] || n.priority}</span><span class="qt">${esc(fr.text || (fr.goalData ? "Jauge" : fr.chartData ? "Graphique" : ""))}</span><button class="ib sm" data-a="dev" data-k="dismiss" data-v="${esc(n.id)}"><ha-icon icon="mdi:close"></ha-icon></button></div>`;
      }).join("")}</div>` : `<div class="muted pad">Aucune notification en attente.</div>`}
      <div class="foot muted">${esc(d.name || "LaMetric")} · ${esc(d.model || "")} · logiciel ${esc(d.os_version || "?")} · Wi-Fi ${d.wifi ?? "?"}% · <span>${st.widget ? `My Data ${esc(String(st.widget).slice(0, 8))}…` : "My Data absente"}</span></div>`}`;
  }

  _programmes() {
    const s = this._s, tl = s.timeline || { programmes: {}, night: [] };
    const now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes();
    const pct = (m) => `${(Math.max(0, Math.min(1440, m)) / 14.4).toFixed(3)}%`;
    const rows = s.programmes.map((p) => `<div class="tlr ${p.enabled ? "" : "dis"}"><span class="tln">${esc(p.name)}</span><div class="tlb">${(tl.programmes[p.id] || []).map(([a, b]) => `<i class="seg m-${p.mode}" style="left:${pct(a)};width:${pct(b - a)}"></i>`).join("")}</div></div>`).join("");
    const sun = (tl.sun || []).map((m, i) => (m == null ? "" : `<i class="sun" style="left:${pct(m)}" title="${i ? "Coucher" : "Lever"} du soleil"><ha-icon icon="${i ? "mdi:weather-sunset-down" : "mdi:weather-sunset-up"}"></ha-icon></i>`)).join("");
    return `
      <div class="timeline">
        <div class="tlh">${[0, 3, 6, 9, 12, 15, 18, 21, 24].map((h) => `<span style="left:${pct(h * 60)}">${h}h</span>`).join("")}${sun}</div>
        <div class="tlbody"><div class="ovl">${(tl.night || []).map(([a, b]) => `<i class="nightb" style="left:${pct(a)};width:${pct(b - a)}"></i>`).join("")}<i class="now" style="left:${pct(nowMin)}"></i></div>${rows || `<div class="muted pad">Aucun programme pour l'instant.</div>`}</div>
        <div class="legend"><span><i class="seg m-app"></i>Affichage continu</span><span><i class="seg m-notification"></i>Notifications</span>${(tl.night || []).length ? `<span><i class="nightb"></i>Nuit</span>` : ""}</div>
      </div>
      <div class="plist">${s.programmes.map((p, i) => {
        const on = (s.state.active || []).includes(p.id);
        return `<div class="prog ${p.enabled ? "" : "dis"} ${on ? "act" : ""}">
          <button class="sw ${p.enabled ? "otn" : ""}" data-a="ptoggle" data-id="${p.id}" title="${p.enabled ? "Désactiver" : "Activer"}"><i></i></button>
          <div class="pi" data-a="edit" data-id="${p.id}"><b>${esc(p.name)}${on ? ` <span class="live">en cours</span>` : ""}</b>
            <span>${p.mode === "app" ? `<ha-icon icon="mdi:view-carousel"></ha-icon>Affichage continu` : `<ha-icon icon="mdi:message-badge"></ha-icon>Notification ${+p.notification.interval ? `toutes les ${p.notification.interval} min` : "à chaque début de plage"}`} · ${p.frames.length} écran${p.frames.length > 1 ? "s" : ""}</span>
            <span><ha-icon icon="mdi:clock-outline"></ha-icon>${fmtDays(p.days)}, ${esc(fmtWindows(p.windows))}${p.conditions.length ? ` · ${p.conditions.length} condition${p.conditions.length > 1 ? "s" : ""}` : ""}</span></div>
          <div class="pa"><button class="ib sm" data-a="move" data-id="${p.id}" data-v="-1" ${i ? "" : "disabled"}><ha-icon icon="mdi:chevron-up"></ha-icon></button>
          <button class="ib sm" data-a="move" data-id="${p.id}" data-v="1" ${i < s.programmes.length - 1 ? "" : "disabled"}><ha-icon icon="mdi:chevron-down"></ha-icon></button>
          <button class="ib sm" data-a="edit" data-id="${p.id}"><ha-icon icon="mdi:pencil"></ha-icon></button></div></div>`;
      }).join("")}</div>
      <div class="bar"><button class="pill main" data-a="new"><ha-icon icon="mdi:plus"></ha-icon>Nouveau programme</button>
        <button class="pill" data-a="new" data-v="solar"><ha-icon icon="mdi:solar-power"></ha-icon>Production solaire</button>
        <button class="pill" data-a="new" data-v="temp"><ha-icon icon="mdi:thermometer"></ha-icon>Températures</button></div>
      <div class="hint">Les programmes « affichage continu » alimentent l'appli My Data du LaMetric ; leurs écrans se suivent dans l'ordre de la liste.</div>`;
  }

  _notify() {
    const n = this._nt, snd = this._s.sounds;
    return `
      ${this._led("nt")}
      ${this._framesEditor(n.frames, "nt", "frames")}
      <div class="grid3">
        <label>Priorité<select data-s="nt" data-p="priority">${Object.entries(PRIO).map(([k, v]) => `<option value="${k}" ${n.priority === k ? "selected" : ""}>${v}</option>`).join("")}</select></label>
        <label>Son${this._soundSelect("nt", "sound", n.sound, snd)}</label>
        <label>Répétitions<input type="number" min="0" max="50" data-s="nt" data-p="cycles" data-t="num" value="${n.cycles}"></label>
      </div>
      <div class="bar"><button class="pill main" data-a="send"><ha-icon icon="mdi:send"></ha-icon>Envoyer</button>
        <span class="sp"></span><label class="inl">Afficher dans My Data pendant <input type="number" class="num" min="0.5" step="0.5" data-s="nt" data-p="minutes" data-t="num" value="${n.minutes}"> min</label>
        <button class="pill" data-a="pushnt"><ha-icon icon="mdi:monitor-arrow-down"></ha-icon>Afficher</button></div>
      <div class="hint">Les textes acceptent les modèles Home Assistant, par exemple {{ states('sensor.temperature_salon') }} °C. Une notification s'affiche par-dessus les applis puis disparaît.</div>`;
  }

  _settings() {
    const st = this._st || this._s.settings, n = st.night, s = this._s;
    return `
      <div class="sec"><b>Programmes</b></div>
      <label class="tg"><button class="sw ${st.engine ? "otn" : ""}" data-a="stoggle" data-p="engine"><i></i></button>Programmes actifs (décochez pour tout mettre en pause)</label>
      <div class="sec"><b>Écran d'attente</b><span class="muted">affiché dans My Data quand aucun programme n'est actif</span></div>
      ${this._framesEditor(st.idle, "st", "idle", true)}
      <div class="sec"><b>Mode nuit</b></div>
      <label class="tg"><button class="sw ${n.enabled ? "otn" : ""}" data-a="stoggle" data-p="night.enabled"><i></i></button>Activer le mode nuit</label>
      <div class="win">${this._spec("st", "night.from", n.from)}<ha-icon icon="mdi:arrow-right"></ha-icon>${this._spec("st", "night.to", n.to)}</div>
      <div class="grid3">
        <label>Notifications admises<select data-s="st" data-p="night.min_priority"><option value="warning" ${n.min_priority === "warning" ? "selected" : ""}>Importantes et critiques</option><option value="critical" ${n.min_priority !== "warning" ? "selected" : ""}>Critiques seulement</option></select></label>
        <label>Luminosité la nuit<input type="number" min="0" max="100" placeholder="inchangée" data-s="st" data-p="night.brightness" data-t="numnull" value="${n.brightness ?? ""}"></label>
        <label>Son par défaut${this._soundSelect("st", "default_sound", st.default_sound, s.sounds)}</label>
      </div>
      <label class="tg"><button class="sw ${n.mute ? "otn" : ""}" data-a="stoggle" data-p="night.mute"><i></i></button>Silence la nuit (sauf critiques)</label>
      <label class="tg"><button class="sw ${n.apply_to_notify ? "otn" : ""}" data-a="stoggle" data-p="night.apply_to_notify"><i></i></button>Appliquer aussi aux notifications des automatisations</label>
      <div class="bar"><button class="pill main" data-a="ssave"><ha-icon icon="mdi:content-save"></ha-icon>Enregistrer</button>
        <button class="pill" data-a="push"><ha-icon icon="mdi:refresh"></ha-icon>Renvoyer l'écran</button>
        <button class="pill" data-a="sreset">Annuler</button></div>
      <div class="sec"><b>Appareil</b></div>
      <div class="kv"><span>Nom</span><b>${esc(s.device.name || "")}</b><span>Adresse</span><b>${esc(s.device.host)}</b><span>Mode des applis</span>
        <b><select data-dev="mode">${["auto", "manual", "schedule", "kiosk"].map((m) => `<option value="${m}" ${s.device.mode === m ? "selected" : ""}>${{ auto: "Défilement auto", manual: "Manuel", schedule: "Planning LaMetric", kiosk: "Kiosque" }[m]}</option>`).join("")}</select></b>
        <span>Économiseur</span><b><button class="sw ${(s.device.screensaver || {}).enabled ? "otn" : ""}" data-a="dev" data-k="screensaver" data-v="${(s.device.screensaver || {}).enabled ? "0" : "1"}"><i></i></button></b>
        <span>Appli My Data</span><b>${s.state.widget ? esc(s.state.widget) : "introuvable — installez « My Data DIY » en HTTP Push"}</b><span>Version</span><b>HOLM LaMetric ${esc(s.version)}</b></div>`;
  }

  // ---------------------------------------------------------------- éléments d'édition réutilisables
  _soundSelect(scope, path, val, snd) {
    const opt = (v) => `<option value="${v}" ${val === v ? "selected" : ""}>${v}</option>`;
    return `<select data-s="${scope}" data-p="${path}"><option value="">Aucun</option><optgroup label="Notifications">${snd.notifications.map(opt).join("")}</optgroup><optgroup label="Alarmes">${snd.alarms.map(opt).join("")}</optgroup></select>`;
  }
  _spec(scope, path, sp) {
    sp = sp || { kind: "time", time: "00:00", offset: 0 };
    return `<span class="spec"><select data-s="${scope}" data-p="${path}.kind" data-r="1">${Object.entries(KIND).map(([k, v]) => `<option value="${k}" ${sp.kind === k ? "selected" : ""}>${v}</option>`).join("")}</select>
      ${sp.kind === "time" ? `<input type="time" data-s="${scope}" data-p="${path}.time" value="${esc(sp.time || "00:00")}">` : `<input type="number" class="num" step="5" data-s="${scope}" data-p="${path}.offset" data-t="num" value="${sp.offset || 0}" title="Décalage en minutes"><small>min</small>`}</span>`;
  }
  _entInfo(e) {
    const h = this._hass, st = h.states[e];
    if (!st) return null;
    const reg = (h.entities || {})[e] || {};
    const area = reg.area_id || ((h.devices || {})[reg.device_id] || {}).area_id;
    const unit = st.attributes.unit_of_measurement || "";
    return { id: e, name: st.attributes.friendly_name || e, area: area && h.areas && h.areas[area] ? h.areas[area].name : "",
      icon: st.attributes.icon || DOMAIN_ICON[e.split(".")[0]] || "mdi:shape", state: `${st.state}${unit ? " " + unit : ""}` };
  }
  _entBtn(scope, path, value, placeholder) {
    const i = value ? this._entInfo(value) : null;
    return `<button class="entb ${value ? "" : "empty"}" data-a="epick" data-s="${scope}" data-p="${path}" title="${esc(value || "Choisir une entité")}">
      <ha-icon icon="${i ? i.icon : "mdi:magnify"}"></ha-icon><span>${value ? `<b>${esc(i ? i.name : value)}</b><small>${esc(value)}${i && i.area ? " · " + esc(i.area) : ""}</small>` : `<b>${esc(placeholder)}</b>`}</span>
      ${value ? `<i class="ex" data-a="eclear" data-s="${scope}" data-p="${path}" title="Retirer">×</i>` : ""}</button>`;
  }
  _attrSel(scope, path, entity, value, numericOnly) {
    const st = this._hass.states[entity];
    if (!st) return "";
    const attrs = Object.entries(st.attributes).filter(([k, v]) => !ATTR_SKIP.has(k) && v != null && typeof v !== "object" && (!numericOnly || !isNaN(parseFloat(v))));
    if (!attrs.length) return "";
    const lbl = (k, v) => `${ATTR_FR[k] || k} (${String(v).slice(0, 18)})`;
    return `<select class="attr" data-s="${scope}" data-p="${path}" title="Valeur à utiliser"><option value="">État (${esc(String(st.state).slice(0, 18))})</option>${attrs.map(([k, v]) => `<option value="${esc(k)}" ${value === k ? "selected" : ""}>${esc(lbl(k, v))}</option>`).join("")}</select>`;
  }
  _openEnts(scope, path) {
    this._ep = { scope, path, q: "", f: "all" };
    this._drawEnts();
  }
  _entResults() {
    const ep = this._ep, h = this._hass, words = fold(ep.q).toLowerCase().split(/\s+/).filter(Boolean);
    const main = ["sensor", "weather", "binary_sensor", "climate"];
    const out = [];
    for (const e of Object.keys(h.states)) {
      const dom = e.split(".")[0];
      if (ep.f !== "all" && (ep.f === "other" ? main.includes(dom) : dom !== ep.f)) continue;
      if (["automation", "script", "scene", "update", "button", "event", "tts", "stt", "conversation", "todo", "image", "camera", "notify", "assist_satellite", "wake_word"].includes(dom)) continue;
      const i = this._entInfo(e);
      const hay = fold(`${i.name} ${e} ${i.area}`).toLowerCase();
      if (words.length && !words.every((w) => hay.includes(w))) continue;
      const score = words.length ? (fold(i.name).toLowerCase().startsWith(words[0]) ? 0 : 1) : 0;
      out.push([score, i]);
      if (out.length > 400) break;
    }
    out.sort((a, b) => a[0] - b[0] || a[1].name.localeCompare(b[1].name, "fr"));
    return out.slice(0, 120).map((x) => x[1]);
  }
  _drawEnts(listOnly) {
    let box = this.shadowRoot.getElementById("entpick");
    if (!this._ep) { if (box) box.remove(); return; }
    const ep = this._ep, res = this._entResults();
    const list = `<div class="elist">${res.map((i) => `<button class="erow" data-a="eset" data-v="${esc(i.id)}"><ha-icon icon="${esc(i.icon)}"></ha-icon><span><b>${esc(i.name)}</b><small>${esc(i.id)}${i.area ? " · " + esc(i.area) : ""}</small></span><em>${esc(i.state)}</em></button>`).join("") || `<div class="muted pad">Aucune entité.</div>`}</div>`;
    if (listOnly && box) {
      box.querySelector(".el").innerHTML = list;
      box.querySelectorAll(".efil button").forEach((b) => b.classList.toggle("otn", b.dataset.v === ep.f));
      return;
    }
    if (!box) { box = document.createElement("div"); box.id = "entpick"; this.shadowRoot.appendChild(box); }
    box.innerHTML = `<div class="ov top" data-a="eclose-bg"><div class="mdl small"><div class="mh"><b>Choisir une entité</b><button class="ib" data-a="eclose"><ha-icon icon="mdi:close"></ha-icon></button></div>
      <div class="mb"><input class="grow wide" id="eq" placeholder="Rechercher par nom, pièce ou identifiant…" value="${esc(ep.q)}">
        <div class="efil">${ENT_FILTERS.map(([k, l]) => `<button class="mini ${ep.f === k ? "otn" : ""}" data-a="efil" data-v="${k}">${l}</button>`).join("")}</div>
        <div class="el">${list}</div></div></div></div>`;
    const q = box.querySelector("#eq");
    q.addEventListener("input", () => { ep.q = q.value; clearTimeout(this._eqT); this._eqT = setTimeout(() => this._drawEnts(true), 120); });
    q.focus();
  }
  _framesEditor(frames, scope, base, textOnly = false) {
    const ic = (f, i) => `<button class="icb" data-a="icon" data-s="${scope}" data-p="${base}.${i}.icon" title="Choisir une icône">${iconUrl(f.icon) ? `<img src="${esc(iconUrl(f.icon))}" referrerpolicy="no-referrer">` : `<ha-icon icon="mdi:image-plus"></ha-icon>`}</button>`;
    return `<div class="frames">${(frames || []).map((f, i) => {
      const t = f.type || "text", p = `${base}.${i}`;
      const ent = this._entBtn(scope, `${p}.entity`, f.entity, "Entité (facultatif)") + (f.entity ? this._attrSel(scope, `${p}.attribute`, f.entity, f.attribute, t !== "text") : "");
      return `<div class="frame"><div class="fh"><span class="fn">${i + 1}</span>
        ${textOnly ? "" : `<select data-s="${scope}" data-a2="ftype" data-p="${p}.type" data-r="1"><option value="text" ${t === "text" ? "selected" : ""}>Texte</option><option value="goal" ${t === "goal" ? "selected" : ""}>Jauge</option><option value="chart" ${t === "chart" ? "selected" : ""}>Graphique</option></select>`}
        <span class="sp"></span>
        <button class="ib sm" data-a="fmove" data-s="${scope}" data-b="${base}" data-i="${i}" data-v="-1" ${i ? "" : "disabled"}><ha-icon icon="mdi:chevron-up"></ha-icon></button>
        <button class="ib sm" data-a="fdel" data-s="${scope}" data-b="${base}" data-i="${i}"><ha-icon icon="mdi:delete-outline"></ha-icon></button></div>
        <div class="fb">${t === "chart" ? `${ent}<label class="inl">sur <input type="number" class="num" min="1" max="168" data-s="${scope}" data-p="${p}.hours" data-t="num" value="${f.hours || 12}"> h</label><label class="inl"><input type="number" class="num" min="4" max="36" data-s="${scope}" data-p="${p}.points" data-t="num" value="${f.points || 16}"> barres</label>`
          : t === "goal" ? `${ic(f, i)}${ent}<input type="number" class="num" data-s="${scope}" data-p="${p}.start" data-t="num" value="${f.start ?? 0}" title="Début"><input type="number" class="num" data-s="${scope}" data-p="${p}.end" data-t="num" value="${f.end ?? 100}" title="Objectif"><input class="num" placeholder="unité" data-s="${scope}" data-p="${p}.unit" value="${esc(f.unit || "")}">`
          : `${ic(f, i)}<input class="grow" placeholder="${f.entity ? "{value} {unit} (vide = valeur + unité)" : "Texte, ou modèle {{ states('sensor.x') }}"}" data-s="${scope}" data-p="${p}.text" value="${esc(f.text || "")}">${textOnly ? "" : ent}`}</div>
        ${!textOnly && t !== "chart" && f.entity ? `<div class="fo">${t === "text" ? `<label class="inl">Décimales <input type="number" class="num" min="0" max="3" data-s="${scope}" data-p="${p}.decimals" data-t="numnull" value="${f.decimals ?? ""}"></label>` : ""}
          <label class="inl"><input type="checkbox" data-s="${scope}" data-p="${p}.hide_if_zero" data-t="bool" ${f.hide_if_zero ? "checked" : ""}>Masquer si zéro</label></div>` : ""}</div>`;
    }).join("")}</div>
    <div class="bar"><button class="pill" data-a="fadd" data-s="${scope}" data-b="${base}"><ha-icon icon="mdi:plus"></ha-icon>Ajouter un écran</button></div>`;
  }

  // ---------------------------------------------------------------- éditeur de programme (fenêtre)
  _openEditor(p) {
    this._ed = { p: clone(p) };
    this._edPrev = [];
    this._drawEditor();
    this._preview("ed");
  }
  _drawEditor() {
    const m = this.shadowRoot.getElementById("modal");
    if (!this._ed) { m.innerHTML = ""; return; }
    const p = this._ed.p, nc = p.notification, s = this._s;
    const keepScroll = m.querySelector(".mb") ? m.querySelector(".mb").scrollTop : 0;
    m.innerHTML = `<div class="ov" data-a="close-bg"><div class="mdl" role="dialog">
      <div class="mh"><input class="title" data-s="ed" data-p="name" value="${esc(p.name)}"><button class="ib" data-a="close"><ha-icon icon="mdi:close"></ha-icon></button></div>
      <div class="mb">
        ${this._led("ed")}
        <div class="seg2"><button class="${p.mode === "app" ? "otn" : ""}" data-a="emode" data-v="app"><ha-icon icon="mdi:view-carousel"></ha-icon>Affichage continu<small>dans l'appli My Data</small></button>
          <button class="${p.mode === "notification" ? "otn" : ""}" data-a="emode" data-v="notification"><ha-icon icon="mdi:message-badge"></ha-icon>Notification<small>à intervalle régulier</small></button></div>
        <div class="sec"><b>Écrans</b></div>
        ${this._framesEditor(p.frames, "ed", "frames")}
        <div class="sec"><b>Quand</b></div>
        <div class="days">${DAYS.map((d, i) => `<button class="day ${p.days.includes(i) ? "otn" : ""}" data-a="eday" data-v="${i}" title="${DAYS_LONG[i]}">${d}</button>`).join("")}
          <button class="lnk" data-a="edays" data-v="0,1,2,3,4">Semaine</button><button class="lnk" data-a="edays" data-v="5,6">Week-end</button><button class="lnk" data-a="edays" data-v="0,1,2,3,4,5,6">Tous</button></div>
        <div class="presets">${WINDOW_PRESETS.map(([l], i) => `<button class="mini" data-a="epreset" data-v="${i}">${l}</button>`).join("")}</div>
        ${p.windows.length ? p.windows.map((w, i) => `<div class="win">${this._spec("ed", `windows.${i}.from`, w.from)}<ha-icon icon="mdi:arrow-right"></ha-icon>${this._spec("ed", `windows.${i}.to`, w.to)}<button class="ib sm" data-a="wdel" data-i="${i}"><ha-icon icon="mdi:delete-outline"></ha-icon></button></div>`).join("") : `<div class="muted pad">Toute la journée.</div>`}
        <div class="bar"><button class="pill" data-a="wadd"><ha-icon icon="mdi:plus"></ha-icon>Ajouter une plage</button></div>
        <div class="sec"><b>Conditions</b><span class="muted">toutes doivent être vraies</span></div>
        ${p.conditions.map((c, i) => `<div class="cond">${this._entBtn("ed", `conditions.${i}.entity`, c.entity, "Entité")}${c.entity ? this._attrSel("ed", `conditions.${i}.attribute`, c.entity, c.attribute, false) : ""}
          <select data-s="ed" data-p="conditions.${i}.op">${Object.entries(OPS).map(([k, v]) => `<option value="${k}" ${c.op === k ? "selected" : ""}>${v}</option>`).join("")}</select>
          <input class="num2" placeholder="valeur" data-s="ed" data-p="conditions.${i}.value" value="${esc(c.value ?? "")}"><span class="cv">${esc(this._stateOf(c.entity, c.attribute))}</span>
          <button class="ib sm" data-a="cdel" data-i="${i}"><ha-icon icon="mdi:delete-outline"></ha-icon></button></div>`).join("")}
        <div class="bar"><button class="pill" data-a="cadd"><ha-icon icon="mdi:plus"></ha-icon>Ajouter une condition</button>
          <button class="mini" data-a="cpreset" data-v="above_horizon">Soleil levé</button><button class="mini" data-a="cpreset" data-v="home">Quelqu'un à la maison</button></div>
        ${p.mode === "notification" ? `<div class="sec"><b>Notification</b></div>
        <div class="grid3">
          <label>Toutes les (min)<input type="number" min="0" data-s="ed" data-p="notification.interval" data-t="num" value="${nc.interval}" title="0 = une seule fois à chaque début de plage"></label>
          <label>Priorité<select data-s="ed" data-p="notification.priority">${Object.entries(PRIO).map(([k, v]) => `<option value="${k}" ${nc.priority === k ? "selected" : ""}>${v}</option>`).join("")}</select></label>
          <label>Son${this._soundSelect("ed", "notification.sound", nc.sound, s.sounds)}</label>
          <label>Répétitions<input type="number" min="0" max="50" data-s="ed" data-p="notification.cycles" data-t="num" value="${nc.cycles}"></label>
          <label>Durée max (s)<input type="number" min="0" data-s="ed" data-p="notification.lifetime" data-t="num" value="${nc.lifetime || 0}" title="0 = jusqu'à la fin de l'affichage"></label>
          <label>Pictogramme<select data-s="ed" data-p="notification.icon_type"><option value="none" ${nc.icon_type === "none" ? "selected" : ""}>Aucun</option><option value="info" ${nc.icon_type === "info" ? "selected" : ""}>Info</option><option value="alert" ${nc.icon_type === "alert" ? "selected" : ""}>Alerte</option></select></label>
        </div><div class="hint">Intervalle à 0 : une notification à chaque début de plage. Le mode nuit filtre ces notifications.</div>` : ""}
      </div>
      <div class="mf">${p.id ? `<button class="pill danger" data-a="edel"><ha-icon icon="mdi:delete"></ha-icon>Supprimer</button>` : ""}<span class="sp"></span>
        <button class="pill" data-a="etest"><ha-icon icon="mdi:send"></ha-icon>Tester</button>
        <button class="pill main" data-a="esave"><ha-icon icon="mdi:content-save"></ha-icon>Enregistrer</button></div>
    </div></div>`;
    const mb = m.querySelector(".mb");
    if (mb) mb.scrollTop = keepScroll;
    this._mount();
  }
  _stateOf(e, attr) {
    const st = e && this._hass.states[e];
    if (!st) return "";
    return `actuel : ${attr ? (st.attributes[attr] ?? "–") : st.state}`;
  }
  _preview(scope) {
    clearTimeout(this["_pv" + scope]);
    this["_pv" + scope] = setTimeout(async () => {
      const frames = scope === "ed" ? (this._ed && this._ed.p.frames) : this._nt.frames;
      if (!frames) return;
      try {
        const r = await this._ws("render", { frames });
        if (scope === "ed") this._edPrev = r.frames; else this._ntPrev = r.frames;
        this._mount();
      } catch (e) { /* aperçu indisponible */ }
    }, 350);
  }

  // ---------------------------------------------------------------- choix d'icône
  async _openIcons(scope, path) {
    this._ip = { scope, path, q: "", list: [], total: 0, busy: true };
    this._drawIcons();
    this._searchIcons("");
  }
  async _searchIcons(q) {
    this._ip.q = q; this._ip.busy = true; this._drawIcons(true);
    try {
      const r = await this._ws("icons", { query: q, limit: 120 });
      if (!this._ip || this._ip.q !== q) return;
      this._ip.list = r.icons; this._ip.total = r.total;
    } catch (e) { this._ip.err = e.message || String(e); }
    this._ip.busy = false;
    this._drawIcons(true);
  }
  _drawIcons(listOnly) {
    let box = this.shadowRoot.getElementById("icons");
    if (!this._ip) { if (box) box.remove(); return; }
    const ip = this._ip;
    const cur = getPath(this._scope(ip.scope), ip.path) || "";
    const list = `${ip.err ? `<div class="warn">${esc(ip.err)}</div>` : ""}<div class="igrid">${ip.list.map((i) => `<button class="ii ${cur === i.code ? "otn" : ""}" data-a="ipick" data-v="${esc(i.code)}" title="${esc(i.title)} (${esc(i.code)})"><img src="${esc(i.thumb)}" loading="lazy" referrerpolicy="no-referrer"><span>${esc(i.title)}</span></button>`).join("")}</div>
      <div class="muted pad">${ip.busy ? "Recherche…" : `${ip.list.length} icône${ip.list.length > 1 ? "s" : ""}${ip.total ? ` sur ${ip.total}` : ""}`}</div>`;
    if (listOnly && box) { box.querySelector(".il").innerHTML = list; return; }
    if (!box) { box = document.createElement("div"); box.id = "icons"; this.shadowRoot.appendChild(box); }
    box.innerHTML = `<div class="ov top" data-a="iclose-bg"><div class="mdl small"><div class="mh"><b>Icône LaMetric</b><button class="ib" data-a="iclose"><ha-icon icon="mdi:close"></ha-icon></button></div>
      <div class="mb"><div class="bar"><input class="grow" id="iq" placeholder="Rechercher (en anglais : sun, solar, battery, car…)" value="${esc(ip.q)}">
        <input class="num2" id="icode" placeholder="i1234" value="${esc(cur)}"><button class="pill" data-a="icode">OK</button></div>
        <div class="il">${list}</div></div>
      <div class="mf"><button class="pill" data-a="ipick" data-v="">Sans icône</button><span class="sp"></span><a class="lnk" href="https://developer.lametric.com/icons" target="_blank" rel="noreferrer">Galerie LaMetric</a></div></div></div>`;
    const q = box.querySelector("#iq");
    q.addEventListener("input", () => { clearTimeout(this._iqT); this._iqT = setTimeout(() => this._searchIcons(q.value.trim()), 300); });
    q.focus();
  }

  // ---------------------------------------------------------------- événements
  _scope(s) { return s === "ed" ? this._ed && this._ed.p : s === "nt" ? this._nt : this._st; }
  _input(e, committed) {
    const t = e.target;
    if (t.dataset.dev) {
      if (t.type === "range") {
        this._sliding = !committed;
        const b = t.parentElement.querySelector("b"); if (b) b.textContent = `${t.value}%`;
        if (!committed) return;
        this._ws("device", { action: t.dataset.dev, value: +t.value }).catch((err) => this._toast(err.message, true));
        setTimeout(() => { this._sliding = false; this._render(); }, 600);
      } else if (committed) this._ws("device", { action: t.dataset.dev, value: t.value }).catch((err) => this._toast(err.message, true));
      return;
    }
    const sc = t.dataset.s, path = t.dataset.p;
    if (!sc || !path) return;
    if (e.type === "input" && (t.tagName === "SELECT" || t.type === "checkbox")) return;
    const obj = this._scope(sc);
    if (!obj) return;
    let v = t.type === "checkbox" ? t.checked : t.value;
    if (t.dataset.t === "num") v = v === "" ? 0 : +v;
    if (t.dataset.t === "numnull") v = v === "" ? null : +v;
    if (t.dataset.a2 === "ftype") {   // changement de type d'écran : on repart d'un écran vierge du bon type
      const i = +path.split(".").slice(-2)[0], base = path.split(".").slice(0, -2).join(".");
      const arr = getPath(obj, base), old = arr[i];
      arr[i] = { ...blankFrame(v), icon: old.icon || "", entity: old.entity || "" };
    } else setPath(obj, path, v);
    if (path.endsWith(".kind") && v !== "time") setPath(obj, path.replace(/kind$/, "offset"), getPath(obj, path.replace(/kind$/, "offset")) || 0);
    if (path.endsWith(".kind") && v === "time" && !getPath(obj, path.replace(/kind$/, "time"))) setPath(obj, path.replace(/kind$/, "time"), "07:00");
    const structural = t.dataset.r || path.endsWith(".entity") || t.type === "checkbox";
    if (sc === "ed") { if (structural && committed) this._drawEditor(); this._preview("ed"); }
    else if (sc === "nt") { if (structural && committed) this._render(); this._preview("nt"); }
    else if (structural && committed) this._render();
  }
  async _click(e) {
    const el = e.target.closest("[data-a]");
    if (!el) return;
    const a = el.dataset.a, s = this._s;
    if ((a === "close-bg" || a === "iclose-bg" || a === "eclose-bg") && e.target !== el) return;
    try {
      switch (a) {
        case "tab": this._tab = el.dataset.v; this._render(); if (this._tab === "notify") this._preview("nt"); break;
        case "dev": {
          const k = el.dataset.k;
          const val = k === "bluetooth" || k === "screensaver" ? el.dataset.v === "1" : el.dataset.v;
          await this._ws("device", { action: k, value: val ?? null });
          break;
        }
        case "activate": await this._ws("device", { action: "activate", package: el.dataset.p, widget: el.dataset.w }); break;
        case "ptoggle": {
          const p = s.programmes.find((x) => x.id === el.dataset.id);
          await this._ws("programme/save", { programme: { ...p, enabled: !p.enabled } });
          break;
        }
        case "move": {
          const ids = s.programmes.map((p) => p.id), i = ids.indexOf(el.dataset.id), j = i + +el.dataset.v;
          [ids[i], ids[j]] = [ids[j], ids[i]];
          await this._ws("programme/reorder", { ids });
          break;
        }
        case "edit": this._openEditor(s.programmes.find((p) => p.id === el.dataset.id)); break;
        case "new": this._openEditor(this._template(el.dataset.v)); break;
        case "close": case "close-bg": this._ed = null; this._drawEditor(); break;
        case "emode": this._ed.p.mode = el.dataset.v; this._drawEditor(); break;
        case "eday": { const d = +el.dataset.v, ds = this._ed.p.days; this._ed.p.days = ds.includes(d) ? ds.filter((x) => x !== d) : [...ds, d].sort(); this._drawEditor(); break; }
        case "edays": this._ed.p.days = el.dataset.v.split(",").map(Number); this._drawEditor(); break;
        case "epreset": this._ed.p.windows = clone(WINDOW_PRESETS[+el.dataset.v][1]); this._drawEditor(); break;
        case "wadd": this._ed.p.windows.push({ from: { kind: "time", time: "08:00", offset: 0 }, to: { kind: "time", time: "20:00", offset: 0 } }); this._drawEditor(); break;
        case "wdel": this._ed.p.windows.splice(+el.dataset.i, 1); this._drawEditor(); break;
        case "cadd": this._ed.p.conditions.push({ entity: "", op: "eq", value: "" }); this._drawEditor(); break;
        case "cdel": this._ed.p.conditions.splice(+el.dataset.i, 1); this._drawEditor(); break;
        case "cpreset":
          if (el.dataset.v === "above_horizon") this._ed.p.conditions.push({ entity: "sun.sun", op: "eq", value: "above_horizon" });
          else this._ed.p.conditions.push({ entity: Object.keys(this._hass.states).find((x) => x.startsWith("zone.home")) || "zone.home", op: "gt", value: "0" });
          this._drawEditor(); break;
        case "esave": {
          if (!this._ed.p.frames.length) throw new Error("Ajoutez au moins un écran");
          await this._ws("programme/save", { programme: this._ed.p });
          this._ed = null; this._drawEditor(); this._toast("Programme enregistré");
          break;
        }
        case "edel":
          if (!confirm(`Supprimer le programme « ${this._ed.p.name} » ?`)) return;
          await this._ws("programme/delete", { programme_id: this._ed.p.id });
          this._ed = null; this._drawEditor(); break;
        case "etest": {
          const nc = this._ed.p.notification;
          await this._ws("send", { frames: this._ed.p.frames, priority: nc.priority || "info", icon_type: nc.icon_type || "none", sound: nc.sound || null, cycles: +nc.cycles || 1 });
          this._toast("Envoyé au LaMetric"); break;
        }
        case "fadd": { const sc = this._scope(el.dataset.s), arr = getPath(sc, el.dataset.b); arr.push(blankFrame()); this._redraw(el.dataset.s); break; }
        case "fdel": { const arr = getPath(this._scope(el.dataset.s), el.dataset.b); arr.splice(+el.dataset.i, 1); this._redraw(el.dataset.s); break; }
        case "fmove": { const arr = getPath(this._scope(el.dataset.s), el.dataset.b), i = +el.dataset.i, j = i + +el.dataset.v; [arr[i], arr[j]] = [arr[j], arr[i]]; this._redraw(el.dataset.s); break; }
        case "icon": this._openIcons(el.dataset.s, el.dataset.p); break;
        case "epick": if (e.target.closest(".ex")) break; this._openEnts(el.dataset.s, el.dataset.p); break;
        case "eclear": { const sc = el.dataset.s; setPath(this._scope(sc), el.dataset.p, ""); setPath(this._scope(sc), el.dataset.p.replace(/entity$/, "attribute"), ""); this._redraw(sc); break; }
        case "efil": this._ep.f = el.dataset.v; this._drawEnts(true); break;
        case "eset": {
          const { scope, path } = this._ep, obj = this._scope(scope);
          setPath(obj, path, el.dataset.v);
          setPath(obj, path.replace(/entity$/, "attribute"), "");
          this._ep = null; this._drawEnts(); this._redraw(scope); break;
        }
        case "eclose": case "eclose-bg": this._ep = null; this._drawEnts(); break;
        case "ipick": case "icode": {
          const v = a === "icode" ? this.shadowRoot.getElementById("icode").value.trim() : el.dataset.v;
          setPath(this._scope(this._ip.scope), this._ip.path, v);
          const sc = this._ip.scope; this._ip = null; this._drawIcons(); this._redraw(sc); break;
        }
        case "iclose": case "iclose-bg": this._ip = null; this._drawIcons(); break;
        case "send": {
          const n = this._nt;
          await this._ws("send", { frames: n.frames, priority: n.priority, icon_type: n.icon_type, sound: n.sound || null, cycles: +n.cycles || 1 });
          this._toast("Envoyé au LaMetric"); break;
        }
        case "pushnt": {
          const data = { frames: this._nt.frames, minutes: +this._nt.minutes || 5 };
          if (s.entry_id) data.device = s.entry_id;
          await this._hass.callService("lametric_holm", "push_frames", data);
          this._toast(`Affiché dans My Data pendant ${data.minutes} min`); break;
        }
        case "stoggle": { const p = el.dataset.p; setPath(this._st, p, !getPath(this._st, p)); if (p === "engine") await this._ws("settings", { changes: { engine: this._st.engine } }); this._render(); break; }
        case "ssave": await this._ws("settings", { changes: this._st }); this._toast("Réglages enregistrés"); break;
        case "sreset": this._st = clone(s.settings); this._render(); break;
        case "push": { const r = await this._ws("push"); this._toast(r.error ? r.error : "Écran renvoyé", !!r.error); break; }
        default: break;
      }
    } catch (err) { this._toast(err.message || String(err), true); }
  }
  _redraw(scope) {
    if (scope === "ed") { this._drawEditor(); this._preview("ed"); }
    else { this._render(); if (scope === "nt") this._preview("nt"); }
  }
  _template(kind) {
    const st = this._hass.states;
    if (kind === "solar") {
      // capteurs réels de l'installation, pas les prévisions (Forecast.Solar, Solcast…)
      const pick = (dc, extra) => {
        let best = null, bestScore = 0;
        for (const e of Object.keys(st)) {
          const a = st[e].attributes || {};
          if (!e.startsWith("sensor.") || a.device_class !== dc) continue;
          const plat = ((this._hass.entities || {})[e] || {}).platform || "";
          const txt = `${e} ${fold(a.friendly_name || "")}`.toLowerCase();
          if (/forecast|solcast/.test(plat) || /forecast|prevision|tomorrow|demain|remaining|next_hour|current_hour|lifetime|maximum|total|surplus|_ch_?\d|consumption|conso/.test(txt)) continue;
          let sc = 0;
          if (/solai|solar|pv\b|_pv|photovolt|ecu|inverter|onduleur|panneau/.test(txt)) sc += 3;
          if (/production|current|now|actuel|instant/.test(txt)) sc += 2;
          if (extra && !extra.test(txt)) continue;
          if (sc > bestScore) { best = e; bestScore = sc; }
        }
        return bestScore >= 3 ? best : null;
      };
      const pv = pick("power"), day = pick("energy", /today|jour|daily|quotidien/);
      return newProgramme({
        name: "Production solaire",
        frames: [{ type: "text", icon: "", entity: pv || "", text: "", decimals: 0, hide_if_zero: true }, ...(day ? [{ type: "text", icon: "", entity: day, text: "{value} kWh", decimals: 1 }] : []), ...(pv ? [{ type: "chart", entity: pv, hours: 12, points: 16 }] : [])],
        windows: clone(WINDOW_PRESETS[1][1]),
      });
    }
    if (kind === "temp") {
      const t = Object.keys(st).filter((e) => e.startsWith("sensor.") && st[e].attributes.device_class === "temperature").slice(0, 2);
      return newProgramme({ name: "Températures", frames: (t.length ? t : [""]).map((e) => ({ type: "text", icon: "", entity: e, text: "", decimals: 1 })) });
    }
    return newProgramme();
  }

  static getStubConfig() { return { title: "LaMetric" }; }
  static getConfigElement() { return document.createElement("holm-lametric-card-editor"); }
}

const CSS = `
:host { display:block; --ac:#0abfbf; --ac2:#e3a21a; --sf:color-mix(in srgb, var(--primary-text-color) 6%, transparent); --bd:color-mix(in srgb, var(--primary-text-color) 10%, transparent); }
ha-card { padding:14px; box-sizing:border-box; container-type:inline-size; overflow:hidden; }
ha-card.noframe { background:none !important; box-shadow:none !important; border:none !important; backdrop-filter:none !important; }
button { font:inherit; color:inherit; cursor:pointer; }
input, select { font:inherit; font-size:13.5px; color:var(--primary-text-color); background:var(--card-background-color, transparent); border:1px solid var(--bd); border-radius:10px; padding:7px 9px; box-sizing:border-box; min-width:0; }
input[type=checkbox] { width:auto; accent-color:var(--ac); }
input[type=range] { flex:1; accent-color:var(--ac); padding:0; border:0; background:none; }
.hd { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:12px; }
.tt { display:flex; align-items:center; gap:8px; font-size:17px; font-weight:700; margin-right:auto; color:var(--primary-text-color); }
.tt ha-icon { color:var(--ac); }
.dot { width:8px; height:8px; border-radius:50%; display:inline-block; } .dot.ok { background:#3ecf6e; } .dot.ko { background:#e05252; }
.tabs { display:flex; gap:3px; padding:3px; border-radius:14px; background:var(--sf); }
.tab { display:flex; align-items:center; gap:6px; border:0; background:none; padding:7px 12px; border-radius:11px; font-size:13px; font-weight:600; color:var(--secondary-text-color); }
.tab ha-icon { --mdc-icon-size:18px; }
.tab.otn { background:color-mix(in srgb, var(--ac) 22%, transparent); color:var(--primary-text-color); }
.tab em { font-style:normal; font-size:10.5px; min-width:16px; height:16px; line-height:16px; border-radius:8px; background:var(--ac2); color:#111; padding:0 4px; }
@container (max-width: 560px) { .tab span { display:none; } .tab { padding:8px 11px; } }
.ledbox { background:linear-gradient(180deg,#1e1e1e,#0e0e0e); border-radius:14px; padding:12px; box-shadow:inset 0 1px 0 rgba(255,255,255,.06), 0 8px 22px rgba(0,0,0,.35); margin-bottom:10px; }
.ledbox canvas { width:100%; height:auto; display:block; image-rendering:pixelated; aspect-ratio:37/8; }
.ledbox.big { padding:16px 18px; }
.chips { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:10px; }
.chip { display:inline-flex; align-items:center; gap:5px; font-size:12px; font-weight:600; padding:4px 10px; border-radius:999px; background:var(--sf); color:var(--secondary-text-color); }
.chip ha-icon { --mdc-icon-size:15px; }
.chip.on { background:color-mix(in srgb, var(--ac) 22%, transparent); color:var(--primary-text-color); }
.chip.night { background:color-mix(in srgb, #6b6bff 25%, transparent); color:var(--primary-text-color); }
.chip.off { background:color-mix(in srgb, var(--ac2) 25%, transparent); color:var(--primary-text-color); }
.warn { display:flex; gap:8px; align-items:center; font-size:12.5px; padding:8px 10px; border-radius:10px; background:color-mix(in srgb, var(--error-color,#e05252) 15%, transparent); margin-bottom:10px; }
.warn ha-icon { --mdc-icon-size:18px; color:var(--error-color,#e05252); flex:none; }
.ctl { display:flex; flex-direction:column; gap:6px; margin-bottom:10px; }
.row { display:flex; align-items:center; gap:10px; padding:6px 10px; border-radius:12px; background:var(--sf); }
.row ha-icon { --mdc-icon-size:20px; color:var(--secondary-text-color); } .row b { font-size:12.5px; min-width:38px; text-align:right; }
.mini { border:1px solid var(--bd); background:none; border-radius:9px; padding:4px 9px; font-size:12px; font-weight:600; display:inline-flex; align-items:center; gap:4px; }
.mini ha-icon { --mdc-icon-size:16px; color:inherit; }
.mini.otn { background:var(--ac); border-color:var(--ac); color:#0b1416; }
.bar { display:flex; align-items:center; gap:8px; margin:8px 0; flex-wrap:wrap; }
.sp { flex:1; }
.apps { display:flex; gap:5px; flex:1; overflow-x:auto; scrollbar-width:none; padding:2px 0; } .apps::-webkit-scrollbar { display:none; }
.app { flex:none; border:1px solid var(--bd); background:var(--sf); border-radius:10px; padding:6px 10px; font-size:12.5px; font-weight:600; }
.app.otn { background:color-mix(in srgb, var(--ac) 25%, transparent); border-color:var(--ac); }
.ib { width:34px; height:34px; border-radius:10px; border:0; background:var(--sf); display:grid; place-items:center; flex:none; }
.ib.sm { width:28px; height:28px; border-radius:8px; } .ib.sm ha-icon { --mdc-icon-size:17px; }
.ib:disabled { opacity:.3; cursor:default; }
.ib ha-icon { --mdc-icon-size:20px; }
.pill { display:inline-flex; align-items:center; gap:6px; border:1px solid var(--bd); background:var(--sf); padding:7px 12px; border-radius:11px; font-size:13px; font-weight:600; text-decoration:none; color:var(--primary-text-color); white-space:nowrap; }
.pill ha-icon { --mdc-icon-size:17px; }
.pill.main { background:var(--ac); border-color:var(--ac); color:#0b1416; }
.pill.danger { color:var(--error-color, #e05252); }
.lnk { border:0; background:none; color:var(--ac); font-weight:600; font-size:12.5px; padding:2px 4px; text-decoration:none; }
.sec { display:flex; align-items:baseline; gap:10px; margin:14px 0 6px; font-size:13.5px; } .sec .lnk { margin-left:auto; } .sec .muted { font-size:12px; }
.muted { color:var(--secondary-text-color); font-size:13px; } .pad { padding:8px 4px; }
.empty { padding:24px 8px; text-align:center; line-height:1.6; color:var(--secondary-text-color); }
.hint { margin-top:8px; font-size:11.5px; color:var(--secondary-text-color); line-height:1.45; opacity:.85; }
.foot { margin-top:12px; font-size:11.5px; }
.queue { display:flex; flex-direction:column; gap:5px; }
.qi { display:flex; align-items:center; gap:8px; padding:6px 8px; border-radius:10px; background:var(--sf); }
.qt { flex:1; font-size:13px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.pr { font-size:10.5px; font-weight:700; padding:2px 7px; border-radius:999px; background:var(--bd); text-transform:uppercase; letter-spacing:.04em; }
.pr.warning { background:color-mix(in srgb, var(--ac2) 40%, transparent); } .pr.critical { background:color-mix(in srgb, #e05252 45%, transparent); }
/* frise */
.timeline { padding:10px 12px 8px; border-radius:14px; background:var(--sf); margin-bottom:12px; }
.tlh { position:relative; height:22px; margin-left:110px; font-size:10.5px; color:var(--secondary-text-color); }
.tlh span { position:absolute; transform:translateX(-50%); top:0; } .tlh span:first-child { transform:none; } .tlh span:last-of-type { transform:translateX(-100%); }
.sun { position:absolute; top:-2px; transform:translateX(-50%); color:var(--ac2); } .sun ha-icon { --mdc-icon-size:14px; }
.tlbody { position:relative; display:flex; flex-direction:column; gap:5px; }
.ovl { position:absolute; top:-4px; bottom:-4px; left:110px; right:0; pointer-events:none; z-index:1; }
.ovl .nightb { position:absolute; top:0; bottom:0; background:color-mix(in srgb, #6b6bff 16%, transparent); border-radius:4px; }
.ovl .now { position:absolute; top:0; bottom:0; width:2px; background:var(--ac2); border-radius:1px; }
.tlr { display:flex; align-items:center; gap:10px; } .tlr.dis { opacity:.4; }
.tln { width:100px; flex:none; font-size:12px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.tlb { position:relative; flex:1; height:12px; border-radius:6px; background:color-mix(in srgb, var(--primary-text-color) 5%, transparent); }
.seg { position:absolute; top:0; bottom:0; border-radius:6px; background:var(--ac); } .seg.m-notification { background:repeating-linear-gradient(90deg, var(--ac2) 0 4px, transparent 4px 7px); }
.legend { display:flex; gap:14px; flex-wrap:wrap; margin-top:8px; font-size:11px; color:var(--secondary-text-color); }
.legend span { display:inline-flex; align-items:center; gap:5px; } .legend i { position:static; display:inline-block; width:18px; height:8px; border-radius:4px; }
.legend .nightb { background:color-mix(in srgb, #6b6bff 35%, transparent); }
@container (max-width: 480px) { .tln { width:70px; } .tlh { margin-left:80px; } .ovl { left:80px; } }
.plist { display:flex; flex-direction:column; gap:6px; }
.prog { display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:14px; background:var(--sf); }
.prog.dis { opacity:.55; } .prog.act { box-shadow:inset 0 0 0 1.5px var(--ac); }
.pi { flex:1; min-width:0; display:flex; flex-direction:column; gap:2px; cursor:pointer; }
.pi b { font-size:14px; } .pi span { font-size:12px; color:var(--secondary-text-color); display:flex; align-items:center; gap:4px; flex-wrap:wrap; }
.pi ha-icon { --mdc-icon-size:14px; }
.live { font-size:10.5px !important; font-weight:700; color:#0b1416 !important; background:var(--ac); padding:1px 7px; border-radius:999px; display:inline-block !important; }
.pa { display:flex; gap:3px; }
.sw { width:38px; height:22px; border-radius:11px; border:0; background:var(--bd); position:relative; flex:none; padding:0; }
.sw i { position:absolute; top:3px; left:3px; width:16px; height:16px; border-radius:50%; background:#fff; transition:left .15s; }
.sw.otn { background:var(--ac); } .sw.otn i { left:19px; }
.tg { display:flex; align-items:center; gap:10px; font-size:13.5px; margin:6px 0; }
/* édition */
.frames { display:flex; flex-direction:column; gap:6px; }
.frame { border:1px solid var(--bd); border-radius:12px; padding:7px 8px; display:flex; flex-direction:column; gap:6px; }
.fh, .fb, .fo { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
.fn { width:20px; height:20px; border-radius:6px; background:var(--sf); font-size:11px; font-weight:700; display:grid; place-items:center; }
.fb input { flex:1; } .fb input.num, .num { width:72px; flex:none !important; } .num2 { width:110px; }
.grow { flex:2 !important; }
.icb { width:36px; height:36px; flex:none; border-radius:9px; border:1px dashed var(--bd); background:#111; display:grid; place-items:center; padding:0; color:#aaa; }
.icb img { width:28px; height:28px; image-rendering:pixelated; }
.inl { display:inline-flex; align-items:center; gap:5px; font-size:12.5px; color:var(--secondary-text-color); }
.grid3 { display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:8px; margin:8px 0; }
.grid3 label { display:flex; flex-direction:column; gap:4px; font-size:12px; color:var(--secondary-text-color); }
@container (max-width: 520px) { .grid3 { grid-template-columns:1fr 1fr; } }
.win, .cond { display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin:5px 0; }
.win > ha-icon { --mdc-icon-size:18px; color:var(--secondary-text-color); }
.spec { display:inline-flex; align-items:center; gap:4px; } .spec small { font-size:11px; color:var(--secondary-text-color); }
.cond input[list] { flex:1; min-width:160px; } .cv { font-size:11.5px; color:var(--secondary-text-color); }
.days { display:flex; gap:4px; align-items:center; flex-wrap:wrap; }
.day { width:32px; height:32px; border-radius:50%; border:1px solid var(--bd); background:none; font-weight:700; font-size:12.5px; }
.day.otn { background:var(--ac); border-color:var(--ac); color:#0b1416; }
.presets { display:flex; gap:5px; flex-wrap:wrap; margin:8px 0 4px; }
.seg2 { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
.seg2 button { border:1px solid var(--bd); background:var(--sf); border-radius:12px; padding:9px; display:flex; flex-direction:column; align-items:center; gap:2px; font-weight:700; font-size:13px; }
.seg2 small { font-weight:500; font-size:11px; color:var(--secondary-text-color); }
.seg2 button.otn { border-color:var(--ac); background:color-mix(in srgb, var(--ac) 18%, transparent); }
.kv { display:grid; grid-template-columns:max-content 1fr; gap:6px 14px; font-size:13px; align-items:center; }
.kv span { color:var(--secondary-text-color); }
/* fenêtres */
.ov { position:fixed; inset:0; background:rgba(0,0,0,.55); z-index:9000; display:flex; align-items:center; justify-content:center; padding:16px; box-sizing:border-box; }
.ov.top { z-index:9100; }
.mdl { width:min(760px, 100%); max-height:calc(100vh - 32px); display:flex; flex-direction:column; border-radius:20px; background:var(--card-background-color, #1c1c1c); color:var(--primary-text-color); box-shadow:0 20px 60px rgba(0,0,0,.5); overflow:hidden; container-type:inline-size; }
.mdl.small { width:min(640px, 100%); }
.mh { display:flex; align-items:center; gap:10px; padding:12px 14px; border-bottom:1px solid var(--bd); } .mh b { flex:1; font-size:15px; }
.mh .title { flex:1; font-size:16px; font-weight:700; border-color:transparent; background:none; }
.mh .title:focus { border-color:var(--bd); }
.mb { padding:12px 14px; overflow:auto; flex:1; }
.mf { display:flex; align-items:center; gap:8px; padding:10px 14px; border-top:1px solid var(--bd); }
.entb { display:flex; align-items:center; gap:8px; flex:2; min-width:170px; text-align:left; border:1px solid var(--bd); background:var(--card-background-color, transparent); border-radius:10px; padding:5px 9px; position:relative; }
.entb ha-icon { --mdc-icon-size:18px; color:var(--ac); flex:none; }
.entb span { display:flex; flex-direction:column; min-width:0; flex:1; }
.entb b { font-size:13px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.entb small { font-size:11px; color:var(--secondary-text-color); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.entb.empty b { color:var(--secondary-text-color); font-weight:500; }
.entb .ex { font-style:normal; font-size:16px; line-height:1; padding:2px 5px; border-radius:6px; color:var(--secondary-text-color); }
.entb .ex:hover { background:var(--sf); }
select.attr { flex:1; min-width:120px; }
.wide { width:100%; }
.efil { display:flex; gap:5px; flex-wrap:wrap; margin:8px 0; }
.elist { display:flex; flex-direction:column; gap:2px; }
.erow { display:flex; align-items:center; gap:10px; border:0; background:none; border-radius:10px; padding:7px 8px; text-align:left; }
.erow:hover { background:var(--sf); }
.erow ha-icon { --mdc-icon-size:20px; color:var(--ac); flex:none; }
.erow span { display:flex; flex-direction:column; flex:1; min-width:0; }
.erow b { font-size:13.5px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.erow small { font-size:11px; color:var(--secondary-text-color); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.erow em { font-style:normal; font-size:12px; color:var(--secondary-text-color); white-space:nowrap; max-width:35%; overflow:hidden; text-overflow:ellipsis; }
.igrid { display:grid; grid-template-columns:repeat(auto-fill, minmax(84px, 1fr)); gap:6px; }
.ii { border:1px solid var(--bd); background:var(--sf); border-radius:10px; padding:6px 4px; display:flex; flex-direction:column; align-items:center; gap:4px; font-size:10.5px; }
.ii img { width:32px; height:32px; image-rendering:pixelated; background:#111; border-radius:4px; }
.ii span { width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-align:center; color:var(--secondary-text-color); }
.ii.otn { border-color:var(--ac); }
`;

class HolmLaMetricCardEditor extends HTMLElement {
  setConfig(c) { this._c = { ...c }; this._draw(); }
  set hass(h) { this._hass = h; }
  _draw() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
      this.shadowRoot.addEventListener("change", (e) => {
        const t = e.target, k = t.dataset.k;
        if (!k) return;
        const v = t.type === "checkbox" ? t.checked : t.value;
        this._c = { ...this._c, [k]: v };
        if (v === "" || v === null) delete this._c[k];
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._c }, bubbles: true, composed: true }));
      });
    }
    const c = this._c;
    const sel = (k, opts) => `<select data-k="${k}">${opts.map(([v, l]) => `<option value="${v}" ${(c[k] || opts[0][0]) === v ? "selected" : ""}>${l}</option>`).join("")}</select>`;
    this.shadowRoot.innerHTML = `<style>label{display:flex;flex-direction:column;gap:4px;margin:0 0 12px;font:13px sans-serif;color:var(--primary-text-color)}input,select{padding:8px;border-radius:8px;border:1px solid var(--divider-color,#555);background:var(--card-background-color);color:var(--primary-text-color)}.ck{flex-direction:row;align-items:center}</style>
      <label>Titre<input data-k="title" value="${esc(c.title || "LaMetric")}"></label>
      <label>Affichage${sel("view", [["full", "Complet (onglets)"], ["screen", "Écran seul (aperçu + réglages rapides)"]])}</label>
      <label>Onglet à l'ouverture${sel("tab", [["screen", "Écran"], ["programmes", "Programmes"], ["notify", "Notifier"], ["settings", "Réglages"]])}</label>
      <label class="ck"><input type="checkbox" data-k="show_frame" ${c.show_frame === false ? "" : "checked"}> Afficher le cadre de la carte</label>`;
  }
}

if (!customElements.get("holm-lametric-card")) customElements.define("holm-lametric-card", HolmLaMetricCard);
if (!customElements.get("holm-lametric-card-editor")) customElements.define("holm-lametric-card-editor", HolmLaMetricCardEditor);
window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === "holm-lametric-card"))
  window.customCards.push({ type: "holm-lametric-card", name: "HOLM – LaMetric", description: "Écran, programmes d'affichage, notifications et réglages du LaMetric Time", preview: false });
console.info(`%c HOLM LaMetric %c ${VERSION} `, "background:#0abfbf;color:#0b1416;font-weight:700;border-radius:4px 0 0 4px;padding:2px 6px", "background:#1b2a2e;color:#fff;border-radius:0 4px 4px 0;padding:2px 6px");
})();
