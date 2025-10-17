import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'admin' | 'professor';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    registrationNumber?: string;
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

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        const savedUser = localStorage.getItem('user');
        if (token && savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                return { success: false, error: errorData.message || 'Email ou senha incorretos' };
            }

            const { token, role } = await response.json();

            // Você pode querer buscar os dados do usuário em outro endpoint após o login
            // Por enquanto, vamos mockar o usuário com base no email e role
            const loggedUser: User = {
                id: 'temp-id', // O ideal é que a API de login retorne os dados do usuário
                name: email,
                email: email,
                role: role.toLowerCase(),
            };

            setUser(loggedUser);
            localStorage.setItem('user', JSON.stringify(loggedUser));
            localStorage.setItem('authToken', token);

            return { success: true };
        } catch (error) {
            return { success: false, error: 'Erro ao conectar com o servidor' };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
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