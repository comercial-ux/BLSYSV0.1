import React, { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';

// Generic Quick Add Form Component
const QuickAddForm = ({ table, nameField, nameFieldLabel = 'Nome', extraFields = [], onSave, onClose }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState(
    extraFields.reduce((acc, field) => ({ ...acc, [field.name]: field.defaultValue || '' }), { [nameField]: '' })
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };
  
  const handleInputChange = (e) => {
    handleChange(e.target.name, e.target.value);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const { data, error } = await supabase
      .from(table)
      .insert({ ...formData, user_id: user.id })
      .select()
      .single();

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message });
    } else {
      toast({ title: 'Item salvo com sucesso!' });
      onSave(data);
    }
    setIsSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor={nameField}>{nameFieldLabel}</Label>
        <Input
          id={nameField}
          name={nameField}
          value={formData[nameField]}
          onChange={handleInputChange}
          className="bg-white/10 mt-1"
          required
        />
      </div>
      {extraFields.map((field) => (
        <div key={field.name}>
          <Label htmlFor={field.name}>{field.label}</Label>
          {field.type === 'select' ? (
             <Select onValueChange={(value) => handleChange(field.name, value)} defaultValue={field.defaultValue}>
                <SelectTrigger className="w-full bg-white/10 mt-1">
                    <SelectValue placeholder={field.placeholder || 'Selecione...'} />
                </SelectTrigger>
                <SelectContent>
                    {field.options.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                </SelectContent>
            </Select>
          ) : (
            <Input
              id={field.name}
              name={field.name}
              type={field.type || 'text'}
              value={formData[field.name]}
              onChange={handleInputChange}
              className="bg-white/10 mt-1"
              required={field.required}
            />
          )}
        </div>
      ))}
      <DialogFooter className="pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Salvando...' : 'Salvar'}
        </Button>
      </DialogFooter>
    </form>
  );
};

export const QuickAddChartOfAccountForm = ({ onSave, onClose }) => (
  <QuickAddForm
    table="chart_of_accounts"
    nameField="name"
    nameFieldLabel="Nome do Plano de Conta"
    extraFields={[
      { name: 'type', label: 'Tipo', type: 'select', options: ['Receita', 'Despesa'], defaultValue: 'Despesa', required: true }
    ]}
    onSave={onSave}
    onClose={onClose}
  />
);

export const QuickAddCostCenterForm = ({ onSave, onClose }) => (
  <QuickAddForm
    table="cost_centers"
    nameField="name"
    nameFieldLabel="Nome do Centro de Custo"
    onSave={onSave}
    onClose={onClose}
  />
);

export const QuickAddJobForm = ({ onSave, onClose }) => (
  <QuickAddForm
    table="jobs"
    nameField="job_code"
    nameFieldLabel="Código da Obra (Job Code)"
    onSave={onSave}
    onClose={onClose}
  />
);