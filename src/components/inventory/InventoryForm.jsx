import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, X, Upload } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import ContactForm from '@/components/contacts/ContactForm';
import { v4 as uuidv4 } from 'uuid';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const InventoryForm = ({ part, onSave, onClose, uploadImages, defaultCategory = 'peca', isPurchaseContext = false }) => {
    const { user } = useAuth();
    const { commercialData, refetchData } = useData();
    const [formData, setFormData] = useState({
        name: '',
        part_number: '',
        quantity: 0,
        unit: 'un',
        purchase_price: '',
        supplier: '',
        supplier_contact_id: null,
        notes: '',
        location: '',
        is_active: true,
        expiry_date: '',
        photo_urls: [],
        category: defaultCategory,
    });
    const [imageFiles, setImageFiles] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);

    useEffect(() => {
        if (part) {
            setFormData({
                name: part.name || '',
                part_number: part.part_number || '',
                quantity: part.quantity || 0,
                unit: part.unit || 'un',
                purchase_price: part.purchase_price || '',
                supplier: part.supplier || '',
                supplier_contact_id: part.supplier_contact_id || null,
                notes: part.notes || '',
                location: part.location || '',
                is_active: part.is_active !== undefined ? part.is_active : true,
                expiry_date: part.expiry_date ? new Date(part.expiry_date).toISOString().slice(0, 10) : '',
                photo_urls: part.photo_urls || [],
                category: part.category || defaultCategory,
            });
        } else {
             setFormData(prev => ({ ...prev, category: defaultCategory }));
        }
        setImageFiles([]);
    }, [part, defaultCategory]);

    const suppliers = useMemo(() => 
        (commercialData?.contacts || [])
            .filter(c => c.type === 'Fornecedor')
            .map(s => ({ value: s.id.toString(), label: s.name })), 
    [commercialData.contacts]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleCategoryChange = (value) => {
        setFormData(prev => ({ ...prev, category: value }));
    };
    
    const handleSupplierChange = (value) => {
        const selectedSupplier = suppliers.find(s => s.value === value);
        setFormData(prev => ({
            ...prev,
            supplier_contact_id: value ? parseInt(value, 10) : null,
            supplier: selectedSupplier ? selectedSupplier.label : ''
        }));
    };
    
    const handleQuickAddSupplier = async () => {
        await refetchData();
        setIsAddSupplierOpen(false);
    };

    const handleImageChange = (e) => {
        if (e.target.files) {
            setImageFiles(prev => [...prev, ...Array.from(e.target.files)]);
        }
    };

    const removeNewImage = (index) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingImage = (url) => {
        setFormData(prev => ({
            ...prev,
            photo_urls: prev.photo_urls.filter(u => u !== url)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            let newImageUrls = [];
            if (imageFiles.length > 0) {
                const path = `${user.id}/${uuidv4()}`;
                newImageUrls = await uploadImages(imageFiles, 'inventory-files', path);
            }

            const finalImageUrls = [...formData.photo_urls, ...newImageUrls];

            const dataToSave = {
                ...formData,
                photo_urls: finalImageUrls,
                purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
                quantity: formData.quantity ? parseInt(formData.quantity, 10) : 0,
                user_id: user.id,
                expiry_date: formData.expiry_date || null
            };
            
            if (isPurchaseContext) {
                onSave(dataToSave);
                return;
            }

            let error;
            if (part?.id) {
                const { error: updateError } = await supabase.from('inventory_parts').update(dataToSave).eq('id', part.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase.from('inventory_parts').insert([dataToSave]);
                error = insertError;
            }

            if (error) {
                throw error;
            }

            toast({ title: `Item ${part?.id ? 'atualizado' : 'adicionado'} com sucesso!` });
            onSave();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao salvar item', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-2">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="md:col-span-2">
                        <Label htmlFor="name">Nome do Item</Label>
                        <Input id="name" name="name" value={formData.name} onChange={handleChange} className="mt-1" required />
                    </div>
                    <div>
                        <Label htmlFor="category">Categoria</Label>
                         <Select onValueChange={handleCategoryChange} value={formData.category}>
                            <SelectTrigger className="w-full mt-1">
                                <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="peca">Peças</SelectItem>
                                <SelectItem value="epi_cinta">EPI+Cintas</SelectItem>
                                <SelectItem value="consumivel">Consumíveis</SelectItem>
                                <SelectItem value="ferramenta">Ferramentas</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                        <Label htmlFor="part_number">Part Number</Label>
                        <Input id="part_number" name="part_number" value={formData.part_number} onChange={handleChange} className="mt-1" />
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    <div>
                        <Label htmlFor="quantity">Quantidade</Label>
                        <Input id="quantity" name="quantity" type="number" value={formData.quantity} onChange={handleChange} className="mt-1" required />
                    </div>
                    <div>
                        <Label htmlFor="unit">Unidade</Label>
                        <Input id="unit" name="unit" value={formData.unit} onChange={handleChange} className="mt-1" required />
                    </div>
                    <div>
                        <Label htmlFor="location">Localização</Label>
                        <Input id="location" name="location" value={formData.location} onChange={handleChange} className="mt-1" />
                    </div>
                    <div>
                        <Label htmlFor="purchase_price">Preço Compra</Label>
                        <Input id="purchase_price" name="purchase_price" type="number" step="0.01" value={formData.purchase_price} onChange={handleChange} className="mt-1" />
                    </div>
                    <div>
                        <Label htmlFor="expiry_date">Validade</Label>
                        <Input id="expiry_date" name="expiry_date" type="date" value={formData.expiry_date} onChange={handleChange} className="mt-1" />
                    </div>
                </div>
                
                <div>
                    <Label htmlFor="supplier_contact_id">Fornecedor</Label>
                    <Combobox
                        options={suppliers}
                        value={formData.supplier_contact_id?.toString()}
                        onChange={handleSupplierChange}
                        placeholder="Selecione um fornecedor"
                        searchPlaceholder="Buscar fornecedor..."
                        emptyText="Nenhum fornecedor encontrado."
                        onQuickAdd={() => setIsAddSupplierOpen(true)}
                        quickAddText="Novo Fornecedor"
                    />
                </div>

                <div>
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} className="mt-1" rows={2} />
                </div>

                <div>
                    <Label>Fotos</Label>
                    <div className="mt-1 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                        {formData.photo_urls.map((url) => (
                            <div key={url} className="relative group">
                                <img src={url} alt="Foto existente" className="w-full h-16 object-cover rounded-md" />
                                <Button type="button" variant="destructive" size="icon" className="absolute top-0.5 right-0.5 h-5 w-5 opacity-0 group-hover:opacity-100" onClick={() => removeExistingImage(url)}>
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                        {imageFiles.map((file, index) => (
                            <div key={index} className="relative group">
                                <img src={URL.createObjectURL(file)} alt="Nova foto" className="w-full h-16 object-cover rounded-md" />
                                <Button type="button" variant="destructive" size="icon" className="absolute top-0.5 right-0.5 h-5 w-5 opacity-0 group-hover:opacity-100" onClick={() => removeNewImage(index)}>
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                        <Label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-16 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted">
                            <Upload className="h-6 w-6 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Adicionar</span>
                            <Input id="image-upload" type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                        </Label>
                    </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                    <Switch id="is_active" name="is_active" checked={formData.is_active} onCheckedChange={(checked) => setFormData(p => ({...p, is_active: checked}))} />
                    <Label htmlFor="is_active">Item Ativo</Label>
                </div>
                <DialogFooter className="pt-2">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Salvar Item
                    </Button>
                </DialogFooter>
            </form>

            <Dialog open={isAddSupplierOpen} onOpenChange={setIsAddSupplierOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Adicionar Novo Fornecedor</DialogTitle>
                        <DialogDescription>Preencha os dados do novo fornecedor. Ele será salvo e selecionado automaticamente.</DialogDescription>
                    </DialogHeader>
                    <ContactForm contact={{ type: 'Fornecedor', person_type: 'Jurídica' }} onSave={handleQuickAddSupplier} onClose={() => setIsAddSupplierOpen(false)} />
                </DialogContent>
            </Dialog>
        </>
    );
};

export default InventoryForm;