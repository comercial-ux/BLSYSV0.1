import React, { useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import MaintenanceCard from './MaintenanceCard';
import MaintenanceFilters from './MaintenanceFilters';
import { supabase } from '@/lib/customSupabaseClient';
import { useReactToPrint } from 'react-to-print';
import MaintenancePrintLayout from './MaintenancePrintLayout';
import MasterPasswordDialog from '@/components/admin/MasterPasswordDialog';
import ImagePreviewDialog from './ImagePreviewDialog';

const MaintenanceList = ({ maintenances, onEdit, onDataUpdate, equipments }) => {
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    maintenanceType: 'all',
    equipmentId: 'all',
  });
  const [showOngoingOnly, setShowOngoingOnly] = useState(true);
  const [isDeleting, setIsDeleting] = useState(null);
  const [isFinishing, setIsFinishing] = useState(null);
  const [itemToDeactivate, setItemToDeactivate] = useState(null);
  const [itemToPrint, setItemToPrint] = useState(null);
  const printComponentRef = useRef();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isFetchingPrintData, setIsFetchingPrintData] = useState(false);
  const [printWithPhotos, setPrintWithPhotos] = useState(true);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [imagesToPreview, setImagesToPreview] = useState([]);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const fetchImageUrls = async (imagePaths, type) => {
    if (!imagePaths || imagePaths.length === 0) return [];
    const { data, error } = await supabase.storage.from('maintenance-images').createSignedUrls(imagePaths, 3600);
    if (error) {
      console.error('Error fetching signed URLs:', error);
      return [];
    }
    return data.map(item => ({ url: item.signedUrl, path: item.path, type }));
  };

  const handlePreviewClick = async (maintenance) => {
    setIsPreviewLoading(true);
    setIsPreviewOpen(true);
    const beforeImageUrls = await fetchImageUrls(maintenance.before_image_urls, 'before');
    const afterImageUrls = await fetchImageUrls(maintenance.after_image_urls, 'after');
    setImagesToPreview([...beforeImageUrls, ...afterImageUrls]);
    setIsPreviewLoading(false);
  };

  const handlePrint = useReactToPrint({
    content: () => printComponentRef.current,
    onAfterPrint: () => setItemToPrint(null),
  });

  const triggerPrint = async (maintenance) => {
    setIsFetchingPrintData(true);
    try {
      const { data: fullMaintenanceData, error } = await supabase
        .from('maintenances')
        .select(`
          *,
          maintenance_parts (
            *,
            inventory_parts (name, part_number, unit)
          ),
          maintenance_tertiary_services (
            *,
            tertiary_services (name)
          )
        `)
        .eq('id', maintenance.id)
        .single();

      if (error || !fullMaintenanceData) throw error || new Error('Não foi possível carregar os detalhes completos da manutenção.');

      let beforeImageUrls = [];
      let afterImageUrls = [];

      if (printWithPhotos) {
        if (fullMaintenanceData.before_image_urls?.length > 0) {
          beforeImageUrls = (await fetchImageUrls(fullMaintenanceData.before_image_urls, 'before')).map(i => i.url);
        }
        if (fullMaintenanceData.after_image_urls?.length > 0) {
          afterImageUrls = (await fetchImageUrls(fullMaintenanceData.after_image_urls, 'after')).map(i => i.url);
        }
      }
      
      setItemToPrint({
        ...fullMaintenanceData,
        before_image_signed_urls: beforeImageUrls,
        after_image_signed_urls: afterImageUrls,
      });

      setTimeout(() => handlePrint(), 100);

    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro ao buscar dados para impressão',
        description: err.message,
      });
    } finally {
      setIsFetchingPrintData(false);
    }
  };

  const handleDeleteClick = (maintenanceId) => {
    setItemToDeactivate(maintenanceId);
    setIsPasswordDialogOpen(true);
  };

  const confirmDeactivation = async () => {
    if (!itemToDeactivate) return;
    setIsDeleting(itemToDeactivate);
    
    const { error } = await supabase
      .from('maintenances')
      .update({ status: 'Inativa' })
      .eq('id', itemToDeactivate);

    setIsDeleting(null);
    setIsPasswordDialogOpen(false);
    setItemToDeactivate(null);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao inativar manutenção',
        description: error.message,
      });
    } else {
      toast({
        title: 'Sucesso!',
        description: 'Manutenção inativada com sucesso.',
      });
      onDataUpdate();
    }
  };

  const handleFinishMaintenance = async (maintenance) => {
    if (!maintenance) return;
    setIsFinishing(maintenance.id);

    const { data: latestMaintenance, error: fetchError } = await supabase
      .from('maintenances')
      .select('*, maintenance_parts(*, inventory_parts(name)), maintenance_tertiary_services(*, tertiary_services(name))')
      .eq('id', maintenance.id)
      .single();

    if (fetchError || !latestMaintenance) {
      setIsFinishing(null);
      toast({
        variant: 'destructive',
        title: 'Erro ao buscar dados',
        description: 'Não foi possível obter os detalhes da manutenção para finalizá-la.',
      });
      return;
    }
    onEdit({ ...latestMaintenance, status: 'Finalizada' });
    setIsFinishing(null);
  };

  const filteredMaintenances = useMemo(() => {
    if (!Array.isArray(maintenances)) return [];
    return maintenances
      .filter(m => {
        if (!m) return false;
        if (m.status === 'Inativa') return false;
        const typeMatch = filters.maintenanceType === 'all' || m.type.toLowerCase() === filters.maintenanceType.toLowerCase();
        const equipmentMatch = filters.equipmentId === 'all' || m.equipment_id?.toString() === filters.equipmentId;
        const statusMatch = !showOngoingOnly || m.status === 'Em Andamento';
        return typeMatch && equipmentMatch && statusMatch;
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [maintenances, filters, showOngoingOnly]);


  if (!Array.isArray(maintenances) || maintenances.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <h1 className="text-3xl font-bold mb-6">Histórico de Manutenções</h1>
        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-xl text-gray-300">Nenhuma manutenção registrada</p>
        <p className="text-gray-400">Registre manutenções através da aba de veículos.</p>
      </motion.div>
    );
  }

  return (
    <>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Histórico de Manutenções</h1>
        </div>

        <MaintenanceFilters 
          filters={filters}
          setFilters={setFilters}
          equipments={equipments || []}
          showOngoingOnly={showOngoingOnly}
          setShowOngoingOnly={setShowOngoingOnly}
        />
        
        <div className="space-y-4 max-w-4xl mx-auto mt-6">
          {filteredMaintenances.length > 0 ? (
            filteredMaintenances.map((maintenance) => (
              <MaintenanceCard 
                key={maintenance.id} 
                maintenance={maintenance} 
                onEdit={onEdit} 
                onDelete={() => handleDeleteClick(maintenance.id)}
                onFinish={() => handleFinishMaintenance(maintenance)}
                onPrint={() => triggerPrint(maintenance)}
                onPreview={handlePreviewClick}
                equipments={equipments || []} 
                isDeleting={isDeleting === maintenance.id}
                isFinishing={isFinishing === maintenance.id}
                isPrinting={isFetchingPrintData && itemToPrint?.id === maintenance.id}
                printWithPhotos={printWithPhotos}
                setPrintWithPhotos={setPrintWithPhotos}
              />
            ))
          ) : (
            <div className="text-center py-12 text-gray-400">
                <p>Nenhum registro encontrado para os filtros selecionados.</p>
            </div>
          )}
        </div>
        <MasterPasswordDialog
            isOpen={isPasswordDialogOpen}
            onClose={() => setIsPasswordDialogOpen(false)}
            onConfirm={confirmDeactivation}
            isSubmitting={!!isDeleting}
            title="Confirmar Inativação de Manutenção"
            description="Tem certeza de que deseja inativar este registro de manutenção? Esta ação não pode ser desfeita, mas o registro será mantido no histórico."
        />
        <ImagePreviewDialog
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          images={imagesToPreview}
          isLoading={isPreviewLoading}
        />
        <div style={{ display: 'none' }}>
            {itemToPrint && <MaintenancePrintLayout ref={printComponentRef} maintenance={itemToPrint} equipments={equipments} />}
        </div>
    </>
  );
};

export default MaintenanceList;