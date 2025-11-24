import React from 'react';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { Textarea } from '@/components/ui/textarea';

const statusOptions = [
    { value: 'draft', label: 'Rascunho' },
    { value: 'sent', label: 'Enviada' },
    { value: 'approved', label: 'Aprovada' },
    { value: 'rejected', label: 'Rejeitada' },
    { value: 'finished', label: 'Finalizado' },
];

const ProposalFormFinalization = ({ formData, onFormChange }) => {
    const handleChange = (e) => {
        onFormChange(e.target.name, e.target.value);
    };

    const handleSelectChange = (name, value) => {
        onFormChange(name, value);
    };

    return (
        <div className="p-4 border rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-primary">Finalização</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label>Status</Label>
                    <Combobox
                        options={statusOptions}
                        value={formData.status}
                        onChange={(v) => handleSelectChange('status', v)}
                        placeholder="Selecione um status"
                    />
                </div>
                <div className="col-span-2">
                    <Label>Observações Finais (Aparece na proposta)</Label>
                    <Textarea name="final_notes" value={formData.final_notes || ''} onChange={handleChange} rows="3" className="w-full mt-1"></Textarea>
                </div>
                <div className="col-span-2">
                    <Label>Dados para contato a chegada / observacoes internas (nao aparece na proposta)</Label>
                    <Textarea name="internal_notes" value={formData.internal_notes || ''} onChange={handleChange} rows="3" className="w-full mt-1"></Textarea>
                </div>
            </div>
        </div>
    );
};

export default ProposalFormFinalization;