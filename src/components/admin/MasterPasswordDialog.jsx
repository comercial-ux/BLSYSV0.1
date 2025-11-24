import React, { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const MasterPasswordDialog = ({ isOpen, onClose, onConfirm, isSubmitting, title, description }) => {
    const [password, setPassword] = useState('');
    const { toast } = useToast();

    const MASTER_PASSWORD = "Rmmg470$";

    useEffect(() => {
        if (!isOpen) {
            setPassword('');
        }
    }, [isOpen]);

    const handleConfirm = () => {
        if (password === MASTER_PASSWORD) {
            onConfirm();
        } else {
            toast({
                variant: 'destructive',
                title: 'Senha Incorreta',
                description: 'A senha mestra informada está incorreta. A operação foi cancelada.',
            });
        }
    };
    
    const handleClose = () => {
        if (!isSubmitting) {
            setPassword('');
            onClose();
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title || 'Confirmação de Segurança'}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description || 'Para prosseguir com esta ação, por favor, insira a senha mestra.'}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                    <Label htmlFor="master-password">Senha Mestra</Label>
                    <Input
                        id="master-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-2"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && !isSubmitting && handleConfirm()}
                    />
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={handleClose} disabled={isSubmitting}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirm} disabled={isSubmitting || !password}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default MasterPasswordDialog;