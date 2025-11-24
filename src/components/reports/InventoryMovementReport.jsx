import React, { useState, useMemo, useRef } from 'react';
import Select from 'react-select';
import { useReactToPrint } from 'react-to-print';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useData } from '@/contexts/DataContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Printer, Loader2, Search } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

const movementTypeMap = {
    'entrada_inicial': 'Entrada Inicial (Criação)',
    'ajuste_entrada': 'Ajuste de Entrada (Manual)',
    'ajuste_saida': 'Ajuste de Saída (Manual)',
    'saida_manutencao': 'Saída para Manutenção',
    'estorno_manutencao': 'Estorno de Manutenção',
    'entrada_compra': 'Entrada por Compra',
};

const ReportPrintLayout = React.forwardRef(({ movements, parts, companyDetails, dateRange }, ref) => {
    return (
        <div ref={ref} className="p-8 bg-white text-black font-sans">
            <header className="flex justify-between items-center pb-4 mb-8 border-b-2">
                <div>
                    <h1 className="text-2xl font-bold">{companyDetails?.trade_name || companyDetails?.company_name || 'Relatório'}</h1>
                    <p className="text-sm">{companyDetails?.address_street}, {companyDetails?.address_number} - {companyDetails?.address_city}</p>
                    <p className="text-sm">CNPJ: {companyDetails?.cnpj}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-3xl font-bold">Relatório de Movimentação</h2>
                    <p className="text-sm">Período: {dateRange.startDate ? format(new Date(dateRange.startDate), 'dd/MM/yyyy') : 'N/A'} a {dateRange.endDate ? format(new Date(dateRange.endDate), 'dd/MM/yyyy') : 'N/A'}</p>
                    <p className="text-sm">Gerado em: {new Date().toLocaleString('pt-BR')}</p>
                </div>
            </header>
            
            <section>
                <h3 className="text-xl font-semibold mb-2">Histórico de Movimentações</h3>
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="border-b-2 border-black">
                            <th className="text-left p-2 font-bold">Data</th>
                            <th className="text-left p-2 font-bold">Peça</th>
                            <th className="text-left p-2 font-bold">Tipo</th>
                            <th className="text-left p-2 font-bold">Qtd.</th>
                            <th className="text-left p-2 font-bold">Observações</th>
                            <th className="text-left p-2 font-bold">Usuário</th>
                        </tr>
                    </thead>
                    <tbody>
                        {movements.map(mov => {
                             const part = parts.find(p => p.id === mov.part_id);
                             return (
                                <tr key={mov.id} className="border-b">
                                    <td className="p-2">{new Date(mov.created_at).toLocaleString('pt-BR')}</td>
                                    <td className="p-2">{part?.name || 'N/A'}</td>
                                    <td className="p-2">{movementTypeMap[mov.type] || mov.type}</td>
                                    <td className="p-2">{mov.quantity_change}</td>
                                    <td className="p-2">{mov.notes || 'N/A'}</td>
                                    <td className="p-2">{mov.user_full_name || 'Sistema'}</td>
                                </tr>
                             )
                        })}
                    </tbody>
                </table>
                 {movements.length === 0 && <p className="text-center py-4">Nenhuma movimentação encontrada para esta peça.</p>}
            </section>

             <footer className="mt-12 text-center text-xs text-gray-500">
                <p>BL Soluções - Relatório Interno</p>
            </footer>
        </div>
    );
});


const InventoryMovementReport = () => {
    const { inventory, companyDetails } = useData();
    const [selectedParts, setSelectedParts] = useState([]);
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
    const [movements, setMovements] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const printRef = useRef();

    const partOptions = useMemo(() => 
        (inventory || []).map(part => ({
            value: part.id,
            label: `${part.name} (${part.part_number || 'S/N'})`
        })), [inventory]);

    const handleDateChange = (e) => {
        setDateRange(prev => ({...prev, [e.target.name]: e.target.value}));
    };
    
    const selectAllParts = () => {
        setSelectedParts(partOptions);
    };

    const handleSearch = async () => {
        if (selectedParts.length === 0) {
            toast({ variant: 'destructive', title: 'Nenhuma peça selecionada', description: 'Por favor, selecione uma ou mais peças para gerar o relatório.' });
            return;
        }
        setIsLoading(true);
        try {
            let query = supabase
                .from('inventory_movements')
                .select('*')
                .in('part_id', selectedParts.map(p => p.value))
                .order('created_at', { ascending: false });

            if (dateRange.startDate) {
                query = query.gte('created_at', `${dateRange.startDate}T00:00:00`);
            }
            if (dateRange.endDate) {
                query = query.lte('created_at', `${dateRange.endDate}T23:59:59`);
            }

            const { data: movementsData, error: movementsError } = await query;

            if (movementsError) throw movementsError;

            if (!movementsData || movementsData.length === 0) {
                setMovements([]);
                return;
            }

            const userIds = [...new Set(movementsData.map(mov => mov.user_id).filter(Boolean))];
            let usersMap = {};

            if (userIds.length > 0) {
                const { data: usersData, error: usersError } = await supabase
                    .from('users')
                    .select('id, full_name')
                    .in('id', userIds);

                if (usersError) throw usersError;
                
                usersMap = usersData.reduce((acc, user) => {
                    acc[user.id] = user.full_name;
                    return acc;
                }, {});
            }

            const formattedData = movementsData.map(mov => ({
                ...mov,
                user_full_name: usersMap[mov.user_id] || 'Sistema'
            })).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

            setMovements(formattedData);

        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao buscar movimentações', description: error.message });
            setMovements([]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        documentTitle: `Relatorio_Movimentacao_Estoque`
    });
    
    const customStyles = {
      control: (provided) => ({
        ...provided,
        backgroundColor: 'hsl(var(--input))',
        color: 'hsl(var(--foreground))',
        borderColor: 'hsl(var(--border))',
      }),
      menu: (provided) => ({
        ...provided,
        backgroundColor: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))',
      }),
      option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isFocused ? 'hsl(var(--accent))' : 'hsl(var(--background))',
        color: 'hsl(var(--foreground))',
        ':active': {
          backgroundColor: 'hsl(var(--accent))',
        },
      }),
      multiValue: (provided) => ({
        ...provided,
        backgroundColor: 'hsl(var(--primary))',
        color: 'hsl(var(--primary-foreground))',
      }),
      multiValueLabel: (provided) => ({
        ...provided,
        color: 'hsl(var(--primary-foreground))',
      }),
      multiValueRemove: (provided) => ({
        ...provided,
        color: 'hsl(var(--primary-foreground))',
        ':hover': {
          backgroundColor: 'hsl(var(--primary))',
          color: 'white',
        },
      }),
    };

    return (
        <div className="p-4 bg-card rounded-lg shadow-lg text-white h-full flex flex-col">
            <h2 className="text-2xl font-bold mb-4">Relatório de Movimentação de Estoque</h2>
            <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex-grow min-w-[300px]">
                    <Select
                        isMulti
                        options={partOptions}
                        value={selectedParts}
                        onChange={setSelectedParts}
                        placeholder="Selecione uma ou mais peças..."
                        noOptionsMessage={() => "Nenhuma peça encontrada."}
                        className="w-full"
                        styles={customStyles}
                    />
                </div>
                 <Button onClick={selectAllParts} variant="secondary">Selecionar Todas</Button>
                <Input type="date" name="startDate" value={dateRange.startDate} onChange={handleDateChange} className="w-auto" />
                <Input type="date" name="endDate" value={dateRange.endDate} onChange={handleDateChange} className="w-auto" />
                <Button onClick={handleSearch} disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Search className="w-4 h-4 mr-2" />}
                    Buscar
                </Button>
                <Button onClick={handlePrint} disabled={movements.length === 0} variant="outline">
                    <Printer className="w-4 h-4 mr-2" />
                    Imprimir
                </Button>
            </div>
            
            <ScrollArea className="flex-grow">
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Peça</TableHead>
                            <TableHead>Tipo de Movimentação</TableHead>
                            <TableHead>Quantidade</TableHead>
                            <TableHead>Observações</TableHead>
                            <TableHead>Usuário Responsável</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan="6" className="text-center py-10"><Loader2 className="mx-auto w-8 h-8 animate-spin text-primary" /></TableCell></TableRow>
                        ) : movements.length > 0 ? (
                           movements.map(movement => {
                               const part = inventory.find(p => p.id === movement.part_id);
                               return (
                                <TableRow key={movement.id}>
                                   <TableCell>{new Date(movement.created_at).toLocaleString('pt-BR')}</TableCell>
                                   <TableCell>{part?.name || 'N/A'}</TableCell>
                                   <TableCell>{movementTypeMap[movement.type] || movement.type}</TableCell>
                                   <TableCell>{movement.quantity_change}</TableCell>
                                   <TableCell>{movement.notes || 'N/A'}</TableCell>
                                   <TableCell>{movement.user_full_name || 'Sistema'}</TableCell>
                                </TableRow>
                               )
                           })
                        ) : (
                            <TableRow><TableCell colSpan="6" className="text-center py-10">Nenhuma movimentação encontrada para a(s) peça(s) e período selecionado(s).</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </ScrollArea>
            <div className="hidden">
                 <ReportPrintLayout ref={printRef} movements={movements} parts={inventory} companyDetails={companyDetails} dateRange={dateRange} />
            </div>
        </div>
    );
};

export default InventoryMovementReport;