
import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Printer, Edit, X, FileDown } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { format } from 'date-fns';
import { generateProposalDocx } from './exportProposalToDocx';
import { toast } from '@/components/ui/use-toast';

const ProposalView = ({ proposal, onClose, onEdit }) => {
  const componentRef = useRef();
  const { commercialData, companyDetails, users } = useData();

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Proposta_${proposal?.proposal_number || proposal?.id}`,
  });

  const handleExportDocx = async () => {
    try {
      toast({
        title: "Gerando DOCX...",
        description: "Aguarde enquanto preparamos o arquivo para download.",
      });
      await generateProposalDocx(proposal, commercialData, companyDetails, users);
      toast({
        title: "Sucesso!",
        description: "O download do arquivo DOCX iniciará em instantes.",
        variant: "success"
      });
    } catch (error) {
      console.error("Erro ao exportar DOCX:", error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o arquivo DOCX.",
        variant: "destructive"
      });
    }
  };

  if (!proposal) return null;

  const showTotalValue = proposal.contract_parameters?.show_total_value ?? true;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const getServiceItemName = (id) => {
    const item = commercialData?.serviceItems?.find(i => String(i.id) === String(id));
    return item ? item.name : 'Item não encontrado';
  };

  const getConsultantName = () => {
    if (proposal.users?.full_name) return proposal.users.full_name;
    
    if (users && proposal.user_id) {
        const consultant = users.find(u => u.id === proposal.user_id);
        if (consultant) return consultant.full_name || consultant.email;
    }
    
    return 'Consultor não identificado';
  };

  const items = proposal.items_list || [];
  
  const subtotal = items.reduce((acc, item) => {
    return acc + (parseFloat(item.global_value) || 0);
  }, 0);

  const totalEstimated = parseFloat(proposal.total_estimated_value) || subtotal;

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
    <div className="flex flex-col h-[85vh] bg-background text-foreground">
      <div className="flex justify-between items-center p-4 border-b bg-card">
        <h2 className="text-xl font-semibold">Visualizar Proposta</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportDocx} className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:text-blue-700">
            <FileDown className="w-4 h-4 mr-2" /> Exportar DOCX
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" /> Imprimir / PDF
          </Button>
          <Button variant="outline" onClick={onEdit}>
            <Edit className="w-4 h-4 mr-2" /> Editar
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-4 bg-gray-100 dark:bg-gray-900">
        <div className="max-w-[210mm] mx-auto bg-white text-black p-[10mm] shadow-lg print:shadow-none print:p-0" ref={componentRef}>
          
          {/* Header */}
          <div className="flex justify-between items-start border-b pb-4 mb-6">
            <div className="w-1/3">
                <img 
                  src={companyDetails?.logo_url || "https://horizons-cdn.hostinger.com/248eb4f3-2326-4fb0-87c9-c097668888f4/117ff0f826d422f849e550f5d230d240.jpg"}
                  alt="Logo" 
                  className="h-12 object-contain" 
                />
            </div>
            <div className="text-right text-sm w-2/3">
              <p className="font-semibold">Consultor: <span className="font-normal">{getConsultantName()}</span></p>
              <p className="font-bold text-lg mt-1">Proposta Nº: {proposal.proposal_number || proposal.id}</p>
              <p><strong>Cliente:</strong> {proposal.contacts?.name}</p>
              <p><strong>Data:</strong> {proposal.proposal_date ? format(new Date(proposal.proposal_date), 'dd/MM/yyyy') : 'Data não definida'}</p>
            </div>
          </div>

          {/* Partes */}
          <div className="mb-8 text-sm leading-relaxed">
            <h3 className="font-bold mb-2 uppercase border-b pb-1">Partes</h3>
            <div className="space-y-3">
                <p className="text-justify">
                    <strong>CONTRATADA:</strong> {companyDetails?.company_name || 'BL SOLUÇÕES'}, 
                    {companyDetails?.cnpj ? ` inscrita no CNPJ sob o nº ${companyDetails.cnpj}` : ''}, 
                    {companyDetails?.address_street ? ` com sede em ${companyDetails.address_street}, ${companyDetails.address_number} - ${companyDetails.address_neighborhood}, ${companyDetails.address_city}/${companyDetails.address_state}` : ''}, 
                    neste ato representada na forma de seu Estatuto Social.
                </p>
                <p className="text-justify">
                    <strong>CONTRATANTE:</strong> {proposal.contacts?.name}, 
                    {proposal.contacts?.cnpj ? ` inscrita no CNPJ/MF sob o nº ${proposal.contacts.cnpj}` : ''}, 
                    {proposal.contacts?.address_street ? ` com sede em ${proposal.contacts.address_street}, ${proposal.contacts.address_number} - ${proposal.contacts.address_neighborhood}, ${proposal.contacts.address_city}/${proposal.contacts.address_state}` : ''}, 
                    neste ato representada na forma de seu Estatuto Social.
                </p>
            </div>
          </div>

          {/* 1. Descrição */}
          <div className="mb-8">
            <h3 className="font-bold mb-2 uppercase border-b pb-1">1. Descrição do Serviço / Local de Operação</h3>
            <p className="text-sm text-justify whitespace-pre-line">{proposal.service_description || 'Descrição não informada.'}</p>
          </div>

          {/* 2. Equipamentos */}
          <div className="mb-8">
            <h3 className="font-bold mb-4 uppercase border-b pb-1">2. Equipamentos</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 p-2 text-center w-12">Qnt.</th>
                    <th className="border border-gray-300 p-2 text-left">Equipamento</th>
                    <th className="border border-gray-300 p-2 text-center">Garantia Horas/Período</th>
                    <th className="border border-gray-300 p-2 text-center">Valor por Hora</th>
                    <th className="border border-gray-300 p-2 text-center">Períodos</th>
                    <th className="border border-gray-300 p-2 text-center">Garantia Mínima</th>
                    <th className="border border-gray-300 p-2 text-center">Mob/Desmob</th>
                    <th className="border border-gray-300 p-2 text-center bg-gray-200 font-bold">Valor Global</th>
                    <th className="border border-gray-300 p-2 text-center">Valor Hora Extra</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-300 p-2 text-center">1</td>
                      <td className="border border-gray-300 p-2 font-medium">{getServiceItemName(item.service_item_id)}</td>
                      <td className="border border-gray-300 p-2 text-center">{item.guarantee_hours_day}</td>
                      <td className="border border-gray-300 p-2 text-center">{formatCurrency(item.value_hour_day)}</td>
                      <td className="border border-gray-300 p-2 text-center">{item.period}</td>
                      <td className="border border-gray-300 p-2 text-center">{formatCurrency(item.min_guarantee_worked_days)}</td>
                      <td className="border border-gray-300 p-2 text-center">{formatCurrency(item.mobilization_demobilization)}</td>
                      <td className="border border-gray-300 p-2 text-center font-bold bg-gray-100">{formatCurrency(item.global_value)}</td>
                      <td className="border border-gray-300 p-2 text-center">{formatCurrency(item.extra_hour_value)}</td>
                    </tr>
                  ))}
                  
                  {showTotalValue && (
                    <>
                      <tr className="bg-gray-100 font-bold border-t-2 border-gray-400">
                        <td colSpan={7} className="border border-gray-300 p-2 text-right uppercase text-xs">Subtotal (Soma Global):</td>
                        <td className="border border-gray-300 p-2 text-center text-black">{formatCurrency(subtotal)}</td>
                        <td className="border border-gray-300 p-2 bg-gray-50"></td>
                      </tr>
                      <tr className="bg-gray-200 font-extrabold text-sm border-t border-gray-400">
                        <td colSpan={7} className="border border-gray-300 p-2 text-right uppercase">Valor Total Estimado da Proposta:</td>
                        <td className="border border-gray-300 p-2 text-center text-black">{formatCurrency(totalEstimated)}</td>
                        <td className="border border-gray-300 p-2 bg-gray-100"></td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Prazo de Pagamento */}
          <div className="mb-8">
             <h3 className="font-bold mb-2 uppercase border-b pb-1">3. Prazo de Pagamento</h3>
             <p className="text-sm">
                O prazo para pagamento será de <strong>{proposal.payment_term_days || '0'}</strong> dias após a emissão da fatura.
             </p>
          </div>

          {/* 4. Condições Gerais */}
          <div className="mb-8 break-inside-avoid">
            <h3 className="font-bold mb-4 uppercase border-b pb-1">4. Condições Gerais e Prazo de Vigência</h3>
            <div className="space-y-6">
              {clauses && clauses.length > 0 ? (
                clauses.map((clause, index) => (
                  <div key={index} className="text-sm">
                    <h4 className="font-bold mb-2 text-base">{4}.{index + 1} {clause.title.toUpperCase()}</h4>
                    
                    {clause.content && (
                        <div className="text-justify mb-3 whitespace-pre-line text-gray-800">{clause.content}</div>
                    )}
                    
                    {clause.sub_clauses && clause.sub_clauses.length > 0 && (
                        <div className="pl-4 space-y-3 mt-2">
                            {clause.sub_clauses.map((sub, subIndex) => (
                                <div key={subIndex}>
                                    <h5 className="font-bold text-sm mb-1">{4}.{index + 1}.{subIndex + 1} {sub.title}</h5>
                                    <div className="text-justify whitespace-pre-line text-gray-800">{sub.content}</div>
                                </div>
                            ))}
                        </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm italic text-gray-500">Nenhuma cláusula adicional definida.</p>
              )}
            </div>
          </div>

          {/* 5. Disposições Finais */}
          {proposal.final_notes && (
            <div className="mb-8 break-inside-avoid">
                <h3 className="font-bold mb-4 uppercase border-b pb-1">5. Disposições Finais</h3>
                <p className="text-sm text-justify whitespace-pre-line">{proposal.final_notes}</p>
            </div>
          )}

          {/* ACEITE DA PROPOSTA - New Section */}
          <div className="mt-16 mb-8 break-inside-avoid">
            <div className="border-t-2 border-gray-800 pt-8">
                <h3 className="text-center font-bold uppercase text-lg mb-8">Aceite da Proposta</h3>
                
                <div className="px-4 md:px-12 flex flex-col gap-8 text-sm text-black">
                    {/* Linha 1: Nome do Cliente */}
                    <div className="flex items-end gap-2">
                        <span className="font-bold whitespace-nowrap w-20">Cliente:</span>
                        <div className="flex-grow border-b border-black px-2 pb-1 font-medium">
                            {proposal.contacts?.name || ''}
                        </div>
                    </div>

                    {/* Linha 2: Local e Data */}
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex-grow flex items-end gap-2">
                            <span className="font-bold whitespace-nowrap w-20">Local:</span>
                            <div className="flex-grow border-b border-black h-6"></div>
                        </div>
                        <div className="w-full md:w-1/3 flex items-end gap-2">
                            <span className="font-bold whitespace-nowrap">Data:</span>
                            <div className="flex-grow border-b border-black text-center pb-1">
                                ____/____/______
                            </div>
                        </div>
                    </div>

                    {/* Espaço para Assinatura */}
                    <div className="mt-12 flex flex-col items-center">
                        <div className="w-3/4 border-b border-black mb-2"></div>
                        <p className="font-bold uppercase">Assinatura do Responsável</p>
                        <p className="text-xs text-gray-500 mt-1">CPF/CNPJ: {proposal.contacts?.cnpj || proposal.contacts?.cpf || '___________________'}</p>
                    </div>
                </div>
            </div>
          </div>

           {/* Footer */}
           <div className="mt-16 pt-8 border-t border-gray-300 flex justify-between text-xs text-gray-500 break-inside-avoid">
                <div>
                    <p>{companyDetails?.company_name}</p>
                    <p>{companyDetails?.email}</p>
                </div>
                <div className="text-right">
                    <p>Proposta válida até: {proposal.validity_date ? format(new Date(proposal.validity_date), 'dd/MM/yyyy') : 'Data não definida'}</p>
                </div>
           </div>

        </div>
      </ScrollArea>
    </div>
  );
};

export default ProposalView;
