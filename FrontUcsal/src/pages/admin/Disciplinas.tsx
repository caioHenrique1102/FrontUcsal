import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, BookOpen, Trash } from 'lucide-react';
import { toast } from 'sonner';
import { fetchJsonWithAuth, fetchWithAuth } from '@/lib/api'; // Meus helpers

// Interface para Disciplina como vem da API
interface Disciplina {
    id: string;
    nome: string;
    descricao: string;
    ativo: boolean;
    // Carga horária não vem na listagem principal
}

const Disciplinas = () => {
    const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
    const [loading, setLoading] = useState(true);

    // Busco as disciplinas ao montar
    const fetchDisciplinas = useCallback(async () => {
        setLoading(true);
        try {
            // Uso o endpoint que lista todas as disciplinas (ativas e inativas)
            const data = await fetchJsonWithAuth<Disciplina[]>('/admin/api/disciplinas');
            setDisciplinas(data || []);
        } catch (error) {
            console.error('Erro ao buscar disciplinas:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDisciplinas();
    }, [fetchDisciplinas]);

    // Estados para o formulário do modal
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingDisc, setEditingDisc] = useState<Disciplina | null>(null);
    const [nome, setNome] = useState('');
    const [descricao, setDescricao] = useState('');

    // Eu removi 'sigla' e 'cargaHoraria' porque a API do backend não os utiliza no DTO

    // Função para salvar (criar ou editar)
    const handleSave = async () => {
        if (!nome.trim() || !descricao.trim()) {
            toast.error('Nome e descrição são obrigatórios');
            return;
        }

        // A API espera apenas nome e descrição
        const disciplinaData = { nome, descricao };
        const url = editingDisc ? `/admin/api/disciplinas/${editingDisc.id}` : '/admin/api/disciplinas';
        // Uso PATCH para atualizar (como no backend) e POST para criar
        const method = editingDisc ? 'PATCH' : 'POST';

        try {
            const savedDisciplina = await fetchJsonWithAuth<Disciplina>(url, {
                method,
                body: JSON.stringify(disciplinaData),
            });

            // A resposta da API não inclui o status 'ativo', então eu o mantenho
            const disciplinaComStatus = { ...savedDisciplina, ativo: editingDisc ? editingDisc.ativo : true };

            if (editingDisc) {
                setDisciplinas(disciplinas.map(d => (d.id === editingDisc.id ? disciplinaComStatus : d)));
                toast.success('Disciplina atualizada com sucesso');
            } else {
                setDisciplinas([...disciplinas, disciplinaComStatus]);
                toast.success('Disciplina cadastrada com sucesso');
            }
            closeDialog();
        } catch (error) {
            console.error('Erro ao salvar disciplina:', error);
        }
    };

    // Função para DELETAR
    const handleDelete = async (id: string) => {
        if (!window.confirm("Tem certeza que deseja excluir esta disciplina?")) {
            return;
        }
        try {
            await fetchWithAuth(`/admin/api/disciplinas/${id}`, { method: 'DELETE' });
            setDisciplinas(disciplinas.filter(d => d.id !== id)); // Remove da lista local
            toast.success('Disciplina excluída com sucesso');
        } catch (error) {
            console.error('Erro ao excluir disciplina:', error);
            toast.error('Erro ao excluir. Verifique se ela está em uso em alguma matriz.');
        }
    };

    // Limpa o formulário e fecha o modal
    const closeDialog = () => {
        setIsDialogOpen(false);
        setEditingDisc(null);
        setNome('');
        setDescricao('');
    };

    // ATENÇÃO: A API não possui endpoints para ativar/desativar disciplinas.
    // Eu removi essa funcionalidade. Se for necessária, ela precisa ser
    // adicionada ao DisciplinaController no backend.

    // Preenche o formulário para edição
    const openEdit = (disc: Disciplina) => {
        setEditingDisc(disc);
        setNome(disc.nome);
        setDescricao(disc.descricao);
        setIsDialogOpen(true);
    };

    const openNew = () => {
        closeDialog(); // Limpa o modal
        setIsDialogOpen(true); // Abre
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Gerenciar Disciplinas</h1>
                    <p className="text-muted-foreground">Cadastre e gerencie as disciplinas dos cursos</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openNew}>
                            <Plus className="h-4 w-4 mr-2" />
                            Nova Disciplina
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingDisc ? 'Editar Disciplina' : 'Nova Disciplina'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="nome">Nome da Disciplina</Label>
                                <Input
                                    id="nome"
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                    placeholder="Ex: Algoritmos e Programação"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="descricao">Descrição</Label>
                                <Input
                                    id="descricao"
                                    value={descricao}
                                    onChange={(e) => setDescricao(e.target.value)}
                                    placeholder="Ex: Estudo de algoritmos..."
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
                            <Button onClick={handleSave}>{editingDisc ? 'Atualizar' : 'Salvar'}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? <p>Carregando disciplinas...</p> : (
                <div className="grid gap-4 md:grid-cols-2">
                    {disciplinas.map((disc) => (
                        <Card key={disc.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-full">
                                            <BookOpen className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle>{disc.nome}</CardTitle>
                                            <CardDescription>{disc.descricao}</CardDescription>
                                        </div>
                                    </div>
                                    {/* O status 'ativo' vem da API de listagem */}
                                    <Badge variant={disc.ativo ? 'default' : 'secondary'}>
                                        {disc.ativo ? 'Ativa' : 'Inativa'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => openEdit(disc)}>
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Editar
                                    </Button>
                                    {/* Botão de Excluir */}
                                    <Button variant="destructive" size="sm" onClick={() => handleDelete(disc.id)}>
                                        <Trash className="h-4 w-4 mr-2" />
                                        Excluir
                                    </Button>
                                    {/* Removi o botão 'toggleStatus' pois a API não o suporta */}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {disciplinas.length === 0 && <p>Nenhuma disciplina encontrada.</p>}
                </div>
            )}
        </div>
    );
};

export default Disciplinas;