import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { useData } from '@/contexts/DataContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Printer, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const movementTypeMap = {
    'entrada_inicial': 'Entrada Inicial (Cadastro)',
    'ajuste_entrada': 'Entrada (Ajuste Manual)',
    'ajuste_saida': 'Saída (Ajuste Manual)',
    'saida_manutencao': 'Saída (Uso em Manutenção)',
    'estorno_manutencao': 'Entrada (Estorno de Manutenção)',
};

const ReportPrintLayout = React.forwardRef(({ movements, part, companyDetails }, ref) => {
    if (!part) return null;

    return (
        <div ref={ref} className="p-8 bg-white text-black font-sans">
            <header className="flex justify-between items-center pb-4 mb-8 border-b-2">
                <div>
                    <h1 className="text-2xl font-bold">{companyDetails?.trade_name || companyDetails?.company_name || 'Relatório'}</h1>
                    <p className="text-sm">{companyDetails?.address_street}, {companyDetails?.address_number} - {companyDetails?.address_city}</p>
                    <p className="text-sm">CNPJ: {companyDetails?.cnpj}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-3xl font-bold">Extrato de Movimentação</h2>
                    <p className="text-sm">Gerado em: {new Date().toLocaleString('pt-BR')}</p>
                </div>
            </header>
            
            <section className="mb-8">
                <h3 className="text-xl font-semibold mb-2 border-b pb-1">Detalhes do Item</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                    <div><strong>Nome:</strong> {part.name}</div>
                    <div><strong>Part Number:</strong> {part.part_number || 'N/A'}</div>
                    <div><strong>Estoque Atual:</strong> {part.quantity} {part.unit}</div>
                    <div><strong>Localização:</strong> {part.location || 'N/A'}</div>
                </div>
            </section>
            
            <section>
                <h3 className="text-xl font-semibold mb-2">Histórico de Movimentações</h3>
                <table className="w-full text-sm border-collapse">
                    <thead className="bg-gray-100">
                        <tr className="border-b-2 border-black">
                            <th className="text-left p-2 font-bold">Data</th>
                            <th className="text-left p-2 font-bold">Tipo</th>
                            <th className="text-right p-2 font-bold">Qtd.</th>
                            <th className="text-left p-2 font-bold">Observações</th>
                            <th className="text-left p-2 font-bold">Usuário</th>
                        </tr>
                    </thead>
                    <tbody>
                        {movements.map(mov => (
                            <tr key={mov.id} className="border-b hover:bg-gray-50">
                                <td className="p-2">{new Date(mov.created_at).toLocaleString('pt-BR')}</td>
                                <td className="p-2">{movementTypeMap[mov.type] || mov.type}</td>
                                <td className={`p-2 text-right font-semibold ${mov.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {mov.quantity_change > 0 ? `+${mov.quantity_change}` : mov.quantity_change}
                                </td>
                                <td className="p-2">{mov.notes || 'N/A'}</td>
                                <td className="p-2">{mov.user_full_name || 'Sistema'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {movements.length === 0 && <p className="text-center py-4">Nenhuma movimentação encontrada para este item.</p>}
            </section>

             <footer className="mt-12 text-center text-xs text-gray-500">
                <p>{companyDetails?.company_name || 'BL Soluções'} - Relatório Interno</p>
            </footer>
        </div>
    );
});


const InventoryMovementExtract = ({ part }) => {
    const { companyDetails } = useData();
    const [movements, setMovements] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const printRef = useRef();

    useEffect(() => {
        const fetchMovements = async () => {
            if (!part?.id) return;
            setIsLoading(true);
            try {
                const { data: movementsData, error: movementsError } = await supabase
                    .from('inventory_movements')
                    .select('*')
                    .eq('part_id', part.id)
                    .order('created_at', { ascending: false });

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
                }));

                setMovements(formattedData);

            } catch (error) {
                toast({ variant: 'destructive', title: 'Erro ao buscar movimentações', description: error.message });
                setMovements([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMovements();
    }, [part]);
    
    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        documentTitle: `Extrato_Movimentacao_${part?.name?.replace(/\s/g, '_') || 'item'}`
    });

    return (
        <div className="bg-card text-white h-full flex flex-col pt-4">
            <div className="flex justify-end mb-4">
                 <Button onClick={handlePrint} disabled={!movements.length || isLoading} variant="outline">
                    <Printer className="w-4 h-4 mr-2" />
                    Imprimir Extrato
                </Button>
            </div>
            
            <ScrollArea className="flex-grow max-h-[60vh]">
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="text-right">Quantidade</TableHead>
                            <TableHead>Observações</TableHead>
                            <TableHead>Usuário</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan="5" className="text-center py-10"><Loader2 className="mx-auto w-8 h-8 animate-spin text-primary" /></TableCell></TableRow>
                        ) : movements.length > 0 ? (
                           movements.map(movement => (
                               <TableRow key={movement.id}>
                                   <TableCell>{new Date(movement.created_at).toLocaleString('pt-BR')}</TableCell>
                                   <TableCell>{movementTypeMap[movement.type] || movement.type}</TableCell>
                                   <TableCell className={`text-right font-medium ${movement.quantity_change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                       {movement.quantity_change > 0 ? `+${movement.quantity_change}` : movement.quantity_change}
                                   </TableCell>
                                   <TableCell>{movement.notes || 'N/A'}</TableCell>
                                   <TableCell>{movement.user_full_name || 'Sistema'}</TableCell>
                               </TableRow>
                           ))
                        ) : (
                            <TableRow><TableCell colSpan="5" className="text-center py-10">Nenhuma movimentação encontrada para este item.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </ScrollArea>
            <div className="hidden">
                 <ReportPrintLayout ref={printRef} movements={movements} part={part} companyDetails={companyDetails} />
            </div>
        </div>
    );
};

export default InventoryMovementExtract;