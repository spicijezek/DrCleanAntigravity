import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Eye, Mail, Phone, Users, Search, TrendingUp, Filter, LayoutGrid, User, UserCheck } from 'lucide-react';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
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
  // Cleaner-specific fields
  position?: string | null;
  bio?: string | null;
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
      // Fetch client registrations from App
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('client_source', 'App')
        .order('created_at', { ascending: false });

      if (clientsError) throw clientsError;

      // Fetch cleaner registrations (team members with cleaner role)
      const { data: cleanersData, error: cleanersError } = await supabase
        .from('team_members')
        .select('*')
        .order('created_at', { ascending: false });

      if (cleanersError) throw cleanersError;

      // Combine and format data
      const formattedClients: Registration[] = (clientsData || []).map(client => ({
        ...client,
        type: 'client' as const,
      }));

      const formattedCleaners: Registration[] = (cleanersData || []).map(cleaner => ({
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

  const viewDetails = (registration: Registration) => {
    setSelectedRegistration(registration);
    setDetailsOpen(true);
  };

  const filteredRegistrations = registrations
    .filter(reg => {
      // 1. Type Filter
      if (filterType !== 'all' && reg.type !== filterType) return false;

      // 2. Search Filter
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
      // 3. Sorting
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'alphabetical') return a.name.localeCompare(b.name);
      return 0;
    });

  if (loading) {
    return <LoadingOverlay message="Načítám registrace..." />;
  }

  return (
    <Layout>
      <div className="container mx-auto p-4 sm:p-6 pb-24 space-y-6 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        <AdminPageHeader
          title="Registrace v aplikaci"
          description="Správa klientů a úklidových pracovníků registrovaných přes aplikaci"
        />

        {/* Glassmorphic Filter Bar */}
        <div className="flex flex-col xl:flex-row gap-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-3 sm:p-4 rounded-[2.5rem] border border-white/20 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-700">

          {/* Top Row: Search & Sort (Left) */}
          <div className="flex flex-col sm:flex-row gap-3 xl:w-auto w-full">
            <div className="relative group flex-1 sm:w-80">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 transition-colors group-focus-within:text-blue-500" />
              <Input
                placeholder="Hledat uživatele..."
                className="pl-12 h-12 bg-white/50 dark:bg-slate-800/50 border-0 shadow-sm rounded-full focus-visible:ring-2 focus-visible:ring-blue-500/20 transition-all w-full text-base"
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

          {/* Bottom Row: Type Pills (Right) */}
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
                  <TableHead className="text-right">Akce</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      Žádné registrace k zobrazení
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRegistrations.map((registration) => (
                    <TableRow key={registration.id} className="hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0">
                      <TableCell>
                        <Badge variant={registration.type === 'client' ? 'default' : 'secondary'} className={cn(
                          "bg-opacity-90 hover:bg-opacity-100 transition-colors cursor-default",
                          registration.type === 'client' ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700"
                        )}>
                          {registration.type === 'client' ? 'Klient' : 'Tým'}
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Detail registrace {selectedRegistration?.type === 'client' ? 'klienta' : 'úklidového pracovníka'}
              </DialogTitle>
              <DialogDescription>Kompletní informace o registraci</DialogDescription>
            </DialogHeader>
            {selectedRegistration && (
              <div className="space-y-4">
                <div>
                  <Badge variant={selectedRegistration.type === 'client' ? 'default' : 'secondary'}>
                    {selectedRegistration.type === 'client' ? 'Klient' : 'Úklidový pracovník'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">Jméno</h4>
                    <p>{selectedRegistration.name}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">Email</h4>
                    <p>{selectedRegistration.email || 'Neuvedeno'}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">Telefon</h4>
                    <p>{selectedRegistration.phone || 'Neuvedeno'}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-1">Datum registrace</h4>
                    <p>
                      {format(new Date(selectedRegistration.created_at), 'dd. MMMM yyyy, HH:mm', {
                        locale: cs,
                      })}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">Adresa</h4>
                  <p>
                    {selectedRegistration.address || 'Neuvedeno'}
                    {selectedRegistration.city && `, ${selectedRegistration.city}`}
                    {selectedRegistration.postal_code && ` ${selectedRegistration.postal_code}`}
                  </p>
                </div>

                {selectedRegistration.type === 'client' && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Dodatečné informace</h4>
                    <div className="flex gap-2">
                      {selectedRegistration.has_children && <Badge variant="secondary">Děti</Badge>}
                      {selectedRegistration.has_pets && <Badge variant="secondary">Domácí mazlíčci</Badge>}
                      {selectedRegistration.has_allergies && <Badge variant="secondary">Alergie</Badge>}
                      {!selectedRegistration.has_children &&
                        !selectedRegistration.has_pets &&
                        !selectedRegistration.has_allergies && (
                          <span className="text-sm text-muted-foreground">Žádné</span>
                        )}
                    </div>
                  </div>
                )}

                {selectedRegistration.type === 'cleaner' && (
                  <>
                    {selectedRegistration.position && (
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-1">Pozice</h4>
                        <p>{selectedRegistration.position}</p>
                      </div>
                    )}
                    {selectedRegistration.bio && (
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-1">Bio</h4>
                        <p>{selectedRegistration.bio}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
