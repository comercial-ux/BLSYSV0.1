import React from 'react';

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
    };

    const MeasurementSummary = ({ totals, proposalDetails }) => {
        const { mobilization = 0, demobilization = 0 } = proposalDetails || {};

        return (
            <div className="mt-6 p-4 border rounded-lg bg-background">
                <h4 className="font-semibold text-lg mb-4 text-foreground">Resumo Financeiro da Medição</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="p-3 bg-muted/50 rounded-md">
                        <p className="text-muted-foreground">Valor Base (Horas/Franquia)</p>
                        <p className="font-bold text-lg">{formatCurrency(totals.total_base_value)}</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-md">
                        <p className="text-muted-foreground">Valor Horas Excedentes</p>
                        <p className="font-bold text-lg text-primary">{formatCurrency(totals.total_overtime_value)}</p>
                    </div>
                     <div className="p-3 bg-muted/50 rounded-md">
                        <p className="text-muted-foreground">Mobilização / Desmob.</p>
                        <p className="font-bold text-lg">{formatCurrency(parseFloat(mobilization) + parseFloat(demobilization))}</p>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-md ring-2 ring-primary">
                        <p className="text-primary font-semibold">Valor Total a Faturar</p>
                        <p className="font-bold text-2xl text-primary">{formatCurrency(totals.total_value)}</p>
                    </div>
                </div>
            </div>
        );
    };

    export default MeasurementSummary;