import React from 'react';

const MaintenancePrintLayout = React.forwardRef(({ maintenance, equipments }, ref) => {
    if (!maintenance) return null;

    const equipment = Array.isArray(equipments) ? equipments.find(e => e.id === maintenance.equipment_id) : null;

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const formatCurrency = (value) => {
        if (value === null || value === undefined) return 'N/A';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const beforeImages = maintenance.before_image_signed_urls || [];
    const afterImages = maintenance.after_image_signed_urls || [];

    return (
        <div ref={ref} className="p-8 font-sans text-gray-800 bg-white">
            <header className="text-center mb-8 border-b-2 border-gray-300 pb-4">
                <h1 className="text-3xl font-bold text-gray-900">Ficha de Manutenção</h1>
                <p className="text-lg text-gray-600">Relatório de Serviço</p>
            </header>

            <section className="mb-6">
                <h2 className="text-xl font-semibold border-b border-gray-200 pb-2 mb-3 text-gray-700">Detalhes da Manutenção</h2>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                    <div><strong>ID da Manutenção:</strong> {maintenance.id}</div>
                    <div><strong>Data de Criação:</strong> {formatDate(maintenance.created_at)}</div>
                    <div><strong>Tipo:</strong> <span className="capitalize">{maintenance.type}</span></div>
                    <div><strong>Categoria:</strong> <span className="capitalize">{maintenance.category || 'N/A'}</span></div>
                    <div><strong>Status:</strong> {maintenance.status}</div>
                    <div><strong>Técnico Responsável:</strong> {maintenance.technician || 'N/A'}</div>
                </div>
            </section>

            <section className="mb-6">
                <h2 className="text-xl font-semibold border-b border-gray-200 pb-2 mb-3 text-gray-700">Informações do Equipamento</h2>
                {equipment ? (
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                        <div><strong>Nome:</strong> {equipment.name}</div>
                        <div><strong>Modelo:</strong> {equipment.model || 'N/A'}</div>
                        <div><strong>Placa:</strong> {equipment.plate || 'N/A'}</div>
                        <div><strong>Nº de Série:</strong> {equipment.serial_number || 'N/A'}</div>
                        <div><strong>Horímetro na Manutenção:</strong> {maintenance.hours_at_maintenance || 'N/A'} hs</div>
                        <div><strong>KM na Manutenção:</strong> {maintenance.km_at_maintenance || 'N/A'} km</div>
                    </div>
                ) : (
                    <p>Equipamento não encontrado.</p>
                )}
            </section>

            <section className="mb-6">
                <h2 className="text-xl font-semibold border-b border-gray-200 pb-2 mb-3 text-gray-700">Descrição do Serviço</h2>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-md">{maintenance.description || 'Nenhuma descrição fornecida.'}</p>
            </section>

            {maintenance.maintenance_parts && maintenance.maintenance_parts.length > 0 && (
                <section className="mb-6">
                    <h2 className="text-xl font-semibold border-b border-gray-200 pb-2 mb-3 text-gray-700">Peças Utilizadas</h2>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-2 border">Item</th>
                                <th className="p-2 border">Part Number</th>
                                <th className="p-2 border text-right">Quantidade</th>
                            </tr>
                        </thead>
                        <tbody>
                            {maintenance.maintenance_parts.map((part, index) => (
                                <tr key={`part-${index}`} className="hover:bg-gray-50">
                                    <td className="p-2 border">{part.inventory_parts?.name || 'Peça não encontrada'}</td>
                                    <td className="p-2 border">{part.inventory_parts?.part_number || 'N/A'}</td>
                                    <td className="p-2 border text-right">{part.quantity_used} {part.inventory_parts?.unit || ''}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            )}

            {maintenance.maintenance_tertiary_services && maintenance.maintenance_tertiary_services.length > 0 && (
                <section className="mb-6">
                    <h2 className="text-xl font-semibold border-b border-gray-200 pb-2 mb-3 text-gray-700">Serviços Terceirizados</h2>
                     <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-2 border">Serviço</th>
                                <th className="p-2 border">Observações</th>
                                <th className="p-2 border text-right">Custo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {maintenance.maintenance_tertiary_services.map((service, index) => (
                                <tr key={`service-${index}`} className="hover:bg-gray-50">
                                    <td className="p-2 border">{service.tertiary_services?.name || 'Serviço não encontrado'}</td>
                                    <td className="p-2 border">{service.notes || 'N/A'}</td>
                                    <td className="p-2 border text-right">{formatCurrency(service.cost)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            )}

            {(beforeImages.length > 0 || afterImages.length > 0) && (
                <section className="mb-6" style={{ pageBreakBefore: 'always' }}>
                    <h2 className="text-xl font-semibold border-b border-gray-200 pb-2 mb-3 text-gray-700">Registros Fotográficos</h2>
                    {beforeImages.length > 0 && (
                        <div className="mb-4">
                            <h3 className="font-semibold text-gray-600 mb-2">Antes da Manutenção:</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {beforeImages.map((url, index) => (
                                    <img key={`before-${index}`} src={url} alt={`Antes ${index + 1}`} className="w-full h-auto object-cover border rounded-md" />
                                ))}
                            </div>
                        </div>
                    )}
                    {afterImages.length > 0 && (
                        <div>
                            <h3 className="font-semibold text-gray-600 mb-2">Depois da Manutenção:</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {afterImages.map((url, index) => (
                                    <img key={`after-${index}`} src={url} alt={`Depois ${index + 1}`} className="w-full h-auto object-cover border rounded-md" />
                                ))}
                            </div>
                        </div>
                    )}
                </section>
            )}

            <footer className="mt-12 pt-8 border-t-2 border-gray-300 text-center">
                <div className="grid grid-cols-2 gap-8">
                    <div className="mt-16">
                        <hr className="border-gray-400 mb-2" />
                        <p className="text-sm">Assinatura do Técnico</p>
                        <p className="text-sm">{maintenance.technician || '____________________'}</p>
                    </div>
                    <div className="mt-16">
                        <hr className="border-gray-400 mb-2" />
                        <p className="text-sm">Assinatura do Responsável</p>
                    </div>
                </div>
            </footer>
        </div>
    );
});

export default MaintenancePrintLayout;