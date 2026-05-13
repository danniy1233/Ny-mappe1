# Fitness Randomizer Web App (GitHub Pages)

Denne version er lavet til gratis hosting pa GitHub Pages og bruger kun lokal lagring i browseren (`localStorage`).

## Features

- Stort ovelsesbibliotek
- Favoritter (gemmes lokalt)
- Filtrering pa udstyr og kropsomrader
- Random workout-generator med antal ovelser, sets og reps
- Workout-historik (gemmes lokalt)

## Kernefiler

- `docs/index.html`
- `docs/styles.css`
- `docs/exercises.js`
- `docs/app.js`
- `docs/config.js`

## Koer lokalt

1. Abn `docs/index.html` direkte i browseren.
2. Eller brug en lokal webserver (anbefalet):
   - `python -m http.server 8080`
   - abn `http://localhost:8080/docs/`

## Deploy pa GitHub Pages

1. Push projektet til et GitHub repo.
2. Gaa til `Settings` -> `Pages`.
3. Under `Build and deployment` vaelg:
   - `Source`: `Deploy from a branch`
   - `Branch`: `main`
   - `Folder`: `/docs`
4. Gem, og vent 1-2 min.
5. Din app kommer pa:
   - `https://<brugernavn>.github.io/<repo-navn>/`

## Lokal lagring (ingen cloud-krav)

- Favoritter, filtre og workout-historik gemmes pa den enkelte enhed i browseren.
- Data synkroniseres ikke mellem devices.
- Hvis browserdata ryddes, forsvinder data.

## API setup (ExerciseDB + Muscle Visualizer)

Du kan skifte fra lokal data til API-data i `docs/config.js`.

1. Sæt `dataSource` til `"exercisedb"`.
2. Sæt `exerciseDbEndpoint` til dit endpoint.
3. Hvis endpoint er via RapidAPI, udfyld `exerciseDbApiKey` og `exerciseDbApiHost`.
4. Vælg billedmode:
   - `imageMode: "exercise"` for API-media (GIF/billeder fra exercise API)
   - `imageMode: "muscle"` for anatomiske billeder via template
5. Hvis du bruger anatomiske billeder, udfyld `muscleVisualizerTemplate` med placeholders:
   - `{primaryMuscle}`
   - `{bodyArea}`
   - `{exerciseName}`

## Bemarkning

Den gamle SwiftUI-version ligger stadig i `FitnessRandomizer/`, men web-versionen i `docs/` er nu den anbefalede losning til iPhone uden Xcode-krav.
