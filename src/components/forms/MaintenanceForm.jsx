import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, PlusCircle, Trash2, Save, Paperclip, X } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { v4 as uuidv4 } from 'uuid';

const ImageUploadSection = ({ label, existingImages, setExistingImages, newFiles, setNewFiles, removeExistingImage }) => {
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setNewFiles(prev => [...prev, ...files]);
        }
    };

    const handleRemoveNewFile = (index) => {
        setNewFiles(prev => prev.filter((_, i) => i !== index));
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <div className="flex flex-wrap gap-2 mt-2">
                {existingImages.map((image, index) => (
                    <div key={`existing-${index}`} className="relative group w-24 h-24">
                        <a href={image.url} target="_blank" rel="noopener noreferrer">
                            <img src={image.url} alt={`Imagem ${index + 1}`} className="w-full h-full object-cover rounded-md" />
                        </a>
                        <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100" onClick={() => removeExistingImage(image.path)}><X className="h-3 w-3" /></Button>
                    </div>
                ))}
                {newFiles.map((file, index) => (
                    <div key={`new-${index}`} className="relative group w-24 h-24">
                        <img src={URL.createObjectURL(file)} alt={`Nova Imagem ${index + 1}`} className="w-full h-full object-cover rounded-md" />
                        <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100" onClick={() => handleRemoveNewFile(index)}><X className="h-3 w-3" /></Button>
                    </div>
                ))}
                <Button type="button" variant="outline" className="w-24 h-24 flex items-center justify-center border-dashed" onClick={triggerFileInput}>
                    <PlusCircle className="h-6 w-6 text-muted-foreground" />
                </Button>
            </div>
            <Input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/jpg"
            />
        </div>
    );
};


const MaintenanceForm = ({ equipment, maintenance, onSave, onClose }) => {
    const { user } = useAuth();
    const { inventory, tertiaryServices, refetchData } = useData();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [beforeFiles, setBeforeFiles] = useState([]);
    const [afterFiles, setAfterFiles] = useState([]);
    
    const [existingBeforeImages, setExistingBeforeImages] = useState([]);
    const [existingAfterImages, setExistingAfterImages] = useState([]);

    const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm({
        defaultValues: {
            type: 'Corretiva',
            status: 'Em Andamento',
            description: '',
            technician: '',
            km_at_maintenance: equipment?.current_km || '',
            hours_at_maintenance: equipment?.current_hours || '',
            maintenance_parts: maintenance?.maintenance_parts || [],
            maintenance_tertiary_services: maintenance?.maintenance_tertiary_services || [],
            ...maintenance,
        }
    });

    useEffect(() => {
        const fetchImageUrls = async (imagePaths, setImageState) => {
            if (imagePaths?.length > 0) {
                const urls = await Promise.all(imagePaths.map(async (path) => {
                    const { data } = await supabase.storage.from('maintenance-images').createSignedUrl(path, 3600);
                    return { path, url: data?.signedUrl };
                }));
                setImageState(urls.filter(u => u.url));
            }
        };
        if (maintenance) {
            fetchImageUrls(maintenance.before_image_urls, setExistingBeforeImages);
            fetchImageUrls(maintenance.after_image_urls, setExistingAfterImages);
        }
    }, [maintenance]);

    const { fields: partFields, append: appendPart, remove: removePart } = useFieldArray({
        control,
        name: "maintenance_parts"
    });

    const { fields: serviceFields, append: appendService, remove: removeService } = useFieldArray({
        control,
        name: "maintenance_tertiary_services"
    });

    const inventoryOptions = useMemo(() => 
        (inventory || [])
            .filter(item => item.is_active)
            .map(item => ({ value: item.id.toString(), label: `${item.name} (${item.part_number || 'N/A'}) - Estoque: ${item.quantity} ${item.unit}` })),
        [inventory]
    );

    const tertiaryServiceOptions = useMemo(() => 
        (tertiaryServices || [])
            .filter(service => service.is_active)
            .map(service => ({ value: service.id.toString(), label: service.name })),
        [tertiaryServices]
    );

    const removeExistingImage = (path, type) => {
        const setter = type === 'before' ? setExistingBeforeImages : setExistingAfterImages;
        setter(prev => prev.filter(img => img.path !== path));
    };

    const uploadImages = async (files, bucketName) => {
        const uploadPromises = files.map(file => {
            const fileExt = file.name.split('.').pop();
            const filePath = `${user.id}/${uuidv4()}.${fileExt}`;
            return supabase.storage.from(bucketName).upload(filePath, file);
        });

        const results = await Promise.all(uploadPromises);
        const urls = [];
        for (const result of results) {
            if (result.error) {
                throw new Error(`Erro no upload: ${result.error.message}`);
            }
            urls.push(result.data.path);
        }
        return urls;
    };

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            let beforeImageUrls = existingBeforeImages.map(img => img.path);
            if (beforeFiles.length > 0) {
                const uploadedUrls = await uploadImages(beforeFiles, 'maintenance-images');
                beforeImageUrls.push(...uploadedUrls);
            }

            let afterImageUrls = existingAfterImages.map(img => img.path);
            if (afterFiles.length > 0) {
                const uploadedUrls = await uploadImages(afterFiles, 'maintenance-images');
                afterImageUrls.push(...uploadedUrls);
            }

            const maintenanceData = {
                ...data,
                equipment_id: equipment.id,
                user_id: user.id,
                before_image_urls: beforeImageUrls,
                after_image_urls: afterImageUrls,
                km_at_maintenance: data.km_at_maintenance || null,
                hours_at_maintenance: data.hours_at_maintenance || null,
            };
            
            delete maintenanceData.maintenance_parts;
            delete maintenanceData.maintenance_tertiary_services;
            
            let maintenanceId = maintenance?.id;

            if (maintenanceId) {
                delete maintenanceData.id;
                const { error } = await supabase.from('maintenances').update(maintenanceData).eq('id', maintenanceId);
                if (error) throw error;
            } else {
                const { data: newMaintenance, error } = await supabase.from('maintenances').insert(maintenanceData).select().single();
                if (error) throw error;
                maintenanceId = newMaintenance.id;
            }

            const partIdsToDelete = (maintenance?.maintenance_parts || [])
                .filter(oldPart => !data.maintenance_parts.some(newPart => newPart.id === oldPart.id))
                .map(p => p.id);
            if (partIdsToDelete.length > 0) {
                const { error } = await supabase.from('maintenance_parts').delete().in('id', partIdsToDelete);
                if (error) throw error;
            }

            const serviceIdsToDelete = (maintenance?.maintenance_tertiary_services || [])
                .filter(oldService => !data.maintenance_tertiary_services.some(newService => newService.id === oldService.id))
                .map(s => s.id);
            if (serviceIdsToDelete.length > 0) {
                const { error } = await supabase.from('maintenance_tertiary_services').delete().in('id', serviceIdsToDelete);
                if (error) throw error;
            }

            for (const part of data.maintenance_parts) {
                if (part.part_id && part.quantity_used > 0) {
                    const partData = {
                        maintenance_id: maintenanceId,
                        part_id: part.part_id,
                        quantity_used: part.quantity_used
                    };
                    
                    if (part.id) {
                        const { error } = await supabase.from('maintenance_parts').update(partData).eq('id', part.id);
                        if (error) throw error;
                    } else {
                        const { error } = await supabase.from('maintenance_parts').insert(partData);
                        if (error) throw error;
                    }
                }
            }

            for (const service of data.maintenance_tertiary_services) {
                if (service.tertiary_service_id) {
                    const serviceData = {
                        maintenance_id: maintenanceId,
                        tertiary_service_id: service.tertiary_service_id,
                        cost: service.cost || null,
                        notes: service.notes || ''
                    };
                    
                    if (service.id) {
                        const { error } = await supabase.from('maintenance_tertiary_services').update(serviceData).eq('id', service.id);
                        if (error) throw error;
                    } else {
                        const { error } = await supabase.from('maintenance_tertiary_services').insert(serviceData);
                        if (error) throw error;
                    }
                }
            }

            if (data.status === 'Finalizada') {
                const updateData = {};
                if (data.km_at_maintenance) updateData.current_km = data.km_at_maintenance;
                if (data.hours_at_maintenance) updateData.current_hours = data.hours_at_maintenance;
                if (data.type === 'Preventiva') {
                    updateData.last_maintenance_hours = data.hours_at_maintenance || equipment.current_hours;
                }
                if (Object.keys(updateData).length > 0) {
                    await supabase.from('equipments').update(updateData).eq('id', equipment.id);
                }
            }

            toast({ title: 'Sucesso!', description: 'Manutenção salva com sucesso.' });
            refetchData();
            if (typeof onSave === 'function') {
              onSave();
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao salvar manutenção', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <ScrollArea className="h-[70vh] p-4">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Tipo de Manutenção</Label>
                            <Select onValueChange={(value) => setValue('type', value)} defaultValue={watch('type')}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Corretiva">Corretiva</SelectItem>
                                    <SelectItem value="Preventiva">Preventiva</SelectItem>
                                    <SelectItem value="Preditiva">Preditiva</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Status</Label>
                            <Select onValueChange={(value) => setValue('status', value)} defaultValue={watch('status')}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                                    <SelectItem value="Finalizada">Finalizada</SelectItem>
                                    <SelectItem value="Cancelada">Cancelada</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="description">Descrição do Problema / Serviço</Label>
                        <Textarea id="description" {...register('description', { required: 'A descrição é obrigatória.' })} />
                        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                    </div>

                    <div>
                        <Label htmlFor="technician">Técnico Responsável</Label>
                        <Input id="technician" {...register('technician')} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="km_at_maintenance">KM da Manutenção</Label>
                            <Input id="km_at_maintenance" type="number" {...register('km_at_maintenance')} />
                        </div>
                        <div>
                            <Label htmlFor="hours_at_maintenance">Horímetro da Manutenção</Label>
                            <Input id="hours_at_maintenance" type="number" {...register('hours_at_maintenance')} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Peças Utilizadas</Label>
                        {partFields.map((field, index) => (
                            <div key={field.id} className="flex items-end gap-2 p-2 border rounded-md">
                                <div className="flex-grow">
                                    <Label>Peça</Label>
                                    <Combobox
                                        options={inventoryOptions}
                                        value={watch(`maintenance_parts.${index}.part_id`)}
                                        onChange={(value) => setValue(`maintenance_parts.${index}.part_id`, value ? parseInt(value) : null)}
                                        placeholder="Selecione uma peça"
                                    />
                                </div>
                                <div className="w-24">
                                    <Label>Qtd.</Label>
                                    <Input type="number" {...register(`maintenance_parts.${index}.quantity_used`, { valueAsNumber: true, min: 1 })} />
                                </div>
                                <Button type="button" variant="destructive" size="icon" onClick={() => removePart(index)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => appendPart({ part_id: null, quantity_used: 1 })}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Peça
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <Label>Serviços Terceirizados</Label>
                        {serviceFields.map((field, index) => (
                            <div key={field.id} className="flex flex-col gap-2 p-2 border rounded-md">
                                <div className="flex items-end gap-2">
                                    <div className="flex-grow">
                                        <Label>Serviço</Label>
                                        <Combobox
                                            options={tertiaryServiceOptions}
                                            value={watch(`maintenance_tertiary_services.${index}.tertiary_service_id`)}
                                            onChange={(value) => setValue(`maintenance_tertiary_services.${index}.tertiary_service_id`, value ? parseInt(value) : null)}
                                            placeholder="Selecione um serviço"
                                        />
                                    </div>
                                    <div className="w-32">
                                        <Label>Custo (R$)</Label>
                                        <Input type="number" step="0.01" {...register(`maintenance_tertiary_services.${index}.cost`, { valueAsNumber: true })} />
                                    </div>
                                    <Button type="button" variant="destructive" size="icon" onClick={() => removeService(index)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                                <div>
                                    <Label>Observações</Label>
                                    <Input {...register(`maintenance_tertiary_services.${index}.notes`)} />
                                </div>
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => appendService({ tertiary_service_id: null, cost: '', notes: '' })}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Serviço
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ImageUploadSection
                            label="Fotos (Antes)"
                            existingImages={existingBeforeImages}
                            setExistingImages={setExistingBeforeImages}
                            newFiles={beforeFiles}
                            setNewFiles={setBeforeFiles}
                            removeExistingImage={(path) => removeExistingImage(path, 'before')}
                        />
                        <ImageUploadSection
                            label="Fotos (Depois)"
                            existingImages={existingAfterImages}
                            setExistingImages={setExistingAfterImages}
                            newFiles={afterFiles}
                            setNewFiles={setAfterFiles}
                            removeExistingImage={(path) => removeExistingImage(path, 'after')}
                        />
                    </div>
                </div>
            </ScrollArea>
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Salvar
                </Button>
            </div>
        </form>
    );
};

export default MaintenanceForm;