import React, { useState, useMemo, useRef, useEffect } from 'react';
    import { useData } from '@/contexts/DataContext';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import { supabase } from '@/lib/customSupabaseClient';
    import { toast } from '@/components/ui/use-toast';
    import { Button } from '@/components/ui/button';
    import { DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Textarea } from '@/components/ui/textarea';
    import { Combobox } from '@/components/ui/combobox';
    import { Loader2, Save } from 'lucide-react';
    import { HotTable } from '@handsontable/react';
    import Handsontable from 'handsontable';
    import { registerAllModules } from 'handsontable/registry';
    import { HyperFormula } from 'hyperformula';
    import 'handsontable/dist/handsontable.full.min.css';

    registerAllModules();

    const PriceFormationEditor = ({ formation, onSave, onClose }) => {
        const { user } = useAuth();
        const { commercialData } = useData();
        const [formData, setFormData] = useState(formation || {
            name: '',
            contact_id: '',
            project_description: '',
        });
        const [isSubmitting, setIsSubmitting] = useState(false);
        const hotRef = useRef(null);

        const clientOptions = useMemo(() => 
            (commercialData?.contacts || [])
                .filter(c => c.type === 'Cliente')
                .map(c => ({ value: String(c.id), label: c.name })),
        [commercialData.contacts]);

        const handleChange = (e) => {
            setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        };

        const handleSelectChange = (name, value) => {
            setFormData(prev => ({ ...prev, [name]: value }));
        };

        const handleSubmit = async (e) => {
            e.preventDefault();
            if (!formData.name || !formData.contact_id) {
                toast({ variant: 'destructive', title: 'Campos obrigatórios', description: 'Nome da formação e cliente são obrigatórios.' });
                return;
            }
            setIsSubmitting(true);
            const spreadsheetData = hotRef.current?.hotInstance?.getData();
            
            const dataToSave = { 
                ...formData, 
                user_id: user.id,
                spreadsheet_data: spreadsheetData,
            };

            let error;
            if (formation?.id) {
                const { error: updateError } = await supabase.from('price_formations').update(dataToSave).eq('id', formation.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase.from('price_formations').insert([dataToSave]);
                error = insertError;
            }

            setIsSubmitting(false);
            if (error) {
                toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message });
            } else {
                toast({ title: 'Sucesso!', description: 'Formação de preço salva.' });
                onSave();
            }
        };

        return (
            <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{formation?.id ? 'Editar' : 'Nova'} Formação de Preço</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex-grow flex flex-col gap-4 overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label>Nome da Formação</Label>
                            <Input name="name" value={formData.name} onChange={handleChange} placeholder="Ex: Projeto Edifício Central" required />
                        </div>
                        <div className="md:col-span-2">
                            <Label>Cliente</Label>
                            <Combobox
                                options={clientOptions}
                                value={formData.contact_id}
                                onChange={(v) => handleSelectChange('contact_id', v)}
                                placeholder="Selecione um cliente"
                                searchPlaceholder="Buscar cliente..."
                                emptyText="Nenhum cliente encontrado."
                            />
                        </div>
                    </div>
                    <div>
                        <Label>Descrição do Projeto</Label>
                        <Textarea name="project_description" value={formData.project_description || ''} onChange={handleChange} rows={2} placeholder="Detalhes sobre o escopo do projeto." />
                    </div>
                    <div className="flex-grow overflow-auto border rounded-lg" id="hot-container">
                        <HotTable
                            ref={hotRef}
                            data={formation?.spreadsheet_data || Handsontable.helper.createEmptySpreadsheetData(200, 26)}
                            colHeaders={true}
                            rowHeaders={true}
                            width="100%"
                            height="100%"
                            contextMenu={true}
                            formulas={{
                                engine: HyperFormula,
                            }}
                            dropdownMenu={true}
                            filters={true}
                            manualColumnResize={true}
                            manualRowResize={true}
                            licenseKey="non-commercial-and-evaluation"
                        />
                    </div>
                    <DialogFooter className="flex-shrink-0 pt-4">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Salvar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        );
    };

    export default PriceFormationEditor;