"""Constantes de HOLM LaMetric."""
DOMAIN = "lametric_holm"
VERSION = "1.1.0"
OFFICIAL_DOMAIN = "lametric"

CONF_HOST = "host"
CONF_API_KEY = "api_key"

STORAGE_VERSION = 1
CARD_URL = "/lametric_holm_static/holm-lametric-card.js"
STATIC_PATH = "/lametric_holm_static"

MYDATA_PACKAGE = "com.lametric.diy.devwidget"
SIGNAL_UPDATED = "lametric_holm_updated_{}"

PRIORITIES = ["info", "warning", "critical"]
ICON_TYPES = ["none", "info", "alert"]
NOTIFICATION_SOUNDS = [
    "bicycle", "car", "cash", "cat", "dog", "dog2", "energy", "knock-knock", "letter_email", "lose1", "lose2",
    "negative1", "negative2", "negative3", "negative4", "negative5", "notification", "notification2", "notification3",
    "notification4", "open_door", "positive1", "positive2", "positive3", "positive4", "positive5", "positive6",
    "statistic", "thunder", "water1", "water2", "win", "win2", "wind", "wind_short",
]
ALARM_SOUNDS = [f"alarm{i}" for i in range(1, 14)]
DEVICE_MODES = ["auto", "manual", "schedule", "kiosk"]
