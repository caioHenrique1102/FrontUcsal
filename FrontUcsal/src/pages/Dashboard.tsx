import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {Building2, Users, BookOpen, Calendar, Clock, Star, GraduationCap} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                const headers = { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` };
                const [escolasRes, profsRes, discRes, alocRes] = await Promise.all([
                    fetch('/admin/api/escolas', { headers }),
                    fetch('/api/professores', { headers }),
                    fetch('/admin/api/disciplinas', { headers }),
                    fetch('/admin/alocacoes', { headers }),
                ]);

                const escolasData = await escolasRes.json();
                const profsData = await profsRes.json();
                const discData = await discRes.json();
                const alocData = await alocRes.json();

                setStats({
                    escolas: escolasData.totalElements,
                    professores: profsData.length,
                    disciplinas: discData.length,
                    alocacoes: alocData.length,
                });
            } catch (error) {
                toast.error("Erro ao carregar dados do dashboard.");
            } finally {
                setLoading(false);
            }
        };

        if (user?.role === 'admin') {
            fetchAdminData();
        } else {
            setLoading(false);
        }
    }, [user]);


    if (loading) {
        return <div className="p-6">Carregando...</div>
    }

    if (user?.role === 'admin') {
        return (
            <div className="p-6 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
                    <p className="text-muted-foreground">Visão geral do sistema</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Escolas</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.escolas || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Professores</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.professores || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Disciplinas</CardTitle>
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.disciplinas || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Alocações</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.alocacoes || 0}</div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Bem-vindo, {user?.name}!</h1>
                <p className="text-muted-foreground">Gerencie suas informações acadêmicas</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Disponibilidade</CardTitle>
                        <CardDescription>Horários que você pode lecionar.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Clock className="h-8 w-8 text-primary" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Interesses</CardTitle>
                        <CardDescription>Disciplinas que você tem interesse.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Star className="h-8 w-8 text-primary" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Formação</CardTitle>
                        <CardDescription>Suas informações acadêmicas.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <GraduationCap className="h-8 w-8 text-primary" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;