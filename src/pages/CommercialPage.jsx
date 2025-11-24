import React, { useEffect } from 'react';
    import { Helmet } from 'react-helmet';
    import { motion } from 'framer-motion';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
    import { FileText, HeartHandshake as Handshake, DraftingCompass, BarChart3, FileClock, Scale, FileSpreadsheet, DollarSign, User } from 'lucide-react';
    import ProposalsTab from '@/components/commercial/ProposalsTab';
    import ClausesTab from '@/components/commercial/ClausesTab';
    import CommercialItemsManagement from '@/components/commercial/CommercialItemsManagement';
    import ProspectingTab from '@/components/commercial/ProspectingTab';
    import DailyReportsTab from '@/components/commercial/DailyReportsTab';
    import MeasurementsTab from '@/components/commercial/MeasurementsTab';
    import BillingTab from '@/components/commercial/BillingTab';
    import PriceFormationTab from '@/components/commercial/PriceFormationTab';
    import ContactsTab from '@/components/contacts/ContactsTab';
    import { useData } from '@/contexts/DataContext';
    import { useNavigate, useParams } from 'react-router-dom';

    const TABS_CONFIG = {
      clients: { icon: User, label: 'Clientes' },
      prospecting: { icon: Handshake, label: 'Prospecção' },
      'price-formation': { icon: FileSpreadsheet, label: 'Formação de Preço' },
      proposals: { icon: FileText, label: 'Propostas' },
      items: { icon: DraftingCompass, label: 'Itens de Serviço' },
      clauses: { icon: BarChart3, label: 'Cláusulas' },
      'daily-reports': { icon: FileClock, label: 'BDEs' },
      measurements: { icon: Scale, label: 'Medição' },
      billing: { icon: DollarSign, label: 'Faturamento' },
    };

    const CommercialPage = () => {
      const { refetchData, commercialData, loading } = useData();
      const navigate = useNavigate();
      const { tab = 'clients' } = useParams();

      useEffect(() => {
        if (!TABS_CONFIG[tab]) {
          navigate('/commercial/clients', { replace: true });
        }
      }, [tab, navigate]);

      const handleTabChange = (newTab) => {
        navigate(`/commercial/${newTab}`);
      };

      return (
        <>
          <Helmet>
            <title>Comercial | BL Soluções</title>
            <meta name="description" content="Gerencie propostas, contatos e itens comerciais." />
          </Helmet>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Módulo Comercial</h1>
            </div>

            <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-9 bg-card/80">
                {Object.entries(TABS_CONFIG).map(([key, { icon: Icon, label }]) => (
                  <TabsTrigger key={key} value={key} className="text-white/70 data-[state=active]:text-white">
                    <Icon className="w-4 h-4 mr-2" />
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value="clients" className="mt-4">
                <ContactsTab 
                  initialContacts={commercialData?.contacts || []}
                  loading={loading}
                  onUpdateNeeded={refetchData}
                  contactType="Cliente"
                  title="Clientes"
                />
              </TabsContent>
              <TabsContent value="prospecting" className="mt-4">
                <ProspectingTab onUpdateNeeded={refetchData} />
              </TabsContent>
              <TabsContent value="price-formation" className="mt-4">
                <PriceFormationTab onUpdateNeeded={refetchData} />
              </TabsContent>
              <TabsContent value="proposals" className="mt-4">
                <ProposalsTab onUpdateNeeded={refetchData} />
              </TabsContent>
              <TabsContent value="items" className="mt-4">
                <CommercialItemsManagement onUpdateNeeded={refetchData} />
              </TabsContent>
              <TabsContent value="clauses" className="mt-4">
                <ClausesTab clauses={commercialData.clauses} onUpdateNeeded={refetchData} />
              </TabsContent>
              <TabsContent value="daily-reports" className="mt-4">
                <DailyReportsTab onUpdateNeeded={refetchData} />
              </TabsContent>
              <TabsContent value="measurements" className="mt-4">
                <MeasurementsTab onUpdateNeeded={refetchData} />
              </TabsContent>
              <TabsContent value="billing" className="mt-4">
                <BillingTab />
              </TabsContent>
            </Tabs>
          </motion.div>
        </>
      );
    };

    export default CommercialPage;