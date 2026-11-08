# Training Insights

Kostenloses, responsives Trainingsdashboard als statische Website.

## Sofort testen
`index.html` per Doppelklick öffnen. Daten bleiben im Browser (LocalStorage).

## Kostenlos veröffentlichen
1. Kostenloses GitHub-Konto anlegen.
2. Neues öffentliches Repository erstellen, z. B. `training-insights`.
3. `index.html`, `style.css` und `app.js` hochladen.
4. Settings > Pages > Deploy from a branch > `main` / root.
5. Danach ist die Seite unter `https://DEINNAME.github.io/training-insights/` erreichbar.

## Daten importieren
JSON: Array mit Feldern `date`, `sport`, `distance`, `duration`, `hr`, `load`; alternativ Objekt mit `activities`.
CSV-Kopfzeile: `date,sport,distance,duration,hr,load`

## KI-Auswertung
Unter "Daten & Verbindungen" die KI-JSON exportieren und in eine KI hochladen. Alternativ unter "KI-Analyse" den vorbereiteten Prompt kopieren. Die lokale Analyse funktioniert vollständig ohne Server.

## Strava produktiv anbinden
Eine Strava API App anlegen. Der OAuth-Code muss auf einer Serverfunktion gegen Tokens getauscht werden. Client Secret und Refresh Token nie im Browsercode speichern. Geeignet sind kostenlose Kontingente von Cloudflare Workers, Netlify Functions oder Vercel Functions. Callback-URL und Client-ID müssen anschließend konfiguriert werden.

## Garmin produktiv anbinden
Für persönliche Nutzung Garmins persönliche Developer-Zugangsmöglichkeit prüfen. Als robuste Alternative Garmin-Exportdateien beziehungsweise FIT/GPX/TCX-Dateien importieren. Dieses Starterpaket importiert CSV/JSON; FIT-Parsing kann serverseitig oder mit einer JS-Bibliothek ergänzt werden.

## Datenschutz
Eine öffentliche URL darf keine sensiblen Trainings- oder Gesundheitsdaten direkt ausliefern. Für KI-Zugriff besser einen zeitlich begrenzten, anonymisierten JSON-Export verwenden. Bei einer echten Verbindung Tokens serverseitig verschlüsseln und eine Löschfunktion vorsehen.
