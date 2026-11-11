# LibraryHub: guide for AI coding assistants

You are working on **LibraryHub**, an online book-rental library launching in
Pakistan. Read this whole file before changing anything. It explains what
exists, how to run it, how to add to it, and the rules the owner has set.

If this file and the code disagree, trust the code and tell the owner. Each repo
also has a detailed `README.md`; the backend README documents every endpoint.

---

## 1. The three projects

Three sibling folders, each its **own git repository**.

| Folder | What it is | Stack | Runs on |
|---|---|---|---|
| `library-backend` | REST API + live events | Node, Express 5, MongoDB/Mongoose 9, Socket.IO, zod, Vitest | `:5001` |
| `library-frontend` | Website + admin console | React 19, Vite 8, Tailwind 4, React Query, react-router 7, Axios, Formik + Yup, Vitest | `:5173` |
| `library-app` | Mobile app for readers | Expo SDK 58, React Native 0.88, Expo Router, Uniwind (Tailwind 4), React Query, Axios, Formik + Yup, Jest | `:8081` |

All code is **JavaScript**, not TypeScript. GitHub: `HassanAarish/library-backend`,
`library-frontend`, `library-app`.

**The product**
- Each book has **one copy**: one reader at a time, others book a later slot.
- A single rental costs the book's own price (default 14 days; one free 7-day
  extension if nobody is booked next).
- Plans: 3, 5 or 10 book credits, valid one year from payment approval.
- Payment is **manual Easypaisa**: the reader sends money and submits the
  transaction ID and receipt, and the admin approves. Prices are in PKR. Payments
  sit behind a provider interface (`services/payments/`) so a gateway can be added later.
- Sign-in: email + code, Google, Facebook, optional two-step verification. No Apple.
- Readers may suggest categories and request books.

---

## 2. Rules you must not break

1. **Don't commit, push, branch or merge unless the owner asks in that message.**
   Permission for one commit doesn't cover the next. Sometimes the owner says
   "don't commit until I say so": obey it.
2. **Never commit, print or paste values from any `.env` file.** Only variable
   names may be discussed.
3. **Books are view-only.** Nothing may help anyone download, save or extract
   book pages.
4. **Mobile app: no prices, payment steps, rent/buy buttons, price sorting or
   "pay on the website"** anywhere (Google Play's payments policy for digital
   goods). Renting and paying stay on the website. Tests enforce this
   (`src/i18n/i18n.test.jsx`, `src/components/books/books.test.jsx`). Unpaid
   bookings are labelled "Not confirmed yet". Don't copy the website's
   rent/payment strings into app screens.
5. **All visible text goes through `t()`**, so Urdu can be added by translating
   only. Never hard-code UI text.
6. **Use design tokens, never raw colours**, and **logical classes** (`ms-`/`me-`,
   `ps-`/`pe-`, `start-`/`end-`, `text-start`) so layouts mirror for Urdu.
7. **Keep lint clean as part of every change**, including the Tailwind rules
   (`eslint-plugin-better-tailwindcss`). `npm run lint:fix` fixes most.
8. **Every website screen must be responsive.** Check 360, 768 and 1366px wide
   with no sideways scrolling, in light and dark mode.
9. **Sibling pages must look the same** (same frame, width and header). All
   account tabs use `AccountPage`; admin pages use `AdminPage`.
10. **Don't change the licence type without asking.** The code is
    source-available, all rights reserved (custom `LICENSE`), not open source.
    Contributions are welcome under `CONTRIBUTING.md`.
11. **The backend enforces every rule.** Frontend guards are only for convenience.
12. **Ask before** deleting things, pushing, publishing, or anything hard to undo.
    Before deleting a folder, check for unpushed commits and files git ignores (such as `.env`).

---

## 3. Running everything

**Node:** Expo SDK 58 requires **Node 22.13+** (24 LTS recommended). The website
and backend need 20.19+.

**First time, in each repo:** `npm install`, then copy `.env.example` to `.env`
and ask the owner for values. (Don't invent them.)

```bash
# Backend (needs MongoDB as a replica set: rentals use transactions)
cd library-backend
npm run dev            # http://localhost:5001, health check at /health

# Website
cd library-frontend
npm run dev            # http://localhost:5173

# App in a browser (quick layout checks)
cd library-app
npm run web            # http://localhost:8081
```

For the browser preview, add `http://localhost:8081` to `CORS_ORIGINS` in the
backend `.env`. In that preview, refreshing signs you out (no secure storage on
web) and the Google/Facebook buttons are hidden.

**App on a phone with Expo Go:**

1. Phone and computer on the same Wi-Fi. Backend running.
2. In `library-app/.env`, leave `EXPO_PUBLIC_API_URL` **empty**, and don't set
   `EXPO_PUBLIC_SOCKET_URL`. The app then finds your computer's address itself.
3. Start the app, setting `REACT_NATIVE_PACKAGER_HOSTNAME` to your computer's
   network address if it has several:
   ```bash
   cd library-app
   npx expo start --go --lan -c
   ```
   `--go` is required because `expo-dev-client` is installed. `-c` clears the
   cache; use it after changing `.env`.
4. Scan the QR code and, on iPhone, allow Local Network access.
5. Account tab shows the server address and "Live updates connected".
6. If it can't connect, open `http://<computer-ip>:5001/health` in the phone's browser. If
   that fails, it's the firewall or a network blocking devices from reaching each
   other; try the phone's hotspot. `--tunnel` only carries the app's code, not the backend.

**Expo Go limits:** Google and Facebook sign-in need a development build; push
notifications will too.

### Commands

| Repo | Lint | Format | Test | Other |
|---|---|---|---|---|
| backend | `npm run lint` | `npm run format` | `npm test` | |
| frontend | `npm run lint` | `npm run format` | `npm test` | `npm run build`; `/dev/design` shows all components (dev only) |
| app | `npm run lint` | `npm run format` | `npm test` | `npm run doctor` (`expo-doctor`) |

**Before saying a task is done:** run lint and tests, and actually exercise the
change. Report failures honestly, with the output.

---

## 4. Backend: how it works

```
routes/X.Routes.js → middlewares → controller/X.Controller.js → services/X.Service.js → models/
```

- `routes/indexRoutes.js` **auto-mounts** every `*.Routes.js`: `Seo.Routes.js`
  serves `/seo`, `BookRequest.Routes.js` serves `/bookrequest`. There's no `/api` prefix.
- **Services hold all business logic and database access.** Controllers only
  translate HTTP.
- Success looks like `{ success: true, data, message? }`. Errors look like
  `{ success: false, error, requestId }`. Throw `new ErrorResponse("message", status)`.
- Every request gets a request id, and it's returned on errors.
- **Middlewares:** `verifyToken` (sets `req.userID`; re-reads blocked status and
  role from the database), `optionalAuth`, `verifyRole("admin")`, `validate(zodSchema)`,
  `inTransaction` (for writes that must be atomic), `createLimiter({ keyPrefix, points, duration, key })`,
  `asyncHandler` (wraps controllers).
- **Env:** declared and validated at start-up in `config/env.js`. Add new
  variables there and to `.env.example`.
- **Rules in config:** `config/rentalPolicy.js`, `config/bookRequestPolicy.js`.
- **Audit:** `audit("area.action", { outcome, actor, metadata })` from
  `utils/audit.js` for admin and security events. Audit logs are append-only.
- **Live events:** `emitToUser`, `emitToAdmins` etc. in `realtime/socket.js`.
  Events carry ids; clients refetch.
- **Lists:** `helper.paginate(Model, req, { sort, ... })` returns
  `{ results, totalDocs, totalPages, page, hasNextPage, hasPrevPage }`.
- **Cron** (`cron/`): releases expired holds, moves rentals scheduled → active →
  completed, expires plans.

### Adding an endpoint

1. Add the logic to `services/X.Service.js`.
2. Add a thin handler to `controller/X.Controller.js` using `asyncHandler`.
3. Add a zod schema in `validators/`.
4. Add the route in `routes/X.Routes.js` with auth, limiter, `validate`, and
   `inTransaction` if it writes several documents.
5. Add tests in `tests/`, using the real server on in-memory MongoDB:
   ```js
   const t = await startTestServer("myarea");   // tests/support/testServer.js
   const user = await t.mkUser("Reader");
   const book = await t.mkBook("Title");
   const r = await t.api("GET", "/path", { token: user.token });
   afterAll(() => t?.close());
   ```
6. Add it to the backend README.
7. Add a matching function to `src/lib/api/index.js` in the website and/or app.

---

## 5. Website: how it works

```
src/
  ui/          design system, import from "@/ui"
  lib/         http.js (Axios, ApiError), api/index.js (one function per endpoint),
               queryClient.js (React Query + `qk` cache keys), site.js
  i18n/        t(), formatters, locales/en.js
  content/     long-form text (legal pages)
  context/     AuthContext, ThemeContext
  realtime/    SocketProvider, useWatchBook
  routes/      AppRoutes.jsx, guards (RequireAuth, GuestOnly), ScrollToTop
  layout/      PublicLayout, AdminLayout, AuthLayout
  components/  shell/, books/, auth/, account/, admin/, requests/
  hooks/       useBooks, useRentals, useCommunity, useNotifications, useAdmin, useSeo, useCountdown
  pages/       one folder per screen; Admin/, Auth/, system/
```

**Provider order:** I18n → Theme → ErrorBoundary → GoogleOAuth → ReactQuery →
Router → Auth → Socket → Modal → Routes.

**Look ("warm editorial"):** cream backgrounds, Fraunces serif headings, Inter
for UI text, ink-green brand, gold accent, book covers as the main visual, light and dark.

### Adding a page

1. Create `src/pages/MyPage/index.jsx`. Call
   `useDocumentTitle(t("my.title"))`, or `useSeo({ title, description })` for public pages.
2. Add it in `src/routes/AppRoutes.jsx` with `lazy()`, under the right group:
   public, `GuestOnly`, `RequireAuth`, or `RequireAuth role="admin"`.
3. Add its strings to `src/i18n/locales/en.js`.
4. Add API functions to `lib/api/index.js`, a key to `qk`, and a hook in `hooks/`.
5. Handle loading (`Skeleton`), errors (`ErrorState`) and empty (`EmptyState`).
6. Reuse frames: `Container` + `PageHeader` for public pages, `AccountPage` for
   account tabs, and for admin `AdminPage`, `AdminFilters`, `AdminTable`, `useAdminList`,
   `useAdminAction` (toasts the backend's message and refreshes admin data), and `Drawer` for row details.
7. Private pages: add the path to the `PRIVATE` pattern in `hooks/useSeo.js` so
   it's not indexed.

### Adding a component

Put reusable ones in `src/ui/` and export them from `src/ui/index.js`; add to the
`/dev/design` gallery. Feature-specific ones go in `src/components/<area>/`.

- Tokens: `bg-canvas`, `bg-surface`, `bg-sunken`, `text-fg`, `text-fg-muted`,
  `text-fg-subtle`, `border-line`, `border-line-strong`, `bg-brand`, `text-on-brand`,
  `text-gold`, `bg-success-soft` etc. Defined in `src/index.css` for both themes.
  A new token needs a light value, a dark value, and a `@theme inline` entry.
- **Never build class names dynamically** (`bg-${tone}-soft`): Tailwind can't see
  them. Use a lookup object.
- Custom classes must be declared with `@utility` in `index.css`, or lint fails.
- Combine classes with `cn()`. Forms use Formik + Yup with rules from `pages/Auth/forms.js`.
- Text contrast must meet WCAG AA; headings mustn't skip levels.

---

## 6. Mobile app: how it works

```
src/
  app/          screens. EVERY FILE HERE BECOMES A ROUTE (Expo Router)
    _layout.jsx   fonts, splash, providers, root Stack
    (tabs)/       index (Home), books, library, requests, account
    (auth)/       login, signup, verify-otp, forgot-password, two-factor (guests only)
    books/[bookId].jsx
  ui/           design system, import from "@/ui"
  lib/          http, api/, queryClient + qk, tokenStore, forms, socialAuth, appFocus
  i18n/         t(), locales/en.js (copied from the website + a `mobile.*` group)
  context/      AuthContext, ThemeContext
  realtime/     SocketProvider
  hooks/        useBooks
  components/   auth/, books/, SignInPrompt, PhasePlaceholder
  constants/    API, socket and site addresses
  global.css    Uniwind theme tokens
  theme-lint.css token names for ESLint only; never loaded by the app
```

**Expo changes between SDKs, so read the docs for this SDK**
(`https://docs.expo.dev/versions/v58.0.0/`, index at
`https://docs.expo.dev/llms.txt`) rather than trusting memory. **Install with `npx expo install <package>`**, which picks
compatible versions. **Never create or edit `android/` or `ios/`**: they're
generated from `app.config.js`.

**Code copied from the website** (keep in step when the website changes):
`lib/http.js`, `lib/api`, `lib/queryClient.js`, `i18n/locales/en.js`,
`realtime/SocketProvider.jsx`, `context/AuthContext.jsx`. Differences: the token
is in SecureStore; only a 401/403 ends a session on start-up (network errors give
status `"offline"` with a retry); data refetches when the app returns to the foreground.

### Adding a screen

1. Create a file under `src/app/`, e.g. `src/app/read/[bookId].jsx`, default-exporting the component.
2. If it's a new top-level route, add `<Stack.Screen name="read/[bookId]" />` to
   `src/app/_layout.jsx`. For a new tab, add it in `(tabs)/_layout.jsx`.
3. Wrap it in `Screen`, or for a stack page copy the `books/[bookId].jsx` frame
   (`SafeAreaView` with top and bottom edges, `BackButton`).
4. Navigate with `router.push("/books/123")`; use `router.navigate("/library")` for tabs.
5. Strings go in `mobile.*` in `en.js`. Check them against rule 4.
6. Handle loading (`Loader`, `Skeleton`), errors (`ErrorState`), empty (`EmptyState`).
7. For lists use `FlatList`, with pull to refresh and endless scroll as in `(tabs)/books.jsx`.
8. **Screens for signed-in users:** render `SignInPrompt` when `!isAuthenticated`.

### Adding a component

Put it in `src/ui/`, export from `src/ui/index.js`, and keep the website's name where one exists.

- **Text:** always use `Text` from `@/ui`, never the React Native one. Set weight
  with `weight="semibold"`, not the `font-semibold` class: on Android each weight is a separate font file.
- **Colours in props** (icons, spinners): `useCSSVariable("--color-brand")`, or `<Icon as={BookOpen} tone="brand" />`.
- **Third-party components need** `withUniwind(Component)` to accept `className`.
- **Conflicting classes:** with Uniwind the later class doesn't reliably win.
  Choose one with a condition (`selected ? "text-canvas" : "text-fg-muted"`). `Text` drops its variant's size or colour if you pass your own.
- **A new colour token** goes in `global.css` (both themes) **and** `theme-lint.css`.
- **Native-only libraries** must load on first use (`require` inside the function)
  or they crash Expo Go at start-up; see `lib/socialAuth.native.js`. `.native.js` is used on phones, plain `.js` in the browser.
- Touch targets at least 44px. Forms: `Field` + `Input`, `bindField`, `fieldError`, `rules` from `lib/forms.js`.
- `bg-white`-style raw colours are only for text on book covers.

### App tests (Jest)

- Tests must **not** live in `src/app/`, or they become routes.
- `render` and `renderHook` are **async** here: `await render(...)`.
- Mock `lucide-react-native` and `uniwind` as in `src/components/auth/auth.test.jsx`.
- Give `QueryClient` `gcTime: 0`, or its timers keep Jest from exiting.

---

## 7. Traps that have already caught us

| Symptom | Cause | Fix |
|---|---|---|
| Signed out right after signing in | Socket reaches a *different* backend, which refuses the token | `EXPO_PUBLIC_SOCKET_URL` must be unset or match the API |
| Phone can't reach the server | `localhost` on a phone is the phone | Leave `EXPO_PUBLIC_API_URL` empty in development |
| Tap on a link does nothing | Blurring a field showed an error that shifted the layout mid-tap | Don't validate empty code fields on blur |
| ESLint "Atomics.wait() timed-out" | Tailwind worker slow under load | `SYNCKIT_TIMEOUT` is set in `eslint.config.js` |
| Sign-up returns 500 | Backend can't send email (no SMTP in tests) | Use a fake SMTP server when testing locally |
| Search box loses focus in the browser | `keyboardDismissMode="on-drag"` fires on any web scroll | Off for web in `(tabs)/books.jsx` |
| Hermes `Intl` errors on Android | Not every `Intl` API exists | `src/i18n/index.jsx` has fallbacks; keep them |
| Port already in use / odd test results | An earlier server is still running | Check who's on `:5001` before assuming the app is wrong |
| Payment wording appears in the app | Reused website strings (`library.*`, `reader.*`, `payment.*`) talk about paying | Use `mobile.*` keys or `lib/rentalLabels.js`; `src/i18n/appText.test.js` checks every screen |
| A box inside a ScrollView has 0 size | Percent `height`/`maxHeight` has nothing to measure against | Size from `useWindowDimensions()` in pixels |
| A full-screen `Pressable` layer swallows taps | It sits above buttons (Retry) and pinch gestures | Use side strips, or put `onPress` on the content itself |
| An image keeps reloading | A new `source` object on every render | `useMemo` the source |
| Tests or lint fail right after pulling | A package was added on another computer | Run `npm install` after every pull |
| A wrong password signs the user out | The API answered 401, which the app treats as "session ended" | Signed-in checks of a password return 400 |
| Jest doesn't exit after the tests | A `QueryClient` mutation keeps a 5-minute timer | Give the test client `mutations: { gcTime: 0 }` as well as queries |
| A test's tap or typing has no effect | React Native Testing Library 14's `fireEvent` is async | `await fireEvent.press(...)` |
| Screen readers don't hear a choice in the browser | `accessibilityState` is ignored on the web | Use `aria-checked` / `aria-selected`, which work on phones too |

---

## 8. Git and releases

- Commit messages: `feat(area): summary`, with types `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.
- On a default branch, create a feature branch before committing.
- Versions: all repos start at **0.1.0** (semantic versioning). Each has a
  `CHANGELOG.md`. At release: move *Unreleased* notes under the new version, set
  `version` in `package.json` (the app reads it from there), tag `vX.Y.Z`. Don't
  bump versions outside a release.
- Run `git status` before committing and confirm no `.env` is staged.
