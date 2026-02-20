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

const PROFILE_KEY = "filmreel_user_profile";
const MOOD_HISTORY_KEY = "filmreel_mood_history";

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
