import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { fetchJsonWithAuth, fetchWithAuth } from '@/lib/api'; // Meus helpers

// --- Interfaces para tipagem dos dados ---
type PrioridadeNivel = 'POUCO_INTERESSE' | 'MUITO_INTERESSE';

// Representa uma Disciplina dentro de uma Matriz (MatrizDisciplina)
interface DisciplinaMatriz {
    id: string; // ID da MatrizDisciplina
    disciplinaResponse: {
        id: string;
        nome: string;
    };
    cargaHoraria: number; // A API de MatrizDisciplina inclui cargaHoraria
}

// Representa uma Prioridade salva (vem de /api/prioridades/minhas)
interface Prioridade {
    id: string; // ID da entidade Prioridade
    prioridade: PrioridadeNivel; // O backend usa 'prioridade'
    matrizDisciplinaResponseSimples: {
        id: string; // ID da MatrizDisciplina
        disciplinaResponse: { nome: string }; // E outros campos
    };
}
// -----------------------------------------

// Mapeamento para exibição amigável
const PRIORIDADE_MAP_DISPLAY: Record<PrioridadeNivel, string> = {
    POUCO_INTERESSE: 'Pouco Interesse',
    MUITO_INTERESSE: 'Muito Interesse'
};

const Interesses = () => {
    const { user } = useAuth();

    const [disciplinasMatriz, setDisciplinasMatriz] = useState<DisciplinaMatriz[]>([]);
    const [profPrioridadesSalvas, setProfPrioridadesSalvas] = useState<Prioridade[]>([]);
    // Mapa da UI: <matrizDisciplinaId, Nivel>
    const [interessesUI, setInteressesUI] = useState<Map<string, PrioridadeNivel>>(new Map());
    const [loading, setLoading] = useState(true);

    // Função para buscar dados da API
    const fetchData = useCallback(async () => {
        if (!user || user.role !== 'professor' || !user.professorId) {
            setLoading(false);
            return;
        };

        setLoading(true);
        try {
            // Busco todas as MatrizDisciplinas e as minhas prioridades salvas
            const [discMatrizData, prioData] = await Promise.all([
                fetchJsonWithAuth<DisciplinaMatriz[]>('/api/matriz-disciplinas'),
                fetchJsonWithAuth<Prioridade[]>(`/api/prioridades/minhas`) // Endpoint 'minhas' existe!
            ]);

            setDisciplinasMatriz(discMatrizData || []);
            setProfPrioridadesSalvas(prioData || []);

            // Crio o mapa inicial para a UI com base nas prioridades já salvas
            const prioMap = new Map<string, PrioridadeNivel>();
            prioData?.forEach(p => {
                // Eu verifico se os dados existem antes de tentar acessar
                if (p.matrizDisciplinaResponseSimples?.id) {
                    // O backend retorna o nível em 'prioridade'
                    prioMap.set(String(p.matrizDisciplinaResponseSimples.id), p.prioridade);
                }
            });
            setInteressesUI(prioMap);

        } catch (error) {
            console.error("Erro ao carregar interesses e disciplinas:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Função para atualizar o interesse na UI quando clico no Radio
    const handlePrioridadeChange = (disciplinaMatrizId: string, prioridadeSelecionada: PrioridadeNivel | 'nenhum') => {
        const newInteresses = new Map(interessesUI);
        if (prioridadeSelecionada === 'nenhum') {
            newInteresses.delete(disciplinaMatrizId); // Remove se marcou 'nenhum'
        } else {
            newInteresses.set(disciplinaMatrizId, prioridadeSelecionada); // Adiciona/atualiza
        }
        setInteressesUI(newInteresses);
    };

    // Função para salvar as alterações na API
    const handleSave = async () => {
        if (!user || !user.professorId) return;

        setLoading(true);

        // Mapeio os interesses originais (salvos no backend) por ID da MatrizDisciplina
        const originalInteressesMap = new Map<string, Prioridade>();
        profPrioridadesSalvas.forEach(p => {
            if (p.matrizDisciplinaResponseSimples?.id) {
                originalInteressesMap.set(String(p.matrizDisciplinaResponseSimples.id), p);
            }
        });

        const promises: Promise<any>[] = [];
        const allDisciplinaMatrizIds = new Set(disciplinasMatriz.map(d => String(d.id)));

        // Comparo o estado original com o estado atual da UI
        for (const disciplinaMatrizId of allDisciplinaMatrizIds) {
            const originalPrioridade = originalInteressesMap.get(disciplinaMatrizId);
            const novoNivelPrioridade = interessesUI.get(disciplinaMatrizId);

            if (originalPrioridade && !novoNivelPrioridade) {
                // CASO 1: DELETAR (tinha e agora é 'nenhum')
                promises.push(fetchWithAuth(`/api/prioridades/${originalPrioridade.id}`, { method: 'DELETE' }));

            } else if (!originalPrioridade && novoNivelPrioridade) {
                // CASO 2: CRIAR (não tinha e agora tem)
                // O DTO de criação (PrioridadeCreateRequest) não pede professorId
                promises.push(fetchWithAuth('/api/prioridades', {
                    method: 'POST',
                    body: JSON.stringify({
                        matrizDisciplinaId: disciplinaMatrizId,
                        prioridade: novoNivelPrioridade
                    })
                }));

            } else if (originalPrioridade && novoNivelPrioridade && originalPrioridade.prioridade !== novoNivelPrioridade) {
                // CASO 3: ATUALIZAR (tinha e mudou o nível)
                // O DTO de update (PrioridadeUpdateRequest) só pede 'prioridade'
                promises.push(fetchWithAuth(`/api/prioridades/${originalPrioridade.id}`, {
                    method: 'PATCH', // O controller usa PATCH
                    body: JSON.stringify({ prioridade: novoNivelPrioridade })
                }));
            }
        }

        try {
            await Promise.all(promises);
            toast.success('Interesses atualizados com sucesso!');
            await fetchData(); // Recarrego os dados para sincronizar o estado
        } catch (error) {
            console.error('Erro ao salvar os interesses:', error);
            await fetchData(); // Recarrego para reverter
        } finally {
            setLoading(false);
        }
    };

    if (user?.role !== 'professor') {
        return <div className="p-6">Acesso não autorizado.</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Interesse em Disciplinas</h1>
                    <p className="text-muted-foreground">Indique as disciplinas que deseja lecionar e sua prioridade</p>
                </div>
                <Button onClick={handleSave} disabled={loading}>
                    <Star className="h-4 w-4 mr-2" />
                    {loading ? 'Salvando...' : 'Salvar Interesses'}
                </Button>
            </div>

            {loading ? <p>Carregando disciplinas...</p> : (
                <div className="grid gap-4 md:grid-cols-2">
                    {disciplinasMatriz.map((disciplina) => {
                        // Pego a prioridade selecionada na UI
                        const prioridadeUI = interessesUI.get(String(disciplina.id));
                        return (
                            <Card key={disciplina.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/10 rounded-full">
                                                <BookOpen className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg">{disciplina.disciplinaResponse.nome}</CardTitle>
                                                <CardDescription>
                                                    Carga horária: {disciplina.cargaHoraria}h
                                                </CardDescription>
                                            </div>
                                        </div>
                                        {/* Mostro o badge se houver prioridade selecionada */}
                                        {prioridadeUI && (
                                            <Badge variant={prioridadeUI === 'MUITO_INTERESSE' ? 'default' : 'secondary'}>
                                                {PRIORIDADE_MAP_DISPLAY[prioridadeUI]}
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <RadioGroup
                                        value={prioridadeUI || 'nenhum'} // O valor é o do mapa da UI
                                        onValueChange={(value) => handlePrioridadeChange(String(disciplina.id), value as any)}
                                    >
                                        <div className="flex flex-col space-y-2">
                                            {/* O backend só tem 2 níveis, então removi o 'Prioridade 1' */}
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="MUITO_INTERESSE" id={`${disciplina.id}-alta`} />
                                                <Label htmlFor={`${disciplina.id}-alta`}>Muito Interesse</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="POUCO_INTERESSE" id={`${disciplina.id}-baixa`} />
                                                <Label htmlFor={`${disciplina.id}-baixa`}>Pouco Interesse</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="nenhum" id={`${disciplina.id}-nenhum`} />
                                                <Label htmlFor={`${disciplina.id}-nenhum`}>Nenhum interesse</Label>
                                            </div>
                                        </div>
                                    </RadioGroup>
                                </CardContent>
                            </Card>
                        );
                    })}
                    {disciplinasMatriz.length === 0 && <p>Nenhuma disciplina encontrada.</p>}
                </div>
            )}
        </div>
    );
};

export default Interesses;