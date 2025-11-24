import React from 'react';
    import { useForm } from 'react-hook-form';
    import toast from 'react-hot-toast';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Button } from '@/components/ui/button';
    import { Loader2, KeyRound, ShieldCheck, PlaneTakeoff } from 'lucide-react';
    import { Helmet } from 'react-helmet';
    import { supabase } from '@/lib/customSupabaseClient';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
    import MyVaultTab from '@/components/profile/MyVaultTab';
    import TravelExpensesTab from '@/components/profile/TravelExpensesTab';

    const ProfilePage = () => {
      const { user } = useAuth();
      const { register, handleSubmit, formState: { errors, isSubmitting }, watch, reset } = useForm();
      const newPassword = watch('newPassword');

      const updateUserPassword = async (password) => {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
      };

      const onSubmit = async (data) => {
        const toastId = toast.loading('Atualizando senha...');
        try {
          await updateUserPassword(data.newPassword);
          toast.success('Senha atualizada com sucesso!', { id: toastId });
          reset();
        } catch (error) {
          toast.error(`Erro ao atualizar senha: ${error.message}`, { id: toastId });
        }
      };

      return (
        <>
          <Helmet>
            <title>Meu Perfil - BLK</title>
            <meta name="description" content="Gerencie seu perfil e configurações de conta." />
          </Helmet>
          <div className="max-w-6xl mx-auto p-4 md:p-6">
            <h1 className="text-3xl font-bold mb-6">Meu Perfil</h1>
            
            <Tabs defaultValue="account" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="account">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Conta e Senha
                </TabsTrigger>
                <TabsTrigger value="vault">
                  <KeyRound className="mr-2 h-4 w-4" />
                  Meu Cofre
                </TabsTrigger>
                <TabsTrigger value="expenses">
                  <PlaneTakeoff className="mr-2 h-4 w-4" />
                  Relatórios de Viagens
                </TabsTrigger>
              </TabsList>

              <TabsContent value="account" className="mt-6">
                <div className="grid md:grid-cols-2 gap-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>Informações do Usuário</CardTitle>
                      <CardDescription>Aqui estão os detalhes da sua conta.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Nome Completo</Label>
                        <p className="text-lg">{user?.user_metadata?.full_name || 'Não informado'}</p>
                      </div>
                      <div>
                        <Label>Email</Label>
                        <p className="text-lg">{user?.email}</p>
                      </div>
                      <div>
                        <Label>Função</Label>
                        <p className="text-lg capitalize">{user?.role || 'Não informada'}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Alterar Senha</CardTitle>
                      <CardDescription>Para sua segurança, escolha uma senha forte.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                          <Label htmlFor="newPassword">Nova Senha</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            {...register('newPassword', { 
                              required: 'Nova senha é obrigatória',
                              minLength: { value: 6, message: 'A senha deve ter no mínimo 6 caracteres' } 
                            })}
                            className={errors.newPassword ? 'border-red-500' : ''}
                          />
                          {errors.newPassword && <p className="text-red-500 text-sm mt-1">{errors.newPassword.message}</p>}
                        </div>
                        <div>
                          <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            {...register('confirmPassword', {
                              required: 'Confirmação de senha é obrigatória',
                              validate: value => value === newPassword || 'As senhas não coincidem'
                            })}
                            className={errors.confirmPassword ? 'border-red-500' : ''}
                          />
                          {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
                        </div>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {isSubmitting ? 'Salvando...' : 'Salvar Nova Senha'}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="vault" className="mt-6">
                <MyVaultTab />
              </TabsContent>

              <TabsContent value="expenses" className="mt-6">
                <TravelExpensesTab />
              </TabsContent>
            </Tabs>
          </div>
        </>
      );
    };

    export default ProfilePage;