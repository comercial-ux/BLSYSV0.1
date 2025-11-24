import React, { useState, useEffect, useCallback } from 'react';
    import { toast } from '@/components/ui/use-toast';
    import { Button } from '@/components/ui/button';
    import { ScrollArea } from '@/components/ui/scroll-area';
    import { DialogFooter } from '@/components/ui/dialog';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import { format, subDays, parseISO } from 'date-fns';
    import { useData } from '@/contexts/DataContext';
    import MeasurementHeader from './measurement/MeasurementHeader';
    import ProposalDetails from './measurement/ProposalDetails';
    import MeasurementDetailsTable from './measurement/MeasurementDetailsTable';
    import { processBDEs, recalculateTotals, applyGuaranteeToDetails } from './measurement/measurementUtils';
    import MeasurementSummary from './measurement/MeasurementSummary';

    const MeasurementForm = ({ measurement, onSave, onClose, operationalData }) => {
        const { user } = useAuth();

        const getInitialFormData = () => {
            const today = new Date();
            const thirtyDaysAgo = subDays(today, 30);
            
            if (measurement) {
                 return {
                    ...measurement,
                    start_date: measurement.start_date ? format(parseISO(measurement.start_date), 'yyyy-MM-dd') : '',
                    end_date: measurement.end_date ? format(parseISO(measurement.end_date), 'yyyy-MM-dd') : '',
                };
            }
            
            return {
                id: null,
                proposal_id: null,
                job_id: null,
                start_date: format(thirtyDaysAgo, 'yyyy-MM-dd'),
                end_date: format(today, 'yyyy-MM-dd'),
                status: 'open',
                billing_status: 'pending',
                measurement_details: { details: [], totals: {}, proposal_snapshot: {} },
            };
        };

        const [formData, setFormData] = useState(getInitialFormData);
        const [jobs, setJobs] = useState([]);
        const [isProcessing, setIsProcessing] = useState(false);
        const [proposalData, setProposalData] = useState(null);
        
        const initialProposalDetailsState = {
            mobilization: 0,
            demobilization: 0,
            min_hours_guarantee: 0,
            hour_value: 0,
            extra_hour_value: 0,
            periods_quantity: 1,
            considered_hours: '',
            discount: 0,
            ignore_lunch_break: true,
        };
        
        const [editableProposalDetails, setEditableProposalDetails] = useState(initialProposalDetailsState);

        const fetchAndSetProposalData = useCallback((proposal) => {
            if (!proposal) {
                toast({
                    variant: 'destructive',
                    title: "Nenhuma proposta encontrada",
                    description: "O Job selecionado não tem uma proposta comercial vinculada.",
                });
                return;
            }

            const itemsList = proposal.service_items_list || proposal.items_list || [];
            const mainItem = itemsList[0] || {};

            let franchiseHours = 0;
            if (proposal.franchise_mon_thu_hours) {
                franchiseHours = parseFloat(proposal.franchise_mon_thu_hours) || 0;
            } else if (mainItem.guarantee_hours_day) {
                franchiseHours = parseFloat(mainItem.guarantee_hours_day) || 0;
            }

            const mobilizationCost = mainItem.mobilization_cost || mainItem.mobilization_demobilization || 0;
            const demobilizationCost = mainItem.demobilization_cost || 0;
            const hourValue = mainItem.selling_price_per_hour || mainItem.value_hour_day || 0;
            const extraHourValue = mainItem.extra_hour_value || 0;

            setEditableProposalDetails(prev => ({
                ...prev,
                mobilization: mobilizationCost,
                demobilization: demobilizationCost,
                min_hours_guarantee: franchiseHours,
                hour_value: hourValue,
                extra_hour_value: extraHourValue,
                periods_quantity: proposal.contract_period_quantity || 1,
            }));
            
            toast({
                title: "Dados Carregados!",
                description: "Os valores da proposta foram preenchidos.",
            });
        }, []);

        useEffect(() => {
            if (measurement?.measurement_details?.proposal_snapshot) {
                setEditableProposalDetails({
                    ...initialProposalDetailsState,
                    ...measurement.measurement_details.proposal_snapshot,
                    ignore_lunch_break: measurement.measurement_details.proposal_snapshot.ignore_lunch_break !== false, // Default to true if undefined
                });
            } else {
                setEditableProposalDetails(initialProposalDetailsState);
            }
        }, [measurement]);

        useEffect(() => {
            const allJobs = operationalData?.jobs || [];
            const approvedMeasurementJobIds = new Set(
                (operationalData?.measurements || [])
                    .filter(m => m.status === 'approved')
                    .map(m => m.job_id)
            );

            const availableJobs = allJobs.filter(job => !approvedMeasurementJobIds.has(job.id));
            
            setJobs(availableJobs);

            if (measurement) {
                const selectedJob = allJobs.find(j => j.id.toString() === measurement.job_id.toString());
                if (selectedJob) {
                    setProposalData(selectedJob.proposal);
                }
            }
        }, [measurement, operationalData]);
        
        const handleFetchProposalData = () => {
            if (!proposalData) {
                toast({
                    variant: 'destructive',
                    title: "Nenhuma proposta encontrada",
                    description: "Selecione um Job que tenha uma proposta comercial vinculada.",
                });
                return;
            }
            fetchAndSetProposalData(proposalData);
        };

        const handleApplyGuarantee = () => {
            const currentDetails = formData.measurement_details?.details || [];
            if (currentDetails.length === 0) {
                toast({
                    variant: 'destructive',
                    title: "Nenhum BDE processado",
                    description: "Processe os BDEs antes de aplicar a franquia.",
                });
                return;
            }

            const updatedDetails = applyGuaranteeToDetails(currentDetails, editableProposalDetails);
            const totals = recalculateTotals(updatedDetails, editableProposalDetails);

            setFormData(prev => ({
                ...prev,
                measurement_details: { ...prev.measurement_details, details: updatedDetails, totals },
            }));

            toast({
                title: "Franquia Aplicada",
                description: "As horas excedentes foram recalculadas com base na franquia.",
            });
        };

        const handleProcessBDEsClick = async () => {
            setIsProcessing(true);
            try {
                const processedData = await processBDEs(formData.job_id, formData.start_date, formData.end_date, editableProposalDetails);
                const totals = recalculateTotals(processedData, editableProposalDetails);
                setFormData(prev => ({
                    ...prev,
                    measurement_details: { ...prev.measurement_details, details: processedData, totals }
                }));
                toast({ title: 'BDEs Processados', description: `${processedData.length} BDEs foram encontrados e carregados.` });
            } catch (error) {
                console.error("Error processing BDEs:", error);
                toast({ variant: 'destructive', title: 'Erro ao processar BDEs', description: error.message });
            } finally {
                setIsProcessing(false);
            }
        };

        const updateTotals = useCallback(() => {
            const details = formData.measurement_details?.details || [];
            const totals = recalculateTotals(details, editableProposalDetails);
            setFormData(prev => ({
                ...prev,
                measurement_details: { ...prev.measurement_details, totals },
                total_value: totals.total_value,
            }));
        }, [formData.measurement_details?.details, editableProposalDetails]);

        useEffect(() => {
            updateTotals();
        }, [updateTotals]);

        const handleDetailChange = (bdeId, field, value) => {
            const updatedDetails = formData.measurement_details.details.map(detail => {
                if (detail.bde_id === bdeId) {
                    const newDetail = { ...detail, [field]: parseFloat(value) || 0 };
                    
                    if (field === 'total_hours' || field === 'guarantee_hours') {
                        newDetail.overtime_hours = Math.max(0, newDetail.total_hours - newDetail.guarantee_hours);
                    }
                    if (field === 'total_hours') {
                        newDetail.balance_hours = newDetail.total_hours;
                    }

                    return newDetail;
                }
                return detail;
            });

            setFormData(prev => ({
                ...prev,
                measurement_details: {
                    ...prev.measurement_details,
                    details: updatedDetails,
                },
            }));
        };

        const handleDeleteBde = (bdeId) => {
            const updatedDetails = formData.measurement_details.details.filter(detail => detail.bde_id !== bdeId);
            setFormData(prev => ({
                ...prev,
                measurement_details: {
                    ...prev.measurement_details,
                    details: updatedDetails,
                },
            }));
            toast({ title: 'BDE Removido', description: 'O BDE foi removido desta medição.' });
        };

        const handleSubmit = async (e) => {
            e.preventDefault();
            
            if (!formData.job_id || !formData.proposal_id) {
                toast({
                    variant: "destructive",
                    title: "Erro de Validação",
                    description: "É necessário selecionar um Job para salvar a medição.",
                });
                return;
            }
            
            const currentTotals = recalculateTotals(formData.measurement_details.details, editableProposalDetails);

            const payload = {
                proposal_id: formData.proposal_id,
                job_id: formData.job_id,
                start_date: formData.start_date,
                end_date: formData.end_date,
                status: formData.status,
                billing_status: formData.billing_status || 'pending',
                measurement_details: {
                    details: formData.measurement_details.details,
                    totals: currentTotals,
                    proposal_snapshot: editableProposalDetails
                },
                user_id: user.id,
                total_value: currentTotals.total_value,
            };

            try {
                if (formData.id) {
                    const { error } = await supabase.from('measurements').update(payload).eq('id', formData.id);
                    if (error) throw error;
                    toast({ title: 'Sucesso!', description: 'Medição atualizada com sucesso.' });
                } else {
                    const { data, error } = await supabase.from('measurements').insert([payload]).select();
                    if (error) throw error;
                    toast({ title: 'Sucesso!', description: 'Nova medição criada com sucesso.' });
                }
                onSave();
            } catch (error) {
                console.error("Error saving measurement:", error);
                toast({ variant: 'destructive', title: 'Erro ao salvar medição', description: error.message });
            }
        };

        const handleJobChange = (jobId) => {
            const selectedJob = jobs.find(j => j.id.toString() === jobId);
            if (!selectedJob) {
                setFormData(f => ({ ...f, job_id: jobId, proposal_id: null, measurement_details: { details: [], totals: {}, proposal_snapshot: {} } }));
                setProposalData(null);
                setEditableProposalDetails(initialProposalDetailsState);
                return;
            }
            
            const proposal = selectedJob.proposal;
            setFormData(f => ({ ...f, job_id: jobId, proposal_id: proposal.id, measurement_details: { details: [], totals: {}, proposal_snapshot: {} } }));
            setProposalData(proposal);
            fetchAndSetProposalData(proposal);
        };
        
        return (
            <form onSubmit={handleSubmit}>
                <ScrollArea className="h-[75vh] pr-6">
                    <div className="space-y-4">
                        <MeasurementHeader
                            formData={formData}
                            setFormData={setFormData}
                            jobs={jobs}
                            handleJobChange={handleJobChange}
                            handleProcessBDEs={handleProcessBDEsClick}
                            isProcessing={isProcessing}
                        />
                        {proposalData && (
                            <ProposalDetails
                                details={editableProposalDetails}
                                onDetailChange={setEditableProposalDetails}
                                onApplyGuarantee={handleApplyGuarantee}
                                onFetchProposalData={handleFetchProposalData}
                            />
                        )}
                        <MeasurementDetailsTable
                            details={formData.measurement_details?.details || []}
                            totals={formData.measurement_details?.totals || {}}
                            onDetailChange={handleDetailChange}
                            onDeleteBde={handleDeleteBde}
                        />
                         <MeasurementSummary 
                            totals={formData.measurement_details?.totals || {}}
                            proposalDetails={editableProposalDetails}
                        />
                    </div>
                </ScrollArea>
                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Salvar Medição</Button>
                </DialogFooter>
            </form>
        );
    };

    export default MeasurementForm;