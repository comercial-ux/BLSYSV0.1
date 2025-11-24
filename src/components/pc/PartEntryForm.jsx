import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Camera, CheckCircle, Loader2, Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const ImageInput = ({ label, id, onChange, fileName }) => (
    <div>
        <Label>{label}</Label>
        <label htmlFor={id} className="relative mt-1 flex justify-center w-full h-32 px-6 pt-5 pb-6 border-2 border-white/20 border-dashed rounded-md cursor-pointer hover:bg-white/5 transition-colors">
            <div className="space-y-1 text-center">
                <Camera className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-400">
                    <p className="pl-1 truncate max-w-[150px]">{fileName ? fileName : `Anexar ${label.toLowerCase()}`}</p>
                </div>
            </div>
            {fileName && <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-green-500 bg-slate-800 rounded-full" />}
            <input id={id} name={id} type="file" className="sr-only" accept="image/*" capture="environment" onChange={onChange} />
        </label>
    </div>
);

const PartEntryForm = ({ inventory, onSave }) => {
    const { toast } = useToast();
    const [isNewPart, setIsNewPart] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        part_number: '',
        quantity: '',
        unit: 'un',
        purchase_price: '',
        supplier: '',
        notes: ''
    });
    const [invoicePhoto, setInvoicePhoto] = useState(null);
    const [productPhoto, setProductPhoto] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const activeInventory = useMemo(() => inventory.filter(p => p.is_active), [inventory]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (value) => {
        const selectedPart = activeInventory.find(p => p.id.toString() === value);
        if (selectedPart) {
            setFormData(prev => ({
                ...prev,
                id: value,
                name: selectedPart.name,
                part_number: selectedPart.part_number,
                unit: selectedPart.unit,
            }));
        }
    };

    const handleFileChange = (e, fileType) => {
        if (e.target.files && e.target.files[0]) {
            if (fileType === 'invoice') {
                setInvoicePhoto(e.target.files[0]);
            } else if (fileType === 'product') {
                setProductPhoto(e.target.files[0]);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if ((!isNewPart && !formData.id) || !formData.quantity) {
            toast({ variant: 'destructive', title: 'Campos obrigatórios', description: 'Selecione uma peça e informe a quantidade.' });
            return;
        }
        if (isNewPart && !formData.name) {
            toast({ variant: 'destructive', title: 'Campos obrigatórios', description: 'O nome da peça é obrigatório.' });
            return;
        }

        setIsSubmitting(true);
        await onSave({
            isNew: isNewPart,
            partData: formData,
            invoicePhoto: invoicePhoto,
            productPhoto: productPhoto,
        });
        setIsSubmitting(false);
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 space-y-6">
            <div className="flex items-center justify-center space-x-4 py-2">
                <Label htmlFor="new-part-switch" className={isNewPart ? 'text-gray-400' : 'text-white font-bold'}>Peça Existente</Label>
                <Switch
                    id="new-part-switch"
                    checked={isNewPart}
                    onCheckedChange={setIsNewPart}
                />
                <Label htmlFor="new-part-switch" className={isNewPart ? 'text-white font-bold' : 'text-gray-400'}>Nova Peça</Label>
            </div>

            {isNewPart ? (
                <div className="space-y-4 p-4 border border-dashed border-blue-400 rounded-lg bg-blue-500/10">
                    <h3 className="text-lg font-semibold text-blue-300">Dados da Nova Peça</h3>
                    <div><Label>Nome da Peça <span className="text-red-500">*</span></Label><Input name="name" value={formData.name} onChange={handleChange} required className="bg-white/10 mt-1" /></div>
                    <div><Label>Código/Part Number</Label><Input name="part_number" value={formData.part_number} onChange={handleChange} className="bg-white/10 mt-1" /></div>
                    <div><Label>Unidade de Medida</Label><Input name="unit" value={formData.unit} onChange={handleChange} className="bg-white/10 mt-1" /></div>
                </div>
            ) : (
                <div>
                    <Label>Peça Existente <span className="text-red-500">*</span></Label>
                    <Select value={formData.id} onValueChange={handleSelectChange} required>
                        <SelectTrigger className="w-full mt-1 bg-white/10 border-white/20 text-white">
                            <SelectValue placeholder="Selecione uma peça..." />
                        </SelectTrigger>
                        <SelectContent>
                            {activeInventory.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name} ({p.part_number ? `${p.part_number} / ` : ''}{p.quantity} em estoque)</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div><Label>Quantidade <span className="text-red-500">*</span></Label><Input type="number" name="quantity" value={formData.quantity} onChange={handleChange} required className="bg-white/10 mt-1" /></div>
                <div><Label>Preço de Compra (Unitário)</Label><Input type="number" step="0.01" name="purchase_price" value={formData.purchase_price} onChange={handleChange} className="bg-white/10 mt-1" /></div>
            </div>
            <div><Label>Fornecedor</Label><Input name="supplier" value={formData.supplier} onChange={handleChange} className="bg-white/10 mt-1" /></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ImageInput label="Foto da Nota Fiscal" id="invoice-photo" onChange={(e) => handleFileChange(e, 'invoice')} fileName={invoicePhoto?.name} />
                <ImageInput label="Foto do Produto" id="product-photo" onChange={(e) => handleFileChange(e, 'product')} fileName={productPhoto?.name} />
            </div>

            <div>
                <Label>Observações</Label>
                <Textarea name="notes" value={formData.notes} onChange={handleChange} className="bg-white/10 mt-1" />
            </div>

            <Button type="submit" className="w-full !h-12 text-lg" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Save className="mr-2 w-5 h-5" />}
                Registrar Entrada
            </Button>
        </form>
    );
};

export default PartEntryForm;