import React, { useCallback, useState, useEffect, useMemo } from 'react';
    import { Helmet } from 'react-helmet';
    import { motion } from 'framer-motion';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
    import { Calendar, Droplets, Briefcase, ClipboardCheck } from 'lucide-react';
    import AllocationCalendar from '@/components/operational/AllocationCalendar';
    import FuelControlTab from '@/components/operational/FuelControlTab';
    import JobsTab from '@/components/operational/JobsTab';
    import DailyReportsTab from '@/components/operational/DailyReportsTab';
    import { useData } from '@/contexts/DataContext';
    import useAppHandlers from '@/hooks/useAppHandlers';
    import { AppDialogs } from '@/config/dialogConfig';
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import FuelEntryForm from '@/components/operational/FuelEntryForm';
    import { useToast } from '@/components/ui/use-toast';
    import { useNavigate, useParams } from 'react-router-dom';


    const TABS = {
        jobs: 'Jobs (OS)',
        bde: 'BDEs',
        fuel: 'Controle de Combustível',
        allocation: 'Alocação de Equipamentos',
    };

    const OperationalPage = () => {
      const { refetchData, loading, ...data } = useData();
      const { toast } = useToast();
      const { handleFuelEntrySubmit } = useAppHandlers({refetchData});
      const navigate = useNavigate();
      const { tab = 'jobs' } = useParams();

      const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
      const [dialogState, setDialogState] = useState({ isAddEquipmentOpen: false });
      const [selectedEquipment, setSelectedEquipment] = useState(null);
      const [editingMaintenance, setEditingMaintenance] = useState(null);
      
      const allAssets = useMemo(() => data.equipments || [], [data.equipments]);

      useEffect(() => {
        if (!TABS[tab]) {
          navigate('/operational/jobs', { replace: true });
        }
      }, [tab, navigate]);

      const handlers = useAppHandlers({
        refetchData,
        dialogState,
        setDialogState,
        setSelectedEquipment,
        setEditingMaintenance,
        selectedEquipment,
        editingMaintenance,
      });

      const closeDialogs = (dialogName) => {
        setDialogState(prev => ({ ...prev, [dialogName]: false }));
      };
      
      const handleDataUpdate = useCallback(() => {
        refetchData();
      }, [refetchData]);
      
      const handleSaveFuelEntry = async (data) => {
        const result = await handleFuelEntrySubmit(data);
        if (result.success) {
          toast({ title: 'Sucesso!', description: 'Abastecimento registrado e KM/Horímetro atualizados.' });
          setIsFuelModalOpen(false);
          handleDataUpdate();
        }
      };

      if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <p>Carregando dados operacionais...</p>
            </div>
        );
      }
      
      const handleTabChange = (newTab) => {
        navigate(`/operational/${newTab}`);
      };

      return (
        <>
          <Helmet>
            <title>Operacional | BL Soluções</title>
            <meta name="description" content="Gerencie jobs, alocações de equipamentos e controle de combustível." />
          </Helmet>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Módulo Operacional</h1>
            </div>

            <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-card/80">
                <TabsTrigger value="jobs" className="text-white/70 data-[state=active]:text-white">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Jobs (OS)
                </TabsTrigger>
                <TabsTrigger value="bde" className="text-white/70 data-[state=active]:text-white">
                  <ClipboardCheck className="w-4 h-4 mr-2" />
                  BDEs
                </TabsTrigger>
                <TabsTrigger value="fuel" className="text-white/70 data-[state=active]:text-white">
                  <Droplets className="w-4 h-4 mr-2" />
                  Controle de Combustível
                </TabsTrigger>
                <TabsTrigger value="allocation" className="text-white/70 data-[state=active]:text-white">
                  <Calendar className="w-4 h-4 mr-2" />
                  Alocação de Equipamentos
                </TabsTrigger>
              </TabsList>
              <TabsContent value="jobs" className="mt-4">
                <JobsTab
                  operationalData={data.operationalData}
                  commercialData={data.commercialData}
                  allAssets={allAssets}
                  onUpdate={handleDataUpdate}
                />
              </TabsContent>
              <TabsContent value="bde" className="mt-4">
                <DailyReportsTab onUpdateNeeded={handleDataUpdate} />
              </TabsContent>
              <TabsContent value="fuel" className="mt-4">
                <FuelControlTab
                    fuelEntries={data.operationalData.fuelEntries}
                    equipments={data.equipments}
                    contacts={data.commercialData.contacts}
                    onNewEntry={() => setIsFuelModalOpen(true)}
                />
              </TabsContent>
              <TabsContent value="allocation" className="mt-4">
                 <AllocationCalendar 
                    jobs={data.operationalData.jobs}
                 />
              </TabsContent>
            </Tabs>
          </motion.div>
          <AppDialogs
            dialogState={dialogState}
            closeDialogs={closeDialogs}
            handlers={handlers}
            dialogData={{
              selectedEquipment,
              editingMaintenance,
              inventory: data.inventory,
            }}
          />
          <Dialog open={isFuelModalOpen} onOpenChange={setIsFuelModalOpen}>
            <DialogContent className="bg-slate-800 border-white/20 text-white max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Novo Registro de Abastecimento</DialogTitle>
                </DialogHeader>
                <FuelEntryForm
                    equipments={data.equipments}
                    contacts={data.commercialData.contacts}
                    onSave={handleSaveFuelEntry}
                    onClose={() => setIsFuelModalOpen(false)}
                />
            </DialogContent>
          </Dialog>
        </>
      );
    };

    export default OperationalPage;