import {
	useState,
	useCallback,
	useEffect,
	useRef,
} from "react";
import { Link } from "react-router";
import { APIService } from "../services/api";
import type { Movie, TVShow } from "../services/api";
import { StorageService } from "../services/storage";
import type {
	UserProfile,
	MoodResult,
	Playlist,
	TVShowProgress,
} from "../services/storage";
import { useStorageSync } from "../hooks/useStorageSync";
import { MovieCard } from "../components/MovieCard";
import "../styles/Account.css";

const PLAYLISTS_KEY = "filmreel_custom_playlists";
const WATCHED_MOVIES_KEY = "filmreel_watched_movies";
const TV_PROGRESS_KEY = "filmreel_tv_progress";
const DEFAULT_PLAYLIST_ID = "default-watchlist";

const PLAYLIST_GENRES = [
	{ id: 28, label: "Action" },
	{ id: 16, label: "Animation" },
	{ id: 35, label: "Comedy" },
	{ id: 99, label: "Documentary" },
	{ id: 18, label: "Drama" },
	{ id: 878, label: "Sci-Fi" },
	{ id: 27, label: "Horror" },
	{ id: 10749, label: "Romance" },
];

type PlaylistDialogMode = "create" | "rename";
type PlaylistWithGenre = Playlist & {
	mainGenreId?: number | null;
};

type StorageServicePlaylistExtensions = typeof StorageService & {
	createPlaylist: (
		name: string,
		options?: { mainGenreId?: number | null },
	) => PlaylistWithGenre;
	updatePlaylist: (
		playlistId: string,
		updates: { name?: string; mainGenreId?: number | null },
	) => PlaylistWithGenre | null;
};

const FALLBACK_POSTER =
	"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 500 750' fill='none'%3E%3Crect width='500' height='750' fill='%231a1122'/%3E%3Ctext x='250' y='340' text-anchor='middle' fill='%237f13ec' font-family='system-ui' font-size='40' font-weight='bold'%3EFilmReel%3C/text%3E%3Ctext x='250' y='400' text-anchor='middle' fill='%23666' font-family='system-ui' font-size='20'%3ENo Poster%3C/text%3E%3C/svg%3E";

export default function Account() {
	const storage =
		StorageService as StorageServicePlaylistExtensions;
	const [profile, setProfile] = useState<UserProfile>(() =>
		StorageService.getProfile(),
	);
	const [history] = useState<MoodResult[]>(() =>
		StorageService.getMoodHistory(),
	);
	const playlists = useStorageSync<PlaylistWithGenre[]>(
		PLAYLISTS_KEY,
		StorageService.getPlaylists,
	);
	const watchedMovieIds = useStorageSync<number[]>(
		WATCHED_MOVIES_KEY,
		StorageService.getWatchedMovies,
	);
	const watchedTVProgress = useStorageSync<TVShowProgress[]>(
		TV_PROGRESS_KEY,
		StorageService.getAllTVProgress,
	);
	const [watchedMovies, setWatchedMovies] = useState<Movie[]>([]);
	const [isHistoryLoading, setIsHistoryLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [toast, setToast] = useState<string | null>(null);
	const [selectedPlaylistId, setSelectedPlaylistId] =
		useState(DEFAULT_PLAYLIST_ID);
	const [showPlaylistDialog, setShowPlaylistDialog] = useState(false);
	const [playlistDialogMode, setPlaylistDialogMode] =
		useState<PlaylistDialogMode>("create");
	const [playlistDialogName, setPlaylistDialogName] = useState("");
	const [playlistDialogGenreId, setPlaylistDialogGenreId] =
		useState("");
	const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
	const playlistMenuRef = useRef<HTMLDivElement>(null);

	const showToast = useCallback((message: string) => {
		setToast(message);
		setTimeout(() => setToast(null), 2500);
	}, []);

	const watchedTVCards: TVShow[] = watchedTVProgress
		.slice(0, 30)
		.map((progress) => ({
			id: progress.tvId,
			name: progress.showTitle,
			poster_path: progress.posterPath,
			backdrop_path: null,
			overview: "",
			vote_average: 0,
			first_air_date: "",
			genre_ids: [],
			number_of_seasons: progress.totalSeasons,
			number_of_episodes: progress.totalEpisodes,
		}));

	const activePlaylist =
		playlists.find(
			(playlist) => playlist.id === selectedPlaylistId,
		) ??
		playlists[0] ??
		null;
	const visibleWatchedMovies =
		watchedMovieIds.length === 0 ? [] : watchedMovies;
	const isHistoryEmpty =
		!isHistoryLoading &&
		visibleWatchedMovies.length === 0 &&
		watchedTVCards.length === 0;

	useEffect(() => {
		if (watchedMovieIds.length === 0) {
			return;
		}

		let cancelled = false;

		const loadWatchedMovies = async () => {
			if (!cancelled) {
				setIsHistoryLoading(true);
			}

			const settled = await Promise.allSettled(
				watchedMovieIds
					.slice(0, 30)
					.map((id) =>
						APIService.getMovieDetails(id),
					),
			);

			const resolvedMovies = settled
				.filter(
					(
						result,
					): result is PromiseFulfilledResult<Movie> =>
						result.status === "fulfilled",
				)
				.map((result) => result.value);

			if (!cancelled) {
				setWatchedMovies(resolvedMovies);
				setIsHistoryLoading(false);
			}

			const failedCount =
				settled.length - resolvedMovies.length;
			if (failedCount > 0) {
				console.warn(
					`Failed to load ${failedCount} watched movie detail(s) on Account page.`,
				);
			}
		};

		void loadWatchedMovies();
		return () => {
			cancelled = true;
		};
	}, [watchedMovieIds]);

	const handleImageUpload = async (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = e.target.files?.[0];
		if (file) {
			if (file.size > 5 * 1024 * 1024) {
				showToast("File must be smaller than 5MB");
				return;
			}
			try {
				const base64 =
					await StorageService.fileToBase64(file);
				setProfile((prev) => ({
					...prev,
					avatarBase64: base64,
				}));
			} catch (err) {
				console.error("Failed to convert image", err);
			}
		}
	};

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		const { name, value } = e.target;
		setProfile((prev) => {
			if (name === "favoriteGenreId") {
				const parsed = Number.parseInt(value, 10);
				return {
					...prev,
					favoriteGenreId: Number.isNaN(parsed)
						? null
						: parsed,
				};
			}

			return {
				...prev,
				[name]: value,
			};
		});
	};

	const saveProfile = () => {
		setIsSaving(true);
		StorageService.saveProfile(profile);
		setTimeout(() => {
			setIsSaving(false);
			showToast("Profile saved successfully!");
		}, 400);
	};

	const createPlaylist = () => {
		if (!playlistDialogName.trim()) {
			showToast("Enter a playlist name");
			return;
		}

		try {
			const parsedGenre = Number.parseInt(
				playlistDialogGenreId,
				10,
			);
			const playlist = storage.createPlaylist(
				playlistDialogName,
				{
					mainGenreId: Number.isNaN(parsedGenre)
						? null
						: parsedGenre,
				},
			);
			setSelectedPlaylistId(playlist.id);
			setShowPlaylistDialog(false);
			setPlaylistDialogName("");
			setPlaylistDialogGenreId("");
			showToast(`Created ${playlist.name}`);
		} catch (error) {
			showToast(
				error instanceof Error
					? error.message
					: "Unable to create playlist",
			);
		}
	};

	const renamePlaylist = () => {
		if (
			!activePlaylist ||
			activePlaylist.id === DEFAULT_PLAYLIST_ID
		) {
			return;
		}
		if (!playlistDialogName.trim()) {
			showToast("Enter a playlist name");
			return;
		}

		const parsedGenre = Number.parseInt(
			playlistDialogGenreId,
			10,
		);

		const updatedPlaylist = storage.updatePlaylist(
			activePlaylist.id,
			{
				name: playlistDialogName,
				mainGenreId: Number.isNaN(parsedGenre)
					? null
					: parsedGenre,
			},
		);

		if (!updatedPlaylist) {
			showToast("Unable to rename playlist");
			return;
		}

		setShowPlaylistDialog(false);
		setPlaylistDialogName("");
		setPlaylistDialogGenreId("");
		showToast(`Renamed to ${updatedPlaylist.name}`);
	};

	const deletePlaylist = () => {
		if (
			!activePlaylist ||
			activePlaylist.id === DEFAULT_PLAYLIST_ID
		) {
			return;
		}

		const didDelete = StorageService.deletePlaylist(
			activePlaylist.id,
		);
		if (!didDelete) {
			showToast("Unable to delete playlist");
			return;
		}

		setSelectedPlaylistId(DEFAULT_PLAYLIST_ID);
		setShowPlaylistMenu(false);
		showToast(`Deleted ${activePlaylist.name}`);
	};

	const openCreatePlaylistDialog = () => {
		setPlaylistDialogMode("create");
		setPlaylistDialogName("");
		setPlaylistDialogGenreId("");
		setShowPlaylistDialog(true);
	};

	const openRenamePlaylistDialog = () => {
		if (
			!activePlaylist ||
			activePlaylist.id === DEFAULT_PLAYLIST_ID
		) {
			return;
		}
		setPlaylistDialogMode("rename");
		setPlaylistDialogName(activePlaylist.name);
		setPlaylistDialogGenreId(
			activePlaylist.mainGenreId
				? String(activePlaylist.mainGenreId)
				: "",
		);
		setShowPlaylistDialog(true);
		setShowPlaylistMenu(false);
	};

	const submitPlaylistDialog = () => {
		if (playlistDialogMode === "create") {
			createPlaylist();
			return;
		}
		renamePlaylist();
	};

	useEffect(() => {
		if (!showPlaylistMenu) return;

		const onPointerDown = (event: MouseEvent) => {
			if (!playlistMenuRef.current) return;
			if (
				!playlistMenuRef.current.contains(
					event.target as Node,
				)
			) {
				setShowPlaylistMenu(false);
			}
		};

		const onEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setShowPlaylistMenu(false);
			}
		};

		document.addEventListener("mousedown", onPointerDown);
		document.addEventListener("keydown", onEscape);

		return () => {
			document.removeEventListener(
				"mousedown",
				onPointerDown,
			);
			document.removeEventListener("keydown", onEscape);
		};
	}, [showPlaylistMenu]);

	const removeFromPlaylist = (movieId: number) => {
		if (!activePlaylist) return;
		StorageService.removeFromPlaylist(activePlaylist.id, movieId);
		showToast(`Removed from ${activePlaylist.name}`);
	};

	const resetWatchedHistory = () => {
		const confirmed = window.confirm(
			"Reset all watch history? This clears movie history and TV episode progress.",
		);
		if (!confirmed) return;
		StorageService.clearWatchedHistory();
		showToast("Watch history reset");
	};

	return (
		<div className="account-page animate-in fade-in">
			{/* Top Section: Form + Mood History */}
			<div className="account-top">
				{/* Settings Form */}
				<div className="account-main">
					<h1 className="account-title">
						Account Settings
					</h1>

					<div className="glass-panel account-form">
						{/* Avatar Upload */}
						<div className="account-avatar-row">
							<div className="account-avatar">
								{profile.avatarBase64 ? (
									<img
										src={
											profile.avatarBase64
										}
										alt="Avatar"
									/>
								) : (
									<span
										className="material-symbols-outlined"
										style={{
											fontSize: "48px",
											color: "rgba(255,255,255,0.3)",
										}}
									>
										person
									</span>
								)}
								<label className="account-avatar-overlay">
									<span
										className="material-symbols-outlined"
										style={{
											fontSize: "24px",
											color: "white",
										}}
									>
										camera_alt
									</span>
									<input
										type="file"
										accept="image/*"
										onChange={
											handleImageUpload
										}
										hidden
									/>
								</label>
							</div>
							<div>
								<h3
									style={{
										fontSize: "1.2rem",
										marginBottom:
											"8px",
									}}
								>
									Profile
									Picture
								</h3>
								<p
									style={{
										color: "var(--text-secondary)",
										fontSize: "0.9rem",
									}}
								>
									Max file
									size
									5MB. Tap
									image to
									change.
								</p>
							</div>
						</div>

						<div>
							<label className="label-glass">
								Display Name
							</label>
							<input
								name="displayName"
								value={
									profile.displayName
								}
								onChange={
									handleChange
								}
								className="input-glass"
								placeholder="e.g. CinemaLover99"
							/>
						</div>

						<div>
							<label className="label-glass">
								Favorite Genre
							</label>
							<select
								title="favorite genre"
								name="favoriteGenreId"
								value={
									profile.favoriteGenreId ||
									""
								}
								onChange={
									handleChange
								}
								className="input-glass"
								style={{
									appearance: "none",
									background: "rgba(0,0,0,0.4) url(\"data:image/svg+xml;utf8,<svg fill='%23ffffff' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>\") no-repeat right 16px center",
								}}
							>
								<option
									value=""
									disabled
								>
									Select a
									genre...
								</option>
								<option
									value="28"
									title="Action"
								>
									Action
								</option>
								<option
									value="16"
									title="Animation"
								>
									Animation
								</option>
								<option
									value="35"
									title="Comedy"
								>
									Comedy
								</option>
								<option
									value="99"
									title="Documentary"
								>
									Documentary
								</option>
								<option
									value="18"
									title="Drama"
								>
									Drama
								</option>
								<option
									value="878"
									title="Science Fiction"
								>
									Sci-Fi
								</option>
								<option
									value="27"
									title="Horror"
								>
									Horror
								</option>
								<option
									value="10749"
									title="Romance"
								>
									Romance
								</option>
							</select>
						</div>

						<div
							style={{
								marginTop: "16px",
							}}
						>
							<button
								onClick={
									saveProfile
								}
								className="btn btn-primary"
								style={{
									width: "100%",
								}}
							>
								<span
									className="material-symbols-outlined"
									style={{
										fontSize: "20px",
									}}
								>
									save
								</span>
								{isSaving
									? "Saving..."
									: "Save Changes"}
							</button>
						</div>
					</div>
				</div>

				{/* Mood History Sidebar */}
				<div className="account-sidebar">
					<h2 className="account-sidebar-title">
						<span
							className="material-symbols-outlined text-purple"
							style={{
								fontSize: "24px",
							}}
						>
							schedule
						</span>
						Mood History
					</h2>

					{history.length === 0 ? (
						<div
							className=""
							style={{
								padding: "24px",
								textAlign: "center",
								color: "var(--text-secondary)",
							}}
						>
							No history yet. Take the
							Mood Survey!
						</div>
					) : (
						history.map((item, idx) => (
							<div
								key={idx}
								className="glass-panel account-mood-card"
							>
								<span className="account-mood-label">
									{
										item.moodLabel
									}
								</span>
								<span className="account-mood-date">
									{new Date(
										item.date,
									).toLocaleDateString()}{" "}
									at{" "}
									{new Date(
										item.date,
									).toLocaleTimeString(
										[],
										{
											hour: "2-digit",
											minute: "2-digit",
										},
									)}
								</span>
							</div>
						))
					)}
				</div>
			</div>

			{/* Playlists Section */}
			<div className="account-watchlist">
				<div className="account-watchlist-header">
					<h2 className="account-sidebar-title">
						<span
							className="material-symbols-outlined text-purple"
							style={{
								fontSize: "24px",
							}}
						>
							bookmark
						</span>
						Playlists
					</h2>
					{playlists.length > 0 && (
						<span
							style={{
								color: "var(--text-secondary)",
								fontSize: "0.9rem",
							}}
						>
							{playlists.length}{" "}
							{playlists.length === 1
								? "playlist"
								: "playlists"}
						</span>
					)}
				</div>

				<div className="account-playlist-shell">
					<div className="account-playlist-toolbar">
						<div className="account-playlist-create">
							<button
								type="button"
								onClick={openCreatePlaylistDialog}
								className="btn btn-primary"
							>
								Create Playlist
							</button>
						</div>

						<div className="account-playlist-tabs">
							{playlists.map(
								(playlist) => (
									<button
										key={
											playlist.id
										}
										type="button"
										className={`account-playlist-tab ${playlist.id === activePlaylist?.id ? "active" : ""}`}
										onClick={() => {
											setSelectedPlaylistId(
												playlist.id,
											);
											setShowPlaylistMenu(false);
										}}
									>
										<span>
											{
												playlist.name
											}
										</span>
										<strong>
											{
												playlist
													.items
													.length
											}
										</strong>
									</button>
								),
							)}
						</div>

						{activePlaylist && (
							<div className="account-playlist-editor">
								<div>
									<p className="account-playlist-label">
										Selected
										Playlist
									</p>
									<h3 className="account-playlist-title">
										{
											activePlaylist.name
										}
									</h3>
									{activePlaylist.mainGenreId ? (
										<p className="account-playlist-note">
											Main genre:{" "}
											{PLAYLIST_GENRES.find(
												(genre) =>
													genre.id ===
													activePlaylist.mainGenreId,
											)?.label ?? "Custom"}
										</p>
									) : null}
								</div>

								{activePlaylist.id ===
								DEFAULT_PLAYLIST_ID ? (
									<p className="account-playlist-note">
										This
										default
										Watchlist
										keeps
										your
										legacy
										saved
										titles
										and
										cannot
										be
										deleted.
									</p>
								) : (
									<div
										className="account-playlist-menu-wrap"
										ref={playlistMenuRef}
									>
										<button
											type="button"
											className="account-playlist-menu-btn"
											title="Playlist options"
											onClick={() =>
												setShowPlaylistMenu(
													(prev) => !prev,
												)
											}
										>
											<span className="material-symbols-outlined">
												more_vert
											</span>
										</button>
										{showPlaylistMenu ? (
											<div className="account-playlist-menu">
												<button
													type="button"
													onClick={openRenamePlaylistDialog}
												>
													Rename
												</button>
												<button
													type="button"
													onClick={deletePlaylist}
												>
													Delete
												</button>
											</div>
										) : null}
									</div>
								)}
							</div>
						)}
					</div>

					{!activePlaylist ||
					activePlaylist.items.length === 0 ? (
						<div className="glass-panel account-watchlist-empty">
							<span className="material-symbols-outlined">
								bookmark_border
							</span>
							{activePlaylist
								? `${activePlaylist.name} is empty. Browse titles and use the bookmark button to save them here.`
								: "Create your first playlist to start organizing titles."}
						</div>
					) : (
						<div className="account-watchlist-grid">
							{activePlaylist.items.map(
								(item) => (
									<div
										key={
											item.id
										}
										className="movie-card group"
										style={{
											width: "100%",
										}}
									>
										<Link
											to={
												item.mediaType ===
												"tv"
													? `/tv/${item.id}`
													: `/movie/${item.id}`
											}
											style={{
												textDecoration:
													"none",
											}}
										>
											<div className="movie-card-inner">
												<img
													src={
														item.poster_path
															? `https://image.tmdb.org/t/p/w500${item.poster_path}`
															: FALLBACK_POSTER
													}
													alt={
														item.title
													}
													className="movie-poster"
													onError={(
														e,
													) => {
														(
															e.target as HTMLImageElement
														).src =
															FALLBACK_POSTER;
													}}
												/>
												<div className="movie-overlay" />
												<button
													className="movie-bookmark active"
													onClick={(
														e,
													) => {
														e.preventDefault();
														e.stopPropagation();
														removeFromPlaylist(
															item.id,
														);
													}}
													title={`Remove from ${activePlaylist.name}`}
												>
													<span className="material-symbols-outlined">
														bookmark_remove
													</span>
												</button>
												<div className="movie-info">
													<h4 className="movie-title truncate">
														{
															item.title
														}
													</h4>
												</div>
											</div>
										</Link>
									</div>
								),
							)}
						</div>
					)}
				</div>
			</div>

			{/* Watch History Section */}
			<div className="account-watch-history">
				<div className="account-watchlist-header">
					<h2 className="account-sidebar-title">
						<span
							className="material-symbols-outlined text-purple"
							style={{
								fontSize: "24px",
							}}
						>
							history
						</span>
						Watch History
					</h2>
					{(watchedMovieIds.length > 0 ||
						watchedTVProgress.length >
							0) && (
						<button
							type="button"
							onClick={
								resetWatchedHistory
							}
							className="btn btn-glass account-history-reset"
						>
							Reset History
						</button>
					)}
				</div>

				{isHistoryLoading &&
					visibleWatchedMovies.length === 0 && (
						<div className="glass-panel account-watchlist-empty">
							<span className="material-symbols-outlined">
								autorenew
							</span>
							Loading watch history...
						</div>
					)}

				{visibleWatchedMovies.length > 0 && (
					<>
						<p className="account-history-label">
							Movies
						</p>
						<div className="account-watchlist-grid">
							{visibleWatchedMovies.map(
								(movie) => (
									<MovieCard
										key={`movie-${movie.id}`}
										movie={
											movie
										}
										mediaType="movie"
									/>
								),
							)}
						</div>
					</>
				)}

				{watchedTVCards.length > 0 && (
					<>
						<p className="account-history-label">
							TV Episodes
						</p>
						<div className="account-watchlist-grid account-tv-history-grid">
							{watchedTVCards.map(
								(show) => {
									const progress =
										watchedTVProgress.find(
											(
												item,
											) =>
												item.tvId ===
												show.id,
										);
									if (
										!progress
									)
										return null;

									return (
										<div
											key={`tv-${show.id}`}
											className="account-tv-history-item"
										>
											<MovieCard
												movie={
													show
												}
												mediaType="tv"
											/>
											<div className="glass-panel account-tv-progress-meta">
												<p>
													Last
													watched:
													S
													{
														progress
															.lastWatchedEpisode
															.seasonNumber
													}
													:E
													{
														progress
															.lastWatchedEpisode
															.episodeNumber
													}
												</p>
												<p>
													Episodes
													watched:{" "}
													{
														progress.watchedEpisodes
													}
												</p>
											</div>
										</div>
									);
								},
							)}
						</div>
					</>
				)}

				{isHistoryEmpty && (
					<div className="glass-panel account-watchlist-empty">
						<span className="material-symbols-outlined">
							history_toggle_off
						</span>
						No watch history yet. Start a
						movie or episode to build your
						timeline.
					</div>
				)}
			</div>

			{/* Toast */}
			{showPlaylistDialog ? (
				<div
					className="account-modal-backdrop"
					onClick={() => setShowPlaylistDialog(false)}
				>
					<div
						className="glass-panel account-modal"
						onClick={(e) => e.stopPropagation()}
					>
						<h3>
							{playlistDialogMode === "create"
								? "Create Playlist"
								: "Rename Playlist"}
						</h3>
						<p className="account-modal-subtitle">
							Set a playlist title and optional main genre.
						</p>
						<label className="label-glass">Playlist Title</label>
						<input
							type="text"
							className="input-glass"
							maxLength={40}
							value={playlistDialogName}
							onChange={(e) =>
								setPlaylistDialogName(e.target.value)
							}
							placeholder="e.g. Friday Night Thrillers"
						/>
						<label className="label-glass">Main Genre (optional)</label>
						<select
							className="input-glass"
							value={playlistDialogGenreId}
							onChange={(e) =>
								setPlaylistDialogGenreId(e.target.value)
							}
							title="Select playlist genre"
						>
							<option value="">No main genre</option>
							{PLAYLIST_GENRES.map((genre) => (
								<option key={genre.id} value={genre.id}>
									{genre.label}
								</option>
							))}
						</select>
						<div className="account-modal-actions">
							<button
								type="button"
								className="btn btn-glass"
								onClick={() => setShowPlaylistDialog(false)}
							>
								Cancel
							</button>
							<button
								type="button"
								className="btn btn-primary"
								onClick={submitPlaylistDialog}
							>
								{playlistDialogMode === "create"
									? "Create"
									: "Save"}
							</button>
						</div>
					</div>
				</div>
			) : null}

			{/* Toast */}
			<div className={`toast ${toast ? "visible" : ""}`}>
				<span
					className="material-symbols-outlined"
					style={{ fontSize: "20px" }}
				>
					check_circle
				</span>
				{toast}
			</div>
		</div>
	);
}
