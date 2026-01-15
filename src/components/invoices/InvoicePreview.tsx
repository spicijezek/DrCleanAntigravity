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
  datePaid?: string;
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
  datePaid,
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
    <Card id="invoice-preview" className="p-4 md:p-8 bg-white text-black print:shadow-none shadow-none border-none">
      {/* Header */}
      <div className="mb-4 md:mb-6 flex justify-between items-start">
        <div className="flex-shrink-0">
          {companyInfo?.logo_url && (
            <img src={companyInfo.logo_url} alt="Logo" className="h-12 md:h-16" />
          )}
        </div>
        <div className="text-right">
          <h1 className="text-xl md:text-2xl font-bold text-black leading-none uppercase">Faktura</h1>
          <p className="text-[10px] md:text-xs text-gray-500 mt-1 uppercase">Daňový doklad</p>
          <p className="text-lg md:text-xl font-bold text-black mt-1">{invoiceNumber}</p>
        </div>
      </div>

      {/* Supplier and Client Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
        <div>
          <h2 className="font-bold text-[11px] md:text-xs mb-2 md:mb-3 text-gray-500 uppercase border-b pb-1">Dodavatel</h2>
          <div className="text-xs md:text-sm space-y-0.5">
            <p className="font-bold text-base md:text-lg">{companyInfo?.company_name || "Vaše společnost"}</p>
            {companyInfo?.address && <p>{companyInfo.address}</p>}
            {companyInfo?.city && <p>{companyInfo.postal_code} {companyInfo.city}</p>}
            <div className="pt-2 flex flex-wrap gap-x-4">
              {companyInfo?.ic && <p><span className="text-gray-500">IČO:</span> {companyInfo.ic}</p>}
              {companyInfo?.dic && <p><span className="text-gray-500">DIČ:</span> {companyInfo.dic}</p>}
            </div>
          </div>
        </div>
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
          <h2 className="font-bold text-[11px] md:text-xs mb-2 md:mb-3 text-gray-500 uppercase border-b pb-1">Odběratel</h2>
          <div className="text-xs md:text-sm space-y-0.5">
            <p className="font-bold text-base md:text-lg">{clientName || "Název klienta"}</p>
            {clientAddress && <p className="whitespace-pre-line">{clientAddress}</p>}
            <div className="pt-2">
              {clientVat && <p><span className="text-gray-500">IČO:</span> {clientVat}</p>}
              {clientDic && <p><span className="text-gray-500">DIČ:</span> {clientDic}</p>}
              {clientEmail && <p><span className="text-gray-500">Email:</span> {clientEmail}</p>}
              {clientPhone && <p><span className="text-gray-500">Tel:</span> {clientPhone}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Info */}
      <div className="mb-6 md:mb-8 p-3 md:p-4 bg-gray-50 rounded border border-gray-200">
        <h3 className="font-bold text-[11px] md:text-xs mb-3 text-gray-500 uppercase border-b pb-1">Platební údaje</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-xs md:text-sm">
          {paymentMethod === 'bank_transfer' && companyInfo?.bank_account && (
            <div className="flex justify-between border-b border-gray-200 pb-1 sm:border-0 sm:pb-0">
              <span className="text-gray-500">Bankovní účet:</span>
              <span className="font-bold">{companyInfo.bank_account}/{companyInfo.bank_code}</span>
            </div>
          )}
          <div className="flex justify-between border-b border-gray-200 pb-1 sm:border-0 sm:pb-0">
            <span className="text-gray-500">Datum vystavení:</span>
            <span className="font-medium">{formatDate(dateCreated)}</span>
          </div>
          {paymentMethod === 'bank_transfer' && variableSymbol && (
            <div className="flex justify-between border-b border-gray-200 pb-1 sm:border-0 sm:pb-0">
              <span className="text-gray-500">Variabilní symbol:</span>
              <span className="font-bold">{variableSymbol}</span>
            </div>
          )}
          {dateDue && (
            <div className="flex justify-between border-b border-gray-200 pb-1 sm:border-0 sm:pb-0 text-red-600">
              <span className="text-red-500/70">Datum splatnosti:</span>
              <span className="font-bold">{formatDate(dateDue)}</span>
            </div>
          )}
          <div className="flex justify-between border-b border-gray-200 pb-1 sm:border-0 sm:pb-0">
            <span className="text-gray-500">Způsob platby:</span>
            <span className="font-medium">{paymentMethod === 'cash' ? 'Hotově' : 'Převodem'}</span>
          </div>
          {paymentMethod === 'cash' && datePaid && (
            <div className="flex justify-between border-b border-gray-200 pb-1 sm:border-0 sm:pb-0">
              <span className="text-gray-500">Datum úhrady:</span>
              <span className="font-medium">{formatDate(datePaid)}</span>
            </div>
          )}
          {performanceDates && performanceDates.length > 0 && (
            <div className="flex justify-between border-b border-gray-200 pb-1 sm:border-0 sm:pb-0">
              <span className="text-gray-500">Datum plnění:</span>
              <span className="font-medium">{formatPerformanceDates()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-6 md:mb-8">
        <div className="overflow-x-auto rounded border border-gray-200">
          <table className="w-full border-collapse text-xs md:text-sm">
            <thead>
              <tr className="bg-gray-100">
                {items.some(item => item.quantity > 0) && (
                  <th className="border-b border-gray-200 p-2 text-center font-bold text-gray-600">Množství</th>
                )}
                <th className="border-b border-gray-200 p-2 text-left font-bold text-gray-600">Popis položky</th>
                <th className="border-b border-gray-200 p-2 text-center font-bold text-gray-600">DPH</th>
                <th className="border-b border-gray-200 p-2 text-right font-bold text-gray-600 whitespace-nowrap">
                  {items.some(item => item.quantity > 0) ? 'Cena/jedn.' : 'Cena'}
                </th>
                <th className="border-b border-gray-200 p-2 text-right font-bold text-gray-600 whitespace-nowrap">Celkem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item, index) => (
                <tr key={index}>
                  {items.some(i => i.quantity > 0) && (
                    <td className="p-2 text-center align-middle">
                      {item.quantity > 0 ? item.quantity : '-'}
                    </td>
                  )}
                  <td className="p-2 align-middle font-medium">{item.description || "Popis položky"}</td>
                  <td className="p-2 text-center align-middle whitespace-nowrap">{item.vat_rate} %</td>
                  <td className="p-2 text-right align-middle whitespace-nowrap">{item.unit_price.toLocaleString('cs-CZ', { minimumFractionDigits: 2 })} Kč</td>
                  <td className="p-2 text-right font-bold align-middle whitespace-nowrap">
                    {(item.quantity > 0 ? item.quantity * item.unit_price : item.unit_price).toLocaleString('cs-CZ', { minimumFractionDigits: 2 })} Kč
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Section */}
      <div className="flex flex-col md:flex-row justify-end gap-8 mb-8">
        <div className="w-full md:w-64 space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Základ daně:</span>
            <span>{subtotal.toLocaleString('cs-CZ', { minimumFractionDigits: 2 })} Kč</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500 pb-2 border-b">
            <span>DPH (21 %):</span>
            <span>{vatAmount.toLocaleString('cs-CZ', { minimumFractionDigits: 2 })} Kč</span>
          </div>
          <div className="flex justify-between items-baseline pt-1">
            <span className="text-sm font-bold uppercase">Celkem k úhradě:</span>
            <div className="text-right">
              <span className="text-2xl md:text-3xl font-black text-black tracking-tight whitespace-nowrap">
                {total.toLocaleString('cs-CZ', { minimumFractionDigits: 2 })} Kč
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {notes && (
        <div className="mb-8 p-3 bg-slate-50 rounded border-l-4 border-slate-300">
          <h3 className="font-bold text-[11px] md:text-xs mb-1 text-gray-500 uppercase">Poznámka</h3>
          <p className="text-xs md:text-sm text-gray-700 whitespace-pre-line leading-relaxed">{notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-gray-400 pt-6 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <p className="font-bold text-gray-500">Děkujeme za spolupráci!</p>
        </div>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
          {companyInfo?.email && <p><span className="text-gray-300">Email:</span> {companyInfo.email}</p>}
          {companyInfo?.phone && <p><span className="text-gray-300">Tel:</span> {companyInfo.phone}</p>}
          {companyInfo?.website && <p><span className="text-gray-300">Web:</span> {companyInfo.website}</p>}
        </div>
      </div>
    </Card>
  );
}