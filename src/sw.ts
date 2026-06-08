/// <reference lib="webworker" />

import { clientsClaim } from "workbox-core";
import {
    cleanupOutdatedCaches,
    createHandlerBoundToURL,
    matchPrecache,
    precacheAndRoute,
} from "workbox-precaching";
import { ExpirationPlugin } from "workbox-expiration";
import { NavigationRoute, registerRoute, setCatchHandler } from "workbox-routing";
import { CacheFirst, NetworkOnly } from "workbox-strategies";

declare const self: ServiceWorkerGlobalScope;

self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

const appShellHandler = createHandlerBoundToURL("/index.html");

registerRoute(
    new NavigationRoute(appShellHandler, {
        denylist: [/\/api\//],
    }),
);

registerRoute(
    ({ url }) => url.pathname.startsWith("/api/"),
    new NetworkOnly(),
);

registerRoute(
    ({ request }) => request.destination === "image",
    new CacheFirst({
        cacheName: "filmreel-images",
        plugins: [
            new ExpirationPlugin({
                maxEntries: 80,
                maxAgeSeconds: 60 * 60 * 24 * 30,
            }),
        ],
    }),
);

setCatchHandler(async ({ request }) => {
    if (request.destination === "document") {
        return (await matchPrecache("/offline.html")) || Response.error();
    }

    return Response.error();
});