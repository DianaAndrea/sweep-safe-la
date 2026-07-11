import { defineConfig } from "vite";

export default defineConfig({
  // Relative base so the built game can be hosted from any path.
  base: "./",
  server: {
    host: "127.0.0.1",
    port: 5183,
  },
});
