import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, User } from 'lucide-react';
import { toast } from 'sonner';

interface Professor {
    id: string;
    registro: string;
    nome: string;
    escolas: { id: string; categoriaEscola: string }[];
    ativo: boolean;
    cpf: string;
    email: string;
}

interface Escola {
    id: string;
    categoriaEscola: string;
}

const Professores = () => {
    const [professores, setProfessores] = useState<Professor[]>([]);
    const [escolas, setEscolas] = useState<Escola[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profResponse, escolasResponse] = await Promise.all([
                    fetch('/api/professores', { headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } }),
                    fetch('/admin/api/escolas/ativas', { headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } })
                ]);

                if (!profResponse.ok || !escolasResponse.ok) throw new Error('Falha ao carregar dados');

                const profData = await profResponse.json();
                const escolasData = await escolasResponse.json();

                setProfessores(profData);
                setEscolas(escolasData);
            } catch (error) {
                toast.error("Erro ao carregar professores ou escolas.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProf, setEditingProf] = useState<Professor | null>(null);
    const [registro, setRegistro] = useState('');
    const [nome, setNome] = useState('');
    const [escola, setEscola] = useState('');
    const [cpf, setCpf] = useState('');
    const [email, setEmail] = useState('');

    const handleSave = async () => {
        if (!registro.trim() || !nome.trim() || !escola || !cpf.trim() || !email.trim()) {
            toast.error('Todos os campos são obrigatórios');
            return;
        }

        const professorData = { nome, cpf, email, registro, escolasIds: [escola] };
        const url = editingProf ? `/api/professores/${editingProf.id}` : '/api/professores';
        const method = editingProf ? 'PATCH' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(professorData),
            });

            if (!response.ok) throw new Error('Falha ao salvar professor');

            const savedProfessor = await response.json();

            if (editingProf) {
                setProfessores(professores.map(p => (p.id === editingProf.id ? savedProfessor : p)));
                toast.success('Professor atualizado com sucesso');
            } else {
                setProfessores([...professores, savedProfessor]);
                toast.success('Professor cadastrado com sucesso');
            }

            closeDialog();
        } catch (error) {
            toast.error('Erro ao salvar professor');
        }
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        setEditingProf(null);
        setRegistro('');
        setNome('');
        setEscola('');
        setCpf('');
        setEmail('');
    };

    const toggleStatus = async (id: string, ativo: boolean) => {
        const url = `/api/professores/${id}/${ativo ? 'desativar' : 'ativar'}`;
        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
            });

            if (!response.ok) throw new Error('Falha ao atualizar status');

            setProfessores(professores.map(p => (p.id === id ? { ...p, ativo: !ativo } : p)));
            toast.success('Status atualizado com sucesso');
        } catch (error) {
            toast.error('Erro ao atualizar status do professor');
        }
    };

    const openEdit = (prof: Professor) => {
        setEditingProf(prof);
        setRegistro(prof.registro);
        setNome(prof.nome);
        setEscola(prof.escolas.length > 0 ? prof.escolas[0].id : '');
        setCpf(prof.cpf);
        setEmail(prof.email);
        setIsDialogOpen(true);
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Gerenciar Professores</h1>
                    <p className="text-muted-foreground">Cadastre e gerencie os professores</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={closeDialog}>
                            <Plus className="h-4 w-4 mr-2" />
                            Novo Professor
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingProf ? 'Editar Professor' : 'Novo Professor'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="nome">Nome Completo</Label>
                                <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cpf">CPF</Label>
                                <Input id="cpf" value={cpf} onChange={(e) => setCpf(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="registro">Número de Registro</Label>
                                <Input id="registro" value={registro} onChange={(e) => setRegistro(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="escola">Escola</Label>
                                <Select value={escola} onValueChange={setEscola}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione a escola" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {escolas.map((e) => (
                                            <SelectItem key={e.id} value={e.id}>{e.categoriaEscola}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
                    {professores.map((prof) => (
                        <Card key={prof.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-full">
                                            <User className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle>{prof.nome}</CardTitle>
                                            <CardDescription>
                                                Registro: {prof.registro} • {prof.escolas.map(e => e.categoriaEscola).join(', ')}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Badge variant={prof.ativo ? 'default' : 'secondary'}>
                                        {prof.ativo ? 'Ativo' : 'Inativo'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => openEdit(prof)}>
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Editar
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => toggleStatus(prof.id, prof.ativo)}>
                                        {prof.ativo ? 'Desativar' : 'Ativar'}
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

export default Professores;