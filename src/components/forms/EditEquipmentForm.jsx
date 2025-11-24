import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Trash2 } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
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

const equipmentTypes = ['guindastes', 'passeio', 'munck', 'carreta', 'apoio', 'outros'];
const equipmentTypeOptions = equipmentTypes.map(type => ({ value: type, label: type.charAt(0).toUpperCase() + type.slice(1) }));

const statusOptions = [
    { value: 'available', label: 'Disponível' },
    { value: 'working', label: 'Trabalhando' },
    { value: 'maintenance', label: 'Em Manutenção' },
    { value: 'unavailable', label: 'Indisponível' },
];

const EditEquipmentForm = ({ equipment, onSubmit, onClose, isSubmitting: parentSubmitting, onDeactivate }) => {
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    serial_number: '',
    plate: '',
    location: '',
    current_hours: '',
    current_km: '',
    maintenance_interval: 200,
    status: 'available',
    equipment_type: '',
    is_active: true,
  });

  useEffect(() => {
    if (equipment) {
      setFormData({
        name: equipment.name || '',
        model: equipment.model || '',
        serial_number: equipment.serial_number || '',
        plate: equipment.plate || '',
        location: equipment.location || '',
        current_hours: equipment.current_hours || '',
        current_km: equipment.current_km || '',
        maintenance_interval: equipment.maintenance_interval || 200,
        status: equipment.status || 'available',
        equipment_type: equipment.equipment_type || '',
        is_active: equipment.is_active !== false,
      });
    }
  }, [equipment]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSubmit = {
      name: formData.name,
      model: formData.model,
      serial_number: formData.serial_number,
      plate: formData.plate || null,
      location: formData.location,
      current_hours: parseFloat(formData.current_hours) || 0,
      current_km: parseFloat(formData.current_km) || 0,
      maintenance_interval: parseInt(formData.maintenance_interval, 10),
      status: formData.status,
      equipment_type: formData.equipment_type,
      is_active: formData.is_active,
    };
    await onSubmit(dataToSubmit);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-1"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-white">Nome do Ativo *</Label>
              <Input 
                name="name"
                value={formData.name} 
                onChange={handleChange}
                placeholder="Ex: Guindaste Torre 01" 
                className="bg-white/10 border-white/20 text-white" 
                required 
              />
            </div>
            <div>
              <Label className="text-white">Modelo *</Label>
              <Input 
                name="model"
                value={formData.model} 
                onChange={handleChange}
                placeholder="Ex: Liebherr 280 EC-H" 
                className="bg-white/10 border-white/20 text-white" 
                required
              />
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-white">Número de Série</Label>
              <Input 
                name="serial_number"
                value={formData.serial_number} 
                onChange={handleChange}
                placeholder="Ex: LH280-2023-001" 
                className="bg-white/10 border-white/20 text-white" 
              />
            </div>
            <div>
              <Label className="text-white">Placa</Label>
              <Input 
                name="plate"
                value={formData.plate} 
                onChange={handleChange}
                placeholder="Ex: ABC-1234" 
                className="bg-white/10 border-white/20 text-white" 
              />
            </div>
        </div>
        <div>
          <Label className="text-white">Tipo de Equipamento *</Label>
          <Combobox
            options={equipmentTypeOptions}
            value={formData.equipment_type}
            onChange={(v) => handleSelectChange('equipment_type', v)}
            placeholder="Selecione o tipo"
          />
        </div>
        <div>
          <Label className="text-white">Localização</Label>
          <Input 
            name="location"
            value={formData.location} 
            onChange={handleChange}
            placeholder="Ex: Obra Centro - Setor A" 
            className="bg-white/10 border-white/20 text-white" 
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
            <Label className="text-white">Horímetro Atual</Label>
            <Input 
                name="current_hours"
                type="number" 
                step="0.1" 
                value={formData.current_hours} 
                onChange={handleChange}
                className="bg-white/10 border-white/20 text-white" 
                placeholder="0h"
            />
            </div>
            <div>
            <Label className="text-white">KM Atual</Label>
            <Input 
                name="current_km"
                type="number" 
                step="0.1" 
                value={formData.current_km} 
                onChange={handleChange}
                className="bg-white/10 border-white/20 text-white" 
                placeholder="0km"
            />
            </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <Label className="text-white">Intervalo de Manutenção (h)</Label>
                <Input 
                    name="maintenance_interval"
                    type="number" 
                    value={formData.maintenance_interval} 
                    onChange={handleChange}
                    className="bg-white/10 border-white/20 text-white" 
                />
            </div>
            <div>
                <Label className="text-white">Status</Label>
                <Combobox
                  options={statusOptions}
                  value={formData.status}
                  onChange={(v) => handleSelectChange('status', v)}
                  placeholder="Selecione o status"
                />
            </div>
        </div>
        <div className="flex justify-between items-center pt-4">
          <Button type="button" onClick={onClose} variant="outline" className="border-white/20 text-white hover:bg-white/10" disabled={parentSubmitting}>
            Cancelar
          </Button>
          <div className="flex gap-3">
            {equipment.is_active !== false && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" type="button" disabled={parentSubmitting}>
                    <Trash2 className="mr-2 h-4 w-4" /> Inativar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-slate-800 border-white/20 text-white">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Inativação</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja inativar o ativo "{equipment.name}"? Ele não será excluído, apenas ocultado das listas principais.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDeactivate(equipment.id)} className="bg-red-600 hover:bg-red-700">Inativar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={parentSubmitting}>
              {parentSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        </div>
      </form>
    </motion.div>
  );
};

export default EditEquipmentForm;