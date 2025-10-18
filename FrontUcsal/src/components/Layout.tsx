import { ReactNode } from 'react';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
    LogOut,
    LayoutDashboard,
    Building2,
    Users,
    BookOpen,
    Clock,
    Calendar,
    FileText,
    User,
    ClipboardList,
    GraduationCap
} from 'lucide-react';

interface LayoutProps {
    children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Minha função de logout
    const handleLogout = () => {
        logout();
        navigate('/login'); // Redireciono para o login
    };

    // Defino os menus do admin
    const adminMenuItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/escolas', icon: Building2, label: 'Escolas' },
        { path: '/professores', icon: Users, label: 'Professores' },
        { path: '/disciplinas', icon: BookOpen, label: 'Disciplinas' },
        { path: '/horarios', icon: Clock, label: 'Horários' },
        { path: '/alocacoes', icon: Calendar, label: 'Alocações' },
        { path: '/relatorios', icon: FileText, label: 'Relatórios' }
    ];

    // Defino os menus do professor
    const professorMenuItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/formacao', icon: GraduationCap, label: 'Minha Formação' },
        { path: '/disponibilidade', icon: Clock, label: 'Disponibilidade' },
        { path: '/interesses', icon: ClipboardList, label: 'Interesse em Disciplinas' }
    ];

    // Escolho qual menu mostrar baseado na 'role' do usuário
    const menuItems = user?.role === 'admin' ? adminMenuItems : professorMenuItems;

    return (
        <div className="min-h-screen flex w-full bg-background">
            {/* Sidebar */}
            <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col shadow-lg">
                <div className="p-6 border-b border-sidebar-border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-sidebar-primary rounded-lg">
                            <GraduationCap className="h-6 w-6 text-sidebar-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg">UCSAL</h1>
                            <p className="text-xs text-sidebar-foreground/80">Gestão Acadêmica</p>
                        </div>
                    </div>
                </div>

                {/* Informações do usuário logado */}
                <div className="p-4 border-b border-sidebar-border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-sidebar-accent rounded-full">
                            <User className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{user?.name}</p>
                            <p className="text-xs text-sidebar-foreground/70 capitalize">{user?.role}</p>
                        </div>
                    </div>
                </div>

                {/* Links de navegação */}
                <nav className="flex-1 p-4 space-y-1">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            // Aqui eu uso a função 'isActive' do NavLink para saber qual link está ativo
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                                    isActive
                                        ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                                        : 'hover:bg-sidebar-accent/50'
                                }`
                            }
                        >
                            <item.icon className="h-5 w-5" />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Botão de Sair */}
                <div className="p-4 border-t border-sidebar-border">
                    <Button
                        onClick={handleLogout}
                        variant="ghost"
                        className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
                    >
                        <LogOut className="h-5 w-5 mr-3" />
                        Sair
                    </Button>
                </div>
            </aside>

            {/* Conteúdo principal */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
};

export default Layout;