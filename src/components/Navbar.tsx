import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { StorageService } from "../services/storage";
import type { UserProfile } from "../services/storage";
import "../styles/Navbar.css";

interface Notification {
    id: string;
    title: string;
    message: string;
    date: string;
    read: boolean;
}

export const Navbar = () => {
    const location = useLocation();
    const [profile, setProfile] = useState<UserProfile>(() =>
        StorageService.getProfile(),
    );
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotifs, setShowNotifs] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const dropDownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Initial mock notification if empty
    useEffect(() => {
        const stored = localStorage.getItem("notif-film");
        let parsed: Notification[] = [];
        if (stored) {
            parsed = JSON.parse(stored);
        } else {
            // Seed a welcome notification
            parsed = [
                {
                    id: "welcome-1",
                    title: "Welcome to FilmReel!",
                    message:
                        "Take a mood survey to get personalized movie recommendations.",
                    date: new Date().toISOString(),
                    read: false,
                },
            ];
            localStorage.setItem("notif-film", JSON.stringify(parsed));
        }

        // Sort newest to oldest
        parsed.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
        setNotifications(parsed);
    }, []);

    useEffect(() => {
        setProfile(StorageService.getProfile());
    }, [location.pathname]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropDownRef.current &&
                !dropDownRef.current.contains(event.target as Node)
            ) {
                setShowNotifs(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleNotifs = () => {
        if (!showNotifs) {
            // Mark all as read when opening (or when clicking individual, but simple UX is marking all shown as read)
            const updated = notifications.map((n) => ({ ...n, read: true }));
            setNotifications(updated);
            localStorage.setItem("notif-film", JSON.stringify(updated));
        }
        setShowNotifs(!showNotifs);
    };

    const clearNotifs = () => {
        setNotifications([]);
        localStorage.setItem("notif-film", JSON.stringify([]));
    };

    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
        <header className="glass-panel navbar">
            <div className="container navbar-inner">
                {/* Logo */}
                <Link to="/" className="nav-logo-link">
                    <div className="nav-logo-icon">
                        <span
                            className="material-symbols-outlined"
                            style={{ fontSize: "36px" }}
                        >
                            movie_filter
                        </span>
                    </div>
                    <h1 className="nav-logo-text">FilmReel</h1>
                </Link>

                {/* Desktop Search Bar */}
                <div className="hidden-md nav-search-container">
                    <div className="nav-search-input-wrapper">
                        <div className="nav-search-icon">
                            <span className="material-symbols-outlined">
                                search
                            </span>
                        </div>
                        <input
                            className="input-glass nav-search-input-glass"
                            placeholder="Search movies, genres, moods..."
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && searchQuery.trim()) {
                                    navigate(
                                        `/search?q=${encodeURIComponent(searchQuery.trim())}`,
                                    );
                                    setSearchQuery("");
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Right Actions */}
                <div className="nav-actions">
                    <Link
                        to="/mood"
                        className="nav-mood-button group"
                        title="Mood Survey"
                    >
                        <span className="material-symbols-outlined text-purple">
                            auto_awesome
                        </span>
                        <span
                            style={{ fontSize: "0.9rem", display: "none" }}
                            className="md-inline font-bold group-hover-text-primary"
                        >
                            Survey
                        </span>
                    </Link>

                    <div style={{ position: "relative" }} ref={dropDownRef}>
                        <button
                            className="nav-icon-button"
                            onClick={toggleNotifs}
                        >
                            <span className="material-symbols-outlined">
                                notifications
                            </span>
                            {unreadCount > 0 && (
                                <span className="nav-badge"></span>
                            )}
                        </button>

                        {/* Dropdown */}
                        {showNotifs && (
                            <div className="notif-dropdown animate-fade-in-up">
                                <div className="notif-header">
                                    <h3>Notifications</h3>
                                    {notifications.length > 0 && (
                                        <button
                                            onClick={clearNotifs}
                                            className="notif-clear-btn"
                                        >
                                            Clear All
                                        </button>
                                    )}
                                </div>
                                <div className="notif-list">
                                    {notifications.length === 0 ? (
                                        <div className="notif-empty">
                                            You're all caught up!
                                        </div>
                                    ) : (
                                        notifications.map((n) => (
                                            <div
                                                key={n.id}
                                                className={`notif-item ${!n.read ? "unread" : ""}`}
                                            >
                                                <h4>{n.title}</h4>
                                                <p>{n.message}</p>
                                                <p
                                                    style={{
                                                        fontSize: "0.7rem",
                                                        marginTop: "4px",
                                                        opacity: 0.7,
                                                    }}
                                                >
                                                    {new Date(
                                                        n.date,
                                                    ).toLocaleDateString()}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="nav-divider"></div>

                    <Link to="/account" className="nav-profile-link group">
                        <div className="nav-avatar group-hover-border-primary">
                            {profile.avatarBase64 ? (
                                <img
                                    alt="User profile"
                                    src={profile.avatarBase64}
                                />
                            ) : (
                                <span
                                    className="material-symbols-outlined"
                                    style={{
                                        color: "rgba(255,255,255,0.3)",
                                        fontSize: "24px",
                                    }}
                                >
                                    person
                                </span>
                            )}
                        </div>
                        <span className="nav-profile-name group-hover-text-primary hidden-md">
                            {profile.displayName || "Alex Doe"}
                        </span>
                    </Link>
                </div>
            </div>
        </header>
    );
};
