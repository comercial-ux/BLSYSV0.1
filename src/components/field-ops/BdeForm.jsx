import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DialogFooter } from '@/components/ui/dialog';
import { Save, Loader2, Camera, CheckCircle, UploadCloud } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import useAppHandlers from '@/hooks/useAppHandlers';

const getInitialFormData = () => ({
    report_number: '',
    job_id: '',
    proposal_id: '',
    operator_id: '',
    operator_name: '',
    equipment_id: '',
    job_site: '',
    report_date: new Date().toISOString().slice(0, 10),
    start_time: '',
    lunch_start_time: '',
    lunch_end_time: '',
    end_time: '',
    downtime_hours: null,
    notes_downtime: '',
    physical_copy_url: '',
});

const ImageInput = ({ label, onChange, fileName, isRequired, isMobile = false }) => (
    <div>
        <Label className="flex items-center">
            {label}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <label htmlFor={label} className="relative mt-1 flex justify-center w-full h-32 px-6 pt-5 pb-6 border-2 border-white/20 border-dashed rounded-md cursor-pointer hover:bg-white/5 transition-colors">
            <div className="space-y-1 text-center">
                {isMobile ? <Camera className="mx-auto h-12 w-12 text-gray-400" /> : <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />}
                <div className="flex text-sm text-gray-400">
                    <p className="pl-1 truncate max-w-[150px]">{fileName ? fileName : (isMobile ? "Tire uma foto" : "Selecione a foto")}</p>
                </div>
            </div>
            {fileName && <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-green-500 bg-slate-800 rounded-full" />}
            <input id={label} name={label} type="file" className="sr-only" accept="image/*" capture={isMobile ? "environment" : undefined} onChange={onChange} />
        </label>
    </div>
);

const BdeForm = ({ report, onSave, onClose, jobs, contacts, equipments, isMobile = false }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState(getInitialFormData());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bdePhoto, setBdePhoto] = useState(null);
    const { uploadImages } = useAppHandlers({});

    const openJobs = useMemo(() => {
        if (!jobs || !Array.isArray(jobs)) return [];
        
        return jobs.filter(job => {
            const hasValidStatus = job.status === 'in_progress' || job.status === 'pending';
            const hasProposal = job.proposal && job.proposal.id;
            const hasClient = job.proposal && job.proposal.contacts && job.proposal.contacts.name;
            
            return hasValidStatus && hasProposal && hasClient;
        });
    }, [jobs]);
    const operators = useMemo(() => (contacts || []).filter(c => c.type === 'Colaborador'), [contacts]);

    useEffect(() => {
        if (report) {
            setFormData({
                ...getInitialFormData(),
                ...report,
                report_date: report.report_date ? new Date(report.report_date).toISOString().slice(0, 10) : getInitialFormData().report_date,
                downtime_hours: report.downtime_hours || '',
            });
        } else {
            setFormData(getInitialFormData());
        }
    }, [report]);

    const handleJobChange = (jobId) => {
        const selectedJob = openJobs.find(j => j.id.toString() === jobId);
        if (selectedJob) {
            const operator = operators.find(op => op.id === selectedJob.operator_id);
            setFormData(prev => ({
                ...prev,
                job_id: jobId,
                proposal_id: selectedJob.proposal?.id || '',
                equipment_id: selectedJob.primary_equipment_id || '',
                operator_id: selectedJob.operator_id || '',
                operator_name: operator ? operator.name : '',
                job_site: selectedJob.job_site_details?.address || '',
            }));
        } else {
            setFormData(prev => ({ ...prev, job_id: '', proposal_id: '' }));
        }
    };

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        let processedValue = value;
        if (type === 'number') {
            processedValue = value.replace(',', '.');
        }
        setFormData(prev => ({ ...prev, [name]: processedValue }));
    };

    const handleSelectChange = (name, value) => {
        if (name === 'operator_id') {
            const selectedOperator = operators.find(op => op.id.toString() === value);
            setFormData(prev => ({
                ...prev,
                operator_id: value,
                operator_name: selectedOperator ? selectedOperator.name : ''
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (setter) => (e) => {
        if (e.target.files && e.target.files[0]) {
            setter(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            toast({ variant: 'destructive', title: 'Erro de Autenticação' });
            return;
        }
        if (!formData.proposal_id) {
            toast({ variant: 'destructive', title: 'Job Inválido', description: 'Por favor, selecione um job que tenha uma proposta associada.' });
            return;
        }
        if (!formData.operator_name) {
            toast({ variant: 'destructive', title: 'Operador Inválido', description: 'Por favor, selecione um operador válido.' });
            return;
        }
        if (isMobile && !bdePhoto && !report?.physical_copy_url) {
            toast({ variant: 'destructive', title: 'Foto Obrigatória', description: 'Por favor, anexe a foto do BDE físico.' });
            return;
        }
        setIsSubmitting(true);

        try {
            let photoUrl = report?.physical_copy_url || '';
            if (bdePhoto) {
                const urls = await uploadImages([bdePhoto], 'daily-reports', `bde_physical_copy`);
                if (urls && urls.length > 0) {
                    photoUrl = urls[0];
                }
            }

            const dataToSubmit = {
                ...formData,
                user_id: user.id,
                downtime_hours: formData.downtime_hours ? parseFloat(formData.downtime_hours) : null,
                start_time: formData.start_time || null,
                lunch_start_time: formData.lunch_start_time || null,
                lunch_end_time: formData.lunch_end_time || null,
                end_time: formData.end_time || null,
                physical_copy_url: photoUrl,
            };
            
            const relatedObjects = ['job', 'equipment', 'operator', 'proposal', 'proposals', 'contacts'];
            relatedObjects.forEach(key => delete dataToSubmit[key]);
    
            let error;
            if (report) {
                const { error: updateError } = await supabase
                    .from('daily_reports')
                    .update(dataToSubmit)
                    .eq('id', report.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('daily_reports')
                    .insert([dataToSubmit]);
                error = insertError;
            }

            if (error) throw error;

            toast({ title: `BDE ${report ? 'atualizado' : 'criado'} com sucesso!` });
            onSave();

        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao salvar BDE', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const formContent = (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <Label>Nº do BDE (Físico)</Label>
                    <Input name="report_number" value={formData.report_number || ''} onChange={handleChange} className="bg-white/10 mt-1" />
                </div>
                <div className="md:col-span-2">
                    <Label>Job (OS)</Label>
                    <Select value={(formData.job_id || '').toString()} onValueChange={handleJobChange}>
                        <SelectTrigger className="w-full mt-1 bg-white/10 border-white/20 text-white"><SelectValue placeholder="Selecione o Job..." /></SelectTrigger>
                        <SelectContent>
                            {openJobs.map(j => (
                                <SelectItem key={j.id} value={j.id.toString()}>Job #{j.job_code} - {j.proposal.contacts.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label>Operador</Label>
                    <Select value={(formData.operator_id || '').toString()} onValueChange={(v) => handleSelectChange('operator_id', v)}>
                        <SelectTrigger className="w-full mt-1 bg-white/10 border-white/20 text-white"><SelectValue placeholder="Selecione o operador..." /></SelectTrigger>
                        <SelectContent>
                            {operators.map(op => (
                                <SelectItem key={op.id} value={op.id.toString()}>{op.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label>Equipamento</Label>
                    <Select value={(formData.equipment_id || '').toString()} onValueChange={(v) => handleSelectChange('equipment_id', v)}>
                        <SelectTrigger className="w-full mt-1 bg-white/10 border-white/20 text-white"><SelectValue placeholder="Selecione o equipamento..." /></SelectTrigger>
                        <SelectContent>
                            {(equipments || []).map(eq => (
                                <SelectItem key={eq.id} value={eq.id.toString()}>{eq.name} ({eq.plate || 'S/ Placa'})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div>
                <Label>Local do Serviço</Label>
                <Input name="job_site" value={formData.job_site || ''} onChange={handleChange} className="bg-white/10 mt-1" />
            </div>

            <div className="p-4 border rounded-lg border-white/10 space-y-4">
                <h3 className="text-lg font-semibold text-primary">Horários</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                        <Label>Data</Label>
                        <Input type="date" name="report_date" value={formData.report_date} onChange={handleChange} className="bg-white/10 mt-1" required />
                    </div>
                    <div>
                        <Label>Início</Label>
                        <Input type="time" name="start_time" value={formData.start_time || ''} onChange={handleChange} className="bg-white/10 mt-1" />
                    </div>
                    <div>
                        <Label>Início Almoço</Label>
                        <Input type="time" name="lunch_start_time" value={formData.lunch_start_time || ''} onChange={handleChange} className="bg-white/10 mt-1" />
                    </div>
                    <div>
                        <Label>Fim Almoço</Label>
                        <Input type="time" name="lunch_end_time" value={formData.lunch_end_time || ''} onChange={handleChange} className="bg-white/10 mt-1" />
                    </div>
                    <div>
                        <Label>Fim</Label>
                        <Input type="time" name="end_time" value={formData.end_time || ''} onChange={handleChange} className="bg-white/10 mt-1" />
                    </div>
                </div>
            </div>

            <div className="p-4 border rounded-lg border-white/10 space-y-4">
                <h3 className="text-lg font-semibold text-primary">Horas Indisponíveis</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                        <Label>Total de Horas</Label>
                        <Input type="number" step="0.1" name="downtime_hours" value={formData.downtime_hours || ''} onChange={handleChange} className="bg-white/10 mt-1" placeholder="Ex: 2.5" />
                    </div>
                    <div className="md:col-span-2">
                        <Label>Motivo / Observações</Label>
                        <Input name="notes_downtime" value={formData.notes_downtime || ''} onChange={handleChange} className="bg-white/10 mt-1" />
                    </div>
                </div>
            </div>

            <div className="p-4 border rounded-lg border-white/10">
                <ImageInput
                    label="Foto do BDE Físico"
                    onChange={handleFileChange(setBdePhoto)}
                    fileName={bdePhoto?.name || (report?.physical_copy_url ? 'Foto existente' : '')}
                    isRequired={isMobile}
                    isMobile={isMobile}
                />
            </div>
        </div>
    );

    if (isMobile) {
        return (
            <form onSubmit={handleSubmit} className="p-4 space-y-6">
                {formContent}
                <Button type="submit" className="w-full !h-12 text-lg" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Save className="mr-2 w-5 h-5" />}
                    Salvar BDE
                </Button>
            </form>
        );
    }

    return (
        <form onSubmit={handleSubmit}>
            <ScrollArea className="h-[70vh] pr-6">
                {formContent}
            </ScrollArea>
            <DialogFooter className="pt-6">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 w-4 h-4" />Salvar BDE
                </Button>
            </DialogFooter>
        </form>
    );
};

export default BdeForm;