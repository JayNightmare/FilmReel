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

export interface WatchedEpisode {
	tvId: number;
	seasonNumber: number;
	episodeNumber: number;
	showTitle: string;
	posterPath: string | null;
	watchedAt: string; // ISO String
	genre_ids?: number[];
}

export interface TVShowProgress {
	tvId: number;
	showTitle: string;
	posterPath: string | null;
	totalSeasons: number;
	totalEpisodes: number;
	watchedEpisodes: number;
	lastWatchedEpisode: {
		seasonNumber: number;
		episodeNumber: number;
		watchedAt: string;
	};
	updatedAt: string; // ISO String
	genre_ids?: number[];
}

const PROFILE_KEY = "filmreel_user_profile";
const MOOD_HISTORY_KEY = "filmreel_mood_history";
const WATCHLIST_KEY = "filmreel_watchlist";
const WATCHED_MOVIES_KEY = "filmreel_watched_movies";
const WATCHED_EPISODES_KEY = "filmreel_watched_episodes";
const TV_PROGRESS_KEY = "filmreel_tv_progress";
const MAX_WATCHED_MOVIES = 100;
const MAX_WATCHED_EPISODES = 1000;

const getParsedArray = <T,>(key: string): T[] => {
	try {
		const data = localStorage.getItem(key);
		if (!data) return [];
		const parsed = JSON.parse(data);
		return Array.isArray(parsed) ? (parsed as T[]) : [];
	} catch {
		return [];
	}
};

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
			if (!data) return defaultProfile;

			const parsed = JSON.parse(data) as Partial<UserProfile>;
			const rawFavoriteGenreId = parsed.favoriteGenreId;
			const normalizedFavoriteGenreId =
				typeof rawFavoriteGenreId === "number"
					? rawFavoriteGenreId
					: typeof rawFavoriteGenreId === "string"
						? Number.parseInt(
							rawFavoriteGenreId,
							10,
						)
						: null;

			return {
				displayName:
					typeof parsed.displayName ===
						"string" &&
						parsed.displayName.trim().length > 0
						? parsed.displayName
						: defaultProfile.displayName,
				avatarBase64:
					typeof parsed.avatarBase64 === "string"
						? parsed.avatarBase64
						: null,
				favoriteGenreId: Number.isNaN(
					normalizedFavoriteGenreId,
				)
					? null
					: normalizedFavoriteGenreId,
			};
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
		localStorage.setItem(
			WATCHLIST_KEY,
			JSON.stringify([item, ...list]),
		);
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
	markAsWatched: (input: number | { id: number; genre_ids?: number[] }): void => {
		const movieId = typeof input === "number" ? input : input.id;
		const genre_ids = typeof input === "number" ? undefined : input.genre_ids;
		let didChange = false;
		try {
			const watched = getParsedArray<any>(
				WATCHED_MOVIES_KEY,
			);
			
			const alreadyExists = watched.some(item => (typeof item === 'number' ? item : item.id) === movieId);

			if (!alreadyExists) {
				const newItem = { id: movieId, genre_ids, watchedAt: new Date().toISOString() };
				// Keep the most recent 100 watched movies to prevent infinite buildup
				const updated = [newItem, ...watched].slice(0, MAX_WATCHED_MOVIES);
				localStorage.setItem(
					WATCHED_MOVIES_KEY,
					JSON.stringify(updated),
				);
				didChange = true;
			}
		} catch (err) {
			console.warn("Failed to mark movie as watched:", err);
		} finally {
			if (didChange) {
				StorageService.dispatchStorageEvent(WATCHED_MOVIES_KEY);
			}
		}
	},

	hasWatched: (movieId: number): boolean => {
		try {
			const data = localStorage.getItem(WATCHED_MOVIES_KEY);
			if (!data) return false;
			const watched: any[] = JSON.parse(data);
			return watched.some(item => (typeof item === 'number' ? item : item.id) === movieId);
		} catch {
			return false;
		}
	},

	getWatchedMovies: (): number[] => {
		const raw = getParsedArray<any>(WATCHED_MOVIES_KEY);
		return raw.map(item => (typeof item === 'number' ? item : item.id));
	},

	removeWatchedMovie: (movieId: number): void => {
		try {
			const watched = getParsedArray<any>(
				WATCHED_MOVIES_KEY,
			);
			const filtered = watched.filter((item) => (typeof item === 'number' ? item : item.id) !== movieId);
			localStorage.setItem(
				WATCHED_MOVIES_KEY,
				JSON.stringify(filtered),
			);
			StorageService.dispatchStorageEvent(WATCHED_MOVIES_KEY);
		} catch {
			/* silently fail */
		}
	},

	// --- Episode-level TV Tracking ---
	getWatchedEpisodes: (tvId?: number): WatchedEpisode[] => {
		const episodes = getParsedArray<WatchedEpisode>(
			WATCHED_EPISODES_KEY,
		);
		const filtered =
			typeof tvId === "number"
				? episodes.filter((episode) => episode.tvId === tvId)
				: episodes;
		return filtered.sort((a, b) => b.watchedAt.localeCompare(a.watchedAt));
	},

	hasEpisodeWatched: (
		tvId: number,
		seasonNumber: number,
		episodeNumber: number,
	): boolean => {
		return StorageService.getWatchedEpisodes(tvId).some(
			(episode) =>
				episode.seasonNumber === seasonNumber &&
				episode.episodeNumber === episodeNumber,
		);
	},

	getAllTVProgress: (): TVShowProgress[] => {
		return getParsedArray<TVShowProgress>(TV_PROGRESS_KEY).sort((a, b) =>
			b.updatedAt.localeCompare(a.updatedAt),
		);
	},

	getTVProgress: (tvId: number): TVShowProgress | null => {
		return (
			StorageService.getAllTVProgress().find(
				(progress) => progress.tvId === tvId,
			) ?? null
		);
	},

	markEpisodeWatched: (input: {
		tvId: number;
		showTitle: string;
		posterPath: string | null;
		totalSeasons: number;
		totalEpisodes: number;
		seasonNumber: number;
		episodeNumber: number;
		genre_ids?: number[];
	}): void => {
		const watchedAt = new Date().toISOString();
		try {
			const existingEpisodes = getParsedArray<WatchedEpisode>(
				WATCHED_EPISODES_KEY,
			);

			const dedupedEpisodes = existingEpisodes.filter(
				(episode) =>
					!(
						episode.tvId === input.tvId &&
						episode.seasonNumber === input.seasonNumber &&
						episode.episodeNumber ===
						input.episodeNumber
					),
			);

			const newEpisode: WatchedEpisode = {
				tvId: input.tvId,
				seasonNumber: input.seasonNumber,
				episodeNumber: input.episodeNumber,
				showTitle: input.showTitle,
				posterPath: input.posterPath,
				watchedAt,
				genre_ids: input.genre_ids,
			};

			const updatedEpisodes = [newEpisode, ...dedupedEpisodes].slice(
				0,
				MAX_WATCHED_EPISODES,
			);

			localStorage.setItem(
				WATCHED_EPISODES_KEY,
				JSON.stringify(updatedEpisodes),
			);

			const allProgress = getParsedArray<TVShowProgress>(
				TV_PROGRESS_KEY,
			);
			const currentShowEpisodes = updatedEpisodes.filter(
				(episode) => episode.tvId === input.tvId,
			);

			const progressEntry: TVShowProgress = {
				tvId: input.tvId,
				showTitle: input.showTitle,
				posterPath: input.posterPath,
				totalSeasons: input.totalSeasons,
				totalEpisodes: input.totalEpisodes,
				watchedEpisodes: currentShowEpisodes.length,
				lastWatchedEpisode: {
					seasonNumber: input.seasonNumber,
					episodeNumber: input.episodeNumber,
					watchedAt,
				},
				updatedAt: watchedAt,
				genre_ids: input.genre_ids,
			};

			const updatedProgress = [
				progressEntry,
				...allProgress.filter(
					(progress) => progress.tvId !== input.tvId,
				),
			];

			localStorage.setItem(
				TV_PROGRESS_KEY,
				JSON.stringify(updatedProgress),
			);

			StorageService.dispatchStorageEvent(
				WATCHED_EPISODES_KEY,
			);
			StorageService.dispatchStorageEvent(TV_PROGRESS_KEY);
		} catch (err) {
			console.warn("Failed to mark episode as watched:", err);
		}
	},

	clearWatchedHistory: (): void => {
		try {
			localStorage.removeItem(WATCHED_MOVIES_KEY);
			localStorage.removeItem(WATCHED_EPISODES_KEY);
			localStorage.removeItem(TV_PROGRESS_KEY);
		} finally {
			StorageService.dispatchStorageEvent(WATCHED_MOVIES_KEY);
			StorageService.dispatchStorageEvent(WATCHED_EPISODES_KEY);
			StorageService.dispatchStorageEvent(TV_PROGRESS_KEY);
		}
	},

	getHistoricalGenrePreferences: (): Record<number, number> => {
		const prefs: Record<number, number> = {};
		
		// from movies
		const moviesRaw = getParsedArray<any>(WATCHED_MOVIES_KEY);
		moviesRaw.forEach(item => {
			if (typeof item !== 'number' && item.genre_ids) {
				item.genre_ids.forEach((gid: number) => {
					prefs[gid] = (prefs[gid] || 0) + 1;
				});
			}
		});

		// from tv shows (count once per TV show)
		const tvProgress = StorageService.getAllTVProgress();
		tvProgress.forEach(progress => {
			if (progress.genre_ids) {
				progress.genre_ids.forEach((gid: number) => {
					prefs[gid] = (prefs[gid] || 0) + 1;
				});
			}
		});

		return prefs;
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
			new CustomEvent("filmreel-storage", {
				detail: { key },
			}),
		);
	},
};
