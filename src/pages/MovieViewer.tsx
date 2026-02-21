import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { APIService } from "../services/api";
import type { Movie } from "../services/api";
import { GenreMap } from "../services/genreMap";
import { StorageService } from "../services/storage";
import { MovieCard } from "../components/MovieCard";
import "../styles/MovieViewer.css";

const FALLBACK_POSTER =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 500 750' fill='none'%3E%3Crect width='500' height='750' fill='%231a1122'/%3E%3Ctext x='250' y='340' text-anchor='middle' fill='%237f13ec' font-family='system-ui' font-size='40' font-weight='bold'%3EFilmReel%3C/text%3E%3Ctext x='250' y='400' text-anchor='middle' fill='%23666' font-family='system-ui' font-size='20'%3ENo Poster%3C/text%3E%3C/svg%3E";

const CONTROLS_IDLE_MS = 3000;

interface VidKingEvent {
    type: "PLAYER_EVENT";
    data: {
        event: "timeupdate" | "play" | "pause" | "ended" | "seeked";
        currentTime: number;
        duration: number;
        progress: number;
        id: string;
    };
}

function formatTime(seconds: number): string {
    if (!seconds || seconds < 0) return "0:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0)
        return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${m}:${String(s).padStart(2, "0")}`;
}

export default function MovieViewer() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const heroRef = useRef<HTMLDivElement>(null);
    const idleTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

    const [movie, setMovie] = useState<Movie | null>(null);
    const [similar, setSimilar] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);
    const [inWatchlist, setInWatchlist] = useState(false);
    const [playing, setPlaying] = useState(false);

    // Playback state (from VidKing postMessage)
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPaused, setIsPaused] = useState(true);
    const [controlsVisible, setControlsVisible] = useState(true);

    // Saved resume position
    const [resumeTime, setResumeTime] = useState<number | null>(null);

    useEffect(() => {
        const fetchMovie = async () => {
            if (!id) return;
            try {
                setLoading(true);
                setPlaying(false);
                setCurrentTime(0);
                setDuration(0);
                setIsPaused(true);
                const movieId = parseInt(id, 10);
                const [data, related] = await Promise.all([
                    APIService.getMovieDetails(movieId),
                    APIService.getSimilarMovies(movieId),
                ]);
                setMovie(data);
                setSimilar(related.slice(0, 6));
                setInWatchlist(StorageService.isInWatchlist(movieId));
                setResumeTime(StorageService.getWatchProgress(movieId));
            } catch (e) {
                console.error("Failed to load movie details", e);
            } finally {
                setLoading(false);
            }
        };
        fetchMovie();
        window.scrollTo(0, 0);
    }, [id]);

    // Listen for VidKing postMessage events
    useEffect(() => {
        if (!playing || !id) return;

        const movieId = parseInt(id, 10);
        let saveCounter = 0;

        const handleMessage = (event: MessageEvent) => {
            try {
                const parsed: VidKingEvent =
                    typeof event.data === "string"
                        ? JSON.parse(event.data)
                        : event.data;

                if (parsed?.type !== "PLAYER_EVENT") return;
                const { data } = parsed;

                switch (data.event) {
                    case "timeupdate":
                        setCurrentTime(data.currentTime);
                        if (data.duration > 0) setDuration(data.duration);
                        // Save progress every ~5 updates
                        saveCounter++;
                        if (saveCounter % 5 === 0) {
                            StorageService.saveWatchProgress(
                                movieId,
                                data.currentTime,
                            );
                        }
                        break;
                    case "play":
                        setIsPaused(false);
                        break;
                    case "pause":
                        setIsPaused(true);
                        StorageService.saveWatchProgress(
                            movieId,
                            data.currentTime,
                        );
                        break;
                    case "ended":
                        setIsPaused(true);
                        break;
                    case "seeked":
                        setCurrentTime(data.currentTime);
                        break;
                }
            } catch {
                /* ignore non-JSON messages */
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [playing, id]);

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

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    const buildEmbedUrl = () => {
        const params = new URLSearchParams({
            color: "7f13ec",
            autoPlay: "true",
        });
        if (resumeTime && resumeTime > 10) {
            params.set("progress", String(resumeTime));
        }
        return `https://vidking.net/embed/movie/${id}?${params.toString()}`;
    };

    // Full control bar for the overlay (pre-play, decorative)
    const renderOverlayControls = () => (
        <div className="player-controls" onClick={(e) => e.stopPropagation()}>
            <div className="player-progress-wrapper">
                <div className="player-progress-track">
                    <div
                        className="player-progress-fill"
                        style={{ width: "0%" }}
                    />
                    <div
                        className="player-progress-thumb"
                        style={{ left: "0%" }}
                    />
                </div>
                <div className="player-progress-times">
                    <span>0:00</span>
                    <span>
                        {movie.runtime
                            ? formatTime(movie.runtime * 60)
                            : "--:--"}
                    </span>
                </div>
            </div>

            <div className="player-controls-row">
                <div className="player-controls-left">
                    <button className="player-ctrl-btn">
                        <span className="material-symbols-outlined">
                            volume_up
                        </span>
                    </button>
                    <button className="player-quality-badge">HD</button>
                </div>

                <div className="player-controls-center">
                    <button className="player-ctrl-btn">
                        <span className="material-symbols-outlined">
                            replay_10
                        </span>
                    </button>
                    <button
                        className="player-main-play"
                        onClick={() => setPlaying(true)}
                    >
                        <span className="material-symbols-outlined">
                            play_arrow
                        </span>
                    </button>
                    <button className="player-ctrl-btn">
                        <span className="material-symbols-outlined">
                            forward_10
                        </span>
                    </button>
                </div>

                <div className="player-controls-right">
                    <button
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
                    <div className="player-separator" />
                    <button className="player-ctrl-btn">
                        <span className="material-symbols-outlined">
                            subtitles
                        </span>
                    </button>
                    <button className="player-ctrl-btn">
                        <span className="material-symbols-outlined">
                            fullscreen
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="animate-in fade-in">
            {/* Full-screen Player Area */}
            <div
                ref={heroRef}
                className={`viewer-hero ${playing && !controlsVisible ? "cursor-hidden" : ""}`}
            >
                {/* VidKing iframe */}
                <iframe
                    src={playing ? buildEmbedUrl() : "about:blank"}
                    title={movie.title}
                    allowFullScreen
                />

                {/* Stitch UI Poster Overlay (pre-play) */}
                <div
                    className={`player-overlay ${playing ? "hidden" : ""}`}
                    onClick={() => setPlaying(true)}
                >
                    <div
                        className="player-backdrop"
                        style={{ backgroundImage: `url(${backdropUrl})` }}
                    />
                    <div className="player-vignette" />

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
                                {inWatchlist
                                    ? "bookmark_added"
                                    : "bookmark_add"}
                            </span>
                        </button>
                    </div>

                    {/* Center: Play button */}
                    <div className="player-center-play">
                        <div className="player-play-circle">
                            <span className="material-symbols-outlined">
                                play_arrow
                            </span>
                        </div>
                        {resumeTime && resumeTime > 10 && (
                            <span className="player-resume-label">
                                Resume from {formatTime(resumeTime)}
                            </span>
                        )}
                    </div>

                    {/* Bottom: Control bar (static preview) */}
                    {renderOverlayControls()}
                </div>

                {/* Live progress pill (read-only indicator) */}
                {playing && (
                    <div
                        className={`player-progress-pill ${!controlsVisible ? "controls-hidden" : ""}`}
                    >
                        <div className="pill-track">
                            <div
                                className="pill-fill"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        <div className="pill-time">
                            <span className="material-symbols-outlined pill-icon">
                                {isPaused ? "pause_circle" : "play_circle"}
                            </span>
                            <span>{formatTime(currentTime)}</span>
                            <span className="pill-separator">/</span>
                            <span className="pill-duration">
                                {duration > 0 ? formatTime(duration) : "--:--"}
                            </span>
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
