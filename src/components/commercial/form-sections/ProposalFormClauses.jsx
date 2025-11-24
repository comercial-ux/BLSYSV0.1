

import React from 'react';
import ContractParametersForm from '../ContractParametersForm';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/utils';

const responsibilityOptions = [
    { id: 'combustivel', label: 'Combustível por conta do CONTRATANTE' },
    { id: 'hospedagem', label: 'Hospedagem por conta do CONTRATANTE' },
    { id: 'logistica', label: 'Apoio logístico (transporte) por conta do CONTRATANTE' },
    { id: 'alimentacao', label: 'Alimentação na obra por conta do CONTRATANTE' },
];

const ProposalFormClauses = ({ formData, onFormChange }) => {
    const currentResponsibilities = formData.contract_parameters?.responsibilities || {};
    // Default to true if undefined for backward compatibility
    const showTotalValue = formData.contract_parameters?.show_total_value ?? true;

    const handleResponsibilityChange = (id) => {
        const newResponsibilities = {
            ...currentResponsibilities,
            [id]: !currentResponsibilities[id]
        };
        onFormChange('contract_parameters', { ...formData.contract_parameters, responsibilities: newResponsibilities });
    };
    
    const handleContractParamsChange = (newClauseParams) => {
        // Merge new clause params while preserving existing settings like responsibilities and show_total_value
        onFormChange('contract_parameters', { 
            ...formData.contract_parameters, 
            ...newClauseParams 
        });
    };

    const handleShowTotalChange = (checked) => {
        // Force boolean
        const isChecked = checked === true;
        
        onFormChange('contract_parameters', { 
            ...formData.contract_parameters, 
            show_total_value: isChecked 
        });
    };

    const calculateTotal = () => {
        return (formData.items_list || []).reduce((acc, item) => {
            return acc + (parseFloat(item.global_value) || 0);
        }, 0);
    };

    return (
        <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-muted/30 mb-4">
                <div className="flex items-center space-x-2">
                    <Checkbox 
                        id="showTotalValue" 
                        checked={showTotalValue}
                        onCheckedChange={handleShowTotalChange}
                    />
                    <Label htmlFor="showTotalValue" className="cursor-pointer font-medium">
                        Somar itens/serviço para total da proposta
                    </Label>
                </div>
                
                {/* Only show the helper text if checked, to give visual feedback */}
                {showTotalValue && (
                    <div className="mt-3 pl-6">
                        <p className="text-sm text-muted-foreground">
                            Total Estimado: <span className="font-bold text-lg text-primary">{formatCurrency(calculateTotal())}</span>
                        </p>
                    </div>
                )}
                {!showTotalValue && (
                     <div className="mt-3 pl-6">
                        <p className="text-sm text-orange-500 italic">
                            O valor total e subtotal ficarão ocultos na proposta gerada.
                        </p>
                    </div>
                )}
            </div>

            <div className="p-4 border rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-primary">Responsabilidades do Contratante</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {responsibilityOptions.map(option => (
                        <div key={option.id} className="flex items-center space-x-2">
                            <Checkbox
                                id={option.id}
                                checked={!!currentResponsibilities[option.id]}
                                onCheckedChange={() => handleResponsibilityChange(option.id)}
                            />
                            <Label htmlFor={option.id} className="cursor-pointer">{option.label}</Label>
                        </div>
                    ))}
                </div>
            </div>

            <ContractParametersForm 
                initialParams={formData.contract_parameters} 
                onChange={handleContractParamsChange} 
            />
        </div>
    );
};

export default ProposalFormClauses;
