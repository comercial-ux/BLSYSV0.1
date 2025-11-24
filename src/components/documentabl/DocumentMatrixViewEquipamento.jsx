import React, { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { List, Truck, Loader2, Edit, ShieldX, Eye } from 'lucide-react';
import { getDocumentStatus } from '@/lib/documentabl';
import { supabase } from '@/lib/customSupabaseClient';
import DocumentFormDialog from './DocumentFormDialog';
import { format, parseISO } from 'date-fns';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const DocumentMatrixViewEquipamento = () => {
    const { documentabl, equipments: allEquipments, refetchData } = useData();
    const { documents, categories, exemptions } = documentabl;
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [dialogData, setDialogData] = useState({ documentToEdit: null, categoryId: null, equipamentoId: null });
    const [loadingCell, setLoadingCell] = useState(null);

    const equipments = useMemo(() => {
        return (allEquipments || []).filter(e => e.status !== 'Inativo');
    }, [allEquipments]);

    const docCategories = useMemo(() => {
        return (categories || []).filter(c => c.main_category === 'equipamento');
    }, [categories]);

    const matrixData = useMemo(() => {
        if (!equipments.length || !docCategories.length) return [];

        const docsByEquipamento = (documents || []).filter(d => d.main_category === 'equipamento' && d.is_active).reduce((acc, doc) => {
            if (!acc[doc.equipamento_id]) {
                acc[doc.equipamento_id] = {};
            }
            if (doc.category_id) {
                acc[doc.equipamento_id][doc.category_id] = doc;
            }
            return acc;
        }, {});

        const exemptionsByEquipamento = (exemptions || []).reduce((acc, ex) => {
            if (!acc[ex.equipamento_id]) {
                acc[ex.equipamento_id] = {};
            }
            acc[ex.equipamento_id][ex.category_id] = ex;
            return acc;
        }, {});

        return equipments.map(equipamento => {
            const row = {
                equipamento,
                statuses: {},
            };
            docCategories.forEach(category => {
                const doc = docsByEquipamento[equipamento.id]?.[category.id];
                const exemption = exemptionsByEquipamento[equipamento.id]?.[category.id];
                
                let statusInfo;
                if (exemption) {
                    statusInfo = { text: 'Isento', color: 'text-gray-400', bgColor: 'bg-gray-500/20', isExempt: true, exemptionId: exemption.id };
                } else if (doc) {
                    statusInfo = getDocumentStatus(doc);
                } else {
                    statusInfo = { text: 'Faltante', color: 'text-orange-400', bgColor: 'bg-orange-500/20', isMissing: true };
                }
                row.statuses[category.id] = { ...statusInfo, doc, category };
            });
            return row;
        });
    }, [equipments, docCategories, documents, exemptions]);

    const handleOpenForm = (equipamento, category, doc = null) => {
        setDialogData({ 
            documentToEdit: doc, 
            categoryId: category.id, 
            equipamentoId: equipamento.id 
        });
        setIsFormOpen(true);
    };

    const handleToggleExemption = async (equipamento, category, isExempt, exemptionId) => {
        const cellId = `${equipamento.id}-${category.id}`;
        setLoadingCell(cellId);
        
        try {
            if (isExempt) {
                const { error } = await supabase
                    .from('documentabl_exemptions')
                    .delete()
                    .eq('id', exemptionId);
                if (error) throw error;
                toast({ title: 'Isenção Removida!' });
            } else {
                const { error } = await supabase
                    .from('documentabl_exemptions')
                    .insert({ equipamento_id: equipamento.id, category_id: category.id, user_id: user?.id });
                if (error) throw error;
                toast({ title: 'Equipamento Isento!' });
            }
            await refetchData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao atualizar isenção', description: error.message });
        } finally {
            setLoadingCell(null);
        }
    };
    
    const StatusCell = ({ status, equipamento }) => {
        const cellId = `${equipamento.id}-${status.category.id}`;
        const isLoading = loadingCell === cellId;

        if (isLoading) {
            return (
                <TableCell className="text-center p-0">
                    <div className="w-full h-full p-2 flex items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    </div>
                </TableCell>
            );
        }
        
        return (
            <TableCell className={`text-center p-0`}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className={`w-full h-full p-2 cursor-pointer transition-colors hover:bg-muted ${status.bgColor}`}>
                             <span className={`text-xs font-semibold ${status.color}`}>
                                {status.text}
                            </span>
                            {status.doc?.current_version?.expiry_date && (
                                <p className="text-xs text-muted-foreground">{format(parseISO(status.doc.current_version.expiry_date), 'dd/MM/yyyy')}</p>
                            )}
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {status.doc?.current_version?.file_url && (
                             <DropdownMenuItem onSelect={() => window.open(status.doc.current_version.file_url, '_blank')}>
                                <Eye className="mr-2 h-4 w-4" />
                                <span>Visualizar Documento</span>
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onSelect={() => handleOpenForm(equipamento, status.category, status.doc)}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>{status.isMissing ? 'Adicionar' : 'Editar/Substituir'} Documento</span>
                        </DropdownMenuItem>
                         <DropdownMenuItem onSelect={() => handleToggleExemption(equipamento, status.category, status.isExempt, status.exemptionId)}>
                            <ShieldX className="mr-2 h-4 w-4" />
                            <span>{status.isExempt ? 'Remover Isenção' : 'Marcar como Isento'}</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        );
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Truck className="h-6 w-6" />
                        <div>
                            <CardTitle className="text-2xl">Matriz de Documentos de Equipamentos</CardTitle>
                            <CardDescription>Visão geral do status dos documentos por categoria.</CardDescription>
                        </div>
                    </div>
                     <Button variant="outline" onClick={() => navigate('/documentabl/equipamento')}>
                        <List className="mr-2 h-4 w-4" />
                        Visão por Lista
                    </Button>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <Table className="min-w-full">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="sticky left-0 bg-card z-10 w-1/4">Equipamento</TableHead>
                                {docCategories.map(cat => (
                                    <TableHead key={cat.id} className="text-center">{cat.name}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {matrixData.map(row => (
                                <TableRow key={row.equipamento.id}>
                                    <TableCell className="font-medium sticky left-0 bg-card z-10">{row.equipamento.name}</TableCell>
                                    {docCategories.map(cat => (
                                        <StatusCell key={cat.id} status={row.statuses[cat.id]} equipamento={row.equipamento} />
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <DocumentFormDialog
                isOpen={isFormOpen}
                onOpenChange={setIsFormOpen}
                mainCategory="equipamento"
                categories={docCategories}
                documentToEdit={dialogData.documentToEdit}
                preselectedEquipamentoId={dialogData.equipamentoId}
                preselectedCategoryId={dialogData.categoryId}
            />
        </div>
    );
};

export default DocumentMatrixViewEquipamento;