import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Eye, Mail, Phone, Users, Search, TrendingUp, Filter, LayoutGrid, User, UserCheck, MapPin, Building2, PawPrint, Sparkles, ShieldCheck } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Layout } from '@/components/layout/Layout';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format, isValid } from 'date-fns';
import { cs } from 'date-fns/locale';

interface Registration {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  type: 'client' | 'cleaner';
  // Client-specific fields
  client_source?: string | null;
  has_children?: boolean | null;
  has_pets?: boolean | null;
  has_allergies?: boolean | null;
  allergies_notes?: string | null;
  special_instructions?: string | null;
  company_id?: string | null;
  dic?: string | null;
  reliable_person?: string | null;
  client_type?: string | null;
  // Cleaner-specific fields
  position?: string | null;
  bio?: string | null;
  referral_code?: string | null;
  referred_by_id?: string | null;
  referrer?: { name: string } | null;
}

export default function AppRegisters() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const { toast } = useToast();

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      // 1. Fetch client registrations
      const { data: clientsData, error: clientsError } = await (supabase as any)
        .from('clients')
        .select('*')
        .in('client_source', ['App', 'Web'])
        .order('created_at', { ascending: false });

      if (clientsError) throw clientsError;

      // 2. Fetch cleaner registrations
      const { data: cleanersData, error: cleanersError } = await (supabase as any)
        .from('team_members')
        .select('*')
        .order('created_at', { ascending: false });

      if (cleanersError) throw cleanersError;

      // 3. Handle Referrers manually
      const referrerIds = Array.from(new Set(((clientsData as any[]) || [])
        .map(c => c.referred_by_id)
        .filter(Boolean)));

      let referrersMap: Record<string, string> = {};

      if (referrerIds.length > 0) {
        const { data: referrersData } = await (supabase as any)
          .from('clients')
          .select('id, name')
          .in('id', referrerIds);

        if (referrersData) {
          referrersMap = (referrersData as any[]).reduce((acc: Record<string, string>, curr: any) => ({
            ...acc,
            [curr.id]: curr.name
          }), {} as Record<string, string>);
        }
      }

      // 4. Combine and format
      const formattedClients: Registration[] = ((clientsData as any[]) || []).map(client => {
        let referrerObj = null;
        if (client.referred_by_id) {
          const referrerName = referrersMap[client.referred_by_id];
          referrerObj = {
            name: referrerName || 'Neznámý'
          };
        }

        return {
          ...client,
          type: 'client' as const,
          referrer: referrerObj
        };
      });

      const formattedCleaners: Registration[] = ((cleanersData as any[]) || []).map(cleaner => ({
        ...cleaner,
        type: 'cleaner' as const,
        city: null,
        postal_code: null,
      }));

      setRegistrations([...formattedClients, ...formattedCleaners]);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Chyba načítání',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const viewDetails = async (registration: Registration) => {
    setDetailsOpen(true);
    setSelectedRegistration(registration);

    if (registration.type === 'client') {
      try {
        const { data, error } = await (supabase as any)
          .from('clients')
          .select('*')
          .eq('id', registration.id)
          .single();

        if (error) throw error;

        if (data) {
          setSelectedRegistration({
            ...registration,
            ...(data as any),
            referrer: registration.referrer
          });
        }
      } catch (err) {
        console.error('Error fetching fresh client details:', err);
      }
    }
  };

  const filteredRegistrations = registrations
    .filter(reg => {
      if (filterType !== 'all' && reg.type !== filterType) return false;
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          reg.name.toLowerCase().includes(searchLower) ||
          (reg.email && reg.email.toLowerCase().includes(searchLower)) ||
          (reg.city && reg.city.toLowerCase().includes(searchLower))
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'alphabetical') return a.name.localeCompare(b.name);
      return 0;
    });

  const runMigration = async () => {
    try {
      setLoading(true);
      const { data: clients, error: fetchError } = await (supabase as any)
        .from('clients')
        .select('id, notes, has_children, has_pets')
        .not('notes', 'is', null);

      if (fetchError) throw fetchError;

      let migratedCount = 0;
      for (const client of (clients as any[])) {
        // Only migrate if boolean fields are null (not yet set)
        if (client.has_children === null || client.has_pets === null) {
          const notes = client.notes || '';
          const updates: any = {};

          if (notes.includes('Children: Yes')) updates.has_children = true;
          if (notes.includes('Children: No')) updates.has_children = false;
          if (notes.includes('Pets: Yes')) updates.has_pets = true;
          if (notes.includes('Pets: No')) updates.has_pets = false;

          // Parse allergies and instructions if present
          if (notes.includes('Allergies:')) {
            const allergiesPart = notes.split('Allergies:')[1]?.split('\n')[0]?.trim();
            if (allergiesPart) {
              updates.has_allergies = true;
              updates.allergies_notes = allergiesPart;
            }
          }

          if (notes.includes('Instructions:')) {
            const instrPart = notes.split('Instructions:')[1]?.split('\n')[0]?.trim();
            if (instrPart) updates.special_instructions = instrPart;
          }

          if (Object.keys(updates).length > 0) {
            const { error: updateError } = await (supabase as any)
              .from('clients')
              .update(updates)
              .eq('id', client.id);

            if (!updateError) migratedCount++;
          }
        }
      }

      toast({
        title: 'Migrace hotova',
        description: `Úspěšně migrováno ${migratedCount} profilů.`,
      });
      fetchRegistrations();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Chyba migrace',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingOverlay message="Načítám registrace..." />;
  }

  return (
    <Layout>
      <div className="container mx-auto p-4 sm:p-6 pb-24 space-y-6 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex justify-between items-start">
          <AdminPageHeader
            title="Registrace v aplikaci"
            description="Správa klientů a úklidových pracovníků registrovaných přes aplikaci"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={runMigration}
            className="mt-2 rounded-full border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all font-bold gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Migrovat stará data
          </Button>
        </div>

        <div className="flex flex-col xl:flex-row gap-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-3 sm:p-4 rounded-[2.5rem] border border-white/20 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex flex-col sm:flex-row gap-3 xl:w-auto w-full">
            <div className="relative group flex-1 sm:w-80">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 transition-colors group-focus-within:text-blue-500" />
              <input
                type="text"
                placeholder="Hledat uživatele..."
                className="pl-12 pr-4 h-12 bg-white/50 dark:bg-slate-800/50 border-0 shadow-sm rounded-full focus:ring-2 focus:ring-blue-500/20 transition-all w-full text-base outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 p-1.5 rounded-full border border-white/10 shadow-sm sm:w-auto w-full">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400">
                <TrendingUp className="h-4 w-4" />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 p-2 h-auto text-sm font-medium min-w-[140px]">
                  <SelectValue placeholder="Seřadit dle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Nejnovější</SelectItem>
                  <SelectItem value="oldest">Nejstarší</SelectItem>
                  <SelectItem value="alphabetical">Abecedně</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            <ToggleGroup type="single" value={filterType} onValueChange={(val) => val && setFilterType(val)} className="justify-start xl:justify-end w-full gap-2">
              <ToggleGroupItem value="all" className="rounded-full px-4 h-11 data-[state=on]:bg-blue-600 data-[state=on]:text-white data-[state=on]:shadow-lg shadow-sm border border-slate-200 bg-white/50 hover:bg-white/80 transition-all gap-2 min-w-fit">
                <LayoutGrid className="h-4 w-4" /> Všechny
              </ToggleGroupItem>
              <ToggleGroupItem value="client" className="rounded-full px-4 h-11 data-[state=on]:bg-blue-500 data-[state=on]:text-white data-[state=on]:shadow-lg shadow-sm border border-slate-200 bg-white/50 hover:bg-white/80 transition-all gap-2 min-w-fit">
                <User className="h-4 w-4" /> Klienti
              </ToggleGroupItem>
              <ToggleGroupItem value="cleaner" className="rounded-full px-4 h-11 data-[state=on]:bg-emerald-600 data-[state=on]:text-white data-[state=on]:shadow-lg shadow-sm border border-slate-200 bg-white/50 hover:bg-white/80 transition-all gap-2 min-w-fit">
                <UserCheck className="h-4 w-4" /> Tým
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        <Card className="rounded-3xl shadow-lg border-0 bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-muted/20 border-b border-border/50">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Seznam uživatelů
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/10 hover:bg-muted/10 border-b border-border/50">
                  <TableHead className="w-[100px]">Typ</TableHead>
                  <TableHead>Jméno</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Datum registrace</TableHead>
                  <TableHead>Město</TableHead>
                  <TableHead>Referral Kód</TableHead>
                  <TableHead>Doporučil/a</TableHead>
                  <TableHead className="text-right">Akce</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      Žádné registrace k zobrazení
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRegistrations.map((registration) => (
                    <TableRow key={registration.id} className="hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0">
                      <TableCell>
                        <Badge variant={registration.type === 'client' ? 'default' : 'secondary'} className={cn(
                          "bg-opacity-90 hover:bg-opacity-100 transition-colors cursor-default",
                          registration.type === 'client'
                            ? (registration.client_source === 'Web' ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-600 hover:bg-blue-700")
                            : "bg-emerald-600 hover:bg-emerald-700"
                        )}>
                          {registration.type === 'client'
                            ? (registration.client_source === 'Web' ? 'Non-register' : 'Klient')
                            : 'Tým'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-foreground/90">{registration.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4 shrink-0" />
                          <span className="truncate max-w-[150px]">{registration.email || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4 shrink-0" />
                          {registration.phone || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(registration.created_at), 'dd. MM. yyyy', { locale: cs })}
                      </TableCell>
                      <TableCell>{registration.city || 'N/A'}</TableCell>
                      <TableCell>
                        {registration.type === 'client' && registration.referral_code ? (
                          <Badge variant="outline" className="font-mono text-xs border-amber-200 text-amber-700 bg-amber-50">
                            {registration.referral_code}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground/40">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {registration.type === 'client' && registration.referrer ? (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-400" />
                            <span className="font-medium text-amber-700 dark:text-amber-400">{registration.referrer.name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/40">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewDetails(registration)}
                          className="hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-3xl p-0 overflow-hidden border-0 bg-white dark:bg-slate-950 rounded-[2rem] shadow-2xl">
            {selectedRegistration && (
              <div className="flex flex-col h-full max-h-[90vh]">
                <div className="relative p-6 sm:p-8 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={selectedRegistration.type === 'client' ? 'default' : 'secondary'} className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          selectedRegistration.type === 'client'
                            ? (selectedRegistration.client_source === 'Web' ? "bg-amber-600" : "bg-blue-600")
                            : "bg-emerald-600"
                        )}>
                          {selectedRegistration.type === 'client'
                            ? (selectedRegistration.client_source === 'Web' ? 'Non-register' : 'Klient')
                            : 'Úklidový pracovník'}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-1">
                          <LayoutGrid className="w-3 h-3" />
                          Registrovaný uživatel
                        </span>
                      </div>
                      <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                        {selectedRegistration.name}
                      </h2>
                      <p className="text-muted-foreground mt-1 font-medium flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {selectedRegistration.email || 'Neuvedeno'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 flex items-center gap-2">
                          <Phone className="w-3 h-3" /> Kontakt a Adresa
                        </h4>
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 space-y-4 border border-slate-100 dark:border-slate-800">
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Telefon</p>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{selectedRegistration.phone || 'Neuvedeno'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Adresa</p>
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-blue-500 mt-1 shrink-0" />
                              <p className="font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                                {selectedRegistration.address || 'Neuvedeno'}
                                {selectedRegistration.city && <><br />{selectedRegistration.city}, {selectedRegistration.postal_code}</>}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Datum registrace</p>
                            <p className="font-medium text-slate-600 dark:text-slate-400">
                              {format(new Date(selectedRegistration.created_at), 'dd. MMMM yyyy, HH:mm', { locale: cs })}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-slate-200 dark:border-slate-800/50">
                            <div className="p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 flex items-center gap-3">
                              <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              <div>
                                <p className="text-[10px] font-bold text-blue-600/70 dark:text-blue-400/70 uppercase">GDPR & VOP SOUHLAS</p>
                                <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                                  {selectedRegistration.created_at && isValid(new Date(selectedRegistration.created_at))
                                    ? format(new Date(selectedRegistration.created_at), 'd. M. yyyy, HH:mm', { locale: cs })
                                    : 'Neznámé datum'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {selectedRegistration.client_type === 'company' && (
                        <div className="space-y-4">
                          <h4 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                            <Building2 className="w-3 h-3" /> Firemní Údaje
                          </h4>
                          <div className="bg-indigo-50/50 dark:bg-indigo-900/20 rounded-2xl p-4 space-y-3 border border-indigo-100 dark:border-indigo-900/50">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-[10px] font-bold text-indigo-700/60 dark:text-indigo-400/60 uppercase mb-1">IČO</p>
                                <p className="font-bold font-mono">{selectedRegistration.company_id || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-indigo-700/60 dark:text-indigo-400/60 uppercase mb-1">DIČ</p>
                                <p className="font-bold font-mono">{selectedRegistration.dic || 'N/A'}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-indigo-700/60 dark:text-indigo-400/60 uppercase mb-1">Kontaktní osoba</p>
                              <p className="font-bold text-indigo-900 dark:text-indigo-300">{selectedRegistration.reliable_person || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-6">
                      {selectedRegistration.type === 'client' && (
                        <div className="space-y-4">
                          <h4 className="text-xs font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 flex items-center gap-2">
                            <Users className="w-3 h-3" /> Referral & Kódy
                          </h4>
                          <div className="grid grid-cols-1 gap-3">
                            <div className="bg-blue-50/80 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-100 dark:border-blue-900/50">
                              <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-1">Jeho unikátní kód</p>
                              <p className="font-black text-2xl text-blue-900 dark:text-blue-100 tracking-tighter">{selectedRegistration.referral_code || 'N/A'}</p>
                            </div>

                            {selectedRegistration.referrer && (
                              <div className="bg-amber-50/80 dark:bg-amber-900/20 rounded-2xl p-4 border border-amber-100 dark:border-amber-900/50 flex items-center justify-between">
                                <div>
                                  <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-0.5">Doporučil/a (Referral)</p>
                                  <p className="font-bold text-slate-900 dark:text-slate-100">{selectedRegistration.referrer.name}</p>
                                </div>
                                <div className="p-2 bg-amber-400 rounded-full">
                                  <UserCheck className="w-5 h-5 text-white" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {selectedRegistration.type === 'client' && selectedRegistration.client_type !== 'company' && (
                        <div className="space-y-4">
                          <h4 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                            <Eye className="w-3 h-3" /> Preference Domácnosti
                          </h4>
                          <div className="bg-emerald-50/50 dark:bg-emerald-900/20 rounded-2xl p-5 space-y-5 border border-emerald-100 dark:border-emerald-900/50">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-all",
                                  selectedRegistration.has_children ? "bg-emerald-500 text-white" : "bg-white dark:bg-slate-800 text-slate-300 border border-slate-100 dark:border-slate-700"
                                )}>
                                  <Users className="w-5 h-5" />
                                </div>
                                <div>
                                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 block">Děti</span>
                                  {selectedRegistration.has_children && (
                                    <span className="text-[10px] text-emerald-600 font-medium tracking-tight">V domácnosti</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-all",
                                  selectedRegistration.has_pets ? "bg-emerald-500 text-white" : "bg-white dark:bg-slate-800 text-slate-300 border border-slate-100 dark:border-slate-700"
                                )}>
                                  <PawPrint className="w-5 h-5" />
                                </div>
                                <div>
                                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 block">Zvířata</span>
                                  {selectedRegistration.has_pets && (
                                    <span className="text-[10px] text-emerald-600 font-medium tracking-tight">V domácnosti</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {(selectedRegistration.allergies_notes || selectedRegistration.special_instructions) && (
                              <div className="space-y-4 pt-2 border-t border-emerald-100 dark:border-emerald-900/30">
                                {selectedRegistration.allergies_notes && (
                                  <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Alergie / Poznámky</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic">"{selectedRegistration.allergies_notes}"</p>
                                  </div>
                                )}
                                {selectedRegistration.special_instructions && (
                                  <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Speciální Instrukce</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic">"{selectedRegistration.special_instructions}"</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedRegistration.type === 'cleaner' && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                        <UserCheck className="w-3 h-3" /> Profesní Údaje
                      </h4>
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 space-y-4 border border-slate-100 dark:border-slate-800">
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Pozice</p>
                          <p className="font-bold text-slate-900 dark:text-slate-100">{selectedRegistration.position || 'Nezadáno'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Bio</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-white/50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                            {selectedRegistration.bio || 'Bez popisu'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <Button
                    className="rounded-full px-8 h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-xl hover:scale-105 transition-all"
                    onClick={() => setDetailsOpen(false)}
                  >
                    Zavřít
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout >
  );
}
