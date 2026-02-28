import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { APIService } from "../services/api";
import type { Movie, TVShow, Genre, CastMember } from "../services/api";
import { StorageService } from "../services/storage";
import { useStorageSync } from "../hooks/useStorageSync";
import { MovieRow } from "../components/MovieRow";
import { GenreMap } from "../services/genreMap";
import "../styles/Home.css";

const WATCHLIST_KEY = "filmreel_watchlist";
const WATCHED_MOVIES_KEY = "filmreel_watched_movies";
const ACTOR_OF_DAY_KEY = "filmreel_actor_of_day";
const TITLE_OF_DAY_KEY = "filmreel_title_of_day";
const ABOUT_SHORTCUT_DISMISSED_KEY = "filmreel_about_shortcut_dismissed";
const HERO_SLIDE_COUNT = 4;
const HERO_AUTO_ROTATE_MS = 8000;
const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

interface FeaturedTitleItem {
	id: number;
	title: string;
	overview: string;
	poster_path: string | null;
	backdrop_path: string | null;
	mediaType: "movie" | "tv";
}

interface ActorOfDayPick {
	id: number;
	name: string;
	profilePath: string | null;
	sourceTitle: string;
	sourceMediaType: "movie" | "tv";
	fact: string;
	generatedAt: number;
}

interface TitleOfDayPick {
	id: number;
	title: string;
	mediaType: "movie" | "tv";
	overview: string;
	posterPath: string | null;
	backdropPath: string | null;
	fact: string;
	generatedAt: number;
}

type MixedRowItem = (Movie | TVShow) & { _mediaType: "movie" | "tv" };

const isFreshPick = (timestamp: number) =>
	Date.now() - timestamp < TWELVE_HOURS_MS;

const getRandomItem = <T,>(items: T[]): T | null => {
	if (items.length === 0) return null;
	return items[Math.floor(Math.random() * items.length)] ?? null;
};

const shuffleItems = <T,>(items: T[]): T[] => {
	const copy = [...items];
	for (let i = copy.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1));
		const current = copy[i];
		copy[i] = copy[j];
		copy[j] = current;
	}
	return copy;
};

const parseStoredPick = <T,>(value: string | null): T | null => {
	if (!value) return null;
	try {
		return JSON.parse(value) as T;
	} catch {
		return null;
	}
};

const formatRefreshRemaining = (generatedAt: number, now: number): string => {
	const remaining = Math.max(0, TWELVE_HOURS_MS - (now - generatedAt));
	const hours = Math.floor(remaining / (60 * 60 * 1000));
	const minutes = Math.floor(
		(remaining % (60 * 60 * 1000)) / (60 * 1000),
	);
	return `${hours}h ${minutes}m`;
};

export default function Home() {
	const [popular, setPopular] = useState<Movie[]>([]);
	const [genres, setGenres] = useState<Genre[]>([]);
	const [genreMovies, setGenreMovies] = useState<Record<number, Movie[]>>(
		{},
	);
	const [loading, setLoading] = useState(true);

	// Vertical infinite scroll state
	const [displayedGenreCount, setDisplayedGenreCount] = useState(10);
	const [loadingMoreGenres, setLoadingMoreGenres] = useState(false);

	// Hidden Gems
	const [hiddenGems, setHiddenGems] = useState<Movie[]>([]);

	// Popular TV Shows
	const [popularTV, setPopularTV] = useState<TVShow[]>([]);
	const [animeTitles, setAnimeTitles] = useState<MixedRowItem[]>([]);

	// Favorite Genre rows (2 pages)
	const [favGenreMoviesP1, setFavGenreMoviesP1] = useState<
		MixedRowItem[]
	>([]);
	const [favGenreMoviesP2, setFavGenreMoviesP2] = useState<
		MixedRowItem[]
	>([]);

	// Watch It Again — movies resolved from watched IDs
	const [watchedLiveMovies, setWatchedLiveMovies] = useState<Movie[]>([]);
	const [heroSlideIndex, setHeroSlideIndex] = useState(0);
	const [featureRequestText, setFeatureRequestText] = useState("");
	const [featureRequestStatus, setFeatureRequestStatus] = useState<
		"idle" | "submitting" | "success" | "error"
	>("idle");
	const [isFeatureRequestFocused, setIsFeatureRequestFocused] =
		useState(false);
	const [isHeroHovered, setIsHeroHovered] = useState(false);
	const [refreshNow, setRefreshNow] = useState(() => Date.now());
	const [actorOfDay, setActorOfDay] = useState<ActorOfDayPick | null>(
		null,
	);
	const [titleOfDay, setTitleOfDay] = useState<TitleOfDayPick | null>(
		null,
	);
	const [isAboutShortcutDismissed, setIsAboutShortcutDismissed] =
		useState(() => {
			try {
				return (
					localStorage.getItem(
						ABOUT_SHORTCUT_DISMISSED_KEY,
					) === "1"
				);
			} catch {
				return false;
			}
		});

	const navigate = useNavigate();

	// Reactive localStorage subscriptions
	const watchlist = useStorageSync(
		WATCHLIST_KEY,
		StorageService.getWatchlist,
	);
	const watchedMovies = useStorageSync(
		WATCHED_MOVIES_KEY,
		StorageService.getWatchedMovies,
	);
	const profile = useStorageSync(
		"filmreel_user_profile",
		StorageService.getProfile,
	);

	// Build watchlist as Movie-shaped objects for MovieRow
	const watchlistAsMovies: Movie[] = watchlist.map((item) => ({
		id: item.id,
		title: item.title,
		poster_path: item.poster_path,
		backdrop_path: null,
		overview: "",
		vote_average: 0,
		release_date: "",
		genre_ids: [],
	}));

	// Fetch watched movie details when watched list changes
	useEffect(() => {
		if (watchedMovies.length === 0) {
			setWatchedLiveMovies([]);
			return;
		}

		let cancelled = false;
		const fetchMovies = async () => {
			try {
				const movies = await Promise.all(
					watchedMovies
						.slice(0, 20)
						.map((id) =>
							APIService.getMovieDetails(
								id,
							),
						),
				);
				if (!cancelled) setWatchedLiveMovies(movies);
			} catch (err) {
				console.error(
					"Failed to load watched movies:",
					err,
				);
			}
		};
		fetchMovies();
		return () => {
			cancelled = true;
		};
	}, [watchedMovies]);

	// Fetch favorite genre movies when profile changes
	useEffect(() => {
		if (!profile.favoriteGenreId) {
			setFavGenreMoviesP1([]);
			setFavGenreMoviesP2([]);
			return;
		}

		let cancelled = false;
		const fetchFav = async () => {
			try {
				const [movieP1, tvP1, movieP2, tvP2] =
					await Promise.all([
						APIService.getMoviesByGenre(
							profile.favoriteGenreId!,
							1,
						),
						APIService.discoverTV(
							{
								with_genres:
									profile.favoriteGenreId!.toString(),
								sort_by: "popularity.desc",
							},
							1,
						),
						APIService.getMoviesByGenre(
							profile.favoriteGenreId!,
							2,
						),
						APIService.discoverTV(
							{
								with_genres:
									profile.favoriteGenreId!.toString(),
								sort_by: "popularity.desc",
							},
							2,
						),
					]);

				const mixedP1: MixedRowItem[] = [
					...movieP1.map((movie) => ({
						...movie,
						_mediaType: "movie" as const,
					})),
					...tvP1.map((show) => ({
						...show,
						_mediaType: "tv" as const,
					})),
				].sort(
					(a, b) =>
						(b.vote_average || 0) -
						(a.vote_average || 0),
				);

				const mixedP2: MixedRowItem[] = [
					...movieP2.map((movie) => ({
						...movie,
						_mediaType: "movie" as const,
					})),
					...tvP2.map((show) => ({
						...show,
						_mediaType: "tv" as const,
					})),
				].sort(
					(a, b) =>
						(b.vote_average || 0) -
						(a.vote_average || 0),
				);

				if (!cancelled) {
					setFavGenreMoviesP1(mixedP1);
					setFavGenreMoviesP2(mixedP2);
				}
			} catch (err) {
				console.error(
					"Failed to load favorite genre:",
					err,
				);
			}
		};
		fetchFav();
		return () => {
			cancelled = true;
		};
	}, [profile.favoriteGenreId]);

	const buildFeaturedPool = useCallback(
		(
			movieItems: Movie[],
			tvItems: TVShow[],
		): FeaturedTitleItem[] => {
			const moviePool = movieItems
				.slice(0, 10)
				.map((movie) => ({
					id: movie.id,
					title: movie.title,
					overview: movie.overview,
					poster_path: movie.poster_path,
					backdrop_path: movie.backdrop_path,
					mediaType: "movie" as const,
				}));
			const tvPool = tvItems.slice(0, 10).map((show) => ({
				id: show.id,
				title: show.name,
				overview: show.overview,
				poster_path: show.poster_path,
				backdrop_path: show.backdrop_path,
				mediaType: "tv" as const,
			}));
			return [...moviePool, ...tvPool];
		},
		[],
	);

	const buildActorFact = (
		actor: CastMember,
		title: FeaturedTitleItem,
	): string => {
		if (actor.character?.trim()) {
			return `${actor.name} plays ${actor.character} in ${title.title}.`;
		}
		return `${actor.name} appears in ${title.title}, one of today's trending picks.`;
	};

	const resolveActorOfDay = useCallback(
		async (
			movieItems: Movie[],
			tvItems: TVShow[],
		): Promise<ActorOfDayPick | null> => {
			const stored = parseStoredPick<ActorOfDayPick>(
				localStorage.getItem(ACTOR_OF_DAY_KEY),
			);
			if (stored && isFreshPick(stored.generatedAt)) {
				return stored;
			}

			const pool = shuffleItems(
				buildFeaturedPool(movieItems, tvItems),
			);
			for (const item of pool.slice(0, 8)) {
				try {
					const cast =
						item.mediaType === "movie"
							? await APIService.getMovieCredits(
									item.id,
								)
							: await APIService.getTVCredits(
									item.id,
								);
					const pickable = cast
						.filter(
							(person) =>
								person.id > 0,
						)
						.slice(0, 12);
					const actor = getRandomItem(pickable);
					if (!actor) continue;

					const selected: ActorOfDayPick = {
						id: actor.id,
						name: actor.name,
						profilePath: actor.profile_path,
						sourceTitle: item.title,
						sourceMediaType: item.mediaType,
						fact: buildActorFact(
							actor,
							item,
						),
						generatedAt: Date.now(),
					};
					localStorage.setItem(
						ACTOR_OF_DAY_KEY,
						JSON.stringify(selected),
					);
					return selected;
				} catch {
					continue;
				}
			}
			return null;
		},
		[buildFeaturedPool],
	);

	const resolveTitleOfDay = useCallback(
		(
			movieItems: Movie[],
			tvItems: TVShow[],
		): TitleOfDayPick | null => {
			const stored = parseStoredPick<TitleOfDayPick>(
				localStorage.getItem(TITLE_OF_DAY_KEY),
			);
			if (stored && isFreshPick(stored.generatedAt)) {
				return stored;
			}

			const title = getRandomItem(
				buildFeaturedPool(movieItems, tvItems),
			);
			if (!title) return null;

			const selected: TitleOfDayPick = {
				id: title.id,
				title: title.title,
				mediaType: title.mediaType,
				overview: title.overview,
				posterPath: title.poster_path,
				backdropPath: title.backdrop_path,
				fact:
					title.mediaType === "movie"
						? `Today's film pick rotates every 12 hours.`
						: `Today's TV pick rotates every 12 hours.`,
				generatedAt: Date.now(),
			};

			localStorage.setItem(
				TITLE_OF_DAY_KEY,
				JSON.stringify(selected),
			);
			return selected;
		},
		[buildFeaturedPool],
	);

	const resolveDailyPicks = useCallback(
		async (movieItems: Movie[], tvItems: TVShow[]) => {
			const [actorPick, titlePick] = await Promise.all([
				resolveActorOfDay(movieItems, tvItems),
				Promise.resolve(
					resolveTitleOfDay(movieItems, tvItems),
				),
			]);
			setActorOfDay(actorPick);
			setTitleOfDay(titlePick);
		},
		[resolveActorOfDay, resolveTitleOfDay],
	);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [
					popMovies,
					genreList,
					gems,
					tvShows,
					animeMovies,
					animeTV,
				] = await Promise.all([
					APIService.getPopularMovies(1),
					APIService.getGenres(),
					APIService.getHiddenGems(1),
					APIService.getPopularTV(1),
					APIService.discoverMovies(
						{
							with_genres: "16",
							with_original_language:
								"ja",
							sort_by: "popularity.desc",
						},
						1,
					),
					APIService.discoverTV(
						{
							with_genres: "16",
							with_original_language:
								"ja",
							sort_by: "popularity.desc",
						},
						1,
					),
				]);

				setPopular(popMovies);
				setGenres(genreList);
				setHiddenGems(gems);
				setPopularTV(tvShows);
				setAnimeTitles(
					[
						...animeMovies.map((movie) => ({
							...movie,
							_mediaType: "movie" as const,
						})),
						...animeTV.map((show) => ({
							...show,
							_mediaType: "tv" as const,
						})),
					].sort(
						(a, b) =>
							(b.vote_average || 0) -
							(a.vote_average || 0),
					),
				);
				GenreMap.seed(genreList);
				await resolveDailyPicks(popMovies, tvShows);

				// Fetch movies for the first 3 genres
				const top3 = genreList.slice(0, 3);
				const moviesForGenres = await Promise.all(
					top3.map((g) =>
						APIService.getMoviesByGenre(
							g.id,
							1,
						),
					),
				);

				const newGenreMovies: Record<number, Movie[]> =
					{};
				top3.forEach((g, idx) => {
					newGenreMovies[g.id] =
						moviesForGenres[idx];
				});
				setGenreMovies(newGenreMovies);
			} catch (e) {
				console.error(
					"Failed to load dashboard data.",
					e,
				);
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, [resolveDailyPicks]);

	useEffect(() => {
		const intervalId = window.setInterval(() => {
			if (isFeatureRequestFocused || isHeroHovered) return;
			setHeroSlideIndex(
				(prev) => (prev + 1) % HERO_SLIDE_COUNT,
			);
		}, HERO_AUTO_ROTATE_MS);

		return () => window.clearInterval(intervalId);
	}, [isFeatureRequestFocused, isHeroHovered]);

	useEffect(() => {
		const refreshTimerId = window.setInterval(() => {
			setRefreshNow(Date.now());
		}, 60000);

		return () => window.clearInterval(refreshTimerId);
	}, []);

	// Observer for detecting end of page to load more genres
	const observer = useRef<IntersectionObserver | null>(null);

	const loadMoreGenres = useCallback(async () => {
		if (loadingMoreGenres || displayedGenreCount >= genres.length)
			return;
		setLoadingMoreGenres(true);

		try {
			const nextCount = Math.min(
				displayedGenreCount + 2,
				genres.length,
			);
			const nextGenres = genres.slice(
				displayedGenreCount,
				nextCount,
			);

			const moviesForNextGenres = await Promise.all(
				nextGenres.map((g) =>
					APIService.getMoviesByGenre(g.id, 1),
				),
			);

			const newGenreMovies = { ...genreMovies };
			nextGenres.forEach((g, idx) => {
				newGenreMovies[g.id] = moviesForNextGenres[idx];
			});

			setGenreMovies(newGenreMovies);
			setDisplayedGenreCount(nextCount);
		} catch (e) {
			console.error("Failed to load more genres.", e);
		} finally {
			setLoadingMoreGenres(false);
		}
	}, [loadingMoreGenres, displayedGenreCount, genres, genreMovies]);

	const lastGenreElementRef = useCallback(
		(node: HTMLElement | null) => {
			if (loading || loadingMoreGenres) return;
			if (observer.current) observer.current.disconnect();

			observer.current = new IntersectionObserver(
				(entries) => {
					if (
						entries[0].isIntersecting &&
						displayedGenreCount <
							genres.length
					) {
						loadMoreGenres();
					}
				},
				{ rootMargin: "0px 0px 400px 0px" },
			);

			if (node) observer.current.observe(node);
		},
		[
			loading,
			loadingMoreGenres,
			displayedGenreCount,
			genres.length,
			loadMoreGenres,
		],
	);

	// Resolve the favorite genre name
	const favGenreId = profile.favoriteGenreId;
	const favGenreName = GenreMap.getName(favGenreId || 0);

	if (loading) {
		return (
			<div className="home-loading">
				<div className="glass-panel home-loading-panel">
					<span className="material-symbols-outlined animate-pulse home-loading-icon">
						autorenew
					</span>
				</div>
			</div>
		);
	}

	const featured = popular[0];
	const mixedTrending = [
		...popular.slice(1).map((m) => ({
			...m,
			_mediaType: "movie" as const,
		})),
		...popularTV.map((t) => ({
			...t,
			_mediaType: "tv" as const,
		})),
	];

	const goToPrevHeroSlide = () =>
		setHeroSlideIndex(
			(prev) =>
				(prev - 1 + HERO_SLIDE_COUNT) %
				HERO_SLIDE_COUNT,
		);

	const goToNextHeroSlide = () =>
		setHeroSlideIndex((prev) => (prev + 1) % HERO_SLIDE_COUNT);

	const heroBackground = (() => {
		if (heroSlideIndex === 3 && titleOfDay) {
			return titleOfDay.backdropPath || titleOfDay.posterPath;
		}
		if (heroSlideIndex === 2 && actorOfDay?.profilePath) {
			return actorOfDay.profilePath;
		}
		return featured?.backdrop_path || featured?.poster_path || null;
	})();

	const actorRefreshText = actorOfDay
		? formatRefreshRemaining(actorOfDay.generatedAt, refreshNow)
		: null;
	const titleRefreshText = titleOfDay
		? formatRefreshRemaining(titleOfDay.generatedAt, refreshNow)
		: null;

	const submitFeatureRequest = async (
		e: React.FormEvent<HTMLFormElement>,
	) => {
		e.preventDefault();
		if (!featureRequestText.trim()) return;

		setFeatureRequestStatus("submitting");
		try {
			const webhookUrl = import.meta.env.VITE_WEBHOOK_PB;
			if (!webhookUrl) {
				setFeatureRequestStatus("error");
				return;
			}

			const payload = {
				username: "FilmReel Feedback Bot",
				embeds: [
					{
						title: "New Feature Request",
						color: 3447003,
						fields: [
							{
								name: "Type",
								value: "Feature Request",
								inline: true,
							},
							{
								name: "Description",
								value: featureRequestText.trim(),
							},
						],
						timestamp: new Date().toISOString(),
					},
				],
			};

			const response = await fetch(webhookUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				setFeatureRequestStatus("error");
				return;
			}

			setFeatureRequestStatus("success");
			setFeatureRequestText("");
			window.setTimeout(() => {
				setFeatureRequestStatus("idle");
			}, 2000);
		} catch {
			setFeatureRequestStatus("error");
		}
	};

	const dismissAboutShortcut = () => {
		setIsAboutShortcutDismissed(true);
		try {
			localStorage.setItem(ABOUT_SHORTCUT_DISMISSED_KEY, "1");
		} catch {
			// no-op if storage is unavailable
		}
	};

	return (
		<div className="home-container">
			{/* Hero Section */}
			{featured && (
				<section
					className="hero-section group"
					onMouseEnter={() =>
						setIsHeroHovered(true)
					}
					onMouseLeave={() =>
						setIsHeroHovered(false)
					}
				>
					<div className="hero-bg-container">
						<img
							src={
								heroBackground
									? `https://image.tmdb.org/t/p/original${heroBackground}`
									: `https://image.tmdb.org/t/p/original${featured.poster_path || ""}`
							}
							onError={(e) => {
								(
									e.target as HTMLImageElement
								).src =
									"https://placehold.co/1400x800";
							}}
							alt={featured.title}
							className="hero-bg-image group-hover-scale-110"
						/>
						<div className="hero-overlay-bottom" />
						<div className="hero-overlay-side" />
					</div>

					<div className="hero-content animate-fade-in-up">
						{heroSlideIndex === 0 && (
							<>
								<div className="hero-badge">
									<span className="hero-badge-dot animate-pulse"></span>
									<span className="hero-badge-text">
										Featured
										Pick
									</span>
								</div>
								<h2 className="hero-title">
									What's
									the{" "}
									<span className="text-gradient">
										vibe
									</span>{" "}
									tonight?
								</h2>
								<p className="hero-description line-clamp-2">
									{featured.overview ||
										"Stop scrolling, start watching. Let our AI curate a personalized playlist based on exactly how you're feeling right now."}
								</p>
								<div className="hero-buttons">
									<button
										onClick={() =>
											navigate(
												"/mood",
											)
										}
										className="btn-primary hero-button hero-button-primary"
									>
										<span className="material-symbols-outlined">
											auto_awesome
										</span>
										Take
										Mood
										Survey
									</button>
									<button
										onClick={() =>
											navigate(
												`/movie/${featured.id}`,
											)
										}
										className="btn-glass hero-button"
									>
										<span className="material-symbols-outlined">
											play_arrow
										</span>
										Watch
										Now
									</button>
								</div>
							</>
						)}

						{heroSlideIndex === 1 && (
							<>
								<div className="hero-badge">
									<span className="hero-badge-dot animate-pulse"></span>
									<span className="hero-badge-text">
										Feature
										Request
									</span>
								</div>
								<h2 className="hero-title">
									Help
									shape
									FilmReel
								</h2>
								<p className="hero-description">
									Have an
									idea for
									a new
									feature?
									Submit
									it here
									and
									we'll
									review
									it for
									upcoming
									releases.
								</p>
								<form
									className="hero-feature-form"
									onSubmit={
										submitFeatureRequest
									}
								>
									<textarea
										className="hero-feature-textarea"
										value={
											featureRequestText
										}
										onFocus={() =>
											setIsFeatureRequestFocused(
												true,
											)
										}
										onBlur={() =>
											setIsFeatureRequestFocused(
												false,
											)
										}
										onChange={(
											e,
										) =>
											setFeatureRequestText(
												e
													.target
													.value,
											)
										}
										placeholder="Describe the feature you'd like to see..."
										rows={
											3
										}
										required
									/>
									<div className="hero-feature-actions">
										<button
											type="submit"
											className="btn-primary hero-button hero-button-primary"
											disabled={
												featureRequestStatus ===
													"submitting" ||
												!featureRequestText.trim()
											}
										>
											{featureRequestStatus ===
											"submitting"
												? "Sending..."
												: "Submit Request"}
										</button>
										{featureRequestStatus ===
											"success" && (
											<span className="hero-feature-status success">
												Sent!
												Thanks
												for
												the
												idea.
											</span>
										)}
										{featureRequestStatus ===
											"error" && (
											<span className="hero-feature-status error">
												Couldn't
												send
												right
												now.
												Try
												again.
											</span>
										)}
									</div>
								</form>
							</>
						)}

						{heroSlideIndex === 2 &&
							actorOfDay && (
								<>
									<div className="hero-badge">
										<span className="hero-badge-dot animate-pulse"></span>
										<span className="hero-badge-text">
											Actor
											of
											the
											Day
										</span>
									</div>
									<h2 className="hero-title">
										{
											actorOfDay.name
										}
									</h2>
									<p className="hero-description">
										{
											actorOfDay.fact
										}
									</p>
									{actorRefreshText && (
										<p className="hero-refresh-timer">
											Refreshes
											in{" "}
											{
												actorRefreshText
											}
										</p>
									)}
									<div className="hero-buttons">
										<button
											onClick={() =>
												navigate(
													`/search?searchCategory=actor&q=${encodeURIComponent(actorOfDay.name)}&with_people=${actorOfDay.id}&actor_name=${encodeURIComponent(actorOfDay.name)}`,
												)
											}
											className="btn-primary hero-button hero-button-primary"
										>
											<span className="material-symbols-outlined">
												theater_comedy
											</span>
											View
											Movies
										</button>
									</div>
								</>
							)}

						{heroSlideIndex === 3 &&
							titleOfDay && (
								<>
									<div className="hero-badge">
										<span className="hero-badge-dot animate-pulse"></span>
										<span className="hero-badge-text">
											{titleOfDay.mediaType ===
											"movie"
												? "Movie of the Day"
												: "TV Show of the Day"}
										</span>
									</div>
									<h2 className="hero-title">
										{
											titleOfDay.title
										}
									</h2>
									<p className="hero-description line-clamp-2">
										{titleOfDay.overview ||
											titleOfDay.fact}
									</p>
									{titleRefreshText && (
										<p className="hero-refresh-timer">
											Refreshes
											in{" "}
											{
												titleRefreshText
											}
										</p>
									)}
									<div className="hero-buttons">
										<button
											onClick={() =>
												navigate(
													titleOfDay.mediaType ===
														"movie"
														? `/movie/${titleOfDay.id}`
														: `/tv/${titleOfDay.id}`,
												)
											}
											className="btn-primary hero-button hero-button-primary"
										>
											<span className="material-symbols-outlined">
												play_circle
											</span>
											Open
											Viewer
										</button>
									</div>
								</>
							)}

						<div className="hero-carousel-controls">
							<button
								type="button"
								className="hero-carousel-arrow"
								onClick={
									goToPrevHeroSlide
								}
								title="Previous"
							>
								<span className="material-symbols-outlined">
									chevron_left
								</span>
							</button>
							<div className="hero-carousel-dots">
								{Array.from({
									length: HERO_SLIDE_COUNT,
								}).map(
									(
										_,
										index,
									) => (
										<button
											key={
												index
											}
											type="button"
											className={`hero-carousel-dot ${heroSlideIndex === index ? "active" : ""}`}
											onClick={() =>
												setHeroSlideIndex(
													index,
												)
											}
											title={`Go to slide ${index + 1}`}
										/>
									),
								)}
							</div>
							<button
								type="button"
								className="hero-carousel-arrow"
								onClick={
									goToNextHeroSlide
								}
								title="Next"
							>
								<span className="material-symbols-outlined">
									chevron_right
								</span>
							</button>
						</div>
					</div>
				</section>
			)}

			{!isAboutShortcutDismissed && (
				<section className="home-about-shortcut glass-panel">
					<div className="home-about-shortcut-header">
						<p className="home-about-shortcut-eyebrow">
							New here?
						</p>
						<h3 className="home-about-shortcut-title">
							Learn what FilmReel is
							and who built it.
						</h3>
						<p className="home-about-shortcut-text">
							Read the privacy-first
							breakdown, project
							goals, and developer
							background.
						</p>
					</div>
					<div className="home-about-shortcut-actions">
						<button
							onClick={() =>
								navigate(
									"/about",
								)
							}
							className="btn btn-glass home-about-shortcut-button"
						>
							About FilmReel
						</button>
						<button
							type="button"
							title="Dismiss"
							aria-label="Dismiss about shortcut"
							onClick={
								dismissAboutShortcut
							}
							className="home-about-shortcut-dismiss"
						>
							<span className="material-symbols-outlined">
								close
							</span>
						</button>
					</div>
				</section>
			)}

			{/* 1. Watch It Again */}
			{watchedLiveMovies.length > 0 && (
				<MovieRow
					title="Watch It Again"
					initialMovies={watchedLiveMovies}
					staticMovies
					hideViewAll
				/>
			)}

			{/* 2. My Watchlist */}
			{watchlistAsMovies.length > 0 && (
				<MovieRow
					title="My Watchlist"
					initialMovies={watchlistAsMovies}
					staticMovies
					hideViewAll
				/>
			)}

			{/* 3-4. Favorite Genre (2 rows) */}
			{favGenreName && favGenreMoviesP1.length > 0 && (
				<>
					<MovieRow
						title={`Favorite ${favGenreName} Hits`}
						genre={genres.find(
							(g) =>
								g.id ===
								profile.favoriteGenreId,
						)}
						initialMovies={favGenreMoviesP1}
						mediaType="mixed"
					/>
					{favGenreMoviesP2.length > 0 && (
						<MovieRow
							title={`More ${favGenreName}?`}
							genre={genres.find(
								(g) =>
									g.id ===
									profile.favoriteGenreId,
							)}
							initialMovies={
								favGenreMoviesP2
							}
							mediaType="mixed"
						/>
					)}
				</>
			)}

			{/* 5. Trending Now (Movies + TV) */}
			{mixedTrending.length > 0 && (
				<MovieRow
					title="Trending Now"
					initialMovies={mixedTrending}
					mediaType="mixed"
					hideViewAll
				/>
			)}

			{/* Hidden Gems */}
			{hiddenGems.length > 0 && (
				<MovieRow
					title="Hidden Gems"
					initialMovies={hiddenGems}
					hideViewAll
				/>
			)}

			{/* Anime */}
			{animeTitles.length > 0 && (
				<MovieRow
					title="Anime"
					initialMovies={animeTitles}
					mediaType="mixed"
					viewAllPath="/category/anime"
					staticMovies
				/>
			)}

			{/* 6+. Genre Rows */}
			{genres
				.slice(0, displayedGenreCount)
				.map((genre, index) => {
					const isLast =
						index ===
						displayedGenreCount - 1;
					return (
						<div
							key={genre.id}
							ref={
								isLast
									? lastGenreElementRef
									: null
							}
						>
							<MovieRow
								title={`${genre.name} Hits`}
								genre={genre}
								initialMovies={
									genreMovies[
										genre
											.id
									] || []
								}
							/>
						</div>
					);
				})}

			{loadingMoreGenres && (
				<div className="home-loading-more">
					<span className="material-symbols-outlined animate-pulse home-loading-more-icon">
						autorenew
					</span>
				</div>
			)}

			{/* Floating Action Button */}
			<button
				onClick={() => navigate("/mood")}
				className="fab-button group"
				title="Mood Shuffle"
			>
				<span className="material-symbols-outlined fab-icon">
					auto_awesome
				</span>
			</button>
		</div>
	);
}
