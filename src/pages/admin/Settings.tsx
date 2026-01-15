import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Lock, Upload, Save, X, Settings as SettingsIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { profileUpdateSchema, passwordUpdateSchema } from '@/lib/validationSchemas';

interface SettingsProps {
  onClose: () => void;
}

export default function Settings({ onClose }: SettingsProps) {
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    avatar_url: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const profileData = {
          full_name: data.full_name || '',
          email: data.email || user?.email || '',
          phone: data.phone || '',
          avatar_url: '',
        };

        // Load avatar handles both Cloudinary URLs and old Supabase paths
        if (data.avatar_url) {
          if (data.avatar_url.startsWith('http')) {
            profileData.avatar_url = data.avatar_url;
          } else {
            const filePath = data.avatar_url.split('/').slice(-2).join('/');
            const { data: signedData } = await supabase.storage
              .from('avatars')
              .createSignedUrl(filePath, 3600);

            if (signedData) {
              profileData.avatar_url = signedData.signedUrl;
            }
          }
        }

        setProfile(profileData);
      } else {
        setProfile(prev => ({
          ...prev,
          email: user?.email || '',
        }));
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch profile',
        variant: 'destructive',
      });
    }
  };

  const updateProfile = async () => {
    if (!user) return;

    // Validate input
    const validationResult = profileUpdateSchema.safeParse(profile);

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast({
        title: 'Validation Error',
        description: firstError.message,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert(
          {
            user_id: user.id,
            full_name: profile.full_name,
            email: profile.email,
            phone: profile.phone,
            avatar_url: profile.avatar_url,
          },
          { onConflict: 'user_id' }
        );

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    // Validate input
    const validationResult = passwordUpdateSchema.safeParse(passwords);

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast({
        title: 'Validation Error',
        description: firstError.message,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Password updated successfully',
      });

      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'File size must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Upload directly to Cloudinary
      const newAvatarUrl = await uploadToCloudinary(file);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert(
          {
            user_id: user.id,
            full_name: profile.full_name,
            email: profile.email,
            phone: profile.phone,
            avatar_url: newAvatarUrl,
          },
          { onConflict: 'user_id' }
        );

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, avatar_url: newAvatarUrl }));

      toast({
        title: 'Success',
        description: 'Avatar updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[1000] m-0 animate-in fade-in duration-300">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto relative bg-card/90 backdrop-blur-xl border-0 shadow-2xl rounded-3xl">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-10 h-10 w-10 hover:bg-black/5 hover:text-black rounded-full"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <SettingsIcon className="h-6 w-6 text-primary" />
            Nastavení profilu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-background/50 p-1 rounded-xl">
              <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Profil</TabsTrigger>
              <TabsTrigger value="security" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Zabezpečení</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-400">
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-3xl bg-primary/5 border border-primary/10">
                <div className="relative group">
                  <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
                    <AvatarImage src={profile.avatar_url} className="object-cover" />
                    <AvatarFallback className="bg-primary/10">
                      <User className="h-10 w-10 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    variant="gradient"
                    size="icon"
                    className="absolute -bottom-2 -right-2 h-9 w-9 rounded-full shadow-lg scale-90 sm:scale-100"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-lg font-bold">{profile.full_name || 'Uživatel'}</h3>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Celé jméno</Label>
                  <Input
                    id="full_name"
                    value={profile.full_name}
                    onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                    className="bg-background/50 border-0 rounded-xl h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Telefon</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                    className="bg-background/50 border-0 rounded-xl h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-background/50 border-0 rounded-xl h-12 opacity-70"
                  disabled
                />
              </div>

              <div className="pt-4">
                <Button
                  onClick={updateProfile}
                  disabled={loading}
                  variant="gradient"
                  className="w-full sm:w-auto px-8 h-12 rounded-xl shadow-lg shadow-primary/20"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Uložit změny
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-400">
              <div className="space-y-6">
                <div className="space-y-4 rounded-3xl p-6 bg-destructive/5 border border-destructive/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="h-5 w-5 text-destructive" />
                    <h3 className="font-bold">Změna hesla</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current_password">Současné heslo</Label>
                      <Input
                        id="current_password"
                        type="password"
                        value={passwords.current}
                        onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                        className="bg-background/50 border-0 rounded-xl h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new_password">Nové heslo</Label>
                      <Input
                        id="new_password"
                        type="password"
                        value={passwords.new}
                        onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                        className="bg-background/50 border-0 rounded-xl h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm_password">Potvrzení hesla</Label>
                      <Input
                        id="confirm_password"
                        type="password"
                        value={passwords.confirm}
                        onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                        className="bg-background/50 border-0 rounded-xl h-11"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={updatePassword}
                    disabled={loading}
                    variant="destructive"
                    className="w-full sm:w-auto h-11 rounded-xl shadow-lg shadow-destructive/20 mt-2"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Aktualizovat heslo
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}