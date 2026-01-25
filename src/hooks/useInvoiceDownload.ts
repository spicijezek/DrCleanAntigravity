import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { downloadFile } from "@/utils/downloadUtils";
import { downloadPDF } from "@/utils/pdfUtils";

export const useInvoiceDownload = () => {
    const [generatingInvoiceId, setGeneratingInvoiceId] = useState<string | null>(null);
    const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
    const [previewInvoice, setPreviewInvoice] = useState<any>(null);

    const downloadInvoice = async (invoice: any, companyInfo: any) => {
        if (!invoice?.id) {
            toast.error("Faktura není k dispozici");
            return;
        }

        // 1. Prepare filename - format: [Client] f. [Variable Symbol]
        const sanitize = (val: string) => val.replace(/[\\/:*?"<>|]/g, '_').trim();
        const fileName = `${sanitize(invoice.client_name || 'klient')} f. ${sanitize(invoice.variable_symbol || invoice.invoice_number)}.pdf`;

        // 2. Try to download the stored PDF first (best for mobile reliability)
        if (invoice.pdf_path) {
            try {
                if (invoice.pdf_path.startsWith('http')) {
                    // It's an external URL (Cloudinary)
                    const success = await downloadFile(invoice.pdf_path, fileName);
                    if (success) return;
                } else {
                    // Supabase storage path
                    const { data, error } = await supabase.storage
                        .from('invoices').download(invoice.pdf_path);

                    if (!error && data) {
                        const url = URL.createObjectURL(data);
                        const success = await downloadFile(url, fileName);
                        if (success) return;
                    }
                }
            } catch (error) {
                console.warn('Standard download failed, falling back to generation:', error);
            }
        }

        // 3. Fallback to client-side generation
        toast.info("Generuji nové PDF...");
        setGeneratingInvoiceId(invoice.id);
        setPreviewInvoice(invoice);

        try {
            // Fetch items
            const { data: fetchedItems, error: itemsError } = await supabase
                .from('invoice_items')
                .select('*')
                .eq('invoice_id', invoice.id)
                .order('sort_order');

            if (itemsError) throw itemsError;

            // Deep copy to ensure we can modify descriptions without side effects or read-only issues
            let items = fetchedItems ? JSON.parse(JSON.stringify(fetchedItems)) : [];
            if (items.length === 0) {
                // Empty items, trigger fallback
                throw new Error("No items found");
            }

            // ENHANCEMENT: If the description is generic, try to refine it using booking details
            // This ensures PC/Admin (who can read items) sees the same specific name as Mobile (who hits fallback)
            if (items.length === 1 && ['Úklidové služby', 'Uklid', 'Služby', 'Services', 'Položka', 'Item', 'Fakturované služby'].some(d => items[0].description?.includes(d))) {
                console.log('Generic description detected, attempting to refine from booking...');
                try {
                    let bookingId = invoice.booking_id;
                    if (!bookingId) {
                        const { data: bookingLink } = await supabase
                            .from('bookings')
                            .select('id')
                            .eq('invoice_id', invoice.id)
                            .maybeSingle();
                        if (bookingLink) bookingId = bookingLink.id;
                    }

                    if (bookingId) {
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
                            if (serviceLabels[booking.service_type]) {
                                items[0].description = serviceLabels[booking.service_type];
                            }
                        }
                    }
                } catch (refineError) {
                    console.warn('Failed to refine generic description:', refineError);
                }
            }

            setInvoiceItems(items);

        } catch (error) {
            console.warn('Could not fetch specific invoice items (likely RLS or missing), attempting smart fallback:', error);

            let serviceDescription = 'Úklidové služby (Souhrn)';

            // Try to fetch booking service type to check specifically what service this was
            if (invoice) {
                try {
                    // Check if invoice has booking_id directly
                    let bookingId = invoice.booking_id;

                    if (!bookingId) {
                        // Or try to find booking linking to this invoice
                        const { data: bookingLink } = await supabase
                            .from('bookings')
                            .select('id')
                            .eq('invoice_id', invoice.id)
                            .maybeSingle();
                        if (bookingLink) bookingId = bookingLink.id;
                    }

                    if (bookingId) {
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
                            if (serviceLabels[booking.service_type]) {
                                serviceDescription = serviceLabels[booking.service_type];
                            }
                        }
                    }
                } catch (bookingError) {
                    console.warn('Could not fetch booking details for fallback:', bookingError);
                }
            }

            // Fallback: Create a single item representing the total with the specific service name
            setInvoiceItems([{
                id: 'fallback-item',
                description: serviceDescription,
                quantity: 1,
                unit_price: invoice.total || 0,
                total: invoice.total || 0,
                vat_rate: 0
            }]);
        }

        // Proceed to generation regardless of fetch success
        setTimeout(async () => {
            try {
                const elementId = "hidden-admin-invoice-preview";
                const success = await downloadPDF(elementId, fileName);
                if (!success) {
                    toast.error("Nepodařilo se vygenerovat PDF");
                } else {
                    toast.success("Faktura stažena");
                }
            } catch (e) {
                console.error("Download failed inside timeout:", e);
                toast.error("Chyba při stahování");
            } finally {
                setGeneratingInvoiceId(null);
            }
        }, 1000);
    };

    return {
        downloadInvoice,
        generatingInvoiceId,
        invoiceItems,
        previewInvoice,
        setGeneratingInvoiceId
    };
};
