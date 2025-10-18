import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, User, BookOpen, Clock, Trash, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { fetchJsonWithAuth, fetchWithAuth } from '@/lib/api'; // Meus helpers

// Interfaces para os dados como vêm da API
interface Alocacao {
    id: string;
    professorResponseSimples: { id: string; nome: string };
    matrizDisciplinaResponseSimples: { id: string; disciplinaResponse: { nome: string } };
    horarioResponse: { id: string; diaSemana: 'SEGUNDA' | 'TERCA' | 'QUARTA' | 'QUINTA' | 'SEXTA' | 'SABADO'; horarioInicio: string; horarioFinal: string; };
    turmaResponse: { id: string; codigo: string };
}

// Interfaces para os dados dos Selects
interface ProfessorSimples { id: string; nome: string; }
interface MatrizDisciplina { id: string; disciplinaResponse: { nome: string }; }
interface Horario { id: string; diaSemana: 'SEGUNDA' | 'TERCA' | 'QUARTA' | 'QUINTA' | 'SEXTA' | 'SABADO'; horarioInicio: string; horarioFinal: string; }
interface Turma { id: string; codigo: string; }

// Mapeamento de dias (para exibir)
const DIAS_MAP: Record<Horario['diaSemana'], string> = {
    SEGUNDA: 'Seg', TERCA: 'Ter', QUARTA: 'Qua', QUINTA: 'Qui', SEXTA: 'Sex', SABADO: 'Sáb'
};

const Alocacoes = () => {
    // Estados para armazenar dados da API
    const [alocacoes, setAlocacoes] = useState<Alocacao[]>([]);
    const [professores, setProfessores] = useState<ProfessorSimples[]>([]);
    const [disciplinas, setDisciplinas] = useState<MatrizDisciplina[]>([]);
    const [horarios, setHorarios] = useState<Horario[]>([]);
    const [turmas, setTurmas] = useState<Turma[]>([]);
    const [loading, setLoading] = useState(true);

    // Função para buscar todos os dados necessários para os selects e a lista
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Eu faço todas as buscas em paralelo para otimizar o carregamento
            const [alocData, profData, discData, horData, turmaData] = await Promise.all([
                fetchJsonWithAuth<Alocacao[]>('/admin/alocacoes'),
                fetchJsonWithAuth<ProfessorSimples[]>('/api/professores/ativos'), // Busco só professores ativos
                fetchJsonWithAuth<MatrizDisciplina[]>('/api/matriz-disciplinas'), // Busco MatrizDisciplinas
                fetchJsonWithAuth<Horario[]>('/api/horarios'),
                fetchJsonWithAuth<Turma[]>('/api/turmas'),
            ]);

            setAlocacoes(alocData || []);
            setProfessores(profData || []);
            setDisciplinas(discData || []);
            setHorarios(horData || []);
            setTurmas(turmaData || []);

        } catch (error) {
            console.error("Erro ao carregar dados para alocação:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Busco os dados ao montar o componente
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Estados para o formulário do modal
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAlocacao, setEditingAlocacao] = useState<Alocacao | null>(null);
    const [professorId, setProfessorId] = useState('');
    const [disciplinaId, setDisciplinaId] = useState(''); // ID da MatrizDisciplina
    const [horarioId, setHorarioId] = useState('');
    const [turmaId, setTurmaId] = useState('');

    // Função para salvar (criar ou editar)
    const handleSave = async () => {
        if (!professorId || !disciplinaId || !horarioId || !turmaId) {
            toast.error('Todos os campos são obrigatórios');
            return;
        }

        // Monto o corpo da requisição com os IDs
        const alocacaoData = { professorId, matrizDisciplinaId: disciplinaId, horarioId, turmaId };
        const url = editingAlocacao ? `/admin/alocacoes/${editingAlocacao.id}` : '/admin/alocacoes';
        // Uso PATCH para atualizar e POST para criar
        const method = editingAlocacao ? 'PATCH' : 'POST';

        try {
            const savedAlocacao = await fetchJsonWithAuth<Alocacao>(url, {
                method,
                body: JSON.stringify(alocacaoData),
            });

            if (editingAlocacao) {
                // Atualizo na lista local
                setAlocacoes(alocacoes.map(a => (a.id === editingAlocacao.id ? savedAlocacao : a)));
                toast.success('Alocação atualizada com sucesso!');
            } else {
                // Adiciono na lista local
                setAlocacoes([...alocacoes, savedAlocacao]);
                toast.success('Alocação realizada com sucesso!');
            }
            closeDialog(); // Fecho e limpo o modal
        } catch (error) {
            console.error('Erro ao salvar alocação:', error);
            // O toast de erro (ex: conflito de horário) já é mostrado pelo meu helper
        }
    };

    // Função para deletar alocação
    const handleDelete = async (id: string) => {
        if (!window.confirm("Tem certeza que deseja excluir esta alocação?")) {
            return;
        }
        try {
            await fetchWithAuth(`/admin/alocacoes/${id}`, { method: 'DELETE' });
            setAlocacoes(alocacoes.filter(a => a.id !== id)); // Removo da lista local
            toast.success('Alocação excluída com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir alocação:', error);
        }
    };

    // Limpa o formulário e fecha o modal
    const closeDialog = () => {
        setIsDialogOpen(false);
        setEditingAlocacao(null);
        setProfessorId('');
        setDisciplinaId('');
        setHorarioId('');
        setTurmaId('');
    };

    // Preenche o formulário para edição
    const openEdit = (alocacao: Alocacao) => {
        setEditingAlocacao(alocacao);
        setProfessorId(alocacao.professorResponseSimples.id);
        setDisciplinaId(alocacao.matrizDisciplinaResponseSimples.id);
        setHorarioId(alocacao.horarioResponse.id);
        setTurmaId(alocacao.turmaResponse.id);
        setIsDialogOpen(true);
    };

    // Abre o modal limpo para criar
    const openNew = () => {
        closeDialog();
        setIsDialogOpen(true);
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Gerenciar Alocações</h1>
                    <p className="text-muted-foreground">Aloque professores nas disciplinas e horários</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openNew}>
                            <Plus className="h-4 w-4 mr-2" />
                            Nova Alocação
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingAlocacao ? 'Editar Alocação' : 'Nova Alocação'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4  max-h-[70vh] overflow-y-auto pr-2">
                            <div className="space-y-2">
                                <Label>Professor</Label>
                                <Select value={professorId} onValueChange={setProfessorId}>
                                    <SelectTrigger><SelectValue placeholder="Selecione o professor" /></SelectTrigger>
                                    <SelectContent>
                                        {professores.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Disciplina (da Matriz)</Label>
                                <Select value={disciplinaId} onValueChange={setDisciplinaId}>
                                    <SelectTrigger><SelectValue placeholder="Selecione a disciplina" /></SelectTrigger>
                                    <SelectContent>
                                        {disciplinas.map((d) => <SelectItem key={d.id} value={d.id}>{d.disciplinaResponse.nome}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Horário</Label>
                                <Select value={horarioId} onValueChange={setHorarioId}>
                                    <SelectTrigger><SelectValue placeholder="Selecione o horário" /></SelectTrigger>
                                    <SelectContent>
                                        {/* Formato o horário para exibição (ex: Seg 07:00-09:30) */}
                                        {horarios.map((h) => <SelectItem key={h.id} value={h.id}>{`${DIAS_MAP[h.diaSemana]} ${h.horarioInicio}-${h.horarioFinal}`}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Turma</Label>
                                <Select value={turmaId} onValueChange={setTurmaId}>
                                    <SelectTrigger><SelectValue placeholder="Selecione a turma" /></SelectTrigger>
                                    <SelectContent>
                                        {turmas.map((t) => <SelectItem key={t.id} value={t.id}>{t.codigo}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
                            <Button onClick={handleSave}>{editingAlocacao ? 'Atualizar' : 'Alocar'}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? <p>Carregando alocações...</p> : (
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
                                            <h3 className="font-semibold">{alocacao.turmaResponse.codigo}</h3>
                                        </div>
                                        {/* A API não informa o status da alocação, então fixei como 'Ativa' */}
                                        <Badge>Ativa</Badge>
                                    </div>
                                    <div className="grid gap-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <span>{alocacao.professorResponseSimples.nome}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                                            <span>{alocacao.matrizDisciplinaResponseSimples.disciplinaResponse.nome}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <span>{`${DIAS_MAP[alocacao.horarioResponse.diaSemana]} ${alocacao.horarioResponse.horarioInicio}-${alocacao.horarioResponse.horarioFinal}`}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-3 justify-end">
                                        <Button variant="outline" size="sm" onClick={() => openEdit(alocacao)}>
                                            <Pencil className="h-4 w-4 mr-2" /> Editar
                                        </Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleDelete(alocacao.id)}>
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