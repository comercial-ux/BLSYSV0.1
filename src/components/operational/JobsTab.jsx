import React, { useState, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useReactToPrint } from 'react-to-print';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PlusCircle, Edit, Trash2, Briefcase, Printer, Loader2, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import JobForm from './JobForm';
import { useToast } from '@/components/ui/use-toast';
import JobPrintLayout from './JobPrintLayout';
import MasterPasswordDialog from '@/components/admin/MasterPasswordDialog';
import { Combobox } from '@/components/ui/combobox';

const JobsTab = ({ operationalData, commercialData, allAssets, onUpdate }) => {
    const { user } = useAuth();
    const { jobs } = operationalData || { jobs: [] };
    const { proposals, contacts } = commercialData || { proposals: [], contacts: [] };
    const [isJobModalOpen, setIsJobModalOpen] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [filters, setFilters] = useState({ status: 'all', client: '' });
    const [showCompleted, setShowCompleted] = useState(false);
    const [isDeleting, setIsDeleting] = useState(null);
    const [jobToDelete, setJobToDelete] = useState(null);
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const { toast } = useToast();

    const printComponentRef = React.useRef(null);
    
    const handlePrint = useReactToPrint({
      content: () => printComponentRef.current,
      documentTitle: `OS-${selectedJob?.job_code || 'Job'}`,
    });

    const openJobModal = (job = null) => {
        setSelectedJob(job);
        setIsJobModalOpen(true);
    };

    const closeJobModal = () => {
        setSelectedJob(null);
        setIsJobModalOpen(false);
    };

    const handleSave = () => {
        onUpdate();
        closeJobModal();
    };
    
    const promptDelete = (job) => {
        setJobToDelete(job);
        setIsPasswordDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!user || !jobToDelete) {
            toast({ variant: 'destructive', title: 'Erro de Autenticação ou Job não selecionado' });
            return;
        }
        setIsDeleting(jobToDelete.id);
        const { error } = await supabase.from('jobs').delete().eq('id', jobToDelete.id);
        setIsDeleting(null);
        setIsPasswordDialogOpen(false);

        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao excluir Job', description: error.message });
        } else {
            toast({ title: 'Job excluído com sucesso!' });
            onUpdate();
            setJobToDelete(null);
        }
    };

    const handleSelectFilterChange = (name, value) => {
        setFilters({ ...filters, [name]: value });
    };

    const resetFilters = () => {
        setFilters({ status: 'all', client: '' });
        setShowCompleted(false);
    };

    const filteredJobs = useMemo(() => {
        return (jobs || [])
            .filter(job => {
                const statusFilter = filters.status === 'all' || job.status === filters.status;
                const clientFilter = filters.client === '' || job.proposal?.contacts?.id?.toString() === filters.client;
                const completedFilter = showCompleted || job.status !== 'completed';

                return statusFilter && clientFilter && completedFilter;
            });
    }, [jobs, filters, showCompleted]);
    
    const clientOptions = useMemo(() => {
        if (!contacts) return [];
        return contacts
            .filter(c => c.type === 'Cliente')
            .sort((a,b) => a.name.localeCompare(b.name))
            .map(c => ({ value: c.id.toString(), label: c.name }));
    }, [contacts]);

    const getStatusBadge = (status) => {
        const baseClasses = "px-2 py-1 text-xs font-bold rounded-full";
        switch (status) {
            case 'pending': return <span className={`${baseClasses} bg-yellow-500 text-white`}>Pendente</span>;
            case 'in_progress': return <span className={`${baseClasses} bg-blue-500 text-white`}>Em Andamento</span>;
            case 'completed': return <span className={`${baseClasses} bg-green-500 text-white`}>Concluído</span>;
            case 'cancelled': return <span className={`${baseClasses} bg-red-500 text-white`}>Cancelado</span>;
            default: return <span className={`${baseClasses} bg-gray-400 text-white`}>{status}</span>;
        }
    };

    return (
        <>
            <Card className="bg-card/80 border-border">
                <CardHeader>
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <CardTitle>Jobs (Ordens de Serviço)</CardTitle>
                            <CardDescription>Crie e gerencie as ordens de serviço operacionais.</CardDescription>
                        </div>
                        <Button onClick={() => openJobModal()}><PlusCircle className="mr-2 h-4 w-4" /> Novo Job</Button>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-black/20 rounded-lg">
                        <div className="w-64">
                            <Label>Cliente</Label>
                            <Combobox
                                options={clientOptions}
                                value={filters.client}
                                onChange={(value) => handleSelectFilterChange('client', value)}
                                placeholder="Filtrar por cliente..."
                                searchPlaceholder="Pesquisar cliente..."
                                emptyText="Nenhum cliente encontrado."
                                className="bg-background"
                            />
                        </div>
                        <div className="w-48">
                            <Label>Status</Label>
                            <Select name="status" value={filters.status} onValueChange={(v) => handleSelectFilterChange('status', v)}>
                                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="pending">Pendente</SelectItem>
                                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                                    <SelectItem value="completed">Concluído</SelectItem>
                                    <SelectItem value="cancelled">Cancelado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center space-x-2 pt-6">
                            <Checkbox id="showCompleted" checked={showCompleted} onCheckedChange={setShowCompleted} />
                            <Label htmlFor="showCompleted" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Mostrar Concluídos
                            </Label>
                        </div>
                        <div className="pt-6">
                            <Button variant="ghost" onClick={resetFilters}><X className="mr-2 h-4 w-4" />Limpar Filtros</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[calc(60vh-80px)]">
                        <div className="space-y-3 pr-4">
                            {filteredJobs.length > 0 ? (
                                filteredJobs.map(job => (
                                    <div key={job.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <Briefcase className="w-6 h-6 text-primary" />
                                            <div>
                                                <p className="font-bold text-white">
                                                    Job #{job.job_code}
                                                    {job.proposal?.proposal_number && (
                                                        <span className="ml-2 text-sm font-normal text-gray-400">
                                                            (Prop: {job.proposal.proposal_number})
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-sm text-gray-300">Cliente: {job.proposal?.contacts?.name || 'N/A'}</p>
                                                <p className="text-xs text-gray-400">Equipamento: {job.equipment?.name || 'Não definido'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {getStatusBadge(job.status)}
                                            <div className="flex gap-2">
                                                <Button size="icon" variant="ghost" onClick={() => { setSelectedJob(job); setTimeout(handlePrint, 0); }} title="Imprimir OS"><Printer className="w-4 h-4" /></Button>
                                                <Button size="icon" variant="ghost" onClick={() => openJobModal(job)} title="Editar"><Edit className="w-4 h-4" /></Button>
                                                <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-400" title="Excluir" onClick={() => promptDelete(job)} disabled={isDeleting === job.id}>
                                                    {isDeleting === job.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12">
                                    <Briefcase className="w-16 h-16 mx-auto text-gray-500 mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-300">Nenhum Job encontrado</h3>
                                    <p className="text-gray-400">Crie seu primeiro Job ou ajuste os filtros.</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            <Dialog open={isJobModalOpen} onOpenChange={setIsJobModalOpen}>
                <DialogContent className="bg-slate-800 border-white/20 text-white max-w-4xl">
                    <DialogHeader><DialogTitle>{selectedJob ? 'Editar' : 'Criar Novo'} Job (OS)</DialogTitle></DialogHeader>
                    <JobForm 
                        job={selectedJob} 
                        onSave={handleSave} 
                        onClose={closeJobModal} 
                        commercialData={commercialData} 
                        allAssets={allAssets}
                    />
                </DialogContent>
            </Dialog>

            <div style={{ display: 'none' }}>
                <JobPrintLayout ref={printComponentRef} job={selectedJob} />
            </div>
            
            <MasterPasswordDialog
                isOpen={isPasswordDialogOpen}
                onClose={() => setIsPasswordDialogOpen(false)}
                onConfirm={handleDelete}
                isSubmitting={!!isDeleting}
                title="Confirmar Exclusão de Job"
                description={`Tem certeza que deseja excluir o Job #${jobToDelete?.job_code}? Esta ação não pode ser desfeita.`}
            />
        </>
    );
};

export default JobsTab;