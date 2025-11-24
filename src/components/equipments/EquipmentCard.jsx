import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getMaintenanceStatus } from '@/lib/maintenanceHelper';
import { motion } from 'framer-motion';
import { Wrench, ClipboardCheck, Edit, HardHat } from 'lucide-react';

const EquipmentCard = ({ equipment, onMaintainClick, onChecklistClick, onEditClick, onPlanMaintenanceClick }) => {
  const { label, color } = getMaintenanceStatus(equipment);

  const badgeColorMap = {
    green: 'bg-green-500 hover:bg-green-600',
    yellow: 'bg-yellow-500 hover:bg-yellow-600',
    red: 'bg-red-500 hover:bg-red-600',
    gray: 'bg-gray-500 hover:bg-gray-600',
  };

  const cardClassName = `flex flex-col h-full bg-card/80 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-primary/20 transition-shadow duration-300 ${equipment.is_active === false ? 'opacity-60' : ''}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card className={cardClassName}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg font-bold text-primary">{equipment.name}</CardTitle>
            <Badge className={`text-white ${badgeColorMap[color]}`}>{label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{equipment.model}</p>
          {equipment.is_active === false && <Badge variant="destructive" className="mt-2 w-fit">INATIVO</Badge>}
        </CardHeader>
        <CardContent className="flex-grow space-y-2 text-sm">
          <p><span className="font-semibold">Nº de Série:</span> {equipment.serial_number || 'N/A'}</p>
          <p><span className="font-semibold">Placa:</span> {equipment.plate || 'N/A'}</p>
          <p><span className="font-semibold">Horas de Uso:</span> {equipment.current_hours || 0}h</p>
        </CardContent>
        <CardFooter className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={() => onMaintainClick(equipment)}>
            <Wrench className="mr-2 h-4 w-4" /> Manutenção
          </Button>
          <Button variant="outline" size="sm" onClick={() => onChecklistClick(equipment)}>
            <ClipboardCheck className="mr-2 h-4 w-4" /> Checklist
          </Button>
          <div className="col-span-2 flex gap-2">
            <Button className="flex-grow" size="sm" onClick={() => onPlanMaintenanceClick(equipment)}>
              <HardHat className="mr-2 h-4 w-4" /> Plano de Manutenção
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onEditClick(equipment)}>
              <Edit className="h-5 w-5 text-primary" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default EquipmentCard;