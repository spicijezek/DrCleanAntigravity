import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, Eye, Trash2, Search, Filter, FileText, Settings, PackageOpen } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import JSZip from "jszip";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InvoicePreview } from "@/components/invoices/InvoicePreview";

export default function InvoiceStorage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [previewInvoice, setPreviewInvoice] = useState<any>(null);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      fetchInvoices();
      fetchCompanyInfo();
    }
  }, [user]);

  const fetchCompanyInfo = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("company_info")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) setCompanyInfo(data);
  };

  const fetchInvoices = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("user_id", user.id)
      .order("date_created", { ascending: false });

    if (error) {
      toast.error("Error loading invoices");
      console.error(error);
    } else {
      setInvoices(data || []);
    }
    setLoading(false);
  };

  const downloadInvoice = async (invoice: any) => {
    if (!invoice.pdf_path) {
      toast.error("PDF not found");
      return;
    }

    try {
      let downloadUrl = "";

      if (invoice.pdf_path.startsWith('http')) {
        // It's a Cloudinary URL (or other direct URL)
        downloadUrl = invoice.pdf_path;

        // If it's Cloudinary, we can force download by adding fl_attachment
        if (downloadUrl.includes('cloudinary.com')) {
          downloadUrl = downloadUrl.replace('/upload/', '/upload/fl_attachment/');
        }
      } else {
        // It's an old Supabase path
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
      toast.error("Error downloading invoice");
      console.error(error);
    }
  };

  const updateInvoiceStatus = async (id: string, newStatus: string) => {
    // Get the invoice details first for loyalty points calculation
    const invoice = invoices.find(inv => inv.id === id);
    const wasNotPaid = invoice?.status !== 'paid';

    const { error } = await supabase
      .from("invoices")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      toast.error("Error updating status");
      console.error(error);
    } else {
      // If status changed to 'paid', add loyalty points
      if (newStatus === 'paid' && wasNotPaid && invoice?.client_id && invoice?.total) {
        await addLoyaltyPoints(invoice.client_id, invoice.total, id);
      }
      toast.success("Status updated");
      fetchInvoices();
    }
  };

  const addLoyaltyPoints = async (clientId: string, invoiceTotal: number, invoiceId: string) => {
    const POINTS_PER_CZK = 0.27;
    const pointsToAdd = Math.round(invoiceTotal * POINTS_PER_CZK);

    if (pointsToAdd <= 0) return;

    try {
      // Check if loyalty_credits record exists for this client
      const { data: existingCredits } = await supabase
        .from('loyalty_credits')
        .select('*')
        .eq('client_id', clientId)
        .single();

      if (existingCredits) {
        // Update existing record
        await supabase
          .from('loyalty_credits')
          .update({
            current_credits: (existingCredits.current_credits || 0) + pointsToAdd,
            total_earned: (existingCredits.total_earned || 0) + pointsToAdd,
            updated_at: new Date().toISOString()
          })
          .eq('client_id', clientId);
      } else {
        // Create new record
        await supabase
          .from('loyalty_credits')
          .insert({
            client_id: clientId,
            current_credits: pointsToAdd,
            total_earned: pointsToAdd,
            total_spent: 0
          });
      }

      // Update client's total_spent
      const { data: clientData } = await supabase
        .from('clients')
        .select('total_spent')
        .eq('id', clientId)
        .single();

      await supabase
        .from('clients')
        .update({
          total_spent: (clientData?.total_spent || 0) + invoiceTotal
        })
        .eq('id', clientId);

      // Add transaction record
      await supabase
        .from('loyalty_transactions')
        .insert({
          client_id: clientId,
          amount: pointsToAdd,
          type: 'earned',
          description: `Body za úklid (${invoiceTotal.toLocaleString('cs-CZ')} Kč)`
        });

      console.log(`Added ${pointsToAdd} loyalty points to client ${clientId}`);
    } catch (error) {
      console.error('Error adding loyalty points:', error);
    }
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

  const deleteInvoice = async (id: string, pdfPath: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;

    // Delete PDF from storage if it's a Supabase path
    if (pdfPath && !pdfPath.startsWith('http')) {
      await supabase.storage.from("invoices").remove([pdfPath]);
    }
    // Note: Deleting from Cloudinary would require an API secret, 
    // which we shouldn't have in the frontend. We just leave it there or handle manually.

    // Delete invoice from database
    const { error } = await supabase.from("invoices").delete().eq("id", id);

    if (error) {
      toast.error("Error deleting invoice");
      console.error(error);
    } else {
      toast.success("Invoice deleted");
      fetchInvoices();
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch =
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.client_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;

    const matchesDate = !dateFilter || invoice.date_created.startsWith(dateFilter);

    return matchesSearch && matchesStatus && matchesDate;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' }).format(amount);
  };

  const toggleInvoiceSelection = (invoiceId: string) => {
    setSelectedInvoices(prev =>
      prev.includes(invoiceId)
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedInvoices.length === filteredInvoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(filteredInvoices.map(inv => inv.id));
    }
  };

  const downloadSelectedAsZip = async () => {
    if (selectedInvoices.length === 0) {
      toast.error("Please select at least one invoice");
      return;
    }

    toast.info("Preparing ZIP file...");
    const zip = new JSZip();

    try {
      const selectedInvoiceData = invoices.filter(inv => selectedInvoices.includes(inv.id));

      for (const invoice of selectedInvoiceData) {
        if (!invoice.pdf_path) continue;

        let fileData: any;
        if (invoice.pdf_path.startsWith('http')) {
          const response = await fetch(invoice.pdf_path);
          fileData = await response.blob();
        } else {
          const { data, error } = await supabase.storage
            .from("invoices")
            .download(invoice.pdf_path);

          if (error) {
            console.error(`Error downloading ${invoice.invoice_number}:`, error);
            continue;
          }
          fileData = data;
        }

        zip.file(`faktura-${invoice.invoice_number}.pdf`, fileData);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoices-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("ZIP file downloaded successfully");
      setSelectedInvoices([]);
    } catch (error) {
      console.error("Error creating ZIP:", error);
      toast.error("Error creating ZIP file");
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Invoice Storage</h1>
            <p className="text-muted-foreground">Manage and download your invoices</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/invoices/generator')}>
              <FileText className="h-4 w-4 mr-2" />
              Generator
            </Button>
            <Button variant="outline" onClick={() => navigate('/invoices/default-info')}>
              <Settings className="h-4 w-4 mr-2" />
              Default Info
            </Button>
          </div>
        </div>

        {/* Filters and Bulk Actions */}
        <Card className="p-4 space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by invoice number or client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="issued">Issued</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="month"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-[180px]"
            />
          </div>

          {/* Bulk Actions */}
          {filteredInvoices.length > 0 && (
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                  <span className="text-sm text-muted-foreground">
                    Select All ({selectedInvoices.length} selected)
                  </span>
                </div>
              </div>

              {selectedInvoices.length > 0 && (
                <Button
                  onClick={downloadSelectedAsZip}
                  variant="default"
                  size="sm"
                >
                  <PackageOpen className="h-4 w-4 mr-2" />
                  Download as ZIP
                </Button>
              )}
            </div>
          )}
        </Card>

        {/* Invoices List */}
        {loading ? (
          <Card className="p-8 text-center text-muted-foreground">
            Loading invoices...
          </Card>
        ) : filteredInvoices.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            No invoices found
          </Card>
        ) : (
          <div className="grid gap-3">
            {filteredInvoices.map((invoice) => (
              <Card key={invoice.id} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Checkbox
                      checked={selectedInvoices.includes(invoice.id)}
                      onCheckedChange={() => toggleInvoiceSelection(invoice.id)}
                    />
                    <div className="flex-shrink-0">
                      <p className="font-semibold text-lg">{invoice.invoice_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(invoice.date_created).toLocaleDateString('cs-CZ')}
                      </p>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{invoice.client_name}</p>
                      {invoice.client_vat && <p className="text-xs text-muted-foreground">{invoice.client_vat}</p>}
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <p className="font-bold text-lg">{formatCurrency(invoice.total)}</p>
                      {invoice.date_due && (
                        <p className="text-xs text-muted-foreground">
                          Due: {new Date(invoice.date_due).toLocaleDateString('cs-CZ')}
                        </p>
                      )}
                    </div>

                    <Select
                      value={invoice.status}
                      onValueChange={(value) => updateInvoiceStatus(invoice.id, value)}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="issued">Issued</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => previewInvoiceDetails(invoice)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadInvoice(invoice)}
                      disabled={!invoice.pdf_path}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteInvoice(invoice.id, invoice.pdf_path)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Invoice Preview Dialog */}
        <Dialog open={!!previewInvoice} onOpenChange={() => setPreviewInvoice(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
            {previewInvoice && companyInfo && (
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
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}