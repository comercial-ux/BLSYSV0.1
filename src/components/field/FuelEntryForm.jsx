import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Loader2, Camera, CheckCircle } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import ImageSourceDialog from './ImageSourceDialog';

const ImageInput = ({ id, label, onFileChange, fileName }) => {
    const [dialogOpen, setDialogOpen] = useState(false);

    const handleButtonClick = (e) => {
        e.preventDefault();
        setDialogOpen(true);
    };

    const handleFileSelect = (files) => {
        if (files && files[0]) {
            onFileChange({ target: { files: [files[0]] } });
        }
    };
    
    return (
        <>
            <div className="w-full">
                <button onClick={handleButtonClick} className="relative w-full h-24 px-4 py-2 flex flex-col items-center justify-center border-2 border-white/20 border-dashed rounded-md cursor-pointer hover:bg-white/5 transition-colors text-left">
                    <Camera className="w-6 h-6 text-gray-400 mb-1" />
                    <span className="text-xs text-center text-gray-400">{label}</span>
                    {fileName && <p className="text-xs text-emerald-400 mt-1 truncate max-w-full">{fileName}</p>}
                    {fileName && <CheckCircle className="absolute top-1 right-1 h-4 w-4 text-green-500 bg-slate-800 rounded-full" />}
                </button>
            </div>
            <ImageSourceDialog open={dialogOpen} onOpenChange={setDialogOpen} onFileSelect={handleFileSelect} />
        </>
    );
};


const FuelEntryForm = ({ equipments, contacts, onSave, isMobile = false }) => {
    const [formData, setFormData] = useState({
        equipment_id: '',
        driver_id: '',
        entry_date: new Date().toISOString().slice(0, 10),
        liters: '',
        total_value: '',
        odometer: '',
        horometer: '',
        notes: '',
    });
    const [photos, setPhotos] = useState({
        platePhoto: null,
        odometerPhoto: null,
        pumpPhoto: null,
        invoicePhoto: null
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const driverOptions = useMemo(() => 
        (contacts || [])
            .filter(c => c.type === 'Colaborador')
            .map(d => ({ value: d.id.toString(), label: d.name })),
        [contacts]
    );

    const equipmentOptions = useMemo(() =>
        (equipments || []).map(eq => ({
            value: eq.id.toString(),
            label: `${eq.name} (${eq.plate || 'S/ Placa'})`
        })),
        [equipments]
    );

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        let processedValue = value;
        if (type === 'number') {
            processedValue = value.replace(',', '.');
        }
        setFormData(prev => ({ ...prev, [name]: processedValue }));
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleFileChange = (name) => (e) => {
        if (e.target.files && e.target.files[0]) {
            setPhotos(prev => ({ ...prev, [name]: e.target.files[0] }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        await onSave({formData, photos});
        setIsSubmitting(false);
    };

    const isFormValid = formData.equipment_id && formData.driver_id && formData.liters && formData.entry_date;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
                <div>
                    <Label htmlFor="equipment_id">Equipamento</Label>
                    <Combobox
                        options={equipmentOptions}
                        value={formData.equipment_id}
                        onChange={(value) => handleSelectChange('equipment_id', value)}
                        placeholder="Selecione o equipamento"
                        searchPlaceholder="Buscar equipamento..."
                        emptyText="Nenhum equipamento encontrado."
                    />
                </div>
                <div>
                    <Label htmlFor="driver_id">Motorista/Operador</Label>
                     <Combobox
                        options={driverOptions}
                        value={formData.driver_id}
                        onChange={(value) => handleSelectChange('driver_id', value)}
                        placeholder="Selecione o motorista"
                        searchPlaceholder="Buscar motorista..."
                        emptyText="Nenhum motorista encontrado."
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="entry_date">Data</Label>
                    <Input id="entry_date" name="entry_date" type="date" value={formData.entry_date} onChange={handleChange} className="bg-white/10 mt-1" required />
                </div>
                <div>
                    <Label htmlFor="liters">Litros</Label>
                    <Input id="liters" name="liters" type="number" step="0.01" value={formData.liters} onChange={handleChange} placeholder="0.00" className="bg-white/10 mt-1" required />
                </div>
                <div>
                    <Label htmlFor="total_value">Valor Total (R$)</Label>
                    <Input id="total_value" name="total_value" type="number" step="0.01" value={formData.total_value} onChange={handleChange} placeholder="0.00" className="bg-white/10 mt-1" />
                </div>
                 <div>
                    <Label htmlFor="horometer">Horímetro</Label>
                    <Input id="horometer" name="horometer" type="number" step="0.1" value={formData.horometer} onChange={handleChange} className="bg-white/10 mt-1" placeholder="Horas" />
                </div>
                <div className="col-span-2">
                    <Label htmlFor="odometer">Odômetro (KM)</Label>
                    <Input id="odometer" name="odometer" type="number" value={formData.odometer} onChange={handleChange} className="bg-white/10 mt-1" placeholder="KM" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <ImageInput id="platePhoto" label="Foto da Placa" onFileChange={handleFileChange('platePhoto')} fileName={photos.platePhoto?.name} />
                <ImageInput id="odometerPhoto" label="Foto do Odômetro" onFileChange={handleFileChange('odometerPhoto')} fileName={photos.odometerPhoto?.name} />
                <ImageInput id="pumpPhoto" label="Foto da Bomba" onFileChange={handleFileChange('pumpPhoto')} fileName={photos.pumpPhoto?.name} />
                <ImageInput id="invoicePhoto" label="Foto da Nota" onFileChange={handleFileChange('invoicePhoto')} fileName={photos.invoicePhoto?.name} />
            </div>

            <Button type="submit" className="w-full !h-12 text-lg" disabled={isSubmitting || !isFormValid}>
                {isSubmitting ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Save className="mr-2 w-5 h-5" />}
                Salvar Registro
            </Button>
        </form>
    );
};

export default FuelEntryForm;