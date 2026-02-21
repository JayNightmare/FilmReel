import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { APIService } from "../services/api";
import type { Movie, Genre } from "../services/api";
import { MovieRow } from "../components/MovieRow";
import { GenreMap } from "../services/genreMap";
import "../styles/Home.css";

export default function Home() {
    const [popular, setPopular] = useState<Movie[]>([]);
    const [genres, setGenres] = useState<Genre[]>([]);
    const [genreMovies, setGenreMovies] = useState<Record<number, Movie[]>>({});
    const [loading, setLoading] = useState(true);

    // Vertical infinite scroll state
    const [displayedGenreCount, setDisplayedGenreCount] = useState(3);
    const [loadingMoreGenres, setLoadingMoreGenres] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [popMovies, genreList] = await Promise.all([
                    APIService.getPopularMovies(1),
                    APIService.getGenres(),
                ]);

                setPopular(popMovies);
                setGenres(genreList);
                GenreMap.seed(genreList);

                // Fetch movies for the first 3 genres
                const top3 = genreList.slice(0, 3);
                const moviesForGenres = await Promise.all(
                    top3.map((g) => APIService.getMoviesByGenre(g.id, 1)),
                );

                const newGenreMovies: Record<number, Movie[]> = {};
                top3.forEach((g, idx) => {
                    newGenreMovies[g.id] = moviesForGenres[idx];
                });
                setGenreMovies(newGenreMovies);
            } catch (e) {
                console.error("Failed to load dashboard data.", e);
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
                        displayedGenreCount < genres.length
                    ) {
                        loadMoreGenres();
                    }
                },
                { rootMargin: "0px 0px 400px 0px" },
            );

            if (node) observer.current.observe(node);
        },
        [loading, loadingMoreGenres, displayedGenreCount, genres.length],
    );

    const loadMoreGenres = async () => {
        if (loadingMoreGenres || displayedGenreCount >= genres.length) return;
        setLoadingMoreGenres(true);

        try {
            const nextCount = Math.min(displayedGenreCount + 2, genres.length);
            const nextGenres = genres.slice(displayedGenreCount, nextCount);

            const moviesForNextGenres = await Promise.all(
                nextGenres.map((g) => APIService.getMoviesByGenre(g.id, 1)),
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

    if (loading) {
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    flex: 1,
                    minHeight: "50vh",
                }}
            >
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
                    <span
                        className="material-symbols-outlined animate-pulse"
                        style={{
                            fontSize: "40px",
                            color: "var(--accent-purple)",
                        }}
                    >
                        autorenew
                    </span>
                </div>
            </div>
        );
    }

    const featured = popular[0];

    return (
        <div className="home-container">
            {/* Hero Section */}
            {featured && (
                <section className="hero-section group">
                    {/* Hero Background Image */}
                    <div className="hero-bg-container">
                        <img
                            src={
                                featured.backdrop_path
                                    ? `https://image.tmdb.org/t/p/original${featured.backdrop_path}`
                                    : `https://image.tmdb.org/t/p/original${featured.poster_path || ""}`
                            }
                            onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                    "https://via.placeholder.com/1400x800/1a1122/7f13ec";
                            }}
                            alt={featured.title}
                            className="hero-bg-image group-hover-scale-110"
                        />
                        <div className="hero-overlay-bottom" />
                        <div className="hero-overlay-side" />
                    </div>

                    {/* Hero Content */}
                    <div className="hero-content animate-fade-in-up">
                        <div className="hero-badge">
                            <span className="hero-badge-dot animate-pulse"></span>
                            <span className="hero-badge-text">AI Powered</span>
                        </div>

                        <h2 className="hero-title">
                            What's the{" "}
                            <span className="text-gradient">vibe</span> tonight?
                        </h2>

                        <p
                            className="hero-description truncate"
                            style={{
                                WebkitLineClamp: 3,
                                display: "-webkit-box",
                                WebkitBoxOrient: "vertical",
                                whiteSpace: "normal",
                            }}
                        >
                            {featured.overview ||
                                "Stop scrolling, start watching. Let our AI curate a personalized playlist based on exactly how you're feeling right now."}
                        </p>

                        <div className="hero-buttons">
                            <button
                                onClick={() => navigate("/mood")}
                                className="btn-primary hero-button hero-button-primary"
                            >
                                <span className="material-symbols-outlined">
                                    auto_awesome
                                </span>
                                Take Mood Survey
                            </button>
                            <button
                                onClick={() =>
                                    navigate(`/movie/${featured.id}`)
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

            {/* Trending Now */}
            <MovieRow
                title="Trending Now"
                isTrending={true}
                initialMovies={popular.slice(1)}
            />

            {/* Genre Rows */}
            {genres.slice(0, displayedGenreCount).map((genre, index) => {
                const isLast = index === displayedGenreCount - 1;
                return (
                    <div
                        key={genre.id}
                        ref={isLast ? lastGenreElementRef : null}
                    >
                        <MovieRow
                            title={`${genre.name} Hits`}
                            genre={genre}
                            initialMovies={genreMovies[genre.id] || []}
                        />
                    </div>
                );
            })}

            {loadingMoreGenres && (
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        padding: "24px 0",
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
