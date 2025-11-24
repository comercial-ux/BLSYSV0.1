import React, { useState, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, UploadCloud } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import ContactForm from '@/components/contacts/ContactForm';
import { v4 as uuidv4 } from 'uuid';

const QuotationProposalForm = ({ requestId, onSave, onClose }) => {
    const { user } = useAuth();
    const { commercialData = {}, refetchData } = useData();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
    const [formData, setFormData] = useState({ supplier_name: '', supplier_contact_id: null, price: '', notes: '' });
    const [proposalFile, setProposalFile] = useState(null);

    const suppliers = useMemo(() => 
        (commercialData?.contacts || [])
            .filter(c => c.type === 'Fornecedor')
            .map(s => ({ value: s.id.toString(), label: s.name })), 
    [commercialData.contacts]);

    const handleChange = (e) => {
        setFormData(prev => ({...prev, [e.target.name]: e.target.value}));
    };
    
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setProposalFile(e.target.files[0]);
        }
    };
    
    const handleSupplierChange = (value) => {
        const selectedSupplier = suppliers.find(s => s.value === value);
        setFormData(prev => ({
            ...prev, 
            supplier_contact_id: value ? parseInt(value, 10) : null,
            supplier_name: selectedSupplier ? selectedSupplier.label : ''
        }));
    };
    
    const handleQuickAddSupplier = async () => {
        await refetchData();
        setIsAddSupplierOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        let fileUrl = null;
        let fileName = null;

        if (proposalFile) {
            const fileExt = proposalFile.name.split('.').pop();
            const filePath = `${user.id}/${requestId}/${uuidv4()}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
                .from('quotation-proposals')
                .upload(filePath, proposalFile);
            
            if (uploadError) {
                console.warn('Upload falhou, continuando sem arquivo:', uploadError.message);
                fileUrl = null;
                fileName = null;
            } else {
                const { data: publicUrlData } = supabase.storage
                    .from('quotation-proposals')
                    .getPublicUrl(filePath);

                fileUrl = publicUrlData.publicUrl;
                fileName = proposalFile.name;
            }
        }

        const { error } = await supabase.from('quotations').insert([{
            request_id: requestId,
            user_id: user.id,
            ...formData,
            price: formData.price ? parseFloat(formData.price) : null,
            proposal_file_url: fileUrl,
            proposal_file_name: fileName,
        }]);

        setIsSubmitting(false);
        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao adicionar proposta', description: error.message });
        } else {
            toast({ title: 'Proposta adicionada com sucesso!' });
            onSave();
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    <Label htmlFor="price">Preço (R$)</Label>
                    <Input id="price" name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} className="mt-1" />
                </div>
                <div>
                    <Label htmlFor="proposalFile">Anexar Proposta</Label>
                    <div className="flex items-center gap-2 mt-1">
                        <Input id="proposalFile" type="file" onChange={handleFileChange} className="flex-grow" />
                        <UploadCloud className="w-5 h-5 text-muted-foreground" />
                    </div>
                     {proposalFile && <p className="text-sm text-muted-foreground mt-1">Arquivo selecionado: {proposalFile.name}</p>}
                </div>
                <div>
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} className="mt-1" />
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Salvar Proposta
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

export default QuotationProposalForm;