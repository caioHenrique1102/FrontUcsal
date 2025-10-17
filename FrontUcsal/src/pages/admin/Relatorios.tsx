import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, BookOpen, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const Relatorios = () => {
    const [relatorio, setRelatorio] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRelatorio = async () => {
            try {
                const response = await fetch('/api/professores/relatorio-disponibilidade', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
                });
                if (!response.ok) throw new Error('Falha ao buscar relatório');
                const data = await response.json();
                setRelatorio(data);
            } catch (error) {
                toast.error('Erro ao carregar relatório.');
            } finally {
                setLoading(false);
            }
        };
        fetchRelatorio();
    }, []);

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Relatórios</h1>
                <p className="text-muted-foreground">Visualize informações consolidadas do sistema</p>
            </div>

            {loading ? <p>Carregando...</p> : (
                <Card>
                    <CardHeader>
                        <CardTitle>Disponibilidade e Interesse de Professores</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {relatorio.map(prof => (
                                <div key={prof.professorId} className="p-4 border rounded-lg">
                                    <div className='flex justify-between'>
                                        <h3 className="font-semibold">{prof.nomeProfessor}</h3>
                                        <Badge variant={prof.ativo ? 'default' : 'secondary'}>{prof.ativo ? 'Ativo' : 'Inativo'}</Badge>
                                    </div>
                                    <p className='text-sm text-muted-foreground'>{prof.emailProfessor}</p>

                                    <div className='mt-4'>
                                        <h4 className='font-medium text-sm'>Horários Disponíveis ({prof.horariosDisponiveis.length})</h4>
                                        <div className='flex flex-wrap gap-2 mt-2'>
                                            {prof.horariosDisponiveis.map((h: any) => (
                                                <Badge variant='outline' key={h.id}>{`${h.horarioResponse.diaSemana} ${h.horarioResponse.horarioInicio}-${h.horarioResponse.horarioFinal}`}</Badge>
                                            ))}
                                        </div>
                                    </div>

                                    <div className='mt-4'>
                                        <h4 className='font-medium text-sm'>Disciplinas de Interesse ({prof.disciplinasInteresse.length})</h4>
                                        <div className='flex flex-wrap gap-2 mt-2'>
                                            {prof.disciplinasInteresse.map((i: any) => (
                                                <Badge variant='secondary' key={i.id}>{i.matrizDisciplinaResponseSimples.disciplinaResponse.nome} ({i.prioridade})</Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default Relatorios;