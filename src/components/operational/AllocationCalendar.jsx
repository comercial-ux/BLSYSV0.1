import React, { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, isSameDay, startOfDay, isBefore, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DayContent, useDayRender } from 'react-day-picker';

const AllocationCalendar = ({ jobs }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [hoveredDate, setHoveredDate] = useState(null);

  const jobsByDate = useMemo(() => {
    const map = new Map();
    (jobs || []).forEach(job => {
      if (job.start_date && job.end_date) {
        let currentDate = new Date(job.start_date + 'T00:00:00');
        const endDate = new Date(job.end_date + 'T00:00:00');
        while (currentDate <= endDate) {
          const dateStr = format(currentDate, 'yyyy-MM-dd');
          if (!map.has(dateStr)) {
            map.set(dateStr, []);
          }
          map.get(dateStr).push(job);
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    });
    return map;
  }, [jobs]);

  const handleDayClick = (day) => {
    setSelectedDate(day);
  };

  const selectedDateJobs = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return jobsByDate.get(dateStr) || [];
  }, [selectedDate, jobsByDate]);

  const hoveredDateJobs = useMemo(() => {
    if (!hoveredDate) return [];
    const dateStr = format(hoveredDate, 'yyyy-MM-dd');
    return jobsByDate.get(dateStr) || [];
  }, [hoveredDate, jobsByDate]);

  const today = startOfDay(new Date());

  const modifiers = useMemo(() => {
    const past = [];
    const present = [];
    const future = [];

    jobsByDate.forEach((_, dateStr) => {
      const date = new Date(dateStr + 'T00:00:00');
      if (isBefore(date, today)) {
        past.push(date);
      } else if (isSameDay(date, today)) {
        present.push(date);
      } else if (isAfter(date, today)) {
        future.push(date);
      }
    });

    return { past, present, future };
  }, [jobsByDate, today]);

  const modifiersStyles = {
    past: { backgroundColor: 'rgba(239, 68, 68, 0.3)', color: '#fecaca' },
    present: { backgroundColor: 'rgba(59, 130, 246, 0.5)', color: '#dbeafe', fontWeight: 'bold' },
    future: { backgroundColor: 'rgba(34, 197, 94, 0.3)', color: '#dcfce7' },
    selected: { backgroundColor: '#a78bfa', color: 'white' },
  };

  const CustomDay = (props) => {
    const buttonRef = React.useRef(null);
    const dayRender = useDayRender(props.date, props.displayMonth, buttonRef);
    const isHovered = hoveredDate && isSameDay(props.date, hoveredDate);

    if (dayRender.isHidden) {
      return <></>;
    }

    return (
      <Popover open={isHovered && hoveredDateJobs.length > 0} onOpenChange={() => {}}>
        <PopoverTrigger asChild>
          <button
            {...dayRender.buttonProps}
            ref={buttonRef}
            onMouseEnter={() => setHoveredDate(props.date)}
            onMouseLeave={() => setHoveredDate(null)}
            className={cn(
              dayRender.buttonProps.className,
              "relative",
              dayRender.isToday && "border-2 border-primary"
            )}
          >
            {format(props.date, 'd')}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 bg-background border-border text-foreground p-2" side="right" align="start">
          <div className="text-sm font-semibold mb-2">
            Jobs em {format(props.date, 'dd/MM/yyyy')}
          </div>
          <ul className="space-y-1 text-xs">
            {hoveredDateJobs.map(job => (
              <li key={job.id} className="truncate">
                <span className="font-bold">{job.job_code}</span> - {job.proposal?.contacts?.name}
              </li>
            ))}
          </ul>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <Card className="bg-card/80 border-border mt-4">
      <CardHeader>
        <CardTitle>Calendário de Alocação por Job</CardTitle>
        <CardDescription>Visualize os jobs agendados. Clique em uma data para ver os detalhes.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row gap-6">
        <div className="flex-shrink-0">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDayClick}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            className="p-0 rounded-md border"
            locale={ptBR}
            components={{ Day: CustomDay }}
          />
        </div>
        <div className="flex-grow min-w-0">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>
                {selectedDate ? `Jobs em ${format(selectedDate, 'dd/MM/yyyy')}` : 'Selecione uma data'}
              </CardTitle>
              <CardDescription>
                {selectedDate ? 'Detalhes dos jobs para a data selecionada.' : 'Clique em uma data no calendário para ver os jobs.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                {selectedDateJobs.length > 0 ? (
                  <ul className="space-y-4">
                    {selectedDateJobs.map(job => (
                      <li key={job.id} className="p-3 bg-muted/50 rounded-lg">
                        <p className="font-bold text-primary">{job.job_code} - {job.proposal?.contacts?.name}</p>
                        <p className="text-sm text-muted-foreground">{job.job_site_details?.address}</p>
                        <p className="text-xs mt-1">
                          <span className="font-semibold">Equipamento:</span> {job.equipment?.name || 'Não definido'}
                        </p>
                        <p className="text-xs">
                          <span className="font-semibold">Operador:</span> {job.operator?.name || 'Não definido'}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>{selectedDate ? 'Nenhum job para esta data.' : 'Aguardando seleção...'}</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

export default AllocationCalendar;