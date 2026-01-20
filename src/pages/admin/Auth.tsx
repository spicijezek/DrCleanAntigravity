import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import drcleanIcon from '@/assets/drclean-icon-blue.png';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { signUpSchema, signInSchema } from '@/lib/validationSchemas';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ShieldCheck, Mail, Lock, User, Chrome } from 'lucide-react';
import { LoadingOverlay } from '@/components/LoadingOverlay';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn, signUp, user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const isMainAdmin = user?.email === 'stepan.tomov5@seznam.cz';
    const isAdmin = profile?.roles?.includes('admin') || isMainAdmin;

    if (user && isAdmin) {
      navigate('/');
    }
  }, [user, profile, navigate]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Google Sign-In Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const validationResult = signInSchema.safeParse({ email, password });

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast({
        title: "Validation Error",
        description: firstError.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Signed in successfully!",
      });
    }

    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const validationResult = signUpSchema.safeParse({ email, password, fullName });

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast({
        title: "Validation Error",
        description: firstError.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { error } = await signUp(email, password, fullName);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Account created successfully! Your account is pending approval.",
      });
    }

    setLoading(false);
  };

  if (loading) {
    return <LoadingOverlay message="Probíhá ověřování..." />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1527515673516-9b552e6aeeb4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center relative p-4 overflow-hidden">
      {/* Dynamic Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-slate-900/90 to-black/95 backdrop-blur-sm" />

      {/* Animated blobs for background interest */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-500/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-[120px] animate-pulse delay-700" />

      <Card className="w-full max-w-md relative z-10 border-0 bg-white/10 backdrop-blur-2xl shadow-[0_32px_64px_-15px_rgba(0,0,0,0.5)] rounded-[2.5rem] text-white overflow-hidden animate-in fade-in zoom-in-95 duration-700">
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

        <CardHeader className="text-center space-y-6 pt-10 pb-8">
          <div className="mx-auto h-24 w-24 flex items-center justify-center transform hover:scale-105 transition-transform duration-500 group">
            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl group-hover:blur-3xl transition-all opacity-50" />
            <img
              src={drcleanIcon}
              alt="DrClean"
              className="h-20 w-20 relative z-10 drop-shadow-2xl animate-spin-pulse"
            />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
              DrClean
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-10">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-white/5 border border-white/10 rounded-2xl h-12 p-1 gap-1">
              <TabsTrigger value="signin" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-blue-900 text-white/70 font-bold transition-all">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-blue-900 text-white/70 font-bold transition-all">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="space-y-2.5">
                  <Label htmlFor="email_signin" className="text-blue-100/80 text-xs font-bold uppercase tracking-wider ml-1">Email Address</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 group-focus-within:text-white transition-colors" />
                    <Input
                      id="email_signin"
                      type="email"
                      placeholder="stepan@drclean.cz"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 pl-11 rounded-2xl focus-visible:ring-white/20 focus-visible:border-white/20 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="password_signin" className="text-blue-100/80 text-xs font-bold uppercase tracking-wider ml-1">Secure Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 group-focus-within:text-white transition-colors" />
                    <Input
                      id="password_signin"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 pl-11 rounded-2xl focus-visible:ring-white/20 focus-visible:border-white/20 transition-all"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full h-14 bg-white text-blue-900 hover:bg-blue-50 font-bold rounded-[1.25rem] shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]">
                  Sign Into Dashboard
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-5 animate-in fade-in slide-in-from-left-4 duration-500">
              <form onSubmit={handleSignUp} className="space-y-5">
                <div className="space-y-2.5">
                  <Label htmlFor="fullName" className="text-blue-100/80 text-xs font-bold uppercase tracking-wider ml-1">Full Name</Label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 group-focus-within:text-white transition-colors" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Stepan Tomov"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 pl-11 rounded-2xl focus-visible:ring-white/20 focus-visible:border-white/20 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="email_signup" className="text-blue-100/80 text-xs font-bold uppercase tracking-wider ml-1">Email Address</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 group-focus-within:text-white transition-colors" />
                    <Input
                      id="email_signup"
                      type="email"
                      placeholder="stepan@drclean.cz"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 pl-11 rounded-2xl focus-visible:ring-white/20 focus-visible:border-white/20 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="password_signup" className="text-blue-100/80 text-xs font-bold uppercase tracking-wider ml-1">Create Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 group-focus-within:text-white transition-colors" />
                    <Input
                      id="password_signup"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 pl-11 rounded-2xl focus-visible:ring-white/20 focus-visible:border-white/20 transition-all"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full h-14 bg-white text-blue-900 hover:bg-blue-50 font-bold rounded-[1.25rem] shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]">
                  Request Registration
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
              <span className="bg-[#111827]/40 px-3 text-white/40 backdrop-blur-md rounded-full border border-white/10">Or connect with</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full h-14 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white rounded-[1.25rem] transition-all flex items-center justify-center gap-3 group"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <img src={drcleanIcon} alt="Loading" className="h-4 w-4 animate-spin-pulse" />
            ) : (
              <>
                <div className="bg-white p-1 rounded-md group-hover:scale-110 transition-transform">
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                </div>
                <span className="font-bold">Google Workspace</span>
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Footer Branding */}
      <div className="absolute bottom-8 text-center animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-500">
        <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] drop-shadow-sm">
          &copy; 2026 DRCLEAN &bull; All Rights Reserved
        </p>
      </div>
    </div>
  );
}