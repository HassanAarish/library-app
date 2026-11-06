# Changelog

All notable changes to the LibraryHub Android app. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[semantic versioning](https://semver.org) (see CONTRIBUTING.md › Versions and releases).
The version shown in the app comes from `package.json`.

## [Unreleased]

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
