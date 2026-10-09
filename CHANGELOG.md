# Changelog

## 1.1.0

- **Choix des entités plus simple** : une fenêtre de recherche par nom, pièce ou identifiant, avec des filtres (capteurs, météo, binaires, climat…), l'icône et l'état de chaque entité. Remplace la liste déroulante des identifiants.
- **Attributs** : un écran (texte, jauge, graphique) ou une condition peut utiliser un attribut de l'entité plutôt que son état, par exemple la **température** ou l'**humidité** d'une entité météo. L'unité suit (°C, %, hPa, km/h…). Le graphique d'un attribut lit tout l'historique de l'entité.
- L'état d'une entité **météo** s'affiche en français (Pluie, Éclaircies, Soleil…).
- Liste des applis : Minuteur, Radio et Chronomètre réapparaissent ; une appli sans nom prend celui de son éditeur.

## 1.0.0 — première version

- Intégration `lametric_holm` pour le **LaMetric Time**, par l'API locale (HTTPS 4343, repli HTTP 8080).
- Ajout en un clic en **reprenant les réglages de l'intégration LaMetric officielle**, ou par adresse et clé d'API.
- **Programmes** :
  - affichage continu dans l'appli **My Data DIY** (envoi local) ou notifications à intervalle régulier ;
  - jours, plages horaires à heure fixe ou au lever/coucher du soleil avec décalage, conditions sur des entités ;
  - écrans texte (modèles Home Assistant, valeur d'une entité), jauge et graphique de l'historique.
- **Mode nuit** : notifications filtrées par priorité, silence, luminosité réduite puis rétablie.
- **Actions** : `notify`, `dismiss`, `activate_app`, `app_action`, `alarm`, `timer`, `stopwatch`, `radio`, `clockface`, `push_frames`, `programme`.
- **Entités** : luminosité, volume, mode de luminosité, défilement des applis, appli affichée, Bluetooth, économiseur d'écran, programmes, mode nuit, boutons, Wi-Fi, logiciel, file de notifications, entité `notify`.
- **Carte `holm-lametric-card`** : aperçu de l'écran LED, réglages rapides, frise des programmes sur 24 h, éditeur avec aperçu en direct, choix parmi les ~74 000 icônes LaMetric, envoi de notifications. Déclarée automatiquement comme ressource Lovelace.
