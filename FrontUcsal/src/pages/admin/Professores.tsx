import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, User } from 'lucide-react';
import { toast } from 'sonner';

interface Professor {
  id: string;
  registro: string;
  nome: string;
  escola: string;
  ativo: boolean;
}

const Professores = () => {
  const [professores, setProfessores] = useState<Professor[]>([
    { id: '1', registro: '123456', nome: 'Prof. João Silva', escola: 'Engenharias e Ciências Tecnológicas', ativo: true },
    { id: '2', registro: '123457', nome: 'Profa. Maria Santos', escola: 'Escola de Ciências Sociais e Aplicadas', ativo: true },
    { id: '3', registro: '123458', nome: 'Prof. Carlos Oliveira', escola: 'Escola de Ciências Naturais e da Saúde', ativo: false }
  ]);

  const escolas = [
    'Escola de Educação, Cultura e Humanidades',
    'Escola de Ciências Sociais e Aplicadas',
    'Engenharias e Ciências Tecnológicas',
    'Escola de Ciências Naturais e da Saúde'
  ];

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProf, setEditingProf] = useState<Professor | null>(null);
  const [registro, setRegistro] = useState('');
  const [nome, setNome] = useState('');
  const [escola, setEscola] = useState('');

  const handleSave = () => {
    if (!registro.trim() || !nome.trim() || !escola) {
      toast.error('Todos os campos são obrigatórios');
      return;
    }

    if (editingProf) {
      setProfessores(professores.map(p => 
        p.id === editingProf.id ? { ...p, registro, nome, escola } : p
      ));
      toast.success('Professor atualizado com sucesso');
    } else {
      const novoProf: Professor = {
        id: Date.now().toString(),
        registro,
        nome,
        escola,
        ativo: true
      };
      setProfessores([...professores, novoProf]);
      toast.success('Professor cadastrado com sucesso');
    }

    closeDialog();
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setRegistro('');
    setNome('');
    setEscola('');
    setEditingProf(null);
  };

  const toggleStatus = (id: string) => {
    setProfessores(professores.map(p => 
      p.id === id ? { ...p, ativo: !p.ativo } : p
    ));
    toast.success('Status atualizado com sucesso');
  };

  const openEdit = (prof: Professor) => {
    setEditingProf(prof);
    setRegistro(prof.registro);
    setNome(prof.nome);
    setEscola(prof.escola);
    setIsDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Professores</h1>
          <p className="text-muted-foreground">Cadastre e gerencie os professores</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingProf(null); setRegistro(''); setNome(''); setEscola(''); }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Professor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingProf ? 'Editar Professor' : 'Novo Professor'}</DialogTitle>
              <DialogDescription>
                {editingProf ? 'Atualize as informações do professor' : 'Cadastre um novo professor'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="registro">Número de Registro</Label>
                <Input
                  id="registro"
                  value={registro}
                  onChange={(e) => setRegistro(e.target.value)}
                  placeholder="123456"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Prof. João Silva"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="escola">Escola</Label>
                <Select value={escola} onValueChange={setEscola}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a escola" />
                  </SelectTrigger>
                  <SelectContent>
                    {escolas.map((e) => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
        {professores.map((prof) => (
          <Card key={prof.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{prof.nome}</CardTitle>
                    <CardDescription>
                      Registro: {prof.registro} • {prof.escola}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={prof.ativo ? 'default' : 'secondary'}>
                  {prof.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(prof)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button variant="outline" size="sm" onClick={() => toggleStatus(prof.id)}>
                  {prof.ativo ? 'Desativar' : 'Ativar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Professores;
