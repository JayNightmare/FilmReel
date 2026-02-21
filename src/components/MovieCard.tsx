import { useState } from "react";
import { Link } from "react-router-dom";
import type { Movie } from "../services/api";
import { GenreMap } from "../services/genreMap";
import { StorageService } from "../services/storage";
import "../styles/MovieCard.css";

const FALLBACK_POSTER =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 500 750' fill='none'%3E%3Crect width='500' height='750' fill='%231a1122'/%3E%3Ctext x='250' y='340' text-anchor='middle' fill='%237f13ec' font-family='system-ui' font-size='40' font-weight='bold'%3EFilmReel%3C/text%3E%3Ctext x='250' y='400' text-anchor='middle' fill='%23666' font-family='system-ui' font-size='20'%3ENo Poster%3C/text%3E%3C/svg%3E";

export const MovieCard = ({ movie }: { movie: Movie }) => {
    const [saved, setSaved] = useState(() =>
        StorageService.isInWatchlist(movie.id),
    );

    const imageUrl = movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : FALLBACK_POSTER;

    const genreName = movie.genre_ids?.[0]
        ? GenreMap.getName(movie.genre_ids[0])
        : "Film";

    const toggleWatchlist = (e: React.MouseEvent) => {
        e.preventDefault(); // Don't navigate to movie page
        e.stopPropagation();
        if (saved) {
            StorageService.removeFromWatchlist(movie.id);
            setSaved(false);
        } else {
            StorageService.addToWatchlist({
                id: movie.id,
                title: movie.title,
                poster_path: movie.poster_path,
            });
            setSaved(true);
        }
    };

    return (
        <Link to={`/movie/${movie.id}`} className="movie-card group">
            <div className="movie-card-inner">
                <img
                    src={imageUrl}
                    alt={movie.title}
                    className="movie-poster"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = FALLBACK_POSTER;
                    }}
                />
                <div className="movie-overlay" />

                <button
                    className={`movie-bookmark ${saved ? "active" : ""}`}
                    onClick={toggleWatchlist}
                    title={saved ? "Remove from Watchlist" : "Add to Watchlist"}
                >
                    <span className="material-symbols-outlined">
                        {saved ? "bookmark_added" : "bookmark_add"}
                    </span>
                </button>

                <div className="movie-info">
                    <h4 className="movie-title truncate">{movie.title}</h4>
                    <p className="movie-year">
                        {genreName} •{" "}
                        {movie.release_date
                            ? new Date(movie.release_date).getFullYear()
                            : "Unknown Year"}
                    </p>
                </div>
            </div>
        </Link>
    );
};
