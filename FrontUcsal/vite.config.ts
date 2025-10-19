import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";


export default defineConfig(({ mode }) => ({
    server: {
        host: "::",
        port: 5173, // Ou a porta que você usa para o frontend
        proxy: { // Proxy para o backend
            '/api': { target: 'http://localhost:8080', changeOrigin: true },
            '/auth': { target: 'http://localhost:8080', changeOrigin: true },
            '/admin': { target: 'http://localhost:8080', changeOrigin: true }
        }
    },

    plugins: [react()].filter(Boolean),
    resolve: {
        alias: { "@": path.resolve(__dirname, "./src"), },
    },
}));