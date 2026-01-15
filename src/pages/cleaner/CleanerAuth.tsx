import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingOverlay } from '@/components/LoadingOverlay';

export default function CleanerAuth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    if (user && profile?.roles?.includes('cleaner')) {
      navigate('/cleaner/dashboard', { replace: true });
    }
  }, [user, profile, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if user is a cleaner
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id);

      const isCleaner = roles?.some(r => r.role === 'cleaner');

      // Allow if they are admin too, potentially, but mostly cleaner
      if (!isCleaner) {
        // Optional: Check if admin, maybe they can login? 
        // For now strict cleaner check strictly for this portal
        const isAdmin = roles?.some(r => r.role === 'admin');
        if (!isAdmin) {
          await supabase.auth.signOut();
          throw new Error("Tento účet nemá oprávnění pro přihlášení jako uklízeč.");
        }
      }


    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Chyba přihlášení",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/cleaner/dashboard`,
          data: {
            full_name: fullName,
            phone: phone,
            is_cleaner: true, // Flag for potential triggers
          }
        }
      });

      if (authError) throw authError;

      // Assign cleaner role
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: user.id,
            role: 'cleaner'
          });

        if (roleError && !roleError.message.includes('duplicate')) {
          throw roleError;
        }
      }

      toast({
        title: "Registrace úspěšná!",
        description: "Zkontrolujte prosím svůj email pro potvrzení účtu. Váš účet musí být schválen administrátorem.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Chyba registrace",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1581578731117-104f2a8d23e9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center relative p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/90 via-slate-900/90 to-black/90 backdrop-blur-sm" />

      <Card className="w-full max-w-md relative z-10 border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl text-white">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto h-20 w-20 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg transform -rotate-3 hover:rotate-0 transition-transform duration-300">
            <span className="text-3xl font-bold text-white">Dr</span>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold tracking-tight text-white">Dr.Clean</CardTitle>
            <CardDescription className="text-emerald-100/70 mt-2">Portál pro uklízeče</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/5 border border-white/10">
              <TabsTrigger value="signin" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-emerald-100">Přihlášení</TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-emerald-100">Registrace</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-emerald-100">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-emerald-500"
                    placeholder="cleaner@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="text-emerald-100">Heslo</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-emerald-500"
                    placeholder="••••••••"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="signin-remember"
                    checked={rememberMe}
                    onCheckedChange={(c) => setRememberMe(!!c)}
                    className="border-white/50 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                  />
                  <label
                    htmlFor="signin-remember"
                    className="text-sm font-medium leading-none text-emerald-100 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Zůstat přihlášen
                  </label>
                </div>

                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20" disabled={loading}>
                  {loading ? "Přihlašování..." : 'Přihlásit se'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-emerald-100">Celé jméno</Label>
                  <Input
                    id="signup-name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-emerald-500"
                    placeholder="Josef Novák"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-emerald-100">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-emerald-500"
                    placeholder="josef@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone" className="text-emerald-100">Telefon</Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-emerald-500"
                    placeholder="+420 777 123 456"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-emerald-100">Heslo</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-emerald-500"
                    placeholder="••••••••"
                  />
                </div>

                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20" disabled={loading}>
                  {loading ? "Registrace..." : 'Zaregistrovat se'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      {loading && <LoadingOverlay message={email ? "Pracuji na tom..." : "Načítám..."} />}
    </div>
  );
}
