import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, User, Trash } from 'lucide-react'; // Adicionei o Trash
import { toast } from 'sonner';
import { fetchJsonWithAuth, fetchWithAuth } from '@/lib/api'; // Meus helpers

// Interface para Professor como vem da API
interface Professor {
    id: string;
    registro: string;
    nome: string;
    escolas: EscolaSimples[];
    ativo: boolean;
    cpf: string;
    email: string;
}

// Interface simplificada para Escola
interface EscolaSimples {
    id: string;
    categoriaEscola: string;
}

const Professores = () => {
    const [professores, setProfessores] = useState<Professor[]>([]);
    const [escolasAtivas, setEscolasAtivas] = useState<EscolaSimples[]>([]);
    const [loading, setLoading] = useState(true);

    // Função para buscar professores e escolas ativas
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Busco professores e escolas ativas em paralelo
            const [profData, escolasData] = await Promise.all([
                fetchJsonWithAuth<Professor[]>('/api/professores'), // Lista todos
                fetchJsonWithAuth<EscolaSimples[]>('/admin/api/escolas/ativas') // Lista só ativas para o Select
            ]);

            setProfessores(profData || []);
            setEscolasAtivas(escolasData || []);
        } catch (error) {
            console.error("Erro ao carregar professores ou escolas:", error);
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
    const [editingProf, setEditingProf] = useState<Professor | null>(null);
    const [registro, setRegistro] = useState('');
    const [nome, setNome] = useState('');
    const [escolaId, setEscolaId] = useState(''); // Armazena o ID da escola selecionada
    const [cpf, setCpf] = useState('');
    const [email, setEmail] = useState('');

    // Função para salvar (criar ou editar)
    const handleSave = async () => {
        if (!nome.trim() || !escolaId || !cpf.trim() || !email.trim() || (editingProf == null && !registro.trim())) {
            toast.error('Todos os campos (exceto registro ao editar) são obrigatórios');
            return;
        }

        let url: string;
        let method: string;
        let professorData: any;

        if (editingProf) {
            // ATUALIZAÇÃO (PATCH)
            // O DTO de update do backend (ProfessorUpdateRequest) só aceita nome, email, formacaoId e escolasIds
            url = `/api/professores/${editingProf.id}`;
            method = 'PATCH';
            professorData = {
                nome,
                email,
                escolasIds: [escolaId]
                // formacaoId: null // Adicionar se/quando o formulário tiver
            };
            // Eu não envio CPF e Registro na atualização, pois o DTO do backend não suporta
        } else {
            // CRIAÇÃO (POST)
            // O DTO de criação (ProfessorCreateRequest) aceita todos os campos
            url = '/api/professores';
            method = 'POST';
            professorData = { nome, cpf, email, registro, escolasIds: [escolaId] };
        }

        try {
            const savedProfessor = await fetchJsonWithAuth<Professor>(url, {
                method,
                body: JSON.stringify(professorData),
            });

            if (editingProf) {
                setProfessores(professores.map(p => (p.id === editingProf.id ? savedProfessor : p)));
                toast.success('Professor atualizado com sucesso');
            } else {
                setProfessores([...professores, savedProfessor]);
                toast.success('Professor cadastrado com sucesso');
            }
            closeDialog();
        } catch (error) {
            console.error('Erro ao salvar professor:', error);
            // O toast de erro já deve ter sido mostrado pelo helper
        }
    };

    // Função para DELETAR
    const handleDelete = async (id: string) => {
        if (!window.confirm("Tem certeza que deseja excluir este professor? Esta ação não pode ser desfeita.")) {
            return;
        }
        try {
            await fetchWithAuth(`/api/professores/${id}`, { method: 'DELETE' });
            setProfessores(professores.filter(p => p.id !== id)); // Remove da lista local
            toast.success('Professor excluído com sucesso');
        } catch (error) {
            console.error('Erro ao excluir professor:', error);
        }
    };

    // Limpa o formulário e fecha o modal
    const closeDialog = () => {
        setIsDialogOpen(false);
        setEditingProf(null);
        setRegistro('');
        setNome('');
        setEscolaId('');
        setCpf('');
        setEmail('');
    };

    // Função para ativar/desativar professor
    const toggleStatus = async (id: string, ativo: boolean) => {
        const action = ativo ? 'desativar' : 'ativar';
        const url = `/api/professores/${id}/${action}`;
        try {
            await fetchWithAuth(url, { method: 'PUT' });
            // Atualizo o estado local
            setProfessores(professores.map(p => (p.id === id ? { ...p, ativo: !ativo } : p)));
            toast.success(`Professor ${ativo ? 'desativado' : 'ativado'} com sucesso`);
        } catch (error) {
            console.error(`Erro ao ${action} professor:`, error);
        }
    };

    // Preenche o formulário do modal para edição
    const openEdit = (prof: Professor) => {
        setEditingProf(prof);
        setRegistro(prof.registro); // Mantenho para exibição, mesmo não sendo editável
        setNome(prof.nome);
        setEscolaId(prof.escolas.length > 0 ? prof.escolas[0].id : '');
        setCpf(prof.cpf); // Mantenho para exibição
        setEmail(prof.email);
        setIsDialogOpen(true);
    };

    // Abre o modal limpo para criar
    const openNew = () => {
        closeDialog(); // Limpa tudo
        setIsDialogOpen(true); // Abre o modal
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
                        <Button onClick={openNew}> {/* Garante que abra limpo */}
                            <Plus className="h-4 w-4 mr-2" />
                            Novo Professor
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingProf ? 'Editar Professor' : 'Novo Professor'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
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
                                {/* Desabilito o CPF na edição, pois não pode ser alterado via PATCH */}
                                <Input id="cpf" value={cpf} onChange={(e) => setCpf(e.target.value)} disabled={!!editingProf} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="registro">Número de Registro</Label>
                                {/* Desabilito o Registro na edição, pois não pode ser alterado via PATCH */}
                                <Input id="registro" value={registro} onChange={(e) => setRegistro(e.target.value)} disabled={!!editingProf} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="escola">Escola</Label>
                                <Select value={escolaId} onValueChange={setEscolaId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione a escola" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {escolasAtivas.map((e) => (
                                            <SelectItem key={e.id} value={e.id}>{e.categoriaEscola.replace(/_/g, ' ')}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
                            <Button onClick={handleSave}>{editingProf ? 'Atualizar' : 'Salvar'}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? <p>Carregando professores...</p> : (
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
                                                Registro: {prof.registro} • {prof.escolas.map(e => e.categoriaEscola.replace(/_/g, ' ')).join(', ')}
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
                                    {/* Adiciono um botão de deletar */}
                                    <Button variant="destructive" size="sm" onClick={() => handleDelete(prof.id)}>
                                        <Trash className="h-4 w-4 mr-2" />
                                        Excluir
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {professores.length === 0 && <p>Nenhum professor encontrado.</p>}
                </div>
            )}
        </div>
    );
};

export default Professores;