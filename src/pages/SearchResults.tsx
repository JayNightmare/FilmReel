import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { APIService, type Movie, type TVShow } from "../services/api";
import { MovieCard } from "../components/MovieCard";
import "../styles/Category.css";

type SearchResultItem = (Movie | TVShow) & { media_type: "movie" | "tv" };

export default function SearchResults() {
	const [searchParams] = useSearchParams();

	const query = searchParams.get("q") || "";
	const with_genres = searchParams.get("with_genres") || "";
	const with_people =
		searchParams.get("with_people") ||
		searchParams.get("actor") ||
		"";
	const moodParam = searchParams.get("mood") || "";
	const actorName = searchParams.get("actor_name") || "";
	const primary_release_year =
		searchParams.get("primary_release_year") || "";
	const vote_average_gte = searchParams.get("vote_average.gte") || "";

	const hasAdvanced = Boolean(
		with_genres ||
		with_people ||
		primary_release_year ||
		vote_average_gte,
	);

	const [movies, setMovies] = useState<SearchResultItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [loadingMore, setLoadingMore] = useState(false);
	const [hasMore, setHasMore] = useState(true);

	const seenIds = useRef<Set<string>>(new Set());
	const sentinelRef = useRef<HTMLDivElement | null>(null);
	const observerRef = useRef<IntersectionObserver | null>(null);

	const moodKeywords = [
		"energetic",
		"chill",
		"adventurous",
		"melancholic",
		"laughter",
		"tears",
		"adrenaline",
		"fear",
		"dark",
		"light",
		"gritty",
		"twist",
		"happy",
		"ambiguous",
	];

	const formatMoodTag = (value: string) =>
		value
			.split(/\s+|-/)
			.filter(Boolean)
			.map(
				(part) =>
					part.charAt(0).toUpperCase() +
					part.slice(1),
			)
			.join(" ");

	const moodMatches = (() => {
		if (moodParam.trim()) {
			return moodParam
				.split(",")
				.map((m) => m.trim())
				.filter(Boolean);
		}
		const normalized = query.trim().toLowerCase();
		if (!normalized) return [];
		return moodKeywords.filter((keyword) =>
			normalized.includes(keyword),
		);
	})();

	// Build filter config
	const getMovieFilters = () => {
		const filters: Record<string, string> = {
			sort_by: "popularity.desc",
		};
		if (with_genres) filters.with_genres = with_genres;
		if (with_people) filters.with_people = with_people;
		if (primary_release_year)
			filters.primary_release_year = primary_release_year;
		if (vote_average_gte)
			filters["vote_average.gte"] = vote_average_gte;
		return filters;
	};

	const getTVFilters = () => {
		const filters: Record<string, string> = {
			sort_by: "popularity.desc",
		};
		if (with_genres) filters.with_genres = with_genres;
		if (primary_release_year)
			filters.first_air_date_year = primary_release_year;
		if (vote_average_gte)
			filters["vote_average.gte"] = vote_average_gte;
		return filters;
	};

	useEffect(() => {
		const fetchResults = async () => {
			if (!query.trim() && !hasAdvanced) {
				setMovies([]);
				setLoading(false);
				return;
			}

			setLoading(true);
			seenIds.current.clear();
			setPage(1);
			setHasMore(true);

			try {
				let results: SearchResultItem[] = [];
				if (query.trim()) {
					const [movieRes, tvRes] =
						await Promise.all([
							APIService.searchMovies(
								query,
								1,
							),
							APIService.searchTV(
								query,
								1,
							),
						]);
					const wrappedMovies = movieRes.map(
						(m) => ({
							...m,
							media_type: "movie" as const,
						}),
					);
					const wrappedTV = tvRes.map((t) => ({
						...t,
						media_type: "tv" as const,
					}));
					results = [
						...wrappedMovies,
						...wrappedTV,
					].sort(
						(a, b) =>
							(b.vote_average || 0) -
							(a.vote_average || 0),
					);
				} else if (hasAdvanced) {
					const [movieRes, tvRes] =
						await Promise.all([
							APIService.discoverMovies(
								getMovieFilters(),
								1,
							),
							APIService.discoverTV(
								getTVFilters(),
								1,
							),
						]);
					const wrappedMovies = movieRes.map(
						(m) => ({
							...m,
							media_type: "movie" as const,
						}),
					);
					const wrappedTV = tvRes.map((t) => ({
						...t,
						media_type: "tv" as const,
					}));
					results = [
						...wrappedMovies,
						...wrappedTV,
					].sort(
						(a, b) =>
							(b.vote_average || 0) -
							(a.vote_average || 0),
					);
				}

				const unique = results.filter((m) => {
					const uniqueId = `${m.media_type}-${m.id}`;
					if (seenIds.current.has(uniqueId))
						return false;
					seenIds.current.add(uniqueId);
					return true;
				});

				setMovies(unique);
				setPage(2);
				if (results.length === 0) setHasMore(false);
			} catch (err) {
				console.error("Search failed:", err);
			} finally {
				setLoading(false);
			}
		};

		fetchResults();
	}, [
		query,
		hasAdvanced,
		with_genres,
		with_people,
		primary_release_year,
		vote_average_gte,
	]);

	const attachObserver = useCallback(() => {
		if (observerRef.current) observerRef.current.disconnect();
		observerRef.current = new IntersectionObserver(
			(entries) => {
				if (
					entries[0].isIntersecting &&
					hasMore &&
					!loadingMore &&
					!loading
				) {
					loadMore();
				}
			},
			{ rootMargin: "0px 0px 600px 0px" },
		);
		if (sentinelRef.current)
			observerRef.current.observe(sentinelRef.current);
	}, [hasMore, loadingMore, loading]);

	useEffect(() => {
		attachObserver();
		return () => observerRef.current?.disconnect();
	}, [attachObserver]);

	const loadMore = async () => {
		if (loadingMore || !hasMore) return;
		setLoadingMore(true);
		try {
			let results: SearchResultItem[] = [];
			if (query.trim()) {
				const [movieRes, tvRes] = await Promise.all([
					APIService.searchMovies(query, page),
					APIService.searchTV(query, page),
				]);
				const wrappedMovies = movieRes.map((m) => ({
					...m,
					media_type: "movie" as const,
				}));
				const wrappedTV = tvRes.map((t) => ({
					...t,
					media_type: "tv" as const,
				}));
				results = [...wrappedMovies, ...wrappedTV].sort(
					(a, b) =>
						(b.vote_average || 0) -
						(a.vote_average || 0),
				);
			} else if (hasAdvanced) {
				const [movieRes, tvRes] = await Promise.all([
					APIService.discoverMovies(
						getMovieFilters(),
						page,
					),
					APIService.discoverTV(
						getTVFilters(),
						page,
					),
				]);
				const wrappedMovies = movieRes.map((m) => ({
					...m,
					media_type: "movie" as const,
				}));
				const wrappedTV = tvRes.map((t) => ({
					...t,
					media_type: "tv" as const,
				}));
				results = [...wrappedMovies, ...wrappedTV].sort(
					(a, b) =>
						(b.vote_average || 0) -
						(a.vote_average || 0),
				);
			}

			if (results.length === 0) {
				setHasMore(false);
			} else {
				const unique = results.filter((m) => {
					const uniqueId = `${m.media_type}-${m.id}`;
					if (seenIds.current.has(uniqueId))
						return false;
					seenIds.current.add(uniqueId);
					return true;
				});
				setMovies((prev) => [...prev, ...unique]);
				setPage((prev) => prev + 1);
			}
		} catch (err) {
			console.error("Search pagination error:", err);
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
				<h1 className="category-title">
					{query
						? `Results for "${query}"`
						: hasAdvanced
							? "Advanced Search Results"
							: "Search"}
				</h1>
				{(moodMatches.length > 0 || actorName) && (
					<div className="search-tags">
						{moodMatches.map((mood) => (
							<span
								key={`mood-${mood}`}
								className="search-tag"
							>
								Mood:{" "}
								{formatMoodTag(
									mood,
								)}
							</span>
						))}
						{actorName && (
							<span className="search-tag">
								Cast:{" "}
								{actorName}
							</span>
						)}
					</div>
				)}
				<p className="category-description">
					{movies.length > 0
						? `Found ${movies.length}+ titles matching your criteria.`
						: "No results found. Try different filters or search terms."}
				</p>
			</div>

			{movies.length > 0 && (
				<div className="category-grid">
					{movies.map((movie) => (
						<MovieCard
							key={`${movie.media_type}-${movie.id}`}
							movie={movie}
							mediaType={
								movie.media_type
							}
						/>
					))}
				</div>
			)}

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
