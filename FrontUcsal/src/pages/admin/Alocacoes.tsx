import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, User, BookOpen, Clock, Trash, Pencil } from 'lucide-react';
import { toast } from 'sonner';
// Importo meus helpers de API
import { fetchJsonWithAuth, fetchWithAuth } from '@/lib/api';

// --- Interfaces (Baseadas nos DTOs do Backend - Final) ---
interface AlocacaoResponse {
    id: string;
    professorResponseSimples: ProfessorResponseSimples | null; // Pode ser nulo? Adicionei verificação
    matrizDisciplinaResponseSimples: MatrizDisciplinaResponseSimples | null; // Pode ser nulo? Adicionei verificação
    horarioResponse: HorarioResponse | null; // Pode ser nulo? Adicionei verificação
    turmaResponse: TurmaResponse | null; // Pode ser nulo? Adicionei verificação
}

interface ProfessorResponseSimples { id: string; nome: string | null; }
interface HorarioResponse { id: string; diaSemana: 'SEGUNDA' | 'TERCA' | 'QUARTA' | 'QUINTA' | 'SEXTA' | 'SABADO'; horarioInicio: string; horarioFinal: string; }
interface TurmaResponse { id: string; codigo: string | null; }

// Interface EXATA para MatrizDisciplinaResponseSimples
interface MatrizDisciplinaResponseSimples {
    id: string; // Vem como Long do backend
    disciplinaResponse: { // Objeto aninhado
        id: string; // Vem como UUID do backend
        nome: string | null; // Nome pode ser nulo se a disciplina associada for deletada!
        descricao?: string; // Opcional, pode não vir
        ativo?: boolean;    // Opcional, pode não vir
    } | null; // A própria disciplinaResponse pode ser nula!
    cargaHoraria: number;
    semestre: number;
    obrigatoria: string; // Enum 'OBRIGATORIA' ou 'OPTATIVA'
}

// Mapeamento para exibir nomes amigáveis para os dias
const DIAS_MAP: Record<HorarioResponse['diaSemana'], string> = {
    SEGUNDA: 'Seg', TERCA: 'Ter', QUARTA: 'Qua', QUINTA: 'Qui', SEXTA: 'Sex', SABADO: 'Sáb'
};
// -------------------------------------------------

const Alocacoes = () => {
    // Estados para armazenar dados da API
    const [alocacoes, setAlocacoes] = useState<AlocacaoResponse[]>([]);
    const [professores, setProfessores] = useState<ProfessorResponseSimples[]>([]);
    const [matrizDisciplinas, setMatrizDisciplinas] = useState<MatrizDisciplinaResponseSimples[]>([]);
    const [horarios, setHorarios] = useState<HorarioResponse[]>([]);
    const [turmas, setTurmas] = useState<TurmaResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingModalData, setLoadingModalData] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null); // Guarda mensagem de erro da busca

    // Minha função para buscar todos os dados necessários
    const fetchData = useCallback(async () => {
        setLoading(true);
        setLoadingModalData(true);
        setFetchError(null); // Limpo erro anterior
        let errorMsg: string | null = null;
        try {
            // Uso Promise.allSettled para que um erro não impeça as outras buscas
            const results = await Promise.allSettled([
                fetchJsonWithAuth<AlocacaoResponse[]>('/admin/alocacoes?sort=id,desc'), // Pede mais recentes primeiro
                fetchJsonWithAuth<ProfessorResponseSimples[]>('/api/professores/ativos?sort=nome'), // Ordena profs
                fetchJsonWithAuth<MatrizDisciplinaResponseSimples[]>('/api/matriz-disciplinas'), // Ponto crítico
                fetchJsonWithAuth<HorarioResponse[]>('/api/horarios'),
                fetchJsonWithAuth<TurmaResponse[]>('/api/turmas?sort=codigo'), // Ordena turmas
            ]);

            // Processo os resultados com cuidado, tratando fulfilled/rejected
            setAlocacoes(results[0].status === 'fulfilled' ? results[0].value || [] : []);
            setProfessores(results[1].status === 'fulfilled' ? results[1].value || [] : []);
            setHorarios(results[3].status === 'fulfilled' ? results[3].value || [] : []);
            setTurmas(results[4].status === 'fulfilled' ? results[4].value || [] : []);

            // Tratamento especial para MatrizDisciplinas
            if (results[2].status === 'fulfilled') {
                const disciplinasData = results[2].value;
                // Filtro localmente itens problemáticos (ex: sem disciplinaResponse ou nome)
                // GARANTIA: Verifico se disciplinaResponse e disciplinaResponse.nome existem e não são nulos/vazios
                const disciplinasValidas = (disciplinasData || []).filter(d => d.disciplinaResponse && d.disciplinaResponse.nome);
                console.log("ALOCAÇÃO - MatrizDisciplinas recebidas:", disciplinasData); // Log para ver o que a API retornou
                console.log("ALOCAÇÃO - MatrizDisciplinas válidas (filtradas):", disciplinasValidas); // Log para ver o resultado do filtro

                if (disciplinasValidas.length !== (disciplinasData?.length || 0)) {
                    console.warn("ALOCAÇÃO - Algumas MatrizDisciplinas foram filtradas por terem dados inválidos (disciplinaResponse ou nome nulos). Verifique o backend/banco.");
                    toast.warning("Algumas disciplinas podem não aparecer na lista devido a dados inconsistentes.");
                }
                setMatrizDisciplinas(disciplinasValidas);
                if (disciplinasValidas.length === 0 && (disciplinasData?.length || 0) > 0) {
                    // Se a API retornou dados, mas eu filtrei todos, provavelmente há um problema nos dados
                    console.error("ALOCAÇÃO - Nenhuma MatrizDisciplina válida encontrada após filtro. Verifique os dados no backend.");
                    errorMsg = "Nenhuma disciplina válida encontrada. Verifique os cadastros.";
                    setFetchError(errorMsg);
                    toast.error(errorMsg);
                } else if (disciplinasValidas.length === 0 && (!disciplinasData || disciplinasData.length === 0)) {
                    console.log("ALOCAÇÃO - Nenhuma MatrizDisciplina cadastrada no sistema.");
                    // Não marco como erro, pode ser que não haja nenhuma mesmo
                }
            } else {
                // Se a busca falhou (500), guardo a mensagem de erro
                console.error("ALOCAÇÃO - Erro CRÍTICO ao buscar MatrizDisciplinas:", results[2].reason);
                setMatrizDisciplinas([]);
                errorMsg = `Erro ao buscar disciplinas: ${results[2].reason instanceof Error ? results[2].reason.message : 'Verifique o backend (Erro 500?)'}`;
                setFetchError(errorMsg); // Armazeno a mensagem de erro
                toast.error(errorMsg); // Mostro o erro
            }

        } catch (unexpectedError) {
            // Erro geral (menos provável com Promise.allSettled)
            console.error("ALOCAÇÃO - Erro inesperado no fetchData:", unexpectedError);
            errorMsg = "Erro inesperado ao carregar dados.";
            setFetchError(errorMsg);
            setAlocacoes([]); setProfessores([]); setMatrizDisciplinas([]); setHorarios([]); setTurmas([]);
        } finally {
            setLoading(false);
            setLoadingModalData(false);
            // Mostro aviso genérico se alguma lista essencial estiver vazia E NÃO houve erro específico na busca de disciplinas
            if (!fetchError && (professores.length === 0 || matrizDisciplinas.length === 0 || horarios.length === 0 || turmas.length === 0)) {
                // Ajustei a mensagem para ser mais informativa
                let missingData = [];
                if (professores.length === 0) missingData.push("Professores Ativos");
                if (matrizDisciplinas.length === 0) missingData.push("Disciplinas da Matriz");
                if (horarios.length === 0) missingData.push("Horários");
                if (turmas.length === 0) missingData.push("Turmas");
                if (missingData.length > 0) {
                    toast.warning(`Dados necessários (${missingData.join(', ')}) não encontrados. Verifique os cadastros.`);
                }
            }
        }
    }, []); // Removi dependências desnecessárias

    // Busco os dados ao montar
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Estados do formulário ---
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAlocacao, setEditingAlocacao] = useState<AlocacaoResponse | null>(null);
    const [professorId, setProfessorId] = useState('');
    const [disciplinaId, setDisciplinaId] = useState(''); // ID da MatrizDisciplina
    const [horarioId, setHorarioId] = useState('');
    const [turmaId, setTurmaId] = useState('');
    // -----------------------------

    // Função Salvar (Criar/Editar)
    const handleSave = async () => {
        if (!professorId || !disciplinaId || !horarioId || !turmaId) {
            toast.error('Todos os campos são obrigatórios');
            return;
        }
        const alocacaoData = { professorId, matrizDisciplinaId: disciplinaId, horarioId, turmaId };
        const url = editingAlocacao ? `/admin/alocacoes/${editingAlocacao.id}` : '/admin/alocacoes';
        const method = editingAlocacao ? 'PATCH' : 'POST';

        try {
            const savedAlocacao = await fetchJsonWithAuth<AlocacaoResponse>(url, { method, body: JSON.stringify(alocacaoData) });
            await fetchData(); // Recarrega a lista toda para garantir consistência
            toast.success(`Alocação ${editingAlocacao ? 'atualizada' : 'realizada'} com sucesso!`);
            closeDialog();
        } catch (error) {
            console.error('Erro ao salvar alocação:', error);
            // O toast de erro (ex: conflito) já é mostrado pelo helper api.ts
            // Adiciono um log específico para o caso de conflito
            if (error instanceof Error && error.message.includes('409')) { // 409 Conflict
                toast.error("Erro ao salvar: Conflito de horário detectado. Verifique as alocações existentes.");
            }
        }
    };

    // Função Deletar
    const handleDelete = async (id: string) => {
        if (!window.confirm("Tem certeza que deseja excluir esta alocação?")) return;
        try {
            await fetchWithAuth(`/admin/alocacoes/${id}`, { method: 'DELETE' });
            setAlocacoes(prev => prev.filter(a => a.id !== id));
            toast.success('Alocação excluída com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir alocação:', error);
        }
    };

    // Limpa formulário e fecha modal
    const closeDialog = () => {
        setIsDialogOpen(false); setEditingAlocacao(null);
        setProfessorId(''); setDisciplinaId(''); setHorarioId(''); setTurmaId('');
    };

    // Preenche formulário para edição
    const openEdit = (alocacao: AlocacaoResponse) => {
        setEditingAlocacao(alocacao);
        setProfessorId(alocacao.professorResponseSimples?.id || '');
        setDisciplinaId(alocacao.matrizDisciplinaResponseSimples?.id || '');
        setHorarioId(alocacao.horarioResponse?.id || '');
        setTurmaId(alocacao.turmaResponse?.id || '');
        // Não preciso recarregar dados dos selects aqui
        setIsDialogOpen(true);
    };

    // Abre modal limpo para criar
    const openNew = () => {
        closeDialog();
        // Não preciso recarregar dados dos selects aqui
        setIsDialogOpen(true);
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Gerenciar Alocações</h1>
                    <p className="text-muted-foreground">Aloque professores nas disciplinas e horários.</p>
                </div>
                {/* Modal */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        {/* Desabilita se dados essenciais ainda não carregaram ou falharam */}
                        <Button onClick={openNew} disabled={loading || fetchError !== null || loadingModalData}>
                            <Plus className="h-4 w-4 mr-2" />
                            Nova Alocação
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingAlocacao ? 'Editar Alocação' : 'Nova Alocação'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                            {/* Select Professor */}
                            <div className="space-y-2">
                                <Label>Professor</Label>
                                <Select value={professorId} onValueChange={setProfessorId} disabled={loadingModalData}>
                                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>
                                        {professores.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.nome || `ID: ${p.id}`}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Select Disciplina (MatrizDisciplina) */}
                            <div className="space-y-2">
                                <Label>Disciplina (da Matriz)</Label>
                                <Select value={disciplinaId} onValueChange={setDisciplinaId} disabled={loadingModalData || fetchError !== null}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={fetchError ? "Erro ao carregar" : "Selecione..."} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {/* Populo SÓ com as disciplinas válidas filtradas */}
                                        {matrizDisciplinas.map((d) => (
                                            <SelectItem key={d.id} value={String(d.id)}>
                                                {/* Uso '!' pois já filtrei nulos, mas adiciono fallback */}
                                                {d.disciplinaResponse!.nome || `Disciplina Inválida ID: ${d.disciplinaResponse!.id}`} (Sem: {d.semestre})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {/* Mostro erro específico se a busca falhou */}
                                {fetchError && <p className="text-xs text-destructive mt-1">{fetchError}</p>}
                                {!loadingModalData && matrizDisciplinas.length === 0 && !fetchError && <p className="text-xs text-destructive mt-1">Nenhuma disciplina válida encontrada.</p>}
                            </div>

                            {/* Select Horário */}
                            <div className="space-y-2">
                                <Label>Horário</Label>
                                <Select value={horarioId} onValueChange={setHorarioId} disabled={loadingModalData}>
                                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>
                                        {horarios.map((h) => <SelectItem key={h.id} value={String(h.id)}>{`${DIAS_MAP[h.diaSemana]} ${h.horarioInicio}-${h.horarioFinal}`}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Select Turma */}
                            <div className="space-y-2">
                                <Label>Turma</Label>
                                <Select value={turmaId} onValueChange={setTurmaId} disabled={loadingModalData}>
                                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>
                                        {turmas.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.codigo || `ID: ${t.id}`}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            {loadingModalData && <p className="text-xs text-muted-foreground text-center pt-2">Carregando opções...</p>}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
                            {/* Desabilito salvar se selects estiverem carregando ou houve erro nas disciplinas */}
                            <Button onClick={handleSave} disabled={loadingModalData || loading || fetchError !== null}>
                                {editingAlocacao ? 'Atualizar' : 'Alocar'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Listagem das Alocações */}
            {loading ? <p>Carregando alocações...</p> : fetchError ? (
                <p className="text-destructive text-center">{fetchError}. Não foi possível carregar as alocações.</p>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Semestre Vigente</CardTitle>
                        <CardDescription>{alocacoes.length} alocações realizadas</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {alocacoes.map((alocacao) => (
                                <div key={alocacao.id} className="p-4 border rounded-lg">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-5 w-5 text-primary" />
                                            {/* Acesso seguro aos dados */}
                                            <h3 className="font-semibold">{alocacao.turmaResponse?.codigo || '?'}</h3>
                                        </div>
                                        <Badge>Ativa</Badge>
                                    </div>
                                    <div className="grid gap-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <span>{alocacao.professorResponseSimples?.nome || '?'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                                            <span>{alocacao.matrizDisciplinaResponseSimples?.disciplinaResponse?.nome || '?'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <span>{alocacao.horarioResponse ? `${DIAS_MAP[alocacao.horarioResponse.diaSemana]} ${alocacao.horarioResponse.horarioInicio}-${alocacao.horarioResponse.horarioFinal}` : '?'}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-3 justify-end">
                                        <Button variant="outline" size="sm" onClick={() => openEdit(alocacao)}>
                                            <Pencil className="h-4 w-4 mr-2" /> Editar
                                        </Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleDelete(String(alocacao.id))}>
                                            <Trash className="h-4 w-4 mr-2" /> Excluir
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {alocacoes.length === 0 && <p>Nenhuma alocação encontrada.</p>}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default Alocacoes;