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

// Mock users para demonstração
const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'Admin UCSAL',
    email: 'admin@ucsal.br',
    role: 'admin'
  },
  {
    id: '2',
    name: 'Prof. João Silva',
    email: 'joao@ucsal.br',
    role: 'professor',
    registrationNumber: '123456'
  }
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verifica se há usuário salvo no localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Mock login - aceita qualquer senha para os emails cadastrados
    const foundUser = MOCK_USERS.find(u => u.email === email);
    
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('user', JSON.stringify(foundUser));
      return { success: true };
    }
    
    return { success: false, error: 'Email ou senha incorretos' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
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
