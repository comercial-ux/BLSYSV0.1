import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, PlusCircle, Edit, Trash2, Package, Eye, Printer, ClipboardList } from 'lucide-react';
import InventoryForm from '@/components/inventory/InventoryForm';
import { useReactToPrint } from 'react-to-print';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import useAppHandlers from '@/hooks/useAppHandlers';
import InventoryMovementExtract from '@/components/inventory/InventoryMovementExtract';
import MasterPasswordDialog from '@/components/admin/MasterPasswordDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ToolLoanPage from '@/pages/ToolLoanPage';

const InventoryItemSheet = React.forwardRef(({ item }, ref) => {
    if (!item) return null;

    return (
        <div ref={ref} className="p-8 font-sans text-gray-800 bg-white">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold border-b-2 pb-2">Ficha de Item de Estoque</h1>
            </div>
            
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm mb-8">
                <div><strong>Nome do Item:</strong> <span className="font-light">{item.name}</span></div>
                <div><strong>Part Number:</strong> <span className="font-light">{item.part_number || 'N/A'}</span></div>
                <div><strong>Quantidade em Estoque:</strong> <span className="font-light">{item.quantity} {item.unit}</span></div>
                <div><strong>Preço de Compra:</strong> <span className="font-light">{item.purchase_price ? `R$ ${parseFloat(item.purchase_price).toFixed(2)}` : 'N/A'}</span></div>
                <div><strong>Fornecedor:</strong> <span className="font-light">{item.supplier || 'N/A'}</span></div>
                <div><strong>Localização:</strong> <span className="font-light">{item.location || 'N/A'}</span></div>
                <div><strong>Data de Validade:</strong> <span className="font-light">{item.expiry_date ? new Date(item.expiry_date).toLocaleDateString('pt-BR') : 'N/A'}</span></div>
            </div>

            <div className="mb-8">
                <h2 className="text-xl font-semibold border-b pb-1 mb-2">Observações</h2>
                <p className="font-light whitespace-pre-wrap">{item.notes || 'Nenhuma observação.'}</p>
            </div>
            
            <div>
                <h2 className="text-xl font-semibold border-b pb-1 mb-4">Fotos</h2>
                {item.photo_urls && item.photo_urls.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                        {item.photo_urls.map((url, index) => (
                            <div key={index} className="border p-2 rounded-lg">
                                <img src={url} alt={`Foto ${index + 1}`} className="w-full h-auto object-contain rounded" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="font-light">Nenhuma foto cadastrada para este item.</p>
                )}
            </div>

            <div className="mt-12 text-center text-xs text-gray-500">
                <p>Gerado em: {new Date().toLocaleString('pt-BR')}</p>
            </div>
        </div>
    );
});


const InventoryPage = ({ isTab = false, category = 'peca', title = 'Peças', showLoanManagement = false }) => {
    const { inventory, loading, refetchData } = useData();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false);
    const [itemForSheet, setItemForSheet] = useState(null);
    const [isExtractOpen, setIsExtractOpen] = useState(false);
    const [itemForExtract, setItemForExtract] = useState(null);
    const sheetRef = useRef();
    const [itemToDeactivate, setItemToDeactivate] = useState(null);
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    
    const { uploadImages } = useAppHandlers({ refetchData });

    const handlePrint = useReactToPrint({
        content: () => sheetRef.current,
        documentTitle: `Ficha-Item-${itemForSheet?.name.replace(/\s/g, '_') || 'sem_nome'}`,
        onAfterPrint: () => setItemForSheet(null)
    });

    useEffect(() => {
        if (itemForSheet) {
            handlePrint();
        }
    }, [itemForSheet, handlePrint]);

    const filteredInventory = useMemo(() => {
        if (!inventory) return [];
        return inventory.filter(item =>
            item.category === category &&
            item.is_active && (
                (item.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (item.part_number?.toLowerCase() || '').includes(searchTerm.toLowerCase())
            )
        );
    }, [inventory, searchTerm, category]);

    const handleOpenForm = (item = null) => {
        setEditingItem(item);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingItem(null);
    };

    const handleOpenPhotoViewer = (item) => {
        setEditingItem(item);
        setIsPhotoViewerOpen(true);
    };

    const handleOpenExtract = (item) => {
        setItemForExtract(item);
        setIsExtractOpen(true);
    };
    
    const handleCloseExtract = () => {
        setIsExtractOpen(false);
        setItemForExtract(null);
    }

    const handleSave = () => {
        refetchData();
        handleCloseForm();
    };
    
    const promptDeactivate = (item) => {
        setItemToDeactivate(item);
        setIsPasswordDialogOpen(true);
    };

    const handleDeactivate = async () => {
        if (!itemToDeactivate) return;

        const { error } = await supabase
            .from('inventory_parts')
            .update({ is_active: false })
            .eq('id', itemToDeactivate.id);
        
        setIsPasswordDialogOpen(false);

        if (error) {
            let description = error.message;
            if (error.code === '23503') {
                description = "Este item não pode ser excluído pois possui movimentações de estoque registradas. Ele foi inativado.";
            }
            toast({ variant: 'destructive', title: 'Erro ao inativar item', description });
        } else {
            toast({ title: 'Item inativado com sucesso!' });
            refetchData();
        }
        setItemToDeactivate(null);
    };

    const inventoryListContent = (
        <div className="flex-grow flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <Input
                    placeholder="Buscar por nome ou part number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm bg-background"
                />
                <Button size="lg" onClick={() => handleOpenForm()}>
                    <PlusCircle className="mr-2 h-5 w-5" /> Adicionar Item
                </Button>
            </div>
            <ScrollArea className="flex-grow">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Part Number</TableHead>
                            <TableHead>Quantidade</TableHead>
                            <TableHead>Fornecedor</TableHead>
                            <TableHead>Localização</TableHead>
                            <TableHead>Validade</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan="7" className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                        ) : filteredInventory.length > 0 ? (
                            filteredInventory.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell>{item.part_number}</TableCell>
                                    <TableCell>{item.quantity} {item.unit}</TableCell>
                                    <TableCell>{item.supplier}</TableCell>
                                    <TableCell>{item.location}</TableCell>
                                    <TableCell>{item.expiry_date ? new Date(item.expiry_date).toLocaleDateString('pt-BR') : ''}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="inline-flex items-center">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenPhotoViewer(item)} title="Ver Fotos"><Eye className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => setItemForSheet(item)} title="Imprimir Ficha"><Printer className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenExtract(item)} title="Extrato de Movimentação"><ClipboardList className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenForm(item)} title="Editar"><Edit className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-400" title="Inativar" onClick={() => promptDeactivate(item)}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan="7" className="text-center py-12">Nenhum item encontrado.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </ScrollArea>
        </div>
    );

    const pageContent = (
        <div className="flex-grow flex flex-col bg-card p-6 rounded-lg shadow-lg">
            {!isTab && (
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-2"><Package /> {title}</h1>
                        <p className="text-gray-400">Gerencie os itens do seu estoque.</p>
                    </div>
                </div>
            )}
            
            {isTab && (
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">{title}</h1>
                        <p className="text-gray-400">Gerencie os itens e empréstimos desta categoria.</p>
                    </div>
                </div>
            )}

            {showLoanManagement ? (
                <Tabs defaultValue="inventory" className="w-full flex-grow flex flex-col">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="inventory">Estoque de Ferramentas</TabsTrigger>
                        <TabsTrigger value="loans">Controle de Empréstimos</TabsTrigger>
                    </TabsList>
                    <TabsContent value="inventory" className="flex-grow mt-4">
                        {inventoryListContent}
                    </TabsContent>
                    <TabsContent value="loans" className="flex-grow mt-4">
                        <ToolLoanPage isSubTab={true} />
                    </TabsContent>
                </Tabs>
            ) : (
                inventoryListContent
            )}

        </div>
    );

    return (
        <>
            {!isTab && (
                <Helmet>
                    <title>{title} | BL Soluções</title>
                    <meta name="description" content={`Gerencie seu inventário de ${title.toLowerCase()}.`} />
                </Helmet>
            )}
            <motion.div 
                initial={!isTab ? { opacity: 0, y: 20 } : false} 
                animate={{ opacity: 1, y: 0 }} 
                className="h-full flex flex-col"
            >
                {pageContent}
            </motion.div>
            
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{editingItem ? 'Editar Item' : 'Adicionar Nova Ferramenta'}</DialogTitle>
                        <DialogDescription>
                            Preencha os detalhes do item para adicioná-lo ou atualizá-lo no inventário de ferramentas.
                        </DialogDescription>
                    </DialogHeader>
                    <InventoryForm 
                        part={editingItem} 
                        onSave={handleSave} 
                        onClose={handleCloseForm}
                        uploadImages={uploadImages}
                        defaultCategory={category}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={isPhotoViewerOpen} onOpenChange={setIsPhotoViewerOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Fotos de: {editingItem?.name}</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="max-h-[70vh] mt-4">
                        {(editingItem?.photo_urls && editingItem.photo_urls.length > 0) ? (
                            <div className="grid grid-cols-2 gap-4 p-1">
                                {editingItem.photo_urls.map((url, index) => (
                                    typeof url === 'string' && url.trim() !== '' ?
                                        <img key={index} src={url} alt={`Foto ${index + 1}`} className="w-full h-auto rounded-lg object-contain" />
                                        : null
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-muted-foreground py-10">Nenhuma foto cadastrada para este item.</p>
                        )}
                    </ScrollArea>
                </DialogContent>
            </Dialog>

            <Dialog open={isExtractOpen} onOpenChange={handleCloseExtract}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Extrato de Movimentação</DialogTitle>
                        <DialogDescription>Histórico de entradas e saídas para o item: {itemForExtract?.name}</DialogDescription>
                    </DialogHeader>
                    {itemForExtract && <InventoryMovementExtract part={itemForExtract} />}
                </DialogContent>
            </Dialog>
            
             <MasterPasswordDialog
                isOpen={isPasswordDialogOpen}
                onClose={() => setIsPasswordDialogOpen(false)}
                onConfirm={handleDeactivate}
                isSubmitting={loading}
                title="Confirmar Inativação"
                description={`Tem certeza que deseja inativar o item "${itemToDeactivate?.name}"? Ele não aparecerá mais nas listas, mas seu histórico será mantido.`}
            />

            <div className="hidden">
                 <InventoryItemSheet item={itemForSheet} ref={sheetRef} />
            </div>
        </>
    );
};

export default InventoryPage;