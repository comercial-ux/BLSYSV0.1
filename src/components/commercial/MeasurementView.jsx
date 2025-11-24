import React, { useState, useRef, useEffect, useCallback } from 'react';
    import { useReactToPrint } from 'react-to-print';
    import { Button } from '@/components/ui/button';
    import { Printer, XCircle, Edit, Save, Loader2 } from 'lucide-react';
    import MeasurementPrintLayout from './MeasurementPrintLayout';
    import { useData } from '@/contexts/DataContext';
    import { supabase } from '@/lib/customSupabaseClient';
    import { toast } from '@/components/ui/use-toast';
    import { recalculateTotals } from './measurement/measurementUtils';
    import { ScrollArea } from '@/components/ui/scroll-area';

    const MeasurementView = ({ measurement, onClose, onUpdateNeeded }) => {
        const { companyDetails, refetchData } = useData();
        const componentRef = useRef();
        
        const handlePrint = useReactToPrint({
            content: () => componentRef.current,
            documentTitle: `Medicao_${measurement.id}`,
        });

        return (
            <div className="p-1 sm:p-4 bg-background rounded-lg shadow-lg text-foreground max-h-[90vh] flex flex-col">
                <div className="flex justify-end gap-2 mb-4 print:hidden">
                    <Button onClick={handlePrint} className="flex items-center gap-2">
                        <Printer className="h-4 w-4" /> Imprimir / PDF
                    </Button>
                     <Button variant="ghost" onClick={onClose} className="flex items-center gap-2 text-destructive-foreground bg-destructive hover:bg-destructive/90">
                        <XCircle className="h-4 w-4" /> Fechar
                    </Button>
                </div>
                 <ScrollArea className="flex-grow pr-4 bg-white">
                    <MeasurementPrintLayout 
                        ref={componentRef} 
                        measurement={measurement} 
                        companyDetails={companyDetails}
                    />
                </ScrollArea>
            </div>
        );
    };

    export default MeasurementView;