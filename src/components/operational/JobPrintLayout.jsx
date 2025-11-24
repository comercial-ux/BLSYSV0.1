import React from 'react';

const JobPrintLayout = React.forwardRef(({ job }, ref) => {
    if (!job) return null;

    const client = job.proposal?.contacts;

    return (
        <div ref={ref} className="p-10 bg-white text-black font-sans">
            <header className="flex justify-between items-center pb-4 border-b-2 border-gray-300">
                <div className="w-1/3">
                    <img src="https://horizons-cdn.hostinger.com/248eb4f3-2326-4fb0-87c9-c097668888f4/b607e9ce0015a361a9347a3be7e2a349.png" alt="Logo" className="h-16"/>
                </div>
                <div className="w-2/3 text-center">
                    <h1 className="text-3xl font-bold">ORDEM DE SERVIÇO</h1>
                </div>
                <div className="w-1/3 text-right">
                    <p className="font-bold text-lg">OS Nº: <span className="font-mono">{job.job_code}</span></p>
                    <p className="text-sm">Data de Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
                </div>
            </header>

            <main className="mt-6">
                <section className="mb-6">
                    <h2 className="text-xl font-bold mb-2 p-2 bg-gray-200">INFORMAÇÕES DO CLIENTE</h2>
                    <div className="grid grid-cols-2 gap-4 p-2">
                        <div><strong className="block text-gray-600">CLIENTE:</strong> {client?.name || 'N/A'}</div>
                        <div><strong className="block text-gray-600">CNPJ/CPF:</strong> {client?.cnpj || client?.cpf || 'N/A'}</div>
                        <div><strong className="block text-gray-600">ENDEREÇO DA OBRA:</strong> {job.job_site_details?.address || 'N/A'}</div>
                        <div><strong className="block text-gray-600">CONTATO:</strong> {client?.phone || 'N/A'}</div>
                    </div>
                </section>

                <section className="mb-6">
                    <h2 className="text-xl font-bold mb-2 p-2 bg-gray-200">DETALHES DO SERVIÇO</h2>
                    <div className="grid grid-cols-2 gap-4 p-2">
                        <div><strong className="block text-gray-600">DATA DE INÍCIO:</strong> {job.start_date ? new Date(job.start_date + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A'}</div>
                        <div><strong className="block text-gray-600">DATA DE TÉRMINO:</strong> {job.end_date ? new Date(job.end_date + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A'}</div>
                    </div>
                </section>

                <section className="mb-6">
                    <h2 className="text-xl font-bold mb-2 p-2 bg-gray-200">RECURSOS ALOCADOS</h2>
                    <div className="p-2 space-y-2">
                        <p><strong className="text-gray-600">EQUIPAMENTO PRINCIPAL:</strong> {job.equipment?.name || 'Não definido'}</p>
                        <p><strong className="text-gray-600">OPERADOR:</strong> {job.operator?.name || 'Não definido'}</p>
                    </div>
                </section>

                <section className="mb-6">
                    <h2 className="text-xl font-bold mb-2 p-2 bg-gray-200">OBSERVAÇÕES</h2>
                    <div className="p-2 border border-gray-300 min-h-[100px] rounded">
                        <p className="whitespace-pre-wrap">{job.notes || 'Nenhuma observação.'}</p>
                    </div>
                </section>

                <section className="mt-20">
                    <div className="grid grid-cols-2 gap-10 text-center">
                        <div>
                            <div className="border-t-2 border-gray-400 pt-2">
                                <p className="font-bold">ASSINATURA DO OPERADOR</p>
                                <p className="text-sm text-gray-600">{job.operator?.name || '_______________________________'}</p>
                            </div>
                        </div>
                        <div>
                            <div className="border-t-2 border-gray-400 pt-2">
                                <p className="font-bold">ASSINATURA DO CLIENTE</p>
                                <p className="text-sm text-gray-600">_______________________________</p>
                            </div>
                        </div>
                    </div>
                </section>

            </main>

            <footer className="text-center text-xs text-gray-500 mt-10 pt-4 border-t-2 border-gray-300">
                <p>BL SOLUÇÕES EM TRANSPORTE E LOGÍSTICA LTDA | CNPJ: 45.418.947/0001-57</p>
                <p>Rua Exemplo, 123, Bairro, Cidade - ES, CEP 12345-678 | Telefone: (27) 99999-9999</p>
            </footer>
        </div>
    );
});

export default JobPrintLayout;