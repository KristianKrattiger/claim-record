import { defineConfig } from "vite"

export default defineConfig({
  root: "src/web",
  server: {
    port: 5173,
    proxy: { "/assay": "http://127.0.0.1:8787" },
  },
  build: { outDir: "../../dist", emptyOutDir: true },
})
