import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import type { Movie } from "../services/api";

export const MovieCard = ({ movie }: { movie: Movie }) => {
    const imageUrl = movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : "https://via.placeholder.com/500x750/333/8A2BE2?text=FilmReel";

    return (
        <Link
            to={`/movie/${movie.id}`}
            className="glass-panel group relative overflow-hidden transition-all duration-300 transform hover:scale-105 hover:z-10"
            style={{
                display: "block",
                width: "200px",
                flexShrink: 0,
                aspectRatio: "2/3",
                borderRadius: "16px",
                position: "relative",
            }}
        >
            <img
                src={imageUrl}
                alt={movie.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />

            {/* Hover Overlay */}
            <div
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4 text-center"
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background:
                        "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    padding: "20px",
                    opacity: 0,
                    transition: "opacity 0.3s ease",
                }}
                // Using inline styles for hover state is tricky in pure React without styled-components,
                // but we can rely on standard CSS structural pseudo-classes if we added them.
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
            >
                <div
                    style={{
                        background: "var(--accent-purple)",
                        borderRadius: "50%",
                        width: "48px",
                        height: "48px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "10px",
                        boxShadow: "0 4px 15px var(--accent-purple-glow)",
                    }}
                >
                    <Play fill="white" size={24} />
                </div>
                <h3
                    style={{
                        fontSize: "1rem",
                        fontWeight: 700,
                        margin: "0 0 5px 0",
                    }}
                >
                    {movie.title}
                </h3>
                <span
                    style={{
                        fontSize: "0.8rem",
                        color: "var(--text-secondary)",
                    }}
                >
                    {new Date(movie.release_date).getFullYear()} • ★{" "}
                    {movie.vote_average.toFixed(1)}
                </span>
            </div>
        </Link>
    );
};
