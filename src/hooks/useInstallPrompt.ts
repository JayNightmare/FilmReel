import { useCallback, useEffect, useState } from "react";

export interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{
        outcome: "accepted" | "dismissed";
        platform: string;
    }>;
}

export type InstallPromptOutcome =
    | "accepted"
    | "dismissed"
    | "unavailable";

export type InstallBannerMode = "prompt" | "ios-manual" | "hidden";

const INSTALL_BANNER_DISMISSED_KEY = "filmreel_install_banner_dismissed";
const MOBILE_INSTALL_BANNER_QUERY = "(max-width: 768px)";

const getIsStandalone = () =>
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

const getIsMobileViewport = () =>
    window.matchMedia(MOBILE_INSTALL_BANNER_QUERY).matches;

const getIsIosSafari = () => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/crios|fxios|chrome|android/.test(userAgent);
    return isIos && isSafari;
};

const getIsBannerDismissed = () => {
    try {
        return localStorage.getItem(INSTALL_BANNER_DISMISSED_KEY) === "1";
    } catch {
        return false;
    }
};

export const useInstallPrompt = () => {
    const [deferredInstallPrompt, setDeferredInstallPrompt] =
        useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(getIsStandalone);
    const [isMobileViewport, setIsMobileViewport] = useState(getIsMobileViewport);
    const [isBannerDismissed, setIsBannerDismissed] = useState(
        getIsBannerDismissed,
    );

    useEffect(() => {
        const handleBeforeInstallPrompt = (event: Event) => {
            event.preventDefault();
            setDeferredInstallPrompt(event as BeforeInstallPromptEvent);
        };

        const handleAppInstalled = () => {
            setDeferredInstallPrompt(null);
            setIsInstalled(true);
            setIsBannerDismissed(false);
            try {
                localStorage.removeItem(INSTALL_BANNER_DISMISSED_KEY);
            } catch {
                // Ignore storage failures
            }
        };

        window.addEventListener(
            "beforeinstallprompt",
            handleBeforeInstallPrompt,
        );
        window.addEventListener("appinstalled", handleAppInstalled);

        return () => {
            window.removeEventListener(
                "beforeinstallprompt",
                handleBeforeInstallPrompt,
            );
            window.removeEventListener("appinstalled", handleAppInstalled);
        };
    }, []);

    useEffect(() => {
        const mediaQuery = window.matchMedia(MOBILE_INSTALL_BANNER_QUERY);
        const handleViewportChange = (event: MediaQueryListEvent) => {
            setIsMobileViewport(event.matches);
        };

        mediaQuery.addEventListener("change", handleViewportChange);
        return () => {
            mediaQuery.removeEventListener("change", handleViewportChange);
        };
    }, []);

    const dismissBanner = useCallback(() => {
        setIsBannerDismissed(true);
        try {
            localStorage.setItem(INSTALL_BANNER_DISMISSED_KEY, "1");
        } catch {
            // Ignore storage failures
        }
    }, []);

    const requestInstall = useCallback(async (): Promise<InstallPromptOutcome> => {
        if (!deferredInstallPrompt) {
            return "unavailable";
        }

        await deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        setDeferredInstallPrompt(null);
        return outcome;
    }, [deferredInstallPrompt]);

    const canInstall = !isInstalled && deferredInstallPrompt !== null;
    const bannerMode: InstallBannerMode = (() => {
        if (!isMobileViewport || isInstalled || isBannerDismissed) {
            return "hidden";
        }

        if (deferredInstallPrompt) {
            return "prompt";
        }

        if (getIsIosSafari()) {
            return "ios-manual";
        }

        return "hidden";
    })();

    return {
        canInstall,
        installBannerMode: bannerMode,
        shouldShowInstallBanner: bannerMode !== "hidden",
        isInstalled,
        dismissBanner,
        requestInstall,
    };
};