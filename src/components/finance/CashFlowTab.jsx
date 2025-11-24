import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/lib/finance';

const CashFlowTab = ({ payables, receivables }) => {
    const [dateRange, setDateRange] = useState({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });

    const filteredCashFlow = useMemo(() => {
        const paid = payables
            .filter(p => p.status === 'Pago' && p.payment_date)
            .filter(p => {
                const paymentDate = parseISO(p.payment_date);
                return paymentDate >= dateRange.from && paymentDate <= dateRange.to;
            })
            .map(p => ({
                date: p.payment_date,
                description: p.description,
                output: p.net_value,
                input: 0
            }));
        
        const received = receivables
            .filter(r => r.status === 'Recebido' && r.receipt_date)
            .filter(r => {
                 const receiptDate = parseISO(r.receipt_date);
                 return receiptDate >= dateRange.from && receiptDate <= dateRange.to;
            })
            .map(r => ({
                date: r.receipt_date,
                description: r.description,
                output: 0,
                input: r.net_value
            }));

        const combined = [...paid, ...received].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        let balance = 0;
        return combined.map(item => {
            balance += (item.input || 0) - (item.output || 0);
            return { ...item, balance };
        });

    }, [payables, receivables, dateRange]);

    return (
        <div>
            <div className="flex items-center gap-2 mb-4">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button id="date" variant={"outline"} className={cn("w-[300px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (
                                dateRange.to ? (
                                    <>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</>
                                ) : (format(dateRange.from, "LLL dd, y"))
                            ) : (<span>Selecione um período</span>)}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-card border-white/20" align="start">
                        <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2}/>
                    </PopoverContent>
                </Popover>
            </div>
            <div className="overflow-x-auto">
               <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead className="text-right text-green-400">Entrada</TableHead>
                            <TableHead className="text-right text-red-400">Saída</TableHead>
                            <TableHead className="text-right">Saldo</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCashFlow.length > 0 ? filteredCashFlow.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell>{formatDate(item.date)}</TableCell>
                                <TableCell>{item.description}</TableCell>
                                <TableCell className="text-right text-green-400">{formatCurrency(item.input)}</TableCell>
                                <TableCell className="text-right text-red-400">{formatCurrency(item.output)}</TableCell>
                                <TableCell className="text-right font-bold">{formatCurrency(item.balance)}</TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                                    Nenhuma movimentação encontrada para o período selecionado.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
               </Table>
            </div>
        </div>
    );
};

export default CashFlowTab;