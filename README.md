# FilmReel 🎬

FilmReel is a modern, responsive web application that lets you browse, discover, and watch movies. Built with a sleek Glassmorphism design system (Apple iOS 26 inspired dark theme with purple accents), it offers a premium movie discovery and viewing experience.

## ✨ Features

- **Home Dashboard:** A Netflix-style browser where movies are categorized by genre in horizontally scrolling rows. Features a dynamic hero spotlight for trending releases.
- **Mood Discovery Survey:** Can't decide what to watch? Take a quick 5-question survey. Your answers determine your current mood, and the app's weighted algorithm suggests movies tailored to how you're feeling.
- **Movie Viewer:** Dive into a movie's details (rating, release date, overview) and watch securely via the integrated VidKing embedded player.
- **Account Settings:** Customize your profile locally. Set your display name, favorite genre, and securely convert a profile picture up to 5MB into a local Base64 string.
- **Mood History:** Keep track of your past moods and recommendations straight from your Account page.

## 🛠️ Tech Stack

- **Framework:** React + TypeScript
- **Build Tool:** Vite
- **Styling:** Vanilla CSS (Vars, Glassmorphism, Flexbox/Grid)
- **Routing:** React Router DOM
- **Icons:** Lucide React
- **Data Persistence:** Local Storage (No backend required)
- **APIs:** The Movie Database (TMDB) for metadata, VidKing.net for video playback

## 🚀 Getting Started

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

## 🚢 Deployment

This project is configured to deploy automatically to GitHub Pages using the `gh-pages` package.

To deploy:

```bash
npm run deploy
```

The site will be built and pushed to the `gh-pages` branch, serving at `https://film.nexusgit.info`.

## 📝 License

This project is for personal use and educational purposes. Data provided by TMDB. Video streaming provided by VidKing.
