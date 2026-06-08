import dotenv from "dotenv";
dotenv.config();

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

async function fetchTMDB(endpoint, params = {}) {
    const queryParams = new URLSearchParams({
        api_key: TMDB_API_KEY,
        language: "en-US",
        ...params,
    });
    const response = await fetch(`${BASE_URL}${endpoint}?${queryParams}`);
    if (!response.ok) {
        throw new Error(`TMDB API Error: ${response.statusText}`);
    }
    return response.json();
}

async function test() {
    try {
        const personId = 31; // Tom Hanks
        const [movieCredits, tvCredits] = await Promise.all([
            fetchTMDB(`/person/${personId}/movie_credits`),
            fetchTMDB(`/person/${personId}/tv_credits`),
        ]);

        console.log("Movie credits count:", movieCredits.cast.length);
        console.log("TV credits count:", tvCredits.cast.length);

        const wrappedMovies = movieCredits.cast.map((movie) => ({
            ...movie,
            media_type: "movie",
        }));
        const wrappedTV = tvCredits.cast.map((show) => ({
            ...show,
            media_type: "tv",
        }));

        const results = [...wrappedMovies, ...wrappedTV].sort(
            (a, b) => (b.vote_average || 0) - (a.vote_average || 0),
        );

        console.log("Total unique sorted results:", results.length);
    } catch (e) {
        console.error(e);
    }
}

test();
