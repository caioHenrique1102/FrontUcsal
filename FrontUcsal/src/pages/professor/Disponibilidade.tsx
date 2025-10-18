import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox'; // Certifique-se que a importação está correta
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { fetchJsonWithAuth, fetchWithAuth } from '@/lib/api'; // Meus helpers

// --- Interfaces para Tipagem ---
interface Horario {
    id: string; // ID do Horário
    diaSemana: 'SEGUNDA' | 'TERCA' | 'QUARTA' | 'QUINTA' | 'SEXTA' | 'SABADO';
    turno: 'MANHA' | 'TARDE' | 'NOITE';
    horarioInicio: string;
    horarioFinal: string;
}

interface ProfessorHorario {
    id: string; // ID da Relação ProfessorHorario
    professorResponseSimples: { id: string; nome: string; };
    horarioResponse: Horario;
}
// -----------------------------

// Mapeamentos para exibir nomes amigáveis
const DIAS_MAP: Record<Horario['diaSemana'], string> = {
    SEGUNDA: 'Segunda-feira', TERCA: 'Terça-feira', QUARTA: 'Quarta-feira',
    QUINTA: 'Quinta-feira', SEXTA: 'Sexta-feira', SABADO: 'Sábado'
};
const TURNOS_MAP: Record<Horario['turno'], string> = {
    MANHA: 'Manhã', TARDE: 'Tarde', NOITE: 'Noite'
};

const Disponibilidade = () => {
    const { user } = useAuth();

    const [horariosPossiveis, setHorariosPossiveis] = useState<Horario[]>([]);
    const [profHorariosSalvos, setProfHorariosSalvos] = useState<ProfessorHorario[]>([]);
    const [horariosSelectedUI, setHorariosSelectedUI] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    // Minha função para buscar os dados da API
    const fetchData = useCallback(async () => {
        if (!user || user.role !== 'professor' || !user.professorId) {
            setLoading(false);
            setHorariosPossiveis([]); setProfHorariosSalvos([]); setHorariosSelectedUI(new Set());
            return;
        };

        setLoading(true);
        try {
            const [horariosData, profHorariosData] = await Promise.all([
                fetchJsonWithAuth<Horario[]>('/api/horarios'),
                fetchJsonWithAuth<ProfessorHorario[]>(`/api/professor-horarios?professorId=${user.professorId}`)
            ]);

            setHorariosPossiveis(horariosData || []);
            setProfHorariosSalvos(profHorariosData || []);

            const selectedHorarioIds = new Set(profHorariosData?.map((ph) => String(ph.horarioResponse.id)) || []);
            setHorariosSelectedUI(selectedHorarioIds);

        } catch (error) {
            console.error("Erro ao carregar dados de disponibilidade:", error);
            setHorariosPossiveis([]); setProfHorariosSalvos([]); setHorariosSelectedUI(new Set());
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Função chamada quando clico na div para marcar/desmarcar
    const toggleHorario = (horarioId: string) => {
        const idAsString = String(horarioId);
        const newSelectedSet = new Set(horariosSelectedUI);
        if (newSelectedSet.has(idAsString)) {
            newSelectedSet.delete(idAsString);
        } else {
            newSelectedSet.add(idAsString);
        }
        setHorariosSelectedUI(newSelectedSet);
    };

    // Minha função para salvar as alterações na API
    const handleSave = async () => {
        if (!user || !user.professorId) return;

        const originalHorarioIds = new Set(profHorariosSalvos.map(ph => String(ph.horarioResponse.id)));
        const relacoesParaDeletar = profHorariosSalvos.filter(ph => !horariosSelectedUI.has(String(ph.horarioResponse.id)));
        const idsHorarioParaAdicionar = Array.from(horariosSelectedUI).filter(id => !originalHorarioIds.has(id));

        setLoading(true);
        try {
            const deletePromises = relacoesParaDeletar.map(ph =>
                fetchWithAuth(`/api/professor-horarios/${ph.id}`, { method: 'DELETE' })
            );

            const addPromises = idsHorarioParaAdicionar.map(horarioId =>
                fetchWithAuth('/api/professor-horarios', {
                    method: 'POST',
                    body: JSON.stringify({ professorId: user.professorId, horarioId: horarioId })
                })
            );

            await Promise.all([...deletePromises, ...addPromises]);
            toast.success('Disponibilidade atualizada com sucesso!');
            await fetchData();

        } catch (error) {
            console.error('Erro ao salvar disponibilidade:', error);
            toast.error('Falha ao salvar. Recarregando dados...');
            await fetchData();
        } finally {
            setLoading(false);
        }
    };

    const groupedByDia = horariosPossiveis.reduce((acc, horario) => {
        const diaKey = horario.diaSemana;
        if (!acc[diaKey]) acc[diaKey] = [];
        acc[diaKey].push(horario);
        return acc;
    }, {} as Record<Horario['diaSemana'], Horario[]>);

    const diasOrdenados = Object.keys(DIAS_MAP) as Horario['diaSemana'][];

    if (user?.role !== 'professor') {
        return <div className="p-6">Acesso não autorizado.</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Disponibilidade de Horários</h1>
                    <p className="text-muted-foreground">Marque os horários em que você está disponível para lecionar</p>
                </div>
                <Button onClick={handleSave} disabled={loading}>
                    <Clock className="h-4 w-4 mr-2" />
                    {loading ? 'Salvando...' : 'Salvar Disponibilidade'}
                </Button>
            </div>

            {loading && horariosPossiveis.length === 0 ? <p>Carregando horários...</p> : (
                <>
                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader>
                            <CardTitle className="text-lg">Semestre Vigente</CardTitle>
                            <CardDescription>Você selecionou {horariosSelectedUI.size} horários disponíveis</CardDescription>
                        </CardHeader>
                    </Card>
                    <div className="space-y-4">
                        {diasOrdenados.map((diaKey) => {
                            const horariosDoDia = groupedByDia[diaKey];
                            if (!horariosDoDia || horariosDoDia.length === 0) return null;

                            return (
                                <Card key={diaKey}>
                                    <CardHeader>
                                        <CardTitle className="text-lg">{DIAS_MAP[diaKey]}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                            {horariosDoDia
                                                .sort((a,b) => a.horarioInicio.localeCompare(b.horarioInicio))
                                                .map((horario) => {
                                                    const horarioIdStr = String(horario.id);
                                                    const isSelected = horariosSelectedUI.has(horarioIdStr);
                                                    return (
                                                        <div
                                                            key={horarioIdStr}
                                                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                                                isSelected ? 'bg-primary/10 border-primary/30' : 'hover:bg-muted/50'
                                                            }`}
                                                            onClick={() => toggleHorario(horarioIdStr)}
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                {/* CORREÇÃO APLICADA AQUI: Removi o readOnly */}
                                                                <Checkbox checked={isSelected} className="mt-1" />
                                                                <div className="flex-1">
                                                                    <div className="flex items-center justify-between">
                                                                        <p className="font-medium">{`${horario.horarioInicio} - ${horario.horarioFinal}`}</p>
                                                                        <Badge variant="outline" className="capitalize">{TURNOS_MAP[horario.turno].toLowerCase()}</Badge>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                        {horariosPossiveis.length === 0 && !loading && <p>Nenhum horário cadastrado no sistema para seleção.</p>}
                    </div>
                </>
            )}
        </div>
    );
};

// Não preciso mais exportar a interface RelatorioProfessor daqui
// interface RelatorioProfessor { ... }

export default Disponibilidade;