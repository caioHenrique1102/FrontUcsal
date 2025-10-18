import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Building2 } from 'lucide-react';
import { toast } from 'sonner';
// Importo meus helpers de API
import { fetchJsonWithAuth, fetchWithAuth } from '@/lib/api';

// Interface para representar a Escola como vem da API
interface Escola {
    id: string;
    categoriaEscola: string; // O nome da categoria/enum no backend
    ativo: boolean;
}

// Interface para a resposta paginada da API
interface Page<T> {
    content: T[];
    totalElements: number;
    // ... outros campos se necessário (totalPages, size, number, etc.)
}

const Escolas = () => {
    const [escolas, setEscolas] = useState<Escola[]>([]);
    const [loading, setLoading] = useState(true);

    // Criei uma função para buscar os dados da API
    const fetchEscolas = useCallback(async () => {
        setLoading(true);
        try {
            // Uso meu helper para buscar os dados já com autenticação
            // A API de escolas retorna um objeto Page, então pego o 'content'
            const data = await fetchJsonWithAuth<Page<Escola>>('/admin/api/escolas');
            setEscolas(data.content || []); // Garanto que seja um array
        } catch (error) {
            // O toast de erro já é mostrado pelo fetchWithAuth, mas logamos o erro aqui
            console.error("Erro ao buscar escolas:", error);
            setEscolas([]); // Limpo as escolas em caso de erro
        } finally {
            setLoading(false);
        }
    }, []);

    // Busco as escolas quando o componente monta
    useEffect(() => {
        fetchEscolas();
    }, [fetchEscolas]);

    // Estados para controlar o modal de criação/edição
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingEscola, setEditingEscola] = useState<Escola | null>(null);
    const [nome, setNome] = useState(''); // O nome é a 'categoriaEscola'

    // Função para salvar (criar ou editar)
    const handleSave = async () => {
        if (!nome.trim()) {
            toast.error('Nome da escola é obrigatório');
            return;
        }

        // Preparo os dados para enviar (o backend espera 'categoriaEscola')
        const escolaData = { categoriaEscola: nome };
        // Defino a URL e o método (POST para criar, PATCH para editar)
        const url = editingEscola ? `/admin/api/escolas/${editingEscola.id}` : '/admin/api/escolas';
        const method = editingEscola ? 'PATCH' : 'POST';

        try {
            // Faço a requisição usando meu helper
            const savedEscola = await fetchJsonWithAuth<Escola>(url, {
                method,
                body: JSON.stringify(escolaData), // Envio os dados como JSON
            });

            if (editingEscola) {
                // Se eu estava editando, atualizo a escola na lista local
                setEscolas(escolas.map(e => (e.id === editingEscola.id ? savedEscola : e)));
                toast.success('Escola atualizada com sucesso');
            } else {
                // Se eu estava criando, adiciono a nova escola na lista local
                setEscolas([...escolas, savedEscola]);
                toast.success('Escola cadastrada com sucesso');
            }
            closeDialog(); // Fecho o modal e limpo os campos
        } catch (error) {
            // O toast de erro já foi mostrado pelo fetchWithAuth
            console.error("Erro ao salvar escola:", error);
        }
    };

    // Função para fechar o modal e limpar os campos
    const closeDialog = () => {
        setIsDialogOpen(false);
        setNome('');
        setEditingEscola(null);
    };

    // Função para ativar/desativar uma escola
    const toggleStatus = async (id: string, ativo: boolean) => {
        // Escolho o endpoint correto com base no estado atual
        const action = ativo ? 'desativar' : 'ativar';
        const url = `/admin/api/escolas/${id}/${action}`;

        try {
            // Faço a requisição PUT usando meu helper (não preciso do JSON de resposta)
            await fetchWithAuth(url, { method: 'PUT' });

            // Atualizo o estado local da escola
            setEscolas(escolas.map(e => (e.id === id ? { ...e, ativo: !ativo } : e)));
            toast.success(`Escola ${ativo ? 'desativada' : 'ativada'} com sucesso`);
        } catch (error) {
            // O toast de erro já foi mostrado pelo fetchWithAuth
            console.error(`Erro ao ${action} escola:`, error);
        }
    };

    // Preenche o modal com os dados da escola para edição
    const openEdit = (escola: Escola) => {
        setEditingEscola(escola);
        setNome(escola.categoriaEscola); // Uso o campo correto do backend
        setIsDialogOpen(true);
    };

    // Limpa o modal para criar uma nova escola
    const openNew = () => {
        setEditingEscola(null);
        setNome('');
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
                        <Button onClick={openNew}>
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
                                <Label htmlFor="nome">Nome da Escola (Categoria)</Label>
                                <Input
                                    id="nome"
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                    placeholder="Ex: ESCOLA_DE_EDUCACAO"
                                />
                                <p className="text-xs text-muted-foreground">O nome deve ser o valor do Enum do backend (ex: ESCOLA_DE_EDUCACAO).</p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
                            <Button onClick={handleSave}>Salvar</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Mostro o estado de carregamento */}
            {loading ? (
                <p>Carregando escolas...</p>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Mapeio as escolas buscadas da API */}
                    {escolas.map((escola) => (
                        <Card key={escola.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="flex items-center gap-2">
                                            <Building2 className="h-5 w-5" />
                                            {/* Exibo o nome da categoria vindo da API, formatado */}
                                            {escola.categoriaEscola.replace(/_/g, ' ')}
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
                    {/* Mensagem se não houver dados */}
                    {escolas.length === 0 && <p>Nenhuma escola encontrada.</p>}
                </div>
            )}
        </div>
    );
};

export default Escolas;