import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';

const AuthContext = createContext(undefined);

const LOCAL_STORAGE_KEY = 'blsolucoes_auth';
const USERS_STORAGE_KEY = 'blsolucoes_users';

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const getUsers = () => {
    const usersStr = localStorage.getItem(USERS_STORAGE_KEY);
    let users = [];
    try {
      users = usersStr ? JSON.parse(usersStr) : [];
    } catch (e) {
      console.error("Failed to parse users from localStorage, resetting.", e);
      users = [];
    }

    if (!Array.isArray(users) || users.length === 0) {
      const adminUser = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@sistema.com',
        password: 'password123',
        role: 'admin',
        full_name: 'Admin Padrão',
        status: 'active',
        created_at: new Date().toISOString()
      };
      users = [adminUser];
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }
    return users;
  };

  useEffect(() => {
    try {
      getUsers(); // Ensure default user exists on initial load
      const authData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (authData) {
        setUser(JSON.parse(authData));
      }
    } catch (error) {
      console.error("Failed to parse auth data from localStorage", error);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setUser(null);
    toast({
      title: "Desconectado",
      description: "Você saiu da sua conta com sucesso.",
    });
    return { error: null };
  }, [toast]);

  const signUp = useCallback(async (email, password, options) => {
    const users = getUsers();
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      const error = { message: "Um usuário com este e-mail já está registrado." };
      toast({
        variant: "destructive",
        title: "Falha no Cadastro",
        description: error.message,
      });
      return { error };
    }

    const newUser = {
      id: uuidv4(),
      email,
      password,
      role: options?.data?.role || 'man',
      full_name: options?.data?.full_name || '',
      status: 'active',
      created_at: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    
    // Auto-login after sign up
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newUser));
    setUser(newUser);

    return { error: null };
  }, [toast]);

  const signIn = useCallback(async (email, password) => {
    const users = getUsers();
    const foundUser = users.find(u => u.email === email && u.password === password);
    
    if (foundUser) {
      if (foundUser.status === 'inactive') {
        const error = { message: "Sua conta está inativa. Entre em contato com o administrador." };
        toast({
            variant: "destructive",
            title: "Falha no Login",
            description: error.message,
        });
        return { error };
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(foundUser));
      setUser(foundUser);
      return { error: null };
    } else {
      const error = { message: "Email ou senha inválidos." };
      toast({
        variant: "destructive",
        title: "Falha no Login",
        description: error.message,
      });
      return { error };
    }
  }, [toast]);
  
  const value = useMemo(() => ({
    user,
    loading,
    signUp,
    signIn,
    signOut,
  }), [user, loading, signUp, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};