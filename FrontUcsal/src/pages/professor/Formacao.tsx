import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, GraduationCap, Trash } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface Formacao {
    id: string;
    categoria: string;
    nomeInstituicao: string;
    nomeCurso: string;
    anoConclusao: string;
}

const Formacao = () => {
    const { user } = useAuth();
    const [formacoes, setFormacoes] = useState<Formacao[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFormacoes = async () => {
            if (!user) return;
            try {
                const response = await fetch(`/api/formacoes?professorId=${user.id}`, { // Endpoint hipotético
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
                });
                if (!response.ok) throw new Error('Falha ao buscar formações');
                const data = await response.json();
                setFormacoes(data);
            } catch (error) {
                toast.error('Erro ao carregar formações.');
            } finally {
                setLoading(false);
            }
        };
        fetchFormacoes();
    }, [user]);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingFormacao, setEditingFormacao] = useState<Formacao | null>(null);
    const [categoria, setCategoria] = useState('');
    const [instituicao, setInstituicao] = useState('');
    const [curso, setCurso] = useState('');
    const [anoConclusao, setAnoConclusao] = useState('');

    const categorias = ['GRADUACAO', 'ESPECIALIZACAO', 'MBA', 'MESTRADO', 'DOUTORADO', 'POS_DOUTORADO'];

    const handleSave = async () => {
        if (!categoria || !instituicao || !curso || !anoConclusao || !user) {
            toast.error('Todos os campos são obrigatórios');
            return;
        }

        const formacaoData = { nomeCurso: curso, anoConclusao: `${anoConclusao}-01-01`, nomeInstituicao: instituicao, categoria, professorId: user.id };
        const url = editingFormacao ? `/api/formacoes/${editingFormacao.id}` : '/api/formacoes';
        const method = editingFormacao ? 'PATCH' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
                body: JSON.stringify(formacaoData),
            });

            if (!response.ok) throw new Error('Falha ao salvar formação');
            const savedFormacao = await response.json();

            if (editingFormacao) {
                setFormacoes(formacoes.map(f => (f.id === editingFormacao.id ? savedFormacao : f)));
                toast.success('Formação atualizada com sucesso');
            } else {
                setFormacoes([...formacoes, savedFormacao]);
                toast.success('Formação cadastrada com sucesso');
            }
            closeDialog();
        } catch (error) {
            toast.error('Erro ao salvar formação');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await fetch(`/api/formacoes/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
            });
            setFormacoes(formacoes.filter(f => f.id !== id));
            toast.success('Formação removida com sucesso.');
        } catch(err) {
            toast.error('Erro ao remover formação.');
        }
    }

    const closeDialog = () => {
        setIsDialogOpen(false);
        setEditingFormacao(null);
        setCategoria('');
        setInstituicao('');
        setCurso('');
        setAnoConclusao('');
    };

    const openEdit = (formacao: Formacao) => {
        setEditingFormacao(formacao);
        setCategoria(formacao.categoria);
        setInstituicao(formacao.nomeInstituicao);
        setCurso(formacao.nomeCurso);
        setAnoConclusao(formacao.anoConclusao.substring(0, 4));
        setIsDialogOpen(true);
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Minha Formação</h1>
                    <p className="text-muted-foreground">Gerencie suas formações acadêmicas</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => { setIsDialogOpen(true); }}>
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar Formação
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingFormacao ? 'Editar Formação' : 'Nova Formação'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Categoria</Label>
                                <Select value={categoria} onValueChange={setCategoria}>
                                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>
                                        {categorias.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="instituicao">Instituição</Label>
                                <Input id="instituicao" value={instituicao} onChange={(e) => setInstituicao(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="curso">Curso</Label>
                                <Input id="curso" value={curso} onChange={(e) => setCurso(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ano">Ano de Conclusão</Label>
                                <Input id="ano" type="number" value={anoConclusao} onChange={(e) => setAnoConclusao(e.target.value)} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
                            <Button onClick={handleSave}>Salvar</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? <p>Carregando...</p> : (
                <div className="grid gap-4">
                    {formacoes.map((formacao) => (
                        <Card key={formacao.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-full">
                                            <GraduationCap className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle>{formacao.nomeCurso}</CardTitle>
                                            <CardDescription>{formacao.nomeInstituicao}</CardDescription>
                                        </div>
                                    </div>
                                    <Badge>{formacao.categoria}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground">Concluído em {new Date(formacao.anoConclusao).getFullYear()}</p>
                                    <div className='flex gap-2'>
                                        <Button variant="outline" size="sm" onClick={() => openEdit(formacao)}>
                                            <Pencil className="h-4 w-4 mr-2" /> Editar
                                        </Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleDelete(formacao.id)}>
                                            <Trash className="h-4 w-4 mr-2" /> Excluir
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Formacao;