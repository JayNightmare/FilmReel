import { useState, useEffect } from "react";
import { APIService } from "../services/api";
import type { Movie, Genre } from "../services/api";
import { MovieCard } from "../components/MovieCard";
import { Play, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

export default function Home() {
    const [popular, setPopular] = useState<Movie[]>([]);
    const [genres, setGenres] = useState<Genre[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [popMovies, genreList] = await Promise.all([
                    APIService.getPopularMovies(),
                    APIService.getGenres(),
                ]);
                setPopular(popMovies);
                setGenres(genreList);
            } catch (e) {
                console.error("Failed to load dashboard data.", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100%",
                }}
            >
                <div
                    className="glass-panel"
                    style={{ padding: "20px", borderRadius: "50%" }}
                >
                    <Play
                        className="animate-pulse"
                        color="var(--accent-purple)"
                        size={32}
                    />
                </div>
            </div>
        );
    }

    const featured = popular[0];

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "40px",
                paddingBottom: "60px",
            }}
        >
            {/* Featured Header */}
            {featured && (
                <section
                    className="glass-panel"
                    style={{
                        position: "relative",
                        height: "400px",
                        borderRadius: "24px",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "flex-end",
                        padding: "40px",
                    }}
                >
                    {featured.backdrop_path && (
                        <img
                            title="Backdrop"
                            src={`https://image.tmdb.org/t/p/original${featured.backdrop_path}`}
                            style={{
                                position: "absolute",
                                inset: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                zIndex: 0,
                                opacity: 0.5,
                            }}
                        />
                    )}
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background:
                                "linear-gradient(to top, var(--bg-dark), transparent)",
                            zIndex: 1,
                        }}
                    />

                    <div
                        style={{
                            position: "relative",
                            zIndex: 2,
                            maxWidth: "600px",
                        }}
                    >
                        <div
                            style={{
                                display: "inline-block",
                                background: "rgba(138,43,226,0.3)",
                                padding: "4px 12px",
                                borderRadius: "100px",
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                color: "var(--accent-purple-light)",
                                marginBottom: "12px",
                            }}
                        >
                            Trending Now
                        </div>
                        <h1
                            style={{
                                fontSize: "3rem",
                                marginBottom: "12px",
                                textShadow: "0 2px 10px rgba(0,0,0,0.5)",
                            }}
                        >
                            {featured.title}
                        </h1>
                        <p
                            style={{
                                color: "var(--text-secondary)",
                                marginBottom: "24px",
                                lineHeight: 1.6,
                                display: "-webkit-box",
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                            }}
                        >
                            {featured.overview}
                        </p>
                        <div style={{ display: "flex", gap: "16px" }}>
                            <Link
                                to={`/movie/${featured.id}`}
                                className="btn btn-primary"
                            >
                                <Play fill="white" size={20} /> Watch Now
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* Row: Popular Movies */}
            <section>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        marginBottom: "20px",
                    }}
                >
                    <TrendingUp color="var(--accent-purple)" size={24} />
                    <h2 style={{ fontSize: "1.5rem" }}>Popular Release</h2>
                </div>
                <div
                    style={{
                        display: "flex",
                        gap: "20px",
                        overflowX: "auto",
                        paddingBottom: "20px",
                        scrollSnapType: "x mandatory",
                    }}
                >
                    {popular.slice(1).map((movie) => (
                        <MovieCard key={`pop-${movie.id}`} movie={movie} />
                    ))}
                </div>
            </section>

            {/* (Mock) Row for each Genre... */}
            {genres.slice(0, 3).map((genre) => (
                <section key={genre.id}>
                    <h2 style={{ fontSize: "1.5rem", marginBottom: "20px" }}>
                        {genre.name}
                    </h2>
                    <div
                        style={{
                            display: "flex",
                            gap: "20px",
                            overflowX: "auto",
                            paddingBottom: "20px",
                        }}
                    >
                        {popular.map((movie) => (
                            <MovieCard
                                key={`g${genre.id}-${movie.id}`}
                                movie={{ ...movie, id: movie.id + genre.id }}
                            />
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}
