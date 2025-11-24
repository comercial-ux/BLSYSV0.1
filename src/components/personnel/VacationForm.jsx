import React, { useState, useEffect } from 'react';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import { supabase } from '@/lib/customSupabaseClient';
    import { toast } from '@/components/ui/use-toast';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Textarea } from '@/components/ui/textarea';
    import { Loader2 } from 'lucide-react';
    import { Combobox } from '@/components/ui/combobox';
    import { DialogFooter } from '@/components/ui/dialog';

    const VacationForm = ({ vacation, employees, onSave, onClose }) => {
        const { user } = useAuth();
        const [formData, setFormData] = useState({
            contact_id: '',
            start_date: '',
            end_date: '',
            notes: '',
        });
        const [isSubmitting, setIsSubmitting] = useState(false);

        useEffect(() => {
            if (vacation) {
                setFormData({
                    contact_id: vacation.contact_id || '',
                    start_date: vacation.start_date ? vacation.start_date.split('T')[0] : '',
                    end_date: vacation.end_date ? vacation.end_date.split('T')[0] : '',
                    notes: vacation.notes || '',
                });
            }
        }, [vacation]);

        const employeeOptions = employees.map(e => ({ value: e.id.toString(), label: e.name }));

        const handleChange = (e) => {
            const { name, value } = e.target;
            setFormData(prev => ({ ...prev, [name]: value }));
        };

        const handleEmployeeChange = (value) => {
            setFormData(prev => ({ ...prev, contact_id: value }));
        };

        const handleSubmit = async (e) => {
            e.preventDefault();
            setIsSubmitting(true);

            const dataToSave = {
                ...formData,
                user_id: user.id,
                contact_id: parseInt(formData.contact_id, 10),
            };

            try {
                let error;
                if (vacation?.id) {
                    const { error: updateError } = await supabase
                        .from('personnel_vacations')
                        .update(dataToSave)
                        .eq('id', vacation.id);
                    error = updateError;
                } else {
                    const { error: insertError } = await supabase
                        .from('personnel_vacations')
                        .insert([dataToSave]);
                    error = insertError;
                }

                if (error) throw error;

                toast({ title: `Férias ${vacation?.id ? 'atualizadas' : 'agendadas'} com sucesso!` });
                onSave();
            } catch (error) {
                toast({ variant: 'destructive', title: 'Erro ao salvar férias', description: error.message });
            } finally {
                setIsSubmitting(false);
            }
        };

        return (
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label htmlFor="contact_id">Colaborador</Label>
                    <Combobox
                        options={employeeOptions}
                        value={formData.contact_id.toString()}
                        onChange={handleEmployeeChange}
                        placeholder="Selecione um colaborador"
                        searchPlaceholder="Buscar colaborador..."
                        emptyText="Nenhum colaborador encontrado."
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="start_date">Data de Início</Label>
                        <Input id="start_date" name="start_date" type="date" value={formData.start_date} onChange={handleChange} required />
                    </div>
                    <div>
                        <Label htmlFor="end_date">Data de Fim</Label>
                        <Input id="end_date" name="end_date" type="date" value={formData.end_date} onChange={handleChange} required />
                    </div>
                </div>
                <div>
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} />
                </div>
                <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar
                    </Button>
                </DialogFooter>
            </form>
        );
    };

    export default VacationForm;