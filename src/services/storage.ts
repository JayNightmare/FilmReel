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

export interface WatchProgress {
    movieId: number;
    currentTime: number;
}

const PROFILE_KEY = "filmreel_user_profile";
const MOOD_HISTORY_KEY = "filmreel_mood_history";
const WATCHLIST_KEY = "filmreel_watchlist";
const WATCH_PROGRESS_KEY = "filmreel_watch_progress";

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
    }): void => {
        const list = StorageService.getWatchlist();
        if (list.some((item) => item.id === movie.id)) return;
        const item: WatchlistItem = {
            ...movie,
            addedAt: new Date().toISOString(),
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

    // --- Watch Progress ---
    saveWatchProgress: (movieId: number, currentTime: number): void => {
        try {
            // FilmReel Storage
            const data = localStorage.getItem(WATCH_PROGRESS_KEY);
            const progress: Record<string, number> = data
                ? JSON.parse(data)
                : {};
            progress[String(movieId)] = Math.floor(currentTime);
            localStorage.setItem(WATCH_PROGRESS_KEY, JSON.stringify(progress));
            StorageService.dispatchStorageEvent(WATCH_PROGRESS_KEY);

            // VidKing Storage Sync
            const vkData = localStorage.getItem("watch_progress");
            if (vkData) {
                const vkProgress = JSON.parse(vkData);
                const vkMovie = vkProgress[String(movieId)];
                if (vkMovie && vkMovie.progress) {
                    vkMovie.progress.watched = currentTime;
                    vkMovie.progress.percent =
                        (currentTime / vkMovie.progress.duration) * 100;
                    vkMovie.progress.last_watched = Date.now();
                    vkMovie.last_updated = Date.now();
                    localStorage.setItem(
                        "watch_progress",
                        JSON.stringify(vkProgress),
                    );
                }
            }
        } catch {
            /* storage full — silently fail */
        }
    },

    getWatchProgress: (movieId: number): number | null => {
        try {
            const data = localStorage.getItem(WATCH_PROGRESS_KEY);
            if (!data) return null;
            const progress: Record<string, number> = JSON.parse(data);
            return progress[String(movieId)] ?? null;
        } catch {
            return null;
        }
    },

    getVidKingDuration: (movieId: number): number | null => {
        try {
            const data = localStorage.getItem("watch_progress");
            if (!data) return null;
            const progress = JSON.parse(data);
            const vkMovie = progress[String(movieId)];
            return vkMovie?.progress?.duration || null;
        } catch {
            return null;
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

    getAllWatchProgress: (): WatchProgress[] => {
        try {
            const data = localStorage.getItem(WATCH_PROGRESS_KEY);
            if (!data) return [];
            const progress: Record<string, number> = JSON.parse(data);
            return Object.entries(progress)
                .filter(([, time]) => time > 10)
                .map(([id, time]) => ({
                    movieId: parseInt(id, 10),
                    currentTime: time,
                }));
        } catch {
            return [];
        }
    },

    removeWatchProgress: (movieId: number): void => {
        try {
            const data = localStorage.getItem(WATCH_PROGRESS_KEY);
            if (!data) return;
            const progress: Record<string, number> = JSON.parse(data);
            delete progress[String(movieId)];
            localStorage.setItem(WATCH_PROGRESS_KEY, JSON.stringify(progress));
            StorageService.dispatchStorageEvent(WATCH_PROGRESS_KEY);
        } catch {
            /* silently fail */
        }
    },

    dispatchStorageEvent: (key: string): void => {
        window.dispatchEvent(
            new CustomEvent("filmreel-storage", { detail: { key } }),
        );
    },
};
