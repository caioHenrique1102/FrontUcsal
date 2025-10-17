import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

// --- Interfaces para tipagem dos dados ---
type PrioridadeNivel = 'POUCO_INTERESSE' | 'MUITO_INTERESSE';

interface DisciplinaMatriz {
    id: string;
    disciplinaResponse: {
        nome: string;
        cargaHoraria: number;
    };
}

interface Prioridade {
    id: string;
    prioridade: PrioridadeNivel;
    matrizDisciplinaResponseSimples: {
        id: string;
    };
}
// -----------------------------------------

const Interesses = () => {
    const { user } = useAuth();

    // Estados para gerenciar os dados
    const [disciplinas, setDisciplinas] = useState<DisciplinaMatriz[]>([]);
    const [profPrioridades, setProfPrioridades] = useState<Prioridade[]>([]);
    const [interesses, setInteresses] = useState<Map<string, PrioridadeNivel>>(new Map());
    const [loading, setLoading] = useState(true);

    // Função para buscar dados da API
    const fetchData = useCallback(async () => {
        if (!user || !user.id) return;
        setLoading(true);
        try {
            const headers = { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` };

            const [discResponse, prioResponse] = await Promise.all([
                fetch('/api/matriz-disciplinas', { headers }),
                fetch(`/api/prioridades?professorId=${user.id}`, { headers })
            ]);

            if (!discResponse.ok || !prioResponse.ok) {
                throw new Error("Falha ao carregar dados.");
            }

            const discData: DisciplinaMatriz[] = await discResponse.json();
            const prioData: Prioridade[] = await prioResponse.json();

            setDisciplinas(discData);
            setProfPrioridades(prioData);

            // CORREÇÃO: Cria o mapa de interesses de forma segura
            const prioMap = new Map<string, PrioridadeNivel>();
            prioData.forEach(p => {
                // Verifica se o objeto e seu ID existem antes de adicionar ao mapa
                if (p.matrizDisciplinaResponseSimples?.id) {
                    prioMap.set(String(p.matrizDisciplinaResponseSimples.id), p.prioridade);
                }
            });
            setInteresses(prioMap);

        } catch (error) {
            toast.error("Erro ao carregar interesses e disciplinas.");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Função para atualizar o interesse em uma disciplina
    const handlePrioridadeChange = (disciplinaId: string, prioridade: PrioridadeNivel | 'nenhum') => {
        const newInteresses = new Map(interesses);
        if (prioridade === 'nenhum') {
            newInteresses.delete(disciplinaId);
        } else {
            newInteresses.set(disciplinaId, prioridade);
        }
        setInteresses(newInteresses);
    };

    // Função para salvar as alterações
    const handleSave = async () => {
        if (!user) return;

        // Mapeia os interesses originais por ID da disciplina para fácil comparação
        const originalInteresses = new Map<string, Prioridade>();
        profPrioridades.forEach(p => {
            if (p.matrizDisciplinaResponseSimples?.id) {
                originalInteresses.set(String(p.matrizDisciplinaResponseSimples.id), p);
            }
        });

        const promises = [];
        const allDisciplinaIds = new Set(disciplinas.map(d => String(d.id)));

        // Itera sobre todas as disciplinas para identificar o que mudou
        for (const disciplinaId of allDisciplinaIds) {
            const original = originalInteresses.get(disciplinaId);
            const novoNivel = interesses.get(disciplinaId);

            if (original && !novoNivel) {
                // DELETAR: Tinha interesse, agora não tem mais
                promises.push(fetch(`/api/prioridades/${original.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
                }));
            } else if (!original && novoNivel) {
                // CRIAR: Não tinha interesse, agora tem
                promises.push(fetch('/api/prioridades', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify({
                        professorId: user.id,
                        matrizDisciplinaId: disciplinaId,
                        prioridade: novoNivel
                    })
                }));
            } else if (original && novoNivel && original.prioridade !== novoNivel) {
                // ATUALIZAR: O nível de interesse mudou
                promises.push(fetch(`/api/prioridades/${original.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify({ prioridade: novoNivel })
                }));
            }
        }

        try {
            await Promise.all(promises);
            toast.success('Interesses atualizados com sucesso!');
            fetchData(); // Recarrega os dados para sincronizar o estado
        } catch (error) {
            toast.error('Erro ao salvar os interesses.');
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Interesse em Disciplinas</h1>
                    <p className="text-muted-foreground">Indique as disciplinas que deseja lecionar e sua prioridade</p>
                </div>
                <Button onClick={handleSave} disabled={loading}>
                    <Star className="h-4 w-4 mr-2" />
                    Salvar Interesses
                </Button>
            </div>

            {loading ? <p>Carregando disciplinas...</p> : (
                <div className="grid gap-4 md:grid-cols-2">
                    {disciplinas.map((disciplina) => {
                        const prioridade = interesses.get(String(disciplina.id));
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
                                            </div>
                                        </div>
                                        {prioridade && <Badge className="capitalize">{prioridade.toLowerCase().replace('_', ' ')}</Badge>}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <RadioGroup
                                        value={prioridade || 'nenhum'}
                                        onValueChange={(value) => handlePrioridadeChange(String(disciplina.id), value as any)}
                                    >
                                        <div className="flex flex-col space-y-2">
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
                </div>
            )}
        </div>
    );
};

export default Interesses;