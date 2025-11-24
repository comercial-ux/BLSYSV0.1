import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';

const FieldOpsLayout = ({ children, title }) => {
    const { signOut, user } = useAuth();

    return (
        <>
            <Helmet>
                <title>{title} | Portal do Colaborador</title>
            </Helmet>
            <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white flex flex-col">
                <header className="bg-slate-900/50 backdrop-blur-lg border-b border-white/10 sticky top-0 z-10">
                    <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img alt="BL Soluções Logo" className="h-10" src="https://horizons-cdn.hostinger.com/248eb4f3-2326-4fb0-87c9-c097668888f4/b607e9ce0015a361a9347a3be7e2a349.png" />
                            <span className="font-bold text-xl hidden sm:inline">Portal de Campo</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm hidden md:inline">Olá, {user?.full_name || user?.email}</span>
                            <Button onClick={signOut} variant="ghost" size="sm">
                                <LogOut className="w-4 h-4 md:mr-2" />
                                <span className="hidden md:inline">Sair</span>
                            </Button>
                        </div>
                    </div>
                </header>
                <main className="flex-grow container mx-auto px-2 sm:px-4 py-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
        </>
    );
};

export default FieldOpsLayout;