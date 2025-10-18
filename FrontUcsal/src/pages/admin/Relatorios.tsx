import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, BookOpen, TrendingUp } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { fetchJsonWithAuth } from '@/lib/api'; // Meu helper

// Interface baseada no DTO ProfessorDisponibilidadeReportResponse do backend
interface RelatorioProfessor {
    professorId: number;
    nomeProfessor: string;
    emailProfessor: string;
    ativo: boolean;
    horariosDisponiveis: {
        id: number;
        horarioResponse: {
            id: number;
            diaSemana: 'SEGUNDA' | 'TERCA' | 'QUARTA' | 'QUINTA' | 'SEXTA' | 'SABADO';
            turno: 'MANHA' | 'TARDE' | 'NOITE';
            horarioInicio: string;
            horarioFinal: string;
        };
    }[];
    disciplinasInteresse: {
        id: number;
        matrizDisciplinaResponseSimples: {
            disciplinaResponse: {
                nome: string;
            };
        };
        prioridade: 'POUCO_INTERESSE' | 'MUITO_INTERESSE';
    }[];
}

// Mapeamentos para exibição (poderiam vir de um arquivo compartilhado)
const DIAS_MAP: Record<string, string> = {
    SEGUNDA: 'Seg', TERCA: 'Ter', QUARTA: 'Qua', QUINTA: 'Qui', SEXTA: 'Sex', SABADO: 'Sáb'
};
const TURNOS_MAP: Record<string, string> = {
    MANHA: 'Manhã', TARDE: 'Tarde', NOITE: 'Noite'
};
const PRIORIDADE_MAP: Record<string, string> = {
    POUCO_INTERESSE: 'Pouco Interesse',
    MUITO_INTERESSE: 'Muito Interesse'
};

const Relatorios = () => {
    // Estado para o relatório de disponibilidade
    const [relatorioDisponibilidade, setRelatorioDisponibilidade] = useState<RelatorioProfessor[]>([]);
    // Estado para o relatório de interesse por disciplina
    const [relatorioInteresse, setRelatorioInteresse] = useState<any[]>([]);
    // Estado para o dashboard (cards)
    const [stats, setStats] = useState<any>({ total: 0, ativos: 0, disciplinas: 0, alocacoes: 0 });
    const [loading, setLoading] = useState(true);

    // Função para buscar todos os relatórios e dados
    const fetchRelatorios = useCallback(async () => {
        setLoading(true);
        try {
            // Eu busco os relatórios em paralelo
            const [dispData, interesseData, profData, discData, alocData] = await Promise.all([
                fetchJsonWithAuth<RelatorioProfessor[]>('/api/professores/relatorio-disponibilidade'),
                fetchJsonWithAuth<any[]>('/api/prioridades/relatorio/interesse-disciplinas'),
                fetchJsonWithAuth<any[]>('/api/professores'), // Para contagem
                fetchJsonWithAuth<any[]>('/admin/api/disciplinas/ativas'), // Para contagem
                fetchJsonWithAuth<any[]>('/admin/alocacoes') // Para contagem
            ]);

            setRelatorioDisponibilidade(dispData || []);
            setRelatorioInteresse(interesseData || []);

            // Atualizo os stats dos cards
            const totalProf = profData?.length || 0;
            const ativosProf = profData?.filter((p: any) => p.ativo).length || 0;
            setStats({
                total: totalProf,
                ativos: ativosProf,
                inativos: totalProf - ativosProf,
                disciplinas: discData?.length || 0,
                alocacoes: alocData?.length || 0
            });

        } catch (error) {
            console.error('Erro ao carregar relatórios:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRelatorios();
    }, [fetchRelatorios]);

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Relatórios</h1>
                <p className="text-muted-foreground">Visualize informações consolidadas do sistema</p>
            </div>

            {/* Cards de Resumo com dados da API */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Professores</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">{stats.ativos} ativos, {stats.inativos} inativos</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Disciplinas Ativas</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.disciplinas}</div>
                        <p className="text-xs text-muted-foreground">Cadastradas e ativas</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Alocações</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.alocacoes}</div>
                        <p className="text-xs text-muted-foreground">No semestre vigente</p>
                    </CardContent>
                </Card>
                {/* Removi o card de Taxa de Ocupação por falta de dados */}
            </div>

            {/* Abas com os Relatórios */}
            {loading ? <p>Carregando relatórios...</p> : (
                <Tabs defaultValue="disponibilidade" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="disponibilidade">Disponibilidade/Interesse</TabsTrigger>
                        <TabsTrigger value="interesse">Interesse por Disciplina</TabsTrigger>
                    </TabsList>

                    {/* Aba 1: Relatório de Disponibilidade por Professor */}
                    <TabsContent value="disponibilidade" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Disponibilidade e Interesse por Professor</CardTitle>
                                <CardDescription>Lista de professores ativos com seus horários e interesses.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {relatorioDisponibilidade.map(prof => (
                                        <div key={prof.professorId} className="p-4 border rounded-lg">
                                            <div className='flex justify-between items-center mb-1'>
                                                <h3 className="font-semibold">{prof.nomeProfessor}</h3>
                                                <Badge variant={prof.ativo ? 'default' : 'secondary'}>{prof.ativo ? 'Ativo' : 'Inativo'}</Badge>
                                            </div>
                                            <p className='text-sm text-muted-foreground mb-3'>{prof.emailProfessor}</p>

                                            <div className='mb-3'>
                                                <h4 className='font-medium text-sm'>Horários Disponíveis ({prof.horariosDisponiveis.length})</h4>
                                                {prof.horariosDisponiveis.length > 0 ? (
                                                    <div className='flex flex-wrap gap-1 mt-1'>
                                                        {prof.horariosDisponiveis.map((h) => (
                                                            <Badge variant='outline' key={h.id} className='text-xs font-normal'>
                                                                {`${DIAS_MAP[h.horarioResponse.diaSemana]} ${h.horarioResponse.horarioInicio}-${h.horarioResponse.horarioFinal}`}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                ) : <p className='text-xs text-muted-foreground italic mt-1'>Nenhum horário informado.</p>}
                                            </div>

                                            <div>
                                                <h4 className='font-medium text-sm'>Disciplinas de Interesse ({prof.disciplinasInteresse.length})</h4>
                                                {prof.disciplinasInteresse.length > 0 ? (
                                                    <div className='flex flex-wrap gap-1 mt-1'>
                                                        {prof.disciplinasInteresse.map((i) => (
                                                            <Badge
                                                                variant={i.prioridade === 'MUITO_INTERESSE' ? 'default' : 'secondary'}
                                                                key={i.id}
                                                                className='text-xs font-normal'
                                                            >
                                                                {`${i.matrizDisciplinaResponseSimples.disciplinaResponse.nome} (${PRIORIDADE_MAP[i.prioridade]})`}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                ) : <p className='text-xs text-muted-foreground italic mt-1'>Nenhum interesse informado.</p>}
                                            </div>
                                        </div>
                                    ))}
                                    {relatorioDisponibilidade.length === 0 && <p>Nenhum professor ativo com dados para exibir.</p>}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Aba 2: Relatório de Interesse por Disciplina */}
                    <TabsContent value="interesse" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Disciplinas com Professores Interessados</CardTitle>
                                <CardDescription>Quantidade de professores que demonstraram interesse em cada disciplina.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {relatorioInteresse.map((item, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex-1">
                                                <p className="font-medium">{item.matrizDisciplina.disciplinaResponse.nome}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {`Carga: ${item.matrizDisciplina.cargaHoraria}h | Semestre: ${item.matrizDisciplina.semestre}`}
                                                </p>
                                            </div>
                                            <div className="ml-4 text-center">
                                                <div className="text-2xl font-bold text-primary">{item.quantidadeProfessoresInteressados}</div>
                                                <p className="text-xs text-muted-foreground">interessado(s)</p>
                                            </div>
                                        </div>
                                    ))}
                                    {relatorioInteresse.length === 0 && <p>Nenhum interesse em disciplinas registrado.</p>}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
};

export default Relatorios;