import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { APIService } from "../services/api";
import type { Movie, TVShow, Genre } from "../services/api";
import { StorageService } from "../services/storage";
import { useStorageSync } from "../hooks/useStorageSync";
import { MovieRow } from "../components/MovieRow";
import { GenreMap } from "../services/genreMap";
import "../styles/Home.css";

const WATCHLIST_KEY = "filmreel_watchlist";
const WATCHED_MOVIES_KEY = "filmreel_watched_movies";

export default function Home() {
	const [popular, setPopular] = useState<Movie[]>([]);
	const [genres, setGenres] = useState<Genre[]>([]);
	const [genreMovies, setGenreMovies] = useState<Record<number, Movie[]>>(
		{},
	);
	const [loading, setLoading] = useState(true);

	// Vertical infinite scroll state
	const [displayedGenreCount, setDisplayedGenreCount] = useState(3);
	const [loadingMoreGenres, setLoadingMoreGenres] = useState(false);

	// Hidden Gems
	const [hiddenGems, setHiddenGems] = useState<Movie[]>([]);

	// Popular TV Shows
	const [popularTV, setPopularTV] = useState<TVShow[]>([]);

	// Favorite Genre rows (2 pages)
	const [favGenreMoviesP1, setFavGenreMoviesP1] = useState<Movie[]>([]);
	const [favGenreMoviesP2, setFavGenreMoviesP2] = useState<Movie[]>([]);

	// Watch It Again — movies resolved from watched IDs
	const [watchedLiveMovies, setWatchedLiveMovies] = useState<Movie[]>([]);

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
				const [page1, page2] = await Promise.all([
					APIService.getMoviesByGenre(
						profile.favoriteGenreId!,
						1,
					),
					APIService.getMoviesByGenre(
						profile.favoriteGenreId!,
						2,
					),
				]);
				if (!cancelled) {
					setFavGenreMoviesP1(page1);
					setFavGenreMoviesP2(page2);
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

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [popMovies, genreList, gems, tvShows] =
					await Promise.all([
						APIService.getPopularMovies(1),
						APIService.getGenres(),
						APIService.getHiddenGems(1),
						APIService.getPopularTV(1),
					]);

				setPopular(popMovies);
				setGenres(genreList);
				setHiddenGems(gems);
				setPopularTV(tvShows);
				GenreMap.seed(genreList);

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
	}, []);

	// Observer for detecting end of page to load more genres
	const observer = useRef<IntersectionObserver | null>(null);
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
		],
	);

	const loadMoreGenres = async () => {
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
	};

	// Resolve the favorite genre name
	const favGenreName =
		profile.favoriteGenreId && genres.length > 0
			? (genres.find((g) => g.id === profile.favoriteGenreId)
					?.name ?? "Favorites")
			: null;

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

	return (
		<div className="home-container">
			{/* Hero Section */}
			{featured && (
				<section className="hero-section group">
					<div className="hero-bg-container">
						<img
							src={
								featured.backdrop_path
									? `https://image.tmdb.org/t/p/original${featured.backdrop_path}`
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
						<div className="hero-badge">
							<span className="hero-badge-dot animate-pulse"></span>
							<span className="hero-badge-text">
								AI Powered
							</span>
						</div>

						<h2 className="hero-title">
							What's the{" "}
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
								Take Mood Survey
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
								Watch Now
							</button>
						</div>
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
						title={`Your Favorite: ${favGenreName}`}
						genre={genres.find(
							(g) =>
								g.id ===
								profile.favoriteGenreId,
						)}
						initialMovies={favGenreMoviesP1}
					/>
					{favGenreMoviesP2.length > 0 && (
						<MovieRow
							title={`More ${favGenreName}`}
							genre={genres.find(
								(g) =>
									g.id ===
									profile.favoriteGenreId,
							)}
							initialMovies={
								favGenreMoviesP2
							}
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
