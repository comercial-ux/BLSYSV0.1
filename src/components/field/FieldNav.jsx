import React from 'react';
    import { useNavigate } from 'react-router-dom';
    import { Button } from '@/components/ui/button';
    import { ClipboardCheck, Droplets, ListChecks, PlaneTakeoff } from 'lucide-react';

    const FieldNav = () => {
        const navigate = useNavigate();

        const navItems = [
            { label: 'Lançar BDE', icon: ClipboardCheck, path: '/field/bde' },
            { label: 'Lançar Abastecimento', icon: Droplets, path: '/field/fuel' },
            { label: 'Lançar Checklist', icon: ListChecks, path: '/field/checklist' },
            { label: 'Lançar Despesa de Viagem', icon: PlaneTakeoff, path: '/despesadeviagem' },
        ];

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                {navItems.map((item) => (
                    <Button
                        key={item.label}
                        onClick={() => navigate(item.path)}
                        className="h-24 text-lg flex flex-col items-center justify-center gap-2 bg-slate-700/80 hover:bg-slate-600/80 border border-white/20"
                    >
                        <item.icon className="w-8 h-8 mb-1" />
                        {item.label}
                    </Button>
                ))}
            </div>
        );
    };

    export default FieldNav;