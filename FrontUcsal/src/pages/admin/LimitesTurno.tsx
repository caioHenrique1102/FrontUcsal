import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash, Clock } from 'lucide-react';
import { toast } from 'sonner';
// Importo meus helpers de API
import { fetchJsonWithAuth, fetchWithAuth } from '@/lib/api';

// --- Interfaces ---
// Representa o LimiteTurno como vem/vai para a API
interface LimiteTurno {
    id: number; // No backend é Long, mas JSON trata como number
    turno: 'MANHA' | 'TARDE' | 'NOITE';
    limiteInicio: string; // Formato "HH:mm"
    limiteFim: string; // Formato "HH:mm"
}

// Valores possíveis para o Enum Turno do backend
const turnosOptions: LimiteTurno['turno'][] = ['MANHA', 'TARDE', 'NOITE'];

// Mapeamento para exibição amigável
const TURNOS_MAP: Record<LimiteTurno['turno'], string> = {
    MANHA: 'Manhã',
    TARDE: 'Tarde',
    NOITE: 'Noite'
};
// -----------------

const LimitesTurno = () => {
    // Estado para guardar a lista de limites buscados da API
    const [limites, setLimites] = useState<LimiteTurno[]>([]);
    const [loading, setLoading] = useState(true);

    // Minha função para buscar os limites da API
    const fetchLimites = useCallback(async () => {
        setLoading(true);
        try {
            // Faço a chamada GET para o endpoint
            const data = await fetchJsonWithAuth<LimiteTurno[]>('/admin/api/limites-turno');
            setLimites(data || []); // Armazeno os dados no estado
        } catch (error) {
            console.error('Erro ao buscar limites de turno:', error);
            setLimites([]); // Limpo em caso de erro
        } finally {
            setLoading(false);
        }
    }, []);

    // Busco os dados quando o componente é montado
    useEffect(() => {
        fetchLimites();
    }, [fetchLimites]);

    // Estados para controlar o modal e o formulário
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingLimite, setEditingLimite] = useState<LimiteTurno | null>(null);
    const [turno, setTurno] = useState<LimiteTurno['turno'] | ''>('');
    const [limiteInicio, setLimiteInicio] = useState(''); // Formato HH:mm
    const [limiteFim, setLimiteFim] = useState('');     // Formato HH:mm

    // Função para salvar (criar ou editar)
    const handleSave = async () => {
        // Validação simples
        if (!turno || !limiteInicio || !limiteFim) {
            toast.error('Todos os campos são obrigatórios');
            return;
        }

        // Preparo os dados no formato esperado pela API
        const limiteData = { turno, limiteInicio, limiteFim };
        const url = editingLimite ? `/admin/api/limites-turno/${editingLimite.id}` : '/admin/api/limites-turno';
        // Uso PATCH para atualizar e POST para criar
        const method = editingLimite ? 'PATCH' : 'POST';

        try {
            // Chamo a API para salvar
            const savedLimite = await fetchJsonWithAuth<LimiteTurno>(url, {
                method,
                body: JSON.stringify(limiteData),
            });

            if (editingLimite) {
                // Atualizo o item na lista local
                setLimites(limites.map(l => (l.id === editingLimite.id ? savedLimite : l)));
                toast.success('Limite de turno atualizado com sucesso');
            } else {
                // Adiciono o novo item na lista local
                setLimites([...limites, savedLimite]);
                toast.success('Limite de turno cadastrado com sucesso');
            }
            closeDialog(); // Fecho e limpo o modal
        } catch (error) {
            console.error('Erro ao salvar limite de turno:', error);
            // O toast de erro já é mostrado pelo helper 'api.ts'
        }
    };

    // Função para deletar um limite
    const handleDelete = async (id: number) => {
        if (!window.confirm("Tem certeza que deseja excluir este limite de turno?")) {
            return;
        }
        try {
            // Chamo a API com o método DELETE
            await fetchWithAuth(`/admin/api/limites-turno/${id}`, { method: 'DELETE' });
            // Removo o item da lista local
            setLimites(limites.filter(l => l.id !== id));
            toast.success('Limite de turno excluído com sucesso');
        } catch (error) {
            console.error('Erro ao excluir limite de turno:', error);
        }
    };

    // Limpa o formulário e fecha o modal
    const closeDialog = () => {
        setIsDialogOpen(false);
        setEditingLimite(null);
        setTurno('');
        setLimiteInicio('');
        setLimiteFim('');
    };

    // Preenche o formulário para edição
    const openEdit = (limite: LimiteTurno) => {
        setEditingLimite(limite);
        setTurno(limite.turno);
        setLimiteInicio(limite.limiteInicio);
        setLimiteFim(limite.limiteFim);
        setIsDialogOpen(true);
    };

    // Abre o modal limpo para criação
    const openNew = () => {
        closeDialog(); // Garante que os campos estejam limpos
        setIsDialogOpen(true);
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Gerenciar Limites de Turno</h1>
                    <p className="text-muted-foreground">Defina os horários de início e fim para cada turno (MANHA, TARDE, NOITE).</p>
                </div>
                {/* Botão para abrir o modal de criação */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openNew}>
                            <Plus className="h-4 w-4 mr-2" />
                            Novo Limite
                        </Button>
                    </DialogTrigger>
                    {/* Conteúdo do Modal */}
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingLimite ? 'Editar Limite de Turno' : 'Novo Limite de Turno'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            {/* Select para escolher o Turno */}
                            <div className="space-y-2">
                                <Label>Turno</Label>
                                <Select
                                    value={turno}
                                    onValueChange={(value) => setTurno(value as LimiteTurno['turno'])}
                                    // Desabilito a seleção do turno se já existir um limite para ele (evita duplicados)
                                    // Ou se estiver editando (não se deve mudar o turno de um limite existente)
                                    disabled={!!editingLimite || limites.some(l => l.turno === turno && l.id !== editingLimite?.id)}
                                >
                                    <SelectTrigger><SelectValue placeholder="Selecione o turno" /></SelectTrigger>
                                    <SelectContent>
                                        {turnosOptions.map((opt) => (
                                            <SelectItem
                                                key={opt}
                                                value={opt}
                                                // Desabilita a opção se já existir um limite para esse turno (exceto o que estou editando)
                                                disabled={limites.some(l => l.turno === opt && l.id !== editingLimite?.id)}
                                            >
                                                {TURNOS_MAP[opt]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {editingLimite && <p className='text-xs text-muted-foreground'>Não é possível alterar o turno de um limite existente.</p> }
                            </div>
                            {/* Input para Hora de Início */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="limiteInicio">Limite Início</Label>
                                    <Input
                                        id="limiteInicio"
                                        type="time" // Usa o input de hora do navegador
                                        value={limiteInicio}
                                        onChange={(e) => setLimiteInicio(e.target.value)}
                                    />
                                </div>
                                {/* Input para Hora de Fim */}
                                <div className="space-y-2">
                                    <Label htmlFor="limiteFim">Limite Fim</Label>
                                    <Input
                                        id="limiteFim"
                                        type="time" // Usa o input de hora do navegador
                                        value={limiteFim}
                                        onChange={(e) => setLimiteFim(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        {/* Botões do Modal */}
                        <DialogFooter>
                            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
                            <Button onClick={handleSave}>{editingLimite ? 'Atualizar' : 'Salvar'}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Exibição da lista de limites */}
            {loading ? (
                <p>Carregando limites de turno...</p>
            ) : (
                <div className="grid gap-4 md:grid-cols-3">
                    {/* Ordeno para MANHA, TARDE, NOITE */}
                    {limites
                        .sort((a, b) => turnosOptions.indexOf(a.turno) - turnosOptions.indexOf(b.turno))
                        .map((limite) => (
                            <Card key={limite.id}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        {/* Nome do Turno */}
                                        <CardTitle className="flex items-center gap-2">
                                            <Clock className="h-5 w-5 text-primary" />
                                            {TURNOS_MAP[limite.turno]}
                                        </CardTitle>
                                        {/* ID (apenas informativo) */}
                                        <span className='text-xs text-muted-foreground'>ID: {limite.id}</span>
                                    </div>
                                    {/* Horários */}
                                    <CardDescription>
                                        {limite.limiteInicio} - {limite.limiteFim}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {/* Botões de Ação */}
                                    <div className="flex gap-2 justify-end">
                                        <Button variant="outline" size="sm" onClick={() => openEdit(limite)}>
                                            <Pencil className="h-4 w-4 mr-2" />
                                            Editar
                                        </Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleDelete(limite.id)}>
                                            <Trash className="h-4 w-4 mr-2" />
                                            Excluir
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    {/* Mensagem se não houver limites */}
                    {limites.length === 0 && <p className="col-span-3 text-center text-muted-foreground">Nenhum limite de turno cadastrado. Crie um para cada turno (MANHA, TARDE, NOITE).</p>}
                </div>
            )}
        </div>
    );
};

export default LimitesTurno;