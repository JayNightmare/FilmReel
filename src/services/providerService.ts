export type ProviderId = "vidsrc" | "vidking" | "superembed";
export type MediaType = "movie" | "tv";
export type VidSrcServerOption = "1" | "2";

export type ProviderConfig = {
    id: ProviderId;
    label: string;
    requiresOriginReferrer: boolean;
};

export type PlayerUrlInput = {
    provider: ProviderId;
    videoId: string;
    mediaType: MediaType;
    season?: number;
    episode?: number;
    lang?: string;
    audio?: "dub" | "sub";
    vidsrcServerOption?: VidSrcServerOption;
};

export type VidSrcServerConfig = {
    id: VidSrcServerOption;
    label: string;
    baseUrl: string;
};

export const DEFAULT_PROVIDER: ProviderId = "vidsrc";

export const PROVIDERS: ProviderConfig[] = [
    {
        id: "vidsrc",
        label: "VidSrc (Default)",
        requiresOriginReferrer: true,
    },
    {
        id: "vidking",
        label: "VidKing",
        requiresOriginReferrer: false,
    },
    {
        id: "superembed",
        label: "SuperEmbed",
        requiresOriginReferrer: false,
    },
];

export const VIDSRC_SERVER_OPTIONS: VidSrcServerConfig[] = [
    {
        id: "1",
        label: "1",
        baseUrl: "https://vsembed.ru",
    },
    {
        id: "2",
        label: "2",
        baseUrl: "https://vsembed.su",
    },
];

export const PROVIDER_IDS = PROVIDERS.map((provider) => provider.id);

export function isProviderId(value: string): value is ProviderId {
    return PROVIDER_IDS.includes(value as ProviderId);
}

export function getProviderConfig(provider: ProviderId): ProviderConfig {
    return (
        PROVIDERS.find((entry) => entry.id === provider) ??
        PROVIDERS[0]
    );
}

export function getProviderFallbackOrder(selected: ProviderId): ProviderId[] {
    const ordered = [selected, ...PROVIDER_IDS.filter((id) => id !== selected)];
    return ordered;
}

export function buildApiPlayerUrl(input: PlayerUrlInput): string {
    const params = new URLSearchParams({
        provider: input.provider,
        video_id: input.videoId,
        tmdb: "1",
        media_type: input.mediaType,
    });

    if (input.mediaType === "tv") {
        if (typeof input.season === "number") {
            params.set("s", String(input.season));
        }
        if (typeof input.episode === "number") {
            params.set("e", String(input.episode));
        }
    }

    if (input.lang) {
        params.set("lang", input.lang);
    }
    if (input.audio) {
        params.set("audio", input.audio);
    }

    return `/api/player?${params.toString()}`;
}

export function buildPlayerUrl(input: PlayerUrlInput): string {
    if (input.provider === "vidsrc") {
        return buildVidSrcUrl(input);
    }

    if (input.provider === "vidking") {
        return buildVidKingUrl(input);
    }

    return buildApiPlayerUrl(input);
}

function buildVidSrcUrl(input: PlayerUrlInput): string {
    const server =
        VIDSRC_SERVER_OPTIONS.find(
            (entry) => entry.id === input.vidsrcServerOption,
        ) ?? VIDSRC_SERVER_OPTIONS[0];

    const params = new URLSearchParams({ tmdb: input.videoId });
    if (input.mediaType === "tv") {
        params.set("season", String(input.season ?? 1));
        params.set("episode", String(input.episode ?? 1));
        return `${server.baseUrl}/embed/tv?${params.toString()}`;
    }

    return `${server.baseUrl}/embed/movie?${params.toString()}`;
}

function buildVidKingUrl(input: PlayerUrlInput): string {
    const params = new URLSearchParams({
        color: "ff69b4",
        autoPlay: "true",
        nextEpisode: "true",
        episodeSelector: "true",
    });

    if (input.mediaType === "tv") {
        const season = String(input.season ?? 1);
        const episode = String(input.episode ?? 1);
        return `https://www.vidking.net/embed/tv/${input.videoId}/${season}/${episode}?${params.toString()}`;
    }

    return `https://www.vidking.net/embed/movie/${input.videoId}?${params.toString()}`;
}
