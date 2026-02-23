# Project Memory: FilmReel

## Current Project State

- All core UI components and pages (Browser, Survey, Viewer, Account) have been implemented.
- The project is fully styled with the Google Stitch UI Glassmorphism aesthetic.
- Deployment scripts and custom domain CNAME have been added for `film.nexusgit.info`.
- Infinite scrolling (vertical + horizontal) on Home page using IntersectionObserver.
- Row-scoped movie deduplication in [MovieRow.tsx](file:///v:/Documents/Personal%20Projects/FilmReel/src/components/MovieRow.tsx) (replaced global dedup that was emptying rows).
- Genre labels dynamically resolved via `GenreMap` service (seeded with TMDB's 19 standard genres).
- Functional search: Navbar wired to `/search?q=` route with infinite scroll [SearchResults.tsx](file:///v:/Documents/Personal%20Projects/FilmReel/src/pages/SearchResults.tsx).
- MovieViewer upgraded: synopsis, genre tags, poster fallback, "You Might Also Like" section.
- API key no longer logged to console.
- Watchlist feature: bookmark toggle on MovieCard + MovieViewer, localStorage CRUD, Account page grid.
- Account page polished: save/remove toast notifications, dedicated [Account.css](file:///v:/Documents/Personal%20Projects/FilmReel/src/styles/Account.css), expanded genre picker.
- 404 "Scene Not Found" page with catch-all route.
- Netflix-style MovieViewer: full-viewport player, gradient fade, scroll-for-details, below-the-fold info.
- Stitch UI immersive player overlay: glassmorphism control bar, title pill, center play, Mood Mode, cinematic backdrop.
- [Movie](file:///v:/Documents/Personal%20Projects/FilmReel/src/services/api.ts#5-16) interface includes optional `runtime` field.
- PostMessage player sync: live progress/time from VidKing `PLAYER_EVENT`, auto-hide controls on idle, resume-from-saved-progress via `StorageService`.

## Active Tasks

### Completed

- Project Initialization (Vite + React + TS)
- Core project memory created (MEMORY.md, CHANGELOG.md)
- **Routing and Architecture**: Built App routing and top navigation using React Router.
- **Local Storage Manager**: Created service to handle saving user preferences and mood data.
- **API Services**: Setup fetch functions to pull mock movies/genres from TMDB and VidKing embeds.
- **Features Implementation**: Home Dashboard (Netflix clone approach), Mood Survey (weighted local system), Movie Viewer (VidKing iFrame integration).
- **Deployment Prep**: Added gh-pages NPM scripts and [public/CNAME](file:///v:/Documents/Personal%20Projects/FilmReel/public/CNAME).
- **Refactoring**: Completely overhauled the UI design system to flawlessly match the Google Stitch UI reference.
- **CI/CD**: Added a GitHub Actions workflow to automatically build and deploy the React application to the `gh-pages` branch upon pushes to main/master.
- **SEO & Social**: Improved website metadata (`index.html`) with Open Graph tags, Twitter Cards, a detailed description, and a custom SVG favicon (`film-reel.svg`).

- **Version 0.0.9**: TV Shows integration, plus a static release notes notification system (`releaseNotes.ts` config → Navbar diff against localStorage).
- **Version 0.0.8**: Restructured MovieViewer details to YouTube-style layout; fixed autocomplete dropdown clipping issue caused by navbar CSS constraints.
- **Version 0.0.7**: Comprehensive mobile layout audit and overhaul ensuring robust cross-device support; globally constrained horizontal overflow.
- **Version 0.0.6**: Integrated multi-provider streaming support via a sleek Glassmorphic sidebar dropdown; migrated to a performant binary "Watched" status trigger.
- **Version 0.0.5**: Added Movie Viewer Splash Controls (slider, restart, resume) synchronized with local storage.
- **Version 0.0.4**: Navbar Search Overhaul with live autocomplete; Advanced Filter Panel for detailed querying.
- **Version 0.0.3**: Dynamic Top Cast Carousel in MovieViewer; Mood Survey Overhaul; `useStorageSync` hook built.
- **Version 0.0.2**: Robust 404 page; Watchlist system overhaul; Netflix-style MovieViewer immersive redesign.
- **Version 0.0.1**: Initial project architecture, Glassmorphism design system, Home Browser, Mood Survey, Account Profile.

### Next Features

- **Episode-Level Tracking**: Track individual episodes as watched for TV series continuation.

## Architectural Decisions

- UI Framework: React with TypeScript.
- Build Tool: Vite
- CSS Strategy: Vanilla CSS custom Glassmorphism mimicking Tailwind utility concepts (Google Stitch UI).
- Data Persistence: LocalStorage (No Backend Database).
- Architecture: Functional Components with Hooks.
- APIs:
    - Video stream/information: `vidking.net`, `vidsrc.me`, `multiembed.mov`
    - Metadata: TMDB
