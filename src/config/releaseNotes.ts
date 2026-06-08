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
		id: "0.2.2",
		title: "Install the App!",
		message: "You can now install FilmReel on your device for a more app-like experience. Simply click on the share icon in your browser and select 'Add to Home Screen' to get started. Enjoy faster access and a more immersive way to discover movies and shows!",
		date: "2026-06-8",
	},
	{
		id: "0.2.1",
		title: "Introducing Watchlists & Playlists!",
		message: "You can now create custom playlists to organize your movies and shows, and keep track of what you've watched with our new watchlist feature. Start building your personalized collections today!",
		date: "2026-06-7",
	},
	{
		id: "0.2.0",
		title: "Important Update: Streaming Provider Change",
		message: "We've upgraded our streaming service to SuperEmbed! Unfortunately, this means your previous watch history and progress had to be reset. We apologize for the inconvenience, but this change ensures a more stable and reliable experience.",
		date: "2026-06-06",
	},
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
		date: "2026-02-27",
	},
	{
		id: "0.0.9",
		title: "TV Shows are here!",
		message: "Browse and stream TV series with season & episode selectors. Search now returns both movies and shows.",
		date: "2026-02-23",
	},
	{
		id: "0.0.1",
		title: "Welcome to FilmReel!",
		message: "Take a mood survey to get personalized movie recommendations.",
		date: "2026-02-01",
	},
];
