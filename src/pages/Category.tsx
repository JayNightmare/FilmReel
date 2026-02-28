import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { APIService } from "../services/api";
import type { Movie, TVShow } from "../services/api";
import { MovieCard } from "../components/MovieCard";
import "../styles/Category.css";

type CategoryItem = (Movie | TVShow) & { _mediaType?: "movie" | "tv" };

export default function Category() {
	const { id } = useParams<{ id: string }>();
	const [movies, setMovies] = useState<CategoryItem[]>([]);
	const [title, setTitle] = useState("Movies");
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [loadingMore, setLoadingMore] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	const seenIds = useRef<Set<string>>(new Set());
	const sentinelRef = useRef<HTMLDivElement | null>(null);
	const observerRef = useRef<IntersectionObserver | null>(null);

	const getItemKey = useCallback((item: CategoryItem) => {
		const mediaType = item._mediaType ?? "movie";
		return `${mediaType}-${item.id}`;
	}, []);

	const fetchAnimePage = useCallback(
		async (pageNumber: number): Promise<CategoryItem[]> => {
			const [animeMovies, animeShows] = await Promise.all([
				APIService.discoverMovies(
					{
						with_genres: "16",
						with_original_language: "ja",
						sort_by: "popularity.desc",
					},
					pageNumber,
				),
				APIService.discoverTV(
					{
						with_genres: "16",
						with_original_language: "ja",
						sort_by: "popularity.desc",
					},
					pageNumber,
				),
			]);

			return [
				...animeMovies.map((movie) => ({
					...movie,
					_mediaType: "movie" as const,
				})),
				...animeShows.map((show) => ({
					...show,
					_mediaType: "tv" as const,
				})),
			].sort(
				(a, b) =>
					(b.vote_average || 0) -
					(a.vote_average || 0),
			);
		},
		[],
	);

	// Resolve the category title on first load
	useEffect(() => {
		const fetchInitial = async () => {
			if (!id) return;
			try {
				setLoading(true);
				seenIds.current.clear();
				setPage(1);
				setHasMore(true);

				let fetched: CategoryItem[] = [];

				if (id === "popular") {
					setTitle("Trending Now");
					fetched =
						await APIService.getPopularMovies(
							1,
						);
				} else if (id === "top_rated") {
					setTitle("Top Rated");
					fetched =
						await APIService.getPopularMovies(
							1,
						);
					fetched = fetched.sort(
						() => 0.5 - Math.random(),
					);
				} else if (id === "anime") {
					setTitle("Anime");
					fetched = await fetchAnimePage(1);
				} else {
					const genreId = parseInt(id, 10);
					if (!isNaN(genreId)) {
						const allGenres =
							await APIService.getGenres();
						const genre = allGenres.find(
							(g) => g.id === genreId,
						);
						setTitle(
							genre
								? `${genre.name} Hits`
								: "Genre Movies",
						);
						fetched =
							await APIService.getMoviesByGenre(
								genreId,
								1,
							);
					}
				}

				// Deduplicate first page
				const unique = fetched.filter((m) => {
					const key = getItemKey(m);
					if (seenIds.current.has(key))
						return false;
					seenIds.current.add(key);
					return true;
				});

				setMovies(unique);
				setPage(2);
			} catch (e) {
				console.error("Failed to load category.", e);
			} finally {
				setLoading(false);
			}
		};

		fetchInitial();
	}, [id, fetchAnimePage, getItemKey]);

	// Infinite scroll observer
	const attachObserver = useCallback(() => {
		if (observerRef.current) observerRef.current.disconnect();

		observerRef.current = new IntersectionObserver(
			(entries) => {
				if (
					entries[0].isIntersecting &&
					hasMore &&
					!loadingMore
				) {
					loadMore();
				}
			},
			{ rootMargin: "0px 0px 600px 0px" },
		);

		if (sentinelRef.current) {
			observerRef.current.observe(sentinelRef.current);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [hasMore, loadingMore]);

	useEffect(() => {
		if (!loading) attachObserver();
		return () => observerRef.current?.disconnect();
	}, [attachObserver, loading]);

	const loadMore = async () => {
		if (loadingMore || !hasMore || !id) return;
		setLoadingMore(true);

		try {
			let fetched: CategoryItem[] = [];

			if (id === "popular" || id === "top_rated") {
				fetched =
					await APIService.getPopularMovies(page);
			} else if (id === "anime") {
				fetched = await fetchAnimePage(page);
			} else {
				const genreId = parseInt(id, 10);
				if (!isNaN(genreId)) {
					fetched =
						await APIService.getMoviesByGenre(
							genreId,
							page,
						);
				}
			}

			if (fetched.length === 0) {
				setHasMore(false);
			} else {
				const unique = fetched.filter((m) => {
					const key = getItemKey(m);
					if (seenIds.current.has(key))
						return false;
					seenIds.current.add(key);
					return true;
				});

				setMovies((prev) => [...prev, ...unique]);
				setPage((prev) => prev + 1);
			}
		} catch (err) {
			console.error("Category pagination error:", err);
		} finally {
			setLoadingMore(false);
		}
	};

	if (loading) {
		return (
			<div className="category-loading">
				<div
					className="glass-panel"
					style={{
						padding: "24px",
						borderRadius: "50%",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<span className="material-symbols-outlined animate-pulse category-loading-icon">
						autorenew
					</span>
				</div>
			</div>
		);
	}

	return (
		<div className="category-page animate-in fade-in">
			<div className="category-header">
				<h1 className="category-title">{title}</h1>
				<p className="category-description">
					Explore our curated collection of{" "}
					{title.toLowerCase()}. Find your next
					favorite film and dive into the
					cinematic experience.
				</p>
			</div>

			{movies.length === 0 && !loadingMore ? (
				<div className="category-empty">
					No movies found in this category. Let's
					head back home!
				</div>
			) : (
				<div className="category-grid">
					{movies.map((movie) => (
						<MovieCard
							key={getItemKey(movie)}
							movie={movie}
							mediaType={
								movie._mediaType ||
								"movie"
							}
						/>
					))}
				</div>
			)}

			{/* Sentinel for infinite scroll */}
			<div
				ref={sentinelRef}
				style={{ minHeight: "1px", width: "100%" }}
				aria-hidden="true"
			/>

			{loadingMore && (
				<div
					style={{
						display: "flex",
						justifyContent: "center",
						padding: "32px 0",
					}}
				>
					<span
						className="material-symbols-outlined animate-pulse"
						style={{
							fontSize: "32px",
							color: "var(--accent-purple)",
						}}
					>
						autorenew
					</span>
				</div>
			)}
		</div>
	);
}
