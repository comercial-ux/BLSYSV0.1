
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useData } from '@/contexts/DataContext';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, FileText, Download, Upload, ArrowUpDown, Edit, PlusCircle, Eye, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, parseISO, getMonth, getYear, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { formatCurrency } from '@/lib/utils';
import * as XLSX from 'xlsx';
import BillingEditDialog from './BillingEditDialog';
import BillingNewDialog from './BillingNewDialog';
import AttachmentViewerDialog from './AttachmentViewerDialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const EditableCell = ({ value, onSave, type = 'text', recordId, fieldName, isImported, isGroup }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);

    useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    const handleBlur = () => {
        setIsEditing(false);
        if (currentValue !== value) {
            onSave(recordId, fieldName, currentValue, isImported, isGroup);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.target.blur();
        }
    };

    const displayValue = () => {
        if (type === 'date' && currentValue) {
            const date = parseISO(currentValue);
            return isValid(date) ? format(date, 'dd/MM/yyyy') : '...';
        }
        if (type === 'number' && (currentValue !== null && currentValue !== undefined)) {
            return formatCurrency(currentValue);
        }
        return currentValue || '...';
    };

    return (
        <div onClick={() => setIsEditing(true)} className="min-h-[28px] px-2 py-1 cursor-pointer hover:bg-muted/50 rounded-md text-xs">
            {isEditing ? (
                <Input 
                    autoFocus
                    type={type}
                    value={currentValue || ''}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className="h-7 text-xs p-1"
                />
            ) : (
                displayValue()
            )}
        </div>
    );
};

const AttachmentPopoverContent = ({ item, onOpenChange, onViewAttachment }) => {
    const attachments = [
        { label: 'Pedido de Compra', path: item.purchase_order_url, name: item.purchase_order_filename },
        { label: 'Nota Fiscal', path: item.invoice_file_url, name: item.invoice_file_filename },
        { label: 'Fatura / Boleto', path: item.bill_url, name: item.bill_filename },
        { label: 'Outros', path: item.other_doc_url, name: item.other_doc_filename },
    ].filter(att => att.path);

    return (
        <PopoverContent className="w-80" onPointerDownOutside={() => onOpenChange(false)}>
            <div className="grid gap-4">
                <div className="space-y-2">
                    <h4 className="font-medium leading-none">Anexos</h4>
                    <p className="text-sm text-muted-foreground">
                        Clique para visualizar os documentos.
                    </p>
                </div>
                <div className="grid gap-2">
                    {attachments.length > 0 ? (
                        attachments.map((att, index) => (
                            <Button
                                key={index}
                                variant="link"
                                className="p-0 h-auto justify-start text-blue-600"
                                onClick={() => onViewAttachment(att.path, att.name)}
                            >
                                <FileText className="mr-2 h-4 w-4" />
                                {att.label}
                            </Button>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground">Nenhum anexo encontrado.</p>
                    )}
                </div>
            </div>
        </PopoverContent>
    );
};


const BillingTab = () => {
    const { user } = useAuth();
    const { refetchData } = useData();
    const [billingData, setBillingData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('');
    const fileInputRef = useRef(null);
    const [clientFilter, setClientFilter] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'display_date', direction: 'descending' });
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [selectedBillingItem, setSelectedBillingItem] = useState(null);
    const [popoverStates, setPopoverStates] = useState({});
    const [attachmentViewer, setAttachmentViewer] = useState({ isOpen: false, fileUrl: '', fileName: '', fileType: '', isLoading: false });

    const handleViewAttachment = async (filePath, fileName) => {
        if (!filePath) return;
        
        setAttachmentViewer({ isOpen: true, fileUrl: '', fileName, fileType: '', isLoading: true });

        try {
            const { data, error } = await supabase.storage
                .from('billing-documents')
                .createSignedUrl(filePath, 300); // 5 minutes validity

            if (error) throw error;

            const { data: fileData, error: headError } = await supabase.storage
                .from('billing-documents')
                .download(filePath);
            
            if(headError) throw headError;

            setAttachmentViewer({ 
                isOpen: true, 
                fileUrl: data.signedUrl, 
                fileName, 
                fileType: fileData.type, 
                isLoading: false 
            });

        } catch (error) {
            console.error('Error creating signed URL:', error);
            toast({ variant: 'destructive', title: 'Erro ao gerar link do anexo', description: error.message });
            setAttachmentViewer({ isOpen: false, fileUrl: '', fileName: '', fileType: '', isLoading: false });
        }
    };

    const handlePopoverOpenChange = (itemId, isOpen) => {
        setPopoverStates(prev => ({ ...prev, [itemId]: isOpen }));
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        
        // 1. Fetch Individual Approved Measurements
        const { data: measurements, error: mError } = await supabase
            .from('measurements')
            .select('*, proposal:proposals(*, contacts(*))')
            .eq('status', 'approved');

        if (mError) toast({ variant: 'destructive', title: 'Erro ao buscar medições', description: mError.message });

        // 2. Fetch Approved Measurement Groups
        const { data: groups, error: gError } = await supabase
            .from('measurement_groups')
            .select('*, proposal:proposals(*, contacts(*)), items:measurement_group_items(measurement_id)')
            .eq('status', 'approved');

        if (gError) toast({ variant: 'destructive', title: 'Erro ao buscar agrupamentos', description: gError.message });

        // Identify measurements that are part of approved groups to exclude them from individual list
        const groupedMeasurementIds = new Set();
        (groups || []).forEach(g => {
            g.items?.forEach(i => groupedMeasurementIds.add(i.measurement_id));
        });

        // 3. Fetch Billing Details (Metadata for both measurements and groups)
        const { data: details, error: dError } = await supabase
            .from('billing_details')
            .select('*')
            .eq('is_active', true);

        if (dError) toast({ variant: 'destructive', title: 'Erro ao buscar detalhes', description: dError.message });

        // Process Groups into Billing Items
        const groupItems = (groups || []).map(g => {
            // Find billing details associated with this group (via group_id)
            const detail = (details || []).find(d => d.group_id === g.id);
            
            return {
                ...g,
                ...detail, // Spread detail first to get invoice_number, payment_date, etc.
                record_id: detail?.id || `group-${g.id}`, // Use detail ID if exists, else placeholder
                id: detail?.id || g.id,
                group_real_id: g.id,
                is_group: true,
                is_imported: false,
                display_date: g.created_at, 
                due_date: detail?.due_date || g.proposal?.validity_date,
                company_name: g.proposal?.contacts?.name,
            };
        });

        // Process Individual Measurements
        const individualItems = (measurements || [])
            .filter(m => !groupedMeasurementIds.has(m.id))
            .map(m => {
                const detail = (details || []).find(d => d.measurement_id === m.id);
                return { 
                    ...m, 
                    ...detail, 
                    id: detail?.id || m.id,
                    record_id: detail ? detail.id : `meas-${m.id}`,
                    measurement_real_id: m.id,
                    is_group: false,
                    is_imported: false,
                    display_date: m.end_date,
                    due_date: detail?.due_date || m.proposal?.validity_date,
                };
            });

        const importedData = (details || [])
            .filter(d => d.is_imported)
            .map(d => ({
                ...d.imported_data,
                ...d,
                id: d.id,
                record_id: d.id,
                is_imported: true,
                display_date: d.imported_data.service_date,
                due_date: d.due_date || d.imported_data.due_date,
            }));

        const allData = [...individualItems, ...groupItems, ...importedData];
        setBillingData(allData);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCellSave = async (recordId, field, value, isImported, isGroup) => {
        if (!user) return;
        
        let dataToUpsert;
        if (isImported) {
            const originalRecord = billingData.find(d => d.record_id === recordId);
            const updatedImportedData = { ...originalRecord.imported_data, [field]: value };
            dataToUpsert = { imported_data: updatedImportedData };
             const { error } = await supabase.from('billing_details').update(dataToUpsert).eq('id', recordId);
             if(error) toast({ variant: 'destructive', title: 'Erro', description: error.message });
             else { toast({ title: 'Salvo!' }); fetchData(); }
        } else if (isGroup) {
            const item = billingData.find(d => d.record_id === recordId);
            
            // Check if it's a placeholder record_id (starts with 'group-') or real DB id (number)
            if (typeof recordId === 'string' && recordId.startsWith('group-')) {
                const insertData = {
                    group_id: item.group_real_id,
                    user_id: user.id,
                    is_active: true,
                    [field]: value === '' ? null : value,
                };
                const { error } = await supabase.from('billing_details').insert(insertData);
                if(error) toast({ variant: 'destructive', title: 'Erro', description: error.message });
                else { toast({ title: 'Salvo!' }); fetchData(); }
            } else {
                // Update existing detail by ID
                 const { error } = await supabase.from('billing_details').update({ [field]: value === '' ? null : value }).eq('id', recordId);
                 if(error) toast({ variant: 'destructive', title: 'Erro', description: error.message });
                 else { toast({ title: 'Salvo!' }); fetchData(); }
            }
        } else {
            // It's an individual measurement
            const item = billingData.find(d => d.record_id === recordId);
            
            if (typeof recordId === 'string' && recordId.startsWith('meas-')) {
                const insertData = {
                    measurement_id: item.measurement_real_id,
                    user_id: user.id,
                    is_active: true,
                    [field]: value === '' ? null : value,
                };
                const { error } = await supabase.from('billing_details').insert(insertData);
                 if(error) toast({ variant: 'destructive', title: 'Erro', description: error.message });
                 else { toast({ title: 'Salvo!' }); fetchData(); }
            } else {
                // Update existing
                 const { error } = await supabase.from('billing_details').update({ [field]: value === '' ? null : value }).eq('id', recordId);
                 if(error) toast({ variant: 'destructive', title: 'Erro', description: error.message });
                 else { toast({ title: 'Salvo!' }); fetchData(); }
            }
        }
    };

    const handleExportToExcel = (data) => {
        const dataToExport = data.map(item => {
            const netValue = (item.total_value || item.gross_value || 0) - (item.iss_value || 0) - (item.inss_value || 0);
            return {
                'Data Serviço': item.display_date ? format(parseISO(item.display_date), 'dd/MM/yyyy') : '',
                'Emissão': item.created_at ? format(parseISO(item.created_at), 'dd/MM/yyyy') : '',
                'Vencimento': item.due_date ? format(parseISO(item.due_date), 'dd/MM/yyyy') : '',
                'Nota Fiscal': item.invoice_number || '',
                'Cliente': item.proposal?.contacts?.name || item.company_name || 'N/A',
                'Valor Bruto': item.total_value || item.gross_value || 0,
                'Liquidação': item.payment_date ? format(parseISO(item.payment_date), 'dd/MM/yyyy') : '',
                'ISS': item.iss_value || 0,
                'INSS': item.inss_value || 0,
                'Valor Líquido': netValue,
                'Forma de Pagamento': item.payment_method || '',
                'UF': item.uf || '',
                'Origem': item.is_group ? 'Agrupamento' : (item.is_imported ? 'Importado' : 'Sistema'),
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Faturamento');
        XLSX.writeFile(workbook, `Faturamento_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    };

    const handleImportClick = () => {
        fileInputRef.current.click();
    };

    const handleFileImport = (event) => {
         const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);

                const recordsToInsert = json.map(row => {
                    const parseDate = (date) => {
                        if (!date) return null;
                        const d = new Date(date);
                        return isValid(d) ? d.toISOString().split('T')[0] : null;
                    };
                    
                    return {
                        user_id: user.id,
                        is_imported: true,
                        notes: 'Importado via Excel',
                        invoice_number: row['Nota Fiscal'] || null,
                        payment_date: parseDate(row['Data Pagamento'] || row['Liquidação']),
                        iss_value: parseFloat(row['ISS']) || null,
                        inss_value: parseFloat(row['INSS']) || null,
                        payment_method: row['Forma de Pagamento'] || null,
                        uf: row['UF'] || null,
                        due_date: parseDate(row['Vencimento']),
                        imported_data: {
                            service_date: parseDate(row['Data Serviço']),
                            issue_date: parseDate(row['Emissão']),
                            due_date: parseDate(row['Vencimento']),
                            company_name: row['Cliente'] || null,
                            gross_value: parseFloat(row['Valor Bruto']) || null,
                        }
                    };
                });

                const { error } = await supabase.from('billing_details').insert(recordsToInsert);

                if (error) { throw error; }

                toast({ title: `${recordsToInsert.length} registros importados com sucesso!` });
                fetchData();

            } catch (error) {
                console.error("Erro ao importar:", error);
                toast({ variant: 'destructive', title: 'Erro ao importar planilha', description: 'Verifique o formato do arquivo e os dados. ' + error.message });
            } finally {
                event.target.value = null;
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleEdit = (item) => {
        setSelectedBillingItem(item);
        setIsEditModalOpen(true);
    };

    const processedData = useMemo(() => {
        let filteredData = [...billingData];

        if (clientFilter) {
            filteredData = filteredData.filter(item => {
                const clientName = item.is_imported ? `(Imp) ${item.company_name}` : item.proposal?.contacts?.name;
                return clientName?.toLowerCase().includes(clientFilter.toLowerCase());
            });
        }

        if (sortConfig.key) {
            filteredData.sort((a, b) => {
                const aValue = a[sortConfig.key] || (a.is_imported ? a[sortConfig.key] : a.proposal?.[sortConfig.key]);
                const bValue = b[sortConfig.key] || (b.is_imported ? b[sortConfig.key] : a.proposal?.[sortConfig.key]);
                
                if (sortConfig.key.includes('date')) {
                    const dateA = aValue ? parseISO(aValue) : null;
                    const dateB = bValue ? parseISO(bValue) : null;

                    if (dateA && dateB) {
                        if (dateA < dateB) return sortConfig.direction === 'ascending' ? -1 : 1;
                        if (dateA > dateB) return sortConfig.direction === 'ascending' ? 1 : -1;
                        return 0;
                    }
                    if (dateA) return sortConfig.direction === 'ascending' ? -1 : 1;
                    if (dateB) return sortConfig.direction === 'ascending' ? 1 : -1;
                    return 0;
                }

                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }

        return filteredData;
    }, [billingData, clientFilter, sortConfig]);

    const monthlyData = useMemo(() => {
        const months = {};
        processedData.forEach(item => {
            if (!item.display_date) return;
            const date = parseISO(item.display_date);
            if (!isValid(date)) return;

            const month = getMonth(date);
            const year = getYear(date);
            const key = `${year}-${month}`;
            if (!months[key]) {
                months[key] = {
                    label: format(new Date(year, month), 'MMMM yyyy', { locale: ptBR }),
                    key: key,
                    items: []
                };
            }
            months[key].items.push(item);
        });
        
        const sortedMonths = Object.values(months).sort((a, b) => b.key.localeCompare(a.key));
        if (sortedMonths.length > 0 && !activeTab) {
            setActiveTab(sortedMonths[0].key);
        }
        return sortedMonths;
    }, [processedData, activeTab]);

    const totals = useMemo(() => {
        const currentMonthItems = monthlyData.find(m => m.key === activeTab)?.items || [];
        return currentMonthItems.reduce((acc, item) => {
            const grossValue = item.total_value || item.gross_value || 0;
            const netValue = grossValue - (item.iss_value || 0) - (item.inss_value || 0);
            acc.totalGross += grossValue;
            acc.totalNet += netValue;
            return acc;
        }, { totalGross: 0, totalNet: 0 });
    }, [monthlyData, activeTab]);

    const SortableHeader = ({ children, sortKey, className }) => (
        <TableHead className={className}>
            <Button variant="ghost" onClick={() => requestSort(sortKey)} className="px-1 py-1 h-auto text-xs">
                {children}
                <ArrowUpDown className="ml-1 h-3 w-3" />
            </Button>
        </TableHead>
    );

    const renderTable = (items) => (
        <ScrollArea className="h-[60vh] border rounded-lg">
            <Table className="text-xs">
                <TableHeader className="sticky top-0 bg-muted z-10">
                    <TableRow>
                        <SortableHeader sortKey="display_date" className="w-[80px]">Data Serv.</SortableHeader>
                        <SortableHeader sortKey="created_at" className="w-[80px]">Emissão</SortableHeader>
                        <SortableHeader sortKey="due_date" className="w-[80px]">Venc.</SortableHeader>
                        <SortableHeader sortKey="invoice_number" className="w-[70px]">Nota</SortableHeader>
                        <SortableHeader sortKey="company_name" className="w-[150px]">Cliente</SortableHeader>
                        <SortableHeader sortKey="gross_value" className="w-[90px]">Valor</SortableHeader>
                        <SortableHeader sortKey="payment_date" className="w-[80px]">Liquidação / PGTO</SortableHeader>
                        <TableHead className="w-[80px]">ISS</TableHead>
                        <TableHead className="w-[80px]">INSS</TableHead>
                        <TableHead className="w-[90px] text-right">Líquido</TableHead>
                        <TableHead className="w-[100px]">Forma</TableHead>
                        <TableHead className="w-[80px] text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.length > 0 ? (
                        items.map(item => {
                            const netValue = (item.total_value || item.gross_value || 0) - (item.iss_value || 0) - (item.inss_value || 0);
                            const clientName = item.is_group ? `(G) ${item.company_name}` : (item.is_imported ? `(Imp) ${item.company_name}` : item.proposal?.contacts?.name);
                            const grossValue = item.is_imported ? item.gross_value : item.total_value;
                            const issueDate = item.is_imported ? item.imported_data?.issue_date : item.created_at;
                            const dueDate = item.due_date;
                            const hasAttachment = item.purchase_order_url || item.invoice_file_url || item.bill_url || item.other_doc_url;
                            const isGroup = item.is_group;

                            return (
                                <TableRow key={item.record_id} className={`h-10 ${isGroup ? 'bg-blue-50/50 hover:bg-blue-50' : ''}`}>
                                    <TableCell className="p-1">{item.display_date ? format(parseISO(item.display_date), 'dd/MM/yy') : 'N/A'}</TableCell>
                                    <TableCell className="p-1">{issueDate ? format(parseISO(issueDate), 'dd/MM/yy') : 'N/A'}</TableCell>
                                    <TableCell className="p-1">
                                         <EditableCell value={item.due_date} onSave={handleCellSave} recordId={item.record_id} fieldName="due_date" type="date" isImported={item.is_imported} isGroup={isGroup} />
                                    </TableCell>
                                    <TableCell className="p-1">
                                        <EditableCell value={item.invoice_number} onSave={handleCellSave} recordId={item.record_id} fieldName="invoice_number" isImported={item.is_imported} isGroup={isGroup} />
                                    </TableCell>
                                    <TableCell className="p-1 truncate" title={clientName}>
                                        {isGroup && <Layers className="inline w-3 h-3 mr-1 text-blue-500"/>}
                                        {clientName || 'N/A'}
                                    </TableCell>
                                    <TableCell className="p-1 text-right font-semibold">{formatCurrency(grossValue)}</TableCell>
                                    <TableCell className="p-1">
                                        <EditableCell value={item.payment_date} onSave={handleCellSave} recordId={item.record_id} fieldName="payment_date" type="date" isImported={item.is_imported} isGroup={isGroup} />
                                    </TableCell>
                                    <TableCell className="p-1">
                                        <EditableCell value={item.iss_value} onSave={handleCellSave} recordId={item.record_id} fieldName="iss_value" type="number" isImported={item.is_imported} isGroup={isGroup} />
                                    </TableCell>
                                    <TableCell className="p-1">
                                        <EditableCell value={item.inss_value} onSave={handleCellSave} recordId={item.record_id} fieldName="inss_value" type="number" isImported={item.is_imported} isGroup={isGroup} />
                                    </TableCell>
                                    <TableCell className="p-1 text-right font-bold">{formatCurrency(netValue)}</TableCell>
                                    <TableCell className="p-1">
                                        <EditableCell value={item.payment_method} onSave={handleCellSave} recordId={item.record_id} fieldName="payment_method" isImported={item.is_imported} isGroup={isGroup} />
                                    </TableCell>
                                    <TableCell className="p-1 text-right">
                                        <div className="flex items-center justify-end">
                                            {hasAttachment && (
                                                <Popover open={popoverStates[item.record_id]} onOpenChange={(isOpen) => handlePopoverOpenChange(item.record_id, isOpen)}>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6">
                                                            <Eye className="h-4 w-4 text-blue-500" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    {popoverStates[item.record_id] && <AttachmentPopoverContent item={item} onOpenChange={(isOpen) => handlePopoverOpenChange(item.record_id, isOpen)} onViewAttachment={handleViewAttachment} />}
                                                </Popover>
                                            )}
                                            {!isGroup && (
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="h-6 w-6">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        })
                    ) : (
                        <TableRow>
                            <TableCell colSpan={12} className="text-center h-24">Nenhum item para este mês.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </ScrollArea>
    );

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Faturamento</CardTitle>
                            <CardDescription>Gerencie o faturamento das medições aprovadas ou importe de uma planilha.</CardDescription>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <div className="flex gap-2">
                                <Button onClick={() => setIsNewModalOpen(true)} variant="outline">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Novo Avulso
                                </Button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileImport}
                                    className="hidden"
                                    accept=".xlsx, .xls"
                                />
                                <Button onClick={handleImportClick} variant="outline">
                                    <Upload className="mr-2 h-4 w-4" />
                                    Importar
                                </Button>
                                <Button onClick={() => handleExportToExcel(processedData)} disabled={loading || processedData.length === 0}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Exportar
                                </Button>
                            </div>
                            <div className="flex gap-4 text-sm mt-2">
                                <div className="text-right">
                                    <span className="font-semibold text-muted-foreground">Total Bruto:</span>
                                    <p className="font-bold text-lg text-primary">{formatCurrency(totals.totalGross)}</p>
                                </div>
                                <div className="text-right">
                                    <span className="font-semibold text-muted-foreground">Total Líquido:</span>
                                    <p className="font-bold text-lg text-green-600">{formatCurrency(totals.totalNet)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center items-center h-[65vh]">
                            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                        </div>
                    ) : (
                        <>
                            <div className="mb-4">
                                <Input
                                    placeholder="Filtrar por nome do cliente..."
                                    value={clientFilter}
                                    onChange={(e) => setClientFilter(e.target.value)}
                                    className="max-w-sm"
                                />
                            </div>
                            {monthlyData.length > 0 ? (
                                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                    <TabsList>
                                        {monthlyData.map(month => (
                                            <TabsTrigger key={month.key} value={month.key} className="capitalize">{month.label}</TabsTrigger>
                                        ))}
                                    </TabsList>
                                    {monthlyData.map(month => (
                                        <TabsContent key={month.key} value={month.key}>
                                            {renderTable(month.items)}
                                        </TabsContent>
                                    ))}
                                </Tabs>
                            ) : (
                                <div className="text-center py-12 h-[60vh] flex flex-col justify-center items-center">
                                    <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                                    <h3 className="text-xl font-semibold text-foreground">Nenhum dado encontrado</h3>
                                    <p className="text-muted-foreground">Ajuste os filtros ou adicione novos dados para que apareçam aqui.</p>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
            <BillingEditDialog
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                billingItem={selectedBillingItem}
                onUpdate={() => {
                    fetchData();
                    refetchData();
                }}
            />
            <BillingNewDialog
                isOpen={isNewModalOpen}
                onClose={() => setIsNewModalOpen(false)}
                onUpdate={() => {
                    fetchData();
                    refetchData();
                }}
            />
            <AttachmentViewerDialog 
                {...attachmentViewer}
                onClose={() => setAttachmentViewer(prev => ({ ...prev, isOpen: false }))}
            />
        </>
    );
};

export default BillingTab;
