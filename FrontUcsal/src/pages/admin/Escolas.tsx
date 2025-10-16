import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Building2 } from 'lucide-react';
import { toast } from 'sonner';

interface Escola {
  id: string;
  nome: string;
  ativa: boolean;
}

const Escolas = () => {
  const [escolas, setEscolas] = useState<Escola[]>([
    { id: '1', nome: 'Escola de Educação, Cultura e Humanidades', ativa: true },
    { id: '2', nome: 'Escola de Ciências Sociais e Aplicadas', ativa: true },
    { id: '3', nome: 'Engenharias e Ciências Tecnológicas', ativa: true },
    { id: '4', nome: 'Escola de Ciências Naturais e da Saúde', ativa: true }
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEscola, setEditingEscola] = useState<Escola | null>(null);
  const [nome, setNome] = useState('');

  const handleSave = () => {
    if (!nome.trim()) {
      toast.error('Nome da escola é obrigatório');
      return;
    }

    if (editingEscola) {
      setEscolas(escolas.map(e => e.id === editingEscola.id ? { ...e, nome } : e));
      toast.success('Escola atualizada com sucesso');
    } else {
      const novaEscola: Escola = {
        id: Date.now().toString(),
        nome,
        ativa: true
      };
      setEscolas([...escolas, novaEscola]);
      toast.success('Escola cadastrada com sucesso');
    }

    setIsDialogOpen(false);
    setNome('');
    setEditingEscola(null);
  };

  const toggleStatus = (id: string) => {
    setEscolas(escolas.map(e => 
      e.id === id ? { ...e, ativa: !e.ativa } : e
    ));
    toast.success('Status atualizado com sucesso');
  };

  const openEdit = (escola: Escola) => {
    setEditingEscola(escola);
    setNome(escola.nome);
    setIsDialogOpen(true);
  };

  const openNew = () => {
    setEditingEscola(null);
    setNome('');
    setIsDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Escolas</h1>
          <p className="text-muted-foreground">Cadastre e gerencie as escolas da UCSAL</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Escola
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingEscola ? 'Editar Escola' : 'Nova Escola'}</DialogTitle>
              <DialogDescription>
                {editingEscola ? 'Atualize as informações da escola' : 'Cadastre uma nova escola da UCSAL'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Escola</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Escola de Educação..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {escolas.map((escola) => (
          <Card key={escola.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {escola.nome}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    <Badge variant={escola.ativa ? 'default' : 'secondary'}>
                      {escola.ativa ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEdit(escola)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleStatus(escola.id)}
                >
                  {escola.ativa ? 'Desativar' : 'Ativar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Escolas;
