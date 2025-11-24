import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Camera, CheckCircle, Loader2 } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';

const ImageInput = ({ label, onChange, fileName }) => (
    <div>
        <Label>{label}</Label>
        <label htmlFor={label} className="relative mt-1 flex justify-center w-full h-32 px-6 pt-5 pb-6 border-2 border-white/20 border-dashed rounded-md cursor-pointer hover:bg-white/5 transition-colors">
            <div className="space-y-1 text-center">
                <Camera className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-400">
                    <p className="pl-1 truncate max-w-[150px]">{fileName ? fileName : "Tire ou selecione"}</p>
                </div>
            </div>
             {fileName && <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-green-500 bg-slate-800 rounded-full" />}
            <input id={label} name={label} type="file" className="sr-only" accept="image/*" capture="environment" onChange={onChange} />
        </label>
    </div>
);


const FuelEntryForm = ({ equipments, contacts, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        equipment_id: '',
        driver_id: '',
        entry_date: new Date().toISOString().split('T')[0],
        liters: '',
        total_value: '',
        odometer: '',
        horometer: '',
        notes: ''
    });
    const [platePhoto, setPlatePhoto] = useState(null);
    const [odometerPhoto, setOdometerPhoto] = useState(null);
    const [pumpPhoto, setPumpPhoto] = useState(null);
    const [invoicePhoto, setInvoicePhoto] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const driverOptions = useMemo(() => {
        if (!Array.isArray(contacts)) return [];
        return contacts
            .filter(c => c.type === 'Colaborador')
            .map(c => ({ value: c.id.toString(), label: c.name }))
            .sort((a, b) => a.label.localeCompare(b.label));
    }, [contacts]);

    const vehicleOptions = useMemo(() => {
      if (!equipments) return [];
      return equipments
        .map(v => ({ value: v.id.toString(), label: `${v.name} (${v.plate || 'S/ Placa'})`}))
        .sort((a,b) => a.label.localeCompare(b.label));
    }, [equipments]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        let processedValue = value;
        if (type === 'number') {
            processedValue = value.replace(',', '.');
        }
        setFormData(prev => ({ ...prev, [name]: processedValue }));
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({...prev, [name]: value}));
    }
    
    const handleFileChange = (setter) => (e) => {
        if (e.target.files && e.target.files[0]) {
            setter(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        await onSave({
            formData,
            photos: {
                platePhoto,
                odometerPhoto,
                pumpPhoto,
                invoicePhoto,
            },
        });
        setIsSubmitting(false);
    };

    const isFormValid = formData.equipment_id && formData.driver_id && formData.liters && formData.entry_date;

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto p-2">
            <div>
                <Label>Veículo / Equipamento</Label>
                <Combobox
                    options={vehicleOptions}
                    value={formData.equipment_id}
                    onChange={(value) => handleSelectChange('equipment_id', value)}
                    placeholder="Selecione o veículo"
                    searchPlaceholder="Pesquisar veículo..."
                    emptyText="Nenhum veículo encontrado."
                    className="mt-1"
                />
            </div>
            <div>
                <Label>Motorista / Operador</Label>
                <Combobox
                    options={driverOptions}
                    value={formData.driver_id}
                    onChange={(value) => handleSelectChange('driver_id', value)}
                    placeholder="Selecione o motorista"
                    searchPlaceholder="Pesquisar motorista..."
                    emptyText="Nenhum motorista encontrado."
                    className="mt-1"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div><Label>Data</Label><Input type="date" name="entry_date" value={formData.entry_date} onChange={handleChange} required className="bg-white/10 mt-1"/></div>
                <div><Label>Litros (L)</Label><Input type="number" step="0.01" name="liters" value={formData.liters} onChange={handleChange} required className="bg-white/10 mt-1"/></div>
                <div><Label>Valor Total (R$)</Label><Input type="number" step="0.01" name="total_value" value={formData.total_value} onChange={handleChange} className="bg-white/10 mt-1"/></div>
                <div><Label>Odômetro (km)</Label><Input type="number" step="0.1" name="odometer" value={formData.odometer} onChange={handleChange} className="bg-white/10 mt-1"/></div>
                <div><Label>Horímetro (h)</Label><Input type="number" step="0.1" name="horometer" value={formData.horometer} onChange={handleChange} className="bg-white/10 mt-1"/></div>
            </div>
            
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <ImageInput label="Foto da Placa" onChange={handleFileChange(setPlatePhoto)} fileName={platePhoto?.name} />
                <ImageInput label="Foto do Odômetro/Horímetro" onChange={handleFileChange(setOdometerPhoto)} fileName={odometerPhoto?.name} />
                <ImageInput label="Foto da Bomba" onChange={handleFileChange(setPumpPhoto)} fileName={pumpPhoto?.name} />
                <ImageInput label="Foto do Cupom Fiscal" onChange={handleFileChange(setInvoicePhoto)} fileName={invoicePhoto?.name} />
            </div>

            <div>
                <Label>Observações</Label>
                <Textarea name="notes" value={formData.notes} onChange={handleChange} className="bg-white/10 mt-1" />
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting || !isFormValid}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? 'Salvando...' : 'Salvar Registro'}
                </Button>
            </div>
        </form>
    );
};

export default FuelEntryForm;