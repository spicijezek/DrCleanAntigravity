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
        const startDate = new Date(dateItem.startDate);
        const endDate = new Date(dateItem.endDate);

        const startDay = startDate.getDate();
        const endDay = endDate.getDate();
        const month = (endDate.getMonth() + 1).toString().padStart(2, '0');
        const year = endDate.getFullYear();

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
    <Card id="invoice-preview" className="p-8 bg-white text-slate-900 print:shadow-none shadow-none border-none font-sans leading-relaxed max-w-[794px] mx-auto min-h-[1123px] flex flex-col relative overflow-hidden">
      {/* Top Edge Gradient Line */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary to-indigo-600 opacity-80" />

      {/* Header */}
      <div className="flex justify-between items-start mb-12 mt-4">
        {/* Left: Logo */}
        <div>
          {companyInfo?.logo_url ? (
            <img src={companyInfo.logo_url} alt="Logo" className="h-16 w-auto object-contain" />
          ) : (
            <div className="flex items-center gap-2 text-2xl font-black tracking-tighter text-slate-900">
              <div className="h-8 w-8 bg-teal-600 rounded-lg flex items-center justify-center text-white text-lg">D</div>
              Dr.Clean
            </div>
          )}
        </div>

        {/* Right: Invoice Info */}
        <div className="text-right">
          <h1 className="text-2xl font-bold text-slate-900">Faktura</h1>
          <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">DAŇOVÝ DOKLAD</p>
          <p className="text-3xl font-bold text-slate-900 tracking-tight">{invoiceNumber}</p>
        </div>
      </div>

      {/* Addresses */}
      <div className="grid grid-cols-2 gap-12 mb-12">
        {/* Dodavatel */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-transparent">DODAVATEL</h3>
          <div className="text-sm leading-relaxed text-slate-900">
            <p className="font-bold text-base mb-1">{companyInfo?.company_name || "Vaše společnost"}</p>
            <p>{companyInfo?.address}</p>
            <p>{companyInfo?.postal_code} {companyInfo?.city}</p>
            <p className="mt-2 text-slate-700">IČO: {companyInfo?.ic}</p>
            {companyInfo?.dic && <p className="text-slate-700">DIČ: {companyInfo.dic}</p>}
          </div>
        </div>

        {/* Odběratel */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-transparent">ODBĚRATEL</h3>
          <div className="text-sm leading-relaxed text-slate-900">
            <p className="font-bold text-base mb-1">{clientName || "Jméno klienta"}</p>
            <div className="whitespace-pre-line">
              {clientAddress}
            </div>
            <div className="mt-2 space-y-0.5">
              {clientVat && <p className="text-slate-700">IČO: {clientVat}</p>}
              {clientDic && <p className="text-slate-700">DIČ: {clientDic}</p>}
              {clientEmail && <p className="text-slate-700">Email: {clientEmail}</p>}
              {clientPhone && <p className="text-slate-700">Tel: {clientPhone}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Information Box */}
      <div className="mb-10 border border-primary/10 rounded-xl p-6 bg-gradient-to-br from-primary/[0.03] to-indigo-600/[0.03] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-indigo-600 opacity-50" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">ÚDAJE O PLATBĚ</h3>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          {/* Left Col */}
          <div className="grid grid-cols-[120px_1fr] gap-1">
            <span className="text-slate-500 font-medium">Bankovní účet:</span>
            <span className="font-bold text-slate-900">{companyInfo?.bank_account}/{companyInfo?.bank_code}</span>

            <span className="text-slate-500 font-medium">Variabilní symbol:</span>
            <span className="font-bold text-slate-900">{variableSymbol}</span>

            <span className="text-slate-500 font-medium">Způsob platby:</span>
            <span className="font-bold text-slate-900">
              {paymentMethod === 'cash' ? 'Hotově' : 'Převodem'}
            </span>
          </div>

          {/* Right Col */}
          <div className="grid grid-cols-[120px_1fr] gap-1">
            <span className="text-slate-500 font-medium">Datum vystavení:</span>
            <span className="font-bold text-slate-900">{formatDate(dateCreated)}</span>

            <span className="text-slate-500 font-medium">Datum splatnosti:</span>
            <span className="font-bold text-slate-900">{formatDate(dateDue || '')}</span>

            <span className="text-slate-500 font-medium">Datum plnění:</span>
            <span className="font-bold text-slate-900">{formatPerformanceDates() || formatDate(dateCreated)}</span>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">FAKTURUJEME VÁM NÁSLEDUJÍCÍ POLOŽKY</h3>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 border-y border-slate-200 text-xs font-bold text-slate-900">
              <th className="py-3 px-4 w-1/2">Popis</th>
              <th className="py-3 px-4 text-center">DPH</th>
              <th className="py-3 px-4 text-right">Cena</th>
              <th className="py-3 px-4 text-right">Celkem</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {items.map((item, index) => (
              <tr key={index} className="border-b border-slate-200">
                <td className="py-3 px-4 text-slate-900 font-medium">
                  {item.description || "Služba"}
                  {item.quantity > 1 && <span className="text-slate-500 font-normal ml-2">({item.quantity}x)</span>}
                </td>
                <td className="py-3 px-4 text-center text-slate-600">{item.vat_rate}%</td>
                <td className="py-3 px-4 text-right text-slate-900">{item.unit_price.toLocaleString('cs-CZ', { minimumFractionDigits: 2 })} Kč</td>
                <td className="py-3 px-4 text-right font-bold text-slate-900">
                  {(item.quantity > 0 ? item.quantity * item.unit_price : item.unit_price).toLocaleString('cs-CZ', { minimumFractionDigits: 2 })} Kč
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Total Section */}
      <div className="flex flex-col items-end mb-20 pr-4">
        {vatAmount > 0 && (
          <div className="w-full max-w-[200px] mb-4 space-y-1 text-sm border-b border-slate-100 pb-4">
            <div className="flex justify-between items-center text-slate-500">
              <span className="font-medium">Základ daně:</span>
              <span className="font-bold text-slate-700">{subtotal.toLocaleString('cs-CZ', { minimumFractionDigits: 2 })} Kč</span>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span className="font-medium">DPH:</span>
              <span className="font-bold text-slate-700">{vatAmount.toLocaleString('cs-CZ', { minimumFractionDigits: 2 })} Kč</span>
            </div>
          </div>
        )}
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">CELKEM K ÚHRADĚ</span>
        <div className="text-4xl font-black text-slate-900 tracking-tight">
          {total.toLocaleString('cs-CZ', { minimumFractionDigits: 2 })} Kč
        </div>
      </div>

      {/* Notes (if any, pushed down) */}
      {notes && (
        <div className="mb-12 text-sm text-slate-600 italic px-4 border-l-2 border-slate-200">
          <span className="font-bold not-italic text-slate-900">Poznámka:</span> {notes}
        </div>
      )}

      {/* Footer - Centered */}
      <div className="mt-auto pt-12 text-center pb-8">
        <h4 className="font-bold text-slate-700 text-sm mb-4">Děkujeme za Vaši důvěru</h4>
        <div className="text-xs text-slate-500 space-y-1">
          {companyInfo?.email && <p>Email: {companyInfo.email}</p>}
          {companyInfo?.phone && <p>Telefon: {companyInfo.phone}</p>}
          {companyInfo?.website && <p>Web: {companyInfo.website}</p>}
        </div>
      </div>

      {/* Bottom Edge Gradient Line */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary to-indigo-600 opacity-80" />

    </Card>
  );
}