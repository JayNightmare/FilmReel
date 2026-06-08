# FilmReel Feature Implementation Plan

This plan outlines the phases for implementing the new features we discussed. We have grouped them logically to ensure a smooth progression from bug fixes and core enhancements to entirely new functionality.

## Phase 1: Refinement & Bug Fixes

> COMPLETE

### **1. Fix Actor Search Bug**

- **Problem:** Clicking an actor in the MovieViewer results in an empty search page.
- **Root Cause Investigation:** The TMDB API successfully returns results for `/person/{id}/movie_credits` and `/tv_credits`. The issue lies in how `SearchResults.tsx` handles the initial data load, pagination state closures, or URL parameter parsing for `with_people`.
- **Fix:** Ensure `SearchResults.tsx` properly falls into the `actor` category branch, correctly initializes the `actorResultsRef`, and prevents the `IntersectionObserver` from triggering a premature `loadMore` that might overwrite state. We will add robust error handling.

### **2. Expand "Continue Watching" Row**

- **Update:** We currently store TV Show progress (`filmreel_tv_progress`) and recently watched movies/episodes in `StorageService`.
- **Implementation:**
  - Create a specialized `ContinueWatchingRow` component for `Home.tsx`.
  - Pull items where progress is active (e.g., partial movie watch, or TV shows where `watchedEpisodes < totalEpisodes`).
  - Add "Resume" quick-action buttons directly on the row cards.

## Phase 2: Core Streaming Enhancements

> COMPLETE

### **1. TV Series Episode Tracking**

- **Update:** Extend `TVViewer.tsx` and `MovieViewer.tsx` to utilize `StorageService.markEpisodeWatched`.
- **Implementation:**
  - In `TVViewer.tsx`, track the currently selected season and episode.
  - When an episode begins playing (or after a certain duration threshold), trigger the `markEpisodeWatched` function.
  - Add a visual indicator (like a checkmark or progress bar) on the Season/Episode selection list to show which episodes have already been watched.

### **2. Official Trailer Integration**

- **Implementation:**
  - Update `APIService` to fetch the `/movie/{id}/videos` or `/tv/{id}/videos` TMDB endpoint to find official YouTube trailer keys.
  - Add a "Watch Trailer" button next to the "Add to Watchlist" action in the `MovieViewer` and `TVViewer` sidebar or hero section.
  - Create a clean, glassmorphic modal using an embedded YouTube player that overlays the screen without interrupting the main page state.

## Phase 3: Engagement & Personalization

> COMPLETE

### **1. Custom Playlists**

- **Implementation:**
  - Extend `StorageService` to support multiple lists (e.g., `filmreel_custom_playlists`).
  - Update the `Account.tsx` page to include a "Playlists" section with the ability to Create, Edit, and Delete playlists.
  - Modify the `toggleWatchlist` behavior on `MovieCard` and `MovieViewer` to instead open a small dropdown or modal, allowing the user to select _which_ playlist to add the item to (including the default Watchlist).

### **2. PWA (Progressive Web App) Support**

- **Implementation:**
  - Add a `manifest.json` with appropriate icons and theme colors matching the Stitch UI dark theme.
  - Implement a service worker using `vite-plugin-pwa` to cache core UI assets for faster load times and provide an offline fallback page.
  - Add an "Install App" prompt capability for mobile users.

## Phase 4: Experimental Features

> IN PROGRESS

### **1. "Roulette" Survey Option**

- **Implementation:**
  - Add a "Surprise Me" or "Roulette" card option at the beginning of the `MoodSurvey.tsx`.
  - If selected, build a distinct visual view mimicking a slot machine. The slots will spin through highly-rated items from the user's Watchlist (or popular hidden gems).
  - When the animation stops, present 3 random movies.
  - Provide action buttons: "Watch Now", "Add to Watchlist", or "Spin Again".

### **2. AI-Powered Recommendations**

- **Implementation:**
  - Integrate a simple AI recommendation engine that analyzes the user's Watchlist and viewing history to suggest new content.
  - Display these recommendations in a new "Recommended for You" row on the `Home.tsx` and within the `MovieViewer`/`TVViewer` sidebars.
  - Allow users to provide feedback (like/dislike) on recommendations to improve future suggestions.

### **3. Social Sharing**

- **Implementation:**
  - Add a "Share" button on `MovieViewer` and `TVViewer` that generates a shareable link to the movie/TV show details.
  - Integrate with popular social media platforms (Twitter, Facebook) to allow users to share their favorite content directly from the app.
  - Optionally, include a "Copy Link" feature for easy sharing.
