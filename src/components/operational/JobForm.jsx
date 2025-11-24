import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DialogFooter } from '@/components/ui/dialog';
import { Save, Plus, Trash2, Calendar, User, MapPin, Loader2, FileText } from 'lucide-react';

const JobForm = ({ job, onSave, onClose, commercialData, allAssets }) => {
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedProposalNumber, setSelectedProposalNumber] = useState('');
    const [formData, setFormData] = useState({
        proposal_id: '',
        status: 'pending',
        primary_equipment_id: '',
        operator_id: '',
        sinaleiro_id: '',
        helpers: [],
        job_site_details: { address: '', contact: '', phone: '' },
        start_date: '',
        end_date: '',
        notes: '',
    });

    const approvedProposals = useMemo(() => {
        return (commercialData?.proposals || []).filter(p => p.status === 'approved');
    }, [commercialData?.proposals]);

    useEffect(() => {
        if (job) {
            setFormData({
                proposal_id: job.proposal_id || '',
                status: job.status || 'pending',
                primary_equipment_id: job.primary_equipment_id || '',
                operator_id: job.operator_id || '',
                sinaleiro_id: job.sinaleiro_id || '',
                helpers: job.helpers || [],
                job_site_details: job.job_site_details || { address: '', contact: '', phone: '' },
                start_date: job.start_date ? new Date(job.start_date).toISOString().slice(0, 10) : '',
                end_date: job.end_date ? new Date(job.end_date).toISOString().slice(0, 10) : '',
                notes: job.notes || '',
            });
            const existingProposal = approvedProposals.find(p => p.id.toString() === job.proposal_id?.toString());
            if (existingProposal) {
                setSelectedProposalNumber(existingProposal.proposal_number || `ID ${existingProposal.id}`);
            }
        }
    }, [job, approvedProposals]);

    const activeAssets = useMemo(() => {
        if (!allAssets) return [];
        const excludedTypes = ['passeio', 'outros'];
        return allAssets.filter(asset => !excludedTypes.includes(asset.equipment_type?.toLowerCase()));
    }, [allAssets]);

    const operators = useMemo(() => {
        return (commercialData?.contacts || []).filter(c => c.type === 'Colaborador' && c.function === 'Operador' && c.status === 'Ativo');
    }, [commercialData?.contacts]);
    
    const signalers = useMemo(() => {
        return (commercialData?.contacts || []).filter(c => c.type === 'Colaborador' && c.function === 'Sinaleiro' && c.status === 'Ativo');
    }, [commercialData?.contacts]);

    const handleProposalChange = (e) => {
        const proposalId = e.target.value;
        const selectedProposal = approvedProposals.find(p => p.id.toString() === proposalId);
        
        if (selectedProposal) {
            setFormData(prev => ({
                ...prev,
                proposal_id: proposalId,
                job_site_details: {
                    ...prev.job_site_details,
                    address: selectedProposal.contacts?.address_street ? 
                             `${selectedProposal.contacts.address_street}, ${selectedProposal.contacts.address_number}` : '',
                    contact: selectedProposal.contacts?.name || '',
                    phone: selectedProposal.contacts?.phone || '',
                },
                notes: selectedProposal.internal_notes || '',
            }));
            setSelectedProposalNumber(selectedProposal.proposal_number || `ID ${selectedProposal.id}`);
        } else {
             setFormData(prev => ({ ...prev, proposal_id: '', notes: '' }));
             setSelectedProposalNumber('');
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSiteDetailsChange = (e) => {
        setFormData({
            ...formData,
            job_site_details: { ...formData.job_site_details, [e.target.name]: e.target.value }
        });
    };
    
    const handleHelperChange = (index, value) => {
        const newHelpers = [...formData.helpers];
        newHelpers[index] = value;
        setFormData({ ...formData, helpers: newHelpers });
    };
    
    const addHelper = () => {
        setFormData({ ...formData, helpers: [...formData.helpers, ''] });
    };

    const removeHelper = (index) => {
        const newHelpers = formData.helpers.filter((_, i) => i !== index);
        setFormData({ ...formData, helpers: newHelpers });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            toast({ variant: 'destructive', title: 'Erro de Autenticação' });
            return;
        }
        setIsSubmitting(true);

        const dataToSubmit = {
            ...formData,
            user_id: user.id,
            updated_at: new Date().toISOString(),
            proposal_id: formData.proposal_id ? parseInt(formData.proposal_id, 10) : null,
            primary_equipment_id: formData.primary_equipment_id ? parseInt(formData.primary_equipment_id, 10) : null,
            operator_id: formData.operator_id ? parseInt(formData.operator_id, 10) : null,
            sinaleiro_id: formData.sinaleiro_id ? parseInt(formData.sinaleiro_id, 10) : null,
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
        };
        
        let error;
        if (job) {
            const { error: updateError } = await supabase
                .from('jobs')
                .update(dataToSubmit)
                .eq('id', job.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from('jobs')
                .insert([dataToSubmit]);
            error = insertError;
        }

        setIsSubmitting(false);
        if (error) {
            console.error("Error saving job:", error);
            toast({ variant: 'destructive', title: 'Erro ao salvar Job', description: error.message });
        } else {
            toast({ title: `Job ${job ? 'atualizado' : 'criado'} com sucesso!` });
            onSave();
        }
    };
    
    return (
        <form onSubmit={handleSubmit}>
            <ScrollArea className="h-[70vh] pr-6">
                <div className="space-y-6">
                     <div className="p-4 border rounded-lg border-white/10 space-y-4">
                        <h3 className="text-lg font-semibold text-primary flex items-center gap-2"><FileText /> Proposta de Origem</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Proposta Aprovada</Label>
                                <select name="proposal_id" value={formData.proposal_id} onChange={handleProposalChange} className="w-full mt-1 h-10 px-3 py-2 rounded-md bg-white/10 border border-white/20" required>
                                    <option value="">Selecione a proposta</option>
                                    {approvedProposals.map(p => <option key={p.id} value={p.id}>Prop #{p.proposal_number || p.id} - {p.contacts?.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <Label>Nº da Proposta</Label>
                                <Input value={selectedProposalNumber} readOnly disabled className="bg-slate-700 mt-1" />
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border rounded-lg border-white/10 space-y-4">
                        <h3 className="text-lg font-semibold text-primary flex items-center gap-2"><MapPin /> Local da Obra</h3>
                        <div>
                            <Label>Endereço</Label>
                            <Input name="address" value={formData.job_site_details.address} onChange={handleSiteDetailsChange} className="bg-white/10 mt-1" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Contato no Local</Label><Input name="contact" value={formData.job_site_details.contact} onChange={handleSiteDetailsChange} className="bg-white/10 mt-1" /></div>
                            <div><Label>Telefone do Contato</Label><Input name="phone" value={formData.job_site_details.phone} onChange={handleSiteDetailsChange} className="bg-white/10 mt-1" /></div>
                        </div>
                    </div>
                    
                    <div className="p-4 border rounded-lg border-white/10 space-y-4">
                        <h3 className="text-lg font-semibold text-primary flex items-center gap-2"><User /> Equipe e Equipamento</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Equipamento Principal</Label>
                                <select name="primary_equipment_id" value={formData.primary_equipment_id} onChange={handleChange} className="w-full mt-1 h-10 px-3 py-2 rounded-md bg-white/10 border-white/20">
                                    <option value="">Nenhum</option>
                                    {activeAssets.map(e => <option key={e.id} value={e.id}>{e.name} - {e.plate}</option>)}
                                </select>
                            </div>
                             <div>
                                <Label>Operador Principal</Label>
                                <select name="operator_id" value={formData.operator_id} onChange={handleChange} className="w-full mt-1 h-10 px-3 py-2 rounded-md bg-white/10 border-white/20">
                                    <option value="">Selecione um operador</option>
                                    {operators.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <Label>Sinaleiro</Label>
                            <select name="sinaleiro_id" value={formData.sinaleiro_id} onChange={handleChange} className="w-full mt-1 h-10 px-3 py-2 rounded-md bg-white/10 border-white/20">
                                <option value="">Selecione um sinaleiro</option>
                                {signalers.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <Label>Ajudantes (Outros)</Label>
                            {formData.helpers.map((helper, index) => (
                                <div key={index} className="flex items-center gap-2 mt-1">
                                    <Input value={helper} onChange={e => handleHelperChange(index, e.target.value)} placeholder={`Nome do Ajudante ${index + 1}`} className="bg-white/10" />
                                    <Button type="button" size="icon" variant="destructive" onClick={() => removeHelper(index)}><Trash2 className="w-4 h-4" /></Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={addHelper} className="mt-2"><Plus className="mr-2 w-4 h-4"/>Adicionar Ajudante</Button>
                        </div>
                    </div>

                    <div className="p-4 border rounded-lg border-white/10 space-y-4">
                         <h3 className="text-lg font-semibold text-primary flex items-center gap-2"><Calendar /> Agendamento e Status</h3>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div><Label>Data de Início</Label><Input type="date" name="start_date" value={formData.start_date} onChange={handleChange} className="bg-white/10 mt-1" /></div>
                            <div><Label>Data de Término</Label><Input type="date" name="end_date" value={formData.end_date} onChange={handleChange} className="bg-white/10 mt-1" /></div>
                             <div>
                                <Label>Status</Label>
                                <select name="status" value={formData.status} onChange={handleChange} className="w-full mt-1 h-10 px-3 py-2 rounded-md bg-white/10 border-white/20">
                                    <option value="pending">Pendente</option>
                                    <option value="in_progress">Em Andamento</option>
                                    <option value="completed">Concluído</option>
                                    <option value="cancelled">Cancelado</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <Label>Dados para contato a chegada / observacoes internas (nao aparece na proposta)</Label>
                            <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3" className="w-full mt-1 p-2 rounded-md bg-white/10 border-white/20" />
                        </div>
                    </div>
                </div>
            </ScrollArea>
             <DialogFooter className="pt-6">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 w-4 h-4"/>Salvar Job
                </Button>
            </DialogFooter>
        </form>
    );
};

export default JobForm;