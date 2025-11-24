import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { formatCurrency, parseCurrency } from '@/lib/utils';
import { format, parse, isValid } from 'date-fns';

const EXPENSE_TYPES = ['Combustível', 'Alimentação', 'Hospedagem', 'Transporte', 'Outros'];

const parseExtractedText = (text) => {
    const extractedData = {
        value: null,
        date: null,
        description: null,
    };
    const lines = text.split('\n');

    // 1. Extract Description (Establishment Name)
    // Usually the first few non-CNPJ lines
    const descriptionLine = lines.find(line => 
        line.trim().length > 5 && 
        !line.toLowerCase().includes('cnpj') && 
        !line.toLowerCase().includes('nota fiscal')
    );
    if (descriptionLine) {
        extractedData.description = descriptionLine.trim();
    }

    // 2. Extract Value
    // Look for "VALOR TOTAL" specifically
    const totalLineIndex = lines.findIndex(line => line.toLowerCase().includes('valor total'));
    if (totalLineIndex !== -1) {
        const totalLine = lines[totalLineIndex];
        const valueMatch = totalLine.match(/([0-9]+[,.][0-9]{2})/);
        if (valueMatch && valueMatch[1]) {
            const parsedValue = parseFloat(valueMatch[1].replace('.', '').replace(',', '.'));
            if (!isNaN(parsedValue)) {
                extractedData.value = parsedValue;
            }
        }
    }
    // Fallback if "VALOR TOTAL" is not found
    if (extractedData.value === null) {
        const valueRegex = /(?:R\$|VALOR|TOTAL)\s*([0-9]+(?:[,.][0-9]{2}))/gi;
        let valueMatches;
        let values = [];
        while ((valueMatches = valueRegex.exec(text)) !== null) {
            const parsedValue = parseFloat(valueMatches[1].replace('.', '').replace(',', '.'));
            if (!isNaN(parsedValue)) {
                values.push(parsedValue);
            }
        }
        if (values.length > 0) {
            extractedData.value = Math.max(...values);
        }
    }

    // 3. Extract Date
    const dateRegex = /(\d{2}[/-]\d{2}[/-]\d{4})/;
    const dateMatch = text.match(dateRegex);
    if (dateMatch && dateMatch[1]) {
        const dateString = dateMatch[1].replace(/-/g, '/');
        const parsedDate = parse(dateString, 'dd/MM/yyyy', new Date());
        if (isValid(parsedDate)) {
             extractedData.date = format(parsedDate, 'yyyy-MM-dd');
        }
    }

    return extractedData;
};


const TravelExpenseProcessDialog = ({ expense, isOpen, onClose, onProcessed }) => {
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    const [formData, setFormData] = useState(null);
    const [currencyValue, setCurrencyValue] = useState('');

    useEffect(() => {
        if (expense) {
            setFormData({
                id: expense.id,
                expense_date: expense.expense_date,
                type: expense.type,
                value: expense.value,
                description: expense.description || '',
            });
            setCurrencyValue(formatCurrency(expense.value));
        } else {
            setFormData(null);
            setCurrencyValue('');
        }
    }, [expense]);

    const handleProcessAI = async () => {
        if (!expense?.receipt_url) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Nenhum comprovante encontrado para processar.' });
            return;
        }

        setIsProcessing(true);
        try {
            const { data: functionData, error: functionError } = await supabase.functions.invoke('process-receipt-vision', {
                body: { imageUrl: expense.receipt_url },
            });

            if (functionError) throw functionError;

            const { rawText } = functionData;
            const extractedData = parseExtractedText(rawText);
            
            const updatedFormData = {
                ...formData,
                expense_date: extractedData.date || formData.expense_date,
                value: extractedData.value !== null ? extractedData.value : formData.value,
                description: extractedData.description || formData.description,
            };

            setFormData(updatedFormData);
            setCurrencyValue(formatCurrency(updatedFormData.value));

            toast({ title: 'Processamento Concluído!', description: 'Os dados foram extraídos. Revise e salve as alterações.' });
        } catch (error) {
            console.error("Error processing with AI:", error);
            toast({ variant: 'destructive', title: 'Erro no Processamento', description: error.message });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSave = async () => {
        setIsProcessing(true);
        try {
            const payload = {
                ...formData,
                value: parseCurrency(currencyValue),
                ai_status: 'processed',
                ai_extracted_data: formData,
            };

            const { error } = await supabase
                .from('travel_expenses')
                .update(payload)
                .eq('id', expense.id);

            if (error) throw error;

            toast({ title: 'Sucesso!', description: 'Despesa atualizada com sucesso.' });
            onProcessed();
            onClose();
        } catch (error) {
            console.error("Error saving expense:", error);
            toast({ variant: 'destructive', title: 'Erro ao Salvar', description: error.message });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCurrencyChange = (e) => {
        const { value } = e.target;
        const numericValue = value.replace(/[^\d]/g, '');
        setCurrencyValue(formatCurrency(numericValue / 100));
    };

    if (!isOpen || !expense) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <DialogHeader>
                        <DialogTitle>Processar Despesa com IA</DialogTitle>
                        <DialogDescription>
                            Clique em "Analisar com IA" para extrair os dados do comprovante. Depois, revise e salve.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="expense_date">Data da Despesa</Label>
                            <Input
                                id="expense_date"
                                type="date"
                                value={formData?.expense_date || ''}
                                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type">Tipo</Label>
                            <Select value={formData?.type || ''} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                                <SelectTrigger><SelectValue placeholder="Selecione o tipo..." /></SelectTrigger>
                                <SelectContent>
                                    {EXPENSE_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="value">Valor</Label>
                            <Input
                                id="value"
                                value={currencyValue}
                                onChange={handleCurrencyChange}
                                placeholder="R$ 0,00"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Descrição</Label>
                            <Input
                                id="description"
                                value={formData?.description || ''}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button onClick={handleProcessAI} disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Analisar com IA
                        </Button>
                        <Button onClick={handleSave} disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Salvar
                        </Button>
                    </DialogFooter>
                </div>
                <div className="bg-muted rounded-lg flex items-center justify-center h-full min-h-[300px] md:min-h-0">
                    {expense.receipt_url ? (
                        <img src={expense.receipt_url} alt="Comprovante" className="max-w-full max-h-full object-contain rounded-md" />
                    ) : (
                        <p className="text-muted-foreground">Sem comprovante</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default TravelExpenseProcessDialog;