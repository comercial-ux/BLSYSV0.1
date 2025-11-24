
import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, PlusCircle, Eye, ShoppingCart, Package, Archive, Search, Trash2, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import NewQuotationRequestDialog from '@/components/purchases/NewQuotationRequestDialog';
import QuotationDetailView from '@/components/purchases/QuotationDetailView';
import MasterPasswordDialog from '@/components/admin/MasterPasswordDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';

const PurchasesPage = ({ isTab = false, uploadImages }) => {
    const { toast } = useToast();
    
    // Local state for data fetching since it might be missing from global context
    const [quotationRequests, setQuotationRequests] = useState([]);
    const [quotations, setQuotations] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [viewingRequest, setViewingRequest] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showOnlyOpen, setShowOnlyOpen] = useState(true);
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [requestToDelete, setRequestToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchData = async () => {
        setIsLoadingData(true);
        try {
            const { data: requests, error: reqError } = await supabase
                .from('quotation_requests')
                .select('*')
                .order('created_at', { ascending: false });
                
            const { data: quotes, error: quoteError } = await supabase
                .from('quotations')
                .select('*');
                
            if (reqError) throw reqError;
            if (quoteError) throw quoteError;
            
            setQuotationRequests(requests || []);
            setQuotations(quotes || []);
        } catch (error) {
            console.error("Error fetching purchases data:", error);
            toast({ variant: 'destructive', title: 'Erro ao carregar dados', description: error.message });
        } finally {
            setIsLoadingData(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSuccess = (newRequest) => {
        fetchData();
        setIsRequestModalOpen(false);
        setViewingRequest(newRequest);
    };

    const handleDeleteClick = (request) => {
        setRequestToDelete(request);
        setIsPasswordDialogOpen(true);
    };
    
    const handleConfirmPurchaseClick = (request) => {
        if (request.status !== 'Finalizado') {
            toast({
                variant: 'destructive',
                title: 'Ação não permitida',
                description: 'A compra só pode ser confirmada para cotações com status "Finalizado".',
            });
            return;
        }
        setViewingRequest(request);
    };

    const handleConfirmDelete = async () => {
        if (!requestToDelete) return;
        setIsDeleting(true);

        const { error: quotationsError } = await supabase
            .from('quotations')
            .delete()
            .eq('request_id', requestToDelete.id);

        if (quotationsError) {
            toast({
                variant: 'destructive',
                title: 'Erro ao excluir propostas associadas',
                description: quotationsError.message,
            });
            setIsDeleting(false);
            return;
        }

        const { error: requestError } = await supabase
            .from('quotation_requests')
            .delete()
            .eq('id', requestToDelete.id);
        
        setIsPasswordDialogOpen(false);
        setIsDeleting(false);

        if (requestError) {
            toast({
                variant: 'destructive',
                title: 'Erro ao excluir solicitação',
                description: requestError.message,
            });
        } else {
            toast({
                title: 'Solicitação excluída!',
                description: 'A solicitação de cotação e todas as suas propostas foram removidas.',
            });
            fetchData();
            setRequestToDelete(null);
        }
    };


    const getStatusBadge = (status) => {
        const baseClasses = "px-2 py-1 text-xs font-bold rounded-full";
        switch (status) {
            case 'Em Cotação': return <span className={`${baseClasses} bg-yellow-500 text-black`}>{status}</span>;
            case 'Finalizado': return <span className={`${baseClasses} bg-green-500 text-white`}>{status}</span>;
            case 'Encerrada': return <span className={`${baseClasses} bg-blue-500 text-white`}>{status}</span>;
            default: return <span className={`${baseClasses} bg-gray-400 text-white`}>{status}</span>;
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'new': return <Package className="w-5 h-5 text-yellow-400" title="Novo Item" />;
            case 'existing': return <Archive className="w-5 h-5 text-blue-400" title="Item de Estoque" />;
            default: return null;
        }
    };

    const filteredRequests = useMemo(() => {
        let requests = [...quotationRequests].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        if (showOnlyOpen) {
            requests = requests.filter(req => req.status === 'Em Cotação' || req.status === 'Finalizado');
        }

        if (searchTerm) {
            const lowercasedFilter = searchTerm.toLowerCase();
            
            const requestIdsFromQuotations = quotations
                .filter(q => q.supplier_name && q.supplier_name.toLowerCase().includes(lowercasedFilter))
                .map(q => q.request_id);

            requests = requests.filter(req => {
                const matchesDescription = req.description.toLowerCase().includes(lowercasedFilter);
                const matchesDate = format(new Date(req.created_at), 'dd/MM/yyyy').includes(lowercasedFilter);
                const matchesSupplier = requestIdsFromQuotations.includes(req.id);
                return matchesDescription || matchesDate || matchesSupplier;
            });
        }

        return requests;
    }, [quotationRequests, quotations, searchTerm, showOnlyOpen]);
    
    const pageContent = (
         <Card className="flex-grow flex flex-col">
            {!isTab && (
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2"><ShoppingCart /> Painel de Cotações</CardTitle>
                            <CardDescription>Crie e gerencie suas solicitações de compra.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
            )}
            <CardContent className="flex-grow flex flex-col">
                 <div className="flex justify-between items-center mb-4 gap-4">
                    <div className="flex-grow relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Pesquisar por peça, fornecedor ou data (dd/mm/yyyy)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-full"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="showOpen" checked={showOnlyOpen} onCheckedChange={setShowOnlyOpen} />
                        <Label htmlFor="showOpen" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Mostrar apenas em aberto
                        </Label>
                    </div>
                    <Button size="lg" onClick={() => setIsRequestModalOpen(true)}>
                        <PlusCircle className="mr-2 h-5 w-5" /> Nova Solicitação de Cotação
                    </Button>
                </div>
                <ScrollArea className="h-[calc(100vh-340px)] pr-4">
                    <div className="space-y-3">
                       {isLoadingData ? (
                            <div className="text-center py-12 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin mr-2 text-primary" /><span>Carregando cotações...</span></div>
                        ) : filteredRequests.length > 0 ? (
                            filteredRequests.map(req => (
                                <div key={req.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-4">
                                        {getTypeIcon(req.purchase_type)}
                                        <div>
                                            <p className="font-bold text-white text-lg">{req.description}</p>
                                            <div className="text-sm text-gray-400 flex flex-col sm:flex-row sm:gap-4">
                                                <span>Solicitado em: {format(new Date(req.created_at), 'dd/MM/yyyy HH:mm')}</span>
                                                {req.quantity && (
                                                    <span className="text-blue-400 font-medium">Qtd: {req.quantity}</span>
                                                )}
                                                {req.requester_info && (
                                                    <span className="text-yellow-400 truncate max-w-[200px]" title={req.requester_info}>
                                                        Ref: {req.requester_info}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {getStatusBadge(req.status)}
                                        {req.status === 'Finalizado' && (
                                            <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleConfirmPurchaseClick(req)}>
                                                <CheckCircle className="mr-2 h-4 w-4" /> Confirmar Compra
                                            </Button>
                                        )}
                                        <Button variant="outline" onClick={() => setViewingRequest(req)}><Eye className="mr-2 h-4 w-4"/> Gerenciar</Button>
                                        <Button variant="destructive" size="icon" onClick={() => handleDeleteClick(req)} disabled={isDeleting}>
                                            {isDeleting && requestToDelete?.id === req.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12">
                                <ShoppingCart className="w-16 h-16 mx-auto text-gray-500 mb-4" />
                                <h3 className="text-xl font-semibold text-gray-300">Nenhuma solicitação encontrada</h3>
                                <p className="text-gray-400">Crie uma nova solicitação ou ajuste seus filtros.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );

    return (
        <>
            {!isTab && (
                <Helmet>
                    <title>Compras | BL Soluções</title>
                    <meta name="description" content="Gerencie suas cotações e solicitações de compra." />
                </Helmet>
            )}
            <motion.div 
                initial={!isTab ? { opacity: 0, y: 20 } : false} 
                animate={{ opacity: 1, y: 0 }} 
                className="h-full flex flex-col"
            >
                {pageContent}
            </motion.div>
            
            <NewQuotationRequestDialog
                isOpen={isRequestModalOpen}
                onOpenChange={setIsRequestModalOpen}
                onSuccess={handleSuccess}
            />
            
            <Dialog open={!!viewingRequest} onOpenChange={() => setViewingRequest(null)}>
                {viewingRequest && 
                    <QuotationDetailView 
                        request={viewingRequest} 
                        onUpdate={() => fetchData()} 
                        onClose={() => setViewingRequest(null)} 
                        uploadImages={uploadImages} 
                    />
                }
            </Dialog>

            <MasterPasswordDialog
                isOpen={isPasswordDialogOpen}
                onClose={() => setIsPasswordDialogOpen(false)}
                onConfirm={handleConfirmDelete}
                isSubmitting={isDeleting}
                title="Confirmar Exclusão"
                description={`Tem certeza que deseja excluir permanentemente a solicitação "${requestToDelete?.description}" e todas as suas propostas? Esta ação não pode ser desfeita.`}
            />
        </>
    );
};

export default PurchasesPage;
