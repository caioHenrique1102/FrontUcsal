import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

interface Disciplina {
  id: string;
  sigla: string;
  descricao: string;
  cargaHoraria: number;
  ativa: boolean;
}

const Disciplinas = () => {
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([
    { id: '1', sigla: 'ALG101', descricao: 'Algoritmos e Programação', cargaHoraria: 80, ativa: true },
    { id: '2', sigla: 'ED201', descricao: 'Estrutura de Dados', cargaHoraria: 80, ativa: true },
    { id: '3', sigla: 'BD301', descricao: 'Banco de Dados', cargaHoraria: 60, ativa: true },
    { id: '4', sigla: 'POO202', descricao: 'Programação Orientada a Objetos', cargaHoraria: 80, ativa: false }
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDisc, setEditingDisc] = useState<Disciplina | null>(null);
  const [sigla, setSigla] = useState('');
  const [descricao, setDescricao] = useState('');
  const [cargaHoraria, setCargaHoraria] = useState('');

  const handleSave = () => {
    if (!sigla.trim() || !descricao.trim() || !cargaHoraria) {
      toast.error('Todos os campos são obrigatórios');
      return;
    }

    if (editingDisc) {
      setDisciplinas(disciplinas.map(d => 
        d.id === editingDisc.id 
          ? { ...d, sigla, descricao, cargaHoraria: parseInt(cargaHoraria) } 
          : d
      ));
      toast.success('Disciplina atualizada com sucesso');
    } else {
      const novaDisc: Disciplina = {
        id: Date.now().toString(),
        sigla,
        descricao,
        cargaHoraria: parseInt(cargaHoraria),
        ativa: true
      };
      setDisciplinas([...disciplinas, novaDisc]);
      toast.success('Disciplina cadastrada com sucesso');
    }

    closeDialog();
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSigla('');
    setDescricao('');
    setCargaHoraria('');
    setEditingDisc(null);
  };

  const toggleStatus = (id: string) => {
    setDisciplinas(disciplinas.map(d => 
      d.id === id ? { ...d, ativa: !d.ativa } : d
    ));
    toast.success('Status atualizado com sucesso');
  };

  const openEdit = (disc: Disciplina) => {
    setEditingDisc(disc);
    setSigla(disc.sigla);
    setDescricao(disc.descricao);
    setCargaHoraria(disc.cargaHoraria.toString());
    setIsDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Disciplinas</h1>
          <p className="text-muted-foreground">Cadastre e gerencie as disciplinas dos cursos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingDisc(null); setSigla(''); setDescricao(''); setCargaHoraria(''); }}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Disciplina
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingDisc ? 'Editar Disciplina' : 'Nova Disciplina'}</DialogTitle>
              <DialogDescription>
                {editingDisc ? 'Atualize as informações da disciplina' : 'Cadastre uma nova disciplina'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="sigla">Sigla da Disciplina</Label>
                <Input
                  id="sigla"
                  value={sigla}
                  onChange={(e) => setSigla(e.target.value)}
                  placeholder="Ex: ALG101"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Ex: Algoritmos e Programação"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cargaHoraria">Carga Horária (horas)</Label>
                <Input
                  id="cargaHoraria"
                  type="number"
                  value={cargaHoraria}
                  onChange={(e) => setCargaHoraria(e.target.value)}
                  placeholder="80"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
              <Button onClick={handleSave}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {disciplinas.map((disc) => (
          <Card key={disc.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{disc.sigla}</CardTitle>
                    <CardDescription>{disc.descricao}</CardDescription>
                  </div>
                </div>
                <Badge variant={disc.ativa ? 'default' : 'secondary'}>
                  {disc.ativa ? 'Ativa' : 'Inativa'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Carga horária: {disc.cargaHoraria}h
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(disc)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button variant="outline" size="sm" onClick={() => toggleStatus(disc.id)}>
                  {disc.ativa ? 'Desativar' : 'Ativar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Disciplinas;
