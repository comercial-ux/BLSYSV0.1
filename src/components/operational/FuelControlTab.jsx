import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { PlusCircle, Camera, Car, Truck, HelpCircle, Droplets, DollarSign, ArrowUpDown } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { format, startOfWeek, endOfWeek, isWithinInterval, subDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Combobox } from '@/components/ui/combobox';
import { cn, formatCurrency } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const FuelPhotoViewer = ({ entry, isOpen, onOpenChange }) => {
  const photos = [
    { label: 'Placa', url: entry?.plate_photo_url },
    { label: 'Odômetro/Horímetro', url: entry?.odometer_photo_url },
    { label: 'Bomba', url: entry?.pump_photo_url },
    { label: 'Cupom Fiscal', url: entry?.invoice_photo_url },
  ].filter(p => p.url);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-slate-800 border-white/20 text-white">
        <DialogHeader>
          <DialogTitle>Fotos do Abastecimento</DialogTitle>
          <DialogDescription>
            Equipamento: {entry?.equipment?.name || 'N/A'} | Data: {entry?.entry_date ? new Date(entry.entry_date + 'T00:00:00').toLocaleDateString() : 'N/A'}
          </DialogDescription>
        </DialogHeader>
        {photos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto p-4">
            {photos.map((photo) => (
              <div key={photo.label} className="border border-white/20 rounded-lg p-2">
                <p className="font-semibold mb-2">{photo.label}</p>
                <a href={photo.url} target="_blank" rel="noopener noreferrer">
                  <img src={photo.url} alt={photo.label} className="rounded-md w-full h-auto object-contain cursor-pointer" />
                </a>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center p-8 text-gray-400">Nenhuma foto registrada para este abastecimento.</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const FuelControlTab = ({ fuelEntries, equipments, contacts, onNewEntry }) => {
  const navigate = useNavigate();
  
  const getInitialDates = () => {
    const endDate = new Date();
    const startDate = subDays(endDate, 30);
    return {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
    };
  };

  const [filters, setFilters] = useState({
    vehicleId: 'all',
    driverId: 'all',
    equipmentType: 'all',
    ...getInitialDates(),
  });
  const [viewingPhotosEntry, setViewingPhotosEntry] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'entry_date', direction: 'descending' });

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  }

  const setDateRange = (days) => {
    if (days === null) {
      setFilters(prev => ({
        ...prev,
        startDate: '',
        endDate: '',
      }));
    } else {
      const endDate = new Date();
      const startDate = subDays(endDate, days);
      setFilters(prev => ({
        ...prev,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
      }));
    }
  };

  const processedEntries = useMemo(() => {
    if (!fuelEntries || !equipments) return [];

    const initialSortedEntries = [...fuelEntries].sort((a, b) => {
      if (a.equipment_id !== b.equipment_id) {
        return a.equipment_id - b.equipment_id;
      }
      const dateA = new Date(a.entry_date + 'T00:00:00');
      const dateB = new Date(b.entry_date + 'T00:00:00');
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA - dateB;
      }
      return (a.odometer || a.horometer || 0) - (b.odometer || b.horometer || 0);
    });

    const entriesWithConsumption = initialSortedEntries.map((entry, index) => {
      let consumption = null;
      const prevEntry = initialSortedEntries.slice(0, index).reverse().find(e => e.equipment_id === entry.equipment_id);

      if (prevEntry) {
        if (entry.odometer && prevEntry.odometer) {
          const kmDiff = entry.odometer - prevEntry.odometer;
          if (kmDiff > 0 && entry.liters > 0) {
            consumption = (kmDiff / entry.liters).toFixed(2) + ' km/L';
          }
        }
      }
      return { ...entry, consumption };
    });

    const weeklyKmMap = new Map();
    const today = new Date();
    const startOfThisWeek = startOfWeek(today, { weekStartsOn: 0 });
    const endOfThisWeek = endOfWeek(today, { weekStartsOn: 0 });

    equipments.forEach(eq => {
      const vehicleEntries = initialSortedEntries.filter(e => 
        e.equipment_id === eq.id && 
        isWithinInterval(new Date(e.entry_date + 'T00:00:00'), { start: startOfThisWeek, end: endOfThisWeek }) &&
        e.odometer
      );
      
      if (vehicleEntries.length > 1) {
        const minOdometer = Math.min(...vehicleEntries.map(e => e.odometer));
        const maxOdometer = Math.max(...vehicleEntries.map(e => e.odometer));
        weeklyKmMap.set(eq.id, maxOdometer - minOdometer);
      } else {
        weeklyKmMap.set(eq.id, 0);
      }
    });

    return entriesWithConsumption.map(entry => ({
      ...entry,
      weeklyKm: weeklyKmMap.get(entry.equipment_id) || 0,
    }));

  }, [fuelEntries, equipments]);

  const filteredEntries = useMemo(() => {
    return processedEntries.filter(entry => {
      const entryDate = new Date(entry.entry_date + 'T00:00:00');
      const startDate = filters.startDate ? new Date(filters.startDate + 'T00:00:00') : null;
      const endDate = filters.endDate ? new Date(filters.endDate + 'T23:59:59') : null;

      if (startDate && entryDate < startDate) return false;
      if (endDate && entryDate > endDate) return false;
      if (filters.driverId !== 'all' && String(entry.driver_id) !== filters.driverId) return false;
      if (filters.vehicleId !== 'all' && String(entry.equipment_id) !== filters.vehicleId) return false;
      if (filters.equipmentType !== 'all' && entry.equipment?.equipment_type !== filters.equipmentType) return false;
      
      return true;
    });
  }, [processedEntries, filters]);

  const sortedAndFilteredEntries = useMemo(() => {
    let sortableItems = [...filteredEntries];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue, bValue;

        switch (sortConfig.key) {
          case 'equipment_name':
            aValue = a.equipment?.name || '';
            bValue = b.equipment?.name || '';
            break;
          case 'driver_name':
            aValue = a.driver?.name || '';
            bValue = b.driver?.name || '';
            break;
          case 'entry_date':
            aValue = parseISO(a.entry_date);
            bValue = parseISO(b.entry_date);
            break;
          default:
            aValue = a[sortConfig.key];
            bValue = b[sortConfig.key];
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredEntries, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    } else if (sortConfig.key === key && sortConfig.direction === 'descending') {
      direction = 'ascending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    }
    return sortConfig.direction === 'ascending' ? '🔼' : '🔽';
  };

  const totals = useMemo(() => {
    return filteredEntries.reduce((acc, entry) => {
      acc.liters += Number(entry.liters) || 0;
      acc.value += Number(entry.total_value) || 0;
      return acc;
    }, { liters: 0, value: 0 });
  }, [filteredEntries]);

  const vehicleOptions = useMemo(() => {
    if (!equipments) return [];
    const sorted = [...equipments].sort((a, b) => a.name.localeCompare(b.name));
    return [{ value: 'all', label: 'Todos' }, ...sorted.map(v => ({ value: v.id.toString(), label: `${v.name} (${v.plate || 'S/ Placa'})` }))];
  }, [equipments]);

  const driverOptions = useMemo(() => {
    if (!contacts) return [];
    const collaborators = contacts.filter(c => c.type === 'Colaborador' && c.status === 'Ativo').sort((a, b) => a.name.localeCompare(b.name));
    return [{ value: 'all', label: 'Todos' }, ...collaborators.map(c => ({ value: c.id.toString(), label: c.name }))];
  }, [contacts]);

  const equipmentTypeOptions = useMemo(() => {
    if (!equipments) return [];
    const types = [...new Set(equipments.map(e => e.equipment_type).filter(Boolean))];
    return [{ value: 'all', label: 'Todos os Tipos' }, ...types.map(t => ({ value: t, label: t }))];
  }, [equipments]);

  const getEquipmentTypeInfo = (type) => {
    const lowerType = type?.toLowerCase() || '';
    if (lowerType.includes('guindaste') || lowerType.includes('caminhão')) {
      return { icon: <Truck className="w-5 h-5 text-blue-400" />, rowClass: 'bg-blue-900/10 hover:bg-blue-900/20' };
    }
    if (lowerType.includes('passeio') || lowerType.includes('carro')) {
      return { icon: <Car className="w-5 h-5 text-green-400" />, rowClass: 'bg-green-900/10 hover:bg-green-900/20' };
    }
    return { icon: <HelpCircle className="w-5 h-5 text-gray-400" />, rowClass: '' };
  };

  return (
    <>
      <Card className="bg-card/80 border-border mt-4">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Controle de Combustível</CardTitle>
              <CardDescription>Registre e monitore os abastecimentos de veículos e equipamentos.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => navigate('/reports', { state: { defaultTab: 'fuel' } })}>Relatórios</Button>
              <Button onClick={onNewEntry}><PlusCircle className="mr-2 h-4 w-4"/> Novo Abastecimento</Button>
            </div>
          </div>
          <div className="mt-4 p-4 border rounded-lg bg-background/50 flex gap-4">
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
              <div className="w-full">
                <Label htmlFor="vehicleId">Veículo/Equip.</Label>
                <Combobox
                  options={vehicleOptions}
                  value={filters.vehicleId}
                  onChange={(value) => handleFilterChange('vehicleId', value)}
                  placeholder="Selecione o veículo"
                  searchPlaceholder="Pesquisar veículo..."
                  emptyText="Nenhum veículo encontrado."
                />
              </div>
              <div className="w-full">
                <Label htmlFor="driverId">Motorista</Label>
                <Combobox
                  options={driverOptions}
                  value={filters.driverId}
                  onChange={(value) => handleFilterChange('driverId', value)}
                  placeholder="Selecione o motorista"
                  searchPlaceholder="Pesquisar motorista..."
                  emptyText="Nenhum motorista encontrado."
                />
              </div>
              <div className="w-full">
                <Label htmlFor="equipmentType">Tipo de Equipamento</Label>
                <Select value={filters.equipmentType} onValueChange={(value) => handleFilterChange('equipmentType', value)}>
                  <SelectTrigger className="bg-white/10 border-white/20">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipmentTypeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2 lg:col-span-3">
                <Label>Período</Label>
                <div className="flex gap-2 items-center">
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => setDateRange(7)}>7 dias</Button>
                    <Button variant="outline" size="sm" onClick={() => setDateRange(30)}>30 dias</Button>
                    <Button variant="outline" size="sm" onClick={() => setDateRange(90)}>90 dias</Button>
                    <Button variant="outline" size="sm" onClick={() => setDateRange(null)}>Sempre</Button>
                  </div>
                  <div className="flex gap-2 items-center flex-grow">
                    <Input type="date" name="startDate" value={filters.startDate} onChange={handleDateChange} className="h-9 bg-white/10"/>
                    <span className="text-muted-foreground">-</span>
                    <Input type="date" name="endDate" value={filters.endDate} onChange={handleDateChange} className="h-9 bg-white/10"/>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 w-[280px] space-y-4">
              <Label>Totais do Período</Label>
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-background/70">
                  <CardHeader className="flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Litros</CardTitle>
                    <Droplets className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totals.liters.toFixed(2)} L</div>
                  </CardContent>
                </Card>
                <Card className="bg-background/70">
                  <CardHeader className="flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(totals.value)}</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[55vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('entry_date')}>
                      Data
                      {getSortIndicator('entry_date')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('equipment_name')}>
                      Veículo/Equip.
                      {getSortIndicator('equipment_name')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('driver_name')}>
                      Motorista
                      {getSortIndicator('driver_name')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('liters')}>
                      Litros
                      {getSortIndicator('liters')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('total_value')}>
                      Valor
                      {getSortIndicator('total_value')}
                    </Button>
                  </TableHead>
                  <TableHead>Odômetro/Horímetro</TableHead>
                  <TableHead>Consumo Médio</TableHead>
                  <TableHead>KM Semana</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAndFilteredEntries.length > 0 ? sortedAndFilteredEntries.map(entry => {
                  const typeInfo = getEquipmentTypeInfo(entry.equipment?.equipment_type);
                  return (
                    <TableRow key={entry.id} className={cn(typeInfo.rowClass)}>
                      <TableCell className="text-center">{typeInfo.icon}</TableCell>
                      <TableCell>{format(new Date(entry.entry_date + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                      <TableCell>{entry.equipment?.name || 'N/A'}</TableCell>
                      <TableCell>{entry.driver?.name || 'N/A'}</TableCell>
                      <TableCell>{entry.liters} L</TableCell>
                      <TableCell>R$ {entry.total_value}</TableCell>
                      <TableCell>{entry.odometer ? `${entry.odometer} km` : ''} {entry.horometer ? `${entry.horometer} h` : ''}</TableCell>
                      <TableCell>{entry.consumption || '---'}</TableCell>
                      <TableCell>{entry.weeklyKm > 0 ? `${entry.weeklyKm} km` : '---'}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => setViewingPhotosEntry(entry)}>
                          <Camera className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow>
                    <TableCell colSpan="10" className="text-center h-24">Nenhum abastecimento encontrado para os filtros selecionados.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
      {viewingPhotosEntry && (
        <FuelPhotoViewer
          entry={viewingPhotosEntry}
          isOpen={!!viewingPhotosEntry}
          onOpenChange={() => setViewingPhotosEntry(null)}
        />
      )}
    </>
  );
};

export default FuelControlTab;