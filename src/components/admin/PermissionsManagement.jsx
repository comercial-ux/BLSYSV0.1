import React, { useState, useEffect } from 'react';
    import { useData } from '@/contexts/DataContext';
    import { Button } from '@/components/ui/button';
    import { Checkbox } from '@/components/ui/checkbox';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
    import { Loader2, Save, ShieldAlert } from 'lucide-react';
    import toast from 'react-hot-toast';
    import { supabase } from '@/lib/customSupabaseClient';
    import {
      Dialog,
      DialogContent,
      DialogHeader,
      DialogTitle,
      DialogDescription,
      DialogFooter,
    } from '@/components/ui/dialog';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';

    const modules = [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'documentabl', label: 'DocumentaBL' },
      { id: 'equipments', label: 'Equipamentos' },
      { id: 'operational', label: 'Operacional' },
      { id: 'commercial', label: 'Comercial' },
      { id: 'maintenances', label: 'Manutenção' },
      { id: 'supplies', label: 'Suprimentos' },
      { id: 'personnel', label: 'Dep. Pessoal' },
      { id: 'finance', label: 'Financeiro' },
      { id: 'reports', label: 'Relatórios' },
      { id: 'admin', label: 'Meu Perfil' },
      { id: 'administrative', label: 'Administrativo' },
    ];

    const roles = [
        { id: 'admin', label: 'Admin' },
        { id: 'comercial', label: 'Comercial' },
        { id: 'operacional', label: 'Operacional' },
        { id: 'financeiro', label: 'Financeiro' },
        { id: 'usuario', label: 'Usuário' },
    ];

    const PermissionsManagement = () => {
      const { rolePermissions: initialRolePermissions, refetchData, loading: dataLoading } = useData();
      const [permissions, setPermissions] = useState({});
      const [isSaving, setIsSaving] = useState(false);
      const [isConfirmOpen, setIsConfirmOpen] = useState(false);
      const [masterPassword, setMasterPassword] = useState('');
      const [passwordError, setPasswordError] = useState('');

      useEffect(() => {
        if (initialRolePermissions && Object.keys(initialRolePermissions).length > 0) {
          // Ensure 'usuario' role exists with default empty permissions
          const updatedPermissions = { ...initialRolePermissions };
          if (!updatedPermissions.usuario) {
            updatedPermissions.usuario = {};
          }
          setPermissions(updatedPermissions);
        } else {
            // Fallback for when no permissions are loaded yet
            const defaultPermissions = roles.reduce((acc, role) => {
                acc[role.id] = {};
                return acc;
            }, {});
            setPermissions(defaultPermissions);
        }
      }, [initialRolePermissions]);

      const handlePermissionChange = (roleId, moduleId, checked) => {
        setPermissions(prev => ({
          ...prev,
          [roleId]: {
            ...prev[roleId],
            [moduleId]: checked,
          },
        }));
      };

      const handleSaveClick = () => {
        setPasswordError('');
        setMasterPassword('');
        setIsConfirmOpen(true);
      };

      const handleConfirmSave = async () => {
        if (!masterPassword) {
          setPasswordError('A senha mestra é obrigatória.');
          return;
        }
        
        setIsSaving(true);
        const toastId = toast.loading('Salvando permissões...');

        try {
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          if (sessionError || !sessionData.session) throw new Error("Sessão inválida. Faça login novamente.");
          const token = sessionData.session.access_token;

          // Ensure 'usuario' permissions are included even if empty
          const permissionsToSave = { ...permissions };
          if (!permissionsToSave.usuario) {
            permissionsToSave.usuario = {};
          }

          const { error } = await supabase.functions.invoke('update-role-permissions', {
            body: JSON.stringify({ permissions: permissionsToSave, master_password: masterPassword }),
            headers: { Authorization: `Bearer ${token}` }
          });

          if (error) {
            const errorBody = await error.context.json();
            throw new Error(errorBody.error || 'Ocorreu um erro desconhecido.');
          }

          toast.success('Permissões atualizadas com sucesso!', { id: toastId });
          refetchData();
          setIsConfirmOpen(false);
        } catch (err) {
          toast.error(err.message, { id: toastId });
          if (err.message.includes('Senha mestra incorreta')) {
            setPasswordError(err.message);
          }
        } finally {
          setIsSaving(false);
        }
      };

      return (
        <>
          <Card className="mt-4">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Permissões de Acesso por Função</CardTitle>
                  <CardDescription>Controle o acesso de cada função aos diferentes módulos do sistema.</CardDescription>
                </div>
                <Button onClick={handleSaveClick} disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar Alterações
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-card z-10">Função</TableHead>
                      {modules.map(module => (
                        <TableHead key={module.id} className="text-center">{module.label}</TableHead>

                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataLoading ? (
                      <TableRow>
                        <TableCell colSpan={modules.length + 1} className="h-24 text-center">
                          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                        </TableCell>
                      </TableRow>
                    ) : roles && roles.length > 0 ? (
                      roles.map(role => (
                        <TableRow key={role.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium sticky left-0 bg-card z-10 capitalize">{role.label}</TableCell>
                          {modules.map(module => (
                            <TableCell key={module.id} className="text-center">
                              <Checkbox
                                checked={!!permissions[role.id]?.[module.id]}
                                onCheckedChange={(checked) => handlePermissionChange(role.id, module.id, checked)}
                                disabled={role.id === 'admin'}
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={modules.length + 1} className="h-24 text-center text-muted-foreground">
                          Nenhuma função encontrada.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
            <DialogContent className="sm:max-w-[425px] bg-card border-white/10 text-white">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <ShieldAlert className="mr-2 h-5 w-5 text-yellow-400" />
                  Confirmar Alteração de Permissões
                </DialogTitle>
                <DialogDescription>
                  Esta é uma ação de alta segurança. Por favor, insira a senha mestra para confirmar e salvar as alterações.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="master_password">Senha Mestra</Label>
                  <Input
                    id="master_password"
                    type="password"
                    value={masterPassword}
                    onChange={(e) => setMasterPassword(e.target.value)}
                    className="w-full bg-white/10"
                    placeholder="Digite a senha mestra"
                  />
                  {passwordError && <p className="text-red-500 text-xs mt-1">{passwordError}</p>}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsConfirmOpen(false)} disabled={isSaving}>
                  Cancelar
                </Button>
                <Button type="button" onClick={handleConfirmSave} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSaving ? 'Salvando...' : 'Confirmar e Salvar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      );
    };

    export default PermissionsManagement;