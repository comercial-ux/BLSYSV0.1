
import React, { useState, useEffect } from 'react';
    import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
    import { Toaster } from '@/components/ui/toaster';
    import LoginPage from '@/pages/LoginPage';
    import MainLayout from '@/components/layout/MainLayout';
    import { AppRoutes } from '@/config/routeConfig';
    import { AppDialogs } from '@/config/dialogConfig';
    import useAppHandlers from '@/hooks/useAppHandlers';
    import { Button } from './components/ui/button';
    import ProtectedRoute from './components/auth/ProtectedRoute';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import { DataProvider, useData } from '@/contexts/DataContext';
    import FieldLoginPage from '@/pages/FieldLoginPage';
    import FieldPage from '@/pages/FieldPage';
    import PcPage from '@/pages/PcPage';
    import ProfilePage from '@/pages/ProfilePage';
    import { Loader2 } from 'lucide-react';
    import SitePage from '@/pages/SitePage';
    import SiteAdminPage from '@/pages/SiteAdminPage';
    import { supabase } from '@/lib/customSupabaseClient';
    import ExpenseReportPage from '@/pages/ExpenseReportPage';

    const AppContent = () => {
      const { refetchData, error, loading, ...data } = useData();

      const [dialogState, setDialogState] = useState({
        isAddEquipmentOpen: false,
        isMaintenanceOpen: false,
        isChecklistOpen: false,
        isPlanMaintenanceOpen: false,
      });
      const [selectedEquipment, setSelectedEquipment] = useState(null);
      const [editingMaintenance, setEditingMaintenance] = useState(null);

      const closeDialogs = (dialogName) => {
        setDialogState(prev => ({ ...prev, [dialogName]: false }));
      };

      const handleEditMaintenance = (maintenance) => {
        const equipmentForMaintenance = data.equipments.find(
          (eq) => eq.id === maintenance.equipment_id
        );
        if (equipmentForMaintenance) {
          setEditingMaintenance(maintenance);
          setSelectedEquipment(equipmentForMaintenance);
          setDialogState((prev) => ({ ...prev, isMaintenanceOpen: true }));
        } else {
          console.error("Equipamento para a manutenção não foi encontrado!");
        }
      };

      const handlers = useAppHandlers({
        refetchData,
        dialogState,
        setDialogState,
        setSelectedEquipment,
        setEditingMaintenance,
        selectedEquipment,
        editingMaintenance,
        onSuccess: () => {
          if (dialogState.isChecklistOpen) {
            closeDialogs('isChecklistOpen');
          }
          if (dialogState.isPlanMaintenanceOpen) {
            closeDialogs('isPlanMaintenanceOpen');
          }
        }
      });

      if (loading) {
        return (
          <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
            <Loader2 className="w-8 h-8 animate-spin mr-4 text-primary" />
            <p className="text-xl">Carregando dados...</p>
          </div>
        );
      }

      if (error && !loading) {
        return (
          <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground text-center p-4">
            <h2 className="text-2xl font-bold text-red-500 mb-4">Ocorreu um Erro Crítico</h2>
            <p className="mb-6">Não foi possível carregar os dados da aplicação. Por favor, tente recarregar a página.</p>
            <Button onClick={() => window.location.reload()}>Recarregar Página</Button>
          </div>
        );
      }
      
      return (
        <>
          <MainLayout>
            <AppRoutes
                openAddEquipmentForm={handlers.handleOpenAddEquipmentForm}
                openMaintenanceForm={handlers.handleOpenMaintenanceForm}
                onEditMaintenance={handleEditMaintenance}
                openChecklistForm={handlers.handleOpenChecklistForm}
                openPlanMaintenanceForm={handlers.handleOpenPlanMaintenanceForm}
                uploadImages={handlers.uploadImages}
            />
          </MainLayout>
          <AppDialogs
            dialogState={dialogState}
            closeDialogs={closeDialogs}
            handlers={handlers}
            dialogData={{
              selectedEquipment,
              editingMaintenance,
              inventory: data.inventory,
            }}
          />
        </>
      );
    }

    function RedirectBasedOnRole() {
        const { user, loading: authLoading } = useAuth();
        
        if (authLoading) {
          return (
            <div className="min-h-screen bg-background flex items-center justify-center">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
          );
        }
        
        if (user) {
            if (user.role === 'usuario') {
                return <Navigate to="/field" replace />;
            }
            
            return <Navigate to="/dashboard" replace />;
        }

        return <Navigate to="/login" replace />;
    }

    function App() {
      const { user, loading: authLoading } = useAuth();
      const location = useLocation();

      useEffect(() => {
        const ensureBucketsExist = async () => {
          if (user) {
            const { error } = await supabase.functions.invoke('ensure-storage-buckets-exist');
            if (error) {
              console.error("Erro ao garantir a existência dos buckets:", error.message);
            }
          }
        };
        ensureBucketsExist();
      }, [user]);

      useEffect(() => {
        const isSiteRoute = location.pathname.startsWith('/site');
        const isFieldRoute = location.pathname.startsWith('/field') || location.pathname.startsWith('/despesadeviagem');
        
        // Ensure field-view always uses dark theme styles if only dark theme is available.
        // It's still useful to distinguish for specific field-view layouts or behaviors.
        if (isFieldRoute) {
          document.documentElement.classList.add('field-view');
        } else {
          document.documentElement.classList.remove('field-view');
        }
        if (isSiteRoute) {
          document.documentElement.classList.add('site-view');
        } else {
          document.documentElement.classList.remove('site-view');
        }
      }, [location.pathname]);

      if (authLoading) {
        return (
          <div className="min-h-screen bg-background flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        );
      }

      return (
        <DataProvider>
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
            <Route path="/field/login" element={user ? <Navigate to="/" /> : <FieldLoginPage />} />
            <Route path="/site" element={<SitePage />} />
            <Route path="/siteadmin" element={
                <ProtectedRoute permission="admin">
                  <MainLayout>
                    <SiteAdminPage />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/field/:formType?" 
              element={
                <ProtectedRoute fieldAccess>
                  <FieldPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/despesadeviagem" 
              element={
                <ProtectedRoute fieldAccess>
                  <ExpenseReportPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/pc/:formType?" 
              element={
                <ProtectedRoute>
                  <PcPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <ProfilePage />
                  </MainLayout>
                </ProtectedRoute>
              } 
            />
            <Route path="/" element={user ? <RedirectBasedOnRole /> : <Navigate to="/login" />} />
            <Route 
              path="/*" 
              element={
                <ProtectedRoute>
                  <AppContent />
                </ProtectedRoute>
              } 
            />
          </Routes>
          <Toaster />
        </DataProvider>
      );
    }

    export default App;
