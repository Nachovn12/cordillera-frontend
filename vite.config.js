import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Redirige todas las llamadas /api al BFF Gateway en desarrollo
      "/api": {
        target: "http://localhost:8081",
        changeOrigin: true,
      },
    },
  },
});
