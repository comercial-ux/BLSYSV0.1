
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { format, subDays, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, FileText, Briefcase, FileBarChart2, DollarSign, ChevronDown, ChevronRight, Image as ImageIcon, CheckCircle, XCircle, Clock, Filter } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { formatCurrency, cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const HeadToToeReport = () => {
    const { commercialData, operationalData, financialData } = useData();
    
    // Default filters: Last 30 days
    const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilters, setStatusFilters] = useState([]);

    // Status Options for Filtering
    const statusOptions = [
        { id: 'approved', label: 'Aprovada (Ganho)' },
        { id: 'sent', label: 'Enviada' },
        { id: 'rejected', label: 'Rejeitada (Perdido)' },
        { id: 'draft', label: 'Rascunho' }
    ];

    const handleStatusToggle = (statusId) => {
        setStatusFilters(prev => 
            prev.includes(statusId) 
                ? prev.filter(id => id !== statusId)
                : [...prev, statusId]
        );
    };

    // Data Sources
    const proposals = commercialData?.proposals || [];
    const jobs = operationalData?.jobs || [];
    const dailyReports = operationalData?.dailyReports || []; // BDEs
    const measurements = commercialData?.measurements || [];
    const accountsReceivable = financialData?.accountsReceivable || [];

    // 1. Process Data Hierarchy
    const processedData = useMemo(() => {
        if (!startDate || !endDate) return [];

        const start = startOfDay(parseISO(startDate));
        const end = endOfDay(parseISO(endDate));

        // Filter Proposals
        const filteredProposals = proposals.filter(p => {
            // Date Filter
            if (!p.proposal_date) return false;
            const pDate = parseISO(p.proposal_date);
            return isWithinInterval(pDate, { start, end });
        }).filter(p => {
            // Status Filter
            if (statusFilters.length === 0) return true;
            
            let category = 'draft';
            if (['approved', 'finished', 'autorizada'].includes(p.status)) category = 'approved';
            else if (p.status === 'rejected') category = 'rejected';
            else if (p.status === 'sent') category = 'sent';
            
            return statusFilters.includes(category);
        }).filter(p => {
            // Search Filter
            if (!searchTerm) return true;
            const searchLower = searchTerm.toLowerCase();
            return (
                p.proposal_number?.toLowerCase().includes(searchLower) ||
                p.contacts?.name?.toLowerCase().includes(searchLower) ||
                p.id.toString().includes(searchLower)
            );
        });

        // Enrich Proposals with Children
        return filteredProposals.map(proposal => {
            // 1. Find Jobs
            const proposalJobs = jobs.filter(j => j.proposal_id === proposal.id);

            // 2. Find Measurements for this Proposal (can be via Job or Proposal ID directly)
            const proposalMeasurements = measurements.filter(m => m.proposal_id === proposal.id);

            // 3. Build Job Details
            const enrichedJobs = proposalJobs.map(job => {
                // BDEs for this Job
                const jobBDEs = dailyReports.filter(bde => bde.job_id === job.id);
                
                // Determine BDE Status
                const enrichedBDEs = jobBDEs.map(bde => {
                    // Check if this BDE is in any measurement
                    const foundMeasurement = proposalMeasurements.find(m => {
                        const details = m.measurement_details?.details || [];
                        return details.some(d => d.bde_id === bde.id);
                    });

                    let status = 'Não Medido';
                    let statusColor = 'bg-gray-100 text-gray-600';
                    
                    if (foundMeasurement) {
                        if (foundMeasurement.status === 'approved') {
                            status = 'Faturado';
                            statusColor = 'bg-green-100 text-green-700';
                        } else {
                            status = 'Medido';
                            statusColor = 'bg-blue-100 text-blue-700';
                        }
                    }

                    return {
                        ...bde,
                        status,
                        statusColor,
                        measurementId: foundMeasurement?.id
                    };
                });

                return {
                    ...job,
                    bdes: enrichedBDEs,
                };
            });

            // 4. Financials (Receivables linked to this Proposal)
            const financials = accountsReceivable.filter(ar => ar.proposal_id === proposal.id);

            // 5. Aggregated Measurements Info for display
            const measurementsSummary = proposalMeasurements.map(m => {
                return {
                    id: m.id,
                    period: `${format(parseISO(m.start_date), 'dd/MM')} a ${format(parseISO(m.end_date), 'dd/MM')}`,
                    value: m.total_value,
                    status: m.status
                };
            });

            return {
                ...proposal,
                jobs: enrichedJobs,
                measurements: measurementsSummary,
                financials: financials,
                metrics: {
                    totalJobs: proposalJobs.length,
                    totalBDEs: enrichedJobs.reduce((acc, j) => acc + j.bdes.length, 0),
                    totalBilled: financials.reduce((acc, f) => acc + (f.net_value || 0), 0)
                }
            };
        });

    }, [proposals, jobs, dailyReports, measurements, accountsReceivable, startDate, endDate, searchTerm, statusFilters]);

    // 2. Calculate KPIs
    const kpis = useMemo(() => {
        const total = processedData.length;
        const accepted = processedData.filter(p => ['approved', 'finished', 'autorizada'].includes(p.status)).length;
        const conversionRate = total > 0 ? ((accepted / total) * 100).toFixed(1) : 0;

        return { total, accepted, conversionRate };
    }, [processedData]);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved': case 'finished': case 'autorizada':
                return <Badge className="bg-green-500 hover:bg-green-600">Aprovada</Badge>;
            case 'rejected':
                return <Badge variant="destructive">Rejeitada</Badge>;
            case 'sent':
                return <Badge className="bg-blue-500 hover:bg-blue-600">Enviada</Badge>;
            default:
                return <Badge variant="secondary">Rascunho</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            {/* KPI Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total de Propostas</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{kpis.total}</div><p className="text-xs text-muted-foreground">No período selecionado</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Propostas Aceitas</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-green-600">{kpis.accepted}</div><p className="text-xs text-muted-foreground">Jobs gerados</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-blue-600">{kpis.conversionRate}%</div><p className="text-xs text-muted-foreground">Sucesso comercial</p></CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Filtros e Pesquisa</CardTitle>
                    <CardDescription>Refine o relatório por data, status ou termos de busca.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row gap-4 items-end flex-wrap">
                    <div className="w-full md:w-[200px]">
                        <span className="text-sm font-medium mb-1 block">Data Inicial</span>
                        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                    <div className="w-full md:w-[200px]">
                        <span className="text-sm font-medium mb-1 block">Data Final</span>
                        <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                    <div className="w-full md:w-[220px]">
                        <span className="text-sm font-medium mb-1 block">Status</span>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-between text-left font-normal">
                                    <span className="truncate">
                                        {statusFilters.length === 0 ? "Todos os status" : `${statusFilters.length} selecionado(s)`}
                                    </span>
                                    <Filter className="ml-2 h-4 w-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-3" align="start">
                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none mb-2 text-sm text-muted-foreground">Filtrar Status</h4>
                                    {statusOptions.map(option => (
                                        <div key={option.id} className="flex items-center space-x-2">
                                            <Checkbox 
                                                id={`status-${option.id}`} 
                                                checked={statusFilters.includes(option.id)}
                                                onCheckedChange={() => handleStatusToggle(option.id)}
                                            />
                                            <Label htmlFor={`status-${option.id}`} className="text-sm cursor-pointer font-normal">
                                                {option.label}
                                            </Label>
                                        </div>
                                    ))}
                                    {statusFilters.length > 0 && (
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="w-full mt-2 h-8 text-xs"
                                            onClick={() => setStatusFilters([])}
                                        >
                                            Limpar Filtros
                                        </Button>
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="w-full md:flex-1 relative">
                        <span className="text-sm font-medium mb-1 block">Pesquisar</span>
                        <Search className="absolute left-2 top-8 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Cliente, Nº Proposta ou ID..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            className="pl-8"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Main Report */}
            <Card className="overflow-hidden">
                <CardHeader className="bg-muted/50">
                    <div className="grid grid-cols-12 gap-4 text-sm font-bold text-muted-foreground uppercase">
                        <div className="col-span-4">Proposta</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-6 text-right">Resumo (Jobs | BDEs | Faturado)</div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Accordion type="multiple" className="w-full">
                        {processedData.length > 0 ? (
                            processedData.map((proposal) => (
                                <AccordionItem value={`prop-${proposal.id}`} key={proposal.id} className="border-b">
                                    <AccordionTrigger className="px-6 py-4 hover:bg-muted/50 hover:no-underline">
                                        <div className="grid grid-cols-12 gap-4 w-full text-left items-center">
                                            <div className="col-span-4">
                                                <div className="font-bold text-base">
                                                    {proposal.proposal_number ? `Nº ${proposal.proposal_number}` : `#${proposal.id}`}
                                                </div>
                                                <div className="text-sm text-muted-foreground truncate">{proposal.contacts?.name}</div>
                                                <div className="text-xs text-muted-foreground">{format(parseISO(proposal.proposal_date), 'dd/MM/yyyy')}</div>
                                            </div>
                                            <div className="col-span-2">
                                                {getStatusBadge(proposal.status)}
                                            </div>
                                            <div className="col-span-5 flex justify-end gap-6 text-sm">
                                                <div className="flex flex-col items-center">
                                                    <span className="font-bold">{proposal.metrics.totalJobs}</span>
                                                    <span className="text-[10px] text-muted-foreground uppercase">Jobs</span>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <span className="font-bold">{proposal.metrics.totalBDEs}</span>
                                                    <span className="text-[10px] text-muted-foreground uppercase">BDEs</span>
                                                </div>
                                                <div className="flex flex-col items-end min-w-[80px]">
                                                    <span className="font-bold text-green-600">{formatCurrency(proposal.metrics.totalBilled)}</span>
                                                    <span className="text-[10px] text-muted-foreground uppercase">Faturado</span>
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 border-t">
                                        
                                        {/* LEVEL 2: JOBS */}
                                        <div className="space-y-6 pl-4 border-l-2 border-blue-200 ml-2">
                                            {proposal.jobs.length > 0 ? (
                                                proposal.jobs.map(job => (
                                                    <div key={job.id} className="space-y-3">
                                                        <div className="flex items-center gap-2">
                                                            <Briefcase className="h-4 w-4 text-blue-500" />
                                                            <h4 className="font-bold text-sm">Job #{job.job_code} - {job.status === 'completed' ? 'Concluído' : 'Em Andamento'}</h4>
                                                        </div>

                                                        {/* LEVEL 3: BDEs */}
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pl-6">
                                                            {job.bdes.map(bde => (
                                                                <div key={bde.id} className="flex items-start space-x-3 p-2 bg-background border rounded shadow-sm text-sm">
                                                                    <div className="mt-1">
                                                                        {bde.physical_copy_url ? (
                                                                             <Popover>
                                                                                <PopoverTrigger>
                                                                                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center cursor-pointer hover:bg-gray-200">
                                                                                        <img src={bde.physical_copy_url} alt="BDE" className="w-full h-full object-cover rounded" />
                                                                                    </div>
                                                                                </PopoverTrigger>
                                                                                <PopoverContent className="w-80 p-0">
                                                                                    <img src={bde.physical_copy_url} alt="Full BDE" className="w-full h-auto rounded" />
                                                                                </PopoverContent>
                                                                             </Popover>
                                                                        ) : (
                                                                            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-300">
                                                                                <ImageIcon className="w-5 h-5" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex justify-between">
                                                                            <span className="font-semibold">BDE #{bde.report_number || bde.id}</span>
                                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${bde.statusColor}`}>{bde.status}</span>
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground mt-1">
                                                                            {format(parseISO(bde.report_date), 'dd/MM')} • {bde.total_hours || 0}h
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {job.bdes.length === 0 && <p className="text-xs text-muted-foreground italic">Nenhum BDE lançado.</p>}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm text-muted-foreground">Nenhum Job criado para esta proposta.</p>
                                            )}
                                        </div>

                                        {/* LEVEL 4: BILLING / MEASUREMENTS */}
                                        {(proposal.measurements.length > 0 || proposal.financials.length > 0) && (
                                            <div className="mt-6 pt-4 border-t">
                                                <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                                                    <DollarSign className="h-4 w-4 text-green-600" />
                                                    Fluxo Financeiro
                                                </h4>
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                    {/* Measurements Side */}
                                                    <div>
                                                        <h5 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Medições Realizadas</h5>
                                                        {proposal.measurements.length > 0 ? (
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow className="h-8">
                                                                        <TableHead className="h-8 py-0">ID</TableHead>
                                                                        <TableHead className="h-8 py-0">Período</TableHead>
                                                                        <TableHead className="h-8 py-0 text-right">Valor</TableHead>
                                                                        <TableHead className="h-8 py-0">Status</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {proposal.measurements.map(m => (
                                                                        <TableRow key={m.id} className="h-8">
                                                                            <TableCell className="py-1">#{m.id}</TableCell>
                                                                            <TableCell className="py-1">{m.period}</TableCell>
                                                                            <TableCell className="py-1 text-right font-medium">{formatCurrency(m.value)}</TableCell>
                                                                            <TableCell className="py-1">
                                                                                {m.status === 'approved' ? <CheckCircle className="w-3 h-3 text-green-500" /> : <Clock className="w-3 h-3 text-yellow-500" />}
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        ) : <p className="text-xs text-muted-foreground">Nenhuma medição.</p>}
                                                    </div>

                                                    {/* Receivables Side */}
                                                    <div>
                                                        <h5 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Faturamento & Recebimento</h5>
                                                        {proposal.financials.length > 0 ? (
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow className="h-8">
                                                                        <TableHead className="h-8 py-0">Vencimento</TableHead>
                                                                        <TableHead className="h-8 py-0 text-right">Valor Liq.</TableHead>
                                                                        <TableHead className="h-8 py-0">Recebido em</TableHead>
                                                                        <TableHead className="h-8 py-0">Status</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {proposal.financials.map(f => (
                                                                        <TableRow key={f.id} className="h-8">
                                                                            <TableCell className="py-1">{f.due_date ? format(parseISO(f.due_date), 'dd/MM/yy') : '-'}</TableCell>
                                                                            <TableCell className="py-1 text-right font-medium">{formatCurrency(f.net_value)}</TableCell>
                                                                            <TableCell className="py-1">
                                                                                {f.receipt_date ? <span className="text-green-600 font-medium">{format(parseISO(f.receipt_date), 'dd/MM/yy')}</span> : '-'}
                                                                            </TableCell>
                                                                            <TableCell className="py-1 text-xs">{f.status}</TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        ) : <p className="text-xs text-muted-foreground">Nenhum registro financeiro.</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                    </AccordionContent>
                                </AccordionItem>
                            ))
                        ) : (
                            <div className="p-8 text-center text-muted-foreground">
                                Nenhuma proposta encontrada no período selecionado e com os status definidos.
                            </div>
                        )}
                    </Accordion>
                </CardContent>
            </Card>
        </div>
    );
};

export default HeadToToeReport;
