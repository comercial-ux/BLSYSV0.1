import React, { useState } from 'react';
    import { Helmet } from 'react-helmet';
    import { motion } from 'framer-motion';
    import { LogIn, Loader2 } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import { useNavigate } from 'react-router-dom';
    
    const LoginPage = () => {
      const { signIn } = useAuth();
      const navigate = useNavigate();
      const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');
      const [loading, setLoading] = useState(false);
    
      const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error, redirectTo } = await signIn(email, password);
        if (!error && redirectTo) {
          navigate(redirectTo);
        }
        setLoading(false);
      };
    
      return (
        <>
          <Helmet>
            <title>Login | BLsys</title>
            <meta name="description" content="Acesse o sistema BLsys." />
            <meta property="og:title" content="Login | BLsys" />
            <meta property="og:description" content="Acesse o sistema BLsys." />
          </Helmet>
          <div className="min-h-screen flex items-center justify-center bg-white bg-[url('https://horizons-cdn.hostinger.com/248eb4f3-2326-4fb0-87c9-c097668888f4/5b63e0c2b520d1e5d8b7935c8010f92b.jpg')] bg-no-repeat bg-center bg-contain p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="w-full max-w-sm bg-slate-800/60 border-white/20 text-white backdrop-blur-lg">
                <CardHeader className="text-center">
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                    Bem vindo ao BLsys
                  </CardTitle>
                  <CardDescription className="text-blue-200">
                    Insira suas credenciais para continuar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Senha</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Sua senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      />
                    </div>
                    <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700" disabled={loading}>
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><LogIn className="mr-2 h-4 w-4" /> Entrar</>}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </>
      );
    };
    
    export default LoginPage;