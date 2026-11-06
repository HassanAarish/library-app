# 📱 LibraryHub — Android app

The phone app for **LibraryHub**, the book-rental library launching in Pakistan.
Readers browse the catalogue, read the books they've rented, follow book
requests and get notifications. It talks to the same Express API as the
website (`../library-backend`) and reuses the website's design and code
(`../library-frontend`).

> **Status:** M0 (foundation) done. **Next:** M1 sign-in → M2 catalogue →
> M3 library & reader → M4 requests, inbox & push → M5 polish → M6 Play Store release.

## ⚠️ Google Play rule: the app is for reading, not buying

Google Play requires its own billing for digital content bought inside an app.
LibraryHub's rentals are paid on the **website** (Easypaisa), so the app:

- never shows prices, payment steps or plan purchases;
- never says "buy/pay on the website" or links there to pay;
- lets readers sign in and read, browse, follow requests and see notifications.

`src/i18n/i18n.test.jsx` fails if the app-only text (`mobile.*`) mentions
paying. Renting or Google Play Billing can be added later as its own decision.

## 🧰 Tech stack

| Area | Choice |
|------|--------|
| Framework | **Expo SDK 58** (React Native 0.88, New Architecture, Hermes) |
| Navigation | **Expo Router**: every file in `src/app/` is a screen |
| Styling | **Uniwind** (Tailwind 4 for React Native) with the website's colour tokens, light + dark |
| Fonts | Fraunces (headings) + Inter (text), bundled with `expo-font` |
| Icons | `lucide-react-native` (the same Lucide set as the website) |
| Data | TanStack React Query + Axios |
| Live updates | socket.io-client |
| Token | `expo-secure-store` (Android Keystore, encrypted) |
| Builds | Expo Build / Submit (EAS), `eas.json` |
| Tooling | ESLint (expo config + the website's Tailwind rules), Prettier, Jest + React Native Testing Library |

## 📂 Project structure

```
library-app/
├── src/
│   ├── app/                  screens (Expo Router)
│   │   ├── _layout.jsx       fonts, splash, providers
│   │   ├── (tabs)/           bottom tabs: index (Home), books, library, requests, account
│   │   └── +not-found.jsx    unknown deep link
│   ├── ui/                   design system, import from "@/ui": Text, Button, Icon, Logo,
│   │                         Screen, PageHeader, Card, Badge, EmptyState, Loader, Segmented, Toast
│   ├── lib/                  http (ApiError, token header), api/ (one function per endpoint),
│   │                         queryClient + qk, tokenStore, appFocus, notificationLink
│   ├── i18n/                 t(), formatters, locales/en.js (copied from the website + `mobile.*`)
│   ├── context/              AuthContext (SecureStore session), ThemeContext
│   ├── realtime/             SocketProvider + useWatchBook
│   ├── components/           app pieces (SignInPrompt, PhasePlaceholder)
│   ├── constants/            API / socket / site URLs
│   ├── global.css            Uniwind theme: tokens per light/dark, font families
│   └── theme-lint.css        token names for ESLint only (never loaded by the app)
├── assets/                   icon, adaptive icon layers, splash, favicon
├── app.config.js             name, package id, scheme, plugins, splash colours
├── eas.json                  build profiles: development / preview / production
└── .env.example
```

### Code shared with the website
Copied, not linked: `lib/http.js`, `lib/api`, `lib/queryClient.js`,
`i18n/locales/en.js`, `realtime/SocketProvider.jsx`, `context/AuthContext.jsx`,
`lib/notificationLink.js`. When the website changes one of these, update the
copy here. Differences on mobile:

- The token is kept in **SecureStore**, not localStorage.
- **Sign-in is kept on a bad connection.** Only a 401 ends the session; anything else shows "offline" with a retry.
- **Data refreshes when the app returns to the foreground** (the socket reconnects too).
- **`notificationLink` still has the website's routes.** M4 remaps them to app screens.

### Design rules
- Colours come from tokens (`bg-canvas`, `text-fg`, `border-line`, `bg-brand`, `text-gold`…), never hex values, so both themes work. A new token goes in `global.css` (both themes) **and** `theme-lint.css`.
- On Android each font weight is its own file, so text weight is set with `<Text weight="semibold">` (families such as `font-sans-semibold`), not `font-semibold`.
- With Uniwind the later of two conflicting classes doesn't reliably win. `Text` drops its variant's own size/colour when you pass one.
- Use logical classes (`ms-`/`me-`, `ps-`/`pe-`, `start-`/`end-`) so Urdu (RTL) mirrors. `npm run lint` enforces it, as on the website.
- Touch targets are at least 44px (buttons are 48px).

## ⚙️ Environment

Copy `.env.example` to `.env`. Only `EXPO_PUBLIC_*` values reach the app, and
anyone with the app can read them, so no secrets.

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_API_URL` | Backend. **Leave empty in development**: the app uses the backend on the computer running `npm start` (port 5001), via its network address, so a real phone on the same Wi-Fi reaches it |
| `EXPO_PUBLIC_SOCKET_URL` | Only if sockets live elsewhere |
| `EXPO_PUBLIC_SITE_URL` | The website (legal pages, help). Links to it are hidden when empty |
| `ANDROID_PACKAGE` | Defaults to `pk.libraryhub.app`. **Permanent once published**, so confirm it before the first Play upload |

The backend's CORS settings don't matter for the app (native apps don't send an Origin).

## 🚀 Getting started

Requires **Node.js 22.13+** (Expo SDK 58 and React Native 0.88 don't support Node 20).

```bash
cd library-app
npm install
cp .env.example .env
npm start            # Expo dev server; scan the QR code with your phone
```

**On your phone:** the app uses native modules (SecureStore, fonts, and later
screenshot blocking and push), so it runs in a **development build**, not in
Expo Go. Build it once in the cloud and install the APK:

```bash
npx eas-cli@latest login
npx eas-cli@latest build --profile development --platform android
```

After that, `npm start` and code changes appear instantly on the phone. The
backend must be running (`cd ../library-backend && npm run dev`) on the same
Wi-Fi network.

**Quick look in a browser:** `npm run web` renders the same screens (handy for
layout checks; the phone is what counts).

### Scripts
| Command | Description |
|---------|-------------|
| `npm start` | Expo dev server |
| `npm run android` | Dev server + open on a connected Android device/emulator |
| `npm run web` | Same screens in the browser |
| `npm run lint` / `lint:fix` | ESLint (incl. Tailwind class rules) |
| `npm run format` / `format:check` | Prettier |
| `npm test` | Jest unit/component tests |
| `npm run doctor` | `expo-doctor`: dependency and config checks |

### Builds (`eas.json`)
| Profile | For | Output |
|---------|-----|--------|
| `development` | Day-to-day work on your phone | APK with the dev client |
| `preview` | Testers (internal) | APK |
| `production` | Google Play | App bundle (AAB), version code auto-increments; `submit` uploads to the **internal** track |

Native folders (`android/`) are generated at build time from `app.config.js`.
Don't create or edit them by hand.

---

## 📜 License & contributing

LibraryHub is **source-available, not open source**: you may read the code, run
it locally and send improvements, but not reuse it elsewhere. See
[`LICENSE`](LICENSE).

Contributions are welcome. Read [`CONTRIBUTING.md`](CONTRIBUTING.md) for how
to report bugs, make a change and open a pull request, and for the contributor
terms. Release notes are in [`CHANGELOG.md`](CHANGELOG.md); versions follow
semantic versioning, starting at **0.1.0**.
