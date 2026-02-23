// Using a placeholder constant. In production, this would be an environment variable (import.meta.env.VITE_TMDB_API_KEY)
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
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
    runtime?: number;
}

export interface Genre {
    id: number;
    name: string;
}

export interface CastMember {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
    order: number;
}

export interface Review {
    id: string;
    author: string;
    content: string;
    author_details: {
        rating: number | null;
    };
}

export interface Person {
    id: number;
    name: string;
    profile_path: string | null;
    known_for_department: string;
}

export interface TVShow {
    id: number;
    name: string;
    poster_path: string | null;
    backdrop_path: string | null;
    overview: string;
    vote_average: number;
    first_air_date: string;
    genre_ids: number[];
    number_of_seasons?: number;
    number_of_episodes?: number;
    seasons?: Season[];
}

export interface Season {
    id: number;
    season_number: number;
    name: string;
    overview: string;
    poster_path: string | null;
    air_date: string | null;
    episode_count: number;
    episodes?: Episode[];
}

export interface Episode {
    id: number;
    episode_number: number;
    season_number: number;
    name: string;
    overview: string;
    still_path: string | null;
    air_date: string | null;
    runtime: number | null;
    vote_average: number;
}

// Function to safely fetch from TMDB
const fetchTMDB = async <T>(
    endpoint: string,
    params: Record<string, string> = {},
): Promise<T> => {
    if (
        !TMDB_API_KEY ||
        TMDB_API_KEY.trim() === "" ||
        TMDB_API_KEY === "PLACEHOLDER_KEY"
    ) {
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
    getPopularMovies: async (page: number = 1): Promise<Movie[]> => {
        const data = await fetchTMDB<{ results: Movie[] }>("/movie/popular", {
            page: page.toString(),
        });
        return data.results;
    },

    // Get movies for a specific genre ID (used by Mood survey results)
    getMoviesByGenre: async (
        genreId: number,
        page: number = 1,
    ): Promise<Movie[]> => {
        const data = await fetchTMDB<{ results: Movie[] }>("/discover/movie", {
            with_genres: genreId.toString(),
            sort_by: "popularity.desc",
            page: page.toString(),
        });
        return data.results;
    },

    // Get specific movie details
    getMovieDetails: async (movieId: number): Promise<Movie> => {
        return await fetchTMDB<Movie>(`/movie/${movieId}`);
    },

    // Search movies by query string
    searchMovies: async (query: string, page: number = 1): Promise<Movie[]> => {
        const data = await fetchTMDB<{ results: Movie[] }>("/search/movie", {
            query,
            page: page.toString(),
        });
        return data.results;
    },

    // Get similar movies for a given movie ID
    getSimilarMovies: async (movieId: number): Promise<Movie[]> => {
        const data = await fetchTMDB<{ results: Movie[] }>(
            `/movie/${movieId}/similar`,
        );
        return data.results;
    },

    getMovieCredits: async (movieId: number): Promise<CastMember[]> => {
        const data = await fetchTMDB<{ cast: CastMember[] }>(
            `/movie/${movieId}/credits`,
        );
        return data.cast.sort((a, b) => a.order - b.order);
    },

    getMovieReviews: async (
        movieId: number,
        page: number = 1,
    ): Promise<Review[]> => {
        const data = await fetchTMDB<{ results: Review[] }>(
            `/movie/${movieId}/reviews`,
            { page: page.toString() },
        );
        return data.results;
    },

    searchPerson: async (query: string): Promise<Person[]> => {
        const data = await fetchTMDB<{ results: Person[] }>("/search/person", {
            query,
        });
        return data.results;
    },

    getMoviesByPerson: async (
        personId: number,
        page: number = 1,
    ): Promise<Movie[]> => {
        const data = await fetchTMDB<{ results: Movie[] }>("/discover/movie", {
            with_people: personId.toString(),
            sort_by: "popularity.desc",
            page: page.toString(),
        });
        return data.results;
    },

    getHiddenGems: async (page: number = 1): Promise<Movie[]> => {
        const data = await fetchTMDB<{ results: Movie[] }>("/discover/movie", {
            sort_by: "vote_average.desc",
            "vote_average.gte": "7",
            "vote_count.gte": "50",
            "vote_count.lte": "500",
            page: page.toString(),
        });
        return data.results;
    },

    discoverMovies: async (
        filters: Record<string, string>,
        page: number = 1,
    ): Promise<Movie[]> => {
        const data = await fetchTMDB<{ results: Movie[] }>("/discover/movie", {
            ...filters,
            page: page.toString(),
        });
        return data.results;
    },

    // --- TV Show Methods ---

    getTVGenres: async (): Promise<Genre[]> => {
        const data = await fetchTMDB<{ genres: Genre[] }>("/genre/tv/list");
        return data.genres;
    },

    getPopularTV: async (page: number = 1): Promise<TVShow[]> => {
        const data = await fetchTMDB<{ results: TVShow[] }>("/tv/popular", {
            page: page.toString(),
        });
        return data.results;
    },

    getTVDetails: async (tvId: number): Promise<TVShow> => {
        return await fetchTMDB<TVShow>(`/tv/${tvId}`);
    },

    getSeasonDetails: async (
        tvId: number,
        seasonNumber: number,
    ): Promise<Season> => {
        return await fetchTMDB<Season>(`/tv/${tvId}/season/${seasonNumber}`);
    },

    searchTV: async (query: string, page: number = 1): Promise<TVShow[]> => {
        const data = await fetchTMDB<{ results: TVShow[] }>("/search/tv", {
            query,
            page: page.toString(),
        });
        return data.results;
    },

    getSimilarTV: async (tvId: number): Promise<TVShow[]> => {
        const data = await fetchTMDB<{ results: TVShow[] }>(
            `/tv/${tvId}/similar`,
        );
        return data.results;
    },

    getTVCredits: async (tvId: number): Promise<CastMember[]> => {
        const data = await fetchTMDB<{ cast: CastMember[] }>(
            `/tv/${tvId}/credits`,
        );
        return data.cast.sort((a, b) => a.order - b.order);
    },

    discoverTV: async (
        filters: Record<string, string>,
        page: number = 1,
    ): Promise<TVShow[]> => {
        const data = await fetchTMDB<{ results: TVShow[] }>("/discover/tv", {
            ...filters,
            page: page.toString(),
        });
        return data.results;
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
        // Extract page from endpoint/mock pseudo logic if needed, but since it's mock, just generate continuous random IDs
        // Or assume page is passed via queryParams in real fetchTMDB. The mock data generator doesn't easily see params here unless passed.
        // We'll just generate random IDs to simulate new pages of mock data.
        const mockRandomizerOffset = Math.floor(Math.random() * 1000000);
        return {
            results: Array(10)
                .fill(null)
                .map((_, i) => ({
                    ...mockMovie,
                    id: mockRandomizerOffset + i,
                    title: `Mock Movie ${mockRandomizerOffset + i}`,
                })),
        };
    }

    if (endpoint.includes("/movie/") && endpoint.includes("/similar")) {
        const mockRandomizerOffset = Math.floor(Math.random() * 1000000);
        return {
            results: Array(6)
                .fill(null)
                .map((_, i) => ({
                    ...mockMovie,
                    id: mockRandomizerOffset + i,
                    title: `Related Mock ${mockRandomizerOffset + i}`,
                })),
        };
    }

    if (endpoint.includes("/search/movie")) {
        const mockRandomizerOffset = Math.floor(Math.random() * 1000000);
        return {
            results: Array(8)
                .fill(null)
                .map((_, i) => ({
                    ...mockMovie,
                    id: mockRandomizerOffset + i,
                    title: `Search Result ${mockRandomizerOffset + i}`,
                })),
        };
    }

    if (endpoint.includes("/movie/")) {
        return mockMovie;
    }

    // --- TV Mock Data ---
    if (endpoint.includes("/genre/tv/list")) {
        return {
            genres: [
                { id: 10759, name: "Action & Adventure" },
                { id: 35, name: "Comedy" },
                { id: 18, name: "Drama" },
                { id: 10765, name: "Sci-Fi & Fantasy" },
            ],
        };
    }

    const mockTV: TVShow = {
        id: 654321,
        name: "Mock TV Show",
        poster_path: null,
        backdrop_path: null,
        overview: "This is a mock TV show because no TMDB API key is provided.",
        vote_average: 8.0,
        first_air_date: "2026-01-01",
        genre_ids: [18, 10765],
        number_of_seasons: 3,
    };

    if (endpoint.includes("/tv/popular") || endpoint.includes("/discover/tv")) {
        const offset = Math.floor(Math.random() * 1000000);
        return {
            results: Array(10)
                .fill(null)
                .map((_, i) => ({
                    ...mockTV,
                    id: offset + i,
                    name: `Mock TV Show ${offset + i}`,
                })),
        };
    }

    if (endpoint.includes("/search/tv")) {
        const offset = Math.floor(Math.random() * 1000000);
        return {
            results: Array(8)
                .fill(null)
                .map((_, i) => ({
                    ...mockTV,
                    id: offset + i,
                    name: `TV Search Result ${offset + i}`,
                })),
        };
    }

    if (endpoint.includes("/tv/") && endpoint.includes("/season/")) {
        return {
            id: 1,
            season_number: 1,
            name: "Season 1",
            overview: "Mock season overview.",
            poster_path: null,
            air_date: "2026-01-01",
            episode_count: 8,
            episodes: Array(8)
                .fill(null)
                .map((_, i) => ({
                    id: i + 1,
                    episode_number: i + 1,
                    season_number: 1,
                    name: `Episode ${i + 1}`,
                    overview: `Mock episode ${i + 1} overview.`,
                    still_path: null,
                    air_date: "2026-01-01",
                    runtime: 45,
                    vote_average: 7.5,
                })),
        } as Season;
    }

    if (endpoint.includes("/tv/")) {
        return {
            ...mockTV,
            seasons: [
                {
                    id: 1,
                    season_number: 1,
                    name: "Season 1",
                    overview: "",
                    poster_path: null,
                    air_date: "2026-01-01",
                    episode_count: 10,
                },
                {
                    id: 2,
                    season_number: 2,
                    name: "Season 2",
                    overview: "",
                    poster_path: null,
                    air_date: "2026-06-01",
                    episode_count: 8,
                },
            ],
        };
    }

    return {};
};
