import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { PlusCircle, Edit, Trash2, Loader2, Save, Plus } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Combobox } from '@/components/ui/combobox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import MasterPasswordDialog from '@/components/admin/MasterPasswordDialog';

const ClauseForm = ({ clause, parentClause, clauses, onSave, onClose }) => {
    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        defaultValues: clause || { 
            title: '', 
            content: '', 
            display_order: 0, 
            is_active: true, 
            parent_id: parentClause?.id || null,
            content_type: 'text'
        }
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();
    const parentId = watch('parent_id');

    const parentClauseOptions = useMemo(() => {
        const options = clauses
            .filter(c => !c.parent_id && c.id !== clause?.id)
            .map(c => ({ value: c.id.toString(), label: c.title }));
        options.unshift({ value: 'none', label: 'Nenhuma (é uma cláusula principal)' });
        return options;
    }, [clauses, clause]);

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            const dataToSave = { 
                ...data, 
                user_id: user.id,
                display_order: data.display_order ? parseInt(data.display_order, 10) : 0,
                parent_id: data.parent_id === 'none' || !data.parent_id ? null : parseInt(data.parent_id)
            };
            
            let error;

            if (clause?.id) {
                const { error: updateError } = await supabase.from('contract_clauses').update(dataToSave).eq('id', clause.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase.from('contract_clauses').insert(dataToSave);
                error = insertError;
            }

            if (error) throw error;

            toast({ title: 'Sucesso!', description: `Cláusula ${clause?.id ? 'atualizada' : 'criada'} com sucesso.` });
            onSave();
        } catch (err) {
            toast({ variant: "destructive", title: "Erro ao salvar cláusula", description: err.message });
        } finally {
            setIsSubmitting(false);
            onClose();
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="parent_id">Cláusula Principal (Pai)</Label>
                     <Combobox
                        options={parentClauseOptions}
                        value={parentId ? String(parentId) : 'none'}
                        onChange={(value) => setValue('parent_id', value)}
                        placeholder="Selecione a cláusula pai..."
                        searchPlaceholder="Pesquisar cláusula..."
                        emptyText="Nenhuma cláusula principal encontrada."
                    />
                </div>
                <div>
                    <Label htmlFor="display_order">Ordem de Exibição</Label>
                    <Input id="display_order" type="number" {...register('display_order')} />
                </div>
            </div>
            <div>
                <Label htmlFor="title" className="mb-1">Título</Label>
                <Input id="title" {...register('title', { required: 'O título é obrigatório.' })} />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
            </div>
            <div>
                <Label htmlFor="content" className="mb-1">Conteúdo</Label>
                <Textarea id="content" {...register('content')} rows={8} />
            </div>
             <div className="flex items-center space-x-2">
                <Checkbox id="is_active" defaultChecked={watch('is_active')} onCheckedChange={(checked) => setValue('is_active', checked)} />
                <Label htmlFor="is_active">Cláusula Ativa</Label>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Salvar Cláusula
                </Button>
            </div>
        </form>
    );
};

const ClausesTab = ({ clauses, onUpdateNeeded }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedClause, setSelectedClause] = useState(null);
    const [parentClause, setParentClause] = useState(null);
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [clauseToDelete, setClauseToDelete] = useState(null);
    const { toast } = useToast();

    const handleEdit = (clause) => {
        setSelectedClause(clause);
        setParentClause(null);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setSelectedClause(null);
        setParentClause(null);
        setIsFormOpen(true);
    };
    
    const handleAddSubClause = (parent) => {
        setSelectedClause(null);
        setParentClause(parent);
        setIsFormOpen(true);
    };

    const promptDelete = (clause) => {
        setClauseToDelete(clause);
        setIsPasswordDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!clauseToDelete) return;
        try {
            const { error } = await supabase.from('contract_clauses').delete().eq('id', clauseToDelete.id);
            if (error) throw error;
            toast({ title: 'Sucesso!', description: 'Cláusula excluída com sucesso.' });
            onUpdateNeeded();
        } catch (err) {
            toast({ variant: "destructive", title: "Erro ao excluir cláusula", description: err.message });
        } finally {
            setIsPasswordDialogOpen(false);
            setClauseToDelete(null);
        }
    };
    
    const handleFormSave = () => {
        onUpdateNeeded();
        setIsFormOpen(false);
        setSelectedClause(null);
        setParentClause(null);
    };

    const { mainClauses, subClausesMap } = useMemo(() => {
        const main = [];
        const subMap = new Map();
        (clauses || []).forEach(clause => {
            if (clause.parent_id) {
                if (!subMap.has(clause.parent_id)) {
                    subMap.set(clause.parent_id, []);
                }
                subMap.get(clause.parent_id).push(clause);
            } else {
                main.push(clause);
            }
        });
        main.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        subMap.forEach(subArray => subArray.sort((a, b) => (a.display_order || 0) - (b.display_order || 0)));
        return { mainClauses: main, subClausesMap: subMap };
    }, [clauses]);

    return (
        <>
            <Card className="mt-6">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Gestão de Cláusulas e Subcláusulas</CardTitle>
                    <Button onClick={handleAddNew} className="flex items-center gap-2">
                        <PlusCircle className="h-5 w-5" />
                        Nova Cláusula Principal
                    </Button>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[60vh]">
                        <Accordion type="multiple" className="w-full pr-4">
                            {mainClauses.map((clause) => {
                                const subClauses = subClausesMap.get(clause.id) || [];
                                return (
                                    <AccordionItem value={`item-${clause.id}`} key={clause.id}>
                                        <AccordionTrigger>
                                            <div className="flex justify-between items-center w-full">
                                                <span className="font-semibold text-lg">{clause.display_order}. {clause.title}</span>
                                                <div className="flex items-center space-x-1 mr-2">
                                                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleAddSubClause(clause); }} className="text-xs"><Plus className="h-3 w-3 mr-1"/>Subcláusula</Button>
                                                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(clause); }}><Edit className="h-4 w-4 text-blue-500" /></Button>
                                                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); promptDelete(clause); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <p className="text-muted-foreground whitespace-pre-wrap mb-4 pl-4 border-l-2">{clause.content || "Esta cláusula principal serve como um título para as subcláusulas abaixo."}</p>
                                            <div className="space-y-2 pl-6">
                                                {subClauses.length > 0 ? subClauses.map(sub => (
                                                    <Card key={sub.id} className="bg-muted/50">
                                                        <CardHeader className="pb-2">
                                                            <CardTitle className="text-base flex justify-between items-center">
                                                                <span>{clause.display_order}.{sub.display_order} {sub.title}</span>
                                                                <div className="flex items-center space-x-1">
                                                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(sub)}><Edit className="h-4 w-4 text-blue-500" /></Button>
                                                                    <Button variant="ghost" size="icon" onClick={() => promptDelete(sub)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                                                </div>
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{sub.content}</p>
                                                        </CardContent>
                                                    </Card>
                                                )) : <p className="text-sm text-muted-foreground text-center py-4">Nenhuma subcláusula cadastrada.</p>}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                );
                            })}
                        </Accordion>
                    </ScrollArea>
                </CardContent>
            </Card>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-[625px]">
                    <DialogHeader>
                        <DialogTitle>{selectedClause ? 'Editar Cláusula' : (parentClause ? `Nova Subcláusula para "${parentClause.title}"` : 'Nova Cláusula')}</DialogTitle>
                    </DialogHeader>
                    <ClauseForm 
                        clause={selectedClause} 
                        parentClause={parentClause}
                        clauses={clauses}
                        onSave={handleFormSave} 
                        onClose={() => setIsFormOpen(false)} 
                    />
                </DialogContent>
            </Dialog>
            <MasterPasswordDialog
                isOpen={isPasswordDialogOpen}
                onClose={() => setIsPasswordDialogOpen(false)}
                onConfirm={handleDelete}
                title="Confirmar Exclusão de Cláusula"
                description={`Tem certeza que deseja excluir a cláusula "${clauseToDelete?.title}"? Se for uma cláusula principal, todas as subcláusulas associadas também serão excluídas.`}
            />
        </>
    );
};

export default ClausesTab;