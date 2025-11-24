import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { Loader2 } from 'lucide-react';

const roleOptions = [
    { value: 'admin', label: 'Admin' },
    { value: 'comercial', label: 'Comercial' },
    { value: 'operacional', label: 'Operacional' },
    { value: 'financeiro', label: 'Financeiro' },
    { value: 'usuario', label: 'Usuário' },
];

const statusOptions = [
    { value: 'active', label: 'Ativo' },
    { value: 'inactive', label: 'Inativo' },
];

const UserFormDialog = ({ isOpen, onOpenChange, user, onSave, isSaving }) => {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();

  const handleOpenChange = (open) => {
    if (!open) {
      reset({
        full_name: '',
        email: '',
        password: '',
        role: 'operacional',
        status: 'active',
      });
    }
    onOpenChange(open);
  };

  useEffect(() => {
    if (isOpen) {
        if (user) {
            reset({
                full_name: user.full_name || '',
                email: user.email || '',
                role: user.role || 'operacional',
                status: user.status || 'active',
            });
        } else {
            reset({
                full_name: '',
                email: '',
                password: '',
                role: 'operacional',
                status: 'active',
            });
        }
    }
  }, [user, isOpen, reset]);

  const onSubmit = (data) => {
    onSave(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>{user ? 'Editar Usuário' : 'Criar Novo Usuário'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nome Completo</Label>
            <Input
              id="full_name"
              {...register('full_name', { required: 'Nome é obrigatório' })}
              className="w-full bg-white/10"
              placeholder="Ex: João da Silva"
            />
            {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email', { required: 'Email é obrigatório' })}
              className="w-full bg-white/10"
              disabled={!!user}
              placeholder="Ex: joao.silva@email.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          {!user && (
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                {...register('password', { required: 'Senha é obrigatória', minLength: { value: 6, message: 'A senha deve ter no mínimo 6 caracteres' } })}
                className="w-full bg-white/10"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="role">Função</Label>
            <Combobox
              options={roleOptions}
              value={watch('role')}
              onChange={(value) => setValue('role', value)}
              placeholder="Selecione uma função"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Combobox
              options={statusOptions}
              value={watch('status')}
              onChange={(value) => setValue('status', value)}
              placeholder="Selecione um status"
            />
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSaving}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? (user ? 'Salvando...' : 'Criando...') : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserFormDialog;