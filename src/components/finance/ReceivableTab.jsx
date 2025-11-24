import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate, getStatusClass } from '@/lib/finance';

const ReceivableTab = ({ receivables, onEdit, onDelete }) => {
    if (!receivables || receivables.length === 0) {
        return <p className="text-center text-gray-400 py-8">Nenhuma conta a receber encontrada.</p>;
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Job</TableHead>
                        <TableHead>Plano de Contas</TableHead>
                        <TableHead>Centro de Custo</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {receivables.map(r => (
                         <TableRow key={r.id}>
                            <TableCell>{r.contacts?.name || 'N/A'}</TableCell>
                            <TableCell>{r.description}</TableCell>
                            <TableCell>{r.jobs?.job_code || '-'}</TableCell>
                            <TableCell>{r.chart_of_accounts?.name || '-'}</TableCell>
                            <TableCell>{r.cost_centers?.name || '-'}</TableCell>
                            <TableCell>{formatDate(r.due_date)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(r.net_value)}</TableCell>
                            <TableCell className="text-center">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(r.status)}`}>
                                    {r.status}
                                </span>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => onEdit(r)}><Edit className="h-4 w-4"/></Button>
                                <Button variant="ghost" size="icon" onClick={() => onDelete(r.id)} className="text-red-500 hover:text-red-400"><Trash2 className="h-4 w-4"/></Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default ReceivableTab;