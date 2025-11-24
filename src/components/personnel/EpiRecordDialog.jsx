import React, { useState, useMemo, useEffect } from 'react';
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
    import { Button } from '@/components/ui/button';
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
    import { Input } from '@/components/ui/input';
    import { ScrollArea } from '@/components/ui/scroll-area';
    import { useData } from '@/contexts/DataContext';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import { supabase } from '@/lib/customSupabaseClient';
    import { PlusCircle, Trash2, Loader2, Printer } from 'lucide-react';
    import { format, parseISO } from 'date-fns';
    import { toast } from 'react-hot-toast';
    import { Combobox } from '@/components/ui/combobox';
    import { v4 as uuidv4 } from 'uuid';

    const EpiRecordDialog = ({ isOpen, onClose, employee }) => {
        const { inventory, epiDeliveries, refetchData } = useData();
        const { user } = useAuth();
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [deliveryItems, setDeliveryItems] = useState([]);
        const [existingDeliveries, setExistingDeliveries] = useState([]);

        const epiOptions = useMemo(() => {
            return inventory
                .filter(item => item.category === 'epi_cinta')
                .map(item => ({ value: item.id.toString(), label: item.name }));
        }, [inventory]);

        useEffect(() => {
            if (employee && epiDeliveries) {
                const employeeDeliveries = epiDeliveries
                    .filter(d => d.colaborador_id === employee.id)
                    .map(d => ({
                        ...d,
                        inventory_part_name: d.inventory_part?.name || 'Item não encontrado',
                        isNew: false,
                    }));
                setExistingDeliveries(employeeDeliveries);
                setDeliveryItems([]); // Reset new items when modal opens/employee changes
            }
        }, [employee, epiDeliveries, isOpen]);

        const handleAddItem = () => {
            setDeliveryItems([...deliveryItems, { id: uuidv4(), inventory_part_id: '', delivery_date: new Date().toISOString().split('T')[0], return_date: '', notes: '', quantity: 1, isNew: true }]);
        };

        const handleRemoveItem = (id) => {
            setDeliveryItems(deliveryItems.filter(item => item.id !== id));
        };
        
        const handleUpdateItem = (id, field, value) => {
            const updatedItems = deliveryItems.map(item => {
                if (item.id === id) {
                    const updatedItem = { ...item, [field]: value };
                    if (field === 'inventory_part_id') {
                        const selectedEpi = inventory.find(epi => epi.id.toString() === value);
                        updatedItem.ca_number = selectedEpi?.part_number || '';
                    }
                    return updatedItem;
                }
                return item;
            });
            setDeliveryItems(updatedItems);
        };

        const handleSubmit = async () => {
            if (deliveryItems.length === 0) {
                toast.error("Nenhum novo item para salvar.");
                return;
            }
            setIsSubmitting(true);
            const toastId = toast.loading('Salvando entregas de EPI...');

            const itemsToInsert = deliveryItems.map(item => {
                const selectedEpi = inventory.find(epi => epi.id.toString() === item.inventory_part_id);
                return {
                    user_id: user.id,
                    colaborador_id: employee.id,
                    inventory_part_id: item.inventory_part_id,
                    delivery_date: item.delivery_date,
                    return_date: item.return_date || null,
                    notes: item.notes,
                    ca_number: selectedEpi?.part_number || null,
                    value_at_delivery: selectedEpi?.purchase_price || null,
                    epi_category_id: 1, // Placeholder, will need a proper category system
                };
            });

            const { error } = await supabase.from('epi_deliveries').insert(itemsToInsert);

            if (error) {
                toast.error(`Erro ao salvar: ${error.message}`, { id: toastId });
            } else {
                toast.success('Entregas de EPI salvas com sucesso!', { id: toastId });
                await refetchData();
                setDeliveryItems([]);
            }
            setIsSubmitting(false);
        };
        
        const allDeliveries = [...existingDeliveries, ...deliveryItems];

        const handlePrint = () => {
            toast("🚧 Este recurso ainda não foi implementado—mas não se preocupe! Você pode solicitá-lo no seu próximo prompt! 🚀");
        }

        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-6xl h-[95vh] flex flex-col">
                    <DialogHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <DialogTitle className="text-2xl">Ficha de Controle de EPI</DialogTitle>
                                <DialogDescription>Comprovante de Recebimento e Termo de Responsabilidade</DialogDescription>
                            </div>
                            <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Imprimir</Button>
                        </div>
                    </DialogHeader>
                    
                    <div className="border rounded-lg p-2 text-sm grid grid-cols-5 gap-px bg-border">
                        <div className="bg-card p-2 rounded-l-md"><strong>Funcionário:</strong> {employee?.name}</div>
                        <div className="bg-card p-2"><strong>Função:</strong> {employee?.function}</div>
                        <div className="bg-card p-2"><strong>Registro:</strong> {employee?.id}</div>
                        <div className="bg-card p-2"><strong>Setor:</strong> Operacional</div>
                        <div className="bg-card p-2 rounded-r-md"><strong>Admissão:</strong> {employee?.admission_date ? format(parseISO(employee.admission_date), 'dd/MM/yyyy') : 'N/A'}</div>
                    </div>

                    <ScrollArea className="flex-grow my-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40px]">QT</TableHead>
                                    <TableHead className="w-[300px]">Tipo de EPI</TableHead>
                                    <TableHead>C.A.</TableHead>
                                    <TableHead>Data de Entrega</TableHead>
                                    <TableHead>Rubrica</TableHead>
                                    <TableHead>Data de Devolução</TableHead>
                                    <TableHead>Rubrica</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {allDeliveries.map((item, index) => (
                                    <TableRow key={item.id || index}>
                                        <TableCell>
                                            {item.isNew ? (
                                                <Input type="number" value={item.quantity} onChange={(e) => handleUpdateItem(item.id, 'quantity', e.target.value)} className="h-8 w-16" />
                                            ) : (
                                                '1' 
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {item.isNew ? (
                                                <Combobox
                                                    options={epiOptions}
                                                    value={item.inventory_part_id}
                                                    onChange={(value) => handleUpdateItem(item.id, 'inventory_part_id', value)}
                                                    placeholder="Selecione um EPI"
                                                    searchPlaceholder="Buscar EPI..."
                                                    emptyText="Nenhum EPI encontrado."
                                                />
                                            ) : (
                                                item.inventory_part_name
                                            )}
                                        </TableCell>
                                        <TableCell>{item.ca_number || item.inventory_part?.part_number}</TableCell>
                                        <TableCell>
                                            {item.isNew ? (
                                                <Input type="date" value={item.delivery_date} onChange={(e) => handleUpdateItem(item.id, 'delivery_date', e.target.value)} className="h-8" />
                                            ) : (
                                                format(parseISO(item.delivery_date), 'dd/MM/yyyy')
                                            )}
                                        </TableCell>
                                        <TableCell></TableCell>
                                        <TableCell>
                                            {item.isNew ? (
                                                <Input type="date" value={item.return_date} onChange={(e) => handleUpdateItem(item.id, 'return_date', e.target.value)} className="h-8" />
                                            ) : (
                                                item.return_date ? format(parseISO(item.return_date), 'dd/MM/yyyy') : ''
                                            )}
                                        </TableCell>
                                        <TableCell></TableCell>
                                        <TableCell>
                                            {item.isNew && (
                                                <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <Button variant="outline" size="sm" onClick={handleAddItem} className="mt-4 w-full">
                            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Item
                        </Button>
                    </ScrollArea>
                    
                    <div className="text-xs text-muted-foreground p-4 border rounded-lg">
                        <p>Declaro que recebi da BL SOLUÇÕES os Equipamentos de Proteção Individual (EPIs), para uso no meu trabalho, bem como, treinamento sobre o uso adequado. Comprometo-me a mantê-los em boas condições, utilizá-los em conformidade com os Procedimentos e Normas da Empresa, responsabilizando-me por sua guarda e conservação. Comprometo-me, também, a solicitar a substituição por um EPI novo, sempre que o anterior não tenha mais funcionalidade. Estou ciente, também, de que o não uso dos EPIs nos trabalhos em que se fizerem necessários sujeitará em minha punição disciplinar.</p>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>Fechar</Button>
                        <Button type="button" onClick={handleSubmit} disabled={isSubmitting || deliveryItems.length === 0}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Salvar Novas Entregas
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    };

    export default EpiRecordDialog;