import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { PlusCircle, Edit, Trash2, ClipboardCheck, Loader2, Eye, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import BdeForm from '@/components/field/BdeForm';
import DailyReportFilters from './DailyReportFilters';
import { subDays, isWithinInterval, parseISO } from 'date-fns';
import MasterPasswordDialog from '@/components/admin/MasterPasswordDialog';

const DailyReportsTab = ({ onUpdateNeeded }) => {
    const { user } = useAuth();
    const { operationalData, commercialData, equipments, refetchData } = useData();
    const { jobs } = operationalData;
    const { contacts, dailyReports } = commercialData;

    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [isDeleting, setIsDeleting] = useState(null);
    const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false);
    const [photoToViewUrl, setPhotoToViewUrl] = useState('');
    const [reportToDelete, setReportToDelete] = useState(null);
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [filters, setFilters] = useState({
        client: '',
        status: '',
        dateRange: { from: undefined, to: undefined },
        quickRange: '7',
    });

    useEffect(() => {
        setLoading(dailyReports === null);
    }, [dailyReports]);

    const clientsWithProposals = useMemo(() => {
        if (!dailyReports || !contacts) return [];
        const clientIds = new Set();
        dailyReports.forEach(report => {
            if (report.job?.proposal?.contact_id) {
                clientIds.add(report.job.proposal.contact_id);
            } else if (report.proposal_id) { 
                const proposal = commercialData.proposals.find(p => p.id === report.proposal_id);
                if (proposal?.contact_id) {
                    clientIds.add(proposal.contact_id);
                }
            }
        });
        return contacts.filter(c => clientIds.has(c.id));
    }, [dailyReports, contacts, commercialData.proposals]);

    const getReportClientName = useCallback((report) => {
        if (report.job?.proposal?.contacts?.name) {
            return report.job.proposal.contacts.name;
        }
        const proposal = commercialData.proposals.find(p => p.id === report.proposal_id);
        return proposal?.contacts?.name || 'N/A';
    }, [commercialData.proposals]);
    

    const filteredReports = useMemo(() => {
        let reports = [...(dailyReports || [])];

        if (filters.client) {
            reports = reports.filter(r => {
                const proposal = commercialData.proposals.find(p => p.id === r.proposal_id);
                return proposal?.contact_id?.toString() === filters.client;
            });
        }

        if (filters.status) {
            const isApproved = filters.status === 'approved';
            reports = reports.filter(r => r.client_approved === isApproved);
        }

        const now = new Date();
        let dateRange = { from: filters.dateRange.from, to: filters.dateRange.to };

        if (filters.quickRange) {
            dateRange.from = subDays(now, parseInt(filters.quickRange, 10));
            dateRange.to = now;
        }

        if (dateRange.from) {
            reports = reports.filter(r => {
                const reportDate = parseISO(r.report_date);
                const toDate = dateRange.to || new Date(); 
                return isWithinInterval(reportDate, { start: dateRange.from, end: toDate });
            });
        }

        return reports.sort((a, b) => parseISO(b.report_date) - parseISO(a.report_date));
    }, [dailyReports, filters, commercialData.proposals]);

    const openModal = (report = null) => {
        setSelectedReport(report);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedReport(null);
        setIsModalOpen(false);
    };

    const handleSave = () => {
        refetchData();
        if (onUpdateNeeded) onUpdateNeeded();
        closeModal();
    };

    const promptDelete = (report) => {
        setReportToDelete(report);
        setIsPasswordDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!user || !reportToDelete) return;
        setIsDeleting(reportToDelete.id);
        const { error } = await supabase.from('daily_reports').delete().eq('id', reportToDelete.id);
        setIsDeleting(null);
        setIsPasswordDialogOpen(false);
        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao excluir BDE', description: error.message });
        } else {
            toast({ title: 'BDE excluído com sucesso!' });
            refetchData();
        }
        setReportToDelete(null);
    };

    const handleViewPhoto = (url) => {
        if (url) {
            setPhotoToViewUrl(url);
            setIsPhotoViewerOpen(true);
        } else {
            toast({ variant: 'default', title: 'Foto não disponível', description: 'Este BDE não possui uma foto anexada.' });
        }
    };

    const clearFilters = () => {
        setFilters({
            client: '',
            status: '',
            dateRange: { from: undefined, to: undefined },
            quickRange: null,
        });
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Boletins Diários de Equipamento (BDE)</CardTitle>
                            <CardDescription>Registre e gerencie os boletins diários de suas operações.</CardDescription>
                        </div>
                        <Button onClick={() => openModal()}><PlusCircle className="mr-2 h-4 w-4" /> Novo BDE</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <DailyReportFilters
                        filters={filters}
                        setFilters={setFilters}
                        clients={clientsWithProposals}
                        onClearFilters={clearFilters}
                    />
                    <ScrollArea className="h-[55vh]">
                        <div className="space-y-3 pr-4">
                            {loading ? (
                                <div className="text-center py-12 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin mr-2 text-primary" /><span>Carregando BDEs...</span></div>
                            ) : filteredReports.length > 0 ? (
                                filteredReports.map(report => (
                                    <div key={report.id} className="flex items-center justify-between p-4 bg-background border rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <ClipboardCheck className={`w-6 h-6 ${report.client_approved ? 'text-green-500' : 'text-yellow-500'}`} />
                                            <div>
                                                <p className="font-bold text-foreground">BDE #{report.report_number || report.id}</p>
                                                <p className="text-sm text-muted-foreground">Cliente: {getReportClientName(report)}</p>
                                                <p className="text-xs text-muted-foreground">Data: {new Date(report.report_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button size="icon" variant="ghost" onClick={() => handleViewPhoto(report.physical_copy_url)} title="Ver Foto">
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" onClick={() => openModal(report)} title="Editar"><Edit className="w-4 h-4" /></Button>
                                            <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => promptDelete(report)} title="Excluir" disabled={isDeleting === report.id}>
                                                {isDeleting === report.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12">
                                    <ClipboardCheck className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                                    <h3 className="text-xl font-semibold text-foreground">Nenhum BDE encontrado</h3>
                                    <p className="text-muted-foreground">Nenhum boletim corresponde aos filtros selecionados ou ainda não há registros.</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{selectedReport ? 'Editar' : 'Criar Novo'} BDE</DialogTitle>
                    </DialogHeader>
                    <BdeForm
                        report={selectedReport}
                        onSave={handleSave}
                        onClose={closeModal}
                        jobs={jobs}
                        contacts={contacts}
                        equipments={equipments}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={isPhotoViewerOpen} onOpenChange={setIsPhotoViewerOpen}>
                <DialogContent className="max-w-[90vw] md:max-w-[80vw] lg:max-w-[70vw] h-[90vh] flex flex-col p-2">
                    <DialogHeader className="flex-shrink-0">
                        <DialogTitle>Visualizador de Foto do BDE</DialogTitle>
                        <DialogClose asChild>
                           <Button variant="ghost" size="icon" className="absolute right-2 top-2"><X className="h-6 w-6" /></Button>
                        </DialogClose>
                    </DialogHeader>
                    <div className="flex-grow flex items-center justify-center overflow-hidden p-4">
                        <img src={photoToViewUrl} alt="Foto do BDE" className="max-w-full max-h-full object-contain" />
                    </div>
                </DialogContent>
            </Dialog>
            <MasterPasswordDialog
                isOpen={isPasswordDialogOpen}
                onClose={() => setIsPasswordDialogOpen(false)}
                onConfirm={handleDelete}
                isSubmitting={!!isDeleting}
                title="Confirmar Exclusão de BDE"
                description={`Tem certeza que deseja excluir o BDE #${reportToDelete?.report_number || reportToDelete?.id}?`}
            />
        </>
    );
};

export default DailyReportsTab;