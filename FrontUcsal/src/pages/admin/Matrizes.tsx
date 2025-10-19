import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash, Library } from 'lucide-react';
import { toast } from 'sonner';
// Importo meus helpers de API
import { fetchJsonWithAuth, fetchWithAuth } from '@/lib/api';

// --- Interfaces (Baseadas nos DTOs do Backend) ---
interface MatrizResponse { // Resposta de GET /admin/api/matrizes
    id: string; // UUID
    nome: string; // Gerado no backend como "Curso + Ano"
    anoVigencia: string; // Vem como string 'YYYY'
    curso: CursoResponseSimples; // DTO aninhado (no backend é CursoResponseSimples)
}

interface CursoResponseSimples { // DTO simples de Curso (para o select e na MatrizResponse)
    id: string;
    nome: string;
}

// Interface para a Resposta Paginada de Cursos (GET /admin/api/cursos)
interface Page<T> {
    content: T[];
}
// -------------------------------------------------

const Matrizes = () => {
    // Estado para a lista de matrizes
    const [matrizes, setMatrizes] = useState<MatrizResponse[]>([]);
    // Estado para os cursos (usado no Select do modal)
    const [cursos, setCursos] = useState<CursoResponseSimples[]>([]);
    const [loading, setLoading] = useState(true); // Loading da lista principal
    const [loadingModalData, setLoadingModalData] = useState(false); // Loading dos cursos no modal

    // Minha função para buscar matrizes
    const fetchMatrizes = useCallback(async () => {
        setLoading(true);
        try {
            // Chamo a API de matrizes (não é paginada)
            const data = await fetchJsonWithAuth<MatrizResponse[]>('/admin/api/matrizes?sort=nome'); // Pede ordenado
            setMatrizes(data || []);
        } catch (error) {
            console.error("Erro ao carregar matrizes:", error);
            setMatrizes([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Minha função para buscar cursos (para o Select)
    const fetchCursos = async () => {
        setLoadingModalData(true);
        try {
            // Busco a lista paginada de cursos
            const cursosPage = await fetchJsonWithAuth<Page<CursoResponseSimples>>('/admin/api/cursos?ativo=true&size=200&sort=nome'); // Pego só ativos
            setCursos(cursosPage?.content || []);
            if (!cursosPage?.content || cursosPage.content.length === 0) {
                toast.info("Nenhum curso ativo encontrado para associar à matriz.");
            }
        } catch (error) {
            console.error("Erro ao buscar cursos:", error);
            setCursos([]);
        } finally {
            setLoadingModalData(false);
        }
    };

    // Busco as matrizes ao montar
    useEffect(() => {
        fetchMatrizes();
    }, [fetchMatrizes]);

    // --- Estados do formulário do Modal ---
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingMatriz, setEditingMatriz] = useState<MatrizResponse | null>(null);
    const [anoVigencia, setAnoVigencia] = useState(''); // Armazena o ano YYYY
    const [cursoId, setCursoId] = useState('');
    // ------------------------------------

    // Minha função Salvar (Criar/Editar)
    const handleSave = async () => {
        // Validações
        if (!anoVigencia.trim() || !cursoId) {
            toast.error('Ano de vigência (YYYY) e curso são obrigatórios');
            return;
        }
        const anoNum = parseInt(anoVigencia);
        if (isNaN(anoNum) || anoVigencia.length !== 4) {
            toast.error('Ano de vigência inválido. Use o formato AAAA.');
            return;
        }

        // Preparo os dados conforme DTOs do backend
        // MatrizCreateRequest e MatrizUpdateRequest esperam: anoVigencia (String YYYY), cursoId
        const matrizData = {
            anoVigencia: anoVigencia, // Envio como string YYYY
            cursoId: cursoId
        };

        // Defino URL e Método
        const url = editingMatriz ? `/admin/api/matrizes/${editingMatriz.id}` : '/admin/api/matrizes';
        const method = editingMatriz ? 'PATCH' : 'POST';

        try {
            // Chamo a API
            const savedMatriz = await fetchJsonWithAuth<MatrizResponse>(url, {
                method,
                body: JSON.stringify(matrizData),
            });

            // Atualizo a lista na tela
            if (editingMatriz) {
                setMatrizes(matrizes.map(m => (m.id === editingMatriz.id ? savedMatriz : m)));
                toast.success('Matriz atualizada com sucesso');
            } else {
                setMatrizes([...matrizes, savedMatriz]);
                toast.success('Matriz cadastrada com sucesso');
            }
            closeDialog(); // Fecho o modal
        } catch (error) {
            console.error('Erro ao salvar matriz:', error);
            // O toast de erro (ex: MatrizJaExisteParaCursoEAnoException) já foi mostrado pelo helper api.ts
        }
    };

    // Minha função Deletar
    const handleDelete = async (id: string) => {
        if (!window.confirm("Tem certeza que deseja excluir esta matriz curricular?")) {
            return;
        }
        try {
            await fetchWithAuth(`/admin/api/matrizes/${id}`, { method: 'DELETE' });
            setMatrizes(matrizes.filter(m => m.id !== id)); // Removo da lista
            toast.success('Matriz excluída com sucesso');
        } catch (error) {
            console.error('Erro ao excluir matriz:', error);
        }
    };

    // Fecha o modal e limpa os campos
    const closeDialog = () => {
        setIsDialogOpen(false);
        setEditingMatriz(null);
        setAnoVigencia('');
        setCursoId('');
    };

    // Preenche o formulário para editar
    const openEdit = (matriz: MatrizResponse) => {
        setEditingMatriz(matriz);
        setAnoVigencia(matriz.anoVigencia.toString()); // Pego o ano
        setCursoId(matriz.curso?.id || ''); // Pego o ID do curso associado
        // Busco os cursos para garantir que o select esteja populado
        if (cursos.length === 0) {
            fetchCursos();
        }
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
                    <h1 className="text-3xl font-bold">Gerenciar Matrizes Curriculares</h1>
                    <p className="text-muted-foreground">Cadastre as matrizes associadas aos cursos.</p>
                </div>
                {/* Modal (Dialog) */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openNew}>
                            <Plus className="h-4 w-4 mr-2" />
                            Nova Matriz
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingMatriz ? 'Editar Matriz' : 'Nova Matriz'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="anoVigencia">Ano de Vigência</Label>
                                <Input id="anoVigencia" type="number" value={anoVigencia} onChange={(e) => setAnoVigencia(e.target.value)} placeholder="Ex: 2025" maxLength={4}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="curso">Curso</Label>
                                <Select value={cursoId} onValueChange={setCursoId} disabled={loadingModalData}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={loadingModalData ? "Carregando cursos..." : "Selecione o curso"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {/* Populo o Select com os cursos */}
                                        {cursos.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {!loadingModalData && cursos.length === 0 && <p className="text-xs text-destructive">Nenhum curso ativo encontrado.</p>}
                            </div>
                            {/* O campo 'nome' não é editável/criado aqui, é gerado no backend */}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
                            {/* Desabilito salvar se não houver cursos (e não estiver editando) */}
                            <Button onClick={handleSave} disabled={loadingModalData || (cursos.length === 0 && !editingMatriz)}>
                                {editingMatriz ? 'Atualizar' : 'Salvar'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Lista de Matrizes */}
            {loading ? <p>Carregando matrizes...</p> : (
                <div className="grid gap-4 md:grid-cols-2">
                    {matrizes.map((matriz) => (
                        <Card key={matriz.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-full">
                                            <Library className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            {/* Nome gerado (Curso + Ano) */}
                                            <CardTitle>{matriz.nome}</CardTitle>
                                            {/* Nome do Curso associado */}
                                            <CardDescription>{matriz.curso?.nome || 'Curso não encontrado'}</CardDescription>
                                        </div>
                                    </div>
                                    {/* Não há status 'ativo' para Matriz */}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Ano: {matriz.anoVigencia}
                                </p>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => openEdit(matriz)}>
                                        <Pencil className="h-4 w-4 mr-2" /> Editar
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => handleDelete(String(matriz.id))}>
                                        <Trash className="h-4 w-4 mr-2" /> Excluir
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {matrizes.length === 0 && <p>Nenhuma matriz curricular encontrada.</p>}
                </div>
            )}
        </div>
    );
};

export default Matrizes;