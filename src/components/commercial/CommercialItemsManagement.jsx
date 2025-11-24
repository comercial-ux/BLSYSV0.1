import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, Edit, Trash2, Package, Wrench, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Combobox } from '@/components/ui/combobox';
import { useData } from '@/contexts/DataContext';
import MasterPasswordDialog from '@/components/admin/MasterPasswordDialog';

const typeOptions = [
    { value: 'Equipamento', label: 'Equipamento' },
    { value: 'Serviço', label: 'Serviço' },
];

const CommercialItemsManagement = ({ onUpdate }) => {
    const { user } = useAuth();
    const { commercialData, loading } = useData();
    const [items, setItems] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [formData, setFormData] = useState({});
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

    const getInitialFormData = () => ({
        name: '',
        type: 'Equipamento',
        capacity: '',
        description: '',
        franchise_daily_fixed_hours: null,
        days_quantity: null,
        mobilization_cost: null,
        cost_price_per_hour: null,
        selling_price_per_hour: null,
        fuel_consumption_lph: null,
        demobilization_cost: null,
        is_third_party: false
    });

    useEffect(() => {
        if (commercialData?.serviceItems) {
            setItems(commercialData.serviceItems);
        }
    }, [commercialData]);

    const openModal = (item = null) => {
        setSelectedItem(item);
        setFormData(item ? { ...getInitialFormData(), ...item } : getInitialFormData());
        setIsModalOpen(true);
    };

    const closeModal = () => {
        if (isSubmitting) return;
        setIsModalOpen(false);
        setSelectedItem(null);
        setFormData({});
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const finalValue = type === 'checkbox' ? checked : (value === '' ? null : value);
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };
    
    const handleSelectChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
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
        if (selectedItem) {
            const { error: updateError } = await supabase
                .from('service_items')
                .update(dataToSubmit)
                .eq('id', selectedItem.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from('service_items')
                .insert([dataToSubmit]);
            error = insertError;
        }
        
        setIsSubmitting(false);

        if (error) {
            toast({
                variant: 'destructive',
                title: 'Erro ao Salvar Item',
                description: error.message,
            });
        } else {
            toast({
                title: `Item ${selectedItem ? 'Atualizado' : 'Criado'}!`,
                description: 'O item comercial foi salvo com sucesso.',
            });
            onUpdate();
            closeModal();
        }
    };

    const promptDelete = (item) => {
        setItemToDelete(item);
        setIsPasswordDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!user || !itemToDelete) return;

        setIsDeleting(itemToDelete.id);
        const { error } = await supabase
            .from('service_items')
            .delete()
            .eq('id', itemToDelete.id);

        setIsDeleting(null);
        setIsPasswordDialogOpen(false);

        if (error) {
            toast({
                variant: 'destructive',
                title: 'Erro ao Excluir Item',
                description: error.message,
            });
        } else {
            toast({
                title: 'Item Excluído!',
                description: 'O item comercial foi removido com sucesso.',
            });
            onUpdate();
        }
        setItemToDelete(null);
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Itens e Serviços</CardTitle>
                            <CardDescription>Gerencie os itens genéricos (equipamentos e serviços) para propostas.</CardDescription>
                        </div>
                        <Button onClick={() => openModal()}><PlusCircle className="mr-2 h-4 w-4" /> Novo Item/Serviço</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[60vh]">
                        <div className="space-y-2 pr-4">
                            {loading ? <div className="text-center py-12 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin mr-2 text-primary" /><span>Carregando itens...</span></div> : items.length === 0 ? <p className="text-center text-muted-foreground py-8">Nenhum item cadastrado.</p> : items.map(item => (
                                <div key={item.id} className="flex items-center justify-between p-3 bg-background border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        {item.type === 'Equipamento' ? <Package className="w-5 h-5 text-primary" /> : <Wrench className="w-5 h-5 text-amber-500" />}
                                        <div>
                                            <p className="font-bold">{item.name}</p>
                                            <p className="text-xs text-muted-foreground">{item.type} {item.capacity ? ` - Capacidade: ${item.capacity}` : ''}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="icon" variant="ghost" onClick={() => openModal(item)} disabled={isSubmitting || isDeleting}><Edit className="w-4 h-4" /></Button>
                                        <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => promptDelete(item)} disabled={isSubmitting || !!isDeleting}>
                                            {isDeleting === item.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{selectedItem ? 'Editar' : 'Novo'} Item/Serviço Comercial</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                                <Label htmlFor="name">Nome do Equipamento/Serviço</Label>
                                <Input id="name" name="name" value={formData.name || ''} onChange={handleChange} className="mt-1" required />
                            </div>
                            <div>
                                <Label htmlFor="type">Tipo</Label>
                                <Combobox
                                    options={typeOptions}
                                    value={formData.type || 'Equipamento'}
                                    onChange={(v) => handleSelectChange('type', v)}
                                    placeholder="Selecione um tipo"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="capacity">Capacidade</Label>
                                <Input id="capacity" name="capacity" value={formData.capacity || ''} onChange={handleChange} className="mt-1" placeholder="Ex: 20T, 15m" />
                            </div>
                            <div>
                                <Label htmlFor="franchise_daily_fixed_hours">Franquia Hora/Dia</Label>
                                <Input id="franchise_daily_fixed_hours" name="franchise_daily_fixed_hours" type="number" step="0.1" value={formData.franchise_daily_fixed_hours || ''} onChange={handleChange} className="mt-1" placeholder="Ex: 8" />
                            </div>
                            <div>
                                <Label htmlFor="days_quantity">Quantidade de Dias</Label>
                                <Input id="days_quantity" name="days_quantity" type="number" value={formData.days_quantity || ''} onChange={handleChange} className="mt-1" placeholder="Ex: 30" />
                            </div>
                        </div>

                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="mobilization_cost">Mobilização (R$)</Label>
                                <Input id="mobilization_cost" name="mobilization_cost" type="number" step="0.01" value={formData.mobilization_cost || ''} onChange={handleChange} className="mt-1" placeholder="0.00" />
                            </div>
                             <div>
                                <Label htmlFor="demobilization_cost">Desmobilização (R$)</Label>
                                <Input id="demobilization_cost" name="demobilization_cost" type="number" step="0.01" value={formData.demobilization_cost || ''} onChange={handleChange} className="mt-1" placeholder="0.00" />
                            </div>
                             <div>
                                <Label htmlFor="fuel_consumption_lph">Consumo (Lts/Hora)</Label>
                                <Input id="fuel_consumption_lph" name="fuel_consumption_lph" type="number" step="0.01" value={formData.fuel_consumption_lph || ''} onChange={handleChange} className="mt-1" placeholder="0.0" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="cost_price_per_hour">Custo por Hora (R$)</Label>
                                <Input id="cost_price_per_hour" name="cost_price_per_hour" type="number" step="0.01" value={formData.cost_price_per_hour || ''} onChange={handleChange} className="mt-1" placeholder="0.00" />
                            </div>
                             <div>
                                <Label htmlFor="selling_price_per_hour">Venda por Hora (R$)</Label>
                                <Input id="selling_price_per_hour" name="selling_price_per_hour" type="number" step="0.01" value={formData.selling_price_per_hour || ''} onChange={handleChange} className="mt-1" placeholder="0.00" />
                            </div>
                        </div>
                        
                        <div>
                            <Label htmlFor="description">Descrição / Observações</Label>
                            <Input id="description" name="description" value={formData.description || ''} onChange={handleChange} className="mt-1" />
                        </div>
                        
                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox id="is_third_party" name="is_third_party" checked={formData.is_third_party || false} onCheckedChange={(checked) => handleChange({ target: { name: 'is_third_party', type: 'checkbox', checked } })} />
                            <Label htmlFor="is_third_party">Este item é de terceiro / sublocado?</Label>
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={closeModal} disabled={isSubmitting}>Cancelar</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {isSubmitting ? (selectedItem ? 'Salvando...' : 'Criando...') : 'Salvar'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <MasterPasswordDialog
                isOpen={isPasswordDialogOpen}
                onClose={() => setIsPasswordDialogOpen(false)}
                onConfirm={handleDelete}
                isSubmitting={!!isDeleting}
                title="Confirmar Exclusão de Item"
                description={`Tem certeza que deseja excluir o item "${itemToDelete?.name}"?`}
            />
        </>
    );
};

export default CommercialItemsManagement;