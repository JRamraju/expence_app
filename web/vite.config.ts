import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      app: path.resolve(__dirname, "src/app"),
      components: path.resolve(__dirname, "src/components"),
      features: path.resolve(__dirname, "src/features"),
      services: path.resolve(__dirname, "src/services"),
      theme: path.resolve(__dirname, "src/theme"),
      utils: path.resolve(__dirname, "src/utils")
    }
  }
});
