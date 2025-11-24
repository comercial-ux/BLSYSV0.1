import React, { useMemo } from 'react';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Combobox } from '@/components/ui/combobox';
    import { Loader2, Calculator } from 'lucide-react';

    const MeasurementHeader = ({ formData, setFormData, jobs, handleJobChange, handleProcessBDEs, isProcessing }) => {
        
        const jobOptions = useMemo(() => (jobs || []).map(j => ({
            value: j.id.toString(),
            label: `#${j.job_code} - ${j.proposal?.contacts?.name}`
        })), [jobs]);

        return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-4 border rounded-lg bg-muted/50">
                <div>
                    <Label>Job (Ordem de Serviço)</Label>
                    <Combobox
                        options={jobOptions}
                        value={formData.job_id?.toString() || ''}
                        onChange={handleJobChange}
                        placeholder="Selecione um Job"
                        searchPlaceholder="Buscar Job..."
                        emptyText="Nenhum job encontrado."
                    />
                </div>
                <div>
                    <Label>Data de Início</Label>
                    <Input type="date" name="start_date" value={formData.start_date} onChange={(e) => setFormData(f => ({ ...f, start_date: e.target.value }))} className="mt-1" required />
                </div>
                <div>
                    <Label>Data de Fim</Label>
                    <Input type="date" name="end_date" value={formData.end_date} onChange={(e) => setFormData(f => ({ ...f, end_date: e.target.value }))} className="mt-1" required />
                </div>
                <Button type="button" onClick={handleProcessBDEs} disabled={isProcessing || !formData.job_id || !formData.start_date || !formData.end_date}>
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calculator className="mr-2 h-4 w-4" />}
                    Processar BDEs
                </Button>
            </div>
        );
    };

    export default MeasurementHeader;