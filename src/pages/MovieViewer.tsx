import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { APIService } from "../services/api";
import type { Movie } from "../services/api";
import { GenreMap } from "../services/genreMap";
import { StorageService } from "../services/storage";
import { MovieCard } from "../components/MovieCard";
import "../styles/MovieViewer.css";

const FALLBACK_POSTER =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 500 750' fill='none'%3E%3Crect width='500' height='750' fill='%231a1122'/%3E%3Ctext x='250' y='340' text-anchor='middle' fill='%237f13ec' font-family='system-ui' font-size='40' font-weight='bold'%3EFilmReel%3C/text%3E%3Ctext x='250' y='400' text-anchor='middle' fill='%23666' font-family='system-ui' font-size='20'%3ENo Poster%3C/text%3E%3C/svg%3E";

export default function MovieViewer() {
    const { id } = useParams<{ id: string }>();
    const [movie, setMovie] = useState<Movie | null>(null);
    const [similar, setSimilar] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);
    const [inWatchlist, setInWatchlist] = useState(false);

    useEffect(() => {
        const fetchMovie = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const movieId = parseInt(id, 10);
                const [data, related] = await Promise.all([
                    APIService.getMovieDetails(movieId),
                    APIService.getSimilarMovies(movieId),
                ]);
                setMovie(data);
                setSimilar(related.slice(0, 6));
                setInWatchlist(StorageService.isInWatchlist(movieId));
            } catch (e) {
                console.error("Failed to load movie details", e);
            } finally {
                setLoading(false);
            }
        };
        fetchMovie();
        window.scrollTo(0, 0);
    }, [id]);

    if (loading) {
        return (
            <div className="viewer-loading">
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

    if (!movie) {
        return (
            <div className="viewer-not-found">
                <span className="material-symbols-outlined">movie_off</span>
                <h2>Movie Not Found</h2>
                <Link to="/" className="btn btn-glass">
                    Back to Browse
                </Link>
            </div>
        );
    }

    const genreNames = (movie.genre_ids || []).map((gid) =>
        GenreMap.getName(gid),
    );
    const posterUrl = movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : FALLBACK_POSTER;

    const toggleWatchlist = () => {
        if (inWatchlist) {
            StorageService.removeFromWatchlist(movie.id);
            setInWatchlist(false);
        } else {
            StorageService.addToWatchlist({
                id: movie.id,
                title: movie.title,
                poster_path: movie.poster_path,
            });
            setInWatchlist(true);
        }
    };

    return (
        <div className="animate-in fade-in">
            {/* Full-screen Player */}
            <div className="viewer-hero">
                <iframe
                    src={`https://vidking.net/embed/movie/${id}`}
                    title={movie.title}
                    allowFullScreen
                />
                <div className="viewer-hero-gradient" />
                <div className="viewer-scroll-hint">
                    <span className="material-symbols-outlined">
                        expand_more
                    </span>
                    <span>Scroll for details</span>
                </div>
            </div>

            {/* Info Section — below the fold */}
            <div className="viewer-info">
                <div className="viewer-info-layout">
                    {/* Main Info */}
                    <div className="viewer-info-main">
                        <h1 className="viewer-title">{movie.title}</h1>

                        {genreNames.length > 0 && (
                            <div className="viewer-genre-tags">
                                {genreNames.map((name) => (
                                    <span
                                        key={name}
                                        className="viewer-genre-tag"
                                    >
                                        {name}
                                    </span>
                                ))}
                            </div>
                        )}

                        <p className="viewer-overview">
                            {movie.overview ||
                                "No synopsis available for this title."}
                        </p>
                    </div>

                    {/* Sidebar */}
                    <div className="glass-panel viewer-info-sidebar">
                        <img
                            src={posterUrl}
                            alt={movie.title}
                            className="viewer-poster"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                    FALLBACK_POSTER;
                            }}
                        />

                        <button
                            className={`btn ${inWatchlist ? "btn-glass" : "btn-primary"} viewer-watchlist-btn`}
                            onClick={toggleWatchlist}
                        >
                            <span
                                className="material-symbols-outlined"
                                style={{ fontSize: "20px" }}
                            >
                                {inWatchlist
                                    ? "bookmark_added"
                                    : "bookmark_add"}
                            </span>
                            {inWatchlist ? "In Watchlist" : "Add to Watchlist"}
                        </button>

                        <div className="viewer-meta-list">
                            <div className="viewer-meta-item">
                                <div className="viewer-meta-icon">
                                    <span
                                        className="material-symbols-outlined text-purple"
                                        style={{ fontSize: "20px" }}
                                    >
                                        star
                                    </span>
                                </div>
                                <div>
                                    <span
                                        className="label-glass"
                                        style={{ marginBottom: 0 }}
                                    >
                                        Rating
                                    </span>
                                    <span style={{ fontWeight: 600 }}>
                                        {movie.vote_average.toFixed(1)} / 10
                                    </span>
                                </div>
                            </div>

                            <div className="viewer-meta-item">
                                <div className="viewer-meta-icon">
                                    <span
                                        className="material-symbols-outlined text-purple"
                                        style={{ fontSize: "20px" }}
                                    >
                                        calendar_today
                                    </span>
                                </div>
                                <div>
                                    <span
                                        className="label-glass"
                                        style={{ marginBottom: 0 }}
                                    >
                                        Release
                                    </span>
                                    <span style={{ fontWeight: 600 }}>
                                        {new Date(
                                            movie.release_date,
                                        ).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Related Movies */}
                {similar.length > 0 && (
                    <div className="viewer-related">
                        <h3>You Might Also Like</h3>
                        <div className="viewer-related-grid">
                            {similar.map((m) => (
                                <MovieCard key={m.id} movie={m} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
