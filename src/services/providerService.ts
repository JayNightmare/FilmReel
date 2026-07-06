export type ProviderId = "vidsrc" | "vidking" | "superembed";
export type MediaType = "movie" | "tv";

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
