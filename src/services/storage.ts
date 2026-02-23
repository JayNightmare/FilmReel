export interface UserProfile {
    displayName: string;
    avatarBase64: string | null;
    favoriteGenreId: number | null;
}

export interface MoodResult {
    date: string; // ISO String
    recommendedGenreId: number;
    moodLabel: string;
}

export interface WatchlistItem {
    id: number;
    title: string;
    poster_path: string | null;
    addedAt: string; // ISO String
    mediaType?: "movie" | "tv";
}

const PROFILE_KEY = "filmreel_user_profile";
const MOOD_HISTORY_KEY = "filmreel_mood_history";
const WATCHLIST_KEY = "filmreel_watchlist";
const WATCHED_MOVIES_KEY = "filmreel_watched_movies";

// Default Profile
const defaultProfile: UserProfile = {
    displayName: "CinemaLover99",
    avatarBase64: null,
    favoriteGenreId: null,
};

export const StorageService = {
    // --- Profile Management ---
    getProfile: (): UserProfile => {
        try {
            const data = localStorage.getItem(PROFILE_KEY);
            return data ? JSON.parse(data) : defaultProfile;
        } catch {
            return defaultProfile;
        }
    },

    saveProfile: (profile: UserProfile): void => {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
        StorageService.dispatchStorageEvent(PROFILE_KEY);
    },

    // --- Mood History Management ---
    getMoodHistory: (): MoodResult[] => {
        try {
            const data = localStorage.getItem(MOOD_HISTORY_KEY);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    },

    addMoodResult: (result: MoodResult): void => {
        const history = StorageService.getMoodHistory();
        // Keep only the last 10 results to save space
        const updated = [result, ...history].slice(0, 10);
        localStorage.setItem(MOOD_HISTORY_KEY, JSON.stringify(updated));
    },

    // --- Watchlist Management ---
    getWatchlist: (): WatchlistItem[] => {
        try {
            const data = localStorage.getItem(WATCHLIST_KEY);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    },

    addToWatchlist: (movie: {
        id: number;
        title: string;
        poster_path: string | null;
        mediaType?: "movie" | "tv";
    }): void => {
        const list = StorageService.getWatchlist();
        if (list.some((item) => item.id === movie.id)) return;
        const item: WatchlistItem = {
            ...movie,
            addedAt: new Date().toISOString(),
            mediaType: movie.mediaType ?? "movie",
        };
        localStorage.setItem(WATCHLIST_KEY, JSON.stringify([item, ...list]));
        StorageService.dispatchStorageEvent(WATCHLIST_KEY);
    },

    removeFromWatchlist: (movieId: number): void => {
        const list = StorageService.getWatchlist().filter(
            (item) => item.id !== movieId,
        );
        localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
        StorageService.dispatchStorageEvent(WATCHLIST_KEY);
    },

    isInWatchlist: (movieId: number): boolean => {
        return StorageService.getWatchlist().some(
            (item) => item.id === movieId,
        );
    },

    // --- Watched Movies Tracking ---
    markAsWatched: (movieId: number): void => {
        try {
            const data = localStorage.getItem(WATCHED_MOVIES_KEY);
            const watched: number[] = data ? JSON.parse(data) : [];

            if (!watched.includes(movieId)) {
                // Keep the most recent 100 watched movies to prevent infinite buildup
                const updated = [movieId, ...watched].slice(0, 100);
                localStorage.setItem(
                    WATCHED_MOVIES_KEY,
                    JSON.stringify(updated),
                );
                StorageService.dispatchStorageEvent(WATCHED_MOVIES_KEY);
            }
        } catch {
            /* storage full — silently fail */
        }
    },

    hasWatched: (movieId: number): boolean => {
        try {
            const data = localStorage.getItem(WATCHED_MOVIES_KEY);
            if (!data) return false;
            const watched: number[] = JSON.parse(data);
            return watched.includes(movieId);
        } catch {
            return false;
        }
    },

    getWatchedMovies: (): number[] => {
        try {
            const data = localStorage.getItem(WATCHED_MOVIES_KEY);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    },

    removeWatchedMovie: (movieId: number): void => {
        try {
            const data = localStorage.getItem(WATCHED_MOVIES_KEY);
            if (!data) return;
            const watched: number[] = JSON.parse(data);
            const filtered = watched.filter((id) => id !== movieId);
            localStorage.setItem(WATCHED_MOVIES_KEY, JSON.stringify(filtered));
            StorageService.dispatchStorageEvent(WATCHED_MOVIES_KEY);
        } catch {
            /* silently fail */
        }
    },

    // Helper to convert Image File -> Base64 for avatar
    fileToBase64: (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });
    },

    dispatchStorageEvent: (key: string): void => {
        window.dispatchEvent(
            new CustomEvent("filmreel-storage", { detail: { key } }),
        );
    },
};
