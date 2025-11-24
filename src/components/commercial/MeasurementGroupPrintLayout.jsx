
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import './ProposalPrintLayout.css';

const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

const MeasurementGroupPrintLayout = React.forwardRef(({ group, companyDetails }, ref) => {
    if (!group) return null;

    const logoUrl = "https://horizons-cdn.hostinger.com/248eb4f3-2326-4fb0-87c9-c097668888f4/117ff0f826d422f849e550f5d230d240.jpg";
    const client = group.proposal?.contacts;
    const items = group.items || [];

    return (
        <div ref={ref} className="print-container bg-white text-black p-8">
            <div className="page-preview">
                <div className="page-header flex justify-between items-start border-b pb-4 mb-6">
                    <img src={logoUrl} alt="Logo" className="h-16 object-contain" />
                    <div className="text-right">
                        <h2 className='text-xl font-bold uppercase'>Boletim de Medição Consolidado</h2>
                        <p className='text-sm'>Ref: {group.name}</p>
                        <p className='text-sm'>Data: {new Date().toLocaleDateString()}</p>
                    </div>
                </div>

                <div className="mb-6 bg-gray-50 p-4 rounded border">
                    <h3 className="font-bold mb-2 text-sm uppercase text-gray-600">Dados do Cliente</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <p><span className="font-semibold">Razão Social:</span> {client?.name || client?.trade_name}</p>
                        <p><span className="font-semibold">CNPJ:</span> {client?.cnpj}</p>
                        <p><span className="font-semibold">Contrato:</span> {group.proposal?.proposal_number || 'N/A'}</p>
                        <p><span className="font-semibold">Email:</span> {client?.email}</p>
                    </div>
                </div>

                <section className="my-6">
                    <h3 className="section-title text-sm font-bold mb-2 uppercase border-b pb-1">Detalhamento das Medições</h3>
                    <Table className="w-full text-sm">
                        <TableHeader>
                            <TableRow className="bg-gray-100">
                                <TableHead className="text-black font-bold">Medição Nº</TableHead>
                                <TableHead className="text-black font-bold">Job / Obra</TableHead>
                                <TableHead className="text-black font-bold">Período</TableHead>
                                <TableHead className="text-black font-bold text-right">Horas Totais</TableHead>
                                <TableHead className="text-black font-bold text-right">Valor Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item, index) => {
                                const m = item.measurement;
                                const totals = m.measurement_details?.totals || {};
                                return (
                                    <TableRow key={index}>
                                        <TableCell className="text-black font-medium">#{m.id}</TableCell>
                                        <TableCell className="text-black">#{m.job_id} - {group.proposal?.service_description?.substring(0, 30)}...</TableCell>
                                        <TableCell className="text-black">
                                            {new Date(m.start_date).toLocaleDateString()} a {new Date(m.end_date).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-black text-right">
                                            {parseFloat(totals.total_balance_hours || 0).toFixed(2)}h
                                        </TableCell>
                                        <TableCell className="text-black text-right font-semibold">
                                            {formatCurrency(m.total_value)}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                        <TableFooter>
                            <TableRow className="bg-gray-200 font-bold text-base">
                                <TableCell colSpan="4" className="text-right text-black">VALOR TOTAL CONSOLIDADO</TableCell>
                                <TableCell className="text-right text-black">{formatCurrency(group.total_value)}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </section>
                
                <div className="mt-12 pt-8 border-t flex justify-between text-center text-xs text-gray-500">
                    <div className="w-1/3">
                        <div className="border-b border-black mb-2 w-full h-8"></div>
                        <p>Responsável Técnico</p>
                    </div>
                    <div className="w-1/3">
                        <div className="border-b border-black mb-2 w-full h-8"></div>
                        <p>Aprovação Cliente</p>
                    </div>
                </div>

                <div className="page-footer mt-auto pt-8 text-center text-xs text-gray-400">
                    <p>{companyDetails?.proposal_footer_text}</p>
                </div>
            </div>
        </div>
    );
});

export default MeasurementGroupPrintLayout;
