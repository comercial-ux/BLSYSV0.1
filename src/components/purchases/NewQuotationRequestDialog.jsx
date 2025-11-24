
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from '@/components/ui/combobox';

const NewQuotationRequestDialog = ({ isOpen, onOpenChange, onSuccess }) => {
    const { user } = useAuth();
    const { inventory } = useData();
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [purchaseType, setPurchaseType] = useState('new'); // 'new' or 'existing'
    const [existingPartId, setExistingPartId] = useState(null);
    
    // New fields
    const [quantity, setQuantity] = useState('');
    const [requesterInfo, setRequesterInfo] = useState('');

    const inventoryOptions = React.useMemo(() => 
        (inventory || []).map(part => ({
            value: part.id.toString(),
            label: `${part.name} (${part.part_number || 'S/N'})`
        })), [inventory]);

    useEffect(() => {
        if (!isOpen) {
            setDescription('');
            setPurchaseType('new');
            setExistingPartId(null);
            setQuantity('');
            setRequesterInfo('');
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const handleCreateRequest = async (e) => {
        e.preventDefault();
        
        if (purchaseType === 'existing') {
            if (!existingPartId) {
                toast({ variant: 'destructive', title: 'Seleção necessária', description: 'Por favor, selecione um item do estoque.' });
                return;
            }
            if (!quantity || parseFloat(quantity) <= 0) {
                 toast({ variant: 'destructive', title: 'Quantidade necessária', description: 'Por favor, informe uma quantidade válida.' });
                 return;
            }
            if (!requesterInfo || requesterInfo.trim() === '') {
                 toast({ variant: 'destructive', title: 'Informação necessária', description: 'Por favor, informe o solicitante ou contexto.' });
                 return;
            }
        } else {
             if (!description || description.trim() === '') {
                toast({ variant: 'destructive', title: 'Descrição necessária', description: 'Por favor, descreva o que precisa comprar.' });
                return;
            }
        }
        
        setIsSubmitting(true);
        
        let requestDescription = description;
        if (purchaseType === 'existing') {
            const selectedPart = inventory.find(p => p.id === parseInt(existingPartId, 10));
            requestDescription = selectedPart?.name || 'Item de estoque';
        }

        const payload = { 
            description: requestDescription, 
            user_id: user.id, 
            status: 'Em Cotação',
            purchase_type: purchaseType,
            inventory_part_id: purchaseType === 'existing' ? existingPartId : null,
            quantity: purchaseType === 'existing' ? parseFloat(quantity) : null,
            requester_info: purchaseType === 'existing' ? requesterInfo : null
        };

        const { data, error } = await supabase
            .from('quotation_requests')
            .insert([payload])
            .select()
            .single();
        
        setIsSubmitting(false);
        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao criar solicitação', description: error.message });
        } else {
            toast({ title: 'Solicitação criada!', description: 'Agora adicione as propostas recebidas.'});
            onSuccess(data);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Nova Solicitação de Cotação</DialogTitle>
                    <DialogDescription>
                        Escolha se a cotação é para um novo item ou para um item já existente no estoque.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateRequest}>
                    <div className="py-4 space-y-4">
                        <div>
                            <Label>Tipo de Compra</Label>
                             <Select value={purchaseType} onValueChange={setPurchaseType}>
                                <SelectTrigger className="w-full mt-1">
                                    <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="new">Novo Item (Não cadastrado)</SelectItem>
                                    <SelectItem value="existing">Item já Cadastrado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                       
                        {purchaseType === 'new' ? (
                             <div>
                                <Label htmlFor="description">O que você precisa comprar?</Label>
                                <Textarea 
                                    id="description" 
                                    value={description} 
                                    onChange={(e) => setDescription(e.target.value)} 
                                    className="mt-1 h-28" 
                                    placeholder="Ex: 10 litros de óleo 15W40, Filtro de ar para Scania P310..."
                                    required={purchaseType === 'new'}
                                />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="existingPartId">Selecione o Item do Estoque</Label>
                                    <Combobox
                                        options={inventoryOptions}
                                        value={existingPartId}
                                        onChange={setExistingPartId}
                                        placeholder="Selecione um item"
                                        searchPlaceholder="Buscar item..."
                                        emptyText="Nenhum item encontrado."
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="quantity">Quantidade Necessária</Label>
                                    <Input 
                                        id="quantity" 
                                        type="number" 
                                        min="0" 
                                        step="0.01" 
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        placeholder="Ex: 10"
                                        className="mt-1"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="requesterInfo">Solicitante / Motivo</Label>
                                    <Input 
                                        id="requesterInfo" 
                                        value={requesterInfo}
                                        onChange={(e) => setRequesterInfo(e.target.value)}
                                        placeholder="Ex: João - Reposição de estoque da obra X"
                                        className="mt-1"
                                        required
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Salvar e Adicionar Cotações'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default NewQuotationRequestDialog;
