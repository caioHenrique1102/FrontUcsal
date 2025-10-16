import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Star } from 'lucide-react';
import { toast } from 'sonner';

interface Disciplina {
  id: string;
  sigla: string;
  nome: string;
  cargaHoraria: number;
}

interface Interesse {
  disciplinaId: string;
  prioridade: '1' | '2' | null;
}

const Interesses = () => {
  const disciplinas: Disciplina[] = [
    { id: '1', sigla: 'ALG101', nome: 'Algoritmos e Programação', cargaHoraria: 80 },
    { id: '2', sigla: 'ED201', nome: 'Estrutura de Dados', cargaHoraria: 80 },
    { id: '3', sigla: 'BD301', nome: 'Banco de Dados', cargaHoraria: 60 },
    { id: '4', sigla: 'POO202', nome: 'Programação Orientada a Objetos', cargaHoraria: 80 },
    { id: '5', sigla: 'RC401', nome: 'Redes de Computadores', cargaHoraria: 60 },
    { id: '6', sigla: 'ES301', nome: 'Engenharia de Software', cargaHoraria: 80 },
  ];

  const [interesses, setInteresses] = useState<Map<string, '1' | '2'>>(
    new Map([
      ['1', '2'],
      ['2', '2'],
      ['3', '1'],
    ])
  );

  const handlePrioridadeChange = (disciplinaId: string, prioridade: '1' | '2' | 'nenhum') => {
    const newInteresses = new Map(interesses);
    if (prioridade === 'nenhum') {
      newInteresses.delete(disciplinaId);
    } else {
      newInteresses.set(disciplinaId, prioridade);
    }
    setInteresses(newInteresses);
  };

  const handleSave = () => {
    toast.success(`Interesses atualizados! ${interesses.size} disciplinas selecionadas.`);
  };

  const getPrioridadeLabel = (prioridade: '1' | '2') => {
    return prioridade === '2' ? 'Alta prioridade' : 'Baixa prioridade';
  };

  const getPrioridadeBadgeVariant = (prioridade: '1' | '2') => {
    return prioridade === '2' ? 'default' : 'secondary';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Interesse em Disciplinas</h1>
          <p className="text-muted-foreground">
            Indique as disciplinas que deseja lecionar e sua prioridade
          </p>
        </div>
        <Button onClick={handleSave}>
          <Star className="h-4 w-4 mr-2" />
          Salvar Interesses
        </Button>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">Semestre 2025.1</CardTitle>
          <CardDescription>
            Você demonstrou interesse em {interesses.size} disciplinas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-primary" />
              <span>Prioridade 2 = Alto interesse</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-secondary" />
              <span>Prioridade 1 = Posso lecionar</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {disciplinas.map((disciplina) => {
          const prioridade = interesses.get(disciplina.id);
          return (
            <Card key={disciplina.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {disciplina.sigla} - {disciplina.nome}
                      </CardTitle>
                      <CardDescription>
                        Carga horária: {disciplina.cargaHoraria}h
                      </CardDescription>
                    </div>
                  </div>
                  {prioridade && (
                    <Badge variant={getPrioridadeBadgeVariant(prioridade)}>
                      {getPrioridadeLabel(prioridade)}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={prioridade || 'nenhum'}
                  onValueChange={(value) =>
                    handlePrioridadeChange(disciplina.id, value as '1' | '2' | 'nenhum')
                  }
                >
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="2" id={`${disciplina.id}-alta`} />
                      <Label htmlFor={`${disciplina.id}-alta`} className="cursor-pointer">
                        Prioridade 2 - Tenho muito interesse em lecionar
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="1" id={`${disciplina.id}-baixa`} />
                      <Label htmlFor={`${disciplina.id}-baixa`} className="cursor-pointer">
                        Prioridade 1 - Posso lecionar, mas não é minha primeira escolha
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="nenhum" id={`${disciplina.id}-nenhum`} />
                      <Label htmlFor={`${disciplina.id}-nenhum`} className="cursor-pointer">
                        Não tenho interesse
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Interesses;
