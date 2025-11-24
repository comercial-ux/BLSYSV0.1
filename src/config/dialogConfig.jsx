import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import EquipmentForm from '@/components/forms/EquipmentForm';
import MaintenanceForm from '@/components/forms/MaintenanceForm';
import ChecklistForm from '@/components/forms/ChecklistForm';
import MaintenancePlanForm from '@/components/equipments/MaintenancePlanForm';
import { ScrollArea } from '@/components/ui/scroll-area';

export const AppDialogs = ({ dialogState, closeDialogs, handlers, dialogData }) => {
  return (
    <>
      <Dialog open={dialogState.isAddEquipmentOpen} onOpenChange={() => closeDialogs('isAddEquipmentOpen')}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{dialogData.selectedEquipment ? 'Editar Equipamento' : 'Adicionar Novo Equipamento'}</DialogTitle>
            <DialogDescription>
              {dialogData.selectedEquipment ? 'Atualize os detalhes do equipamento selecionado.' : 'Preencha os detalhes do novo equipamento para adicioná-lo à sua frota.'}
            </DialogDescription>
          </DialogHeader>
          <EquipmentForm
            equipment={dialogData.selectedEquipment}
            onSave={() => {
              if (handlers.refetchData) handlers.refetchData();
              closeDialogs('isAddEquipmentOpen');
            }}
            onClose={() => closeDialogs('isAddEquipmentOpen')}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={dialogState.isMaintenanceOpen} onOpenChange={() => closeDialogs('isMaintenanceOpen')}>
        <DialogContent className="max-w-4xl">
           <DialogHeader>
            <DialogTitle>{dialogData.editingMaintenance ? 'Editar Manutenção' : 'Registrar Nova Manutenção'}</DialogTitle>
            <DialogDescription>
              {dialogData.editingMaintenance ? `Editando manutenção para: ${dialogData.selectedEquipment?.name}` : `Registrando nova manutenção para: ${dialogData.selectedEquipment?.name}`}
            </DialogDescription>
          </DialogHeader>
          <MaintenanceForm
            equipment={dialogData.selectedEquipment}
            maintenance={dialogData.editingMaintenance}
            inventory={dialogData.inventory}
            onSave={() => {
              if (handlers.refetchData) handlers.refetchData();
              closeDialogs('isMaintenanceOpen');
            }}
            onClose={() => closeDialogs('isMaintenanceOpen')}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={dialogState.isChecklistOpen} onOpenChange={() => closeDialogs('isChecklistOpen')}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Registrar Novo Checklist</DialogTitle>
            <DialogDescription>
              Preencha o checklist para o equipamento: {dialogData.selectedEquipment?.name}.
            </DialogDescription>
          </DialogHeader>
          <ChecklistForm
            equipment={dialogData.selectedEquipment}
            onChecklistSubmitted={handlers.handleChecklistSubmit}
            onClose={() => closeDialogs('isChecklistOpen')}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={dialogState.isPlanMaintenanceOpen} onOpenChange={() => closeDialogs('isPlanMaintenanceOpen')}>
        <DialogContent className="max-w-7xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>Plano de Manutenção Preventiva</DialogTitle>
            <DialogDescription>
              Planeje e registre a manutenção para: {dialogData.selectedEquipment?.name}.
            </DialogDescription>
          </DialogHeader>
          <MaintenancePlanForm
            equipment={dialogData.selectedEquipment}
            onClose={() => closeDialogs('isPlanMaintenanceOpen')}
            onSaveSuccess={() => {
              if (handlers.refetchData) handlers.refetchData();
              closeDialogs('isPlanMaintenanceOpen');
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};