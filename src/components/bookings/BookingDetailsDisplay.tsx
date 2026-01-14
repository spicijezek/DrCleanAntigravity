interface BookingDetailsDisplayProps {
  bookingDetails: any;
  serviceType: string;
  showPrice?: boolean;
}

// Helper to safely get a value from multiple possible field names
const getValue = (obj: any, ...keys: string[]): any => {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      return obj[key];
    }
  }
  return undefined;
};

export function BookingDetailsDisplay({ bookingDetails, serviceType, showPrice = true }: BookingDetailsDisplayProps) {
  if (!bookingDetails) return null;

  const translateDirtiness = (value: any) => {
    if (!value) return undefined;
    const str = String(value).toLowerCase();
    if (str === 'light' || str === 'nizka' || str === 'nizke') return 'Nízké';
    if (str === 'medium' || str === 'stredni' || str === 'střední') return 'Střední';
    if (str === 'heavy' || str === 'vysoka' || str === 'vysoke' || str === 'vysoké') return 'Vysoké';
    return value;
  };

  const translateFrequency = (value: any) => {
    if (!value) return undefined;
    const str = String(value).toLowerCase();
    if (str === 'weekly' || str === 'tydne' || str === 'týdně') return 'Týdně';
    if (str === 'biweekly' || str === 'ctyrtydne' || str === 'dvoutýdně') return 'Každé 2 týdny';
    if (str === 'monthly' || str === 'mesicne' || str === 'měsíčně') return 'Měsíčně';
    if (str === 'oneTime' || str === 'jednorazove' || str === 'jednorázově') return 'Jednorázově';
    if (str === 'daily' || str === 'denne' || str === 'denně') return 'Denně';
    return value;
  };

  const renderWindowCleaningDetailsInline = () => {
    const windowCount = getValue(bookingDetails, 'pocet_oken');
    const windowArea = getValue(bookingDetails, 'plocha_oken_m2');
    const windowDirtiness = getValue(bookingDetails, 'znecisteni_okna');
    const windowObjectType = getValue(bookingDetails, 'typ_objektu_okna');

    if (!windowArea && !windowCount) return null;

    return (
      <div className="ml-3 mb-2 p-2 bg-muted/50 rounded-md">
        <p className="font-medium text-sm mb-1">Mytí oken</p>
        <div className="space-y-0.5 text-sm">
          {windowArea && <p>• Plocha: {windowArea} m²</p>}
          {windowCount && <p>• Počet oken: {windowCount}</p>}
          {windowDirtiness && <p>• Znečištění: {translateDirtiness(windowDirtiness)}</p>}
          {windowObjectType && <p>• Typ objektu: {windowObjectType}</p>}
        </div>
      </div>
    );
  };

  const renderUpholsteryCleaningDetailsInline = () => {
    const koberce = getValue(bookingDetails, 'koberce');
    const sedacka = getValue(bookingDetails, 'sedacka');
    const matrace = getValue(bookingDetails, 'matrace');
    const kresla = getValue(bookingDetails, 'kresla');
    const zidle = getValue(bookingDetails, 'zidle');

    if (!koberce && !sedacka && !matrace && !kresla && !zidle) return null;

    return (
      <div className="ml-3 mb-2 p-2 bg-muted/50 rounded-md">
        <p className="font-medium text-sm mb-1">Čištění čalounění</p>
        <div className="space-y-1 text-sm">
          {koberce && (
            <div>
              <p className="font-medium">• Koberce:</p>
              <div className="ml-4 space-y-0.5">
                {getValue(bookingDetails, 'typ_koberec') && <p>- Typ: {getValue(bookingDetails, 'typ_koberec')}</p>}
                {getValue(bookingDetails, 'plocha_koberec') && <p>- Plocha: {getValue(bookingDetails, 'plocha_koberec')} m²</p>}
                {getValue(bookingDetails, 'znecisteni_koberec') && <p>- Znečištění: {translateDirtiness(getValue(bookingDetails, 'znecisteni_koberec'))}</p>}
              </div>
            </div>
          )}
          {sedacka && (
            <div>
              <p className="font-medium">• Sedačka:</p>
              <div className="ml-4 space-y-0.5">
                {getValue(bookingDetails, 'velikost_sedacka') && <p>- Velikost: {getValue(bookingDetails, 'velikost_sedacka')}</p>}
                {getValue(bookingDetails, 'znecisteni_sedacka') && <p>- Znečištění: {translateDirtiness(getValue(bookingDetails, 'znecisteni_sedacka'))}</p>}
              </div>
            </div>
          )}
          {matrace && (
            <div>
              <p className="font-medium">• Matrace:</p>
              <div className="ml-4 space-y-0.5">
                {getValue(bookingDetails, 'velikost_matrace') && <p>- Velikost: {getValue(bookingDetails, 'velikost_matrace')}</p>}
                {getValue(bookingDetails, 'strany_matrace') && <p>- Strany: {getValue(bookingDetails, 'strany_matrace')}</p>}
                {getValue(bookingDetails, 'znecisteni_matrace') && <p>- Znečištění: {translateDirtiness(getValue(bookingDetails, 'znecisteni_matrace'))}</p>}
              </div>
            </div>
          )}
          {kresla && (
            <div>
              <p className="font-medium">• Křesla:</p>
              <div className="ml-4 space-y-0.5">
                {getValue(bookingDetails, 'pocet_kresla') !== undefined && <p>- Počet: {getValue(bookingDetails, 'pocet_kresla')}</p>}
                {getValue(bookingDetails, 'znecisteni_kresla') && <p>- Znečištění: {translateDirtiness(getValue(bookingDetails, 'znecisteni_kresla'))}</p>}
              </div>
            </div>
          )}
          {zidle && (
            <div>
              <p className="font-medium">• Židle:</p>
              <div className="ml-4 space-y-0.5">
                {getValue(bookingDetails, 'pocet_zidle') !== undefined && <p>- Počet: {getValue(bookingDetails, 'pocet_zidle')}</p>}
                {getValue(bookingDetails, 'znecisteni_zidle') && <p>- Znečištění: {translateDirtiness(getValue(bookingDetails, 'znecisteni_zidle'))}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const translateHouseholdType = (value: any) => {
    if (!value) return undefined;
    const str = String(value).toLowerCase();
    if (str === 'byt' || str === 'apartment') return 'Byt';
    if (str === 'rodinny_dum' || str === 'house' || str === 'rodinný dům') return 'Rodinný dům';
    return value;
  };

  const translateEquipmentOption = (value: any) => {
    if (!value) return undefined;
    const str = String(value).toLowerCase();
    if (str === 'with' || str === 'ano' || str === 'mam') return 'Mám vlastní vybavení';
    if (str === 'without' || str === 'ne' || str === 'nemam') return 'Nemám vybavení (příplatek 290 Kč)';
    return value;
  };

  const translateCleaningType = (value: any) => {
    if (!value) return undefined;
    const str = String(value).toLowerCase();
    if (str === 'firmy' || str === 'firemni' || str === 'office') return 'Firemní úklid';
    if (str === 'domacnosti' || str === 'domacnost' || str === 'home') return 'Úklid domácnosti';
    return value;
  };

  const renderHomeCleaningDetails = () => {
    const cleaningType = getValue(bookingDetails, 'cleaning_type', 'typ_uklidu');
    const area = getValue(bookingDetails, 'area', 'plocha_m2', 'plocha');
    const bathrooms = getValue(bookingDetails, 'bathrooms', 'pocet_koupelen', 'pocet_wc');
    const kitchens = getValue(bookingDetails, 'kitchens', 'pocet_kuchyni', 'pocet_kuchynek');
    const dirtiness = getValue(bookingDetails, 'dirtiness', 'znecisteni');
    const frequency = getValue(bookingDetails, 'frequency', 'frekvence');
    const householdType = getValue(bookingDetails, 'typ_domacnosti', 'household_type');
    const equipmentOption = getValue(bookingDetails, 'equipment_option', 'vybaveni');
    const supplies = getValue(bookingDetails, 'supplies', 'pomucky') || [];
    const extras = getValue(bookingDetails, 'doplnky', 'extras', 'extraServices', 'doplnky_home') || [];
    const notes = getValue(bookingDetails, 'notes', 'poznamky');

    return (
      <div className="space-y-1">
        {cleaningType && <p><span className="font-medium">Typ úklidu:</span> {translateCleaningType(cleaningType)}</p>}
        {householdType && <p><span className="font-medium">Typ domácnosti:</span> {translateHouseholdType(householdType)}</p>}
        {area !== undefined && <p><span className="font-medium">Plocha:</span> {area} m²</p>}
        {bathrooms !== undefined && <p><span className="font-medium">Počet koupelen:</span> {bathrooms}</p>}
        {kitchens !== undefined && <p><span className="font-medium">Počet kuchyní:</span> {kitchens}</p>}
        {dirtiness !== undefined && <p><span className="font-medium">Znečištění:</span> {translateDirtiness(dirtiness)}</p>}
        {frequency !== undefined && <p><span className="font-medium">Frekvence:</span> {translateFrequency(frequency)}</p>}
        {equipmentOption && <p><span className="font-medium">Vybavení:</span> {translateEquipmentOption(equipmentOption)}</p>}
        {supplies?.length > 0 && (
          <div className="pt-2">
            <p className="font-medium">Pomůcky klienta:</p>
            <p className="text-sm">{supplies.join(', ')}</p>
          </div>
        )}

        {/* Display additional services with their details */}
        {extras?.length > 0 && (
          <div className="pt-2 border-t mt-2">
            <p className="font-medium text-sm mb-2">Přidané služby:</p>
            {extras.includes('Mytí oken') && renderWindowCleaningDetailsInline()}
            {extras.includes('Čištění čalounění') && renderUpholsteryCleaningDetailsInline()}
          </div>
        )}
      </div>
    );
  };

  const renderOfficeCleaningDetails = () => {
    const area = getValue(bookingDetails, 'officeArea', 'plocha_m2', 'plocha');
    const spaceType = getValue(bookingDetails, 'officeSpaceType', 'typ_prostoru');
    const dirtiness = getValue(bookingDetails, 'officeDirtiness', 'znecisteni', 'znecisteni_office');
    const frequency = getValue(bookingDetails, 'officeFrequency', 'frekvence', 'frekvence_office');
    const workstations = getValue(bookingDetails, 'officeWorkstations', 'pocet_pracovist', 'workstations');
    const bathrooms = getValue(bookingDetails, 'officeBathrooms', 'pocet_wc');
    const kitchens = getValue(bookingDetails, 'officeKitchens', 'pocet_kuchynek', 'pocet_kuchyni');
    const equipmentOption = getValue(bookingDetails, 'equipment_option', 'vybaveni');
    const extras = getValue(bookingDetails, 'doplnky', 'doplnky_office') || [];
    const notes = getValue(bookingDetails, 'notes', 'poznamky');

    const translateSpaceType = (value: any) => {
      if (!value) return value;
      const str = String(value).toLowerCase();
      if (str === 'office' || str === 'kancelar' || str === 'kancelář') return 'Kancelář';
      if (str === 'openspace' || str === 'open_space') return 'Open space';
      if (str === 'coworking') return 'Coworking';
      if (str === 'warehouse' || str === 'sklad' || str === 'skladiště') return 'Skladiště';
      return value;
    };

    return (
      <div className="space-y-1">
        {area !== undefined && <p><span className="font-medium">Plocha:</span> {area} m²</p>}
        {spaceType && <p><span className="font-medium">Typ prostoru:</span> {translateSpaceType(spaceType)}</p>}
        {dirtiness !== undefined && <p><span className="font-medium">Znečištění:</span> {translateDirtiness(dirtiness)}</p>}
        {frequency !== undefined && <p><span className="font-medium">Frekvence:</span> {translateFrequency(frequency)}</p>}
        {workstations !== undefined && <p><span className="font-medium">Počet pracovišť:</span> {workstations}</p>}
        {bathrooms !== undefined && <p><span className="font-medium">Počet koupelen:</span> {bathrooms}</p>}
        {kitchens !== undefined && <p><span className="font-medium">Počet kuchyní/kuchyněk:</span> {kitchens}</p>}
        {equipmentOption && <p><span className="font-medium">Vybavení:</span> {translateEquipmentOption(equipmentOption)}</p>}

        {/* Display additional services with their details */}
        {extras?.length > 0 && (
          <div className="pt-2 border-t mt-2">
            <p className="font-medium text-sm mb-2">Přidané služby:</p>
            {extras.includes('Mytí oken') && renderWindowCleaningDetailsInline()}
            {extras.includes('Čištění čalounění') && renderUpholsteryCleaningDetailsInline()}
          </div>
        )}
      </div>
    );
  };

  const renderWindowCleaningDetails = () => {
    const windowCount = getValue(bookingDetails, 'windowCount', 'pocet_oken');
    const objectType = getValue(bookingDetails, 'windowObjectType', 'typ_objektu');
    const dirtiness = getValue(bookingDetails, 'windowDirtiness', 'znecisteni', 'znecisteni_okna');
    const accessibility = getValue(bookingDetails, 'windowAccessibility', 'obtizny_pristup');
    const includeFrames = getValue(bookingDetails, 'includeFrames', 'vcetne_ramu');
    const includeSills = getValue(bookingDetails, 'includeSills', 'vcetne_parapetu');
    const notes = getValue(bookingDetails, 'notes', 'poznamky');

    return (
      <div className="space-y-1">
        {windowCount !== undefined && <p><span className="font-medium">Počet oken:</span> {windowCount}</p>}
        {objectType && <p><span className="font-medium">Typ objektu:</span> {objectType}</p>}
        {dirtiness !== undefined && <p><span className="font-medium">Znečištění:</span> {translateDirtiness(dirtiness)}</p>}
        {accessibility !== undefined && <p><span className="font-medium">Obtížný přístup:</span> {accessibility ? 'Ano' : 'Ne'}</p>}
        {includeFrames !== undefined && <p><span className="font-medium">Včetně rámů:</span> {includeFrames ? 'Ano' : 'Ne'}</p>}
        {includeSills !== undefined && <p><span className="font-medium">Včetně parapetů:</span> {includeSills ? 'Ano' : 'Ne'}</p>}
      </div>
    );
  };

  const renderUpholsteryCleaningDetails = () => {
    // Check for new flat CZ structure first
    const koberce = getValue(bookingDetails, 'koberce');
    const sedacka = getValue(bookingDetails, 'sedacka');
    const matrace = getValue(bookingDetails, 'matrace');
    const kresla = getValue(bookingDetails, 'kresla');
    const zidle = getValue(bookingDetails, 'zidle');
    const notes = getValue(bookingDetails, 'notes', 'poznamky');

    // If we have flat CZ structure
    if (koberce || sedacka || matrace || kresla || zidle) {
      return (
        <div className="space-y-2">
          {koberce && (
            <div>
              <p className="font-medium">Koberce</p>
              <ul className="ml-4 text-sm list-disc">
                {getValue(bookingDetails, 'typ_koberec') && <li>Typ: {getValue(bookingDetails, 'typ_koberec')}</li>}
                {getValue(bookingDetails, 'plocha_koberec') && <li>Plocha: {getValue(bookingDetails, 'plocha_koberec')} m²</li>}
                {getValue(bookingDetails, 'znecisteni_koberec') && <li>Znečištění: {translateDirtiness(getValue(bookingDetails, 'znecisteni_koberec'))}</li>}
              </ul>
            </div>
          )}
          {sedacka && (
            <div>
              <p className="font-medium">Sedačka</p>
              <ul className="ml-4 text-sm list-disc">
                {getValue(bookingDetails, 'velikost_sedacka') && <li>Velikost: {getValue(bookingDetails, 'velikost_sedacka')}</li>}
                {getValue(bookingDetails, 'znecisteni_sedacka') && <li>Znečištění: {translateDirtiness(getValue(bookingDetails, 'znecisteni_sedacka'))}</li>}
              </ul>
            </div>
          )}
          {matrace && (
            <div>
              <p className="font-medium">Matrace</p>
              <ul className="ml-4 text-sm list-disc">
                {getValue(bookingDetails, 'velikost_matrace') && <li>Velikost: {getValue(bookingDetails, 'velikost_matrace')}</li>}
                {getValue(bookingDetails, 'strany_matrace') && <li>Strany: {getValue(bookingDetails, 'strany_matrace')}</li>}
                {getValue(bookingDetails, 'znecisteni_matrace') && <li>Znečištění: {translateDirtiness(getValue(bookingDetails, 'znecisteni_matrace'))}</li>}
              </ul>
            </div>
          )}
          {kresla && (
            <div>
              <p className="font-medium">Křesla</p>
              <ul className="ml-4 text-sm list-disc">
                {getValue(bookingDetails, 'pocet_kresla') !== undefined && <li>Počet: {getValue(bookingDetails, 'pocet_kresla')}</li>}
                {getValue(bookingDetails, 'znecisteni_kresla') && <li>Znečištění: {translateDirtiness(getValue(bookingDetails, 'znecisteni_kresla'))}</li>}
              </ul>
            </div>
          )}
          {zidle && (
            <div>
              <p className="font-medium">Židle</p>
              <ul className="ml-4 text-sm list-disc">
                {getValue(bookingDetails, 'pocet_zidle') !== undefined && <li>Počet: {getValue(bookingDetails, 'pocet_zidle')}</li>}
                {getValue(bookingDetails, 'znecisteni_zidle') && <li>Znečištění: {translateDirtiness(getValue(bookingDetails, 'znecisteni_zidle'))}</li>}
              </ul>
            </div>
          )}
        </div>
      );
    }

    // Fall back to old selectedItems structure
    const selectedItems = getValue(bookingDetails, 'selectedItems');
    if (selectedItems && Object.keys(selectedItems).length > 0) {
      return (
        <div className="space-y-2">
          <p className="font-medium">Vybrané položky:</p>
          {Object.entries(selectedItems).map(([key, value]: [string, any]) => {
            if (!value) return null;

            const itemLabels: Record<string, string> = {
              koberce: 'Koberce',
              sedacka: 'Sedačka',
              kreslo: 'Křeslo',
              zidle: 'Židle',
              matrace: 'Matrace',
              aurosedacky: 'Autosedačky'
            };

            return (
              <div key={key} className="ml-4 text-sm">
                <p className="font-medium">{itemLabels[key] || key}:</p>
                {typeof value === 'object' && (
                  <div className="ml-2 space-y-1">
                    {Object.entries(value).map(([subKey, subValue]: [string, any]) => (
                      <p key={subKey}>• {subKey}: {String(subValue)}</p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    return <p className="text-muted-foreground text-sm">Žádné detaily k zobrazení</p>;
  };

  // Determine which cleaning type for merged "cleaning" service
  const renderCleaningDetails = () => {
    const cleaningType = getValue(bookingDetails, 'cleaning_type', 'typ_uklidu');
    const hasOfficeFields = getValue(bookingDetails, 'officeArea', 'officeSpaceType', 'officeWorkstations', 'typ_prostoru', 'pocet_pracovist');

    // If cleaning_type is "firmy" or "firemni" or has office-specific fields, render office details
    if (cleaningType === 'firmy' || cleaningType === 'firemni' || cleaningType === 'office' || hasOfficeFields) {
      return renderOfficeCleaningDetails();
    }
    // Default to home cleaning (osobni, domacnosti, or no specific type)
    return renderHomeCleaningDetails();
  };

  return (
    <div className="space-y-2">
      {serviceType === 'cleaning' && renderCleaningDetails()}
      {serviceType === 'home_cleaning' && renderHomeCleaningDetails()}
      {serviceType === 'office_cleaning' && renderOfficeCleaningDetails()}
      {serviceType === 'window_cleaning' && renderWindowCleaningDetails()}
      {serviceType === 'upholstery_cleaning' && renderUpholsteryCleaningDetails()}

      {showPrice && bookingDetails?.priceEstimate && (
        <div className="pt-2 border-t mt-2">
          <p>
            <span className="font-medium">Cena:</span>{' '}
            {bookingDetails.priceEstimate.priceMin && bookingDetails.priceEstimate.priceMax && bookingDetails.priceEstimate.priceMin !== bookingDetails.priceEstimate.priceMax ? (
              <span>{bookingDetails.priceEstimate.priceMin} - {bookingDetails.priceEstimate.priceMax} Kč (Odhad)</span>
            ) : (
              <span>{bookingDetails.priceEstimate.price || bookingDetails.priceEstimate.priceMin || 0} Kč</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
