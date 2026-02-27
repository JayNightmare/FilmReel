import { useState } from "react";
import { Link } from "react-router-dom";
import type { Movie, TVShow } from "../services/api";
import { GenreMap } from "../services/genreMap";
import { StorageService } from "../services/storage";
import "../styles/MovieCard.css";

const FALLBACK_POSTER =
	"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 500 750' fill='none'%3E%3Crect width='500' height='750' fill='%231a1122'/%3E%3Ctext x='250' y='340' text-anchor='middle' fill='%237f13ec' font-family='system-ui' font-size='40' font-weight='bold'%3EFilmReel%3C/text%3E%3Ctext x='250' y='400' text-anchor='middle' fill='%23666' font-family='system-ui' font-size='20'%3ENo Poster%3C/text%3E%3C/svg%3E";

interface MovieCardProps {
	movie: Movie | TVShow;
	mediaType?: "movie" | "tv";
}

export const MovieCard = ({ movie, mediaType = "movie" }: MovieCardProps) => {
	const [saved, setSaved] = useState(() =>
		StorageService.isInWatchlist(movie.id),
	);

	const title =
		mediaType === "tv"
			? (movie as TVShow).name
			: (movie as Movie).title;
	const releaseDate =
		mediaType === "tv"
			? (movie as TVShow).first_air_date
			: (movie as Movie).release_date;
	const linkPath =
		mediaType === "tv" ? `/tv/${movie.id}` : `/movie/${movie.id}`;

	const imageUrl = movie.poster_path
		? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
		: FALLBACK_POSTER;

	const genreName = movie.genre_ids?.[0]
		? GenreMap.getName(movie.genre_ids[0])
		: "Film";
	const isWatched = StorageService.hasWatched(movie.id);

	const toggleWatchlist = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (saved) {
			StorageService.removeFromWatchlist(movie.id);
			setSaved(false);
		} else {
			StorageService.addToWatchlist({
				id: movie.id,
				title,
				poster_path: movie.poster_path,
				mediaType,
			});
			setSaved(true);
		}
	};

	const removeWatchedMovie = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		StorageService.removeWatchedMovie(movie.id);
	};

	return (
		<Link to={linkPath} className="movie-card group">
			<div className="movie-card-inner">
				<img
					src={imageUrl}
					alt={title}
					className="movie-poster"
					onError={(e) => {
						(
							e.target as HTMLImageElement
						).src = FALLBACK_POSTER;
					}}
				/>
				<div className="movie-overlay" />

				<div className="media-type-badge">
					{mediaType === "tv" ? "TV" : "Film"}
				</div>

				<div className="movie-card-controls">
					{isWatched && (
						<button
							className="movie-remove"
							onClick={
								removeWatchedMovie
							}
							title="Remove from History"
						>
							<span className="material-symbols-outlined">
								delete
							</span>
						</button>
					)}
					<button
						className={`movie-bookmark ${saved ? "active" : ""}`}
						onClick={toggleWatchlist}
						title={
							saved
								? "Remove from Watchlist"
								: "Add to Watchlist"
						}
					>
						<span className="material-symbols-outlined">
							{saved
								? "bookmark_added"
								: "bookmark_add"}
						</span>
					</button>
				</div>

				<div className="movie-info">
					<h4 className="movie-title truncate">
						{title}
					</h4>
					<p className="movie-year">
						{genreName} •{" "}
						{releaseDate
							? new Date(
									releaseDate,
								).getFullYear()
							: "Unknown Year"}
					</p>
				</div>
			</div>
		</Link>
	);
};
