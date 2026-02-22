# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- Feature: Movie Viewer Splash Controls — new "Ready to continue?" interactive panel allowing players to seek with a slider, Restart, or Resume before clicking play. Synchronizes manually with the VidKing `watch_progress` localStorage object.
- Feature: Navbar Search Overhaul — live autocomplete dropdown, enter/icon click triggers.
- Feature: Navbar Advanced Filters — glassmorphic panel to search by genre, actor, release year, and minimum score.
- Feature: SearchResults page updated to support complex URL filter parameters via TMDB's [discover](file:///v:/Documents/Personal%20Projects/FilmReel/src/services/api.ts#171-181) endpoint.
- Feature: Movie Viewer Top Cast Carousel fetching actor credits via TMDB API.
- Feature: Mood Survey Overhaul — Glassmorphic redesign, "Thinking..." sequence, one-word answers, and "Extend Survey" review-sentiment matching capability.
- Feature: [useStorageSync](file:///v:/Documents/Personal%20Projects/FilmReel/src/hooks/useStorageSync.ts#3-36) custom hook for cross-tab and same-tab localStorage reactivity.
- Feature: Complete redesign of Home Page rows (Continue Watching, Watchlist, Favorite Genre, Trending, Hidden Gems).
- Initialized Vite + React + TypeScript project architecture.
- Created task management and core memory artifacts.
- Functional Glassmorphism Design System (Purple/Dark).
- Mock TMDB API fetching system (and VidKing embed support).
- Feature: Home Movie Browser with infinite-scrolling horizontal rows and dynamically spawning vertical genre categories.
- Feature: Global deduplication register to guarantee that the same movie cannot spawn twice on the Browser Dashboard.
- Feature: Mood Discovery Survey with weighted suggestion algorithms.
- Feature: Movie Details Viewer.
- Feature: Account Page with Base64 Local Storage Profile saving.
- GitHub Pages Deployment Configuration (film.nexusgit.info CNAME).
- Overhauled the Design System to match the Google Stitch Reference (Spline Sans font, Material Symbols).
- Feature: Functional Search — Navbar search bar routes to `/search?q=` with infinite scroll results grid.
- Feature: MovieViewer upgrade — synopsis text, genre tags, poster error fallback, "You Might Also Like" related movies.
- Feature: Watchlist — bookmark toggle on MovieCard (hover) and MovieViewer sidebar, full CRUD in localStorage, Account page watchlist grid with remove buttons.
- Feature: Account page polish — save toast notification, watchlist section, expanded genre select, extracted inline styles to [Account.css](file:///v:/Documents/Personal%20Projects/FilmReel/src/styles/Account.css).
- Feature: 404 "Scene Not Found" page with themed gradient text and CTA buttons.
- Feature: Netflix-style MovieViewer redesign — full-viewport player, gradient fade, scroll-for-details hint, below-the-fold info layout.
- Feature: Stitch UI immersive player overlay — glassmorphism control bar, title pill, center play circle, Mood Mode button, cinematic TMDB backdrop.
- Feature: PostMessage player sync — live progress bar, time display, and play/pause state synced with VidKing iframe via `PLAYER_EVENT` messages. Auto-hiding controls on idle, resume-from-where-left-off via localStorage.

### Fixed

- Genre labels on MovieCards now dynamically resolve from TMDB genre IDs via `GenreMap` (was hardcoded "Action").
- Removed `console.log` of TMDB API key (security fix).
- Replaced dead `via.placeholder.com` poster fallback with inline SVG + `onError` handler.
- Fixed MovieRow global dedup emptying all rows — changed to row-scoped deduplication.
- Fixed IntersectionObserver on `display: contents` wrapper (replaced with 1px sentinel element).
