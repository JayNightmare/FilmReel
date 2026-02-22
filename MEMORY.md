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

- **Phase 1 Implementation**: Enhanced foundational codebase with new TMDB API endpoints ([getMovieCredits](file:///v:/Documents/Personal%20Projects/FilmReel/src/services/api.ts#123-129), [getHiddenGems](file:///v:/Documents/Personal%20Projects/FilmReel/src/services/api.ts#160-170), etc.), upgraded `StorageService`, and built [useStorageSync](file:///v:/Documents/Personal%20Projects/FilmReel/src/hooks/useStorageSync.ts#3-36) hook. Redesigned Home page with reactive rows.
- **Phase 2 Implementation**: Integrated TMDB Cast credits into Movie Viewer. Completely overhauled Mood Survey (glassmorphic UI, one-word options, animated sequence, Extend Survey via sentiment matching).

- **Phase 3 Implementation**: Enhanced the Navbar with a live debounced search autocomplete and an advanced filter panel. Also overhauled SearchResults to support the new URL parameters.
- **Phase 4 Implementation**: Upgraded the Movie Viewer splash screen with an interactive progress panel. Added a seek slider, Restart, and Resume buttons that sync identically to VidKing's `watch_progress` key.
- **Phase 5 Implementation**: Added multi-provider streaming support to the Movie Viewer. Users can now switch between VidKing (default), VidSrc, and SuperEmbed via a Glassmorphic dropdown in the details sidebar to bypass broken host servers. Note: Progress tracking degrades gracefully for VidSrc/SuperEmbed as they don't emit postMessage events.
- **Phase 6 Implementation**: Replaced VidKing continuous `postMessage` time sync with a simple binary "Watched" status trigger upon play. This resolves the severe iframe stuttering issue caused by constant React state updates. The Home dashboard "Continue Watching" row was similarly converted to a "Watch It Again" row.
- **Phase 7 Implementation**: Fixed UI styling bugs across the application. Added a sleek Glassmorphism design to the Source Provider dropdown in the Movie Viewer. Fixed the Advanced Search Panel's positioning in the Navbar to correctly anchor below the search bar, and updated its internal buttons to use the global theme.
- **Phase 8 Implementation**: Implemented proper mobile responsiveness for the Navbar. The Search bar, which was previously strictly hidden on mobile devices, has been restored by dynamically reflowing the Navbar into two rows (Logo/Actions on top, Search underneath) via CSS `flex-wrap` and `order`.
- **Phase 9 Implementation**: Addressed mobile page stretching issues. Fixed the `MovieViewer` Cast Carousel from exceeding `100vw` by securely constraining its mobile `max-width`. Updated the Feedback Modal to include `max-height` (90vh) and internal scrolling `overflow-y: auto` so it remains fully accessible on short screens.
- **Phase 10 Implementation**: Comprehensive mobile layout audit and overhaul. Added `overflow-x: hidden` globally (html/body/container/navbar), fixed the Navbar with `flex-wrap` and `flex-basis: 100%` to force the search bar to its own row, added responsive hero section sizing, fixed hero description clipping by replacing `truncate` with `line-clamp-2`, added mobile carousel edge-to-edge scrolling, and repositioned the FAB.
- **Phase 11 Implementation**: Moved the playback feedback and refresh actions from the hard-to-tap overlay pill to a dedicated mobile-only pill row next to the movie title in the info section. The overlay pill is hidden on mobile, while the new action buttons are hidden on desktop.

### Next Features

- All Phase 1-5 features have been fully completed.

## Architectural Decisions

- UI Framework: React with TypeScript.
- Build Tool: Vite
- CSS Strategy: Vanilla CSS custom Glassmorphism mimicking Tailwind utility concepts (Google Stitch UI).
- Data Persistence: LocalStorage (No Backend Database).
- Architecture: Functional Components with Hooks.
- APIs:
    - Video stream/information: `vidking.net`, `vidsrc.me`, `multiembed.mov`
    - Metadata: TMDB
