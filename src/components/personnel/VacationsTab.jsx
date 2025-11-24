import React, { useState, useMemo } from 'react';
    import { useData } from '@/contexts/DataContext';
    import { Button } from '@/components/ui/button';
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
    import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
    import { MoreHorizontal, PlusCircle, Trash2, Edit } from 'lucide-react';
    import { format, parseISO } from 'date-fns';
    import VacationForm from './VacationForm';
    import { toast } from '@/components/ui/use-toast';
    import { supabase } from '@/lib/customSupabaseClient';
    import {
      AlertDialog,
      AlertDialogAction,
      AlertDialogCancel,
      AlertDialogContent,
      AlertDialogDescription,
      AlertDialogFooter,
      AlertDialogHeader,
      AlertDialogTitle,
    } from "@/components/ui/alert-dialog"


    const VacationsTab = () => {
        const { personnelData, commercialData, refetchData } = useData();
        const { vacations } = personnelData;
        const [isFormOpen, setIsFormOpen] = useState(false);
        const [selectedVacation, setSelectedVacation] = useState(null);
        const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
        const [vacationToDelete, setVacationToDelete] = useState(null);

        const employees = useMemo(() => {
            return commercialData.contacts.filter(c => c.type === 'Colaborador' && c.status === 'Ativo');
        }, [commercialData.contacts]);

        const handleSave = () => {
            refetchData();
            setIsFormOpen(false);
            setSelectedVacation(null);
        };

        const handleEdit = (vacation) => {
            setSelectedVacation(vacation);
            setIsFormOpen(true);
        };

        const confirmDelete = (vacation) => {
            setVacationToDelete(vacation);
            setIsDeleteDialogOpen(true);
        };
        
        const handleDelete = async () => {
            if (!vacationToDelete) return;

            const { error } = await supabase
                .from('personnel_vacations')
                .delete()
                .eq('id', vacationToDelete.id);

            if (error) {
                toast({ variant: 'destructive', title: 'Erro ao excluir férias', description: error.message });
            } else {
                toast({ title: 'Férias excluídas com sucesso!' });
                refetchData();
            }
            setIsDeleteDialogOpen(false);
            setVacationToDelete(null);
        };

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-semibold">Controle de Férias</h2>
                     <Dialog open={isFormOpen} onOpenChange={(isOpen) => { setIsFormOpen(isOpen); if (!isOpen) setSelectedVacation(null); }}>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" /> Agendar Férias
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[525px]">
                            <DialogHeader>
                                <DialogTitle>{selectedVacation ? 'Editar' : 'Agendar'} Férias</DialogTitle>
                            </DialogHeader>
                            <VacationForm 
                                vacation={selectedVacation}
                                employees={employees}
                                onSave={handleSave}
                                onClose={() => setIsFormOpen(false)}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Colaborador</TableHead>
                                <TableHead>Início</TableHead>
                                <TableHead>Fim</TableHead>
                                <TableHead>Observações</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {vacations && vacations.length > 0 ? (
                                vacations.map(vacation => (
                                    <TableRow key={vacation.id}>
                                        <TableCell className="font-medium">{vacation.contact?.name || 'N/A'}</TableCell>
                                        <TableCell>{format(parseISO(vacation.start_date), 'dd/MM/yyyy')}</TableCell>
                                        <TableCell>{format(parseISO(vacation.end_date), 'dd/MM/yyyy')}</TableCell>
                                        <TableCell className="max-w-[200px] truncate">{vacation.notes || '-'}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleEdit(vacation)}>
                                                        <Edit className="mr-2 h-4 w-4" /> Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => confirmDelete(vacation)} className="text-red-500">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        Nenhum período de férias agendado.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                 <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta ação não pode ser desfeita. Isso excluirá permanentemente o registro de férias.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                                Excluir
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        );
    };

    export default VacationsTab;