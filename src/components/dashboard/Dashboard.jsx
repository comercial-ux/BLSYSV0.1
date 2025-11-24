import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Wrench, CheckCircle, FileWarning } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { getMaintenanceStatus } from '@/lib/maintenanceHelper';
import EquipmentStatusTable from './EquipmentStatusTable';
import { differenceInDays, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const Dashboard = ({ data }) => {
  const { 
    equipments = [], 
    documentabl = { documents: [], versions: [] } 
  } = data || {};

  const preventiveMaintenances = useMemo(() => 
    equipments
      .map(eq => ({ ...eq, statusInfo: getMaintenanceStatus(eq) }))
      .filter(eq => eq.statusInfo.status !== 'ok' && eq.statusInfo.status !== 'pending')
      .sort((a, b) => a.statusInfo.hoursUntil - b.statusInfo.hoursUntil)
      .slice(0, 5),
    [equipments]
  );

  const upcomingDocuments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return documentabl.documents
      .filter(doc => doc.current_version && doc.current_version.expiry_date)
      .map(doc => {
        const expiryDate = parseISO(doc.current_version.expiry_date);
        const daysUntilExpiry = differenceInDays(expiryDate, today);
        return {
          ...doc,
          daysUntilExpiry,
          status: daysUntilExpiry < 0 ? 'vencido' : (daysUntilExpiry <= 30 ? 'proximo_vencimento' : 'valido')
        };
      })
      .filter(doc => doc.status === 'proximo_vencimento' || doc.status === 'vencido')
      .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
      .slice(0, 5);
  }, [documentabl.documents]);

  const getDaysText = (days) => {
    if (days < 0) return `${Math.abs(days)} dia(s) atrasado`;
    if (days === 0) return 'Vence hoje';
    return `Vence em ${days} dia(s)`;
  };

  return (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 gap-8">
            <EquipmentStatusTable equipments={equipments} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <section>
                  <h2 className="text-2xl font-bold text-white mb-4">
                  <Wrench className="inline-block mr-2 text-yellow-400" />
                  Manutenções Preventivas Próximas
                  </h2>
                  <div className="space-y-4">
                  {preventiveMaintenances.length > 0 ? (
                      preventiveMaintenances.map(equipment => (
                      <Card key={equipment.id} className="p-4">
                          <div className="flex justify-between items-center">
                          <div>
                              <p className="font-bold text-white">{equipment.name}</p>
                              <p className="text-sm text-blue-200">{equipment.model}</p>
                          </div>
                          <div className="text-right">
                              <p className={`font-bold ${equipment.statusInfo.status === 'overdue' ? 'text-red-400' : 'text-orange-400'}`}>
                              {equipment.statusInfo.status === 'overdue' 
                                  ? `${Math.abs(equipment.statusInfo.hoursUntil)}h atrasado`
                                  : `${equipment.statusInfo.hoursUntil}h restantes`}
                              </p>
                              <p className="text-xs text-gray-400">Próxima em {equipment.statusInfo.nextMaintenanceHours}h</p>
                          </div>
                          </div>
                      </Card>
                      ))
                  ) : (
                      <Card className="p-6 text-center">
                          <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
                          <p className="text-gray-300">Nenhuma manutenção preventiva pendente.</p>
                      </Card>
                  )}
                  </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">
                  <FileWarning className="inline-block mr-2 text-orange-400" />
                  Documentação a Vencer
                </h2>
                <div className="space-y-4">
                  {upcomingDocuments.length > 0 ? (
                    upcomingDocuments.map(doc => (
                      <Card key={doc.id} className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-bold text-white">{doc.name}</p>
                            <Badge variant="secondary" className="capitalize">{doc.main_category}</Badge>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${doc.status === 'vencido' ? 'text-red-400' : 'text-orange-400'}`}>
                              {getDaysText(doc.daysUntilExpiry)}
                            </p>
                            <p className="text-xs text-gray-400">Validade: {new Date(doc.current_version.expiry_date + 'T00:00:00').toLocaleDateString()}</p>
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <Card className="p-6 text-center">
                      <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
                      <p className="text-gray-300">Nenhuma documentação próxima do vencimento.</p>
                    </Card>
                  )}
                </div>
              </section>
            </div>
        </motion.div>
    </div>
  );
};

export default Dashboard;