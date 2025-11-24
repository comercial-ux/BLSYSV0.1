import React, { useState, useRef } from 'react';
    import { useForm, Controller } from 'react-hook-form';
    import { useNavigate } from 'react-router-dom';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import toast from 'react-hot-toast';
    import { v4 as uuidv4 } from 'uuid';
    import FieldLayout from '@/components/field/FieldLayout';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Textarea } from '@/components/ui/textarea';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Loader2, Camera, MapPin } from 'lucide-react';
    import { format } from 'date-fns';

    const EXPENSE_TYPES = ['Combustível', 'Alimentação', 'Hospedagem', 'Transporte', 'Outros'];

    const ExpenseReportPage = () => {
        const { user } = useAuth();
        const navigate = useNavigate();
        const { register, handleSubmit, control, setValue, formState: { errors, isSubmitting } } = useForm({
            defaultValues: {
                expense_date: format(new Date(), 'yyyy-MM-dd'),
                type: 'Outros',
                value: '',
                description: '',
            }
        });

        const [imagePreview, setImagePreview] = useState(null);
        const [imageFile, setImageFile] = useState(null);
        const [location, setLocation] = useState(null);
        const [isProcessing, setIsProcessing] = useState(false);
        const fileInputRef = useRef(null);

        const handleCapture = () => {
            setIsProcessing(true);
            const toastId = toast.loading('Obtendo localização...');
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        const address = await getAddressFromCoords(latitude, longitude);
                        setLocation({ latitude, longitude, address });
                        toast.dismiss(toastId);
                        fileInputRef.current.click();
                    } catch (addrError) {
                        toast.error('Erro ao buscar endereço. Tente novamente.', { id: toastId });
                        setIsProcessing(false);
                    }
                },
                (error) => {
                    toast.dismiss(toastId);
                    toast.error('Não foi possível obter a localização. Verifique as permissões.');
                    console.error("Geolocation error:", error);
                    setIsProcessing(false);
                    fileInputRef.current.click();
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        };

        const getAddressFromCoords = async (lat, lon) => {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            if (!response.ok) throw new Error('Falha ao reverter geocodificação');
            const data = await response.json();
            return data.display_name || 'Endereço não encontrado';
        };

        const handleFileChange = (event) => {
            const file = event.target.files[0];
            if (file) {
                setImageFile(file);
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImagePreview(reader.result);
                };
                reader.readAsDataURL(file);
            }
            setIsProcessing(false);
        };

        const onSubmit = async (data) => {
            if (!user) {
                toast.error('Usuário não autenticado.');
                return;
            }
            if (!imageFile) {
                toast.error('Por favor, capture um comprovante.');
                return;
            }

            const toastId = toast.loading('Enviando despesa...');
            try {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${uuidv4()}.${fileExt}`;
                const filePath = `${user.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('expense-receipts')
                    .upload(filePath, imageFile);

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from('expense-receipts')
                    .getPublicUrl(filePath);

                const expenseData = {
                    ...data,
                    user_id: user.id,
                    value: parseFloat(data.value) || 0,
                    receipt_url: urlData.publicUrl,
                    receipt_filename: fileName,
                    latitude: location?.latitude,
                    longitude: location?.longitude,
                    address: location?.address,
                };

                const { error: insertError } = await supabase.from('travel_expenses').insert(expenseData);
                if (insertError) throw insertError;

                toast.success('Despesa enviada! A análise será feita em segundo plano.', { id: toastId, duration: 5000 });
                navigate('/field');

            } catch (error) {
                toast.error(`Erro ao salvar: ${error.message}`, { id: toastId });
            }
        };

        return (
            <FieldLayout title="Lançar Despesa de Viagem">
                <Card className="bg-slate-800/60 border-white/20 text-white backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                            Nova Despesa
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {!imagePreview ? (
                                <Button type="button" onClick={handleCapture} className="w-full h-32 text-lg" disabled={isProcessing}>
                                    {isProcessing ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Camera className="mr-2 h-6 w-6" />}
                                    Capturar Comprovante
                                </Button>
                            ) : (
                                <div className="w-full h-48 bg-muted rounded-md flex items-center justify-center overflow-hidden relative">
                                    <img src={imagePreview} alt="Preview" className="max-w-full max-h-full object-contain" />
                                    <Button type="button" size="sm" variant="destructive" className="absolute top-2 right-2" onClick={() => { setImagePreview(null); setImageFile(null); }}>
                                        Remover
                                    </Button>
                                </div>
                            )}

                            <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

                            {location && (
                                <div className="flex items-center gap-2 text-sm text-green-400 p-2 bg-green-900/50 rounded-md">
                                    <MapPin className="h-4 w-4" />
                                    <span>Localização capturada: {location.address}</span>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="expense_date">Data da Despesa</Label>
                                <Input id="expense_date" type="date" {...register('expense_date', { required: 'Data é obrigatória' })} />
                                {errors.expense_date && <p className="text-red-400 text-sm">{errors.expense_date.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="type">Tipo de Despesa</Label>
                                <Controller
                                    name="type"
                                    control={control}
                                    rules={{ required: 'Tipo é obrigatório' }}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger><SelectValue placeholder="Selecione o tipo..." /></SelectTrigger>
                                            <SelectContent>
                                                {EXPENSE_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.type && <p className="text-red-400 text-sm">{errors.type.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="value">Valor (R$)</Label>
                                <Input id="value" type="number" step="0.01" {...register('value')} placeholder="0,00 (opcional, será preenchido pela IA)" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Descrição</Label>
                                <Textarea id="description" {...register('description')} placeholder="Ex: Almoço com cliente, combustível para viagem..." />
                            </div>

                            <Button type="submit" className="w-full" disabled={isSubmitting || isProcessing}>
                                {(isSubmitting || isProcessing) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Enviar Despesa para Análise
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </FieldLayout>
        );
    };

    export default ExpenseReportPage;