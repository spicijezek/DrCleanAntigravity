import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Download, Save, FileText, Settings, Lock } from "lucide-react";
import { InvoicePreview } from "@/components/invoices/InvoicePreview";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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
    dueDate.setDate(dueDate.getDate() + 14);
    return dueDate.toISOString().split('T')[0];
  });
  const [variableSymbol, setVariableSymbol] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'cash'>('bank_transfer');
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
          setClientAddress(client.address || booking.address);
          setClientEmail(client.email || '');
          setClientPhone(client.phone || '');
          setSelectedClientId(booking.client_id);

          // Add booking service as first item
          const serviceLabels: Record<string, string> = {
            home_cleaning: 'Úklid domácnosti',
            commercial_cleaning: 'Komerční úklid',
            window_cleaning: 'Mytí oken',
            post_construction_cleaning: 'Úklid po stavbě',
            upholstery_cleaning: 'Čištění čalounění'
          };

          setItems([{
            id: crypto.randomUUID(),
            description: serviceLabels[booking.service_type] || booking.service_type,
            quantity: 1,
            unit_price: 0,
            vat_rate: 21
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
      setClientDic(client.vat_id || "");
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

    try {
      const totals = calculateTotals();

      let resolvedClientId: string | null =
        selectedClientId ||
        (clients.find(
          (c) =>
            (c.name || "").trim().toLowerCase() ===
            (clientName || "").trim().toLowerCase()
        )?.id ?? null);

      // If admin assigned the invoice to a booking, always resolve the client from that booking
      // so the client can see it in Dashboard (green box) and in Faktury.
      if (!resolvedClientId && selectedBookingId && selectedBookingId !== "none") {
        const { data: bookingClient, error: bookingClientError } = await supabase
          .from("bookings")
          .select("client_id")
          .eq("id", selectedBookingId)
          .maybeSingle();

        if (bookingClientError) throw bookingClientError;
        resolvedClientId = bookingClient?.client_id ?? null;
      }

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

      // Generate and upload PDF
      const pdf = await generateInvoicePDF();
      if (pdf) {
        const pdfBlob = pdf.output('blob');
        const fileName = `${user.id}/${invoiceNumber}.pdf`;

        const { error: uploadError } = await supabase.storage
          .from('invoices')
          .upload(fileName, pdfBlob, { upsert: true });

        if (uploadError) throw uploadError;

        // Update invoice with PDF path
        await supabase
          .from("invoices")
          .update({ pdf_path: fileName })
          .eq("id", invoice.id);
      }

      // Link invoice to booking if one is selected
      if (selectedBookingId && selectedBookingId !== "none") {
        await supabase
          .from("bookings")
          .update({ invoice_id: invoice.id })
          .eq("id", selectedBookingId);
      }

      toast.success("Faktura byla úspěšně uložena");

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
      newDueDate.setDate(newDueDate.getDate() + 14);
      setDateDue(newDueDate.toISOString().split('T')[0]);
      setVariableSymbol("");
      setNotes("");
      setPaymentMethod('bank_transfer');
      setSelectedClientId("");
      setSelectedJobId("");
      setSelectedBookingId("");
      setItems([{ id: crypto.randomUUID(), description: "", quantity: 0, unit_price: 0, vat_rate: 0 }]);

      // Refresh completed bookings list
      fetchCompletedBookings();
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast.error("Chyba při ukládání faktury");
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Invoice Generator</h1>
            <p className="text-muted-foreground">Create & Preview Invoices</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={downloadPDF} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button
              onClick={saveInvoice}
              disabled={loading || !clientName || items.some(i => !i.description) || isInvoiceUser}
              className={isInvoiceUser ? "opacity-50 cursor-not-allowed" : ""}
            >
              {isInvoiceUser ? <Lock className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {loading ? "Saving..." : "Save Invoice"}
            </Button>
            <Button
              onClick={() => navigate('/invoices/storage')}
              variant="outline"
              disabled={isInvoiceUser}
              className={isInvoiceUser ? "opacity-50 cursor-not-allowed" : ""}
            >
              {isInvoiceUser ? <Lock className="h-4 w-4 mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
              Storage
            </Button>
            <Button onClick={() => navigate('/invoices/default-info')} variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Default Info
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Section */}
          <Card className="p-4 md:p-6 space-y-6 overflow-y-auto h-auto lg:h-[calc(100vh-200px)]">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Invoice Details</h2>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Invoice Number</Label>
                  <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
                </div>
                <div>
                  <Label>Date of Issue</Label>
                  <Input type="date" value={dateCreated} onChange={(e) => {
                    setDateCreated(e.target.value);
                    setPerformanceDates([{ id: crypto.randomUUID(), startDate: e.target.value }]);
                    const dueDate = new Date(e.target.value);
                    dueDate.setDate(dueDate.getDate() + 14);
                    setDateDue(dueDate.toISOString().split('T')[0]);
                  }} />
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input type="date" value={dateDue} onChange={(e) => setDateDue(e.target.value)} />
                </div>
              </div>

              {/* Booking Assignment */}
              <div>
                <Label>Přiřadit k rezervaci (volitelné)</Label>
                <Select value={selectedBookingId} onValueChange={setSelectedBookingId}>
                  <SelectTrigger>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Variable Symbol</Label>
                  <Input value={variableSymbol} onChange={(e) => setVariableSymbol(e.target.value)} placeholder="Auto-filled" disabled />
                </div>
                <div>
                  <Label>Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'bank_transfer' | 'cash')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Převodem</SelectItem>
                      <SelectItem value="cash">Hotově</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Date(s) of Performance</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPerformanceDates([...performanceDates, { id: crypto.randomUUID(), startDate: new Date().toISOString().split('T')[0] }])}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Date
                  </Button>
                </div>
                {performanceDates.map((dateItem, index) => (
                  <div key={dateItem.id} className="flex gap-2 items-start">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <div>
                        <Input
                          type="date"
                          value={dateItem.startDate}
                          onChange={(e) => {
                            const updated = [...performanceDates];
                            updated[index].startDate = e.target.value;
                            setPerformanceDates(updated);
                          }}
                        />
                      </div>
                      <div>
                        <Input
                          type="date"
                          value={dateItem.endDate || ''}
                          onChange={(e) => {
                            const updated = [...performanceDates];
                            updated[index].endDate = e.target.value || undefined;
                            setPerformanceDates(updated);
                          }}
                          placeholder="End date (optional)"
                        />
                      </div>
                    </div>
                    {performanceDates.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPerformanceDates(performanceDates.filter(d => d.id !== dateItem.id))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <h3 className="text-lg font-semibold pt-4">Select Existing Client</h3>

              <Select value={selectedClientId} onValueChange={handleClientSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedClientId && jobs.length > 0 && (
                <div>
                  <Label>Select Job (Optional)</Label>
                  <Select value={selectedJobId} onValueChange={handleJobSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select job to autofill..." />
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

              <h3 className="text-lg font-semibold pt-4">Client Information</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>IČO *</Label>
                  <div className="flex gap-2">
                    <Input
                      value={clientIco}
                      onChange={(e) => setClientIco(e.target.value)}
                      placeholder="Company ID"
                      onBlur={(e) => fetchCompanyFromAres(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label>DIČ</Label>
                  <Input value={clientDic} onChange={(e) => setClientDic(e.target.value)} placeholder="Tax ID" />
                </div>
              </div>

              <div>
                <Label>Client Name *</Label>
                <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Name or company" />
              </div>

              <div>
                <Label>Address</Label>
                <Textarea value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} placeholder="Street, City, Postal Code" rows={2} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />
                </div>
              </div>

              <h3 className="text-lg font-semibold pt-4">Invoice Items</h3>

              {items.map((item, index) => (
                <Card key={item.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Item {index + 1}</span>
                    {items.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div>
                    <Label>Description *</Label>
                    <Input value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)} placeholder="Service or product description" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        placeholder="0 = no qty"
                      />
                    </div>
                    <div>
                      <Label>{item.quantity > 0 ? 'Price/Unit' : 'Price'}</Label>
                      <Input type="number" min="0" step="0.01" value={item.unit_price} onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)} />
                    </div>
                    <div>
                      <Label>VAT %</Label>
                      <Input type="number" min="0" step="1" value={item.vat_rate} onChange={(e) => updateItem(item.id, 'vat_rate', parseFloat(e.target.value) || 0)} />
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Total: {(item.quantity > 0 ? item.quantity * item.unit_price : item.unit_price).toFixed(2)} CZK (+ VAT: {((item.quantity > 0 ? item.quantity * item.unit_price : item.unit_price) * item.vat_rate / 100).toFixed(2)} CZK)
                  </div>
                </Card>
              ))}

              <Button onClick={addItem} variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>

              <div>
                <Label>Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional information" rows={3} />
              </div>

              <div className="pt-4 space-y-2 border-t">
                <div className="flex justify-between text-lg">
                  <span>Subtotal:</span>
                  <span>{totals.subtotal.toFixed(2)} CZK</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span>VAT:</span>
                  <span>{totals.vatAmount.toFixed(2)} CZK</span>
                </div>
                <div className="flex justify-between text-xl font-bold">
                  <span>Total:</span>
                  <span>{totals.total.toFixed(2)} CZK</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Preview Section */}
          <div className="h-[calc(100vh-200px)] overflow-y-auto">
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
              variableSymbol={variableSymbol}
              paymentMethod={paymentMethod}
              items={items}
              notes={notes}
              subtotal={totals.subtotal}
              vatAmount={totals.vatAmount}
              total={totals.total}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}