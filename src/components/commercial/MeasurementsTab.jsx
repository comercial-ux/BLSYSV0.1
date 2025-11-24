
import React, { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PlusCircle, Edit, Trash2, FileBarChart2, CheckCircle, AlertCircle, Printer, Eye, Layers, FolderPlus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MeasurementForm from './MeasurementForm';
import MeasurementView from './MeasurementView';
import MeasurementGroupList from './MeasurementGroupList';
import MeasurementGroupingDialog from './MeasurementGroupingDialog';
import { useData } from '@/contexts/DataContext';
import { supabase } from '@/lib/customSupabaseClient';
import MasterPasswordDialog from '@/components/admin/MasterPasswordDialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const MeasurementsTab = ({ onUpdateNeeded }) => {
    const { commercialData, operationalData, refetchData } = useData();
    const [measurements, setMeasurements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isGroupingModalOpen, setIsGroupingModalOpen] = useState(false);
    const [selectedMeasurement, setSelectedMeasurement] = useState(null);
    const [measurementToDelete, setMeasurementToDelete] = useState(null);
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("individual");

    useEffect(() => {
        const openMeasurements = commercialData.measurements?.filter(m => m.status !== 'approved') || [];
        setMeasurements(openMeasurements);
        setLoading(false);
    }, [commercialData.measurements]);

    const openFormModal = (measurement = null) => {
        setSelectedMeasurement(measurement);
        setIsFormModalOpen(true);
    };

    const closeFormModal = () => {
        setSelectedMeasurement(null);
        setIsFormModalOpen(false);
    };
    
    const openViewModal = (measurement) => {
        setSelectedMeasurement(measurement);
        setIsViewModalOpen(true);
    };

    const handleSave = () => {
        refetchData();
        if(onUpdateNeeded) onUpdateNeeded();
        closeFormModal();
    };

    const promptDelete = (measurement) => {
        setMeasurementToDelete(measurement);
        setIsPasswordDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!measurementToDelete) return;
        const { error } = await supabase.from('measurements').delete().eq('id', measurementToDelete.id);
        setIsPasswordDialogOpen(false);
        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao excluir medição', description: error.message });
        } else {
            toast({ title: 'Medição excluída com sucesso!' });
            refetchData();
        }
        setMeasurementToDelete(null);
    };

    const handleApprove = async (measurementId) => {
        const { error } = await supabase
            .from('measurements')
            .update({ status: 'approved' })
            .eq('id', measurementId);

        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao aprovar medição', description: error.message });
        } else {
            toast({ title: 'Medição aprovada e enviada para faturamento!' });
            refetchData();
             if(onUpdateNeeded) onUpdateNeeded();
        }
    };
    
    const getStatusBadge = (status) => {
        const baseClasses = "px-2 py-1 text-xs font-bold rounded-full";
        switch (status) {
            case 'open': return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>Aberta</span>;
            case 'approved': return <span className={`${baseClasses} bg-green-100 text-green-800`}>Aprovada</span>;
            default: return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{status}</span>;
        }
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Medições</CardTitle>
                            <CardDescription>Gerencie medições individuais ou agrupe-as para faturamento consolidado.</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsGroupingModalOpen(true)}>
                                <Layers className="mr-2 h-4 w-4" />
                                Agrupar
                            </Button>
                            <Button onClick={() => openFormModal()}>
                                <PlusCircle className="mr-2 h-4 w-4" /> 
                                Nova Medição
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-4">
                            <TabsTrigger value="individual">Individuais</TabsTrigger>
                            <TabsTrigger value="groups">Agrupamentos</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="individual">
                            <ScrollArea className="h-[60vh]">
                                <div className="space-y-3 pr-4">
                                    {loading ? (
                                        <p>Carregando medições...</p>
                                    ) : measurements.length > 0 ? (
                                        measurements.map(m => (
                                            <div key={m.id} className="flex items-center justify-between p-4 bg-background border rounded-lg hover:bg-muted/50 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <FileBarChart2 className="w-6 h-6 text-primary" />
                                                    <div>
                                                        <p className="font-bold text-foreground">Medição #{m.id} - Job #{m.job?.job_code}</p>
                                                        <p className="text-sm text-muted-foreground">{m.proposal?.contacts?.name || 'Cliente não encontrado'}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Período: {new Date(m.start_date + 'T00:00:00').toLocaleDateString()} a {new Date(m.end_date + 'T00:00:00').toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="font-bold text-lg text-foreground">R$ {parseFloat(m.total_value || 0).toFixed(2)}</span>
                                                    {getStatusBadge(m.status)}
                                                    <div className="flex gap-2">
                                                         <AlertDialog>
                                                          <AlertDialogTrigger asChild>
                                                            <Button size="sm" variant="outline" className="bg-green-500 hover:bg-green-600 text-white"><CheckCircle className="w-4 h-4 mr-2" /> Aprovar</Button>
                                                          </AlertDialogTrigger>
                                                          <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <div className="flex items-center gap-3">
                                                                    <AlertCircle className="w-10 h-10 text-yellow-500"/>
                                                                    <AlertDialogTitle className="text-xl">Aprovar e Enviar para Faturamento?</AlertDialogTitle>
                                                                </div>
                                                              <AlertDialogDescription className="pt-2">
                                                                Esta ação moverá a medição para a aba "Faturamento" e não poderá ser editada aqui. Deseja continuar?
                                                              </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                              <AlertDialogAction onClick={() => handleApprove(m.id)} className="bg-green-600 hover:bg-green-700">Sim, Aprovar</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                          </AlertDialogContent>
                                                        </AlertDialog>
                                                        <Button size="icon" variant="ghost" onClick={() => openViewModal(m)} title="Visualizar/Imprimir"><Printer className="w-4 h-4" /></Button>
                                                        <Button size="icon" variant="ghost" onClick={() => openFormModal(m)} title="Editar"><Edit className="w-4 h-4" /></Button>
                                                        <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => promptDelete(m)} title="Excluir"><Trash2 className="w-4 h-4" /></Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12">
                                            <FileBarChart2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                                            <h3 className="text-xl font-semibold text-foreground">Nenhuma medição em aberto</h3>
                                            <p className="text-muted-foreground">Crie uma nova medição ou verifique a aba de Faturamento.</p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                        
                        <TabsContent value="groups">
                            <MeasurementGroupList onUpdateNeeded={() => {
                                refetchData();
                                if(onUpdateNeeded) onUpdateNeeded();
                            }} />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
                <DialogContent className="max-w-6xl">
                    <DialogHeader>
                        <DialogTitle>{selectedMeasurement ? 'Editar' : 'Criar Nova'} Medição</DialogTitle>
                    </DialogHeader>
                    <MeasurementForm 
                        measurement={selectedMeasurement} 
                        onSave={handleSave} 
                        onClose={closeFormModal} 
                        operationalData={operationalData}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                <DialogContent className="max-w-6xl">
                    <DialogHeader>
                        <DialogTitle>Visualizar Medição #{selectedMeasurement?.id}</DialogTitle>
                    </DialogHeader>
                    {selectedMeasurement && <MeasurementView measurement={selectedMeasurement} />}
                </DialogContent>
            </Dialog>

            <MeasurementGroupingDialog 
                isOpen={isGroupingModalOpen}
                onClose={() => setIsGroupingModalOpen(false)}
                onSuccess={() => {
                    refetchData();
                    setActiveTab("groups");
                }}
            />

             <MasterPasswordDialog
                isOpen={isPasswordDialogOpen}
                onClose={() => setIsPasswordDialogOpen(false)}
                onConfirm={handleDelete}
                title="Confirmar Exclusão de Medição"
                description={`Tem certeza que deseja excluir a medição #${measurementToDelete?.id}? Esta ação não pode ser desfeita.`}
            />
        </>
    );
};

export default MeasurementsTab;
