import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const useAppHandlers = ({
  refetchData,
  dialogState,
  setDialogState,
  setSelectedEquipment,
  setEditingMaintenance,
  onSuccess,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();

  const handleOpenAddEquipmentForm = (equipment = null) => {
    setSelectedEquipment(equipment);
    setDialogState(prev => ({ ...prev, isAddEquipmentOpen: true }));
  };

  const handleOpenMaintenanceForm = (equipment) => {
    setSelectedEquipment(equipment);
    setEditingMaintenance(null);
    setDialogState(prev => ({ ...prev, isMaintenanceOpen: true }));
  };

  const handleOpenChecklistForm = (equipment) => {
    setSelectedEquipment(equipment);
    setDialogState(prev => ({ ...prev, isChecklistOpen: true }));
  };

  const handleOpenPlanMaintenanceForm = (equipment) => {
    setSelectedEquipment(equipment);
    setDialogState(prev => ({ ...prev, isPlanMaintenanceOpen: true }));
  };

  const handleChecklistSubmit = async (checklistData) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Erro de autenticação' });
        return { success: false, error: 'User not authenticated' };
    }

    const { items, ...restOfData } = checklistData;

    try {
        const itemsWithPhotoUrls = await Promise.all(
            items.map(async (item) => {
                let photo_urls = [];
                const filesToUpload = item.photos?.map(p => p.file).filter(Boolean);

                if (filesToUpload && filesToUpload.length > 0) {
                    photo_urls = await uploadImages(filesToUpload, 'checklist-photos');
                }
                
                // Return a new object without the file and preview properties
                const { photos, ...itemWithoutPhotos } = item;
                return {
                    ...itemWithoutPhotos,
                    photo_urls: photo_urls,
                };
            })
        );
        
        const submissionData = {
            ...restOfData,
            items: itemsWithPhotoUrls,
            user_id: user.id,
        };

        const { error } = await supabase.from('checklists').insert([submissionData]);
        if (error) throw error;
        
        if (onSuccess) onSuccess("Checklist enviado com sucesso!");
        
        return { success: true };
    } catch (error) {
        console.error("Error submitting checklist:", error);
        toast({ 
            variant: 'destructive', 
            title: 'Erro ao enviar checklist', 
            description: error.message 
        });
        return { success: false, error: error.message };
    }
  };

  const handleFuelEntrySubmit = async ({ formData, photos }) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Erro de autenticação' });
      return { success: false };
    }

    try {
      const photoUrls = {};
      const photoUploads = [
        { key: 'plate_photo_url', file: photos.platePhoto },
        { key: 'odometer_photo_url', file: photos.odometerPhoto },
        { key: 'pump_photo_url', file: photos.pumpPhoto },
        { key: 'invoice_photo_url', file: photos.invoicePhoto },
      ];

      for (const { key, file } of photoUploads) {
        if (file) {
          const urls = await uploadImages([file], 'fuel-photos');
          if (urls.length > 0) {
            photoUrls[key] = urls[0];
          }
        }
      }

      const entryData = {
        ...formData,
        user_id: user.id,
        ...photoUrls,
        equipment_id: formData.equipment_id ? parseInt(formData.equipment_id, 10) : null,
        driver_id: formData.driver_id ? parseInt(formData.driver_id, 10) : null,
        liters: parseFloat(formData.liters) || 0,
        total_value: parseFloat(formData.total_value) || null,
        odometer: parseFloat(formData.odometer) || null,
        horometer: parseFloat(formData.horometer) || null,
      };

      if (!entryData.equipment_id || !entryData.driver_id) {
        throw new Error('Equipamento e motorista são obrigatórios.');
      }

      const { error } = await supabase.from('fuel_entries').insert([entryData]);
      if (error) throw error;

      if (entryData.horometer || entryData.odometer) {
        const { error: equipmentError } = await supabase
          .from('equipments')
          .update({
            current_hours: entryData.horometer,
            current_km: entryData.odometer,
          })
          .eq('id', entryData.equipment_id)
          .gt('current_hours', entryData.horometer || 0)
          .gt('current_km', entryData.odometer || 0);
        if (equipmentError) {
          console.warn("Could not update equipment horometer/odometer:", equipmentError.message);
        }
      }
      
      if (refetchData) refetchData();
      return { success: true };

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao Salvar Abastecimento',
        description: error.message,
      });
      return { success: false };
    }
  };

  const uploadImages = async (files, bucketName) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Erro de autenticação' });
      return [];
    }

    const uploadPromises = files.map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file);

      if (error) {
        console.error('Erro no upload:', error);
        throw error;
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);

      return publicUrlData.publicUrl;
    });

    try {
      const urls = await Promise.all(uploadPromises);
      return urls;
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro no Upload', description: 'Falha ao enviar uma ou mais imagens.' });
      return [];
    }
  };

  return {
    handleOpenAddEquipmentForm,
    handleOpenMaintenanceForm,
    handleOpenChecklistForm,
    handleOpenPlanMaintenanceForm,
    handleChecklistSubmit,
    handleFuelEntrySubmit,
    uploadImages,
    refetchData,
  };
};

export default useAppHandlers;