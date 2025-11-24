
import React from 'react';
import { format } from 'date-fns';

const ProposalPrintLayout = React.forwardRef(({ proposal, commercialData, companyDetails }, ref) => {
    const formatCurrency = (value) => {
        const numValue = Number(value);
        if (isNaN(numValue)) return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numValue);
    };

    const items = proposal.items_list || [];
    
    // Calculate Subtotal
    const subtotal = items.reduce((acc, item) => {
        return acc + (parseFloat(item.global_value) || 0);
    }, 0);

    // Calculate Total Estimated Value
    const totalEstimated = parseFloat(proposal.total_estimated_value) || subtotal;

    // DETERMINE IF TOTAL SHOULD BE SHOWN
    const showTotalValue = proposal.contract_parameters?.show_total_value ?? true;

    // Helper to find item name
    const getServiceItemName = (id) => {
        const item = commercialData?.serviceItems?.find(i => String(i.id) === String(id));
        return item ? item.name : 'Item não encontrado';
    };

    // Process clauses logic similar to view
    let clauses = proposal.clauses_content || [];
    if (clauses.length === 0 && proposal.contract_parameters?.included_clauses && commercialData?.clauses) {
        const activeClauses = commercialData.clauses;
        const includedIds = new Set((proposal.contract_parameters.included_clauses || []).map(String));
        const included = activeClauses.filter(c => includedIds.has(String(c.id)));
        const main = included.filter(c => !c.parent_id).sort((a,b) => (a.display_order || 0) - (b.display_order || 0));
        clauses = main.map(parent => {
            const sub = included.filter(c => c.parent_id === parent.id).sort((a,b) => (a.display_order || 0) - (b.display_order || 0));
            return {
                title: parent.title,
                content: parent.content,
                sub_clauses: sub.map(s => ({ title: s.title, content: s.content }))
            };
        });
    }

    return (
        <div ref={ref} className="print-container font-sans text-black bg-white p-8 max-w-[210mm] mx-auto">
            {/* Header with Logo */}
            <div className="flex justify-between items-start border-b pb-6 mb-8">
                <div className="w-1/3">
                    {companyDetails?.logo_url && (
                        <img 
                            src={companyDetails.logo_url} 
                            alt="Company Logo" 
                            className="h-16 object-contain"
                        />
                    )}
                </div>
                <div className="text-right">
                    <h1 className="text-2xl font-bold text-gray-900">PROPOSTA COMERCIAL</h1>
                    <p className="text-lg font-medium text-gray-600">Nº {proposal.proposal_number || proposal.id}</p>
                    <p className="text-sm mt-2">Data: {proposal.proposal_date ? format(new Date(proposal.proposal_date), 'dd/MM/yyyy') : '-'}</p>
                </div>
            </div>

            {/* Client Info */}
            <div className="mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Dados do Cliente</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="mb-1"><span className="font-semibold">Razão Social:</span> {proposal.contacts?.name}</p>
                        <p className="mb-1"><span className="font-semibold">CNPJ/CPF:</span> {proposal.contacts?.cnpj || proposal.contacts?.cpf || '-'}</p>
                        <p><span className="font-semibold">Endereço:</span> {proposal.contacts?.address_street}, {proposal.contacts?.address_number} - {proposal.contacts?.address_city}/{proposal.contacts?.address_state}</p>
                    </div>
                    <div>
                        <p className="mb-1"><span className="font-semibold">Contato:</span> {proposal.contacts?.phone || '-'}</p>
                        <p className="mb-1"><span className="font-semibold">Email:</span> {proposal.contacts?.email || '-'}</p>
                    </div>
                </div>
            </div>

            {/* Description */}
            <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-800 mb-3 border-b pb-1">1. Objeto da Proposta</h2>
                <p className="text-sm text-justify whitespace-pre-line">{proposal.service_description || 'Descrição dos serviços conforme detalhamento abaixo.'}</p>
            </div>

            {/* Items Table */}
            <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-800 mb-3 border-b pb-1">2. Detalhamento Econômico</h2>
                <table className="w-full text-xs border-collapse border border-gray-300 mb-4">
                    <thead className="bg-gray-100 text-gray-700">
                        <tr>
                            <th className="border p-2 text-left">Descrição</th>
                            <th className="border p-2 text-center">Garantia (h)</th>
                            <th className="border p-2 text-right">Valor/Hora</th>
                            <th className="border p-2 text-center">Períodos</th>
                            <th className="border p-2 text-right">Garantia Min. (R$)</th>
                            <th className="border p-2 text-right">Mob/Desmob</th>
                            <th className="border p-2 text-right bg-gray-200 font-bold">Valor Global</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, idx) => (
                            <tr key={idx} className="border-b">
                                <td className="border p-2 font-medium">{getServiceItemName(item.service_item_id)}</td>
                                <td className="border p-2 text-center">{item.guarantee_hours_day}</td>
                                <td className="border p-2 text-right">{formatCurrency(item.value_hour_day)}</td>
                                <td className="border p-2 text-center">{item.period}</td>
                                <td className="border p-2 text-right">{formatCurrency(item.min_guarantee_worked_days)}</td>
                                <td className="border p-2 text-right">{formatCurrency(item.mobilization_demobilization)}</td>
                                <td className="border p-2 text-right font-bold bg-gray-50">{formatCurrency(item.global_value)}</td>
                            </tr>
                        ))}
                        
                        {showTotalValue && (
                            <>
                                <tr className="bg-gray-50 font-bold">
                                    <td colSpan={6} className="border p-2 text-right">SUBTOTAL:</td>
                                    <td className="border p-2 text-right">{formatCurrency(subtotal)}</td>
                                </tr>
                                <tr className="bg-gray-200 font-bold text-sm">
                                    <td colSpan={6} className="border p-2 text-right">TOTAL ESTIMADO:</td>
                                    <td className="border p-2 text-right text-base">{formatCurrency(totalEstimated)}</td>
                                </tr>
                            </>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Contract Parameters */}
            <div className="mb-8 bg-gray-50 p-4 rounded border border-gray-200">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Condições Comerciais</h2>
                <div className="grid grid-cols-2 gap-4 text-xs">
                    <p><strong>Prazo de Pagamento:</strong> {proposal.payment_term_days ? `${proposal.payment_term_days} dias` : 'À vista'}</p>
                    <p><strong>Validade da Proposta:</strong> {proposal.validity_date ? format(new Date(proposal.validity_date), 'dd/MM/yyyy') : '15 dias'}</p>
                    <p><strong>Franquia Horas Extras:</strong> {proposal.contract_parameters?.overtime_percentage || '50'}%</p>
                    <p><strong>Tipo de Contrato:</strong> {proposal.contract_period_type || 'Mensal'}</p>
                </div>
            </div>

            {/* Clauses */}
            {clauses.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-1">3. Condições Gerais</h2>
                    <div className="space-y-4 text-sm text-justify">
                        {clauses.map((clause, idx) => (
                            <div key={idx}>
                                <h3 className="font-bold text-gray-800 mb-1">{idx + 1}. {clause.title}</h3>
                                <p className="text-gray-700 whitespace-pre-line">{clause.content}</p>
                                {clause.sub_clauses && clause.sub_clauses.length > 0 && (
                                    <div className="ml-4 mt-2 border-l-2 border-gray-300 pl-3">
                                        {clause.sub_clauses.map((sub, sIdx) => (
                                            <div key={sIdx} className="mt-2">
                                                <h4 className="font-semibold text-xs uppercase text-gray-600">{sub.title}</h4>
                                                <p className="text-gray-600">{sub.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="mt-12 pt-8 border-t-2 border-gray-300 text-center text-xs text-gray-500">
                <p>{companyDetails?.company_name || 'Empresa'} - {companyDetails?.address_city}/{companyDetails?.address_state}</p>
                <p>{companyDetails?.email} | {companyDetails?.phone}</p>
            </div>
        </div>
    );
});

export default ProposalPrintLayout;
