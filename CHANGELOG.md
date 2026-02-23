<!-- markdownlint-disable MD024 -->

# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

- Feature: Episode-level watched tracking for TV series.

## [0.0.9] - 2026-02-23

### Added

- Feature: Full TV Shows integration — browse, view, and track TV series alongside movies.
- Feature: TV Viewer page (`TVViewer.tsx`) with season selector, episode grid, multi-provider embed URLs, and cast carousel.
- Feature: "Popular TV Shows" row on the Home dashboard.
- Feature: Search autocomplete now returns both movies and TV shows (with a "TV" badge).
- Feature: Shared `MovieCard`/`MovieRow` components accept a `mediaType` prop for polymorphic rendering.
- Feature: TV-specific genre IDs seeded in `genreMap.ts`.
- Feature: Static release notes notification system (`releaseNotes.ts`) — add an entry before each deploy and users see it as an unread notification.

## [0.0.8] - 2026-02-23

### Added

- Feature: Restructured MovieViewer details section to a YouTube-style mobile layout for superior ergonomics (Title → Watchlist/Share → Description → Support Actions).

### Fixed

- Fixed: Resolved autocomplete dropdown clipping issues by removing `overflow-x: hidden` from the Navbar.

## [0.0.7] - 2026-02-23

### Added

- Feature: Comprehensive mobile layout audit and overhaul across the entire application.

### Fixed

- Fixed: Applied global `overflow-x: hidden` on html/body constraints to prevent horizontal scrolling issues.
- Fixed: Reflowed Navbar responsively to gracefully wrap search inputs on smaller screens.
- Fixed: Constrained the Cast Carousel and Feedback Modal to prevent exceeding mobile viewport widths.
- Fixed: Adjusted Hero section sizing and ensured text clipping (`line-clamp-2`).

## [0.0.6] - 2026-02-23

### Added

- Feature: Integrated multi-provider streaming support (VidKing, VidSrc, SuperEmbed) via a sleek sidebar dropdown.
- Feature: Glassmorphic design pass on the Source Provider dropdown and Advanced Search panel.

### Changed

- Performance: Replaced continuous `postMessage` time sync with a more performant binary "Watched" status trigger upon play to eliminate severe iframe-induced React render stuttering.

## [0.0.5] - 2026-02-23

### Added

- Feature: Movie Viewer Splash Controls — an immersive "Ready to continue?" interactive panel. Supports seeking with a slider, Restart, and Resume synchronized with local storage.

## [0.0.4] - 2026-02-23

### Added

- Feature: Navbar Search Overhaul — introduces live debounced autocomplete dropdowns.
- Feature: Navbar Advanced Filters — immersive panel to query by genre, actor, release year, and minimum score.
- Feature: `SearchResults` page overhaul to parse and support complex URL filter parameters natively.

## [0.0.3] - 2026-02-23

### Added

- Feature: Integrated dynamic top Cast Carousel fetching actor credits into the Movie Viewer.
- Feature: Mood Survey Overhaul — complete redesign featuring an interactive "Thinking..." sequence, one-word options, and an "Extend Survey" sentiment matching capability.
- Feature: Built `useStorageSync` custom hook for seamless cross-tab and same-tab localStorage reactivity.
- Feature: Redesigned Home Page rows completely (Continue Watching, Watchlist, Favorite Genre, Trending, Hidden Gems).

## [0.0.2] - 2026-02-23

### Added

- Feature: Robust 404 "Scene Not Found" catch-all route with custom styling.
- Feature: Watchlist system overhaul with full CRUD localStorage sync, bookmark toggles (hover/sidebar), and interactive Account grid.
- Feature: Netflix-style MovieViewer immersive redesign featuring gradient fades, scroll-for-details layouts, and Glassmorphism controls.

### Fixed

- Fixed: MovieRow global deduplication bug that was emptying rows. Replaced with row-scoped deduplication.
- Fixed: Genre labels dynamically resolve from TMDB genre IDs instead of hardcoded strings.
- Fixed: Obfuscated API keys from console logs.
- Fixed: Replaced broken placeholder images with inline SVG `onError` fallbacks.

## [0.0.1] - 2026-02-23

### Added

- Initialized project architecture using Vite + React + TypeScript.
- Implemented comprehensive Glassmorphism Design System matching Apple iOS 26 / Google Stitch UI.
- Built core layouts: Home Browser, Mood Survey, Account Profile.
- Configured GitHub Actions CI/CD for automatic GitHub Pages deployment.
- Initialized local persistent storage architectures and API service layers.
