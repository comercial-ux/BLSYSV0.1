import React, { useMemo } from 'react';
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
    import { useData } from '@/contexts/DataContext';
    import { ScrollArea } from '@/components/ui/scroll-area';
    import { getDocumentStatus } from '@/lib/documentabl';
    import { format, parseISO } from 'date-fns';
    import { Eye } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
    import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

    const EmployeeDocumentsDialog = ({ isOpen, onClose, employee }) => {
        const { documentabl } = useData();

        const employeeDocuments = useMemo(() => {
            if (!employee || !documentabl?.documents) return [];
            return documentabl.documents
                .filter(doc => doc.colaborador_id === employee.id && doc.is_active)
                .map(doc => ({ ...doc, statusInfo: getDocumentStatus(doc) }))
                .sort((a, b) => a.name.localeCompare(b.name));
        }, [documentabl.documents, employee]);

        const documentsByCategory = useMemo(() => {
            return employeeDocuments.reduce((acc, doc) => {
                const categoryName = doc.category?.name || 'Sem Categoria';
                if (!acc[categoryName]) {
                    acc[categoryName] = [];
                }
                acc[categoryName].push(doc);
                return acc;
            }, {});
        }, [employeeDocuments]);

        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-4xl h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>Documentos de: {employee?.name}</DialogTitle>
                        <DialogDescription>
                            Lista de todos os documentos do colaborador registrados no sistema.
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-full mt-4 pr-6">
                        <div className="space-y-4">
                            {Object.keys(documentsByCategory).length > 0 ? (
                                Object.entries(documentsByCategory).map(([category, docs]) => (
                                     <Accordion type="single" collapsible defaultValue="item-0" key={category}>
                                        <AccordionItem value={`item-${category}`}>
                                            <AccordionTrigger className="text-lg font-semibold">{category}</AccordionTrigger>
                                            <AccordionContent>
                                                <div className="space-y-3 pt-2">
                                                    {docs.map(doc => (
                                                        <Card key={doc.id} className="bg-muted/50">
                                                            <CardContent className="p-3 flex items-center justify-between">
                                                                <div>
                                                                    <p className="font-medium">{doc.name}</p>
                                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                                        <span>
                                                                            Versão: {doc.current_version?.version_string || 'N/A'}
                                                                        </span>
                                                                        {doc.current_version?.expiry_date && (
                                                                            <span>
                                                                                Validade: {format(parseISO(doc.current_version.expiry_date), 'dd/MM/yyyy')}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-4">
                                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${doc.statusInfo.bgColor} ${doc.statusInfo.color}`}>
                                                                        {doc.statusInfo.text}
                                                                    </span>
                                                                    {doc.current_version?.file_url && (
                                                                        <Button variant="ghost" size="icon" onClick={() => window.open(doc.current_version.file_url, '_blank')}>
                                                                            <Eye className="h-4 w-4" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                ))
                            ) : (
                                <div className="text-center py-10">
                                    <p className="text-muted-foreground">Nenhum documento encontrado para este colaborador.</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        );
    };

    export default EmployeeDocumentsDialog;