import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PartDispatchForm = ({ inventory, onSave }) => {
    const { toast } = useToast();
    const [formData, setFormData] = useState({
        part_id: '',
        quantity: '',
        notes: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const availableInventory = useMemo(() => {
        return inventory.filter(p => p.is_active && p.quantity > 0);
    }, [inventory]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (value) => {
        setFormData(prev => ({ ...prev, part_id: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.part_id || !formData.quantity) {
            toast({ variant: 'destructive', title: 'Campos obrigatórios', description: 'Selecione uma peça e informe a quantidade.' });
            return;
        }

        setIsSubmitting(true);
        await onSave(formData);
        setIsSubmitting(false);
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 space-y-6">
            <div>
                <Label>Peça <span className="text-red-500">*</span></Label>
                <Select value={formData.part_id} onValueChange={handleSelectChange} required>
                    <SelectTrigger className="w-full mt-1 bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Selecione uma peça para dar baixa..." />
                    </SelectTrigger>
                    <SelectContent>
                        {availableInventory.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name} ({p.quantity} em estoque)</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            <div>
                <Label>Quantidade a Retirar <span className="text-red-500">*</span></Label>
                <Input type="number" name="quantity" value={formData.quantity} onChange={handleChange} required className="bg-white/10 mt-1" />
            </div>

            <div>
                <Label>Observações (Ex: OS, projeto, etc.)</Label>
                <Textarea name="notes" value={formData.notes} onChange={handleChange} className="bg-white/10 mt-1" />
            </div>

            <Button type="submit" className="w-full !h-12 text-lg" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Save className="mr-2 w-5 h-5" />}
                Registrar Saída
            </Button>
        </form>
    );
};

export default PartDispatchForm;