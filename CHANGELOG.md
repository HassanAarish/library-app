# Changelog

All notable changes to the LibraryHub Android app. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[semantic versioning](https://semver.org) (see CONTRIBUTING.md › Versions and releases).
The version shown in the app comes from `package.json`.

## [Unreleased]

### Added
- Push notifications (phase M4, part 2): the app asks for permission after sign-in,
  registers the phone with the backend and removes it on sign-out; tapping a push
  marks it read and opens the matching screen, including when it starts the app.
  Needs a development build (not Expo Go). Adds `expo-notifications`: run
  `npm install` after pulling.
- Requests & inbox (phase M4, part 1): Requests tab with search, open/added filter,
  most wanted or newest, follow, request a book with Open Library suggestions, suggest
  a category, and "Mine" (my requests and suggestions); request pages with their
  timeline; notifications inbox with an unread badge, mark read and delete.
  Notifications open the matching app screen, and payment-related ones use the app's
  own wording (also in the live pop-up).
- My library & protected reader (phase M3): Library tab grouping rentals into Reading now, Upcoming and History with live countdowns, 7-day extension and early return. Full-screen page reader (/read/[bookId]) streaming watermarked pages with memory-only caching, screenshot blocking (expo-screen-capture), reading position memory, zoom and jump-to-page navigation.

### Fixed
- Inbox: "book added" notifications no longer say "You can rent it now"; server text
  that mentions paying or renting is replaced with neutral wording.
- Reader: the next page is preloaded in memory only (it was also being saved to disk);
  page images now get a real size; Retry reloads a failed page; each page is
  requested once; tapping the page shows or hides the controls.
- Library and reader no longer show payment wording (Google Play rule); a new test
  checks the text every screen uses.
- Reader: when a rental ends mid-book it says the reading time has ended (a brief
  network error keeps the book open); the saved page is no longer overwritten with
  page 1 on opening, and saved pages are cleared when a rental ends or you sign out.
- Library: countdowns can be translated; tab labels fit on small phones.
- Sign-in (phase M1): email and password, sign-up with an emailed code, Google,
  Facebook (with account linking), two-step verification and forgot password.
- Account tab shows the signed-in profile, with sign out. Guests get a Sign in button.
- A saved session that can't reach the server offers a retry instead of signing out.
- Catalogue (phase M2): Home shelf of new arrivals; Books tab with search, category
  and language filters, sorting and endless scrolling; book pages with live availability.

## [0.1.0] - not yet released

The app's foundation (phase M0).

### Added
- Expo SDK 58 app with Expo Router and five tabs: Home, Books, Library,
  Requests and Account.
- The website's design in the app: colour tokens in light and dark mode
  (following the phone's setting, or chosen in Account), Fraunces and Inter
  fonts, Lucide icons, app icon, adaptive and themed Android icons, splash screen.
- Components: Text, Button, Icon, Logo, Screen, PageHeader, Card, Badge,
  EmptyState, Loader, Segmented and Toast.
- API layer, translations, sign-in state (token in the phone's secure
  keystore) and live updates, ported from the website.
- Offline-friendly session restore, refresh when the app returns to the
  foreground, and automatic local-backend address in development.
- Build profiles for development, preview and Google Play; ESLint, Prettier
  and Jest tests.

[Unreleased]: https://github.com/HassanAarish/library-app/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/HassanAarish/library-app/releases/tag/v0.1.0
