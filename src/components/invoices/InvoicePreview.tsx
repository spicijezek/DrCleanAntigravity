import { Card } from "@/components/ui/card";

interface InvoicePreviewProps {
  companyInfo: any;
  invoiceNumber: string;
  clientName: string;
  clientVat?: string;
  clientDic?: string;
  clientAddress?: string;
  clientEmail?: string;
  clientPhone?: string;
  dateCreated: string;
  performanceDates: Array<{ id: string; startDate: string; endDate?: string }>;
  dateDue?: string;
  variableSymbol?: string;
  paymentMethod?: 'bank_transfer' | 'cash';
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    vat_rate: number;
  }>;
  notes?: string;
  subtotal: number;
  vatAmount: number;
  total: number;
}

export function InvoicePreview({
  companyInfo,
  invoiceNumber,
  clientName,
  clientVat,
  clientDic,
  clientAddress,
  clientEmail,
  clientPhone,
  dateCreated,
  performanceDates,
  dateDue,
  variableSymbol,
  paymentMethod = 'bank_transfer',
  items,
  notes,
  subtotal,
  vatAmount,
  total
}: InvoicePreviewProps) {
  const formatDate = (date: string) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('cs-CZ');
  };

  const formatPerformanceDates = () => {
    if (!performanceDates || performanceDates.length === 0) return '';
    
    return performanceDates.map(dateItem => {
      if (dateItem.endDate && dateItem.endDate !== dateItem.startDate) {
        // Format as range: "03-07.11.2025"
        const startDate = new Date(dateItem.startDate);
        const endDate = new Date(dateItem.endDate);
        
        const startDay = startDate.getDate();
        const endDay = endDate.getDate();
        const month = (endDate.getMonth() + 1).toString().padStart(2, '0');
        const year = endDate.getFullYear();
        
        // Check if same month
        if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
          return `${startDay}-${endDay}.${month}.${year}`;
        } else {
          return `${formatDate(dateItem.startDate)} - ${formatDate(dateItem.endDate)}`;
        }
      }
      return formatDate(dateItem.startDate);
    }).join(', ');
  };

  return (
    <Card id="invoice-preview" className="p-8 bg-white text-black print:shadow-none">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div className="flex-shrink-0">
          {companyInfo?.logo_url && (
            <img src={companyInfo.logo_url} alt="Logo" className="h-16" />
          )}
        </div>
        <div className="text-right">
          <h1 className="text-2xl font-bold text-black leading-none">Faktura</h1>
          <p className="text-sm text-gray-600 mt-1">DAŇOVÝ DOKLAD</p>
          <p className="text-xl font-semibold text-black mt-2">{invoiceNumber}</p>
        </div>
      </div>

      {/* Supplier and Client Info */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="font-bold text-sm mb-3 text-black uppercase">Dodavatel</h2>
          <div className="text-sm space-y-0.5">
            <p className="font-semibold">{companyInfo?.company_name || "Vaše společnost"}</p>
            {companyInfo?.address && <p>{companyInfo.address}</p>}
            {companyInfo?.city && <p>{companyInfo.postal_code} {companyInfo.city}</p>}
            {companyInfo?.ic && <p>IČO: {companyInfo.ic}</p>}
            {companyInfo?.dic && <p>DIČ: {companyInfo.dic}</p>}
          </div>
        </div>
        <div>
          <h2 className="font-bold text-sm mb-3 text-black uppercase">Odběratel</h2>
          <div className="text-sm space-y-0.5">
            <p className="font-semibold">{clientName || "Název klienta"}</p>
            {clientAddress && <p className="whitespace-pre-line">{clientAddress}</p>}
            {clientVat && <p>IČO: {clientVat}</p>}
            {clientDic && <p>DIČ: {clientDic}</p>}
            {clientEmail && <p>Email: {clientEmail}</p>}
            {clientPhone && <p>Tel: {clientPhone}</p>}
          </div>
        </div>
      </div>

      {/* Payment Info */}
      <div className="mb-8 p-4 bg-gray-50 rounded border border-gray-300">
        <h3 className="font-bold text-sm mb-3 text-black uppercase">Údaje o platbě</h3>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
          {companyInfo?.bank_account && (
            <div className="flex justify-between">
              <span className="text-gray-600">Bankovní účet:</span>
              <span className="font-medium">{companyInfo.bank_account}/{companyInfo.bank_code}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Datum vystavení:</span>
            <span className="font-medium">{formatDate(dateCreated)}</span>
          </div>
          {variableSymbol && (
            <div className="flex justify-between">
              <span className="text-gray-600">Variabilní symbol:</span>
              <span className="font-medium">{variableSymbol}</span>
            </div>
          )}
          {dateDue && (
            <div className="flex justify-between">
              <span className="text-gray-600">Datum splatnosti:</span>
              <span className="font-medium">{formatDate(dateDue)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Způsob platby:</span>
            <span className="font-medium">{paymentMethod === 'cash' ? 'Hotově' : 'Převodem'}</span>
          </div>
          {performanceDates && performanceDates.length > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Datum plnění:</span>
              <span className="font-medium">{formatPerformanceDates()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <h3 className="font-bold text-sm mb-3 text-black uppercase">Fakturujeme Vám následující položky</h3>
        <div className="rounded border border-gray-300 overflow-hidden">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                {items.some(item => item.quantity > 0) && (
                  <th className="border border-gray-300 p-2 text-center text-sm">Množství</th>
                )}
                <th className="border border-gray-300 p-2 text-left text-sm">Popis</th>
                <th className="border border-gray-300 p-2 text-center text-sm">DPH</th>
                <th className="border border-gray-300 p-2 text-right text-sm">
                  {items.some(item => item.quantity > 0) ? 'Cena/jedn.' : 'Cena'}
                </th>
                <th className="border border-gray-300 p-2 text-right text-sm">Celkem</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  {items.some(i => i.quantity > 0) && (
                    <td className="border border-gray-300 p-2 text-center align-middle">
                      {item.quantity > 0 ? item.quantity : '-'}
                    </td>
                  )}
                  <td className="border border-gray-300 p-2 align-middle">{item.description || "Popis položky"}</td>
                  <td className="border border-gray-300 p-2 text-center align-middle">{item.vat_rate} %</td>
                  <td className="border border-gray-300 p-2 text-right align-middle">{item.unit_price.toFixed(2)} Kč</td>
                  <td className="border border-gray-300 p-2 text-right font-medium align-middle">
                    {(item.quantity > 0 ? item.quantity * item.unit_price : item.unit_price).toFixed(2)} Kč
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary - only show if more than 1 item */}
      {items.length > 1 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3 text-black">Souhrn</h3>
          <table className="w-full border-collapse mb-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left text-sm">Sazba</th>
                <th className="border border-gray-300 p-2 text-right text-sm">Základ</th>
                <th className="border border-gray-300 p-2 text-right text-sm">DPH</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2">21 %</td>
                <td className="border border-gray-300 p-2 text-right">{subtotal.toFixed(2)} Kč</td>
                <td className="border border-gray-300 p-2 text-right">{vatAmount.toFixed(2)} Kč</td>
              </tr>
            </tbody>
          </table>
          
            <div className="text-right relative z-50" style={{ pageBreakInside: "avoid" }}>
              <p className="text-sm text-gray-600 mb-1">CELKEM K ÚHRADĚ</p>
              <p className="text-3xl font-extrabold text-black tracking-tight">{total.toFixed(2)} Kč</p>
            </div>
        </div>
      )}
      
      {/* Total for single item - simplified */}
      {items.length === 1 && (
        <div className="mb-6">
          <div className="text-right relative z-50" style={{ pageBreakInside: "avoid" }}>
            <p className="text-sm text-gray-600 mb-1">CELKEM K ÚHRADĚ</p>
            <p className="text-3xl font-extrabold text-black tracking-tight">{total.toFixed(2)} Kč</p>
          </div>
        </div>
      )}

      {/* Notes */}
      {notes && (
        <div className="mb-8">
          <h3 className="font-semibold mb-2 text-black">Poznámky</h3>
          <p className="text-sm text-gray-700 whitespace-pre-line">{notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 pt-6 border-t border-gray-300">
        <p className="font-semibold">Děkujeme za Vaši důvěru</p>
        <div className="mt-2 space-y-1">
          {companyInfo?.email && <p>Email: {companyInfo.email}</p>}
          {companyInfo?.phone && <p>Telefon: {companyInfo.phone}</p>}
          {companyInfo?.website && <p>Web: {companyInfo.website}</p>}
        </div>
      </div>
    </Card>
  );
}