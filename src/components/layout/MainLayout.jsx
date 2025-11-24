
import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Wrench, ShieldCheck, LogOut, BarChart3, Package, Users, DollarSign, Truck, HeartHandshake as Handshake, UserCog, FolderArchive, Bell, MessageSquarePlus, Globe, Moon, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import NotificationsPanel from '@/components/notifications/NotificationsPanel';
import DirectMessageDialog from '@/components/notifications/DirectMessageDialog';
import { useData } from '@/contexts/DataContext';

const NavItem = ({ to, icon, children, matchStartsWith = false, isVisible = true, ...props }) => {
  const location = useLocation();
  const commonClasses = "flex items-center w-full px-3 py-1.5 rounded-md text-sm font-medium transition-all text-muted-foreground hover:text-foreground hover:bg-muted";
  const activeClasses = "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground";
  
  const isActive = matchStartsWith 
    ? location.pathname.startsWith(to)
    : location.pathname === to;

  if (!isVisible) {
    return null;
  }

  return (
    <NavLink 
      to={to} 
      className={isActive ? `${commonClasses} ${activeClasses}` : commonClasses} 
      {...props}
    >
      {icon}
      {children}
    </NavLink>
  );
};

const MainLayout = ({ children }) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { messages, unreadCount, users: allUsers } = useData();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isDirectMessageOpen, setIsDirectMessageOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const userIdentifier = user?.full_name || user?.email || "Usuário";
  const permissions = user?.permissions || {};
  const latestUnreadMessage = messages && messages.find(m => !m.is_read);

  return (
    <div className="flex min-h-screen bg-secondary text-foreground">
      <aside className="w-56 bg-card border-r border-border flex flex-col fixed top-0 left-0 h-full z-20 shadow-lg">
        <div className="p-4 border-b border-border">
          <img alt="BL Soluções Logo" className="h-10 mx-auto" src="https://horizons-cdn.hostinger.com/248eb4f3-2326-4fb0-87c9-c097668888f4/117ff0f826d422f849e550f5d230d240.jpg" />
        </div>
        <ScrollArea className="flex-1">
          <nav className="space-y-1 p-3">
            <NavItem to="/dashboard" icon={<LayoutDashboard className="w-4 h-4 mr-2" />} isVisible={permissions.dashboard}>Dashboard</NavItem>
            <NavItem to="/documentabl" icon={<FolderArchive className="w-4 h-4 mr-2" />} matchStartsWith={true} isVisible={permissions.documentabl}>DocumentaBL</NavItem>
            <NavItem to="/equipments" icon={<Wrench className="w-4 h-4 mr-2" />} isVisible={permissions.equipments}>Equipamentos</NavItem>
            <NavItem to="/operational" icon={<Truck className="w-4 h-4 mr-2" />} matchStartsWith={true} isVisible={permissions.operational}>Operacional</NavItem>
            <NavItem to="/commercial" icon={<Handshake className="w-4 h-4 mr-2" />} matchStartsWith={true} isVisible={permissions.commercial}>Comercial</NavItem>
            <NavItem to="/maintenances" icon={<Wrench className="w-4 h-4 mr-2" />} isVisible={permissions.maintenances}>Manutenção</NavItem>
            <NavItem to="/supplies" icon={<Package className="w-4 h-4 mr-2" />} matchStartsWith={true} isVisible={permissions.supplies}>Suprimentos</NavItem>
            <NavItem to="/personnel" icon={<Briefcase className="w-4 h-4 mr-2" />} matchStartsWith={true} isVisible={permissions.personnel}>Dep. Pessoal</NavItem>
            <NavItem to="/finance" icon={<DollarSign className="w-4 h-4 mr-2" />} isVisible={permissions.finance}>Financeiro</NavItem>
            <NavItem to="/reports" icon={<BarChart3 className="w-4 h-4 mr-2" />} isVisible={permissions.reports}>Relatórios</NavItem>
            <NavItem to="/profile" icon={<UserCog className="w-4 h-4 mr-2" />} >Meu Perfil</NavItem>
            <NavItem to="/administrativo" icon={<ShieldCheck className="w-4 h-4 mr-2" />} isVisible={permissions.administrative}>Administrativo</NavItem>
          </nav>
        </ScrollArea>
        
        <div className="p-3 border-t border-border space-y-2">
            <div className="flex items-center px-2 py-1 rounded-md text-sm text-muted-foreground bg-muted/30">
                <Moon className="w-4 h-4 mr-2" />
                <span>Tema Escuro</span>
            </div>

            <Button variant="ghost" className="w-full justify-start relative" onClick={() => setIsNotificationsOpen(true)}>
                <Bell className="w-5 h-5 mr-2" />
                Notificações
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                        {unreadCount}
                    </span>
                )}
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={() => setIsDirectMessageOpen(true)}>
                <MessageSquarePlus className="w-5 h-5 mr-2" />
                Nova Mensagem
            </Button>
            {latestUnreadMessage && (
              <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/50 rounded-md">
                <p className="font-semibold text-foreground truncate">{latestUnreadMessage.title}</p>
                <p className="truncate">{latestUnreadMessage.body}</p>
              </div>
            )}
        </div>

        <div className="p-3 border-t border-border mt-auto">
          <div className="p-3 rounded-md bg-muted/50 text-center">
            <span className="text-sm text-muted-foreground block truncate">Olá, <span className="font-bold text-foreground">{userIdentifier}</span></span>
            <Button onClick={handleLogout} variant="ghost" size="sm" className="w-full mt-2">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex-1 ml-56 p-6 transition-colors duration-300">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {children}
        </motion.div>
      </main>

      <NotificationsPanel
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        messages={messages}
      />
      <DirectMessageDialog
        isOpen={isDirectMessageOpen}
        onClose={() => setIsDirectMessageOpen(false)}
        users={allUsers}
        senderId={user.id}
      />
    </div>
  );
};

export default MainLayout;
