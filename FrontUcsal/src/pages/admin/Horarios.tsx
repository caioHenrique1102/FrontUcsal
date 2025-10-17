import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Horario {
    id: string;
    turno: 'MANHA' | 'TARDE' | 'NOITE';
    horarioInicio: string;
    horarioFinal: string;
    diaSemana: string;
    ativo: boolean; // Assumindo que a API retorne isso, mesmo que não tenha no DTO
}

const Horarios = () => {
    const [horarios, setHorarios] = useState<Horario[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHorarios = async () => {
            try {
                const response = await fetch('/api/horarios', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
                });
                if (!response.ok) throw new Error('Falha ao buscar horários');
                const data = await response.json();
                // Adicionando 'ativo: true' para compatibilidade da UI
                setHorarios(data.map((h: any) => ({ ...h, ativo: true })));
            } catch (error) {
                toast.error('Erro ao carregar horários.');
            } finally {
                setLoading(false);
            }
        };
        fetchHorarios();
    }, []);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [turno, setTurno] = useState<string>('');
    const [inicio, setInicio] = useState('');
    const [fim, setFim] = useState('');
    const [diaSemana, setDiaSemana] = useState('');

    const diasSemana = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO'];
    const turnos = ['MANHA', 'TARDE', 'NOITE'];

    const handleSave = async () => {
        if (!turno || !inicio || !fim || !diaSemana) {
            toast.error('Todos os campos são obrigatórios');
            return;
        }

        const novoHorario = { diaSemana, turno, horarioInicio: inicio, horarioFinal: fim };

        try {
            const response = await fetch('/api/horarios', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(novoHorario),
            });

            if (!response.ok) throw new Error('Falha ao cadastrar horário');

            const savedHorario = await response.json();
            setHorarios([...horarios, { ...savedHorario, ativo: true }]);
            toast.success('Horário cadastrado com sucesso');
            closeDialog();
        } catch (error) {
            toast.error('Erro ao cadastrar horário');
        }
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        setTurno('');
        setInicio('');
        setFim('');
        setDiaSemana('');
    };

    const groupedHorarios = horarios.reduce((acc, horario) => {
        if (!acc[horario.turno]) acc[horario.turno] = [];
        acc[horario.turno].push(horario);
        return acc;
    }, {} as Record<string, Horario[]>);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Gerenciar Horários</h1>
                    <p className="text-muted-foreground">Cadastre os horários disponíveis para aulas</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setIsDialogOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Novo Horário
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Novo Horário</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Turno</Label>
                                <Select value={turno} onValueChange={setTurno}>
                                    <SelectTrigger><SelectValue placeholder="Selecione o turno" /></SelectTrigger>
                                    <SelectContent>
                                        {turnos.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Dia da Semana</Label>
                                <Select value={diaSemana} onValueChange={setDiaSemana}>
                                    <SelectTrigger><SelectValue placeholder="Selecione o dia" /></SelectTrigger>
                                    <SelectContent>
                                        {diasSemana.map((dia) => <SelectItem key={dia} value={dia}>{dia}</SelectItem>)}
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
                            <Button onClick={handleSave}>Salvar</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? <p>Carregando...</p> : (
                <div className="space-y-6">
                    {Object.entries(groupedHorarios).map(([turno, horariosDoTurno]) => (
                        <Card key={turno}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" />{turno}</CardTitle>
                                <CardDescription>{horariosDoTurno.length} horários cadastrados</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-3 md:grid-cols-2">
                                    {horariosDoTurno.map((horario) => (
                                        <div key={horario.id} className="p-3 border rounded-lg">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium">{horario.diaSemana}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {horario.horarioInicio} às {horario.horarioFinal}
                                                    </p>
                                                </div>
                                                <Badge variant={horario.ativo ? 'default' : 'secondary'}>
                                                    {horario.ativo ? 'Ativo' : 'Inativo'}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Horarios;