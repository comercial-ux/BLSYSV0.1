import React, { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Edit, Trash2, Loader2, CalendarDays, KeyRound as UserRound, MessageSquare, Repeat, FileText, List } from 'lucide-react';
import { format, isSameDay, parseISO, startOfToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import MasterPasswordDialog from '@/components/admin/MasterPasswordDialog';

const ProspectingForm = ({ prospecting, onSave, onClose }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState(prospecting || {
        prospect_name: '',
        visit_date: new Date().toISOString().slice(0, 10),
        notes: '',
        follow_up_date: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.prospect_name || !formData.visit_date) {
            toast({ variant: 'destructive', title: 'Campos obrigatórios', description: 'Nome do cliente e data da visita são obrigatórios.' });
            return;
        }
        setIsSubmitting(true);
        const dataToSave = { ...formData, user_id: user.id, contact_id: null };

        let error;
        if (prospecting?.id) {
            const { error: updateError } = await supabase.from('prospections').update(dataToSave).eq('id', prospecting.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase.from('prospections').insert([dataToSave]);
            error = insertError;
        }

        setIsSubmitting(false);
        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message });
        } else {
            toast({ title: 'Sucesso!', description: 'Registro de prospecção salvo.' });
            onSave();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="prospect_name">Nome do Cliente (Prospecção)</Label>
                <Input
                    id="prospect_name"
                    name="prospect_name"
                    value={formData.prospect_name || ''}
                    onChange={handleChange}
                    placeholder="Digite o nome do cliente ou da empresa"
                    required
                />
            </div>
            <div>
                <Label>Data da Visita/Contato</Label>
                <Input type="date" name="visit_date" value={formData.visit_date} onChange={handleChange} required />
            </div>
            <div>
                <Label>Anotações</Label>
                <Textarea name="notes" value={formData.notes || ''} onChange={handleChange} rows={5} placeholder="Descreva como foi a visita, pontos discutidos, etc." />
            </div>
            <div>
                <Label>Agendar Follow-up</Label>
                <Input type="date" name="follow_up_date" value={formData.follow_up_date || ''} onChange={handleChange} />
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar
                </Button>
            </DialogFooter>
        </form>
    );
};

const ProspectingTab = ({ onUpdateNeeded }) => {
    const { commercialData, loading } = useData();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProspecting, setSelectedProspecting] = useState(null);
    const [prospectingToDelete, setProspectingToDelete] = useState(null);
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [viewMode, setViewMode] = useState('date'); // 'date' or 'all'

    const agendaItems = useMemo(() => {
        const prospections = (commercialData?.prospections || [])
            .filter(p => isSameDay(parseISO(p.visit_date), selectedDate))
            .map(p => ({ ...p, type: 'prospecting', date: p.visit_date }));

        const proposals = (commercialData?.proposals || [])
            .filter(p => p.validity_date && isSameDay(parseISO(p.validity_date), selectedDate))
            .map(p => ({ ...p, type: 'proposal', date: p.validity_date }));

        return [...prospections, ...proposals].sort((a, b) => parseISO(a.date) - parseISO(b.date));
    }, [commercialData.prospections, commercialData.proposals, selectedDate]);

    const allSentProposals = useMemo(() => {
        return (commercialData?.proposals || [])
            .filter(p => p.status === 'sent' && p.validity_date)
            .sort((a, b) => parseISO(a.validity_date) - parseISO(b.validity_date));
    }, [commercialData.proposals]);

    const calendarEvents = useMemo(() => {
        const prospectionDates = (commercialData?.prospections || []).map(p => parseISO(p.visit_date));
        const proposalDates = (commercialData?.proposals || []).filter(p => p.validity_date).map(p => parseISO(p.validity_date));
        return [...prospectionDates, ...proposalDates];
    }, [commercialData.prospections, commercialData.proposals]);

    const handleDateSelect = (date) => {
        setSelectedDate(date);
        setViewMode('date');
    };

    const openModal = (prospecting = null) => {
        const initialData = prospecting ? {
            ...prospecting,
            visit_date: prospecting.visit_date,
            follow_up_date: prospecting.follow_up_date || ''
        } : {
            prospect_name: '',
            visit_date: format(selectedDate, 'yyyy-MM-dd'),
            notes: '',
            follow_up_date: '',
        };
        setSelectedProspecting(initialData);
        setIsModalOpen(true);
    };

    const handleSave = () => {
        onUpdateNeeded();
        setIsModalOpen(false);
    };

    const promptDelete = (prospecting) => {
        setProspectingToDelete(prospecting);
        setIsPasswordDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!prospectingToDelete) return;
        const { error } = await supabase.from('prospections').delete().eq('id', prospectingToDelete.id);
        setIsPasswordDialogOpen(false);
        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao excluir', description: error.message });
        } else {
            toast({ title: 'Registro excluído!' });
            onUpdateNeeded();
        }
        setProspectingToDelete(null);
    };

    const getStatusBadge = (status) => {
        const baseClasses = "px-2 py-1 text-xs font-bold rounded-full";
        switch (status) {
            case 'draft': return <span className={`${baseClasses} bg-gray-400 text-white`}>Rascunho</span>;
            case 'sent': return <span className={`${baseClasses} bg-blue-500 text-white`}>Enviada</span>;
            case 'approved': return <span className={`${baseClasses} bg-green-500 text-white`}>Aprovada</span>;
            case 'rejected': return <span className={`${baseClasses} bg-red-500 text-white`}>Rejeitada</span>;
            default: return <span className={`${baseClasses} bg-gray-400 text-white`}>{status}</span>;
        }
    };

    const renderItems = (items) => {
        if (loading) return <Loader2 className="mx-auto my-10 h-8 w-8 animate-spin text-primary" />;
        if (items.length === 0) {
            return (
                <div className="text-center py-16 text-muted-foreground">
                    <CalendarDays className="mx-auto h-12 w-12 mb-4" />
                    <p>Nenhum registro encontrado.</p>
                </div>
            );
        }
        return items.map((item) => (
            item.type === 'prospecting' ? (
                <Card key={`prospect-${item.id}`} className="bg-muted/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg flex items-center gap-2"><UserRound className="w-5 h-5 text-primary" />{item.prospect_name || 'Cliente não encontrado'}</CardTitle>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openModal(item)}><Edit className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => promptDelete(item)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {item.notes && <p className="text-sm text-muted-foreground flex items-start gap-2 mb-2"><MessageSquare className="w-4 h-4 mt-1 shrink-0" />{item.notes}</p>}
                        {item.follow_up_date && <p className="text-sm font-semibold text-amber-600 flex items-center gap-2"><Repeat className="w-4 h-4" />Follow-up em: {format(parseISO(item.follow_up_date), 'dd/MM/yyyy')}</p>}
                    </CardContent>
                </Card>
            ) : (
                <Card key={`proposal-${item.id}`} className="bg-blue-900/20 border-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-blue-400" />Follow-up de Proposta</CardTitle>
                        {getStatusBadge(item.status)}
                    </CardHeader>
                    <CardContent>
                        <p className="font-semibold">{item.proposal_number ? `Nº ${item.proposal_number}` : `#${item.id}`}</p>
                        <p className="text-sm text-muted-foreground">Cliente: {item.contacts?.name || 'N/A'}</p>
                        <p className={`text-xs font-semibold ${isSameDay(parseISO(item.validity_date), startOfToday()) ? 'text-amber-400' : 'text-gray-400'}`}>
                            Validade: {format(parseISO(item.validity_date), 'dd/MM/yyyy')}
                        </p>
                    </CardContent>
                </Card>
            )
        ));
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Agenda de Prospecção e Follow-up</CardTitle>
                    <CardDescription>Acompanhe suas visitas e propostas que precisam de atenção.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 flex flex-col items-center">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleDateSelect}
                            className="rounded-md border"
                            locale={ptBR}
                            modifiers={{ hasEvent: calendarEvents }}
                            modifiersStyles={{
                                hasEvent: {
                                    border: `2px solid hsl(var(--primary))`,
                                    borderRadius: '50%'
                                }
                            }}
                        />
                        <Button onClick={() => setViewMode('all')} className="mt-4 w-full">
                            <List className="mr-2 h-4 w-4" /> Ver Todas as Pendentes
                        </Button>
                    </div>
                    <div className="md:col-span-2">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">
                                {viewMode === 'date'
                                    ? `Agenda para ${format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`
                                    : "Todas as Propostas Enviadas"}
                            </h3>
                            <Button onClick={() => openModal()}><PlusCircle className="mr-2 h-4 w-4" /> Nova Prospecção</Button>
                        </div>
                        <div className="space-y-4 h-[60vh] overflow-y-auto pr-2">
                            {viewMode === 'date' ? renderItems(agendaItems) : renderItems(allSentProposals)}
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedProspecting?.id ? 'Editar' : 'Novo'} Registro de Prospecção</DialogTitle>
                    </DialogHeader>
                    <ProspectingForm prospecting={selectedProspecting} onSave={handleSave} onClose={() => setIsModalOpen(false)} />
                </DialogContent>
            </Dialog>
            <MasterPasswordDialog
                isOpen={isPasswordDialogOpen}
                onClose={() => setIsPasswordDialogOpen(false)}
                onConfirm={handleDelete}
                title="Confirmar Exclusão"
                description="Tem certeza que deseja excluir este registro de prospecção?"
            />
        </>
    );
};

export default ProspectingTab;