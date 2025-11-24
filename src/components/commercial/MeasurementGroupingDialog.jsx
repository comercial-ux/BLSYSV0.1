
import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useData } from '@/contexts/DataContext';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const MeasurementGroupingDialog = ({ isOpen, onClose, onSuccess }) => {
    const { commercialData } = useData();
    const { user } = useAuth();
    const [selectedProposalId, setSelectedProposalId] = useState('');
    const [groupName, setGroupName] = useState('');
    const [selectedMeasurements, setSelectedMeasurements] = useState([]);
    const [loading, setLoading] = useState(false);

    const availableMeasurements = useMemo(() => {
        // Get open measurements
        const open = commercialData.measurements?.filter(m => m.status === 'open') || [];
        
        // Filter by proposal if selected
        if (selectedProposalId) {
            return open.filter(m => m.proposal_id.toString() === selectedProposalId);
        }
        return [];
    }, [commercialData.measurements, selectedProposalId]);

    // Get unique proposals that have open measurements
    const proposalsWithOpenMeasurements = useMemo(() => {
        const open = commercialData.measurements?.filter(m => m.status === 'open') || [];
        const proposals = new Map();
        
        open.forEach(m => {
            if (m.proposal && !proposals.has(m.proposal_id)) {
                proposals.set(m.proposal_id, {
                    id: m.proposal_id,
                    name: m.proposal.contacts?.name || `Proposta #${m.proposal_id}`,
                    contract: m.proposal.proposal_number
                });
            }
        });
        
        return Array.from(proposals.values());
    }, [commercialData.measurements]);

    const handleToggleMeasurement = (id) => {
        setSelectedMeasurements(prev => 
            prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
        );
    };

    const handleCreateGroup = async () => {
        if (selectedMeasurements.length < 2) {
            toast({ variant: "destructive", title: "Seleção Inválida", description: "Selecione pelo menos 2 medições para agrupar." });
            return;
        }

        if (!groupName) {
             toast({ variant: "destructive", title: "Nome Obrigatório", description: "Dê um nome para este agrupamento." });
            return;
        }

        setLoading(true);
        try {
            const totalValue = availableMeasurements
                .filter(m => selectedMeasurements.includes(m.id))
                .reduce((sum, m) => sum + (parseFloat(m.total_value) || 0), 0);

            // 1. Create Group
            const { data: group, error: groupError } = await supabase
                .from('measurement_groups')
                .insert({
                    user_id: user.id,
                    proposal_id: selectedProposalId,
                    name: groupName,
                    total_value: totalValue,
                    status: 'open',
                    notes: `Agrupamento de ${selectedMeasurements.length} medições.`
                })
                .select()
                .single();

            if (groupError) throw groupError;

            // 2. Link Measurements to Group
            const items = selectedMeasurements.map(mId => ({
                group_id: group.id,
                measurement_id: mId
            }));

            const { error: itemsError } = await supabase
                .from('measurement_group_items')
                .insert(items);

            if (itemsError) throw itemsError;

            toast({ title: "Sucesso", description: "Agrupamento criado com sucesso!" });
            onSuccess();
            onClose();
            // Reset form
            setSelectedProposalId('');
            setGroupName('');
            setSelectedMeasurements([]);

        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Erro ao criar grupo", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Novo Agrupamento</DialogTitle>
                    <DialogDescription>
                        Selecione medições de um mesmo cliente para criar um pacote consolidado.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Cliente / Contrato</Label>
                        <Select value={selectedProposalId} onValueChange={(val) => { setSelectedProposalId(val); setSelectedMeasurements([]); }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o cliente..." />
                            </SelectTrigger>
                            <SelectContent>
                                {proposalsWithOpenMeasurements.map(p => (
                                    <SelectItem key={p.id} value={p.id.toString()}>
                                        {p.name} {p.contract ? `(${p.contract})` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Nome do Agrupamento</Label>
                        <Input 
                            placeholder="Ex: Faturamento Outubro - Obras Civis" 
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Selecione as Medições ({selectedMeasurements.length})</Label>
                        <ScrollArea className="h-[200px] border rounded-md p-2">
                            {availableMeasurements.length > 0 ? (
                                availableMeasurements.map(m => (
                                    <div key={m.id} className="flex items-start space-x-3 p-2 hover:bg-muted rounded transition-colors">
                                        <Checkbox 
                                            id={`meas-${m.id}`} 
                                            checked={selectedMeasurements.includes(m.id)}
                                            onCheckedChange={() => handleToggleMeasurement(m.id)}
                                        />
                                        <div className="grid gap-1.5 leading-none">
                                            <label
                                                htmlFor={`meas-${m.id}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                            >
                                                Medição #{m.id} - {new Date(m.start_date).toLocaleDateString()} a {new Date(m.end_date).toLocaleDateString()}
                                            </label>
                                            <p className="text-xs text-muted-foreground">
                                                Job: {m.job?.job_code} | Valor: R$ {parseFloat(m.total_value).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    {selectedProposalId ? "Nenhuma medição disponível para este cliente." : "Selecione um cliente acima."}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleCreateGroup} disabled={loading || selectedMeasurements.length < 2}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Criar Agrupamento
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default MeasurementGroupingDialog;
