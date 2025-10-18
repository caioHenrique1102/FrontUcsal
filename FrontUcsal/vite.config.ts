import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// Removi a importação do lovable-tagger

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
    server: {
        host: "::",
        // A porta do frontend. O proxy redirecionará para o backend (que geralmente é 8080)
        port: 5173, // Você pode usar 8080 se o backend estiver em outra porta
        proxy: {
            // Adiciono o proxy para todas as rotas da API
            // Qualquer chamada para /api, /admin, /auth será redirecionada
            '/api': {
                target: 'http://localhost:8080', // ENDEREÇO DO SEU BACKEND
                changeOrigin: true, // Necessário para o proxy funcionar
            },
            '/auth': {
                target: 'http://localhost:8080', // ENDEREÇO DO SEU BACKEND
                changeOrigin: true,
            },
            '/admin': {
                target: 'http://localhost:8080', // ENDEREÇO DO SEU BACKEND
                changeOrigin: true,
            }
        }
    },
    plugins: [
        react(),
        // Removi a chamada do componentTagger()
    ].filter(Boolean),
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
}));