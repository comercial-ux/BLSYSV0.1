import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PlusCircle, Edit, Trash2, ListChecks, Target, Briefcase, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import GenericParameterForm from './GenericParameterForm';
import MasterPasswordDialog from '@/components/admin/MasterPasswordDialog';

const ParametersTab = ({ onUpdateNeeded }) => {
    const { user } = useAuth();
    const [chartOfAccounts, setChartOfAccounts] = useState([]);
    const [costCenters, setCostCenters] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState(null);
    const [isDeleting, setIsDeleting] = useState(null);
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [chartOfAccountsRes, costCentersRes, jobsRes] = await Promise.all([
            supabase.from('chart_of_accounts').select('*').order('name'),
            supabase.from('cost_centers').select('*').order('name'),
            supabase.from('jobs').select('*, proposal:proposal_id(*, contacts:contact_id(name))').order('created_at', { ascending: false }),
        ]);

        setChartOfAccounts(chartOfAccountsRes.data || []);
        setCostCenters(costCentersRes.data || []);
        setJobs(jobsRes.data || []);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const openModal = (config) => {
        setModalConfig(config);
        setIsModalOpen(true);
    }
    const closeModal = () => setIsModalOpen(false);

    const handleSave = () => {
        fetchData();
        if (onUpdateNeeded) onUpdateNeeded();
        closeModal();
    }

    const promptDelete = (table, id, name) => {
        setItemToDelete({ table, id, name });
        setIsPasswordDialogOpen(true);
    };
    
    const handleDelete = async () => {
        if (!user || !itemToDelete) return;

        const { table, id, name } = itemToDelete;
        setIsDeleting(id);
        const { error } = await supabase.from(table).delete().eq('id', id);
        setIsDeleting(null);
        setIsPasswordDialogOpen(false);
        setItemToDelete(null);

        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao excluir', description: error.message });
        } else {
            toast({ title: 'Item excluído com sucesso!' });
            fetchData();
            if (onUpdateNeeded) onUpdateNeeded();
        }
    }

    const parameterSections = [
        { title: 'Plano de Contas', icon: ListChecks, data: chartOfAccounts, table: 'chart_of_accounts', fields: [{ name: 'name', label: 'Nome' }, { name: 'type', label: 'Tipo', type: 'select', options: ['Receita', 'Despesa'], defaultValue: 'Despesa' }] },
        { title: 'Centros de Custo', icon: Target, data: costCenters, table: 'cost_centers', fields: [{ name: 'name', label: 'Nome' }] },
    ];
    
    return (
        <>
            <div className="space-y-6">
                {parameterSections.map(section => (
                    <Card key={section.title}>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="flex items-center gap-2"><section.icon className="w-5 h-5" /> {section.title}</CardTitle>
                                <Button onClick={() => openModal({ ...section, item: null })}><PlusCircle className="mr-2 h-4 w-4" /> Novo</Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-48 pr-4">
                                <div className="space-y-2">
                                    {loading ? <p>Carregando...</p> : section.data.map(item => (
                                        <div key={item.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                            <div>
                                                <p className="font-semibold">{item.name}</p>
                                                {item.type && <p className="text-xs text-gray-400">{item.type}</p>}
                                            </div>
                                            <div className="flex gap-1">
                                                <Button size="icon" variant="ghost" onClick={() => openModal({ ...section, item })}><Edit className="w-4 h-4"/></Button>
                                                <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-400" onClick={() => promptDelete(section.table, item.id, item.name)} disabled={isDeleting === item.id}>
                                                    {isDeleting === item.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                ))}

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5" /> Jobs (Ordens de Serviço)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Os Jobs são criados no Módulo Operacional e listados aqui para referência.
                        </p>
                        <ScrollArea className="h-48 pr-4">
                            <div className="space-y-2">
                                {loading ? <p>Carregando...</p> : jobs.map(job => (
                                    <div key={job.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                        <div>
                                            <p className="font-semibold">{job.job_code}</p>
                                            <p className="text-xs text-gray-400">Cliente: {job.proposal?.contacts?.name || 'N/A'}</p>
                                        </div>
                                    </div>
                                ))}
                                { !loading && jobs.length === 0 && <p className="text-center text-gray-400 py-4">Nenhum Job criado.</p>}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{modalConfig?.item ? 'Editar' : 'Adicionar'} {modalConfig?.title}</DialogTitle>
                    </DialogHeader>
                    {modalConfig && <GenericParameterForm {...modalConfig} onSave={handleSave} onClose={closeModal} />}
                    </DialogContent>
                </Dialog>
            </div>
            <MasterPasswordDialog
                isOpen={isPasswordDialogOpen}
                onClose={() => setIsPasswordDialogOpen(false)}
                onConfirm={handleDelete}
                isSubmitting={!!isDeleting}
                title={`Confirmar Exclusão de ${itemToDelete?.table.replace('_', ' ')}`}
                description={`Tem certeza de que deseja excluir o item "${itemToDelete?.name}"? Esta ação não pode ser desfeita.`}
            />
        </>
    );
}

export default ParametersTab;