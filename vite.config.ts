import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer } from "./server";

// ✅ Vite dev server config for Replit / HTTPS proxies
export default defineConfig(({ command }) => {
  const isDev = command === "serve";

  return {
    plugins: [react(), isDev ? expressPlugin() : undefined].filter(Boolean),

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./client"),
        "@shared": path.resolve(__dirname, "./shared"),
      },
    },

    // ---- Dev server (fixes "host not allowed" on Replit/Cloud) ----
    server: {
      host: "0.0.0.0",
      port: 5000,
      strictPort: true,

      // ✅ Allow any forwarded host (replit.dev, *.pike.replit.dev, etc.)
      allowedHosts: true,

      // ✅ HMR configuration for Replit
      hmr: {
        // The port Vite's HMR server listens on (internal to container)
        port: 5000,
        // Set host to 'localhost' for internal WebSocket connection
        host: 'localhost',
        // Use ws protocol for internal connection, as proxy handles wss externally
        protocol: 'ws', 
      },

      cors: true,

      // File-system access (don’t block your own server code during dev)
      fs: {
        allow: [
          // project root
          path.resolve(__dirname, "."),
          // workspaces
          path.resolve(__dirname, "./client"),
          path.resolve(__dirname, "./shared"),
          path.resolve(__dirname, "./server"),
        ],
        // Keep sensitive files denied
        deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**"],
      },
    },

    // ---- Build (prod) ----
    build: {
      outDir: "dist/spa",
      emptyOutDir: true,
      sourcemap: false,
      minify: "esbuild",
    },

    // Good default for prod paths
    base: "/",

    // Optional: Preview config (vite preview)
    preview: {
      host: "0.0.0.0",
      port: 8080,
      strictPort: true,
      allowedHosts: true,
    },
  };
});

// Attach your Express app to Vite in dev only
function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve",
    configureServer(server) {
      const app = createServer();
      server.middlewares.use(app);
    },
  };
}