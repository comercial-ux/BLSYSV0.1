import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserManagement from '@/components/admin/UserManagement';
import PermissionsManagement from '@/components/admin/PermissionsManagement';
import CompanyDetailsManagement from '@/components/admin/CompanyDetailsManagement';
import NotificationTriggersManagement from '@/components/admin/NotificationTriggersManagement';
import { Users, ShieldCheck, Building, BellRing } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Helmet } from 'react-helmet';

const AdminPage = () => {
  const { companyDetails, refetchData } = useData();

  return (
    <>
      <Helmet>
        <title>Administrativo</title>
        <meta name="description" content="Gerencie usuários, permissões e detalhes da empresa." />
      </Helmet>
      <div className="p-4 md:p-6 lg:p-8">
        <h1 className="text-3xl font-bold mb-6 text-foreground">Administrativo</h1>
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Permissões
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <BellRing className="h-5 w-5" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="company" className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Dados da Empresa
            </TabsTrigger>
          </TabsList>
          <TabsContent value="users" className="mt-4">
            <UserManagement />
          </TabsContent>
          <TabsContent value="permissions" className="mt-4">
            <PermissionsManagement />
          </TabsContent>
           <TabsContent value="notifications" className="mt-4">
            <NotificationTriggersManagement />
          </TabsContent>
          <TabsContent value="company" className="mt-4">
            <CompanyDetailsManagement companyDetails={companyDetails} onUpdate={refetchData} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default AdminPage;