import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const ProposalFormDescription = ({ formData, onFormChange }) => {
    const handleChange = (e) => {
        onFormChange(e.target.name, e.target.value);
    };

    return (
        <div className="p-4 border rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-primary">1. Descrição do Serviço / Local de Operação</h3>
            <Textarea 
                name="service_description"
                value={formData.service_description || ''}
                onChange={handleChange}
                rows={5}
                className="w-full mt-1 p-2 rounded-md"
                placeholder="Detalhe o serviço a ser executado, incluindo o local, equipamentos principais, etc."
            />
        </div>
    );
};

export default ProposalFormDescription;