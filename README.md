# NATO Phonetics

A comprehensive mobile app for learning and practicing the NATO phonetic alphabet. Features interactive reference materials, audio pronunciation, word conversion, and quiz modes.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-lightgrey.svg)

## Features

- 📚 **NATO Alphabet Reference** - Complete A-Z list with audio pronunciation
- 🔤 **Word Converter** - Convert any text to NATO phonetics with audio playback
- 🎯 **Letter Quiz** - Multiple choice quiz with flip card animations
- 🎨 **Dark Mode** - System-aware theme with manual toggle
- 🔊 **Voice Selection** - Choose from available device voices
- 📱 **Offline-First** - All processing happens on-device

## Screenshots

<!-- Add screenshots here when available -->

## Installation

### Prerequisites

- Node.js 18+ and npm
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac only) or Android Emulator

### Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd nato-phonetics
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Run on your device:
   - **iOS**: Press `i` or scan QR code with Camera app
   - **Android**: Press `a` or scan QR code with Expo Go app
   - **Web**: Press `w`

## Development

### Project Structure

```
nato-phonetics/
├── app/                    # Screen components (file-based routing)
│   ├── index.js           # Home screen
│   ├── alphabet.js        # NATO alphabet reference
│   ├── converter.js       # Word to NATO converter
│   ├── letter-quiz.js     # Quiz screen
│   ├── settings.js        # App settings
│   └── voice-select.js    # Voice selection
├── src/
│   ├── context/           # React context providers
│   ├── data/              # NATO alphabet data
│   └── lib/               # Utility functions
├── assets/                # Images and icons
└── constants/             # App constants

```

### Available Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android emulator
- `npm run ios` - Run on iOS simulator
- `npm run web` - Run in web browser
- `npm run generate-icons` - Generate app icons from SVG
- `npm run lint` - Run ESLint

### Building Icons

To regenerate app icons from the source SVG:

```bash
npm run generate-icons
```

This creates all required sizes (icon.png, favicon.png, splash-icon.png, Android adaptive icons).

## Technologies

- **Framework**: React Native with Expo (~54.0.27)
- **Routing**: Expo Router (file-based)
- **State**: React Context + AsyncStorage
- **UI**: React Native core components
- **Audio**: Expo Speech API
- **Icons**: @expo/vector-icons (Ionicons)

## Privacy

This app processes all data locally on your device. No information is sent to external servers. See [PRIVACY.md](PRIVACY.md) for details.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

Contributions welcome! Please open an issue or submit a pull request.

## Acknowledgments

- NATO phonetic alphabet is in the public domain
- Speech synthesis provided by device TTS engines
- Icons designed for this project

## Support

For issues or questions, please open an issue on GitHub.
