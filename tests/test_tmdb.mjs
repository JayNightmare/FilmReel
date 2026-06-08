import dotenv from "dotenv";
dotenv.config();

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

async function test() {
    const response = await fetch(
        `${BASE_URL}/person/31/movie_credits?api_key=${TMDB_API_KEY}&language=en-US`,
    );
    if (!response.ok) {
        console.log("Error:", response.status, response.statusText);
        return;
    }
    const data = await response.json();
    console.log("Movie credits:", data.cast?.length);
}
test();
