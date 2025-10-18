import { useState, useEffect, useCallback } from 'react';
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
import { fetchJsonWithAuth, fetchWithAuth } from '@/lib/api'; // Meus helpers

// Interface para Formacao como vem da API
interface Formacao {
    id: string;
    categoria: CategoriaTitulacao;
    nomeInstituicao: string;
    nomeCurso: string;
    anoConclusao: string; // Vem como string 'YYYY-MM-DD'
    professorResponse: { id: string; nome: string; }; // Vem na resposta
}

// Enum para Categoria (espelhando o backend)
type CategoriaTitulacao = 'GRADUACAO' | 'ESPECIALIZACAO' | 'MBA' | 'MESTRADO' | 'DOUTORADO' | 'POS_DOUTORADO';

// Mapeamento para exibição amigável das categorias
const CATEGORIA_MAP: Record<CategoriaTitulacao, string> = {
    GRADUACAO: 'Graduação',
    ESPECIALIZACAO: 'Especialização',
    MBA: 'MBA',
    MESTRADO: 'Mestrado',
    DOUTORADO: 'Doutorado',
    POS_DOUTORADO: 'Pós-Doutorado'
};

const Formacao = () => {
    const { user } = useAuth();
    // A API de Formação do professor só permite uma.
    // Então, eu armazeno ou 'null' ou o objeto Formacao.
    const [formacao, setFormacao] = useState<Formacao | null>(null);
    const [loading, setLoading] = useState(true);

    // Busco a formação do professor logado
    const fetchFormacao = useCallback(async () => {
        if (!user || user.role !== 'professor' || !user.professorId) {
            setLoading(false);
            return;
        };

        setLoading(true);
        try {
            // Eu chamo o endpoint que busca a formação do professor logado
            const data = await fetchJsonWithAuth<Formacao>('/api/formacoes/minhas');
            setFormacao(data); // Armazeno a formação (ou null se não houver)
        } catch (error) {
            // Se der 404 (EntityNotFound), a API que eu criei trata e o fetchJsonWithAuth retorna null
            if (error instanceof Error && error.message.includes('404')) {
                setFormacao(null); // Professor não tem formação cadastrada
            } else {
                console.error('Erro ao carregar formação:', error);
            }
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchFormacao();
    }, [fetchFormacao]);

    // Estados para o formulário do modal
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    // Não preciso mais de 'editingFormacao', pois só pode haver uma
    const [categoria, setCategoria] = useState<CategoriaTitulacao | ''>('');
    const [instituicao, setInstituicao] = useState('');
    const [curso, setCurso] = useState('');
    const [anoConclusao, setAnoConclusao] = useState(''); // Armazeno apenas o ano (YYYY)

    const categoriasOptions = Object.keys(CATEGORIA_MAP) as CategoriaTitulacao[];

    // Função para salvar (criar ou editar)
    const handleSave = async () => {
        if (!categoria || !instituicao.trim() || !curso.trim() || !anoConclusao) {
            toast.error('Todos os campos são obrigatórios');
            return;
        }
        const anoNum = parseInt(anoConclusao);
        if (isNaN(anoNum) || anoNum < 1900 || anoNum > new Date().getFullYear() + 5) {
            toast.error('Ano de conclusão inválido.');
            return;
        }

        // A API espera 'YYYY-MM-DD', então eu formato
        const formacaoData = {
            nomeCurso: curso,
            anoConclusao: `${anoNum}-01-01`,
            nomeInstituicao: instituicao,
            categoria,
            // O professorId não é necessário no corpo, o backend pega do usuário logado
        };

        // Decido se vou CRIAR (POST) ou ATUALIZAR (PATCH)
        const url = formacao ? `/api/formacoes/${formacao.id}` : '/api/formacoes';
        const method = formacao ? 'PATCH' : 'POST';

        try {
            const savedFormacao = await fetchJsonWithAuth<Formacao>(url, {
                method,
                body: JSON.stringify(formacaoData),
            });

            setFormacao(savedFormacao); // Atualizo o estado local
            toast.success(`Formação ${formacao ? 'atualizada' : 'cadastrada'} com sucesso`);
            closeDialog();
        } catch (error) {
            console.error('Erro ao salvar formação:', error);
        }
    };

    // Função para deletar a formação
    const handleDelete = async () => {
        if (!formacao || !window.confirm("Tem certeza que deseja excluir sua formação?")) {
            return;
        }
        try {
            await fetchWithAuth(`/api/formacoes/${formacao.id}`, { method: 'DELETE' });
            setFormacao(null); // Limpo o estado local
            toast.success('Formação removida com sucesso.');
        } catch(err) {
            console.error('Erro ao remover formação:', err);
        }
    }

    // Limpa o formulário e fecha o modal
    const closeDialog = () => {
        setIsDialogOpen(false);
        // Não limpo os campos se estiver editando, apenas fecho
        if (!formacao) {
            setCategoria('');
            setInstituicao('');
            setCurso('');
            setAnoConclusao('');
        }
    };

    // Preenche o formulário para edição (ou abre limpo para criar)
    const openDialog = () => {
        if (formacao) {
            // Se já existe, preencho os campos para EDIÇÃO
            setCategoria(formacao.categoria);
            setInstituicao(formacao.nomeInstituicao);
            setCurso(formacao.nomeCurso);
            setAnoConclusao(formacao.anoConclusao.substring(0, 4)); // Pego só o YYYY
        } else {
            // Se não existe, limpo os campos para CRIAÇÃO
            setCategoria('');
            setInstituicao('');
            setCurso('');
            setAnoConclusao('');
        }
        setIsDialogOpen(true);
    };

    if (user?.role !== 'professor') {
        return <div className="p-6">Acesso não autorizado.</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Minha Formação</h1>
                    <p className="text-muted-foreground">Gerencie sua formação acadêmica (limite de 1 cadastro)</p>
                </div>
                {/* Modal de Criar/Editar */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        {/* O botão muda de 'Adicionar' para 'Editar' se já existir formação */}
                        <Button onClick={openDialog} disabled={loading}>
                            {formacao ? <Pencil className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                            {formacao ? 'Editar Formação' : 'Adicionar Formação'}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{formacao ? 'Editar Formação' : 'Nova Formação'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Categoria</Label>
                                <Select value={categoria} onValueChange={(value) => setCategoria(value as CategoriaTitulacao)}>
                                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>
                                        {categoriasOptions.map((cat) => <SelectItem key={cat} value={cat}>{CATEGORIA_MAP[cat]}</SelectItem>)}
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
                                <Label htmlFor="ano">Ano de Conclusão (YYYY)</Label>
                                <Input id="ano" type="number" value={anoConclusao} onChange={(e) => setAnoConclusao(e.target.value)} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
                            <Button onClick={handleSave}>{formacao ? 'Atualizar' : 'Salvar'}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Exibição da Formação */}
            {loading ? <p>Carregando formação...</p> : (
                <div className="grid gap-4">
                    {/* Se existir formação, eu mostro o Card */}
                    {formacao ? (
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
                                    <Badge>{CATEGORIA_MAP[formacao.categoria]}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground">
                                        Concluído em {formacao.anoConclusao.substring(0, 4)}
                                    </p>
                                    {/* Botão de Excluir */}
                                    <Button variant="destructive" size="sm" onClick={() => handleDelete()}>
                                        <Trash className="h-4 w-4 mr-2" /> Excluir
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        // Se não existir, mostro uma mensagem
                        <p>Nenhuma formação cadastrada.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default Formacao;