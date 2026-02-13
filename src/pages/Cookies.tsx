
import { Link, useLocation, useNavigate } from 'react-router-dom';
import klinrLogo from '@/assets/Klinr Logo Full.png';
import { ArrowLeft, Cookie, ShieldCheck, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

/* ──────────────────────────────────────────────────────────────
   Reusable building blocks
   ────────────────────────────────────────────────────────────── */

const Section = ({
    id,
    title,
    children,
}: {
    id: string;
    title: string;
    children: React.ReactNode;
}) => (
    <section id={id} className="scroll-mt-24">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mb-4">
            {title}
        </h2>
        <div className="space-y-4 text-[15px] leading-relaxed text-slate-600">
            {children}
        </div>
    </section>
);

/* ──────────────────────────────────────────────────────────────
   Main page
   ────────────────────────────────────────────────────────────── */

export default function CookiesPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* ── Header ────────────────────────────────────────────── */}
            <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                <div className="flex flex-nowrap h-16 sm:h-20 items-center justify-between gap-2 sm:gap-4 px-4 mx-auto max-w-7xl min-w-0">
                    <Link to="/landing">
                        <img src={klinrLogo} alt="Klinr" className="h-7 sm:h-8 w-auto flex-shrink-0" />
                    </Link>
                    <Link to="/landing">
                        <Button variant="outline" className="flex-shrink-0 gap-2 text-sm">
                            <ArrowLeft className="h-4 w-4" />
                            Zpět na hlavní stránku
                        </Button>
                    </Link>
                </div>
            </header>

            {/* ── Hero banner ───────────────────────────────────────── */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white">
                <div className="container mx-auto max-w-4xl px-4 py-12 sm:py-16 text-center space-y-3">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 border border-white/20 mb-2">
                        <Cookie className="h-7 w-7 text-white/80" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
                        Zásady používání souborů Cookies
                    </h1>
                    <p className="text-slate-400 text-sm">
                        Platné od 12. února 2026 &nbsp;·&nbsp; Sigurado s.r.o.
                    </p>
                </div>
            </div>

            {/* ── Content ───────────────────────────────────────────── */}
            <main className="container mx-auto max-w-4xl px-4 py-10 sm:py-14">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-100">

                    <div className="p-6 sm:p-10">
                        <Section id="intro" title="Co jsou to cookies?">
                            <p>
                                Cookies jsou malé textové soubory, které se ukládají do vašeho zařízení (počítače, tabletu nebo mobilního telefonu) při návštěvě webových stránek.
                                Tyto soubory umožňují webu si zapamatovat vaše preference a úkony (jako je přihlášení, jazyk, velikost písma a další nastavení zobrazení) po určitou dobu,
                                takže je nemusíte zadávat znovu, když se na stránky vrátíte nebo přecházíte z jedné stránky na druhou.
                            </p>
                        </Section>
                    </div>

                    <div className="p-6 sm:p-10">
                        <Section id="types" title="Jaké typy cookies používáme?">
                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                        Nezbytné (Technické) cookies
                                    </h3>
                                    <p>
                                        Tyto cookies jsou nutné pro správné fungování našich webových stránek a nelze je v našich systémech vypnout.
                                        Obvykle se nastavují pouze v reakci na vámi provedené akce, které představují požadavek na služby, jako je nastavení preferencí ochrany soukromí, přihlášení nebo vyplňování formulářů.
                                        Svůj prohlížeč můžete nastavit tak, aby tyto cookies blokoval nebo vás na ně upozorňoval, ale některé části webu pak nebudou fungovat.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                        Výkonnostní a analytické cookies
                                    </h3>
                                    <p>
                                        Tyto cookies nám umožňují počítat návštěvy a zdroje provozu, abychom mohli měřit a zlepšovat výkon našich stránek.
                                        Pomáhají nám zjistit, které stránky jsou nejoblíbenější a které nejméně, a vidět, jak se návštěvníci po webu pohybují.
                                        Všechny informace, které tyto cookies shromažďují, jsou souhrnné, a tedy anonymní. Pokud tyto cookies nepovolíte, nebudeme vědět, kdy jste navštívili naše stránky, a nebudeme moci sledovat jejich výkon.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                        Marketingové cookies
                                    </h3>
                                    <p>
                                        Tyto cookies mohou být na našich stránkách nastaveny našimi reklamními partnery. Mohou být těmito společnostmi použity k vytvoření profilu vašich zájmů a zobrazení relevantních reklam na jiných stránkách.
                                        Přímo neukládají osobní údaje, ale jsou založeny na jedinečné identifikaci vašeho prohlížeče a internetového zařízení. Pokud tyto cookies nepovolíte, bude se vám zobrazovat méně cílená reklama.
                                    </p>
                                </div>
                            </div>
                        </Section>
                    </div>

                    <div className="p-6 sm:p-10">
                        <Section id="specific" title="Konkrétní cookies, které můžeme využívat">
                            <div className="overflow-x-auto rounded-lg border border-slate-200">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200">
                                            <th className="text-left p-3 font-bold text-slate-800">Název / Poskytovatel</th>
                                            <th className="text-left p-3 font-bold text-slate-800 border-l border-slate-200">Typ</th>
                                            <th className="text-left p-3 font-bold text-slate-800 border-l border-slate-200">Účel</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        <tr>
                                            <td className="p-3 text-slate-600 font-medium">Google Analytics</td>
                                            <td className="p-3 text-slate-600 border-l border-slate-200">Analytické</td>
                                            <td className="p-3 text-slate-600 border-l border-slate-200">Analýza návštěvnosti webu</td>
                                        </tr>
                                        <tr className="bg-slate-50/50">
                                            <td className="p-3 text-slate-600 font-medium">Google Ads</td>
                                            <td className="p-3 text-slate-600 border-l border-slate-200">Marketingové</td>
                                            <td className="p-3 text-slate-600 border-l border-slate-200">Měření efektivity reklam</td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 text-slate-600 font-medium">Facebook Pixel</td>
                                            <td className="p-3 text-slate-600 border-l border-slate-200">Marketingové</td>
                                            <td className="p-3 text-slate-600 border-l border-slate-200">Cílení reklamy na sociálních sítích</td>
                                        </tr>
                                        <tr className="bg-slate-50/50">
                                            <td className="p-3 text-slate-600 font-medium">Sklik</td>
                                            <td className="p-3 text-slate-600 border-l border-slate-200">Marketingové</td>
                                            <td className="p-3 text-slate-600 border-l border-slate-200">Retargeting a měření konverzí</td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 text-slate-600 font-medium">Vlastní session</td>
                                            <td className="p-3 text-slate-600 border-l border-slate-200">Nezbytné</td>
                                            <td className="p-3 text-slate-600 border-l border-slate-200">Přihlášení uživatele a funkčnost košíku</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </Section>
                    </div>

                    <div className="p-6 sm:p-10">
                        <Section id="management" title="Jak spravovat cookies?">
                            <p>
                                Máte právo rozhodnout, zda chcete cookies přijmout nebo odmítnout. Své preference můžete nastavit v našem cookie banneru při první návštěvě, nebo je můžete kdykoliv změnit smazáním historie prohlížení a cookies ve vašem prohlížeči.
                            </p>
                            <p className="mt-4">
                                Většina webových prohlížečů umožňuje kontrolu nad většinou cookies prostřednictvím nastavení prohlížeče. Chcete-li se dozvědět více o cookies, včetně toho, jak zjistit, jaké cookies byly nastaveny, navštivte stránky <a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-primary underline font-medium">www.allaboutcookies.org</a>.
                            </p>
                        </Section>
                    </div>

                    <div className="p-6 sm:p-10">
                        <Section id="contact" title="Kontaktujte nás">
                            <p>
                                Máte-li jakékoli dotazy ohledně našich zásad používání cookies, kontaktujte nás prosím na e-mailu:
                            </p>
                            <p className="mt-4 flex items-center gap-2">
                                <Mail className="h-5 w-5 text-primary" />
                                <a href="mailto:uklid@klinr.cz" className="text-primary font-bold text-lg hover:underline">uklid@klinr.cz</a>
                            </p>
                        </Section>
                    </div>

                </div>
            </main>

            {/* ── Footer ────────────────────────────────────────────── */}
            <footer className="bg-slate-950 text-white py-8 border-t border-white/5 mt-8">
                <div className="container mx-auto max-w-7xl px-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500 font-medium">
                    <p>&copy; {new Date().getFullYear()} Klinr. Všechna práva vyhrazena.</p>
                    <div className="flex gap-6">
                        <Link to="/landing" className="hover:text-white transition-colors">Hlavní stránka</Link>
                        <Link to="/vop" className="hover:text-white transition-colors">VOP</Link>
                        <Link to="/zasady-ochrany-osobnich-udaju" className="hover:text-white transition-colors">Ochrana údajů</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
