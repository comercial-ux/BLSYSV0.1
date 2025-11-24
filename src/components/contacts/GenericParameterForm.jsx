import React, { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogFooter } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';

const GenericParameterForm = ({ item, onSave, onClose, table, fields, title }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState(item || fields.reduce((acc, f) => ({ ...acc, [f.name]: f.defaultValue || '' }), {}));
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSelectChange = (name, value) => {
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            toast({ variant: 'destructive', title: 'Erro de Autenticação' });
            return;
        }
        setIsSubmitting(true);

        const dataToSubmit = { ...formData, user_id: user.id };
        let error;

        if (item) {
            const { error: updateError } = await supabase
                .from(table)
                .update(dataToSubmit)
                .eq('id', item.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from(table)
                .insert([dataToSubmit]);
            error = insertError;
        }
        
        setIsSubmitting(false);

        if (error) {
            toast({ variant: 'destructive', title: `Erro ao salvar ${title}`, description: error.message });
        } else {
            toast({ title: `${title} ${item ? 'atualizado' : 'criado'} com sucesso!` });
            onSave();
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(field => (
                <div key={field.name}>
                    <Label htmlFor={field.name}>{field.label}</Label>
                    {field.type === 'select' ? (
                        <Combobox
                          options={field.options.map(opt => ({ value: opt, label: opt }))}
                          value={formData[field.name]}
                          onChange={(value) => handleSelectChange(field.name, value)}
                          placeholder={`Selecione um ${field.label.toLowerCase()}`}
                        />
                    ) : (
                        <Input id={field.name} name={field.name} value={formData[field.name] || ''} onChange={handleChange} className="bg-white/10 mt-1" required />
                    )}
                </div>
            ))}
            <DialogFooter className="pt-6">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar
                </Button>
            </DialogFooter>
        </form>
    );
};

export default GenericParameterForm;