import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, User, BookOpen, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

interface Alocacao {
    id: string;
    professorResponseSimples: { nome: string };
    matrizDisciplinaResponseSimples: { disciplinaResponse: { nome: string } };
    horarioResponse: { diaSemana: string; horarioInicio: string; horarioFinal: string };
    turmaResponse: { codigo: string };
}

const Alocacoes = () => {
    const [alocacoes, setAlocacoes] = useState<Alocacao[]>([]);
    const [professores, setProfessores] = useState<any[]>([]);
    const [disciplinas, setDisciplinas] = useState<any[]>([]);
    const [horarios, setHorarios] = useState<any[]>([]);
    const [turmas, setTurmas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const headers = { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` };
                const [alocResponse, profResponse, discResponse, horResponse, turmaResponse] = await Promise.all([
                    fetch('/admin/alocacoes', { headers }),
                    fetch('/api/professores/ativos', { headers }),
                    fetch('/api/matriz-disciplinas', { headers }),
                    fetch('/api/horarios', { headers }),
                    fetch('/api/turmas', { headers }),
                ]);

                setAlocacoes(await alocResponse.json());
                setProfessores(await profResponse.json());
                setDisciplinas(await discResponse.json());
                setHorarios(await horResponse.json());
                setTurmas(await turmaResponse.json());

            } catch (error) {
                toast.error("Erro ao carregar dados para alocação.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [professor, setProfessor] = useState('');
    const [disciplina, setDisciplina] = useState('');
    const [horario, setHorario] = useState('');
    const [turma, setTurma] = useState('');

    const handleSave = async () => {
        if (!professor || !disciplina || !horario || !turma) {
            toast.error('Todos os campos são obrigatórios');
            return;
        }

        const novaAlocacao = { professorId: professor, matrizDisciplinaId: disciplina, horarioId: horario, turmaId: turma };

        try {
            const response = await fetch('/admin/alocacoes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(novaAlocacao),
            });

            if (!response.ok) throw new Error('Falha ao realizar alocação');

            const savedAlocacao = await response.json();
            setAlocacoes([...alocacoes, savedAlocacao]);
            toast.success('Alocação realizada com sucesso!');
            closeDialog();
        } catch (error) {
            toast.error('Erro ao realizar alocação');
        }
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        setProfessor('');
        setDisciplina('');
        setHorario('');
        setTurma('');
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
                        <Button onClick={() => setIsDialogOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Nova Alocação
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Nova Alocação</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Professor</Label>
                                <Select value={professor} onValueChange={setProfessor}>
                                    <SelectTrigger><SelectValue placeholder="Selecione o professor" /></SelectTrigger>
                                    <SelectContent>
                                        {professores.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Disciplina</Label>
                                <Select value={disciplina} onValueChange={setDisciplina}>
                                    <SelectTrigger><SelectValue placeholder="Selecione a disciplina" /></SelectTrigger>
                                    <SelectContent>
                                        {disciplinas.map((d) => <SelectItem key={d.id} value={d.id}>{d.disciplinaResponse.nome}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Horário</Label>
                                <Select value={horario} onValueChange={setHorario}>
                                    <SelectTrigger><SelectValue placeholder="Selecione o horário" /></SelectTrigger>
                                    <SelectContent>
                                        {horarios.map((h) => <SelectItem key={h.id} value={h.id}>{`${h.diaSemana} ${h.horarioInicio}-${h.horarioFinal}`}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Turma</Label>
                                <Select value={turma} onValueChange={setTurma}>
                                    <SelectTrigger><SelectValue placeholder="Selecione a turma" /></SelectTrigger>
                                    <SelectContent>
                                        {turmas.map((t) => <SelectItem key={t.id} value={t.id}>{t.codigo}</SelectItem>)}
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

            {loading ? <p>Carregando alocações...</p> : (
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
                                            <h3 className="font-semibold">{alocacao.turmaResponse.codigo}</h3>
                                        </div>
                                        <Badge>Ativa</Badge>
                                    </div>
                                    <div className="grid gap-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <span>{alocacao.professorResponseSimples.nome}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                                            <span>{alocacao.matrizDisciplinaResponseSimples.disciplinaResponse.nome}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <span>{`${alocacao.horarioResponse.diaSemana} ${alocacao.horarioResponse.horarioInicio}-${alocacao.horarioResponse.horarioFinal}`}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default Alocacoes;