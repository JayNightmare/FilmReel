/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { StorageService } from "../services/storage";
import { APIService } from "../services/api";
import type { Movie, TVShow } from "../services/api";
import { MovieCard } from "../components/MovieCard";
import "../styles/MoodSurvey.css";

type MediaResult = (Movie | TVShow) & { mediaType: "movie" | "tv" };

// Base Questions
const BASE_QUESTIONS = [
	{
		question: "How are you feeling?",
		options: [
			{ text: "Energetic", weights: { 28: 3, 878: 2 } }, // Action, Sci-Fi
			{ text: "Chill", weights: { 35: 3, 10749: 2 } }, // Comedy, Romance
			{ text: "Adventurous", weights: { 12: 4, 14: 3 } }, // Adventure, Fantasy
			{ text: "Melancholic", weights: { 18: 4 } }, // Drama
		],
	},
	{
		question: "Ideal setting?",
		options: [
			{ text: "Space", weights: { 878: 4 } }, // SciFi
			{ text: "City", weights: { 28: 2, 80: 3 } }, // Action, Crime
			{ text: "Nature", weights: { 12: 3, 14: 2 } }, // Adventure, Fantasy
			{ text: "Anywhere", weights: { 35: 2, 10749: 2 } }, // Comedy, Romance
		],
	},
	{
		question: "Desired impact?",
		options: [
			{ text: "Laughter", weights: { 35: 5 } }, // Comedy
			{ text: "Tears", weights: { 18: 4, 10749: 3 } }, // Drama, Romance
			{ text: "Adrenaline", weights: { 28: 4, 53: 3 } }, // Action, Thriller
			{ text: "Fear", weights: { 27: 5 } }, // Horror
		],
	},
];

// Extended Questions for deeper keyword/sentiment matching
const EXT_QUESTIONS = [
	{
		question: "Pacing preference?",
		options: [
			{ text: "Fast", keyword: "fast" },
			{ text: "Slow-burn", keyword: "slow" },
			{ text: "Steady", keyword: "steady" },
		],
	},
	{
		question: "Tone?",
		options: [
			{ text: "Dark", keyword: "dark" },
			{ text: "Lighthearted", keyword: "light" },
			{ text: "Gritty", keyword: "gritty" },
		],
	},
	{
		question: "Ending vibe?",
		options: [
			{ text: "Twist", keyword: "twist" },
			{ text: "Happy", keyword: "happy" },
			{ text: "Ambiguous", keyword: "ambiguous" },
		],
	},
];

const GENRE_NAMES: Record<number, string> = {
	28: "Action",
	12: "Adventure",
	16: "Animation",
	35: "Comedy",
	80: "Crime",
	99: "Documentary",
	18: "Drama",
	10751: "Family",
	14: "Fantasy",
	36: "History",
	27: "Horror",
	10402: "Music",
	9648: "Mystery",
	10749: "Romance",
	878: "Science Fiction",
	10770: "TV Movie",
	53: "Thriller",
	10752: "War",
	37: "Western",
};

export default function MoodSurvey() {
	const [step, setStep] = useState(0);
	const [scores, setScores] = useState<Record<number, number>>({});
	const [keywords, setKeywords] = useState<string[]>([]);

	// UI States
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [analyzingProgress, setAnalyzingProgress] = useState(0);
	const [analyzingText, setAnalyzingText] = useState("");

	const [showResults, setShowResults] = useState(false);
	const [isExtendedMode, setIsExtendedMode] = useState(false);

	// Data States
	const [baseMovies, setBaseMovies] = useState<MediaResult[]>([]);
	const [resultMovies, setResultMovies] = useState<MediaResult[]>([]);
	const [winningGenre, setWinningGenre] = useState<{
		id: number;
		name: string;
	} | null>(null);

	// -- Base Survey Logic --
	const handleSelectBase = (weights: Partial<Record<number, number>>) => {
		const newScores = { ...scores };
		Object.entries(weights).forEach(([genreId, weight]) => {
			if (weight !== undefined) {
				const id = parseInt(genreId);
				newScores[id] = (newScores[id] || 0) + weight;
			}
		});
		setScores(newScores);

		if (step < BASE_QUESTIONS.length - 1) {
			setStep((s) => s + 1);
		} else {
			// Trigger calculation
			simulateAnalysis(newScores, false);
		}
	};

	// -- Extended Survey Logic --
	const handleSelectExt = (keyword: string) => {
		const newKeywords = [...keywords, keyword];
		setKeywords(newKeywords);

		if (step < BASE_QUESTIONS.length + EXT_QUESTIONS.length - 1) {
			setStep((s) => s + 1);
		} else {
			// Trigger secondary calculation
			simulateAnalysis(scores, true, newKeywords);
		}
	};

	// -- Analysis / Loading Sequence --
	const simulateAnalysis = (
		finalScores: Record<number, number>,
		isExt: boolean,
		selectedKeywords: string[] = [],
	) => {
		setStep(
			isExt
				? BASE_QUESTIONS.length + EXT_QUESTIONS.length
				: BASE_QUESTIONS.length,
		);
		setShowResults(false);
		setIsAnalyzing(true);
		setAnalyzingProgress(0);
		setAnalyzingText(
			isExt
				? "Cross-referencing reviews..."
				: "Analyzing vibe inputs...",
		);

		const duration = Math.floor(Math.random() * 3000) + 2000; // 2-5 seconds
		const steps = 20;
		const intervalMs = duration / steps;
		let currentStep = 0;

		const timer = setInterval(() => {
			currentStep++;
			setAnalyzingProgress(
				Math.floor((currentStep / steps) * 100),
			);

			if (currentStep === Math.floor(steps * 0.5)) {
				setAnalyzingText("Consulting the film gods...");
			}
			if (currentStep === Math.floor(steps * 0.8)) {
				setAnalyzingText(
					"Formatting recommendations...",
				);
			}

			if (currentStep >= steps) {
				clearInterval(timer);
				setAnalyzingText("Thinking...");

				// Keep "Thinking..." for 1 second, then process results
				setTimeout(() => {
					if (isExt) {
						processExtendedResults(
							selectedKeywords,
						);
					} else {
						processBaseResults(finalScores);
					}
				}, 1000);
			}
		}, intervalMs);
	};

	const processBaseResults = async (
		finalScores: Record<number, number>,
	) => {
		try {
			const historyPrefs = StorageService.getHistoricalGenrePreferences();
			const blendedScores: Record<number, number> = {};

			let maxSurvey = 0;
			Object.values(finalScores).forEach(s => { if (s > maxSurvey) maxSurvey = s; });
			let maxHistory = 0;
			Object.values(historyPrefs).forEach(s => { if (s > maxHistory) maxHistory = s; });

			const allKeys = new Set([...Object.keys(finalScores), ...Object.keys(historyPrefs)]);
			
			let maxBlended = -1;
			let topGenre = 28;

			allKeys.forEach(key => {
				const gid = parseInt(key, 10);
				const sScore = maxSurvey > 0 ? (finalScores[gid] || 0) / maxSurvey : 0;
				const hScore = maxHistory > 0 ? (historyPrefs[gid] || 0) / maxHistory : 0;
				
				// 80% survey, 20% history
				const blended = (sScore * 0.8) + (hScore * 0.2);
				blendedScores[gid] = blended;

				if (blended > maxBlended) {
					maxBlended = blended;
					topGenre = gid;
				}
			});

			const genreName = GENRE_NAMES[topGenre] || "Movies";
			
			const [movieData, tvData] = await Promise.all([
				APIService.discoverMovies({ with_genres: topGenre.toString(), sort_by: "popularity.desc" }),
				APIService.discoverTV({ with_genres: topGenre.toString(), sort_by: "popularity.desc" })
			]);

			const moviesTagged = movieData.map(m => ({ ...m, mediaType: "movie" as const }));
			const tvTagged = tvData.map(t => ({ ...t, mediaType: "tv" as const }));
			
			const interleaved: MediaResult[] = [];
			const maxLength = Math.max(moviesTagged.length, tvTagged.length);
			for (let i = 0; i < maxLength; i++) {
				if (moviesTagged[i]) interleaved.push(moviesTagged[i]);
				if (tvTagged[i]) interleaved.push(tvTagged[i]);
			}

			setBaseMovies(interleaved);
			setResultMovies(interleaved);
			setWinningGenre({ id: topGenre, name: genreName });

			StorageService.addMoodResult({
				date: new Date().toISOString(),
				recommendedGenreId: topGenre,
				moodLabel: `Feeling ${genreName}`,
			});

			setIsAnalyzing(false);
			setShowResults(true);
		} catch (e) {
			console.error(e);
			setIsAnalyzing(false);
		}
	};

	const processExtendedResults = async (currentKeywords: string[]) => {
		// Simple sentiment matching: we take the base movies and try to fetch reviews
		// Since fetching reviews for 20 movies takes a while, we take top 10 to speed up
		try {
			const candidates = baseMovies.slice(0, 10);
			const matches: { media: MediaResult; score: number }[] = [];

			for (const m of candidates) {
				let reviewText = "";
				if (m.mediaType === "movie") {
					const reviews = await APIService.getMovieReviews(m.id);
					reviewText = reviews.map((r) => r.content.toLowerCase()).join(" ");
				}

				let score = 0;
				currentKeywords.forEach((kw) => {
					if (
						reviewText.includes(
							kw.toLowerCase(),
						)
					) {
						score++;
					}
				});

				matches.push({ media: m, score });
			}

			// Sort by sentiment match score, fallback to popularity if 0
			matches.sort((a, b) => b.score - a.score);

			// Re-order the results based on matches
			const newResults = [
				...matches.map((m) => m.media),
				...baseMovies.slice(10), // append rest
			];

			setResultMovies(newResults);
			setIsAnalyzing(false);
			setShowResults(true);
		} catch (e) {
			console.error(e);
			setIsAnalyzing(false);
			setShowResults(true); // Fallback to base results
		}
	};

	const extendSurvey = () => {
		setIsExtendedMode(true);
		setStep(BASE_QUESTIONS.length);
		setShowResults(false);
	};

	const reset = () => {
		setStep(0);
		setScores({});
		setKeywords([]);
		setIsExtendedMode(false);
		setShowResults(false);
		setIsAnalyzing(false);
		setBaseMovies([]);
		setResultMovies([]);
		setWinningGenre(null);
	};

	// --- RENDER LOGIC ---

	// 1. Analyzing Screen
	if (isAnalyzing) {
		return (
			<div className="mood-container">
				<div className="mood-analyzing-card glass-panel">
					<div className="mood-spinner"></div>
					<h2 className="mood-analyzing-title">
						{analyzingText}
					</h2>
					<div className="mood-progress-track">
						<div
							className="mood-progress-fill"
							style={{
								width: `${analyzingProgress}%`,
							}}
						/>
					</div>
					<p className="mood-progress-text">
						{analyzingProgress}%
					</p>
				</div>
			</div>
		);
	}

	// 2. Results Screen
	if (showResults) {
		return (
			<div
				className={`mood-container ${showResults ? "wide-mode" : ""}`}
			>
				<div className="mood-results-header">
					<h1 className="mood-results-title">
						{isExtendedMode
							? "Your Perfect Match"
							: `The vibe is ${winningGenre?.name}`}
					</h1>
					<p className="mood-results-subtitle">
						{isExtendedMode
							? "We've fine-tuned these recommendations based on reviewer sentiments."
							: "Here are some top picks based on your mood. Want even more specific results?"}
					</p>
					<div className="mood-results-actions">
						{!isExtendedMode && (
							<button
								onClick={
									extendSurvey
								}
								className="mood-btn-primary"
							>
								<span className="material-symbols-outlined">
									tune
								</span>
								Extend Survey
							</button>
						)}
						<button
							onClick={reset}
							className="mood-btn-secondary"
						>
							<span className="material-symbols-outlined">
								restart_alt
							</span>
							Start Over
						</button>
					</div>
				</div>

				{resultMovies.length > 0 ? (
					<div className="mood-results-grid">
						{resultMovies.map((m) => (
							<MovieCard
								key={`${m.mediaType}-${m.id}`}
								movie={m}
								mediaType={m.mediaType}
							/>
						))}
					</div>
				) : (
					<div className="mood-no-results">
						<span className="material-symbols-outlined">
							sentiment_dissatisfied
						</span>
						<p>
							No matches found. Try
							extending the survey or
							starting over.
						</p>
					</div>
				)}
			</div>
		);
	}

	// 3. Question Screen
	const isExt = step >= BASE_QUESTIONS.length;
	const currentList = isExt ? EXT_QUESTIONS : BASE_QUESTIONS;
	const currentQIdx = isExt ? step - BASE_QUESTIONS.length : step;

	// Safety check
	if (currentQIdx < 0 || currentQIdx >= currentList.length) {
		return null;
	}

	const { question, options } = currentList[currentQIdx];
	const totalSteps = isExtendedMode
		? BASE_QUESTIONS.length + EXT_QUESTIONS.length
		: BASE_QUESTIONS.length;
	const displayStep = step + 1;
	const progressPercent = (displayStep / totalSteps) * 100;

	return (
		<div className="mood-container">
			<div className="mood-tracker">
				<div className="mood-tracker-text">
					Question {displayStep} of {totalSteps}
				</div>
				<div className="mood-tracker-bar">
					<div
						className="mood-tracker-fill"
						style={{
							width: `${progressPercent}%`,
						}}
					/>
				</div>
			</div>

			<div className="mood-question-card glass-panel animate-fade-in-up">
				<h2 className="mood-question-title">
					{question}
				</h2>
				<div className="mood-options-grid">
					{options.map((opt, i) => (
						<button
							key={i}
							className="mood-option-btn glass-panel"
							onClick={() => {
								if (isExt) {
									handleSelectExt(
										(
											opt as any
										)
											.keyword,
									);
								} else {
									handleSelectBase(
										(
											opt as any
										)
											.weights,
									);
								}
							}}
						>
							{opt.text}
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
