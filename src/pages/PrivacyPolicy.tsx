
import { Link, useLocation, useNavigate } from 'react-router-dom';
import klinrLogo from '@/assets/Klinr Logo Full.png';
import { ArrowLeft, ArrowRight, ShieldCheck, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

/* ──────────────────────────────────────────────────────────────
   Reusable building blocks
   ────────────────────────────────────────────────────────────── */

const Section = ({
    id,
    number,
    title,
    children,
}: {
    id: string;
    number: number;
    title: string;
    children: React.ReactNode;
}) => (
    <section id={id} className="scroll-mt-24">
        <div className="flex items-baseline gap-3 mb-5">
            <span className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary text-sm font-black">
                {number}
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {title}
            </h2>
        </div>
        <div className="pl-11 space-y-4 text-[15px] leading-relaxed text-slate-600">
            {children}
        </div>
    </section>
);

const SubSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mt-6 first:mt-0">
        <h3 className="text-base font-bold text-slate-800 mb-2">{title}</h3>
        {children}
    </div>
);

/* ──────────────────────────────────────────────────────────────
   Main page
   ────────────────────────────────────────────────────────────── */

export default function PrivacyPolicy() {
    const location = useLocation();
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* ── Header ────────────────────────────────────────────── */}
            <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                <div className="flex flex-nowrap h-16 sm:h-20 items-center justify-between gap-2 sm:gap-4 px-4 mx-auto max-w-7xl min-w-0">
                    <Link to="/landing">
                        <img src={klinrLogo} alt="Klinr" className="h-7 sm:h-8 w-auto flex-shrink-0" />
                    </Link>
                    {location.state?.from === 'booking' ? (
                        <Button
                            variant="default"
                            className="flex-shrink-0 gap-2 text-sm bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white hover:opacity-90 shadow-[0_4px_14px_rgba(0,0,0,0.25)] border border-white/10"
                            onClick={() => navigate(-1)}
                        >
                            Dokončit objednávku
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    ) : location.state?.from === 'registration' ? (
                        <Link to="/klient-prihlaseni?tab=signup">
                            <Button variant="default" className="flex-shrink-0 gap-2 text-sm bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white hover:opacity-90 shadow-[0_4px_14px_rgba(0,0,0,0.25)] border border-white/10">
                                <ArrowLeft className="h-4 w-4" />
                                Zpět k registraci
                            </Button>
                        </Link>
                    ) : (
                        <Link to="/landing">
                            <Button variant="outline" className="flex-shrink-0 gap-2 text-sm">
                                <ArrowLeft className="h-4 w-4" />
                                Zpět na hlavní stránku
                            </Button>
                        </Link>
                    )}
                </div>
            </header>

            {/* ── Hero banner ───────────────────────────────────────── */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white">
                <div className="container mx-auto max-w-4xl px-4 py-12 sm:py-16 text-center space-y-3">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 border border-white/20 mb-2">
                        <ShieldCheck className="h-7 w-7 text-white/80" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
                        Zásady ochrany osobních údajů
                    </h1>
                    <p className="text-slate-400 text-sm">
                        Platné od 12. února 2026 &nbsp;·&nbsp; Sigurado s.r.o.
                    </p>
                </div>
            </div>

            {/* ── Content ───────────────────────────────────────────── */}
            <main className="container mx-auto max-w-4xl px-4 py-10 sm:py-14">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-100">

                    {/* ── 1. Správce a kontakt ─────────────────────────────── */}
                    <div className="p-6 sm:p-10">
                        <Section id="spravce" number={1} title="Správce a kontaktní údaje">
                            <p>
                                Správcem osobních údajů ve smyslu Nařízení Evropského parlamentu a Rady (EU)
                                2016/679 (<strong>GDPR</strong>) je <strong>Sigurado s.r.o.</strong>, IČO: 10850481, se sídlem
                                Boženy Němcové 524/11a, 460 05 Liberec (dále jen <strong>„Správce"</strong>).
                            </p>

                            <div className="rounded-xl bg-slate-50 border border-slate-200 p-5 mt-4 space-y-1.5 text-sm not-prose">
                                <p className="font-bold text-slate-800 text-base mb-2">Kontaktní údaje pro záležitosti GDPR</p>
                                <p className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-slate-400" />
                                    <span className="text-slate-500 w-24">E-mail:</span>
                                    <a href="mailto:uklid@klinr.cz" className="text-primary underline underline-offset-2 font-medium">uklid@klinr.cz</a>
                                </p>
                                <p className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-slate-400" />
                                    <span className="text-slate-500 w-24">Telefon:</span>
                                    <a href="tel:+420777645610" className="text-primary underline underline-offset-2 font-medium">+420 777 645 610</a>
                                </p>
                            </div>
                        </Section>
                    </div>

                    {/* ── 2. Rozsah údajů ─────────────────────────────────── */}
                    <div className="p-6 sm:p-10">
                        <Section id="rozsah" number={2} title="Jaké údaje zpracováváme">
                            <p>Zpracováváme pouze údaje, které nám sami poskytnete v souvislosti s využíváním našich služeb:</p>
                            <ul className="list-disc pl-5 space-y-1.5 mt-2">
                                <li><strong>Identifikační údaje:</strong> jméno, příjmení.</li>
                                <li><strong>Kontaktní údaje:</strong> e-mailová adresa, telefonní číslo, adresa místa úklidu.</li>
                                <li><strong>Fakturační údaje:</strong> fakturační adresa, IČO, DIČ (u podnikajících osob).</li>
                                <li><strong>Údaje o službách:</strong> historie objednávek, preference úklidu, poznámky k úklidu.</li>
                                <li><strong>Technické údaje:</strong> IP adresa, soubory cookies a logy o přístupu k Platformě.</li>
                            </ul>
                        </Section>
                    </div>

                    {/* ── 3. Účel a právní základ ────────────────────────────── */}
                    <div className="p-6 sm:p-10">
                        <Section id="ucel" number={3} title="Proč údaje zpracováváme">
                            <div className="overflow-x-auto rounded-lg border border-slate-200">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200">
                                            <th className="text-left p-3 font-bold text-slate-800">Účel zpracování</th>
                                            <th className="text-left p-3 font-bold text-slate-800 border-l border-slate-200">Právní základ (GDPR)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        <tr>
                                            <td className="p-3 text-slate-600 font-medium">Objednávka a poskytnutí služby</td>
                                            <td className="p-3 text-slate-600 border-l border-slate-200">Plnění smlouvy (Čl. 6 odst. 1 písm. b)</td>
                                        </tr>
                                        <tr className="bg-slate-50/50">
                                            <td className="p-3 text-slate-600 font-medium">Účetnictví a daňové povinnosti</td>
                                            <td className="p-3 text-slate-600 border-l border-slate-200">Právní povinnost (Čl. 6 odst. 1 písm. c)</td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 text-slate-600 font-medium">Zlepšování služeb a bezpečnost</td>
                                            <td className="p-3 text-slate-600 border-l border-slate-200">Oprávněný zájem (Čl. 6 odst. 1 písm. f)</td>
                                        </tr>
                                        <tr className="bg-slate-50/50">
                                            <td className="p-3 text-slate-600 font-medium">Marketing a newsletter</td>
                                            <td className="p-3 text-slate-600 border-l border-slate-200">Váš souhlas (Čl. 6 odst. 1 písm. a)</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </Section>
                    </div>

                    {/* ── 4. Doba uchovávání ──────────────────────────────── */}
                    <div className="p-6 sm:p-10">
                        <Section id="uchovavani" number={4} title="Jak dlouho údaje uchováváme">
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>Údaje nezbytné pro plnění smlouvy uchováváme po dobu trvání smluvního vztahu a 3 roky po jeho ukončení (promlčecí lhůta).</li>
                                <li>Daňové doklady a účetní záznamy uchováváme po dobu 10 let, jak vyžaduje zákon.</li>
                                <li>Údaje pro marketingové účely uchováváme do doby, než odvoláte svůj souhlas.</li>
                            </ul>
                        </Section>
                    </div>

                    {/* ── 5. Komu údaje předáváme ─────────────────────────── */}
                    <div className="p-6 sm:p-10">
                        <Section id="prijemci" number={5} title="Komu údaje předáváme">
                            <p>Vaše osobní údaje chráníme a nepředáváme je třetím stranám, s výjimkou situací nezbytných pro poskytnutí služby:</p>
                            <ul className="list-disc pl-5 space-y-1.5 mt-2">
                                <li><strong>Partneři (úklidoví pracovníci):</strong> Obdrží informace v rozsahu nutném pro provedení úklidu (adresa, termín, kontakt, specifické požadavky).</li>
                                <li><strong>Poskytovatelé IT služeb:</strong> Hosting, správa databáze a e-mailové služby.</li>
                                <li><strong>Účetní kancelář:</strong> Pro zpracování účetnictví a plnění daňových povinností.</li>
                            </ul>
                            <p className="mt-2 text-sm text-slate-500">
                                Osobní údaje nepředáváme do zemí mimo Evropskou unii (EU) / Evropský hospodářský prostor (EHP).
                            </p>
                        </Section>
                    </div>

                    {/* ── 6. Práva subjektu údajů ─────────────────────────── */}
                    <div className="p-6 sm:p-10">
                        <Section id="prava" number={6} title="Vaše práva">
                            <p>Jako subjekt údajů máte následující práva, která můžete kdykoliv uplatnit:</p>
                            <div className="grid sm:grid-cols-2 gap-4 mt-4">
                                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                                    <h4 className="font-bold text-slate-800 mb-1">Právo na přístup</h4>
                                    <p className="text-sm text-slate-600">Můžete nás požádat o informaci, jaké vaše údaje zpracováváme.</p>
                                </div>
                                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                                    <h4 className="font-bold text-slate-800 mb-1">Právo na opravu</h4>
                                    <p className="text-sm text-slate-600">Pokud jsou vaše údaje nepřesné, rádi je opravíme.</p>
                                </div>
                                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                                    <h4 className="font-bold text-slate-800 mb-1">Právo na výmaz</h4>
                                    <p className="text-sm text-slate-600">Můžete požádat o smazání údajů („právo být zapomenut").</p>
                                </div>
                                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                                    <h4 className="font-bold text-slate-800 mb-1">Právo vznést námitku</h4>
                                    <p className="text-sm text-slate-600">Proti zpracování na základě oprávněného zájmu.</p>
                                </div>
                            </div>

                            <p className="mt-6">
                                Svá práva můžete uplatnit e-mailem na <a href="mailto:uklid@klinr.cz" className="text-primary underline font-bold">uklid@klinr.cz</a>.
                            </p>
                            <p className="mt-2 text-sm text-slate-500">
                                Máte také právo podat stížnost u dozorového úřadu, kterým je <strong>Úřad pro ochranu osobních údajů</strong> (www.uoou.cz).
                            </p>
                        </Section>
                    </div>

                    {/* ── 7. Cookies ─────────────────────────────────────── */}
                    <div className="p-6 sm:p-10">
                        <Section id="cookies" number={7} title="Soubory Cookies">
                            <p>
                                Naše Platforma používá soubory cookies pro zajištění funkčnosti, analýzu návštěvnosti a uložení vašich preferencí.
                                Používání cookies můžete omezit nebo zablokovat v nastavení svého webového prohlížeče.
                                Blokování nezbytných cookies však může ovlivnit správnou funkci webu.
                            </p>
                        </Section>
                    </div>

                </div>

                {/* ── Footer Link to VOP ────────────────────────────── */}
                <div className="mt-8 text-center">
                    <Link to="/vop">
                        <Button variant="ghost" className="text-slate-500 hover:text-slate-800">
                            Přejít na Všeobecné obchodní podmínky
                        </Button>
                    </Link>
                </div>
            </main>

            {/* ── Footer ────────────────────────────────────────────── */}
            <footer className="bg-slate-950 text-white py-8 border-t border-white/5 mt-8">
                <div className="container mx-auto max-w-7xl px-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500 font-medium">
                    <p>&copy; {new Date().getFullYear()} Klinr. Všechna práva vyhrazena.</p>
                    <div className="flex gap-6">
                        <Link to="/landing" className="hover:text-white transition-colors">Hlavní stránka</Link>
                        <a href="mailto:uklid@klinr.cz" className="hover:text-white transition-colors">Kontakt</a>
                        <Link to="/vop" className="hover:text-white transition-colors">VOP</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
