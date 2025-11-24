import React, { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Save, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import Select from 'react-select';
import { reactSelectStyles } from '@/lib/utils';

const rolesOptions = [
    { value: 'admin', label: 'Admin' },
    { value: 'comercial', label: 'Comercial' },
    { value: 'operacional', label: 'Operacional' },
    { value: 'financeiro', label: 'Financeiro' },
];

const TriggerForm = ({ trigger, users, onSave, onCancel }) => {
    const [formData, setFormData] = useState(trigger);
    const [isSaving, setIsSaving] = useState(false);
    
    const userOptions = users.map(u => ({ value: u.id, label: u.full_name || u.email }));

    const handleMultiSelectChange = (name, selectedOptions) => {
        const values = selectedOptions ? selectedOptions.map(option => option.value) : [];
        setFormData(prev => ({ ...prev, [name]: values }));
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        const toastId = toast.loading('Salvando configuração...');
        
        const payload = {
            is_active: formData.is_active,
            message_template_title: formData.message_template_title,
            message_template_body: formData.message_template_body,
            recipient_roles: formData.recipient_roles || [],
            recipient_ids: formData.recipient_ids || [],
            updated_at: new Date().toISOString()
        };

        try {
            const { error } = await supabase
                .from('notification_triggers')
                .update(payload)
                .eq('id', formData.id);

            if (error) throw error;
            toast.success('Configuração salva com sucesso!', { id: toastId });
            onSave();
        } catch (error) {
            toast.error(`Erro ao salvar: ${error.message}`, { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="message_template_title">Título da Mensagem</Label>
                <Input id="message_template_title" name="message_template_title" value={formData.message_template_title} onChange={handleChange} required />
                <p className="text-xs text-muted-foreground mt-1">Use placeholders como `{'{{placeholder}}'}` para dados dinâmicos.</p>
            </div>
            <div>
                <Label htmlFor="message_template_body">Corpo da Mensagem</Label>
                <Textarea id="message_template_body" name="message_template_body" value={formData.message_template_body} onChange={handleChange} rows={3} required />
            </div>
             <div>
                <Label>Notificar Funções (Roles)</Label>
                <Select
                    isMulti
                    options={rolesOptions}
                    value={rolesOptions.filter(option => (formData.recipient_roles || []).includes(option.value))}
                    onChange={(selected) => handleMultiSelectChange('recipient_roles', selected)}
                    placeholder="Selecione as funções..."
                    styles={reactSelectStyles}
                    classNamePrefix="react-select"
                />
            </div>
            <div>
                <Label>Notificar Usuários Específicos</Label>
                 <Select
                    isMulti
                    options={userOptions}
                    value={userOptions.filter(option => (formData.recipient_ids || []).includes(option.value))}
                    onChange={(selected) => handleMultiSelectChange('recipient_ids', selected)}
                    placeholder="Selecione usuários..."
                    styles={reactSelectStyles}
                    classNamePrefix="react-select"
                />
            </div>
            <div className="flex items-center space-x-2">
                <Switch id="is_active" name="is_active" checked={formData.is_active} onCheckedChange={(checked) => handleChange({target: {name: 'is_active', type: 'checkbox', checked}})} />
                <Label htmlFor="is_active">Gatilho Ativo</Label>
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
                <Button type="submit" disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                    Salvar
                </Button>
            </DialogFooter>
        </form>
    );
};


const NotificationTriggersManagement = () => {
    const { users, refetchData } = useData();
    const [triggers, setTriggers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTrigger, setSelectedTrigger] = useState(null);

    const fetchTriggers = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('notification_triggers').select('*').order('event_type');
        if (error) {
            toast.error('Erro ao carregar gatilhos de notificação.');
            console.error(error);
        } else {
            setTriggers(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTriggers();
    }, []);
    
    const handleEdit = (trigger) => {
        setSelectedTrigger(trigger);
        setIsModalOpen(true);
    };

    const handleSave = () => {
        setIsModalOpen(false);
        setSelectedTrigger(null);
        fetchTriggers(); // Refetch to get updated data
        refetchData(); // Refetch global data context if needed
    };

    return (
        <>
            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>Configuração de Notificações por Gatilho</CardTitle>
                    <CardDescription>
                        Defina quem será notificado quando eventos importantes acontecerem no sistema.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Evento</TableHead>
                                    <TableHead>Descrição</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></TableCell></TableRow>
                                ) : triggers.length > 0 ? (
                                    triggers.map(trigger => (
                                        <TableRow key={trigger.id}>
                                            <TableCell className="font-medium">{trigger.event_type}</TableCell>
                                            <TableCell>{trigger.description}</TableCell>
                                            <TableCell>{trigger.is_active ? 'Ativo' : 'Inativo'}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(trigger)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan={4} className="h-24 text-center">Nenhum gatilho encontrado.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Gatilho: {selectedTrigger?.event_type}</DialogTitle>
                    </DialogHeader>
                    {selectedTrigger && (
                        <TriggerForm 
                            trigger={selectedTrigger} 
                            users={users}
                            onSave={handleSave} 
                            onCancel={() => setIsModalOpen(false)} 
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};

export default NotificationTriggersManagement;