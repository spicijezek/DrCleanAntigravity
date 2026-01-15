import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sparkles, Plus, Edit, Trash, Info, Banknote } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ExtraService {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  is_active: boolean;
  created_at: string;
}

export default function ManageExtraServices() {
  const { user, profile } = useAuth();
  const [services, setServices] = useState<ExtraService[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    is_active: true
  });

  if (!user || !profile?.is_admin) {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const { data } = await supabase
        .from('extra_services')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        setServices(data as ExtraService[]);
      }
    } catch (error) {
      console.error('Error loading services:', error);
      toast({
        title: 'Chyba',
        description: 'Nepodařilo se načíst služby',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const serviceData = {
        name: formData.name,
        description: formData.description || null,
        price: formData.price ? parseFloat(formData.price) : null,
        is_active: formData.is_active
      };

      if (editingId) {
        const { error } = await supabase
          .from('extra_services')
          .update(serviceData)
          .eq('id', editingId);

        if (error) throw error;

        toast({
          title: 'Úspěch',
          description: 'Služba byla aktualizována'
        });
      } else {
        const { error } = await supabase
          .from('extra_services')
          .insert([serviceData]);

        if (error) throw error;

        toast({
          title: 'Úspěch',
          description: 'Služba byla vytvořena'
        });
      }

      resetForm();
      loadServices();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving service:', error);
      toast({
        title: 'Chyba',
        description: 'Nepodařilo se uložit službu',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (service: ExtraService) => {
    setEditingId(service.id);
    setFormData({
      name: service.name,
      description: service.description || '',
      price: service.price?.toString() || '',
      is_active: service.is_active
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Opravdu chcete smazat tuto službu?')) return;

    try {
      const { error } = await supabase
        .from('extra_services')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Úspěch',
        description: 'Služba byla smazána'
      });

      loadServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        title: 'Chyba',
        description: 'Nepodařilo se smazat službu',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      is_active: true
    });
    setEditingId(null);
  };

  if (loading) {
    return <LoadingOverlay message="Načítám extra služby..." />;
  }

  return (
    <Layout>
      <div className="container mx-auto p-4 sm:p-6 pb-24 space-y-6 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        <AdminPageHeader
          title="Extra Služby"
          description="Spravujte doplňkové a rozšiřující služby pro své klienty"
          action={
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="h-11 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all rounded-xl gap-2"
            >
              <Plus className="h-4 w-4" />
              Přidat Službu
            </Button>
          }
        />

        <div className="grid gap-6">
          {services.length === 0 ? (
            <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden p-12">
              <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="bg-primary/5 p-4 rounded-full">
                  <Sparkles className="h-12 w-12 text-primary opacity-20" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold">Zatím žádné služby</h3>
                  <p className="text-muted-foreground">Vytvořte první doplňkovou službu, kterou si klienti budou moci přiobjednat.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <Card key={service.id} className="bg-card/50 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="bg-primary/10 p-2.5 rounded-2xl">
                        <Sparkles className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(service)}
                          className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(service.id)}
                          className="h-8 w-8 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors text-muted-foreground"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="pt-3 space-y-1.5">
                      <CardTitle className="text-lg font-bold line-clamp-1">{service.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={cn(
                          "border-0 text-[10px] uppercase font-bold tracking-wider px-2.5",
                          service.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                        )}>
                          {service.is_active ? 'Aktivní' : 'Neaktivní'}
                        </Badge>
                        {service.price && (
                          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-500 font-bold text-sm">
                            <Banknote className="h-3.5 w-3.5" />
                            {service.price.toLocaleString('cs-CZ')} Kč
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {service.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3 italic">
                        "{service.description}"
                      </p>
                    )}
                    <div className="mt-4 pt-3 border-t border-primary/5">
                      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                        Vytvořeno: {new Date(service.created_at).toLocaleDateString('cs-CZ')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogContent className="bg-card/95 backdrop-blur-xl border-white/10 shadow-2xl rounded-[2rem] max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {editingId ? 'Upravit Službu' : 'Přidat Novou Službu'}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Vyplňte informace o doplňkové službě
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-bold ml-1">Název Služby *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Např. Čištění trouby..."
                  className="h-11 bg-background/50 border-0 shadow-sm rounded-xl focus:ring-2 ring-primary/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-bold ml-1">Popis</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailnější popis toho, co služba obnáší..."
                  className="bg-background/50 border-0 shadow-inner rounded-2xl min-h-[100px] focus-visible:ring-primary/20"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm font-bold ml-1">Cena (Kč)</Label>
                <div className="relative">
                  <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/50" />
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    className="h-11 pl-10 bg-background/50 border-0 shadow-sm rounded-xl focus:ring-2 ring-primary/20"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-primary/5 rounded-2xl border border-primary/10 transition-all hover:bg-primary/10">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                  className="data-[state=checked]:bg-emerald-500"
                />
                <div className="space-y-0.5">
                  <Label htmlFor="is_active" className="text-sm font-bold cursor-pointer">Aktivní Služba</Label>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Tato služba bude viditelná v poptávkovém formuláři</p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1 h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-lg border-0 transition-all">
                  {editingId ? 'Aktualizovat Službu' : 'Vytvořit Službu'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1 h-12 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Zrušit
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
