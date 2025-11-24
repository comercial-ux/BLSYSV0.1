import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, Percent } from 'lucide-react';

const ProposalDetails = ({ details, onDetailChange, onApplyGuarantee, onFetchProposalData }) => {
    const handleInputChange = (field, value) => {
        onDetailChange({ ...details, [field]: value });
    };

    const handleCheckboxChange = (checked) => {
        onDetailChange({ ...details, ignore_lunch_break: checked });
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Parâmetros da Proposta</CardTitle>
                <div className="flex items-center gap-2">
                    <div className="flex items-center space-x-2">
                        <Checkbox 
                            id="ignore_lunch_break" 
                            checked={details.ignore_lunch_break} 
                            onCheckedChange={handleCheckboxChange}
                        />
                        <Label htmlFor="ignore_lunch_break" className="text-sm font-medium leading-none cursor-pointer">
                            Não descontar hora do almoço
                        </Label>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={onFetchProposalData}>
                        <Download className="mr-2 h-4 w-4" />
                        Pegar Dados da Proposta
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-1">
                        <Label>Mobilização (R$)</Label>
                        <Input type="number" step="0.01" value={details.mobilization} onChange={(e) => handleInputChange('mobilization', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <Label>Desmobilização (R$)</Label>
                        <Input type="number" step="0.01" value={details.demobilization} onChange={(e) => handleInputChange('demobilization', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <Label>Franquia Mín. (Horas)</Label>
                        <Input type="number" step="1" value={details.min_hours_guarantee} onChange={(e) => handleInputChange('min_hours_guarantee', e.target.value)} />
                    </div>
                     <div className="space-y-1">
                        <Label>Valor Hora (R$)</Label>
                        <Input type="number" step="0.01" value={details.hour_value} onChange={(e) => handleInputChange('hour_value', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <Label>Valor Hora Extra (R$)</Label>
                        <Input type="number" step="0.01" value={details.extra_hour_value} onChange={(e) => handleInputChange('extra_hour_value', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <Label>Períodos (Contrato)</Label>
                        <Input type="number" step="1" value={details.periods_quantity} onChange={(e) => handleInputChange('periods_quantity', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <Label>Desconto (R$)</Label>
                        <Input type="number" step="0.01" value={details.discount || ''} onChange={(e) => handleInputChange('discount', e.target.value)} placeholder="0,00" />
                    </div>
                    <div className="flex items-end h-full">
                         <Button type="button" onClick={onApplyGuarantee} className="w-full">
                            <Percent className="mr-2 h-4 w-4" />
                            Aplicar Franquia e Recalcular
                        </Button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                    <div className="space-y-1 col-span-2">
                        <Label>Total de Horas a Considerar (Opcional)</Label>
                        <Input 
                            type="number" 
                            step="0.1" 
                            value={details.considered_hours} 
                            onChange={(e) => handleInputChange('considered_hours', e.target.value)}
                            placeholder="Deixe em branco para cálculo automático"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ProposalDetails;