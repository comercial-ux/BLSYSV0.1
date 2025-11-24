import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarPlus as CalendarIcon, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DailyReportFilters = ({ filters, setFilters, clients, onClearFilters }) => {
    const [date, setDate] = useState({ from: filters.dateRange.from, to: filters.dateRange.to });

    const handleDateChange = (newDate) => {
        setDate(newDate);
        if (newDate?.from && newDate?.to) {
            setFilters(prev => ({ ...prev, dateRange: newDate, quickRange: null }));
        }
    };

    const handleQuickRangeChange = (value) => {
        setFilters(prev => ({ ...prev, quickRange: value, dateRange: { from: undefined, to: undefined } }));
        setDate({ from: undefined, to: undefined });
    };

    return (
        <div className="flex flex-col gap-4 p-4 mb-4 bg-muted/50 rounded-lg border">
            <div className="flex flex-wrap items-end gap-4">
                <Filter className="w-5 h-5 text-primary self-center" />
                <div className="flex-grow min-w-[200px]">
                    <Label>Cliente</Label>
                    <Select value={filters.client} onValueChange={(value) => setFilters(prev => ({ ...prev, client: value }))}>
                        <SelectTrigger><SelectValue placeholder="Filtrar por cliente..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os Clientes</SelectItem>
                            {clients.map(client => (
                                <SelectItem key={client.id} value={client.id.toString()}>{client.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex-grow min-w-[150px]">
                    <Label>Status</Label>
                    <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                        <SelectTrigger><SelectValue placeholder="Filtrar por status..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os Status</SelectItem>
                            <SelectItem value="approved">Aprovado</SelectItem>
                            <SelectItem value="pending">Pendente</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex-grow min-w-[150px]">
                    <Label>Período Rápido</Label>
                    <Select value={filters.quickRange || ''} onValueChange={handleQuickRangeChange}>
                        <SelectTrigger><SelectValue placeholder="Filtrar por período..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">Últimos 7 dias</SelectItem>
                            <SelectItem value="30">Últimos 30 dias</SelectItem>
                            <SelectItem value="90">Últimos 90 dias</SelectItem>
                            <SelectItem value="all">Ver Todos</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex-grow min-w-[250px]">
                    <Label>Período Personalizado</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className="w-full justify-start text-left font-normal"
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date?.from ? (
                                    date.to ? (
                                        `${format(date.from, "dd/MM/y", { locale: ptBR })} - ${format(date.to, "dd/MM/y", { locale: ptBR })}`
                                    ) : (
                                        format(date.from, "dd/MM/y", { locale: ptBR })
                                    )
                                ) : (
                                    <span>Selecione um intervalo</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={handleDateChange}
                                numberOfMonths={2}
                                locale={ptBR}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
                <Button variant="ghost" onClick={onClearFilters} className="self-end">
                    <X className="w-4 h-4 mr-2" />
                    Limpar
                </Button>
            </div>
        </div>
    );
};

export default DailyReportFilters;