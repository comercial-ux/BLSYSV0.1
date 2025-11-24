import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Wrench, Printer, Loader2, CheckCircle, Eye } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const MaintenanceCard = ({ maintenance, onEdit, onDelete, onFinish, onPrint, onPreview, equipments, isDeleting, isFinishing, isPrinting, printWithPhotos, setPrintWithPhotos }) => {
  const equipment = equipments.find(e => e.id === maintenance.equipment_id);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Em Andamento':
        return <Badge variant="secondary" className="bg-yellow-400 text-black">Em Andamento</Badge>;
      case 'Finalizada':
        return <Badge variant="secondary" className="bg-green-500 text-white">Finalizada</Badge>;
      case 'Cancelada':
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-primary" />
                Manutenção #{maintenance.id} - {equipment?.name || 'Equipamento não encontrado'}
              </CardTitle>
              <CardDescription>
                Data: {new Date(maintenance.created_at).toLocaleDateString()} | Tipo: {maintenance.type}
              </CardDescription>
            </div>
            {getStatusBadge(maintenance.status)}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{maintenance.description}</p>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {maintenance.status === 'Em Andamento' && (
              <Button variant="outline" size="sm" onClick={() => onFinish(maintenance)} disabled={isFinishing}>
                {isFinishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                Finalizar
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => onPreview(maintenance)} disabled={isDeleting || isFinishing}>
              <Eye className="mr-2 h-4 w-4" /> Visualizar
            </Button>
            <Button variant="outline" size="sm" onClick={() => onEdit(maintenance)} disabled={isDeleting || isFinishing}>
              <Edit className="mr-2 h-4 w-4" /> Editar
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => onPrint(maintenance)} disabled={isPrinting}>
                {isPrinting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                Imprimir
              </Button>
              <div className="flex items-center space-x-2">
                <Checkbox id={`print-photos-${maintenance.id}`} checked={printWithPhotos} onCheckedChange={setPrintWithPhotos} />
                <Label htmlFor={`print-photos-${maintenance.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Incluir Fotos
                </Label>
              </div>
            </div>
            <Button variant="destructive" size="sm" onClick={onDelete} disabled={isDeleting || isFinishing}>
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Inativar
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MaintenanceCard;