import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { toast } from 'sonner';

interface HorarioDisponivel {
  id: string;
  dia: string;
  turno: string;
  horario: string;
}

const Disponibilidade = () => {
  const horariosPossiveis: HorarioDisponivel[] = [
    { id: '1', dia: 'Segunda-feira', turno: 'Manhã', horario: '07:00 - 09:30' },
    { id: '2', dia: 'Segunda-feira', turno: 'Manhã', horario: '09:50 - 12:20' },
    { id: '3', dia: 'Segunda-feira', turno: 'Tarde', horario: '13:30 - 16:00' },
    { id: '4', dia: 'Segunda-feira', turno: 'Noite', horario: '19:00 - 21:30' },
    { id: '5', dia: 'Terça-feira', turno: 'Manhã', horario: '07:00 - 09:30' },
    { id: '6', dia: 'Terça-feira', turno: 'Tarde', horario: '13:30 - 16:00' },
    { id: '7', dia: 'Quarta-feira', turno: 'Manhã', horario: '07:00 - 09:30' },
    { id: '8', dia: 'Quarta-feira', turno: 'Noite', horario: '19:00 - 21:30' },
    { id: '9', dia: 'Quinta-feira', turno: 'Tarde', horario: '13:30 - 16:00' },
    { id: '10', dia: 'Sexta-feira', turno: 'Manhã', horario: '07:00 - 09:30' },
  ];

  const [horariosSelected, setHorariosSelected] = useState<Set<string>>(
    new Set(['1', '5', '7'])
  );

  const toggleHorario = (id: string) => {
    const newSet = new Set(horariosSelected);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setHorariosSelected(newSet);
  };

  const handleSave = () => {
    toast.success(`Disponibilidade atualizada! ${horariosSelected.size} horários selecionados.`);
  };

  const groupedByDia = horariosPossiveis.reduce((acc, horario) => {
    if (!acc[horario.dia]) acc[horario.dia] = [];
    acc[horario.dia].push(horario);
    return acc;
  }, {} as Record<string, HorarioDisponivel[]>);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Disponibilidade de Horários</h1>
          <p className="text-muted-foreground">
            Marque os horários em que você está disponível para lecionar
          </p>
        </div>
        <Button onClick={handleSave}>
          <Clock className="h-4 w-4 mr-2" />
          Salvar Disponibilidade
        </Button>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">Semestre 2025.1</CardTitle>
          <CardDescription>
            Você selecionou {horariosSelected.size} horários disponíveis
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {Object.entries(groupedByDia).map(([dia, horarios]) => (
          <Card key={dia}>
            <CardHeader>
              <CardTitle className="text-lg">{dia}</CardTitle>
              <CardDescription>
                {horarios.filter(h => horariosSelected.has(h.id)).length} de {horarios.length} horários selecionados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {horarios.map((horario) => (
                  <div
                    key={horario.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      horariosSelected.has(horario.id)
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => toggleHorario(horario.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={horariosSelected.has(horario.id)}
                        onCheckedChange={() => toggleHorario(horario.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{horario.horario}</p>
                          <Badge variant="outline">{horario.turno}</Badge>
                        </div>
                      </div>
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

export default Disponibilidade;
