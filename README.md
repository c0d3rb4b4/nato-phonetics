# NATO Phonetics

Learn the NATO spelling alphabet, turn a phrase into code words, and practise the letters or digits you miss. The app runs on Android, iOS and the web. Preferences and learning progress stay on the device. [App guide](docs/APP_GUIDE.md) · [Privacy policy](PRIVACY.md)

For an installable Android build, download the development APK from [GitHub Releases](https://github.com/c0d3rb4b4/nato-phonetics/releases).

## Run locally

Use Node **22.23.0** and npm **10.9.4**. From the repository root, install the locked dependencies and start the web app.

```sh
npm ci
npm run web
```

Open the URL printed by the server. For native development, run `npm start` for Metro, then `npm run android` or `npm run ios` in a second terminal. Native builds require the platform toolchain and the patches applied by the install step. [Native setup and build commands](docs/NATIVE_BUILDS.md)

## Working on the app

Screens live in `app/`. Shared logic, navigation and components live in `src/`. The native entry point is `index.js` and the web entry point is `index.web.js`.

| Command | Purpose |
| --- | --- |
| `npm test` | Run the regression suite |
| `npm run typecheck` and `npm run lint` | Check types and lint the codebase |
| `npm run check:dependencies` and `npm run audit:review` | Check the dependency graph and review current advisories |
| `npm run export:web` | Build the production web app in `dist/` |
| `npm run build:android:develop` | Build a standalone development APK with bundled JavaScript |
| `npm run build:ios:simulator` | Build the iOS Release app for the simulator |

## Documentation

- [App guide](docs/APP_GUIDE.md) covers converter input, quiz modes, spoken answers and review scheduling.
- [Audio validation](docs/AUDIO_VALIDATION.md) lists the NATO, FAA and ICAO references and the checks that need a device and a listener.
- [Tile design](docs/TILE_DESIGN.md) specifies layout, type, scaling and the visual reference fixture.
- [Native builds](docs/NATIVE_BUILDS.md) covers Android and iOS setup, renderer patches and artwork.
- [Web distribution](docs/WEB_DISTRIBUTION.md) covers packaging, hosting, offline updates and rollback.
- [Mobile releases](docs/RELEASE_RUNBOOK.md) covers branch builds, signing and release checks.
