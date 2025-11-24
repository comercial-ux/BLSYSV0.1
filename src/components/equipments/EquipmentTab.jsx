import React, { useState, useMemo } from 'react';
import { toast } from '@/components/ui/use-toast';
import EquipmentControls from './EquipmentControls';
import EquipmentList from './EquipmentList';
import { getMaintenanceStatus } from '@/lib/maintenanceHelper';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import EquipmentForm from '@/components/forms/EquipmentForm';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const EquipmentTab = ({ equipments, onUpdate, openAddEquipmentForm, openMaintenanceForm, openChecklistForm }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = useState(null);
  const [masterPassword, setMasterPassword] = useState('');

  const filteredEquipments = useMemo(() => {
    if (!equipments) return [];
    return equipments
      .map(equipment => ({
        ...equipment,
        maintenanceStatus: getMaintenanceStatus(equipment)
      }))
      .filter(equipment => {
        const nameMatch = equipment.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const modelMatch = equipment.model?.toLowerCase().includes(searchTerm.toLowerCase());
        const serialMatch = equipment.serial_number?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSearch = nameMatch || modelMatch || serialMatch;
        
        if (filterStatus === 'all') return matchesSearch;
        
        return matchesSearch && equipment.maintenanceStatus.status === filterStatus;
      }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [equipments, searchTerm, filterStatus]);

  const handleOpenEditModal = (equipment) => {
    setSelectedEquipment(equipment);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setSelectedEquipment(null);
    setIsEditModalOpen(false);
  };

  const promptDeleteEquipment = (equipmentId) => {
    setEquipmentToDelete(equipmentId);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteEquipment = async () => {
    if (masterPassword !== 'Rmmg470$') {
      toast({
        variant: 'destructive',
        title: 'Senha Incorreta',
        description: 'A senha master está incorreta. A exclusão foi cancelada.',
      });
      setMasterPassword('');
      return;
    }

    const { error } = await supabase
      .from('equipments')
      .delete()
      .eq('id', equipmentToDelete);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao Excluir',
        description: `Não foi possível excluir o ativo: ${error.message}`,
      });
      return;
    }

    toast({
      title: 'Excluído!',
      description: 'O ativo foi removido permanentemente.',
    });
    
    setIsDeleteAlertOpen(false);
    setEquipmentToDelete(null);
    setMasterPassword('');
    onUpdate();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-white">Gerenciamento de Ativos da Frota</h1>
      <EquipmentControls
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        onAddClick={openAddEquipmentForm}
      />
      <EquipmentList
        equipments={filteredEquipments}
        onMaintainClick={openMaintenanceForm}
        onChecklistClick={openChecklistForm}
        onEditClick={handleOpenEditModal}
        onDeleteClick={promptDeleteEquipment}
      />
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-card border-white/20 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Ativo da Frota</DialogTitle>
          </DialogHeader>
          {selectedEquipment && (
            <EquipmentForm
              equipment={selectedEquipment}
              onSave={onUpdate}
              onClose={handleCloseEditModal}
            />
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="bg-card border-white/20 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmação de Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível e excluirá permanentemente o equipamento. Digite a senha master para confirmar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label htmlFor="master-password">Senha Master</Label>
            <Input
              id="master-password"
              type="password"
              value={masterPassword}
              onChange={(e) => setMasterPassword(e.target.value)}
              className="mt-2 bg-white/10 border-white/20"
              placeholder="Digite a senha para excluir"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMasterPassword('')}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEquipment} className="bg-red-600 hover:bg-red-700">Confirmar Exclusão</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EquipmentTab;