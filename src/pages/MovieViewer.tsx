import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { APIService } from "../services/api";
import type { Movie, CastMember } from "../services/api";
import { GenreMap } from "../services/genreMap";
import { StorageService } from "../services/storage";
import { MovieCard } from "../components/MovieCard";
import { FeedbackModal } from "../components/FeedbackModal";
import "../styles/MovieViewer.css";

const FALLBACK_POSTER =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 500 750' fill='none'%3E%3Crect width='500' height='750' fill='%231a1122'/%3E%3Ctext x='250' y='340' text-anchor='middle' fill='%237f13ec' font-family='system-ui' font-size='40' font-weight='bold'%3EFilmReel%3C/text%3E%3Ctext x='250' y='400' text-anchor='middle' fill='%23666' font-family='system-ui' font-size='20'%3ENo Poster%3C/text%3E%3C/svg%3E";

const CONTROLS_IDLE_MS = 3000;

export default function MovieViewer() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const heroRef = useRef<HTMLDivElement>(null);
    const idleTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

    const [movie, setMovie] = useState<Movie | null>(null);
    const [similar, setSimilar] = useState<Movie[]>([]);
    const [cast, setCast] = useState<CastMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [inWatchlist, setInWatchlist] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [iframeKey, setIframeKey] = useState(0);

    // Playback state (from VidKing postMessage)
    const [controlsVisible, setControlsVisible] = useState(true);

    // Provider state
    type Provider = "vidking" | "vidsrc" | "superembed";
    const [provider, setProvider] = useState<Provider>("vidking");

    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

    const refreshIframe = useCallback(() => {
        setIframeKey((k) => k + 1);
    }, []);

    useEffect(() => {
        const fetchMovie = async () => {
            if (!id) return;
            try {
                setLoading(true);
                setPlaying(false);
                const movieId = parseInt(id, 10);
                const [data, related, credits] = await Promise.all([
                    APIService.getMovieDetails(movieId),
                    APIService.getSimilarMovies(movieId),
                    APIService.getMovieCredits(movieId),
                ]);
                setMovie(data);
                setSimilar(related.slice(0, 6));
                setCast(credits.slice(0, 15));
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

    // Auto-hide controls on idle
    const resetIdleTimer = useCallback(() => {
        setControlsVisible(true);
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        idleTimerRef.current = setTimeout(
            () => setControlsVisible(false),
            CONTROLS_IDLE_MS,
        );
    }, []);

    useEffect(() => {
        if (!playing) {
            setControlsVisible(true);
            return;
        }
        const hero = heroRef.current;
        if (!hero) return;

        hero.addEventListener("mousemove", resetIdleTimer);
        hero.addEventListener("mouseenter", resetIdleTimer);
        resetIdleTimer();

        return () => {
            hero.removeEventListener("mousemove", resetIdleTimer);
            hero.removeEventListener("mouseenter", resetIdleTimer);
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        };
    }, [playing, resetIdleTimer]);

    if (loading) {
        return (
            <div className="viewer-loading">
                <div className="viewer-loading-panel glass-panel">
                    <span className="material-symbols-outlined animate-pulse viewer-loading-icon">
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
    const backdropUrl = movie.backdrop_path
        ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
        : posterUrl;
    const releaseYear = movie.release_date
        ? new Date(movie.release_date).getFullYear()
        : "";

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

    const buildEmbedUrl = () => {
        if (provider === "vidking") {
            const params = new URLSearchParams({
                color: "7f13ec",
                autoPlay: "true",
            });
            return `https://vidking.net/embed/movie/${id}?${params.toString()}`;
        } else if (provider === "vidsrc") {
            return `https://vidsrc.me/embed/movie?tmdb=${id}`;
        } else if (provider === "superembed") {
            return `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1`;
        }
        return "about:blank";
    };

    // Full control bar for the overlay (pre-play, decorative)
    const renderOverlayControls = () => (
        <div className="player-controls" onClick={(e) => e.stopPropagation()}>
            <div className="">
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        width: "100%",
                    }}
                >
                    <button
                        type="button"
                        className="player-mood-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate("/mood");
                        }}
                    >
                        <span className="material-symbols-outlined">
                            auto_awesome
                        </span>
                        Mood Mode
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="animate-in fade-in">
            <FeedbackModal
                isOpen={isFeedbackOpen}
                onClose={() => setIsFeedbackOpen(false)}
                movieTitle={movie.title}
            />
            {/* Full-screen Player Area */}
            <div
                ref={heroRef}
                className={`viewer-hero ${playing && !controlsVisible ? "cursor-hidden" : ""}`}
            >
                {/* Top-left: Title pill */}
                <div className="player-title-pill">
                    <button
                        className="player-icon-btn player-icon-btn-sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(-1);
                        }}
                    >
                        <span className="material-symbols-outlined player-icon-sm">
                            arrow_back
                        </span>
                    </button>
                    <div className="player-title-pill-text">
                        <h2>{movie.title}</h2>
                        {releaseYear && (
                            <span>
                                {releaseYear} • {genreNames[0] || "Film"}
                            </span>
                        )}
                    </div>
                </div>

                {/* Top-right: Actions */}
                <div className="player-top-right">
                    <button
                        className="player-icon-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleWatchlist();
                        }}
                    >
                        <span
                            className="material-symbols-outlined player-icon-sm"
                            style={{
                                fontVariationSettings: inWatchlist
                                    ? "'FILL' 1"
                                    : "'FILL' 0",
                            }}
                        >
                            {inWatchlist ? "bookmark_added" : "bookmark_add"}
                        </span>
                    </button>
                </div>

                <iframe
                    key={iframeKey}
                    src={playing ? buildEmbedUrl() : "about:blank"}
                    title={movie.title}
                    sandbox="allow-scripts allow-same-origin allow-forms allow-fullscreen"
                    allow="fullscreen"
                    allowFullScreen
                    className="viewer-iframe"
                />

                <div
                    className={`player-overlay ${playing ? "hidden" : ""}`}
                    onClick={() => {
                        StorageService.markAsWatched(movie.id);
                        setPlaying(true);
                    }}
                >
                    <div
                        className="player-backdrop"
                        style={{ backgroundImage: `url(${backdropUrl})` }}
                    />
                    <div className="player-vignette" />

                    {/* Center: Play Controls */}
                    <div className="player-center-play">
                        <div className="player-play-circle">
                            <span className="material-symbols-outlined">
                                play_arrow
                            </span>
                        </div>
                    </div>

                    {/* Bottom: Control bar (static preview) */}
                    {renderOverlayControls()}
                </div>

                {/* Live progress pill (read-only indicator) */}
                {playing && (
                    <div
                        className={`player-progress-pill ${!controlsVisible ? "controls-hidden" : ""}`}
                    >
                        <div className="pill-time">
                            <span className="pill-time-text">
                                Having Playback Issues?
                            </span>
                            <button
                                className="pill-refresh-btn"
                                onClick={refreshIframe}
                                title="Refresh player"
                            >
                                <span className="material-symbols-outlined pill-refresh-icon">
                                    refresh
                                </span>
                            </button>
                            <button
                                className="pill-ticket-btn"
                                onClick={() => setIsFeedbackOpen(true)}
                                title="Submit Feedback"
                            >
                                <span className="material-symbols-outlined pill-ticket-icon">
                                    feedback
                                </span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Scroll hint */}
                {playing && (
                    <div
                        className={`viewer-scroll-hint ${!controlsVisible ? "controls-hidden" : ""}`}
                    >
                        <span className="material-symbols-outlined">
                            expand_more
                        </span>
                        <span>Scroll for details</span>
                    </div>
                )}
            </div>

            {/* Info Section — below the fold */}
            <div className="viewer-info">
                <div className="viewer-info-layout">
                    {/* Main Info */}
                    <div className="viewer-info-main">
                        <h1 className="viewer-title">{movie.title}</h1>

                        {/* Mobile-only: playback actions pill */}
                        {playing && (
                            <div className="viewer-mobile-actions">
                                <button
                                    className="viewer-mobile-action-btn"
                                    onClick={refreshIframe}
                                    title="Refresh player"
                                >
                                    <span className="material-symbols-outlined">
                                        refresh
                                    </span>
                                    Refresh
                                </button>
                                <button
                                    className="viewer-mobile-action-btn"
                                    onClick={() => setIsFeedbackOpen(true)}
                                    title="Submit Feedback"
                                >
                                    <span className="material-symbols-outlined">
                                        feedback
                                    </span>
                                    Report Issue
                                </button>
                            </div>
                        )}

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

                        {/* Cast Section */}
                        {cast.length > 0 && (
                            <div className="viewer-cast-section animate-fade-in-up">
                                <h3 className="viewer-cast-title">Top Cast</h3>
                                <div className="viewer-cast-carousel">
                                    {cast.map((actor) => (
                                        <Link
                                            key={actor.id}
                                            to={`/search?q=${encodeURIComponent(actor.name)}&actor=${actor.id}`}
                                            className="viewer-cast-card glass-panel group"
                                        >
                                            <div className="viewer-cast-avatar">
                                                {actor.profile_path ? (
                                                    <img
                                                        src={`https://image.tmdb.org/t/p/w200${actor.profile_path}`}
                                                        alt={actor.name}
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <span className="material-symbols-outlined viewer-cast-fallback">
                                                        person
                                                    </span>
                                                )}
                                            </div>
                                            <div className="viewer-cast-info">
                                                <p className="viewer-cast-name">
                                                    {actor.name}
                                                </p>
                                                <p className="viewer-cast-character">
                                                    {actor.character}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
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
                            <span className="material-symbols-outlined viewer-watchlist-icon">
                                {inWatchlist
                                    ? "bookmark_added"
                                    : "bookmark_add"}
                            </span>
                            {inWatchlist ? "In Watchlist" : "Add to Watchlist"}
                        </button>

                        <div className="viewer-meta-list">
                            <div className="viewer-meta-item">
                                <div className="viewer-meta-icon">
                                    <span className="material-symbols-outlined text-purple viewer-meta-icon-size">
                                        router
                                    </span>
                                </div>
                                <div style={{ width: "100%" }}>
                                    <span className="label-glass viewer-meta-label">
                                        Source Provider
                                    </span>
                                    <select
                                        className="viewer-provider-select"
                                        value={provider}
                                        onChange={(e) => {
                                            setProvider(
                                                e.target.value as Provider,
                                            );
                                            setPlaying(false); // Reset playing state when switching
                                        }}
                                        title="Select Streaming Provider"
                                    >
                                        <option value="vidking">
                                            VidKing (Recommended)
                                        </option>
                                        <option value="vidsrc">VidSrc</option>
                                        <option value="superembed">
                                            SuperEmbed
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <div className="viewer-meta-item">
                                <div className="viewer-meta-icon">
                                    <span className="material-symbols-outlined text-purple viewer-meta-icon-size">
                                        star
                                    </span>
                                </div>
                                <div>
                                    <span className="label-glass viewer-meta-label">
                                        Rating
                                    </span>
                                    <span className="viewer-meta-value">
                                        {movie.vote_average.toFixed(1)} / 10
                                    </span>
                                </div>
                            </div>

                            <div className="viewer-meta-item">
                                <div className="viewer-meta-icon">
                                    <span className="material-symbols-outlined text-purple viewer-meta-icon-size">
                                        calendar_today
                                    </span>
                                </div>
                                <div>
                                    <span className="label-glass viewer-meta-label">
                                        Release
                                    </span>
                                    <span className="viewer-meta-value">
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
