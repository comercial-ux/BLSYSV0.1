import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '../ui/use-toast';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { getDocumentStatusFromDates } from '@/lib/documentabl';
import DocumentFormFields from './DocumentFormFields';
import ContactForm from '@/components/contacts/ContactForm';
import EquipmentForm from '@/components/forms/EquipmentForm';

const DocumentFormDialog = ({ 
    isOpen, 
    onOpenChange, 
    mainCategory, 
    categories, 
    documentToEdit = null,
    preselectedColaboradorId = null,
    preselectedEquipamentoId = null,
    preselectedCategoryId = null
}) => {
    const { toast } = useToast();
    const { refetchData, commercialData, equipments } = useData();
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [file, setFile] = useState(null);
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    
    const getInitialFormData = () => ({
        name: documentToEdit?.name || '',
        category_id: documentToEdit?.category_id?.toString() || preselectedCategoryId?.toString() || '',
        is_mandatory: documentToEdit?.is_mandatory || false,
        include_in_packages: documentToEdit?.include_in_packages || true,
        periodicity: documentToEdit?.periodicity || '',
        notes: documentToEdit?.notes || '',
        version_string: documentToEdit?.current_version?.version_string || '1.0',
        reference_code: documentToEdit?.current_version?.reference_code || '',
        creation_date: documentToEdit?.current_version?.creation_date || new Date().toISOString().split('T')[0],
        expiry_date: documentToEdit?.current_version?.expiry_date ? new Date(documentToEdit.current_version.expiry_date).toISOString().split('T')[0] : '',
        colaborador_id: documentToEdit?.colaborador_id?.toString() || preselectedColaboradorId?.toString() || '',
        equipamento_id: documentToEdit?.equipamento_id?.toString() || preselectedEquipamentoId?.toString() || '',
    });

    const [formData, setFormData] = useState(getInitialFormData());

    const colaboradorOptions = useMemo(() => 
        (commercialData?.contacts || []).filter(c => c.type === 'Colaborador').map(c => ({ value: c.id.toString(), label: c.name }))
    , [commercialData.contacts]);

    const equipamentoOptions = useMemo(() =>
        (equipments || []).map(e => ({ value: e.id.toString(), label: e.name }))
    , [equipments]);
    
    useEffect(() => {
        if (isOpen) {
            setFormData(getInitialFormData());
            setFile(null);
        }
    }, [isOpen, documentToEdit, preselectedColaboradorId, preselectedEquipamentoId, preselectedCategoryId]);

    const handleQuickAddSuccess = async () => {
        setIsQuickAddOpen(false);
        await refetchData();
    };
    
    const sanitizeData = (data) => {
        const sanitized = { ...data };
        // Garante que campos enum não sejam enviados como strings vazias
        if (sanitized.periodicity === '' || sanitized.periodicity === undefined) {
            sanitized.periodicity = null;
        }
        if (sanitized.category_id === '' || sanitized.category_id === undefined) {
            sanitized.category_id = null;
        }
        if (sanitized.colaborador_id === '' || sanitized.colaborador_id === undefined) {
            sanitized.colaborador_id = null;
        }
        if (sanitized.equipamento_id === '' || sanitized.equipamento_id === undefined) {
            sanitized.equipamento_id = null;
        }
        return sanitized;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!documentToEdit && !file) {
            toast({ variant: 'destructive', title: 'Arquivo Obrigatório', description: 'Por favor, selecione um arquivo para o novo documento.' });
            return;
        }

        setIsSubmitting(true);

        try {
            let fileUrl = documentToEdit?.current_version?.file_url || null;
            let fileName = documentToEdit?.current_version?.file_name || null;
            let fileType = documentToEdit?.current_version?.file_type || null;
            let fileSize = documentToEdit?.current_version?.file_size || null;

            if (file) {
                const fileExt = file.name.split('.').pop();
                const newFileName = `${uuidv4()}.${fileExt}`;
                const filePath = `${user.id}/${newFileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('documentabl-files')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from('documentabl-files')
                    .getPublicUrl(filePath);
                
                fileUrl = urlData.publicUrl;
                fileName = file.name;
                fileType = file.type;
                fileSize = file.size;
            }
            
            const sanitizedFormData = sanitizeData(formData);

            const documentData = {
                user_id: user.id,
                main_category: mainCategory,
                category_id: sanitizedFormData.category_id,
                name: sanitizedFormData.name,
                colaborador_id: sanitizedFormData.colaborador_id,
                equipamento_id: sanitizedFormData.equipamento_id,
                is_mandatory: sanitizedFormData.is_mandatory,
                include_in_packages: sanitizedFormData.include_in_packages,
                periodicity: sanitizedFormData.periodicity,
                notes: sanitizedFormData.notes,
                is_active: true,
            };

            let docId = documentToEdit?.id;

            if (documentToEdit) {
                const { error: docUpdateError } = await supabase
                    .from('documentabl_documents')
                    .update(documentData)
                    .eq('id', documentToEdit.id);
                if (docUpdateError) throw docUpdateError;
            } else {
                const { data: newDoc, error: docInsertError } = await supabase
                    .from('documentabl_documents')
                    .insert(documentData)
                    .select('id')
                    .single();
                if (docInsertError) throw docInsertError;
                docId = newDoc.id;
            }

            if (file || (documentToEdit && file)) { 
                if (documentToEdit?.current_version_id) {
                     await supabase
                        .from('documentabl_versions')
                        .update({ status: 'substituido' })
                        .eq('id', documentToEdit.current_version_id);
                }

                const versionData = {
                    document_id: docId,
                    user_id: user.id,
                    version_string: formData.version_string,
                    reference_code: formData.reference_code,
                    creation_date: formData.creation_date,
                    expiry_date: formData.expiry_date || null,
                    status: getDocumentStatusFromDates(formData.creation_date, formData.expiry_date),
                    file_url: fileUrl,
                    file_name: fileName,
                    file_type: fileType,
                    file_size: fileSize,
                };

                const { data: newVersion, error: versionInsertError } = await supabase
                    .from('documentabl_versions')
                    .insert(versionData)
                    .select('id')
                    .single();
                
                if (versionInsertError) throw versionInsertError;
                
                const { error: docVersionUpdateError } = await supabase
                    .from('documentabl_documents')
                    .update({ current_version_id: newVersion.id })
                    .eq('id', docId);

                if (docVersionUpdateError) throw docVersionUpdateError;
            }

            toast({ title: 'Sucesso!', description: `Documento ${documentToEdit ? 'atualizado' : 'criado'} com sucesso.` });
            await refetchData();
            onOpenChange(false);
        } catch (error) {
            console.error('Erro ao salvar documento:', error);
             if (error.code === '22P02') {
                 toast({ variant: 'destructive', title: 'Valor Inválido', description: 'Um dos campos selecionados tem um valor inválido. Verifique o formulário.' });
            } else {
                 toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message });
            }
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const renderQuickAddDialog = () => {
        if (!isQuickAddOpen) return null;

        const QuickAddComponent = mainCategory === 'colaborador' ? ContactForm : EquipmentForm;
        const dialogTitle = mainCategory === 'colaborador' ? 'Adicionar Novo Colaborador' : 'Adicionar Novo Equipamento';
        const formProps = mainCategory === 'colaborador' ? { contact: { type: 'Colaborador' } } : {};

        return (
            <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{dialogTitle}</DialogTitle>
                    </DialogHeader>
                    <QuickAddComponent {...formProps} onSave={handleQuickAddSuccess} onClose={() => setIsQuickAddOpen(false)} />
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[625px]">
                    <DialogHeader>
                        <DialogTitle>{documentToEdit ? 'Editar' : 'Novo'} Documento</DialogTitle>
                        <DialogDescription>
                            Preencha os dados abaixo para {documentToEdit ? 'atualizar o' : 'adicionar um novo'} documento de {mainCategory}.
                        </DialogDescription>
                    </DialogHeader>
                    <form id="document-form-main" onSubmit={handleSubmit} className="grid gap-4 py-4">
                        <DocumentFormFields
                            formData={formData}
                            setFormData={setFormData}
                            mainCategory={mainCategory}
                            categories={categories}
                            colaboradorOptions={colaboradorOptions}
                            equipamentoOptions={equipamentoOptions}
                            documentToEdit={documentToEdit}
                            onFileChange={setFile}
                            onQuickAdd={() => setIsQuickAddOpen(true)}
                            fieldDisabled={{
                                colaborador_id: !!preselectedColaboradorId,
                                equipamento_id: !!preselectedEquipamentoId,
                                category_id: !!preselectedCategoryId,
                            }}
                        />
                    </form>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit" form="document-form-main" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Salvar Documento
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {renderQuickAddDialog()}
        </>
    );
};

export default DocumentFormDialog;