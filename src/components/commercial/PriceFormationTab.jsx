import React, { useState, useRef, Suspense, lazy } from 'react';
    import { useData } from '@/contexts/DataContext';
    import { supabase } from '@/lib/customSupabaseClient';
    import { toast } from '@/components/ui/use-toast';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { Dialog, DialogContent } from '@/components/ui/dialog';
    import { PlusCircle, Edit, Trash2, Loader2, FileSpreadsheet, Upload, Download } from 'lucide-react';
    import MasterPasswordDialog from '@/components/admin/MasterPasswordDialog';
    import * as XLSX from 'xlsx';
    import { saveAs } from 'file-saver';

    const PriceFormationEditor = lazy(() => import('@/components/commercial/PriceFormationEditor'));

    const PriceFormationTab = ({ onUpdateNeeded }) => {
        const { commercialData, loading } = useData();
        const [isModalOpen, setIsModalOpen] = useState(false);
        const [selectedFormation, setSelectedFormation] = useState(null);
        const [formationToDelete, setFormationToDelete] = useState(null);
        const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
        const fileInputRef = useRef(null);

        const openModal = (formation = null) => {
            setSelectedFormation(formation);
            setIsModalOpen(true);
        };

        const handleSave = () => {
            onUpdateNeeded();
            setIsModalOpen(false);
        };

        const promptDelete = (formation) => {
            setFormationToDelete(formation);
            setIsPasswordDialogOpen(true);
        };

        const handleDelete = async () => {
            if (!formationToDelete) return;
            const { error } = await supabase.from('price_formations').delete().eq('id', formationToDelete.id);
            setIsPasswordDialogOpen(false);
            if (error) {
                toast({ variant: 'destructive', title: 'Erro ao excluir', description: error.message });
            } else {
                toast({ title: 'Formação de preço excluída!' });
                onUpdateNeeded();
            }
            setFormationToDelete(null);
        };

        const handleImportClick = () => {
            fileInputRef.current.click();
        };

        const handleFileImport = (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
                    
                    const newFormation = {
                        name: `Importado - ${file.name.split('.').slice(0, -1).join('.')}`,
                        spreadsheet_data: json,
                        project_description: 'Importado de arquivo Excel.',
                    };
                    openModal(newFormation);

                    toast({ title: "Importação Concluída", description: "Planilha carregada. Preencha os detalhes e salve." });

                } catch (error) {
                    console.error("Error importing file:", error);
                    toast({ variant: "destructive", title: "Erro na Importação", description: "Ocorreu um erro ao ler o arquivo. Verifique se o formato é válido." });
                }
            };
            reader.readAsArrayBuffer(file);
            event.target.value = ''; // Reset file input
        };

        const handleExport = (formation) => {
            try {
                const ws = XLSX.utils.aoa_to_sheet(formation.spreadsheet_data);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'FormacaoDePreco');
                const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `${formation.name}.xlsx`);
                toast({ title: "Exportação Iniciada", description: "O download do arquivo começará em breve." });
            } catch (error) {
                 console.error("Error exporting file:", error);
                 toast({ variant: "destructive", title: "Erro na Exportação", description: "Não foi possível gerar o arquivo Excel." });
            }
        };

        return (
            <>
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Formação de Preço</CardTitle>
                                <CardDescription>Crie e gerencie suas planilhas de formação de preço.</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileImport}
                                    className="hidden"
                                    accept=".xlsx, .xls"
                                />
                                <Button variant="outline" onClick={handleImportClick}><Upload className="mr-2 h-4 w-4" /> Importar</Button>
                                <Button onClick={() => openModal()}><PlusCircle className="mr-2 h-4 w-4" /> Nova Formação</Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 h-[65vh] overflow-y-auto pr-2">
                            {loading ? <Loader2 className="mx-auto my-10 h-8 w-8 animate-spin text-primary" /> :
                            (commercialData?.priceFormations || []).length > 0 ? (
                                commercialData.priceFormations.map(f => (
                                    <Card key={f.id} className="bg-muted/30 hover:bg-muted/50 transition-colors">
                                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                                            <CardTitle className="text-lg flex items-center gap-2"><FileSpreadsheet className="w-5 h-5 text-primary" />{f.name}</CardTitle>
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleExport(f)}><Download className="w-4 h-4 text-green-600" /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => openModal(f)}><Edit className="w-4 h-4" /></Button>
                                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => promptDelete(f)}><Trash2 className="w-4 h-4" /></Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground"><strong>Cliente:</strong> {f.contact?.name || 'Não informado'}</p>
                                            <p className="text-sm text-muted-foreground"><strong>Criado em:</strong> {new Date(f.created_at).toLocaleDateString()}</p>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <div className="text-center py-16 text-muted-foreground">
                                    <FileSpreadsheet className="mx-auto h-12 w-12 mb-4" />
                                    <p>Nenhuma formação de preço criada.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <Suspense fallback={
                        <DialogContent className="max-w-6xl h-[90vh] flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </DialogContent>
                    }>
                        {isModalOpen && <PriceFormationEditor formation={selectedFormation} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
                    </Suspense>
                </Dialog>
                <MasterPasswordDialog
                    isOpen={isPasswordDialogOpen}
                    onClose={() => setIsPasswordDialogOpen(false)}
                    onConfirm={handleDelete}
                    title="Confirmar Exclusão"
                    description={`Tem certeza que deseja excluir a formação de preço "${formationToDelete?.name}"?`}
                />
            </>
        );
    };

    export default PriceFormationTab;