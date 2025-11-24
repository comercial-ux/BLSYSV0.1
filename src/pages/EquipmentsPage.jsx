import React, { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import EquipmentList from '@/components/equipments/EquipmentList';
import EquipmentControls from '@/components/equipments/EquipmentControls';
import { Helmet } from 'react-helmet';

const EquipmentsPage = ({ openAddEquipmentForm, openMaintenanceForm, openChecklistForm, openPlanMaintenanceForm }) => {
  const { equipments, loading, error } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [showInactive, setShowInactive] = useState(false);
  const [showSupportVehicles, setShowSupportVehicles] = useState(false);

  const filteredEquipments = useMemo(() => {
    let filtered = equipments || [];

    if (!showInactive) {
      filtered = filtered.filter(eq => eq.is_active !== false);
    }

    if (!showSupportVehicles) {
      filtered = filtered.filter(eq => eq.equipment_type !== 'passeio' && eq.equipment_type !== 'apoio');
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(e => e.equipment_type === selectedType);
    }

    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(e =>
        e.name.toLowerCase().includes(lowercasedTerm) ||
        (e.model && e.model.toLowerCase().includes(lowercasedTerm)) ||
        (e.plate && e.plate.toLowerCase().includes(lowercasedTerm))
      );
    }

    return filtered;
  }, [equipments, searchTerm, selectedType, showInactive, showSupportVehicles]);

  if (loading) return <div className="text-center p-8">Carregando equipamentos...</div>;
  if (error) return <div className="text-center p-8 text-red-500">Erro ao carregar equipamentos.</div>;

  return (
    <div className="p-4 md:p-6">
      <Helmet>
        <title>Gerenciamento de Ativos - BL Soluções</title>
        <meta name="description" content="Gerencie sua frota de veículos e equipamentos." />
      </Helmet>
      <h1 className="text-2xl font-bold mb-4 text-foreground">Gerenciamento de Ativos</h1>
      <EquipmentControls
        searchTerm={searchTerm}
        onSearchChange={(e) => setSearchTerm(e.target.value)}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        onAddEquipment={() => openAddEquipmentForm()}
        showInactive={showInactive}
        onShowInactiveChange={setShowInactive}
        showSupportVehicles={showSupportVehicles}
        onShowSupportVehiclesChange={setShowSupportVehicles}
      />
      <EquipmentList
        equipments={filteredEquipments}
        onMaintainClick={openMaintenanceForm}
        onChecklistClick={openChecklistForm}
        onEditClick={(equipment) => openAddEquipmentForm(equipment)}
        onPlanMaintenanceClick={openPlanMaintenanceForm}
        onAddClick={() => openAddEquipmentForm()}
      />
    </div>
  );
};

export default EquipmentsPage;