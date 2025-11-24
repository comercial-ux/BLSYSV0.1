import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, FilterX } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DailyReportFilters = ({
  filters,
  setFilters,
  clients,
  onClearFilters,
}) => {
  const handleDateChange = (date) => {
    setFilters(prev => ({
      ...prev,
      dateRange: date,
      quickRange: null,
    }));
  };

  const handleQuickRangeChange = (value) => {
    setFilters(prev => ({
      ...prev,
      quickRange: value === 'no_quick_range' ? null : value,
      dateRange: { from: undefined, to: undefined },
    }));
  };

  return (
    <div className="flex flex-wrap items-center gap-4 mb-4 p-4 bg-muted/50 rounded-lg border">
      <div className="flex-grow min-w-[200px]">
        <label className="text-xs text-muted-foreground mb-1 block">Cliente</label>
        <Select
          value={filters.client || 'all_clients'}
          onValueChange={(value) => setFilters(prev => ({ ...prev, client: value === 'all_clients' ? '' : value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos os clientes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_clients">Todos os clientes</SelectItem>
            {clients.map(client => (
              <SelectItem key={client.id} value={client.id.toString()}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-grow min-w-[150px]">
        <label className="text-xs text-muted-foreground mb-1 block">Status</label>
        <Select
          value={filters.status || 'all_statuses'}
          onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all_statuses' ? '' : value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_statuses">Todos os status</SelectItem>
            <SelectItem value="approved">Aprovado</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-grow min-w-[150px]">
        <label className="text-xs text-muted-foreground mb-1 block">Período Rápido</label>
        <Select
          value={filters.quickRange || 'no_quick_range'}
          onValueChange={handleQuickRangeChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Período..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no_quick_range">Nenhum</SelectItem>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-grow min-w-[280px]">
        <label className="text-xs text-muted-foreground mb-1 block">Período Personalizado</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateRange?.from ? (
                filters.dateRange.to ? (
                  <>
                    {format(filters.dateRange.from, 'dd/MM/y', { locale: ptBR })} - {format(filters.dateRange.to, 'dd/MM/y', { locale: ptBR })}
                  </>
                ) : (
                  format(filters.dateRange.from, 'dd/MM/y', { locale: ptBR })
                )
              ) : (
                <span>Escolha as datas</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={filters.dateRange}
              onSelect={handleDateChange}
              initialFocus
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="self-end">
        <Button variant="ghost" onClick={onClearFilters} className="h-10">
          <FilterX className="mr-2 h-4 w-4" />
          Limpar Filtros
        </Button>
      </div>
    </div>
  );
};

export default DailyReportFilters;