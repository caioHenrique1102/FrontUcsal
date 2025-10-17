import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Building2 } from 'lucide-react';
import { toast } from 'sonner';

interface Escola {
    id: string;
    categoriaEscola: string;
    ativo: boolean;
}

const Escolas = () => {
    const [escolas, setEscolas] = useState<Escola[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEscolas = async () => {
            try {
                const response = await fetch('/admin/api/escolas', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
                });
                if (!response.ok) throw new Error('Falha ao buscar escolas');
                const data = await response.json();
                setEscolas(data.content);
            } catch (error) {
                toast.error('Erro ao carregar escolas.');
            } finally {
                setLoading(false);
            }
        };
        fetchEscolas();
    }, []);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingEscola, setEditingEscola] = useState<Escola | null>(null);
    const [nome, setNome] = useState('');

    const handleSave = async () => {
        if (!nome.trim()) {
            toast.error('Nome da escola é obrigatório');
            return;
        }

        const escolaData = { categoriaEscola: nome };
        const url = editingEscola ? `/admin/api/escolas/${editingEscola.id}` : '/admin/api/escolas';
        const method = editingEscola ? 'PATCH' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(escolaData),
            });

            if (!response.ok) throw new Error('Falha ao salvar escola');

            const savedEscola = await response.json();

            if (editingEscola) {
                setEscolas(escolas.map(e => (e.id === editingEscola.id ? savedEscola : e)));
                toast.success('Escola atualizada com sucesso');
            } else {
                setEscolas([...escolas, savedEscola]);
                toast.success('Escola cadastrada com sucesso');
            }

            closeDialog();
        } catch (error) {
            toast.error('Erro ao salvar escola');
        }
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        setNome('');
        setEditingEscola(null);
    };

    const toggleStatus = async (id: string, ativo: boolean) => {
        const url = `/admin/api/escolas/${id}/${ativo ? 'desativar' : 'ativar'}`;

        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
            });

            if (!response.ok) throw new Error('Falha ao atualizar status');

            setEscolas(escolas.map(e => (e.id === id ? { ...e, ativo: !ativo } : e)));
            toast.success('Status atualizado com sucesso');
        } catch (error) {
            toast.error('Erro ao atualizar status da escola');
        }
    };

    const openEdit = (escola: Escola) => {
        setEditingEscola(escola);
        setNome(escola.categoriaEscola);
        setIsDialogOpen(true);
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Gerenciar Escolas</h1>
                    <p className="text-muted-foreground">Cadastre e gerencie as escolas da UCSAL</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => { setEditingEscola(null); setNome(''); setIsDialogOpen(true); }}>
                            <Plus className="h-4 w-4 mr-2" />
                            Nova Escola
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingEscola ? 'Editar Escola' : 'Nova Escola'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="nome">Nome da Escola</Label>
                                <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
                            <Button onClick={handleSave}>Salvar</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <p>Carregando escolas...</p>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {escolas.map((escola) => (
                        <Card key={escola.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="flex items-center gap-2">
                                            <Building2 className="h-5 w-5" />
                                            {escola.categoriaEscola}
                                        </CardTitle>
                                        <CardDescription className="mt-2">
                                            <Badge variant={escola.ativo ? 'default' : 'secondary'}>
                                                {escola.ativo ? 'Ativa' : 'Inativa'}
                                            </Badge>
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => openEdit(escola)}>
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Editar
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => toggleStatus(escola.id, escola.ativo)}>
                                        {escola.ativo ? 'Desativar' : 'Ativar'}
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

export default Escolas;