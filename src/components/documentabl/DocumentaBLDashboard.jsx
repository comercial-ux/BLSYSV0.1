
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Users, HardHat, Truck, AlertTriangle, Lock, Gavel, Calendar as CalendarIcon, PlusCircle } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { getDocumentStatus } from '@/lib/documentabl';
import { format, parseISO, isSameDay, isValid, startOfToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const StatCard = ({ title, icon, count, link }) => (
    <motion.div whileHover={{ y: -5 }} className="h-full">
        <Link to={link}>
            <Card className="h-full bg-card/80 backdrop-blur-sm border-border hover:border-primary transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    {icon}
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{count}</div>
                    <p className="text-xs text-muted-foreground">documentos</p>
                </CardContent>
            </Card>
        </Link>
    </motion.div>
);

const DemandFormDialog = ({ isOpen, onClose, date, onSave }) => {
    const [title, setTitle] = useState('');
    const [details, setDetails] = useState('');
    const { user } = useAuth();
    const { toast } = useToast();

    const handleSave = async () => {
        if (!title) {
            toast({ variant: 'destructive', title: 'Título é obrigatório' });
            return;
        }
        const { error } = await supabase.from('documentabl_demands').insert({
            user_id: user.id,
            demand_date: date,
            title,
            details,
        });
        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao salvar demanda', description: error.message });
        } else {
            toast({ title: 'Demanda salva com sucesso!' });
            onSave();
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nova Demanda Jurídica</DialogTitle>
                    <DialogDescription>Adicionar uma nova audiência ou demanda para {format(date, 'dd/MM/yyyy')}.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right">Título</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="details" className="text-right">Detalhes</Label>
                        <Textarea id="details" value={details} onChange={(e) => setDetails(e.target.value)} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave}>Salvar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const DocumentaBLDashboard = () => {
    const { documentabl, refetchData } = useData();
    // Add safety check for documentabl being undefined
    const { documents = [], demands = [] } = documentabl || {};
    const [date, setDate] = useState(new Date());
    const [isDemandFormOpen, setIsDemandFormOpen] = useState(false);
    
    const getCount = (category) => documents.filter(d => d.main_category === category).length;

    const expiringDocs = useMemo(() => {
        return documents
            .map(doc => ({ ...doc, status: getDocumentStatus(doc) }))
            .filter(doc => doc.status.text.startsWith('Vence') || doc.status.text === 'Vencido')
            .sort((a, b) => {
                const daysA = a.status.text.match(/\d+/);
                const daysB = b.status.text.match(/\d+/);
                if (a.status.text === 'Vencido' && b.status.text !== 'Vencido') return -1;
                if (b.status.text === 'Vencido' && a.status.text !== 'Vencido') return 1;
                if (daysA && daysB) return parseInt(daysA[0]) - parseInt(daysB[0]);
                return 0;
            });
    }, [documents]);

    const demandsByDay = useMemo(() => {
        return demands.reduce((acc, demand) => {
            if (!demand.demand_date) return acc;
            const demandDate = parseISO(demand.demand_date);
            if (!isValid(demandDate)) return acc;
            
            const day = format(demandDate, 'yyyy-MM-dd');
            if (!acc[day]) acc[day] = [];
            acc[day].push(demand);
            return acc;
        }, {});
    }, [demands]);

    const upcomingDemands = useMemo(() => {
        const today = startOfToday();
        return demands
            .map(d => ({ ...d, parsedDate: parseISO(d.demand_date) }))
            .filter(d => isValid(d.parsedDate) && d.parsedDate >= today)
            .sort((a, b) => a.parsedDate - b.parsedDate);
    }, [demands]);

    const DayContent = ({ date: dayDate, ...props }) => {
        const dayKey = format(dayDate, 'yyyy-MM-dd');
        const hasDemand = demandsByDay[dayKey];
        const isToday = isSameDay(dayDate, new Date());
        
        return (
            <div className={`relative h-full w-full flex items-center justify-center ${isToday ? 'font-bold' : ''}`}>
                {props.children}
                {hasDemand && <div className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-red-500"></div>}
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-6">
                <StatCard title="Empresa" icon={<FileText className="h-4 w-4 text-muted-foreground" />} count={getCount('empresa')} link="/documentabl/empresa" />
                <StatCard title="Colaborador" icon={<Users className="h-4 w-4 text-muted-foreground" />} count={getCount('colaborador')} link="/documentabl/colaborador" />
                <StatCard title="Equipamento" icon={<Truck className="h-4 w-4 text-muted-foreground" />} count={getCount('equipamento')} link="/documentabl/equipamento" />
                <StatCard title="Segurança" icon={<HardHat className="h-4 w-4 text-muted-foreground" />} count={getCount('seguranca')} link="/documentabl/seguranca" />
                <StatCard title="Demandas" icon={<Gavel className="h-4 w-4 text-muted-foreground" />} count={getCount('demandas')} link="/documentabl/demandas" />
                <StatCard title="Administrativa" icon={<Lock className="h-4 w-4 text-muted-foreground" />} count={getCount('administrativa')} link="/documentabl/administrativa" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center"><CalendarIcon className="mr-2 h-5 w-5" />Calendário de Demandas Jurídicas</CardTitle>
                        <Button onClick={() => setIsDemandFormOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Nova Demanda</Button>
                    </CardHeader>
                    <CardContent className="flex flex-col md:flex-row gap-6">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            className="rounded-md border"
                            locale={ptBR}
                            components={{ DayContent }}
                        />
                        <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-2">Próximas Demandas</h3>
                            {upcomingDemands.length > 0 ? (
                                <ul className="space-y-2 max-h-64 overflow-y-auto pr-2">
                                    {upcomingDemands.map(demand => (
                                        <li key={demand.id} className="p-3 bg-muted rounded-md">
                                            <div className="flex justify-between items-center">
                                                <p className="font-semibold">{demand.title}</p>
                                                <p className="text-sm font-medium text-muted-foreground">{format(demand.parsedDate, 'dd/MM/yyyy')}</p>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">{demand.details}</p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-muted-foreground">Nenhuma demanda futura cadastrada.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center"><AlertTriangle className="mr-2 h-5 w-5 text-yellow-400" />Notificações e Pendências</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {expiringDocs.length > 0 ? (
                            <ul className="space-y-3 max-h-96 overflow-y-auto">
                                {expiringDocs.map(doc => (
                                    <li key={doc.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                                        <div>
                                            <p className="font-medium text-sm">{doc.name}</p>
                                            <p className="text-xs text-muted-foreground">{doc.main_category}</p>
                                        </div>
                                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${doc.status.bgColor} ${doc.status.color}`}>{doc.status.text}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-muted-foreground">Nenhum documento vencido ou próximo do vencimento.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
            {isDemandFormOpen && date && isValid(date) && (
                <DemandFormDialog 
                    isOpen={isDemandFormOpen}
                    onClose={() => setIsDemandFormOpen(false)}
                    date={date}
                    onSave={refetchData}
                />
            )}
        </div>
    );
};

export default DocumentaBLDashboard;
