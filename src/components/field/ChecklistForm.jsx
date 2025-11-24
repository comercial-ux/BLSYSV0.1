import React, { useState, useMemo, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Loader2, Camera, Trash2, Check, X, Ban } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const CHECKLIST_TEMPLATES = {
  passeio: [
    { group: 'Verificações Externas', items: ['Pneus (calibragem e desgaste)', 'Lataria (arranhões, amassados)', 'Vidros e retrovisores', 'Faróis, lanternas e setas'] },
    { group: 'Verificações do Motor', items: ['Nível de óleo do motor', 'Nível de água do radiador', 'Nível do fluido de freio', 'Nível de água do limpador'] },
    { group: 'Verificações Internas', items: ['Cintos de segurança', 'Buzina', 'Ar condicionado', 'Limpador de para-brisa', 'Painel de instrumentos (luzes de alerta)', 'Freio de mão'] },
    { group: 'Itens de Emergência', items: ['Estepe', 'Macaco e chave de roda', 'Triângulo de sinalização', 'Extintor de incêndio'] },
  ],
  default: [
    { group: 'Cabine', items: ['Ar condicionado', 'Limpador de para-brisa', 'Vidros e retrovisores', 'Extintor de incêndio', 'Cinto de segurança', 'Banco do operador', 'Portas e fechaduras', 'Sinal sonoro de ré', 'Buzina', 'Assoalho', 'Alavancas', 'Painel de instrumentos', 'Vazamentos internos'] },
    { group: 'Estrutura', items: ['Chassi', 'Contrapeso', 'Sapatas e patolas', 'Lança e Jib', 'Moitão e gancho', 'Roda motriz e guia', 'Esteiras e roletes', 'Mangueiras e conexões', 'Sistema de freios', 'Sistema hidráulico', 'Vazamentos externos', 'Escadas e corrimãos', 'Pintura e adesivos de segurança', 'Cabos de aço', 'Mesa de giro', 'Cilindros hidráulicos', 'Pinos e travas'] },
    { group: 'Motor e Elétrica', items: ['Nível de óleo do motor', 'Nível de água do radiador', 'Correias', 'Parte elétrica', 'Bateria', 'Vazamento de óleo', 'Vazamento de combustível', 'Tacógrafo', 'Faróis e lanternas', 'Luzes de alerta'] },
    { group: 'Documentação', items: ['Documento do equipamento', 'Manual do equipamento', 'Tabela de carga', 'ART de manutenção', 'ART do equipamento'] },
    { group: 'EPIs', items: ['Capacete', 'Óculos de segurança', 'Luvas de proteção', 'Protetor auricular', 'Botas de segurança'] },
  ]
};

const CompactStatusButton = ({ Icon, variant, isActive, onClick, className }) => (
    <Button
        type="button"
        size="icon"
        variant={isActive ? variant : 'outline'}
        className={cn('h-8 w-8 p-0 border border-gray-500/50', {
          'bg-green-600 border-green-600 text-white': isActive && variant === 'success',
          'bg-red-600 border-red-600 text-white': isActive && variant === 'destructive',
          'bg-gray-600 border-gray-600 text-white': isActive && variant === 'secondary',
        }, className)}
        onClick={onClick}
    >
        <Icon className="w-4 h-4" />
    </Button>
);

const ChecklistItemRow = ({ item, index, onStatusChange, onPhotoChange, onRemovePhoto }) => {
    const { label, status, photos } = item;
    const [photosVisible, setPhotosVisible] = useState(false);
    const canAddMorePhotos = photos.length < 5;

    return (
        <div className="flex flex-col border-b border-white/10 py-2.5 last:border-b-0">
            <div className="flex items-center gap-1.5">
                <p className="flex-1 text-sm font-medium pr-1">{label}</p>
                <div className="flex items-center gap-1">
                    <CompactStatusButton Icon={Check} variant="success" isActive={status === 'ok'} onClick={() => onStatusChange(index, 'ok')} />
                    <CompactStatusButton Icon={X} variant="destructive" isActive={status === 'not_ok'} onClick={() => onStatusChange(index, 'not_ok')} />
                    <CompactStatusButton Icon={Ban} variant="secondary" isActive={status === 'na'} onClick={() => onStatusChange(index, 'na')} />
                    <Button type="button" size="icon" variant="outline" className="h-8 w-8 p-0 border border-cyan-500/50 bg-cyan-900/30 text-cyan-400" onClick={() => setPhotosVisible(!photosVisible)}>
                         <Camera className="w-4 h-4" />
                    </Button>
                </div>
            </div>
            {photosVisible && (
                <div className="mt-3 space-y-3 p-3 bg-slate-900/50 rounded-md border border-white/10">
                     <label htmlFor={`photo-${index}`} className={`w-full flex items-center justify-center p-3 text-sm rounded-md bg-cyan-900/50 text-cyan-300 border border-cyan-700 transition-colors ${canAddMorePhotos ? 'cursor-pointer hover:bg-cyan-900' : 'cursor-not-allowed opacity-50'}`}>
                        <Camera className="w-5 h-5 mr-2" />
                        {`Anexar Fotos (${photos.length}/5)`}
                    </label>
                    {canAddMorePhotos && (
                        <input
                            id={`photo-${index}`}
                            type="file"
                            multiple
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => onPhotoChange(index, e.target.files)}
                        />
                    )}
                    {photos.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                            {photos.map((photo, photoIndex) => (
                                <div key={photoIndex} className="relative aspect-square">
                                    <img alt={`Preview ${photo.file.name}`} className="w-full h-full rounded object-cover" src={photo.preview} />
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="destructive"
                                        className="absolute -top-1 -right-1 h-6 w-6 rounded-full shadow-lg"
                                        onClick={() => onRemovePhoto(index, photoIndex)}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


const ChecklistForm = ({ equipments, onChecklistSubmitted }) => {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [equipmentId, setEquipmentId] = useState('');
    const [horometer, setHorometer] = useState('');
    const [odometer, setOdometer] = useState('');
    const [evaluator, setEvaluator] = useState('');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState([]);

    const selectedEquipment = useMemo(() => {
        return equipments.find(eq => eq.id.toString() === equipmentId);
    }, [equipmentId, equipments]);

    useEffect(() => {
        if (selectedEquipment) {
            const templateType = selectedEquipment.equipment_type || 'default';
            const template = CHECKLIST_TEMPLATES[templateType] || CHECKLIST_TEMPLATES.default;
            setItems(template.flatMap(group => 
                group.items.map(label => ({
                    group: group.group,
                    label,
                    status: null,
                    photos: [],
                }))
            ));
        } else {
            setItems([]);
        }
    }, [selectedEquipment]);

    const handleStatusChange = (index, status) => {
        const newItems = [...items];
        newItems[index].status = status;
        setItems(newItems);
    };
    
    const handlePhotoChange = (index, files) => {
        const newItems = [...items];
        const currentPhotosCount = newItems[index].photos.length;
        const availableSlots = 5 - currentPhotosCount;
        
        if (availableSlots <= 0) {
            toast({ variant: 'destructive', title: 'Limite Atingido', description: 'Você já anexou o máximo de 5 fotos para este item.' });
            return;
        }

        const filesToAdd = Array.from(files).slice(0, availableSlots);

        const newPhotos = filesToAdd.map(file => ({
            file,
            preview: URL.createObjectURL(file),
        }));

        newItems[index].photos.push(...newPhotos);
        setItems(newItems);
    };

    const handleRemovePhoto = (itemIndex, photoIndex) => {
        const newItems = [...items];
        const photoToRemove = newItems[itemIndex].photos[photoIndex];
        URL.revokeObjectURL(photoToRemove.preview);
        newItems[itemIndex].photos.splice(photoIndex, 1);
        setItems(newItems);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!equipmentId || !evaluator || !horometer) {
            toast({ variant: 'destructive', title: 'Campos Obrigatórios', description: 'Por favor, preencha Equipamento, Avaliador e Horímetro.' });
            return;
        }

        setIsSubmitting(true);
        
        const itemsWithFiles = items.map(item => ({
            ...item,
            photoFiles: item.photos.map(p => p.file),
        }));

        const dataToSubmit = {
            equipment_id: parseInt(equipmentId),
            horometer_reading: horometer ? parseFloat(horometer) : null,
            odometer_reading: odometer ? parseFloat(odometer) : null,
            evaluator,
            notes,
            items: itemsWithFiles,
            evaluation_date: format(new Date(), 'yyyy-MM-dd'),
        };

        try {
            await onChecklistSubmitted(dataToSubmit);
        } finally {
            setIsSubmitting(false);
        }
    };

    const groupedItems = useMemo(() => {
        return items.reduce((acc, item) => {
            if (!acc[item.group]) {
                acc[item.group] = [];
            }
            acc[item.group].push(item);
            return acc;
        }, {});
    }, [items]);

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div>
                    <Label htmlFor="equipment">Equipamento</Label>
                    <Select onValueChange={setEquipmentId} value={equipmentId}>
                        <SelectTrigger id="equipment" className="w-full mt-1 bg-white/10 border-white/20 text-white">
                            <SelectValue placeholder="Selecione um equipamento" />
                        </SelectTrigger>
                        <SelectContent>
                            {(equipments || []).map(eq => (
                                <SelectItem key={eq.id} value={eq.id.toString()}>{eq.name} ({eq.plate || 'S/ Placa'})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 <div>
                    <Label htmlFor="evaluator">Avaliador</Label>
                    <Input id="evaluator" value={evaluator} onChange={e => setEvaluator(e.target.value)} className="bg-white/10 mt-1" placeholder="Seu nome" required />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <Label htmlFor="horometer">Horímetro</Label>
                    <Input id="horometer" type="number" value={horometer} onChange={e => setHorometer(e.target.value)} className="bg-white/10 mt-1" placeholder="Horas" required />
                </div>
                <div>
                    <Label htmlFor="odometer">Odômetro (KM)</Label>
                    <Input id="odometer" type="number" value={odometer} onChange={e => setOdometer(e.target.value)} className="bg-white/10 mt-1" placeholder="KM" />
                </div>
            </div>
            
            {equipmentId && (
                <Accordion type="multiple" defaultValue={Object.keys(groupedItems)} className="w-full space-y-3">
                    {Object.entries(groupedItems).map(([group, groupItems]) => (
                        <AccordionItem value={group} key={group} className="bg-slate-900/30 border border-white/10 rounded-lg">
                            <AccordionTrigger className="px-4 text-lg hover:no-underline">{group}</AccordionTrigger>
                            <AccordionContent className="px-2 sm:px-4">
                                <div className="flex flex-col">
                                    {groupItems.map((item, localIndex) => {
                                        const globalIndex = items.findIndex(i => i.label === item.label && i.group === group);
                                        return (
                                            <ChecklistItemRow
                                                key={globalIndex}
                                                item={item}
                                                index={globalIndex}
                                                onStatusChange={handleStatusChange}
                                                onPhotoChange={handlePhotoChange}
                                                onRemovePhoto={handleRemovePhoto}
                                            />
                                        );
                                    })}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            )}
            
            <div>
                <Label htmlFor="notes">Observações Gerais</Label>
                <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} className="bg-white/10 mt-1" placeholder="Adicione observações gerais aqui..." rows={4} />
            </div>

            <Button type="submit" className="w-full !h-14 text-lg font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white" disabled={isSubmitting || !equipmentId}>
                {isSubmitting ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Save className="mr-2 w-5 h-5" />}
                Salvar Checklist
            </Button>
        </form>
    );
};

export default ChecklistForm;