import React from 'react';
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
    import { Input } from '@/components/ui/input';
    import { Button } from '@/components/ui/button';
    import { Trash2 } from 'lucide-react';

    const formatTime = (timeStr) => {
        if (!timeStr) return '-';
        const parts = timeStr.split(':');
        return `${parts[0]}:${parts[1]}`;
    };

    const formatHoursForDisplay = (hours) => {
        if (typeof hours !== 'number' || isNaN(hours)) return '00:00';
        const sign = hours < 0 ? '-' : '';
        const absHours = Math.abs(hours);
        const h = Math.floor(absHours);
        const m = Math.round((absHours - h) * 60);
        return `${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    const EditableCell = ({ value, onChange }) => {
        const [internalValue, setInternalValue] = React.useState(value);

        React.useEffect(() => {
            setInternalValue(value);
        }, [value]);

        const handleBlur = (e) => {
            const newValue = parseFloat(e.target.value);
            if (!isNaN(newValue)) {
                onChange(newValue);
            } else {
                setInternalValue(value); 
            }
        };

        const handleChange = (e) => {
            setInternalValue(e.target.value);
        };

        return (
            <Input
                type="number"
                step="0.5"
                value={internalValue}
                onChange={handleChange}
                onBlur={handleBlur}
                className="h-8 w-24 text-center bg-transparent border-0 focus-visible:ring-1 focus-visible:ring-ring"
            />
        );
    };

    const MeasurementDetailsTable = ({ details, totals, onDetailChange, onDeleteBde }) => {
        return (
            <div className="border rounded-lg p-1 overflow-x-auto">
                <Table className="min-w-full text-xs">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="sticky left-0 bg-background z-10 px-2 py-1">Data</TableHead>
                            <TableHead className="px-2 py-1">Dia</TableHead>
                            <TableHead className="px-2 py-1">Operador</TableHead>
                            <TableHead className="px-2 py-1">BDE Nº</TableHead>
                            <TableHead className="text-center px-2 py-1">Início</TableHead>
                            <TableHead className="text-center px-2 py-1">Intervalo</TableHead>
                            <TableHead className="text-center px-2 py-1">Término</TableHead>
                            <TableHead className="text-center px-2 py-1 w-28">H. Indisp.</TableHead>
                            <TableHead className="text-center px-2 py-1 w-28">H. Totais</TableHead>
                            <TableHead className="text-center px-2 py-1 w-28">H. Garantia</TableHead>
                            <TableHead className="text-center px-2 py-1 w-28">H. Exced.</TableHead>
                            <TableHead className="text-center px-2 py-1 w-28">Saldo</TableHead>
                            <TableHead className="text-center px-2 py-1">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {details.length > 0 ? details.map((item, index) => (
                            <TableRow key={item.bde_id || index}>
                                <TableCell className="sticky left-0 bg-background z-10 px-2 py-1 font-medium">{new Date(item.date + 'T00:00:00').toLocaleDateString()}</TableCell>
                                <TableCell className="px-2 py-1">{item.dayOfWeek}</TableCell>
                                <TableCell className="px-2 py-1 whitespace-nowrap">{item.operator_name || '-'}</TableCell>
                                <TableCell className="px-2 py-1">{item.report_number || item.bde_id}</TableCell>
                                <TableCell className="text-center px-2 py-1">{formatTime(item.start_time)}</TableCell>
                                <TableCell className="text-center px-2 py-1">{`${formatTime(item.lunch_start_time)} - ${formatTime(item.lunch_end_time)}`}</TableCell>
                                <TableCell className="text-center px-2 py-1">{formatTime(item.end_time)}</TableCell>
                                <TableCell className="p-0"><EditableCell value={item.downtime_hours} onChange={(v) => onDetailChange(item.bde_id, 'downtime_hours', v)} /></TableCell>
                                <TableCell className="p-0"><EditableCell value={item.total_hours} onChange={(v) => onDetailChange(item.bde_id, 'total_hours', v)} /></TableCell>
                                <TableCell className="p-0"><EditableCell value={item.guarantee_hours} onChange={(v) => onDetailChange(item.bde_id, 'guarantee_hours', v)} /></TableCell>
                                <TableCell className="p-0"><EditableCell value={item.overtime_hours} onChange={(v) => onDetailChange(item.bde_id, 'overtime_hours', v)} /></TableCell>
                                <TableCell className="p-0"><EditableCell value={item.balance_hours} onChange={(v) => onDetailChange(item.bde_id, 'balance_hours', v)} /></TableCell>
                                <TableCell className="text-center p-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-red-500 hover:text-red-600"
                                        onClick={() => onDeleteBde(item.bde_id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan="13" className="text-center text-muted-foreground py-4">Nenhum BDE processado ainda.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                    <TableFooter>
                         <TableRow className="font-bold bg-muted">
                            <TableCell colSpan="7" className="text-right px-2 py-1">Totais:</TableCell>
                            <TableCell className="text-center px-2 py-1">{formatHoursForDisplay(totals.total_downtime_hours)}</TableCell>
                            <TableCell className="text-center px-2 py-1">{formatHoursForDisplay(totals.total_total_hours)}</TableCell>
                            <TableCell className="text-center px-2 py-1">{formatHoursForDisplay(totals.total_guarantee_hours)}</TableCell>
                            <TableCell className="text-center px-2 py-1">{formatHoursForDisplay(totals.total_overtime_hours)}</TableCell>
                            <TableCell className="text-center px-2 py-1">{formatHoursForDisplay(totals.total_balance_hours)}</TableCell>
                            <TableCell className="px-2 py-1"></TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </div>
        );
    };

    export default MeasurementDetailsTable;