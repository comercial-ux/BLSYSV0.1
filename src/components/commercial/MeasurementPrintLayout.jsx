import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import './ProposalPrintLayout.css';

const formatTime = (timeStr) => {
    if (!timeStr) return '--:--';
    const parts = timeStr.split(':');
    return `${parts[0]}:${parts[1]}`;
};

const formatHours = (hours) => {
    if (typeof hours !== 'number' || isNaN(hours)) return '0.00';
    return hours.toFixed(2);
};

const PageHeader = ({ logoUrl, measurement, client, job }) => (
    <div className="page-header">
        {logoUrl && <img src={logoUrl} alt="Logo da Empresa" className="proposal-logo" />}
        <div className="header-info">
            <h2 className='text-base font-bold'>Relatório de Medição de Horas</h2>
            <p className='text-xs'>Medição Nº: {measurement.id}</p>
            <p className='text-xs'>Cliente: {client?.name || 'Não informado'}</p>
            <p className='text-xs'>Obra/Job: {job?.job_code || 'Não informado'}</p>
            <p className='text-xs'>Período: {new Date(measurement.start_date + 'T00:00:00').toLocaleDateString()} a {new Date(measurement.end_date + 'T00:00:00').toLocaleDateString()}</p>
        </div>
    </div>
);

const PageFooter = ({ footerText }) => (
    <div className="page-footer">
        <p className='text-xs'>{footerText || 'Rodapé não configurado.'}</p>
    </div>
);

const MeasurementPrintLayout = React.forwardRef(({ measurement, companyDetails, isEditing, onDetailChange }, ref) => {
    if (!measurement) return null;

    const {
        proposal,
        job,
        start_date,
        end_date,
        measurement_details,
    } = measurement;

    const client = proposal?.contacts;
    const equipment = job?.equipment;
    const logoUrl = "https://horizons-cdn.hostinger.com/248eb4f3-2326-4fb0-87c9-c097668888f4/117ff0f826d422f849e550f5d230d240.jpg";
    const { details = [], totals = {}, proposal_snapshot = {} } = measurement_details || {};

    return (
        <div ref={ref} className="print-container bg-white text-black">
            <div className="page-preview">
                <PageHeader logoUrl={logoUrl} measurement={measurement} client={client} job={job}/>

                <section className="my-4">
                    <h3 className="section-title text-sm">DETALHAMENTO DIÁRIO (BDEs)</h3>
                    <div className="overflow-hidden">
                        <Table className="text-[0.6rem] measurement-print-table w-full">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-black font-bold p-0.5 whitespace-nowrap">Data</TableHead>
                                    <TableHead className="text-black font-bold p-0.5 whitespace-nowrap">Dia</TableHead>
                                    <TableHead className="text-black font-bold p-0.5 whitespace-nowrap">Operador</TableHead>
                                    <TableHead className="text-black font-bold p-0.5 whitespace-nowrap">BDE Nº</TableHead>
                                    <TableHead className="text-center text-black font-bold p-0.5 whitespace-nowrap">Início</TableHead>
                                    <TableHead className="text-center text-black font-bold p-0.5 whitespace-nowrap">Intervalo</TableHead>
                                    <TableHead className="text-center text-black font-bold p-0.5 whitespace-nowrap">Término</TableHead>
                                    <TableHead className="text-center text-black font-bold p-0.5 whitespace-nowrap">H. Parada</TableHead>
                                    <TableHead className="text-center text-black font-bold p-0.5 whitespace-nowrap">H. Totais</TableHead>
                                    <TableHead className="text-center text-black font-bold p-0.5 whitespace-nowrap">H. Garantia</TableHead>
                                    <TableHead className="text-center text-black font-bold p-0.5 whitespace-nowrap">H. Exced.</TableHead>
                                    <TableHead className="text-center text-black font-bold p-0.5 whitespace-nowrap">Saldo Global</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {details.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="text-black p-0.5 whitespace-nowrap">{new Date(item.date + 'T00:00:00').toLocaleDateString()}</TableCell>
                                        <TableCell className="text-black p-0.5 whitespace-nowrap">{item.dayOfWeek}</TableCell>
                                        <TableCell className="text-black p-0.5 operator-name-cell max-w-[50px] overflow-hidden text-ellipsis">{item.operator_name || '-'}</TableCell>
                                        <TableCell className="text-black p-0.5 whitespace-nowrap">{item.report_number || '-'}</TableCell>
                                        <TableCell className="text-center text-black p-0.5 whitespace-nowrap">{formatTime(item.start_time)}</TableCell>
                                        <TableCell className="text-center text-black p-0.5 whitespace-nowrap">{`${formatTime(item.lunch_start_time)}-${formatTime(item.lunch_end_time)}`}</TableCell>
                                        <TableCell className="text-center text-black p-0.5 whitespace-nowrap">{formatTime(item.end_time)}</TableCell>
                                        <TableCell className="text-center text-black p-0.5 whitespace-nowrap">{formatHours(item.downtime_hours)}</TableCell>
                                        <TableCell className="text-center text-black p-0.5 whitespace-nowrap">{formatHours(item.total_hours)}</TableCell>
                                        <TableCell className="text-center text-black p-0.5 whitespace-nowrap">{formatHours(item.guarantee_hours)}</TableCell>
                                        <TableCell className="text-center text-black p-0.5 whitespace-nowrap font-bold bg-yellow-100">{formatHours(item.overtime_hours)}</TableCell>
                                        <TableCell className="text-center text-black p-0.5 whitespace-nowrap">{formatHours(item.balance_hours)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableFooter>
                                <TableRow className="font-bold bg-gray-100">
                                    <TableCell colSpan="7" className="text-right text-black p-0.5">TOTAIS</TableCell>
                                    <TableCell className="text-center text-black p-0.5">{formatHours(totals.total_downtime_hours)}</TableCell>
                                    <TableCell className="text-center text-black p-0.5">{formatHours(totals.total_total_hours)}</TableCell>
                                    <TableCell className="text-center text-black p-0.5">{formatHours(totals.total_guarantee_hours)}</TableCell>
                                    <TableCell className="text-center text-black p-0.5 bg-yellow-200">{formatHours(totals.total_overtime_hours)}</TableCell>
                                    <TableCell className="text-center text-black p-0.5">{formatHours(totals.total_balance_hours)}</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </div>
                </section>
                
                <section className="mt-4">
                     <h3 className="section-title text-sm">RESUMO FINANCEIRO</h3>
                     <div className="w-full sm:w-1/2 ml-auto mt-2">
                        <Table className="text-xs">
                            <TableBody>
                                <TableRow>
                                    <TableCell className="text-black p-0.5">Total de Horas Excedentes</TableCell>
                                    <TableCell className="text-right text-black font-bold p-0.5">{formatHours(totals.total_overtime_hours)} hs</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-black p-0.5">Valor Hora Excedente</TableCell>
                                    <TableCell className="text-right text-black font-bold p-0.5">R$ {parseFloat(proposal_snapshot.extra_hour_value || 0).toFixed(2)}</TableCell>
                                </TableRow>
                                 <TableRow>
                                    <TableCell className="text-black font-bold p-0.5">Subtotal Horas Excedentes</TableCell>
                                    <TableCell className="text-right text-black font-bold p-0.5">R$ {parseFloat(totals.total_overtime_value || 0).toFixed(2)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-black p-0.5">Mobilização</TableCell>
                                    <TableCell className="text-right text-black p-0.5">R$ {parseFloat(proposal_snapshot.mobilization || 0).toFixed(2)}</TableCell>
                                </TableRow>
                                 <TableRow>
                                    <TableCell className="text-black p-0.5">Desmobilização</TableCell>
                                    <TableCell className="text-right text-black p-0.5">R$ {parseFloat(proposal_snapshot.demobilization || 0).toFixed(2)}</TableCell>
                                </TableRow>
                                <TableRow className="bg-gray-200">
                                    <TableCell className="text-black text-base font-bold p-0.5">VALOR TOTAL DA MEDIÇÃO</TableCell>
                                    <TableCell className="text-right text-black text-base font-bold p-0.5">R$ {parseFloat(totals.total_value || 0).toFixed(2)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                     </div>
                </section>

                <PageFooter footerText={companyDetails?.proposal_footer_text} />
            </div>
        </div>
    );
});

export default MeasurementPrintLayout;