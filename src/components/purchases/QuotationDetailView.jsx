import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, PlusCircle, CheckCircle, XCircle, PackagePlus, FileText, AlertTriangle } from 'lucide-react';
import QuotationProposalForm from '@/components/purchases/QuotationProposalForm';
import InventoryForm from '@/components/inventory/InventoryForm';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

const QuotationDetailView = ({ request, onUpdate, onClose, uploadImages }) => {
    const { refetchData } = useData();
    const [quotations, setQuotations] = useState([]);
    const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
    const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedQuotation, setSelectedQuotation] = useState(null);
    const [quantityToPurchase, setQuantityToPurchase] = useState(1);

    const fetchRelatedQuotations = async () => {
        if (!request?.id) return;
        const { data, error } = await supabase
            .from('quotations')
            .select('*')
            .eq('request_id', request.id)
            .order('price', { ascending: true });
        
        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao buscar propostas', description: error.message });
            setQuotations([]);
        } else {
            setQuotations(data);
        }
    };
    
    useEffect(() => {
        fetchRelatedQuotations();
    }, [request.id]);

    const handleUpdate = () => {
        fetchRelatedQuotations();
        refetchData();
    }


    const handleChooseProposal = async (proposalId) => {
        setIsProcessing(true);
        
        const { error: updateRequestError } = await supabase
            .from('quotation_requests')
            .update({ status: 'Finalizado' })
            .eq('id', request.id);

        if (updateRequestError) {
            toast({ variant: 'destructive', title: 'Erro ao finalizar solicitação', description: updateRequestError.message });
            setIsProcessing(false);
            return;
        }

        const { error: updateProposalError } = await supabase
            .from('quotations')
            .update({ is_chosen: true })
            .eq('id', proposalId);
            
        setIsProcessing(false);
        if (updateProposalError) {
            toast({ variant: 'destructive', title: 'Erro ao marcar proposta', description: updateProposalError.message });
        } else {
            toast({ title: 'Cotação finalizada!', description: 'A proposta foi marcada como vencedora.' });
            handleUpdate();
            onUpdate(); // Prop function to update parent state
        }
    };
    
    const handleReopenRequest = async () => {
        setIsProcessing(true);
        const { error } = await supabase
            .from('quotation_requests')
            .update({ status: 'Em Cotação' })
            .eq('id', request.id);
        
        const chosenProposal = quotations.find(q => q.is_chosen);
        if (chosenProposal) {
            await supabase.from('quotations').update({ is_chosen: false }).eq('id', chosenProposal.id);
        }

        setIsProcessing(false);
        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao reabrir solicitação', description: error.message });
        } else {
            toast({ title: 'Solicitação Reaberta' });
            handleUpdate();
            onUpdate();
        }
    }

    const openConfirmationModal = (quotation) => {
        setSelectedQuotation(quotation);
        setIsInventoryModalOpen(true);
    };

    const handleConfirmNewItemPurchase = async (formData) => {
        setIsProcessing(true);
        
        const { error } = await supabase.from('inventory_parts').insert([formData]).select().single();
    
        if (error) {
            setIsProcessing(false);
            toast({ variant: 'destructive', title: 'Erro ao adicionar item ao estoque', description: error.message });
            return;
        }
    
        await supabase.from('quotation_requests').update({ status: 'Encerrada' }).eq('id', request.id);
    
        setIsProcessing(false);
        toast({ title: 'Compra confirmada!', description: 'O novo item foi adicionado ao estoque e a cotação encerrada.' });
        onUpdate();
        setIsInventoryModalOpen(false);
        refetchData();
    };
    
    const handleConfirmExistingItemPurchase = async () => {
        setIsProcessing(true);
        const partId = request.inventory_part_id;
        const qty = parseInt(quantityToPurchase, 10);
    
        if (isNaN(qty) || qty <= 0) {
            toast({ variant: 'destructive', title: 'Quantidade inválida', description: 'Informe um número maior que zero.' });
            setIsProcessing(false);
            return;
        }
    
        const { data: currentPart, error: fetchError } = await supabase
            .from('inventory_parts')
            .select('quantity')
            .eq('id', partId)
            .single();
    
        if (fetchError || !currentPart) {
            toast({ variant: 'destructive', title: 'Erro ao buscar item', description: fetchError?.message || 'Item não encontrado.' });
            setIsProcessing(false);
            return;
        }
    
        const newQuantity = currentPart.quantity + qty;
        const { error: updateError } = await supabase
            .from('inventory_parts')
            .update({ quantity: newQuantity })
            .eq('id', partId);
    
        if (updateError) {
            toast({ variant: 'destructive', title: 'Erro ao atualizar estoque', description: updateError.message });
            setIsProcessing(false);
            return;
        }
    
        await supabase.from('quotation_requests').update({ status: 'Encerrada' }).eq('id', request.id);
    
        setIsProcessing(false);
        toast({ title: 'Compra confirmada!', description: `${qty} unidade(s) adicionada(s) ao estoque.` });
        onUpdate();
        setIsInventoryModalOpen(false);
        refetchData();
    };

    const isFinalized = request.status === 'Finalizado';
    const isClosed = request.status === 'Encerrada';

    const renderConfirmationContent = () => {
        if (request.purchase_type === 'new') {
            const partData = {
                name: request.description,
                supplier_contact_id: selectedQuotation?.supplier_contact_id,
                supplier: selectedQuotation?.supplier_name,
                purchase_price: selectedQuotation?.price,
                quantity: 1,
                category: 'peca'
            };
            return (
                <InventoryForm 
                    part={partData}
                    onSave={handleConfirmNewItemPurchase}
                    onClose={() => setIsInventoryModalOpen(false)}
                    uploadImages={uploadImages}
                    isPurchaseContext={true}
                />
            );
        } else {
             return (
                <div className="space-y-4">
                    <p>Você está confirmando a compra para o item de estoque: <strong>{request.description}</strong>.</p>
                    <p>Fornecedor: <strong>{selectedQuotation?.supplier_name}</strong></p>
                    <p>Preço Unitário: <strong>R$ {parseFloat(selectedQuotation?.price || 0).toFixed(2)}</strong></p>
                    <div>
                        <Label htmlFor="quantityToPurchase">Quantidade Comprada</Label>
                        <Input 
                            id="quantityToPurchase"
                            type="number"
                            value={quantityToPurchase}
                            onChange={(e) => setQuantityToPurchase(e.target.value)}
                            className="mt-1"
                            min="1"
                        />
                    </div>
                    <Button onClick={handleConfirmExistingItemPurchase} disabled={isProcessing} className="w-full">
                        {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : 'Confirmar e Adicionar ao Estoque'}
                    </Button>
                </div>
            );
        }
    };
    
    return (
        <DialogContent className="max-w-4xl">
            <DialogHeader>
                <DialogTitle>Gerenciar Cotação #{request.id}</DialogTitle>
                <div className='flex items-center gap-2 pt-2'>
                    {request.purchase_type === 'existing' && <span className="text-sm font-semibold bg-blue-500/20 text-blue-300 px-2 py-1 rounded-md">Item de Estoque</span>}
                    <DialogDescription className="text-lg font-semibold text-primary ">{request.description}</DialogDescription>
                </div>
            </DialogHeader>
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold">Propostas Recebidas</h3>
                    {!isFinalized && !isClosed ? (
                        <Button onClick={() => setIsProposalModalOpen(true)}>
                            <PlusCircle className="w-4 h-4 mr-2" /> Adicionar Proposta
                        </Button>
                    ) : (
                         <Button variant="outline" onClick={handleReopenRequest} disabled={isProcessing || isClosed}>
                            {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />} Reabrir Cotação
                        </Button>
                    )}
                </div>

                <ScrollArea className="h-[40vh]">
                    <div className="space-y-3 pr-4">
                        {quotations.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">Nenhuma proposta adicionada ainda.</p>
                        ) : (
                            quotations.map(q => (
                                <div key={q.id} className={`p-4 rounded-lg flex justify-between items-center transition-all ${q.is_chosen ? 'bg-green-500/20 border-2 border-green-500' : 'bg-card'}`}>
                                    <div>
                                        <p className="font-bold text-lg">{q.supplier_name}</p>
                                        <p className="text-primary text-2xl font-bold">R$ {parseFloat(q.price || 0).toFixed(2)}</p>
                                        <p className="text-sm text-muted-foreground">{q.notes}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {q.proposal_file_url && (
                                            <Button asChild variant="outline">
                                                <a href={q.proposal_file_url} target="_blank" rel="noopener noreferrer">
                                                    <FileText className="w-4 h-4 mr-2" /> Ver Proposta
                                                </a>
                                            </Button>
                                        )}
                                        {!isFinalized && !isClosed ? (
                                            <Button onClick={() => handleChooseProposal(q.id)} disabled={isProcessing}>
                                                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin"/> : '✅ Escolher esta proposta'}
                                            </Button>
                                        ) : q.is_chosen && (
                                            <div className="flex items-center gap-2 text-green-400 font-bold">
                                                <CheckCircle />
                                                <span>Escolhida</span>
                                            </div>
                                        )}
                                        {isFinalized && q.is_chosen && (
                                            <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => openConfirmationModal(q)} disabled={isProcessing}>
                                                <PackagePlus className="w-4 h-4 mr-2" /> Confirmar Compra
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>
            <Dialog open={isProposalModalOpen} onOpenChange={setIsProposalModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adicionar Nova Proposta</DialogTitle>
                    </DialogHeader>
                    <QuotationProposalForm 
                        requestId={request.id} 
                        onSave={() => { handleUpdate(); setIsProposalModalOpen(false); }} 
                        onClose={() => setIsProposalModalOpen(false)} 
                    />
                </DialogContent>
            </Dialog>
            <Dialog open={isInventoryModalOpen} onOpenChange={setIsInventoryModalOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Confirmar Compra e Dar Entrada no Estoque</DialogTitle>
                        <DialogDescription>
                            A solicitação de cotação será marcada como "Encerrada".
                        </DialogDescription>
                    </DialogHeader>
                    {selectedQuotation && renderConfirmationContent()}
                </DialogContent>
            </Dialog>
        </DialogContent>
    );
};

export default QuotationDetailView;