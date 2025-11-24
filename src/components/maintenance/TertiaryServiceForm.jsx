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
import { Loader2 } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import ContactForm from '@/components/contacts/ContactForm';

const TertiaryServiceForm = ({ service, onSave, onClose }) => {
    const { user } = useAuth();
    const { commercialData, refetchData } = useData();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        provider_contact_id: null,
        default_cost: '',
        is_active: true,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);

    useEffect(() => {
        if (service) {
            setFormData({
                name: service.name || '',
                description: service.description || '',
                provider_contact_id: service.provider_contact_id || null,
                default_cost: service.default_cost || '',
                is_active: service.is_active !== undefined ? service.is_active : true,
            });
        }
    }, [service]);

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

    const handleSupplierChange = (value) => {
        setFormData(prev => ({
            ...prev,
            provider_contact_id: value ? parseInt(value, 10) : null,
        }));
    };
    
    const handleQuickAddSupplier = async () => {
        await refetchData();
        setIsAddSupplierOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const dataToSave = {
                ...formData,
                default_cost: formData.default_cost ? parseFloat(formData.default_cost) : null,
                user_id: user.id,
            };
            
            let error;
            if (service?.id) {
                const { error: updateError } = await supabase.from('tertiary_services').update(dataToSave).eq('id', service.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase.from('tertiary_services').insert([dataToSave]);
                error = insertError;
            }

            if (error) throw error;

            toast({ title: `Serviço ${service?.id ? 'atualizado' : 'adicionado'} com sucesso!` });
            onSave();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao salvar serviço', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label htmlFor="name">Nome do Serviço</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleChange} className="mt-1" required />
                </div>
                
                <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea id="description" name="description" value={formData.description} onChange={handleChange} className="mt-1" />
                </div>

                <div>
                    <Label htmlFor="provider_contact_id">Fornecedor</Label>
                    <Combobox
                        options={suppliers}
                        value={formData.provider_contact_id?.toString()}
                        onChange={handleSupplierChange}
                        placeholder="Selecione um fornecedor"
                        searchPlaceholder="Buscar fornecedor..."
                        emptyText="Nenhum fornecedor encontrado."
                        onQuickAdd={() => setIsAddSupplierOpen(true)}
                        quickAddText="Novo Fornecedor"
                    />
                </div>

                <div>
                    <Label htmlFor="default_cost">Custo Padrão (R$)</Label>
                    <Input id="default_cost" name="default_cost" type="number" step="0.01" value={formData.default_cost} onChange={handleChange} className="mt-1" />
                </div>

                <div className="flex items-center space-x-2">
                    <Switch id="is_active" name="is_active" checked={formData.is_active} onCheckedChange={(checked) => setFormData(p => ({...p, is_active: checked}))} />
                    <Label htmlFor="is_active">Serviço Ativo</Label>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Salvar Serviço
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

export default TertiaryServiceForm;