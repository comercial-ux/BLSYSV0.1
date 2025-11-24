import React from 'react';
import { NavLink } from 'react-router-dom';
import { ClipboardList, Fuel, ListChecks } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const NavItem = ({ to, icon, title, description }) => {
    const baseClasses = "flex items-center gap-4 p-4 rounded-lg transition-all duration-300 transform hover:scale-105";
    const activeClasses = "bg-gradient-to-r from-emerald-500 to-cyan-600 shadow-lg";
    const inactiveClasses = "bg-slate-800/80 hover:bg-slate-700/80 border border-white/10";

    return (
        <NavLink to={to} className={({ isActive }) => `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
            <div className="p-3 bg-black/20 rounded-lg">
                {icon}
            </div>
            <div>
                <h3 className="font-bold text-lg text-white">{title}</h3>
                <p className="text-sm text-gray-300">{description}</p>
            </div>
        </NavLink>
    );
};

const FieldOpsNav = () => {
    return (
        <div className="max-w-md mx-auto">
            <Card className="bg-transparent border-none">
                <CardContent className="p-0">
                    <div className="space-y-4">
                        <NavItem
                            to="/field/bde"
                            icon={<ClipboardList className="w-8 h-8 text-emerald-400" />}
                            title="Boletim Diário (BDE)"
                            description="Preencha o relatório diário do equipamento."
                        />
                        <NavItem
                            to="/field/fuel"
                            icon={<Fuel className="w-8 h-8 text-cyan-400" />}
                            title="Abastecimento"
                            description="Registre um novo abastecimento de veículo."
                        />
                        <NavItem
                            to="/field/checklist"
                            icon={<ListChecks className="w-8 h-8 text-purple-400" />}
                            title="Checklist de Inspeção"
                            description="Realize a inspeção de segurança do equipamento."
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default FieldOpsNav;