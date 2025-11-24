export const getMaintenanceStatus = (equipment) => {
  const { current_hours, maintenance_interval, last_maintenance_hours = 0 } = equipment;
  
  if (!maintenance_interval) {
    return { status: 'pending', hoursUntil: Infinity, nextMaintenanceHours: 'N/A' };
  }

  const nextMaintenanceHours = last_maintenance_hours + maintenance_interval;
  const hoursUntil = nextMaintenanceHours - current_hours;

  let status = 'ok';
  if (hoursUntil < 0) {
    status = 'overdue';
  } else if (hoursUntil <= maintenance_interval * 0.1) { // 10% threshold
    status = 'urgent';
  } else if (hoursUntil <= maintenance_interval * 0.25) { // 25% threshold
    status = 'upcoming';
  }
  
  return { status, hoursUntil: Math.round(hoursUntil), nextMaintenanceHours };
};