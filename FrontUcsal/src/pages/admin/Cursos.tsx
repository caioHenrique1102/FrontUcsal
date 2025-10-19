import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
// Importo meus helpers de API
import { fetchJsonWithAuth, fetchWithAuth } from '@/lib/api';

// --- Interfaces (Baseadas nos DTOs do Backend - Revisadas) ---
interface CursoResponse {
    id: string;
    nome: string;
    duracaoEmSemestre: number;
    escolaResponse: EscolaResponseSimples | null; // Escola pode ser nula? Adicionado verificação
    ativo: boolean;
}

interface EscolaResponseSimples {
    id: string;
    categoriaEscola: string;
}

interface Page<T> {
    content: T[];
    totalElements: number;
}
// -----------------------------------------------------------

const Cursos = () => {
    const [cursos, setCursos] = useState<CursoResponse[]>([]);
    const [escolasAtivas, setEscolasAtivas] = useState<EscolaResponseSimples[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingModalData, setLoadingModalData] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null); // Armazena erro da busca principal

    // Busca cursos (paginado)
    const fetchCursos = useCallback(async () => {
        setLoading(true);
        setFetchError(null); // Limpa erro anterior
        try {
            const cursosPage = await fetchJsonWithAuth<Page<CursoResponse>>('/admin/api/cursos?sort=nome&size=100');
            console.log("CURSOS - Dados recebidos:", cursosPage); // Log para depuração
            setCursos(cursosPage?.content || []);
            if (!cursosPage?.content) {
                console.warn("CURSOS - A API não retornou conteúdo na página de cursos.");
            }
        } catch (error) {
            console.error("CURSOS - Erro CRÍTICO ao carregar cursos:", error);
            setCursos([]);
            const errorMsg = `Falha ao carregar cursos: ${error instanceof Error ? error.message : 'Verifique o backend (Erro 500?)'}`;
            setFetchError(errorMsg);
            toast.error(errorMsg); // Mostra o erro
        } finally {
            setLoading(false);
        }
    }, []);

    // Busca escolas ativas (para o Select do modal)
    const fetchEscolasAtivas = async () => {
        setLoadingModalData(true);
        try {
            const escolasData = await fetchJsonWithAuth<EscolaResponseSimples[]>('/admin/api/escolas/ativas');
            setEscolasAtivas(escolasData || []);
            if (!escolasData || escolasData.length === 0) {
                toast.info("Nenhuma escola ativa encontrada.");
            }
        } catch (error) {
            console.error("CURSOS - Erro ao buscar escolas ativas:", error);
            setEscolasAtivas([]); // Limpa para evitar seleção inválida
        } finally {
            setLoadingModalData(false);
        }
    };

    // Busca cursos ao montar
    useEffect(() => {
        fetchCursos();
    }, [fetchCursos]);

    // Estados do formulário
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCurso, setEditingCurso] = useState<CursoResponse | null>(null);
    const [nome, setNome] = useState('');
    const [escolaId, setEscolaId] = useState('');
    const [duracao, setDuracao] = useState('');

    // Função Salvar (Criar/Editar)
    const handleSave = async () => {
        if (!nome.trim() || !escolaId || !duracao.trim()) {
            toast.error('Nome, escola e duração (semestres) são obrigatórios');
            return;
        }
        const duracaoNum = parseInt(duracao);
        if (isNaN(duracaoNum) || duracaoNum <= 0) {
            toast.error('Duração inválida.');
            return;
        }

        const cursoData = { nome: nome.trim(), escolaId, duracaoEmSemestre: duracaoNum };
        const url = editingCurso ? `/admin/api/cursos/${editingCurso.id}` : '/admin/api/cursos';
        const method = editingCurso ? 'PATCH' : 'POST';

        try {
            const savedCurso = await fetchJsonWithAuth<CursoResponse>(url, { method, body: JSON.stringify(cursoData) });
            await fetchCursos(); // Recarrego a lista para garantir consistência
            toast.success(`Curso ${editingCurso ? 'atualizado' : 'cadastrado'} com sucesso`);
            closeDialog();
        } catch (error) {
            console.error('Erro ao salvar curso:', error);
            // O helper api.ts já mostra o toast
        }
    };

    // Função Deletar
    const handleDelete = async (id: string) => {
        if (!window.confirm("Tem certeza?")) return;
        try {
            await fetchWithAuth(`/admin/api/cursos/${id}`, { method: 'DELETE' });
            setCursos(prev => prev.filter(c => c.id !== id));
            toast.success('Curso excluído');
        } catch (error) {
            console.error('Erro ao excluir curso:', error);
            toast.error(`Erro ao excluir: ${error instanceof Error ? error.message : 'Verifique dependências.'}`);
        }
    };

    // API NÃO TEM ATIVAR/DESATIVAR

    // Fecha modal e limpa form
    const closeDialog = () => {
        setIsDialogOpen(false); setEditingCurso(null);
        setNome(''); setEscolaId(''); setDuracao('');
    };

    // Preenche form para editar
    const openEdit = (curso: CursoResponse) => {
        setEditingCurso(curso);
        setNome(curso.nome);
        setEscolaId(curso.escolaResponse?.id || '');
        setDuracao(curso.duracaoEmSemestre.toString());
        if (escolasAtivas.length === 0) fetchEscolasAtivas();
        setIsDialogOpen(true);
    };

    // Abre form limpo para criar
    const openNew = () => {
        closeDialog();
        fetchEscolasAtivas();
        setIsDialogOpen(true);
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Gerenciar Cursos</h1>
                    <p className="text-muted-foreground">Cadastre os cursos oferecidos.</p>
                </div>
                {/* Modal */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openNew}>
                            <Plus className="h-4 w-4 mr-2" /> Novo Curso
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingCurso ? 'Editar Curso' : 'Novo Curso'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="nome">Nome</Label>
                                <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="duracao">Duração (Semestres)</Label>
                                <Input id="duracao" type="number" value={duracao} onChange={(e) => setDuracao(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="escola">Escola</Label>
                                <Select value={escolaId} onValueChange={setEscolaId} disabled={loadingModalData}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={loadingModalData ? "Carregando..." : "Selecione..."} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {escolasAtivas.map((e) => (
                                            <SelectItem key={e.id} value={String(e.id)}>
                                                {e.categoriaEscola.replace(/_/g, ' ')}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {!loadingModalData && escolasAtivas.length === 0 && <p className="text-xs text-destructive">Cadastre escolas ativas.</p>}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
                            <Button onClick={handleSave} disabled={loadingModalData || (escolasAtivas.length === 0 && !editingCurso)}>
                                {editingCurso ? 'Atualizar' : 'Salvar'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Lista de Cursos */}
            {loading ? <p>Carregando...</p> : fetchError ? (
                // Mostra erro se a busca inicial falhou
                <p className="text-destructive text-center">{fetchError}</p>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {cursos.map((curso) => (
                        <Card key={curso.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-full"><GraduationCap className="h-5 w-5 text-primary" /></div>
                                        <div>
                                            <CardTitle>{curso.nome}</CardTitle>
                                            {/* Acesso seguro à escola */}
                                            <CardDescription>{curso.escolaResponse?.categoriaEscola.replace(/_/g, ' ') || '?'}</CardDescription>
                                        </div>
                                    </div>
                                    {/* Badge Ativo/Inativo vem da API */}
                                    <Badge variant={curso.ativo ? 'default' : 'secondary'}>
                                        {curso.ativo ? 'Ativo' : 'Inativo'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">Duração: {curso.duracaoEmSemestre} sem.</p>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => openEdit(curso)}><Pencil className="h-4 w-4 mr-2" /> Editar</Button>
                                    <Button variant="destructive" size="sm" onClick={() => handleDelete(String(curso.id))}><Trash className="h-4 w-4 mr-2" /> Excluir</Button>

                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {cursos.length === 0 && <p>Nenhum curso encontrado.</p>}
                </div>
            )}
        </div>
    );
};

export default Cursos;