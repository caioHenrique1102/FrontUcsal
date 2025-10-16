import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, BookOpen, TrendingUp } from 'lucide-react';

const Relatorios = () => {
  const professoresPorTurno = [
    { professor: 'Prof. João Silva', turno: 'Manhã', horarios: 3 },
    { professor: 'Prof. João Silva', turno: 'Tarde', horarios: 2 },
    { professor: 'Profa. Maria Santos', turno: 'Noite', horarios: 4 },
    { professor: 'Prof. Carlos Oliveira', turno: 'Manhã', horarios: 2 }
  ];

  const disciplinasComInteresse = [
    { disciplina: 'Algoritmos e Programação', professores: 8 },
    { disciplina: 'Estrutura de Dados', professores: 6 },
    { disciplina: 'Banco de Dados', professores: 7 },
    { disciplina: 'Programação Orientada a Objetos', professores: 5 },
    { disciplina: 'Redes de Computadores', professores: 3 }
  ];

  const professoresAtivos = [
    { nome: 'Prof. João Silva', escola: 'Engenharias', status: 'Ativo', alocacoes: 3 },
    { nome: 'Profa. Maria Santos', escola: 'Ciências Sociais', status: 'Ativo', alocacoes: 2 },
    { nome: 'Prof. Carlos Oliveira', escola: 'Ciências Naturais', status: 'Inativo', alocacoes: 0 }
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Relatórios</h1>
        <p className="text-muted-foreground">Visualize informações consolidadas do sistema</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Professores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">42 ativos, 3 inativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disciplinas Ativas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">120</div>
            <p className="text-xs text-muted-foreground">de 128 cadastradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alocações</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87</div>
            <p className="text-xs text-muted-foreground">Semestre 2025.1</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Ocupação</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">72%</div>
            <p className="text-xs text-muted-foreground">das vagas preenchidas</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="turno" className="space-y-4">
        <TabsList>
          <TabsTrigger value="turno">Por Turno</TabsTrigger>
          <TabsTrigger value="interesse">Interesse em Disciplinas</TabsTrigger>
          <TabsTrigger value="professores">Lista de Professores</TabsTrigger>
        </TabsList>

        <TabsContent value="turno" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Professores por Turno</CardTitle>
              <CardDescription>Disponibilidade de horários cadastrados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {professoresPorTurno.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{item.professor}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.horarios} horários disponíveis
                      </p>
                    </div>
                    <Badge>{item.turno}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interesse" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Disciplinas com Professores Interessados</CardTitle>
              <CardDescription>Quantidade de professores que demonstraram interesse</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {disciplinasComInteresse.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{item.disciplina}</p>
                      <div className="w-full bg-secondary h-2 rounded-full mt-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${(item.professores / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="ml-4 text-center">
                      <div className="text-2xl font-bold text-primary">{item.professores}</div>
                      <p className="text-xs text-muted-foreground">professores</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="professores" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Professores</CardTitle>
              <CardDescription>Status e alocações dos professores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {professoresAtivos.map((prof, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{prof.nome}</p>
                      <p className="text-sm text-muted-foreground">{prof.escola}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="text-lg font-bold">{prof.alocacoes}</div>
                        <p className="text-xs text-muted-foreground">alocações</p>
                      </div>
                      <Badge variant={prof.status === 'Ativo' ? 'default' : 'secondary'}>
                        {prof.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Relatorios;
