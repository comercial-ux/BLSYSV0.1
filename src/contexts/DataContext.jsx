
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const { user } = useAuth();
  const [equipments, setEquipments] = useState([]);
  const [maintenances, setMaintenances] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [companyDetails, setCompanyDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Global messages and users for notifications/direct messages
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [users, setUsers] = useState([]); 

  const [commercialData, setCommercialData] = useState({
    contacts: [],
    proposals: [],
    serviceItems: [],
    clauses: [],
    measurements: [],
    priceFormations: [],
    prospections: [],
    dailyReports: [],
  });

  const [operationalData, setOperationalData] = useState({
    jobs: [],
    dailyReports: [],
    fuelEntries: [],
    measurements: [],
  });

  const [financialData, setFinancialData] = useState({
    accountsPayable: [],
    accountsReceivable: [],
    cashFlow: [],
    chartOfAccounts: [],
    costCenters: [],
  });

  const checkError = (result, entityName) => {
    if (result.error) {
      console.error(`Error fetching ${entityName}:`, result.error);
      throw new Error(`Failed to fetch ${entityName}: ${result.error.message}`);
    }
    return result.data || [];
  };

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [
        equipmentsRes,
        maintenancesRes,
        checklistsRes,
        inventoryRes,
        companyRes,
        contactsRes,
        proposalsRes,
        serviceItemsRes,
        clausesRes,
        jobsRes,
        dailyReportsRes,
        fuelEntriesRes,
        measurementsRes,
        payableRes,
        receivableRes,
        cashFlowRes,
        chartRes,
        costCentersRes,
        messagesRes,
        userMessagesRes,
        allUsersRes,
        priceFormationsRes,
        prospectionsRes,
      ] = await Promise.all([
        supabase.from('equipments').select('*').eq('is_active', true).order('name'),
        supabase.from('maintenances').select('*, equipment:equipments(*)').order('created_at', { ascending: false }),
        supabase.from('checklists').select('*, equipment:equipments(*)').order('created_at', { ascending: false }),
        supabase.from('inventory_parts').select('*, supplier_contact:contacts(name)').eq('is_active', true).order('name'),
        supabase.from('company_details').select('*').limit(1).single(),
        supabase.from('contacts').select('*').order('name'),
        supabase
          .from('proposals')
          .select('*, contacts(*), users(full_name)')
          .order('created_at', { ascending: false }),
        supabase.from('service_items').select('*').order('name'),
        supabase.from('contract_clauses').select('*').order('display_order'),
        supabase
          .from('jobs')
          .select(`
            *,
            proposal:proposals(*,contacts(*)),
            operator:operator_id(name),
            sinaleiro:sinaleiro_id(name),
            primary_equipment:primary_equipment_id(name)
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('daily_reports')
          .select(`
            *,
            proposal:proposals(*, contacts(*)),
            job:jobs(*),
            equipment:equipments(*),
            operator:operator_id(name)
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('fuel_entries')
          .select('*, equipment:equipments(*), driver:driver_id(name)')
          .order('created_at', { ascending: false }),
        supabase
          .from('measurements')
          .select('*, proposal:proposals(*, contacts(*)), job:jobs(*)')
          .order('created_at', { ascending: false }),
        supabase
          .from('accounts_payable')
          .select('*, contact:contacts(name), chart_of_account:chart_of_accounts(name), cost_center:cost_centers(name), job:jobs(job_code)')
          .order('due_date', { ascending: false }),
        supabase
          .from('accounts_receivable')
          .select('*, contact:contacts(name), chart_of_account:chart_of_accounts(name), cost_center:cost_centers(name), job:jobs(job_code), proposal:proposals(proposal_number)')
          .order('due_date', { ascending: false }),
        supabase
          .from('cash_flow')
          .select('*, related_receivable:accounts_receivable(description), related_payable:accounts_payable(description)')
          .order('date', { ascending: false }),
        supabase.from('chart_of_accounts').select('*').order('name'),
        supabase.from('cost_centers').select('*').order('name'),
        supabase
          .from('messages')
          .select('*, user_messages!left(is_read)')
          .order('created_at', { ascending: false }),
        supabase
          .from('user_messages')
          .select('*')
          .eq('user_id', user.id),
        supabase.from('users').select('id, full_name, email, role, status'),
        supabase.from('price_formations').select('*, contacts(name)').order('created_at', { ascending: false }),
        supabase.from('prospections').select('*, contacts(name)').order('created_at', { ascending: false }),
      ]);

      setEquipments(checkError(equipmentsRes, 'equipments'));
      setMaintenances(checkError(maintenancesRes, 'maintenances'));
      setChecklists(checkError(checklistsRes, 'checklists'));
      setInventory(checkError(inventoryRes, 'inventory'));
      setCompanyDetails(companyRes.data || null);

      const fetchedMessages = messagesRes.data || [];
      const fetchedUserMessages = userMessagesRes.data || [];
      const readMessageIds = new Set(fetchedUserMessages.filter(um => um.is_read).map(um => um.message_id));

      const processedMessages = fetchedMessages.map(msg => ({
        ...msg,
        is_read: readMessageIds.has(msg.id),
      }));
      setMessages(processedMessages);
      setUnreadCount(processedMessages.filter(msg => !msg.is_read).length);
      
      setUsers(checkError(allUsersRes, 'users'));

      const dailyReportsData = checkError(dailyReportsRes, 'daily reports');

      setCommercialData({
        contacts: checkError(contactsRes, 'contacts'),
        proposals: checkError(proposalsRes, 'proposals'),
        serviceItems: checkError(serviceItemsRes, 'service items'),
        clauses: checkError(clausesRes, 'clauses'),
        measurements: checkError(measurementsRes, 'measurements'),
        priceFormations: checkError(priceFormationsRes, 'price formations'),
        prospections: checkError(prospectionsRes, 'prospections'),
        dailyReports: dailyReportsData,
      });

      setOperationalData({
        jobs: checkError(jobsRes, 'jobs'),
        dailyReports: dailyReportsData,
        fuelEntries: checkError(fuelEntriesRes, 'fuel entries'),
        measurements: checkError(measurementsRes, 'measurements'),
      });

      setFinancialData({
        accountsPayable: checkError(payableRes, 'accounts payable'),
        accountsReceivable: checkError(receivableRes, 'accounts receivable'),
        cashFlow: checkError(cashFlowRes, 'cash flow'),
        chartOfAccounts: checkError(chartRes, 'chart of accounts'),
        costCenters: checkError(costCentersRes, 'cost centers'),
      });

    } catch (err) {
      console.error('Error in fetchData:', err);
      setError(err.message || 'An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();

    const messageChannel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, payload => {
        fetchData();
      })
      .subscribe();
    
    const userMessageChannel = supabase
      .channel('public:user_messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_messages', filter: `user_id=eq.${user?.id}` }, payload => {
        fetchData();
      })
      .subscribe();

    return () => {
      messageChannel.unsubscribe();
      userMessageChannel.unsubscribe();
    };
  }, [fetchData, user?.id]);

  const markAsRead = async (messageId) => {
    if (!user) return;
    
    try {
        // Update local state immediately for better UX
        setMessages(prev => prev.map(msg => 
            msg.id === messageId ? { ...msg, is_read: true } : msg
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));

        // Try to insert, on conflict update
        const { error } = await supabase
            .from('user_messages')
            .upsert(
                { 
                    user_id: user.id, 
                    message_id: messageId, 
                    is_read: true,
                    created_at: new Date().toISOString() 
                }, 
                { onConflict: 'user_id, message_id' }
            );

        if (error) throw error;
        
    } catch (error) {
        console.error('Error marking message as read:', error);
        fetchData(); // Revert/Sync on error
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    const unread = messages.filter(m => !m.is_read);
    if (unread.length === 0) return;

    try {
        // Update local state immediately
        setMessages(prev => prev.map(msg => ({ ...msg, is_read: true })));
        setUnreadCount(0);

        const updates = unread.map(m => ({
            user_id: user.id,
            message_id: m.id,
            is_read: true,
            created_at: new Date().toISOString()
        }));

        const { error } = await supabase
            .from('user_messages')
            .upsert(updates, { onConflict: 'user_id, message_id' });

        if (error) throw error;

    } catch (error) {
        console.error('Error marking all as read:', error);
        fetchData();
    }
  };

  const value = {
    equipments,
    maintenances,
    checklists,
    inventory,
    companyDetails,
    commercialData,
    operationalData,
    financialData,
    loading,
    error,
    messages,
    unreadCount,
    users,
    refetchData: fetchData,
    markAsRead,
    markAllAsRead,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
