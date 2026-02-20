import { useState } from "react";
import { StorageService } from "../services/storage";
import type { UserProfile, MoodResult } from "../services/storage";
import { Camera, Save, User as UserIcon, Clock } from "lucide-react";

export default function Account() {
    const [profile, setProfile] = useState<UserProfile>(() =>
        StorageService.getProfile(),
    );
    const [history] = useState<MoodResult[]>(() =>
        StorageService.getMoodHistory(),
    );
    const [isSaving, setIsSaving] = useState(false);

    const handleImageUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert("File must be smaller than 5MB");
                return;
            }
            try {
                const base64 = await StorageService.fileToBase64(file);
                setProfile((prev) => ({ ...prev, avatarBase64: base64 }));
            } catch (e) {
                console.error("Failed to convert image", e);
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
            // Optional: add a toast notification here
        }, 600);
    };

    return (
        <div style={{ maxWidth: "1000px", display: "flex", gap: "40px" }}>
            {/* Settings Form Column */}
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: "24px",
                }}
            >
                <h1 style={{ fontSize: "2.5rem" }}>Account Settings</h1>

                <div
                    className="glass-panel"
                    style={{
                        padding: "32px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "24px",
                    }}
                >
                    {/* Avatar Upload */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "24px",
                            marginBottom: "16px",
                        }}
                    >
                        <div
                            style={{
                                width: "120px",
                                height: "120px",
                                borderRadius: "50%",
                                background: "rgba(255,255,255,0.1)",
                                overflow: "hidden",
                                position: "relative",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            {profile.avatarBase64 ? (
                                <img
                                    src={profile.avatarBase64}
                                    alt="Avatar"
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                    }}
                                />
                            ) : (
                                <UserIcon
                                    size={48}
                                    color="rgba(255,255,255,0.3)"
                                />
                            )}
                            <label
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    background: "rgba(0,0,0,0.5)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    opacity: 0,
                                    cursor: "pointer",
                                    transition: "opacity 0.2s",
                                }}
                                onMouseEnter={(e) =>
                                    (e.currentTarget.style.opacity = "1")
                                }
                                onMouseLeave={(e) =>
                                    (e.currentTarget.style.opacity = "0")
                                }
                            >
                                <Camera size={24} color="white" />
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

                    {/* Form Fields */}
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
                        <label className="label-glass">Favorite Genre</label>
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
                        </select>
                    </div>

                    <div style={{ marginTop: "16px" }}>
                        <button
                            onClick={saveProfile}
                            className="btn btn-primary"
                            style={{ width: "100%" }}
                        >
                            <Save size={20} />
                            {isSaving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </div>
            </div>

            {/* History Column */}
            <div style={{ width: "350px", flexShrink: 0 }}>
                <h2
                    style={{
                        fontSize: "1.5rem",
                        marginBottom: "24px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >
                    <Clock size={24} color="var(--accent-purple)" />
                    Mood History
                </h2>

                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                    }}
                >
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
                                className="glass-panel"
                                style={{
                                    padding: "20px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "8px",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontWeight: 600,
                                            fontSize: "1.1rem",
                                            color: "var(--accent-purple-light)",
                                        }}
                                    >
                                        {item.moodLabel}
                                    </span>
                                </div>
                                <span
                                    style={{
                                        fontSize: "0.85rem",
                                        color: "var(--text-secondary)",
                                    }}
                                >
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
        </div>
    );
}
