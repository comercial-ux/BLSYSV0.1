import { format, parseISO } from 'date-fns';

export const getStatusClass = (status) => {
    switch (status) {
        case 'Pago':
        case 'Recebido':
            return 'bg-green-500/20 text-green-400';
        case 'Pendente':
        case 'Aberto':
            return 'bg-yellow-500/20 text-yellow-400';
        case 'Vencido':
            return 'bg-red-500/20 text-red-400';
        default:
            return 'bg-gray-500/20 text-gray-400';
    }
};

export const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export const formatDate = (dateString) => {
    if (!dateString) return '-';
    // Adiciona T00:00:00 para evitar problemas com fuso horário ao fazer o parse
    return format(parseISO(dateString + 'T00:00:00'), 'dd/MM/yyyy');
};