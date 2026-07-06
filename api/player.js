const ALLOWED_PROVIDERS = ["vidsrc", "vidking", "superembed"];

export default async function handler(req, res) {
	const {
		provider = "vidsrc",
		video_id = "",
		tmdb = "0",
		media_type = "",
		lang = "",
		audio = "",
		autoplay = "",
		autonext = "",
		color = "",
		season = "0",
		episode = "0",
		s = "0",
		e = "0",
	} = req.query;

	if (!video_id) {
		return res.status(400).send("Missing video_id");
	}
	if (!ALLOWED_PROVIDERS.includes(String(provider))) {
		return res.status(400).send("Unsupported provider");
	}

	const isTmdb = String(tmdb);
	const sNum = season !== "0" ? String(season) : String(s);
	const eNum = episode !== "0" ? String(episode) : String(e);
	const mediaType =
		media_type === "movie" || media_type === "tv"
			? String(media_type)
			: sNum !== "0" && eNum !== "0"
				? "tv"
				: "movie";

	if (mediaType === "tv" && (sNum === "0" || eNum === "0")) {
		return res
			.status(400)
			.send("Missing season/episode for TV media type");
	}

	const order = resolveProviderOrder(String(provider));

	for (const activeProvider of order) {
		try {
			const playerUrl = await resolveProviderUrl({
				provider: activeProvider,
				videoId: String(video_id),
				isTmdb,
				mediaType,
				sNum,
				eNum,
				lang: String(lang),
				audio: String(audio),
				autoplay: String(autoplay),
				autonext: String(autonext),
				color: String(color),
			});

			if (playerUrl && playerUrl.startsWith("https://")) {
				return res.redirect(302, playerUrl);
			}
		} catch (error) {
			console.error(
				`Provider ${activeProvider} failed:`,
				error,
			);
		}
	}

	return res
		.status(502)
		.send("No configured provider could resolve this stream");
}

function resolveProviderOrder(selectedProvider) {
	const configured = (
		process.env.STREAMING_PROVIDERS || "vidsrc,vidking,superembed"
	)
		.split(",")
		.map((value) => value.trim())
		.filter((value) => ALLOWED_PROVIDERS.includes(value));

	return [...new Set([selectedProvider, ...configured])];
}

async function resolveProviderUrl(context) {
	if (context.provider === "vidsrc") {
		const base = process.env.VIDSRC_EMBED_BASE;
		if (!base) {
			throw new Error("VIDSRC_EMBED_BASE is not configured");
		}

		const endpoint =
			context.mediaType === "tv"
				? `${base}/embed/tv`
				: `${base}/embed/movie`;
		const params = new URLSearchParams({ tmdb: context.videoId });

		if (context.mediaType === "tv") {
			params.set("season", context.sNum);
			params.set("episode", context.eNum);
			if (context.autonext)
				params.set("autonext", context.autonext);
		}
		if (context.lang) params.set("ds_lang", context.lang);
		if (context.autoplay) params.set("autoplay", context.autoplay);

		return `${endpoint}?${params.toString()}`;
	}

	if (context.provider === "vidking") {
		const base = process.env.VIDKING_EMBED_BASE;
		if (!base) {
			throw new Error("VIDKING_EMBED_BASE is not configured");
		}

		let endpoint = `${base}/embed/movie/${context.videoId}`;
		if (context.mediaType === "tv") {
			endpoint = `${base}/embed/tv/${context.videoId}/${context.sNum}/${context.eNum}`;
		}

		const params = new URLSearchParams();
		if (context.color) params.set("color", context.color);
		if (context.autoplay) params.set("autoPlay", context.autoplay);

		return params.toString()
			? `${endpoint}?${params.toString()}`
			: endpoint;
	}

	return resolveSuperEmbedUrl(context);
}

async function resolveSuperEmbedUrl(context) {
	const player_bg_color = "000000";
	const player_font_color = "ffffff";
	const player_primary_color = "34cfeb";
	const player_secondary_color = "6900e0";
	const player_loader = "1";
	const preferred_server = "0";
	const player_sources_toggle_type = "2";

	const params = new URLSearchParams({
		video_id: context.videoId,
		tmdb: context.isTmdb,
		season: context.sNum,
		episode: context.eNum,
		player_bg_color,
		player_font_color,
		player_primary_color,
		player_secondary_color,
		player_loader,
		preferred_server,
		player_sources_toggle_type,
	});

	if (context.lang) params.set("lang", context.lang);
	if (context.audio) params.set("audio", context.audio);

	const requestUrl = `${process.env.SUPEREMBED_RESOLVER_URL || "https://getsuperembed.link/"}?${params.toString()}`;
	const response = await fetch(requestUrl);
	const playerUrl = await response.text();

	if (!playerUrl || !playerUrl.includes("https://")) {
		throw new Error("Invalid response from SuperEmbed resolver");
	}

	return playerUrl;
}
