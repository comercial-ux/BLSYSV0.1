import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { toast } from '@/components/ui/use-toast';
import { PlusCircle, Edit, Trash2, Loader2, ExternalLink } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useData } from '@/contexts/DataContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const GenericManager = ({ tableName, title, formFields, initialData, columns, onUpdate }) => {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
        defaultValues: initialData
    });

    const isActiveValue = watch('is_active');

    const fetchData = async () => {
        setLoading(true);
        const { data, error } = await supabase.from(tableName).select('*').order('display_order', { ascending: true });
        if (error) {
            toast({ variant: 'destructive', title: `Erro ao buscar ${title}`, description: error.message });
        } else {
            setItems(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [tableName]);

    const onSubmit = async (formData) => {
        setIsSubmitting(true);
        const dataToSave = { ...formData, user_id: user.id };

        let error;
        if (editingItem) {
            ({ error } = await supabase.from(tableName).update(dataToSave).eq('id', editingItem.id));
        } else {
            ({ error } = await supabase.from(tableName).insert([dataToSave]));
        }

        if (error) {
            toast({ variant: 'destructive', title: `Erro ao salvar ${title}`, description: error.message });
        } else {
            toast({ title: 'Sucesso!', description: `${title} ${editingItem ? 'atualizado' : 'criado'} com sucesso.` });
            setIsDialogOpen(false);
            setEditingItem(null);
            reset(initialData);
            fetchData();
            if (onUpdate) onUpdate();
        }
        setIsSubmitting(false);
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        reset(item);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm(`Tem certeza que deseja excluir este item de ${title}?`)) {
            const { error } = await supabase.from(tableName).delete().eq('id', id);
            if (error) {
                toast({ variant: 'destructive', title: `Erro ao excluir ${title}`, description: error.message });
            } else {
                toast({ title: 'Sucesso!', description: `${title} excluído.` });
                fetchData();
                if (onUpdate) onUpdate();
            }
        }
    };

    const openNewDialog = () => {
        setEditingItem(null);
        reset(initialData);
        setIsDialogOpen(true);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>Adicione, edite ou remova itens.</CardDescription>
                </div>
                <Button onClick={openNewDialog}><PlusCircle className="mr-2 h-4 w-4" /> Novo Item</Button>
            </CardHeader>
            <CardContent>
                {loading ? <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : (
                    <Table>
                        <TableHeader><TableRow>{columns.map(c => <TableHead key={c.key}>{c.label}</TableHead>)}<TableHead className="text-right w-[120px]">Ações</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {items.map((item) => (
                                <TableRow key={item.id}>
                                    {columns.map(c => {
                                        if (c.type === 'image') {
                                            return <TableCell key={c.key}><img-replace src={item[c.key]} alt={item.title || item.name} className="h-10 w-16 object-cover rounded-md" /></TableCell>
                                        }
                                        if (c.type === 'boolean') {
                                            return <TableCell key={c.key}>{item[c.key] ? 'Sim' : 'Não'}</TableCell>
                                        }
                                        return <TableCell key={c.key} className="max-w-[200px] truncate" title={item[c.key]}>{item[c.key]}</TableCell>
                                    })}
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="outline" size="icon" onClick={() => handleEdit(item)}><Edit className="h-4 w-4" /></Button>
                                        <Button variant="destructive" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[625px]">
                    <DialogHeader><DialogTitle>{editingItem ? 'Editar' : 'Novo'} {title}</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                        {formFields.map(field => (
                            <div key={field.name}>
                                <Label htmlFor={field.name}>{field.label}</Label>
                                {field.type === 'textarea' ? (
                                    <Textarea id={field.name} {...register(field.name, field.rules)} placeholder={field.placeholder} />
                                ) : field.type === 'switch' ? (
                                    <div className="flex items-center space-x-2 mt-2">
                                        <Switch id={field.name} checked={isActiveValue} onCheckedChange={(checked) => setValue(field.name, checked)} />
                                        <Label htmlFor={field.name}>{isActiveValue ? 'Ativo' : 'Inativo'}</Label>
                                    </div>
                                ) : (
                                    <Input id={field.name} type={field.type || 'text'} {...register(field.name, field.rules)} placeholder={field.placeholder} />
                                )}
                                {errors[field.name] && <p className="text-red-500 text-xs mt-1">{errors[field.name].message}</p>}
                            </div>
                        ))}
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </Card>
    );
};

const SiteAdminPage = () => {
    const { refetchData } = useData();

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Gerenciador de Conteúdo do Site</h1>
                <Button variant="outline" asChild>
                    <a href="/site" target="_blank" rel="noopener noreferrer">
                        Visualizar Site <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                </Button>
            </div>
            
            <Tabs defaultValue="banners" className="w-full">
                <TabsList className="grid w-full grid-cols-7">
                    <TabsTrigger value="banners">Banners</TabsTrigger>
                    <TabsTrigger value="services">Serviços</TabsTrigger>
                    <TabsTrigger value="equipments">Equipamentos</TabsTrigger>
                    <TabsTrigger value="portfolio">Portfólio</TabsTrigger>
                    <TabsTrigger value="testimonials">Depoimentos</TabsTrigger>
                    <TabsTrigger value="partners">Clientes</TabsTrigger>
                </TabsList>

                <TabsContent value="banners" className="mt-6">
                    <GenericManager tableName="site_banners" title="Banners (Hero Section)" onUpdate={refetchData}
                        columns={[
                            {key: 'image_url', label: 'Imagem', type: 'image'},
                            {key: 'title', label: 'Título'}, 
                            {key: 'subtitle', label: 'Subtítulo'},
                            {key: 'is_active', label: 'Ativo', type: 'boolean'}
                        ]}
                        initialData={{ title: '', subtitle: '', image_url: '', button_text: '', button_link: '', is_active: true, display_order: 0 }}
                        formFields={[
                            {name: 'title', label: 'Título'},
                            {name: 'subtitle', label: 'Subtítulo'},
                            {name: 'image_url', label: 'URL da Imagem', rules: {required: 'URL da imagem é obrigatória'}},
                            {name: 'button_text', label: 'Texto do Botão'},
                            {name: 'button_link', label: 'Link do Botão (ex: /contato)'},
                            {name: 'display_order', label: 'Ordem de Exibição', type: 'number'},
                            {name: 'is_active', label: 'Status', type: 'switch'},
                        ]}
                    />
                </TabsContent>

                <TabsContent value="services" className="mt-6">
                    <GenericManager tableName="site_services" title="Itens de Serviço" onUpdate={refetchData}
                        columns={[
                            {key: 'title', label: 'Título'}, 
                            {key: 'description', label: 'Descrição'},
                            {key: 'is_active', label: 'Ativo', type: 'boolean'}
                        ]}
                        initialData={{ title: '', description: '', icon_key: 'Cog', is_active: true, display_order: 0 }}
                        formFields={[
                            {name: 'title', label: 'Título', rules: {required: 'Título é obrigatório'}},
                            {name: 'description', label: 'Descrição', type: 'textarea'},
                            {name: 'icon_key', label: 'Ícone (Nome do ícone da biblioteca Lucide)', placeholder: 'Ex: Cog, Shield, Wrench'},
                            {name: 'display_order', label: 'Ordem de Exibição', type: 'number'},
                            {name: 'is_active', label: 'Status', type: 'switch'},
                        ]}
                    />
                </TabsContent>

                <TabsContent value="equipments" className="mt-6">
                    <GenericManager tableName="site_equipments" title="Equipamentos em Destaque" onUpdate={refetchData}
                        columns={[
                            {key: 'image_url', label: 'Imagem', type: 'image'},
                            {key: 'name', label: 'Nome'}, 
                            {key: 'description', label: 'Descrição'},
                            {key: 'is_active', label: 'Ativo', type: 'boolean'}
                        ]}
                        initialData={{ name: '', description: '', image_url: '', is_active: true, display_order: 0 }}
                        formFields={[
                            {name: 'name', label: 'Nome do Equipamento', rules: {required: 'Nome é obrigatório'}},
                            {name: 'description', label: 'Breve Descrição', type: 'textarea'},
                            {name: 'image_url', label: 'URL da Imagem', rules: {required: 'URL da imagem é obrigatória'}},
                            {name: 'display_order', label: 'Ordem de Exibição', type: 'number'},
                            {name: 'is_active', label: 'Status', type: 'switch'},
                        ]}
                    />
                </TabsContent>

                <TabsContent value="portfolio" className="mt-6">
                     <GenericManager tableName="site_portfolio_items" title="Itens do Portfólio" onUpdate={refetchData}
                        columns={[
                            {key: 'image_url', label: 'Imagem', type: 'image'},
                            {key: 'title', label: 'Título'}, 
                            {key: 'category', label: 'Categoria'},
                            {key: 'is_active', label: 'Ativo', type: 'boolean'}
                        ]}
                        initialData={{ title: '', category: '', image_url: '', is_active: true, display_order: 0 }}
                        formFields={[
                            {name: 'title', label: 'Título', rules: {required: 'Título é obrigatório'}},
                            {name: 'category', label: 'Categoria (ex: Içamento, Transporte)'},
                            {name: 'image_url', label: 'URL da Imagem', rules: {required: 'URL da imagem é obrigatória'}},
                            {name: 'display_order', label: 'Ordem de Exibição', type: 'number'},
                            {name: 'is_active', label: 'Status', type: 'switch'},
                        ]}
                    />
                </TabsContent>

                <TabsContent value="testimonials" className="mt-6">
                    <GenericManager tableName="site_testimonials" title="Depoimentos de Clientes" onUpdate={refetchData}
                        columns={[
                            {key: 'author_image_url', label: 'Foto', type: 'image'},
                            {key: 'author_name', label: 'Autor'}, 
                            {key: 'testimonial_text', label: 'Depoimento'},
                            {key: 'is_active', label: 'Ativo', type: 'boolean'}
                        ]}
                        initialData={{ author_name: '', author_role: '', author_image_url: '', testimonial_text: '', is_active: true, display_order: 0 }}
                        formFields={[
                            {name: 'author_name', label: 'Nome do Autor', rules: {required: 'Nome é obrigatório'}},
                            {name: 'author_role', label: 'Cargo/Empresa do Autor'},
                            {name: 'author_image_url', label: 'URL da Foto do Autor'},
                            {name: 'testimonial_text', label: 'Texto do Depoimento', type: 'textarea', rules: {required: 'Depoimento é obrigatório'}},
                            {name: 'display_order', label: 'Ordem de Exibição', type: 'number'},
                            {name: 'is_active', label: 'Status', type: 'switch'},
                        ]}
                    />
                </TabsContent>

                <TabsContent value="partners" className="mt-6">
                    <GenericManager tableName="site_partners" title="Clientes & Parceiros" onUpdate={refetchData}
                        columns={[
                            {key: 'logo_url', label: 'Logo', type: 'image'},
                            {key: 'name', label: 'Nome'}, 
                            {key: 'website_url', label: 'Website'},
                            {key: 'is_active', label: 'Ativo', type: 'boolean'}
                        ]}
                        initialData={{ name: '', logo_url: '', website_url: '', is_active: true, display_order: 0 }}
                        formFields={[
                            {name: 'name', label: 'Nome do Cliente/Parceiro', rules: {required: 'Nome é obrigatório'}},
                            {name: 'logo_url', label: 'URL do Logo', rules: {required: 'URL do logo é obrigatória'}},
                            {name: 'website_url', label: 'URL do Site (opcional)'},
                            {name: 'display_order', label: 'Ordem de Exibição', type: 'number'},
                            {name: 'is_active', label: 'Status', type: 'switch'},
                        ]}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default SiteAdminPage;