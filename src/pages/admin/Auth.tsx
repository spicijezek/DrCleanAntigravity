import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
import { Loader2 } from 'lucide-react';

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1527515673516-9b552e6aeeb4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center relative p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-slate-900/90 to-black/90 backdrop-blur-sm" />

      <Card className="w-full max-w-md relative z-10 border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl text-white">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
            <span className="text-3xl font-bold text-white">Dr</span>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold tracking-tight">Dr.Clean</CardTitle>
            <CardDescription className="text-blue-100/70 mt-2">Premium Cleaning Management</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/5 border border-white/10">
              <TabsTrigger value="signin" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-blue-100">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-blue-100">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email_signin" className="text-blue-100">Email</Label>
                  <Input
                    id="email_signin"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password_signin" className="text-blue-100">Password</Label>
                  <Input
                    id="password_signin"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-blue-500"
                  />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Sign In'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-blue-100">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email_signup" className="text-blue-100">Email</Label>
                  <Input
                    id="email_signup"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password_signup" className="text-blue-100">Password</Label>
                  <Input
                    id="password_signup"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-blue-500"
                  />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-transparent px-2 text-blue-100">Or continue with</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
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
            )}
            Google
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}