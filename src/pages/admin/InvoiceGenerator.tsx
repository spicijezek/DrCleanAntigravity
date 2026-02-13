import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Download, Save, FileText, Settings, Lock } from "lucide-react";
import { InvoicePreview } from "@/components/invoices/InvoicePreview";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { LoadingOverlay } from "@/components/LoadingOverlay";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
}

interface CompletedBooking {
  id: string;
  service_type: string;
  scheduled_date: string;
  client_name: string;
}

export default function InvoiceGenerator() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const bookingIdFromState = (location.state as { bookingId?: string } | null)?.bookingId;
  const isInvoiceUser = profile?.roles?.includes('invoice_user');
  const [loading, setLoading] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientIco, setClientIco] = useState("");
  const [clientDic, setClientDic] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [dateCreated, setDateCreated] = useState(new Date().toISOString().split('T')[0]);
  const [performanceDates, setPerformanceDates] = useState<Array<{ id: string; startDate: string; endDate?: string }>>([
    { id: crypto.randomUUID(), startDate: new Date().toISOString().split('T')[0] }
  ]);
  const [dateDue, setDateDue] = useState(() => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);
    return dueDate.toISOString().split('T')[0];
  });
  const [variableSymbol, setVariableSymbol] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'cash'>('cash');
  const [datePaid, setDatePaid] = useState<string>("");
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: crypto.randomUUID(), description: "", quantity: 0, unit_price: 0, vat_rate: 0 }
  ]);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [fetchingAres, setFetchingAres] = useState(false);
  const [completedBookings, setCompletedBookings] = useState<CompletedBooking[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string>(bookingIdFromState || "");

  useEffect(() => {
    fetchCompanyInfo();
    generateInvoiceNumber();
    fetchClients();
    fetchCompletedBookings();
  }, [user]);

  useEffect(() => {
    if (selectedClientId) {
      fetchJobsForClient(selectedClientId);
    }
  }, [selectedClientId]);

  // Sync variable symbol with invoice number
  useEffect(() => {
    setVariableSymbol(invoiceNumber);
  }, [invoiceNumber]);

  useEffect(() => {
    if (paymentMethod === 'cash' && !datePaid) {
      setDatePaid(new Date().toISOString().split('T')[0]);
    }
  }, [paymentMethod]);

  const fetchCompanyInfo = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("company_info")
      .select("*")
      .eq("user_id", user.id)
      .single();
    setCompanyInfo(data);
  };

  const fetchClients = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", user.id)
      .order("name");
    setClients(data || []);
  };

  const fetchCompletedBookings = async () => {
    if (!user) return;

    const { data: bookingsData } = await supabase
      .from('bookings')
      .select('id, service_type, scheduled_date, client_id')
      .eq('status', 'completed')
      .is('invoice_id', null)
      .order('scheduled_date', { ascending: false });

    if (bookingsData) {
      // Fetch client names
      const bookingsWithClients = await Promise.all(
        bookingsData.map(async (booking) => {
          const { data: client } = await supabase
            .from('clients')
            .select('name')
            .eq('id', booking.client_id)
            .single();

          return {
            id: booking.id,
            service_type: booking.service_type,
            scheduled_date: booking.scheduled_date,
            client_name: client?.name || 'Neznámý klient'
          };
        })
      );
      setCompletedBookings(bookingsWithClients);
    }
  };

  const loadBookingData = async (bookingId: string) => {
    try {
      const { data: booking, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (error) throw error;

      if (booking) {
        // Fetch client data
        const { data: client } = await supabase
          .from('clients')
          .select('*')
          .eq('id', booking.client_id)
          .single();

        if (client) {
          setClientName(client.name);
          setClientIco(client.company_id || '');
          setClientDic(client.dic || '');
          setClientAddress(client.address || booking.address);
          setClientEmail(client.email || '');
          setClientPhone(client.phone || '');
          setSelectedClientId(booking.client_id);
          setPaymentMethod('bank_transfer');

          // Set performance date to cleaning date
          if (booking.scheduled_date) {
            setPerformanceDates([{
              id: crypto.randomUUID(),
              startDate: booking.scheduled_date.split('T')[0]
            }]);
          }

          // Set due date to 7 days from current issue date
          const dueDate = new Date(dateCreated);
          dueDate.setDate(dueDate.getDate() + 7);
          setDateDue(dueDate.toISOString().split('T')[0]);

          // Add booking service as first item
          const serviceLabels: Record<string, string> = {
            home_cleaning: 'Úklid domácnosti',
            commercial_cleaning: 'Komerční úklid',
            window_cleaning: 'Mytí oken',
            post_construction_cleaning: 'Úklid po stavbě',
            upholstery_cleaning: 'Čištění čalounění',
            cleaning: 'Úklid',
            extra_service: 'Doplňková služba'
          };

          const price = booking.booking_details?.priceEstimate?.price ??
            booking.booking_details?.priceEstimate?.priceMin ?? 0;

          setItems([{
            id: crypto.randomUUID(),
            description: serviceLabels[booking.service_type] || booking.service_type,
            quantity: 1,
            unit_price: price,
            vat_rate: 0
          }]);
        }
      }
    } catch (error) {
      console.error('Error loading booking:', error);
      toast.error('Nepodařilo se načíst data rezervace');
    }
  };

  const fetchJobsForClient = async (clientId: string) => {
    if (!user) return;
    const { data } = await supabase
      .from("jobs")
      .select("*")
      .eq("user_id", user.id)
      .eq("client_id", clientId)
      .in("status", ["scheduled", "completed"])
      .order("scheduled_date", { ascending: false });
    setJobs(data || []);
  };

  const generateInvoiceNumber = async () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');

    const { data: lastInvoice } = await supabase
      .from("invoices")
      .select("invoice_number")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    let sequence = 218;
    if (lastInvoice?.invoice_number) {
      const lastSequence = parseInt(lastInvoice.invoice_number.slice(-3));
      sequence = lastSequence + 1;
    }

    const invoiceNum = `${year}${month}${sequence.toString().padStart(3, '0')}`;
    setInvoiceNumber(invoiceNum);
  };

  const fetchCompanyFromAres = async (ico: string) => {
    if (!ico || ico.length < 8) return;

    setFetchingAres(true);
    try {
      const response = await fetch(`https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${ico}`);

      if (!response.ok) throw new Error('Company not found');

      const data = await response.json();

      const companyName = data.obchodniJmeno || '';
      const dic = data.dic || '';

      const sidlo = data.sidlo;
      let address = '';

      if (sidlo) {
        const street = sidlo.nazevUlice || '';
        const houseNumber = sidlo.cisloDomovni || '';
        const orientationNumber = sidlo.cisloOrientacni || '';
        const city = sidlo.nazevObce || '';
        const postalCode = sidlo.psc?.toString() || '';

        const streetAddress = [street, houseNumber, orientationNumber].filter(Boolean).join(' ');
        address = [streetAddress, `${postalCode} ${city}`].filter(Boolean).join('\n');
      }

      setClientName(companyName);
      setClientDic(dic);
      setClientAddress(address);

      toast.success("Údaje načteny z ARES");
    } catch (error) {
      toast.error("Nepodařilo se načíst údaje z ARES");
    } finally {
      setFetchingAres(false);
    }
  };

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    setSelectedJobId("");

    const client = clients.find(c => c.id === clientId);
    if (client) {
      setClientName(client.name || "");
      setClientIco(client.company_id || "");
      setClientDic(client.dic || "");
      setClientEmail(client.email || "");
      setClientPhone(client.phone || "");

      const addressParts = [
        client.address,
        client.postal_code && client.city ? `${client.postal_code} ${client.city}` : client.city || client.postal_code
      ].filter(Boolean);
      setClientAddress(addressParts.join('\n'));
    }
  };

  const handleJobSelect = (jobId: string) => {
    setSelectedJobId(jobId);

    const job = jobs.find(j => j.id === jobId);
    if (job) {
      const categoryMap: Record<string, string> = {
        'home_cleaning': 'Úklid domácnosti',
        'commercial_cleaning': 'Komerční úklid',
        'window_cleaning': 'Mytí oken',
        'post_construction_cleaning': 'Úklid po rekonstrukci',
        'upholstery_cleaning': 'Čištění čalounění'
      };

      setItems([{
        id: crypto.randomUUID(),
        description: categoryMap[job.category] || job.title || "",
        quantity: 0,
        unit_price: parseFloat(job.revenue) || 0,
        vat_rate: 0
      }]);
    }
  };

  const addItem = () => {
    setItems([...items, { id: crypto.randomUUID(), description: "", quantity: 0, unit_price: 0, vat_rate: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let vatAmount = 0;
    items.forEach(item => {
      const itemTotal = item.quantity > 0 ? item.quantity * item.unit_price : item.unit_price;
      subtotal += itemTotal;
      vatAmount += itemTotal * (item.vat_rate / 100);
    });
    return { subtotal, vatAmount, total: subtotal + vatAmount };
  };

  const generateInvoicePDF = async () => {
    const element = document.getElementById('invoice-preview');
    if (!element) return null;

    // Create clone
    const clone = element.cloneNode(true) as HTMLElement;
    // Set fixed width for A4 consistency (794px ~ A4 @ 96dpi)
    clone.style.width = '794px';
    clone.style.minHeight = '1123px';
    clone.style.position = 'absolute';
    clone.style.left = '-10000px';
    clone.style.top = '0';
    clone.style.zIndex = '-1';
    clone.style.background = 'white';
    document.body.appendChild(clone);

    try {
      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: 794,
        allowTaint: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      return pdf;
    } catch (error) {
      console.error("PDF Generation Error:", error);
      toast.error("Chyba při generování PDF");
      return null;
    } finally {
      document.body.removeChild(clone);
    }
  };

  const downloadPDF = async () => {
    const pdf = await generateInvoicePDF();
    if (pdf) {
      const filename = `${clientName || 'faktura'} f. ${invoiceNumber}.pdf`;
      pdf.save(filename);
    }
  };

  const saveInvoice = async () => {
    if (!user) return;
    setLoading(true);

    const totals = calculateTotals();
    const saveToastId = toast.loading("Ukládání faktury...");

    try {
      let resolvedClientId: string | null =
        selectedClientId ||
        (clients.find(
          (c) =>
            (c.name || "").trim().toLowerCase() ===
            (clientName || "").trim().toLowerCase()
        )?.id ?? null);

      if (!resolvedClientId && selectedBookingId && selectedBookingId !== "none") {
        const { data: bookingClient, error: bookingClientError } = await supabase
          .from("bookings")
          .select("client_id")
          .eq("id", selectedBookingId)
          .maybeSingle();

        if (bookingClientError) throw bookingClientError;
        resolvedClientId = bookingClient?.client_id ?? null;
      }

      toast.loading("Vytváření záznamu v databázi...", { id: saveToastId });

      // Save invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          user_id: user.id,
          client_id: resolvedClientId,
          invoice_number: invoiceNumber,
          client_name: clientName,
          client_vat: clientIco,
          client_address: clientAddress,
          client_email: clientEmail,
          client_phone: clientPhone,
          date_created: dateCreated,
          date_performance: performanceDates.length > 0 ? performanceDates[0].startDate : null,
          date_due: dateDue || null,
          variable_symbol: variableSymbol,
          payment_method: paymentMethod,
          subtotal: totals.subtotal,
          vat_amount: totals.vatAmount,
          total: totals.total,
          notes: notes,
          status: 'issued',
          booking_id: selectedBookingId && selectedBookingId !== "none" ? selectedBookingId : null
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Save invoice items
      const itemsToInsert = items.map((item, index) => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity > 0 ? item.quantity : 1,
        unit_price: item.unit_price,
        vat_rate: item.vat_rate,
        total: item.quantity > 0 ? item.quantity * item.unit_price : item.unit_price,
        sort_order: index
      }));

      const { error: itemsError } = await supabase
        .from("invoice_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // Link invoice to booking if one is selected
      if (selectedBookingId && selectedBookingId !== "none") {
        await supabase
          .from("bookings")
          .update({ invoice_id: invoice.id })
          .eq("id", selectedBookingId);
      }

      // Generate and upload PDF
      toast.loading("Generování PDF dokumentu...", { id: saveToastId });

      try {
        const pdf = await generateInvoicePDF();
        if (pdf) {
          toast.loading("Nahrávání PDF do cloudu...", { id: saveToastId });
          const pdfBlob = pdf.output('blob');
          const cloudinaryUrl = await uploadToCloudinary(pdfBlob);

          await supabase
            .from("invoices")
            .update({ pdf_path: cloudinaryUrl })
            .eq("id", invoice.id);
        }
      } catch (pdfError) {
        console.error("PDF/Upload Error:", pdfError);
        toast.error("Faktura uložena, ale PDF se nepodařilo vygenerovat.", { id: saveToastId });
        // We don't throw here because the record is already saved
      }

      toast.success("Faktura byla úspěšně uložena", { id: saveToastId });

      // Reset form
      generateInvoiceNumber();
      setClientName("");
      setClientIco("");
      setClientDic("");
      setClientAddress("");
      setClientEmail("");
      setClientPhone("");
      setPerformanceDates([{ id: crypto.randomUUID(), startDate: new Date().toISOString().split('T')[0] }]);
      const newDueDate = new Date();
      newDueDate.setDate(newDueDate.getDate() + 7);
      setDateDue(newDueDate.toISOString().split('T')[0]);
      setVariableSymbol("");
      setNotes("");
      setPaymentMethod('cash');
      setDatePaid("");
      setSelectedClientId("");
      setSelectedJobId("");
      setSelectedBookingId("");
      setItems([{ id: crypto.randomUUID(), description: "", quantity: 0, unit_price: 0, vat_rate: 0 }]);

      fetchCompletedBookings();
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast.error("Chyba při ukládání faktury", { id: saveToastId });
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  const renderFormContent = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-2 border-b">
        <FileText className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Základní údaje</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Číslo faktury</Label>
          <Input
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            className="bg-white"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Datum vystavení</Label>
          <Input type="date" value={dateCreated} onChange={(e) => {
            setDateCreated(e.target.value);
            setPerformanceDates([{ id: crypto.randomUUID(), startDate: e.target.value }]);
            const dueDate = new Date(e.target.value);
            dueDate.setDate(dueDate.getDate() + 7);
            setDateDue(dueDate.toISOString().split('T')[0]);
          }} className="bg-white" />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Datum splatnosti</Label>
          <Input type="date" value={dateDue} onChange={(e) => setDateDue(e.target.value)} className="bg-white" />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium font-bold text-primary">Přiřadit k rezervaci (volitelné)</Label>
        <Select
          value={selectedBookingId}
          onValueChange={(value) => {
            setSelectedBookingId(value);
            if (value && value !== "none") {
              loadBookingData(value);
            }
          }}
        >
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="Vyberte dokončenou rezervaci" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">-- Bez přiřazení --</SelectItem>
            {completedBookings.map((booking) => {
              const serviceLabels: Record<string, string> = {
                home_cleaning: 'Úklid domácnosti',
                commercial_cleaning: 'Komerční úklid',
                window_cleaning: 'Mytí oken',
                post_construction_cleaning: 'Úklid po stavbě',
                upholstery_cleaning: 'Čištění čalounění'
              };
              return (
                <SelectItem key={booking.id} value={booking.id}>
                  {booking.client_name} - {serviceLabels[booking.service_type] || booking.service_type} ({new Date(booking.scheduled_date).toLocaleDateString('cs-CZ')})
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          {paymentMethod === 'bank_transfer' ? (
            <>
              <Label className="text-sm font-medium">Variabilní symbol</Label>
              <Input value={variableSymbol} onChange={(e) => setVariableSymbol(e.target.value)} placeholder="Auto-filled" disabled className="bg-slate-50" />
            </>
          ) : (
            <>
              <Label className="text-sm font-medium">Datum úhrady</Label>
              <Input type="date" value={datePaid} onChange={(e) => setDatePaid(e.target.value)} className="bg-white" />
            </>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Způsob platby</Label>
          <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'bank_transfer' | 'cash')}>
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bank_transfer">Převodem</SelectItem>
              <SelectItem value="cash">Hotově</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            <Label className="text-base font-semibold">Datumy plnění</Label>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPerformanceDates([...performanceDates, { id: crypto.randomUUID(), startDate: new Date().toISOString().split('T')[0] }])}
            className="h-8"
          >
            Přidat datum
          </Button>
        </div>
        <div className="space-y-3">
          {performanceDates.map((dateItem, index) => (
            <div key={dateItem.id} className="flex gap-2 items-end bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase text-muted-foreground font-bold">Od</span>
                  <Input
                    type="date"
                    value={dateItem.startDate}
                    onChange={(e) => {
                      const updated = [...performanceDates];
                      updated[index].startDate = e.target.value;
                      setPerformanceDates(updated);
                    }}
                    className="bg-white h-9"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase text-muted-foreground font-bold">Do (volitelné)</span>
                  <Input
                    type="date"
                    value={dateItem.endDate || ''}
                    onChange={(e) => {
                      const updated = [...performanceDates];
                      updated[index].endDate = e.target.value || undefined;
                      setPerformanceDates(updated);
                    }}
                    className="bg-white h-9"
                  />
                </div>
              </div>
              {performanceDates.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setPerformanceDates(performanceDates.filter(d => d.id !== dateItem.id))}
                  className="text-destructive hover:bg-destructive/10 h-9 w-9"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-4 pb-2 border-b">
        <Lock className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Odběratel</h2>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Vybrat ze seznamu klientů</Label>
          <Select value={selectedClientId} onValueChange={handleClientSelect}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Vyberte klienta..." />
            </SelectTrigger>
            <SelectContent>
              {clients.map(client => (
                <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedClientId && jobs.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-primary font-bold">Načíst z práce (Autofill)</Label>
            <Select value={selectedJobId} onValueChange={handleJobSelect}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Vyberte práci..." />
              </SelectTrigger>
              <SelectContent>
                {jobs.map(job => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.job_number} - {job.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">IČO *</Label>
            <Input
              value={clientIco}
              onChange={(e) => setClientIco(e.target.value)}
              placeholder="Identifikační číslo"
              onBlur={(e) => fetchCompanyFromAres(e.target.value)}
              className="bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">DIČ</Label>
            <Input value={clientDic} onChange={(e) => setClientDic(e.target.value)} placeholder="Daňové číslo" className="bg-white" />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Název klienta *</Label>
          <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Jméno nebo firma" className="bg-white" />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Adresa</Label>
          <Textarea
            value={clientAddress}
            onChange={(e) => setClientAddress(e.target.value)}
            placeholder="Ulice, Město, PSČ"
            rows={2}
            className="bg-white min-h-[80px]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Email</Label>
            <Input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className="bg-white" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Telefon</Label>
            <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className="bg-white" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-4 pb-2 border-b">
        <Plus className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Položky faktury</h2>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <Card key={item.id} className="p-4 space-y-4 shadow-sm border bg-slate-50/50">
            <div className="flex justify-between items-center bg-white p-2 rounded-t-lg -m-4 mb-2 border-b">
              <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground ml-2">Položka {index + 1}</span>
              {items.length > 1 && (
                <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)} className="text-destructive px-2">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Smazat
                </Button>
              )}
            </div>

            <div className="space-y-2 pt-2">
              <Label className="text-xs font-bold">Popis služby *</Label>
              <Input
                value={item.description}
                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                placeholder="Např. Úklid domácnosti"
                className="bg-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase">Množství</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.quantity}
                  onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                  className="bg-white h-9"
                />
              </div>
              <div className="space-y-1 col-span-1">
                <Label className="text-[10px] font-bold uppercase">{item.quantity > 0 ? 'Cena/j.' : 'Cena'}</Label>
                <Input type="number" min="0" step="1" value={item.unit_price} onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)} className="bg-white h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase">DPH %</Label>
                <Input type="number" min="0" step="1" value={item.vat_rate} onChange={(e) => updateItem(item.id, 'vat_rate', parseFloat(e.target.value) || 0)} className="bg-white h-9" />
              </div>
            </div>

            <div className="text-[10px] font-mono text-muted-foreground flex justify-between bg-white/50 p-2 rounded border border-dashed">
              <span>Základ: {(item.quantity > 0 ? item.quantity * item.unit_price : item.unit_price).toLocaleString('cs-CZ', { minimumFractionDigits: 2 })} Kč</span>
              <span>DPH: {((item.quantity > 0 ? item.quantity * item.unit_price : item.unit_price) * item.vat_rate / 100).toLocaleString('cs-CZ', { minimumFractionDigits: 2 })} Kč</span>
            </div>
          </Card>
        ))}

        <Button onClick={addItem} variant="outline" className="w-full border-dashed border-2 hover:bg-primary/5 hover:text-primary hover:border-primary/50 py-6" size="sm">
          <Plus className="h-5 w-5 mr-2" />
          Přidat další položku
        </Button>
      </div>

      <div className="space-y-2 pt-4">
        <Label className="text-sm font-medium">Poznámka</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Doplňující informace..."
          rows={3}
          className="bg-white"
        />
      </div>

      <div className="pt-6 space-y-3 border-t-2 border-primary/10">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Mezisoučet:</span>
          <span className="font-medium">{totals.subtotal.toLocaleString('cs-CZ', { minimumFractionDigits: 2 })} Kč</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Celkem DPH:</span>
          <span>{totals.vatAmount.toLocaleString('cs-CZ', { minimumFractionDigits: 2 })} Kč</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-dashed">
          <span className="text-lg font-bold">Celkem k úhradě:</span>
          <span className="text-2xl font-black text-primary">{totals.total.toLocaleString('cs-CZ', { minimumFractionDigits: 2 })} Kč</span>
        </div>
      </div>
    </div>
  );
  const renderPreview = () => (
    <Card id="invoice-preview-container" className="p-0 border-none shadow-xl bg-white overflow-hidden w-full">
      <InvoicePreview
        companyInfo={companyInfo}
        invoiceNumber={invoiceNumber}
        clientName={clientName}
        clientVat={clientIco}
        clientDic={clientDic}
        clientAddress={clientAddress}
        clientEmail={clientEmail}
        clientPhone={clientPhone}
        dateCreated={dateCreated}
        performanceDates={performanceDates}
        dateDue={dateDue}
        datePaid={datePaid}
        variableSymbol={variableSymbol}
        paymentMethod={paymentMethod}
        items={items}
        notes={notes}
        subtotal={totals.subtotal}
        vatAmount={totals.vatAmount}
        total={totals.total}
      />
    </Card>
  );

  return (
    <Layout>
      <div className="container mx-auto p-4 sm:p-6 pb-24 space-y-6 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        <AdminPageHeader
          title="Invoice Generator"
          description="Vytvářejte a spravujte faktury pro své klienty"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={downloadPDF}
                className="bg-card/50 backdrop-blur-sm border-0 shadow-sm rounded-xl px-4 h-10"
              >
                <Download className="h-4 w-4 mr-2" />
                Stáhnout PDF
              </Button>
              <Button
                onClick={saveInvoice}
                disabled={loading || !clientName || items.some(i => !i.description) || isInvoiceUser}
                variant="default"
                className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all rounded-xl px-4 h-10"
              >
                {isInvoiceUser ? <Lock className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                {loading ? "Ukládání..." : "Uložit fakturu"}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/invoices/storage')}
                className="bg-card/50 backdrop-blur-sm border-0 shadow-sm rounded-xl px-4 h-10"
              >
                <FileText className="h-4 w-4 mr-2" />
                Sklad
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/invoices/default-info')}
                className="bg-card/50 backdrop-blur-sm border-0 shadow-sm rounded-xl px-4 h-10"
              >
                <Settings className="h-4 w-4 mr-2" />
                Výchozí
              </Button>
            </div>
          }
        />

        {loading && <LoadingOverlay message="Zpracovávám..." />}

        {/* Desktop Layout: Grid side-by-side */}
        <div className="hidden lg:grid grid-cols-2 gap-8 h-[calc(100vh-250px)] overflow-hidden">
          {/* Form Section */}
          <div className="overflow-y-auto pr-2">
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden">
              {renderFormContent()}
            </Card>
          </div>

          {/* Preview Section */}
          <div className="overflow-y-auto bg-slate-200/30 backdrop-blur-sm rounded-3xl p-6 flex justify-center border border-dashed border-slate-300 transition-all duration-300 hover:border-primary/30">
            <div className="w-full max-w-[800px] h-fit">
              <Card className="p-0 bg-white border-0 shadow-2xl rounded-xl overflow-hidden">
                {renderPreview()}
              </Card>
            </div>
          </div>
        </div>

        {/* Mobile/Tablet Layout: Tabs */}
        <div className="lg:hidden">
          <Tabs defaultValue="form" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-card/50 backdrop-blur-sm border-0 shadow-lg rounded-xl p-1">
              <TabsTrigger value="form" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Úprava</TabsTrigger>
              <TabsTrigger value="preview" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Náhled</TabsTrigger>
            </TabsList>

            <TabsContent value="form">
              <Card className="p-6 bg-card/50 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden space-y-6">
                {renderFormContent()}
              </Card>

              <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-lg border-t z-50 lg:hidden shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                <Button
                  onClick={saveInvoice}
                  className="w-full text-lg font-bold rounded-xl shadow-lg shadow-primary/20"
                  variant="default"
                  disabled={loading || !clientName || items.some(i => !i.description) || isInvoiceUser}
                >
                  <Save className="h-5 w-5 mr-2" />
                  {loading ? "Ukládání..." : "Uložit fakturu"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="preview">
              <div className="bg-slate-200/30 backdrop-blur-sm rounded-3xl p-2 flex justify-center border border-dashed border-slate-300 min-h-[500px] overflow-hidden">
                <div className="w-full overflow-x-auto scrollbar-hide py-4">
                  <div className="w-[800px] mx-auto origin-top scale-[0.4] sm:scale-[0.55] md:scale-[0.75] transform-gpu transition-all">
                    <Card className="p-0 bg-white border-0 shadow-2xl rounded-xl overflow-hidden">
                      {renderPreview()}
                    </Card>
                  </div>
                </div>
              </div>

              <div className="mt-8 mb-24 px-4 text-center">
                <p className="text-xs text-muted-foreground italic">
                  Toto je pouze náhled dokumentu. Pro uložení se vraťte na kartu "Úprava".
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}