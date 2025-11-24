import React from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { Helmet } from 'react-helmet';

const FieldLayout = ({ children, title }) => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate('/field/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white p-4 flex flex-col items-center">
            <Helmet>
                <title>{title} | Acesso de Campo</title>
                <meta name="description" content={`Interface de acesso de campo para ${title}.`} />
            </Helmet>
            <header className="w-full max-w-2xl flex justify-between items-center mb-6">
                <div className="text-left">
                    <h1 className="text-xl font-bold text-emerald-400">Acesso de Campo</h1>
                    {user && <p className="text-sm text-gray-400">Operador: {user.user_metadata?.full_name || user.email}</p>}
                </div>
                <Button onClick={handleSignOut} variant="ghost" size="sm" className="text-red-400 hover:bg-red-900/50 hover:text-red-300">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                </Button>
            </header>
            <main className="w-full max-w-2xl">
                {children}
            </main>
        </div>
    );
};

export default FieldLayout;