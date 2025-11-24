import React from 'react';
import { useNavigate, useLocation, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Shield, Building, User, Wrench, Lock, FileArchive, Settings, PackagePlus, Gavel } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import DocumentaBLDashboard from '@/components/documentabl/DocumentaBLDashboard';
import DocumentCategoryPage from '@/components/documentabl/DocumentCategoryPage';
import DocumentaBLSettings from '@/components/documentabl/DocumentaBLSettings';
import AdminPasswordPrompt from '@/components/documentabl/AdminPasswordPrompt';
import DocumentPackageGenerator from '@/components/documentabl/DocumentPackageGenerator';
import DocumentMatrixView from '@/components/documentabl/DocumentMatrixView';
import DocumentMatrixViewEquipamento from '@/components/documentabl/DocumentMatrixViewEquipamento';

const ProtectedAdminRoute = ({ children, password }) => {
  const storageKey = `documentabl_auth_${password}`;
  const [isAuthenticated, setIsAuthenticated] = React.useState(sessionStorage.getItem(storageKey) === 'true');

  if (!isAuthenticated) {
    return <AdminPasswordPrompt onAuthenticated={() => setIsAuthenticated(true)} passwordToCheck={password} storageKey={storageKey} />;
  }

  return children;
};

const DocumentaBLPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { value: 'dashboard', icon: <Shield className="mr-2 h-4 w-4" />, label: 'Dashboard' },
    { value: 'empresa', icon: <Building className="mr-2 h-4 w-4" />, label: 'Empresa' },
    { value: 'colaborador', icon: <User className="mr-2 h-4 w-4" />, label: 'Colaborador' },
    { value: 'equipamento', icon: <Wrench className="mr-2 h-4 w-4" />, label: 'Equipamento' },
    { value: 'seguranca', icon: <Shield className="mr-2 h-4 w-4" />, label: 'Segurança' },
    { value: 'demandas', icon: <Gavel className="mr-2 h-4 w-4" />, label: 'Demandas' },
    { value: 'administrativa', icon: <Lock className="mr-2 h-4 w-4" />, label: 'Administrativa' },
    { value: 'package-generator', icon: <FileArchive className="mr-2 h-4 w-4" />, label: 'Gerar Pacote' },
    { value: 'settings', icon: <Settings className="mr-2 h-4 w-4" />, label: 'Configurações' },
  ];

  const getCurrentTab = () => {
    const pathParts = location.pathname.split('/documentabl/');
    if (pathParts.length > 1) {
      const segment = pathParts[1].split('/')[0];
      return segment;
    }
    return 'dashboard';
  };
  
  const currentTab = getCurrentTab();

  const handleTabChange = (value) => {
    if (value === 'colaborador' && location.pathname.includes('/matrix')) {
      navigate(`/documentabl/colaborador/matrix`);
    } else if (value === 'equipamento' && location.pathname.includes('/matrix')) {
      navigate(`/documentabl/equipamento/matrix`);
    } else {
      navigate(`/documentabl/${value}`);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">DocumentaBL</h1>
          <p className="text-muted-foreground">Seu centro de comando para gestão de documentação.</p>
        </div>
        <Link to="/documentabl/package-generator">
          <Button size="lg">
            <PackagePlus className="mr-2 h-5 w-5" />
            Gerar Pacote Documental
          </Button>
        </Link>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full overflow-x-auto">
        <TabsList className="inline-grid w-max grid-flow-col">
          {tabs.map(({ value, icon, label }) => (
            <TabsTrigger key={value} value={value}>
              {icon}
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      
      <div className="flex-1 overflow-y-auto">
        <Routes>
            <Route path="/" element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DocumentaBLDashboard />} />
            <Route path="empresa" element={<DocumentCategoryPage mainCategory="empresa" />} />
            <Route path="colaborador" element={<DocumentCategoryPage mainCategory="colaborador" />} />
            <Route path="colaborador/matrix" element={<DocumentMatrixView />} />
            <Route path="equipamento" element={<DocumentCategoryPage mainCategory="equipamento" />} />
            <Route path="equipamento/matrix" element={<DocumentMatrixViewEquipamento />} />
            <Route path="seguranca" element={<DocumentCategoryPage mainCategory="seguranca" />} />
            <Route 
              path="demandas" 
              element={
                <ProtectedAdminRoute password="bl@2025">
                  <DocumentCategoryPage mainCategory="demandas" />
                </ProtectedAdminRoute>
              } 
            />
            <Route 
              path="administrativa" 
              element={
                <ProtectedAdminRoute password="Rmmg470$">
                  <DocumentCategoryPage mainCategory="administrativa" />
                </ProtectedAdminRoute>
              } 
            />
            <Route path="package-generator" element={<DocumentPackageGenerator />} />
            <Route path="settings" element={<DocumentaBLSettings />} />
        </Routes>
      </div>
    </div>
  );
};

export default DocumentaBLPage;