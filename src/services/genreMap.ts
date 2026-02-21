/**
 * A lightweight, synchronous genre ID → name lookup.
 * Seeded with TMDB's standard genre list. Enriched at runtime when
 * APIService.getGenres() resolves (see Home.tsx / Category.tsx).
 */
const GENRE_SEED: Record<number, string> = {
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
    878: "Sci-Fi",
    10770: "TV Movie",
    53: "Thriller",
    10752: "War",
    37: "Western",
};

const genreCache = new Map<number, string>(
    Object.entries(GENRE_SEED).map(([k, v]) => [Number(k), v]),
);

export const GenreMap = {
    getName(id: number): string {
        return genreCache.get(id) ?? "Film";
    },

    seed(genres: Array<{ id: number; name: string }>): void {
        for (const g of genres) {
            genreCache.set(g.id, g.name);
        }
    },
};
