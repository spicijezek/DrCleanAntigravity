import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Phone, Calendar, MapPin, Lock, ChevronDown, Upload, LogOut, Save, FileText, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ClientHeroHeader } from '@/components/client/ClientHeroHeader';
import { DatePicker } from '@/components/ui/date-time-picker';
import { LoadingOverlay } from '@/components/LoadingOverlay';

export default function CleanerProfile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Profile data
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    city: '',
    postalCode: '',
    bio: ''
  });
  const [avatarUrl, setAvatarUrl] = useState('');

  // Password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (teamMember) {
        // Try to split address if it contains commas
        const addrParts = teamMember.address ? teamMember.address.split(',').map(p => p.trim()) : ['', '', ''];

        setProfileData({
          fullName: teamMember.name || '',
          email: teamMember.email || '',
          phone: teamMember.phone || '',
          dateOfBirth: teamMember.date_of_birth || '',
          address: addrParts[0] || '',
          city: addrParts[1] || '',
          postalCode: addrParts[2] || '',
          bio: teamMember.bio || '',
        });
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile?.avatar_url) {
        if (profile.avatar_url.startsWith('http')) {
          setAvatarUrl(profile.avatar_url);
        } else {
          const { data: signedUrl } = await supabase.storage
            .from('avatars')
            .createSignedUrl(profile.avatar_url, 3600);

          if (signedUrl) {
            setAvatarUrl(signedUrl.signedUrl);
          }
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'Soubor je příliš velký',
        description: 'Maximum je 5MB.',
      });
      return;
    }

    setUploading(true);

    try {
      // Upload directly to Cloudinary
      const imageUrl = await uploadToCloudinary(file);

      // Update profile with full URL
      await supabase
        .from('profiles')
        .update({ avatar_url: imageUrl })
        .eq('user_id', user.id);

      setAvatarUrl(imageUrl);

      toast({
        title: 'Úspěch',
        description: 'Profilová fotka byla nahrána.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Chyba nahrávání',
        description: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    // Validation - all fields mandatory as requested
    if (!profileData.fullName || !profileData.email || !profileData.phone || !profileData.dateOfBirth || !profileData.address || !profileData.city || !profileData.postalCode || !profileData.bio) {
      toast({
        variant: 'destructive',
        title: 'Chybí povinná pole',
        description: 'Prosím vyplňte všechna pole včetně vašeho bio.',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('team_members')
        .update({
          name: profileData.fullName,
          email: profileData.email,
          phone: profileData.phone,
          date_of_birth: profileData.dateOfBirth,
          address: `${profileData.address}, ${profileData.city}, ${profileData.postalCode}`,
          bio: profileData.bio,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Profil aktualizován',
        description: 'Vaše změny byly úspěšně uloženy.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Chyba ukládání',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Chybí údaje',
        description: 'Prosím vyplňte všechna pole.',
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Hesla se neshodují',
        description: 'Nové heslo a potvrzení musí být stejné.',
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Slabé heslo',
        description: 'Heslo musí mít alespoň 6 znaků.',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      toast({
        title: 'Heslo změněno',
        description: 'Vaše heslo bylo úspěšně aktualizováno.',
      });

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Chyba změny hesla',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/cleaner/auth');
  };

  if (loading && !profileData.email) {
    return <LoadingOverlay message="Načítám Váš profil..." />;
  }

  return (
    <div className="container mx-auto p-4 pb-20 space-y-6 max-w-5xl">
      {/* Hero Header */}
      <ClientHeroHeader
        icon={User}
        title={profileData.fullName || "Můj Profil"}
        subtitle="Správa vašich osobních údajů a profilu člena týmu"
        variant="primary"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Basic Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent pb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary shadow-lg shadow-primary/20">
                  <User className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-xl">Osobní Údaje</CardTitle>
                  <CardDescription>Informace pro dispečink a klienty</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2 md:col-span-2">
                  <Label className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Celé jméno *
                  </Label>
                  <Input
                    required
                    value={profileData.fullName}
                    onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                    className="bg-muted/30 border-muted-foreground/20 focus:border-primary/50 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    Email *
                  </Label>
                  <Input
                    required
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="bg-muted/30 border-muted-foreground/20 focus:border-primary/50 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary" />
                    Telefon *
                  </Label>
                  <Input
                    required
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    placeholder="+420 123 456 789"
                    className="bg-muted/30 border-muted-foreground/20 focus:border-primary/50 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Datum narození *
                  </Label>
                  <DatePicker
                    value={profileData.dateOfBirth ? new Date(profileData.dateOfBirth) : undefined}
                    onChange={(date) => setProfileData({
                      ...profileData,
                      dateOfBirth: date ? date.toISOString().split('T')[0] : ''
                    })}
                    placeholder=""
                    disabledDates={(date) => date > new Date()}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    Adresa *
                  </Label>
                  <Input
                    required
                    value={profileData.address}
                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                    placeholder="Ulice a č.p."
                    className="bg-muted/30 border-muted-foreground/20 focus:border-primary/50 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Město *</Label>
                  <Input
                    required
                    value={profileData.city}
                    onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                    className="bg-muted/30 border-muted-foreground/20 focus:border-primary/50 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label>PSČ *</Label>
                  <Input
                    required
                    value={profileData.postalCode}
                    onChange={(e) => setProfileData({ ...profileData, postalCode: e.target.value })}
                    className="bg-muted/30 border-muted-foreground/20 focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button className="w-full h-12 text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all font-bold" onClick={handleSave} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Ukládám..." : "Uložit Změny"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Avatar & Security */}
        <div className="space-y-6">
          {/* Avatar Card */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-transparent pb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500 shadow-lg shadow-indigo-500/20">
                  <Upload className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Profilová Fotka</CardTitle>
                  <CardDescription>Vaše fotka pro klienty</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 flex flex-col items-center gap-4">
              <div className="relative group">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl group-hover:opacity-80 transition-opacity"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-slate-100 flex items-center justify-center border-4 border-white shadow-inner">
                    <User className="h-16 w-16 text-slate-300" />
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>

              <div className="w-full">
                <Label htmlFor="avatar-upload" className="cursor-pointer flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-muted border border-border hover:bg-muted/80 transition-colors font-semibold text-sm">
                  <Upload className="h-4 w-4" />
                  {uploading ? "Nahrávání..." : "Nahrát novou fotku"}
                </Label>
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Bio Card */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-violet-500/10 to-transparent pb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-violet-500 shadow-lg shadow-violet-500/20">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Krátké Bio *</CardTitle>
                  <CardDescription>Pár slov o vás</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <Textarea
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                placeholder="Např.: Mám 5 let zkušeností s úklidem domů a bytů. Zakládám si na preciznosti a dochvilnosti..."
                rows={4}
                required
                className="bg-muted/30 border-muted-foreground/20 focus:border-violet-500/50 resize-none min-h-[120px]"
              />
              <p className="mt-2 text-[11px] text-muted-foreground italic">Bio je viditelné pro klienty na jejich dashboardu.</p>

              <Button
                onClick={async () => {
                  if (!profileData.bio) {
                    toast({ variant: 'destructive', title: 'Chybí bio', description: 'Prosím vyplňte své bio.' });
                    return;
                  }
                  setLoading(true);
                  try {
                    const { error } = await supabase
                      .from('team_members')
                      .update({ bio: profileData.bio })
                      .eq('user_id', user?.id);
                    if (error) throw error;
                    toast({ title: 'Bio uloženo', description: 'Vaše bio bylo úspěšně aktualizováno.' });
                  } catch (e: any) {
                    toast({ variant: 'destructive', title: 'Chyba', description: e.message });
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                variant="outline"
                className="w-full border-violet-200 hover:bg-violet-50 hover:text-violet-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Uložit Bio
              </Button>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-500/10 to-transparent pb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-800 shadow-lg shadow-slate-800/20">
                  <Lock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Zabezpečení</CardTitle>
                  <CardDescription>Změna hesla</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Nové heslo (min. 6 znaků)"
                  className="bg-muted/30"
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Potvrdit nové heslo"
                  className="bg-muted/30"
                />
              </div>
              <Button
                className="w-full font-bold"
                variant="secondary"
                onClick={handlePasswordChange}
                disabled={loading}
              >
                Změnit Heslo
              </Button>
            </CardContent>
          </Card>

          <Button
            variant="outline"
            className="w-full py-4 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 font-bold"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Odhlásit se
          </Button>
        </div>
      </div>
    </div>
  );
}
