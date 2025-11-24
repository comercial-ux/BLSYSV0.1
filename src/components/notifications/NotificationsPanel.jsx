import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BellRing, MailOpen } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const NotificationsPanel = ({ isOpen, onClose, messages }) => {
    const { markAllAsRead, markAsRead } = useData();
    const [showUnreadOnly, setShowUnreadOnly] = useState(true);

    const handleMarkAllRead = () => {
        markAllAsRead();
    };
    
    const handleMarkOneRead = (e, messageId) => {
        e.stopPropagation();
        markAsRead(messageId);
    };

    const filteredMessages = showUnreadOnly ? messages.filter(msg => !msg.is_read) : messages;

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
                <SheetHeader>
                    <SheetTitle>Central de Notificações</SheetTitle>
                    <SheetDescription>
                        Avisos e mensagens importantes do sistema.
                        <div className="flex items-center space-x-2 mt-2">
                            <Checkbox
                                id="showUnreadOnly"
                                checked={showUnreadOnly}
                                onCheckedChange={setShowUnreadOnly}
                            />
                            <Label htmlFor="showUnreadOnly">Apenas não lidas</Label>
                        </div>
                        {messages.some(m => !m.is_read) && (
                            <Button variant="link" size="sm" onClick={handleMarkAllRead} className="ml-2">
                                Marcar todas como lidas
                            </Button>
                        )}
                    </SheetDescription>
                </SheetHeader>
                <ScrollArea className="flex-grow my-4 pr-6">
                    <div className="space-y-3">
                        {filteredMessages.length > 0 ? (
                            filteredMessages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                                        msg.is_read ? 'bg-card/50 opacity-70' : 'bg-card ring-2 ring-primary/50'
                                    }`}
                                    onClick={(e) => !msg.is_read && handleMarkOneRead(e, msg.id)}
                                >
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-semibold text-foreground">{msg.title}</h4>
                                        {!msg.is_read && <Badge variant="destructive">Nova</Badge>}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">{msg.body}</p>
                                    <div className="text-xs text-muted-foreground mt-3 flex justify-between items-center">
                                        <span>
                                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ptBR })}
                                        </span>
                                        {msg.link_to && (
                                            <Button variant="link" size="sm" className="h-auto p-0" onClick={(e) => { e.stopPropagation(); /* navigate logic here */ }}>
                                                Ver Detalhes
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20">
                                <BellRing className="mx-auto h-12 w-12 text-muted-foreground" />
                                <p className="mt-4 text-muted-foreground">Nenhuma notificação por aqui.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
};

export default NotificationsPanel;