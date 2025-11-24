import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '../ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import MasterPasswordDialog from '@/components/admin/MasterPasswordDialog';

const CategoryManager = ({ title, mainCategory, categories, onAddCategory, onDeleteCategory }) => {
    const [newCategoryName, setNewCategoryName] = useState('');

    const handleAdd = () => {
        if (newCategoryName.trim()) {
            onAddCategory(mainCategory, newCategoryName.trim());
            setNewCategoryName('');
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Input
                        placeholder="Nome da nova subcategoria"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                    />
                    <Button onClick={handleAdd}><PlusCircle className="h-4 w-4" /></Button>
                </div>
                <ul className="space-y-2">
                    {categories.map(cat => (
                        <li key={cat.id} className="flex justify-between items-center p-2 bg-slate-800 rounded-md">
                            <span>{cat.name}</span>
                             <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-400" onClick={() => onDeleteCategory(cat)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
};

const DocumentaBLSettings = () => {
    const { toast } = useToast();
    const { refetchData, documentabl } = useData();
    const { categories = [] } = documentabl;
    const { user } = useAuth();
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);

    const promptDeleteCategory = (category) => {
        setCategoryToDelete(category);
        setIsPasswordDialogOpen(true);
    };

    const handleDeleteCategory = async () => {
        if (!categoryToDelete) return;
        const { error } = await supabase
            .from('documentabl_categories')
            .delete()
            .eq('id', categoryToDelete.id);
        
        setIsPasswordDialogOpen(false);
        setCategoryToDelete(null);

        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao deletar categoria', description: error.message });
        } else {
            toast({ title: 'Categoria deletada com sucesso!'});
            refetchData();
        }
    };
    
    const handleAddCategory = async (mainCategory, name) => {
        if (!name) {
            toast({ variant: 'destructive', title: 'O nome da categoria é obrigatório.' });
            return;
        }

        const { error } = await supabase
            .from('documentabl_categories')
            .insert({ main_category: mainCategory, name: name, user_id: user.id });

        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao adicionar categoria', description: error.message });
        } else {
            toast({ title: 'Categoria adicionada com sucesso!' });
            refetchData();
        }
    };


    const getCategoriesByMain = useMemo(() => (main) => {
      return categories.filter(c => c.main_category === main)
    }, [categories]);

    return (
        <>
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold">Configurações do DocumentaBL</h2>
                    <p className="text-muted-foreground">Personalize categorias, periodicidades e modelos.</p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <CategoryManager 
                        title="Categorias da Empresa"
                        mainCategory="empresa"
                        categories={getCategoriesByMain('empresa')}
                        onAddCategory={handleAddCategory}
                        onDeleteCategory={promptDeleteCategory}
                    />
                     <CategoryManager 
                        title="Categorias de Colaborador"
                        mainCategory="colaborador"
                        categories={getCategoriesByMain('colaborador')}
                        onAddCategory={handleAddCategory}
                        onDeleteCategory={promptDeleteCategory}
                    />
                     <CategoryManager 
                        title="Categorias de Equipamento"
                        mainCategory="equipamento"
                        categories={getCategoriesByMain('equipamento')}
                        onAddCategory={handleAddCategory}
                        onDeleteCategory={promptDeleteCategory}
                    />
                     <CategoryManager 
                        title="Categorias de Segurança"
                        mainCategory="seguranca"
                        categories={getCategoriesByMain('seguranca')}
                        onAddCategory={handleAddCategory}
                        onDeleteCategory={promptDeleteCategory}
                    />
                    <CategoryManager 
                        title="Categorias de Demandas"
                        mainCategory="demandas"
                        categories={getCategoriesByMain('demandas')}
                        onAddCategory={handleAddCategory}
                        onDeleteCategory={promptDeleteCategory}
                    />
                </div>
            </div>
            <MasterPasswordDialog
                isOpen={isPasswordDialogOpen}
                onClose={() => setIsPasswordDialogOpen(false)}
                onConfirm={handleDeleteCategory}
                title="Confirmar Exclusão de Categoria"
                description={`Tem certeza de que deseja excluir a categoria "${categoryToDelete?.name}"? Esta ação não pode ser desfeita.`}
            />
        </>
    );
};

export default DocumentaBLSettings;