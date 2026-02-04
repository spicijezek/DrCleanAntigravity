import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, Building2, Mail, Phone, MapPin, Calendar, FileText, Download, Eye, FileText as InvoiceIcon, X, Globe, UserCheck, StickyNote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InvoicePreview } from '@/components/invoices/InvoicePreview';
import { cn } from '@/lib/utils';

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  client_type: string;
  company_id?: string;
  dic?: string;
  company_legal_name?: string;
  reliable_person?: string;
  notes?: string;
  date_added?: string;
  client_source?: string;
}

interface ClientDetailsPopupProps {
  client: Client;
  isOpen: boolean;
  onClose: () => void;
  onClientUpdated: (updatedClient: Client) => void;
}

export function ClientDetailsPopup({ client, isOpen, onClose, onClientUpdated }: ClientDetailsPopupProps) {
  const [formData, setFormData] = useState<Client>(client);
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [previewInvoice, setPreviewInvoice] = useState<any>(null);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchClientInvoices();
      fetchCompanyInfo();
    }
  }, [isOpen, client.id]);

  const fetchCompanyInfo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("company_info")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) setCompanyInfo(data);
  };

  const fetchClientInvoices = async () => {
    const { data: byId } = await supabase
      .from("invoices")
      .select("*")
      .eq("client_id", client.id)
      .order("date_created", { ascending: false });

    if (byId && byId.length > 0) {
      setInvoices(byId);
      return;
    }

    const { data: byName } = await supabase
      .from("invoices")
      .select("*")
      .is("client_id", null)
      .eq("client_name", client.name)
      .order("date_created", { ascending: false });

    setInvoices(byName || []);
  };

  const previewInvoiceDetails = async (invoice: any) => {
    const { data: items } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", invoice.id)
      .order("sort_order");

    setInvoiceItems(items || []);
    setPreviewInvoice(invoice);
  };

  const downloadInvoice = async (invoice: any) => {
    if (!invoice.pdf_path) return;

    try {
      let downloadUrl = "";

      if (invoice.pdf_path.startsWith('http')) {
        downloadUrl = invoice.pdf_path;
        if (downloadUrl.includes('cloudinary.com')) {
          downloadUrl = downloadUrl.replace('/upload/', '/upload/fl_attachment/');
        }
      } else {
        const { data, error } = await supabase.storage
          .from("invoices")
          .download(invoice.pdf_path);

        if (error) throw error;
        downloadUrl = URL.createObjectURL(data);
      }

      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `faktura-${invoice.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      if (!invoice.pdf_path.startsWith('http')) {
        URL.revokeObjectURL(downloadUrl);
      }
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast({ title: "Chyba", description: "Nepodařilo se stáhnout fakturu", variant: "destructive" });
    }
  };

  const handleInputChange = (field: keyof Client, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('clients')
        .update({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          postal_code: formData.postal_code,
          client_type: formData.client_type,
          company_id: formData.company_id,
          dic: formData.dic,
          company_legal_name: formData.company_legal_name,
          reliable_person: formData.reliable_person,
          notes: formData.notes,
          client_source: formData.client_source,
        })
        .eq('id', client.id);

      if (error) throw error;

      toast({
        title: 'Úspěch',
        description: 'Klient byl úspěšně aktualizován',
      });

      onClientUpdated(formData);
      onClose();
    } catch (error: any) {
      toast({
        title: 'Chyba',
        description: 'Nepodařilo se aktualizovat klienta',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-0 bg-transparent shadow-none">
        <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden bg-background/95 backdrop-blur-xl relative">
          <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-primary to-primary/60" />

          <DialogHeader className="p-8 pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-3 text-2xl font-bold tracking-tight">
                <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center">
                  {client.client_type === 'company' ? (
                    <Building2 className="h-5 w-5 text-primary" />
                  ) : (
                    <User className="h-5 w-5 text-primary" />
                  )}
                </div>
                Detail klienta
              </DialogTitle>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-muted/50 transition-colors">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>

          <CardContent className="p-8 pt-4">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <User className="h-4 w-4" /> Základní údaje
                    </h3>
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-semibold">Jméno / Název *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          required
                          className="rounded-xl border-primary/20 focus:border-primary focus:ring-primary/20 h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="client_type" className="text-sm font-semibold">Typ klienta</Label>
                        <Select
                          value={formData.client_type}
                          onValueChange={(value) => handleInputChange('client_type', value)}
                        >
                          <SelectTrigger className="rounded-xl border-primary/20 focus:ring-primary/20 h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-primary/20">
                            <SelectItem value="person">Fyzická osoba</SelectItem>
                            <SelectItem value="company">Firma</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Mail className="h-4 w-4" /> Kontaktní údaje
                    </h3>
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-2">
                          <Mail className="h-4 w-4 text-primary" /> Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email || ''}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="rounded-xl border-primary/20 focus:border-primary focus:ring-primary/20 h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-semibold flex items-center gap-2">
                          <Phone className="h-4 w-4 text-primary" /> Telefon
                        </Label>
                        <Input
                          id="phone"
                          value={formData.phone || ''}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="rounded-xl border-primary/20 focus:border-primary focus:ring-primary/20 h-11"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4" /> Adresa a fakturace
                    </h3>
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="address" className="text-sm font-semibold">Ulice a č.p.</Label>
                        <Input
                          id="address"
                          value={formData.address || ''}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          className="rounded-xl border-primary/20 focus:border-primary focus:ring-primary/20 h-11"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city" className="text-sm font-semibold">Město</Label>
                          <Input
                            id="city"
                            value={formData.city || ''}
                            onChange={(e) => handleInputChange('city', e.target.value)}
                            className="rounded-xl border-primary/20 focus:border-primary focus:ring-primary/20 h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="postal_code" className="text-sm font-semibold">PSČ</Label>
                          <Input
                            id="postal_code"
                            value={formData.postal_code || ''}
                            onChange={(e) => handleInputChange('postal_code', e.target.value)}
                            className="rounded-xl border-primary/20 focus:border-primary focus:ring-primary/20 h-11"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {formData.client_type === 'company' && (
                    <div className="space-y-4 pt-4 p-6 rounded-3xl bg-primary/5 border border-primary/10">
                      <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="company_id" className="text-sm font-semibold">IČO</Label>
                            <Input
                              id="company_id"
                              value={formData.company_id || ''}
                              onChange={(e) => handleInputChange('company_id', e.target.value)}
                              className="rounded-xl border-primary/20 focus:border-primary focus:ring-primary/20 h-11 bg-background"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="dic" className="text-sm font-semibold">DIČ</Label>
                            <Input
                              id="dic"
                              value={formData.dic || ''}
                              onChange={(e) => handleInputChange('dic', e.target.value)}
                              className="rounded-xl border-primary/20 focus:border-primary focus:ring-primary/20 h-11 bg-background"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="company_legal_name" className="text-sm font-semibold">Právní název firmy</Label>
                          <Input
                            id="company_legal_name"
                            value={formData.company_legal_name || ''}
                            onChange={(e) => handleInputChange('company_legal_name', e.target.value)}
                            className="rounded-xl border-primary/20 focus:border-primary focus:ring-primary/20 h-11 bg-background"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="reliable_person" className="text-sm font-semibold">Kontaktní osoba</Label>
                          <Input
                            id="reliable_person"
                            value={formData.reliable_person || ''}
                            onChange={(e) => handleInputChange('reliable_person', e.target.value)}
                            className="rounded-xl border-primary/20 focus:border-primary focus:ring-primary/20 h-11 bg-background"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-primary/10">
                <div className="space-y-2">
                  <Label htmlFor="client_source" className="text-sm font-semibold flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" /> Zdroj klienta
                  </Label>
                  <Select
                    value={formData.client_source || ''}
                    onValueChange={(value) => handleInputChange('client_source', value)}
                  >
                    <SelectTrigger className="rounded-xl border-primary/20 focus:border-primary focus:ring-primary/20 h-11">
                      <SelectValue placeholder="Vyberte zdroj..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Google">Google</SelectItem>
                      <SelectItem value="AI">AI</SelectItem>
                      <SelectItem value="Doporučení">Doporučení</SelectItem>
                      <SelectItem value="Sociální Sítě">Sociální Sítě</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-semibold flex items-center gap-2">
                    <StickyNote className="h-4 w-4 text-primary" /> Poznámky
                  </Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ''}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={1}
                    className="rounded-xl border-primary/20 focus:border-primary focus:ring-primary/20 min-h-[44px]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-primary/10">
                <Button type="button" variant="outline" onClick={onClose} className="rounded-xl border-primary/20 px-8">
                  Zrušit
                </Button>
                <Button type="submit" disabled={loading} className="rounded-xl bg-primary px-12 h-11 font-bold">
                  {loading ? 'Ukládám...' : 'Uložit změny'}
                </Button>
              </div>
            </form>

            {/* Invoices Section */}
            <div className="mt-12 pt-8 border-t border-primary/10">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
                  <InvoiceIcon className="h-4 w-4 text-primary" />
                </div>
                Faktury klienta ({invoices.length})
              </h3>
              {invoices.length === 0 ? (
                <div className="p-8 rounded-[2rem] border-2 border-dashed border-primary/10 text-center">
                  <p className="text-sm text-muted-foreground">Pro tohoto klienta nebyly nalezeny žádné faktury.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {invoices.map((invoice) => (
                    <Card key={invoice.id} className="border-0 bg-primary/5 hover:bg-primary/10 transition-colors rounded-3xl overflow-hidden group">
                      <CardContent className="p-4 flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold tracking-tight">{invoice.invoice_number}</p>
                            <Badge className={cn(
                              "text-[10px] uppercase font-bold rounded-lg px-2 py-0",
                              invoice.status === 'paid' ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" :
                                invoice.status === 'issued' ? "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20" :
                                  "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
                            )}>
                              {invoice.status === 'paid' ? 'Zaplaceno' : invoice.status === 'issued' ? 'Vystaveno' : invoice.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground font-medium">
                            {new Date(invoice.date_created).toLocaleDateString('cs-CZ')} • <span className="text-foreground font-bold">{new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' }).format(invoice.total)}</span>
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-9 h-9 rounded-xl bg-background shadow-sm hover:scale-110 transition-transform"
                            onClick={() => previewInvoiceDetails(invoice)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-9 h-9 rounded-xl bg-background shadow-sm hover:scale-110 transition-transform"
                            onClick={() => downloadInvoice(invoice)}
                            disabled={!invoice.pdf_path}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </DialogContent>

      {/* Invoice Preview Dialog */}
      {previewInvoice && companyInfo && (
        <Dialog open={!!previewInvoice} onOpenChange={() => setPreviewInvoice(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-0 border-0">
            <InvoicePreview
              companyInfo={companyInfo}
              invoiceNumber={previewInvoice.invoice_number}
              clientName={previewInvoice.client_name}
              clientVat={previewInvoice.client_vat}
              clientDic={previewInvoice.client_dic}
              clientAddress={previewInvoice.client_address}
              clientEmail={previewInvoice.client_email}
              clientPhone={previewInvoice.client_phone}
              dateCreated={previewInvoice.date_created}
              performanceDates={previewInvoice.date_performance ? [{ id: '1', startDate: previewInvoice.date_performance }] : []}
              dateDue={previewInvoice.date_due}
              variableSymbol={previewInvoice.variable_symbol}
              items={invoiceItems}
              notes={previewInvoice.notes}
              subtotal={parseFloat(previewInvoice.subtotal)}
              vatAmount={parseFloat(previewInvoice.vat_amount)}
              total={parseFloat(previewInvoice.total)}
            />
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}