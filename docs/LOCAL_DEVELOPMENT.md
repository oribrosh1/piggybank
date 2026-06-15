# Local development guide

How to run CreditKid locally with Firebase emulators, and how to fix common setup failures (`auth/network-request-failed`, code signing, emulators not connecting).

---

## Quick start (daily workflow)

You need **two terminals** plus the **iOS Simulator** (recommended — no Apple signing required).

### Terminal 1 — Firebase emulators

```bash
npm run functions:emulate
```

Wait until the table shows:

| Emulator       | Port  |
|----------------|-------|
| Authentication | 9099  |
| Firestore      | 8080  |
| Functions      | 5101  |
| Storage        | 9199  |

Emulator UI: http://127.0.0.1:4010

### Terminal 2 — Expo / Metro (dev env)

```bash
npm run start:dev
```

This loads **`.env.dev`** (not `.env`). Required for:

- `EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true`
- `EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:5101/...`

Press **`i`** to open the iOS simulator, or open the dev client already installed on the simulator.

### Verify on app launch

Metro should log:

```
[dev] Firebase emulators { host: '127.0.0.1', api: '...', storage: '...' }
```

If you see `[dev] Firebase emulators off`, you are **not** running `npm run start:dev`.

---

## Environment files

| File       | Purpose |
|------------|---------|
| `.env.dev` | Local development with emulators (`npm run start:dev`) |
| `.env`     | Used by plain `expo start` / `npx expo run:ios` by default |

**Always use `npm run start:dev` for local work.** Plain `expo start` or `npx expo run:ios` loads `.env` and may skip emulator flags.

---

## iOS: simulator vs physical device

### Simulator (recommended)

- No code signing / Apple Developer account needed
- Firebase emulators on the Mac are reached via **`127.0.0.1`**
- Open Xcode target: **iPhone … (Simulator)**, not “Any iOS Device”

```bash
# Prefer simulator by name (not a physical device UDID)
npx expo run:ios --device "iPhone 17 Pro Max"
```

If Expo still asks for code signing, build from Xcode:

1. Open `ios/piggybank.xcworkspace`
2. Select a **Simulator** in the scheme dropdown
3. **Product → Run** (⌘R)

Or via command line:

```bash
cd ios
xcodebuild -workspace piggybank.xcworkspace -scheme piggybank \
  -configuration Debug \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro Max' \
  -derivedDataPath build
```

### Physical device

Requires a paid **Apple Developer** account and code signing in Xcode.

- Set `EXPO_PUBLIC_FIREBASE_EMULATOR_HOST` in `.env.dev` to your **Mac’s LAN IP** (e.g. `192.168.1.5`), not `127.0.0.1`
- On the phone, `127.0.0.1` is the phone itself, not your Mac
- Emulators in `firebase.json` listen on `127.0.0.1` only; for a real device you may need to expose emulators on `0.0.0.0` or use your Mac IP with network access

Error you’ll see without signing:

```
CommandError: No code signing certificates are available to use.
```

---

## Fixing `auth/network-request-failed` on signup

### What it means

Firebase Auth could not complete an HTTP request. In local dev this almost always means **the app is not talking to the Auth emulator** (connection refused / wrong host), not a bad password.

Metro can look fine because **`signup.tsx` only shows an alert** — check for:

```
ERROR [signup] createUserWithEmailAndPassword failed: auth/network-request-failed
```

### Root causes we’ve hit

1. **Emulators not running** — start `npm run functions:emulate`
2. **Wrong Metro command** — use `npm run start:dev`, not `npm start`
3. **Wrong emulator host** — iOS simulator must use `127.0.0.1`; Metro’s LAN IP (`172.x.x.x`) does not work because emulators bind to loopback only
4. **Native Auth starts before JavaScript** — `FirebaseApp.configure()` in `AppDelegate.swift` runs before JS. `auth().useEmulator()` in JS can be too late for native signup

### Native fix (already in repo)

`ios/piggybank/AppDelegate.swift` points Auth at the emulator in **DEBUG**:

```swift
#if DEBUG
Auth.auth().useEmulator(withHost: "127.0.0.1", port: 9099)
#endif
```

**After changing any native iOS file, you must rebuild** — Metro reload is not enough:

```bash
npx expo run:ios --device "iPhone 17 Pro Max"
# or Xcode → Run on Simulator
```

### JS emulator wiring

- `app/_layout.tsx` imports `@/src/firebase/emulators` first
- `src/lib/backendConfig.ts` — `resolveEmulatorHost()` uses `127.0.0.1` on iOS simulator
- `src/firebase/emulators.ts` — connects Firestore, Auth, Storage, and web SDK emulators

### How to confirm Auth emulator is receiving requests

**Terminal 1** (`functions:emulate`) should show activity when you sign up.

Or test directly:

```bash
curl -s -X POST \
  "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","returnSecureToken":true}'
```

If `curl` works but the app does not, the app is still not pointed at the emulator → rebuild the native app.

---

## Troubleshooting checklist

| Symptom | Check |
|---------|--------|
| `auth/network-request-failed` | Emulators running? `start:dev`? Rebuilt iOS app after `AppDelegate` change? |
| `[dev] Firebase emulators off` in Metro | Run `npm run start:dev`, not `expo start` |
| No signup in emulator logs | Native rebuild needed; confirm `[dev] Firebase emulators` on launch |
| `No code signing certificates` | Build for **Simulator**, not physical device |
| `Auth timeout` in Metro | Often harmless; auth listener slow on first launch. Fix emulator connection if signup fails |
| API / Functions errors | Functions emulator on **5101**? `EXPO_PUBLIC_API_BASE_URL` in `.env.dev`? |
| Works on simulator, not on phone | Set `EXPO_PUBLIC_FIREBASE_EMULATOR_HOST` to Mac LAN IP |

---

## Useful commands

```bash
# Dev Metro with emulators env
npm run start:dev

# Firebase emulators (auth, firestore, functions, storage)
npm run functions:emulate

# iOS simulator build (after native changes)
npx expo run:ios --device "iPhone 17 Pro Max"

# Check Auth emulator is up
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:9099/

# List simulators
xcrun simctl list devices available | grep iPhone
```

---

## File reference

| File | Role |
|------|------|
| `.env.dev` | Emulator flags and local API URL |
| `app.config.js` | Passes `EXPO_PUBLIC_*` into Expo `extra` |
| `src/lib/backendConfig.ts` | Emulator on/off, host resolution |
| `src/firebase/emulators.ts` | JS emulator connection |
| `ios/piggybank/AppDelegate.swift` | Native Auth emulator (DEBUG) |
| `firebase.json` | Emulator ports (`9099`, `8080`, `5101`, `9199`) |
| `app/(auth)/signup.tsx` | Email signup; logs errors to Metro |

---

## After `expo prebuild`

`AppDelegate.swift` may be regenerated. Re-apply the DEBUG block:

```swift
import FirebaseAuth

// After FirebaseApp.configure():
#if DEBUG
Auth.auth().useEmulator(withHost: "127.0.0.1", port: 9099)
#endif
```

Consider an Expo config plugin later so this survives prebuild.
