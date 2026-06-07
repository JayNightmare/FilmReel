export default async function handler(req, res) {
	const {
		video_id = "",
		tmdb = "0",
		season = "0",
		episode = "0",
		s = "0",
		e = "0",
	} = req.query;

	const isTmdb = tmdb;
	const sNum = season !== "0" ? season : s;
	const eNum = episode !== "0" ? episode : e;

	// player colors (default matching the legacy PHP file)
	const player_bg_color = "000000";
	const player_font_color = "ffffff";
	const player_primary_color = "34cfeb";
	const player_secondary_color = "6900e0";
	const player_loader = "1";
	const preferred_server = "0";
	const player_sources_toggle_type = "2";

	if (!video_id) {
		return res.status(400).send("Missing video_id");
	}

	const params = new URLSearchParams({
		video_id: String(video_id),
		tmdb: String(isTmdb),
		season: String(sNum),
		episode: String(eNum),
		player_bg_color,
		player_font_color,
		player_primary_color,
		player_secondary_color,
		player_loader,
		preferred_server,
		player_sources_toggle_type,
	});

	const request_url = `https://getsuperembed.link/?${params.toString()}`;

	try {
		const response = await fetch(request_url);
		const player_url = await response.text();

		if (player_url && player_url.includes("https://")) {
			// Redirect to the actual player URL
			return res.redirect(302, player_url);
		} else {
			return res.status(500).send(player_url || "Invalid response from server");
		}
	} catch (error) {
		console.error("SuperEmbed Fetch Error:", error);
		return res.status(500).send("Request server didn't respond");
	}
}
