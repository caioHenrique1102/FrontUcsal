import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Escolas from "./pages/admin/Escolas";
import Professores from "./pages/admin/Professores";
import Disciplinas from "./pages/admin/Disciplinas";
import Horarios from "./pages/admin/Horarios";
import Alocacoes from "./pages/admin/Alocacoes";
import Relatorios from "./pages/admin/Relatorios";
import Formacao from "./pages/professor/Formacao";
import Disponibilidade from "./pages/professor/Disponibilidade";
import Interesses from "./pages/professor/Interesses";
import Layout from "./components/Layout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Meu componente que protege as rotas
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, isLoading } = useAuth();

    // Se estou verificando o login, mostro 'Carregando...'
    if (isLoading) return <div className="p-4">Carregando autenticação...</div>;
    // Se não tem usuário, redireciono para a tela de login
    if (!user) return <Navigate to="/login" />;

    // Se está tudo certo, mostro a página dentro do Layout
    return <Layout>{children}</Layout>;
};

const App = () => (
    <QueryClientProvider client={queryClient}>
        <AuthProvider>
            <TooltipProvider>
                <Toaster />
                <Sonner /> {/* Uso o Sonner para toasts mais simples */}
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/" element={<Navigate to="/dashboard" />} />

                        {/* Rotas Protegidas */}
                        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                        <Route path="/escolas" element={<ProtectedRoute><Escolas /></ProtectedRoute>} />
                        <Route path="/professores" element={<ProtectedRoute><Professores /></ProtectedRoute>} />
                        <Route path="/disciplinas" element={<ProtectedRoute><Disciplinas /></ProtectedRoute>} />
                        <Route path="/horarios" element={<ProtectedRoute><Horarios /></ProtectedRoute>} />
                        <Route path="/alocacoes" element={<ProtectedRoute><Alocacoes /></ProtectedRoute>} />
                        <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
                        <Route path="/formacao" element={<ProtectedRoute><Formacao /></ProtectedRoute>} />
                        <Route path="/disponibilidade" element={<ProtectedRoute><Disponibilidade /></ProtectedRoute>} />
                        <Route path="/interesses" element={<ProtectedRoute><Interesses /></ProtectedRoute>} />

                        {/* Rota 404 */}
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </BrowserRouter>
            </TooltipProvider>
        </AuthProvider>
    </QueryClientProvider>
);

export default App;