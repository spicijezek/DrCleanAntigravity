import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Search, Star, Gift, CheckCircle2, XCircle, Clock, TrendingUp, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { LoadingOverlay } from '@/components/LoadingOverlay';

interface ClientLoyaltyInfo {
    id: string;
    name: string;
    email: string;
    current_credits: number;
}

interface RedemptionRequest {
    id: string;
    client_id: string;
    client_name: string;
    prize_name: string;
    points_cost: number;
    status: 'pending' | 'fulfilled' | 'cancelled';
    created_at: string;
}

export default function AdminLoyalty() {
    const [clients, setClients] = useState<ClientLoyaltyInfo[]>([]);
    const [redemptions, setRedemptions] = useState<RedemptionRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch clients and their loyalty credits - only for self-registered App clients
            const { data: clientsData } = await supabase
                .from('clients')
                .select(`
          id,
          name,
          email,
          loyalty_credits (
            current_credits
          )
        `)
                .eq('client_source', 'App');

            if (clientsData) {
                setClients(clientsData.map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    email: c.email,
                    current_credits: c.loyalty_credits?.[0]?.current_credits || 0
                })));
            }

            // Fetch redemptions
            const { data: redemptionsData } = await supabase
                .from('loyalty_redemptions')
                .select(`
          id,
          client_id,
          prize_name,
          points_cost,
          status,
          created_at,
          clients (
            name
          )
        `)
                .order('created_at', { ascending: false });

            if (redemptionsData) {
                setRedemptions(redemptionsData.map((r: any) => ({
                    id: r.id,
                    client_id: r.client_id,
                    client_name: r.clients?.name || 'Neznámý',
                    prize_name: r.prize_name,
                    points_cost: r.points_cost,
                    status: r.status,
                    created_at: r.created_at
                })));
            }
        } catch (error) {
            console.error('Error fetching loyalty data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: 'fulfilled' | 'cancelled') => {
        try {
            const { error } = await supabase
                .from('loyalty_redemptions')
                .update({
                    status: newStatus,
                    fulfilled_at: newStatus === 'fulfilled' ? new Date().toISOString() : null
                })
                .eq('id', id);

            if (error) throw error;

            toast({
                title: 'Status aktualizován',
                description: `Odměna byla označena jako ${newStatus === 'fulfilled' ? 'vyřízená' : 'zrušená'}.`,
            });

            fetchData();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Chyba',
                description: error.message,
            });
        }
    };

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <LoadingOverlay message="Načítám věrnostní systém..." />;

    const pendingRedemptions = redemptions.filter(r => r.status === 'pending');

    return (
        <Layout>
            <div className="container mx-auto p-4 sm:p-6 space-y-6 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                <AdminPageHeader
                    title="Loyalty & Odměny"
                    description="Správa věrnostních bodů a čerpání odměn"
                />

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border border-border shadow-soft">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">
                                <Gift className="h-4 w-4 text-primary" />
                                Čekající odměny
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-primary">{pendingRedemptions.length}</div>
                            <p className="text-xs text-muted-foreground mt-1">Požadavky k vyřízení</p>
                        </CardContent>
                    </Card>

                    <Card className="border border-border shadow-soft">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">
                                <Star className="h-4 w-4 text-amber-500" />
                                Rozdané body
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-foreground">
                                {clients.reduce((sum, c) => sum + c.current_credits, 0).toLocaleString('cs-CZ')} b.
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Celková bilance všech klientů</p>
                        </CardContent>
                    </Card>

                    <Card className="border border-border shadow-soft">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                                Aktivní klienti
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-foreground">
                                {clients.filter(c => c.current_credits > 0).length}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Klienti s body</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Redemptions List */}
                    <Card className="lg:col-span-8 border border-border shadow-soft overflow-hidden">
                        <CardHeader className="bg-muted/30 border-b border-border">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-primary" />
                                    Požadavky na čerpání
                                </CardTitle>
                                <Badge variant="outline" className="bg-primary/5 text-primary font-bold">
                                    {pendingRedemptions.length} Čeká
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-border">
                                {redemptions.length === 0 ? (
                                    <div className="py-20 text-center space-y-3">
                                        <Gift className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                                        <p className="text-sm text-muted-foreground font-medium">Zatím žádné požadavky na odměny.</p>
                                    </div>
                                ) : (
                                    redemptions.map(r => (
                                        <div key={r.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:bg-muted/20 transition-colors">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-sm">{r.client_name}</span>
                                                    <span className="text-muted-foreground text-xs">•</span>
                                                    <span className="text-xs text-muted-foreground">{format(new Date(r.created_at), 'Pp', { locale: cs })}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                        <Gift className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-foreground">{r.prize_name}</p>
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{r.points_cost} b.</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 w-full sm:w-auto self-end sm:self-center">
                                                {r.status === 'pending' ? (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="flex-1 sm:flex-none border-emerald-500/50 text-emerald-600 hover:bg-emerald-50 gap-1"
                                                            onClick={() => handleStatusUpdate(r.id, 'fulfilled')}
                                                        >
                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                            Vyřídit
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="flex-1 sm:flex-none text-destructive hover:bg-destructive/10 gap-1"
                                                            onClick={() => handleStatusUpdate(r.id, 'cancelled')}
                                                        >
                                                            <XCircle className="h-3.5 w-3.5" />
                                                            Zrušit
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Badge className={r.status === 'fulfilled' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-destructive/10 text-destructive border-destructive/20'}>
                                                        {r.status === 'fulfilled' ? 'Vyřízeno' : 'Zrušeno'}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Client Balances Sidebar */}
                    <Card className="lg:col-span-4 border border-border shadow-soft h-fit">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                Stavy bodů klientů
                            </CardTitle>
                            <div className="relative mt-2">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    placeholder="Hledat klienta..."
                                    className="pl-9 h-9 text-xs rounded-lg"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="max-h-[500px] overflow-y-auto divide-y divide-border">
                                {filteredClients.map(c => (
                                    <div key={c.id} className="p-4 flex items-center justify-between group">
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-foreground truncate">{c.name}</p>
                                            <p className="text-[10px] text-muted-foreground truncate">{c.email}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0 ml-3">
                                            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                            <span className="text-sm font-black">{c.current_credits.toLocaleString('cs-CZ')}</span>
                                        </div>
                                    </div>
                                ))}
                                {filteredClients.length === 0 && (
                                    <div className="p-8 text-center text-xs text-muted-foreground">
                                        Žádní klienti nenalezeni.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </Layout>
    );
}
