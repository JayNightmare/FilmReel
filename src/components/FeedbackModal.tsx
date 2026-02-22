import React, { useState } from "react";
import "../styles/FeedbackModal.css";

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    movieTitle?: string;
}

export function FeedbackModal({
    isOpen,
    onClose,
    movieTitle,
}: FeedbackModalProps) {
    const [type, setType] = useState("Playback Issue");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState<
        "idle" | "submitting" | "success" | "error"
    >("idle");

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!description.trim()) return;

        setStatus("submitting");

        try {
            const webhookUrl = import.meta.env.VITE_WEBHOOK_PB;
            if (!webhookUrl) {
                console.error("Webhook URL is not defined.");
                setStatus("error");
                return;
            }

            const payload = {
                username: "FilmReel Feedback Bot",
                embeds: [
                    {
                        title: `New ${type}`,
                        color: type === "Playback Issue" ? 16711680 : 3447003, // Red for issue, Blue for feedback/feature
                        fields: [
                            {
                                name: "Movie",
                                value: movieTitle || "Unknown",
                                inline: true,
                            },
                            {
                                name: "Type",
                                value: type,
                                inline: true,
                            },
                            {
                                name: "Description",
                                value: description,
                            },
                        ],
                        timestamp: new Date().toISOString(),
                    },
                ],
            };

            const response = await fetch(webhookUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                setStatus("success");
                setTimeout(() => {
                    setStatus("idle");
                    setDescription("");
                    onClose();
                }, 2000);
            } else {
                setStatus("error");
            }
        } catch (error) {
            console.error("Failed to submit feedback", error);
            setStatus("error");
        }
    };

    return (
        <div
            className="feedback-modal-overlay animate-in fade-in"
            onClick={onClose}
        >
            <div
                className="feedback-modal glass-panel"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="feedback-modal-header">
                    <h2>Submit Feedback</h2>
                    <button
                        className="player-icon-btn player-icon-btn-sm"
                        onClick={onClose}
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {status === "success" ? (
                    <div className="feedback-modal-success">
                        <span className="material-symbols-outlined success-icon">
                            check_circle
                        </span>
                        <p>Thank you! Your feedback has been sent.</p>
                    </div>
                ) : (
                    <form
                        onSubmit={handleSubmit}
                        className="feedback-modal-form"
                    >
                        <div className="form-group">
                            <label>Feedback Type</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="glass-input"
                                disabled={status === "submitting"}
                                title="Feedback Type"
                            >
                                <option value="Playback Issue">
                                    Playback Issue
                                </option>
                                <option value="General Feedback">
                                    General Feedback
                                </option>
                                <option value="Feature Request">
                                    Feature Request
                                </option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Please describe the issue or share your thoughts..."
                                required
                                rows={4}
                                className="glass-input"
                                disabled={status === "submitting"}
                            />
                        </div>

                        {status === "error" && (
                            <div className="feedback-modal-error">
                                Failed to send feedback. Please try again later.
                            </div>
                        )}

                        <div className="feedback-modal-actions">
                            <button
                                type="button"
                                className="btn btn-glass"
                                onClick={onClose}
                                disabled={status === "submitting"}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={
                                    status === "submitting" ||
                                    !description.trim()
                                }
                            >
                                {status === "submitting"
                                    ? "Sending..."
                                    : "Submit"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
