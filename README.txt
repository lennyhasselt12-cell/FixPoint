FIXPOINT – iPhone-App (erste Version)

WAS ENTHALTEN IST
- Aufträge anlegen, bearbeiten und löschen
- Automatische Auftragsnummern FP-001, FP-002 usw.
- Kunden-/Geräteinfos, Fehlerbeschreibung und Notizen
- Statusverwaltung, Kosten und Ersatzteile
- Bis zu vier komprimierte Fotos pro Auftrag
- Suche und Statusfilter
- JSON-Backup exportieren und importieren
- Offline-Unterstützung nach dem ersten Laden

WICHTIG ZUM SPEICHER
Die Aufträge werden lokal im Browser auf diesem iPhone gespeichert (IndexedDB).
Sie werden NICHT automatisch mit einem anderen Gerät synchronisiert.
Wenn Safari-Websitedaten gelöscht werden oder das Gerät verloren geht, können Daten
verloren gehen. Deshalb regelmäßig über „Backup“ exportieren und die Datei sicher
aufbewahren. Ein Backup kann Kundendaten und Fotos enthalten – nicht öffentlich teilen.

INSTALLATION AUF DEM IPHONE
Eine PWA lässt sich nicht direkt aus einer ZIP-Datei als App installieren.
Die Dateien müssen zuerst auf einen HTTPS-Webserver hochgeladen werden.
Danach:
1. Die veröffentlichte HTTPS-Adresse in Safari öffnen.
2. Auf „Teilen“ tippen.
3. „Zum Home-Bildschirm“ auswählen.
4. „Als Web-App öffnen“ ggf. aktiviert lassen und „Hinzufügen“ tippen.

LOKAL TESTEN
Für die Installation als PWA ist HTTPS nötig. Ein einfacher lokaler Test kann über
einen Entwicklungsserver erfolgen; die PWA-Installation funktioniert dabei nur mit
localhost oder HTTPS.

HINWEIS
Dies ist ein erster Prototyp, keine geprüfte Auftrags- oder Buchhaltungssoftware.
Vor echten Kundenaufträgen rechtliche Fragen, Einwilligung zur Speicherung von
Kontaktdaten/Fotos und sichere Datensicherung klären.
