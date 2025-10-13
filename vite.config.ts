import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: "dist",
    cssCodeSplit: true,
    sourcemap: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
< 1859b046ff6e882390322fb85a02eec9af858a3c
  },
  server: {
    host: "::",
    port: 8080,
  },
});
