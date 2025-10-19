import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// --- Páginas ---
// Core
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

// Admin
import Escolas from "./pages/admin/Escolas";
import Cursos from "./pages/admin/Cursos";         // Verifique se o nome do arquivo é exatamente Cursos.tsx
import Matrizes from "./pages/admin/Matrizes";     // Verifique se o nome do arquivo é exatamente Matrizes.tsx
import Disciplinas from "./pages/admin/Disciplinas";
import Turmas from "./pages/admin/Turmas";         // Verifique se o nome do arquivo é exatamente Turmas.tsx
import Professores from "./pages/admin/Professores";
import Horarios from "./pages/admin/Horarios";
import LimitesTurno from "./pages/admin/LimitesTurno"; // Verifique se o nome do arquivo é exatamente LimitesTurno.tsx
import Alocacoes from "./pages/admin/Alocacoes";
import Relatorios from "./pages/admin/Relatorios";

// Professor
import Formacao from "./pages/professor/Formacao";
import Disponibilidade from "./pages/professor/Disponibilidade";
import Interesses from "./pages/professor/Interesses";

// --- Componentes ---
import Layout from "./components/Layout"; // Componente de Layout principal

const queryClient = new QueryClient();

// Meu componente que protege as rotas que exigem login
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, isLoading } = useAuth(); // Pego o usuário e o status de carregamento do contexto

    // Enquanto verifico se o usuário está logado, mostro uma mensagem
    if (isLoading) {
        return <div className="flex justify-center items-center h-screen">Carregando autenticação...</div>;
    }

    // Se não houver usuário logado, redireciono para a página de login
    // 'replace' evita que a página anterior vá para o histórico do navegador
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Se o usuário estiver logado, mostro a página solicitada dentro do Layout padrão
    return <Layout>{children}</Layout>;
};

// Componente principal que define a estrutura de rotas
const App = () => (
    <QueryClientProvider client={queryClient}>
        {/* Disponibiliza o contexto de autenticação para toda a aplicação */}
        <AuthProvider>
            <TooltipProvider>
                <Toaster /> {/* Para toasts shadcn (se usar) */}
                <Sonner richColors position="top-right"/> {/* Para toasts Sonner (mais recomendado) */}
                <BrowserRouter>
                    <Routes>
                        {/* Rota pública para a página de Login */}
                        <Route path="/login" element={<Login />} />

                        {/* Redirecionamento da raiz '/' para '/dashboard' */}
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />

                        {/* --- Rotas Protegidas --- */}
                        {/* Todas as rotas abaixo usam o 'ProtectedRoute' */}
                        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

                        {/* Rotas de Admin */}
                        <Route path="/escolas" element={<ProtectedRoute><Escolas /></ProtectedRoute>} />
                        <Route path="/cursos" element={<ProtectedRoute><Cursos /></ProtectedRoute>} />
                        <Route path="/matrizes" element={<ProtectedRoute><Matrizes /></ProtectedRoute>} />
                        <Route path="/disciplinas" element={<ProtectedRoute><Disciplinas /></ProtectedRoute>} />
                        <Route path="/turmas" element={<ProtectedRoute><Turmas /></ProtectedRoute>} />
                        <Route path="/professores" element={<ProtectedRoute><Professores /></ProtectedRoute>} />
                        <Route path="/horarios" element={<ProtectedRoute><Horarios /></ProtectedRoute>} />
                        <Route path="/limites-turno" element={<ProtectedRoute><LimitesTurno /></ProtectedRoute>} />
                        <Route path="/alocacoes" element={<ProtectedRoute><Alocacoes /></ProtectedRoute>} />
                        <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />

                        {/* Rotas de Professor */}
                        <Route path="/formacao" element={<ProtectedRoute><Formacao /></ProtectedRoute>} />
                        <Route path="/disponibilidade" element={<ProtectedRoute><Disponibilidade /></ProtectedRoute>} />
                        <Route path="/interesses" element={<ProtectedRoute><Interesses /></ProtectedRoute>} />
                        {/* Fim das Rotas Protegidas --- */}

                        {/* Rota Curinga para lidar com URLs não encontradas (404) */}
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </BrowserRouter>
            </TooltipProvider>
        </AuthProvider>
    </QueryClientProvider>
);

export default App;