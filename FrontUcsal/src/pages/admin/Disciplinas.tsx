import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

interface Disciplina {
    id: string;
    nome: string;
    descricao: string;
    cargaHoraria: number;
    ativo: boolean;
}

const Disciplinas = () => {
    const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDisciplinas = async () => {
            try {
                const response = await fetch('/admin/api/disciplinas', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
                });
                if (!response.ok) throw new Error('Falha ao buscar disciplinas');
                const data = await response.json();
                setDisciplinas(data);
            } catch (error) {
                toast.error('Erro ao carregar disciplinas.');
            } finally {
                setLoading(false);
            }
        };
        fetchDisciplinas();
    }, []);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingDisc, setEditingDisc] = useState<Disciplina | null>(null);
    const [nome, setNome] = useState('');
    const [descricao, setDescricao] = useState('');
    const [cargaHoraria, setCargaHoraria] = useState('');

    const handleSave = async () => {
        if (!nome.trim() || !descricao.trim()) {
            toast.error('Nome e descrição são obrigatórios');
            return;
        }

        const disciplinaData = { nome, descricao };
        const url = editingDisc ? `/admin/api/disciplinas/${editingDisc.id}` : '/admin/api/disciplinas';
        const method = editingDisc ? 'PATCH' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(disciplinaData),
            });

            if (!response.ok) throw new Error('Falha ao salvar disciplina');

            const savedDisciplina = await response.json();

            if (editingDisc) {
                setDisciplinas(disciplinas.map(d => (d.id === editingDisc.id ? savedDisciplina : d)));
                toast.success('Disciplina atualizada com sucesso');
            } else {
                setDisciplinas([...disciplinas, savedDisciplina]);
                toast.success('Disciplina cadastrada com sucesso');
            }

            closeDialog();
        } catch (error) {
            toast.error('Erro ao salvar disciplina');
        }
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        setEditingDisc(null);
        setNome('');
        setDescricao('');
        setCargaHoraria('');
    };

    // A API de disciplinas não parece ter um endpoint para ativar/desativar
    // Mantendo a lógica no front-end por enquanto
    const toggleStatus = (id: string) => {
        setDisciplinas(disciplinas.map(d =>
            d.id === id ? { ...d, ativo: !d.ativo } : d
        ));
        toast.success('Status (local) atualizado com sucesso');
    };

    const openEdit = (disc: Disciplina) => {
        setEditingDisc(disc);
        setNome(disc.nome);
        setDescricao(disc.descricao);
        setCargaHoraria(String(disc.cargaHoraria));
        setIsDialogOpen(true);
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
                        <Button onClick={() => { setEditingDisc(null); closeDialog(); setIsDialogOpen(true); }}>
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
                                <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="descricao">Descrição</Label>
                                <Input id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
                            </div>
                            {/* Carga horária não está no DTO de criação/update do backend */}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
                            <Button onClick={handleSave}>Salvar</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? <p>Carregando...</p> : (
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
                                    <Button variant="outline" size="sm" onClick={() => toggleStatus(disc.id)}>
                                        {disc.ativo ? 'Desativar' : 'Ativar'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Disciplinas;