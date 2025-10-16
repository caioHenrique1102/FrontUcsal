import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

interface Formacao {
  id: string;
  categoria: string;
  instituicao: string;
  curso: string;
  anoConclusao: string;
}

const Formacao = () => {
  const [formacoes, setFormacoes] = useState<Formacao[]>([
    { id: '1', categoria: 'Graduação', instituicao: 'UCSAL', curso: 'Ciência da Computação', anoConclusao: '2015' },
    { id: '2', categoria: 'Mestrado', instituicao: 'UFBA', curso: 'Ciência da Computação', anoConclusao: '2018' }
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFormacao, setEditingFormacao] = useState<Formacao | null>(null);
  const [categoria, setCategoria] = useState('');
  const [instituicao, setInstituicao] = useState('');
  const [curso, setCurso] = useState('');
  const [anoConclusao, setAnoConclusao] = useState('');

  const categorias = ['Graduação', 'Especialização', 'MBA', 'Mestrado', 'Doutorado', 'Pós-Doutorado'];

  const handleSave = () => {
    if (!categoria || !instituicao || !curso || !anoConclusao) {
      toast.error('Todos os campos são obrigatórios');
      return;
    }

    if (editingFormacao) {
      setFormacoes(formacoes.map(f => 
        f.id === editingFormacao.id 
          ? { ...f, categoria, instituicao, curso, anoConclusao }
          : f
      ));
      toast.success('Formação atualizada com sucesso');
    } else {
      const novaFormacao: Formacao = {
        id: Date.now().toString(),
        categoria,
        instituicao,
        curso,
        anoConclusao
      };
      setFormacoes([...formacoes, novaFormacao]);
      toast.success('Formação cadastrada com sucesso');
    }

    closeDialog();
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setCategoria('');
    setInstituicao('');
    setCurso('');
    setAnoConclusao('');
    setEditingFormacao(null);
  };

  const openEdit = (formacao: Formacao) => {
    setEditingFormacao(formacao);
    setCategoria(formacao.categoria);
    setInstituicao(formacao.instituicao);
    setCurso(formacao.curso);
    setAnoConclusao(formacao.anoConclusao);
    setIsDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Minha Formação</h1>
          <p className="text-muted-foreground">Gerencie suas formações acadêmicas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingFormacao(null); closeDialog(); }}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Formação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingFormacao ? 'Editar Formação' : 'Nova Formação'}</DialogTitle>
              <DialogDescription>
                {editingFormacao ? 'Atualize sua formação acadêmica' : 'Adicione uma nova formação'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Categoria da Titulação</Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="instituicao">Nome da Instituição</Label>
                <Input
                  id="instituicao"
                  value={instituicao}
                  onChange={(e) => setInstituicao(e.target.value)}
                  placeholder="Ex: UCSAL"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="curso">Nome do Curso</Label>
                <Input
                  id="curso"
                  value={curso}
                  onChange={(e) => setCurso(e.target.value)}
                  placeholder="Ex: Ciência da Computação"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ano">Ano de Conclusão</Label>
                <Input
                  id="ano"
                  type="number"
                  value={anoConclusao}
                  onChange={(e) => setAnoConclusao(e.target.value)}
                  placeholder="2020"
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

      <div className="grid gap-4">
        {formacoes.map((formacao) => (
          <Card key={formacao.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{formacao.curso}</CardTitle>
                    <CardDescription>{formacao.instituicao}</CardDescription>
                  </div>
                </div>
                <Badge>{formacao.categoria}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Concluído em {formacao.anoConclusao}
                </p>
                <Button variant="outline" size="sm" onClick={() => openEdit(formacao)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Formacao;
