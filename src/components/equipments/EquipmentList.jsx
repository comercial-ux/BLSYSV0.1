import React from 'react';
import EquipmentCard from './EquipmentCard';
import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EquipmentList = ({ equipments, onMaintainClick, onChecklistClick, onEditClick, onPlanMaintenanceClick, onAddClick }) => {
  if (equipments.length === 0) {
    return (
      <div className="text-center py-16 bg-muted/50 rounded-lg border border-dashed">
        <Package className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-lg font-medium text-foreground">Nenhum ativo encontrado</h3>
        <p className="mt-1 text-sm text-muted-foreground">Tente ajustar seus filtros ou adicione um novo ativo.</p>
        <Button onClick={onAddClick} className="mt-4">Adicionar Ativo</Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {equipments.map(equipment => (
        <EquipmentCard
          key={equipment.id}
          equipment={equipment}
          onMaintainClick={onMaintainClick}
          onChecklistClick={onChecklistClick}
          onEditClick={onEditClick}
          onPlanMaintenanceClick={onPlanMaintenanceClick}
        />
      ))}
    </div>
  );
};

export default EquipmentList;