const CACHE_NAME = "filmreel-v1";
const urlsToCache = ["/", "/index.html", "/manifest.json"];

// Install event - cache files
self.addEventListener("install", (event) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => cache.addAll(urlsToCache))
			.then(() => self.skipWaiting()),
	);
});

// Activate event - clean old caches
self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames.map((cacheName) => {
					if (cacheName !== CACHE_NAME) {
						return caches.delete(cacheName);
					}
				}),
			);
		}),
	);
});

// Fetch event - serve from cache when offline
self.addEventListener("fetch", (event) => {
	// Skip non-GET requests and API calls
	if (
		event.request.method !== "GET" ||
		event.request.url.includes("/api/")
	) {
		return;
	}

	event.respondWith(
		caches
			.match(event.request)
			.then((response) => {
				if (response) return response;
				return fetch(event.request).then((response) => {
					// Cache successful responses
					if (
						!response ||
						response.status !== 200 ||
						response.type === "error"
					) {
						return response;
					}
					const responseClone = response.clone();
					caches.open(CACHE_NAME).then((cache) =>
						cache.put(
							event.request,
							responseClone,
						),
					);
					return response;
				});
			})
			.catch(() => {
				// Return offline fallback if available
				return caches.match("/index.html");
			}),
	);
});
