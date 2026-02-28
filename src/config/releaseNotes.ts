export interface ReleaseNote {
	id: string;
	title: string;
	message: string;
	date: string;
}

/**
 * Static release notes registry.
 * Add a new entry at the TOP of this array before each deploy.
 * The Navbar will automatically surface any entry whose `id`
 * hasn't been seen yet as an unread notification.
 */
export const RELEASE_NOTES: ReleaseNote[] = [
	{
		id: "0.1.1",
		title: "Anime Upgrade",
		message: "Anime now has a dedicated category, and Anime movies/shows include a Dub/Sub audio toggle in the viewer when available.",
		date: "2026-02-28",
	},
	{
		id: "0.1.0",
		title: "User Feature Added",
		message: "The request for 'Added Actor/Movie/TV of the Day' has been added to the site! If you want your feature to be added to the site, submit a request through the carousel <3",
		date: "",
	},
	{
		id: "0.0.9",
		title: "TV Shows are here!",
		message: "Browse and stream TV series with season & episode selectors. Search now returns both movies and shows.",
		date: "2026-02-23",
	},
	{
		id: "welcome-1",
		title: "Welcome to FilmReel!",
		message: "Take a mood survey to get personalized movie recommendations.",
		date: "2026-02-01",
	},
];
