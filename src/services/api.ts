import dotenv from "dotenv";
dotenv.config();

// Using a placeholder constant. In production, this would be an environment variable (import.meta.env.VITE_TMDB_API_KEY)
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

export interface Movie {
    id: number;
    title: string;
    poster_path: string | null;
    backdrop_path: string | null;
    overview: string;
    vote_average: number;
    release_date: string;
    genre_ids: number[];
}

export interface Genre {
    id: number;
    name: string;
}

// Function to safely fetch from TMDB
const fetchTMDB = async <T>(
    endpoint: string,
    params: Record<string, string> = {},
): Promise<T> => {
    if (!TMDB_API_KEY || TMDB_API_KEY === "PLACEHOLDER_KEY") {
        console.warn("TMDB API Key missing. Returning mock data.");
        return getMockData(endpoint) as T;
    }

    const queryParams = new URLSearchParams({
        api_key: TMDB_API_KEY,
        language: "en-US",
        ...params,
    });

    const response = await fetch(`${BASE_URL}${endpoint}?${queryParams}`);
    if (!response.ok) {
        throw new Error(`TMDB API Error: ${response.statusText}`);
    }
    return response.json();
};

export const APIService = {
    // Get list of standard genres
    getGenres: async (): Promise<Genre[]> => {
        const data = await fetchTMDB<{ genres: Genre[] }>("/genre/movie/list");
        return data.genres;
    },

    // Get popular movies for the home dashboard
    getPopularMovies: async (): Promise<Movie[]> => {
        const data = await fetchTMDB<{ results: Movie[] }>("/movie/popular");
        return data.results;
    },

    // Get movies for a specific genre ID (used by Mood survey results)
    getMoviesByGenre: async (genreId: number): Promise<Movie[]> => {
        const data = await fetchTMDB<{ results: Movie[] }>("/discover/movie", {
            with_genres: genreId.toString(),
            sort_by: "popularity.desc",
        });
        return data.results;
    },

    // Get specific movie details
    getMovieDetails: async (movieId: number): Promise<Movie> => {
        return await fetchTMDB<Movie>(`/movie/${movieId}`);
    },
};

// --- Mock Data Fallback ---
const getMockData = (endpoint: string): unknown => {
    if (endpoint.includes("/genre/movie/list")) {
        return {
            genres: [
                { id: 28, name: "Action" },
                { id: 35, name: "Comedy" },
                { id: 18, name: "Drama" },
                { id: 878, name: "Sci-Fi" },
            ],
        };
    }

    const mockMovie: Movie = {
        id: 123456,
        title: "Mock Movie Title",
        poster_path: null,
        backdrop_path: null,
        overview:
            "This is a mock overview because no TMDB API key is provided.",
        vote_average: 8.5,
        release_date: "2026-01-01",
        genre_ids: [28, 878],
    };

    if (
        endpoint.includes("/movie/popular") ||
        endpoint.includes("/discover/movie")
    ) {
        return {
            results: Array(10)
                .fill(null)
                .map((_, i) => ({
                    ...mockMovie,
                    id: mockMovie.id + i,
                    title: `Mock Movie ${i + 1}`,
                })),
        };
    }

    if (endpoint.includes("/movie/")) {
        // Details
        return mockMovie;
    }

    return {};
};
