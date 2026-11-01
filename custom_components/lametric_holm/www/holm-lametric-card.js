/* HOLM LaMetric Card — écran, programmes, notifications et réglages du LaMetric Time.
 * Fait partie de HOLM — Home Orchestration & Living Management. https://github.com/kaaribou/lametric-holm — licence MIT
 *   type: custom:holm-lametric-card
 *   title: LaMetric      tab: screen | programmes | notify | settings      view: full | screen      show_frame: true
 */
(() => {
  // ---- HOLM i18n : textes écrits en français, traduits à l'affichage (en, de, es, it, nl, pt, pl) ----
  // Langue : option `language` de la carte, sinon celle du profil Home Assistant ; anglais si la langue n'est pas traduite.
  const HOLM_LANGS = ["en", "de", "es", "it", "nl", "pt", "pl"];
  const LANG_NAMES = { fr: "Français", en: "English", de: "Deutsch", es: "Español", it: "Italiano", nl: "Nederlands", pt: "Português", pl: "Polski" };
  const LOCALES = { fr: "fr-FR", en: "en-GB", de: "de-DE", es: "es-ES", it: "it-IT", nl: "nl-NL", pt: "pt-PT", pl: "pl-PL" };
  const I18N = {
    "Automatique (profil)": ["Automatic (profile)", "Automatisch (Profil)", "Automático (perfil)", "Automatica (profilo)", "Automatisch (profiel)", "Automático (perfil)", "Automatycznie (profil)"],
    "Langue": ["Language", "Sprache", "Idioma", "Lingua", "Taal", "Idioma", "Język"],
    "Titre": ["Title", "Titel", "Título", "Titolo", "Titel", "Título", "Tytuł"],
    "Titre (optionnel)": ["Title (optional)", "Titel (optional)", "Título (opcional)", "Titolo (facoltativo)", "Titel (optioneel)", "Título (opcional)", "Tytuł (opcjonalnie)"],
    "Nom": ["Name", "Name", "Nombre", "Nome", "Naam", "Nome", "Nazwa"],
    "Nom affiché": ["Display name", "Anzeigename", "Nombre mostrado", "Nome visualizzato", "Weergavenaam", "Nome apresentado", "Wyświetlana nazwa"],
    "Icône": ["Icon", "Symbol", "Icono", "Icona", "Pictogram", "Ícone", "Ikona"],
    "Couleur": ["Colour", "Farbe", "Color", "Colore", "Kleur", "Cor", "Kolor"],
    "Couleurs": ["Colours", "Farben", "Colores", "Colori", "Kleuren", "Cores", "Kolory"],
    "Entité": ["Entity", "Entität", "Entidad", "Entità", "Entiteit", "Entidade", "Encja"],
    "Entités": ["Entities", "Entitäten", "Entidades", "Entità", "Entiteiten", "Entidades", "Encje"],
    "Chargement…": ["Loading…", "Wird geladen…", "Cargando…", "Caricamento…", "Laden…", "A carregar…", "Ładowanie…"],
    "Erreur": ["Error", "Fehler", "Error", "Errore", "Fout", "Erro", "Błąd"],
    "Fermer": ["Close", "Schließen", "Cerrar", "Chiudi", "Sluiten", "Fechar", "Zamknij"],
    "Annuler": ["Cancel", "Abbrechen", "Cancelar", "Annulla", "Annuleren", "Cancelar", "Anuluj"],
    "Enregistrer": ["Save", "Speichern", "Guardar", "Salva", "Opslaan", "Guardar", "Zapisz"],
    "Supprimer": ["Delete", "Löschen", "Eliminar", "Elimina", "Verwijderen", "Eliminar", "Usuń"],
    "Ajouter": ["Add", "Hinzufügen", "Añadir", "Aggiungi", "Toevoegen", "Adicionar", "Dodaj"],
    "Monter": ["Move up", "Nach oben", "Subir", "Sposta su", "Omhoog", "Mover para cima", "W górę"],
    "Descendre": ["Move down", "Nach unten", "Bajar", "Sposta giù", "Omlaag", "Mover para baixo", "W dół"],
    "Afficher le cadre de la carte": ["Show the card frame", "Kartenrahmen anzeigen", "Mostrar el marco de la tarjeta", "Mostra la cornice della scheda", "Kaartkader tonen", "Mostrar a moldura do cartão", "Pokaż ramkę karty"],
    "Indisponible": ["Unavailable", "Nicht verfügbar", "No disponible", "Non disponibile", "Niet beschikbaar", "Indisponível", "Niedostępne"],
    "Aujourd'hui": ["Today", "Heute", "Hoy", "Oggi", "Vandaag", "Hoje", "Dziś"],
    "Hier": ["Yesterday", "Gestern", "Ayer", "Ieri", "Gisteren", "Ontem", "Wczoraj"],
    "Demain": ["Tomorrow", "Morgen", "Mañana", "Domani", "Morgen", "Amanhã", "Jutro"],
    "Batterie": ["Battery", "Batterie", "Batería", "Batteria", "Batterij", "Bateria", "Bateria"],
    "Aucune donnée sur cette période.": ["No data for this period.", "Keine Daten für diesen Zeitraum.", "No hay datos en este periodo.", "Nessun dato per questo periodo.", "Geen gegevens voor deze periode.", "Sem dados neste período.", "Brak danych w tym okresie."],
    "à l'instant": ["just now", "gerade eben", "ahora mismo", "proprio ora", "zojuist", "agora mesmo", "przed chwilą"],
    "il y a {n} min": ["{n} min ago", "vor {n} Min.", "hace {n} min", "{n} min fa", "{n} min geleden", "há {n} min", "{n} min temu"],
    "il y a {n} h": ["{n} h ago", "vor {n} Std.", "hace {n} h", "{n} h fa", "{n} u geleden", "há {n} h", "{n} godz. temu"],
    "il y a {n} j": ["{n} d ago", "vor {n} T.", "hace {n} d", "{n} g fa", "{n} d geleden", "há {n} d", "{n} dni temu"],
    "Heure": ["Time", "Uhrzeit", "Hora", "Ora", "Tijd", "Hora", "Godzina"],
    "Lever du soleil": ["Sunrise", "Sonnenaufgang", "Amanecer", "Alba", "Zonsopkomst", "Nascer do sol", "Wschód słońca"],
    "Coucher du soleil": ["Sunset", "Sonnenuntergang", "Atardecer", "Tramonto", "Zonsondergang", "Pôr do sol", "Zachód słońca"],
    "Info": ["Info", "Info", "Info", "Info", "Info", "Info", "Info"],
    "Important": ["Important", "Wichtig", "Importante", "Importante", "Belangrijk", "Importante", "Ważne"],
    "Critique": ["Critical", "Kritisch", "Crítica", "Critica", "Kritiek", "Crítica", "Krytyczne"],
    "Écran": ["Screen", "Bildschirm", "Pantalla", "Schermo", "Scherm", "Ecrã", "Ekran"],
    "Programmes": ["Programmes", "Programme", "Programas", "Programmi", "Programma's", "Programas", "Programy"],
    "Notifier": ["Notify", "Benachrichtigen", "Notificar", "Notifica", "Melden", "Notificar", "Powiadom"],
    "Réglages": ["Settings", "Einstellungen", "Ajustes", "Impostazioni", "Instellingen", "Definições", "Ustawienia"],
    "Nouveau programme": ["New programme", "Neues Programm", "Nuevo programa", "Nuovo programma", "Nieuw programma", "Novo programa", "Nowy program"],
    "Toute la journée": ["All day", "Ganztägig", "Todo el día", "Tutto il giorno", "Hele dag", "Todo o dia", "Cały dzień"],
    "Le jour": ["Daytime", "Tagsüber", "De día", "Di giorno", "Overdag", "De dia", "W dzień"],
    "La nuit": ["Night-time", "Nachts", "De noche", "Di notte", "'s Nachts", "De noite", "W nocy"],
    "Matin": ["Morning", "Morgen", "Mañana", "Mattina", "Ochtend", "Manhã", "Rano"],
    "Soirée": ["Evening", "Abend", "Tarde-noche", "Sera", "Avond", "Noite", "Wieczór"],
    "lever": ["sunrise", "Sonnenaufgang", "amanecer", "alba", "zonsopkomst", "nascer do sol", "wschód"],
    "coucher": ["sunset", "Sonnenuntergang", "atardecer", "tramonto", "zonsondergang", "pôr do sol", "zachód"],
    "tous les jours": ["every day", "täglich", "todos los días", "tutti i giorni", "elke dag", "todos os dias", "codziennie"],
    "en semaine": ["weekdays", "werktags", "entre semana", "nei giorni feriali", "doordeweeks", "dias úteis", "w dni robocze"],
    "le week-end": ["weekends", "am Wochenende", "el fin de semana", "nel fine settimana", "in het weekend", "ao fim de semana", "w weekendy"],
    "aucun jour": ["no day", "kein Tag", "ningún día", "nessun giorno", "geen dag", "nenhum dia", "żaden dzień"],
    "toute la journée": ["all day", "ganztägig", "todo el día", "tutto il giorno", "hele dag", "todo o dia", "cały dzień"],
    "Tout": ["All", "Alle", "Todo", "Tutto", "Alles", "Tudo", "Wszystko"],
    "Capteurs": ["Sensors", "Sensoren", "Sensores", "Sensori", "Sensoren", "Sensores", "Czujniki"],
    "Météo": ["Weather", "Wetter", "Tiempo", "Meteo", "Weer", "Meteorologia", "Pogoda"],
    "Binaires": ["Binary", "Binär", "Binarios", "Binari", "Binair", "Binários", "Binarne"],
    "Climat": ["Climate", "Klima", "Clima", "Clima", "Klimaat", "Clima", "Klimat"],
    "Autres": ["Other", "Andere", "Otros", "Altri", "Overige", "Outros", "Inne"],
    "Température": ["Temperature", "Temperatur", "Temperatura", "Temperatura", "Temperatuur", "Temperatura", "Temperatura"],
    "Ressentie": ["Feels like", "Gefühlt", "Sensación", "Percepita", "Gevoelstemperatuur", "Sensação", "Odczuwalna"],
    "Humidité": ["Humidity", "Luftfeuchtigkeit", "Humedad", "Umidità", "Luchtvochtigheid", "Humidade", "Wilgotność"],
    "Pression": ["Pressure", "Luftdruck", "Presión", "Pressione", "Luchtdruk", "Pressão", "Ciśnienie"],
    "Vent": ["Wind", "Wind", "Viento", "Vento", "Wind", "Vento", "Wiatr"],
    "Rafales": ["Gusts", "Böen", "Ráfagas", "Raffiche", "Windstoten", "Rajadas", "Porywy"],
    "Direction du vent": ["Wind direction", "Windrichtung", "Dirección del viento", "Direzione del vento", "Windrichting", "Direção do vento", "Kierunek wiatru"],
    "Nuages": ["Clouds", "Wolken", "Nubes", "Nuvole", "Bewolking", "Nuvens", "Zachmurzenie"],
    "Indice UV": ["UV index", "UV-Index", "Índice UV", "Indice UV", "UV-index", "Índice UV", "Indeks UV"],
    "Visibilité": ["Visibility", "Sichtweite", "Visibilidad", "Visibilità", "Zicht", "Visibilidade", "Widoczność"],
    "Point de rosée": ["Dew point", "Taupunkt", "Punto de rocío", "Punto di rugiada", "Dauwpunt", "Ponto de orvalho", "Punkt rosy"],
    "Pluie": ["Rain", "Regen", "Lluvia", "Pioggia", "Regen", "Chuva", "Deszcz"],
    "Température actuelle": ["Current temperature", "Aktuelle Temperatur", "Temperatura actual", "Temperatura attuale", "Huidige temperatuur", "Temperatura atual", "Aktualna temperatura"],
    "Humidité actuelle": ["Current humidity", "Aktuelle Luftfeuchtigkeit", "Humedad actual", "Umidità attuale", "Huidige luchtvochtigheid", "Humidade atual", "Aktualna wilgotność"],
    "Action": ["Action", "Aktion", "Acción", "Azione", "Actie", "Ação", "Działanie"],
    "Luminosité": ["Brightness", "Helligkeit", "Brillo", "Luminosità", "Helderheid", "Brilho", "Jasność"],
    "Élévation": ["Elevation", "Höhe", "Elevación", "Elevazione", "Hoogte", "Elevação", "Wysokość"],
    "Azimut": ["Azimuth", "Azimut", "Acimut", "Azimut", "Azimut", "Azimute", "Azymut"],
    "Prochain lever": ["Next sunrise", "Nächster Sonnenaufgang", "Próximo amanecer", "Prossima alba", "Volgende zonsopkomst", "Próximo nascer do sol", "Następny wschód"],
    "Prochain coucher": ["Next sunset", "Nächster Sonnenuntergang", "Próximo atardecer", "Prossimo tramonto", "Volgende zonsondergang", "Próximo pôr do sol", "Następny zachód"],
    "Artiste": ["Artist", "Künstler", "Artista", "Artista", "Artiest", "Artista", "Wykonawca"],
    "Volume": ["Volume", "Lautstärke", "Volumen", "Volume", "Volume", "Volume", "Głośność"],
    "L'intégration est-elle installée ?": ["Is the integration installed?", "Ist die Integration installiert?", "¿Está instalada la integración?", "L'integrazione è installata?", "Is de integratie geïnstalleerd?", "A integração está instalada?", "Czy integracja jest zainstalowana?"],
    "Connexion au LaMetric…": ["Connecting to the LaMetric…", "Verbindung zum LaMetric…", "Conectando con el LaMetric…", "Connessione al LaMetric…", "Verbinden met de LaMetric…", "A ligar ao LaMetric…", "Łączenie z LaMetric…"],
    "Connecté": ["Connected", "Verbunden", "Conectado", "Connesso", "Verbonden", "Ligado", "Połączono"],
    "Injoignable": ["Unreachable", "Nicht erreichbar", "Inaccesible", "Non raggiungibile", "Onbereikbaar", "Inacessível", "Nieosiągalny"],
    "Mode nuit": ["Night mode", "Nachtmodus", "Modo noche", "Modalità notte", "Nachtmodus", "Modo noturno", "Tryb nocny"],
    "Programmes en pause": ["Programmes paused", "Programme pausiert", "Programas en pausa", "Programmi in pausa", "Programma's gepauzeerd", "Programas em pausa", "Programy wstrzymane"],
    "Aucun programme actif : écran d'attente": ["No active programme: idle screen", "Kein aktives Programm: Ruhebildschirm", "Ningún programa activo: pantalla de espera", "Nessun programma attivo: schermata di attesa", "Geen actief programma: wachtscherm", "Nenhum programa ativo: ecrã de espera", "Brak aktywnego programu: ekran oczekiwania"],
    "Auto": ["Auto", "Auto", "Auto", "Auto", "Auto", "Auto", "Auto"],
    "Appli précédente": ["Previous app", "Vorherige App", "App anterior", "App precedente", "Vorige app", "App anterior", "Poprzednia aplikacja"],
    "Appli suivante": ["Next app", "Nächste App", "App siguiente", "App successiva", "Volgende app", "App seguinte", "Następna aplikacja"],
    "File de notifications": ["Notification queue", "Benachrichtigungswarteschlange", "Cola de notificaciones", "Coda delle notifiche", "Meldingenwachtrij", "Fila de notificações", "Kolejka powiadomień"],
    "Tout effacer": ["Clear all", "Alle löschen", "Borrar todo", "Cancella tutto", "Alles wissen", "Limpar tudo", "Wyczyść wszystko"],
    "Jauge": ["Gauge", "Zielanzeige", "Indicador", "Indicatore", "Meter", "Indicador", "Wskaźnik"],
    "Graphique": ["Chart", "Diagramm", "Gráfico", "Grafico", "Grafiek", "Gráfico", "Wykres"],
    "Aucune notification en attente.": ["No pending notifications.", "Keine ausstehenden Benachrichtigungen.", "No hay notificaciones pendientes.", "Nessuna notifica in attesa.", "Geen wachtende meldingen.", "Sem notificações pendentes.", "Brak oczekujących powiadomień."],
    "logiciel": ["firmware", "Firmware", "firmware", "firmware", "firmware", "firmware", "oprogramowanie"],
    "My Data absente": ["My Data missing", "My Data fehlt", "My Data ausente", "My Data assente", "My Data ontbreekt", "My Data em falta", "Brak My Data"],
    "Aucun programme pour l'instant.": ["No programmes yet.", "Noch keine Programme.", "Aún no hay programas.", "Nessun programma per ora.", "Nog geen programma's.", "Ainda sem programas.", "Brak programów."],
    "Affichage continu": ["Continuous display", "Daueranzeige", "Visualización continua", "Visualizzazione continua", "Doorlopende weergave", "Apresentação contínua", "Ciągłe wyświetlanie"],
    "Notifications": ["Notifications", "Benachrichtigungen", "Notificaciones", "Notifiche", "Meldingen", "Notificações", "Powiadomienia"],
    "Notification": ["Notification", "Benachrichtigung", "Notificación", "Notifica", "Melding", "Notificação", "Powiadomienie"],
    "Nuit": ["Night", "Nacht", "Noche", "Notte", "Nacht", "Noite", "Noc"],
    "Désactiver": ["Disable", "Deaktivieren", "Desactivar", "Disattiva", "Uitschakelen", "Desativar", "Wyłącz"],
    "Activer": ["Enable", "Aktivieren", "Activar", "Attiva", "Inschakelen", "Ativar", "Włącz"],
    "en cours": ["running", "läuft", "en curso", "in corso", "actief", "em curso", "trwa"],
    "toutes les {n} min": ["every {n} min", "alle {n} Min.", "cada {n} min", "ogni {n} min", "elke {n} min", "a cada {n} min", "co {n} min"],
    "à chaque début de plage": ["at the start of each time slot", "zu Beginn jedes Zeitfensters", "al inicio de cada franja", "all'inizio di ogni fascia", "aan het begin van elk tijdvak", "no início de cada período", "na początku każdego przedziału"],
    "{n} écran": ["{n} screen", "{n} Bildschirm", "{n} pantalla", "{n} schermata", "{n} scherm", "{n} ecrã", "{n} ekran"],
    "{n} écrans": ["{n} screens", "{n} Bildschirme", "{n} pantallas", "{n} schermate", "{n} schermen", "{n} ecrãs", "{n} ekrany"],
    "{n} condition": ["{n} condition", "{n} Bedingung", "{n} condición", "{n} condizione", "{n} voorwaarde", "{n} condição", "{n} warunek"],
    "{n} conditions": ["{n} conditions", "{n} Bedingungen", "{n} condiciones", "{n} condizioni", "{n} voorwaarden", "{n} condições", "{n} warunki"],
    "Production solaire": ["Solar production", "Solarproduktion", "Producción solar", "Produzione solare", "Zonneproductie", "Produção solar", "Produkcja solarna"],
    "Températures": ["Temperatures", "Temperaturen", "Temperaturas", "Temperature", "Temperaturen", "Temperaturas", "Temperatury"],
    "Les programmes « affichage continu » alimentent l'appli My Data du LaMetric ; leurs écrans se suivent dans l'ordre de la liste.": ["\"Continuous display\" programmes feed the LaMetric's My Data app; their screens follow one another in list order.", "Programme mit „Daueranzeige“ speisen die My-Data-App des LaMetric; ihre Bildschirme folgen in der Reihenfolge der Liste.", "Los programas «visualización continua» alimentan la app My Data del LaMetric; sus pantallas se suceden en el orden de la lista.", "I programmi «visualizzazione continua» alimentano l'app My Data del LaMetric; le loro schermate si susseguono nell'ordine dell'elenco.", "Programma's met \"doorlopende weergave\" vullen de My Data-app van de LaMetric; hun schermen volgen elkaar op in de volgorde van de lijst.", "Os programas «apresentação contínua» alimentam a app My Data do LaMetric; os seus ecrãs sucedem-se pela ordem da lista.", "Programy „ciągłe wyświetlanie” zasilają aplikację My Data w LaMetric; ich ekrany następują po sobie w kolejności listy."],
    "Priorité": ["Priority", "Priorität", "Prioridad", "Priorità", "Prioriteit", "Prioridade", "Priorytet"],
    "Son": ["Sound", "Ton", "Sonido", "Suono", "Geluid", "Som", "Dźwięk"],
    "Répétitions": ["Repeats", "Wiederholungen", "Repeticiones", "Ripetizioni", "Herhalingen", "Repetições", "Powtórzenia"],
    "Envoyer": ["Send", "Senden", "Enviar", "Invia", "Verzenden", "Enviar", "Wyślij"],
    "Afficher dans My Data pendant": ["Show in My Data for", "In My Data anzeigen für", "Mostrar en My Data durante", "Mostra in My Data per", "In My Data tonen gedurende", "Mostrar no My Data durante", "Pokaż w My Data przez"],
    "Afficher": ["Show", "Anzeigen", "Mostrar", "Mostra", "Tonen", "Mostrar", "Pokaż"],
    "Les textes acceptent les modèles Home Assistant, par exemple {{ states('sensor.temperature_salon') }} °C. Une notification s'affiche par-dessus les applis puis disparaît.": ["Texts accept Home Assistant templates, for example {{ states('sensor.temperature_salon') }} °C. A notification appears over the apps, then disappears.", "Texte akzeptieren Home-Assistant-Templates, zum Beispiel {{ states('sensor.temperature_salon') }} °C. Eine Benachrichtigung erscheint über den Apps und verschwindet dann.", "Los textos admiten plantillas de Home Assistant, por ejemplo {{ states('sensor.temperature_salon') }} °C. Una notificación aparece sobre las apps y luego desaparece.", "I testi accettano i template di Home Assistant, ad esempio {{ states('sensor.temperature_salon') }} °C. Una notifica appare sopra le app e poi scompare.", "Teksten accepteren Home Assistant-sjablonen, bijvoorbeeld {{ states('sensor.temperature_salon') }} °C. Een melding verschijnt boven de apps en verdwijnt daarna.", "Os textos aceitam modelos do Home Assistant, por exemplo {{ states('sensor.temperature_salon') }} °C. Uma notificação aparece sobre as apps e depois desaparece.", "Teksty obsługują szablony Home Assistant, np. {{ states('sensor.temperature_salon') }} °C. Powiadomienie pojawia się nad aplikacjami, a potem znika."],
    "Programmes actifs (décochez pour tout mettre en pause)": ["Programmes active (turn off to pause everything)", "Programme aktiv (ausschalten, um alles anzuhalten)", "Programas activos (desactive para pausar todo)", "Programmi attivi (disattiva per mettere tutto in pausa)", "Programma's actief (uitschakelen om alles te pauzeren)", "Programas ativos (desative para pausar tudo)", "Programy aktywne (wyłącz, aby wstrzymać wszystko)"],
    "Écran d'attente": ["Idle screen", "Ruhebildschirm", "Pantalla de espera", "Schermata di attesa", "Wachtscherm", "Ecrã de espera", "Ekran oczekiwania"],
    "affiché dans My Data quand aucun programme n'est actif": ["shown in My Data when no programme is active", "wird in My Data angezeigt, wenn kein Programm aktiv ist", "se muestra en My Data cuando ningún programa está activo", "mostrata in My Data quando nessun programma è attivo", "getoond in My Data als geen programma actief is", "apresentado no My Data quando nenhum programa está ativo", "wyświetlany w My Data, gdy żaden program nie jest aktywny"],
    "Activer le mode nuit": ["Enable night mode", "Nachtmodus aktivieren", "Activar el modo noche", "Attiva la modalità notte", "Nachtmodus inschakelen", "Ativar o modo noturno", "Włącz tryb nocny"],
    "Notifications admises": ["Allowed notifications", "Zugelassene Benachrichtigungen", "Notificaciones permitidas", "Notifiche ammesse", "Toegestane meldingen", "Notificações permitidas", "Dozwolone powiadomienia"],
    "Importantes et critiques": ["Important and critical", "Wichtige und kritische", "Importantes y críticas", "Importanti e critiche", "Belangrijk en kritiek", "Importantes e críticas", "Ważne i krytyczne"],
    "Critiques seulement": ["Critical only", "Nur kritische", "Solo críticas", "Solo critiche", "Alleen kritiek", "Apenas críticas", "Tylko krytyczne"],
    "Luminosité la nuit": ["Night brightness", "Helligkeit nachts", "Brillo de noche", "Luminosità notturna", "Helderheid 's nachts", "Brilho à noite", "Jasność w nocy"],
    "inchangée": ["unchanged", "unverändert", "sin cambios", "invariata", "ongewijzigd", "inalterado", "bez zmian"],
    "Son par défaut": ["Default sound", "Standardton", "Sonido predeterminado", "Suono predefinito", "Standaardgeluid", "Som predefinido", "Domyślny dźwięk"],
    "Silence la nuit (sauf critiques)": ["Silent at night (except critical)", "Nachts stumm (außer kritische)", "Silencio de noche (salvo críticas)", "Silenzio di notte (tranne critiche)", "'s Nachts stil (behalve kritiek)", "Silêncio à noite (exceto críticas)", "Cisza w nocy (poza krytycznymi)"],
    "Appliquer aussi aux notifications des automatisations": ["Also apply to automation notifications", "Auch auf Benachrichtigungen von Automationen anwenden", "Aplicar también a las notificaciones de las automatizaciones", "Applica anche alle notifiche delle automazioni", "Ook toepassen op meldingen van automatiseringen", "Aplicar também às notificações das automatizações", "Stosuj także do powiadomień z automatyzacji"],
    "Renvoyer l'écran": ["Resend screen", "Bildschirm erneut senden", "Reenviar la pantalla", "Reinvia la schermata", "Scherm opnieuw sturen", "Reenviar o ecrã", "Wyślij ekran ponownie"],
    "Appareil": ["Device", "Gerät", "Dispositivo", "Dispositivo", "Apparaat", "Dispositivo", "Urządzenie"],
    "Adresse": ["Address", "Adresse", "Dirección", "Indirizzo", "Adres", "Endereço", "Adres"],
    "Mode des applis": ["App mode", "App-Modus", "Modo de las apps", "Modalità app", "App-modus", "Modo das apps", "Tryb aplikacji"],
    "Défilement auto": ["Auto scroll", "Automatisch wechseln", "Desplazamiento automático", "Scorrimento automatico", "Automatisch wisselen", "Rotação automática", "Automatyczne przewijanie"],
    "Manuel": ["Manual", "Manuell", "Manual", "Manuale", "Handmatig", "Manual", "Ręczny"],
    "Planning LaMetric": ["LaMetric schedule", "LaMetric-Zeitplan", "Horario LaMetric", "Pianificazione LaMetric", "LaMetric-planning", "Agendamento LaMetric", "Harmonogram LaMetric"],
    "Kiosque": ["Kiosk", "Kiosk", "Quiosco", "Chiosco", "Kiosk", "Quiosque", "Kiosk"],
    "Économiseur": ["Screensaver", "Bildschirmschoner", "Salvapantallas", "Salvaschermo", "Schermbeveiliging", "Proteção de ecrã", "Wygaszacz"],
    "Appli My Data": ["My Data app", "My-Data-App", "App My Data", "App My Data", "My Data-app", "App My Data", "Aplikacja My Data"],
    "introuvable — installez « My Data DIY » en HTTP Push": ["not found — install \"My Data DIY\" in HTTP Push mode", "nicht gefunden — „My Data DIY“ im HTTP-Push-Modus installieren", "no encontrada — instale «My Data DIY» en HTTP Push", "non trovata — installa «My Data DIY» in HTTP Push", "niet gevonden — installeer \"My Data DIY\" in HTTP Push", "não encontrada — instale «My Data DIY» em HTTP Push", "nie znaleziono — zainstaluj „My Data DIY” w trybie HTTP Push"],
    "Version": ["Version", "Version", "Versión", "Versione", "Versie", "Versão", "Wersja"],
    "Aucun": ["None", "Keiner", "Ninguno", "Nessuno", "Geen", "Nenhum", "Brak"],
    "Alarmes": ["Alarms", "Alarme", "Alarmas", "Allarmi", "Alarmen", "Alarmes", "Alarmy"],
    "Décalage en minutes": ["Offset in minutes", "Versatz in Minuten", "Desfase en minutos", "Scostamento in minuti", "Verschuiving in minuten", "Desfasamento em minutos", "Przesunięcie w minutach"],
    "Choisir une entité": ["Choose an entity", "Entität wählen", "Elegir una entidad", "Scegli un'entità", "Kies een entiteit", "Escolher uma entidade", "Wybierz encję"],
    "Retirer": ["Remove", "Entfernen", "Quitar", "Rimuovi", "Verwijderen", "Remover", "Usuń"],
    "Valeur à utiliser": ["Value to use", "Zu verwendender Wert", "Valor a usar", "Valore da usare", "Te gebruiken waarde", "Valor a usar", "Wartość do użycia"],
    "État": ["State", "Zustand", "Estado", "Stato", "Status", "Estado", "Stan"],
    "Aucune entité.": ["No entities.", "Keine Entitäten.", "Ninguna entidad.", "Nessuna entità.", "Geen entiteiten.", "Nenhuma entidade.", "Brak encji."],
    "Rechercher par nom, pièce ou identifiant…": ["Search by name, room or ID…", "Nach Name, Raum oder ID suchen…", "Buscar por nombre, estancia o ID…", "Cerca per nome, stanza o ID…", "Zoeken op naam, ruimte of ID…", "Pesquisar por nome, divisão ou ID…", "Szukaj po nazwie, pomieszczeniu lub ID…"],
    "Choisir une icône": ["Choose an icon", "Symbol wählen", "Elegir un icono", "Scegli un'icona", "Kies een pictogram", "Escolher um ícone", "Wybierz ikonę"],
    "Entité (facultatif)": ["Entity (optional)", "Entität (optional)", "Entidad (opcional)", "Entità (facoltativa)", "Entiteit (optioneel)", "Entidade (opcional)", "Encja (opcjonalnie)"],
    "Texte": ["Text", "Text", "Texto", "Testo", "Tekst", "Texto", "Tekst"],
    "sur": ["over", "über", "en", "su", "over", "em", "z"],
    "barres": ["bars", "Balken", "barras", "barre", "staven", "barras", "słupków"],
    "Début": ["Start", "Start", "Inicio", "Inizio", "Begin", "Início", "Początek"],
    "Objectif": ["Goal", "Ziel", "Objetivo", "Obiettivo", "Doel", "Objetivo", "Cel"],
    "unité": ["unit", "Einheit", "unidad", "unità", "eenheid", "unidade", "jednostka"],
    "{value} {unit} (vide = valeur + unité)": ["{value} {unit} (empty = value + unit)", "{value} {unit} (leer = Wert + Einheit)", "{value} {unit} (vacío = valor + unidad)", "{value} {unit} (vuoto = valore + unità)", "{value} {unit} (leeg = waarde + eenheid)", "{value} {unit} (vazio = valor + unidade)", "{value} {unit} (puste = wartość + jednostka)"],
    "Texte, ou modèle {{ states('sensor.x') }}": ["Text, or template {{ states('sensor.x') }}", "Text oder Template {{ states('sensor.x') }}", "Texto o plantilla {{ states('sensor.x') }}", "Testo o template {{ states('sensor.x') }}", "Tekst of sjabloon {{ states('sensor.x') }}", "Texto ou modelo {{ states('sensor.x') }}", "Tekst lub szablon {{ states('sensor.x') }}"],
    "Décimales": ["Decimals", "Nachkommastellen", "Decimales", "Decimali", "Decimalen", "Casas decimais", "Miejsca po przecinku"],
    "Masquer si zéro": ["Hide if zero", "Bei null ausblenden", "Ocultar si es cero", "Nascondi se zero", "Verbergen als nul", "Ocultar se zero", "Ukryj, gdy zero"],
    "Ajouter un écran": ["Add a screen", "Bildschirm hinzufügen", "Añadir una pantalla", "Aggiungi una schermata", "Scherm toevoegen", "Adicionar um ecrã", "Dodaj ekran"],
    "dans l'appli My Data": ["in the My Data app", "in der My-Data-App", "en la app My Data", "nell'app My Data", "in de My Data-app", "na app My Data", "w aplikacji My Data"],
    "à intervalle régulier": ["at regular intervals", "in regelmäßigen Abständen", "a intervalos regulares", "a intervalli regolari", "met regelmatige tussenpozen", "em intervalos regulares", "w regularnych odstępach"],
    "Écrans": ["Screens", "Bildschirme", "Pantallas", "Schermate", "Schermen", "Ecrãs", "Ekrany"],
    "Quand": ["When", "Wann", "Cuándo", "Quando", "Wanneer", "Quando", "Kiedy"],
    "Semaine": ["Weekdays", "Werktage", "Semana", "Feriali", "Werkdagen", "Semana", "Dni robocze"],
    "Week-end": ["Weekend", "Wochenende", "Fin de semana", "Weekend", "Weekend", "Fim de semana", "Weekend"],
    "Tous": ["All", "Alle", "Todos", "Tutti", "Alle", "Todos", "Wszystkie"],
    "Toute la journée.": ["All day.", "Ganztägig.", "Todo el día.", "Tutto il giorno.", "Hele dag.", "Todo o dia.", "Cały dzień."],
    "Ajouter une plage": ["Add a time slot", "Zeitfenster hinzufügen", "Añadir una franja", "Aggiungi una fascia", "Tijdvak toevoegen", "Adicionar um período", "Dodaj przedział"],
    "Conditions": ["Conditions", "Bedingungen", "Condiciones", "Condizioni", "Voorwaarden", "Condições", "Warunki"],
    "toutes doivent être vraies": ["all must be true", "alle müssen erfüllt sein", "todas deben cumplirse", "devono essere tutte vere", "alle moeten waar zijn", "todas têm de ser verdadeiras", "wszystkie muszą być spełnione"],
    "valeur": ["value", "Wert", "valor", "valore", "waarde", "valor", "wartość"],
    "Ajouter une condition": ["Add a condition", "Bedingung hinzufügen", "Añadir una condición", "Aggiungi una condizione", "Voorwaarde toevoegen", "Adicionar uma condição", "Dodaj warunek"],
    "Soleil levé": ["Sun up", "Sonne aufgegangen", "Sol arriba", "Sole alto", "Zon op", "Sol nascido", "Słońce nad horyzontem"],
    "Quelqu'un à la maison": ["Someone home", "Jemand zu Hause", "Alguien en casa", "Qualcuno in casa", "Iemand thuis", "Alguém em casa", "Ktoś w domu"],
    "Toutes les (min)": ["Every (min)", "Alle (Min.)", "Cada (min)", "Ogni (min)", "Elke (min)", "A cada (min)", "Co (min)"],
    "0 = une seule fois à chaque début de plage": ["0 = only once at the start of each time slot", "0 = nur einmal zu Beginn jedes Zeitfensters", "0 = una sola vez al inicio de cada franja", "0 = una sola volta all'inizio di ogni fascia", "0 = één keer aan het begin van elk tijdvak", "0 = apenas uma vez no início de cada período", "0 = tylko raz na początku każdego przedziału"],
    "Durée max (s)": ["Max duration (s)", "Max. Dauer (s)", "Duración máx. (s)", "Durata max (s)", "Max. duur (s)", "Duração máx. (s)", "Maks. czas (s)"],
    "0 = jusqu'à la fin de l'affichage": ["0 = until the end of the display", "0 = bis zum Ende der Anzeige", "0 = hasta el final de la visualización", "0 = fino alla fine della visualizzazione", "0 = tot het einde van de weergave", "0 = até ao fim da apresentação", "0 = do końca wyświetlania"],
    "Pictogramme": ["Pictogram", "Piktogramm", "Pictograma", "Pittogramma", "Pictogram", "Pictograma", "Piktogram"],
    "Alerte": ["Alert", "Warnung", "Alerta", "Avviso", "Waarschuwing", "Alerta", "Alert"],
    "Intervalle à 0 : une notification à chaque début de plage. Le mode nuit filtre ces notifications.": ["Interval at 0: one notification at the start of each time slot. Night mode filters these notifications.", "Intervall 0: eine Benachrichtigung zu Beginn jedes Zeitfensters. Der Nachtmodus filtert diese Benachrichtigungen.", "Intervalo en 0: una notificación al inicio de cada franja. El modo noche filtra estas notificaciones.", "Intervallo a 0: una notifica all'inizio di ogni fascia. La modalità notte filtra queste notifiche.", "Interval op 0: één melding aan het begin van elk tijdvak. De nachtmodus filtert deze meldingen.", "Intervalo a 0: uma notificação no início de cada período. O modo noturno filtra estas notificações.", "Interwał 0: jedno powiadomienie na początku każdego przedziału. Tryb nocny filtruje te powiadomienia."],
    "Tester": ["Test", "Testen", "Probar", "Prova", "Testen", "Testar", "Testuj"],
    "actuel :": ["current:", "aktuell:", "actual:", "attuale:", "huidig:", "atual:", "obecnie:"],
    "Recherche…": ["Searching…", "Suche…", "Buscando…", "Ricerca…", "Zoeken…", "A pesquisar…", "Wyszukiwanie…"],
    "{n} icône": ["{n} icon", "{n} Symbol", "{n} icono", "{n} icona", "{n} pictogram", "{n} ícone", "{n} ikona"],
    "{n} icônes": ["{n} icons", "{n} Symbole", "{n} iconos", "{n} icone", "{n} pictogrammen", "{n} ícones", "{n} ikon"],
    "sur {t}": ["of {t}", "von {t}", "de {t}", "su {t}", "van {t}", "de {t}", "z {t}"],
    "Icône LaMetric": ["LaMetric icon", "LaMetric-Symbol", "Icono LaMetric", "Icona LaMetric", "LaMetric-pictogram", "Ícone LaMetric", "Ikona LaMetric"],
    "Rechercher (en anglais : sun, solar, battery, car…)": ["Search (in English: sun, solar, battery, car…)", "Suchen (auf Englisch: sun, solar, battery, car…)", "Buscar (en inglés: sun, solar, battery, car…)", "Cerca (in inglese: sun, solar, battery, car…)", "Zoeken (in het Engels: sun, solar, battery, car…)", "Pesquisar (em inglês: sun, solar, battery, car…)", "Szukaj (po angielsku: sun, solar, battery, car…)"],
    "OK": ["OK", "OK", "OK", "OK", "OK", "OK", "OK"],
    "Sans icône": ["No icon", "Ohne Symbol", "Sin icono", "Senza icona", "Geen pictogram", "Sem ícone", "Bez ikony"],
    "Galerie LaMetric": ["LaMetric gallery", "LaMetric-Galerie", "Galería LaMetric", "Galleria LaMetric", "LaMetric-galerij", "Galeria LaMetric", "Galeria LaMetric"],
    "Ajoutez au moins un écran": ["Add at least one screen", "Mindestens einen Bildschirm hinzufügen", "Añada al menos una pantalla", "Aggiungi almeno una schermata", "Voeg minstens één scherm toe", "Adicione pelo menos um ecrã", "Dodaj co najmniej jeden ekran"],
    "Programme enregistré": ["Programme saved", "Programm gespeichert", "Programa guardado", "Programma salvato", "Programma opgeslagen", "Programa guardado", "Program zapisany"],
    "Supprimer le programme « {n} » ?": ["Delete the programme \"{n}\"?", "Programm „{n}“ löschen?", "¿Eliminar el programa «{n}»?", "Eliminare il programma «{n}»?", "Programma \"{n}\" verwijderen?", "Eliminar o programa «{n}»?", "Usunąć program „{n}”?"],
    "Envoyé au LaMetric": ["Sent to the LaMetric", "An den LaMetric gesendet", "Enviado al LaMetric", "Inviato al LaMetric", "Naar de LaMetric verzonden", "Enviado para o LaMetric", "Wysłano do LaMetric"],
    "Affiché dans My Data pendant {n} min": ["Shown in My Data for {n} min", "{n} Min. in My Data angezeigt", "Mostrado en My Data durante {n} min", "Mostrato in My Data per {n} min", "{n} min in My Data getoond", "Apresentado no My Data durante {n} min", "Wyświetlane w My Data przez {n} min"],
    "Réglages enregistrés": ["Settings saved", "Einstellungen gespeichert", "Ajustes guardados", "Impostazioni salvate", "Instellingen opgeslagen", "Definições guardadas", "Ustawienia zapisane"],
    "Écran renvoyé": ["Screen resent", "Bildschirm erneut gesendet", "Pantalla reenviada", "Schermata reinviata", "Scherm opnieuw verzonden", "Ecrã reenviado", "Ekran wysłany ponownie"],
    "Affichage": ["Display", "Anzeige", "Visualización", "Visualizzazione", "Weergave", "Apresentação", "Widok"],
    "Complet (onglets)": ["Full (tabs)", "Vollständig (Tabs)", "Completo (pestañas)", "Completo (schede)", "Volledig (tabbladen)", "Completo (separadores)", "Pełny (karty)"],
    "Écran seul (aperçu + réglages rapides)": ["Screen only (preview + quick settings)", "Nur Anzeige (Vorschau + Schnelleinstellungen)", "Solo pantalla (vista previa + ajustes rápidos)", "Solo schermo (anteprima + impostazioni rapide)", "Alleen scherm (voorbeeld + snelle instellingen)", "Apenas ecrã (pré-visualização + definições rápidas)", "Tylko ekran (podgląd + szybkie ustawienia)"],
    "Onglet à l'ouverture": ["Tab on opening", "Tab beim Öffnen", "Pestaña al abrir", "Scheda all'apertura", "Tabblad bij openen", "Separador ao abrir", "Karta przy otwarciu"],
    "Écran, programmes d'affichage, notifications et réglages du LaMetric Time": ["Screen, display programmes, notifications and settings of the LaMetric Time", "Anzeige, Anzeigeprogramme, Benachrichtigungen und Einstellungen des LaMetric Time", "Pantalla, programas de visualización, notificaciones y ajustes del LaMetric Time", "Schermo, programmi di visualizzazione, notifiche e impostazioni del LaMetric Time", "Scherm, weergaveprogramma's, meldingen en instellingen van de LaMetric Time", "Ecrã, programas de apresentação, notificações e definições do LaMetric Time", "Ekran, programy wyświetlania, powiadomienia i ustawienia LaMetric Time"]
  };
  let LANG = "fr", NUMLOC = "fr-FR";
  const langOf = (hass, c) => { const l = String((c && c.language) || (hass && ((hass.locale && hass.locale.language) || hass.language)) || navigator.language || "en").toLowerCase().split(/[-_]/)[0]; return l === "fr" || HOLM_LANGS.includes(l) ? l : "en"; };
  const setLang = (hass, c) => { LANG = langOf(hass, c); const p = hass && hass.locale && hass.locale.language; NUMLOC = !(c && c.language) && p && p.toLowerCase().startsWith(LANG) ? p : LOCALES[LANG]; return LANG; };
  const _ = (s, v) => { let o = LANG === "fr" ? s : ((I18N[s] && I18N[s][HOLM_LANGS.indexOf(LANG)]) || s); if (v) for (const k in v) o = o.split("{" + k + "}").join(v[k]); return o; };
  // champ « Langue » pour les éditeurs visuels (ha-form)
  const langField = () => ({ name: "language", selector: { select: { mode: "dropdown", options: [{ value: "", label: _("Automatique (profil)") }, ...Object.entries(LANG_NAMES).map(([value, label]) => ({ value, label }))] } } });
  // traduit les titres de sections et les libellés d'options d'un schéma ha-form (écrits en français)
  const locSchema = (sc) => (sc || []).map((x) => { const o = { ...x }; if (o.title) o.title = _(o.title); if (o.schema) o.schema = locSchema(o.schema);
    if (o.selector && o.selector.select && o.name !== "language") o.selector = { ...o.selector, select: { ...o.selector.select, options: (o.selector.select.options || []).map((op) => (typeof op === "string" ? op : { ...op, label: _(op.label) })) } };
    if (o.name === "language" && o.selector && o.selector.select) o.selector = { ...o.selector, select: { ...o.selector.select, options: o.selector.select.options.map((op) => (op.value ? op : { ...op, label: _("Automatique (profil)") })) } };
    return o; });
const VERSION = "1.2.0";
// Garde la position de défilement pendant un nouveau rendu complet de la carte (iPhone / iPad : WebKit n'a pas de
// « scroll anchoring » et la page remontait d'un coup). On fige la hauteur de la carte et on remet le défilement en place.
const keepScroll = (host, fn) => {
  const saved = [];
  let n = host;
  while (n) {
    n = n.assignedSlot || n.parentNode || n.host;
    if (n && n.nodeType === 1 && n.scrollHeight > n.clientHeight) saved.push([n, n.scrollTop]);
  }
  const se = document.scrollingElement;
  if (se) saved.push([se, se.scrollTop]);
  const h = host.offsetHeight;
  if (h) host.style.minHeight = `${h}px`;
  try { return fn(); } finally {
    const restore = () => saved.forEach(([el, t]) => { if (Math.abs(el.scrollTop - t) > 1) el.scrollTop = t; });
    restore();
    requestAnimationFrame(() => { restore(); host.style.minHeight = ""; requestAnimationFrame(restore); });
    setTimeout(() => { host.style.minHeight = ""; }, 500);   // page en arrière-plan : pas d'image affichée, donc pas de requestAnimationFrame
  }
};

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clone = (o) => JSON.parse(JSON.stringify(o));
const fold = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "");
const _T = (o) => new Proxy(o, { get: (t, k) => { const v = t[k]; return typeof v === "string" ? _(v) : v && typeof v === "object" ? _T(v) : v; } });
const _wd = (i, f) => new Date(2024, 0, 1 + i).toLocaleDateString(NUMLOC, { weekday: f });
const DAYS = { map: (fn) => [0, 1, 2, 3, 4, 5, 6].map((i) => fn(_wd(i, "narrow"), i)) };
const DAYS_LONG = new Proxy({}, { get: (t, i) => _wd(+i, "long") });
const KIND = _T({ time: _("Heure"), sunrise: _("Lever du soleil"), sunset: _("Coucher du soleil") });
const PRIO = _T({ info: _("Info"), warning: _("Important"), critical: _("Critique") });
const OPS = { eq: "=", ne: "≠", gt: ">", lt: "<", ge: "≥", le: "≤" };
const TABS = _T([["screen", "mdi:television", _("Écran")], ["programmes", "mdi:calendar-clock", _("Programmes")], ["notify", "mdi:message-text", _("Notifier")], ["settings", "mdi:cog", _("Réglages")]]);

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
  name: _("Nouveau programme"), enabled: true, mode: "app", frames: [blankFrame()], days: [0, 1, 2, 3, 4, 5, 6], windows: [], conditions: [],
  notification: { interval: 30, priority: "info", icon_type: "none", sound: "", repeat: 1, cycles: 1, lifetime: 0 }, ...over,
});
const WINDOW_PRESETS = _T([
  [_("Toute la journée"), []],
  [_("Le jour"), [{ from: { kind: "sunrise", offset: 30 }, to: { kind: "sunset", offset: -30 } }]],
  [_("La nuit"), [{ from: { kind: "sunset", offset: 0 }, to: { kind: "sunrise", offset: 0 } }]],
  [_("Matin"), [{ from: { kind: "time", time: "06:30", offset: 0 }, to: { kind: "time", time: "09:00", offset: 0 } }]],
  [_("Soirée"), [{ from: { kind: "time", time: "18:00", offset: 0 }, to: { kind: "time", time: "22:30", offset: 0 } }]],
]);
const fmtSpec = (s) => (!s ? "?" : s.kind === "time" ? (s.time || "00:00") : `${s.kind === "sunrise" ? _("lever") : _("coucher")}${s.offset ? (s.offset > 0 ? " +" : " ") + s.offset + " min" : ""}`);
const fmtDays = (d) => {
  const s = [...(d || [])].sort();
  if (s.length === 7) return _("tous les jours");
  if (s.join() === "0,1,2,3,4") return _("en semaine");
  if (s.join() === "5,6") return _("le week-end");
  if (!s.length) return _("aucun jour");
  return s.map((i) => _wd(i, "short")).join(", ");
};
const fmtWindows = (w) => (!w || !w.length ? _("toute la journée") : w.map((x) => `${fmtSpec(x.from)} → ${fmtSpec(x.to)}`).join(", "));
const DOMAIN_ICON = { sensor: "mdi:eye", binary_sensor: "mdi:checkbox-blank-circle-outline", weather: "mdi:weather-partly-cloudy", climate: "mdi:thermostat",
  light: "mdi:lightbulb", switch: "mdi:toggle-switch", cover: "mdi:window-shutter", person: "mdi:account", sun: "mdi:white-balance-sunny", input_number: "mdi:ray-vertex",
  input_boolean: "mdi:toggle-switch-outline", input_select: "mdi:format-list-bulleted", input_text: "mdi:form-textbox", number: "mdi:ray-vertex", counter: "mdi:counter",
  select: "mdi:format-list-bulleted", media_player: "mdi:speaker", device_tracker: "mdi:map-marker", zone: "mdi:map-marker-radius", fan: "mdi:fan", lock: "mdi:lock", vacuum: "mdi:robot-vacuum" };
const ENT_FILTERS = _T([["all", _("Tout")], ["sensor", _("Capteurs")], ["weather", _("Météo")], ["binary_sensor", _("Binaires")], ["climate", _("Climat")], ["other", _("Autres")]]);
const ATTR_FR = _T({ temperature: _("Température"), apparent_temperature: _("Ressentie"), humidity: _("Humidité"), pressure: _("Pression"), wind_speed: _("Vent"), wind_gust_speed: _("Rafales"),
  wind_bearing: _("Direction du vent"), cloud_coverage: _("Nuages"), uv_index: _("Indice UV"), visibility: _("Visibilité"), dew_point: _("Point de rosée"), precipitation: _("Pluie"),
  current_temperature: _("Température actuelle"), current_humidity: _("Humidité actuelle"), hvac_action: _("Action"), brightness: _("Luminosité"), battery_level: _("Batterie"),
  elevation: _("Élévation"), azimuth: _("Azimut"), next_rising: _("Prochain lever"), next_setting: _("Prochain coucher"), media_title: _("Titre"), media_artist: _("Artiste"), volume_level: _("Volume") });
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
    { const l = setLang(h, this._c); if (!first && this._lang && l !== this._lang) { this._lang = l; this._render(); if (this._ed) this._drawEditor(); } this._lang = l; }
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
    return keepScroll(this, () => this._renderNow());
  }
  _renderNow() {
    const root = this.shadowRoot && this.shadowRoot.getElementById("main");
    if (!root) return;
    if (this._typing() || this._sliding) { this._dirty = true; return; }
    this._lang = setLang(this._hass, this._c);
    this._dirty = false;
    const s = this._s;
    if (!s) { root.innerHTML = `<div class="empty">${this._err ? `HOLM LaMetric : ${esc(this._err)}<br>${_("L'intégration est-elle installée ?")}` : _("Connexion au LaMetric…")}</div>`; return; }
    const compact = this._c.view === "screen";
    const nOn = (s.state.active || []).length;
    root.innerHTML = `
      ${compact ? "" : `<div class="hd"><div class="tt"><ha-icon icon="mdi:dots-grid"></ha-icon>${esc(this._c.title)}<i class="dot ${s.available ? "ok" : "ko"}" title="${s.available ? _("Connecté") : _("Injoignable")}"></i></div>
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
        ${st.night ? `<span class="chip night"><ha-icon icon="mdi:weather-night"></ha-icon>${_("Mode nuit")}</span>` : ""}
        ${!s.settings.engine ? `<span class="chip off"><ha-icon icon="mdi:pause-circle"></ha-icon>${_("Programmes en pause")}</span>` : act.length ? act.map((p) => `<span class="chip on"><ha-icon icon="${p.mode === "app" ? "mdi:view-carousel" : "mdi:message-badge"}"></ha-icon>${esc(p.name)}</span>`).join("") : `<span class="chip">${_("Aucun programme actif : écran d'attente")}</span>`}
        ${cur ? `<span class="chip cur"><ha-icon icon="mdi:eye"></ha-icon>${esc(cur.title)}</span>` : ""}
      </div>
      ${st.error ? `<div class="warn"><ha-icon icon="mdi:alert"></ha-icon>${esc(st.error)}</div>` : ""}
      <div class="ctl">
        <label class="row"><ha-icon icon="mdi:brightness-6"></ha-icon><input type="range" ${range(d.brightness_range)} value="${d.brightness ?? 0}" data-dev="brightness"><b>${d.brightness ?? "–"}%</b>
          <button class="mini ${d.brightness_mode === "auto" ? "otn" : ""}" data-a="dev" data-k="brightness_mode" data-v="${d.brightness_mode === "auto" ? "manual" : "auto"}">${_("Auto")}</button></label>
        <label class="row"><ha-icon icon="mdi:volume-high"></ha-icon><input type="range" ${range(d.volume_range)} value="${d.volume ?? 0}" data-dev="volume"><b>${d.volume ?? "–"}%</b>
          <button class="mini ${d.bluetooth ? "otn" : ""}" data-a="dev" data-k="bluetooth" data-v="${d.bluetooth ? "0" : "1"}" title="Bluetooth"><ha-icon icon="mdi:bluetooth"></ha-icon></button></label>
      </div>
      <div class="bar">
        <button class="ib" data-a="dev" data-k="prev" title="${_("Appli précédente")}"><ha-icon icon="mdi:skip-previous"></ha-icon></button>
        <div class="apps">${s.widgets.map((w) => `<button class="app ${w.visible ? "otn" : ""}" data-a="activate" data-p="${esc(w.package)}" data-w="${esc(w.widget)}">${esc(w.title)}</button>`).join("")}</div>
        <button class="ib" data-a="dev" data-k="next" title="${_("Appli suivante")}"><ha-icon icon="mdi:skip-next"></ha-icon></button>
      </div>
      ${compact ? "" : `
      <div class="sec"><b>${_("File de notifications")}</b>${s.queue.length ? `<button class="lnk" data-a="dev" data-k="dismiss_all">${_("Tout effacer")}</button>` : ""}</div>
      ${s.queue.length ? `<div class="queue">${s.queue.map((n) => {
        const fr = ((n.model || {}).frames || [])[0] || {};
        return `<div class="qi"><span class="pr ${n.priority}">${PRIO[n.priority] || n.priority}</span><span class="qt">${esc(fr.text || (fr.goalData ? _("Jauge") : fr.chartData ? _("Graphique") : ""))}</span><button class="ib sm" data-a="dev" data-k="dismiss" data-v="${esc(n.id)}"><ha-icon icon="mdi:close"></ha-icon></button></div>`;
      }).join("")}</div>` : `<div class="muted pad">${_("Aucune notification en attente.")}</div>`}
      <div class="foot muted">${esc(d.name || "LaMetric")} · ${esc(d.model || "")} · ${_("logiciel")} ${esc(d.os_version || "?")} · Wi-Fi ${d.wifi ?? "?"}% · <span>${st.widget ? `My Data ${esc(String(st.widget).slice(0, 8))}…` : _("My Data absente")}</span></div>`}`;
  }

  _programmes() {
    const s = this._s, tl = s.timeline || { programmes: {}, night: [] };
    const now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes();
    const pct = (m) => `${(Math.max(0, Math.min(1440, m)) / 14.4).toFixed(3)}%`;
    const rows = s.programmes.map((p) => `<div class="tlr ${p.enabled ? "" : "dis"}"><span class="tln">${esc(p.name)}</span><div class="tlb">${(tl.programmes[p.id] || []).map(([a, b]) => `<i class="seg m-${p.mode}" style="left:${pct(a)};width:${pct(b - a)}"></i>`).join("")}</div></div>`).join("");
    const sun = (tl.sun || []).map((m, i) => (m == null ? "" : `<i class="sun" style="left:${pct(m)}" title="${i ? _("Coucher du soleil") : _("Lever du soleil")}"><ha-icon icon="${i ? "mdi:weather-sunset-down" : "mdi:weather-sunset-up"}"></ha-icon></i>`)).join("");
    return `
      <div class="timeline">
        <div class="tlh">${[0, 3, 6, 9, 12, 15, 18, 21, 24].map((h) => `<span style="left:${pct(h * 60)}">${h}h</span>`).join("")}${sun}</div>
        <div class="tlbody"><div class="ovl">${(tl.night || []).map(([a, b]) => `<i class="nightb" style="left:${pct(a)};width:${pct(b - a)}"></i>`).join("")}<i class="now" style="left:${pct(nowMin)}"></i></div>${rows || `<div class="muted pad">${_("Aucun programme pour l'instant.")}</div>`}</div>
        <div class="legend"><span><i class="seg m-app"></i>${_("Affichage continu")}</span><span><i class="seg m-notification"></i>${_("Notifications")}</span>${(tl.night || []).length ? `<span><i class="nightb"></i>${_("Nuit")}</span>` : ""}</div>
      </div>
      <div class="plist">${s.programmes.map((p, i) => {
        const on = (s.state.active || []).includes(p.id);
        return `<div class="prog ${p.enabled ? "" : "dis"} ${on ? "act" : ""}">
          <button class="sw ${p.enabled ? "otn" : ""}" data-a="ptoggle" data-id="${p.id}" title="${p.enabled ? _("Désactiver") : _("Activer")}"><i></i></button>
          <div class="pi" data-a="edit" data-id="${p.id}"><b>${esc(p.name)}${on ? ` <span class="live">${_("en cours")}</span>` : ""}</b>
            <span>${p.mode === "app" ? `<ha-icon icon="mdi:view-carousel"></ha-icon>${_("Affichage continu")}` : `<ha-icon icon="mdi:message-badge"></ha-icon>${_("Notification")} ${+p.notification.interval ? _("toutes les {n} min", { n: p.notification.interval }) : _("à chaque début de plage")}`} · ${_(p.frames.length > 1 ? _("{n} écrans") : _("{n} écran"), { n: p.frames.length })}</span>
            <span><ha-icon icon="mdi:clock-outline"></ha-icon>${fmtDays(p.days)}, ${esc(fmtWindows(p.windows))}${p.conditions.length ? " · " + _(p.conditions.length > 1 ? _("{n} conditions") : _("{n} condition"), { n: p.conditions.length }) : ""}</span></div>
          <div class="pa"><button class="ib sm" data-a="move" data-id="${p.id}" data-v="-1" ${i ? "" : "disabled"}><ha-icon icon="mdi:chevron-up"></ha-icon></button>
          <button class="ib sm" data-a="move" data-id="${p.id}" data-v="1" ${i < s.programmes.length - 1 ? "" : "disabled"}><ha-icon icon="mdi:chevron-down"></ha-icon></button>
          <button class="ib sm" data-a="edit" data-id="${p.id}"><ha-icon icon="mdi:pencil"></ha-icon></button></div></div>`;
      }).join("")}</div>
      <div class="bar"><button class="pill main" data-a="new"><ha-icon icon="mdi:plus"></ha-icon>${_("Nouveau programme")}</button>
        <button class="pill" data-a="new" data-v="solar"><ha-icon icon="mdi:solar-power"></ha-icon>${_("Production solaire")}</button>
        <button class="pill" data-a="new" data-v="temp"><ha-icon icon="mdi:thermometer"></ha-icon>${_("Températures")}</button></div>
      <div class="hint">${_("Les programmes « affichage continu » alimentent l'appli My Data du LaMetric ; leurs écrans se suivent dans l'ordre de la liste.")}</div>`;
  }

  _notify() {
    const n = this._nt, snd = this._s.sounds;
    return `
      ${this._led("nt")}
      ${this._framesEditor(n.frames, "nt", "frames")}
      <div class="grid3">
        <label>${_("Priorité")}<select data-s="nt" data-p="priority">${Object.entries(PRIO).map(([k, v]) => `<option value="${k}" ${n.priority === k ? "selected" : ""}>${v}</option>`).join("")}</select></label>
        <label>${_("Son")}${this._soundSelect("nt", "sound", n.sound, snd)}</label>
        <label>${_("Répétitions")}<input type="number" min="0" max="50" data-s="nt" data-p="cycles" data-t="num" value="${n.cycles}"></label>
      </div>
      <div class="bar"><button class="pill main" data-a="send"><ha-icon icon="mdi:send"></ha-icon>${_("Envoyer")}</button>
        <span class="sp"></span><label class="inl">${_("Afficher dans My Data pendant")} <input type="number" class="num" min="0.5" step="0.5" data-s="nt" data-p="minutes" data-t="num" value="${n.minutes}"> min</label>
        <button class="pill" data-a="pushnt"><ha-icon icon="mdi:monitor-arrow-down"></ha-icon>${_("Afficher")}</button></div>
      <div class="hint">${_("Les textes acceptent les modèles Home Assistant, par exemple {{ states('sensor.temperature_salon') }} °C. Une notification s'affiche par-dessus les applis puis disparaît.")}</div>`;
  }

  _settings() {
    const st = this._st || this._s.settings, n = st.night, s = this._s;
    return `
      <div class="sec"><b>${_("Programmes")}</b></div>
      <label class="tg"><button class="sw ${st.engine ? "otn" : ""}" data-a="stoggle" data-p="engine"><i></i></button>${_("Programmes actifs (décochez pour tout mettre en pause)")}</label>
      <div class="sec"><b>${_("Écran d'attente")}</b><span class="muted">${_("affiché dans My Data quand aucun programme n'est actif")}</span></div>
      ${this._framesEditor(st.idle, "st", "idle", true)}
      <div class="sec"><b>${_("Mode nuit")}</b></div>
      <label class="tg"><button class="sw ${n.enabled ? "otn" : ""}" data-a="stoggle" data-p="night.enabled"><i></i></button>${_("Activer le mode nuit")}</label>
      <div class="win">${this._spec("st", "night.from", n.from)}<ha-icon icon="mdi:arrow-right"></ha-icon>${this._spec("st", "night.to", n.to)}</div>
      <div class="grid3">
        <label>${_("Notifications admises")}<select data-s="st" data-p="night.min_priority"><option value="warning" ${n.min_priority === "warning" ? "selected" : ""}>${_("Importantes et critiques")}</option><option value="critical" ${n.min_priority !== "warning" ? "selected" : ""}>${_("Critiques seulement")}</option></select></label>
        <label>${_("Luminosité la nuit")}<input type="number" min="0" max="100" placeholder="${_("inchangée")}" data-s="st" data-p="night.brightness" data-t="numnull" value="${n.brightness ?? ""}"></label>
        <label>${_("Son par défaut")}${this._soundSelect("st", "default_sound", st.default_sound, s.sounds)}</label>
      </div>
      <label class="tg"><button class="sw ${n.mute ? "otn" : ""}" data-a="stoggle" data-p="night.mute"><i></i></button>${_("Silence la nuit (sauf critiques)")}</label>
      <label class="tg"><button class="sw ${n.apply_to_notify ? "otn" : ""}" data-a="stoggle" data-p="night.apply_to_notify"><i></i></button>${_("Appliquer aussi aux notifications des automatisations")}</label>
      <div class="bar"><button class="pill main" data-a="ssave"><ha-icon icon="mdi:content-save"></ha-icon>${_("Enregistrer")}</button>
        <button class="pill" data-a="push"><ha-icon icon="mdi:refresh"></ha-icon>${_("Renvoyer l'écran")}</button>
        <button class="pill" data-a="sreset">${_("Annuler")}</button></div>
      <div class="sec"><b>${_("Appareil")}</b></div>
      <div class="kv"><span>${_("Nom")}</span><b>${esc(s.device.name || "")}</b><span>${_("Adresse")}</span><b>${esc(s.device.host)}</b><span>${_("Mode des applis")}</span>
        <b><select data-dev="mode">${["auto", "manual", "schedule", "kiosk"].map((m) => `<option value="${m}" ${s.device.mode === m ? "selected" : ""}>${{ auto: _("Défilement auto"), manual: _("Manuel"), schedule: _("Planning LaMetric"), kiosk: _("Kiosque") }[m]}</option>`).join("")}</select></b>
        <span>${_("Économiseur")}</span><b><button class="sw ${(s.device.screensaver || {}).enabled ? "otn" : ""}" data-a="dev" data-k="screensaver" data-v="${(s.device.screensaver || {}).enabled ? "0" : "1"}"><i></i></button></b>
        <span>${_("Appli My Data")}</span><b>${s.state.widget ? esc(s.state.widget) : _("introuvable — installez « My Data DIY » en HTTP Push")}</b><span>${_("Version")}</span><b>HOLM LaMetric ${esc(s.version)}</b></div>`;
  }

  // ---------------------------------------------------------------- éléments d'édition réutilisables
  _soundSelect(scope, path, val, snd) {
    const opt = (v) => `<option value="${v}" ${val === v ? "selected" : ""}>${v}</option>`;
    return `<select data-s="${scope}" data-p="${path}"><option value="">${_("Aucun")}</option><optgroup label="${_("Notifications")}">${snd.notifications.map(opt).join("")}</optgroup><optgroup label="${_("Alarmes")}">${snd.alarms.map(opt).join("")}</optgroup></select>`;
  }
  _spec(scope, path, sp) {
    sp = sp || { kind: "time", time: "00:00", offset: 0 };
    return `<span class="spec"><select data-s="${scope}" data-p="${path}.kind" data-r="1">${Object.entries(KIND).map(([k, v]) => `<option value="${k}" ${sp.kind === k ? "selected" : ""}>${v}</option>`).join("")}</select>
      ${sp.kind === "time" ? `<input type="time" data-s="${scope}" data-p="${path}.time" value="${esc(sp.time || "00:00")}">` : `<input type="number" class="num" step="5" data-s="${scope}" data-p="${path}.offset" data-t="num" value="${sp.offset || 0}" title="${_("Décalage en minutes")}"><small>min</small>`}</span>`;
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
    return `<button class="entb ${value ? "" : "empty"}" data-a="epick" data-s="${scope}" data-p="${path}" title="${esc(value || _("Choisir une entité"))}">
      <ha-icon icon="${i ? i.icon : "mdi:magnify"}"></ha-icon><span>${value ? `<b>${esc(i ? i.name : value)}</b><small>${esc(value)}${i && i.area ? " · " + esc(i.area) : ""}</small>` : `<b>${esc(placeholder)}</b>`}</span>
      ${value ? `<i class="ex" data-a="eclear" data-s="${scope}" data-p="${path}" title="${_("Retirer")}">×</i>` : ""}</button>`;
  }
  _attrSel(scope, path, entity, value, numericOnly) {
    const st = this._hass.states[entity];
    if (!st) return "";
    const attrs = Object.entries(st.attributes).filter(([k, v]) => !ATTR_SKIP.has(k) && v != null && typeof v !== "object" && (!numericOnly || !isNaN(parseFloat(v))));
    if (!attrs.length) return "";
    const lbl = (k, v) => `${ATTR_FR[k] || k} (${String(v).slice(0, 18)})`;
    return `<select class="attr" data-s="${scope}" data-p="${path}" title="${_("Valeur à utiliser")}"><option value="">${_("État")} (${esc(String(st.state).slice(0, 18))})</option>${attrs.map(([k, v]) => `<option value="${esc(k)}" ${value === k ? "selected" : ""}>${esc(lbl(k, v))}</option>`).join("")}</select>`;
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
    out.sort((a, b) => a[0] - b[0] || a[1].name.localeCompare(b[1].name, LANG));
    return out.slice(0, 120).map((x) => x[1]);
  }
  _drawEnts(listOnly) {
    setLang(this._hass, this._c);
    let box = this.shadowRoot.getElementById("entpick");
    if (!this._ep) { if (box) box.remove(); return; }
    const ep = this._ep, res = this._entResults();
    const list = `<div class="elist">${res.map((i) => `<button class="erow" data-a="eset" data-v="${esc(i.id)}"><ha-icon icon="${esc(i.icon)}"></ha-icon><span><b>${esc(i.name)}</b><small>${esc(i.id)}${i.area ? " · " + esc(i.area) : ""}</small></span><em>${esc(i.state)}</em></button>`).join("") || `<div class="muted pad">${_("Aucune entité.")}</div>`}</div>`;
    if (listOnly && box) {
      box.querySelector(".el").innerHTML = list;
      box.querySelectorAll(".efil button").forEach((b) => b.classList.toggle("otn", b.dataset.v === ep.f));
      return;
    }
    if (!box) { box = document.createElement("div"); box.id = "entpick"; this.shadowRoot.appendChild(box); }
    box.innerHTML = `<div class="ov top" data-a="eclose-bg"><div class="mdl small"><div class="mh"><b>${_("Choisir une entité")}</b><button class="ib" data-a="eclose"><ha-icon icon="mdi:close"></ha-icon></button></div>
      <div class="mb"><input class="grow wide" id="eq" placeholder="${_("Rechercher par nom, pièce ou identifiant…")}" value="${esc(ep.q)}">
        <div class="efil">${ENT_FILTERS.map(([k, l]) => `<button class="mini ${ep.f === k ? "otn" : ""}" data-a="efil" data-v="${k}">${l}</button>`).join("")}</div>
        <div class="el">${list}</div></div></div></div>`;
    const q = box.querySelector("#eq");
    q.addEventListener("input", () => { ep.q = q.value; clearTimeout(this._eqT); this._eqT = setTimeout(() => this._drawEnts(true), 120); });
    q.focus();
  }
  _framesEditor(frames, scope, base, textOnly = false) {
    const ic = (f, i) => `<button class="icb" data-a="icon" data-s="${scope}" data-p="${base}.${i}.icon" title="${_("Choisir une icône")}">${iconUrl(f.icon) ? `<img src="${esc(iconUrl(f.icon))}" referrerpolicy="no-referrer">` : `<ha-icon icon="mdi:image-plus"></ha-icon>`}</button>`;
    return `<div class="frames">${(frames || []).map((f, i) => {
      const t = f.type || "text", p = `${base}.${i}`;
      const ent = this._entBtn(scope, `${p}.entity`, f.entity, _("Entité (facultatif)")) + (f.entity ? this._attrSel(scope, `${p}.attribute`, f.entity, f.attribute, t !== "text") : "");
      return `<div class="frame"><div class="fh"><span class="fn">${i + 1}</span>
        ${textOnly ? "" : `<select data-s="${scope}" data-a2="ftype" data-p="${p}.type" data-r="1"><option value="text" ${t === "text" ? "selected" : ""}>${_("Texte")}</option><option value="goal" ${t === "goal" ? "selected" : ""}>${_("Jauge")}</option><option value="chart" ${t === "chart" ? "selected" : ""}>${_("Graphique")}</option></select>`}
        <span class="sp"></span>
        <button class="ib sm" data-a="fmove" data-s="${scope}" data-b="${base}" data-i="${i}" data-v="-1" ${i ? "" : "disabled"}><ha-icon icon="mdi:chevron-up"></ha-icon></button>
        <button class="ib sm" data-a="fdel" data-s="${scope}" data-b="${base}" data-i="${i}"><ha-icon icon="mdi:delete-outline"></ha-icon></button></div>
        <div class="fb">${t === "chart" ? `${ent}<label class="inl">${_("sur")} <input type="number" class="num" min="1" max="168" data-s="${scope}" data-p="${p}.hours" data-t="num" value="${f.hours || 12}"> h</label><label class="inl"><input type="number" class="num" min="4" max="36" data-s="${scope}" data-p="${p}.points" data-t="num" value="${f.points || 16}"> ${_("barres")}</label>`
          : t === "goal" ? `${ic(f, i)}${ent}<input type="number" class="num" data-s="${scope}" data-p="${p}.start" data-t="num" value="${f.start ?? 0}" title="${_("Début")}"><input type="number" class="num" data-s="${scope}" data-p="${p}.end" data-t="num" value="${f.end ?? 100}" title="${_("Objectif")}"><input class="num" placeholder="${_("unité")}" data-s="${scope}" data-p="${p}.unit" value="${esc(f.unit || "")}">`
          : `${ic(f, i)}<input class="grow" placeholder="${f.entity ? _("{value} {unit} (vide = valeur + unité)") : _("Texte, ou modèle {{ states('sensor.x') }}")}" data-s="${scope}" data-p="${p}.text" value="${esc(f.text || "")}">${textOnly ? "" : ent}`}</div>
        ${!textOnly && t !== "chart" && f.entity ? `<div class="fo">${t === "text" ? `<label class="inl">${_("Décimales")} <input type="number" class="num" min="0" max="3" data-s="${scope}" data-p="${p}.decimals" data-t="numnull" value="${f.decimals ?? ""}"></label>` : ""}
          <label class="inl"><input type="checkbox" data-s="${scope}" data-p="${p}.hide_if_zero" data-t="bool" ${f.hide_if_zero ? "checked" : ""}>${_("Masquer si zéro")}</label></div>` : ""}</div>`;
    }).join("")}</div>
    <div class="bar"><button class="pill" data-a="fadd" data-s="${scope}" data-b="${base}"><ha-icon icon="mdi:plus"></ha-icon>${_("Ajouter un écran")}</button></div>`;
  }

  // ---------------------------------------------------------------- éditeur de programme (fenêtre)
  _openEditor(p) {
    this._ed = { p: clone(p) };
    this._edPrev = [];
    this._drawEditor();
    this._preview("ed");
  }
  _drawEditor() {
    setLang(this._hass, this._c);
    const m = this.shadowRoot.getElementById("modal");
    if (!this._ed) { m.innerHTML = ""; return; }
    const p = this._ed.p, nc = p.notification, s = this._s;
    const keepScroll = m.querySelector(".mb") ? m.querySelector(".mb").scrollTop : 0;
    m.innerHTML = `<div class="ov" data-a="close-bg"><div class="mdl" role="dialog">
      <div class="mh"><input class="title" data-s="ed" data-p="name" value="${esc(p.name)}"><button class="ib" data-a="close"><ha-icon icon="mdi:close"></ha-icon></button></div>
      <div class="mb">
        ${this._led("ed")}
        <div class="seg2"><button class="${p.mode === "app" ? "otn" : ""}" data-a="emode" data-v="app"><ha-icon icon="mdi:view-carousel"></ha-icon>${_("Affichage continu")}<small>${_("dans l'appli My Data")}</small></button>
          <button class="${p.mode === "notification" ? "otn" : ""}" data-a="emode" data-v="notification"><ha-icon icon="mdi:message-badge"></ha-icon>${_("Notification")}<small>${_("à intervalle régulier")}</small></button></div>
        <div class="sec"><b>${_("Écrans")}</b></div>
        ${this._framesEditor(p.frames, "ed", "frames")}
        <div class="sec"><b>${_("Quand")}</b></div>
        <div class="days">${DAYS.map((d, i) => `<button class="day ${p.days.includes(i) ? "otn" : ""}" data-a="eday" data-v="${i}" title="${DAYS_LONG[i]}">${d}</button>`).join("")}
          <button class="lnk" data-a="edays" data-v="0,1,2,3,4">${_("Semaine")}</button><button class="lnk" data-a="edays" data-v="5,6">${_("Week-end")}</button><button class="lnk" data-a="edays" data-v="0,1,2,3,4,5,6">${_("Tous")}</button></div>
        <div class="presets">${WINDOW_PRESETS.map(([l], i) => `<button class="mini" data-a="epreset" data-v="${i}">${l}</button>`).join("")}</div>
        ${p.windows.length ? p.windows.map((w, i) => `<div class="win">${this._spec("ed", `windows.${i}.from`, w.from)}<ha-icon icon="mdi:arrow-right"></ha-icon>${this._spec("ed", `windows.${i}.to`, w.to)}<button class="ib sm" data-a="wdel" data-i="${i}"><ha-icon icon="mdi:delete-outline"></ha-icon></button></div>`).join("") : `<div class="muted pad">${_("Toute la journée.")}</div>`}
        <div class="bar"><button class="pill" data-a="wadd"><ha-icon icon="mdi:plus"></ha-icon>${_("Ajouter une plage")}</button></div>
        <div class="sec"><b>${_("Conditions")}</b><span class="muted">${_("toutes doivent être vraies")}</span></div>
        ${p.conditions.map((c, i) => `<div class="cond">${this._entBtn("ed", `conditions.${i}.entity`, c.entity, _("Entité"))}${c.entity ? this._attrSel("ed", `conditions.${i}.attribute`, c.entity, c.attribute, false) : ""}
          <select data-s="ed" data-p="conditions.${i}.op">${Object.entries(OPS).map(([k, v]) => `<option value="${k}" ${c.op === k ? "selected" : ""}>${v}</option>`).join("")}</select>
          <input class="num2" placeholder="${_("valeur")}" data-s="ed" data-p="conditions.${i}.value" value="${esc(c.value ?? "")}"><span class="cv">${esc(this._stateOf(c.entity, c.attribute))}</span>
          <button class="ib sm" data-a="cdel" data-i="${i}"><ha-icon icon="mdi:delete-outline"></ha-icon></button></div>`).join("")}
        <div class="bar"><button class="pill" data-a="cadd"><ha-icon icon="mdi:plus"></ha-icon>${_("Ajouter une condition")}</button>
          <button class="mini" data-a="cpreset" data-v="above_horizon">${_("Soleil levé")}</button><button class="mini" data-a="cpreset" data-v="home">${_("Quelqu'un à la maison")}</button></div>
        ${p.mode === "notification" ? `<div class="sec"><b>${_("Notification")}</b></div>
        <div class="grid3">
          <label>${_("Toutes les (min)")}<input type="number" min="0" data-s="ed" data-p="notification.interval" data-t="num" value="${nc.interval}" title="${_("0 = une seule fois à chaque début de plage")}"></label>
          <label>${_("Priorité")}<select data-s="ed" data-p="notification.priority">${Object.entries(PRIO).map(([k, v]) => `<option value="${k}" ${nc.priority === k ? "selected" : ""}>${v}</option>`).join("")}</select></label>
          <label>${_("Son")}${this._soundSelect("ed", "notification.sound", nc.sound, s.sounds)}</label>
          <label>${_("Répétitions")}<input type="number" min="0" max="50" data-s="ed" data-p="notification.cycles" data-t="num" value="${nc.cycles}"></label>
          <label>${_("Durée max (s)")}<input type="number" min="0" data-s="ed" data-p="notification.lifetime" data-t="num" value="${nc.lifetime || 0}" title="${_("0 = jusqu'à la fin de l'affichage")}"></label>
          <label>${_("Pictogramme")}<select data-s="ed" data-p="notification.icon_type"><option value="none" ${nc.icon_type === "none" ? "selected" : ""}>${_("Aucun")}</option><option value="info" ${nc.icon_type === "info" ? "selected" : ""}>${_("Info")}</option><option value="alert" ${nc.icon_type === "alert" ? "selected" : ""}>${_("Alerte")}</option></select></label>
        </div><div class="hint">${_("Intervalle à 0 : une notification à chaque début de plage. Le mode nuit filtre ces notifications.")}</div>` : ""}
      </div>
      <div class="mf">${p.id ? `<button class="pill danger" data-a="edel"><ha-icon icon="mdi:delete"></ha-icon>${_("Supprimer")}</button>` : ""}<span class="sp"></span>
        <button class="pill" data-a="etest"><ha-icon icon="mdi:send"></ha-icon>${_("Tester")}</button>
        <button class="pill main" data-a="esave"><ha-icon icon="mdi:content-save"></ha-icon>${_("Enregistrer")}</button></div>
    </div></div>`;
    const mb = m.querySelector(".mb");
    if (mb) mb.scrollTop = keepScroll;
    this._mount();
  }
  _stateOf(e, attr) {
    const st = e && this._hass.states[e];
    if (!st) return "";
    return `${_("actuel :")} ${attr ? (st.attributes[attr] ?? "–") : st.state}`;
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
    setLang(this._hass, this._c);
    let box = this.shadowRoot.getElementById("icons");
    if (!this._ip) { if (box) box.remove(); return; }
    const ip = this._ip;
    const cur = getPath(this._scope(ip.scope), ip.path) || "";
    const list = `${ip.err ? `<div class="warn">${esc(ip.err)}</div>` : ""}<div class="igrid">${ip.list.map((i) => `<button class="ii ${cur === i.code ? "otn" : ""}" data-a="ipick" data-v="${esc(i.code)}" title="${esc(i.title)} (${esc(i.code)})"><img src="${esc(i.thumb)}" loading="lazy" referrerpolicy="no-referrer"><span>${esc(i.title)}</span></button>`).join("")}</div>
      <div class="muted pad">${ip.busy ? _("Recherche…") : _(ip.list.length > 1 ? _("{n} icônes") : _("{n} icône"), { n: ip.list.length }) + (ip.total ? " " + _("sur {t}", { t: ip.total }) : "")}</div>`;
    if (listOnly && box) { box.querySelector(".il").innerHTML = list; return; }
    if (!box) { box = document.createElement("div"); box.id = "icons"; this.shadowRoot.appendChild(box); }
    box.innerHTML = `<div class="ov top" data-a="iclose-bg"><div class="mdl small"><div class="mh"><b>${_("Icône LaMetric")}</b><button class="ib" data-a="iclose"><ha-icon icon="mdi:close"></ha-icon></button></div>
      <div class="mb"><div class="bar"><input class="grow" id="iq" placeholder="${_("Rechercher (en anglais : sun, solar, battery, car…)")}" value="${esc(ip.q)}">
        <input class="num2" id="icode" placeholder="i1234" value="${esc(cur)}"><button class="pill" data-a="icode">${_("OK")}</button></div>
        <div class="il">${list}</div></div>
      <div class="mf"><button class="pill" data-a="ipick" data-v="">${_("Sans icône")}</button><span class="sp"></span><a class="lnk" href="https://developer.lametric.com/icons" target="_blank" rel="noreferrer">${_("Galerie LaMetric")}</a></div></div></div>`;
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
          if (!this._ed.p.frames.length) throw new Error(_("Ajoutez au moins un écran"));
          await this._ws("programme/save", { programme: this._ed.p });
          this._ed = null; this._drawEditor(); this._toast(_("Programme enregistré"));
          break;
        }
        case "edel":
          if (!confirm(_("Supprimer le programme « {n} » ?", { n: this._ed.p.name }))) return;
          await this._ws("programme/delete", { programme_id: this._ed.p.id });
          this._ed = null; this._drawEditor(); break;
        case "etest": {
          const nc = this._ed.p.notification;
          await this._ws("send", { frames: this._ed.p.frames, priority: nc.priority || "info", icon_type: nc.icon_type || "none", sound: nc.sound || null, cycles: +nc.cycles || 1 });
          this._toast(_("Envoyé au LaMetric")); break;
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
          this._toast(_("Envoyé au LaMetric")); break;
        }
        case "pushnt": {
          const data = { frames: this._nt.frames, minutes: +this._nt.minutes || 5 };
          if (s.entry_id) data.device = s.entry_id;
          await this._hass.callService("lametric_holm", "push_frames", data);
          this._toast(_("Affiché dans My Data pendant {n} min", { n: data.minutes })); break;
        }
        case "stoggle": { const p = el.dataset.p; setPath(this._st, p, !getPath(this._st, p)); if (p === "engine") await this._ws("settings", { changes: { engine: this._st.engine } }); this._render(); break; }
        case "ssave": await this._ws("settings", { changes: this._st }); this._toast(_("Réglages enregistrés")); break;
        case "sreset": this._st = clone(s.settings); this._render(); break;
        case "push": { const r = await this._ws("push"); this._toast(r.error ? r.error : _("Écran renvoyé"), !!r.error); break; }
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
        name: _("Production solaire"),
        frames: [{ type: "text", icon: "", entity: pv || "", text: "", decimals: 0, hide_if_zero: true }, ...(day ? [{ type: "text", icon: "", entity: day, text: "{value} kWh", decimals: 1 }] : []), ...(pv ? [{ type: "chart", entity: pv, hours: 12, points: 16 }] : [])],
        windows: clone(WINDOW_PRESETS[1][1]),
      });
    }
    if (kind === "temp") {
      const t = Object.keys(st).filter((e) => e.startsWith("sensor.") && st[e].attributes.device_class === "temperature").slice(0, 2);
      return newProgramme({ name: _("Températures"), frames: (t.length ? t : [""]).map((e) => ({ type: "text", icon: "", entity: e, text: "", decimals: 1 })) });
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
  set hass(h) { this._hass = h; if (this._c && setLang(h, this._c) !== this._lang) this._draw(); }
  _draw() {
    this._lang = setLang(this._hass, this._c);
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
      <label>${_("Langue")}${sel("language", [["", _("Automatique (profil)")], ...Object.entries(LANG_NAMES)])}</label>
      <label>${_("Titre")}<input data-k="title" value="${esc(c.title || "LaMetric")}"></label>
      <label>${_("Affichage")}${sel("view", [["full", _("Complet (onglets)")], ["screen", _("Écran seul (aperçu + réglages rapides)")]])}</label>
      <label>${_("Onglet à l'ouverture")}${sel("tab", [["screen", _("Écran")], ["programmes", _("Programmes")], ["notify", _("Notifier")], ["settings", _("Réglages")]])}</label>
      <label class="ck"><input type="checkbox" data-k="show_frame" ${c.show_frame === false ? "" : "checked"}> ${_("Afficher le cadre de la carte")}</label>`;
  }
}

if (!customElements.get("holm-lametric-card")) customElements.define("holm-lametric-card", HolmLaMetricCard);
if (!customElements.get("holm-lametric-card-editor")) customElements.define("holm-lametric-card-editor", HolmLaMetricCardEditor);
window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === "holm-lametric-card")) {
  setLang(document.querySelector("home-assistant")?.hass);
  window.customCards.push({ type: "holm-lametric-card", name: "HOLM – LaMetric", description: _("Écran, programmes d'affichage, notifications et réglages du LaMetric Time"), preview: false });
}
console.info(`%c HOLM LaMetric %c ${VERSION} `, "background:#0abfbf;color:#0b1416;font-weight:700;border-radius:4px 0 0 4px;padding:2px 6px", "background:#1b2a2e;color:#fff;border-radius:0 4px 4px 0;padding:2px 6px");
})();
