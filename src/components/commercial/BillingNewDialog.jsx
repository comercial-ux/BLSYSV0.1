import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Upload, Eye, X, FileText } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import ContactForm from '@/components/contacts/ContactForm';
import { v4 as uuidv4 } from 'uuid';

const initialFormData = {
    contact_id: '',
    service_date: '',
    gross_value: '',
    invoice_number: '',
    payment_date: '',
    iss_value: '',
    inss_value: '',
    payment_method: '',
    uf: '',
    notes: 'Faturamento Avulso',
    due_date: '',
    purchase_order_url: null,
    purchase_order_filename: null,
    invoice_file_url: null,
    invoice_file_filename: null,
    bill_url: null,
    bill_filename: null,
    other_doc_url: null,
    other_doc_filename: null,
};

const FileUploadControl = ({ label, fileUrl, fileName, onFileSelect, onFileRemove, isSubmitting }) => {
    const fileInputRef = useRef(null);

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            {fileName ? (
                <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <span className="flex-grow text-sm truncate" title={fileName}>{fileName}</span>
                    {fileUrl && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(fileUrl, '_blank')}><Eye className="h-4 w-4" /></Button>}
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={onFileRemove} disabled={isSubmitting}><X className="h-4 w-4" /></Button>
                </div>
            ) : (
                <>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => onFileSelect(e.target.files[0])}
                        className="hidden"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => fileInputRef.current.click()}
                        disabled={isSubmitting}
                    >
                        <Upload className="mr-2 h-4 w-4" />
                        Anexar Arquivo
                    </Button>
                </>
            )}
        </div>
    );
};

const BillingNewDialog = ({ isOpen, onClose, onUpdate }) => {
    const { user } = useAuth();
    const { commercialData, refetchData } = useData();
    const { contacts } = commercialData;
    const { toast } = useToast();
    const [formData, setFormData] = useState(initialFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isNewContactModalOpen, setIsNewContactModalOpen] = useState(false);
    const [filesToUpload, setFilesToUpload] = useState({});

    useEffect(() => {
        if (isOpen) {
            setFormData(initialFormData);
            setFilesToUpload({});
        }
    }, [isOpen]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleComboboxChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileSelect = (fileKey, file) => {
        if (file) {
            setFilesToUpload(prev => ({ ...prev, [fileKey]: file }));
            setFormData(prev => ({ ...prev, [`${fileKey}_filename`]: file.name }));
        }
    };

    const handleFileRemove = (fileKey) => {
        setFilesToUpload(prev => {
            const newFiles = { ...prev };
            delete newFiles[fileKey];
            return newFiles;
        });
        setFormData(prev => ({ ...prev, [`${fileKey}_filename`]: null, [`${fileKey}_url`]: null }));
    };

    const uploadFile = async (file, fileKey) => {
        if (!file) return { path: null, filename: null };
        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/${uuidv4()}.${fileExt}`;
        const { error } = await supabase.storage
            .from('billing-documents')
            .upload(filePath, file);

        if (error) {
            throw new Error(`Erro ao enviar ${fileKey}: ${error.message}`);
        }
        
        return { path: filePath, filename: file.name };
    };

    const handleSave = async () => {
        setIsSubmitting(true);

        try {
            if (!formData.contact_id || !formData.service_date || !formData.gross_value) {
                throw new Error('Cliente, Data do Serviço e Valor Bruto são obrigatórios.');
            }

            const fileUploadPromises = {
                purchase_order: uploadFile(filesToUpload.purchase_order, 'Pedido de Compra'),
                invoice_file: uploadFile(filesToUpload.invoice_file, 'Nota Fiscal'),
                bill: uploadFile(filesToUpload.bill, 'Fatura'),
                other_doc: uploadFile(filesToUpload.other_doc, 'Outros'),
            };

            const uploadedFiles = await Promise.all(Object.values(fileUploadPromises));
            const fileResults = {
                purchase_order: uploadedFiles[0],
                invoice_file: uploadedFiles[1],
                bill: uploadedFiles[2],
                other_doc: uploadedFiles[3],
            };

            const selectedContact = contacts.find(c => c.id.toString() === formData.contact_id);

            const recordToInsert = {
                user_id: user.id,
                is_imported: true,
                notes: formData.notes,
                invoice_number: formData.invoice_number || null,
                payment_date: formData.payment_date || null,
                iss_value: parseFloat(formData.iss_value) || null,
                inss_value: parseFloat(formData.inss_value) || null,
                payment_method: formData.payment_method || null,
                uf: formData.uf || null,
                due_date: formData.due_date || null,
                purchase_order_url: fileResults.purchase_order.path,
                purchase_order_filename: fileResults.purchase_order.filename,
                invoice_file_url: fileResults.invoice_file.path,
                invoice_file_filename: fileResults.invoice_file.filename,
                bill_url: fileResults.bill.path,
                bill_filename: fileResults.bill.filename,
                other_doc_url: fileResults.other_doc.path,
                other_doc_filename: fileResults.other_doc.filename,
                imported_data: {
                    service_date: formData.service_date,
                    issue_date: new Date().toISOString().split('T')[0],
                    due_date: formData.due_date || null,
                    company_name: selectedContact?.name || 'Cliente não encontrado',
                    gross_value: parseFloat(formData.gross_value) || null,
                }
            };

            const { error } = await supabase.from('billing_details').insert([recordToInsert]);
            if (error) throw error;

            toast({ title: 'Faturamento avulso criado com sucesso!' });
            onUpdate();
            onClose();

        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNewContactSave = () => {
        refetchData();
        setIsNewContactModalOpen(false);
    };

    const clientOptions = contacts
        .filter(c => c.type === 'Cliente')
        .map(c => ({ value: c.id.toString(), label: c.name }));

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-5xl">
                    <DialogHeader>
                        <DialogTitle>Novo Faturamento Avulso</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="max-h-[70vh] p-1">
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <h3 className="col-span-4 text-xl font-semibold border-b pb-2">Detalhes do Faturamento</h3>
                                
                                <div className="col-span-4 space-y-2">
                                    <Label>Cliente</Label>
                                    <Combobox
                                        options={clientOptions}
                                        value={formData.contact_id}
                                        onChange={(value) => handleComboboxChange('contact_id', value)}
                                        placeholder="Selecione um cliente..."
                                        searchPlaceholder="Buscar cliente..."
                                        emptyText="Nenhum cliente encontrado."
                                        onQuickAdd={() => setIsNewContactModalOpen(true)}
                                        quickAddText="Novo Cliente"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Data do Serviço</Label>
                                    <Input type="date" name="service_date" value={formData.service_date} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Valor Bruto</Label>
                                    <Input type="number" name="gross_value" value={formData.gross_value} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Nota Fiscal (Número)</Label>
                                    <Input name="invoice_number" value={formData.invoice_number} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Data de Vencimento</Label>
                                    <Input type="date" name="due_date" value={formData.due_date} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Data de Pagamento</Label>
                                    <Input type="date" name="payment_date" value={formData.payment_date} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Forma de Pagamento</Label>
                                    <Input name="payment_method" value={formData.payment_method} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Valor ISS</Label>
                                    <Input type="number" name="iss_value" value={formData.iss_value} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Valor INSS</Label>
                                    <Input type="number" name="inss_value" value={formData.inss_value} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label>UF</Label>
                                    <Input name="uf" value={formData.uf} onChange={handleInputChange} />
                                </div>
                                <div className="col-span-4 space-y-2">
                                    <Label>Notas</Label>
                                    <Textarea name="notes" value={formData.notes} onChange={handleInputChange} />
                                </div>

                                <h3 className="col-span-4 text-xl font-semibold border-b pb-2 mt-4">Documentos Fiscais</h3>
                                
                                <FileUploadControl
                                    label="Pedido de Compra"
                                    fileName={formData.purchase_order_filename}
                                    onFileSelect={(file) => handleFileSelect('purchase_order', file)}
                                    onFileRemove={() => handleFileRemove('purchase_order')}
                                    isSubmitting={isSubmitting}
                                />
                                <FileUploadControl
                                    label="Nota Fiscal (Arquivo)"
                                    fileName={formData.invoice_file_filename}
                                    onFileSelect={(file) => handleFileSelect('invoice_file', file)}
                                    onFileRemove={() => handleFileRemove('invoice_file')}
                                    isSubmitting={isSubmitting}
                                />
                                <FileUploadControl
                                    label="Fatura / Boleto"
                                    fileName={formData.bill_filename}
                                    onFileSelect={(file) => handleFileSelect('bill', file)}
                                    onFileRemove={() => handleFileRemove('bill')}
                                    isSubmitting={isSubmitting}
                                />
                                <FileUploadControl
                                    label="Outros"
                                    fileName={formData.other_doc_filename}
                                    onFileSelect={(file) => handleFileSelect('other_doc', file)}
                                    onFileRemove={() => handleFileRemove('other_doc')}
                                    isSubmitting={isSubmitting}
                                />
                            </div>
                        </div>
                    </ScrollArea>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" disabled={isSubmitting}>Cancelar</Button>
                        </DialogClose>
                        <Button onClick={handleSave} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar Faturamento
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isNewContactModalOpen} onOpenChange={setIsNewContactModalOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Novo Cliente</DialogTitle>
                    </DialogHeader>
                    <ContactForm onSave={handleNewContactSave} onClose={() => setIsNewContactModalOpen(false)} />
                </DialogContent>
            </Dialog>
        </>
    );
};

export default BillingNewDialog;