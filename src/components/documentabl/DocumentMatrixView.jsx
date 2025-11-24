import React, { useState, useMemo, useCallback } from 'react';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { List, Users, Download, Edit, ShieldX, Loader2, Eye } from 'lucide-react';
import { getDocumentStatus } from '@/lib/documentabl';
import { supabase } from '@/lib/customSupabaseClient';
import DocumentFormDialog from './DocumentFormDialog';
import { format, parseISO } from 'date-fns';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const DocumentMatrixView = () => {
    const { documentabl, commercialData, refetchData } = useData();
    const { documents, categories, exemptions } = documentabl;
    const { contacts } = commercialData;
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [dialogData, setDialogData] = useState({ documentToEdit: null, categoryId: null, colaboradorId: null });
    const [loadingCell, setLoadingCell] = useState(null);

    const colaboradores = useMemo(() => {
        return (contacts || []).filter(c => c.type === 'Colaborador' && c.status !== 'Inativo');
    }, [contacts]);

    const docCategories = useMemo(() => {
        return (categories || []).filter(c => c.main_category === 'colaborador');
    }, [categories]);

    const matrixData = useMemo(() => {
        if (!colaboradores.length || !docCategories.length) return [];

        const docsByColaborador = (documents || []).filter(d => d.main_category === 'colaborador' && d.is_active).reduce((acc, doc) => {
            if (!acc[doc.colaborador_id]) {
                acc[doc.colaborador_id] = {};
            }
            if (doc.category_id) {
                acc[doc.colaborador_id][doc.category_id] = doc;
            }
            return acc;
        }, {});

        const exemptionsByColaborador = (exemptions || []).reduce((acc, ex) => {
            if (!acc[ex.colaborador_id]) {
                acc[ex.colaborador_id] = {};
            }
            acc[ex.colaborador_id][ex.category_id] = ex;
            return acc;
        }, {});

        return colaboradores.map(colaborador => {
            const row = {
                colaborador,
                statuses: {},
            };
            docCategories.forEach(category => {
                const doc = docsByColaborador[colaborador.id]?.[category.id];
                const exemption = exemptionsByColaborador[colaborador.id]?.[category.id];
                
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
    }, [colaboradores, docCategories, documents, exemptions]);

    const handleOpenForm = (colaborador, category, doc = null) => {
        setDialogData({ 
            documentToEdit: doc, 
            categoryId: category.id, 
            colaboradorId: colaborador.id 
        });
        setIsFormOpen(true);
    };

    const handleToggleExemption = async (colaborador, category, isExempt, exemptionId) => {
        const cellId = `${colaborador.id}-${category.id}`;
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
                    .insert({ colaborador_id: colaborador.id, category_id: category.id, user_id: user?.id });
                if (error) throw error;
                toast({ title: 'Colaborador Isento!' });
            }
            await refetchData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao atualizar isenção', description: error.message });
        } finally {
            setLoadingCell(null);
        }
    };
    
    const StatusCell = ({ status, colaborador }) => {
        const cellId = `${colaborador.id}-${status.category.id}`;
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
                        <DropdownMenuItem onSelect={() => handleOpenForm(colaborador, status.category, status.doc)}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>{status.isMissing ? 'Adicionar' : 'Editar/Substituir'} Documento</span>
                        </DropdownMenuItem>
                         <DropdownMenuItem onSelect={() => handleToggleExemption(colaborador, status.category, status.isExempt, status.exemptionId)}>
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
                        <Users className="h-6 w-6" />
                        <div>
                            <CardTitle className="text-2xl">Matriz de Documentos de Colaboradores</CardTitle>
                            <CardDescription>Visão geral do status dos documentos por categoria.</CardDescription>
                        </div>
                    </div>
                     <Button variant="outline" onClick={() => navigate('/documentabl/colaborador')}>
                        <List className="mr-2 h-4 w-4" />
                        Visão por Lista
                    </Button>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <Table className="min-w-full">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="sticky left-0 bg-card z-10 w-1/4">Colaborador</TableHead>
                                {docCategories.map(cat => (
                                    <TableHead key={cat.id} className="text-center">{cat.name}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {matrixData.map(row => (
                                <TableRow key={row.colaborador.id}>
                                    <TableCell className="font-medium sticky left-0 bg-card z-10">{row.colaborador.name}</TableCell>
                                    {docCategories.map(cat => (
                                        <StatusCell key={cat.id} status={row.statuses[cat.id]} colaborador={row.colaborador} />
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
                mainCategory="colaborador"
                categories={docCategories}
                documentToEdit={dialogData.documentToEdit}
                preselectedColaboradorId={dialogData.colaboradorId}
                preselectedCategoryId={dialogData.categoryId}
            />
        </div>
    );
};

export default DocumentMatrixView;