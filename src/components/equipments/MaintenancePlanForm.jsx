import React, { useState, useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2 } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';

const maintenancePlanItemsTemplate = [
    { system: 'MOTOR', activity: 'Trocar óleo do motor', material: 'Óleo 15w40/ 26L (PETRO)', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'MOTOR', activity: 'Trocar do filtro lubrificante', material: 'PSC-80/PSL-962', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'MOTOR', activity: 'Trocar do filtro de Ar interno e externo', material: 'AF 25277/ 25776', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'MOTOR', activity: 'Filtro hidraulico', material: 'TB1324X', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'MOTOR', activity: 'Trocar do filtro separador óleo-água', material: 'PSD 460/1', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'MOTOR', activity: 'Verificar aditivo do radiador', material: 'Aditivo p/ radiador/ 1L', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'MOTOR', activity: 'Verificar correais, mangueiras', material: '', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'MOTOR', activity: 'Regular valvulas do motor', material: '', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'MOTOR', activity: 'Drenar água do reservadorio de ar', material: '', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'MOTOR', activity: 'Verificar rolamento do redutor', material: '', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'SISTEMA ELETRICO', activity: 'Verificar condições da bateria', material: 'Multimetro', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'SISTEMA ELETRICO', activity: 'Nivel de acido da bateria', material: '', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'SISTEMA ELETRICO', activity: 'Verificar terminais da bateria', material: '', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'SISTEMA ELETRICO', activity: 'Funcionamento dos instrumentos cabine superior e inferior', material: '', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'SISTEMA ELETRICO', activity: 'Verificar sistema de iluminaçao', material: '', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'SISTEMA ELETRICO', activity: 'Verificar limpador de parabrisa', material: '', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'SISTEMA ELETRICO', activity: 'Verificar fucionamento do alternador', material: '', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'DIREÇÃO HIDRAULICA', activity: 'Verificar óleo da direção', material: '', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'DIREÇÃO HIDRAULICA', activity: 'Trocar do óleo da direção', material: 'Óleo hidraulico Telus 32', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'DIREÇÃO HIDRAULICA', activity: 'Verificar vazamento de de óleo', material: '', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'DIREÇÃO HIDRAULICA', activity: 'Trocar do filtro da direção', material: '', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'DIREÇÃO HIDRAULICA', activity: 'Verificar da direção (caixa Bomba,tubulação e mangueira)', material: '', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'GUINDASTE', activity: 'Verificar vazamento de óleo no swivel', material: 'fluido vermelho Dot 4', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'GUINDASTE', activity: 'Revissão geral das escovas do swivel', material: '', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'GUINDASTE', activity: 'Verificar nivel de óleo diferencial redutores,rodas,câmbio e tomada de', material: '', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'GUINDASTE', activity: 'Verificar nivel de óleo do redutores de guincho e giro', material: '', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'GUINDASTE', activity: 'trocar do óleo do redutor do guincho principal e segundario', material: 'Óleo 80W90/ 3,5L', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'GUINDASTE', activity: 'Troca do óleo do motor redutor e giro', material: 'Óleo 80W91/1,5L', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'GUINDASTE', activity: 'Regulagem e verificação dos calço da lança', material: '', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'GUINDASTE', activity: 'Verificar vazamento do cilindro de movimentação lança', material: '', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'GUINDASTE', activity: 'Verificar se cilindro telescopico apresenta vazamento de óleo', material: '', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'GERAL', activity: 'Trocar óelo da transmissão', material: 'Óleo 80W90/15L', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'GERAL', activity: 'Trocar óelo dos cubos de roda', material: 'Óleo 80W91/2,5L', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'GERAL', activity: 'Trocar óleo do diferecial', material: 'Óleo 80W92/13L', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'GERAL', activity: 'Regular freio de parada e estacionamento', material: '', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'GERAL', activity: 'Verificar funcionamento da valvula do balão de ar comprimido', material: '', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'GERAL', activity: 'Verificar vazamento tubulação de ar comprimido', material: '', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'GERAL', activity: 'Cinto de segurança e extintor', material: '', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'SISTEMA HIDRAULICO', activity: 'Filtra óleo hidraulico', material: 'Óleo 46ou 68 /4681', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'SISTEMA HIDRAULICO', activity: 'Limpar tangue hidraulico', material: '', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'SISTEMA HIDRAULICO', activity: 'limpar filtro de sucção do retorno', material: '', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'SISTEMA HIDRAULICO', activity: 'Trocar óleo hidraulico 1200', material: '', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'SISTEMA HIDRAULICO', activity: 'Verificar se entra ar na tubulação de sucçao de óleo', material: '', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'SISTEMA HIDRAULICO', activity: 'Verficar vazamento na bomba de óleo', material: '', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'SISTEMA HIDRAULICO', activity: 'Verificar ruido anormal da bomba hidraulica', material: '', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'LUBRIFICAÇÃO', activity: 'Lubrificaçao da lança', material: 'PETRONAS TUTE MRM2', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'LUBRIFICAÇÃO', activity: 'Lubrificação do giro', material: 'MP2 Lubrax', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'LUBRIFICAÇÃO', activity: 'Lubrificação completa do chassis', material: 'MP2 Lubrax', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'LUBRIFICAÇÃO', activity: 'Lubrificação cabo de aço', material: 'PETRONAS TUTE MRM2', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'DISPOSITIVO DE SEGURANÇA', activity: 'Verificar limitador de carga', material: '', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'DISPOSITIVO DE SEGURANÇA', activity: 'Verificar chave de limite de elevação', material: '', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'DISPOSITIVO DE SEGURANÇA', activity: 'Verificar chave de limite de abaixamento', material: '', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'DISPOSITIVO DE SEGURANÇA', activity: 'Verificar indicador do ângulo da lança principal', material: '', hours: [0, 300, 600, 900, 1200, 1500] },
    { system: 'DISPOSITIVO DE SEGURANÇA', activity: 'Verificar funcionamento do 5º dispositivo de alerta de sobrepressão do estabilizador', material: '', hours: [0, 300, 600, 900, 1200, 1500] },
];

const MaintenancePlanForm = ({ equipment, onClose, onSaveSuccess }) => {
    const { toast } = useToast();
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [planState, setPlanState] = useState({});
    const [maintenancePlanItems, setMaintenancePlanItems] = useState(maintenancePlanItemsTemplate);
    const [hourMeterReading, setHourMeterReading] = useState(equipment.current_hours || '');
    const componentRef = useRef();

    const allHourIntervals = [...new Set(maintenancePlanItemsTemplate.flatMap(item => item.hours))].sort((a, b) => a - b);

    useEffect(() => {
        const fetchLatestPlan = async () => {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('maintenance_plans')
                .select('plan_data, horometer_at_plan')
                .eq('equipment_id', equipment.id)
                .order('created_at', { ascending: false })
                .limit(1);

            if (error) {
                toast({ variant: 'destructive', title: 'Erro ao carregar plano', description: error.message });
            } else if (data && data.length > 0) {
                const latestPlan = data[0];
                setPlanState(latestPlan.plan_data || {});
                
                const customizedItems = maintenancePlanItemsTemplate.map(item => {
                    const savedMaterial = latestPlan.plan_data?.[`${item.activity}-material`];
                    return {
                        ...item,
                        material: savedMaterial !== undefined ? savedMaterial : item.material,
                    };
                });
                setMaintenancePlanItems(customizedItems);
            }
            setIsLoading(false);
        };

        fetchLatestPlan();
    }, [equipment.id, toast]);

    const handleMaterialChange = (activity, value) => {
        setPlanState(prev => ({
            ...prev,
            [`${activity}-material`]: value
        }));
        setMaintenancePlanItems(prevItems => prevItems.map(item => 
            item.activity === activity ? { ...item, material: value } : item
        ));
    };

    const currentHourMeter = parseFloat(hourMeterReading) || 0;
    
    const getVisibleIntervals = () => {
        const baseIntervals = allHourIntervals.filter(h => h <= 600);
        let maxVisible = 600;
    
        for (const h of allHourIntervals) {
            if (h > maxVisible) {
                const prevInterval = allHourIntervals[allHourIntervals.indexOf(h) - 1];
                const prevNextHour = currentHourMeter + prevInterval;
                const isPrevOccupied = Object.keys(planState).some(key => key.endsWith(`-${prevNextHour}`) && planState[key]);
                
                if (isPrevOccupied) {
                    baseIntervals.push(h);
                    maxVisible = h;
                } else {
                    break;
                }
            }
        }
        return baseIntervals;
    };

    const visibleIntervals = getVisibleIntervals();
    const nextHourIntervals = visibleIntervals.map(h => currentHourMeter + h);

    const handleCheckboxChange = (activity, hour, checked) => {
        setPlanState(prev => ({
            ...prev,
            [`${activity}-${hour}`]: checked
        }));
    };

    const handleSave = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: "Erro de Autenticação" });
            return;
        }
        setIsSubmitting(true);
        try {
            const { data, error } = await supabase
                .from('maintenance_plans')
                .insert([{
                    equipment_id: equipment.id,
                    user_id: user.id,
                    horometer_at_plan: currentHourMeter,
                    plan_data: planState,
                }]);

            if (error) throw error;

            toast({
                title: "Sucesso!",
                description: "Plano de manutenção salvo com sucesso.",
            });
            if (onSaveSuccess) onSaveSuccess();
            onClose();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro ao Salvar",
                description: `Falha na operação: ${error.message}`,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        documentTitle: `Plano_Manutencao_${equipment.name}_${new Date().toLocaleDateString()}`,
        pageStyle: `
          @media print {
            @page {
              size: A4 portrait;
              margin: 0;
            }
            html, body {
              height: 100%;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .print-container {
              transform: scale(0.7);
              transform-origin: top left;
              width: 142.85%;
              height: 142.85%;
              padding: 1cm 1.5cm;
              box-sizing: border-box;
              font-size: 8px;
              display: flex;
              flex-direction: column;
            }
            .print-header {
              flex-shrink: 0;
            }
            .print-content {
              flex-grow: 1;
              overflow: hidden;
            }
            .print-hidden {
              display: none !important;
            }
            .print-table {
              border-collapse: collapse;
              width: 100%;
            }
            .print-table th, .print-table td {
              border: 1px solid #000;
              padding: 1px 3px;
              text-align: left;
              vertical-align: middle;
            }
            .print-table th {
              font-weight: bold;
              background-color: #E0E0E0 !important;
            }
            .print-x-mark {
              display: block !important;
              text-align: center;
              font-weight: bold;
            }
          }
        `
    });

    const groupedItems = maintenancePlanItems.reduce((acc, item) => {
        if (!acc[item.system]) {
            acc[item.system] = [];
        }
        acc[item.system].push(item);
        return acc;
    }, {});

    const printVisibleIntervals = allHourIntervals.slice(-4);
    const printVisibleNextIntervals = printVisibleIntervals.map(h => currentHourMeter + h);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[80vh]">
                <Loader2 className="mr-2 h-8 w-8 animate-spin" />
                Carregando plano de manutenção...
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[80vh] text-xs">
            <div className="print-hidden p-2 border-b">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                    <div><span className="font-semibold">Equipamento:</span> {equipment.name}</div>
                    <div><span className="font-semibold">Modelo:</span> {equipment.model}</div>
                    <div><span className="font-semibold">Placa:</span> {equipment.plate || 'N/A'}</div>
                    <div className="flex items-center gap-2">
                        <Label htmlFor="hourMeterReading" className="font-semibold whitespace-nowrap">Horímetro:</Label>
                        <Input 
                            id="hourMeterReading"
                            type="number"
                            value={hourMeterReading}
                            onChange={(e) => setHourMeterReading(e.target.value)}
                            className="h-8 text-xs"
                        />
                    </div>
                </div>
            </div>
            <ScrollArea className="flex-grow h-[calc(80vh-90px)] print-hidden">
                <Table className="text-xs">
                    <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                            <TableHead className="w-[120px] p-1">Sistema</TableHead>
                            <TableHead className="p-1">Atividade</TableHead>
                            <TableHead className="w-[150px] p-1">Material</TableHead>
                            {visibleIntervals.map((h, i) => (
                                <TableHead key={h} className="w-[70px] text-center p-1">
                                    <div>{h}h</div>
                                    <div className="font-bold">{nextHourIntervals[i]}h</div>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Object.entries(groupedItems).map(([system, items]) => (
                            <React.Fragment key={system}>
                                {items.map((item, index) => (
                                    <TableRow key={`${system}-${index}`} className="h-8">
                                        {index === 0 && (
                                            <TableCell rowSpan={items.length} className="font-semibold align-top p-1">{system}</TableCell>
                                        )}
                                        <TableCell className="p-1">{item.activity}</TableCell>
                                        <TableCell className="p-1">
                                            <Input
                                                type="text"
                                                value={item.material}
                                                onChange={(e) => handleMaterialChange(item.activity, e.target.value)}
                                                className="h-6 text-xs p-1"
                                            />
                                        </TableCell>
                                        {visibleIntervals.map((h, i) => (
                                            <TableCell key={h} className="text-center p-1">
                                                <Checkbox 
                                                    checked={!!planState[`${item.activity}-${nextHourIntervals[i]}`]}
                                                    onCheckedChange={(checked) => handleCheckboxChange(item.activity, nextHourIntervals[i], checked)}
                                                    className="h-3 w-3"
                                                />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </React.Fragment>
                        ))}
                    </TableBody>
                </Table>
            </ScrollArea>
            
            <div style={{ display: 'none' }}>
                <div ref={componentRef} className="print-container">
                    <header className="print-header p-2">
                        <div className="flex justify-between items-start">
                            <div className="text-left">
                                <h2 className="text-lg font-bold">BL SOLUÇÕES</h2>
                            </div>
                            <div className="text-center">
                                <h1 className="text-xl font-bold">PLANO DE MANUTENÇÃO</h1>
                            </div>
                            <div className="w-1/4"></div>
                        </div>
                        <div className="flex justify-between mt-2 text-xs border-2 border-black p-1">
                            <div className="w-1/3 pr-2">
                                <p><strong>RESPONSÁVEL:</strong> {user?.full_name || 'N/A'}</p>
                                <p><strong>SOLICITANTE:</strong> {equipment.client_name || 'N/A'}</p>
                                <p><strong>ORIGEM:</strong> {equipment.origin || 'N/A'}</p>
                                <p><strong>Nº OS:</strong> {equipment.os_number || 'N/A'}</p>
                            </div>
                            <div className="w-1/3 pr-2 border-l-2 border-r-2 border-black px-2">
                                <p><strong>EQUIPAMENTO:</strong> {equipment.name}</p>
                                <p><strong>MODELO:</strong> {equipment.model}</p>
                                <p><strong>PLACA:</strong> {equipment.plate}</p>
                                <p><strong>FROTA:</strong> {equipment.fleet_number || 'N/A'}</p>
                            </div>
                            <div className="w-1/3 pl-2">
                                <p><strong>HORÍMETRO:</strong> {hourMeterReading}</p>
                                <p><strong>KILOMETRAGEM:</strong> {equipment.current_km || 'N/A'}</p>
                                <p><strong>DATA DA REVISÃO:</strong> {format(new Date(), 'dd/MM/yyyy')}</p>
                                <p><strong>H. PRÓXIMA REVISÃO:</strong> {nextHourIntervals[1]}</p>
                                <p><strong>DATA PROX. REVISÃO:</strong></p>
                            </div>
                        </div>
                    </header>
                    <main className="print-content">
                        <table className="print-table">
                            <thead>
                                <tr>
                                    <th className="w-[15%]">SISTEMA</th>
                                    <th className="w-[40%]">ATIVIDADE</th>
                                    <th className="w-[25%]">MATERIAL</th>
                                    {printVisibleIntervals.map((h, i) => (
                                        <th key={h} className="w-[5%] text-center">
                                            <div>{h}</div>
                                            <div className="font-normal">{printVisibleNextIntervals[i]}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(groupedItems).map(([system, items]) => (
                                    <React.Fragment key={system}>
                                        {items.map((item, index) => (
                                            <tr key={`${system}-${index}`}>
                                                {index === 0 && <td rowSpan={items.length} className="font-bold align-top">{system}</td>}
                                                <td>{item.activity}</td>
                                                <td>{item.material}</td>
                                                {printVisibleIntervals.map((h, i) => (
                                                    <td className="text-center">
                                                        <span className="print-x-mark">
                                                            {planState[`${item.activity}-${printVisibleNextIntervals[i]}`] ? 'X' : ''}
                                                        </span>
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </main>
                </div>
            </div>

            <div className="p-2 border-t flex justify-end gap-2 print-hidden">
                <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>Fechar</Button>
                <Button size="sm" onClick={handlePrint} disabled={isSubmitting}>Imprimir</Button>
                <Button size="sm" onClick={handleSave} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                    {isSubmitting ? 'Salvando...' : 'Salvar Plano'}
                </Button>
            </div>
        </div>
    );
};

export default MaintenancePlanForm;