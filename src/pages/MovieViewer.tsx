import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { APIService } from "../services/api";
import type { Movie } from "../services/api";
import { ArrowLeft, Star, Calendar } from "lucide-react";

export default function MovieViewer() {
    const { id } = useParams<{ id: string }>();
    const [movie, setMovie] = useState<Movie | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMovie = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const data = await APIService.getMovieDetails(parseInt(id, 10));
                setMovie(data);
            } catch (e) {
                console.error("Failed to load movie details", e);
            } finally {
                setLoading(false);
            }
        };
        fetchMovie();
    }, [id]);

    if (loading) return <div className="p-8">Loading...</div>;
    if (!movie) return <div className="p-8">Movie Not Found</div>;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Top Bar: Back & Info */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <Link
                    to="/"
                    className="btn btn-glass"
                    style={{ padding: "8px 16px" }}
                >
                    <ArrowLeft size={18} /> Back to Browse
                </Link>
            </div>

            <div
                style={{
                    display: "flex",
                    gap: "40px",
                    alignItems: "flex-start",
                }}
            >
                {/* Left Column: Player & Main Info */}
                <div
                    style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: "24px",
                    }}
                >
                    {/* VidKing Embed Player */}
                    <div
                        className="glass-panel"
                        style={{
                            width: "100%",
                            aspectRatio: "16/9",
                            overflow: "hidden",
                            background: "black",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative",
                        }}
                    >
                        <iframe
                            src={`https://vidking.net/embed/movie/${id}`}
                            title="VidKing Player"
                            style={{
                                width: "100%",
                                height: "100%",
                                border: "none",
                            }}
                            allowFullScreen
                        />
                    </div>

                    <div>
                        <h1
                            style={{ fontSize: "2.5rem", marginBottom: "12px" }}
                        >
                            {movie.title}
                        </h1>
                        <p
                            style={{
                                color: "var(--text-secondary)",
                                fontSize: "1.1rem",
                                lineHeight: 1.6,
                            }}
                        >
                            {movie.overview}
                        </p>
                    </div>
                </div>

                {/* Right Column: Metadata */}
                <div
                    className="glass-panel"
                    style={{ width: "300px", padding: "24px", flexShrink: 0 }}
                >
                    <img
                        src={
                            movie.poster_path
                                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                                : "https://via.placeholder.com/300x450/333/8A2BE2"
                        }
                        alt={movie.title}
                        style={{
                            width: "100%",
                            borderRadius: "12px",
                            marginBottom: "24px",
                        }}
                    />

                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "16px",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                            }}
                        >
                            <div
                                style={{
                                    padding: "8px",
                                    background: "rgba(255,255,255,0.05)",
                                    borderRadius: "8px",
                                }}
                            >
                                <Star color="var(--accent-purple)" size={20} />
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

                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                            }}
                        >
                            <div
                                style={{
                                    padding: "8px",
                                    background: "rgba(255,255,255,0.05)",
                                    borderRadius: "8px",
                                }}
                            >
                                <Calendar
                                    color="var(--accent-purple)"
                                    size={20}
                                />
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
        </div>
    );
}
