import { useState } from 'react';
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
  turno: 'Manhã' | 'Tarde' | 'Noite';
  inicio: string;
  fim: string;
  diaSemana: string;
  ativo: boolean;
}

const Horarios = () => {
  const [horarios, setHorarios] = useState<Horario[]>([
    { id: '1', turno: 'Manhã', inicio: '07:00', fim: '09:30', diaSemana: 'Segunda-feira', ativo: true },
    { id: '2', turno: 'Manhã', inicio: '09:50', fim: '12:20', diaSemana: 'Segunda-feira', ativo: true },
    { id: '3', turno: 'Tarde', inicio: '13:30', fim: '16:00', diaSemana: 'Terça-feira', ativo: true },
    { id: '4', turno: 'Noite', inicio: '19:00', fim: '21:30', diaSemana: 'Quarta-feira', ativo: true }
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [turno, setTurno] = useState<string>('');
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');
  const [diaSemana, setDiaSemana] = useState('');

  const diasSemana = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

  const handleSave = () => {
    if (!turno || !inicio || !fim || !diaSemana) {
      toast.error('Todos os campos são obrigatórios');
      return;
    }

    const novoHorario: Horario = {
      id: Date.now().toString(),
      turno: turno as 'Manhã' | 'Tarde' | 'Noite',
      inicio,
      fim,
      diaSemana,
      ativo: true
    };
    setHorarios([...horarios, novoHorario]);
    toast.success('Horário cadastrado com sucesso');
    closeDialog();
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
            <Button onClick={closeDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Horário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Horário</DialogTitle>
              <DialogDescription>Cadastre um novo horário de aula</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Turno</Label>
                <Select value={turno} onValueChange={setTurno}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o turno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manhã">Manhã (07:00 - 12:30)</SelectItem>
                    <SelectItem value="Tarde">Tarde (13:30 - 16:00)</SelectItem>
                    <SelectItem value="Noite">Noite (19:00 - 21:40)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dia da Semana</Label>
                <Select value={diaSemana} onValueChange={setDiaSemana}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o dia" />
                  </SelectTrigger>
                  <SelectContent>
                    {diasSemana.map((dia) => (
                      <SelectItem key={dia} value={dia}>{dia}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inicio">Horário Início</Label>
                  <Input
                    id="inicio"
                    type="time"
                    value={inicio}
                    onChange={(e) => setInicio(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fim">Horário Fim</Label>
                  <Input
                    id="fim"
                    type="time"
                    value={fim}
                    onChange={(e) => setFim(e.target.value)}
                  />
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

      <div className="space-y-6">
        {Object.entries(groupedHorarios).map(([turno, horariosDoTurno]) => (
          <Card key={turno}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {turno}
              </CardTitle>
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
                          {horario.inicio} às {horario.fim}
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
    </div>
  );
};

export default Horarios;
