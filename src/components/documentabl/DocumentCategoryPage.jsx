import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, FileText, Users, HardHat, Truck, MoreHorizontal, Download, Edit, Trash2, Filter, X, Lock, LayoutGrid, List, Eye, ArrowUpDown } from 'lucide-react';
import DocumentFormDialog from './DocumentFormDialog';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { format, parseISO, isAfter } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu.jsx';
import { getDocumentStatus } from '@/lib/documentabl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MasterPasswordDialog from '@/components/admin/MasterPasswordDialog';
import { Combobox } from '@/components/ui/combobox';

const categoryConfig = {
    empresa: { title: 'Documentação da Empresa', icon: <FileText className="h-6 w-6" /> },
    colaborador: { title: 'Documentação de Colaborador', icon: <Users className="h-6 w-6" /> },
    equipamento: { title: 'Documentação de Equipamento', icon: <Truck className="h-6 w-6" /> },
    seguranca: { title: 'Documentação de Segurança', icon: <HardHat className="h-6 w-6" /> },
    administrativa: { title: 'Documentação Administrativa', icon: <Lock className="h-6 w-6" /> }
};

const DocumentCategoryPage = ({ mainCategory }) => {
    const { documentabl, refetchData, commercialData, equipments } = useData();
    const { documents, categories } = documentabl;
    const { toast } = useToast();
    const navigate = useNavigate();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [documentToEdit, setDocumentToEdit] = useState(null);
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });

    const [filters, setFilters] = useState({
        searchTerm: '',
        categoryId: 'all',
        expiryDate: '',
        showValid: false,
        showExpired: false,
        colaboradorId: '',
        equipamentoId: '',
    });

    const config = categoryConfig[mainCategory] || { title: 'Documentos', icon: <FileText /> };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };
    
    const clearFilters = () => {
        setFilters({
            searchTerm: '',
            categoryId: 'all',
            expiryDate: '',
            showValid: false,
            showExpired: false,
            colaboradorId: '',
            equipamentoId: '',
        });
    };

    const colaboradorOptions = useMemo(() => 
        (commercialData?.contacts || []).filter(c => c.type === 'Colaborador').map(c => ({ value: c.id.toString(), label: c.name }))
    , [commercialData.contacts]);

    const equipamentoOptions = useMemo(() =>
        (equipments || []).map(e => ({ value: e.id.toString(), label: e.name }))
    , [equipments]);

    const sortedDocuments = useMemo(() => {
        if (!documents) return [];
        let baseDocuments = documents.filter(doc => doc.main_category === mainCategory && doc.is_active);

        if (filters.searchTerm) {
            const term = filters.searchTerm.toLowerCase();
            baseDocuments = baseDocuments.filter(doc => {
                const nameMatch = doc.name.toLowerCase().includes(term);
                const colaboradorName = doc.colaborador?.name.toLowerCase() || '';
                const equipamentoName = doc.equipamento?.name.toLowerCase() || '';
                return nameMatch || colaboradorName.includes(term) || equipamentoName.includes(term);
            });
        }

        if (mainCategory === 'colaborador' && filters.colaboradorId) {
            baseDocuments = baseDocuments.filter(doc => doc.colaborador_id?.toString() === filters.colaboradorId);
        }

        if (mainCategory === 'equipamento' && filters.equipamentoId) {
            baseDocuments = baseDocuments.filter(doc => doc.equipamento_id?.toString() === filters.equipamentoId);
        }
        
        if (filters.categoryId && filters.categoryId !== 'all') {
            baseDocuments = baseDocuments.filter(doc => doc.category_id?.toString() === filters.categoryId);
        }

        if (filters.showValid) {
            baseDocuments = baseDocuments.filter(doc => getDocumentStatus(doc).text === 'Válido');
        }

        if (filters.showExpired) {
            baseDocuments = baseDocuments.filter(doc => getDocumentStatus(doc).text.startsWith('Vencido'));
        }

        if(filters.expiryDate) {
            const filterDate = parseISO(filters.expiryDate);
            baseDocuments = baseDocuments.filter(doc => {
                if (!doc.current_version?.expiry_date) return false;
                const docExpiry = parseISO(doc.current_version.expiry_date);
                return !isAfter(docExpiry, filterDate);
            });
        }

        if (sortConfig.key) {
            baseDocuments.sort((a, b) => {
                let aValue, bValue;

                if (sortConfig.key === 'name') {
                    aValue = a.name || a.colaborador?.name || a.equipamento?.name || '';
                    bValue = b.name || b.colaborador?.name || b.equipamento?.name || '';
                } else if (sortConfig.key === 'category') {
                    aValue = a.category?.name || '';
                    bValue = b.category?.name || '';
                } else {
                    aValue = a[sortConfig.key];
                    bValue = b[sortConfig.key];
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }

        return baseDocuments;
    }, [documents, mainCategory, filters, sortConfig, colaboradorOptions, equipamentoOptions]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key) => {
        if (sortConfig.key !== key) {
            return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
        }
        return sortConfig.direction === 'ascending' ? '🔼' : '🔽';
    };

    const subCategories = useMemo(() => {
        if (!categories) return [];
        return categories.filter(cat => cat.main_category === mainCategory);
    }, [categories, mainCategory]);

    const handleOpenForm = (doc = null) => {
        setDocumentToEdit(doc);
        setIsFormOpen(true);
    };

    const promptDeleteDocument = (doc) => {
        setDocumentToDelete(doc);
        setIsPasswordDialogOpen(true);
    };

    const handleDeleteDocument = async () => {
        if (!documentToDelete) return;
        const { error } = await supabase
            .from('documentabl_documents')
            .update({ is_active: false })
            .eq('id', documentToDelete.id);

        setIsPasswordDialogOpen(false);
        setDocumentToDelete(null);

        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao deletar documento', description: error.message });
        } else {
            toast({ title: 'Documento deletado com sucesso!' });
            refetchData();
        }
    };
    
    const hasActiveFilters = Object.values(filters).some(v => v && v !== 'all');

    const renderNameFilter = () => {
        if (mainCategory === 'colaborador') {
            return (
                <div>
                    <Label htmlFor="colaboradorFilter">Colaborador</Label>
                    <Combobox
                        id="colaboradorFilter"
                        options={colaboradorOptions}
                        value={filters.colaboradorId}
                        onChange={(value) => handleFilterChange('colaboradorId', value)}
                        placeholder="Selecione um colaborador"
                        searchPlaceholder="Pesquisar colaborador..."
                        emptyText="Nenhum colaborador encontrado."
                    />
                </div>
            );
        }
        if (mainCategory === 'equipamento') {
            return (
                <div>
                    <Label htmlFor="equipamentoFilter">Equipamento</Label>
                    <Combobox
                        id="equipamentoFilter"
                        options={equipamentoOptions}
                        value={filters.equipamentoId}
                        onChange={(value) => handleFilterChange('equipamentoId', value)}
                        placeholder="Selecione um equipamento"
                        searchPlaceholder="Pesquisar equipamento..."
                        emptyText="Nenhum equipamento encontrado."
                    />
                </div>
            );
        }
        return (
            <div>
                <Label htmlFor="search">Nome</Label>
                <Input
                    id="search"
                    placeholder="Buscar por nome..."
                    value={filters.searchTerm}
                    onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                />
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        {config.icon}
                        <div>
                            <CardTitle className="text-2xl">{config.title}</CardTitle>
                            <CardDescription>Gerencie todos os documentos relacionados.</CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {mainCategory === 'colaborador' && (
                            <Button variant="outline" onClick={() => navigate('/documentabl/colaborador/matrix')}>
                                <LayoutGrid className="mr-2 h-4 w-4" />
                                Visão por Matriz
                            </Button>
                        )}
                        {mainCategory === 'equipamento' && (
                            <Button variant="outline" onClick={() => navigate('/documentabl/equipamento/matrix')}>
                                <LayoutGrid className="mr-2 h-4 w-4" />
                                Visão por Matriz
                            </Button>
                        )}
                        <Button onClick={() => handleOpenForm()}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Novo Documento
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="bg-muted/50 p-4 rounded-lg mb-6 border">
                        <div className="flex items-center gap-2 mb-4">
                            <Filter className="h-5 w-5" />
                            <h3 className="text-lg font-semibold">Filtros</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                            {renderNameFilter()}
                            <div>
                                <Label htmlFor="category">Categoria</Label>
                                <Select value={filters.categoryId} onValueChange={(v) => handleFilterChange('categoryId', v)}>
                                    <SelectTrigger id="category">
                                        <SelectValue placeholder="Todas as categorias" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas as categorias</SelectItem>
                                        {subCategories.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="expiryDate">Validade até</Label>
                                <Input
                                    id="expiryDate"
                                    type="date"
                                    value={filters.expiryDate}
                                    onChange={(e) => handleFilterChange('expiryDate', e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-4 justify-between pt-6">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="showValid" checked={filters.showValid} onCheckedChange={(c) => handleFilterChange('showValid', c)} />
                                    <Label htmlFor="showValid">Apenas Válidos</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="showExpired" checked={filters.showExpired} onCheckedChange={(c) => handleFilterChange('showExpired', c)} />
                                    <Label htmlFor="showExpired">Apenas Vencidos</Label>
                                </div>
                                {hasActiveFilters && (
                                     <Button variant="ghost" size="icon" onClick={clearFilters}>
                                        <X className="h-5 w-5" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>
                                    <Button variant="ghost" onClick={() => requestSort('name')}>
                                        Nome
                                        {getSortIndicator('name')}
                                    </Button>
                                </TableHead>
                                <TableHead>
                                    <Button variant="ghost" onClick={() => requestSort('category')}>
                                        Categoria
                                        {getSortIndicator('category')}
                                    </Button>
                                </TableHead>
                                <TableHead>Versão</TableHead>
                                <TableHead>Validade</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedDocuments.length > 0 ? (
                                sortedDocuments.map(doc => {
                                    const status = getDocumentStatus(doc);
                                    const displayName = doc.name || doc.colaborador?.name || doc.equipamento?.name || 'Documento sem nome';
                                    return(
                                    <TableRow key={doc.id}>
                                        <TableCell className="font-medium">{displayName}</TableCell>
                                        <TableCell>{doc.category?.name || 'N/A'}</TableCell>
                                        <TableCell>{doc.current_version?.version_string || 'N/A'}</TableCell>
                                        <TableCell>{doc.current_version?.expiry_date ? format(parseISO(doc.current_version.expiry_date), 'dd/MM/yyyy') : 'Não se aplica'}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${status.bgColor} ${status.color}`}>
                                                {status.text}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Abrir menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {doc.current_version?.file_url && (
                                                        <>
                                                            <DropdownMenuItem onSelect={() => window.open(doc.current_version.file_url, '_blank')}>
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                <span>Visualizar</span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onSelect={() => window.open(doc.current_version.file_url, '_blank')}>
                                                                <Download className="mr-2 h-4 w-4" />
                                                                <span>Baixar</span>
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                    <DropdownMenuItem onSelect={() => handleOpenForm(doc)}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        <span>Editar / Substituir</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); promptDeleteDocument(doc); }} className="text-red-500 focus:text-red-400 focus:bg-red-500/10">
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        <span>Deletar</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )})
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">
                                        Nenhum documento encontrado com os filtros atuais.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <DocumentFormDialog
                isOpen={isFormOpen}
                onOpenChange={setIsFormOpen}
                mainCategory={mainCategory}
                categories={subCategories}
                documentToEdit={documentToEdit}
            />
            <MasterPasswordDialog
                isOpen={isPasswordDialogOpen}
                onClose={() => setIsPasswordDialogOpen(false)}
                onConfirm={handleDeleteDocument}
                title="Confirmar Exclusão de Documento"
                description={`Tem certeza que deseja marcar o documento "${documentToDelete?.name || documentToDelete?.colaborador?.name || documentToDelete?.equipamento?.name}" como inativo? Ele poderá ser recuperado posteriormente.`}
            />
        </div>
    );
};

export default DocumentCategoryPage;