import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { APIService } from "../services/api";
import type { Movie } from "../services/api";
import { MovieCard } from "../components/MovieCard";
import "../styles/Category.css";

export default function SearchResults() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get("q") || "";
    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const seenIds = useRef<Set<number>>(new Set());
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
        const search = async () => {
            if (!query.trim()) {
                setMovies([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            seenIds.current.clear();
            setPage(1);
            setHasMore(true);

            try {
                const results = await APIService.searchMovies(query, 1);
                const unique = results.filter((m) => {
                    if (seenIds.current.has(m.id)) return false;
                    seenIds.current.add(m.id);
                    return true;
                });
                setMovies(unique);
                setPage(2);
            } catch (err) {
                console.error("Search failed:", err);
            } finally {
                setLoading(false);
            }
        };

        search();
    }, [query]);

    const attachObserver = useCallback(() => {
        if (observerRef.current) observerRef.current.disconnect();
        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loadingMore) {
                    loadMore();
                }
            },
            { rootMargin: "0px 0px 600px 0px" },
        );
        if (sentinelRef.current)
            observerRef.current.observe(sentinelRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasMore, loadingMore]);

    useEffect(() => {
        if (!loading) attachObserver();
        return () => observerRef.current?.disconnect();
    }, [attachObserver, loading]);

    const loadMore = async () => {
        if (loadingMore || !hasMore || !query.trim()) return;
        setLoadingMore(true);
        try {
            const results = await APIService.searchMovies(query, page);
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
                    {query ? `Results for "${query}"` : "Search"}
                </h1>
                <p className="category-description">
                    {movies.length > 0
                        ? `Found ${movies.length}+ movies matching your search.`
                        : query
                          ? "No movies found. Try a different search term."
                          : "Use the search bar above to find movies."}
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
