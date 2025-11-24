import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Trash2, Loader2, UserPlus, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useData } from '@/contexts/DataContext';
import UserFormDialog from '@/components/admin/UserFormDialog';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import MasterPasswordDialog from '@/components/admin/MasterPasswordDialog';

const UserManagement = () => {
  const { users, refetchData, loading: dataLoading } = useData();
  const { user: currentUser } = useAuth();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  const handleOpenCreateModal = () => {
    setSelectedUser(null);
    setIsFormOpen(true);
  };
  
  const handleOpenEditModal = (user) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleFormOpenChange = (open) => {
    if (!open) {
      setSelectedUser(null);
    }
    setIsFormOpen(open);
  };

  const handleSaveUser = async (formData) => {
    setIsSaving(true);
    const toastId = toast.loading(selectedUser ? 'Atualizando usuário...' : 'Criando usuário...');

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) throw new Error("Sessão inválida. Faça login novamente.");
      const token = sessionData.session.access_token;

      const functionName = selectedUser ? 'update-user-details' : 'create-user';
      const body = selectedUser ? { user_id: selectedUser.id, ...formData } : formData;

      const { error } = await supabase.functions.invoke(functionName, {
        body: JSON.stringify(body),
        headers: { Authorization: `Bearer ${token}` }
      });

      if (error) {
        let errorMessage = 'Ocorreu um erro desconhecido.';
        try {
          const errorBody = await error.context.json();
          errorMessage = errorBody.error || errorMessage;
        } catch(e) {
            errorMessage = error.message || errorMessage;
        }
        throw new Error(errorMessage);
      }

      toast.success(`Usuário ${selectedUser ? 'atualizado' : 'criado'} com sucesso!`, { id: toastId });
      refetchData();
      setIsFormOpen(false);
      setSelectedUser(null);
    } catch(err) {
      toast.error(err.message, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteConfirmation = (user) => {
    if (currentUser && user.id === currentUser.id) {
        toast.error('Ação Proibida: Não é possível excluir a si mesmo.');
        return;
    }
    setUserToDelete(user);
    setIsPasswordDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setDeletingId(userToDelete.id);
    const toastId = toast.loading('Excluindo usuário...');

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) throw new Error("Sessão inválida. Faça login novamente.");
      const token = sessionData.session.access_token;

      const { error } = await supabase.functions.invoke('delete-user', {
        body: JSON.stringify({ user_id: userToDelete.id }),
        headers: { Authorization: `Bearer ${token}` }
      });

      if (error) {
        const errorBody = await error.context.json();
        throw new Error(errorBody.error || 'Ocorreu um erro desconhecido.');
      }
        
      toast.success('Usuário excluído com sucesso.', { id: toastId });
      refetchData();
    } catch(err) {
      toast.error(err.message, { id: toastId });
    } finally {
      setDeletingId(null);
      setUserToDelete(null);
      setIsPasswordDialogOpen(false);
    }
  };

  const getRoleLabel = (role) => {
    const roles = {
        admin: 'Admin',
        comercial: 'Comercial',
        operacional: 'Operacional',
        financeiro: 'Financeiro',
        usuario: 'Usuário'
    };
    return roles[role] || 'Não definido';
  };

  return (
    <>
      <Card className="mt-4">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Usuários do Sistema</CardTitle>
              <CardDescription>Adicione, edite ou remova usuários.</CardDescription>
            </div>
            <Button onClick={handleOpenCreateModal}>
              <UserPlus className="mr-2 h-4 w-4" />
              Criar Usuário
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome Completo</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                    </TableCell>
                  </TableRow>
                ) : users && users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{user.full_name || 'Não informado'}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="capitalize">{getRoleLabel(user.role)}</TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'active' ? 'default' : 'destructive'} className="capitalize">
                          {user.status === 'active' ? <ShieldCheck className="mr-1 h-4 w-4" /> : <ShieldAlert className="mr-1 h-4 w-4" />}
                          {user.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEditModal(user)} disabled={!!deletingId || isSaving}>
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" onClick={() => openDeleteConfirmation(user)} disabled={deletingId === user.id || isSaving}>
                            {deletingId === user.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <UserFormDialog
        isOpen={isFormOpen}
        onOpenChange={handleFormOpenChange}
        user={selectedUser}
        onSave={handleSaveUser}
        isSaving={isSaving}
      />
      
      <MasterPasswordDialog
        isOpen={isPasswordDialogOpen}
        onClose={() => setIsPasswordDialogOpen(false)}
        onConfirm={handleDeleteUser}
        isSubmitting={!!deletingId}
        title="Confirmar Exclusão de Usuário"
        description={`Você tem certeza que deseja excluir o usuário ${userToDelete?.email}? Esta ação não pode ser desfeita.`}
    />
    </>
  );
};

export default UserManagement;