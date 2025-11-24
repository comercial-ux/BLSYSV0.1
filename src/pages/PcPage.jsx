import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import PcLayout from '@/components/pc/PcLayout';
import PcNav from '@/components/pc/PcNav';
import PartEntryForm from '@/components/pc/PartEntryForm';
import PartDispatchForm from '@/components/pc/PartDispatchForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import useAppHandlers from '@/hooks/useAppHandlers';

const PcPage = () => {
    const { formType } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user } = useAuth();
    const { inventory, refetchData } = useData();
    const { uploadImages } = useAppHandlers({ refetchData });

    const handleSuccess = (message) => {
        refetchData();
        toast({
            title: "Sucesso!",
            description: message,
            className: "bg-green-600 text-white border-green-700",
        });
        navigate('/pc');
    };

    const handlePartEntrySave = async (data) => {
        const { isNew, partData, invoicePhoto, productPhoto } = data;
        let invoice_url = null;
        let product_photo_url = null;

        if (invoicePhoto) {
            const urls = await uploadImages([invoicePhoto], 'inventory-files', `${user.id}/invoices`);
            if (urls.length > 0) invoice_url = urls[0];
        }
        if (productPhoto) {
            const urls = await uploadImages([productPhoto], 'inventory-files', `${user.id}/products`);
            if (urls.length > 0) product_photo_url = urls[0];
        }

        const finalPartData = {
            name: partData.name,
            part_number: partData.part_number,
            unit: partData.unit,
            user_id: user.id,
            purchase_price: parseFloat(partData.purchase_price) || null,
            supplier: partData.supplier,
            notes: partData.notes,
            quantity: parseInt(partData.quantity, 10),
            invoice_url: invoice_url,
            photo_urls: product_photo_url ? [product_photo_url] : [],
        };

        if (isNew) {
            const { data: newPart, error } = await supabase
                .from('inventory_parts')
                .insert({ ...finalPartData, is_active: true })
                .select()
                .single();

            if (error) {
                toast({ variant: 'destructive', title: 'Erro ao criar peça', description: error.message });
                return;
            }
            
            await supabase.from('inventory_movements').insert({
                part_id: newPart.id,
                user_id: user.id,
                type: 'entrada_inicial',
                quantity_change: newPart.quantity,
                price_at_time: newPart.purchase_price,
                supplier_at_time: newPart.supplier,
                notes: 'Criação de novo item no inventário'
            });

        } else {
            const existingPart = inventory.find(p => p.id === parseInt(partData.id, 10));
            const newQuantity = existingPart.quantity + finalPartData.quantity;
            const updatedPhotoUrls = [...(existingPart.photo_urls || [])];
            if(product_photo_url && !updatedPhotoUrls.includes(product_photo_url)) {
                updatedPhotoUrls.push(product_photo_url);
            }

            const { error } = await supabase
                .from('inventory_parts')
                .update({ 
                    quantity: newQuantity, 
                    purchase_price: finalPartData.purchase_price, 
                    supplier: finalPartData.supplier,
                    name: finalPartData.name,
                    part_number: finalPartData.part_number,
                    unit: finalPartData.unit,
                    notes: finalPartData.notes,
                    invoice_url: invoice_url || existingPart.invoice_url,
                    photo_urls: updatedPhotoUrls
                })
                .eq('id', partData.id);
            
            if (error) {
                toast({ variant: 'destructive', title: 'Erro ao atualizar estoque', description: error.message });
                return;
            }

            await supabase.from('inventory_movements').insert({
                part_id: partData.id,
                user_id: user.id,
                type: 'entrada_compra',
                quantity_change: finalPartData.quantity,
                price_at_time: finalPartData.purchase_price,
                supplier_at_time: finalPartData.supplier,
                notes: 'Entrada de novas unidades'
            });
        }
        handleSuccess("Entrada de peça registrada com sucesso.");
    };

    const handlePartDispatchSave = async (data) => {
        const { part_id, quantity, notes } = data;
        const partToUpdate = inventory.find(p => p.id === parseInt(part_id, 10));

        if (!partToUpdate || partToUpdate.quantity < quantity) {
            toast({ variant: 'destructive', title: 'Estoque insuficiente' });
            return;
        }

        const newQuantity = partToUpdate.quantity - parseInt(quantity, 10);
        const { error } = await supabase
            .from('inventory_parts')
            .update({ quantity: newQuantity })
            .eq('id', part_id);

        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao dar baixa', description: error.message });
            return;
        }

        await supabase.from('inventory_movements').insert({
            part_id: part_id,
            user_id: user.id,
            type: 'saida_uso',
            quantity_change: -parseInt(quantity, 10),
            notes: notes,
        });

        handleSuccess("Saída de peça registrada com sucesso.");
    };

    const renderForm = () => {
        switch (formType) {
            case 'entry':
                return <PartEntryForm inventory={inventory} onSave={handlePartEntrySave} />;
            case 'dispatch':
                return <PartDispatchForm inventory={inventory} onSave={handlePartDispatchSave} />;
            default:
                return <PcNav />;
        }
    };

    const getTitle = () => {
        switch (formType) {
            case 'entry':
                return 'Registrar Entrada de Peça';
            case 'dispatch':
                return 'Registrar Saída de Peça';
            default:
                return 'Almoxarifado';
        }
    };

    return (
        <PcLayout title={getTitle()}>
            <Card className="bg-slate-800/60 border-white/20 text-white backdrop-blur-sm w-full max-w-2xl mx-auto">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                        {getTitle()}
                    </CardTitle>
                    {formType && (
                        <Button variant="ghost" size="sm" onClick={() => navigate('/pc')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    {renderForm()}
                </CardContent>
            </Card>
        </PcLayout>
    );
};

export default PcPage;