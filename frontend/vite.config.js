import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Solv Supply Chain Coordination",
        short_name: "Solv Ops",
        description: "Resilient Essential Goods Coordinator",
        theme_color: "#101622",
        icons: [
          {
            src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%2310b981'/%3E%3C/svg%3E",
            sizes: "192x192",
            type: "image/svg+xml"
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "https://sim-backend-1029069183045.us-central1.run.app",
        changeOrigin: true,
        secure: false,
      },
      "/ws": {
        target: "wss://sim-backend-1029069183045.us-central1.run.app",
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: "dist",
  },
  test: {
    globals: true,
    environment: "node",
  },
});
