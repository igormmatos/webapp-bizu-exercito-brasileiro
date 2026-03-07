# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-03-07

### Added
- Global PWA install prompt with iPhone/Android instructions and Android native install shortcut.
- Audio card controls: favorite toggle and expand/collapse for long titles.
- Dedicated PDF detail flow with external link + storage card separation.
- Runtime migration script `014_items_pdf_text_body_optional.sql` documented in database guide.
- Basic CI pipeline for lint and build.

### Changed
- Branding standardized to **Manual de Bolso** across app title, metadata, and manifest.
- Main headers behavior standardized with sticky header in ItemDetail.
- Item type labels normalized in UI (`TEXTO`, `IMAGEM`, etc.).
- PWA setup hardened with local icon assets and manifest icon set.
- App version centralized in frontend using `__APP_VERSION__`.
- Route-level lazy loading + manual chunking for better initial load distribution.

### Fixed
- Mobile card overflow issues on narrow screens.
- iPhone audio playback reliability by avoiding runtime audio cache interception in SW.
- Catalog sync visibility with blocking global loading overlay.
