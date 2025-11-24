import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import FieldOpsLayout from '@/components/field-ops/FieldOpsLayout';
import FieldOpsNav from '@/components/field-ops/FieldOpsNav';
import BdeForm from '@/components/field-ops/BdeForm';
import FuelEntryForm from '@/components/field-ops/FuelEntryForm';
import ChecklistFieldForm from '@/components/field-ops/ChecklistForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import useAppHandlers from '@/hooks/useAppHandlers';

const FieldOpsPage = () => {
    const { formType } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { jobs, contacts, equipments, refetchData } = useData();
    const { handleChecklistSubmit, handleFuelEntrySubmit } = useAppHandlers({ refetchData });

    const handleSuccess = (message) => {
        refetchData();
        toast({
            title: "Sucesso!",
            description: message,
            className: "bg-green-600 text-white border-green-700",
        });
        navigate('/field');
    };

    const handleChecklistSave = async (data) => {
        await handleChecklistSubmit(data);
        handleSuccess("Checklist enviado.");
    };

    const handleFuelSave = async (data) => {
      const success = await handleFuelEntrySubmit(data);
      if (success) {
        handleSuccess("Registro de abastecimento enviado.");
      }
    };

    const renderForm = () => {
        switch (formType) {
            case 'bde':
                return (
                    <BdeForm
                        jobs={jobs}
                        contacts={contacts}
                        equipments={equipments}
                        onSave={() => handleSuccess("BDE enviado.")}
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
                return <FieldOpsNav />;
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
        <FieldOpsLayout title={getTitle()}>
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
        </FieldOpsLayout>
    );
};

export default FieldOpsPage;