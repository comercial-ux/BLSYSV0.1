import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PlusCircle, Edit, Trash2, Briefcase, Building, User, Loader2, Search, Archive, FileText, ShieldHalf } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import ContactForm from './ContactForm';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';
import MasterPasswordDialog from '@/components/admin/MasterPasswordDialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import EmployeeDocumentsDialog from '@/components/personnel/EmployeeDocumentsDialog';
import EpiRecordDialog from '@/components/personnel/EpiRecordDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const ContactsTab = ({ initialContacts, loading, onUpdateNeeded, contactType, title }) => {
    const { user } = useAuth();
    const [contacts, setContacts] = useState(initialContacts || []);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDeleting, setIsDeleting] = useState(null);
    const [contactToDelete, setContactToDelete] = useState(null);
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [functionFilter, setFunctionFilter] = useState('all');
    const [showInactive, setShowInactive] = useState(false);
    
    const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
    const [isEpiModalOpen, setIsEpiModalOpen] = useState(false);
    const [contactForModal, setContactForModal] = useState(null);

    const collaboratorFunctions = ["Operador", "Sinaleiro", "Carreteiro", "Mecanico", "Operador de Munk", "Encarregado", "Geral"];
    const functionOptions = useMemo(() => {
        const options = collaboratorFunctions.map(f => ({ value: f, label: f }));
        options.unshift({ value: 'all', label: 'Todas as Funções' });
        return options;
    }, [collaboratorFunctions]);

    useEffect(() => {
        setContacts(initialContacts || []);
    }, [initialContacts]);

    const openModal = (contact = null) => {
        setSelectedContact(contact);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedContact(null);
        setIsModalOpen(false);
    };
    
    const openDocsModal = (contact) => {
        setContactForModal(contact);
        setIsDocsModalOpen(true);
    };

    const openEpiModal = (contact) => {
        setContactForModal(contact);
        setIsEpiModalOpen(true);
    };

    const handleSave = () => {
        if (onUpdateNeeded) onUpdateNeeded();
        closeModal();
    };
    
    const promptDelete = (contact) => {
        setContactToDelete(contact);
        setIsPasswordDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!user || !contactToDelete) return;
        setIsDeleting(contactToDelete.id);
        const { error } = await supabase.from('contacts').delete().eq('id', contactToDelete.id);
        setIsDeleting(null);
        setIsPasswordDialogOpen(false);
        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao excluir contato', description: error.message });
        } else {
            toast({ title: 'Contato excluído com sucesso!' });
            onUpdateNeeded();
        }
        setContactToDelete(null);
    };

    const filteredContacts = useMemo(() => {
        return (contacts || [])
            .filter(c => c.type === contactType)
            .filter(c => {
                if (contactType === 'Colaborador') {
                    if (!showInactive && c.status !== 'Ativo') return false;
                    if (functionFilter !== 'all' && c.function !== functionFilter) return false;
                }
                return true;
            })
            .filter(c => {
                if (!searchTerm) return true;
                const lowerSearchTerm = searchTerm.toLowerCase();
                return (
                    c.name?.toLowerCase().includes(lowerSearchTerm) ||
                    c.cnpj?.toLowerCase().includes(lowerSearchTerm) ||
                    c.cpf?.toLowerCase().includes(lowerSearchTerm) ||
                    c.function?.toLowerCase().includes(lowerSearchTerm)
                );
            });
    }, [contacts, contactType, searchTerm, functionFilter, showInactive]);

    const getIconForType = (type) => {
        switch (type) {
            case 'Cliente': return <User className="w-5 h-5 text-blue-400"/>;
            case 'Fornecedor': return <Building className="w-5 h-5 text-green-400"/>;
            case 'Colaborador': return <Briefcase className="w-5 h-5 text-purple-400"/>;
            default: return <User className="w-5 h-5"/>;
        }
    }

    const getNewButtonLabel = () => {
        switch(contactType) {
            case 'Cliente': return 'Novo Cliente';
            case 'Fornecedor': return 'Novo Fornecedor';
            case 'Colaborador': return 'Novo Colaborador';
            default: return 'Novo Contato';
        }
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>{title}</CardTitle>
                            <CardDescription>Gerencie os contatos do tipo "{contactType}"</CardDescription>
                        </div>
                        <Button onClick={() => openModal()}><PlusCircle className="mr-2 h-4 w-4" /> {getNewButtonLabel()}</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 mb-4 p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nome, CPF ou CNPJ..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                     {contactType === 'Colaborador' && (
                        <div className="mb-4 flex items-center gap-4">
                           <div className="w-64">
                                <Combobox
                                    options={functionOptions}
                                    value={functionFilter}
                                    onChange={setFunctionFilter}
                                    placeholder="Filtrar por função..."
                                    searchPlaceholder="Buscar função..."
                                    emptyText="Nenhuma função encontrada."
                                />
                           </div>
                           <div className="flex items-center space-x-2">
                                <Checkbox id="showInactive" checked={showInactive} onCheckedChange={setShowInactive} />
                                <Label htmlFor="showInactive">Exibir inativos</Label>
                            </div>
                        </div>
                    )}
                    <ScrollArea className="h-[60vh]">
                        <div className="space-y-2 pr-4">
                            {loading ? (
                                <div className="text-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /></div>
                            ) : filteredContacts.length === 0 ? (
                                <p className="text-center text-gray-400 p-12">Nenhum contato encontrado.</p>
                            ) : (
                                filteredContacts.map(contact => (
                                    <div key={contact.id} className="flex items-center justify-between p-3 bg-background rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            {getIconForType(contact.type)}
                                            <div>
                                                <p className="font-bold">{contact.name}</p>
                                                <p className="text-xs text-muted-foreground">{contact.function || (contact.person_type === 'Física' ? contact.cpf : contact.cnpj)}</p>
                                            </div>
                                            {contact.type === 'Colaborador' && (
                                                <span className={`ml-4 px-2 py-1 text-xs font-semibold rounded-full ${contact.status === 'Ativo' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                    {contact.status}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-1">
                                            {contactType === 'Colaborador' && (
                                              <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                  <Button size="icon" variant="ghost">
                                                    <Archive className="w-4 h-4 text-yellow-400"/>
                                                  </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                  <DropdownMenuItem onSelect={() => openDocsModal(contact)}>
                                                    <FileText className="mr-2 h-4 w-4" />
                                                    Documentos
                                                  </DropdownMenuItem>
                                                  <DropdownMenuItem onSelect={() => openEpiModal(contact)}>
                                                    <ShieldHalf className="mr-2 h-4 w-4" />
                                                    Ficha de EPI
                                                  </DropdownMenuItem>
                                                </DropdownMenuContent>
                                              </DropdownMenu>
                                            )}
                                            <Button size="icon" variant="ghost" onClick={() => openModal(contact)} disabled={isDeleting}><Edit className="w-4 h-4"/></Button>
                                            <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-400" disabled={isDeleting === contact.id} onClick={() => promptDelete(contact)}>
                                                {isDeleting === contact.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>}
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{selectedContact ? 'Editar' : 'Novo'} Contato</DialogTitle>
                    </DialogHeader>
                    <ContactForm contact={selectedContact} onSave={handleSave} onClose={closeModal} forcedType={contactType} />
                </DialogContent>
            </Dialog>

            {contactForModal && isDocsModalOpen && (
                <EmployeeDocumentsDialog
                    isOpen={isDocsModalOpen}
                    onClose={() => setIsDocsModalOpen(false)}
                    employee={contactForModal}
                />
            )}

            {contactForModal && isEpiModalOpen && (
                <EpiRecordDialog
                    isOpen={isEpiModalOpen}
                    onClose={() => setIsEpiModalOpen(false)}
                    employee={contactForModal}
                />
            )}

            <MasterPasswordDialog
                isOpen={isPasswordDialogOpen}
                onClose={() => setIsPasswordDialogOpen(false)}
                onConfirm={handleDelete}
                isSubmitting={!!isDeleting}
                title="Confirmar Exclusão de Contato"
                description={`Tem certeza de que deseja excluir o contato "${contactToDelete?.name}"? Esta ação não pode ser desfeita.`}
            />
        </>
    );
}

export default ContactsTab;