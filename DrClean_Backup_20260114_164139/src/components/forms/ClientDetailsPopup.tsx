import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, Building2, Mail, Phone, MapPin, Calendar, FileText, Download, Eye, FileText as InvoiceIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InvoicePreview } from '@/components/invoices/InvoicePreview';

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
  // Try by client_id first
  const { data: byId } = await supabase
    .from("invoices")
    .select("*")
    .eq("client_id", client.id)
    .order("date_created", { ascending: false });

  if (byId && byId.length > 0) {
    setInvoices(byId);
    return;
  }

  // Fallback for older invoices without client_id: match by client_name
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

    const { data, error } = await supabase.storage
      .from("invoices")
      .download(invoice.pdf_path);

    if (error) {
      toast({ title: "Error", description: "Error downloading invoice", variant: "destructive" });
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `faktura-${invoice.invoice_number}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
          company_legal_name: formData.company_legal_name,
          reliable_person: formData.reliable_person,
          notes: formData.notes,
          client_source: formData.client_source,
        })
        .eq('id', client.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Client updated successfully',
      });

      onClientUpdated(formData);
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update client',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto p-6">
        <DialogHeader className="mb-6">
          <DialogTitle className="flex items-center gap-2 text-xl">
            {client.client_type === 'company' ? (
              <Building2 className="h-5 w-5" />
            ) : (
              <User className="h-5 w-5" />
            )}
            Client Details
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="mb-2 block">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="client_type" className="mb-2 block">Type</Label>
              <Select
                value={formData.client_type}
                onValueChange={(value) => handleInputChange('client_type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="person">Person</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email" className="flex items-center gap-1 mb-2">
                <Mail className="h-3 w-3" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="phone" className="flex items-center gap-1 mb-2">
                <Phone className="h-3 w-3" />
                Phone
              </Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address" className="flex items-center gap-1 mb-2">
              <MapPin className="h-3 w-3" />
              Address
            </Label>
            <Input
              id="address"
              value={formData.address || ''}
              onChange={(e) => handleInputChange('address', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city" className="mb-2 block">City</Label>
              <Input
                id="city"
                value={formData.city || ''}
                onChange={(e) => handleInputChange('city', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="postal_code" className="mb-2 block">Postal Code</Label>
              <Input
                id="postal_code"
                value={formData.postal_code || ''}
                onChange={(e) => handleInputChange('postal_code', e.target.value)}
              />
            </div>
          </div>

          {formData.client_type === 'company' && (
            <>
              <div>
                <Label htmlFor="company_id" className="mb-2 block">Company ID</Label>
                <Input
                  id="company_id"
                  value={formData.company_id || ''}
                  onChange={(e) => handleInputChange('company_id', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="company_legal_name" className="mb-2 block">Company Legal Name</Label>
                <Input
                  id="company_legal_name"
                  value={formData.company_legal_name || ''}
                  onChange={(e) => handleInputChange('company_legal_name', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="reliable_person" className="mb-2 block">Reliable Person</Label>
                <Input
                  id="reliable_person"
                  value={formData.reliable_person || ''}
                  onChange={(e) => handleInputChange('reliable_person', e.target.value)}
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="client_source" className="mb-2 block">Client Source</Label>
            <Input
              id="client_source"
              value={formData.client_source || ''}
              onChange={(e) => handleInputChange('client_source', e.target.value)}
              placeholder="e.g., referral, website, advertisement"
            />
          </div>

          <div>
            <Label htmlFor="notes" className="flex items-center gap-1 mb-2">
              <FileText className="h-3 w-3" />
              Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Client'}
            </Button>
          </div>
        </form>

        {/* Client Invoices Section */}
        <div className="mt-8 pt-6 border-t">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <InvoiceIcon className="h-5 w-5" />
            Client Invoices ({invoices.length})
          </h3>
          {invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invoices found for this client yet.</p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {invoices.map((invoice) => (
                <Card key={invoice.id} className="p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{invoice.invoice_number}</p>
                        <Badge variant={
                          invoice.status === 'paid' ? 'default' :
                          invoice.status === 'issued' ? 'secondary' :
                          'outline'
                        } className="text-xs">
                          {invoice.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(invoice.date_created).toLocaleDateString('cs-CZ')} • {new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' }).format(invoice.total)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => previewInvoiceDetails(invoice)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadInvoice(invoice)}
                        disabled={!invoice.pdf_path}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>

      {/* Invoice Preview Dialog */}
      {previewInvoice && companyInfo && (
        <Dialog open={!!previewInvoice} onOpenChange={() => setPreviewInvoice(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invoice Preview</DialogTitle>
            </DialogHeader>
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