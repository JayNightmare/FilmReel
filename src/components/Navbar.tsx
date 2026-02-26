import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { StorageService } from "../services/storage";
import type { UserProfile } from "../services/storage";
import { APIService } from "../services/api";
import type { Movie, Person, Genre } from "../services/api";
import { useStorageSync } from "../hooks/useStorageSync";
import { useFeedback } from "../contexts/FeedbackContext";
import "../styles/Navbar.css";

import { RELEASE_NOTES, type ReleaseNote } from "../config/releaseNotes";

interface Notification {
	id: string;
	title: string;
	message: string;
	date: string;
	read: boolean;
}

type SearchCategory = "movie_tv" | "actor" | "mood" | "genre" | "year";

const NOTIF_KEY = "notif-film";
const SEEN_KEY = "notif-seen-ids";

/**
 * Diffs the static RELEASE_NOTES registry against IDs the user
 * has already seen. Returns merged notifications with correct
 * read/unread state.
 */
function buildNotifications(): Notification[] {
	const storedNotifs: Notification[] = (() => {
		try {
			const raw = localStorage.getItem(NOTIF_KEY);
			return raw ? JSON.parse(raw) : [];
		} catch {
			return [];
		}
	})();

	const seenIds: Set<string> = (() => {
		try {
			const raw = localStorage.getItem(SEEN_KEY);
			return new Set<string>(raw ? JSON.parse(raw) : []);
		} catch {
			return new Set<string>();
		}
	})();

	const existingById = new Map(storedNotifs.map((n) => [n.id, n]));
	const merged: Notification[] = RELEASE_NOTES.map(
		(note: ReleaseNote) => {
			const existing = existingById.get(note.id);
			if (existing) return existing;
			return {
				...note,
				read: seenIds.has(note.id),
			};
		},
	);

	merged.sort(
		(a, b) =>
			new Date(b.date).getTime() - new Date(a.date).getTime(),
	);

	localStorage.setItem(NOTIF_KEY, JSON.stringify(merged));
	return merged;
}

export const Navbar = () => {
	const { openFeedback } = useFeedback();
	const profile = useStorageSync<UserProfile>(
		"filmreel_profile",
		StorageService.getProfile,
	);

	const [notifications, setNotifications] =
		useState<Notification[]>(buildNotifications);
	const [showNotifs, setShowNotifs] = useState(false);

	// Search State
	const [searchQuery, setSearchQuery] = useState("");
	const [searchCategory, setSearchCategory] =
		useState<SearchCategory>("movie_tv");
	const [suggestions, setSuggestions] = useState<
		(Movie & { _mediaType?: "movie" | "tv" })[]
	>([]);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const searchWrapperRef = useRef<HTMLDivElement>(null);
	const dropDownRef = useRef<HTMLDivElement>(null);
	const navigate = useNavigate();

	// Advanced Filter State
	const [showAdvanced, setShowAdvanced] = useState(false);
	const [allGenres, setAllGenres] = useState<Genre[]>([]);

	// Filter Values
	const [filterGenres, setFilterGenres] = useState<number[]>([]);
	const [actorQuery, setActorQuery] = useState("");
	const [actorSuggestions, setActorSuggestions] = useState<Person[]>([]);
	const [selectedActor, setSelectedActor] = useState<Person | null>(null);
	const [filterYear, setFilterYear] = useState<string>("");
	const [filterScore, setFilterScore] = useState<number>(0);

	const moodGenreMap: Record<string, number[]> = {
		energetic: [28, 878],
		chill: [35, 10749],
		adventurous: [12, 14],
		melancholic: [18],
		laughter: [35],
		tears: [18, 10749],
		adrenaline: [28, 53],
		fear: [27],
		dark: [53, 27, 80],
		light: [35, 10749, 10751],
		gritty: [80, 18, 53],
		twist: [9648, 53],
		happy: [35, 10749, 10751],
		ambiguous: [18, 9648],
	};

	const searchCategories: {
		id: SearchCategory;
		label: string;
	}[] = [
		{ id: "movie_tv", label: "Movie/TV Show" },
		{ id: "actor", label: "Actor" },
		{ id: "mood", label: "Mood" },
		{ id: "genre", label: "Genre" },
		{ id: "year", label: "Release Year" },
	];

	const resolveSearchGenreIds = (
		query: string,
		genres: Genre[],
	): number[] => {
		const normalized = query.trim().toLowerCase();
		if (!normalized) return [];

		const genreIds = new Set<number>();
		const tokens = normalized.split(/\s+/).filter(Boolean);

		for (const [keyword, ids] of Object.entries(moodGenreMap)) {
			if (normalized.includes(keyword)) {
				ids.forEach((id) => genreIds.add(id));
			}
		}

		const genreMatches = genres.filter((g) => {
			const name = g.name.toLowerCase();
			return (
				normalized === name ||
				(normalized.length >= 3 &&
					name.includes(normalized)) ||
				tokens.some((token) => token === name)
			);
		});
		genreMatches.forEach((g) => genreIds.add(g.id));

		return Array.from(genreIds);
	};

	const resolveGenreOnlyIds = (
		query: string,
		genres: Genre[],
	): number[] => {
		const normalized = query.trim().toLowerCase();
		if (!normalized) return [];

		const tokens = normalized.split(/\s+/).filter(Boolean);
		const matches = genres.filter((genre) => {
			const name = genre.name.toLowerCase();
			return (
				normalized === name ||
				(normalized.length >= 3 &&
					name.includes(normalized)) ||
				tokens.some((token) => token === name)
			);
		});

		return matches.map((genre) => genre.id);
	};

	const extractYear = (value: string): string => {
		const trimmed = value.trim();
		if (/^(19|20)\d{2}$/.test(trimmed)) return trimmed;
		const yearMatch = trimmed.match(/(19|20)\d{2}/);
		return yearMatch?.[0] || "";
	};

	// Initial load: Genres
	useEffect(() => {
		Promise.all([APIService.getGenres(), APIService.getTVGenres()])
			.then(([movieGenres, tvGenres]) => {
				const byId = new Map<number, Genre>();
				movieGenres.forEach((g) => byId.set(g.id, g));
				tvGenres.forEach((g) => {
					if (!byId.has(g.id)) byId.set(g.id, g);
				});
				setAllGenres(Array.from(byId.values()));
			})
			.catch(console.error);
	}, []);
	// Handle clicks outside dropdowns
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropDownRef.current &&
				!dropDownRef.current.contains(
					event.target as Node,
				)
			) {
				setShowNotifs(false);
			}
			if (
				searchWrapperRef.current &&
				!searchWrapperRef.current.contains(
					event.target as Node,
				)
			) {
				setShowSuggestions(false);
				setShowAdvanced(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener(
				"mousedown",
				handleClickOutside,
			);
	}, []);

	useEffect(() => {
		const timer = setTimeout(() => {
			if (
				searchCategory === "movie_tv" &&
				searchQuery.trim().length >= 2 &&
				!showAdvanced
			) {
				Promise.all([
					APIService.searchMovies(searchQuery),
					APIService.searchTV(searchQuery),
				])
					.then(([movies, tvShows]) => {
						const movieResults = movies
							.slice(0, 3)
							.map((m) => ({
								...m,
								_mediaType: "movie" as const,
							}));
						const tvResults = tvShows
							.slice(0, 2)
							.map((t) => ({
								id: t.id,
								title: t.name,
								poster_path:
									t.poster_path,
								backdrop_path:
									t.backdrop_path,
								overview: t.overview,
								vote_average:
									t.vote_average,
								release_date:
									t.first_air_date,
								genre_ids: t.genre_ids,
								_mediaType: "tv" as const,
							}));
						setSuggestions([
							...movieResults,
							...tvResults,
						]);
						setShowSuggestions(true);
					})
					.catch(console.error);
			} else {
				setSuggestions([]);
				setShowSuggestions(false);
			}
		}, 300);
		return () => clearTimeout(timer);
	}, [searchQuery, showAdvanced, searchCategory]);

	// Debounce Actor Search
	useEffect(() => {
		const timer = setTimeout(() => {
			if (actorQuery.trim().length >= 2 && !selectedActor) {
				APIService.searchPerson(actorQuery)
					.then((res) => {
						setActorSuggestions(
							res.slice(0, 5),
						);
					})
					.catch(console.error);
			} else {
				setActorSuggestions([]);
			}
		}, 300);
		return () => clearTimeout(timer);
	}, [actorQuery, selectedActor]);

	const toggleNotifs = () => {
		if (!showNotifs) {
			const updated = notifications.map((n) => ({
				...n,
				read: true,
			}));
			setNotifications(updated);
			localStorage.setItem(
				NOTIF_KEY,
				JSON.stringify(updated),
			);
		}
		setShowNotifs(!showNotifs);
	};

	const clearNotifs = () => {
		// Mark all current release note IDs as "seen" so they don't reappear
		const allSeenIds = RELEASE_NOTES.map((n) => n.id);
		localStorage.setItem(SEEN_KEY, JSON.stringify(allSeenIds));
		setNotifications([]);
		localStorage.setItem(NOTIF_KEY, JSON.stringify([]));
	};

	const findMoodKeywords = (query: string): string[] => {
		const normalized = query.trim().toLowerCase();
		if (!normalized) return [];
		return Object.keys(moodGenreMap).filter((keyword) =>
			normalized.includes(keyword),
		);
	};

	const executeSearch = async () => {
		setShowSuggestions(false);
		setShowAdvanced(false);
		const trimmed = searchQuery.trim();
		if (!trimmed) return;
		const params = new URLSearchParams();
		params.append("searchCategory", searchCategory);
		params.append("q", trimmed);

		if (searchCategory === "actor") {
			try {
				const people =
					await APIService.searchPerson(trimmed);
				const best = people[0];
				if (best) {
					params.append(
						"with_people",
						best.id.toString(),
					);
					params.append("actor_name", best.name);
				}
			} catch (error) {
				console.error("Actor search failed:", error);
			}
		}

		if (searchCategory === "mood") {
			const moodMatches = findMoodKeywords(trimmed);
			const resolvedGenreIds = resolveSearchGenreIds(
				trimmed,
				allGenres,
			);
			if (resolvedGenreIds.length > 0) {
				params.append(
					"with_genres",
					resolvedGenreIds.join(","),
				);
			}
			if (moodMatches.length > 0) {
				params.append("mood", moodMatches.join(","));
			}
		}

		if (searchCategory === "genre") {
			const genreIds = resolveGenreOnlyIds(
				trimmed,
				allGenres,
			);
			if (genreIds.length > 0) {
				params.append(
					"with_genres",
					genreIds.join(","),
				);
			}
		}

		if (searchCategory === "year") {
			const year = extractYear(trimmed);
			if (year) {
				params.append("primary_release_year", year);
			}
		}

		navigate(`/search?${params.toString()}`);
		setSearchQuery("");
	};

	const applyAdvancedFilters = () => {
		setShowAdvanced(false);
		setShowSuggestions(false);
		const params = new URLSearchParams();
		params.append("searchCategory", "movie_tv");
		if (filterGenres.length > 0)
			params.append("with_genres", filterGenres.join(","));
		if (selectedActor)
			params.append(
				"with_people",
				selectedActor.id.toString(),
			);
		if (filterYear)
			params.append("primary_release_year", filterYear);
		if (filterScore > 0)
			params.append(
				"vote_average.gte",
				filterScore.toString(),
			);

		navigate(`/search?${params.toString()}`);
	};

	const unreadCount = notifications.filter((n) => !n.read).length;

	return (
		<header className="navbar">
			<div className="container navbar-inner">
				{/* Logo */}
				<Link to="/" className="nav-logo-link">
					<div className="nav-logo-icon">
						<span
							className="material-symbols-outlined"
							style={{
								fontSize: "36px",
							}}
						>
							movie_filter
						</span>
					</div>
					<h1 className="nav-logo-text">
						FilmReel
					</h1>
				</Link>

				{/* Search Bar */}
				<div
					className="nav-search-container"
					ref={searchWrapperRef}
				>
					<div className="nav-search-input-wrapper">
						<div
							className="nav-search-icon"
							onClick={executeSearch}
							style={{
								cursor: "pointer",
								pointerEvents:
									"auto",
								zIndex: 2,
							}}
						>
							<span className="material-symbols-outlined nav-search-icon-hover">
								search
							</span>
						</div>
						<input
							className="input-glass nav-search-input-glass"
							placeholder={
								searchCategory ===
								"movie_tv"
									? "Search movie or TV show..."
									: searchCategory ===
										  "actor"
										? "Search actor..."
										: searchCategory ===
											  "mood"
											? "Search mood..."
											: searchCategory ===
												  "genre"
												? "Search genre..."
												: "Search release year..."
							}
							type="text"
							value={searchQuery}
							onChange={(e) =>
								setSearchQuery(
									e.target
										.value,
								)
							}
							onFocus={() => {
								if (
									suggestions.length >
										0 &&
									!showAdvanced
								)
									setShowSuggestions(
										true,
									);
							}}
							onKeyDown={(e) => {
								if (
									e.key ===
									"Enter"
								)
									executeSearch();
							}}
						/>
						<button
							className={`nav-search-filter-icon ${showAdvanced ? "active" : ""}`}
							onClick={() => {
								setShowAdvanced(
									!showAdvanced,
								);
								setShowSuggestions(
									false,
								);
							}}
							title="Advanced Filters"
						>
							<span className="material-symbols-outlined">
								tune
							</span>
						</button>
					</div>

					<div className="nav-search-categories">
						{searchCategories.map(
							(category) => (
								<button
									key={
										category.id
									}
									type="button"
									className={`nav-search-category-chip ${searchCategory === category.id ? "active" : ""}`}
									onClick={() => {
										setSearchCategory(
											category.id,
										);
										setShowSuggestions(
											false,
										);
									}}
								>
									{
										category.label
									}
								</button>
							),
						)}
					</div>

					{/* Autocomplete Dropdown */}
					{showSuggestions &&
						!showAdvanced &&
						suggestions.length > 0 && (
							<div className="search-autocomplete glass-panel animate-fade-in-up">
								{suggestions.map(
									(
										movie,
									) => (
										<Link
											to={
												movie._mediaType ===
												"tv"
													? `/tv/${movie.id}`
													: `/movie/${movie.id}`
											}
											className="search-suggestion-item"
											key={`${movie._mediaType}-${movie.id}`}
											onClick={() => {
												setShowSuggestions(
													false,
												);
												setSearchQuery(
													"",
												);
											}}
										>
											{movie.poster_path ? (
												<img
													src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
													alt={
														movie.title
													}
												/>
											) : (
												<div className="search-suggestion-placeholder">
													<span className="material-symbols-outlined">
														{movie._mediaType ===
														"tv"
															? "live_tv"
															: "movie"}
													</span>
												</div>
											)}
											<div className="search-suggestion-info">
												<h4>
													{
														movie.title
													}
													{movie._mediaType ===
														"tv" && (
														<span className="search-tv-badge">
															TV
														</span>
													)}
												</h4>
												<p>
													{movie.release_date?.substring(
														0,
														4,
													)}{" "}
													•
													★{" "}
													{movie.vote_average.toFixed(
														1,
													)}
												</p>
											</div>
										</Link>
									),
								)}
							</div>
						)}

					{/* Advanced Filter Panel */}
					{showAdvanced && (
						<div className="search-advanced-panel glass-panel animate-fade-in-up">
							<div className="advanced-header">
								<h3>
									Advanced
									Filters
								</h3>
								<button
									className="nav-icon-button"
									onClick={() =>
										setShowAdvanced(
											false,
										)
									}
								>
									<span className="material-symbols-outlined">
										close
									</span>
								</button>
							</div>

							<div className="advanced-scroll-content">
								<div className="filter-group">
									<label>
										Genres
									</label>
									<div className="filter-chips">
										{allGenres.map(
											(
												g,
											) => (
												<button
													key={
														g.id
													}
													className={`filter-chip ${filterGenres.includes(g.id) ? "active" : ""}`}
													onClick={() =>
														setFilterGenres(
															(
																prev,
															) =>
																prev.includes(
																	g.id,
																)
																	? prev.filter(
																			(
																				id,
																			) =>
																				id !==
																				g.id,
																		)
																	: [
																			...prev,
																			g.id,
																		],
														)
													}
												>
													{
														g.name
													}
												</button>
											),
										)}
									</div>
								</div>

								<div className="filter-group">
									<label>
										Cast
										/
										Crew
									</label>
									<div className="actor-search-wrapper">
										{selectedActor ? (
											<div className="filter-chip active selected-actor-chip">
												<span>
													{
														selectedActor.name
													}
												</span>
												<span
													className="material-symbols-outlined cancel-icon"
													onClick={() => {
														setSelectedActor(
															null,
														);
														setActorQuery(
															"",
														);
													}}
												>
													close
												</span>
											</div>
										) : (
											<>
												<input
													type="text"
													className="input-glass"
													placeholder="Search person..."
													value={
														actorQuery
													}
													onChange={(
														e,
													) =>
														setActorQuery(
															e
																.target
																.value,
														)
													}
												/>
												{actorSuggestions.length >
													0 && (
													<div className="actor-autocomplete glass-panel">
														{actorSuggestions.map(
															(
																person,
															) => (
																<div
																	key={
																		person.id
																	}
																	className="actor-suggestion-item"
																	onClick={() => {
																		setSelectedActor(
																			person,
																		);
																		setActorSuggestions(
																			[],
																		);
																	}}
																>
																	{person.profile_path ? (
																		<img
																			src={`https://image.tmdb.org/t/p/w45${person.profile_path}`}
																			alt={
																				person.name
																			}
																		/>
																	) : (
																		<span className="material-symbols-outlined">
																			person
																		</span>
																	)}
																	<span>
																		{
																			person.name
																		}
																	</span>
																</div>
															),
														)}
													</div>
												)}
											</>
										)}
									</div>
								</div>

								<div className="filter-row">
									<div className="filter-group half">
										<label>
											Release
											Year
										</label>
										<input
											type="number"
											className="input-glass"
											placeholder="e.g. 2024"
											value={
												filterYear
											}
											onChange={(
												e,
											) =>
												setFilterYear(
													e
														.target
														.value,
												)
											}
											min="1900"
											max="2030"
										/>
									</div>
									<div className="filter-group half">
										<label>
											Min
											Score:{" "}
											<span className="text-purple">
												{filterScore >
												0
													? filterScore
													: "Any"}
											</span>
										</label>
										<input
											title="Minimum Score"
											type="range"
											min="0"
											max="10"
											step="1"
											value={
												filterScore
											}
											onChange={(
												e,
											) =>
												setFilterScore(
													parseInt(
														e
															.target
															.value,
													),
												)
											}
											className="range-glass custom-slider"
										/>
									</div>
								</div>
							</div>

							<div className="advanced-search-actions">
								<button
									className="btn btn-glass"
									onClick={() => {
										setFilterGenres(
											[],
										);
										setSelectedActor(
											null,
										);
										setFilterYear(
											"",
										);
										setFilterScore(
											0,
										);
									}}
								>
									Clear
								</button>
								<button
									className="btn btn-primary"
									onClick={
										applyAdvancedFilters
									}
								>
									Apply
									Filters
								</button>
							</div>
						</div>
					)}
				</div>

				{/* Right Actions */}
				<div className="nav-actions">
					<div>
						<button
							className="nav-icon-button"
							onClick={() =>
								openFeedback()
							}
						>
							<span className="material-symbols-outlined">
								feedback
							</span>
						</button>
					</div>
					<Link
						to="/mood"
						className="nav-mood-button group"
						title="Mood Survey"
					>
						<span className="material-symbols-outlined text-purple">
							auto_awesome
						</span>
						<span
							style={{
								fontSize: "0.9rem",
								display: "none",
							}}
							className="md-inline font-bold group-hover-text-primary"
						>
							Survey
						</span>
					</Link>

					<div
						style={{ position: "relative" }}
						ref={dropDownRef}
					>
						<button
							className="nav-icon-button"
							onClick={toggleNotifs}
						>
							<span className="material-symbols-outlined">
								notifications
							</span>
							{unreadCount > 0 && (
								<span className="nav-badge"></span>
							)}
						</button>

						{/* Dropdown */}
						{showNotifs && (
							<div className="notif-dropdown animate-fade-in-up">
								<div className="notif-header">
									<h3>
										Notifications
									</h3>
									{notifications.length >
										0 && (
										<button
											onClick={
												clearNotifs
											}
											className="notif-clear-btn"
										>
											Clear
											All
										</button>
									)}
								</div>
								<div className="notif-list">
									{notifications.length ===
									0 ? (
										<div className="notif-empty">
											You're
											all
											caught
											up!
										</div>
									) : (
										notifications.map(
											(
												n,
											) => (
												<div
													key={
														n.id
													}
													className={`notif-item ${!n.read ? "unread" : ""}`}
												>
													<h4>
														{
															n.title
														}
													</h4>
													<p>
														{
															n.message
														}
													</p>
													<p
														style={{
															fontSize: "0.7rem",
															marginTop: "4px",
															opacity: 0.7,
														}}
													>
														{new Date(
															n.date,
														).toLocaleDateString()}
													</p>
												</div>
											),
										)
									)}
								</div>
							</div>
						)}
					</div>

					<div className="nav-divider"></div>

					<Link
						to="/account"
						className="nav-profile-link group"
					>
						<div className="nav-avatar group-hover-border-primary">
							{profile.avatarBase64 ? (
								<img
									alt="User profile"
									src={
										profile.avatarBase64
									}
								/>
							) : (
								<span
									className="material-symbols-outlined"
									style={{
										color: "rgba(255,255,255,0.3)",
										fontSize: "24px",
									}}
								>
									person
								</span>
							)}
						</div>
						<span className="nav-profile-name group-hover-text-primary hidden-md">
							{profile.displayName}
						</span>
					</Link>
				</div>
			</div>
		</header>
	);
};
