
import React, { useState, useMemo, useRef, useEffect } from 'react';
    import { Helmet } from 'react-helmet';
    import { useLocation } from 'react-router-dom';
    import { motion } from 'framer-motion';
    import { useReactToPrint } from 'react-to-print';
    import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
    import { FileText, Printer, FileCheck, Droplets, Download, CalendarPlus as CalendarIcon, BarChart3 } from 'lucide-react';
    import { format, parseISO } from 'date-fns';
    import { ptBR } from 'date-fns/locale';
    import ChecklistPrintable from '@/components/reports/ChecklistPrintable';
    import HeadToToeReport from '@/components/reports/HeadToToeReport';
    import { Combobox } from '@/components/ui/combobox';
    import { useData } from '@/contexts/DataContext';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import { Switch } from '@/components/ui/switch';
    import Papa from 'papaparse';
    import { saveAs } from 'file-saver';
    import { formatCurrency, cn } from '@/lib/utils';
    import { Checkbox } from '@/components/ui/checkbox';
    import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
    import { Calendar } from '@/components/ui/calendar';

    const DatePicker = ({ value, onChange, placeholder }) => {
      const [date, setDate] = useState(value ? parseISO(value) : null);

      const handleSelect = (selectedDate) => {
        setDate(selectedDate);
        onChange(selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '');
      };

      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[280px] justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP", { locale: ptBR }) : <span>{placeholder}</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleSelect}
              initialFocus
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      );
    };

    const ReportsPage = () => {
      const location = useLocation();
      const { user, role } = useAuth();
      const { equipments = [], maintenances = [], operationalData, inventory = [], inventoryMovements = [], commercialData } = useData();
      const { checklists = [], fuelEntries = [] } = operationalData || {};
      const { proposals = [], contacts = [] } = commercialData || {};

      const [activeTab, setActiveTab] = useState(location.state?.defaultTab || 'fuel');
      const [maintenanceFilters, setMaintenanceFilters] = useState({
        equipmentId: 'all', startDate: '', endDate: '', type: 'all'
      });
      const [checklistEquipmentId, setChecklistEquipmentId] = useState('none');
      const [selectedChecklist, setSelectedChecklist] = useState(null);
      const [includeChecklistPhotos, setIncludeChecklistPhotos] = useState(true);
      const [inventoryFilters, setInventoryFilters] = useState({
        partId: 'all', startDate: '', endDate: ''
      });
      const [fuelFilters, setFuelFilters] = useState({
        equipmentId: 'all', startDate: '', endDate: ''
      });
      const [includeFuelPhotos, setIncludeFuelPhotos] = useState(true);
      
      const componentToPrintRef = useRef();

      const handlePrint = useReactToPrint({
        content: () => componentToPrintRef.current,
        onAfterPrint: () => setSelectedChecklist(null),
      });

      useEffect(() => {
        if (selectedChecklist && componentToPrintRef.current) {
          handlePrint();
        }
      }, [selectedChecklist, handlePrint]);

      const triggerPrint = (checklist) => {
        const equipmentForChecklist = equipments.find(e => e.id === checklist.equipment_id);
        setSelectedChecklist({ ...checklist, equipment: equipmentForChecklist, includePhotos: includeChecklistPhotos });
      };
      
      const filteredMaintenances = useMemo(() => (maintenances || []).filter(m => 
        (maintenanceFilters.equipmentId === 'all' || String(m.equipment_id) === maintenanceFilters.equipmentId) &&
        (maintenanceFilters.type === 'all' || m.type === maintenanceFilters.type) &&
        (!maintenanceFilters.startDate || new Date(m.created_at) >= new Date(maintenanceFilters.startDate)) &&
        (!maintenanceFilters.endDate || new Date(m.created_at) <= new Date(maintenanceFilters.endDate))
      ), [maintenances, maintenanceFilters]);

      const filteredChecklists = useMemo(() => {
        if (!checklists || !checklistEquipmentId || checklistEquipmentId === 'none') return [];
        
        return checklists
          .filter(c => String(c.equipment_id) === checklistEquipmentId)
          .sort((a, b) => new Date(b.evaluation_date) - new Date(a.evaluation_date));
      }, [checklists, checklistEquipmentId]);

      const filteredInventoryMovements = useMemo(() => (inventoryMovements || []).filter(m =>
        (inventoryFilters.partId === 'all' || String(m.part_id) === inventoryFilters.partId) &&
        (!inventoryFilters.startDate || new Date(m.created_at) >= new Date(m.created_at)) &&
        (!inventoryFilters.endDate || new Date(m.created_at) <= new Date(m.created_at))
      ).sort((a, b) => new Date(a.created_at) - new Date(b.created_at)), [inventoryMovements, inventoryFilters]);

      const filteredFuelData = useMemo(() => {
        if (!fuelEntries || !equipments) return [];
        let entries = fuelEntries.filter(e => 
          (fuelFilters.equipmentId === 'all' || String(e.equipment_id) === fuelFilters.equipmentId) &&
          (!fuelFilters.startDate || parseISO(e.entry_date + 'T00:00:00') >= parseISO(fuelFilters.startDate + 'T00:00:00')) &&
          (!fuelFilters.endDate || parseISO(e.entry_date + 'T00:00:00') <= parseISO(fuelFilters.endDate + 'T23:59:59'))
        );
        entries.sort((a, b) => new Date(a.entry_date) - new Date(b.entry_date));
      
        const dataByEquipment = entries.reduce((acc, entry) => {
          const eqId = entry.equipment_id;
          const equipmentInfo = equipments.find(e => e.id === eqId);
          if (!acc[eqId]) {
            acc[eqId] = {
              name: equipmentInfo?.name || 'Equipamento não encontrado',
              plate: equipmentInfo?.plate || 'N/A',
              entries: [],
              totalLiters: 0,
              totalValue: 0,
              totalKm: 0,
              totalHours: 0
            };
          }
          acc[eqId].entries.push(entry);
          acc[eqId].totalLiters += Number(entry.liters) || 0;
          acc[eqId].totalValue += Number(entry.total_value) || 0;
          return acc;
        }, {});
      
        Object.values(dataByEquipment).forEach(eqData => {
          eqData.entries.sort((a, b) => new Date(a.entry_date) - new Date(b.entry_date));
          const firstOdometer = eqData.entries.find(e => e.odometer > 0)?.odometer || 0;
          const lastOdometer = [...eqData.entries].reverse().find(e => e.odometer > 0)?.odometer || 0;
          const firstHorometer = eqData.entries.find(e => e.horometer > 0)?.horometer || 0;
          const lastHorometer = [...eqData.entries].reverse().find(e => e.horometer > 0)?.horometer || 0;

          const totalKm = lastOdometer - firstOdometer;
          const totalHours = lastHorometer - firstHorometer;
          
          eqData.kmPerLiter = totalKm > 0 && eqData.totalLiters > 0 ? (totalKm / eqData.totalLiters).toFixed(2) : 'N/A';
          eqData.litersPerHour = totalHours > 0 && eqData.totalLiters > 0 ? (eqData.totalLiters / totalHours).toFixed(2) : 'N/A';
        });
      
        return Object.values(dataByEquipment);
      }, [fuelEntries, fuelFilters, equipments]);
      
      const generateReport = (title, columns, data, formatRow) => {
        const reportWindow = window.open('', '_blank');
        if (!reportWindow) { alert("Não foi possível abrir a janela de relatório. Verifique se os pop-ups estão bloqueados."); return; }
        reportWindow.document.write(`<html><head><title>${title}</title><style>body{font-family:sans-serif; margin: 2em;} table{width:100%; border-collapse:collapse;} th,td{border:1px solid #ddd; padding:8px; text-align:left;} th{background-color:#f2f2f2;} h1{color:#333;} .entrada{color:green;} .saida{color:red;}</style></head><body><h1>${title}</h1>`);
        if (data.length > 0) {
          reportWindow.document.write('<table><thead><tr>');
          columns.forEach(col => reportWindow.document.write(`<th>${col}</th>`));
          reportWindow.document.write('</tr></thead><tbody>');
          data.forEach(item => reportWindow.document.write(formatRow(item)));
          reportWindow.document.write('</tbody></table>');
        } else {
          reportWindow.document.write('<p>Nenhum registro encontrado com os filtros aplicados.</p>');
        }
        reportWindow.document.write('</body></html>');
        reportWindow.document.close();
        reportWindow.print();
      };

      const generateMaintenanceReport = () => generateReport(
        'Relatório de Manutenções',
        ['Data', 'Equipamento', 'Tipo', 'Técnico', 'Descrição'],
        filteredMaintenances,
        m => `<tr><td>${format(new Date(m.created_at), 'dd/MM/yyyy')}</td><td>${equipments.find(e => e.id === m.equipment_id)?.name || 'N/A'}</td><td style="text-transform: capitalize;">${m.type}</td><td>${m.technician || 'N/A'}</td><td>${m.description}</td></tr>`
      );

      const generateInventoryMovementReport = () => generateReport(
        'Extrato de Almoxarifado',
        ['Data', 'Peça', 'Tipo', 'Qtd.', 'Destino/Origem', 'Obs'],
        filteredInventoryMovements,
        m => {
          const part = inventory.find(p => p.id === m.part_id);
          const isEntry = m.quantity_change > 0;
          const movementText = (m.type || 'N/A').replace(/_/g, ' ');
          let destination = '-';
          if (m.maintenance_id) {
              const maintenance = maintenances.find(main => main.id === m.maintenance_id);
              const equipment = maintenance ? equipments.find(eq => eq.id === maintenance.equipment_id) : null;
              destination = `Manutenção #${m.maintenance_id} (${equipment ? equipment.name : 'N/A'})`;
          }
          return `<tr><td>${format(new Date(m.created_at), 'dd/MM/yyyy HH:mm')}</td><td>${part?.name || 'N/A'} (${part?.part_number || 'S/C'})</td><td class="${isEntry ? 'entrada' : 'saida'}" style="text-transform:capitalize;">${movementText}</td><td class="${isEntry ? 'entrada' : 'saida'}">${m.quantity_change}</td><td>${destination}</td><td>${m.notes || ''}</td></tr>`;
        }
      );

      const generateFuelReport = () => {
        const reportWindow = window.open('', '_blank');
        if (!reportWindow) { alert("Não foi possível abrir a janela de relatório."); return; }

        reportWindow.document.write(`
            <html>
                <head>
                    <title>Relatório de Consumo de Combustível</title>
                    <style>
                        body { font-family: sans-serif; margin: 1em; }
                        table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 10px; }
                        th, td { border: 1px solid #ddd; padding: 4px; text-align: left; vertical-align: top; }
                        th { background-color: #f2f2f2; }
                        h1, h2 { color: #333; }
                        .equipment-block { page-break-inside: avoid; margin-top: 20px; border-top: 2px solid #000; padding-top: 10px; }
                        .entry-row { page-break-inside: avoid; }
                        .photo-container { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; margin-top: 5px; padding: 5px; background-color: #f9f9f9; border-radius: 4px; }
                        .photo-container img { max-width: 50%; height: auto; border: 1px solid #ccc; border-radius: 4px; }
                        .summary-p { margin: 2px 0; }
                    </style>
                </head>
                <body>
                    <h1>Relatório de Consumo de Combustível</h1>
        `);

        if (filteredFuelData.length > 0) {
            filteredFuelData.forEach(eqData => {
                reportWindow.document.write(`<div class="equipment-block"><h2>${eqData.name} (${eqData.plate})</h2>`);
                reportWindow.document.write(`<p class="summary-p"><strong>Consumo Total:</strong> ${eqData.totalLiters.toFixed(2)} L | <strong>Custo Total:</strong> ${formatCurrency(eqData.totalValue)}</p>`);
                reportWindow.document.write(`<p class="summary-p"><strong>Média:</strong> ${eqData.kmPerLiter} km/L | ${eqData.litersPerHour} L/h</p>`);
                
                reportWindow.document.write('<table><thead><tr><th>Data</th><th>KM</th><th>Horas</th><th>Litros</th><th>Valor</th><th>Motorista</th></tr></thead><tbody>');
                
                eqData.entries.forEach(entry => {
                    const driverName = entry.driver?.name || contacts.find(c => c.id === entry.driver_id)?.name || 'N/A';
                    reportWindow.document.write(`<tr class="entry-row">
                        <td>${format(parseISO(entry.entry_date + 'T00:00:00'), 'dd/MM/yyyy')}</td>
                        <td>${entry.odometer || '-'}</td>
                        <td>${entry.horometer || '-'}</td>
                        <td>${entry.liters}</td>
                        <td>${formatCurrency(entry.total_value)}</td>
                        <td>${driverName}</td>
                    </tr>`);

                    if (includeFuelPhotos) {
                        const photos = [
                            entry.plate_photo_url, 
                            entry.odometer_photo_url, 
                            entry.pump_photo_url, 
                            entry.invoice_photo_url
                        ].filter(Boolean);

                        if (photos.length > 0) {
                            reportWindow.document.write(`<tr class="entry-row"><td colspan="6">`);
                            reportWindow.document.write(`<div class="photo-container">`);
                            photos.forEach(p => reportWindow.document.write(`<div><img src="${p}" /></div>`));
                            reportWindow.document.write(`</div></td></tr>`);
                        }
                    }
                });
                
                reportWindow.document.write('</tbody></table></div>');
            });
        } else {
            reportWindow.document.write('<p>Nenhum registro encontrado com os filtros aplicados.</p>');
        }

        reportWindow.document.write('</body></html>');
        reportWindow.document.close();
        reportWindow.print();
      };

      const exportFuelDataToCSV = () => {
        let csvData = [['Equipamento', 'Placa', 'Data', 'KM', 'Horas', 'Litros', 'Valor', 'Motorista', 'Média km/L', 'Média L/h']];
        filteredFuelData.forEach(eqData => {
            eqData.entries.forEach(entry => {
                const driverName = entry.driver?.name || contacts.find(c => c.id === entry.driver_id)?.name || 'N/A';
                csvData.push([
                    eqData.name,
                    eqData.plate,
                    format(parseISO(entry.entry_date + 'T00:00:00'), 'dd/MM/yyyy'),
                    entry.odometer || '',
                    entry.horometer || '',
                    entry.liters,
                    entry.total_value,
                    driverName,
                    eqData.kmPerLiter,
                    eqData.litersPerHour,
                ]);
            });
        });
        const csv = Papa.unparse(csvData, { delimiter: ';' });
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, 'relatorio_combustivel.csv');
      };

      const equipmentOptions = useMemo(() => [{ value: 'all', label: 'Todos os Equipamentos' }, ...(equipments || []).map(e => ({ value: String(e.id), label: `${e.name} (${e.plate || 'S/ Placa'})`}))], [equipments]);
      const inventoryOptions = useMemo(() => [{ value: 'all', label: 'Todas as Peças' }, ...(inventory || []).map(p => ({ value: String(p.id), label: `${p.name} (${p.part_number || 'S/C'})`}))], [inventory]);
      const handleMaintenanceFilterChange = (key, value) => setMaintenanceFilters(prev => ({ ...prev, [key]: value }));
      const handleInventoryFilterChange = (key, value) => setInventoryFilters(prev => ({ ...prev, [key]: value }));
      const handleFuelFilterChange = (key, value) => setFuelFilters(prev => ({ ...prev, [key]: value }));

      return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Helmet>
                <title>Relatórios</title>
            </Helmet>
            <h1 className="text-3xl font-bold mb-6">Relatórios</h1>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="fuel"><Droplets className="w-4 h-4 mr-2" />Combustível</TabsTrigger>
                    <TabsTrigger value="maintenance"><FileText className="w-4 h-4 mr-2" />Manutenções</TabsTrigger>
                    <TabsTrigger value="checklist"><FileCheck className="w-4 h-4 mr-2" />Checklists</TabsTrigger>
                    <TabsTrigger value="head-to-toe"><BarChart3 className="w-4 h-4 mr-2" />Pé a Cabeça</TabsTrigger>
                </TabsList>
                <TabsContent value="maintenance">
                    <Card>
                        <CardHeader><CardTitle>Relatório de Manutenções</CardTitle><CardDescription>Filtre e gere relatórios de todas as manutenções realizadas.</CardDescription></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-4 items-end">
                                <Combobox options={equipmentOptions} value={maintenanceFilters.equipmentId} onChange={v => handleMaintenanceFilterChange('equipmentId', v)} placeholder="Filtrar por equipamento..." />
                                <Input type="date" value={maintenanceFilters.startDate} onChange={e => handleMaintenanceFilterChange('startDate', e.target.value)} />
                                <Input type="date" value={maintenanceFilters.endDate} onChange={e => handleMaintenanceFilterChange('endDate', e.target.value)} />
                                <Button onClick={generateMaintenanceReport}><Printer className="w-4 h-4 mr-2"/>Gerar Relatório</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="checklist">
                    <Card>
                        <CardHeader><CardTitle>Relatórios de Checklist</CardTitle><CardDescription>Selecione um equipamento para visualizar e imprimir seus checklists.</CardDescription></CardHeader>
                        <CardContent className="space-y-4">
                            <Combobox options={equipmentOptions.filter(o => o.value !== 'all')} value={checklistEquipmentId} onChange={setChecklistEquipmentId} placeholder="Selecione um equipamento..." />
                            <div className="flex items-center space-x-2"><Checkbox id="include-photos" checked={includeChecklistPhotos} onCheckedChange={setIncludeChecklistPhotos} /><Label htmlFor="include-photos">Incluir fotos no relatório</Label></div>
                            {filteredChecklists.map(c => (
                                <div key={c.id} className="flex justify-between items-center p-2 border rounded">
                                    <span>Checklist de {format(parseISO(c.evaluation_date), 'dd/MM/yyyy')} por {c.evaluator}</span>
                                    <Button onClick={() => triggerPrint(c)}><Printer className="w-4 h-4 mr-2"/>Imprimir</Button>
                                </div>
                            ))}
                            {checklistEquipmentId !== 'none' && filteredChecklists.length === 0 && <p className="text-center text-muted-foreground pt-4">Nenhum checklist encontrado para este equipamento.</p>}
                            <div className="hidden"><ChecklistPrintable ref={componentToPrintRef} checklist={selectedChecklist} equipment={selectedChecklist?.equipment} /></div>
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="fuel">
                    <Card>
                        <CardHeader><CardTitle>Relatório de Consumo de Combustível</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                             <div className="flex flex-wrap gap-4 items-end">
                                <div className="flex flex-col gap-2">
                                  <Label>Equipamento</Label>
                                  <Combobox options={equipmentOptions} value={fuelFilters.equipmentId} onChange={v => handleFuelFilterChange('equipmentId', v)} placeholder="Filtrar por equipamento..." />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Label>Data Inicial</Label>
                                  <DatePicker value={fuelFilters.startDate} onChange={v => handleFuelFilterChange('startDate', v)} placeholder="Selecione a data inicial" />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Label>Data Final</Label>
                                  <DatePicker value={fuelFilters.endDate} onChange={v => handleFuelFilterChange('endDate', v)} placeholder="Selecione a data final" />
                                </div>
                                <div className="flex items-center space-x-2 pt-6">
                                    <Checkbox id="include-fuel-photos" checked={includeFuelPhotos} onCheckedChange={setIncludeFuelPhotos} />
                                    <Label htmlFor="include-fuel-photos">Incluir fotos no relatório</Label>
                                </div>
                                <Button onClick={generateFuelReport}><Printer className="w-4 h-4 mr-2"/>Gerar PDF</Button>
                                <Button onClick={exportFuelDataToCSV} variant="outline"><Download className="w-4 h-4 mr-2" />Exportar CSV</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="head-to-toe">
                   <HeadToToeReport />
                </TabsContent>
            </Tabs>
        </motion.div>
      );
    };
    export default ReportsPage;
