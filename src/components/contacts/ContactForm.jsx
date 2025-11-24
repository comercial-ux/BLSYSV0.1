import React, { useState, useEffect } from 'react';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import { toast } from '@/components/ui/use-toast';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Textarea } from '@/components/ui/textarea';
    import { ScrollArea } from '@/components/ui/scroll-area';
    import { DialogFooter } from '@/components/ui/dialog';
    import { Loader2 } from 'lucide-react';
    import { Checkbox } from '@/components/ui/checkbox';

    const getInitialFormData = (forcedType) => ({
        type: forcedType || 'Cliente',
        person_type: 'Jurídica',
        name: '',
        email: '',
        phone: '',
        address_zip_code: '',
        address_street: '',
        address_number: '',
        address_complement: '',
        address_neighborhood: '',
        address_city: '',
        address_state: '',
        trade_name: '',
        cnpj: '',
        ie: '',
        im: '',
        cpf: '',
        rg: '',
        purchase_limit: null,
        notes: '',
        function: '',
        status: 'Ativo',
        show_on_site: false,
        admission_date: '',
    });

    const ContactForm = ({ contact, onSave, onClose, forcedType }) => {
        const { user } = useAuth();
        const [formData, setFormData] = useState(getInitialFormData(forcedType));
        const [isSubmitting, setIsSubmitting] = useState(false);
        const collaboratorFunctions = ["Operador", "Sinaleiro", "Carreteiro", "Mecanico", "Operador de Munk", "Encarregado", "Geral"];

        useEffect(() => {
            if (contact) {
                setFormData({
                    ...getInitialFormData(forcedType),
                    ...contact,
                    purchase_limit: contact.purchase_limit ?? '',
                    admission_date: contact.admission_date ? contact.admission_date.split('T')[0] : '',
                });
            } else {
                setFormData(getInitialFormData(forcedType));
            }
        }, [contact, forcedType]);

        const handleChange = (e) => {
            const { name, value, type, checked } = e.target;
            setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        };

        const handleSelectChange = (name, value) => {
            setFormData(prev => ({ ...prev, [name]: value }));
        };
        
        const fetchAddressByZip = async (zip) => {
            if (zip.length !== 8) return;
            try {
                const res = await fetch(`https://viacep.com.br/ws/${zip}/json/`);
                if (!res.ok) throw new Error('CEP não encontrado');
                const data = await res.json();
                if (data.erro) throw new Error('CEP inválido');
                setFormData(prev => ({
                    ...prev,
                    address_street: data.logradouro,
                    address_neighborhood: data.bairro,
                    address_city: data.localidade,
                    address_state: data.uf,
                }));
            } catch (error) {
                toast({ variant: 'destructive', title: 'Erro ao buscar CEP', description: error.message });
            }
        };

        const handleSubmit = async (e) => {
            e.preventDefault();
            if (!user) {
                toast({ variant: 'destructive', title: 'Erro de Autenticação' });
                return;
            }
            setIsSubmitting(true);
            const dataToSubmit = { ...formData, user_id: user.id };
            
            if (dataToSubmit.purchase_limit === '') {
                dataToSubmit.purchase_limit = null;
            }
            if (dataToSubmit.admission_date === '') {
                dataToSubmit.admission_date = null;
            }

            let error;
            if (contact) {
                const { error: updateError } = await supabase.from('contacts').update(dataToSubmit).eq('id', contact.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase.from('contacts').insert([dataToSubmit]);
                error = insertError;
            }
            
            setIsSubmitting(false);

            if (error) {
                toast({ variant: 'destructive', title: 'Erro ao Salvar Contato', description: error.message });
            } else {
                toast({ title: `Contato ${contact ? 'Atualizado' : 'Criado'}!`, description: 'O contato foi salvo com sucesso.' });
                onSave();
            }
        };

        const renderJuridicaFields = () => (
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Nome Fantasia</Label><Input name="trade_name" value={formData.trade_name || ''} onChange={handleChange} className="mt-1" /></div>
                    <div><Label>CNPJ</Label><Input name="cnpj" value={formData.cnpj || ''} onChange={handleChange} className="mt-1" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Inscrição Estadual</Label><Input name="ie" value={formData.ie || ''} onChange={handleChange} className="mt-1" /></div>
                    <div><Label>Inscrição Municipal</Label><Input name="im" value={formData.im || ''} onChange={handleChange} className="mt-1" /></div>
                </div>
            </>
        );

        const renderFisicaFields = () => (
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>CPF</Label><Input name="cpf" value={formData.cpf || ''} onChange={handleChange} className="mt-1" /></div>
                    <div><Label>RG</Label><Input name="rg" value={formData.rg || ''} onChange={handleChange} className="mt-1" /></div>
                </div>
            </>
        );

        const renderColaboradorFields = () => (
            <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <Label>Função</Label>
                        <Select value={formData.function || ''} onValueChange={(v) => handleSelectChange('function', v)}>
                            <SelectTrigger className="w-full mt-1 bg-white/10 border-white/20 text-white"><SelectValue placeholder="Selecione a função..." /></SelectTrigger>
                            <SelectContent>
                                {collaboratorFunctions.map(func => (
                                    <SelectItem key={func} value={func}>{func}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Status</Label>
                        <Select value={formData.status || 'Ativo'} onValueChange={(v) => handleSelectChange('status', v)}>
                            <SelectTrigger className="w-full mt-1 bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Ativo">Ativo</SelectItem>
                                <SelectItem value="Inativo">Inativo</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Data de Admissão</Label>
                        <Input type="date" name="admission_date" value={formData.admission_date || ''} onChange={handleChange} className="mt-1" />
                    </div>
                </div>
            </>
        );
        
        return (
            <form onSubmit={handleSubmit}>
                <ScrollArea className="h-[70vh] pr-6">
                    <div className="space-y-4">
                        {!forcedType && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Tipo de Contato</Label>
                                    <Select value={formData.type || ''} onValueChange={(v) => handleSelectChange('type', v)}>
                                        <SelectTrigger className="w-full mt-1"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Cliente">Cliente</SelectItem>
                                            <SelectItem value="Fornecedor">Fornecedor</SelectItem>
                                            <SelectItem value="Colaborador">Colaborador</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {formData.type !== 'Colaborador' && (
                                <div>
                                    <Label>Tipo de Pessoa</Label>
                                    <Select value={formData.person_type || ''} onValueChange={(v) => handleSelectChange('person_type', v)}>
                                        <SelectTrigger className="w-full mt-1"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Jurídica">Jurídica</SelectItem>
                                            <SelectItem value="Física">Física</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                )}
                            </div>
                        )}
                        
                        <div><Label>Nome / Razão Social</Label><Input name="name" value={formData.name || ''} onChange={handleChange} className="mt-1" required /></div>

                        {formData.type !== 'Colaborador' ? (
                          formData.person_type === 'Jurídica' ? renderJuridicaFields() : renderFisicaFields()
                        ) : renderColaboradorFields()}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><Label>E-mail</Label><Input type="email" name="email" value={formData.email || ''} onChange={handleChange} className="mt-1" /></div>
                            <div><Label>Telefone</Label><Input name="phone" value={formData.phone || ''} onChange={handleChange} className="mt-1" /></div>
                        </div>

                        <div className="border p-4 rounded-lg space-y-4 border-white/10">
                            <h3 className="text-lg font-semibold text-primary">Endereço</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div><Label>CEP</Label><Input name="address_zip_code" value={formData.address_zip_code || ''} onChange={handleChange} onBlur={(e) => fetchAddressByZip(e.target.value)} className="mt-1" /></div>
                                <div className="md:col-span-2"><Label>Rua</Label><Input name="address_street" value={formData.address_street || ''} onChange={handleChange} className="mt-1" /></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div><Label>Número</Label><Input name="address_number" value={formData.address_number || ''} onChange={handleChange} className="mt-1" /></div>
                                <div><Label>Complemento</Label><Input name="address_complement" value={formData.address_complement || ''} onChange={handleChange} className="mt-1" /></div>
                                <div><Label>Bairro</Label><Input name="address_neighborhood" value={formData.address_neighborhood || ''} onChange={handleChange} className="mt-1" /></div>
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><Label>Cidade</Label><Input name="address_city" value={formData.address_city || ''} onChange={handleChange} className="mt-1" /></div>
                                <div><Label>Estado</Label><Input name="address_state" value={formData.address_state || ''} onChange={handleChange} className="mt-1" /></div>
                            </div>
                        </div>

                        {formData.type === 'Fornecedor' && (
                            <div><Label>Limite de Compra (R$)</Label><Input type="number" step="0.01" name="purchase_limit" value={formData.purchase_limit || ''} onChange={handleChange} className="mt-1" /></div>
                        )}

                        <div><Label>Observações</Label><Textarea name="notes" value={formData.notes || ''} onChange={handleChange} className="mt-1" /></div>
                        
                        {formData.type === 'Cliente' && (
                            <div className="flex items-center space-x-2">
                                <Checkbox id="show_on_site" name="show_on_site" checked={formData.show_on_site} onCheckedChange={(checked) => handleChange({ target: { name: 'show_on_site', type: 'checkbox', checked } })} />
                                <Label htmlFor="show_on_site">Exibir como parceiro no site público</Label>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <DialogFooter className="pt-6">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar
                    </Button>
                </DialogFooter>
            </form>
        );
    };

    export default ContactForm;