
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Trash2, Printer, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MeasurementGroupView from './MeasurementGroupView';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from '@/contexts/SupabaseAuthContext';

const MeasurementGroupList = ({ onUpdateNeeded }) => {
    const { user } = useAuth();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    
    // Approval Dialog State
    const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
    const [groupToApprove, setGroupToApprove] = useState(null);
    const [approvalDueDate, setApprovalDueDate] = useState('');
    const [approving, setApproving] = useState(false);

    const fetchGroups = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('measurement_groups')
            .select('*, proposal:proposals(*, contacts(*)), items:measurement_group_items(measurement:measurements(*))')
            .eq('status', 'open') 
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error("Error fetching groups:", error);
            toast({ variant: "destructive", title: "Erro ao carregar grupos", description: error.message });
        } else {
            setGroups(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    const handleDeleteGroup = async (groupId) => {
        await supabase.from('measurement_group_items').delete().eq('group_id', groupId);
        const { error } = await supabase.from('measurement_groups').delete().eq('id', groupId);

        if (error) {
            toast({ variant: "destructive", title: "Erro", description: error.message });
        } else {
            toast({ title: "Sucesso", description: "Agrupamento desfeito." });
            fetchGroups();
            onUpdateNeeded();
        }
    };

    const openApproveDialog = (group) => {
        // Set default due date based on proposal validity or today + 15 days? 
        // Default to today for now or empty.
        const defaultDate = group.proposal?.validity_date || new Date().toISOString().split('T')[0];
        setApprovalDueDate(defaultDate);
        setGroupToApprove(group);
        setIsApproveDialogOpen(true);
    }

    const handleConfirmApprove = async () => {
        if (!groupToApprove) return;
        if (!approvalDueDate) {
            toast({ variant: "destructive", title: "Data Obrigatória", description: "Informe a data de vencimento para o faturamento." });
            return;
        }

        setApproving(true);
        try {
            // 1. Approve all individual measurements
            const measurementIds = groupToApprove.items.map(i => i.measurement.id);
            const { error: measError } = await supabase
                .from('measurements')
                .update({ status: 'approved' })
                .in('id', measurementIds);
            
            if (measError) throw measError;

            // 2. Approve group
            const { error: groupError } = await supabase
                .from('measurement_groups')
                .update({ status: 'approved' })
                .eq('id', groupToApprove.id);
            
            if (groupError) throw groupError;

            // 3. Create Billing Detail for the Group
            const { error: billingError } = await supabase
                .from('billing_details')
                .insert({
                    user_id: user.id,
                    group_id: groupToApprove.id,
                    due_date: approvalDueDate,
                    is_active: true,
                    notes: `Agrupamento: ${groupToApprove.name}`,
                    // Inherit company name logic or let BillingTab handle display via joins
                });

            if (billingError) throw billingError;

            toast({ title: "Sucesso", description: "Agrupamento enviado para faturamento." });
            setIsApproveDialogOpen(false);
            fetchGroups();
            onUpdateNeeded();

        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Erro na aprovação", description: error.message });
        } finally {
            setApproving(false);
        }
    };

    const handleView = (group) => {
        setSelectedGroup(group);
        setIsViewModalOpen(true);
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <>
            <ScrollArea className="h-[60vh]">
                <div className="space-y-3 pr-4">
                    {groups.length > 0 ? (
                        groups.map(group => (
                            <div key={group.id} className="p-4 bg-background border rounded-lg hover:bg-muted/50 transition-colors flex justify-between items-center">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-foreground">{group.name}</h3>
                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Em Aberto</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {group.proposal?.contacts?.name} - {group.items?.length} medições
                                    </p>
                                    <p className="text-xs text-muted-foreground">Criado em: {new Date(group.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-xs text-muted-foreground">Valor Total</p>
                                        <p className="font-bold text-lg">R$ {parseFloat(group.total_value).toFixed(2)}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" className="bg-green-500 hover:bg-green-600 text-white" onClick={() => openApproveDialog(group)}>
                                            <CheckCircle className="w-4 h-4 mr-2" /> Faturar
                                        </Button>
                                        
                                        <Button size="icon" variant="ghost" onClick={() => handleView(group)}>
                                            <Printer className="w-4 h-4" />
                                        </Button>
                                        
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-600">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Desfazer Agrupamento?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        O grupo será excluído e as medições voltarão a ficar disponíveis individualmente. Nenhuma medição será excluída.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteGroup(group.id)} className="bg-red-600 hover:bg-red-700">Desfazer</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>Nenhum agrupamento ativo.</p>
                            <p className="text-sm">Use o botão "Agrupar" para criar um novo pacote.</p>
                        </div>
                    )}
                </div>
            </ScrollArea>

            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                <DialogContent className="max-w-5xl">
                    <DialogHeader>
                        <DialogTitle>Visualizar Agrupamento</DialogTitle>
                    </DialogHeader>
                    {selectedGroup && <MeasurementGroupView group={selectedGroup} onClose={() => setIsViewModalOpen(false)} />}
                </DialogContent>
            </Dialog>

            <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar Faturamento</DialogTitle>
                        <DialogDescription>
                            Defina a data de vencimento para o agrupamento <strong>{groupToApprove?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="due-date">Data de Vencimento</Label>
                            <Input 
                                id="due-date" 
                                type="date" 
                                value={approvalDueDate} 
                                onChange={(e) => setApprovalDueDate(e.target.value)} 
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)} disabled={approving}>Cancelar</Button>
                        <Button onClick={handleConfirmApprove} disabled={approving} className="bg-green-600 hover:bg-green-700">
                            {approving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirmar Faturamento
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default MeasurementGroupList;
