import React from 'react';
    import { Route, Routes } from 'react-router-dom';
    import Dashboard from '@/components/dashboard/Dashboard';
    import EquipmentsPage from '@/pages/EquipmentsPage';
    import MaintenancesPage from '@/pages/MaintenancesPage';
    import ReportsPage from '@/pages/ReportsPage';
    import OperationalPage from '@/pages/OperationalPage';
    import CommercialPage from '@/pages/CommercialPage';
    import ContactsPage from '@/pages/ContactsPage';
    import FinancePage from '@/pages/FinancePage';
    import SuppliesPage from '@/pages/SuppliesPage';
    import DocumentaBLPage from '@/pages/DocumentaBLPage';
    import AdministrativePage from '@/pages/AdministrativePage';
    import AdminPage from '@/pages/AdminPage';
    import SiteAdminPage from '@/pages/SiteAdminPage';
    import PersonnelDepartmentPage from '@/pages/PersonnelDepartmentPage';
    import { useData } from '@/contexts/DataContext';
    import ProtectedRoute from '@/components/auth/ProtectedRoute';

    export const routePermissionMap = {
      '/dashboard': 'dashboard',
      '/documentabl': 'documentabl',
      '/equipments': 'equipments',
      '/operational': 'operational',
      '/commercial': 'commercial',
      '/maintenances': 'maintenances',
      '/supplies': 'supplies',
      '/personnel': 'personnel',
      '/finance': 'finance',
      '/reports': 'reports',
      '/admin': 'admin', 
      '/administrativo': 'administrative',
      '/siteadmin': 'admin',
    };

    export const AppRoutes = ({ 
      openAddEquipmentForm, 
      openMaintenanceForm,
      openChecklistForm,
      openPlanMaintenanceForm,
      onEditMaintenance,
      uploadImages
    }) => {
      const { equipments, maintenances, documentabl } = useData();

      return (
        <Routes>
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard data={{ equipments, maintenances, documentabl }} />
            </ProtectedRoute>
          } />
          <Route path="/equipments" element={
            <ProtectedRoute>
              <EquipmentsPage
                openAddEquipmentForm={openAddEquipmentForm}
                openMaintenanceForm={openMaintenanceForm}
                openChecklistForm={openChecklistForm}
                openPlanMaintenanceForm={openPlanMaintenanceForm}
              />
            </ProtectedRoute>
          }/>
          <Route path="/maintenances" element={
            <ProtectedRoute>
              <MaintenancesPage onEdit={onEditMaintenance} />
            </ProtectedRoute>
          } />
          <Route path="/supplies/*" element={
            <ProtectedRoute>
              <SuppliesPage uploadImages={uploadImages} />
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute>
              <ReportsPage />
            </ProtectedRoute>
          } />
          <Route path="/operational/:tab?" element={
            <ProtectedRoute>
              <OperationalPage />
            </ProtectedRoute>
          } />
          <Route path="/commercial/:tab?" element={
            <ProtectedRoute>
              <CommercialPage />
            </ProtectedRoute>
          } />
          <Route path="/finance/:tab?" element={
            <ProtectedRoute>
              <FinancePage />
            </ProtectedRoute>
          } />
          <Route path="/documentabl/*" element={
            <ProtectedRoute>
              <DocumentaBLPage />
            </ProtectedRoute>
          } />
          <Route path="/personnel/:tab?" element={
            <ProtectedRoute>
              <PersonnelDepartmentPage />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
              <ProtectedRoute>
                  <AdminPage />
              </ProtectedRoute>
            }
          />
           <Route path="/administrativo" element={
              <ProtectedRoute>
                <AdministrativePage />
              </ProtectedRoute>
            }
          />
          {/* SiteAdminPage is now rendered via App.jsx to wrap it in MainLayout */}
        </Routes>
      );
    };