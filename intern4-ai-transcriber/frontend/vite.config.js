import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy /audio requests to FastAPI backend during development
      "/audio": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
