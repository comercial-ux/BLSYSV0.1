import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';
import MasterPasswordDialog from '@/components/admin/MasterPasswordDialog';
import { Textarea } from '@/components/ui/textarea';

const CompanyDetailsManagement = ({ companyDetails, onUpdate }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [formDataToSave, setFormDataToSave] = useState(null);
    const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm();

    useEffect(() => {
        if (companyDetails) {
            reset(companyDetails);
        }
    }, [companyDetails, reset]);

    const handleFormSubmit = (data) => {
        setFormDataToSave(data);
        setIsPasswordDialogOpen(true);
    };

    const handlePasswordConfirm = async () => {
        if (!user || !formDataToSave) {
            toast({ variant: 'destructive', title: 'Erro de Autenticação ou dados em falta.' });
            return;
        }
        setIsSubmitting(true);
        setIsPasswordDialogOpen(false);

        const dataToSave = { ...formDataToSave, user_id: user.id, updated_at: new Date().toISOString() };
        
        let error;
        if (companyDetails?.id) {
            const { error: updateError } = await supabase
                .from('company_details')
                .update(dataToSave)
                .eq('id', companyDetails.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from('company_details')
                .insert(dataToSave);
            error = insertError;
        }

        setIsSubmitting(false);

        if (error) {
            toast({
                variant: 'destructive',
                title: 'Erro ao Salvar Dados',
                description: error.message,
            });
        } else {
            toast({
                title: 'Dados da Empresa Salvos!',
                description: 'As informações foram atualizadas com sucesso.',
            });
            onUpdate();
        }
        setFormDataToSave(null);
    };

    return (
        <>
            <Card className="mt-6">
                <form onSubmit={handleSubmit(handleFormSubmit)}>
                    <CardHeader>
                        <CardTitle>Dados da Empresa (Contratada)</CardTitle>
                        <CardDescription>
                            Estas informações serão usadas como os dados da sua empresa nas propostas comerciais e outros documentos.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label htmlFor="company_name">Razão Social</Label>
                                <Input id="company_name" {...register('company_name')} className="mt-1" />
                            </div>
                            <div>
                                <Label htmlFor="trade_name">Nome Fantasia</Label>
                                <Input id="trade_name" {...register('trade_name')} className="mt-1" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <Label htmlFor="cnpj">CNPJ</Label>
                                <Input id="cnpj" {...register('cnpj')} className="mt-1" />
                            </div>
                            <div>
                                <Label htmlFor="ie">Inscrição Estadual (IE)</Label>
                                <Input id="ie" {...register('ie')} className="mt-1" />
                            </div>
                            <div>
                                <Label htmlFor="im">Inscrição Municipal (IM)</Label>
                                <Input id="im" {...register('im')} className="mt-1" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label htmlFor="email">E-mail de Contato</Label>
                                <Input id="email" type="email" {...register('email')} className="mt-1" />
                            </div>
                            <div>
                                <Label htmlFor="phone">Telefone de Contato</Label>
                                <Input id="phone" {...register('phone')} className="mt-1" />
                            </div>
                        </div>
                        <fieldset className="border-t border-border pt-6">
                            <legend className="text-base font-semibold text-foreground mb-4">Endereço</legend>
                            <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                                <div className="md:col-span-4">
                                    <Label htmlFor="address_street">Logradouro</Label>
                                    <Input id="address_street" {...register('address_street')} className="mt-1" />
                                </div>
                                <div className="md:col-span-2">
                                    <Label htmlFor="address_number">Número</Label>
                                    <Input id="address_number" {...register('address_number')} className="mt-1" />
                                </div>
                                <div className="md:col-span-3">
                                    <Label htmlFor="address_complement">Complemento</Label>
                                    <Input id="address_complement" {...register('address_complement')} className="mt-1" />
                                </div>
                                <div className="md:col-span-3">
                                    <Label htmlFor="address_neighborhood">Bairro</Label>
                                    <Input id="address_neighborhood" {...register('address_neighborhood')} className="mt-1" />
                                </div>
                                <div className="md:col-span-3">
                                    <Label htmlFor="address_city">Cidade</Label>
                                    <Input id="address_city" {...register('address_city')} className="mt-1" />
                                </div>
                                <div className="md:col-span-2">
                                    <Label htmlFor="address_state">Estado</Label>
                                    <Input id="address_state" {...register('address_state')} className="mt-1" />
                                </div>
                                <div className="md:col-span-1">
                                    <Label htmlFor="address_zip_code">CEP</Label>
                                    <Input id="address_zip_code" {...register('address_zip_code')} className="mt-1" />
                                </div>
                            </div>
                        </fieldset>
                         <fieldset className="border-t border-border pt-6">
                            <legend className="text-base font-semibold text-foreground mb-4">Rodapé das Propostas</legend>
                            <div>
                                <Label htmlFor="proposal_footer_text">Texto do Rodapé</Label>
                                <Textarea 
                                    id="proposal_footer_text" 
                                    {...register('proposal_footer_text')} 
                                    className="mt-1" 
                                    rows={4}
                                    placeholder="Ex: BL SOLUÇÕES LTDA | CNPJ: 25.206.054/0001-39 | (85) 9 8824-2019 | COMERCIAL@BL.NET.BR"
                                />
                                <p className="text-sm text-muted-foreground mt-2">
                                    Este texto aparecerá no rodapé de todas as propostas comerciais impressas.
                                </p>
                            </div>
                        </fieldset>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                        <Button type="submit" disabled={isSubmitting || !isDirty}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Salvar Alterações
                        </Button>
                    </CardFooter>
                </form>
            </Card>
            <MasterPasswordDialog
                isOpen={isPasswordDialogOpen}
                onClose={() => setIsPasswordDialogOpen(false)}
                onConfirm={handlePasswordConfirm}
                isSubmitting={isSubmitting}
            />
        </>
    );
};

export default CompanyDetailsManagement;