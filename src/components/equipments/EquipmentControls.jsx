import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const EquipmentControls = ({
  searchTerm,
  onSearchChange,
  selectedType,
  onTypeChange,
  onAddEquipment,
  showInactive,
  onShowInactiveChange,
  showSupportVehicles,
  onShowSupportVehiclesChange,
}) => {
  const equipmentTypeOptions = [
    { value: 'all', label: 'Todos os Tipos' },
    { value: 'guindastes', label: 'Guindastes' },
    { value: 'passeio', label: 'Passeio' },
    { value: 'munck', label: 'Munck' },
    { value: 'carreta', label: 'Carreta' },
    { value: 'apoio', label: 'Apoio' },
    { value: 'outros', label: 'Outros' },
  ];

  return (
    <div className="p-4 bg-card/50 backdrop-blur-sm rounded-lg border border-border/30 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-center">
        <Input
          placeholder="Buscar por nome, modelo ou placa..."
          value={searchTerm}
          onChange={onSearchChange}
          className="bg-background/70"
        />
        <Combobox
          options={equipmentTypeOptions}
          value={selectedType}
          onChange={onTypeChange}
          placeholder="Filtrar por tipo"
        />
        <Button onClick={onAddEquipment} className="w-full md:w-auto md:justify-self-end lg:col-start-3">
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Veículo
        </Button>
      </div>
      <div className="flex items-center space-x-4 mt-4">
        <div className="flex items-center space-x-2">
          <Switch id="show-support-vehicles" checked={showSupportVehicles} onCheckedChange={onShowSupportVehiclesChange} />
          <Label htmlFor="show-support-vehicles">Mostrar Veículos de Passeio/Apoio</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="show-inactive-equipments" checked={showInactive} onCheckedChange={onShowInactiveChange} />
          <Label htmlFor="show-inactive-equipments">Mostrar Inativos</Label>
        </div>
      </div>
    </div>
  );
};

export default EquipmentControls;