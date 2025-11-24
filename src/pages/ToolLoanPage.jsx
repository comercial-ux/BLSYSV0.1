import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, PlusCircle, RotateCcw, ArrowRightLeft } from 'lucide-react';
import ToolLoanForm from '@/components/inventory/ToolLoanForm';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import MasterPasswordDialog from '@/components/admin/MasterPasswordDialog';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';

const ToolLoanPage = ({ isSubTab = false }) => {
    const { toolLoans, loading, refetchData } = useData();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [loanToReturn, setLoanToReturn] = useState(null);
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

    const sortedLoans = useMemo(() => {
        if (!toolLoans) return [];
        return [...toolLoans].sort((a, b) => {
            if (a.status === 'loaned' && b.status !== 'loaned') return -1;
            if (a.status !== 'loaned' && b.status === 'loaned') return 1;
            return new Date(b.loan_date) - new Date(a.loan_date);
        });
    }, [toolLoans]);

    const handleOpenForm = () => {
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
    };

    const handleSave = () => {
        refetchData();
        handleCloseForm();
    };

    const promptReturn = (loan) => {
        setLoanToReturn(loan);
        setIsPasswordDialogOpen(true);
    };

    const handleReturn = async () => {
        if (!loanToReturn) return;

        const { error } = await supabase.rpc('return_tool_loan', {
            p_loan_id: loanToReturn.id,
            p_user_id: loanToReturn.user_id,
        });

        setIsPasswordDialogOpen(false);

        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao devolver ferramenta', description: error.message });
        } else {
            toast({ title: 'Ferramenta devolvida com sucesso!' });
            refetchData();
        }
        setLoanToReturn(null);
    };
    
    const getStatusBadge = (status) => {
        switch (status) {
            case 'loaned':
                return <Badge variant="destructive">Emprestado</Badge>;
            case 'returned':
                return <Badge variant="secondary">Devolvido</Badge>;
            case 'overdue':
                return <Badge variant="destructive" className="bg-yellow-500">Atrasado</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };
    
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return format(parseISO(dateString), 'dd/MM/yyyy HH:mm');
    }

    const pageContent = (
         <div className="flex-grow flex flex-col">
            {!isSubTab && (
                 <div className="flex-grow flex flex-col bg-card p-6 rounded-lg shadow-lg">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-white flex items-center gap-2"><ArrowRightLeft /> Empréstimo de Ferramentas</h1>
                            <p className="text-gray-400">Gerencie o empréstimo e devolução de ferramentas.</p>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex justify-end items-center mb-4">
                <Button size="lg" onClick={handleOpenForm}>
                    <PlusCircle className="mr-2 h-5 w-5" /> Novo Empréstimo
                </Button>
            </div>
            <ScrollArea className="flex-grow">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Ferramenta</TableHead>
                            <TableHead>Colaborador</TableHead>
                            <TableHead>Data Empréstimo</TableHead>
                            <TableHead>Data Devolução</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan="6" className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                        ) : sortedLoans.length > 0 ? (
                            sortedLoans.map(loan => (
                                <TableRow key={loan.id}>
                                    <TableCell className="font-medium">{loan.tool?.name || 'Ferramenta não encontrada'}</TableCell>
                                    <TableCell>{loan.contact?.name || 'Colaborador não encontrado'}</TableCell>
                                    <TableCell>{formatDate(loan.loan_date)}</TableCell>
                                    <TableCell>{loan.actual_return_date ? formatDate(loan.actual_return_date) : 'Pendente'}</TableCell>
                                    <TableCell>{getStatusBadge(loan.status)}</TableCell>
                                    <TableCell className="text-right">
                                        {loan.status === 'loaned' && (
                                            <Button variant="ghost" size="icon" className="text-green-500 hover:text-green-400" title="Registrar Devolução" onClick={() => promptReturn(loan)}>
                                                <RotateCcw className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan="6" className="text-center py-12">Nenhum empréstimo registrado.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </ScrollArea>
        </div>
    );

    return (
        <>
            {!isSubTab && (
                <Helmet>
                    <title>Empréstimo de Ferramentas | BL Soluções</title>
                </Helmet>
            )}
            <motion.div 
                initial={!isSubTab ? { opacity: 0, y: 20 } : false} 
                animate={{ opacity: 1, y: 0 }} 
                className="h-full flex flex-col"
            >
                {pageContent}
            </motion.div>
            
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Novo Empréstimo de Ferramenta</DialogTitle>
                        <DialogDescription>
                            Selecione a ferramenta e o colaborador.
                        </DialogDescription>
                    </DialogHeader>
                    <ToolLoanForm 
                        onSave={handleSave} 
                        onClose={handleCloseForm}
                    />
                </DialogContent>
            </Dialog>
            <MasterPasswordDialog
                isOpen={isPasswordDialogOpen}
                onClose={() => setIsPasswordDialogOpen(false)}
                onConfirm={handleReturn}
                isSubmitting={loading}
                title="Confirmar Devolução"
                description={`Tem certeza que deseja registrar a devolução da ferramenta "${loanToReturn?.tool?.name}" por ${loanToReturn?.contact?.name}?`}
            />
        </>
    );
};

export default ToolLoanPage;