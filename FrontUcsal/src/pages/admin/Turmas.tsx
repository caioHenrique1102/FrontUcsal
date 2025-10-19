import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash, Users } from 'lucide-react';
import { toast } from 'sonner';
// Importo meus helpers de API
import { fetchJsonWithAuth, fetchWithAuth } from '@/lib/api';

// --- Interfaces (Baseadas nos DTOs do Backend) ---
interface TurmaResponse { // Resposta de GET /api/turmas
    id: string; // UUID
    codigo: string;
    nomeCurso: string; // Vem o nome, não o ID do curso
}

interface CursoResponseSimples { // DTO simples de Curso (para o Select)
    id: string;
    nome: string;
}

// Interface para a Resposta Paginada de Cursos (GET /admin/api/cursos)
interface Page<T> {
    content: T[];
}
// -------------------------------------------------

const Turmas = () => {
    // Estado para a lista de turmas
    const [turmas, setTurmas] = useState<TurmaResponse[]>([]);
    // Estado para a lista de cursos (usado no Select do modal)
    const [cursos, setCursos] = useState<CursoResponseSimples[]>([]);
    const [loading, setLoading] = useState(true); // Loading da lista principal
    const [loadingModalData, setLoadingModalData] = useState(false); // Loading dos cursos no modal

    // Minha função para buscar as turmas
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Chamo a API de turmas (não é paginada, não tem /admin)
            const data = await fetchJsonWithAuth<TurmaResponse[]>('/api/turmas?sort=codigo'); // Pede ordenado
            setTurmas(data || []);
        } catch (error) {
            console.error("Erro ao carregar turmas:", error);
            // Erro 500 pode acontecer se houver turmas sem curso associado no backend
            setTurmas([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Minha função para buscar os cursos (para o Select do modal)
    const fetchCursos = async () => {
        setLoadingModalData(true);
        try {
            // Busco os cursos ativos (paginado)
            const cursosPage = await fetchJsonWithAuth<Page<CursoResponseSimples>>('/admin/api/cursos?ativo=true&size=200&sort=nome');
            setCursos(cursosPage?.content || []);
            if (!cursosPage?.content || cursosPage.content.length === 0) {
                toast.info("Nenhum curso ativo encontrado para associar à turma.");
            }
        } catch (error) {
            console.error("Erro ao buscar cursos:", error);
            setCursos([]);
        } finally {
            setLoadingModalData(false);
        }
    };

    // Busco as turmas ao montar
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Estados do formulário do Modal ---
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTurma, setEditingTurma] = useState<TurmaResponse | null>(null);
    const [codigo, setCodigo] = useState('');
    const [cursoId, setCursoId] = useState(''); // ID do curso selecionado
    // ------------------------------------

    // Minha função Salvar (Criar/Editar)
    const handleSave = async () => {
        // Validações
        if (!codigo.trim() || !cursoId) {
            toast.error('Código da turma e curso são obrigatórios');
            return;
        }

        // Preparo os dados conforme DTOs do backend
        // TurmaCreateRequest e TurmaUpdateRequest esperam: codigo, cursoId
        const turmaData = { codigo: codigo.trim(), cursoId };
        const url = editingTurma ? `/api/turmas/${editingTurma.id}` : '/api/turmas';
        const method = editingTurma ? 'PATCH' : 'POST';

        try {
            // Chamo a API
            const savedTurma = await fetchJsonWithAuth<TurmaResponse>(url, {
                method,
                body: JSON.stringify(turmaData),
            });

            // Atualizo a lista na tela
            if (editingTurma) {
                setTurmas(turmas.map(t => (t.id === editingTurma.id ? savedTurma : t)));
                toast.success('Turma atualizada com sucesso');
            } else {
                setTurmas([...turmas, savedTurma]);
                toast.success('Turma cadastrada com sucesso');
            }
            closeDialog(); // Fecho o modal
        } catch (error) {
            console.error('Erro ao salvar turma:', error);
            // O toast de erro (ex: TurmaJaExiste) já foi mostrado pelo helper api.ts
        }
    };

    // Minha função Deletar
    const handleDelete = async (id: string) => {
        if (!window.confirm("Tem certeza que deseja excluir esta turma?")) {
            return;
        }
        try {
            await fetchWithAuth(`/api/turmas/${id}`, { method: 'DELETE' });
            setTurmas(turmas.filter(t => t.id !== id)); // Removo da lista
            toast.success('Turma excluída com sucesso');
        } catch (error) {
            console.error('Erro ao excluir turma:', error);
        }
    };

    // Fecha o modal e limpa os campos
    const closeDialog = () => {
        setIsDialogOpen(false);
        setEditingTurma(null);
        setCodigo('');
        setCursoId('');
    };

    // Preenche o formulário para editar
    const openEdit = (turma: TurmaResponse) => {
        setEditingTurma(turma);
        setCodigo(turma.codigo);
        // Para editar, preciso buscar os cursos para popular o select
        // e tentar pré-selecionar o curso atual (pode falhar se o nome for ambíguo)
        fetchCursos().then(() => {
            const cursoAtual = cursos.find(c => c.nome === turma.nomeCurso);
            setCursoId(cursoAtual?.id || ''); // Pré-seleciona se encontrar
        });
        setIsDialogOpen(true);
    };

    // Abre o modal limpo para criar
    const openNew = () => {
        closeDialog();
        // Busco os cursos para popular o select
        fetchCursos();
        setIsDialogOpen(true);
    };

    // --- Renderização ---
    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Gerenciar Turmas</h1>
                    <p className="text-muted-foreground">Cadastre os códigos das turmas e associe aos cursos.</p>
                </div>
                {/* Modal (Dialog) */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openNew}>
                            <Plus className="h-4 w-4 mr-2" />
                            Nova Turma
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingTurma ? 'Editar Turma' : 'Nova Turma'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="codigo">Código da Turma</Label>
                                <Input id="codigo" value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ex: ADS20251A"/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="curso">Curso</Label>
                                <Select value={cursoId} onValueChange={setCursoId} disabled={loadingModalData}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={loadingModalData ? "Carregando cursos..." : "Selecione o curso"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {/* Populo o Select com os cursos buscados */}
                                        {cursos.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {!loadingModalData && cursos.length === 0 && <p className="text-xs text-destructive">Nenhum curso ativo encontrado.</p>}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
                            {/* Desabilito salvar se não houver cursos (e não estiver editando) */}
                            <Button onClick={handleSave} disabled={loadingModalData || (cursos.length === 0 && !editingTurma)}>
                                {editingTurma ? 'Atualizar' : 'Salvar'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Lista de Turmas */}
            {loading ? <p>Carregando turmas...</p> : (
                <div className="grid gap-4 md:grid-cols-3">
                    {turmas.map((turma) => (
                        <Card key={turma.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-full">
                                            <Users className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle>{turma.codigo}</CardTitle>
                                            {/* Mostro o nome do curso que veio na resposta */}
                                            <CardDescription>{turma.nomeCurso || 'Curso não associado'}</CardDescription>
                                        </div>
                                    </div>
                                    {/* API não retorna status ativo */}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-2 justify-end">
                                    <Button variant="outline" size="sm" onClick={() => openEdit(turma)}>
                                        <Pencil className="h-4 w-4" /> {/* Ícone */}
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => handleDelete(String(turma.id))}>
                                        <Trash className="h-4 w-4" /> {/* Ícone */}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {turmas.length === 0 && <p>Nenhuma turma encontrada.</p>}
                </div>
            )}
        </div>
    );
};

export default Turmas;