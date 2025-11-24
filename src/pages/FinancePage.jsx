import React from 'react';
    import { Helmet } from 'react-helmet';
    import { motion } from 'framer-motion';
    import { AlertTriangle, Settings } from 'lucide-react';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
    import ParametersTab from '@/components/contacts/ParametersTab';
    import { useData } from '@/contexts/DataContext';
    import { useParams, useNavigate } from 'react-router-dom';

    const FinancePage = () => {
        const { refetchData } = useData();
        const navigate = useNavigate();
        const { tab = 'overview' } = useParams();

        const handleTabChange = (newTab) => {
            navigate(`/finance/${newTab}`);
        };

        const renderFinanceDisabledMessage = () => (
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex justify-center items-start pt-10">
                <Card className="w-full max-w-xl bg-slate-800/60 border-white/20 text-center">
                    <CardHeader>
                        <div className="mx-auto bg-yellow-500/10 p-4 rounded-full w-fit">
                            <AlertTriangle className="w-12 h-12 text-yellow-400" />
                        </div>
                        <CardTitle className="text-2xl font-bold pt-4">
                            Módulo Financeiro Desabilitado
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-6">
                        <p className="text-lg text-gray-300">Achei melhor desligar esse módulo temporariamente para a fase de testes e aprovação do sistema.</p>
                        <p className="text-sm text-gray-400 mt-4">
                            As outras áreas, como Operacional, Comercial e Almoxarifado, continuam ativas para validação.
                        </p>
                    </CardContent>
                </Card>
            </motion.div>
        );

      return <>
                <Helmet>
                    <title>Financeiro | BL Soluções</title>
                    <meta name="description" content="Módulo Financeiro." />
                </Helmet>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold">Financeiro</h1>
                        <p className="text-muted-foreground">Gestão financeira e parâmetros do sistema.</p>
                    </div>

                    <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                            <TabsTrigger value="parameters"><Settings className="w-4 h-4 mr-2" />Parâmetros</TabsTrigger>
                        </TabsList>
                        <TabsContent value="overview" className="mt-4">
                            {renderFinanceDisabledMessage()}
                        </TabsContent>
                        <TabsContent value="parameters" className="mt-4">
                            <ParametersTab onUpdateNeeded={refetchData} />
                        </TabsContent>
                    </Tabs>
                </motion.div>
            </>;
    };
    export default FinancePage;