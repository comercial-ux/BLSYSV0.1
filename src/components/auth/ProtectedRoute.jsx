import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getFirstPermittedRoute } from '@/lib/utils';
import { routePermissionMap } from '@/config/routeConfig';

const getRequiredPermission = (pathname) => {
  for (const route in routePermissionMap) {
    // Ensure that '/admin' does not match '/administrativo'
    if (pathname.startsWith(route) && (pathname.length === route.length || pathname[route.length] === '/')) {
      if (route === '/') continue; // handle dashboard separately
      return routePermissionMap[route];
    }
  }
  if (pathname === '/') return 'dashboard';
  return null;
};


const ProtectedRoute = ({ children, requiredRole, fieldAccess = false }) => {
  const { user, loading, rolePermissions } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin mr-2 text-primary" />
        <span>Verificando autenticação...</span>
      </div>
    );
  }

  if (!user) {
    const redirectTo = fieldAccess ? '/field/login' : '/login';
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If a specific role is required (like for /field), check it first.
  if (requiredRole && user.role !== requiredRole) {
    toast.error('Acesso negado. Esta área é restrita.');
    
    if (user.role === 'usuario') {
      return <Navigate to="/field" replace />;
    }
    
    const userPermissions = rolePermissions[user.role] || {};
    const fallbackRoute = getFirstPermittedRoute(userPermissions, routePermissionMap, user.role);
    return <Navigate to={fallbackRoute || "/"} replace />;
  }

  // If 'usuario' role tries to access non-field routes
  if (user.role === 'usuario' && !fieldAccess) {
    toast.error('Acesso negado. Seu perfil é de campo.');
    return <Navigate to="/field" replace />;
  }

  // Admin has full access, no need to check permissions, except for field-only logic
  if (user.role === 'admin' && user.role !== 'usuario') {
    return children;
  }
  
  // The dashboard is accessible to everyone who is logged in and not a 'usuario' role.
  if ((location.pathname === '/dashboard' || location.pathname === '/') && user.role !== 'usuario') {
    return children;
  }
  
  // For all other roles, check module permissions
  const userPermissions = rolePermissions[user.role] || {};

  if (location.pathname === '/administrativo') { // Administrative page is only for admins
     toast.error('Acesso negado. Apenas administradores podem acessar esta página.');
     const fallbackRoute = getFirstPermittedRoute(userPermissions, routePermissionMap, user.role);
     return <Navigate to={fallbackRoute || "/"} replace />;
  }

  const requiredPermission = getRequiredPermission(location.pathname);

  // If a specific permission is required for the current path and the user doesn't have it
  if (requiredPermission && !userPermissions[requiredPermission] && user.role !== 'admin') {
    toast.error(`Acesso negado ao módulo: ${requiredPermission.charAt(0).toUpperCase() + requiredPermission.slice(1)}.`);
    const fallbackRoute = getFirstPermittedRoute(userPermissions, routePermissionMap, user.role);
    return <Navigate to={fallbackRoute || "/"} replace />;
  }
  
  return children;
};

export default ProtectedRoute;