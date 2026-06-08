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

export interface Playlist {
	id: string;
	name: string;
	createdAt: string;
	updatedAt: string;
	isDefault?: boolean;
	items: WatchlistItem[];
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

type WatchedMovieEntry =
	| number
	| {
		id: number;
		genre_ids?: number[];
		watchedAt?: string;
	};

const PROFILE_KEY = "filmreel_user_profile";
const MOOD_HISTORY_KEY = "filmreel_mood_history";
const WATCHLIST_KEY = "filmreel_watchlist";
const PLAYLISTS_KEY = "filmreel_custom_playlists";
const WATCHED_MOVIES_KEY = "filmreel_watched_movies";
const WATCHED_EPISODES_KEY = "filmreel_watched_episodes";
const TV_PROGRESS_KEY = "filmreel_tv_progress";
const MAX_WATCHED_MOVIES = 100;
const MAX_WATCHED_EPISODES = 1000;
const DEFAULT_PLAYLIST_ID = "default-watchlist";

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

const dispatchStorageEvent = (key: string): void => {
	window.dispatchEvent(
		new CustomEvent("filmreel-storage", {
			detail: { key },
		}),
	);
};

const normalizeWatchlistItem = (
	item: Partial<WatchlistItem>,
): WatchlistItem | null => {
	if (
		typeof item.id !== "number" ||
		typeof item.title !== "string"
	) {
		return null;
	}

	return {
		id: item.id,
		title: item.title,
		poster_path:
			typeof item.poster_path === "string"
				? item.poster_path
				: null,
		addedAt:
			typeof item.addedAt === "string"
				? item.addedAt
				: new Date().toISOString(),
		mediaType: item.mediaType === "tv" ? "tv" : "movie",
	};
};

const createDefaultPlaylist = (
	items: WatchlistItem[] = [],
): Playlist => {
	const now = new Date().toISOString();
	return {
		id: DEFAULT_PLAYLIST_ID,
		name: "Watchlist",
		createdAt: now,
		updatedAt: now,
		isDefault: true,
		items,
	};
};

const normalizePlaylist = (
	playlist: Partial<Playlist>,
): Playlist | null => {
	if (
		typeof playlist.id !== "string" ||
		typeof playlist.name !== "string"
	) {
		return null;
	}

	const normalizedItems = Array.isArray(playlist.items)
		? playlist.items
			.map((item) => normalizeWatchlistItem(item))
			.filter(
				(item): item is WatchlistItem => item !== null,
			)
		: [];

	return {
		id: playlist.id,
		name: playlist.name.trim() || "Untitled Playlist",
		createdAt:
			typeof playlist.createdAt === "string"
				? playlist.createdAt
				: new Date().toISOString(),
		updatedAt:
			typeof playlist.updatedAt === "string"
				? playlist.updatedAt
				: new Date().toISOString(),
		isDefault: Boolean(playlist.isDefault),
		items: normalizedItems,
	};
};

const getDefaultPlaylistFromList = (
	playlists: Playlist[],
): Playlist => {
	return (
		playlists.find(
			(playlist) => playlist.id === DEFAULT_PLAYLIST_ID,
		) ?? createDefaultPlaylist()
	);
};

const persistPlaylists = (playlists: Playlist[]): void => {
	const defaultPlaylist = getDefaultPlaylistFromList(playlists);
	localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
	localStorage.setItem(
		WATCHLIST_KEY,
		JSON.stringify(defaultPlaylist.items),
	);
	dispatchStorageEvent(PLAYLISTS_KEY);
	dispatchStorageEvent(WATCHLIST_KEY);
};

const getStoredPlaylists = (): Playlist[] => {
	const parsedPlaylists = getParsedArray<Partial<Playlist>>(
		PLAYLISTS_KEY,
	)
		.map((playlist) => normalizePlaylist(playlist))
		.filter((playlist): playlist is Playlist => playlist !== null);

	if (parsedPlaylists.length > 0) {
		if (
			parsedPlaylists.some(
				(playlist) => playlist.id === DEFAULT_PLAYLIST_ID,
			)
		) {
			return parsedPlaylists;
		}

		return [
			createDefaultPlaylist(
				getParsedArray<Partial<WatchlistItem>>(
					WATCHLIST_KEY,
				)
					.map((item) => normalizeWatchlistItem(item))
					.filter(
						(item): item is WatchlistItem => item !== null,
					),
			),
			...parsedPlaylists,
		];
	}

	const legacyWatchlist = getParsedArray<Partial<WatchlistItem>>(
		WATCHLIST_KEY,
	)
		.map((item) => normalizeWatchlistItem(item))
		.filter((item): item is WatchlistItem => item !== null);

	const playlists = [createDefaultPlaylist(legacyWatchlist)];
	persistPlaylists(playlists);
	return playlists;
};

const buildPlaylistItem = (movie: {
	id: number;
	title: string;
	poster_path: string | null;
	mediaType?: "movie" | "tv";
}): WatchlistItem => ({
	...movie,
	addedAt: new Date().toISOString(),
	mediaType: movie.mediaType ?? "movie",
});

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
		dispatchStorageEvent(PROFILE_KEY);
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
	getPlaylists: (): Playlist[] => {
		return getStoredPlaylists().sort((a, b) => {
			if (a.id === DEFAULT_PLAYLIST_ID) return -1;
			if (b.id === DEFAULT_PLAYLIST_ID) return 1;
			return b.updatedAt.localeCompare(a.updatedAt);
		});
	},

	getPlaylist: (playlistId: string): Playlist | null => {
		return (
			StorageService.getPlaylists().find(
				(playlist) => playlist.id === playlistId,
			) ?? null
		);
	},

	getDefaultPlaylist: (): Playlist => {
		return getDefaultPlaylistFromList(
			StorageService.getPlaylists(),
		);
	},

	getWatchlist: (): WatchlistItem[] => {
		return StorageService.getDefaultPlaylist().items;
	},

	createPlaylist: (name: string): Playlist => {
		const trimmedName = name.trim();
		if (!trimmedName) {
			throw new Error("Playlist name is required.");
		}

		const now = new Date().toISOString();
		const playlists = StorageService.getPlaylists();
		const playlist: Playlist = {
			id: `playlist-${crypto.randomUUID()}`,
			name: trimmedName,
			createdAt: now,
			updatedAt: now,
			items: [],
		};

		persistPlaylists([playlist, ...playlists]);
		return playlist;
	},

	updatePlaylist: (
		playlistId: string,
		updates: { name?: string },
	): Playlist | null => {
		const playlists = StorageService.getPlaylists();
		let updatedPlaylist: Playlist | null = null;

		const updatedPlaylists = playlists.map((playlist) => {
			if (playlist.id !== playlistId) return playlist;

			updatedPlaylist = {
				...playlist,
				name:
					typeof updates.name === "string" &&
						updates.name.trim().length > 0
						? updates.name.trim()
						: playlist.name,
				updatedAt: new Date().toISOString(),
			};

			return updatedPlaylist;
		});

		if (!updatedPlaylist) {
			return null;
		}

		persistPlaylists(updatedPlaylists);
		return updatedPlaylist;
	},

	deletePlaylist: (playlistId: string): boolean => {
		if (playlistId === DEFAULT_PLAYLIST_ID) {
			return false;
		}

		const playlists = StorageService.getPlaylists();
		const updatedPlaylists = playlists.filter(
			(playlist) => playlist.id !== playlistId,
		);

		if (updatedPlaylists.length === playlists.length) {
			return false;
		}

		persistPlaylists(updatedPlaylists);
		return true;
	},

	addToPlaylist: (
		playlistId: string,
		movie: {
			id: number;
			title: string;
			poster_path: string | null;
			mediaType?: "movie" | "tv";
		},
	): boolean => {
		const playlists = StorageService.getPlaylists();
		let didAdd = false;

		const updatedPlaylists = playlists.map((playlist) => {
			if (playlist.id !== playlistId) return playlist;
			if (playlist.items.some((item) => item.id === movie.id)) {
				return playlist;
			}

			didAdd = true;
			return {
				...playlist,
				updatedAt: new Date().toISOString(),
				items: [buildPlaylistItem(movie), ...playlist.items],
			};
		});

		if (!didAdd) {
			return false;
		}

		persistPlaylists(updatedPlaylists);
		return true;
	},

	removeFromPlaylist: (
		playlistId: string,
		movieId: number,
	): boolean => {
		const playlists = StorageService.getPlaylists();
		let didRemove = false;

		const updatedPlaylists = playlists.map((playlist) => {
			if (playlist.id !== playlistId) return playlist;
			const items = playlist.items.filter(
				(item) => item.id !== movieId,
			);

			if (items.length === playlist.items.length) {
				return playlist;
			}

			didRemove = true;
			return {
				...playlist,
				updatedAt: new Date().toISOString(),
				items,
			};
		});

		if (!didRemove) {
			return false;
		}

		persistPlaylists(updatedPlaylists);
		return true;
	},

	getPlaylistsContainingItem: (movieId: number): Playlist[] => {
		return StorageService.getPlaylists().filter((playlist) =>
			playlist.items.some((item) => item.id === movieId),
		);
	},

	isInAnyPlaylist: (movieId: number): boolean => {
		return StorageService.getPlaylistsContainingItem(movieId)
			.length > 0;
	},

	addToWatchlist: (movie: {
		id: number;
		title: string;
		poster_path: string | null;
		mediaType?: "movie" | "tv";
	}): void => {
		StorageService.addToPlaylist(DEFAULT_PLAYLIST_ID, movie);
	},

	removeFromWatchlist: (movieId: number): void => {
		StorageService.removeFromPlaylist(
			DEFAULT_PLAYLIST_ID,
			movieId,
		);
	},

	isInWatchlist: (movieId: number): boolean => {
		return StorageService.getDefaultPlaylist().items.some(
			(item) => item.id === movieId,
		);
	},

	// --- Watched Movies Tracking ---
	markAsWatched: (input: number | { id: number; genre_ids?: number[] }): void => {
		const movieId = typeof input === "number" ? input : input.id;
		const genre_ids = typeof input === "number" ? undefined : input.genre_ids;
		let didChange = false;
		try {
			const watched = getParsedArray<WatchedMovieEntry>(
				WATCHED_MOVIES_KEY,
			);

			const alreadyExists = watched.some(
				(item) =>
					(typeof item === "number" ? item : item.id) === movieId,
			);

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
				dispatchStorageEvent(WATCHED_MOVIES_KEY);
			}
		}
	},

	hasWatched: (movieId: number): boolean => {
		try {
			const data = localStorage.getItem(WATCHED_MOVIES_KEY);
			if (!data) return false;
			const watched = JSON.parse(data) as WatchedMovieEntry[];
			return watched.some(
				(item) =>
					(typeof item === "number" ? item : item.id) === movieId,
			);
		} catch {
			return false;
		}
	},

	getWatchedMovies: (): number[] => {
		const raw = getParsedArray<WatchedMovieEntry>(WATCHED_MOVIES_KEY);
		return raw.map((item) =>
			typeof item === "number" ? item : item.id,
		);
	},

	removeWatchedMovie: (movieId: number): void => {
		try {
			const watched = getParsedArray<WatchedMovieEntry>(
				WATCHED_MOVIES_KEY,
			);
			const filtered = watched.filter(
				(item) =>
					(typeof item === "number" ? item : item.id) !== movieId,
			);
			localStorage.setItem(
				WATCHED_MOVIES_KEY,
				JSON.stringify(filtered),
			);
			dispatchStorageEvent(WATCHED_MOVIES_KEY);
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

			dispatchStorageEvent(WATCHED_EPISODES_KEY);
			dispatchStorageEvent(TV_PROGRESS_KEY);
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
			dispatchStorageEvent(WATCHED_MOVIES_KEY);
			dispatchStorageEvent(WATCHED_EPISODES_KEY);
			dispatchStorageEvent(TV_PROGRESS_KEY);
		}
	},

	getHistoricalGenrePreferences: (): Record<number, number> => {
		const prefs: Record<number, number> = {};

		// from movies
		const moviesRaw = getParsedArray<WatchedMovieEntry>(WATCHED_MOVIES_KEY);
		moviesRaw.forEach((item) => {
			if (typeof item !== "number" && item.genre_ids) {
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
		dispatchStorageEvent(key);
	},
};
