
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DialogFooter } from '@/components/ui/dialog';
import { ArrowRight, Loader2 } from 'lucide-react';
import ProposalFormHeader from './form-sections/ProposalFormHeader';
import ProposalFormDescription from './form-sections/ProposalFormDescription';
import ProposalFormItems from './form-sections/ProposalFormItems';
import ProposalFormClauses from './form-sections/ProposalFormClauses';
import ProposalFormFinalization from './form-sections/ProposalFormFinalization';
import { saveProposal, getNextProposalNumber } from './proposalUtils';

const DRAFT_KEY = 'proposal-form-draft';

const getInitialFormData = () => ({
    contact_id: '',
    proposal_number: '',
    proposal_date: new Date().toISOString().slice(0, 10),
    validity_date: '',
    status: 'draft',
    internal_notes: '',
    service_description: '',
    final_notes: '',
    items_list: [],
    contract_parameters: {
        included_clauses: [],
        responsibilities: {},
        show_total_value: true, // Default to true for new proposals
    },
    clauses_content: null,
    total_estimated_value: 0,
    estimated_days: '',
    planned_start_date: '',
    payment_term_days: '',
    contract_period_type: '',
    contract_period_quantity: '',
    franchise_mon_thu_hours: '',
    franchise_fri_hours: '',
    franchise_sat_hours: '',
    franchise_sun_hours: '',
    special_observations: '',
});

const ProposalForm = ({ proposal, onSave, onClose }) => {
    const { user } = useAuth();
    const { commercialData } = useData();
    const [draft, setDraft, removeDraft] = useLocalStorage(DRAFT_KEY, null);
    const [formData, setFormData] = useState(getInitialFormData());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isDraftLoaded = useRef(false);

    useEffect(() => {
        if (proposal) {
            const items = (proposal.items_list || []).map(item => ({
                service_item_id: item.service_item_id,
                period: item.period || '1',
                guarantee_hours_day: item.guarantee_hours_day || '',
                value_hour_day: item.value_hour_day || '',
                min_guarantee_worked_days: item.min_guarantee_worked_days || '',
                mobilization_demobilization: item.mobilization_demobilization || '0.00',
                extra_hour_value: item.extra_hour_value || '',
                global_value: item.global_value || '0.00',
            }));

            setFormData({
                ...getInitialFormData(),
                ...proposal,
                contact_id: proposal.contact_id ? String(proposal.contact_id) : '',
                items_list: items,
                proposal_date: proposal.proposal_date ? new Date(proposal.proposal_date).toISOString().slice(0, 10) : '',
                validity_date: proposal.validity_date ? new Date(proposal.validity_date).toISOString().slice(0, 10) : '',
                planned_start_date: proposal.planned_start_date ? new Date(proposal.planned_start_date).toISOString().slice(0, 10) : '',
                payment_term_days: proposal.payment_term_days || '',
                contract_parameters: {
                    included_clauses: (proposal.contract_parameters?.included_clauses || []).map(id => String(id)),
                    responsibilities: proposal.contract_parameters?.responsibilities || {},
                    // Ensure backward compatibility: undefined becomes true
                    show_total_value: proposal.contract_parameters?.show_total_value ?? true,
                },
                clauses_content: proposal.clauses_content || null,
            });
        } else {
            if (draft && !isDraftLoaded.current) {
                toast({
                    title: "Rascunho Carregado",
                    description: "Um rascunho salvo anteriormente foi carregado.",
                });
                setFormData(draft);
                isDraftLoaded.current = true;
            } else if (!draft) {
                const nextNumber = getNextProposalNumber(commercialData.proposals);
                setFormData({ ...getInitialFormData(), proposal_number: nextNumber });
            }
        }
    }, [proposal, draft, commercialData.proposals]);

    useEffect(() => {
        if (!proposal) {
            setDraft(formData);
        }
    }, [formData, proposal, setDraft]);

    const handleFormChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleCancel = () => {
        if (!proposal) {
            removeDraft();
        }
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        // Calculate total estimated value before saving
        const totalValue = (formData.items_list || []).reduce((acc, item) => {
            return acc + (parseFloat(item.global_value) || 0);
        }, 0);
        
        const formDataToSave = {
            ...formData,
            total_estimated_value: totalValue
        };

        const success = await saveProposal({
            formData: formDataToSave,
            user,
            proposal,
            clauses: commercialData.clauses || []
        });

        setIsSubmitting(false);
        if (success) {
            if (!proposal) {
                removeDraft();
            }
            onSave();
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <ScrollArea className="h-[70vh] pr-6">
                <div className="space-y-6">
                    <ProposalFormHeader formData={formData} onFormChange={handleFormChange} />
                    <ProposalFormDescription formData={formData} onFormChange={handleFormChange} />
                    <ProposalFormItems formData={formData} onFormChange={handleFormChange} />
                    <ProposalFormClauses formData={formData} onFormChange={handleFormChange} />
                    <ProposalFormFinalization formData={formData} onFormChange={handleFormChange} />
                </div>
            </ScrollArea>
            <DialogFooter className="pt-6">
                <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isSubmitting ? (proposal?.id ? 'Salvando...' : 'Criando...') : 'Salvar Proposta'}
                    {!isSubmitting && <ArrowRight className="ml-2 w-4 h-4"/>}
                </Button>
            </DialogFooter>
        </form>
    );
};

export default ProposalForm;
