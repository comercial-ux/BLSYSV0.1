
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, BorderStyle, ImageRun, AlignmentType, HeadingLevel, Header, Footer } from 'docx';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

const getServiceItemName = (id, commercialData) => {
  const item = commercialData?.serviceItems?.find(i => String(i.id) === String(id));
  return item ? item.name : 'Item não encontrado';
};

const fetchImage = async (url) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return await blob.arrayBuffer();
  } catch (error) {
    console.error("Error fetching image for DOCX", error);
    return null;
  }
};

export const generateProposalDocx = async (proposal, commercialData, companyDetails, users) => {
  if (!proposal) return;

  const showTotalValue = proposal.contract_parameters?.show_total_value ?? true;

  // --- DATA PREPARATION ---
  const items = proposal.items_list || [];
  const subtotal = items.reduce((acc, item) => acc + (parseFloat(item.global_value) || 0), 0);
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

  // Consultant Name Logic
  let consultantName = 'Consultor não identificado';
  if (proposal.users?.full_name) consultantName = proposal.users.full_name;
  else if (users && proposal.user_id) {
    const consultant = users.find(u => u.id === proposal.user_id);
    if (consultant) consultantName = consultant.full_name || consultant.email;
  }

  // --- IMAGE HANDLING ---
  let logoBuffer = null;
  if (companyDetails?.logo_url) {
    logoBuffer = await fetchImage(companyDetails.logo_url);
  } else {
    // Default fallback logo if needed, or just skip
     logoBuffer = await fetchImage("https://horizons-cdn.hostinger.com/248eb4f3-2326-4fb0-87c9-c097668888f4/117ff0f826d422f849e550f5d230d240.jpg");
  }

  // --- DOCUMENT CONSTRUCTION ---
  
  // 1. Header Content (Table with Logo and Text)
  const headerTable = new Table({
    rows: [
        new TableRow({
        children: [
            new TableCell({
                width: { size: 40, type: WidthType.PERCENTAGE },
                borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                children: logoBuffer ? [
                    new Paragraph({
                        children: [
                            new ImageRun({
                                data: logoBuffer,
                                transformation: { width: 150, height: 50 }, // Adjust size as needed
                            }),
                        ],
                    }),
                ] : [new Paragraph("")],
            }),
            new TableCell({
                width: { size: 60, type: WidthType.PERCENTAGE },
                borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                verticalAlign: AlignmentType.CENTER,
                children: [
                    new Paragraph({ text: `Consultor: ${consultantName}`, alignment: AlignmentType.RIGHT, style: "HeaderSmall" }),
                    new Paragraph({ 
                        children: [
                            new TextRun({ text: `Proposta Nº: ${proposal.proposal_number || proposal.id}`, bold: true, size: 28 }) // 14pt
                        ], 
                        alignment: AlignmentType.RIGHT 
                    }),
                    new Paragraph({ 
                        children: [
                            new TextRun({ text: "Cliente: ", bold: true }),
                            new TextRun({ text: proposal.contacts?.name || "" })
                        ], 
                        alignment: AlignmentType.RIGHT, style: "HeaderSmall"
                    }),
                    new Paragraph({ 
                        children: [
                            new TextRun({ text: "Data: ", bold: true }),
                            new TextRun({ text: proposal.proposal_date ? format(new Date(proposal.proposal_date), 'dd/MM/yyyy') : 'Data não definida' })
                        ], 
                        alignment: AlignmentType.RIGHT, style: "HeaderSmall" 
                    }),
                ],
            }),
        ],
        }),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE }
  });

  // 2. Partes
  const partesSection = [
      new Paragraph({ text: "PARTES", heading: HeadingLevel.HEADING_3, spacing: { before: 400, after: 200 } }),
      new Paragraph({
          children: [
              new TextRun({ text: "CONTRATADA: ", bold: true }),
              new TextRun({ text: `${companyDetails?.company_name || 'BL SOLUÇÕES'}, ` }),
              new TextRun({ text: companyDetails?.cnpj ? `inscrita no CNPJ sob o nº ${companyDetails.cnpj}, ` : '' }),
              new TextRun({ text: "neste ato representada na forma de seu Estatuto Social." })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
            new TextRun({ text: "CONTRATANTE: ", bold: true }),
            new TextRun({ text: `${proposal.contacts?.name || ''}, ` }),
            new TextRun({ text: proposal.contacts?.cnpj ? `inscrita no CNPJ/MF sob o nº ${proposal.contacts.cnpj}, ` : '' }),
            new TextRun({ text: "neste ato representada na forma de seu Estatuto Social." })
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 400 }
      }),
  ];

  // 3. Descrição
  const descricaoSection = [
      new Paragraph({ text: "1. DESCRIÇÃO DO SERVIÇO / LOCAL DE OPERAÇÃO", heading: HeadingLevel.HEADING_3, spacing: { after: 200 } }),
      new Paragraph({ 
          text: proposal.service_description || 'Descrição não informada.', 
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 400 }
      }),
  ];

  // 4. Equipamentos Table
  const tableHeader = new TableRow({
      tableHeader: true,
      children: ["Qnt.", "Equipamento", "Garantia Hr/Per.", "Valor Hora", "Períodos", "Garantia Mín.", "Mob/Desmob", "Valor Global", "Valor H. Extra"].map((text, index) => 
        new TableCell({
            children: [new Paragraph({ text, alignment: AlignmentType.CENTER, style: "TableHeader" })],
            shading: { fill: "EEEEEE" },
            verticalAlign: AlignmentType.CENTER,
            width: { size: index === 1 ? 20 : 10, type: WidthType.PERCENTAGE } // Give more width to Equipment name
        })
      )
  });

  const tableRows = items.map(item => 
    new TableRow({
        children: [
            new TableCell({ children: [new Paragraph({ text: "1", alignment: AlignmentType.CENTER, style: "TableCell" })] }),
            new TableCell({ children: [new Paragraph({ text: getServiceItemName(item.service_item_id, commercialData), style: "TableCell" })] }),
            new TableCell({ children: [new Paragraph({ text: String(item.guarantee_hours_day || ''), alignment: AlignmentType.CENTER, style: "TableCell" })] }),
            new TableCell({ children: [new Paragraph({ text: formatCurrency(item.value_hour_day), alignment: AlignmentType.CENTER, style: "TableCell" })] }),
            new TableCell({ children: [new Paragraph({ text: String(item.period || ''), alignment: AlignmentType.CENTER, style: "TableCell" })] }),
            new TableCell({ children: [new Paragraph({ text: formatCurrency(item.min_guarantee_worked_days), alignment: AlignmentType.CENTER, style: "TableCell" })] }),
            new TableCell({ children: [new Paragraph({ text: formatCurrency(item.mobilization_demobilization), alignment: AlignmentType.CENTER, style: "TableCell" })] }),
            new TableCell({ children: [new Paragraph({ text: formatCurrency(item.global_value), alignment: AlignmentType.CENTER, style: "TableCellBold" })], shading: { fill: "F5F5F5" } }),
            new TableCell({ children: [new Paragraph({ text: formatCurrency(item.extra_hour_value), alignment: AlignmentType.CENTER, style: "TableCell" })] }),
        ]
    })
  );

  if (showTotalValue) {
      tableRows.push(
          new TableRow({
              children: [
                  new TableCell({ columnSpan: 7, children: [new Paragraph({ text: "SUBTOTAL (SOMA GLOBAL):", alignment: AlignmentType.RIGHT, style: "TableCellBold" })], borders: { bottom: { style: BorderStyle.SINGLE, size: 1 } } }),
                  new TableCell({ children: [new Paragraph({ text: formatCurrency(subtotal), alignment: AlignmentType.CENTER, style: "TableCellBold" })], borders: { bottom: { style: BorderStyle.SINGLE, size: 1 } } }),
                  new TableCell({ children: [], borders: { bottom: { style: BorderStyle.SINGLE, size: 1 } } }),
              ]
          }),
          new TableRow({
              children: [
                  new TableCell({ columnSpan: 7, children: [new Paragraph({ text: "VALOR TOTAL ESTIMADO:", alignment: AlignmentType.RIGHT, style: "TableCellBold" })], shading: { fill: "E0E0E0" } }),
                  new TableCell({ children: [new Paragraph({ text: formatCurrency(totalEstimated), alignment: AlignmentType.CENTER, style: "TableCellBold" })], shading: { fill: "E0E0E0" } }),
                  new TableCell({ children: [], shading: { fill: "E0E0E0" } }),
              ]
          })
      );
  }

  const equipamentosSection = [
      new Paragraph({ text: "2. EQUIPAMENTOS", heading: HeadingLevel.HEADING_3, spacing: { after: 200 } }),
      new Table({
          rows: [tableHeader, ...tableRows],
          width: { size: 100, type: WidthType.PERCENTAGE },
      }),
      new Paragraph({ text: "", spacing: { after: 400 } }) // Spacer
  ];

  // 5. Parâmetros e Franquias
  const parametrosSection = [
      new Paragraph({ text: "3. PARÂMETROS GERAIS", heading: HeadingLevel.HEADING_3, spacing: { after: 200 } }),
      new Paragraph({ text: `Prazo Estimado: ${proposal.estimated_days || 'A definir'} dias` }),
      new Paragraph({ text: `Início Previsto: ${proposal.planned_start_date ? format(new Date(proposal.planned_start_date), 'dd/MM/yyyy') : 'A definir'}` }),
      new Paragraph({ text: `Condição de Pagamento: ${proposal.payment_term_days || '0'} dias` }),
      new Paragraph({ text: `Tipo Período: ${proposal.contract_period_type || 'Não informado'}` }),
      new Paragraph({ text: `Qtd. Período: ${proposal.contract_period_quantity || 'Não informado'}` }),
      new Paragraph({ text: "", spacing: { after: 200 } }),
      new Paragraph({ text: "Franquias de Horas:", bold: true }),
      new Table({
          rows: [
              new TableRow({
                  children: ["SEG-QUI", "SEXTA", "SÁBADO", "DOMINGO"].map(t => new TableCell({ children: [new Paragraph({ text: t, alignment: AlignmentType.CENTER, bold: true, size: 20 })], shading: { fill: "F0F0F0" } }))
              }),
              new TableRow({
                  children: [
                      proposal.franchise_mon_thu_hours || '-',
                      proposal.franchise_fri_hours || '-',
                      proposal.franchise_sat_hours || '-',
                      proposal.franchise_sun_hours || '-'
                  ].map(t => new TableCell({ children: [new Paragraph({ text: t, alignment: AlignmentType.CENTER, size: 20 })] }))
              })
          ],
          width: { size: 100, type: WidthType.PERCENTAGE }
      }),
      new Paragraph({ text: "", spacing: { after: 400 } })
  ];

  // 6. Responsabilidades
  const responsibilities = [];
  if (proposal.contract_parameters?.responsibilities) {
      const resp = proposal.contract_parameters.responsibilities;
      if (resp.combustivel) responsibilities.push("Fornecimento de combustível.");
      if (resp.hospedagem) responsibilities.push("Hospedagem da equipe operacional.");
      if (resp.logistica) responsibilities.push("Apoio logístico e transporte local.");
      if (resp.alimentacao) responsibilities.push("Alimentação da equipe no local da obra.");
  }

  const responsabilidadesSection = [];
  if (responsibilities.length > 0) {
      responsabilidadesSection.push(
          new Paragraph({ text: "4. RESPONSABILIDADES DO CONTRATANTE", heading: HeadingLevel.HEADING_3, spacing: { after: 200 } }),
          ...responsibilities.map(r => new Paragraph({ text: `• ${r}`, spacing: { after: 100 } })),
          new Paragraph({ text: "", spacing: { after: 400 } })
      );
  }

  // 7. Condições Gerais
  const condicoesSection = [];
  if (clauses.length > 0) {
      condicoesSection.push(new Paragraph({ text: `${responsibilities.length > 0 ? '5' : '4'}. CONDIÇÕES GERAIS DE FORNECIMENTO`, heading: HeadingLevel.HEADING_3, spacing: { after: 200 } }));
      
      clauses.forEach((clause, idx) => {
          condicoesSection.push(
              new Paragraph({ 
                  children: [new TextRun({ text: `${responsibilities.length > 0 ? '5' : '4'}.${idx + 1} ${clause.title.toUpperCase()}`, bold: true })], 
                  spacing: { before: 200, after: 100 } 
              }),
              new Paragraph({ text: clause.content || '', alignment: AlignmentType.JUSTIFIED })
          );

          if (clause.sub_clauses) {
              clause.sub_clauses.forEach((sub, subIdx) => {
                  condicoesSection.push(
                    new Paragraph({ 
                        children: [new TextRun({ text: `${responsibilities.length > 0 ? '5' : '4'}.${idx + 1}.${subIdx + 1} ${sub.title}`, bold: true })], 
                        spacing: { before: 100, after: 50 },
                        indent: { left: 300 }
                    }),
                    new Paragraph({ text: sub.content || '', alignment: AlignmentType.JUSTIFIED, indent: { left: 300 } })
                  );
              });
          }
      });
      condicoesSection.push(new Paragraph({ text: "", spacing: { after: 400 } }));
  }

  // 8. Observações e Notas
  const notesSection = [];
  if (proposal.special_observations) {
      notesSection.push(
          new Paragraph({ text: "OBSERVAÇÕES ESPECIAIS", heading: HeadingLevel.HEADING_3, spacing: { after: 100 } }),
          new Paragraph({ text: proposal.special_observations, alignment: AlignmentType.JUSTIFIED, spacing: { after: 300 } })
      );
  }
  if (proposal.final_notes) {
    notesSection.push(
        new Paragraph({ text: "NOTAS FINAIS", heading: HeadingLevel.HEADING_3, spacing: { after: 100 } }),
        new Paragraph({ text: proposal.final_notes, alignment: AlignmentType.JUSTIFIED, spacing: { after: 300 } })
    );
  }

  // 9. Aceite
  const aceiteSection = [
      new Paragraph({ text: "ACEITE DA PROPOSTA", heading: HeadingLevel.HEADING_3, alignment: AlignmentType.CENTER, spacing: { before: 600, after: 400 } }),
      new Paragraph({ 
          children: [
              new TextRun({ text: "Cliente: ", bold: true }),
              new TextRun({ text: proposal.contacts?.name || "__________________________________________________" })
          ],
          spacing: { after: 200 }
      }),
      new Paragraph({ 
        children: [
            new TextRun({ text: "Local: ___________________________________    Data: ____/____/_______", bold: true }),
        ],
        spacing: { after: 800 }
      }),
      new Paragraph({ 
          children: [new TextRun({ text: "__________________________________________________" })], 
          alignment: AlignmentType.CENTER 
      }),
      new Paragraph({ 
        children: [new TextRun({ text: "ASSINATURA DO RESPONSÁVEL", bold: true })], 
        alignment: AlignmentType.CENTER 
      }),
      new Paragraph({ 
        children: [new TextRun({ text: `CPF/CNPJ: ${proposal.contacts?.cnpj || proposal.contacts?.cpf || '___________________'}` })], 
        alignment: AlignmentType.CENTER 
      }),
  ];

  // 10. Footer Content
  const footerTable = new Table({
      rows: [
        new TableRow({
            children: [
                new TableCell({
                    children: [
                        new Paragraph({ text: companyDetails?.company_name || 'BL SOLUÇÕES', alignment: AlignmentType.LEFT, size: 16, color: "666666" }),
                        new Paragraph({ text: companyDetails?.email || '', alignment: AlignmentType.LEFT, size: 16, color: "666666" })
                    ],
                    borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }
                }),
                new TableCell({
                    children: [
                        new Paragraph({ text: `Proposta válida até: ${proposal.validity_date ? format(new Date(proposal.validity_date), 'dd/MM/yyyy') : '-'}`, alignment: AlignmentType.RIGHT, size: 16, color: "666666" })
                    ],
                    borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }
                })
            ]
        })
      ],
      width: { size: 100, type: WidthType.PERCENTAGE }
  });

  // Create Document
  const doc = new Document({
    styles: {
        paragraphStyles: [
            { id: "HeaderSmall", name: "Header Small", run: { size: 20 } }, // 10pt
            { id: "TableHeader", name: "Table Header", run: { bold: true, size: 18 }, paragraph: { alignment: AlignmentType.CENTER } }, // 9pt
            { id: "TableCell", name: "Table Cell", run: { size: 18 } }, // 9pt
            { id: "TableCellBold", name: "Table Cell Bold", run: { size: 18, bold: true } }, // 9pt
        ]
    },
    sections: [
      {
        properties: {},
        headers: {
            default: new Header({
                children: [headerTable, new Paragraph({ text: "" })]
            })
        },
        footers: {
            default: new Footer({
                children: [new Paragraph({ text: "" }), footerTable]
            })
        },
        children: [
          new Paragraph({ text: "", spacing: { after: 400 } }),
          ...partesSection,
          ...descricaoSection,
          ...equipamentosSection,
          ...parametrosSection,
          ...responsabilidadesSection,
          ...condicoesSection,
          ...notesSection,
          ...aceiteSection,
          new Paragraph({ text: "", spacing: { after: 400 } }),
        ],
      },
    ],
  });

  // Export
  Packer.toBlob(doc).then((blob) => {
    saveAs(blob, `Proposta_${proposal.proposal_number || proposal.id}.docx`);
  });
};
