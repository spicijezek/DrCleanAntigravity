import { InvoicePreview } from '@/components/invoices/InvoicePreview';
import { Booking } from '@/types/client-dashboard';

interface HiddenInvoiceContainerProps {
    generatingInvoiceId: string | null;
    previewInvoice: any;
    companyInfo: any;
    invoiceItems: any[];
    bookings: Booking[];
    clientData?: any;
}

export function HiddenInvoiceContainer({
    generatingInvoiceId,
    previewInvoice,
    companyInfo,
    invoiceItems,
    bookings,
    clientData
}: HiddenInvoiceContainerProps) {
    if (!generatingInvoiceId || !companyInfo || !previewInvoice || previewInvoice.id !== generatingInvoiceId) {
        return null;
    }

    const booking = bookings.find(b => b.invoice?.id === previewInvoice.id);

    return (
        <div style={{ position: 'fixed', left: '-2000px', top: 0, width: '794px', zIndex: -1 }}>
            <div id="hidden-admin-invoice-preview" className="bg-white" style={{ position: 'relative' }}>
                <InvoicePreview
                    companyInfo={companyInfo}
                    invoiceNumber={previewInvoice.invoice_number}
                    clientName={previewInvoice.client_name}
                    clientVat={previewInvoice.client_vat || booking?.client?.company_id || clientData?.company_id}
                    clientDic={previewInvoice.client_dic || booking?.client?.dic || clientData?.dic}
                    clientAddress={previewInvoice.client_address || ""}
                    clientEmail={previewInvoice.client_email || ""}
                    clientPhone={previewInvoice.client_phone || ""}
                    dateCreated={previewInvoice.date_created}
                    performanceDates={previewInvoice.date_performance
                        ? [{ id: '1', startDate: previewInvoice.date_performance }]
                        : [{ id: '1', startDate: booking?.scheduled_date || "" }]}
                    dateDue={previewInvoice.date_due}
                    variableSymbol={previewInvoice.variable_symbol}
                    items={invoiceItems}
                    notes={previewInvoice.notes || ""}
                    subtotal={Number(previewInvoice.subtotal || 0)}
                    vatAmount={Number(previewInvoice.vat_amount || 0)}
                    total={Number(previewInvoice.total || 0)}
                    paymentMethod={previewInvoice.payment_method as any || "bank_transfer"}
                    datePaid={previewInvoice.date_paid || undefined}
                />
            </div>
        </div>
    );
}
