import React, { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';

const MaintenanceFilters = ({ filters, setFilters, equipments, showOngoingOnly, setShowOngoingOnly }) => {

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const equipmentOptions = useMemo(() => {
    const options = (equipments || []).map(eq => ({
      value: eq.id.toString(),
      label: `${eq.name} (${eq.plate || 'S/ Placa'})`
    }));
    options.unshift({ value: 'all', label: 'Todos os Veículos' });
    return options;
  }, [equipments]);
  
  const handleEquipmentChange = (value) => {
    handleFilterChange('equipmentId', value || 'all');
  };


  return (
    <div className="flex flex-col gap-4 mb-6 p-4 rounded-lg bg-card/80">
      <div className="flex items-center space-x-2">
        <Checkbox id="show-ongoing" checked={showOngoingOnly} onCheckedChange={setShowOngoingOnly} />
        <Label htmlFor="show-ongoing" className="text-white font-medium">
          Mostrar apenas manutenções em andamento
        </Label>
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium text-gray-300 mb-2 block">Filtrar por Veículo</label>
           <Combobox
            options={equipmentOptions}
            value={filters.equipmentId}
            onChange={handleEquipmentChange}
            placeholder="Selecione um veículo..."
            searchPlaceholder="Buscar veículo..."
            emptyText="Nenhum veículo encontrado."
          />
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium text-gray-300 mb-2 block">Filtrar por Tipo</label>
          <Select value={filters.maintenanceType} onValueChange={(value) => handleFilterChange('maintenanceType', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              <SelectItem value="preventiva">Preventiva</SelectItem>
              <SelectItem value="corretiva">Corretiva</SelectItem>
              <SelectItem value="preditiva">Preditiva</SelectItem>
              <SelectItem value="emergencial">Emergencial</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceFilters;