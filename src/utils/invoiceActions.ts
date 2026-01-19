import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface InvoiceItem {
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    vat_rate: number;
}

export const generateInvoiceNumber = async () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');

    const { data: lastInvoice } = await supabase
        .from("invoices")
        .select("invoice_number")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    let sequence = 1;
    if (lastInvoice?.invoice_number) {
        // Expected format: YYMMXXX
        const lastNum = lastInvoice.invoice_number;
        if (lastNum.length >= 7) {
            const lastYear = lastNum.slice(0, 2);
            const lastMonth = lastNum.slice(2, 4);

            if (lastYear === year && lastMonth === month) {
                sequence = parseInt(lastNum.slice(-3)) + 1;
            }
        }
    }

    return `${year}${month}${sequence.toString().padStart(3, '0')}`;
};

export const createInvoiceFromBooking = async (bookingId: string) => {
    try {
        // 1. Fetch booking details
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select('*, clients(*)')
            .eq('id', bookingId)
            .single();

        if (bookingError || !booking) throw new Error('Booking not found');
        if (booking.invoice_id) return { success: true, alreadyExists: true, invoiceId: booking.invoice_id };

        // 2. Fetch company info
        const { data: companyInfo, error: companyError } = await supabase
            .from('company_info')
            .select('*')
            .eq('user_id', booking.user_id)
            .maybeSingle();

        if (companyError || !companyInfo) {
            console.warn('Company info not found for user', booking.user_id);
        }

        // 3. Generate invoice number and variable symbol
        const invoiceNumber = await generateInvoiceNumber();

        // 4. Prepare invoice items
        const serviceLabels: Record<string, string> = {
            home_cleaning: 'Úklid domácnosti',
            commercial_cleaning: 'Komerční úklid',
            window_cleaning: 'Mytí oken',
            post_construction_cleaning: 'Úklid po stavbě',
            upholstery_cleaning: 'Čištění čalounění'
        };

        const bookingDetails = booking.booking_details as any;
        const price = bookingDetails?.priceEstimate?.price || bookingDetails?.priceEstimate?.priceMin || 0;

        // 5. Calculate totals (assuming 21% VAT as default or from service type)
        const vatRate = 21;
        const subtotal = price;
        const vatAmount = subtotal * (vatRate / 100);
        const total = subtotal + vatAmount;

        // Handle any typing issues with clients relationship
        const client: any = booking.clients;

        // 6. Create invoice record
        const { data: invoice, error: invoiceError } = await supabase
            .from('invoices')
            .insert({
                user_id: booking.user_id,
                client_id: booking.client_id,
                booking_id: booking.id,
                invoice_number: invoiceNumber,
                variable_symbol: invoiceNumber, // Default to invoice number
                client_name: client?.name || 'Unknown',
                client_email: client?.email,
                client_phone: client?.phone,
                client_address: booking.address,
                client_vat: client?.company_id,
                date_created: new Date().toISOString().split('T')[0],
                date_performance: booking.scheduled_date ? booking.scheduled_date.split('T')[0] : new Date().toISOString().split('T')[0],
                date_due: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default 7 days
                payment_method: 'bank_transfer',
                status: 'issued',
                subtotal,
                vat_amount: vatAmount,
                total
            })
            .select()
            .single();

        if (invoiceError) throw invoiceError;

        // 7. Create invoice item
        const { error: itemError } = await supabase
            .from('invoice_items')
            .insert({
                invoice_id: invoice.id,
                description: serviceLabels[booking.service_type] || booking.service_type,
                quantity: 1,
                unit_price: subtotal,
                vat_rate: vatRate,
                total: subtotal,
                sort_order: 0
            });

        if (itemError) throw itemError;

        // 8. Update booking with invoice reference
        await supabase
            .from('bookings')
            .update({ invoice_id: invoice.id })
            .eq('id', booking.id);

        return { success: true, invoiceId: invoice.id, invoiceNumber };
    } catch (error: any) {
        console.error('Error creating invoice:', error);
        return { success: false, error: error.message };
    }
};
