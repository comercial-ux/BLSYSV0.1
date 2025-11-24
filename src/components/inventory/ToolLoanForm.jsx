import React, { useState, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DialogFooter } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';

const ToolLoanForm = ({ onSave, onClose }) => {
    const { user } = useAuth();
    const { inventory, commercialData, refetchData } = useData();
    const [formData, setFormData] = useState({
        tool_id: null,
        contact_id: null,
        notes: '',
        expected_return_date: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const availableTools = useMemo(() => 
        inventory
            .filter(item => item.category === 'ferramenta' && item.is_active && item.quantity > 0)
            .map(item => ({ value: item.id.toString(), label: `${item.name} (Estoque: ${item.quantity})` })),
    [inventory]);

    const employees = useMemo(() =>
        (commercialData?.contacts || [])
            .filter(c => c.type === 'Colaborador')
            .map(c => ({ value: c.id.toString(), label: c.name })),
    [commercialData.contacts]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleComboboxChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value ? parseInt(value, 10) : null }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.tool_id || !formData.contact_id) {
            toast({ variant: 'destructive', title: 'Campos obrigatórios', description: 'Por favor, selecione uma ferramenta e um colaborador.' });
            return;
        }

        setIsSubmitting(true);
        try {
            const { error: loanError } = await supabase.from('tool_loans').insert({
                tool_id: formData.tool_id,
                contact_id: formData.contact_id,
                user_id: user.id,
                notes: formData.notes,
                status: 'loaned',
                loan_date: new Date().toISOString(),
                expected_return_date: formData.expected_return_date || null
            });

            if (loanError) throw loanError;

            // Atualiza a quantidade diretamente no estoque.
            // A função de banco de dados 'return_tool_loan' fará a devolução.
            const { error: inventoryError } = await supabase
                .rpc('increment', {
                    table_name: 'inventory_parts',
                    row_id: formData.tool_id,
                    x: -1,
                    field_name: 'quantity'
                });

            if (inventoryError) throw inventoryError;
            
            toast({ title: 'Empréstimo registrado com sucesso!' });
            onSave();
            refetchData(); // Força a atualização dos dados
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao registrar empréstimo', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="tool_id">Ferramenta</Label>
                <Combobox
                    options={availableTools}
                    value={formData.tool_id?.toString()}
                    onChange={(value) => handleComboboxChange('tool_id', value)}
                    placeholder="Selecione uma ferramenta"
                    searchPlaceholder="Buscar ferramenta..."
                    emptyText="Nenhuma ferramenta disponível."
                />
            </div>
            
            <div>
                <Label htmlFor="contact_id">Colaborador</Label>
                <Combobox
                    options={employees}
                    value={formData.contact_id?.toString()}
                    onChange={(value) => handleComboboxChange('contact_id', value)}
                    placeholder="Selecione um colaborador"
                    searchPlaceholder="Buscar colaborador..."
                    emptyText="Nenhum colaborador encontrado."
                />
            </div>

            <div>
                <Label htmlFor="expected_return_date">Data Prevista de Devolução</Label>
                <Input id="expected_return_date" name="expected_return_date" type="date" value={formData.expected_return_date} onChange={handleChange} className="mt-1" />
            </div>

            <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} className="mt-1" rows={3} />
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Registrar Empréstimo
                </Button>
            </DialogFooter>
        </form>
    );
};

export default ToolLoanForm;