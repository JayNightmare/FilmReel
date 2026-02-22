import { useState, useEffect, useCallback } from "react";

/**
 * Subscribes to localStorage changes for a specific key.
 * Re-runs the getter whenever:
 *  - The native `storage` event fires (cross-tab changes)
 *  - Our custom `filmreel-storage` event fires (same-tab changes)
 */
export function useStorageSync<T>(key: string, getter: () => T): T {
    const [value, setValue] = useState<T>(getter);

    const refresh = useCallback(() => {
        setValue(getter());
    }, [getter]);

    useEffect(() => {
        const handleNative = (e: StorageEvent) => {
            if (e.key === key) refresh();
        };

        const handleCustom = (e: Event) => {
            const detail = (e as CustomEvent<{ key: string }>).detail;
            if (detail.key === key) refresh();
        };

        window.addEventListener("storage", handleNative);
        window.addEventListener("filmreel-storage", handleCustom);
        return () => {
            window.removeEventListener("storage", handleNative);
            window.removeEventListener("filmreel-storage", handleCustom);
        };
    }, [key, refresh]);

    return value;
}
