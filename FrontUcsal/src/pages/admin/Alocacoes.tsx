import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, User, BookOpen, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Alocacao {
  id: string;
  professor: string;
  disciplina: string;
  horario: string;
  turma: string;
  semestre: string;
}

const Alocacoes = () => {
  const [alocacoes, setAlocacoes] = useState<Alocacao[]>([
    { id: '1', professor: 'Prof. João Silva', disciplina: 'Algoritmos e Programação', horario: 'Segunda 07:00-09:30', turma: 'Turma A', semestre: '2025.1' },
    { id: '2', professor: 'Prof. João Silva', disciplina: 'Estrutura de Dados', horario: 'Terça 13:30-16:00', turma: 'Turma B', semestre: '2025.1' },
    { id: '3', professor: 'Profa. Maria Santos', disciplina: 'Banco de Dados', horario: 'Quarta 19:00-21:30', turma: 'Turma C', semestre: '2025.1' }
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [professor, setProfessor] = useState('');
  const [disciplina, setDisciplina] = useState('');
  const [horario, setHorario] = useState('');

  const professores = ['Prof. João Silva', 'Profa. Maria Santos', 'Prof. Carlos Oliveira'];
  const disciplinas = ['Algoritmos e Programação', 'Estrutura de Dados', 'Banco de Dados', 'POO'];
  const horarios = ['Segunda 07:00-09:30', 'Segunda 09:50-12:20', 'Terça 13:30-16:00', 'Quarta 19:00-21:30'];

  const handleSave = () => {
    if (!professor || !disciplina || !horario) {
      toast.error('Todos os campos são obrigatórios');
      return;
    }

    const turmaLetra = String.fromCharCode(65 + alocacoes.length);
    const novaAlocacao: Alocacao = {
      id: Date.now().toString(),
      professor,
      disciplina,
      horario,
      turma: `Turma ${turmaLetra}`,
      semestre: '2025.1'
    };

    setAlocacoes([...alocacoes, novaAlocacao]);
    toast.success('Alocação realizada com sucesso!');
    closeDialog();
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setProfessor('');
    setDisciplina('');
    setHorario('');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Alocações</h1>
          <p className="text-muted-foreground">Aloque professores nas disciplinas e horários</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={closeDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Alocação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Alocação</DialogTitle>
              <DialogDescription>
                Aloque um professor em uma disciplina e horário
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Professor</Label>
                <Select value={professor} onValueChange={setProfessor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o professor" />
                  </SelectTrigger>
                  <SelectContent>
                    {professores.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Disciplina</Label>
                <Select value={disciplina} onValueChange={setDisciplina}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a disciplina" />
                  </SelectTrigger>
                  <SelectContent>
                    {disciplinas.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Horário</Label>
                <Select value={horario} onValueChange={setHorario}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o horário" />
                  </SelectTrigger>
                  <SelectContent>
                    {horarios.map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
              <Button onClick={handleSave}>Alocar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Semestre 2025.1</CardTitle>
          <CardDescription>{alocacoes.length} alocações realizadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alocacoes.map((alocacao) => (
              <div key={alocacao.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">{alocacao.turma}</h3>
                  </div>
                  <Badge>Ativa</Badge>
                </div>
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{alocacao.professor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span>{alocacao.disciplina}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{alocacao.horario}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Alocacoes;
