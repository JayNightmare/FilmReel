import { useState } from "react";
import { StorageService } from "../services/storage";
import { APIService } from "../services/api";
import type { Movie } from "../services/api";
import { MovieCard } from "../components/MovieCard";

// Weighted answers mapping to TMDB Action(28), Comedy(35), Drama(18), Sci-Fi(878), Horror(27), Romance(10749)
const QUESTIONS = [
    {
        question: "How are you feeling today?",
        options: [
            { text: "Energetic and ready to go", weights: { 28: 3, 878: 2 } },
            { text: "Need a good laugh", weights: { 35: 4 } },
            {
                text: "A bit thoughtful or melancholic",
                weights: { 18: 4, 10749: 2 },
            },
            { text: "Want to be thrilled", weights: { 27: 4, 878: 1 } },
        ],
    },
    {
        question: "What's your ideal setting right now?",
        options: [
            { text: "Outer space or the future", weights: { 878: 5 } },
            { text: "A bustling modern city", weights: { 28: 2, 35: 1 } },
            { text: "A quiet, cozy room", weights: { 18: 3, 10749: 3 } },
            { text: "A haunted mansion", weights: { 27: 5 } },
        ],
    },
    {
        question: "Choose a snack companion:",
        options: [
            {
                text: "Popcorn (The classic experience)",
                weights: { 28: 2, 35: 2 },
            },
            { text: "Ice Cream (Comforting)", weights: { 18: 3, 10749: 3 } },
            { text: "Leftover Pizza (Casual)", weights: { 35: 3 } },
            { text: "Candy (High sugar rush)", weights: { 878: 2, 27: 2 } },
        ],
    },
    {
        question: "How much time do you have?",
        options: [
            { text: "Just a quick watch", weights: { 35: 3, 27: 1 } },
            { text: "I have the whole evening", weights: { 18: 2, 878: 2 } },
            { text: "Depends how good it is", weights: { 28: 2 } },
            { text: "Time is an illusion", weights: { 878: 4 } },
        ],
    },
    {
        question: "What kind of ending do you want?",
        options: [
            { text: "Explosions and victory", weights: { 28: 4 } },
            { text: "Tears of joy or sadness", weights: { 18: 4, 10749: 3 } },
            { text: "A complete mind-bender", weights: { 878: 4, 27: 2 } },
            { text: "A good laugh", weights: { 35: 5 } },
        ],
    },
];

const GENRE_NAMES: Record<number, string> = {
    28: "Action",
    35: "Comedy",
    18: "Drama",
    878: "Sci-Fi",
    27: "Horror",
    10749: "Romance",
};

export default function MoodSurvey() {
    const [step, setStep] = useState(0);
    const [scores, setScores] = useState<Record<number, number>>({});
    const [resultMovies, setResultMovies] = useState<Movie[]>([]);
    const [winningGenre, setWinningGenre] = useState<{
        id: number;
        name: string;
    } | null>(null);

    const handleSelect = (weights: Partial<Record<number, number>>) => {
        const newScores = { ...scores };
        Object.entries(weights).forEach(([genreId, weight]) => {
            if (weight !== undefined) {
                const id = parseInt(genreId);
                newScores[id] = (newScores[id] || 0) + weight;
            }
        });
        setScores(newScores);

        if (step < QUESTIONS.length - 1) {
            setStep(step + 1);
        } else {
            calculateResult(newScores);
        }
    };

    const calculateResult = async (finalScores: Record<number, number>) => {
        try {
            // Find highest scoring genre
            let maxScore = -1;
            let topGenre = 28; // fallback action

            Object.entries(finalScores).forEach(([genreId, score]) => {
                if (score > maxScore) {
                    maxScore = score;
                    topGenre = parseInt(genreId);
                }
            });

            const movies = await APIService.getMoviesByGenre(topGenre);
            setResultMovies(movies);
            setWinningGenre({
                id: topGenre,
                name: GENRE_NAMES[topGenre] || "Movies",
            });

            // Save to history
            StorageService.addMoodResult({
                date: new Date().toISOString(),
                recommendedGenreId: topGenre,
                moodLabel: `Feeling ${GENRE_NAMES[topGenre] || "Adventurous"}`,
            });

            setStep(QUESTIONS.length);
        } catch (e) {
            console.error(e);
        }
    };

    const reset = () => {
        setStep(0);
        setScores({});
        setResultMovies([]);
        setWinningGenre(null);
    };

    // --- RESULTS VIEW ---
    if (step === QUESTIONS.length) {
        return (
            <div
                className="animate-in fade-in"
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "40px",
                }}
            >
                <div
                    style={{
                        textAlign: "center",
                        maxWidth: "600px",
                        margin: "0 auto",
                        padding: "40px",
                    }}
                    className="glass-panel"
                >
                    <div
                        style={{
                            display: "inline-flex",
                            padding: "16px",
                            background: "var(--accent-purple)",
                            borderRadius: "50%",
                            marginBottom: "24px",
                            boxShadow: "0 0 30px var(--accent-purple-glow)",
                        }}
                    >
                        <span
                            className="material-symbols-outlined"
                            style={{ fontSize: "40px", color: "white" }}
                        >
                            auto_awesome
                        </span>
                    </div>
                    <h1 style={{ fontSize: "2.5rem", marginBottom: "16px" }}>
                        Your Vibe is{" "}
                        <span className="text-gradient hover:text-white transition-colors cursor-default">
                            {winningGenre?.name}
                        </span>
                    </h1>
                    <p
                        style={{
                            color: "var(--text-secondary)",
                            fontSize: "1.1rem",
                            marginBottom: "32px",
                        }}
                    >
                        We've curated these movies specifically based on your
                        current mood. Grab your snacks!
                    </p>
                    <button onClick={reset} className="btn btn-glass">
                        <span
                            className="material-symbols-outlined"
                            style={{ fontSize: "18px" }}
                        >
                            autorenew
                        </span>{" "}
                        Take Survey Again
                    </button>
                </div>

                <div>
                    <h2 style={{ fontSize: "1.5rem", marginBottom: "20px" }}>
                        Recommended for you
                    </h2>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fill, minmax(200px, 1fr))",
                            gap: "24px",
                        }}
                    >
                        {resultMovies.slice(0, 10).map((movie) => (
                            <MovieCard key={`mood-${movie.id}`} movie={movie} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // --- SURVEY VIEW ---
    const currentQ = QUESTIONS[step];
    const progress = ((step + 1) / QUESTIONS.length) * 100;

    return (
        <div
            style={{
                maxWidth: "800px",
                margin: "0 auto",
                display: "flex",
                flexDirection: "column",
                height: "100%",
                justifyContent: "center",
            }}
        >
            <div style={{ textAlign: "center", marginBottom: "60px" }}>
                <h1 style={{ fontSize: "3rem", marginBottom: "16px" }}>
                    Mood Discovery
                </h1>
                <p
                    style={{
                        color: "var(--text-secondary)",
                        fontSize: "1.1rem",
                    }}
                >
                    Answer {QUESTIONS.length} quick questions to find the
                    perfect movie.
                </p>
            </div>

            <div className="glass-panel" style={{ padding: "40px" }}>
                {/* Progress Bar */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "16px",
                        color: "var(--text-secondary)",
                        fontWeight: 600,
                    }}
                >
                    <span>
                        Question {step + 1} of {QUESTIONS.length}
                    </span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <div
                    style={{
                        width: "100%",
                        height: "8px",
                        background: "rgba(255,255,255,0.1)",
                        borderRadius: "100px",
                        marginBottom: "40px",
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            width: `${progress}%`,
                            height: "100%",
                            background:
                                "linear-gradient(90deg, #d08cff, var(--accent-purple))",
                            transition: "width 0.4s ease",
                        }}
                    />
                </div>

                {/* Question */}
                <h2
                    style={{
                        fontSize: "2rem",
                        marginBottom: "32px",
                        textAlign: "center",
                    }}
                >
                    {currentQ.question}
                </h2>

                {/* Options */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "16px",
                    }}
                >
                    {currentQ.options.map((opt, i) => (
                        <button
                            key={i}
                            onClick={() => handleSelect(opt.weights)}
                            className="glass-panel"
                            style={{
                                padding: "24px",
                                textAlign: "left",
                                fontSize: "1.1rem",
                                fontWeight: 600,
                                border: "1px solid rgba(255,255,255,0.1)",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                background: "rgba(255,255,255,0.02)",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor =
                                    "var(--accent-purple)";
                                e.currentTarget.style.background =
                                    "rgba(138,43,226,0.1)";
                                e.currentTarget.style.transform =
                                    "translateY(-2px)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor =
                                    "rgba(255,255,255,0.1)";
                                e.currentTarget.style.background =
                                    "rgba(255,255,255,0.02)";
                                e.currentTarget.style.transform =
                                    "translateY(0)";
                            }}
                        >
                            {opt.text}
                            <span
                                className="material-symbols-outlined"
                                style={{
                                    fontSize: "20px",
                                    color: "var(--accent-purple-light)",
                                }}
                            >
                                arrow_forward
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
