import { differenceInDays, parseISO } from 'date-fns';

export const getDocumentStatus = (doc) => {
    if (!doc || !doc.current_version) {
        return { text: 'Faltante', color: 'text-orange-400', bgColor: 'bg-orange-500/20' };
    }
    if (!doc.current_version.expiry_date) {
        return { text: 'Válido', color: 'text-green-400', bgColor: 'bg-green-500/20' };
    }
    const expiryDate = parseISO(doc.current_version.expiry_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysUntilExpiry = differenceInDays(expiryDate, today);

    if (daysUntilExpiry < 0) {
        return { text: 'Vencido', color: 'text-red-400', bgColor: 'bg-red-500/20' };
    }
    if (daysUntilExpiry <= 30) {
        return { text: `Vence em ${daysUntilExpiry} dias`, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' };
    }
    return { text: 'Válido', color: 'text-green-400', bgColor: 'bg-green-500/20' };
};


export const getDocumentStatusFromDates = (creation_date, expiry_date) => {
    if (!expiry_date) return 'valido';
    const expiry = parseISO(expiry_date);
    const today = new Date();
    today.setHours(0,0,0,0);
    const daysUntilExpiry = differenceInDays(expiry, today);

    if (daysUntilExpiry < 0) return 'vencido';
    return 'valido';
}