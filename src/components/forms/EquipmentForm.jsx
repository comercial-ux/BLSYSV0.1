import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
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
const equipmentTypeOptions = equipmentTypes.map(type => ({
    value: type,
    label: type.charAt(0).toUpperCase() + type.slice(1)
}));

const EquipmentForm = ({ onSave, onClose, equipment = null }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    serial_number: '',
    plate: '',
    current_hours: '',
    current_km: '',
    equipment_type: '',
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isEditing = Boolean(equipment && equipment.id);

  useEffect(() => {
    if (isEditing) {
      setFormData({
        name: equipment.name || '',
        model: equipment.model || '',
        serial_number: equipment.serial_number || '',
        plate: equipment.plate || '',
        current_hours: equipment.current_hours || '',
        current_km: equipment.current_km || '',
        equipment_type: equipment.equipment_type || '',
        is_active: equipment.is_active !== false,
      });
    } else {
      setFormData({
        name: '',
        model: '',
        serial_number: '',
        plate: '',
        current_hours: '',
        current_km: '',
        equipment_type: '',
        is_active: true,
      });
    }
  }, [equipment, isEditing]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (value) => {
    setFormData({ ...formData, equipment_type: value });
  };
  
  const handleDeactivate = async () => {
    if (!equipment || !equipment.id) return;
    setIsSubmitting(true);
    const { error } = await supabase
      .from('equipments')
      .update({ is_active: false })
      .eq('id', equipment.id);
    setIsSubmitting(false);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao inativar', description: error.message });
    } else {
      toast({ title: 'Ativo inativado com sucesso!' });
      if (onSave) onSave();
      if (onClose) onClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast({ variant: 'destructive', title: "Erro de Autenticação" });
      return;
    }
    if (!formData.name || !formData.model || !formData.equipment_type) {
      toast({ variant: 'destructive', title: "Campos Obrigatórios", description: "Nome, modelo e tipo de equipamento são necessários." });
      return;
    }

    setIsSubmitting(true);
    
    const payload = {
      user_id: user.id,
      name: formData.name,
      model: formData.model,
      serial_number: formData.serial_number || null,
      plate: formData.plate || null,
      current_hours: parseFloat(formData.current_hours) || 0,
      current_km: parseFloat(formData.current_km) || 0,
      equipment_type: formData.equipment_type,
      status: equipment?.status || 'available',
      is_active: formData.is_active,
    };

    try {
      let error;
      if (isEditing) {
        const { error: updateError } = await supabase
          .from('equipments')
          .update(payload)
          .eq('id', equipment.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('equipments')
          .insert([payload]);
        error = insertError;
      }

      if (error) {
        throw error;
      }
      
      toast({ title: 'Sucesso!', description: `Equipamento ${isEditing ? 'atualizado' : 'adicionado'} com sucesso.` });
      
      if (onSave) onSave();
      if (onClose) onClose();

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao Salvar",
        description: `Falha na operação: ${error.message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-1"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Nome do Equipamento *</Label>
          <Input name="name" value={formData.name} onChange={handleChange} placeholder="Ex: Escavadeira 320" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Modelo *</Label>
            <Input name="model" value={formData.model} onChange={handleChange} placeholder="Ex: Caterpillar 320D" required />
          </div>
          <div>
            <Label>Tipo de Equipamento *</Label>
            <Combobox
                options={equipmentTypeOptions}
                value={formData.equipment_type}
                onChange={handleSelectChange}
                placeholder="Selecione o tipo"
            />
          </div>
        </div>
        <div>
          <Label>Número de Série</Label>
          <Input name="serial_number" value={formData.serial_number} onChange={handleChange} placeholder="Opcional" />
        </div>
        <div>
          <Label>Placa</Label>
          <Input name="plate" value={formData.plate} onChange={handleChange} placeholder="Opcional" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Horímetro Atual</Label>
            <Input name="current_hours" type="number" step="0.1" value={formData.current_hours} onChange={handleChange} placeholder="0" />
          </div>
          <div>
            <Label>KM Atual</Label>
            <Input name="current_km" type="number" step="0.1" value={formData.current_km} onChange={handleChange} placeholder="0" />
          </div>
        </div>
        <div className="flex justify-between items-center gap-4 pt-4">
          <div>
            {isEditing && equipment.is_active !== false && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" disabled={isSubmitting}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Inativar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-slate-800 border-white/20 text-white">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Inativação</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja inativar este ativo? Ele será ocultado das listas principais mas permanecerá no sistema.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeactivate} className="bg-red-600 hover:bg-red-700">Confirmar Inativação</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={onClose} variant="outline" disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </form>
    </motion.div>
  );
};

export default EquipmentForm;