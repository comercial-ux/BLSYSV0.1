import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';

const defaultResponsibilities = {
    contratada: [
        { id: 'equipamento', title: 'Fornecimento do(s) equipamento(s) em condições de operação.' },
        { id: 'manutencao', title: 'Executar a manutenção preventiva e corretiva em tempo hábil.' },
        { id: 'pessoal_manutencao', title: 'Fornecer pessoal habilitado para manutenções.' },
        { id: 'operador_sinaleiro', title: 'Fornecer operador e sinaleiro exclusivo para as atividades.' },
        { id: 'material_amarracao', title: 'Fornecimento de material de amarração básico.' },
        { id: 'plano_icamento', title: 'Fornecer o Plano de Içamento para a operação.' },
        { id: 'combustivel', title: 'Fornecer combustível para a operação do equipamento.' },
        { id: 'hospedagem', title: 'Fornecer hospedagem para a equipe.' },
        { id: 'logistica', title: 'Fornecer transporte da equipe para acesso à obra.' },
        { id: 'alimentacao', title: 'Fornecer alimentação para a equipe na obra/alojamento.' },
    ],
    contratante: [
        { id: 'informacoes', title: 'Informar com exatidão os pesos e dimensões para os içamentos.' },
        { id: 'area_livre', title: 'Fornecer área/terreno livre e em condições para as operações.' },
        { id: 'guarda_equipamento', title: 'Fornecer a guarda dos equipamentos.' },
        { id: 'bloqueios', title: 'Providenciar bloqueios de vias e desimpedimento de redes elétricas.' },
    ],
};

const getClausesContent = (formData, allClauses) => {
    const { included_clauses, responsibilities } = formData.contract_parameters || {};
    // Ensure included_clauses is an array of strings for consistent filtering.
    const includedClauseIds = (included_clauses || []).map(id => String(id));
    
    if (!allClauses || allClauses.length === 0) return [];
    
    const mainClauses = allClauses.filter(c => !c.parent_id && c.is_active);
    const subClausesMap = allClauses.reduce((acc, clause) => {
        if (clause.parent_id) {
            if (!acc[clause.parent_id]) acc[clause.parent_id] = [];
            acc[clause.parent_id].push(clause);
        }
        return acc;
    }, {});
    
    const respClauseContratada = mainClauses.find(c => c.title.toLowerCase().includes('responsabilidades da contratada'));
    const respClauseContratante = mainClauses.find(c => c.title.toLowerCase().includes('responsabilidades do contratante'));

    let finalContratadaResponsibilities = [...defaultResponsibilities.contratada];
    let finalContratanteResponsibilities = [...defaultResponsibilities.contratante];

    if (responsibilities) {
        Object.keys(responsibilities).forEach(key => {
            if (responsibilities[key]) {
                const respToAdd = defaultResponsibilities.contratada.find(r => r.id === key);
                if (respToAdd) {
                    finalContratadaResponsibilities = finalContratadaResponsibilities.filter(r => r.id !== key);
                    if (!finalContratanteResponsibilities.some(r => r.id === key)) {
                        finalContratanteResponsibilities.push({ id: respToAdd.id, title: respToAdd.title.replace('Fornecer', 'Fornecer (por conta do Contratante)') });
                    }
                }
            }
        });
    }
    
    const dynamicClauses = mainClauses
        .filter(clause => includedClauseIds.includes(String(clause.id)))
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
        .map(clause => {
            let content = clause.content;
            let sub_clauses = (subClausesMap[clause.id] || [])
                    .filter(sc => sc.is_active && includedClauseIds.includes(String(sc.id)))
                    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                    .map(sub => ({ title: sub.title, content: sub.content }));

            if (respClauseContratada && clause.id === respClauseContratada.id) {
                content = finalContratadaResponsibilities.map(r => `• ${r.title}`).join('\n');
                sub_clauses = [];
            }
            if (respClauseContratante && clause.id === respClauseContratante.id) {
                content = finalContratanteResponsibilities.map(r => `• ${r.title}`).join('\n');
                sub_clauses = [];
            }

            return {
                title: clause.title,
                content: content,
                sub_clauses: sub_clauses
            };
        });

    return dynamicClauses;
};


const sanitizeItems = (itemsList) => {
    return (itemsList || []).map((item) => {
        if (!item.service_item_id) return null;
        return {
            service_item_id: parseInt(item.service_item_id, 10),
            period: item.period && !isNaN(parseInt(item.period, 10)) ? parseInt(item.period, 10) : 1,
            guarantee_hours_day: item.guarantee_hours_day || '',
            value_hour_day: item.value_hour_day ? parseFloat(item.value_hour_day) : 0,
            min_guarantee_worked_days: item.min_guarantee_worked_days ? parseFloat(item.min_guarantee_worked_days) : 0,
            mobilization_demobilization: item.mobilization_demobilization ? parseFloat(item.mobilization_demobilization) : 0,
            extra_hour_value: item.extra_hour_value ? parseFloat(item.extra_hour_value) : 0,
            global_value: item.global_value ? parseFloat(item.global_value) : 0,
        };
    }).filter(item => item !== null);
};

export const getNextProposalNumber = (proposals) => {
    const currentYear = new Date().getFullYear();
    let maxNumber = 0;

    if (proposals && proposals.length > 0) {
        proposals.forEach(p => {
            if (p.proposal_number && typeof p.proposal_number === 'string') {
                const parts = p.proposal_number.split('/');
                const numPart = parseInt(parts[0], 10);
                const yearPart = parts.length > 1 ? parseInt(parts[1], 10) : 0;

                if (!isNaN(numPart) && yearPart === currentYear) {
                    if (numPart > maxNumber) {
                        maxNumber = numPart;
                    }
                } else if (!isNaN(numPart) && parts.length === 1) {
                    if (numPart > maxNumber) {
                        maxNumber = numPart;
                    }
                }
            }
        });
    }
    
    if (maxNumber === 0 && proposals && proposals.length > 0) {
         proposals.forEach(p => {
            if (p.proposal_number && typeof p.proposal_number === 'string') {
                const parts = p.proposal_number.split('/');
                const numPart = parseInt(parts[0], 10);
                if (!isNaN(numPart)) {
                     if (numPart > maxNumber) {
                        maxNumber = numPart;
                    }
                }
            }
        });
    }

    return `${maxNumber + 1}/${currentYear}`;
};

export const saveProposal = async ({ formData, user, proposal, clauses }) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Erro de Autenticação' });
        return false;
    }

    if (!formData.contact_id) {
        toast({
            variant: 'destructive',
            title: 'Campo Obrigatório',
            description: 'Por favor, selecione um cliente para a proposta.',
        });
        return false;
    }

    const totalValue = (formData.items_list || []).reduce((acc, item) => {
        return acc + (parseFloat(item.global_value) || 0);
    }, 0);

    const clausesContent = getClausesContent(formData, clauses);
    const sanitizedItemsList = sanitizeItems(formData.items_list);

    const dataToSubmit = {
        contact_id: parseInt(formData.contact_id, 10),
        proposal_number: formData.proposal_number || null,
        proposal_date: formData.proposal_date || new Date().toISOString().slice(0, 10),
        validity_date: formData.validity_date || null,
        status: formData.status,
        internal_notes: formData.internal_notes,
        service_description: formData.service_description,
        final_notes: formData.final_notes,
        service_items_list: sanitizedItemsList,
        items_list: sanitizedItemsList,
        contract_parameters: {
            ...formData.contract_parameters,
            included_clauses: (formData.contract_parameters.included_clauses || []).map(id => String(id)),
            responsibilities: formData.contract_parameters.responsibilities || {},
        },
        user_id: user.id,
        total_estimated_value: totalValue,
        clauses_content: clausesContent,
        planned_start_date: formData.planned_start_date || null,
        estimated_days: formData.estimated_days && !isNaN(parseInt(formData.estimated_days, 10)) ? parseInt(formData.estimated_days, 10) : null,
        payment_term_days: formData.payment_term_days && !isNaN(parseInt(formData.payment_term_days, 10)) ? parseInt(formData.payment_term_days, 10) : null,
        contract_period_type: formData.contract_period_type || null,
        contract_period_quantity: formData.contract_period_quantity && !isNaN(parseInt(formData.contract_period_quantity, 10)) ? parseInt(formData.contract_period_quantity, 10) : null,
        franchise_mon_thu_hours: formData.franchise_mon_thu_hours || null,
        franchise_fri_hours: formData.franchise_fri_hours || null,
        franchise_sat_hours: formData.franchise_sat_hours || null,
        franchise_sun_hours: formData.franchise_sun_hours || null,
        special_observations: formData.special_observations || null,
        updated_at: new Date().toISOString(),
    };

    let error;
    if (proposal?.id) {
        const { error: updateError } = await supabase
            .from('proposals')
            .update(dataToSubmit)
            .eq('id', proposal.id);
        error = updateError;
    } else {
        const { error: insertError } = await supabase
            .from('proposals')
            .insert([dataToSubmit]);
        error = insertError;
    }

    if (error) {
        toast({
            variant: 'destructive',
            title: 'Erro ao Salvar Proposta',
            description: error.message,
        });
        return false;
    } else {
        toast({
            title: `Proposta ${proposal?.id ? 'Atualizada' : 'Criada'}!`,
            description: 'A proposta foi salva com sucesso.',
        });
        return true;
    }
};