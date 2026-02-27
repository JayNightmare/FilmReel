# FilmReel

FilmReel is a modern, responsive web application that lets you browse, discover, and watch movies. Built with a sleek Glassmorphism design system (Apple iOS 26 inspired dark theme with purple accents), it offers a premium movie discovery and viewing experience.

## Features

- **Home Dashboard:** A Netflix-style browser where movies are categorized by genre in horizontally scrolling rows. Features a dynamic hero spotlight for trending releases.
- **Movie Viewer:** Dive into a movie's details (rating, release date, overview), browse dynamic Top Cast carousels, and watch securely via the integrated embedded players.
- **About & Transparency Page:** A first-person About page covering FilmReel's mission, privacy-first model, developer background, tech stack, and contribution links.
- **Multi-Provider Streaming:** Seamlessly switch between streaming sources (VidKing, VidSrc, SuperEmbed) via a sleek Glassmorphic dropdown to ensure uninterrupted playback.
- **Advanced Discovery & Search:** Instantly find content using the live debounced Navbar search autocomplete, or drill down using the Advanced Filter Panel (genre, actor, year, score).
- **Mood Discovery Survey:** Can't decide what to watch? Take a quick, interactive one-word survey. Your answers determine your current mood, and the app's weighted algorithm suggests movies tailored to how you're feeling.
- **Account Settings & Watchlist:** Customize your profile locally, save your favorite genres, and manage your curated Watchlist completely offline.
- **Integrated Feedback Flow:** Users can submit playback issues, general feedback, or feature requests from the Navbar and About page via a built-in modal.
- **Privacy-First Storage:** User profile, watchlist, mood history, and viewing progress are stored locally in the browser (no dedicated backend user database).
- **Mobile First:** A meticulously crafted Apple iOS 26 / Google Stitch UI design system ensures flawless, visually stunning responsiveness across all screen sizes.

## Roadmap

- **Episode-Level Tracking:** Continue expanding TV progress persistence with richer season/episode completion controls.

## Tech Stack

- **Framework:** React + TypeScript
- **Build Tool:** Vite
- **Styling:** Vanilla CSS (Vars, Glassmorphism, Flexbox/Grid)
- **Routing:** React Router DOM
- **Icons:** Lucide React
- **Data Persistence:** Local Storage (No backend required)
- **APIs:** The Movie Database (TMDB) for metadata, VidKing.net for video playback

## Getting Started

### Prerequisites

Ensure you have Node.js and npm installed on your machine.

### Installation

1. Clone the repository:

      ```bash
      git clone <your-repo-url>
      cd FilmReel
      ```

2. Install dependencies:

      ```bash
      npm install
      ```

3. Setup environment variables:
   By default, the app uses mock data. To use live TMDB data, provide an API key. Create a `.env` file in the root directory:

      ```env
      TMDB_API_KEY=your_tmdb_api_key_here
      ```

4. Run the development server:

      ```bash
      npm run dev
      ```

5. Open your browser and navigate to the provided local URL (typically `http://localhost:5173`).

## Deployment

This project is configured to deploy automatically to GitHub Pages using the `gh-pages` package.

To deploy:

```bash
npm run deploy
```

The site will be built and pushed to the `gh-pages` branch, serving at `https://film.nexusgit.info`.

## License

This project is for personal use and educational purposes. Data provided by TMDB. Video streaming provided by VidKing.
