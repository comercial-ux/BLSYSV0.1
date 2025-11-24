import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, MapPin, Gauge, Route } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

const StatusIndicator = ({ status }) => {
    let bgColor, title;
    switch (status) {
        case 'working':
            bgColor = 'bg-green-500';
            title = 'Trabalhando';
            break;
        case 'available':
            bgColor = 'bg-yellow-500';
            title = 'Disponível';
            break;
        case 'unavailable':
            bgColor = 'bg-red-500';
            title = 'Indisponível';
            break;
        default:
            bgColor = 'bg-gray-500';
            title = 'Desconhecido';
            break;
    }
    return (
        <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${bgColor}`} title={title}></div>
            <span className="capitalize">{title}</span>
        </div>
    );
};

const EquipmentStatusTable = ({ equipments }) => {
    const scrollContainerRef = useRef(null);

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const { current } = scrollContainerRef;
            const scrollAmount = direction === 'left' ? -current.offsetWidth : current.offsetWidth;
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    if (equipments.length === 0) {
        return null;
    }

    return (
        <Card className="bg-slate-800/60 border-white/20">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-2xl font-bold text-white">Visão Geral dos Equipamentos</CardTitle>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => scroll('left')} className="bg-white/10 hover:bg-white/20 border-white/20 h-8 w-8">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => scroll('right')} className="bg-white/10 hover:bg-white/20 border-white/20 h-8 w-8">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="w-full whitespace-nowrap">
                     <div className="flex w-max space-x-4 pb-4" ref={scrollContainerRef}>
                        {equipments.map((equipment, index) => (
                            <motion.div
                                key={equipment.id}
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                className="w-80"
                            >
                                <div className="p-4 bg-white/5 rounded-lg h-full flex flex-col justify-between">
                                    <div>
                                        <p className="font-bold text-white truncate">{equipment.name}</p>
                                        <p className="text-sm text-blue-200 mb-3">{equipment.model}</p>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-300">Status:</span>
                                            <StatusIndicator status={equipment.status} />
                                        </div>
                                        <div className="text-gray-300">
                                            <div className="flex items-center gap-2 mb-1">
                                                <MapPin className="w-4 h-4 text-purple-400" />
                                                <span className="truncate">{equipment.location}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Gauge className="w-4 h-4 text-blue-400" />
                                                    <span>{equipment.current_hours || 0}h</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Route className="w-4 h-4 text-green-400" />
                                                    <span>{equipment.current_km || 0}km</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </CardContent>
        </Card>
    );
};

export default EquipmentStatusTable;