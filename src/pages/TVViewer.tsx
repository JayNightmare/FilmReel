import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { APIService } from "../services/api";
import type { TVShow, Season, Episode, CastMember } from "../services/api";
import { StorageService } from "../services/storage";
import { MovieCard } from "../components/MovieCard";
import { useFeedback } from "../contexts/FeedbackContext";
import "../styles/TVViewer.css";

type Provider = "vidking" | "vidsrc" | "superembed";

const FALLBACK_POSTER =
	"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 500 750' fill='none'%3E%3Crect width='500' height='750' fill='%231a1122'/%3E%3Ctext x='250' y='340' text-anchor='middle' fill='%237f13ec' font-family='system-ui' font-size='40' font-weight='bold'%3EFilmReel%3C/text%3E%3Ctext x='250' y='400' text-anchor='middle' fill='%23666' font-family='system-ui' font-size='20'%3ENo Poster%3C/text%3E%3C/svg%3E";

const TVViewer = () => {
	const { id } = useParams<{ id: string }>();
	const [show, setShow] = useState<TVShow | null>(null);
	const [season, setSeason] = useState<Season | null>(null);
	const [selectedSeason, setSelectedSeason] = useState(1);
	const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(
		null,
	);
	const [playing, setPlaying] = useState(false);
	const [provider, setProvider] = useState<Provider>("vidking");
	const [cast, setCast] = useState<CastMember[]>([]);
	const [similar, setSimilar] = useState<TVShow[]>([]);
	const [inWatchlist, setInWatchlist] = useState(false);
	const { openFeedback } = useFeedback();
	const [iframeKey, setIframeKey] = useState(0);
	const [loading, setLoading] = useState(true);
	const iframeContainerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!id) return;
		const tvId = parseInt(id, 10);

		const fetchData = async () => {
			setLoading(true);
			try {
				const [details, credits, similarShows] =
					await Promise.all([
						APIService.getTVDetails(tvId),
						APIService.getTVCredits(tvId),
						APIService.getSimilarTV(tvId),
					]);
				setShow(details);
				setCast(credits.slice(0, 10));
				setSimilar(similarShows.slice(0, 12));
				setInWatchlist(
					StorageService.isInWatchlist(tvId),
				);

				// Find the first valid season (skip "Specials" season 0)
				const firstSeason = details.seasons?.find(
					(s) => s.season_number > 0,
				);
				if (firstSeason) {
					setSelectedSeason(
						firstSeason.season_number,
					);
				}
			} catch (err) {
				console.error("Failed to load TV show:", err);
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, [id]);

	useEffect(() => {
		if (!id) return;
		const tvId = parseInt(id, 10);

		const fetchSeason = async () => {
			try {
				const data = await APIService.getSeasonDetails(
					tvId,
					selectedSeason,
				);
				setSeason(data);
				// Auto-select first episode
				if (data.episodes && data.episodes.length > 0) {
					setSelectedEpisode(data.episodes[0]);
				}
			} catch (err) {
				console.error("Failed to load season:", err);
			}
		};
		fetchSeason();
	}, [id, selectedSeason]);

	const refreshIframe = () => setIframeKey((k) => k + 1);

	const toggleWatchlist = () => {
		if (!show) return;
		if (inWatchlist) {
			StorageService.removeFromWatchlist(show.id);
			setInWatchlist(false);
		} else {
			StorageService.addToWatchlist({
				id: show.id,
				title: show.name,
				poster_path: show.poster_path,
				mediaType: "tv",
			});
			setInWatchlist(true);
		}
	};

	const buildEmbedUrl = () => {
		if (!selectedEpisode) return "about:blank";
		const s = selectedEpisode.season_number;
		const e = selectedEpisode.episode_number;

		if (provider === "vidking") {
			const params = new URLSearchParams({
				color: "7f13ec",
				autoPlay: "true",
			});
			return `https://vidking.net/embed/tv/${id}/${s}/${e}?${params.toString()}`;
		} else if (provider === "vidsrc") {
			return `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}`;
		} else if (provider === "superembed") {
			return `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1&s=${s}&e=${e}`;
		}
		return "about:blank";
	};

	const handlePlay = () => {
		if (!selectedEpisode) return;
		setPlaying(true);
		StorageService.markAsWatched(parseInt(id!, 10));
	};

	const handleNextEpisode = () => {
		if (!season?.episodes || !selectedEpisode) return;
		const currentIdx = season.episodes.findIndex(
			(ep) =>
				ep.episode_number ===
				selectedEpisode.episode_number,
		);
		if (currentIdx < season.episodes.length - 1) {
			setSelectedEpisode(season.episodes[currentIdx + 1]);
			setPlaying(false);
			setIframeKey((k) => k + 1);
		}
	};

	if (loading || !show) {
		return (
			<div className="tv-loading">
				<span className="material-symbols-outlined animate-pulse tv-loading-icon">
					live_tv
				</span>
				<p>Loading show details...</p>
			</div>
		);
	}

	const posterUrl = show.poster_path
		? `https://image.tmdb.org/t/p/w500${show.poster_path}`
		: FALLBACK_POSTER;
	const backdropUrl = show.backdrop_path
		? `https://image.tmdb.org/t/p/original${show.backdrop_path}`
		: null;

	const validSeasons =
		show.seasons?.filter((s) => s.season_number > 0) ?? [];

	return (
		<div className="tv-viewer">
			{/* Player Area */}
			<div
				className="tv-player-wrapper"
				ref={iframeContainerRef}
			>
				{backdropUrl && !playing && (
					<img
						src={backdropUrl}
						alt={show.name}
						className="tv-backdrop"
					/>
				)}

				{!playing ? (
					<div
						className="tv-splash"
						onClick={handlePlay}
					>
						<div className="tv-splash-gradient" />
						<div className="tv-splash-content">
							<div className="tv-play-circle">
								<span className="material-symbols-outlined tv-play-icon">
									play_arrow
								</span>
							</div>
							{selectedEpisode && (
								<p className="tv-splash-episode">
									S
									{
										selectedEpisode.season_number
									}
									:E
									{
										selectedEpisode.episode_number
									}{" "}
									—{" "}
									{
										selectedEpisode.name
									}
								</p>
							)}
						</div>
					</div>
				) : (
					<iframe
						key={iframeKey}
						src={buildEmbedUrl()}
						title={show.name}
						allowFullScreen
						className="tv-iframe"
					/>
				)}
			</div>

			{/* Info Section */}
			<div className="tv-info">
				<div className="tv-info-layout">
					<div className="tv-info-main">
						<h1 className="tv-title">
							{show.name}
						</h1>

						{/* Mobile action row */}
						<div className="tv-mobile-actions">
							<button
								className="tv-action-btn"
								onClick={() => {
									navigator
										.share?.(
											{
												title: show.name,
												url: window
													.location
													.href,
											},
										)
										.catch(
											() => {
												navigator.clipboard.writeText(
													window
														.location
														.href,
												);
											},
										);
								}}
								title="Share"
							>
								<span className="material-symbols-outlined">
									share
								</span>
								Share
							</button>
							<button
								className={`tv-action-btn ${inWatchlist ? "active" : ""}`}
								onClick={
									toggleWatchlist
								}
								title={
									inWatchlist
										? "In Watchlist"
										: "Add to Watchlist"
								}
							>
								<span className="material-symbols-outlined">
									{inWatchlist
										? "bookmark_added"
										: "bookmark_add"}
								</span>
								{inWatchlist
									? "Saved"
									: "Watchlist"}
							</button>
						</div>

						<p className="tv-overview">
							{show.overview ||
								"No synopsis available."}
						</p>

						{/* Season & Episode Selector */}
						<div className="tv-season-selector">
							<label className="tv-season-label">
								Season
							</label>
							<select
								className="tv-season-select"
								value={
									selectedSeason
								}
								title="Select Season"
								onChange={(
									e,
								) => {
									setSelectedSeason(
										Number(
											e
												.target
												.value,
										),
									);
									setPlaying(
										false,
									);
								}}
							>
								{validSeasons.map(
									(s) => (
										<option
											key={
												s.season_number
											}
											value={
												s.season_number
											}
										>
											{
												s.name
											}{" "}
											(
											{
												s.episode_count
											}{" "}
											eps)
										</option>
									),
								)}
							</select>
						</div>

						{/* Episode Grid */}
						{season?.episodes && (
							<div className="tv-episode-grid">
								{season.episodes.map(
									(
										ep,
									) => (
										<button
											key={
												ep.id
											}
											className={`tv-episode-card glass-panel ${
												selectedEpisode?.id ===
												ep.id
													? "active"
													: ""
											}`}
											onClick={() => {
												setSelectedEpisode(
													ep,
												);
												setPlaying(
													false,
												);
											}}
										>
											<div className="tv-episode-thumb">
												{ep.still_path ? (
													<img
														src={`https://image.tmdb.org/t/p/w300${ep.still_path}`}
														alt={
															ep.name
														}
														loading="lazy"
													/>
												) : (
													<div className="tv-episode-placeholder">
														<span className="material-symbols-outlined">
															movie
														</span>
													</div>
												)}
												<span className="tv-episode-number">
													E
													{
														ep.episode_number
													}
												</span>
											</div>
											<div className="tv-episode-meta">
												<h4 className="tv-episode-name truncate">
													{
														ep.name
													}
												</h4>
												{ep.runtime && (
													<span className="tv-episode-runtime">
														{
															ep.runtime
														}
														m
													</span>
												)}
											</div>
										</button>
									),
								)}
							</div>
						)}

						{/* Next Episode */}
						{playing &&
							selectedEpisode &&
							season?.episodes &&
							selectedEpisode.episode_number <
								season.episodes
									.length && (
								<button
									className="btn btn-primary tv-next-btn"
									onClick={
										handleNextEpisode
									}
								>
									<span className="material-symbols-outlined">
										skip_next
									</span>
									Next
									Episode
								</button>
							)}

						{/* Having Issues? */}
						<div className="tv-mobile-issues">
							<span className="tv-issues-label">
								Having issues?
							</span>
							<button
								className="tv-action-btn"
								onClick={
									refreshIframe
								}
								title="Refresh player"
							>
								<span className="material-symbols-outlined">
									refresh
								</span>
								Refresh
							</button>
							<button
								className="tv-action-btn"
								onClick={() =>
									openFeedback(
										show.name,
									)
								}
								title="Submit Feedback"
							>
								<span className="material-symbols-outlined">
									feedback
								</span>
								Feedback
							</button>
						</div>

						{/* Cast */}
						{cast.length > 0 && (
							<div className="tv-cast-section animate-fade-in-up">
								<h3 className="tv-cast-title">
									Top Cast
								</h3>
								<div className="tv-cast-carousel">
									{cast.map(
										(
											actor,
										) => (
											<Link
												key={
													actor.id
												}
												to={`/search?searchCategory=actor&q=${encodeURIComponent(actor.name)}&with_people=${actor.id}&actor_name=${encodeURIComponent(actor.name)}`}
												className="tv-cast-card glass-panel"
											>
												<div className="tv-cast-avatar">
													{actor.profile_path ? (
														<img
															src={`https://image.tmdb.org/t/p/w200${actor.profile_path}`}
															alt={
																actor.name
															}
															loading="lazy"
														/>
													) : (
														<span className="material-symbols-outlined">
															person
														</span>
													)}
												</div>
												<span className="tv-cast-name truncate">
													{
														actor.name
													}
												</span>
												<span className="tv-cast-character truncate">
													{
														actor.character
													}
												</span>
											</Link>
										),
									)}
								</div>
							</div>
						)}

						{/* Similar Shows */}
						{similar.length > 0 && (
							<div className="tv-similar-section animate-fade-in-up">
								<h3 className="tv-similar-title">
									You
									Might
									Also
									Like
								</h3>
								<div className="carousel-container">
									{similar.map(
										(
											s,
										) => (
											<MovieCard
												key={
													s.id
												}
												movie={
													s
												}
												mediaType="tv"
											/>
										),
									)}
								</div>
							</div>
						)}
					</div>

					{/* Sidebar */}
					<div className="glass-panel tv-sidebar">
						<img
							src={posterUrl}
							alt={show.name}
							className="tv-poster"
							onError={(e) => {
								(
									e.target as HTMLImageElement
								).src =
									FALLBACK_POSTER;
							}}
						/>

						<button
							className={`btn ${inWatchlist ? "btn-glass" : "btn-primary"} tv-watchlist-btn`}
							onClick={
								toggleWatchlist
							}
						>
							<span className="material-symbols-outlined">
								{inWatchlist
									? "bookmark_added"
									: "bookmark_add"}
							</span>
							{inWatchlist
								? "In Watchlist"
								: "Add to Watchlist"}
						</button>

						<div className="tv-meta-list">
							<div className="tv-meta-item">
								<span className="material-symbols-outlined text-purple">
									router
								</span>
								<div className="tv-meta-content">
									<span className="label-glass tv-meta-label">
										Source
										Provider
									</span>
									<select
										className="tv-provider-select"
										value={
											provider
										}
										onChange={(
											e,
										) => {
											setProvider(
												e
													.target
													.value as Provider,
											);
											setPlaying(
												false,
											);
										}}
										title="Select Streaming Provider"
									>
										<option value="vidking">
											VidKing
											(Recommended)
										</option>
										<option value="vidsrc">
											VidSrc
										</option>
										<option value="superembed">
											SuperEmbed
										</option>
									</select>
								</div>
							</div>

							<div className="tv-meta-item">
								<span className="material-symbols-outlined text-purple">
									star
								</span>
								<div>
									<span className="label-glass tv-meta-label">
										Rating
									</span>
									<span className="tv-meta-value">
										{show.vote_average.toFixed(
											1,
										)}{" "}
										/
										10
									</span>
								</div>
							</div>

							<div className="tv-meta-item">
								<span className="material-symbols-outlined text-purple">
									calendar_today
								</span>
								<div>
									<span className="label-glass tv-meta-label">
										First
										Aired
									</span>
									<span className="tv-meta-value">
										{show.first_air_date
											? new Date(
													show.first_air_date,
												).toLocaleDateString(
													"en-US",
													{
														year: "numeric",
														month: "long",
														day: "numeric",
													},
												)
											: "Unknown"}
									</span>
								</div>
							</div>

							{show.number_of_seasons && (
								<div className="tv-meta-item">
									<span className="material-symbols-outlined text-purple">
										layers
									</span>
									<div>
										<span className="label-glass tv-meta-label">
											Seasons
										</span>
										<span className="tv-meta-value">
											{
												show.number_of_seasons
											}
										</span>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default TVViewer;
