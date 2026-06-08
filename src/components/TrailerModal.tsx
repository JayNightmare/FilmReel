import { useEffect, useCallback } from "react";
import type { VideoResult } from "../services/api";
import "../styles/TrailerModal.css";

interface TrailerModalProps {
	videos: VideoResult[];
	title: string;
	onClose: () => void;
}

/**
 * Picks the best trailer from a list of TMDB video results.
 * Priority: Official YouTube Trailer > any YouTube Trailer > first YouTube video.
 */
const pickBestTrailer = (videos: VideoResult[]): VideoResult | null => {
	const youtubeVideos = videos.filter((v) => v.site === "YouTube");
	if (youtubeVideos.length === 0) return null;

	const officialTrailer = youtubeVideos.find(
		(v) => v.type === "Trailer" && v.official,
	);
	if (officialTrailer) return officialTrailer;

	const anyTrailer = youtubeVideos.find((v) => v.type === "Trailer");
	if (anyTrailer) return anyTrailer;

	const teaser = youtubeVideos.find((v) => v.type === "Teaser");
	if (teaser) return teaser;

	return youtubeVideos[0];
};

export const TrailerModal = ({ videos, title, onClose }: TrailerModalProps) => {
	const trailer = pickBestTrailer(videos);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		},
		[onClose],
	);

	useEffect(() => {
		document.addEventListener("keydown", handleKeyDown);
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			document.body.style.overflow = "";
		};
	}, [handleKeyDown]);

	if (!trailer) {
		return (
			<div className="trailer-modal-overlay" onClick={onClose}>
				<div
					className="trailer-modal glass-panel"
					onClick={(e) => e.stopPropagation()}
				>
					<div className="trailer-modal-header">
						<h2>No Trailer Available</h2>
						<button
							className="trailer-modal-close"
							onClick={onClose}
							title="Close"
						>
							<span className="material-symbols-outlined">
								close
							</span>
						</button>
					</div>
					<p className="trailer-modal-empty">
						No official trailer was found for{" "}
						<strong>{title}</strong>.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="trailer-modal-overlay" onClick={onClose}>
			<div
				className="trailer-modal"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="trailer-modal-header">
					<div className="trailer-modal-title-group">
						<span className="material-symbols-outlined trailer-modal-icon">
							play_circle
						</span>
						<div>
							<h2>{title}</h2>
							<span className="trailer-modal-label">
								{trailer.name}
							</span>
						</div>
					</div>
					<button
						className="trailer-modal-close"
						onClick={onClose}
						title="Close"
					>
						<span className="material-symbols-outlined">
							close
						</span>
					</button>
				</div>
				<div className="trailer-modal-player">
					<iframe
						src={`https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&rel=0`}
						title={trailer.name}
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowFullScreen
						className="trailer-iframe"
					/>
				</div>
			</div>
		</div>
	);
};
