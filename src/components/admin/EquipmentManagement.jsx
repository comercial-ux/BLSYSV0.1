import React, { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Edit, Trash2, Loader2 } from 'lucide-react';
import EditEquipmentForm from '@/components/forms/EditEquipmentForm';
import { supabase } from '@/lib/customSupabaseClient';
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

const EquipmentManagement = ({ equipments, onUpdate }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenEditModal = (equipment) => {
    setSelectedEquipment(equipment);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setSelectedEquipment(null);
    setIsEditModalOpen(false);
  };

  const handleUpdateEquipment = async (formData) => {
    setIsSubmitting(true);
    const { error } = await supabase
      .from('equipments')
      .update(formData)
      .eq('id', selectedEquipment.id);
    
    setIsSubmitting(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar veículo', description: error.message });
    } else {
      toast({ title: 'Sucesso!', description: 'Veículo atualizado.' });
      onUpdate();
      handleCloseEditModal();
    }
  };

  const handleDeleteEquipment = async (equipmentId) => {
    setIsSubmitting(true);
    const { error } = await supabase
      .from('equipments')
      .delete()
      .eq('id', equipmentId);
    
    setIsSubmitting(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao excluir veículo', description: error.message });
    } else {
      toast({ title: 'Sucesso!', description: 'Veículo excluído.' });
      onUpdate();
    }
  };

  return (
    <>
      <div className="p-6 bg-card/80 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Gerenciamento de Veículos</h2>
        <div className="mt-6 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Nº de Série</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipments && equipments.length > 0 ? (
                equipments.map((equipment) => (
                  <TableRow key={equipment.id}>
                    <TableCell>{equipment.name}</TableCell>
                    <TableCell>{equipment.model}</TableCell>
                    <TableCell className="capitalize">{equipment.equipment_type || '--'}</TableCell>
                    <TableCell>{equipment.serial_number}</TableCell>
                    <TableCell>{equipment.location}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEditModal(equipment)} disabled={isSubmitting}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-400" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o veículo "{equipment.name}"? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleDeleteEquipment(equipment.id)}>Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400 py-4">
                    Nenhum veículo encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-card border-white/20 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Veículo</DialogTitle>
          </DialogHeader>
          {selectedEquipment && (
            <EditEquipmentForm
              equipment={selectedEquipment}
              onSubmit={handleUpdateEquipment}
              onClose={handleCloseEditModal}
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EquipmentManagement;