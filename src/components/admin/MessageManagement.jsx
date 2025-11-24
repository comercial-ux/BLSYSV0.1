import React, { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/lib/customSupabaseClient';
import toast from 'react-hot-toast';

const MessageRecipientsDialog = ({ messageId, users }) => {
    const [recipients, setRecipients] = useState([]);
    const [loading, setLoading] = useState(false);
  
    const fetchRecipients = async () => {
        if (!messageId) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('user_messages')
            .select('user_id, is_read')
            .eq('message_id', messageId);
        
        if (error) {
            toast.error("Erro ao buscar destinatários.");
        } else {
            const recipientDetails = data.map(r => {
                const user = users.find(u => u.id === r.user_id);
                return {
                    name: user ? user.full_name : 'Usuário desconhecido',
                    email: user ? user.email : '-',
                    is_read: r.is_read
                };
            });
            setRecipients(recipientDetails);
        }
        setLoading(false);
    };

    return (
        <Dialog onOpenChange={(open) => open && fetchRecipients()}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Info className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Destinatários da Mensagem</DialogTitle>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto">
                    {loading ? <Loader2 className="mx-auto h-8 w-8 animate-spin" /> : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recipients.map((r, i) => (
                                    <TableRow key={i}>
                                        <TableCell>{r.name}</TableCell>
                                        <TableCell>{r.email}</TableCell>
                                        <TableCell>
                                            <Badge variant={r.is_read ? 'secondary' : 'default'}>
                                                {r.is_read ? 'Lida' : 'Não Lida'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};


const MessageManagement = () => {
    const { users } = useData();
    const [allMessages, setAllMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllMessages = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                toast.error('Erro ao carregar mensagens.');
            } else {
                setAllMessages(data);
            }
            setLoading(false);
        };
        fetchAllMessages();
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Histórico de Mensagens</CardTitle>
                <CardDescription>
                    Visualize todas as mensagens enviadas através do sistema.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Título</TableHead>
                                <TableHead>Remetente</TableHead>
                                <TableHead>Gatilho</TableHead>
                                <TableHead className="text-right">Info</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></TableCell></TableRow>
                            ) : allMessages.length > 0 ? (
                                allMessages.map(msg => (
                                    <TableRow key={msg.id}>
                                        <TableCell>{format(new Date(msg.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</TableCell>
                                        <TableCell className="font-medium">{msg.title}</TableCell>
                                        <TableCell>{msg.sender_name || 'N/A'}</TableCell>
                                        <TableCell>{msg.trigger_event || 'Manual'}</TableCell>
                                        <TableCell className="text-right">
                                           <MessageRecipientsDialog messageId={msg.id} users={users} />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center">Nenhuma mensagem encontrada.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};

export default MessageManagement;