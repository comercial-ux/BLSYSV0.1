import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, UploadCloud, File, Trash2, Download, Edit } from 'lucide-react';
import MasterPasswordDialog from '@/components/admin/MasterPasswordDialog';

const FileForm = ({ fileToEdit, onSave, onCancel }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [file, setFile] = useState(null);
    const [description, setDescription] = useState(fileToEdit?.description || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file && !fileToEdit) {
            toast({ variant: 'destructive', title: 'Nenhum arquivo selecionado' });
            return;
        }

        setIsSubmitting(true);

        try {
            let fileData = {
                description: description,
                user_id: user.id
            };

            if (file) {
                const fileExt = file.name.split('.').pop();
                const newFileName = `${uuidv4()}.${fileExt}`;
                const filePath = `${user.id}/${newFileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('my-vault-files')
                    .upload(filePath, file);
                
                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from('my-vault-files')
                    .getPublicUrl(filePath);
                
                fileData = {
                    ...fileData,
                    file_name: file.name,
                    file_type: file.type,
                    file_size: file.size,
                    file_path: filePath,
                    file_url: urlData.publicUrl,
                };
            }
            
            let query;
            if (fileToEdit) {
                query = supabase.from('my_vault_files').update(fileData).eq('id', fileToEdit.id);
            } else {
                query = supabase.from('my_vault_files').insert(fileData);
            }

            const { error } = await query;
            if (error) throw error;
            
            toast({ title: 'Sucesso!', description: `Arquivo ${fileToEdit ? 'atualizado' : 'salvo'} com sucesso.` });
            onSave();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao salvar arquivo', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="file-upload">Arquivo</Label>
                <Input id="file-upload" type="file" onChange={(e) => setFile(e.target.files[0])} />
                {fileToEdit && <p className="text-xs text-muted-foreground mt-1">Deixe em branco para manter o arquivo atual: {fileToEdit.file_name}</p>}
            </div>
            <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição ou observação sobre o arquivo..." />
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar
                </Button>
            </DialogFooter>
        </form>
    );
};


const MyVaultTab = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [fileToEdit, setFileToEdit] = useState(null);
    const [fileToDelete, setFileToDelete] = useState(null);
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

    const fetchFiles = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('my_vault_files')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao buscar arquivos', description: error.message });
        } else {
            setFiles(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (user) fetchFiles();
    }, [user]);

    const handleOpenForm = (file = null) => {
        setFileToEdit(file);
        setIsFormOpen(true);
    };

    const handleSave = () => {
        setIsFormOpen(false);
        setFileToEdit(null);
        fetchFiles();
    };

    const promptDelete = (file) => {
        setFileToDelete(file);
        setIsPasswordDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!fileToDelete) return;

        const { error: storageError } = await supabase.storage
            .from('my-vault-files')
            .remove([fileToDelete.file_path]);

        if (storageError) {
            toast({ variant: 'destructive', title: 'Erro ao deletar arquivo do armazenamento', description: storageError.message });
        }
        
        const { error: dbError } = await supabase
            .from('my_vault_files')
            .delete()
            .eq('id', fileToDelete.id);
        
        if (dbError) {
             toast({ variant: 'destructive', title: 'Erro ao deletar registro', description: dbError.message });
        } else {
             toast({ title: 'Arquivo deletado com sucesso!' });
             fetchFiles();
        }

        setIsPasswordDialogOpen(false);
        setFileToDelete(null);
    };
    
    const formatBytes = (bytes, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Meu Cofre</CardTitle>
                        <CardDescription>Sua área pessoal e segura para guardar documentos e arquivos importantes.</CardDescription>
                    </div>
                    <Button onClick={() => handleOpenForm()}>
                        <UploadCloud className="mr-2 h-4 w-4" />
                        Novo Arquivo
                    </Button>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[60vh] pr-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome do Arquivo</TableHead>
                                    <TableHead>Descrição</TableHead>
                                    <TableHead>Tamanho</TableHead>
                                    <TableHead>Data de Envio</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">
                                            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                                        </TableCell>
                                    </TableRow>
                                ) : files.length > 0 ? (
                                    files.map(file => (
                                        <TableRow key={file.id}>
                                            <TableCell className="font-medium">{file.file_name}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{file.description || '-'}</TableCell>
                                            <TableCell>{formatBytes(file.file_size)}</TableCell>
                                            <TableCell>{new Date(file.created_at).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => window.open(file.file_url, '_blank')}>
                                                    <Download className="h-4 w-4 text-primary" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenForm(file)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => promptDelete(file)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">
                                            <File className="mx-auto h-12 w-12 text-muted-foreground" />
                                            <p className="mt-2 text-sm text-muted-foreground">Seu cofre está vazio. Adicione seu primeiro arquivo!</p>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{fileToEdit ? 'Editar Arquivo' : 'Adicionar Arquivo ao Cofre'}</DialogTitle>
                    </DialogHeader>
                    <FileForm
                        fileToEdit={fileToEdit}
                        onSave={handleSave}
                        onCancel={() => setIsFormOpen(false)}
                    />
                </DialogContent>
            </Dialog>

             <MasterPasswordDialog
                isOpen={isPasswordDialogOpen}
                onClose={() => setIsPasswordDialogOpen(false)}
                onConfirm={handleDelete}
                title="Confirmar Exclusão"
                description={`Tem certeza de que deseja excluir o arquivo "${fileToDelete?.file_name}"? Esta ação não pode ser desfeita.`}
            />
        </>
    );
};

export default MyVaultTab;