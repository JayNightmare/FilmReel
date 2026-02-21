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
}

const PROFILE_KEY = "filmreel_user_profile";
const MOOD_HISTORY_KEY = "filmreel_mood_history";
const WATCHLIST_KEY = "filmreel_watchlist";

// Default Profile
const defaultProfile: UserProfile = {
    displayName: "",
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
    }): void => {
        const list = StorageService.getWatchlist();
        if (list.some((item) => item.id === movie.id)) return; // Already in list
        const item: WatchlistItem = {
            ...movie,
            addedAt: new Date().toISOString(),
        };
        localStorage.setItem(WATCHLIST_KEY, JSON.stringify([item, ...list]));
    },

    removeFromWatchlist: (movieId: number): void => {
        const list = StorageService.getWatchlist().filter(
            (item) => item.id !== movieId,
        );
        localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
    },

    isInWatchlist: (movieId: number): boolean => {
        return StorageService.getWatchlist().some(
            (item) => item.id === movieId,
        );
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
};
