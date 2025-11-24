import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Lock } from 'lucide-react';

const AdminPasswordPrompt = ({ onAuthenticated, isDialog = false, passwordToCheck, storageKey }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === passwordToCheck) {
      setError('');
      toast({
        title: "Acesso Autorizado",
        description: "Bem-vindo à área restrita.",
      });
      sessionStorage.setItem(storageKey, 'true');
      onAuthenticated();
    } else {
      setError('Senha incorreta. Tente novamente.');
      toast({
        title: "Acesso Negado",
        description: "A senha está incorreta.",
        variant: 'destructive',
      });
    }
  };

  const content = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Digite a senha de acesso"
        className={error ? 'border-red-500' : ''}
        autoFocus
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" className="w-full">
        Desbloquear Acesso
      </Button>
    </form>
  );

  if (isDialog) {
    return (
      <>
        <DialogHeader>
          <DialogTitle className="flex items-center"><Lock className="mr-2" /> Acesso Restrito</DialogTitle>
          <DialogDescription>
            Esta ação requer privilégios. Por favor, insira a senha para continuar.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          {content}
        </div>
      </>
    );
  }

  return (
    <div className="flex items-center justify-center h-full">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center"><Lock className="mr-2" /> Acesso Restrito</CardTitle>
          <CardDescription>
            Esta área contém informações sensíveis. Por favor, insira a senha para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {content}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPasswordPrompt;