import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { StorageService } from "../services/storage";
import type {
    UserProfile,
    MoodResult,
    WatchlistItem,
} from "../services/storage";
import "../styles/Account.css";

const FALLBACK_POSTER =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 500 750' fill='none'%3E%3Crect width='500' height='750' fill='%231a1122'/%3E%3Ctext x='250' y='340' text-anchor='middle' fill='%237f13ec' font-family='system-ui' font-size='40' font-weight='bold'%3EFilmReel%3C/text%3E%3Ctext x='250' y='400' text-anchor='middle' fill='%23666' font-family='system-ui' font-size='20'%3ENo Poster%3C/text%3E%3C/svg%3E";

export default function Account() {
    const [profile, setProfile] = useState<UserProfile>(() =>
        StorageService.getProfile(),
    );
    const [history] = useState<MoodResult[]>(() =>
        StorageService.getMoodHistory(),
    );
    const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() =>
        StorageService.getWatchlist(),
    );
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    const showToast = useCallback((message: string) => {
        setToast(message);
        setTimeout(() => setToast(null), 2500);
    }, []);

    const handleImageUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showToast("File must be smaller than 5MB");
                return;
            }
            try {
                const base64 = await StorageService.fileToBase64(file);
                setProfile((prev) => ({ ...prev, avatarBase64: base64 }));
            } catch (err) {
                console.error("Failed to convert image", err);
            }
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => {
        setProfile((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const saveProfile = () => {
        setIsSaving(true);
        StorageService.saveProfile(profile);
        setTimeout(() => {
            setIsSaving(false);
            showToast("Profile saved successfully!");
        }, 400);
    };

    const removeFromWatchlist = (movieId: number) => {
        StorageService.removeFromWatchlist(movieId);
        setWatchlist(StorageService.getWatchlist());
        showToast("Removed from watchlist");
    };

    return (
        <div className="account-page animate-in fade-in">
            {/* Top Section: Form + Mood History */}
            <div className="account-top">
                {/* Settings Form */}
                <div className="account-main">
                    <h1 className="account-title">Account Settings</h1>

                    <div className="glass-panel account-form">
                        {/* Avatar Upload */}
                        <div className="account-avatar-row">
                            <div className="account-avatar">
                                {profile.avatarBase64 ? (
                                    <img
                                        src={profile.avatarBase64}
                                        alt="Avatar"
                                    />
                                ) : (
                                    <span
                                        className="material-symbols-outlined"
                                        style={{
                                            fontSize: "48px",
                                            color: "rgba(255,255,255,0.3)",
                                        }}
                                    >
                                        person
                                    </span>
                                )}
                                <label className="account-avatar-overlay">
                                    <span
                                        className="material-symbols-outlined"
                                        style={{
                                            fontSize: "24px",
                                            color: "white",
                                        }}
                                    >
                                        camera_alt
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        hidden
                                    />
                                </label>
                            </div>
                            <div>
                                <h3
                                    style={{
                                        fontSize: "1.2rem",
                                        marginBottom: "8px",
                                    }}
                                >
                                    Profile Picture
                                </h3>
                                <p
                                    style={{
                                        color: "var(--text-secondary)",
                                        fontSize: "0.9rem",
                                    }}
                                >
                                    Max file size 5MB. Tap image to change.
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="label-glass">Display Name</label>
                            <input
                                name="displayName"
                                value={profile.displayName}
                                onChange={handleChange}
                                className="input-glass"
                                placeholder="e.g. CinemaLover99"
                            />
                        </div>

                        <div>
                            <label className="label-glass">
                                Favorite Genre
                            </label>
                            <select
                                title="favorite genre"
                                name="favoriteGenreId"
                                value={profile.favoriteGenreId || ""}
                                onChange={handleChange}
                                className="input-glass"
                                style={{
                                    appearance: "none",
                                    background:
                                        "rgba(0,0,0,0.4) url(\"data:image/svg+xml;utf8,<svg fill='%23ffffff' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>\") no-repeat right 16px center",
                                }}
                            >
                                <option value="" disabled>
                                    Select a genre...
                                </option>
                                <option value="28">Action</option>
                                <option value="35">Comedy</option>
                                <option value="18">Drama</option>
                                <option value="878">Sci-Fi</option>
                                <option value="27">Horror</option>
                                <option value="10749">Romance</option>
                                <option value="16">Animation</option>
                                <option value="99">Documentary</option>
                            </select>
                        </div>

                        <div style={{ marginTop: "16px" }}>
                            <button
                                onClick={saveProfile}
                                className="btn btn-primary"
                                style={{ width: "100%" }}
                            >
                                <span
                                    className="material-symbols-outlined"
                                    style={{ fontSize: "20px" }}
                                >
                                    save
                                </span>
                                {isSaving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mood History Sidebar */}
                <div className="account-sidebar">
                    <h2 className="account-sidebar-title">
                        <span
                            className="material-symbols-outlined text-purple"
                            style={{ fontSize: "24px" }}
                        >
                            schedule
                        </span>
                        Mood History
                    </h2>

                    {history.length === 0 ? (
                        <div
                            className="glass-panel"
                            style={{
                                padding: "24px",
                                textAlign: "center",
                                color: "var(--text-secondary)",
                            }}
                        >
                            No history yet. Take the Mood Survey!
                        </div>
                    ) : (
                        history.map((item, idx) => (
                            <div
                                key={idx}
                                className="glass-panel account-mood-card"
                            >
                                <span className="account-mood-label">
                                    {item.moodLabel}
                                </span>
                                <span className="account-mood-date">
                                    {new Date(item.date).toLocaleDateString()}{" "}
                                    at{" "}
                                    {new Date(item.date).toLocaleTimeString(
                                        [],
                                        { hour: "2-digit", minute: "2-digit" },
                                    )}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Watchlist Section */}
            <div className="account-watchlist">
                <div className="account-watchlist-header">
                    <h2 className="account-sidebar-title">
                        <span
                            className="material-symbols-outlined text-purple"
                            style={{ fontSize: "24px" }}
                        >
                            bookmark
                        </span>
                        My Watchlist
                    </h2>
                    {watchlist.length > 0 && (
                        <span
                            style={{
                                color: "var(--text-secondary)",
                                fontSize: "0.9rem",
                            }}
                        >
                            {watchlist.length}{" "}
                            {watchlist.length === 1 ? "movie" : "movies"}
                        </span>
                    )}
                </div>

                {watchlist.length === 0 ? (
                    <div className="glass-panel account-watchlist-empty">
                        <span className="material-symbols-outlined">
                            bookmark_border
                        </span>
                        Your watchlist is empty. Browse movies and tap the
                        bookmark icon to save them here!
                    </div>
                ) : (
                    <div className="account-watchlist-grid">
                        {watchlist.map((item) => (
                            <div
                                key={item.id}
                                className="movie-card group"
                                style={{ width: "100%" }}
                            >
                                <Link
                                    to={`/movie/${item.id}`}
                                    style={{ textDecoration: "none" }}
                                >
                                    <div className="movie-card-inner">
                                        <img
                                            src={
                                                item.poster_path
                                                    ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                                                    : FALLBACK_POSTER
                                            }
                                            alt={item.title}
                                            className="movie-poster"
                                            onError={(e) => {
                                                (
                                                    e.target as HTMLImageElement
                                                ).src = FALLBACK_POSTER;
                                            }}
                                        />
                                        <div className="movie-overlay" />
                                        <button
                                            className="movie-bookmark active"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                removeFromWatchlist(item.id);
                                            }}
                                            title="Remove from Watchlist"
                                        >
                                            <span className="material-symbols-outlined">
                                                bookmark_remove
                                            </span>
                                        </button>
                                        <div className="movie-info">
                                            <h4 className="movie-title truncate">
                                                {item.title}
                                            </h4>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Toast */}
            <div className={`toast ${toast ? "visible" : ""}`}>
                <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "20px" }}
                >
                    check_circle
                </span>
                {toast}
            </div>
        </div>
    );
}
