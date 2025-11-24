import { supabase } from '@/lib/customSupabaseClient';

    const parseTime = (timeStr) => {
        if (!timeStr) return 0;
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours + (minutes || 0) / 60;
    };

    const isHolidayOrWeekend = (date) => {
        const d = new Date(date + 'T00:00:00');
        const dayOfWeek = d.getDay();
        return dayOfWeek === 0 || dayOfWeek === 6; 
    };

    export const processBDEs = async (jobId, startDate, endDate, proposalDetails) => {
        if (!jobId || !startDate || !endDate) {
            throw new Error('Dados Incompletos: Job ID, data de início e data de fim são obrigatórios.');
        }

        const { data, error } = await supabase
            .from('daily_reports')
            .select('*, operator:operator_id(name)')
            .eq('job_id', jobId)
            .gte('report_date', startDate)
            .lte('report_date', endDate)
            .order('report_date', { ascending: true });

        if (error) throw error;

        const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

        return data.map(bde => {
            const startHours = parseTime(bde.start_time);
            const endHours = parseTime(bde.end_time);
            const lunchStartHours = parseTime(bde.lunch_start_time);
            const lunchEndHours = parseTime(bde.lunch_end_time);
            const downtimeHours = bde.downtime_hours || 0;

            let lunchDuration = proposalDetails.ignore_lunch_break ? 0 : (lunchEndHours - lunchStartHours);
            if (lunchDuration < 0) lunchDuration = 0;

            let workedHours = (endHours - startHours) - lunchDuration;
            if (workedHours < 0) workedHours = 0;
            
            const totalHours = Math.max(0, workedHours - downtimeHours);
            
            const guaranteeHours = parseFloat(proposalDetails.min_hours_guarantee) || 0;
            const isWeekend = isHolidayOrWeekend(bde.report_date);
            const applicableGuarantee = isWeekend ? 0 : guaranteeHours;

            const overtimeHours = Math.max(0, totalHours - applicableGuarantee);
            const balanceHours = totalHours;

            return {
                bde_id: bde.id,
                report_number: bde.report_number,
                date: bde.report_date,
                dayOfWeek: daysOfWeek[new Date(bde.report_date + 'T00:00:00').getDay()],
                operator_name: bde.operator?.name,
                start_time: bde.start_time,
                lunch_start_time: bde.lunch_start_time,
                lunch_end_time: bde.lunch_end_time,
                end_time: bde.end_time,
                downtime_hours: downtimeHours,
                total_hours: totalHours,
                guarantee_hours: applicableGuarantee,
                overtime_hours: overtimeHours,
                balance_hours: balanceHours,
                hour_value: parseFloat(proposalDetails.hour_value) || 0,
                extra_hour_value: parseFloat(proposalDetails.extra_hour_value) || 0,
            };
        });
    };

    export const recalculateTotals = (details, proposalDetails) => {
        if (!details || !Array.isArray(details)) return {};
        
        const consideredHours = parseFloat(proposalDetails?.considered_hours);
        const periodsQuantity = parseFloat(proposalDetails?.periods_quantity) || 1;
        const franchisePerPeriod = parseFloat(proposalDetails?.min_hours_guarantee) || 0;

        let totalHoursToBill = 0;

        if (!isNaN(consideredHours) && consideredHours > 0) {
             totalHoursToBill = consideredHours;
        } else {
             const calculatedTotalHours = details.reduce((acc, item) => acc + (parseFloat(item.balance_hours) || 0), 0);
             const totalFranchise = franchisePerPeriod * periodsQuantity;
             totalHoursToBill = Math.max(calculatedTotalHours, totalFranchise);
        }

        const totals = details.reduce((acc, item) => {
            acc.total_downtime_hours += parseFloat(item.downtime_hours || 0);
            acc.total_total_hours += parseFloat(item.total_hours || 0);
            acc.total_guarantee_hours += parseFloat(item.guarantee_hours || 0);
            acc.total_overtime_hours += parseFloat(item.overtime_hours || 0);
            return acc;
        }, {
            total_downtime_hours: 0,
            total_total_hours: 0,
            total_guarantee_hours: 0,
            total_overtime_hours: 0,
        });

        const hourValue = parseFloat(proposalDetails?.hour_value) || 0;
        const extraHourValue = parseFloat(proposalDetails?.extra_hour_value) || 0;
        const mobilization = parseFloat(proposalDetails?.mobilization || 0);
        const demobilization = parseFloat(proposalDetails?.demobilization || 0);
        const discount = parseFloat(proposalDetails?.discount || 0);

        const totalBaseValue = totalHoursToBill * hourValue;
        const totalOvertimeValue = totals.total_overtime_hours * extraHourValue;
        
        const subtotal = totalBaseValue + totalOvertimeValue + mobilization + demobilization;
        const totalValue = subtotal - discount;

        return {
            ...totals,
            total_balance_hours: totalHoursToBill,
            total_base_value: totalBaseValue,
            total_overtime_value: totalOvertimeValue,
            total_value: totalValue,
        };
    };

    export const applyGuaranteeToDetails = (details, proposalDetails) => {
        const guaranteeHours = parseFloat(proposalDetails.min_hours_guarantee) || 0;
        
        return details.map(item => {
            const isWeekend = isHolidayOrWeekend(item.date);
            const applicableGuarantee = isWeekend ? 0 : guaranteeHours;
            const overtimeHours = Math.max(0, item.total_hours - applicableGuarantee);
            
            return {
                ...item,
                guarantee_hours: applicableGuarantee,
                overtime_hours: overtimeHours,
            };
        });
    };