import React, { useState, useEffect, useMemo } from 'react';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import { useToast } from '@/components/ui/use-toast';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
    import { Button } from '@/components/ui/button';
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { ScrollArea } from '@/components/ui/scroll-area';
    import { Loader2, Eye, Filter, X, Calendar as CalendarIcon, Wand2, Trash2 } from 'lucide-react';
    import { formatCurrency } from '@/lib/utils';
    import { format, parseISO } from 'date-fns';
    import { ptBR } from 'date-fns/locale';
    import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
    import { Calendar } from '@/components/ui/calendar';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import TravelExpenseProcessDialog from './TravelExpenseProcessDialog';
    import {
        AlertDialog,
        AlertDialogAction,
        AlertDialogCancel,
        AlertDialogContent,
        AlertDialogDescription,
        AlertDialogFooter,
        AlertDialogHeader,
        AlertDialogTitle,
    } from '@/components/ui/alert-dialog';

    const EXPENSE_TYPES = ['Combustível', 'Alimentação', 'Hospedagem', 'Transporte', 'Outros'];

    const TravelExpensesTab = () => {
        const { user } = useAuth();
        const { toast } = useToast();
        const [expenses, setExpenses] = useState([]);
        const [loading, setLoading] = useState(true);
        const [selectedExpense, setSelectedExpense] = useState(null);
        const [isDetailOpen, setIsDetailOpen] = useState(false);
        const [isProcessOpen, setIsProcessOpen] = useState(false);
        const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
        const [expenseToDelete, setExpenseToDelete] = useState(null);
        const [filters, setFilters] = useState({
            type: '',
            dateRange: { from: undefined, to: undefined },
        });

        const fetchExpenses = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('travel_expenses')
                .select('*')
                .eq('user_id', user.id)
                .order('expense_date', { ascending: false });

            if (error) {
                toast({ variant: 'destructive', title: 'Erro ao buscar despesas', description: error.message });
            } else {
                setExpenses(data);
            }
            setLoading(false);
        };

        useEffect(() => {
            if (user) fetchExpenses();
        }, [user]);

        const filteredExpenses = useMemo(() => {
            return expenses.filter(expense => {
                const typeMatch = !filters.type || expense.type === filters.type;
                const date = parseISO(expense.expense_date);
                const dateMatch = (!filters.dateRange.from || date >= filters.dateRange.from) &&
                                  (!filters.dateRange.to || date <= filters.dateRange.to);
                return typeMatch && dateMatch;
            });
        }, [expenses, filters]);

        const totalValue = useMemo(() => {
            return filteredExpenses.reduce((acc, expense) => acc + parseFloat(expense.value), 0);
        }, [filteredExpenses]);

        const handleViewDetails = (expense) => {
            setSelectedExpense(expense);
            setIsDetailOpen(true);
        };
        
        const handleProcess = (expense) => {
            setSelectedExpense(expense);
            setIsProcessOpen(true);
        };

        const handleDeleteExpense = (expense) => {
            setExpenseToDelete(expense);
            setIsConfirmDeleteOpen(true);
        };

        const confirmDelete = async () => {
            if (!expenseToDelete) return;

            setLoading(true);
            const { error } = await supabase
                .from('travel_expenses')
                .delete()
                .eq('id', expenseToDelete.id);

            if (error) {
                toast({ variant: 'destructive', title: 'Erro ao excluir despesa', description: error.message });
            } else {
                toast({ title: 'Sucesso!', description: 'Despesa excluída com sucesso.' });
                fetchExpenses(); // Refresh the list
            }
            setIsConfirmDeleteOpen(false);
            setExpenseToDelete(null);
            setLoading(false);
        };

        const clearFilters = () => {
            setFilters({ type: '', dateRange: { from: undefined, to: undefined } });
        };

        return (
            <>
                <Card>
                    <CardHeader>
                        <CardTitle>Relatório de Viagens e Despesas</CardTitle>
                        <CardDescription>Visualize e gerencie suas despesas de viagem.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-4 p-4 mb-4 bg-muted/50 rounded-lg border">
                            <div className="flex flex-wrap items-end gap-4">
                                <Filter className="w-5 h-5 text-primary self-center" />
                                <div className="flex-grow min-w-[200px]">
                                    <label className="text-sm font-medium">Tipo de Despesa</label>
                                    <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value === 'all' ? '' : value }))}>
                                        <SelectTrigger><SelectValue placeholder="Filtrar por tipo..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos os Tipos</SelectItem>
                                            {EXPENSE_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex-grow min-w-[250px]">
                                    <label className="text-sm font-medium">Período</label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {filters.dateRange.from ? (
                                                    filters.dateRange.to ? `${format(filters.dateRange.from, "dd/MM/y")} - ${format(filters.dateRange.to, "dd/MM/y")}` : format(filters.dateRange.from, "dd/MM/y")
                                                ) : (<span>Selecione um intervalo</span>)}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="range"
                                                selected={filters.dateRange}
                                                onSelect={(range) => setFilters(prev => ({ ...prev, dateRange: range || { from: undefined, to: undefined } }))}
                                                locale={ptBR}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <Button variant="ghost" onClick={clearFilters} className="self-end"><X className="w-4 h-4 mr-2" />Limpar</Button>
                            </div>
                            <div className="text-right font-bold text-lg">
                                Total do Período: <span className="text-primary">{formatCurrency(totalValue)}</span>
                            </div>
                        </div>

                        <ScrollArea className="h-[50vh] pr-4">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Valor</TableHead>
                                        <TableHead>Localização</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow><TableCell colSpan={6} className="text-center h-24"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
                                    ) : filteredExpenses.length > 0 ? (
                                        filteredExpenses.map(expense => (
                                            <TableRow key={expense.id}>
                                                <TableCell>
                                                    {expense.ai_status === 'pending' && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="h-2 w-2 rounded-full bg-orange-500" />
                                                            <span className="text-xs text-muted-foreground">Pendente</span>
                                                        </div>
                                                    )}
                                                    {expense.ai_status === 'processed' && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="h-2 w-2 rounded-full bg-green-500" />
                                                            <span className="text-xs text-muted-foreground">Analisado</span>
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>{format(parseISO(expense.expense_date), 'dd/MM/yyyy')}</TableCell>
                                                <TableCell>{expense.type}</TableCell>
                                                <TableCell>{formatCurrency(expense.value)}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground">{expense.address || 'Não disponível'}</TableCell>
                                                <TableCell className="text-right">
                                                    {expense.ai_status === 'pending' && (
                                                        <Button variant="ghost" size="icon" onClick={() => handleProcess(expense)} title="Processar com IA">
                                                            <Wand2 className="h-4 w-4 text-purple-500" />
                                                        </Button>
                                                    )}
                                                    <Button variant="ghost" size="icon" onClick={() => handleViewDetails(expense)} title="Ver Detalhes">
                                                        <Eye className="h-4 w-4 text-primary" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteExpense(expense)} title="Excluir Despesa">
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow><TableCell colSpan={6} className="text-center h-24">Nenhuma despesa encontrada.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>

                <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader><DialogTitle>Detalhes da Despesa</DialogTitle></DialogHeader>
                        {selectedExpense && (
                            <div className="space-y-4">
                                {selectedExpense.receipt_url && (
                                    <div className="w-full h-64 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                                        <img src={selectedExpense.receipt_url} alt="Comprovante" className="max-w-full max-h-full object-contain" />
                                    </div>
                                )}
                                <p><strong>Data:</strong> {format(parseISO(selectedExpense.expense_date), 'dd/MM/yyyy')}</p>
                                <p><strong>Tipo:</strong> {selectedExpense.type}</p>
                                <p><strong>Valor:</strong> {formatCurrency(selectedExpense.value)}</p>
                                <p><strong>Descrição:</strong> {selectedExpense.description || 'N/A'}</p>
                                <p><strong>Endereço:</strong> {selectedExpense.address || 'Não disponível'}</p>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                <TravelExpenseProcessDialog
                    expense={selectedExpense}
                    isOpen={isProcessOpen}
                    onClose={() => setIsProcessOpen(false)}
                    onProcessed={() => {
                        fetchExpenses();
                        setIsProcessOpen(false);
                    }}
                />

                <AlertDialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta ação não pode ser desfeita. Isso excluirá permanentemente a despesa selecionada.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
                                Excluir
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </>
        );
    };

    export default TravelExpensesTab;