import { Link, useLocation, useNavigate } from 'react-router-dom';
import klinrLogo from '@/assets/Klinr Logo Full.png';
import { ArrowLeft, ArrowRight, FileText, ShieldCheck } from 'lucide-react';
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

export default function VOP() {
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
                        <FileText className="h-7 w-7 text-white/80" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
                        Všeobecné obchodní podmínky
                    </h1>
                    <p className="text-slate-400 text-sm">
                        Platné od 12. února 2026 &nbsp;·&nbsp; Sigurado s.r.o.
                    </p>
                </div>
            </div>

            {/* ── Content ───────────────────────────────────────────── */}
            <main className="container mx-auto max-w-4xl px-4 py-10 sm:py-14">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-100">

                    {/* ── 1 ─────────────────────────────────────────────── */}
                    <div className="p-6 sm:p-10">
                        <Section id="uvodni-ustanoveni" number={1} title="Úvodní ustanovení">
                            <p>
                                Tyto všeobecné obchodní podmínky (dále jen <strong>„VOP"</strong>) upravují
                                práva a povinnosti smluvních stran při využívání služeb poskytovaných
                                prostřednictvím internetové platformy <strong>Klinr</strong>, dostupné na
                                adrese{' '}
                                <a href="https://www.klinr.cz" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors">
                                    www.klinr.cz
                                </a>{' '}
                                (dále jen <strong>„Platforma"</strong>).
                            </p>

                            <div className="rounded-xl bg-slate-50 border border-slate-200 p-5 space-y-1.5 text-sm not-prose">
                                <p className="font-bold text-slate-800 text-base mb-2">Provozovatel Platformy</p>
                                <p><span className="text-slate-500 w-32 inline-block">Obchodní firma:</span> <strong className="text-slate-800">Sigurado s.r.o.</strong></p>
                                <p><span className="text-slate-500 w-32 inline-block">Sídlo:</span> <span className="text-slate-700">Boženy Němcové 524/11a, Liberec V-Kristiánov, 460 05 Liberec</span></p>
                                <p><span className="text-slate-500 w-32 inline-block">IČO:</span> <span className="text-slate-700">10850481</span></p>
                                <p><span className="text-slate-500 w-32 inline-block">Spisová značka:</span> <span className="text-slate-700">C 47105 vedená u Krajského soudu v Ústí nad Labem</span></p>
                                <p><span className="text-slate-500 w-32 inline-block">E-mail:</span> <a href="mailto:uklid@klinr.cz" className="text-primary underline underline-offset-2">uklid@klinr.cz</a></p>
                                <p><span className="text-slate-500 w-32 inline-block">Telefon:</span> <a href="tel:+420777645610" className="text-primary underline underline-offset-2">+420 777 645 610</a></p>
                            </div>

                            <p>
                                Provozovatel není plátcem DPH. Tyto VOP jsou nedílnou součástí každé smlouvy
                                uzavřené prostřednictvím Platformy mezi Provozovatelem a zákazníkem (dále jen{' '}
                                <strong>„Zákazník"</strong>).
                            </p>
                        </Section>
                    </div>

                    {/* ── 2 ─────────────────────────────────────────────── */}
                    <div className="p-6 sm:p-10">
                        <Section id="zprostredkovani" number={2} title="Vymezení zprostředkování">
                            <p>
                                Provozovatel <strong>není přímým poskytovatelem úklidových služeb</strong>.
                                Provozovatel vystupuje jako <strong>zprostředkovatel</strong> ve smyslu § 2445
                                a násl. zákona č. 89/2012 Sb., občanského zákoníku, v platném znění (dále jen{' '}
                                <strong>„OZ"</strong>).
                            </p>

                            <p className="font-semibold text-slate-700">Provozovatel zejména:</p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>přijímá a zpracovává objednávky úklidových služeb od Zákazníků;</li>
                                <li>zajišťuje komunikaci mezi Zákazníkem a poskytovateli úklidových služeb (dále jen <strong>„Partner"</strong>);</li>
                                <li>koordinuje termíny a rozsah služeb;</li>
                                <li>přijímá platby od Zákazníka a provádí vyúčtování s Partnerem.</li>
                            </ul>

                            <p>
                                Samotné úklidové služby jsou prováděny Partnery — samostatnými podnikatelskými
                                subjekty nebo fyzickými osobami, které s Provozovatelem spolupracují na základě
                                samostatné smlouvy. Provozovatel odpovídá za řádné zprostředkování služby,
                                nikoli za výkon úklidu samotného.
                            </p>
                        </Section>
                    </div>

                    {/* ── 3 ─────────────────────────────────────────────── */}
                    <div className="p-6 sm:p-10">
                        <Section id="objednavka" number={3} title="Objednávka a uzavření smlouvy">
                            <ol className="list-decimal pl-5 space-y-3">
                                <li>
                                    Zákazník provede objednávku prostřednictvím objednávkového formuláře na
                                    Platformě, kde uvede požadovaný druh služby, rozsah, termín a kontaktní údaje.
                                </li>
                                <li>
                                    Odesláním objednávky Zákazník potvrzuje, že se seznámil s těmito VOP
                                    a souhlasí s nimi.
                                </li>
                                <li>
                                    Objednávka se stává závaznou okamžikem jejího potvrzení ze strany Provozovatele
                                    (e-mailem nebo telefonicky). Tímto okamžikem dochází k uzavření smlouvy
                                    o zprostředkování.
                                </li>
                                <li>
                                    Provozovatel si vyhrazuje právo objednávku odmítnout, zejména pokud požadovaná
                                    služba není v daném termínu nebo lokalitě dostupná.
                                </li>
                            </ol>
                        </Section>
                    </div>

                    {/* ── 4 ─────────────────────────────────────────────── */}
                    <div className="p-6 sm:p-10">
                        <Section id="platebni-podminky" number={4} title="Platební podmínky">
                            <ol className="list-decimal pl-5 space-y-3">
                                <li>
                                    <strong>Zákazník hradí veškeré platby výhradně Provozovateli</strong>{' '}
                                    (Sigurado s.r.o.), nikoli přímo Partnerovi provádějícímu úklidovou službu.
                                </li>
                                <li>
                                    Cena za zprostředkovanou službu je uvedena v objednávkovém formuláři
                                    a potvrzena před uzavřením smlouvy. Orientační kalkulace na Platformě je
                                    nezávazná; konečnou cenu vždy potvrdí Provozovatel.
                                </li>
                                <li>
                                    Platba je možná <strong>bankovním převodem</strong> na účet Provozovatele.
                                    Podrobnosti k platbě (číslo účtu, variabilní symbol) obdrží Zákazník
                                    v potvrzení objednávky.
                                </li>
                                <li>
                                    Splatnost faktury je <strong>14 dnů</strong> ode dne vystavení, není-li
                                    dohodnuto jinak.
                                </li>
                                <li>
                                    V případě prodlení s úhradou je Provozovatel oprávněn účtovat zákonný úrok
                                    z prodlení dle nařízení vlády č. 351/2013 Sb.
                                </li>
                                <li>
                                    Provozovatel vystaví Zákazníkovi daňový doklad (fakturu) v souladu s platnými
                                    právními předpisy.
                                </li>
                            </ol>
                        </Section>
                    </div>

                    {/* ── 5 ─────────────────────────────────────────────── */}
                    <div className="p-6 sm:p-10">
                        <Section id="odstoupeni" number={5} title="Odstoupení od smlouvy">
                            <ol className="list-decimal pl-5 space-y-3">
                                <li>
                                    Zákazník, který je spotřebitelem, má právo{' '}
                                    <strong>odstoupit od smlouvy bez udání důvodu ve lhůtě 14 dnů</strong> ode dne
                                    uzavření smlouvy, a to v souladu s § 1829 a násl. OZ.
                                </li>
                                <li>
                                    Pokud však Zákazník výslovně požádal o zahájení poskytování služby před
                                    uplynutím lhůty pro odstoupení a služba byla v mezidobí zcela splněna, právo
                                    na odstoupení zaniká (§ 1837 písm. a) OZ).
                                </li>
                                <li>
                                    Odstoupení od smlouvy Zákazník oznámí Provozovateli písemně (e-mailem na{' '}
                                    <a href="mailto:uklid@klinr.cz" className="text-primary underline underline-offset-2">uklid@klinr.cz</a>{' '}
                                    nebo poštou na adresu sídla).
                                </li>
                                <li>
                                    V případě platného odstoupení Provozovatel vrátí Zákazníkovi přijaté platby
                                    do 14 dnů od doručení odstoupení, a to stejným způsobem, jakým je přijal,
                                    nedohodnou-li se strany jinak.
                                </li>
                            </ol>
                        </Section>
                    </div>

                    {/* ── 6 ─────────────────────────────────────────────── */}
                    <div className="p-6 sm:p-10">
                        <Section id="storno" number={6} title="Storno podmínky">
                            <ol className="list-decimal pl-5 space-y-3">
                                <li>
                                    Zákazník má právo zrušit (stornovat) potvrzenou objednávku za níže uvedených
                                    podmínek.
                                </li>
                            </ol>

                            <div className="grid sm:grid-cols-2 gap-3 mt-4">
                                <div className="rounded-xl border border-green-200 bg-green-50/50 p-4">
                                    <p className="font-bold text-green-800 text-sm mb-1">✓ &nbsp;Storno zdarma</p>
                                    <p className="text-sm text-green-700">Nejpozději <strong>48 hodin</strong> před termínem služby.</p>
                                </div>
                                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                                    <p className="font-bold text-amber-800 text-sm mb-1">⚠ &nbsp;Storno poplatek 30 %</p>
                                    <p className="text-sm text-amber-700">Mezi <strong>48</strong> a <strong>24 hodinami</strong> před termínem.</p>
                                </div>
                                <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-4">
                                    <p className="font-bold text-orange-800 text-sm mb-1">⚠ &nbsp;Storno poplatek 50 %</p>
                                    <p className="text-sm text-orange-700">Méně než <strong>24 hodin</strong> před termínem.</p>
                                </div>
                                <div className="rounded-xl border border-red-200 bg-red-50/50 p-4">
                                    <p className="font-bold text-red-800 text-sm mb-1">✕ &nbsp;Poplatek 100 %</p>
                                    <p className="text-sm text-red-700">Neuskutečněná služba <strong>bez omluvy</strong>.</p>
                                </div>
                            </div>

                            <ol className="list-decimal pl-5 space-y-3 mt-4" start={6}>
                                <li>
                                    Storno objednávky provede Zákazník písemně e-mailem na{' '}
                                    <a href="mailto:uklid@klinr.cz" className="text-primary underline underline-offset-2">uklid@klinr.cz</a>{' '}
                                    nebo telefonicky na{' '}
                                    <a href="tel:+420777645610" className="text-primary underline underline-offset-2">+420 777 645 610</a>.
                                </li>
                                <li>
                                    Provozovatel si vyhrazuje právo zrušit objednávku z provozních důvodů (např.
                                    náhlá indispozice Partnera). V takovém případě bude Zákazníkovi nabídnut
                                    náhradní termín nebo vrácena plná cena.
                                </li>
                            </ol>
                        </Section>
                    </div>

                    {/* ── 7 ─────────────────────────────────────────────── */}
                    <div className="p-6 sm:p-10">
                        <Section id="reklamacni-rad" number={7} title="Reklamační řád">
                            <ol className="list-decimal pl-5 space-y-3">
                                <li>
                                    Zákazník má právo reklamovat vady zprostředkované služby. Reklamaci je nutné
                                    uplatnit <strong>bez zbytečného odkladu</strong>, nejpozději však do{' '}
                                    <strong>3 pracovních dnů</strong> od poskytnutí služby.
                                </li>
                                <li>
                                    Reklamaci lze podat:
                                    <ul className="list-disc pl-5 mt-2 space-y-1">
                                        <li>e-mailem na <a href="mailto:uklid@klinr.cz" className="text-primary underline underline-offset-2">uklid@klinr.cz</a></li>
                                        <li>telefonicky na <a href="tel:+420777645610" className="text-primary underline underline-offset-2">+420 777 645 610</a></li>
                                    </ul>
                                </li>
                                <li>
                                    Zákazník v reklamaci popíše vady poskytnuté služby a přiloží případnou
                                    fotodokumentaci.
                                </li>
                                <li>
                                    Provozovatel potvrdí přijetí reklamace do <strong>3 pracovních dnů</strong>{' '}
                                    a rozhodne o jejím vyřízení nejpozději do <strong>30 dnů</strong> ode dne
                                    jejího uplatnění, v souladu s § 19 odst. 3 zákona č. 634/1992 Sb., o ochraně
                                    spotřebitele.
                                </li>
                                <li>
                                    Uznané reklamace mohou být vyřízeny:
                                    <ul className="list-disc pl-5 mt-2 space-y-1">
                                        <li>opakovaným provedením služby (náhradní úklid) na náklady Provozovatele;</li>
                                        <li>přiměřenou slevou z ceny služby;</li>
                                        <li>vrácením úhrady za vadně provedenou službu.</li>
                                    </ul>
                                </li>
                                <li>
                                    Reklamace se nevztahuje na subjektivní hodnocení estetického výsledku, pokud
                                    byla služba provedena v souladu s objednávkou a standardními postupy.
                                </li>
                            </ol>
                        </Section>
                    </div>

                    {/* ── 8 ─────────────────────────────────────────────── */}
                    <div className="p-6 sm:p-10">
                        <Section id="odpovednost" number={8} title="Odpovědnost">
                            <ol className="list-decimal pl-5 space-y-3">
                                <li>
                                    Provozovatel odpovídá za <strong>řádné zprostředkování služby</strong>, tj. za
                                    včasné předání objednávky Partnerovi, koordinaci termínu a komunikaci se
                                    Zákazníkem.
                                </li>
                                <li>
                                    Provozovatel <strong>neodpovídá za škody</strong>, které vznikly přímým
                                    výkonem úklidové služby Partnerem (např. poškození majetku), pokud prokáže,
                                    že vynaložil veškerou odbornou péči při výběru Partnera.
                                </li>
                                <li>
                                    Provozovatel však <strong>napomáhá řešení reklamací a sporů</strong> mezi
                                    Zákazníkem a Partnerem a aktivně se podílí na nalezení řešení.
                                </li>
                                <li>
                                    Partneři spolupracující s Provozovatelem jsou <strong>pojištěni</strong>.
                                    Provozovatel uchovává doklady o pojištění Partnerů a na vyžádání je může
                                    Zákazníkovi doložit.
                                </li>
                                <li>
                                    Provozovatel neodpovídá za škody vzniklé v důsledku vyšší moci, neposkytnutí
                                    součinnosti Zákazníkem, zadání nesprávných nebo neúplných údajů v objednávce,
                                    nebo neoprávněného přístupu třetích osob k uživatelskému účtu Zákazníka.
                                </li>
                            </ol>
                        </Section>
                    </div>

                    {/* ── 9 ─────────────────────────────────────────────── */}
                    {/* ── 9 ─────────────────────────────────────────────── */}
                    <div className="p-6 sm:p-10">
                        <Section id="gdpr" number={9} title="Ochrana osobních údajů">
                            <p>
                                Ochrana vašich osobních údajů je pro nás prioritou. Podrobné informace o tom, jak zpracováváme
                                vaše osobní údaje, jaká jsou vaše práva a jak je můžete uplatnit, naleznete v samostatném dokumentu:
                            </p>
                            <div className="mt-5">
                                <Link to="/zasady-ochrany-osobnich-udaju" className="w-full sm:w-auto inline-block">
                                    <Button variant="outline" className="w-full sm:w-auto h-auto py-3 sm:py-0 sm:h-12 gap-3 px-4 sm:px-6 border-slate-200 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all group whitespace-normal text-left sm:text-center">
                                        <ShieldCheck className="h-5 w-5 sm:h-4 sm:w-4 text-slate-400 group-hover:text-primary transition-colors shrink-0" />
                                        <span>Zobrazit Zásady ochrany osobních údajů</span>
                                    </Button>
                                </Link>
                            </div>
                        </Section>
                    </div>

                    {/* ── 10 ────────────────────────────────────────────── */}
                    <div className="p-6 sm:p-10">
                        <Section id="adr" number={10} title="Mimosoudní řešení sporů (ADR)">
                            <ol className="list-decimal pl-5 space-y-3">
                                <li>
                                    V případě sporu mezi Provozovatelem a Zákazníkem, který je spotřebitelem, má
                                    Zákazník právo na <strong>mimosoudní řešení sporu</strong> v souladu se zákonem
                                    č. 634/1992 Sb., o ochraně spotřebitele.
                                </li>
                                <li>
                                    Subjektem mimosoudního řešení spotřebitelských sporů je{' '}
                                    <strong>Česká obchodní inspekce</strong> (ČOI):

                                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 mt-3 text-sm space-y-1.5 not-prose">
                                        <p className="text-slate-700">Ústřední inspektorát — oddělení ADR</p>
                                        <p className="text-slate-700">Štěpánská 796/44, 110 00 Praha 1</p>
                                        <p>Web: <a href="https://www.coi.cz" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">www.coi.cz</a></p>
                                        <p>E-mail: <a href="mailto:adr@coi.cz" className="text-primary underline underline-offset-2">adr@coi.cz</a></p>
                                    </div>
                                </li>
                                <li>
                                    Zákazník může rovněž využít platformu pro řešení sporů on-line (ODR) zřízenou
                                    Evropskou komisí, dostupnou na{' '}
                                    <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                                        https://ec.europa.eu/consumers/odr
                                    </a>.
                                </li>
                            </ol>
                        </Section>
                    </div>

                    {/* ── 11 ────────────────────────────────────────────── */}
                    <div className="p-6 sm:p-10">
                        <Section id="zaverecna-ustanoveni" number={11} title="Závěrečná ustanovení">
                            <ol className="list-decimal pl-5 space-y-3">
                                <li>
                                    Tyto VOP se řídí právním řádem České republiky, zejména zákonem č. 89/2012 Sb.,
                                    občanským zákoníkem, a zákonem č. 634/1992 Sb., o ochraně spotřebitele, ve
                                    znění pozdějších předpisů.
                                </li>
                                <li>
                                    Provozovatel si vyhrazuje právo tyto VOP kdykoliv změnit. O změnách bude
                                    Zákazník informován prostřednictvím Platformy. Pokračováním v užívání služeb
                                    po účinnosti změn Zákazník vyjadřuje souhlas s novým zněním VOP.
                                </li>
                                <li>
                                    Je-li některé ustanovení těchto VOP neplatné nebo neúčinné, nemá to vliv na
                                    platnost a účinnost ostatních ustanovení.
                                </li>
                                <li>
                                    Smlouva je uzavírána v <strong>českém jazyce</strong>.
                                </li>
                                <li>
                                    Tyto VOP nabývají platnosti a účinnosti dnem <strong>12. února 2026</strong>.
                                </li>
                            </ol>
                        </Section>
                    </div>

                </div>

                {/* ── Bottom signature ──────────────────────────────── */}
                <div className="mt-10 text-center space-y-1">
                    <p className="text-sm text-slate-400">
                        Sigurado s.r.o. &nbsp;·&nbsp; IČO: 10850481 &nbsp;·&nbsp; Boženy Němcové 524/11a, 460 05 Liberec
                    </p>
                    <p className="text-sm text-slate-400">
                        <a href="mailto:uklid@klinr.cz" className="hover:text-slate-600 transition-colors">uklid@klinr.cz</a>
                        {' · '}
                        <a href="tel:+420777645610" className="hover:text-slate-600 transition-colors">+420 777 645 610</a>
                    </p>
                </div>
            </main>

            {/* ── Footer ────────────────────────────────────────────── */}
            <footer className="bg-slate-950 text-white py-8 border-t border-white/5 mt-8">
                <div className="container mx-auto max-w-7xl px-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500 font-medium">
                    <p>&copy; {new Date().getFullYear()} Klinr. Všechna práva vyhrazena.</p>
                    <div className="flex gap-6">
                        <Link to="/landing" className="hover:text-white transition-colors">Hlavní stránka</Link>
                        <a href="mailto:uklid@klinr.cz" className="hover:text-white transition-colors">Kontakt</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
