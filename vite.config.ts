import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            strategies: "injectManifest",
            srcDir: "src",
            filename: "sw.ts",
            registerType: "autoUpdate",
            manifest: false,
            includeAssets: ["offline.html"],
            injectManifest: {
                globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
            },
        }),
    ],
    base: "/",
});
