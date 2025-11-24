import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { PlusCircle, Loader2 } from 'lucide-react';
import { QuickAddChartOfAccountForm, QuickAddCostCenterForm } from './QuickAddForms';

const TransactionForm = ({ transaction, onSave, onClose, type }) => {
  const { user, supabase } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    description: '',
    issue_date: new Date().toISOString().slice(0, 10),
    due_date: '',
    gross_value: '',
    net_value: '',
    status: type === 'payable' ? 'Pendente' : 'Aberto',
    contact_id: '',
    chart_of_account_id: '',
    cost_center_id: '',
    job_id: '',
    payment_date: null,
    payment_method: '',
    discount: 0,
    interest: 0,
    iss_retention: 0,
    inss_retention: 0,
  });

  const [contacts, setContacts] = useState([]);
  const [chartOfAccounts, setChartOfAccounts] = useState([]);
  const [costCenters, setCostCenters] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [contactsRes, chartOfAccountsRes, costCentersRes, jobsRes] = await Promise.all([
      supabase.from('contacts').select('id, name').order('name', { ascending: true }),
      supabase.from('chart_of_accounts').select('id, name').order('name', { ascending: true }),
      supabase.from('cost_centers').select('id, name').order('name', { ascending: true }),
      supabase.from('jobs').select('id, job_code').order('created_at', { ascending: false }),
    ]);

    setContacts(contactsRes.data || []);
    setChartOfAccounts(chartOfAccountsRes.data || []);
    setCostCenters(costCentersRes.data || []);
    setJobs(jobsRes.data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (transaction) {
      setFormData({
        ...transaction,
        issue_date: transaction.issue_date ? new Date(transaction.issue_date).toISOString().slice(0, 10) : '',
        due_date: transaction.due_date ? new Date(transaction.due_date).toISOString().slice(0, 10) : '',
        payment_date: transaction.payment_date ? new Date(transaction.payment_date).toISOString().slice(0, 10) : null,
        gross_value: transaction.gross_value || '',
        discount: transaction.discount || 0,
        interest: transaction.interest || 0,
        iss_retention: transaction.iss_retention || 0,
        inss_retention: transaction.inss_retention || 0,
        net_value: transaction.net_value || '',
      });
    }
  }, [transaction]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const gross = parseFloat(formData.gross_value) || 0;
    const discount = parseFloat(formData.discount) || 0;
    const interest = parseFloat(formData.interest) || 0;
    const iss = parseFloat(formData.iss_retention) || 0;
    const inss = parseFloat(formData.inss_retention) || 0;
    const net = gross - discount + interest - iss - inss;
    setFormData(prev => ({ ...prev, net_value: net.toFixed(2) }));
  }, [formData.gross_value, formData.discount, formData.interest, formData.iss_retention, formData.inss_retention]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const dataToSave = {
      ...formData,
      user_id: user.id,
      contact_id: formData.contact_id || null,
      chart_of_account_id: formData.chart_of_account_id || null,
      cost_center_id: formData.cost_center_id || null,
      job_id: formData.job_id || null,
    };

    const tableName = type === 'payable' ? 'accounts_payable' : 'accounts_receivable';
    let error;

    if (transaction?.id) {
      ({ error } = await supabase.from(tableName).update(dataToSave).eq('id', transaction.id));
    } else {
      ({ error } = await supabase.from(tableName).insert(dataToSave));
    }

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message });
    } else {
      toast({ title: 'Transação salva com sucesso!' });
      onSave();
    }
    setIsSaving(false);
  };

  const openQuickAdd = (formType) => {
    setQuickAddType(formType);
    setIsQuickAddOpen(true);
  };

  const handleQuickAddSave = (newItem) => {
    fetchData(); // Refresh all dropdowns
    if (quickAddType === 'chart_of_accounts') {
      handleSelectChange('chart_of_account_id', newItem.id);
    } else if (quickAddType === 'cost_centers') {
      handleSelectChange('cost_center_id', newItem.id);
    }
    setIsQuickAddOpen(false);
  };

  if (loading) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Input id="description" name="description" value={formData.description} onChange={handleChange} required className="bg-white/10 mt-1" />
          </div>
          <div>
            <Label htmlFor="contact_id">Contato</Label>
            <Select onValueChange={(value) => handleSelectChange('contact_id', value)} value={formData.contact_id}>
              <SelectTrigger className="w-full bg-white/10 mt-1"><SelectValue placeholder="Selecione um contato" /></SelectTrigger>
              <SelectContent>{contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="issue_date">Data de Emissão</Label>
            <Input type="date" id="issue_date" name="issue_date" value={formData.issue_date} onChange={handleChange} required className="bg-white/10 mt-1" />
          </div>
          <div>
            <Label htmlFor="due_date">Data de Vencimento</Label>
            <Input type="date" id="due_date" name="due_date" value={formData.due_date} onChange={handleChange} required className="bg-white/10 mt-1" />
          </div>
          <div>
            <Label htmlFor="gross_value">Valor Bruto</Label>
            <Input type="number" step="0.01" id="gross_value" name="gross_value" value={formData.gross_value} onChange={handleChange} required className="bg-white/10 mt-1" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
                <Label htmlFor="discount">Desconto (-)</Label>
                <Input type="number" step="0.01" id="discount" name="discount" value={formData.discount} onChange={handleChange} className="bg-white/10 mt-1" />
            </div>
            <div>
                <Label htmlFor="interest">Juros (+)</Label>
                <Input type="number" step="0.01" id="interest" name="interest" value={formData.interest} onChange={handleChange} className="bg-white/10 mt-1" />
            </div>
            <div>
                <Label htmlFor="iss_retention">Retenção ISS (-)</Label>
                <Input type="number" step="0.01" id="iss_retention" name="iss_retention" value={formData.iss_retention} onChange={handleChange} className="bg-white/10 mt-1" />
            </div>
            <div>
                <Label htmlFor="inss_retention">Retenção INSS (-)</Label>
                <Input type="number" step="0.01" id="inss_retention" name="inss_retention" value={formData.inss_retention} onChange={handleChange} className="bg-white/10 mt-1" />
            </div>
        </div>

        <div>
            <Label htmlFor="net_value">Valor Líquido</Label>
            <Input id="net_value" name="net_value" value={formData.net_value} readOnly className="bg-black/20 mt-1 font-bold text-lg" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="chart_of_account_id">Plano de Contas</Label>
            <div className="flex items-center gap-2">
              <Select onValueChange={(value) => handleSelectChange('chart_of_account_id', value)} value={formData.chart_of_account_id}>
                <SelectTrigger className="w-full bg-white/10 mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{chartOfAccounts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
              <Button type="button" size="icon" variant="outline" onClick={() => openQuickAdd('chart_of_accounts')}><PlusCircle className="h-4 w-4" /></Button>
            </div>
          </div>
          <div>
            <Label htmlFor="cost_center_id">Centro de Custo</Label>
            <div className="flex items-center gap-2">
              <Select onValueChange={(value) => handleSelectChange('cost_center_id', value)} value={formData.cost_center_id}>
                <SelectTrigger className="w-full bg-white/10 mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{costCenters.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
              <Button type="button" size="icon" variant="outline" onClick={() => openQuickAdd('cost_centers')}><PlusCircle className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>

        <div>
            <Label htmlFor="job_id">Job (Obra)</Label>
            <Select onValueChange={(value) => handleSelectChange('job_id', value)} value={formData.job_id}>
                <SelectTrigger className="w-full bg-white/10 mt-1"><SelectValue placeholder="Selecione um Job" /></SelectTrigger>
                <SelectContent>{jobs.map(j => <SelectItem key={j.id} value={j.id}>{j.job_code}</SelectItem>)}</SelectContent>
            </Select>
        </div>

        <DialogFooter className="pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 'Salvar'}
          </Button>
        </DialogFooter>
      </form>

      <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
        <DialogContent className="bg-slate-800 border-white/20 text-white">
          <DialogHeader>
            <DialogTitle>Adicionar Novo {quickAddType === 'chart_of_accounts' ? 'Plano de Conta' : 'Centro de Custo'}</DialogTitle>
          </DialogHeader>
          {quickAddType === 'chart_of_accounts' && <QuickAddChartOfAccountForm onSave={handleQuickAddSave} onClose={() => setIsQuickAddOpen(false)} />}
          {quickAddType === 'cost_centers' && <QuickAddCostCenterForm onSave={handleQuickAddSave} onClose={() => setIsQuickAddOpen(false)} />}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TransactionForm;