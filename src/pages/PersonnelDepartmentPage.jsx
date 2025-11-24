import React from 'react';
    import { useParams, useNavigate } from 'react-router-dom';
    import { motion } from 'framer-motion';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
    import { Helmet } from 'react-helmet';
    import EmployeesTab from '@/components/personnel/EmployeesTab';
    import VacationsTab from '@/components/personnel/VacationsTab';
    import { useData } from '@/contexts/DataContext';
    import { Briefcase, Users, Calendar, BarChart2 } from 'lucide-react';

    const PersonnelDepartmentPage = () => {
        const { tab = 'employees' } = useParams();
        const navigate = useNavigate();
        const { commercialData, loading, refetchData, personnelData } = useData();

        const handleTabChange = (value) => {
            navigate(`/personnel/${value}`);
        };

        const pageTitle = "Departamento Pessoal | BL-Soluções";
        const pageDescription = "Gerencie colaboradores, férias e outras informações do departamento pessoal.";

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="p-4 sm:p-6 lg:p-8"
            >
                <Helmet>
                    <title>{pageTitle}</title>
                    <meta name="description" content={pageDescription} />
                </Helmet>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                    <div className="flex items-center space-x-3 mb-4 sm:mb-0">
                        <Briefcase className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">
                            Departamento Pessoal
                        </h1>
                    </div>
                </div>
                
                <p className="text-muted-foreground mb-8 max-w-2xl">
                    Centralize a gestão de seus colaboradores, controle férias, documentação e muito mais.
                </p>

                <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-grid md:grid-cols-4 lg:grid-cols-5 gap-2">
                        <TabsTrigger value="employees" className="flex items-center gap-2">
                            <Users className="h-4 w-4" /> Colaboradores
                        </TabsTrigger>
                        <TabsTrigger value="vacations" className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" /> Férias
                        </TabsTrigger>
                        <TabsTrigger value="payroll" className="flex items-center gap-2" disabled>
                           <BarChart2 className="h-4 w-4" /> Folha (em breve)
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="employees" className="mt-6">
                        <EmployeesTab 
                           initialContacts={commercialData?.contacts || []}
                           personnelData={personnelData}
                           loading={loading}
                           onUpdateNeeded={refetchData}
                        />
                    </TabsContent>
                    <TabsContent value="vacations" className="mt-6">
                        <VacationsTab />
                    </TabsContent>
                    <TabsContent value="payroll" className="mt-6">
                    </TabsContent>
                </Tabs>
            </motion.div>
        );
    };

    export default PersonnelDepartmentPage;