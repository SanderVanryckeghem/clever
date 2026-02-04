# Clever Dice Roller

A React Native / Expo implementation of the dice rolling mechanic from the board game "Ganz Schon Clever" (That's Pretty Clever).

## Live Demo

https://sandervanryckeghem.github.io/clever/

## Features

- 6 colored dice (Yellow, Blue, Green, Orange, Purple, White)
- 3 rolls per turn with automatic re-rolling
- Silver tray mechanic: selecting a die sends all lower-value dice to the tray
- Maximum 3 dice selections per turn
- Works on iOS, Android, and Web

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- For iOS: Xcode (Mac only)
- For Android: Android Studio

### Installation

```bash
npm install
```

### Running Locally

**Web:**
```bash
npx expo start --web
```

**iOS (Expo Go):**
```bash
npx expo start --ios
```

**Android (Expo Go):**
```bash
npx expo start --android
```

### Building for Device

**iOS (requires Xcode):**
```bash
npx expo run:ios --device
```

**Android:**
```bash
npx expo run:android --device
```

## Project Structure

```
clever/
├── App.tsx                      # Main app entry
├── src/
│   ├── components/
│   │   ├── Die.tsx              # Single die component
│   │   └── DiceRoll.tsx         # Dice rolling UI with silver tray
│   ├── hooks/
│   │   └── useDice.ts           # Dice state and game logic
│   ├── types/
│   │   └── dice.ts              # TypeScript types
│   └── constants/
│       └── game.ts              # Game configuration
├── app.json                     # Expo configuration
└── .github/workflows/
    └── deploy.yml               # GitHub Pages deployment
```

## Game Rules (Dice Mechanic)

Based on [Ganz Schon Clever](https://boardgamegeek.com/boardgame/244522/thats-pretty-clever):

1. Roll all 6 dice
2. Select one die to use
3. All dice showing a **lower value** than the selected die go to the Silver Tray
4. Re-roll remaining available dice
5. Repeat for 3 selections total

The White die acts as a wild card (to be implemented in scoring).

## Deployment

The app automatically deploys to GitHub Pages when pushing to `main`. See `.github/workflows/deploy.yml`.

## License

MIT
