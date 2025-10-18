import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock, Pencil, Trash } from 'lucide-react';
import { toast } from 'sonner';
import { fetchJsonWithAuth, fetchWithAuth } from '@/lib/api'; // Meus helpers

// Interface para Horario como vem da API
interface Horario {
    id: string;
    turno: 'MANHA' | 'TARDE' | 'NOITE'; // Enum no backend
    horarioInicio: string; // Ex: "07:00"
    horarioFinal: string;  // Ex: "09:30"
    diaSemana: 'SEGUNDA' | 'TERCA' | 'QUARTA' | 'QUINTA' | 'SEXTA' | 'SABADO'; // Enum no backend
    ativo: boolean; // Eu adiciono isso localmente, pois a API não retorna
}

// Mapeamentos para exibir nomes amigáveis para os enums
const DIAS_MAP: Record<Horario['diaSemana'], string> = {
    SEGUNDA: 'Segunda-feira',
    TERCA: 'Terça-feira',
    QUARTA: 'Quarta-feira',
    QUINTA: 'Quinta-feira',
    SEXTA: 'Sexta-feira',
    SABADO: 'Sábado'
};
const TURNOS_MAP: Record<Horario['turno'], string> = {
    MANHA: 'Manhã',
    TARDE: 'Tarde',
    NOITE: 'Noite'
};

const Horarios = () => {
    const [horarios, setHorarios] = useState<Horario[]>([]);
    const [loading, setLoading] = useState(true);

    // Busco os horários ao montar
    const fetchHorarios = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchJsonWithAuth<Horario[]>('/api/horarios');
            // A API não retorna 'ativo', então eu assumo 'true' para todos
            setHorarios(data.map(h => ({ ...h, ativo: true })) || []);
        } catch (error) {
            console.error('Erro ao buscar horários:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHorarios();
    }, [fetchHorarios]);

    // Estados para o formulário do modal
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingHorario, setEditingHorario] = useState<Horario | null>(null);
    const [turno, setTurno] = useState<string>('');
    const [inicio, setInicio] = useState('');
    const [fim, setFim] = useState('');
    const [diaSemana, setDiaSemana] = useState('');

    // Opções para os Selects (usando as chaves dos enums do backend)
    const diasSemanaOptions = Object.keys(DIAS_MAP) as Horario['diaSemana'][];
    const turnosOptions = Object.keys(TURNOS_MAP) as Horario['turno'][];

    // Função para salvar (criar ou editar)
    const handleSave = async () => {
        if (!turno || !inicio || !fim || !diaSemana) {
            toast.error('Todos os campos são obrigatórios');
            return;
        }

        // Monto o objeto com os nomes de campo esperados pela API
        const horarioData = { diaSemana, turno, horarioInicio: inicio, horarioFinal: fim };
        const url = editingHorario ? `/api/horarios/${editingHorario.id}` : '/api/horarios';
        // Uso PATCH para atualizar e POST para criar
        const method = editingHorario ? 'PATCH' : 'POST';

        try {
            const savedHorario = await fetchJsonWithAuth<Horario>(url, {
                method,
                body: JSON.stringify(horarioData),
            });

            const horarioComStatus = { ...savedHorario, ativo: true };

            if (editingHorario) {
                setHorarios(horarios.map(h => (h.id === editingHorario.id ? horarioComStatus : h)));
                toast.success('Horário atualizado com sucesso');
            } else {
                setHorarios([...horarios, horarioComStatus]);
                toast.success('Horário cadastrado com sucesso');
            }
            closeDialog();
        } catch (error) {
            console.error('Erro ao salvar horário:', error);
        }
    };

    // Função para DELETAR
    const handleDelete = async (id: string) => {
        if (!window.confirm("Tem certeza que deseja excluir este horário?")) {
            return;
        }
        try {
            await fetchWithAuth(`/api/horarios/${id}`, { method: 'DELETE' });
            setHorarios(horarios.filter(h => h.id !== id)); // Remove da lista local
            toast.success('Horário excluído com sucesso');
        } catch (error) {
            console.error('Erro ao excluir horário:', error);
            toast.error('Erro ao excluir. Verifique se este horário está em uso.');
        }
    };

    // Limpa o formulário e fecha o modal
    const closeDialog = () => {
        setIsDialogOpen(false);
        setEditingHorario(null);
        setTurno('');
        setInicio('');
        setFim('');
        setDiaSemana('');
    };

    // Preenche o formulário para edição
    const openEdit = (horario: Horario) => {
        setEditingHorario(horario);
        setTurno(horario.turno);
        setInicio(horario.horarioInicio);
        setFim(horario.horarioFinal);
        setDiaSemana(horario.diaSemana);
        setIsDialogOpen(true);
    };

    const openNew = () => {
        closeDialog();
        setIsDialogOpen(true);
    };

    // Agrupo os horários por turno para exibição
    const groupedHorarios = horarios.reduce((acc, horario) => {
        const turnoKey = horario.turno;
        if (!acc[turnoKey]) acc[turnoKey] = [];
        acc[turnoKey].push(horario);
        return acc;
    }, {} as Record<string, Horario[]>);

    // Ordeno os turnos para exibição (Manhã, Tarde, Noite)
    const turnosOrdenados = Object.keys(groupedHorarios).sort((a, b) => {
        const ordem = { MANHA: 1, TARDE: 2, NOITE: 3 };
        return ordem[a as Horario['turno']] - ordem[b as Horario['turno']];
    });

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Gerenciar Horários</h1>
                    <p className="text-muted-foreground">Cadastre os horários disponíveis para aulas</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openNew}>
                            <Plus className="h-4 w-4 mr-2" />
                            Novo Horário
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingHorario ? 'Editar Horário' : 'Novo Horário'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Turno</Label>
                                <Select value={turno} onValueChange={setTurno}>
                                    <SelectTrigger><SelectValue placeholder="Selecione o turno" /></SelectTrigger>
                                    <SelectContent>
                                        {turnosOptions.map((t) => <SelectItem key={t} value={t}>{TURNOS_MAP[t]}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Dia da Semana</Label>
                                <Select value={diaSemana} onValueChange={setDiaSemana}>
                                    <SelectTrigger><SelectValue placeholder="Selecione o dia" /></SelectTrigger>
                                    <SelectContent>
                                        {diasSemanaOptions.map((dia) => <SelectItem key={dia} value={dia}>{DIAS_MAP[dia]}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="inicio">Horário Início</Label>
                                    <Input id="inicio" type="time" value={inicio} onChange={(e) => setInicio(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="fim">Horário Fim</Label>
                                    <Input id="fim" type="time" value={fim} onChange={(e) => setFim(e.target.value)} />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
                            <Button onClick={handleSave}>{editingHorario ? 'Atualizar' : 'Salvar'}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? <p>Carregando horários...</p> : (
                <div className="space-y-6">
                    {/* Eu itero sobre os turnos ordenados */}
                    {turnosOrdenados.map((turnoKey) => (
                        <Card key={turnoKey}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" />{TURNOS_MAP[turnoKey as Horario['turno']]}</CardTitle>
                                <CardDescription>{groupedHorarios[turnoKey].length} horários cadastrados</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                    {/* Ordeno os horários por dia da semana (opcional) */}
                                    {groupedHorarios[turnoKey]
                                        .sort((a, b) => diasSemanaOptions.indexOf(a.diaSemana) - diasSemanaOptions.indexOf(b.diaSemana))
                                        .map((horario) => (
                                            <div key={horario.id} className="p-3 border rounded-lg">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-medium">{DIAS_MAP[horario.diaSemana]}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {horario.horarioInicio} às {horario.horarioFinal}
                                                        </p>
                                                    </div>
                                                    <Badge variant={horario.ativo ? 'default' : 'secondary'}>
                                                        {horario.ativo ? 'Ativo' : 'Inativo'}
                                                    </Badge>
                                                </div>
                                                {/* Adiciono botões de ação */}
                                                <div className="flex gap-2 mt-3 justify-end">
                                                    <Button variant="outline" size="sm" onClick={() => openEdit(horario)}>
                                                        <Pencil className="h-3 w-3" />
                                                    </Button>
                                                    <Button variant="destructive" size="sm" onClick={() => handleDelete(horario.id)}>
                                                        <Trash className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {horarios.length === 0 && <p>Nenhum horário cadastrado.</p>}
                </div>
            )}
        </div>
    );
};

export default Horarios;