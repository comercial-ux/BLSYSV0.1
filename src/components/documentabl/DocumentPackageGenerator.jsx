import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { FileText, Users, HardHat, Truck, Search, Package, FileArchive, Mail, Loader2, AlertTriangle, Lock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { PDFDocument } from 'pdf-lib';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useData } from '@/contexts/DataContext';
import { getDocumentStatus } from '@/lib/documentabl';
import AdminPasswordPrompt from './AdminPasswordPrompt';


const categoryConfig = {
    empresa: { title: 'Documentação da Empresa', icon: <FileText className="h-5 w-5" /> },
    colaborador: { title: 'Documentação de Colaborador', icon: <Users className="h-5 w-5" /> },
    equipamento: { title: 'Documentação de Equipamento', icon: <Truck className="h-5 w-5" /> },
    seguranca: { title: 'Documentação de Segurança', icon: <HardHat className="h-5 w-5" /> },
    administrativa: { title: 'Documentação Administrativa', icon: <Lock className="h-5 w-5" /> }
};

const DocumentPackageGenerator = () => {
    const { documentabl } = useData();
    const { documents = [] } = documentabl;
    const { toast } = useToast();
    const [selectedDocs, setSelectedDocs] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [showOnlyValid, setShowOnlyValid] = useState(true);
    const [packageName, setPackageName] = useState(`Pacote_Documental_${format(new Date(), 'yyyy-MM-dd')}`);
    const [includeIndex, setIncludeIndex] = useState(false);
    const [includeCoverLetter, setIncludeCoverLetter] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [isPasswordPromptOpen, setIsPasswordPromptOpen] = useState(false);
    const [actionAfterAuth, setActionAfterAuth] = useState(null);

    const filteredDocuments = useMemo(() => {
        return documents.filter(doc => {
            if(!doc.include_in_packages) return false;
            const status = getDocumentStatus(doc);
            const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesValidity = !showOnlyValid || (status.text === 'Válido' || status.text.startsWith('Vence'));
            const matchesCategory = filterCategory === 'all' || doc.main_category === filterCategory;
            return matchesSearch && matchesValidity && matchesCategory;
        });
    }, [documents, searchTerm, showOnlyValid, filterCategory]);

    const documentsByCategory = useMemo(() => {
        return filteredDocuments.reduce((acc, doc) => {
            const category = doc.main_category;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(doc);
            return acc;
        }, {});
    }, [filteredDocuments]);

    const selectedDocumentObjects = useMemo(() => {
        return documents.filter(doc => selectedDocs.has(doc.id));
    }, [selectedDocs, documents]);

    const totalSize = useMemo(() => {
        const sizeInBytes = selectedDocumentObjects.reduce((acc, doc) => acc + (doc.current_version?.file_size || 0), 0);
        if (sizeInBytes === 0) return '0 MB';
        const sizeInMB = sizeInBytes / (1024 * 1024);
        return `${sizeInMB.toFixed(2)} MB`;
    }, [selectedDocumentObjects]);

    const handleToggleSelection = (docId) => {
        setSelectedDocs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(docId)) {
                newSet.delete(docId);
            } else {
                newSet.add(docId);
            }
            return newSet;
        });
    };

    const handleSelectCategory = (category, checked) => {
        const categoryDocIds = documentsByCategory[category]?.map(d => d.id) || [];
        setSelectedDocs(prev => {
            const newSet = new Set(prev);
            if (checked) {
                categoryDocIds.forEach(id => newSet.add(id));
            } else {
                categoryDocIds.forEach(id => newSet.delete(id));
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        setSelectedDocs(new Set(filteredDocuments.map(d => d.id)));
    };

    const handleClearSelection = () => {
        setSelectedDocs(new Set());
    };

    const executePackageGeneration = async (generationFn) => {
        if (selectedDocs.size === 0) {
            toast({ variant: 'destructive', title: 'Nenhum documento selecionado' });
            return;
        }

        const hasAdminDocs = selectedDocumentObjects.some(doc => doc.main_category === 'administrativa');
        const isAdminAuth = sessionStorage.getItem('documentabl_admin_auth') === 'true';

        if (hasAdminDocs && !isAdminAuth) {
            setActionAfterAuth(() => () => generationFn());
            setIsPasswordPromptOpen(true);
            return;
        }
        
        await generationFn();
    };

    const handleGenerateZip = async () => {
        setIsLoading(true);
        setLoadingMessage('Preparando para baixar arquivos...');
        setProgress(0);

        const zip = new JSZip();
        const rootFolder = zip.folder(packageName);
        let filesProcessed = 0;

        if (includeIndex) {
            let indexContent = `Índice do Pacote Documental - ${packageName}\n\n`;
            indexContent += `Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}\n`;
            indexContent += `Total de documentos: ${selectedDocumentObjects.length}\n\n`;
            selectedDocumentObjects.forEach(doc => {
                indexContent += `- [${doc.main_category.toUpperCase()}] ${doc.name} (Versão: ${doc.current_version.version_string})\n`;
            });
            rootFolder.file('ÍNDICE.txt', indexContent);
        }

        for (const doc of selectedDocumentObjects) {
            setLoadingMessage(`Baixando: ${doc.name}...`);
            try {
                const response = await fetch(doc.current_version.file_url);
                if (!response.ok) throw new Error(`Falha ao buscar ${doc.name}`);
                const blob = await response.blob();
                
                const categoryFolder = rootFolder.folder(doc.main_category);
                categoryFolder.file(doc.current_version.file_name, blob);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Erro no Download', description: `Não foi possível baixar o arquivo ${doc.name}.` });
            }
            filesProcessed++;
            setProgress((filesProcessed / selectedDocumentObjects.length) * 100);
        }

        setLoadingMessage('Compactando arquivos...');
        try {
            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `${packageName}.zip`);
            toast({ title: 'Sucesso!', description: 'Pacote ZIP gerado e download iniciado.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao gerar ZIP', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGeneratePdf = async () => {
        const nonPdfFiles = selectedDocumentObjects.filter(doc => doc.current_version?.file_type !== 'application/pdf');
        if (nonPdfFiles.length > 0) {
            toast({ variant: 'destructive', title: 'Arquivos incompatíveis', description: 'A compilação de PDF só suporta arquivos do tipo PDF.' });
            return;
        }

        setIsLoading(true);
        setLoadingMessage('Compilando PDF...');
        setProgress(0);

        try {
            const compiledPdf = await PDFDocument.create();
            let filesProcessed = 0;

            for (const doc of selectedDocumentObjects) {
                setLoadingMessage(`Processando: ${doc.name}...`);
                const existingPdfBytes = await fetch(doc.current_version.file_url).then(res => res.arrayBuffer());
                const existingPdf = await PDFDocument.load(existingPdfBytes);
                const copiedPages = await compiledPdf.copyPages(existingPdf, existingPdf.getPageIndices());
                copiedPages.forEach(page => compiledPdf.addPage(page));
                filesProcessed++;
                setProgress((filesProcessed / selectedDocumentObjects.length) * 100);
            }
            
            const pdfBytes = await compiledPdf.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            saveAs(blob, `${packageName}.pdf`);
            toast({ title: 'Sucesso!', description: 'PDF compilado gerado e download iniciado.' });

        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao gerar PDF', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSendEmail = () => {
        if (selectedDocs.size === 0) {
            toast({ variant: 'destructive', title: 'Nenhum documento selecionado' });
            return;
        }
        setIsEmailModalOpen(true);
    };

    const hasExpiredSelected = useMemo(() => {
        return selectedDocumentObjects.some(doc => getDocumentStatus(doc).text === 'Vencido');
    }, [selectedDocumentObjects]);

    const onAuthenticated = () => {
        setIsPasswordPromptOpen(false);
        if (actionAfterAuth) {
            actionAfterAuth();
            setActionAfterAuth(null);
        }
    };

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Seleção de Documentos</CardTitle>
                            <CardDescription>Filtre e selecione os documentos para o seu pacote.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-grow">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="Buscar documento..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
                                </div>
                                <Select value={filterCategory} onValueChange={setFilterCategory}>
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                        <SelectValue placeholder="Filtrar categoria..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas as Categorias</SelectItem>
                                        {Object.entries(categoryConfig).map(([key, { title }]) => (
                                            <SelectItem key={key} value={key}>{title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="valid-only" checked={showOnlyValid} onCheckedChange={setShowOnlyValid} />
                                    <Label htmlFor="valid-only">Apenas válidos</Label>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={handleSelectAll}>Selecionar Todos</Button>
                                <Button variant="outline" onClick={handleClearSelection}>Limpar Seleção</Button>
                            </div>
                            <ScrollArea className="h-[500px] border rounded-md p-4">
                                <Accordion type="multiple" defaultValue={Object.keys(categoryConfig)} className="w-full">
                                    {Object.entries(documentsByCategory).map(([category, docs]) => {
                                        if (docs.length === 0) return null;
                                        const isAllSelected = docs.length > 0 && docs.every(d => selectedDocs.has(d.id));
                                        return (
                                            <AccordionItem value={category} key={category}>
                                                <AccordionTrigger>
                                                    <div className="flex items-center gap-2">
                                                        {categoryConfig[category]?.icon}
                                                        <span className="font-bold">{categoryConfig[category]?.title} ({docs.length})</span>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center p-2 rounded-md bg-slate-800/50">
                                                            <Checkbox
                                                                id={`select-all-${category}`}
                                                                checked={isAllSelected}
                                                                onCheckedChange={(checked) => handleSelectCategory(category, checked)}
                                                            />
                                                            <Label htmlFor={`select-all-${category}`} className="ml-2 font-semibold">Selecionar todos em {categoryConfig[category]?.title}</Label>
                                                        </div>
                                                        {docs.map(doc => {
                                                            const status = getDocumentStatus(doc);
                                                            return (
                                                                <div key={doc.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-800/50">
                                                                    <Checkbox checked={selectedDocs.has(doc.id)} onCheckedChange={() => handleToggleSelection(doc.id)} />
                                                                    <div className="flex-grow">
                                                                        <p className="font-medium">{doc.name}</p>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            Versão: {doc.current_version?.version_string || 'N/A'} | Validade: {doc.current_version?.expiry_date ? format(parseISO(doc.current_version.expiry_date), 'dd/MM/yyyy') : 'N/A'}
                                                                        </p>
                                                                    </div>
                                                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${status.bgColor} ${status.color}`}>{status.text}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        );
                                    })}
                                </Accordion>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <Card className="sticky top-20">
                        <CardHeader>
                            <CardTitle>Resumo e Ações</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p><span className="font-bold">{selectedDocs.size}</span> documentos selecionados</p>
                                <p>Tamanho total: <span className="font-bold">{totalSize}</span></p>
                            </div>
                            {hasExpiredSelected && (
                                <div className="flex items-center gap-2 p-3 rounded-md bg-yellow-900/50 border border-yellow-700">
                                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                                    <p className="text-sm text-yellow-300">Atenção: Você selecionou documentos vencidos.</p>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="package-name">Nome do Pacote</Label>
                                <Input id="package-name" value={packageName} onChange={e => setPackageName(e.target.value)} />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="include-index" checked={includeIndex} onCheckedChange={setIncludeIndex} />
                                <Label htmlFor="include-index">Incluir índice de arquivos</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="include-cover" checked={includeCoverLetter} onCheckedChange={setIncludeCoverLetter} disabled />
                                <Label htmlFor="include-cover" className="text-muted-foreground">Incluir carta de apresentação (em breve)</Label>
                            </div>
                            
                            {isLoading && (
                                <div className="space-y-2">
                                    <Progress value={progress} />
                                    <p className="text-sm text-center text-muted-foreground">{loadingMessage}</p>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex flex-col gap-2">
                            <Button onClick={() => executePackageGeneration(handleGeneratePdf)} className="w-full" disabled={isLoading || selectedDocs.size === 0}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Package className="mr-2 h-4 w-4" />}
                                Gerar PDF Compilado
                            </Button>
                            <Button onClick={() => executePackageGeneration(handleGenerateZip)} variant="secondary" className="w-full" disabled={isLoading || selectedDocs.size === 0}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileArchive className="mr-2 h-4 w-4" />}
                                Baixar ZIP
                            </Button>
                            <Button onClick={handleSendEmail} variant="outline" className="w-full" disabled={isLoading || selectedDocs.size === 0}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                                Enviar por Email
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>

            <Dialog open={isPasswordPromptOpen} onOpenChange={setIsPasswordPromptOpen}>
                <DialogContent>
                    <AdminPasswordPrompt onAuthenticated={onAuthenticated} isDialog={true} />
                </DialogContent>
            </Dialog>

            <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Enviar Pacote por E-mail</DialogTitle>
                        <DialogDescription>
                            Para enviar os documentos, gere o pacote em ZIP ou PDF e anexe-o ao seu e-mail.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="mb-4">Clique no botão abaixo para abrir seu cliente de e-mail padrão com uma mensagem pré-preenchida.</p>
                        <a href={`mailto:?subject=Pacote Documental: ${packageName}&body=Prezados,%0D%0A%0D%0ASegue em anexo o pacote de documentos "${packageName}" solicitado.%0D%0A%0D%0AAtenciosamente,`}>
                            <Button className="w-full">
                                <Mail className="mr-2 h-4 w-4" />
                                Abrir Cliente de E-mail
                            </Button>
                        </a>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">Fechar</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default DocumentPackageGenerator;