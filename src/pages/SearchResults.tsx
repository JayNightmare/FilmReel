import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
	APIService,
	type Movie,
	type TVShow,
	type Genre,
} from "../services/api";
import { MovieCard } from "../components/MovieCard";
import "../styles/Category.css";

type SearchResultItem = (Movie | TVShow) & { media_type: "movie" | "tv" };
type SearchCategory = "movie_tv" | "actor" | "mood" | "genre" | "year";

const CATEGORY_OPTIONS: { id: SearchCategory; label: string }[] = [
	{ id: "movie_tv", label: "Movie/TV Show" },
	{ id: "actor", label: "Actor" },
	{ id: "mood", label: "Mood" },
	{ id: "genre", label: "Genre" },
	{ id: "year", label: "Release Year" },
];

const MOOD_GENRE_MAP: Record<string, number[]> = {
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

const MOOD_KEYWORDS = Object.keys(MOOD_GENRE_MAP);

const formatMoodTag = (value: string) =>
	value
		.split(/\s+|-/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");

const extractYear = (value: string): string => {
	const trimmed = value.trim();
	if (/^(19|20)\d{2}$/.test(trimmed)) return trimmed;
	const match = trimmed.match(/(19|20)\d{2}/);
	return match?.[0] || "";
};

const parseGenreIds = (value: string): number[] =>
	value
		.split(",")
		.map((id) => Number(id.trim()))
		.filter((id) => Number.isFinite(id) && id > 0);

export default function SearchResults() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();

	const query = searchParams.get("q") || "";
	const searchCategoryParam = searchParams.get("searchCategory") || "";
	const withGenresParam = searchParams.get("with_genres") || "";
	const withPeopleParam =
		searchParams.get("with_people") ||
		searchParams.get("actor") ||
		"";
	const moodParam = searchParams.get("mood") || "";
	const actorNameParam = searchParams.get("actor_name") || "";
	const releaseYearParam = searchParams.get("primary_release_year") || "";
	const minScoreParam = searchParams.get("vote_average.gte") || "";

	const [allGenres, setAllGenres] = useState<Genre[]>([]);
	const [movies, setMovies] = useState<SearchResultItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [loadingMore, setLoadingMore] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	const [resolvedActorName, setResolvedActorName] =
		useState(actorNameParam);

	const seenIds = useRef<Set<string>>(new Set());
	const actorResultsRef = useRef<SearchResultItem[]>([]);
	const sentinelRef = useRef<HTMLDivElement | null>(null);
	const observerRef = useRef<IntersectionObserver | null>(null);

	const activeCategory: SearchCategory = useMemo(() => {
		if (
			searchCategoryParam === "movie_tv" ||
			searchCategoryParam === "actor" ||
			searchCategoryParam === "mood" ||
			searchCategoryParam === "genre" ||
			searchCategoryParam === "year"
		) {
			return searchCategoryParam;
		}
		if (withPeopleParam && !query.trim()) return "actor";
		if (releaseYearParam) return "year";
		if (moodParam) return "mood";
		if (withGenresParam) return "genre";
		return "movie_tv";
	}, [
		searchCategoryParam,
		withPeopleParam,
		query,
		releaseYearParam,
		moodParam,
		withGenresParam,
	]);

	const actorPageSize = 24;
	const paginateResults = (
		items: SearchResultItem[],
		pageNumber: number,
	) => {
		const start = (pageNumber - 1) * actorPageSize;
		return items.slice(start, start + actorPageSize);
	};

	const resolveGenreOnlyIds = useCallback(
		(searchText: string): number[] => {
			const normalized = searchText.trim().toLowerCase();
			if (!normalized || allGenres.length === 0) return [];
			const tokens = normalized.split(/\s+/).filter(Boolean);

			return allGenres
				.filter((genre) => {
					const name = genre.name.toLowerCase();
					return (
						normalized === name ||
						(normalized.length >= 3 &&
							name.includes(
								normalized,
							)) ||
						tokens.some(
							(token) =>
								token === name,
						)
					);
				})
				.map((genre) => genre.id);
		},
		[allGenres],
	);

	const resolveMoodGenreIds = useCallback(
		(searchText: string): number[] => {
			const normalized = searchText.trim().toLowerCase();
			if (!normalized) return [];

			const genreIds = new Set<number>();
			for (const [keyword, ids] of Object.entries(
				MOOD_GENRE_MAP,
			)) {
				if (normalized.includes(keyword)) {
					ids.forEach((id) => genreIds.add(id));
				}
			}
			resolveGenreOnlyIds(searchText).forEach((id) =>
				genreIds.add(id),
			);
			return Array.from(genreIds);
		},
		[resolveGenreOnlyIds],
	);

	const derivedGenreIds = useMemo(() => {
		if (activeCategory === "mood") {
			const ids = resolveMoodGenreIds(query);
			return ids.length > 0
				? ids
				: parseGenreIds(withGenresParam);
		}
		if (activeCategory === "genre") {
			const ids = resolveGenreOnlyIds(query);
			return ids.length > 0
				? ids
				: parseGenreIds(withGenresParam);
		}
		if (activeCategory === "movie_tv") {
			return parseGenreIds(withGenresParam);
		}
		return [];
	}, [
		activeCategory,
		query,
		withGenresParam,
		resolveMoodGenreIds,
		resolveGenreOnlyIds,
	]);

	const derivedYear = useMemo(() => {
		if (activeCategory === "year") {
			return releaseYearParam || extractYear(query);
		}
		return releaseYearParam;
	}, [activeCategory, releaseYearParam, query]);

	const moodMatches = useMemo(() => {
		if (activeCategory !== "mood") return [];
		if (moodParam.trim()) {
			return moodParam
				.split(",")
				.map((mood) => mood.trim())
				.filter(Boolean);
		}
		const normalized = query.trim().toLowerCase();
		if (!normalized) return [];
		return MOOD_KEYWORDS.filter((keyword) =>
			normalized.includes(keyword),
		);
	}, [activeCategory, moodParam, query]);

	const hasDiscoverFilters =
		derivedGenreIds.length > 0 ||
		Boolean(derivedYear || minScoreParam || withPeopleParam);

	const hasSearchCriteria = useMemo(() => {
		if (activeCategory === "actor") {
			return Boolean(query.trim() || withPeopleParam);
		}
		if (activeCategory === "movie_tv") {
			return Boolean(query.trim() || hasDiscoverFilters);
		}
		if (activeCategory === "year") {
			return Boolean(derivedYear);
		}
		if (activeCategory === "mood" || activeCategory === "genre") {
			return Boolean(
				derivedGenreIds.length > 0 || query.trim(),
			);
		}
		return Boolean(query.trim());
	}, [
		activeCategory,
		query,
		withPeopleParam,
		hasDiscoverFilters,
		derivedYear,
		derivedGenreIds,
	]);

	const getMovieFilters = useCallback(() => {
		const filters: Record<string, string> = {
			sort_by: "popularity.desc",
		};
		if (derivedGenreIds.length > 0) {
			filters.with_genres = derivedGenreIds.join(",");
		}
		if (activeCategory === "movie_tv" && withPeopleParam) {
			filters.with_people = withPeopleParam;
		}
		if (derivedYear) {
			filters.primary_release_year = derivedYear;
		}
		if (minScoreParam) {
			filters["vote_average.gte"] = minScoreParam;
		}
		return filters;
	}, [
		derivedGenreIds,
		activeCategory,
		withPeopleParam,
		derivedYear,
		minScoreParam,
	]);

	const getTVFilters = useCallback(() => {
		const filters: Record<string, string> = {
			sort_by: "popularity.desc",
		};
		if (derivedGenreIds.length > 0) {
			filters.with_genres = derivedGenreIds.join(",");
		}
		if (activeCategory === "movie_tv" && withPeopleParam) {
			filters.with_people = withPeopleParam;
		}
		if (derivedYear) {
			filters.first_air_date_year = derivedYear;
		}
		if (minScoreParam) {
			filters["vote_average.gte"] = minScoreParam;
		}
		return filters;
	}, [
		derivedGenreIds,
		activeCategory,
		withPeopleParam,
		derivedYear,
		minScoreParam,
	]);

	const handleCategorySelect = (category: SearchCategory) => {
		const params = new URLSearchParams();
		params.set("searchCategory", category);
		if (query.trim()) {
			params.set("q", query.trim());
		}

		if (category === "mood") {
			const moodIds = resolveMoodGenreIds(query);
			if (moodIds.length > 0) {
				params.set("with_genres", moodIds.join(","));
			}
			const matchedMoods = MOOD_KEYWORDS.filter((keyword) =>
				query.toLowerCase().includes(keyword),
			);
			if (matchedMoods.length > 0) {
				params.set("mood", matchedMoods.join(","));
			}
		}

		if (category === "genre") {
			const genreIds = resolveGenreOnlyIds(query);
			if (genreIds.length > 0) {
				params.set("with_genres", genreIds.join(","));
			}
		}

		if (category === "year") {
			const year = extractYear(query);
			if (year) {
				params.set("primary_release_year", year);
			}
		}

		navigate(`/search?${params.toString()}`);
	};

	useEffect(() => {
		Promise.all([APIService.getGenres(), APIService.getTVGenres()])
			.then(([movieGenres, tvGenres]) => {
				const byId = new Map<number, Genre>();
				movieGenres.forEach((genre) =>
					byId.set(genre.id, genre),
				);
				tvGenres.forEach((genre) => {
					if (!byId.has(genre.id))
						byId.set(genre.id, genre);
				});
				setAllGenres(Array.from(byId.values()));
			})
			.catch(console.error);
	}, []);

	useEffect(() => {
		setResolvedActorName(actorNameParam);
	}, [actorNameParam]);

	useEffect(() => {
		const fetchResults = async () => {
			if (!hasSearchCriteria) {
				setMovies([]);
				setLoading(false);
				setHasMore(false);
				return;
			}

			setLoading(true);
			seenIds.current.clear();
			setPage(1);
			setHasMore(true);

			try {
				let results: SearchResultItem[] = [];

				if (activeCategory === "actor") {
					let personId = Number(withPeopleParam);
					let actorDisplayName = actorNameParam;

					if (!personId && query.trim()) {
						const people =
							await APIService.searchPerson(
								query,
							);
						const best = people[0];
						if (best) {
							personId = best.id;
							actorDisplayName =
								best.name;
						}
					}

					if (!personId) {
						setMovies([]);
						setHasMore(false);
						return;
					}

					setResolvedActorName(actorDisplayName);
					const [movieCredits, tvCredits] =
						await Promise.all([
							APIService.getMovieCreditsByPerson(
								personId,
							),
							APIService.getTVCreditsByPerson(
								personId,
							),
						]);

					const wrappedMovies = movieCredits.map(
						(movie) => ({
							...movie,
							media_type: "movie" as const,
						}),
					);
					const wrappedTV = tvCredits.map(
						(show) => ({
							...show,
							media_type: "tv" as const,
						}),
					);
					results = [
						...wrappedMovies,
						...wrappedTV,
					].sort(
						(a, b) =>
							(b.vote_average || 0) -
							(a.vote_average || 0),
					);
				} else if (
					activeCategory === "movie_tv" &&
					query.trim()
				) {
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
						(movie) => ({
							...movie,
							media_type: "movie" as const,
						}),
					);
					const wrappedTV = tvRes.map((show) => ({
						...show,
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
				} else {
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
						(movie) => ({
							...movie,
							media_type: "movie" as const,
						}),
					);
					const wrappedTV = tvRes.map((show) => ({
						...show,
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

				const unique = results.filter((item) => {
					const uniqueId = `${item.media_type}-${item.id}`;
					if (seenIds.current.has(uniqueId))
						return false;
					seenIds.current.add(uniqueId);
					return true;
				});

				if (activeCategory === "actor") {
					actorResultsRef.current = unique;
					const firstPage = paginateResults(
						unique,
						1,
					);
					setMovies(firstPage);
					setHasMore(
						unique.length > actorPageSize,
					);
					setPage(2);
				} else {
					actorResultsRef.current = [];
					setMovies(unique);
					setPage(2);
					setHasMore(results.length > 0);
				}
			} catch (error) {
				console.error("Search failed:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchResults();
	}, [
		activeCategory,
		query,
		withPeopleParam,
		actorNameParam,
		hasSearchCriteria,
		derivedGenreIds,
		derivedYear,
		moodParam,
		minScoreParam,
		getMovieFilters,
		getTVFilters,
	]);

	const loadMore = useCallback(async () => {
		if (loadingMore || !hasMore) return;
		setLoadingMore(true);

		try {
			if (activeCategory === "actor") {
				const nextPageItems = paginateResults(
					actorResultsRef.current,
					page,
				);
				if (nextPageItems.length === 0) {
					setHasMore(false);
				} else {
					setMovies((prev) => [
						...prev,
						...nextPageItems,
					]);
					setPage((prev) => prev + 1);
				}
				return;
			}

			let results: SearchResultItem[] = [];
			if (activeCategory === "movie_tv" && query.trim()) {
				const [movieRes, tvRes] = await Promise.all([
					APIService.searchMovies(query, page),
					APIService.searchTV(query, page),
				]);
				const wrappedMovies = movieRes.map((movie) => ({
					...movie,
					media_type: "movie" as const,
				}));
				const wrappedTV = tvRes.map((show) => ({
					...show,
					media_type: "tv" as const,
				}));
				results = [...wrappedMovies, ...wrappedTV].sort(
					(a, b) =>
						(b.vote_average || 0) -
						(a.vote_average || 0),
				);
			} else {
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
				const wrappedMovies = movieRes.map((movie) => ({
					...movie,
					media_type: "movie" as const,
				}));
				const wrappedTV = tvRes.map((show) => ({
					...show,
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
				return;
			}

			const unique = results.filter((item) => {
				const uniqueId = `${item.media_type}-${item.id}`;
				if (seenIds.current.has(uniqueId)) return false;
				seenIds.current.add(uniqueId);
				return true;
			});

			if (unique.length === 0) {
				setHasMore(false);
			} else {
				setMovies((prev) => [...prev, ...unique]);
				setPage((prev) => prev + 1);
			}
		} catch (error) {
			console.error("Search pagination error:", error);
		} finally {
			setLoadingMore(false);
		}
	}, [
		activeCategory,
		query,
		page,
		loadingMore,
		hasMore,
		getMovieFilters,
		getTVFilters,
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
		if (sentinelRef.current) {
			observerRef.current.observe(sentinelRef.current);
		}
	}, [hasMore, loadingMore, loading, loadMore]);

	useEffect(() => {
		attachObserver();
		return () => observerRef.current?.disconnect();
	}, [attachObserver]);

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

	const categoryLabel =
		CATEGORY_OPTIONS.find(
			(category) => category.id === activeCategory,
		)?.label || "Search";

	return (
		<div className="category-page animate-in fade-in">
			<div className="category-header">
				<h1 className="category-title">
					{activeCategory === "actor"
						? `Results for Actor "${resolvedActorName || query}"`
						: query
							? `Results for "${query}"`
							: `${categoryLabel} Results`}
				</h1>

				<div className="search-category-list">
					{CATEGORY_OPTIONS.map((category) => (
						<button
							key={category.id}
							type="button"
							className={`search-category-chip ${activeCategory === category.id ? "active" : ""}`}
							onClick={() =>
								handleCategorySelect(
									category.id,
								)
							}
						>
							{category.label}
						</button>
					))}
				</div>

				<div className="search-tags">
					<span className="search-tag">
						Category: {categoryLabel}
					</span>
					{moodMatches.map((mood) => (
						<span
							key={`mood-${mood}`}
							className="search-tag"
						>
							Mood:{" "}
							{formatMoodTag(mood)}
						</span>
					))}
					{activeCategory === "actor" &&
						resolvedActorName && (
							<span className="search-tag">
								Actor:{" "}
								{
									resolvedActorName
								}
							</span>
						)}
					{activeCategory === "year" &&
						derivedYear && (
							<span className="search-tag">
								Release Year:{" "}
								{derivedYear}
							</span>
						)}
				</div>

				<p className="category-description">
					{movies.length > 0
						? `Found ${movies.length}+ titles matching your ${categoryLabel.toLowerCase()} search.`
						: "No results found. Try another category or adjust your search term."}
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
