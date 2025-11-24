import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Camera, CheckCircle, AlertTriangle, XCircle, Trash2, Loader2, History, ChevronsUpDown, Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format, parseISO } from 'date-fns';
import { useData } from '@/contexts/DataContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import ImageSourceDialog from './ImageSourceDialog';

const checklistTemplates = {
  passeio: [
    { group: 'Verificações Externas', items: ['Pneus (calibragem e desgaste)', 'Lataria (arranhões, amassados)', 'Vidros e retrovisores', 'Faróis, lanternas e setas'] },
    { group: 'Verificações do Motor', items: ['Nível de óleo do motor', 'Nível de água do radiador', 'Nível do fluido de freio', 'Nível de água do limpador'] },
    { group: 'Verificações Internas', items: ['Cintos de segurança', 'Buzina', 'Ar condicionado', 'Limpador de para-brisa', 'Painel de instrumentos (luzes de alerta)', 'Freio de mão'] },
    { group: 'Itens de Emergência', items: ['Estepe', 'Macaco e chave de roda', 'Triângulo de sinalização', 'Extintor de incêndio'] },
  ],
  default: [
    { group: 'Verificações Gerais', items: ['Nível de Óleo do Motor', 'Nível de Água do Radiador', 'Correias do Motor', 'Nível de Óleo de Direção', 'Nível do Óleo Hidráulico', 'Painel de Instrumento'] },
    { group: 'Iluminação e Sinalização', items: ["Luzes de Farol, Ré, Freio, Pisca, e Lanternas", "Buzina e sistema do alarme sonoro da ré", "Limpador de para-brisa e esguicho d'água", "Faroletes de Trabalho e Faixa Refletivas", "Giroflex"] },
    { group: 'Operação e Segurança', items: ['Temperatura do motor', 'Tacógrafo', 'Cinto de Segurança', 'Rodas / Aros / Pneus, Verificar Banda de Rodagem', 'Os parafusos estão bem apertados?', 'Sistema de freios', 'Mecanismos de direção', 'Freios - Drenagem de Ar', 'Retrovisores'] },
    { group: 'Estrutura e Componentes', items: ['Condições gerais do equipamento', 'Todos os adesivos estão visíveis', 'Avarias e vazamentos', 'Mangueiras, válvulas, cilindros e bombas', 'Sistema de Refrigeração do Óleo Hidráulico'] },
    { group: 'Sistema de Içamento', items: ['Trava de segurança dos Guinchos', 'Roldanas do Moitão e da ponta da lança', 'Condição dos cabos de aço', 'Condição do Moitão e bolinha', 'Estado de funcionamento do Limitador do Moitão', 'Estado de funcionamento do Limitador da "bolinha"', 'Indicador de Ângulo da lança', 'Indicador de Comprimento da Lança', 'Indicador de Balança', 'Inclinômetro / anemômetro'] },
    { group: 'Itens de Apoio', items: ['Macaco / chave de roda / triângulo', 'Condição e Quantidade do dormente Nº 12'] },
  ]
};

const CameraButton = ({ onFilesSelected }) => {
    const [dialogOpen, setDialogOpen] = useState(false);

    const handleFileSelect = (files) => {
        onFilesSelected(files);
    };

    return (
        <>
            <button type="button" onClick={() => setDialogOpen(true)} className="cursor-pointer p-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white">
                <Camera className="w-5 h-5" />
            </button>
            <ImageSourceDialog open={dialogOpen} onOpenChange={setDialogOpen} onFileSelect={handleFileSelect} />
        </>
    );
};

const ChecklistFieldForm = ({ equipments, onChecklistSubmitted }) => {
  const { operationalData, refetchData } = useData();
  const { checklists } = operationalData;
  const { toast } = useToast();
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [evaluator, setEvaluator] = useState('');
  const [evaluationDate, setEvaluationDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [horometerReading, setHorometerReading] = useState('');
  const [odometerReading, setOdometerReading] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);

  const selectedEquipment = useMemo(() => 
    equipments?.find(e => e.id === selectedEquipmentId),
    [equipments, selectedEquipmentId]
  );

  useEffect(() => {
    if (selectedEquipment) {
      const templateType = selectedEquipment.equipment_type || 'default';
      const template = checklistTemplates[templateType] || checklistTemplates.default;
      setItems(template.flatMap(group =>
        group.items.map(item => ({
          group: group.group,
          label: item,
          status: 'na',
          photos: [],
        }))
      ));
      setHorometerReading(selectedEquipment.current_hours ? String(selectedEquipment.current_hours) : '');
      setOdometerReading(selectedEquipment.current_km ? String(selectedEquipment.current_km) : '');
    } else {
      setItems([]);
      setHorometerReading('');
      setOdometerReading('');
    }
  }, [selectedEquipment]);

  const equipmentChecklists = useMemo(() => {
    if (!selectedEquipment || !checklists) return [];
    return checklists
      .filter(c => c.equipment_id === selectedEquipment.id)
      .sort((a, b) => new Date(b.evaluation_date) - new Date(a.evaluation_date));
  }, [checklists, selectedEquipment]);

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
        title: "Erro",
        description: "Limite de 5 fotos por item excedido.",
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
    if (!selectedEquipmentId) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, selecione um equipamento.",
      });
      return;
    }
    setIsSubmitting(true);
    
    try {
      const result = await onChecklistSubmitted({
        equipment_id: selectedEquipmentId,
        items: items,
        notes,
        evaluator,
        evaluation_date: evaluationDate,
        horometer_reading: horometerReading ? parseFloat(horometerReading) : null,
        odometer_reading: odometerReading ? parseFloat(odometerReading) : null,
      });
      
      if (result && result.success) {
        setSelectedEquipmentId('');
        setItems([]);
        setNotes('');
        setEvaluator('');
        setEvaluationDate(format(new Date(), 'yyyy-MM-dd'));
        setHorometerReading('');
        setOdometerReading('');
        refetchData();
      }
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Erro inesperado",
        description: error.message,
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  const groupedItems = items.reduce((acc, item) => {
    const group = item.group;
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(item);
    return acc;
  }, {});

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-gray-900 text-white">
      <h2 className="text-2xl font-bold mb-4">Checklist de Inspeção</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label className="text-white">Equipamento</Label>
          <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={comboboxOpen}
                className="w-full justify-between mt-2 bg-gray-800 border-gray-700 hover:bg-gray-700"
              >
                {selectedEquipmentId
                  ? equipments?.find((eq) => eq.id === selectedEquipmentId)?.name
                  : "Selecione o equipamento..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
              <Command className="bg-gray-800 text-white">
                <CommandInput placeholder="Buscar equipamento..." />
                <CommandEmpty>Nenhum equipamento encontrado.</CommandEmpty>
                <CommandGroup>
                  <ScrollArea className="h-72">
                    {equipments?.map((eq) => (
                      <CommandItem
                        key={eq.id}
                        value={eq.name}
                        onSelect={() => {
                          setSelectedEquipmentId(eq.id);
                          setComboboxOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedEquipmentId === eq.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {eq.name}
                      </CommandItem>
                    ))}
                  </ScrollArea>
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {selectedEquipment && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Avaliador</Label>
                <Input value={evaluator} onChange={(e) => setEvaluator(e.target.value)} required className="mt-2 bg-gray-800 border-gray-700" />
              </div>
              <div>
                <Label className="text-white">Data da Avaliação</Label>
                <Input type="date" value={evaluationDate} onChange={(e) => setEvaluationDate(e.target.value)} required className="mt-2 bg-gray-800 border-gray-700" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Horímetro</Label>
                <Input type="number" placeholder="Horas" value={horometerReading} onChange={(e) => setHorometerReading(e.target.value)} className="mt-2 bg-gray-800 border-gray-700" />
              </div>
              <div>
                <Label className="text-white">KM</Label>
                <Input type="number" placeholder="Quilometragem" value={odometerReading} onChange={(e) => setOdometerReading(e.target.value)} className="mt-2 bg-gray-800 border-gray-700" />
              </div>
            </div>
            
            <div className="space-y-6">
              {Object.entries(groupedItems).map(([groupName, groupItems]) => (
                <div key={groupName}>
                  <h3 className="text-lg font-semibold text-purple-400 mb-3">{groupName}</h3>
                  <div className="space-y-4">
                    {groupItems.map((item, index) => {
                      const globalIndex = items.findIndex(i => i.label === item.label && i.group === item.group);
                      return (
                        <div key={globalIndex} className="p-3 bg-gray-800 rounded-lg flex flex-col gap-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <span className="text-white flex-1">{item.label}</span>
                            <div className="flex items-center gap-2">
                              <div className="flex rounded-md border border-gray-600">
                                {['ok', 'not_ok', 'na'].map(status => (
                                  <Button
                                    key={status} type="button" onClick={() => handleStatusChange(globalIndex, status)}
                                    className={`w-12 h-9 rounded-none transition-colors duration-200
                                      ${items[globalIndex].status === status 
                                        ? (status === 'ok' ? 'bg-green-600' : status === 'not_ok' ? 'bg-red-600' : 'bg-gray-500')
                                        : 'bg-transparent hover:bg-gray-700'}
                                      ${status === 'ok' ? 'rounded-l-md' : ''} ${status === 'na' ? 'rounded-r-md' : ''}`}
                                  >
                                    {status === 'ok' && <CheckCircle className="w-5 h-5" />}
                                    {status === 'not_ok' && <AlertTriangle className="w-5 h-5" />}
                                    {status === 'na' && <XCircle className="w-5 h-5" />}
                                  </Button>
                                ))}
                              </div>
                               <CameraButton onFilesSelected={(files) => handlePhotoChange(globalIndex, files)} />
                            </div>
                          </div>
                          {items[globalIndex].photos && items[globalIndex].photos.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-700 mt-2">
                              {items[globalIndex].photos.map((photo, photoIndex) => (
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
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-2 bg-gray-800 border-gray-700 h-24" />
            </div>

            {equipmentChecklists.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-purple-400 mb-3 flex items-center"><History className="mr-2" /> Histórico de Checklists</h3>
                <ScrollArea className="h-40 w-full rounded-md border border-gray-700 p-2 bg-gray-800">
                  <ul className="space-y-2">
                    {equipmentChecklists.map(c => (
                      <li key={c.id} className="text-sm text-gray-300">
                        <span className="font-semibold">{format(parseISO(c.evaluation_date), 'dd/MM/yyyy')}</span> - Avaliado por: {c.evaluator}
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            )}
            
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Salvar Checklist
              </Button>
            </div>
          </>
        )}
      </form>
    </motion.div>
  );
};

export default ChecklistFieldForm;