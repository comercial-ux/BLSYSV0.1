import React, { useState, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Edit, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import EditEquipmentForm from '@/components/forms/EditEquipmentForm';
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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const VehicleManagementTab = ({ equipments, onUpdate }) => {
    const { toast } = useToast();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showInactive, setShowInactive] = useState(false);
    const [showSupportVehicles, setShowSupportVehicles] = useState(false);

    const filteredEquipments = useMemo(() => {
        let filtered = equipments || [];

        if (!showInactive) {
            filtered = filtered.filter(eq => eq.is_active !== false); // Show active and null is_active
        }

        if (!showSupportVehicles) {
            filtered = filtered.filter(eq => eq.equipment_type !== 'passeio' && eq.equipment_type !== 'apoio');
        }

        return filtered;
    }, [equipments, showInactive, showSupportVehicles]);

    const handleOpenEditModal = (asset) => {
        setSelectedAsset(asset);
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setSelectedAsset(null);
        setIsEditModalOpen(false);
    };

    const handleUpdateAsset = async (formData) => {
        setIsSubmitting(true);
        const { error } = await supabase.from('equipments').update(formData).eq('id', selectedAsset.id);
        setIsSubmitting(false);

        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao atualizar', description: error.message });
        } else {
            toast({ title: 'Ativo atualizado com sucesso!' });
            onUpdate();
            handleCloseEditModal();
        }
    };

    const handleDeactivate = async (assetId) => {
        setIsSubmitting(true);
        
        const { error } = await supabase
            .from('equipments')
            .update({ is_active: false })
            .eq('id', assetId);

        setIsSubmitting(false);
        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao inativar', description: error.message });
        } else {
            toast({ title: 'Ativo inativado com sucesso!' });
            onUpdate();
        }
    };
    
    return (
        <>
            <Card className="bg-card/80 border-border mt-4">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Gerenciamento de Ativos da Frota</CardTitle>
                            <CardDescription>Gerencie sua frota de veículos e equipamentos.</CardDescription>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <Switch id="show-support" checked={showSupportVehicles} onCheckedChange={setShowSupportVehicles} />
                                <Label htmlFor="show-support">Mostrar Veículos de Passeio/Apoio</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch id="show-inactive" checked={showInactive} onCheckedChange={setShowInactive} />
                                <Label htmlFor="show-inactive">Mostrar Inativos</Label>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Modelo</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Placa</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredEquipments.length > 0 ? filteredEquipments.map(v => (
                                <TableRow key={v.id} className={v.is_active === false ? 'text-muted-foreground opacity-50' : ''}>
                                    <TableCell>{v.name}</TableCell>
                                    <TableCell>{v.model}</TableCell>
                                    <TableCell className="capitalize">{v.equipment_type || '--'}</TableCell>
                                    <TableCell>{v.plate || '--'}</TableCell>
                                    <TableCell>{v.is_active === false ? 'Inativo' : v.status}</TableCell>
                                    <TableCell className="flex gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenEditModal(v)}><Edit className="h-4 w-4" /></Button>
                                        {v.is_active !== false && (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" disabled={isSubmitting}>
                                                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-red-500" />}
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="bg-slate-800 border-white/20 text-white">
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Confirmar Inativação</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Tem certeza que deseja inativar o ativo "{v.name}"? Ele não será excluído, apenas ocultado das listas principais.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeactivate(v.id)} className="bg-red-600 hover:bg-red-700">Inativar</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan="6" className="text-center">Nenhum ativo encontrado para os filtros selecionados.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="bg-card border-white/20 text-white max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Editar Ativo</DialogTitle>
                    </DialogHeader>
                    {selectedAsset && (
                        <EditEquipmentForm
                            equipment={selectedAsset}
                            onSubmit={handleUpdateAsset}
                            onClose={handleCloseEditModal}
                            isSubmitting={isSubmitting}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};

export default VehicleManagementTab;