
import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button } from '@/components/ui/button';
import { Printer, XCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import MeasurementGroupPrintLayout from './MeasurementGroupPrintLayout';
import { useData } from '@/contexts/DataContext';

const MeasurementGroupView = ({ group, onClose }) => {
    const { companyDetails } = useData();
    const componentRef = useRef();
    
    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        documentTitle: `Agrupamento_${group.name.replace(/\s+/g, '_')}`,
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
                <MeasurementGroupPrintLayout 
                    ref={componentRef} 
                    group={group} 
                    companyDetails={companyDetails}
                />
            </ScrollArea>
        </div>
    );
};

export default MeasurementGroupView;
