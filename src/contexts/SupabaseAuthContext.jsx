import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2 } from 'lucide-react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [rolePermissions, setRolePermissions] = useState({});

    const clearSession = () => {
        setUser(null);
        setRolePermissions({});
        setLoading(false);
    };

    const fetchUserAndPermissions = async (authUser) => {
      if (!authUser) {
        clearSession();
        return;
      }
      const userRole = authUser.app_metadata?.role || 'usuario';

      const { data: publicUser, error: publicUserError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

      if (publicUserError || !publicUser) {
          console.error("Error fetching public user data, signing out:", publicUserError);
          await supabase.auth.signOut();
          clearSession();
          return;
      }

      const { data: permissions, error: permissionsError } = await supabase
          .from('role_permissions')
          .select('role, permissions');
      
      if (permissionsError) {
          console.error("Error fetching permissions:", permissionsError);
          await supabase.auth.signOut();
          clearSession();
          return;
      }
      
      const permissionsMap = permissions.reduce((acc, p) => {
          acc[p.role] = p.permissions;
          return acc;
      }, {});

      setUser({ ...authUser, ...publicUser, role: userRole });
      setRolePermissions(permissionsMap);
      setLoading(false);
    };
    
    useEffect(() => {
        const fetchInitialSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) {
                console.error("Error fetching initial session:", error);
                clearSession();
            } else if (session?.user) {
                await fetchUserAndPermissions(session.user);
            } else {
                clearSession();
            }
        };

        fetchInitialSession();

        const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (_event === 'SIGNED_IN') {
                await fetchUserAndPermissions(session.user);
            } else if (_event === 'SIGNED_OUT') {
                clearSession();
            } else if (_event === 'USER_UPDATED') {
                await fetchUserAndPermissions(session.user);
            }
        });

        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, []);


    const handleSignIn = async (email, password) => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            console.error("Sign in error:", error);
            setLoading(false);
            throw error;
        }
    };

    const handleSignOut = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signOut();
        if (error) console.error("Sign out error:", error);
        clearSession();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        );
    }

    const value = {
        user,
        rolePermissions,
        loading,
        signIn: handleSignIn,
        signOut: handleSignOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};