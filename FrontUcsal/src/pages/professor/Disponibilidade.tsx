import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

// Interfaces para tipagem dos dados da API
interface Horario {
    id: string;
    diaSemana: string;
    turno: string;
    horarioInicio: string;
    horarioFinal: string;
}

interface ProfessorHorario {
    id: string;
    professorResponseSimples: { id: string; nome: string; };
    horarioResponse: Horario;
}

const Disponibilidade = () => {
    const { user } = useAuth();

    // Estado para todos os horários possíveis
    const [horariosPossiveis, setHorariosPossiveis] = useState<Horario[]>([]);

    // Estado para os horários que o professor já selecionou (vindo da API)
    const [profHorarios, setProfHorarios] = useState<ProfessorHorario[]>([]);

    // Estado para controlar os IDs dos horários selecionados na UI
    const [horariosSelected, setHorariosSelected] = useState<Set<string>>(new Set());

    const [loading, setLoading] = useState(true);

    // Função para buscar os dados da API
    const fetchData = useCallback(async () => {
        // Apenas busca os dados se o usuário estiver logado
        if (!user || !user.id) return;

        setLoading(true);
        try {
            const headers = { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` };

            // Busca todos os horários e os horários já associados ao professor em paralelo
            const [horariosResponse, profHorariosResponse] = await Promise.all([
                fetch('/api/horarios', { headers }),
                fetch(`/api/professor-horarios?professorId=${user.id}`, { headers })
            ]);

            if (!horariosResponse.ok || !profHorariosResponse.ok) {
                throw new Error('Falha ao carregar dados de disponibilidade.');
            }

            const horariosData: Horario[] = await horariosResponse.json();
            const profHorariosData: ProfessorHorario[] = await profHorariosResponse.json();

            setHorariosPossiveis(horariosData);
            setProfHorarios(profHorariosData);

            // Inicializa os checkboxes com os horários que já vieram da API
            const selectedIds = new Set(profHorariosData.map((ph) => ph.horarioResponse.id));
            setHorariosSelected(selectedIds);

        } catch (error) {
            toast.error("Erro ao carregar dados de disponibilidade.");
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Executa a busca de dados quando o componente é montado ou o usuário muda
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Função para marcar/desmarcar um horário
    const toggleHorario = (id: string) => {
        const newSet = new Set(horariosSelected);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setHorariosSelected(newSet);
    };

    // Função para salvar as alterações
    const handleSave = async () => {
        if (!user) return;

        // Compara os horários originais com os novos para saber o que adicionar e remover
        const originalHorarioIds = new Set(profHorarios.map(ph => ph.horarioResponse.id));

        const horariosParaDeletar = profHorarios.filter(ph => !horariosSelected.has(ph.horarioResponse.id));
        const horariosParaAdicionar = Array.from(horariosSelected).filter(id => !originalHorarioIds.has(id));

        try {
            // Cria as promises de deleção
            const deletePromises = horariosParaDeletar.map(ph =>
                fetch(`/api/professor-horarios/${ph.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
                })
            );

            // Cria as promises de adição
            const addPromises = horariosParaAdicionar.map(horarioId =>
                fetch('/api/professor-horarios', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify({ professorId: user.id, horarioId: horarioId })
                })
            );

            // Executa todas as promises
            await Promise.all([...deletePromises, ...addPromises]);

            toast.success('Disponibilidade atualizada com sucesso!');

            // Atualiza os dados da tela para refletir o novo estado salvo
            fetchData();
        } catch (error) {
            toast.error('Erro ao salvar disponibilidade.');
        }
    };

    // Agrupa os horários por dia da semana para a renderização
    const groupedByDia = horariosPossiveis.reduce((acc, horario) => {
        const dia = horario.diaSemana;
        if (!acc[dia]) acc[dia] = [];
        acc[dia].push(horario);
        return acc;
    }, {} as Record<string, Horario[]>);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Disponibilidade de Horários</h1>
                    <p className="text-muted-foreground">Marque os horários em que você está disponível para lecionar</p>
                </div>
                <Button onClick={handleSave} disabled={loading}>
                    <Clock className="h-4 w-4 mr-2" />
                    Salvar Disponibilidade
                </Button>
            </div>

            {loading ? <p>Carregando...</p> : (
                <>
                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader>
                            <CardTitle className="text-lg">Semestre Vigente</CardTitle>
                            <CardDescription>Você selecionou {horariosSelected.size} horários disponíveis</CardDescription>
                        </CardHeader>
                    </Card>
                    <div className="space-y-4">
                        {Object.entries(groupedByDia).map(([dia, horarios]) => (
                            <Card key={dia}>
                                <CardHeader>
                                    <CardTitle className="text-lg capitalize">{dia.toLowerCase().replace('_', '-')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                        {horarios.map((horario) => (
                                            <div
                                                key={horario.id}
                                                className={`p-4 border rounded-lg cursor-pointer transition-colors ${horariosSelected.has(horario.id) ? 'bg-primary/10 border-primary/30' : 'hover:bg-muted/50'}`}
                                                onClick={() => toggleHorario(horario.id)}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <Checkbox checked={horariosSelected.has(horario.id)} className="mt-1" />
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <p className="font-medium">{`${horario.horarioInicio} - ${horario.horarioFinal}`}</p>
                                                            <Badge variant="outline" className="capitalize">{horario.turno.toLowerCase()}</Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default Disponibilidade;