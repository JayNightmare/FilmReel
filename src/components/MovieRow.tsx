import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { APIService } from "../services/api";
import type { Movie, Genre } from "../services/api";
import { MovieCard } from "./MovieCard";

interface MovieRowProps {
    genre?: Genre;
    title: string;
    isTrending?: boolean;
    initialMovies: Movie[];
    staticMovies?: boolean;
    hideViewAll?: boolean;
}

/**
 * A horizontally-scrolling movie carousel that supports infinite loading.
 * Uses an IntersectionObserver on a sentinel element at the end of the row
 * to trigger loading the next page of results from the API.
 * Deduplicates movies within its own row so no card appears twice.
 */
export const MovieRow = ({
    genre,
    title,
    isTrending,
    initialMovies,
    staticMovies = false,
    hideViewAll = false,
}: MovieRowProps) => {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [page, setPage] = useState(2);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    // Track IDs already shown in THIS row to prevent duplicates within a single carousel
    const rowSeenIds = useRef<Set<number>>(new Set());

    // Sync initial movies from props & register within the row-level dedup set.
    useEffect(() => {
        if (initialMovies.length === 0) return;

        rowSeenIds.current.clear();
        const unique: Movie[] = [];
        for (const m of initialMovies) {
            if (!rowSeenIds.current.has(m.id)) {
                rowSeenIds.current.add(m.id);
                unique.push(m);
            }
        }

        setMovies(unique);
        setPage(2);
    }, [initialMovies]);

    // Attach the IntersectionObserver to the sentinel
    const attachObserver = useCallback(() => {
        if (staticMovies) return;
        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loading) {
                    loadMore();
                }
            },
            { rootMargin: "0px 400px 0px 0px" },
        );

        if (sentinelRef.current) {
            observerRef.current.observe(sentinelRef.current);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasMore, loading]);

    useEffect(() => {
        attachObserver();
        return () => observerRef.current?.disconnect();
    }, [attachObserver]);

    const loadMore = async () => {
        if (loading || !hasMore) return;
        setLoading(true);

        try {
            let fetched: Movie[] = [];
            if (isTrending) {
                fetched = await APIService.getPopularMovies(page);
            } else if (genre) {
                fetched = await APIService.getMoviesByGenre(genre.id, page);
            }

            if (fetched.length === 0) {
                setHasMore(false);
            } else {
                const unique = fetched.filter((m) => {
                    if (rowSeenIds.current.has(m.id)) return false;
                    rowSeenIds.current.add(m.id);
                    return true;
                });

                setMovies((prev) => [...prev, ...unique]);
                setPage((prev) => prev + 1);
            }
        } catch (err) {
            console.error("MovieRow pagination error:", err);
        } finally {
            setLoading(false);
        }
    };

    if (movies.length === 0 && !loading) return null;

    return (
        <section className="category-section animate-fade-in-up">
            <div className="category-header">
                <h3 className="category-title">{title}</h3>
                {!hideViewAll && (
                    <Link
                        to={
                            isTrending
                                ? "/category/popular"
                                : `/category/${genre?.id}`
                        }
                        className="category-link"
                    >
                        View All
                    </Link>
                )}
            </div>

            <div className="carousel-container">
                {movies.map((movie) => (
                    <MovieCard key={movie.id} movie={movie} />
                ))}

                {/* Sentinel: sits at the end of the row and triggers the next page load */}
                <div
                    ref={sentinelRef}
                    style={{ minWidth: "1px", minHeight: "1px", flexShrink: 0 }}
                    aria-hidden="true"
                />

                {loading && (
                    <div
                        style={{
                            padding: "24px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <span
                            className="material-symbols-outlined animate-pulse"
                            style={{
                                color: "var(--text-secondary)",
                                fontSize: "24px",
                            }}
                        >
                            autorenew
                        </span>
                    </div>
                )}
            </div>
        </section>
    );
};
