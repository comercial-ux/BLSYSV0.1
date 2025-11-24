import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Camera, CheckCircle, AlertTriangle, XCircle, Trash2, Loader2, Save } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const checklistItemsTemplate = [
    { group: 'Verificações Gerais', items: ['Nível de Óleo do Motor', 'Nível de Água do Radiador', 'Correias do Motor', 'Nível de Óleo de Direção', 'Nível do Óleo Hidráulico', 'Painel de Instrumento'] },
    { group: 'Iluminação e Sinalização', items: ['Luzes de Farol, Ré, Freio, Pisca, e Lanternas', 'Buzina e sistema do alarme sonoro da ré', 'Limpador de para-brisa e esguicho d\'água', 'Faroletes de Trabalho e Faixa Refletivas', 'Giroflex'] },
    { group: 'Operação e Segurança', items: ['Temperatura do motor', 'Tacógrafo', 'Cinto de Segurança', 'Rodas / Aros / Pneus, Verificar Banda de Rodagem', 'Os parafusos estão bem apertados?', 'Sistema de freios', 'Mecanismos de direção', 'Freios - Drenagem de Ar', 'Retrovisores'] },
    { group: 'Estrutura e Componentes', items: ['Condições gerais do equipamento', 'Todos os adesivos estão visíveis', 'Avarias e vazamentos', 'Mangueiras, válvulas, cilindros e bombas', 'Sistema de Refrigeração do Óleo Hidráulico'] },
    { group: 'Sistema de Içamento', items: ['Trava de segurança dos Guinchos', 'Roldanas do Moitão e da ponta da lança', 'Condição dos cabos de aço', 'Condição do Moitão e bolinha', 'Estado de funcionamento do Limitador do Moitão', 'Estado de funcionamento do Limitador da "bolinha"', 'Indicador de Ângulo da lança', 'Indicador de Comprimento da Lança', 'Indicador de Balança', 'Inclinômetro / anemômetro'] },
    { group: 'Itens de Apoio', items: ['Macaco / chave de roda / triângulo', 'Condição e Quantidade do dormente Nº 12'] }
];

const ChecklistFieldForm = ({ equipments, onChecklistSubmitted }) => {
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [evaluator, setEvaluator] = useState('');
  const [evaluationDate, setEvaluationDate] = useState(new Date().toISOString().split('T')[0]);
  const [horometerReading, setHorometerReading] = useState('');
  const [odometerReading, setOdometerReading] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allEquipments = useMemo(() => equipments || [], [equipments]);

  const handleEquipmentChange = (equipmentId) => {
    setSelectedEquipmentId(equipmentId);
    if (equipmentId) {
      setItems(checklistItemsTemplate.flatMap(group =>
        group.items.map(item => ({
          group: group.group,
          label: item,
          status: 'na',
          photos: [],
        }))
      ));
    } else {
      setItems([]);
    }
  };

  const handleStatusChange = (index, status) => {
    const newItems = [...items];
    newItems[index].status = status;
    setItems(newItems);
  };

  const handlePhotoChange = (index, files) => {
    if (files.length === 0) return;
    const newItems = [...items];
    const currentItem = newItems[index];

    if (currentItem.photos.length + files.length > 5) {
      toast({
        variant: "destructive",
        title: "Limite de fotos excedido",
        description: "Você pode anexar no máximo 5 fotos por item.",
      });
      return;
    }

    const newPhotos = Array.from(files).map(file => ({
      file: file,
      preview: URL.createObjectURL(file)
    }));
    
    currentItem.photos.push(...newPhotos);
    setItems(newItems);
  };
  
  const removePhoto = (itemIndex, photoIndex) => {
    const newItems = [...items];
    const item = newItems[itemIndex];
    const photoToRemove = item.photos[photoIndex];
    URL.revokeObjectURL(photoToRemove.preview);
    item.photos.splice(photoIndex, 1);
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEquipmentId || !evaluator || !evaluationDate) {
        toast({ variant: 'destructive', title: 'Campos obrigatórios', description: 'Equipamento, avaliador e data são obrigatórios.' });
        return;
    }
    setIsSubmitting(true);
    
    const itemsWithFiles = items.map(item => ({
      ...item,
      photoFiles: item.photos.map(p => p.file)
    }));

    await onChecklistSubmitted({
      equipment_id: parseInt(selectedEquipmentId, 10),
      items: itemsWithFiles,
      notes,
      evaluator,
      evaluation_date: evaluationDate,
      horometer_reading: horometerReading ? parseFloat(horometerReading) : null,
      odometer_reading: odometerReading ? parseFloat(odometerReading) : null,
    });
    setIsSubmitting(false);
  };

  return (
    <motion.form 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        onSubmit={handleSubmit} 
        className="p-4 space-y-6"
    >
        <div>
            <Label className="text-white">Equipamento <span className="text-red-500">*</span></Label>
            <Select value={selectedEquipmentId} onValueChange={handleEquipmentChange}>
                <SelectTrigger className="w-full mt-1 bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Selecione o equipamento..." />
                </SelectTrigger>
                <SelectContent>
                    {allEquipments.map(eq => (
                        <SelectItem key={eq.id} value={eq.id.toString()}>{eq.name} ({eq.plate || 'S/ Placa'})</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>

        {selectedEquipmentId && (
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label className="text-white">Avaliador <span className="text-red-500">*</span></Label>
                        <Input value={evaluator} onChange={(e) => setEvaluator(e.target.value)} required className="mt-1 bg-white/10 border-white/20" />
                    </div>
                    <div>
                        <Label className="text-white">Data da Avaliação <span className="text-red-500">*</span></Label>
                        <Input type="date" value={evaluationDate} onChange={(e) => setEvaluationDate(e.target.value)} required className="mt-1 bg-white/10 border-white/20" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label className="text-white">Horímetro</Label>
                        <Input type="number" placeholder="Horas" value={horometerReading} onChange={(e) => setHorometerReading(e.target.value)} className="mt-1 bg-white/10 border-white/20" />
                    </div>
                    <div>
                        <Label className="text-white">KM</Label>
                        <Input type="number" placeholder="Quilometragem" value={odometerReading} onChange={(e) => setOdometerReading(e.target.value)} className="mt-1 bg-white/10 border-white/20" />
                    </div>
                </div>
                
                <div className="space-y-6">
                    {checklistItemsTemplate.map((group) => (
                        <div key={group.group}>
                            <h3 className="text-lg font-semibold text-purple-300 mb-3">{group.group}</h3>
                            <div className="space-y-4">
                                {items.filter(item => item.group === group.group).map((item) => {
                                    const globalIndex = items.findIndex(i => i.label === item.label && i.group === item.group);
                                    return (
                                        <div key={globalIndex} className="p-3 bg-white/5 rounded-lg flex flex-col gap-4">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <span className="text-white flex-1">{item.label}</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex rounded-md border border-white/20">
                                                        {['ok', 'not_ok', 'na'].map(status => (
                                                        <Button
                                                            key={status} type="button" onClick={() => handleStatusChange(globalIndex, status)}
                                                            className={`w-12 h-9 rounded-none transition-colors duration-200
                                                            ${item.status === status 
                                                                ? (status === 'ok' ? 'bg-green-600' : status === 'not_ok' ? 'bg-red-600' : 'bg-gray-500')
                                                                : 'bg-transparent hover:bg-white/10'}
                                                            ${status === 'ok' ? 'rounded-l-md' : ''} ${status === 'na' ? 'rounded-r-md' : ''}`}
                                                        >
                                                            {status === 'ok' && <CheckCircle className="w-5 h-5" />}
                                                            {status === 'not_ok' && <AlertTriangle className="w-5 h-5" />}
                                                            {status === 'na' && <XCircle className="w-5 h-5" />}
                                                        </Button>
                                                        ))}
                                                    </div>
                                                    <label className="cursor-pointer p-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white">
                                                        <Camera className="w-5 h-5" />
                                                        <input type="file" accept="image/*" className="hidden" multiple capture="environment" onChange={(e) => handlePhotoChange(globalIndex, e.target.files)} />
                                                    </label>
                                                </div>
                                            </div>
                                            {item.photos && item.photos.length > 0 && (
                                                <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10 mt-2">
                                                {item.photos.map((photo, photoIndex) => (
                                                    <div key={photoIndex} className="relative">
                                                    <img src={photo.preview} alt={`preview ${photoIndex}`} className="w-16 h-16 rounded-md object-cover"/>
                                                    <button type="button" onClick={() => removePhoto(globalIndex, photoIndex)} className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5">
                                                        <Trash2 className="w-3 h-3"/>
                                                    </button>
                                                    </div>
                                                ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                <div>
                    <Label className="text-white">Observações</Label>
                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 bg-white/10 border-white/20 h-24" />
                </div>
                
                <Button type="submit" className="w-full !h-12 text-lg" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Save className="mr-2 w-5 h-5" />}
                    Salvar Checklist
                </Button>
            </>
        )}
    </motion.form>
  );
};

export default ChecklistFieldForm;