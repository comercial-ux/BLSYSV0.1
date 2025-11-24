import React from 'react';
    import { format, parseISO } from 'date-fns';

    const ChecklistPrintable = React.forwardRef(({ checklist, equipment }, ref) => {
        if (!checklist || !equipment) return null;

        const getStatusText = (status) => {
            switch (status) {
                case 'ok': return 'OK';
                case 'not_ok': return 'NÃO OK';
                case 'na': return 'N/A';
                default: return 'NÃO AVALIADO';
            }
        };
        
        const getStatusClass = (status) => {
            switch (status) {
                case 'ok': return 'text-green-600 font-medium';
                case 'not_ok': return 'text-red-600 font-bold';
                case 'na': return 'text-gray-500';
                default: return 'text-gray-400 italic';
            }
        };

        let items = [];
        if (checklist.items) {
            if (typeof checklist.items === 'string') {
                try {
                    items = JSON.parse(checklist.items);
                } catch (e) {
                    console.error("Erro ao fazer parse da coluna 'items' (string):", e);
                    items = [];
                }
            } else if (Array.isArray(checklist.items)) {
                items = checklist.items;
            }
        }
        
        const groupedItems = items.reduce((acc, item) => {
            if (typeof item !== 'object' || item === null || !item.label) return acc;
            const group = item.group || 'Verificações Gerais';
            if (!acc[group]) {
                acc[group] = [];
            }
            acc[group].push(item);
            return acc;
        }, {});
        
        return (
            <div ref={ref} className="p-4 font-sans bg-white text-black text-xs">
                <style type="text/css" media="print">
                    {`@page { size: A4; margin: 10mm; } body { -webkit-print-color-adjust: exact; font-size: 10px; } .no-break { page-break-inside: avoid; }`}
                </style>
                
                <header className="flex justify-between items-start mb-4 border-b pb-2">
                    <div>
                        <h1 className="text-lg font-bold">Checklist de Operação de Equipamento</h1>
                        <p>Data da Avaliação: {checklist.evaluation_date ? format(parseISO(checklist.evaluation_date), 'dd/MM/yyyy') : 'N/A'}</p>
                    </div>
                     <div className="text-right text-xs">
                        <p>Relatório gerado em:</p>
                        <p>{format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
                    </div>
                </header>

                <section className="mb-4 p-2 border rounded no-break">
                    <h2 className="text-base font-semibold mb-1">Dados do Equipamento</h2>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                        <p><strong>Equipamento:</strong> {equipment.name || 'N/A'}</p>
                        <p><strong>Modelo:</strong> {equipment.model || 'N/A'}</p>
                        <p><strong>Placa:</strong> {equipment.plate || 'N/A'}</p>
                        <p><strong>Nº de Série:</strong> {equipment.serial_number || 'N/A'}</p>
                        <p><strong>Horímetro:</strong> {checklist.horometer_reading || 'N/A'} h</p>
                        <p><strong>KM:</strong> {checklist.odometer_reading || 'N/A'} km</p>
                    </div>
                </section>

                <section className="no-break">
                    <h2 className="text-base font-semibold mb-2">Itens de Verificação</h2>
                    {Object.keys(groupedItems).length > 0 ? (
                        <div className="space-y-4">
                        {Object.keys(groupedItems).map(groupName => (
                            <div key={groupName} className="mb-2 no-break">
                                <h3 className="text-sm font-bold bg-gray-100 p-1 rounded mb-1">{groupName}</h3>
                                <table className="w-full border-collapse">
                                    <tbody>
                                    {groupedItems[groupName].map((item, index) => {
                                        const label = item?.label || 'Item inválido';
                                        const status = item?.status || null;
                                        const photoUrls = item?.photo_urls || [];

                                        return (
                                            <React.Fragment key={`${groupName}-${index}`}>
                                            <tr className="border-b">
                                                <td className="py-1 pr-2">{String(label)}</td>
                                                <td className={`${getStatusClass(status)} w-20 text-right font-bold`}>
                                                    {getStatusText(status)}
                                                </td>
                                            </tr>
                                            {checklist.includePhotos && photoUrls.length > 0 && (
                                                <tr className="border-b">
                                                    <td colSpan="2" className="py-2">
                                                        <div className="flex flex-wrap gap-2 pl-4">
                                                            {photoUrls.map((url, i) => (
                                                                <img key={i} src={url} alt={`Foto de ${label} ${i+1}`} className="w-24 h-24 object-cover border rounded"/>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                            </React.Fragment>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">Nenhum item de checklist foi registrado.</p>
                    )}
                </section>
                
                {checklist.notes && (
                    <section className="mt-4 p-2 border rounded no-break">
                        <h2 className="text-base font-semibold mb-1">Observações</h2>
                        <p className="whitespace-pre-wrap">{checklist.notes}</p>
                    </section>
                )}

                <footer className="mt-8 pt-4 border-t no-break">
                    <div className="flex justify-between">
                        <div>
                            <p className="mb-6">_________________________________________</p>
                            <p><strong>Responsável:</strong> {checklist.evaluator || 'Não informado'}</p>
                        </div>
                    </div>
                </footer>
            </div>
        );
    });

    export default ChecklistPrintable;