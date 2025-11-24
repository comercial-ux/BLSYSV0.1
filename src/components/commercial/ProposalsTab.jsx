
import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PlusCircle, Edit, Trash2, FileText, Eye, Loader2, Filter, CalendarRange, CheckCircle, ArrowDownUp, User } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import ProposalForm from './ProposalForm';
import ProposalView from './ProposalView';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { subDays, startOfDay, endOfDay, parseISO, isBefore } from 'date-fns';
import { useData } from '@/contexts/DataContext';
import MasterPasswordDialog from '@/components/admin/MasterPasswordDialog';

const statusOptions = [
    { value: 'all', label: 'Todos os Status' },
    { value: 'draft', label: 'Rascunho' },
    { value: 'sent', label: 'Enviada' },
    { value: 'approved', label: 'Aprovada' },
    { value: 'rejected', label: 'Rejeitada' },
    { value: 'finished', label: 'Finalizado' },
];

const dateOptions = [
    { value: '7', label: 'Últimos 7 dias' },
    { value: '30', label: 'Últimos 30 dias' },
    { value: '90', label: 'Últimos 90 dias' },
    { value: 'all', label: 'Ver Todas' },
    { value: 'custom', label: 'Personalizado' },
];

const sortOptions = [
    { value: 'date_desc', label: 'Mais Recentes' },
    { value: 'date_asc', label: 'Mais Antigas' },
    { value: 'number_desc', label: 'Nº Proposta (Maior p/ Menor)' },
    { value: 'number_asc', label: 'Nº Proposta (Menor p/ Maior)' },
];

const ProposalsTab = ({ onUpdateNeeded }) => {
    const { user } = useAuth();
    const { commercialData, users, refetchData } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedProposal, setSelectedProposal] = useState(null);
    const [isDeleting, setIsDeleting] = useState(null);
    const [filters, setFilters] = useState({ client: 'all', status: 'all', date: '30', consultant: 'all' });
    const [sortOption, setSortOption] = useState('date_desc');
    const [showFinished, setShowFinished] = useState(false);
    const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
    const [showCustomDate, setShowCustomDate] = useState(false);
    const [proposalToDelete, setProposalToDelete] = useState(null);
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

    const formatDateForDisplay = (dateString) => {
        if (!dateString) return '';
        try {
            const date = parseISO(`${dateString}T00:00:00`);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        } catch (error) {
            console.error("Invalid date format:", dateString);
            const [year, month, day] = dateString.split('-');
            return `${day}/${month}/${year}`;
        }
    };

    const getConsultantName = (proposal) => {
        // Priority 1: Get from the joined users object (best source)
        if (proposal.users && proposal.users.full_name) {
            return proposal.users.full_name;
        }
        
        // Priority 2: If I am the creator (current logged in user)
        if (user && proposal.user_id === user.id) {
             return user.full_name || user.email || 'Eu';
        }
        
        // Priority 3: Search in the users context list using user_id
        if (users && users.length > 0 && proposal.user_id) {
            const consultant = users.find(u => u.id === proposal.user_id);
            if (consultant) {
                return consultant.full_name || consultant.email;
            }
        }

        return 'Consultor não identificado';
    };

    useEffect(() => {
        const checkOverdueProposals = async () => {
            const fifteenDaysAgo = subDays(new Date(), 15);
            const overdueProposals = (commercialData?.proposals || []).filter(p =>
                p.status === 'sent' &&
                p.validity_date &&
                isBefore(parseISO(p.validity_date), fifteenDaysAgo)
            );

            if (overdueProposals.length > 0) {
                const updates = overdueProposals.map(p =>
                    supabase.from('proposals').update({ status: 'rejected' }).eq('id', p.id)
                );
                
                try {
                    await Promise.all(updates);
                    toast({
                        title: "Propostas Atualizadas",
                        description: `${overdueProposals.length} proposta(s) foram marcadas como 'Rejeitada' por terem expirado.`,
                    });
                    refetchData();
                } catch (error) {
                    console.error("Error updating overdue proposals:", error);
                }
            }
        };

        checkOverdueProposals();
    }, [commercialData.proposals, refetchData]);

    const filteredProposals = useMemo(() => {
        return (commercialData?.proposals || [])
            .filter(p => {
                if (filters.client !== 'all' && p.contact_id !== parseInt(filters.client)) return false;
                if (filters.status !== 'all' && p.status !== filters.status) return false;
                if (filters.consultant !== 'all' && p.user_id !== filters.consultant) return false;
                
                const finishedFilter = showFinished || p.status !== 'finished';
                if (!finishedFilter) return false;

                if (filters.date === 'custom') {
                    if (!customDateRange.start || !customDateRange.end) return true; // Don't filter if range is incomplete
                    const proposalDate = startOfDay(parseISO(p.proposal_date));
                    const startDate = startOfDay(parseISO(customDateRange.start));
                    const endDate = endOfDay(parseISO(customDateRange.end));
                    return proposalDate >= startDate && proposalDate <= endDate;
                } else if (filters.date !== 'all') {
                    const days = parseInt(filters.date, 10);
                    const dateFilter = subDays(new Date(), days);
                    return parseISO(p.proposal_date) >= dateFilter;
                }
                return true;
            })
            .sort((a, b) => {
                switch (sortOption) {
                    case 'date_asc':
                        return new Date(a.proposal_date) - new Date(b.proposal_date);
                    case 'date_desc':
                        return new Date(b.proposal_date) - new Date(a.proposal_date);
                    case 'number_asc': {
                        const numA = a.proposal_number || a.id;
                        const numB = b.proposal_number || b.id;
                        if (typeof numA === 'string' && typeof numB === 'string') {
                            return numA.localeCompare(numB, undefined, { numeric: true });
                        }
                        return numA - numB;
                    }
                    case 'number_desc': {
                        const numA = a.proposal_number || a.id;
                        const numB = b.proposal_number || b.id;
                            if (typeof numA === 'string' && typeof numB === 'string') {
                            return numB.localeCompare(numA, undefined, { numeric: true });
                        }
                        return numB - numA;
                    }
                    default:
                        return 0;
                }
            });
    }, [commercialData.proposals, filters, customDateRange, showFinished, sortOption]);

    const openModal = (proposal = null) => {
        setSelectedProposal(proposal);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedProposal(null);
        setIsModalOpen(false);
    };

    const openViewModal = (proposal) => {
        setSelectedProposal(proposal);
        setIsViewModalOpen(true);
    };

    const closeViewModal = () => {
        setSelectedProposal(null);
        setIsViewModalOpen(false);
    };
    
    const handleEditFromView = () => {
        setIsViewModalOpen(false);
        setIsModalOpen(true);
    };

    const handleSave = () => {
        refetchData();
        if (onUpdateNeeded) onUpdateNeeded();
        closeModal();
    };

    const promptDelete = (proposal) => {
        setProposalToDelete(proposal);
        setIsPasswordDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!user || !proposalToDelete) return;
        setIsDeleting(proposalToDelete.id);
        
        const { error: jobError } = await supabase
            .from('jobs')
            .delete()
            .eq('proposal_id', proposalToDelete.id);

        if (jobError && jobError.code !== 'PGRST116') {
                setIsDeleting(null);
                toast({
                variant: 'destructive',
                title: 'Erro ao Excluir Jobs Associados',
                description: jobError.message,
            });
            return;
        }
        
        const { error } = await supabase
            .from('proposals')
            .delete()
            .eq('id', proposalToDelete.id);

        setIsDeleting(null);
        setIsPasswordDialogOpen(false);
        if (error) {
            toast({
                variant: 'destructive',
                title: 'Erro ao Excluir Proposta',
                description: error.message,
            });
        } else {
            toast({
                title: 'Proposta Excluída!',
                description: 'A proposta e seus jobs associados foram removidos.',
            });
            refetchData();
            if (onUpdateNeeded) onUpdateNeeded();
        }
        setProposalToDelete(null);
    };
    
    const getStatusBadge = (status) => {
        const baseClasses = "px-2 py-1 text-xs font-bold rounded-full flex items-center gap-1";
        switch (status) {
            case 'draft': return <span className={`${baseClasses} bg-gray-400 text-white`}>Rascunho</span>;
            case 'sent': return <span className={`${baseClasses} bg-blue-500 text-white`}>Enviada</span>;
            case 'approved': return <span className={`${baseClasses} bg-green-500 text-white`}>Aprovada</span>;
            case 'rejected': return <span className={`${baseClasses} bg-red-500 text-white`}>Rejeitada</span>;
            case 'finished': return <span className={`${baseClasses} bg-purple-600 text-primary-foreground`}><CheckCircle className="w-3 h-3" />Finalizado</span>;
            case 'autorizada': return <span className={`${baseClasses} bg-green-500 text-white`}>Aprovada</span>;
            default: return <span className={`${baseClasses} bg-gray-400 text-white`}>{status}</span>;
        }
    }

    const handleFilterChange = (filterName, value) => {
        if (filterName === 'date' && value === 'custom') {
            setShowCustomDate(true);
        } else {
            setShowCustomDate(false);
        }
        setFilters(prev => ({ ...prev, [filterName]: value }));
    };

    const handleCustomDateChange = (e) => {
        setCustomDateRange(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const applyCustomDateFilter = () => {
        if (!customDateRange.start || !customDateRange.end) {
            toast({
                variant: 'destructive',
                title: 'Datas incompletas',
                description: 'Por favor, selecione a data de início e de fim.',
            });
            return;
        }
        toast({
            title: 'Filtro aplicado!',
            description: `Mostrando propostas de ${formatDateForDisplay(customDateRange.start)} a ${formatDateForDisplay(customDateRange.end)}.`
        });
    };

    const clientOptions = useMemo(() => {
        const options = (commercialData?.contacts || [])
            .filter(c => c.type === 'Cliente')
            .map(c => ({ value: c.id.toString(), label: c.name }));
        options.unshift({ value: 'all', label: 'Todos os Clientes' });
        return options;
    }, [commercialData.contacts]);

    const consultantOptions = useMemo(() => {
        const options = (users || [])
            .filter(u => u.role === 'comercial' || u.role === 'admin')
            .map(u => ({ value: u.id, label: u.full_name || u.email }));
        options.unshift({ value: 'all', label: 'Todos os Consultores' });
        return options;
    }, [users]);

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
                        <div>
                            <CardTitle>Propostas Comerciais</CardTitle>
                            <CardDescription>Crie e gerencie as propostas para seus clientes.</CardDescription>
                        </div>
                        <Button onClick={() => openModal()}><PlusCircle className="mr-2 h-4 w-4" /> Nova Proposta</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-4 p-4 mb-4 bg-muted/50 rounded-lg border">
                        <div className="flex flex-wrap items-center gap-4">
                            <Filter className="w-5 h-5 text-primary self-center" />
                            <div className="flex-grow min-w-[150px]">
                                <Combobox
                                    options={clientOptions}
                                    value={filters.client}
                                    onChange={(value) => handleFilterChange('client', value)}
                                    placeholder="Filtrar por Cliente..."
                                />
                            </div>
                            <div className="flex-grow min-w-[150px]">
                                <Combobox
                                    options={consultantOptions}
                                    value={filters.consultant}
                                    onChange={(value) => handleFilterChange('consultant', value)}
                                    placeholder="Filtrar por Consultor..."
                                />
                            </div>
                            <div className="flex-grow min-w-[150px]">
                                <Combobox
                                    options={statusOptions}
                                    value={filters.status}
                                    onChange={(value) => handleFilterChange('status', value)}
                                    placeholder="Filtrar por Status..."
                                />
                            </div>
                            <div className="flex-grow min-w-[150px]">
                                <Combobox
                                    options={dateOptions}
                                    value={filters.date}
                                    onChange={(value) => handleFilterChange('date', value)}
                                    placeholder="Filtrar por Data..."
                                />
                            </div>
                            <ArrowDownUp className="w-5 h-5 text-primary self-center" />
                            <div className="flex-grow min-w-[150px]">
                                <Combobox
                                    options={sortOptions}
                                    value={sortOption}
                                    onChange={setSortOption}
                                    placeholder="Ordenar por..."
                                />
                            </div>
                            <div className="flex items-center space-x-2 pl-2">
                                <Checkbox id="showFinished" checked={showFinished} onCheckedChange={setShowFinished} />
                                <Label htmlFor="showFinished" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Mostrar Finalizados
                                </Label>
                            </div>
                        </div>
                        {showCustomDate && (
                            <div className="flex flex-wrap items-end gap-4 pt-4 border-t">
                                <CalendarRange className="w-5 h-5 text-primary self-center" />
                                <div className="flex-grow">
                                    <Label htmlFor="start">De</Label>
                                    <Input id="start" name="start" type="date" value={customDateRange.start} onChange={handleCustomDateChange} className="mt-1" />
                                </div>
                                <div className="flex-grow">
                                    <Label htmlFor="end">Até</Label>
                                    <Input id="end" name="end" type="date" value={customDateRange.end} onChange={handleCustomDateChange} className="mt-1" />
                                </div>
                                <Button onClick={applyCustomDateFilter}>Aplicar</Button>
                            </div>
                        )}
                    </div>

                    <ScrollArea className="h-[55vh]">
                        <div className="space-y-3 pr-4">
                            {filteredProposals.length > 0 ? (
                                filteredProposals.map(proposal => (
                                    <div key={proposal.id} className="flex items-center justify-between p-4 bg-background border rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <FileText className="w-6 h-6 text-primary" />
                                            <div className="flex-1">
                                                <p className="font-bold text-foreground">Proposta {proposal.proposal_number ? `Nº ${proposal.proposal_number}` : `#${proposal.id}`}</p>
                                                <p className="text-sm text-muted-foreground">{proposal.contacts?.name || 'Cliente não encontrado'}</p>
                                                <p className="text-xs text-muted-foreground">Data: {formatDateForDisplay(proposal.proposal_date)}</p>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground border-l pl-4 min-w-[200px]">
                                                <User className="w-4 h-4" />
                                                <span>{getConsultantName(proposal)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {getStatusBadge(proposal.status)}
                                            <div className="flex gap-2">
                                                <Button size="icon" variant="ghost" onClick={() => openViewModal(proposal)} title="Visualizar" disabled={isDeleting}><Eye className="w-4 h-4" /></Button>
                                                <Button size="icon" variant="ghost" onClick={() => openModal(proposal)} title="Editar" disabled={isDeleting}><Edit className="w-4 h-4" /></Button>
                                                <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-600" title="Excluir" disabled={isDeleting === proposal.id} onClick={() => promptDelete(proposal)}>
                                                    {isDeleting === proposal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12">
                                    <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                                    <h3 className="text-xl font-semibold text-foreground">Nenhuma proposta encontrada</h3>
                                    <p className="text-muted-foreground">Ajuste os filtros ou crie sua primeira proposta clicando no botão "Nova Proposta".</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{selectedProposal ? 'Editar' : 'Criar Nova'} Proposta Comercial</DialogTitle>
                    </DialogHeader>
                    <ProposalForm 
                        proposal={selectedProposal} 
                        onSave={handleSave} 
                        onClose={closeModal} 
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                <DialogContent className="max-w-6xl p-0">
                    <ProposalView 
                        proposal={selectedProposal} 
                        onClose={closeViewModal} 
                        onEdit={handleEditFromView}
                        onUpdateNeeded={onUpdateNeeded}
                    />
                </DialogContent>
            </Dialog>
            <MasterPasswordDialog
                isOpen={isPasswordDialogOpen}
                onClose={() => setIsPasswordDialogOpen(false)}
                onConfirm={handleDelete}
                isSubmitting={!!isDeleting}
                title="Confirmar Exclusão de Proposta"
                description={`Tem certeza que deseja excluir a proposta Nº ${proposalToDelete?.proposal_number || proposalToDelete?.id}? Isso excluirá permanentemente a proposta e todos os seus dados associados, como jobs e medições.`}
            />
        </>
    );
};

export default ProposalsTab;
