import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Select from 'react-select';
import { Loader2, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useData } from '@/contexts/DataContext';
import { reactSelectStyles } from '@/lib/utils';

const DirectMessageDialog = ({ isOpen, onClose, users, senderId }) => {
    const { refetchData } = useData();
    const [recipients, setRecipients] = useState([]);
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [isSending, setIsSending] = useState(false);

    const userOptions = users.map(u => ({ value: u.id, label: u.full_name || u.email }));
    const sender = users.find(u => u.id === senderId);

    const resetForm = () => {
        setRecipients([]);
        setTitle('');
        setBody('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (recipients.length === 0 || !title || !body) {
            toast.error("Por favor, preencha todos os campos.");
            return;
        }

        setIsSending(true);
        const toastId = toast.loading('Enviando mensagem...');

        try {
            // 1. Create the master message
            const { data: newMessage, error: messageError } = await supabase
                .from('messages')
                .insert({
                    sender_id: senderId,
                    sender_name: sender?.full_name || 'Usuário do Sistema',
                    title,
                    body,
                    trigger_event: 'manual_direct'
                })
                .select()
                .single();

            if (messageError) throw messageError;

            // 2. Link message to all recipients
            const userMessagesPayload = recipients.map(r => ({
                user_id: r.value,
                message_id: newMessage.id
            }));

            const { error: userMessageError } = await supabase
                .from('user_messages')
                .insert(userMessagesPayload);

            if (userMessageError) throw userMessageError;

            toast.success('Mensagem enviada com sucesso!', { id: toastId });
            resetForm();
            onClose();
            refetchData(); // To update message lists everywhere
        } catch (error) {
            toast.error(`Erro ao enviar mensagem: ${error.message}`, { id: toastId });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Enviar Nova Mensagem</DialogTitle>
                    <DialogDescription>
                        Envie uma mensagem direta para um ou mais usuários do sistema.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div>
                        <Label htmlFor="recipients">Destinatários</Label>
                        <Select
                            id="recipients"
                            classNamePrefix="react-select"
                            isMulti
                            options={userOptions}
                            value={recipients}
                            onChange={setRecipients}
                            placeholder="Selecione um ou mais usuários..."
                            styles={reactSelectStyles}
                        />
                    </div>
                    <div>
                        <Label htmlFor="title">Título</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                    </div>
                    <div>
                        <Label htmlFor="body">Mensagem</Label>
                        <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} rows={5} required />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={isSending}>
                            {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4"/>}
                            Enviar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default DirectMessageDialog;