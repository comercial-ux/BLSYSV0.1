import React, { useMemo } from 'react';
    import { useParams, useNavigate } from 'react-router-dom';
    import { useData } from '@/contexts/DataContext';
    import { toast } from 'react-hot-toast';
    import FieldLayout from '@/components/field/FieldLayout';
    import FieldNav from '@/components/field/FieldNav';
    import BdeForm from '@/components/field/BdeForm';
    import FuelEntryForm from '@/components/field/FuelEntryForm';
    import ChecklistFieldForm from '@/components/field/ChecklistFieldForm';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { ArrowLeft } from 'lucide-react';
    import useAppHandlers from '@/hooks/useAppHandlers';

    const FieldPage = () => {
        const { formType } = useParams();
        const navigate = useNavigate();
        const { operationalData, commercialData, equipments, refetchData } = useData();
        
        const jobs = useMemo(() => {
            if (!operationalData.jobs || !commercialData.proposals || !commercialData.contacts) return [];
            return operationalData.jobs.map(job => {
                const proposal = commercialData.proposals.find(p => p.id === job.proposal_id);
                if (proposal) {
                    const contact = commercialData.contacts.find(c => c.id === proposal.contact_id);
                    return {
                        ...job,
                        proposal: {
                            ...proposal,
                            contacts: contact,
                        }
                    };
                }
                return job;
            });
        }, [operationalData.jobs, commercialData.proposals, commercialData.contacts]);

        const { contacts } = commercialData;
        
        const handleSuccessAndNav = (message) => {
            toast.success(message);
            navigate('/field');
            refetchData();
        };
        
        const { handleChecklistSubmit, handleFuelEntrySubmit } = useAppHandlers({ 
            refetchData,
            onSuccess: (message) => handleSuccessAndNav(message || 'Operação concluída com sucesso!'),
        });

        const handleFuelSave = async (data) => {
            const result = await handleFuelEntrySubmit(data);
            if (result && result.success) {
                handleSuccessAndNav("Abastecimento salvo com sucesso!");
            }
        };

        const handleBdeSave = async () => {
            await refetchData();
            handleSuccessAndNav("BDE salvo com sucesso!");
        };

        const handleChecklistSave = async (data) => {
            await handleChecklistSubmit(data);
            // The onSuccess in useAppHandlers will handle navigation and toast
        };

        const renderForm = () => {
            switch (formType) {
                case 'bde':
                    return (
                        <BdeForm
                            jobs={jobs}
                            contacts={contacts}
                            equipments={equipments}
                            onSave={handleBdeSave}
                            isMobile={true}
                        />
                    );
                case 'fuel':
                    return (
                        <FuelEntryForm
                            equipments={equipments}
                            contacts={contacts}
                            onSave={handleFuelSave}
                            isMobile={true}
                        />
                    );
                case 'checklist':
                    return (
                        <ChecklistFieldForm
                            equipments={equipments}
                            onChecklistSubmitted={handleChecklistSave}
                        />
                    );
                default:
                    return <FieldNav />;
            }
        };

        const getTitle = () => {
            switch (formType) {
                case 'bde':
                    return 'Boletim Diário de Equipamento';
                case 'fuel':
                    return 'Registro de Abastecimento';
                case 'checklist':
                    return 'Checklist de Inspeção';
                default:
                    return 'Menu Principal';
            }
        };

        return (
            <FieldLayout title={getTitle()}>
                <Card className="bg-slate-800/60 border-white/20 text-white backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                            {getTitle()}
                        </CardTitle>
                        {formType && (
                            <Button variant="ghost" size="sm" onClick={() => navigate('/field')}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Voltar
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        {renderForm()}
                    </CardContent>
                </Card>
            </FieldLayout>
        );
    };

    export default FieldPage;