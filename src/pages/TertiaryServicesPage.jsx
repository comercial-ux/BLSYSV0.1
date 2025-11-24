
import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, PlusCircle, Edit, Trash2, Settings2 } from 'lucide-react';
import TertiaryServiceForm from '@/components/maintenance/TertiaryServiceForm';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import MasterPasswordDialog from '@/components/admin/MasterPasswordDialog';

const TertiaryServicesPage = ({ isTab = false }) => {
    const { commercialData } = useData();
    
    // Local state for fetching services directly
    const [tertiaryServices, setTertiaryServices] = useState([]);
    const [isLoadingServices, setIsLoadingServices] = useState(true);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [serviceToDeactivate, setServiceToDeactivate] = useState(null);
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

    const fetchServices = async () => {
        setIsLoadingServices(true);
        try {
            const { data, error } = await supabase
                .from('tertiary_services')
                .select('*')
                .order('name');
            
            if (error) throw error;
            setTertiaryServices(data || []);
        } catch (error) {
            console.error("Error fetching services:", error);
            toast({ variant: 'destructive', title: 'Erro ao carregar serviços', description: error.message });
        } finally {
            setIsLoadingServices(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const getProviderName = (providerId) => {
        const provider = commercialData?.contacts?.find(c => c.id === providerId);
        return provider ? provider.name : 'N/A';
    };

    const filteredServices = useMemo(() => {
        if (!tertiaryServices) return [];
        return tertiaryServices.filter(service =>
            service.is_active && (
                (service.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (getProviderName(service.provider_contact_id)?.toLowerCase() || '').includes(searchTerm.toLowerCase())
            )
        );
    }, [tertiaryServices, searchTerm, commercialData.contacts]);

    const handleOpenForm = (service = null) => {
        setEditingService(service);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingService(null);
    };

    const handleSave = () => {
        fetchServices();
        handleCloseForm();
    };

    const promptDeactivate = (service) => {
        setServiceToDeactivate(service);
        setIsPasswordDialogOpen(true);
    };

    const handleDeactivate = async () => {
        if (!serviceToDeactivate) return;

        const { error } = await supabase
            .from('tertiary_services')
            .update({ is_active: false })
            .eq('id', serviceToDeactivate.id);
        
        setIsPasswordDialogOpen(false);

        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao inativar serviço', description: error.message });
        } else {
            toast({ title: 'Serviço inativado com sucesso!' });
            fetchServices();
        }
        setServiceToDeactivate(null);
    };

    const pageContent = (
         <div className="flex-grow flex flex-col bg-card p-6 rounded-lg shadow-lg">
            {!isTab && (
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-2"><Settings2 /> Serviços Terceirizados</h1>
                        <p className="text-gray-400">Gerencie os serviços prestados por outras empresas.</p>
                    </div>
                </div>
            )}
            <div className="flex justify-between items-center mb-4">
                <Input
                    placeholder="Buscar por nome ou fornecedor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm bg-background"
                />
                <Button size="lg" onClick={() => handleOpenForm()}>
                    <PlusCircle className="mr-2 h-5 w-5" /> Adicionar Serviço
                </Button>
            </div>
            <ScrollArea className="flex-grow">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Fornecedor</TableHead>
                            <TableHead>Custo Padrão</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoadingServices ? (
                            <TableRow><TableCell colSpan="4" className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                        ) : filteredServices.length > 0 ? (
                            filteredServices.map(service => (
                                <TableRow key={service.id}>
                                    <TableCell className="font-medium">{service.name}</TableCell>
                                    <TableCell>{getProviderName(service.provider_contact_id)}</TableCell>
                                    <TableCell>{service.default_cost ? `R$ ${parseFloat(service.default_cost).toFixed(2)}` : 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="inline-flex items-center">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenForm(service)} title="Editar"><Edit className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-400" title="Inativar" onClick={() => promptDeactivate(service)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan="4" className="text-center py-12">Nenhum serviço encontrado.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </ScrollArea>
        </div>
    );

    return (
        <>
            {!isTab && (
                <Helmet>
                    <title>Serviços Terceirizados | BL Soluções</title>
                    <meta name="description" content="Gerencie os serviços prestados por terceiros." />
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingService ? 'Editar Serviço' : 'Adicionar Novo Serviço'}</DialogTitle>
                        <DialogDescription>
                            Preencha os detalhes do serviço terceirizado.
                        </DialogDescription>
                    </DialogHeader>
                    <TertiaryServiceForm 
                        service={editingService} 
                        onSave={handleSave} 
                        onClose={handleCloseForm}
                    />
                </DialogContent>
            </Dialog>
            <MasterPasswordDialog
                isOpen={isPasswordDialogOpen}
                onClose={() => setIsPasswordDialogOpen(false)}
                onConfirm={handleDeactivate}
                isSubmitting={isLoadingServices}
                title="Confirmar Inativação"
                description={`Tem certeza que deseja inativar o serviço "${serviceToDeactivate?.name}"? Ele não aparecerá mais nas listas, mas seu histórico será mantido.`}
            />
        </>
    );
};

export default TertiaryServicesPage;
