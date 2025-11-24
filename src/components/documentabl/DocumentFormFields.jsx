import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, PlusCircle } from 'lucide-react';
import { useToast } from '../ui/use-toast';
import { useData } from '@/contexts/DataContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';

const AddCategoryPopover = ({ mainCategory, onCategoryAdded }) => {
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();
    const { refetchData } = useData();

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) {
            toast({ variant: 'destructive', title: 'Nome da categoria é obrigatório.' });
            return;
        }
        setIsSubmitting(true);
        const { data, error } = await supabase
            .from('documentabl_categories')
            .insert({ main_category: mainCategory, name: newCategoryName.trim(), user_id: user.id })
            .select()
            .single();

        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao adicionar categoria', description: error.message });
        } else {
            toast({ title: 'Categoria adicionada!' });
            await refetchData();
            onCategoryAdded(data.id.toString());
            setNewCategoryName('');
        }
        setIsSubmitting(false);
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="icon"><PlusCircle className="h-4 w-4" /></Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">Nova Categoria</h4>
                        <p className="text-sm text-muted-foreground">
                            Adicione uma nova sub-categoria para "{mainCategory}".
                        </p>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="width">Nome</Label>
                        <Input
                            id="new-category-name"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="h-8"
                        />
                         <Button onClick={handleAddCategory} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Adicionar
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};

const DocumentFormFields = ({
    formData,
    setFormData,
    mainCategory,
    categories,
    colaboradorOptions,
    equipamentoOptions,
    documentToEdit,
    onFileChange,
    onQuickAdd,
    fieldDisabled = {},
}) => {
    const { toast } = useToast();
    const [file, setLocalFile] = useState(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
                toast({ variant: 'destructive', title: 'Arquivo muito grande', description: 'O tamanho máximo do arquivo é 10MB.' });
                e.target.value = ''; // Reset file input
                return;
            }
            setLocalFile(selectedFile);
            onFileChange(selectedFile);
        }
    };
    
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleComboboxChange = (name, value) => {
        let finalValue = value;
        let finalName = formData.name;

        if (name === 'colaborador_id') {
            const selected = colaboradorOptions.find(opt => opt.value === value);
            finalName = selected ? selected.label : formData.name;
        } else if (name === 'equipamento_id') {
            const selected = equipamentoOptions.find(opt => opt.value === value);
            finalName = selected ? selected.label : formData.name;
        }
        
        setFormData(prev => ({
            ...prev,
            [name]: finalValue,
            name: finalName
        }));
    };

    const renderNameField = () => {
        if (mainCategory === 'colaborador') {
            return (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="colaborador_id" className="text-right">Colaborador</Label>
                    <div className="col-span-3">
                        <Combobox
                            options={colaboradorOptions}
                            value={formData.colaborador_id}
                            onChange={(value) => handleComboboxChange('colaborador_id', value)}
                            placeholder="Selecione um colaborador"
                            searchPlaceholder="Pesquisar colaborador..."
                            onQuickAdd={onQuickAdd}
                            quickAddText="Novo Colaborador"
                            disabled={fieldDisabled.colaborador_id}
                        />
                    </div>
                </div>
            );
        }
        if (mainCategory === 'equipamento') {
             return (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="equipamento_id" className="text-right">Equipamento</Label>
                    <div className="col-span-3">
                        <Combobox
                            options={equipamentoOptions}
                            value={formData.equipamento_id}
                            onChange={(value) => handleComboboxChange('equipamento_id', value)}
                            placeholder="Selecione um equipamento"
                            searchPlaceholder="Pesquisar equipamento..."
                            onQuickAdd={onQuickAdd}
                            quickAddText="Novo Equipamento"
                            disabled={fieldDisabled.equipamento_id}
                        />
                    </div>
                </div>
            );
        }
        return (
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Nome do Doc.</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} className="col-span-3" required />
            </div>
        );
    };

    return (
        <>
            {renderNameField()}
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category_id" className="text-right">Categoria</Label>
                <div className="col-span-3 flex gap-2">
                    <Select name="category_id" onValueChange={v => handleSelectChange('category_id', v)} value={formData.category_id} disabled={fieldDisabled.category_id}>
                        <SelectTrigger className="flex-grow"><SelectValue placeholder="Selecione uma categoria..." /></SelectTrigger>
                        <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                    {!fieldDisabled.category_id && <AddCategoryPopover mainCategory={mainCategory} onCategoryAdded={(newId) => handleSelectChange('category_id', newId)} />}
                </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="periodicity" className="text-right">Periodicidade</Label>
                <Select name="periodicity" onValueChange={v => handleSelectChange('periodicity', v)} value={formData.periodicity}>
                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="mensal">Mensal</SelectItem>
                        <SelectItem value="trimestral">Trimestral</SelectItem>
                        <SelectItem value="semestral">Semestral</SelectItem>
                        <SelectItem value="anual">Anual</SelectItem>
                        <SelectItem value="inicio_contrato">Início de Contrato</SelectItem>
                        <SelectItem value="quando_houver">Quando Houver</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid grid-cols-2 items-center gap-4">
                    <Label htmlFor="version_string" className="text-right">Versão</Label>
                    <Input id="version_string" name="version_string" value={formData.version_string} onChange={handleChange} />
                </div>
                <div className="grid grid-cols-2 items-center gap-4">
                    <Label htmlFor="reference_code" className="text-right">Código</Label>
                    <Input id="reference_code" name="reference_code" value={formData.reference_code} onChange={handleChange} />
                </div>
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="grid grid-cols-2 items-center gap-4">
                    <Label htmlFor="creation_date" className="text-right">Data Criação</Label>
                    <Input id="creation_date" type="date" name="creation_date" value={formData.creation_date} onChange={handleChange} required />
                </div>
                <div className="grid grid-cols-2 items-center gap-4">
                    <Label htmlFor="expiry_date" className="text-right">Data Validade</Label>
                    <Input id="expiry_date" type="date" name="expiry_date" value={formData.expiry_date} onChange={handleChange} />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="file">{documentToEdit ? 'Substituir Arquivo' : 'Arquivo do Documento'}</Label>
                <Input id="file" type="file" onChange={handleFileChange} className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"/>
                {file && <p className="text-sm text-muted-foreground">Arquivo selecionado: {file.name}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} />
            </div>
            
            <div className="flex items-center space-x-4">
                 <div className="flex items-center space-x-2">
                    <Checkbox id="is_mandatory" name="is_mandatory" checked={formData.is_mandatory} onCheckedChange={c => handleSelectChange('is_mandatory', c)} />
                    <Label htmlFor="is_mandatory">Documento Obrigatório</Label>
                </div>
                 <div className="flex items-center space-x-2">
                    <Checkbox id="include_in_packages" name="include_in_packages" checked={formData.include_in_packages} onCheckedChange={c => handleSelectChange('include_in_packages', c)}/>
                    <Label htmlFor="include_in_packages">Incluir em pacotes</Label>
                </div>
            </div>
        </>
    );
};

export default DocumentFormFields;