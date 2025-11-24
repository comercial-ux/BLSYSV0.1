import React from 'react';
    import { Helmet } from 'react-helmet';
    import { motion } from 'framer-motion';
    import { AlertTriangle, Users, Settings } from 'lucide-react';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

    const ContactsPage = () => {
        return (
            <>
                <Helmet>
                    <title>Cadastros | BL Soluções</title>
                    <meta name="description" content="Página de Cadastros" />
                </Helmet>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex justify-center items-start pt-10">
                    <Card className="w-full max-w-2xl bg-slate-800/60 border-white/20 text-center">
                        <CardHeader>
                            <div className="mx-auto bg-blue-500/10 p-4 rounded-full w-fit">
                                <Users className="w-12 h-12 text-blue-400" />
                            </div>
                            <CardTitle className="text-2xl font-bold pt-4">
                                Módulo de Cadastros Reorganizado
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pb-6">
                            <p className="text-lg text-gray-300">
                                Para uma melhor organização, os cadastros foram movidos para suas respectivas áreas:
                            </p>
                            <ul className="text-left list-disc list-inside mt-4 space-y-2 text-gray-400">
                                <li><strong>Clientes:</strong> Agora estão no módulo <span className="font-semibold text-primary">Comercial</span>.</li>
                                <li><strong>Fornecedores:</strong> Agora estão no módulo <span className="font-semibold text-primary">Suprimentos</span>.</li>
                                <li><strong>Colaboradores:</strong> Agora estão no módulo <span className="font-semibold text-primary">Departamento Pessoal</span>.</li>
                                <li><strong>Parâmetros:</strong> Agora estão no módulo <span className="font-semibold text-primary">Financeiro</span>.</li>
                            </ul>
                        </CardContent>
                    </Card>
                </motion.div>
            </>
        );
    };

    export default ContactsPage;