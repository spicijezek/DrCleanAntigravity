import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Eye, Mail, Phone, Users } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Layout } from '@/components/layout/Layout';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { cn } from '@/lib/utils';
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
  const [filterType, setFilterType] = useState<'all' | 'client' | 'cleaner'>('all');
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

  const filteredRegistrations = registrations.filter(reg => {
    if (filterType === 'all') return true;
    return reg.type === filterType;
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
          action={
            <div className="flex gap-2 bg-muted/50 p-1 rounded-lg">
              <Button
                variant={filterType === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilterType('all')}
                className="rounded-md transition-all"
              >
                Všechny ({registrations.length})
              </Button>
              <Button
                variant={filterType === 'client' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilterType('client')}
                className="rounded-md transition-all"
              >
                Klienti ({registrations.filter(r => r.type === 'client').length})
              </Button>
              <Button
                variant={filterType === 'cleaner' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilterType('cleaner')}
                className="rounded-md transition-all"
              >
                Tým ({registrations.filter(r => r.type === 'cleaner').length})
              </Button>
            </div>
          }
        />

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
