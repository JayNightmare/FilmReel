import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { APIService } from "../services/api";
import type { Movie } from "../services/api";
import { MovieCard } from "../components/MovieCard";
import "../styles/Category.css";

export default function SearchResults() {
    const [searchParams] = useSearchParams();

    const query = searchParams.get("q") || "";
    const with_genres = searchParams.get("with_genres") || "";
    const with_people = searchParams.get("with_people") || "";
    const primary_release_year = searchParams.get("primary_release_year") || "";
    const vote_average_gte = searchParams.get("vote_average.gte") || "";

    const hasAdvanced = Boolean(
        with_genres || with_people || primary_release_year || vote_average_gte,
    );

    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const seenIds = useRef<Set<number>>(new Set());
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    // Build filter config
    const getActiveFilters = () => {
        const filters: Record<string, string> = { sort_by: "popularity.desc" };
        if (with_genres) filters.with_genres = with_genres;
        if (with_people) filters.with_people = with_people;
        if (primary_release_year)
            filters.primary_release_year = primary_release_year;
        if (vote_average_gte) filters["vote_average.gte"] = vote_average_gte;
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
                let results: Movie[] = [];
                if (query.trim()) {
                    results = await APIService.searchMovies(query, 1);
                } else if (hasAdvanced) {
                    results = await APIService.discoverMovies(
                        getActiveFilters(),
                        1,
                    );
                }

                const unique = results.filter((m) => {
                    if (seenIds.current.has(m.id)) return false;
                    seenIds.current.add(m.id);
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
            let results: Movie[] = [];
            if (query.trim()) {
                results = await APIService.searchMovies(query, page);
            } else if (hasAdvanced) {
                results = await APIService.discoverMovies(
                    getActiveFilters(),
                    page,
                );
            }

            if (results.length === 0) {
                setHasMore(false);
            } else {
                const unique = results.filter((m) => {
                    if (seenIds.current.has(m.id)) return false;
                    seenIds.current.add(m.id);
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
                <p className="category-description">
                    {movies.length > 0
                        ? `Found ${movies.length}+ movies matching your criteria.`
                        : "No movies found. Try different filters or search terms."}
                </p>
            </div>

            {movies.length > 0 && (
                <div className="category-grid">
                    {movies.map((movie) => (
                        <MovieCard key={movie.id} movie={movie} />
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
