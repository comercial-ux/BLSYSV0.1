import React from 'react';
import { useData } from '@/contexts/DataContext';
import MaintenanceList from '@/components/maintenance/MaintenanceList';
import { Loader2 } from 'lucide-react';

const MaintenancesPage = ({ onEdit }) => {
  const { maintenances, equipments, loading, refetchData } = useData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin mr-2 text-primary" />
        <span>Carregando manutenções...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <MaintenanceList 
        maintenances={maintenances}
        equipments={equipments}
        onEdit={onEdit}
        onDataUpdate={refetchData}
      />
    </div>
  );
};

export default MaintenancesPage;