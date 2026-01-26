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
import { downloadFile } from "@/utils/downloadUtils";
import { downloadPDF } from "@/utils/pdfUtils";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { InvoicePreview } from "@/components/invoices/InvoicePreview";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { useInvoiceDownload } from "@/hooks/useInvoiceDownload";
import { HiddenInvoiceContainer } from "@/components/invoices/HiddenInvoiceContainer";

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
  const { downloadInvoice, generatingInvoiceId, invoiceItems: hookItems, previewInvoice: hookInvoice } = useInvoiceDownload();
  const [invoiceToDelete, setInvoiceToDelete] = useState<{ id: string, pdfPath: string } | null>(null);
  const [bookings, setBookings] = useState<any[]>([]); // To support HiddenInvoiceContainer and fallbacks

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
      // Also set bookings for HiddenInvoiceContainer compatibility
      setBookings((data || []).map(inv => ({
        id: inv.booking_id || `temp-${inv.id}`,
        invoice: inv,
        scheduled_date: inv.date_performance || inv.date_created,
        service_type: 'cleaning' // default
      })));
    }
    setLoading(false);
  };

  // local downloadInvoice is removed in favor of the hook

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
      // --- Referral Bonus Logic ---
      const { data: clientData } = await supabase
        .from('clients')
        .select('total_spent, referred_by_id, name')
        .eq('id', clientId)
        .single();

      const isFirstInvoice = (clientData?.total_spent || 0) === 0;
      let finalPointsToAdd = pointsToAdd;

      if (isFirstInvoice && clientData?.referred_by_id) {
        // Double points for the referee
        finalPointsToAdd = pointsToAdd * 2;

        // Match reward for the referrer
        const { data: referrerData } = await supabase
          .from('clients')
          .select('id, name')
          .eq('id', clientData.referred_by_id)
          .single();

        if (referrerData) {
          // Add points to referrer
          const { data: referrerCredits } = await supabase
            .from('loyalty_credits')
            .select('current_credits, total_earned')
            .eq('client_id', referrerData.id)
            .single();

          if (referrerCredits) {
            await supabase
              .from('loyalty_credits')
              .update({
                current_credits: (referrerCredits.current_credits || 0) + pointsToAdd,
                total_earned: (referrerCredits.total_earned || 0) + pointsToAdd,
                updated_at: new Date().toISOString()
              })
              .eq('client_id', referrerData.id);
          }

          // Transaction for referrer
          await supabase
            .from('loyalty_transactions')
            .insert({
              client_id: referrerData.id,
              amount: pointsToAdd,
              type: 'earned',
              description: `Referral Bonus (1. úklid od ${clientData.name})`
            });
        }
      }

      // Check if loyalty_credits record exists for this client (referee)
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
            current_credits: (existingCredits.current_credits || 0) + finalPointsToAdd,
            total_earned: (existingCredits.total_earned || 0) + finalPointsToAdd,
            updated_at: new Date().toISOString()
          })
          .eq('client_id', clientId);
      } else {
        // Create new record
        await supabase
          .from('loyalty_credits')
          .insert({
            client_id: clientId,
            current_credits: finalPointsToAdd,
            total_earned: finalPointsToAdd,
            total_spent: 0
          });
      }

      // Update client's total_spent
      await supabase
        .from('clients')
        .update({
          total_spent: (clientData?.total_spent || 0) + invoiceTotal
        })
        .eq('id', clientId);

      // Add transaction record for referee
      await supabase
        .from('loyalty_transactions')
        .insert({
          client_id: clientId,
          amount: finalPointsToAdd,
          type: 'earned',
          description: finalPointsToAdd > pointsToAdd
            ? `Bonus za první úklid (Doporučení) - ${invoiceTotal.toLocaleString('cs-CZ')} Kč`
            : `Body za úklid (${invoiceTotal.toLocaleString('cs-CZ')} Kč)`
        });

      console.log(`Added ${finalPointsToAdd} loyalty points to client ${clientId}`);
    } catch (error) {
      console.error('Error adding loyalty points:', error);
    }
  };

  const previewInvoiceDetails = async (invoice: any) => {
    try {
      const { data: items, error: itemsError } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", invoice.id)
        .order("sort_order");

      let refinedItems = items ? JSON.parse(JSON.stringify(items)) : [];

      // If no items or only generic item, try to fetch booking for better description
      if (refinedItems.length === 0 || (refinedItems.length === 1 && ['Úklidové služby', 'Uklid', 'Služby', 'Services'].some(d => refinedItems[0].description?.includes(d)))) {
        let bookingId = invoice.booking_id;
        if (!bookingId) {
          const { data: bookingLink } = await supabase
            .from('bookings')
            .select('id, service_type, scheduled_date')
            .eq('invoice_id', invoice.id)
            .maybeSingle();
          if (bookingLink) {
            bookingId = bookingLink.id;
            // If we didn't have refinedItems, create a fallback one now
            if (refinedItems.length === 0) {
              const serviceLabels: Record<string, string> = {
                home_cleaning: 'Úklid domácnosti',
                commercial_cleaning: 'Komerční úklid',
                window_cleaning: 'Mytí oken',
                post_construction_cleaning: 'Úklid po stavbě',
                upholstery_cleaning: 'Čištění čalounění',
                cleaning: 'Úklid',
                extra_service: 'Doplňková služba'
              };
              refinedItems = [{
                id: 'preview-fallback-1',
                description: serviceLabels[bookingLink.service_type] || 'Úklidové služby',
                quantity: 1,
                unit_price: invoice.total || 0,
                total: invoice.total || 0,
                vat_rate: 0
              }];
            } else {
              // Just update the generic description
              const serviceLabels: Record<string, string> = {
                home_cleaning: 'Úklid domácnosti',
                commercial_cleaning: 'Komerční úklid',
                window_cleaning: 'Mytí oken',
                post_construction_cleaning: 'Úklid po stavbě',
                upholstery_cleaning: 'Čištění čalounění',
                cleaning: 'Úklid',
                extra_service: 'Doplňková služba'
              };
              if (serviceLabels[bookingLink.service_type]) {
                refinedItems[0].description = serviceLabels[bookingLink.service_type];
              }
            }
          }
        } else {
          // Already have bookingId, just fetch service_type
          const { data: booking } = await supabase
            .from('bookings')
            .select('service_type')
            .eq('id', bookingId)
            .maybeSingle();

          if (booking) {
            const serviceLabels: Record<string, string> = {
              home_cleaning: 'Úklid domácnosti',
              commercial_cleaning: 'Komerční úklid',
              window_cleaning: 'Mytí oken',
              post_construction_cleaning: 'Úklid po stavbě',
              upholstery_cleaning: 'Čištění čalounění',
              cleaning: 'Úklid',
              extra_service: 'Doplňková služba'
            };
            if (refinedItems.length === 0) {
              refinedItems = [{
                id: 'preview-fallback-1',
                description: serviceLabels[booking.service_type] || 'Úklidové služby',
                quantity: 1,
                unit_price: invoice.total || 0,
                total: invoice.total || 0,
                vat_rate: 0
              }];
            } else if (serviceLabels[booking.service_type]) {
              refinedItems[0].description = serviceLabels[booking.service_type];
            }
          }
        }
      }

      // Final fallback if still empty
      if (refinedItems.length === 0) {
        refinedItems = [{
          id: 'preview-fallback-emergency',
          description: 'Úklidové služby',
          quantity: 1,
          unit_price: invoice.total || 0,
          total: invoice.total || 0,
          vat_rate: 0
        }];
      }

      setInvoiceItems(refinedItems);
      setPreviewInvoice(invoice);
    } catch (e) {
      console.error("Error in previewInvoiceDetails:", e);
      toast.error("Chyba při načítání náhledu");
    }
  };

  const handleDeleteClick = (id: string, pdfPath: string) => {
    setInvoiceToDelete({ id, pdfPath });
  };

  const confirmDelete = async () => {
    if (!invoiceToDelete) return;

    const { id, pdfPath } = invoiceToDelete;

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
    setInvoiceToDelete(null);
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
      const zipFileName = `invoices-${new Date().toISOString().split('T')[0]}.zip`;
      await downloadFile(url, zipFileName);

      toast.success("ZIP file downloaded successfully");
      setSelectedInvoices([]);
    } catch (error) {
      console.error("Error creating ZIP:", error);
      toast.error("Error creating ZIP file");
    }
  };

  if (loading) {
    return <LoadingOverlay message="Načítám sklad faktur..." />;
  }

  return (
    <Layout>
      <div className="container mx-auto p-4 sm:p-6 pb-24 space-y-6 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        <AdminPageHeader
          title="Invoice Storage"
          description="Spravujte a stahujte své faktury na jednom místě"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={() => navigate('/invoices/generator')}
                className="bg-card/50 backdrop-blur-sm border-0 shadow-sm rounded-xl px-4 h-10"
              >
                <FileText className="h-4 w-4 mr-2" />
                Generator
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/invoices/default-info')}
                className="bg-card/50 backdrop-blur-sm border-0 shadow-sm rounded-xl px-4 h-10"
              >
                <Settings className="h-4 w-4 mr-2" />
                Nastavení
              </Button>
              {selectedInvoices.length > 0 && (
                <Button
                  onClick={downloadSelectedAsZip}
                  className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all rounded-xl px-4 h-10 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <PackageOpen className="h-4 w-4 mr-2" />
                  Stáhnout ZIP ({selectedInvoices.length})
                </Button>
              )}
            </div>
          }
        />

        {/* Premium Glassmorphic Filter Bar - Monday.com Inspired */}
        <div className="flex flex-col xl:flex-row gap-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-3 sm:p-4 rounded-[2.5rem] border border-white/20 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-700">

          {/* Search & Bulk Actions (Left) */}
          <div className="flex flex-col sm:flex-row gap-3 xl:w-auto w-full flex-1">
            <div className="relative group flex-1 md:max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 transition-colors group-focus-within:text-primary" />
              <input
                type="text"
                placeholder="Hledat dle čísla faktury nebo klienta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 h-12 bg-white/50 dark:bg-slate-800/50 border-0 shadow-sm rounded-full focus:ring-2 focus:ring-primary/20 transition-all w-full text-base outline-none"
              />
            </div>

            {filteredInvoices.length > 0 && (
              <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 px-4 rounded-full border border-white/10 shadow-sm h-12">
                <Checkbox
                  id="select-all"
                  checked={selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0}
                  onCheckedChange={toggleSelectAll}
                  className="rounded-md"
                />
                <label htmlFor="select-all" className="text-sm font-bold cursor-pointer whitespace-nowrap">
                  Vybrat vše ({selectedInvoices.length})
                </label>
              </div>
            )}
          </div>

          {/* Specialized Filters (Right) */}
          <div className="flex flex-wrap items-center gap-3 xl:justify-end">
            <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 p-1.5 rounded-full border border-white/10 shadow-sm min-w-[200px]">
              <div className="p-2 bg-primary/10 rounded-full text-primary">
                <Filter className="h-4 w-4" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 p-2 h-auto text-sm font-bold min-w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-white/20 shadow-2xl backdrop-blur-xl bg-white/90 dark:bg-slate-900/90">
                  <SelectItem value="all">Všechny stavy</SelectItem>
                  <SelectItem value="draft">Koncept</SelectItem>
                  <SelectItem value="issued">Vystaveno</SelectItem>
                  <SelectItem value="paid">Uhrazeno</SelectItem>
                  <SelectItem value="overdue">Po splatnosti</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 p-1.5 rounded-full border border-white/10 shadow-sm">
              <div className="p-2 bg-primary/10 rounded-full text-primary">
                <Download className="h-4 w-4" />
              </div>
              <input
                type="month"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-transparent border-0 outline-none text-sm font-bold pr-4 h-8"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {filteredInvoices.length === 0 ? (
            <Card className="p-12 text-center bg-card/50 backdrop-blur-sm border-0 shadow-lg rounded-3xl">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground">Nebyly nalezeny žádné faktury</p>
            </Card>
          ) : (
            filteredInvoices.map((invoice) => (
              <Card key={invoice.id} className="p-4 bg-white/40 backdrop-blur-md border-0 shadow-md rounded-2xl transition-all hover:shadow-lg hover:bg-white/60">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                    <Checkbox
                      checked={selectedInvoices.includes(invoice.id)}
                      onCheckedChange={() => toggleInvoiceSelection(invoice.id)}
                      className="rounded-md"
                    />
                    <div className="flex-shrink-0">
                      <p className="font-bold text-lg text-primary">{invoice.invoice_number}</p>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                        {new Date(invoice.date_created).toLocaleDateString('cs-CZ')}
                      </p>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate text-foreground">{invoice.client_name}</p>
                      {invoice.client_vat && <p className="text-[10px] text-muted-foreground font-mono">{invoice.client_vat}</p>}
                    </div>

                    <div className="flex-shrink-0 text-right mr-4">
                      <p className="font-bold text-lg text-foreground">{formatCurrency(invoice.total)}</p>
                      {invoice.date_due && (
                        <p className="text-[10px] text-muted-foreground font-medium">
                          Splatnost: {new Date(invoice.date_due).toLocaleDateString('cs-CZ')}
                        </p>
                      )}
                    </div>

                    <Select
                      value={invoice.status}
                      onValueChange={(value) => updateInvoiceStatus(invoice.id, value)}
                    >
                      <SelectTrigger className="w-[130px] h-9 bg-background/50 border-0 rounded-lg text-xs font-semibold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Koncept</SelectItem>
                        <SelectItem value="issued">Vystaveno</SelectItem>
                        <SelectItem value="paid">Uhrazeno</SelectItem>
                        <SelectItem value="overdue">Po splatnosti</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => previewInvoiceDetails(invoice)}
                      className="h-9 w-9 bg-background/50 border-0 rounded-lg hover:bg-primary hover:text-white transition-all"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => downloadInvoice(invoice, companyInfo)}
                      disabled={generatingInvoiceId === invoice.id}
                      className="h-9 w-9 bg-background/50 border-0 rounded-lg hover:bg-success hover:text-white transition-all"
                    >
                      <Download className={generatingInvoiceId === invoice.id ? "h-4 w-4 animate-bounce" : "h-4 w-4"} />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteClick(invoice.id, invoice.pdf_path)}
                      className="h-9 w-9 bg-background/50 border-0 rounded-lg hover:bg-destructive hover:text-white transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        <Dialog open={!!previewInvoice} onOpenChange={() => setPreviewInvoice(null)}>
          <DialogContent className="max-w-[794px] w-full p-0 border-0 bg-transparent shadow-2xl rounded-xl overflow-hidden max-h-[85vh] overflow-y-auto">
            {previewInvoice && companyInfo && (
              <div className="bg-white p-0">
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
                  paymentMethod={previewInvoice.payment_method}
                  datePaid={previewInvoice.date_paid}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Hidden container for PDF generation */}
      <HiddenInvoiceContainer
        generatingInvoiceId={generatingInvoiceId}
        previewInvoice={hookInvoice}
        companyInfo={companyInfo}
        invoiceItems={hookItems}
        bookings={bookings} // We should ideally fetch relevant bookings or allow container to handle it
      />

      <AlertDialog open={!!invoiceToDelete} onOpenChange={(open) => !open && setInvoiceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Opravdu smazat fakturu?</AlertDialogTitle>
            <AlertDialogDescription>
              Tato akce je nevratná. Faktura bude trvale odstraněna z databáze i úložiště.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Smazat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}