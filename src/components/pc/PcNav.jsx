import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';

const PcNav = () => {
    const navigate = useNavigate();

    const navItems = [
        {
            label: 'Registrar Entrada de Peças',
            icon: <ArrowDownToLine className="w-8 h-8 mb-2" />,
            path: '/pc/entry',
            color: 'from-green-500 to-emerald-600'
        },
        {
            label: 'Registrar Saída de Peças',
            icon: <ArrowUpFromLine className="w-8 h-8 mb-2" />,
            path: '/pc/dispatch',
            color: 'from-orange-500 to-amber-600'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
            {navItems.map((item, index) => (
                <motion.div
                    key={item.path}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                    <Button
                        onClick={() => navigate(item.path)}
                        className={`w-full h-40 flex flex-col justify-center items-center text-white text-lg font-semibold rounded-xl shadow-lg bg-gradient-to-br ${item.color} hover:scale-105 transition-transform duration-300`}
                    >
                        {item.icon}
                        {item.label}
                    </Button>
                </motion.div>
            ))}
        </div>
    );
};

export default PcNav;