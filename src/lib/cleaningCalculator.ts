export type DirtinessLevel = "nizka" | "stredni" | "vysoka";
export type FrequencyType = "jednorazove" | "mesicne" | "ctyrtydne" | "tydne";

// Office cleaning types
export type OfficeDirtinessLevel = "nizke" | "stredni" | "vysoke" | "extremni";
export type OfficeFrequencyType = "jednorazove" | "mesicne" | "tydne" | "denne";
export type OfficeSpaceType = "kancelar" | "obchod" | "sklad" | "vyroba";
export type CleaningTimeType = "denni" | "nocni";

// Window cleaning types
export type WindowDirtinessLevel = "nizke" | "stredni" | "vysoke";
export type WindowObjectType = "byt" | "dum" | "kancelar" | "obchod";

// Upholstery cleaning types
export type UpholsteryDirtinessLevel = "nizke" | "stredni" | "vysoke";
export type CarpetType = "kusovy" | "pokladkovy_kratky" | "pokladkovy_dlouhy";
export type SofaSize = "2mistna" | "3mistna" | "4mistna" | "5mistna" | "6mistna";
export type MattressSize = "90" | "140" | "160" | "180" | "200";
export type MattressSides = "1strana" | "obestrany";

interface CalculatorInput {
  plocha_m2: number;
  pocet_koupelen: number;
  pocet_kuchyni: number;
  znecisteni?: DirtinessLevel;
  frekvence?: FrequencyType;
}

interface CalculatorResult {
  hoursMin: number;
  hoursMax: number;
  priceMin: number;
  priceMax: number;
  discountPercent: number;
}

export function kalkulujUklidDomacnosti400({
  plocha_m2,
  pocet_koupelen,
  pocet_kuchyni,
  znecisteni = "nizka",
  frekvence = "jednorazove"
}: CalculatorInput): CalculatorResult {
  const sazba = 400;
  const minAreaRate = 30;
  const maxAreaRate = 20;

  const bathMin = 0.5, bathMax = 1.0;
  const kitMin = 0.75, kitMax = 1.25;
  const prepMin = 0.25, prepMax = 0.5;

  const znecMap: Record<DirtinessLevel, number> = { 
    nizka: 1.0, 
    stredni: 1.2, 
    vysoka: 1.4 
  };
  
  const freqMap: Record<FrequencyType, number> = {
    jednorazove: 1.0,   // no discount
    mesicne: 0.9,       // 10% off
    ctyrtydne: 0.85,    // every 2 weeks
    tydne: 0.8          // weekly
  };

  // Calculate base hours
  let hoursMin = (plocha_m2 / minAreaRate) + pocet_koupelen * bathMin + pocet_kuchyni * kitMin + prepMin;
  let hoursMax = (plocha_m2 / maxAreaRate) + pocet_koupelen * bathMax + pocet_kuchyni * kitMax + prepMax;

  // Apply dirtiness multiplier
  hoursMin = Math.max(2, hoursMin * znecMap[znecisteni]);
  hoursMax = hoursMax * znecMap[znecisteni];

  // Calculate raw price
  let priceMin = hoursMin * sazba;
  let priceMax = hoursMax * sazba;

  // Apply discount
  const discount = freqMap[frekvence] || 1.0;
  priceMin *= discount;
  priceMax *= discount;

  // Round up to nearest 10 Kč
  const roundUp10 = (num: number) => Math.ceil(num / 10) * 10;
  priceMin = roundUp10(priceMin);
  priceMax = roundUp10(priceMax);

  return {
    hoursMin: Number(hoursMin.toFixed(2)),
    hoursMax: Number(hoursMax.toFixed(2)),
    priceMin,
    priceMax,
    discountPercent: (1 - discount) * 100
  };
}

// Office cleaning calculator
interface OfficeCalculatorInput {
  plocha_m2: number;
  pocet_wc: number;
  pocet_kuchynek: number;
  typ_prostoru: OfficeSpaceType;
  znecisteni: OfficeDirtinessLevel;
  frekvence: OfficeFrequencyType;
  doba: CleaningTimeType;
  doplnky: string[];
}

export function kalkulujUklidFirmy({
  plocha_m2,
  pocet_wc,
  pocet_kuchynek,
  typ_prostoru,
  znecisteni,
  frekvence,
  doba,
  doplnky
}: OfficeCalculatorInput): CalculatorResult {
  const sazba = 600; // 600 Kč/h (20% navýšení z 500)
  
  // Rychlost úklidu podle typu prostoru (m²/h)
  const rychlostMap: Record<OfficeSpaceType, number> = {
    kancelar: 60,
    obchod: 50,
    sklad: 70,
    vyroba: 40
  };
  
  // Znečištění multiplier
  const znecMap: Record<OfficeDirtinessLevel, number> = {
    nizke: 1.0,
    stredni: 1.2,
    vysoke: 1.4,
    extremni: 1.6
  };
  
  // Frekvence slevy
  const freqMap: Record<OfficeFrequencyType, number> = {
    jednorazove: 1.0,   // 0% sleva
    mesicne: 0.9,       // 10% sleva
    tydne: 0.8,         // 20% sleva
    denne: 0.7          // 30% sleva
  };
  
  // Základní čas
  const rychlost = rychlostMap[typ_prostoru];
  let basicHours = (plocha_m2 / rychlost) + (pocet_wc * 0.5) + (pocet_kuchynek * 0.5);
  
  // Přidat čas za doplňky
  basicHours += doplnky.length * 0.5;
  
  // Aplikovat znečištění
  basicHours *= znecMap[znecisteni];
  
  // Keep min as is, increase max by 20%
  const hoursMin = basicHours * 0.85;
  const hoursMax = basicHours * 1.02; // 0.85 * 1.20 = 1.02
  
  // Vypočítat základní cenu
  let priceMin = hoursMin * sazba;
  let priceMax = hoursMax * sazba;
  
  // Přičíst noční příplatek +10%
  if (doba === "nocni") {
    priceMin *= 1.1;
    priceMax *= 1.1;
  }
  
  // Aplikovat slevu dle frekvence
  const discount = freqMap[frekvence];
  priceMin *= discount;
  priceMax *= discount;
  
  // Zaokrouhlit na 10 Kč nahoru
  const roundUp10 = (num: number) => Math.ceil(num / 10) * 10;
  priceMin = roundUp10(priceMin);
  priceMax = roundUp10(priceMax);
  
  return {
    hoursMin: Number(hoursMin.toFixed(2)),
    hoursMax: Number(hoursMax.toFixed(2)),
    priceMin,
    priceMax,
    discountPercent: (1 - discount) * 100
  };
}

// Window cleaning calculator
interface WindowCalculatorInput {
  plocha_m2: number;
  pocet_oken: number;
  znecisteni: WindowDirtinessLevel;
  typ_objektu?: WindowObjectType;
}

export function kalkulujMytiOken({
  plocha_m2,
  pocet_oken,
  znecisteni,
  typ_objektu = 'byt'
}: WindowCalculatorInput): CalculatorResult {
  // 🔹 1️⃣ Základní sazba + 15% navýšení
  const zakladniCenaZaOkno = 276; // 240 * 1.15 = 276 Kč / 1m² okno (obě strany)

  // 🔹 2️⃣ Základní cena podle počtu oken (m²)
  let cena = pocet_oken * zakladniCenaZaOkno;

  // 🔹 3️⃣ Koeficient podle znečištění
  const znecMap: Record<WindowDirtinessLevel, number> = {
    nizke: 1.0,
    stredni: 1.2,
    vysoke: 1.4
  };

  // 🔹 4️⃣ Koeficient podle typu objektu (optional)
  const objektMap: Record<WindowObjectType, number> = {
    byt: 1.0,
    dum: 1.1,
    kancelar: 1.05,
    obchod: 1.15
  };

  // 🔹 5️⃣ Aplikuj koeficienty
  cena = cena * znecMap[znecisteni] * objektMap[typ_objektu];

  // 🔹 6️⃣ Minimální hodnota zakázky
  if (cena < 1500) cena = 1500;

  // 🔹 7️⃣ Cenové rozmezí ±10 %
  const priceMin = Math.round(cena * 0.9);
  const priceMax = Math.round(cena * 1.1);

  // 🔹 8️⃣ Výstup
  return {
    hoursMin: 0,
    hoursMax: 0,
    priceMin,
    priceMax,
    discountPercent: 0
  };
}

// Upholstery cleaning calculator
interface UpholsteryCalculatorInput {
  koberce?: boolean;
  typ_koberec?: string;
  plocha_koberec?: number;
  znecisteni_koberec?: string;
  
  sedacka?: boolean;
  velikost_sedacka?: string;
  znecisteni_sedacka?: string;
  
  matrace?: boolean;
  velikost_matrace?: string;
  strany_matrace?: string;
  znecisteni_matrace?: string;
  
  kresla?: boolean;
  pocet_kresla?: number;
  znecisteni_kresla?: string;
  
  zidle?: boolean;
  pocet_zidle?: number;
  znecisteni_zidle?: string;
}

export interface UpholsteryCalculatorResult extends CalculatorResult {
  rawTotal: number;
  belowMinimum: boolean;
  minimumOrder: number;
  // Individual category prices for breakdown
  carpetPrice: number;
  sofaPrice: number;
  mattressPrice: number;
  armchairPrice: number;
  chairPrice: number;
}

export function kalkulujCalouneni(data: UpholsteryCalculatorInput): UpholsteryCalculatorResult {
  let total = 0;
  let carpetPrice = 0;
  let sofaPrice = 0;
  let mattressPrice = 0;
  let armchairPrice = 0;
  let chairPrice = 0;

  // --- A. Koberce ---
  if (data.koberce) {
    const sazby: Record<string, number[]> = {
      "Kusový": [200, 230, 260],
      "Pokládkový – krátký vlas": [84, 108, 132],
      "Pokládkový – dlouhý vlas": [108, 132, 156],
    };
    const idx = data.znecisteni_koberec === "Střední" ? 1 :
                data.znecisteni_koberec === "Vysoké" ? 2 : 0;
    carpetPrice = (data.plocha_koberec || 0) * (sazby[data.typ_koberec || "Kusový"]?.[idx] || 0);
    total += carpetPrice;
  }

  // --- B. Sedačky ---
  if (data.sedacka) {
    const ceny: Record<string, number[]> = {
      "1-místná": [770,990,1210],
      "2-místná": [990,1210,1430],
      "3-místná": [1210,1430,1650],
      "4-místná": [1430,1650,1870],
      "5-místná": [1650,1870,2090],
      "6-místná": [1870,2090,2310],
      "Rohová": [2090,2530,2970],
    };
    const idx = data.znecisteni_sedacka === "Střední" ? 1 :
                data.znecisteni_sedacka === "Vysoké" ? 2 : 0;
    sofaPrice = ceny[data.velikost_sedacka || "2-místná"]?.[idx] || 0;
    total += sofaPrice;
  }

  // --- C. Matrace ---
  if (data.matrace) {
    const ceny: Record<string, number[]> = {
      "90 cm – 1 strana": [800,960,1120],
      "90 cm – obě strany": [1400,1600,1800],
      "140 cm – 1 strana": [1100,1300,1500],
      "140 cm – obě strany": [1900,2100,2300],
      "160 cm – 1 strana": [1200,1400,1600],
      "160 cm – obě strany": [2000,2200,2400],
      "180 cm – 1 strana": [1300,1500,1700],
      "180 cm – obě strany": [2200,2400,2600],
      "200 cm – 1 strana": [1400,1600,1800],
      "200 cm – obě strany": [2400,2600,2800],
    };
    const key = `${data.velikost_matrace} cm – ${data.strany_matrace}`;
    const idx = data.znecisteni_matrace === "Střední" ? 1 :
                data.znecisteni_matrace === "Vysoké" ? 2 : 0;
    mattressPrice = ceny[key]?.[idx] || 0;
    total += mattressPrice;
  }

  // --- D. Křesla ---
  if (data.kresla) {
    const ceny = [400,550,700];
    const idx = data.znecisteni_kresla === "Střední" ? 1 :
                data.znecisteni_kresla === "Vysoké" ? 2 : 0;
    armchairPrice = (data.pocet_kresla || 0) * ceny[idx];
    total += armchairPrice;
  }

  // --- E. Židle ---
  if (data.zidle) {
    const ceny = [195,260,325];
    const idx = data.znecisteni_zidle === "Střední" ? 1 :
                data.znecisteni_zidle === "Vysoké" ? 2 : 0;
    chairPrice = (data.pocet_zidle || 0) * ceny[idx];
    total += chairPrice;
  }

  // --- Minimální hodnota a rozmezí ---
  const minimumOrder = 1500;
  const rawTotal = total;
  const belowMinimum = total > 0 && total < minimumOrder;
  
  // For display, show actual calculated price (not enforced minimum)
  const priceMin = total > 0 ? Math.round(total * 0.9) : 0;
  const priceMax = total > 0 ? Math.round(total * 1.1) : 0;

  return {
    hoursMin: 0,
    hoursMax: 0,
    priceMin,
    priceMax,
    discountPercent: 0,
    rawTotal,
    belowMinimum,
    minimumOrder,
    carpetPrice,
    sofaPrice,
    mattressPrice,
    armchairPrice,
    chairPrice
  };
}
