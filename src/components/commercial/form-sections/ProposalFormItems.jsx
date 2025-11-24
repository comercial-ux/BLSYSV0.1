import React, { useMemo, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { Plus, Trash2 } from 'lucide-react';

const ProposalFormItems = ({ formData, onFormChange }) => {
    const { commercialData } = useData();

    const serviceItemOptions = useMemo(() => 
        (commercialData?.serviceItems || []).map(ci => ({
            value: String(ci.id),
            label: `${ci.name} (${ci.type})`
        })), 
    [commercialData.serviceItems]);

    const handleItemChange = (index, field, value) => {
        const newList = [...(formData.items_list || [])];
        newList[index] = { ...newList[index], [field]: value };

        // Recalculate derived fields
        const item = newList[index];
        const guaranteeHours = parseFloat(item.guarantee_hours_day) || 0;
        const valueHour = parseFloat(item.value_hour_day) || 0;
        const periods = parseInt(item.period, 10) || 1;
        const mobilization = parseFloat(item.mobilization_demobilization) || 0;

        if (field === 'guarantee_hours_day' || field === 'value_hour_day') {
            const minGuarantee = guaranteeHours * valueHour;
            newList[index].min_guarantee_worked_days = minGuarantee.toFixed(2);
        }

        const minGuarantee = parseFloat(newList[index].min_guarantee_worked_days) || 0;
        const globalValue = (minGuarantee * periods) + mobilization;
        newList[index].global_value = globalValue.toFixed(2);
        
        onFormChange('items_list', newList);
    };

    const addItem = () => {
        const newItem = {
            service_item_id: '',
            period: '1',
            guarantee_hours_day: '',
            value_hour_day: '',
            min_guarantee_worked_days: '',
            mobilization_demobilization: '0.00',
            extra_hour_value: '',
            global_value: '0.00',
        };
        const newList = [...(formData.items_list || []), newItem];
        onFormChange('items_list', newList);
    };

    const removeItem = (index) => {
        const newList = (formData.items_list || []).filter((_, i) => i !== index);
        onFormChange('items_list', newList);
    };

    return (
        <div className="p-4 border rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-primary">2. Equipamentos e Serviços</h3>
            <div className="space-y-4">
                {(formData.items_list || []).map((item, index) => (
                    <div key={index} className="p-3 bg-muted/50 rounded-md border">
                        <div className="flex justify-between items-center mb-3">
                            <Label>Item #{index + 1}</Label>
                            <Button type="button" size="icon" variant="destructive" onClick={() => removeItem(index)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div className="md:col-span-4">
                                <Label>Item / Serviço</Label>
                                <Combobox
                                    options={serviceItemOptions}
                                    value={String(item.service_item_id || 'none')}
                                    onChange={(v) => handleItemChange(index, 'service_item_id', v)}
                                    placeholder="Selecione..."
                                    searchPlaceholder="Buscar item..."
                                />
                            </div>

                            <div>
                                <Label>Períodos</Label>
                                <Input type="number" placeholder="1" value={item.period || ''} onChange={(e) => handleItemChange(index, 'period', e.target.value)} className="mt-1" />
                            </div>

                            <div>
                                <Label>Garantia Horas/Período</Label>
                                <Input type="text" placeholder="Ex: 200" value={item.guarantee_hours_day || ''} onChange={(e) => handleItemChange(index, 'guarantee_hours_day', e.target.value)} className="mt-1" />
                            </div>

                            <div>
                                <Label>Valor Hora</Label>
                                <Input type="number" step="0.01" placeholder="380.00" value={item.value_hour_day || ''} onChange={(e) => handleItemChange(index, 'value_hour_day', e.target.value)} className="mt-1" />
                            </div>

                            <div>
                                <Label>Garantia Mínima / Período</Label>
                                <Input type="number" step="0.01" placeholder="0.00" value={item.min_guarantee_worked_days || ''} onChange={(e) => handleItemChange(index, 'min_guarantee_worked_days', e.target.value)} className="mt-1" readOnly />
                            </div>

                            <div>
                                <Label>Mob/Desmob</Label>
                                <Input type="number" step="0.01" placeholder="0.00" value={item.mobilization_demobilization || ''} onChange={(e) => handleItemChange(index, 'mobilization_demobilization', e.target.value)} className="mt-1" />
                            </div>

                            <div>
                                <Label>Valor Global</Label>
                                <Input type="number" step="0.01" placeholder="0.00" value={item.global_value || ''} onChange={(e) => handleItemChange(index, 'global_value', e.target.value)} className="mt-1" readOnly />
                            </div>

                            <div>
                                <Label>Valor Hora Extra</Label>
                                <Input type="number" step="0.01" placeholder="380.00" value={item.extra_hour_value || ''} onChange={(e) => handleItemChange(index, 'extra_hour_value', e.target.value)} className="mt-1" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addItem} className="mt-4">
                <Plus className="mr-2 w-4 h-4" /> Adicionar Item
            </Button>
        </div>
    );
};

export default ProposalFormItems;