import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Combobox } from '@/components/ui/combobox';
import { Loader2, Trash2, Upload, Eye, X, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { v4 as uuidv4 } from 'uuid';
import AttachmentViewerDialog from './AttachmentViewerDialog';

const FileUploadControl = ({ label, fileUrl, fileName, onFileSelect, onFileRemove, isSubmitting, onViewAttachment }) => {
    const fileInputRef = useRef(null);

    const handleViewClick = (e) => {
        e.preventDefault();
        if (fileUrl && !fileUrl.startsWith('blob:')) {
            onViewAttachment(fileUrl, fileName);
        } else if (fileUrl) {
            window.open(fileUrl, '_blank');
        }
    };

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            {fileName ? (
                <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <span className="flex-grow text-sm truncate" title={fileName}>{fileName}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleViewClick}>
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={onFileRemove} disabled={isSubmitting}>
                        <X className="h-4 w-4" />
                    </Button>
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


const BillingEditDialog = ({ isOpen, onClose, billingItem, onUpdate }) => {
    const { user } = useAuth();
    const { commercialData } = useData();
    const { contacts } = commercialData;
    const { toast } = useToast();
    const [formData, setFormData] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [filesToUpload, setFilesToUpload] = useState({});
    const [tempFileUrls, setTempFileUrls] = useState({});
    const [attachmentViewer, setAttachmentViewer] = useState({ isOpen: false, fileUrl: '', fileName: '', fileType: '', isLoading: false });

    const handleViewAttachment = async (filePath, fileName) => {
        if (!filePath) return;
        
        setAttachmentViewer({ isOpen: true, fileUrl: '', fileName, fileType: '', isLoading: true });

        try {
            const { data, error } = await supabase.storage
                .from('billing-documents')
                .createSignedUrl(filePath, 300);

            if (error) throw error;

            const { data: fileData, error: headError } = await supabase.storage
                .from('billing-documents')
                .download(filePath);
            
            if(headError) throw headError;

            setAttachmentViewer({ 
                isOpen: true, 
                fileUrl: data.signedUrl, 
                fileName, 
                fileType: fileData.type, 
                isLoading: false 
            });

        } catch (error) {
            console.error('Error creating signed URL:', error);
            toast({ variant: 'destructive', title: 'Erro ao gerar link do anexo', description: error.message });
            setAttachmentViewer({ isOpen: false, fileUrl: '', fileName: '', fileType: '', isLoading: false });
        }
    };

    useEffect(() => {
        if (isOpen && billingItem) {
            const data = billingItem.is_imported ? billingItem.imported_data : billingItem;
            const details = {
                invoice_number: billingItem.invoice_number,
                payment_date: billingItem.payment_date,
                iss_value: billingItem.iss_value,
                inss_value: billingItem.inss_value,
                payment_method: billingItem.payment_method,
                uf: billingItem.uf,
                notes: billingItem.notes,
                due_date: billingItem.due_date || data.due_date,
                purchase_order_url: billingItem.purchase_order_url,
                purchase_order_filename: billingItem.purchase_order_filename,
                invoice_file_url: billingItem.invoice_file_url,
                invoice_file_filename: billingItem.invoice_file_filename,
                bill_url: billingItem.bill_url,
                bill_filename: billingItem.bill_filename,
                other_doc_url: billingItem.other_doc_url,
                other_doc_filename: billingItem.other_doc_filename,
            };
            
            setFormData({
                ...data,
                ...details,
                contact_id: billingItem.proposal?.contact_id || null,
            });
            setFilesToUpload({});
            setTempFileUrls({});
        }
    }, [billingItem, isOpen]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value === '' ? null : value }));
    };

    const handleComboboxChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileSelect = (fileKey, file) => {
        if (file) {
            setFilesToUpload(prev => ({ ...prev, [fileKey]: file }));
            setFormData(prev => ({ ...prev, [`${fileKey}_filename`]: file.name }));
            setTempFileUrls(prev => ({ ...prev, [fileKey]: URL.createObjectURL(file) }));
        }
    };

    const handleFileRemove = (fileKey) => {
        setFilesToUpload(prev => {
            const newFiles = { ...prev };
            delete newFiles[fileKey];
            return newFiles;
        });
        setFormData(prev => ({ ...prev, [`${fileKey}_filename`]: null, [`${fileKey}_url`]: null }));
        setTempFileUrls(prev => {
            const newUrls = { ...prev };
            delete newUrls[fileKey];
            return newUrls;
        });
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
            const isLinkingImported = billingItem.is_imported && formData.contact_id;

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

            const dataToSave = {
                invoice_number: formData.invoice_number,
                payment_date: formData.payment_date,
                iss_value: formData.iss_value,
                inss_value: formData.inss_value,
                payment_method: formData.payment_method,
                uf: formData.uf,
                notes: formData.notes,
                due_date: formData.due_date,
                purchase_order_url: filesToUpload.purchase_order ? fileResults.purchase_order.path : formData.purchase_order_url,
                purchase_order_filename: filesToUpload.purchase_order ? fileResults.purchase_order.filename : formData.purchase_order_filename,
                invoice_file_url: filesToUpload.invoice_file ? fileResults.invoice_file.path : formData.invoice_file_url,
                invoice_file_filename: filesToUpload.invoice_file ? fileResults.invoice_file.filename : formData.invoice_file_filename,
                bill_url: filesToUpload.bill ? fileResults.bill.path : formData.bill_url,
                bill_filename: filesToUpload.bill ? fileResults.bill.filename : formData.bill_filename,
                other_doc_url: filesToUpload.other_doc ? fileResults.other_doc.path : formData.other_doc_url,
                other_doc_filename: filesToUpload.other_doc ? fileResults.other_doc.filename : formData.other_doc_filename,
            };

            let updateError;

            if (isLinkingImported) {
                const { data: proposal, error: proposalError } = await supabase
                    .from('proposals')
                    .select('id')
                    .eq('contact_id', formData.contact_id)
                    .limit(1)
                    .single();

                if (proposalError || !proposal) {
                    throw new Error('Não foi encontrada uma proposta para o cliente selecionado. Crie uma proposta primeiro.');
                }

                const { data: newMeasurement, error: measurementError } = await supabase
                    .from('measurements')
                    .insert({
                        proposal_id: proposal.id,
                        user_id: billingItem.user_id,
                        start_date: formData.service_date || new Date().toISOString().split('T')[0],
                        end_date: formData.service_date || new Date().toISOString().split('T')[0],
                        total_value: formData.gross_value,
                        status: 'approved',
                        billing_status: 'pending',
                    })
                    .select()
                    .single();

                if (measurementError) throw measurementError;

                const { error } = await supabase.from('billing_details').update({
                    ...dataToSave,
                    measurement_id: newMeasurement.id,
                    is_imported: false,
                    imported_data: null,
                    notes: `Originalmente importado. Cliente: ${formData.company_name}. Vinculado ao sistema.`,
                }).eq('id', billingItem.id);
                updateError = error;

            } else if (billingItem.is_imported) {
                const imported_data = {
                    service_date: formData.service_date,
                    issue_date: formData.issue_date,
                    due_date: formData.due_date,
                    company_name: formData.company_name,
                    gross_value: formData.gross_value,
                };
                const { error } = await supabase.from('billing_details').update({
                    ...dataToSave,
                    imported_data,
                }).eq('id', billingItem.id);
                updateError = error;
            } else {
                const { data: existingDetail, error: fetchError } = await supabase
                    .from('billing_details')
                    .select('id')
                    .eq('measurement_id', billingItem.measurement_id || billingItem.id)
                    .single();

                if (fetchError && fetchError.code !== 'PGRST116') {
                    updateError = fetchError;
                } else if (existingDetail) {
                    const { error } = await supabase.from('billing_details').update(dataToSave).eq('id', existingDetail.id);
                    updateError = error;
                } else {
                    const { error } = await supabase.from('billing_details').insert({
                        ...dataToSave,
                        measurement_id: billingItem.measurement_id || billingItem.id,
                        user_id: user.id,
                    });
                    updateError = error;
                }
            }

            if (updateError) throw updateError;

            toast({ title: 'Faturamento atualizado com sucesso!' });
            onUpdate();
            onClose();

        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Tem certeza que deseja excluir este registro de faturamento? Ele será movido para inativos.")) {
            return;
        }
        setIsSubmitting(true);
        const { error } = await supabase
            .from('billing_details')
            .update({ is_active: false })
            .eq('id', billingItem.id);

        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao excluir', description: error.message });
        } else {
            toast({ title: 'Faturamento excluído com sucesso!' });
            onUpdate();
            onClose();
        }
        setIsSubmitting(false);
    };

    const clientOptions = contacts
        .filter(c => c.type === 'Cliente')
        .map(c => ({ value: c.id.toString(), label: c.name }));

    if (!billingItem) return null;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-5xl">
                    <DialogHeader>
                        <DialogTitle>Editar Faturamento</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="max-h-[70vh] p-1">
                        <div className="p-6">
                            {billingItem.is_imported && (
                                <div className="col-span-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg mb-6">
                                    <h3 className="font-semibold text-lg mb-2">Vincular Registro Importado</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Este é um registro importado. Você pode vinculá-lo a um cliente existente no sistema. Isso criará uma nova medição e associará este faturamento a ela.
                                    </p>
                                    <Label>Cliente do Sistema</Label>
                                    <Combobox
                                        options={clientOptions}
                                        value={formData.contact_id}
                                        onChange={(value) => handleComboboxChange('contact_id', value)}
                                        placeholder="Selecione um cliente para vincular..."
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <h3 className="col-span-4 text-xl font-semibold border-b pb-2">Detalhes do Faturamento</h3>
                                
                                <div className="space-y-2">
                                    <Label>Empresa</Label>
                                    <Input name="company_name" value={formData.company_name || formData.proposal?.contacts?.name || ''} onChange={handleInputChange} disabled={!billingItem.is_imported} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Data do Serviço</Label>
                                    <Input type="date" name="service_date" value={formData.service_date || formData.display_date || ''} onChange={handleInputChange} disabled={!billingItem.is_imported} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Valor Bruto</Label>
                                    <Input name="gross_value" value={formData.gross_value || formData.total_value || ''} onChange={handleInputChange} disabled={!billingItem.is_imported} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Nota Fiscal (Número)</Label>
                                    <Input name="invoice_number" value={formData.invoice_number || ''} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Data de Vencimento</Label>
                                    <Input type="date" name="due_date" value={formData.due_date || ''} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Data de Pagamento</Label>
                                    <Input type="date" name="payment_date" value={formData.payment_date || ''} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Forma de Pagamento</Label>
                                    <Input name="payment_method" value={formData.payment_method || ''} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Valor ISS</Label>
                                    <Input type="number" name="iss_value" value={formData.iss_value || ''} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Valor INSS</Label>
                                    <Input type="number" name="inss_value" value={formData.inss_value || ''} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label>UF</Label>
                                    <Input name="uf" value={formData.uf || ''} onChange={handleInputChange} />
                                </div>
                                <div className="col-span-4 space-y-2">
                                    <Label>Notas</Label>
                                    <Textarea name="notes" value={formData.notes || ''} onChange={handleInputChange} />
                                </div>

                                <h3 className="col-span-4 text-xl font-semibold border-b pb-2 mt-4">Documentos Fiscais</h3>
                                
                                <FileUploadControl
                                    label="Pedido de Compra"
                                    fileUrl={formData.purchase_order_url}
                                    fileName={formData.purchase_order_filename}
                                    onFileSelect={(file) => handleFileSelect('purchase_order', file)}
                                    onFileRemove={() => handleFileRemove('purchase_order')}
                                    isSubmitting={isSubmitting}
                                    onViewAttachment={handleViewAttachment}
                                />
                                <FileUploadControl
                                    label="Nota Fiscal (Arquivo)"
                                    fileUrl={formData.invoice_file_url}
                                    fileName={formData.invoice_file_filename}
                                    onFileSelect={(file) => handleFileSelect('invoice_file', file)}
                                    onFileRemove={() => handleFileRemove('invoice_file')}
                                    isSubmitting={isSubmitting}
                                    onViewAttachment={handleViewAttachment}
                                />
                                <FileUploadControl
                                    label="Fatura / Boleto"
                                    fileUrl={formData.bill_url}
                                    fileName={formData.bill_filename}
                                    onFileSelect={(file) => handleFileSelect('bill', file)}
                                    onFileRemove={() => handleFileRemove('bill')}
                                    isSubmitting={isSubmitting}
                                    onViewAttachment={handleViewAttachment}
                                />
                                <FileUploadControl
                                    label="Outros"
                                    fileUrl={formData.other_doc_url}
                                    fileName={formData.other_doc_filename}
                                    onFileSelect={(file) => handleFileSelect('other_doc', file)}
                                    onFileRemove={() => handleFileRemove('other_doc')}
                                    isSubmitting={isSubmitting}
                                    onViewAttachment={handleViewAttachment}
                                />
                            </div>
                        </div>
                    </ScrollArea>
                    <DialogFooter className="justify-between">
                        <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                        </Button>
                        <div className="flex gap-2">
                            <DialogClose asChild>
                                <Button variant="outline" disabled={isSubmitting}>Cancelar</Button>
                            </DialogClose>
                            <Button onClick={handleSave} disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salvar Alterações
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <AttachmentViewerDialog 
                {...attachmentViewer}
                onClose={() => setAttachmentViewer(prev => ({ ...prev, isOpen: false }))}
            />
        </>
    );
};

export default BillingEditDialog;