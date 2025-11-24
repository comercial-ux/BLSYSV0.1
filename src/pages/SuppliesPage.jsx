import React from 'react';
    import { useLocation, useNavigate } from 'react-router-dom';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
    import InventoryPage from '@/pages/InventoryPage';
    import PurchasesPage from '@/pages/PurchasesPage';
    import TertiaryServicesPage from '@/pages/TertiaryServicesPage';
    import ContactsTab from '@/components/contacts/ContactsTab';
    import { useData } from '@/contexts/DataContext';
    import { Package, ShoppingCart, Settings2, Shield, Archive, Wrench, Building } from 'lucide-react';

    const SuppliesPage = () => {
      const location = useLocation();
      const navigate = useNavigate();
      const { commercialData, loading, refetchData } = useData();
      const currentTabFromUrl = location.pathname.split('/')[2];

      const validTabs = ['suppliers', 'pecas', 'epi_cinta', 'consumiveis', 'ferramentas', 'tertiary-services', 'purchases'];
      const currentTab = validTabs.includes(currentTabFromUrl) ? currentTabFromUrl : 'suppliers';

      const handleTabChange = value => {
        navigate(`/supplies/${value}`);
      };

      return (
        <div className="h-full flex flex-col">
          <h1 className="text-3xl font-bold mb-6 text-white">Suprimentos e Compras</h1>
          <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full flex-grow flex flex-col">
            <TabsList className="grid w-full grid-cols-7 bg-gray-800/60 backdrop-blur-sm">
              <TabsTrigger value="suppliers" className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Fornecedores
              </TabsTrigger>
              <TabsTrigger value="pecas" className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Peças
              </TabsTrigger>
              <TabsTrigger value="epi_cinta" className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                EPI+Cintas
              </TabsTrigger>
              <TabsTrigger value="consumiveis" className="flex items-center gap-2">
                <Archive className="h-5 w-5" />
                Consumíveis
              </TabsTrigger>
              <TabsTrigger value="ferramentas" className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Ferramentas
              </TabsTrigger>
              <TabsTrigger value="tertiary-services" className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Serviços Terceirizados
              </TabsTrigger>
              <TabsTrigger value="purchases" className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Compras
              </TabsTrigger>
            </TabsList>
            <TabsContent value="suppliers" className="mt-4">
                <ContactsTab 
                  initialContacts={commercialData?.contacts || []}
                  loading={loading}
                  onUpdateNeeded={refetchData}
                  contactType="Fornecedor"
                  title="Fornecedores"
                />
              </TabsContent>
            <TabsContent value="pecas" className="flex-grow">
              <InventoryPage isTab={true} category="peca" title="Peças" />
            </TabsContent>
            <TabsContent value="epi_cinta" className="flex-grow">
              <InventoryPage isTab={true} category="epi_cinta" title="EPI+Cintas" />
            </TabsContent>
            <TabsContent value="consumiveis" className="flex-grow">
              <InventoryPage isTab={true} category="consumivel" title="Consumíveis" />
            </TabsContent>
            <TabsContent value="ferramentas" className="flex-grow">
              <InventoryPage isTab={true} category="ferramenta" title="Ferramentas" showLoanManagement={true} />
            </TabsContent>
            <TabsContent value="tertiary-services" className="flex-grow">
              <TertiaryServicesPage isTab={true} />
            </TabsContent>
            <TabsContent value="purchases" className="flex-grow">
              <PurchasesPage isTab={true} />
            </TabsContent>
          </Tabs>
        </div>
      );
    };

    export default SuppliesPage;