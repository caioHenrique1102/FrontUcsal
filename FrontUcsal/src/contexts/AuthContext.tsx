import React, { createContext, useContext, useState, useEffect } from 'react';
// Importo meu helper de fetch
import { fetchJsonWithAuth } from '@/lib/api';
import { toast } from 'sonner';

export type UserRole = 'admin' | 'professor';

// Interface do usuário no frontend
export interface User {
    id: string; // ID do User (para Admin) ou ID do Professor (para Professor)
    name: string;
    email: string;
    role: UserRole;
    professorId?: string; // ID específico do Professor (vem do backend)
}

// Interface da resposta da API de login
interface LoginResponseData {
    token: string;
    role: string; // "ADMIN" ou "PROFESSOR"
    professorResponse: {
        id: string;
        nome: string;
        registro: string;
    } | null; // Nulo se for admin
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Ao carregar a aplicação, eu verifico se já existe um usuário logado no localStorage
    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        const token = localStorage.getItem('authToken');
        if (savedUser && token) {
            setUser(JSON.parse(savedUser));
            // Aqui eu poderia adicionar uma chamada para validar o token
        }
        setIsLoading(false);
    }, []);

    // Minha função de login que chama a API
    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            // Faço a chamada POST para /auth/login (não uso o fetchWithAuth aqui, pois ainda não tenho token)
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            // Se a API retornar um erro (ex: 401 Senha incorreta), eu leio a mensagem
            if (!response.ok) {
                let errorMsg = 'Email ou senha incorretos';
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || errorMsg;
                } catch (e) { /* ignora */ }
                return { success: false, error: errorMsg };
            }

            // Se o login foi bem-sucedido, eu pego os dados da resposta
            const data: LoginResponseData = await response.json();

            // Crio o objeto de usuário do frontend
            const loggedUser: User = {
                id: data.professorResponse?.id || `admin_${email}`, // Uso o ID do professor ou um ID de admin
                name: data.professorResponse?.nome || email, // Uso o nome do professor ou o email
                email: email,
                role: data.role.toLowerCase() as UserRole, // "ADMIN" -> "admin"
                professorId: data.professorResponse?.id, // Guardo o ID do professor separadamente
            };

            setUser(loggedUser);
            // Salvo o usuário e o token no localStorage
            localStorage.setItem('user', JSON.stringify(loggedUser));
            localStorage.setItem('authToken', data.token);

            return { success: true };

        } catch (error) {
            console.error("Erro ao fazer login:", error);
            toast.error(error instanceof Error ? error.message : 'Erro de conexão com a API');
            return { success: false, error: 'Erro ao conectar com o servidor.' };
        } finally {
            setIsLoading(false);
        }
    };

    // Minha função de logout
    const logout = () => {
        setUser(null);
        // Limpo o localStorage para deslogar
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
}