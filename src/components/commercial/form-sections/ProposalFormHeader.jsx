import React, { useMemo } from 'react';
    import { useData } from '@/contexts/DataContext';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Combobox } from '@/components/ui/combobox';
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
        SelectValue,
    } from "@/components/ui/select";
    import { Textarea } from '@/components/ui/textarea';


    const periodTypeOptions = [
        { value: 'daily', label: 'Por Dia' },
        { value: 'weekly', label: 'Por Semana' },
        { value: 'monthly', label: 'Por Mês' },
        { value: 'custom', label: 'Personalizado' },
    ];

    const ProposalFormHeader = ({ formData, onFormChange }) => {
        const { commercialData } = useData();
        
        const clientOptions = useMemo(() => {
            return (commercialData?.contacts || [])
                .filter(c => c.type === 'Cliente')
                .map(c => ({ value: String(c.id), label: c.name }));
        }, [commercialData.contacts]);

        const handleChange = (e) => {
            onFormChange(e.target.name, e.target.value);
        };

        const handleSelectChange = (name, value) => {
            onFormChange(name, value);
        };

        return (
            <div className="p-4 border rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-primary">Informações da Proposta</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <Label>Cliente</Label>
                        <Combobox
                            options={clientOptions}
                            value={formData.contact_id || ''}
                            onChange={(v) => handleSelectChange('contact_id', v)}
                            placeholder="Selecione um cliente"
                            searchPlaceholder="Pesquisar cliente..."
                            emptyText="Nenhum cliente encontrado."
                        />
                    </div>
                    <div>
                        <Label>Nº da Proposta</Label>
                        <Input type="text" name="proposal_number" value={formData.proposal_number || ''} onChange={handleChange} placeholder="Ex: 001/2024" className="mt-1" />
                    </div>
                    <div>
                        <Label>Data da Proposta</Label>
                        <Input type="date" name="proposal_date" value={formData.proposal_date} onChange={handleChange} className="mt-1" required />
                    </div>
                    <div>
                        <Label>Validade da Proposta</Label>
                        <Input type="date" name="validity_date" value={formData.validity_date || ''} onChange={handleChange} className="mt-1" />
                    </div>
                    <div>
                        <Label>Data Prevista de Início</Label>
                        <Input type="date" name="planned_start_date" value={formData.planned_start_date || ''} onChange={handleChange} className="mt-1" />
                    </div>
                     <div>
                        <Label>Prazo de Pagamento (dias)</Label>
                        <Input type="number" name="payment_term_days" value={formData.payment_term_days || ''} onChange={handleChange} placeholder="Ex: 28" className="mt-1" />
                    </div>
                </div>
                 <div className="mt-4 p-4 border rounded-lg bg-muted/20">
                     <h4 className="text-md font-semibold mb-3">Período do Contrato</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label>Tipo de Período</Label>
                             <Select onValueChange={(v) => handleSelectChange('contract_period_type', v)} value={formData.contract_period_type || ''}>
                                <SelectTrigger className="w-full mt-1">
                                    <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {periodTypeOptions.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Quantidade de Períodos</Label>
                            <Input
                                type="number"
                                name="contract_period_quantity"
                                value={formData.contract_period_quantity || ''}
                                onChange={handleChange}
                                placeholder="Ex: 2"
                                className="mt-1"
                            />
                        </div>
                     </div>
                </div>
                 <div className="mt-4 p-4 border rounded-lg bg-muted/20">
                    <h4 className="text-md font-semibold mb-3">Configuração de Franquias (Horas)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <Label>Segunda a Quinta</Label>
                            <Input name="franchise_mon_thu_hours" value={formData.franchise_mon_thu_hours || ''} onChange={handleChange} placeholder="Ex: 8" className="mt-1" />
                        </div>
                        <div>
                            <Label>Sexta-feira</Label>
                            <Input name="franchise_fri_hours" value={formData.franchise_fri_hours || ''} onChange={handleChange} placeholder="Ex: 8" className="mt-1" />
                        </div>
                        <div>
                            <Label>Sábado</Label>
                            <Input name="franchise_sat_hours" value={formData.franchise_sat_hours || ''} onChange={handleChange} placeholder="Ex: 4" className="mt-1" />
                        </div>
                        <div>
                            <Label>Domingo</Label>
                            <Input name="franchise_sun_hours" value={formData.franchise_sun_hours || ''} onChange={handleChange} placeholder="Ex: 0" className="mt-1" />
                        </div>
                    </div>
                </div>
                 <div className="mt-4">
                    <Label>Observações Especiais</Label>
                    <Textarea
                        name="special_observations"
                        value={formData.special_observations || ''}
                        onChange={handleChange}
                        placeholder="Insira aqui detalhes específicos, condições particulares ou qualquer outra observação relevante para este contrato."
                        className="mt-1"
                        rows={4}
                    />
                </div>
            </div>
        );
    };

    export default ProposalFormHeader;