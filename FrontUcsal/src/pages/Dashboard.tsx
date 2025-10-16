import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, BookOpen, Calendar } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
          <p className="text-muted-foreground">Visão geral do sistema</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Escolas</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
              <p className="text-xs text-muted-foreground">4 ativas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Professores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45</div>
              <p className="text-xs text-muted-foreground">42 ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disciplinas</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">128</div>
              <p className="text-xs text-muted-foreground">120 ativas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alocações</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">87</div>
              <p className="text-xs text-muted-foreground">Semestre 2025.1</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Últimas Atividades</CardTitle>
              <CardDescription>Ações recentes no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Novo professor cadastrado</p>
                    <p className="text-xs text-muted-foreground">Prof. Maria Santos - há 2 horas</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Disciplina atualizada</p>
                    <p className="text-xs text-muted-foreground">Estrutura de Dados - há 5 horas</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Alocação realizada</p>
                    <p className="text-xs text-muted-foreground">Prof. João - Matemática I - há 1 dia</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alertas</CardTitle>
              <CardDescription>Itens que precisam de atenção</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 mt-2 rounded-full bg-destructive" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">5 disciplinas sem professores</p>
                    <p className="text-xs text-muted-foreground">Necessitam alocação urgente</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 mt-2 rounded-full bg-yellow-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">8 professores sem horários</p>
                    <p className="text-xs text-muted-foreground">Aguardando definição de disponibilidade</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bem-vindo, {user?.name}!</h1>
        <p className="text-muted-foreground">Gerencie suas informações acadêmicas</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Horários Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">12</div>
            <p className="text-sm text-muted-foreground mt-1">Horários disponíveis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Disciplinas de Interesse</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">5</div>
            <p className="text-sm text-muted-foreground mt-1">Disciplinas selecionadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Alocações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">3</div>
            <p className="text-sm text-muted-foreground mt-1">Turmas alocadas</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Suas Alocações - Semestre 2025.1</CardTitle>
          <CardDescription>Disciplinas em que você foi alocado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 border rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">Algoritmos e Programação</p>
                  <p className="text-sm text-muted-foreground">Turma A - Segunda e Quarta</p>
                </div>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Manhã</span>
              </div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">Estrutura de Dados</p>
                  <p className="text-sm text-muted-foreground">Turma B - Terça e Quinta</p>
                </div>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Tarde</span>
              </div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">Banco de Dados</p>
                  <p className="text-sm text-muted-foreground">Turma C - Sexta</p>
                </div>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Noite</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
