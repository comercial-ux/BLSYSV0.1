import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (value) => {
  if (value === null || value === undefined) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const parseCurrency = (value) => {
  if (typeof value !== 'string') {
    return value;
  }
  const cleanedValue = value.replace(/[R$\s.]/g, '').replace(',', '.');
  return parseFloat(cleanedValue);
};

export const getFirstPermittedRoute = (permissions, routePermissionMap, role) => {
  if (role === 'usuario') {
    return '/field';
  }
  
  // Prioritize these routes in order if permission is granted
  const permissionOrder = [
    'dashboard', 'operational', 'commercial', 'maintenances',
    'supplies', 'contacts', 'finance', 'documentabl', 'reports',
    'administrative'
  ];

  for (const permission of permissionOrder) {
    if (permissions[permission]) {
      const route = Object.keys(routePermissionMap).find(key => routePermissionMap[key] === permission);
      if (route) return route;
    }
  }

  // If no specific module permission found, but user is admin, default to dashboard.
  // This handles cases where admin might not have explicit permissions but implicitly has access.
  if (role === 'admin') {
    return '/'; // Dashboard
  }

  // Fallback to a page all authenticated users should see if no specific module permission is found
  return '/profile';
};

export const reactSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: 'hsl(var(--input))',
    borderColor: state.isFocused ? 'hsl(var(--ring))' : 'hsl(var(--border))',
    color: 'hsl(var(--foreground))',
    boxShadow: state.isFocused ? '0 0 0 1px hsl(var(--ring))' : 'none',
    '&:hover': {
      borderColor: 'hsl(var(--border))',
    },
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: 'hsl(var(--popover))',
    borderColor: 'hsl(var(--border))',
    color: 'hsl(var(--popover-foreground))',
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? 'hsl(var(--primary))'
      : state.isFocused
      ? 'hsl(var(--accent))'
      : 'transparent',
    color: state.isSelected
      ? 'hsl(var(--primary-foreground))'
      : 'hsl(var(--popover-foreground))',
    '&:active': {
      backgroundColor: 'hsl(var(--primary))',
    },
  }),
  singleValue: (provided) => ({
    ...provided,
    color: 'hsl(var(--foreground))',
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: 'hsl(var(--secondary))',
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: 'hsl(var(--secondary-foreground))',
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: 'hsl(var(--secondary-foreground))',
    '&:hover': {
      backgroundColor: 'hsl(var(--destructive))',
      color: 'hsl(var(--destructive-foreground))',
    },
  }),
  input: (provided) => ({
    ...provided,
    color: 'hsl(var(--foreground))',
  }),
  placeholder: (provided) => ({
    ...provided,
    color: 'hsl(var(--muted-foreground))',
  }),
};