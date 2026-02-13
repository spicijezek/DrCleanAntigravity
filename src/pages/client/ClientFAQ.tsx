import React from 'react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle, ChevronLeft, MessageCircle, Phone, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function ClientFAQ() {
    const faqs = [
        {
            question: "Jak funguje věrnostní program?",
            answer: "Body získáváte automaticky za každý uskutečněný a zaplacený úklid. Za každou utracenou korunu získáte věrnostní body, které pak můžete v sekci 'Body' vyměnit za slevy na další úklidy nebo za hodnotné dárky."
        },
        {
            question: "Jak si mohu objednat úklid?",
            answer: "Pro objednání stačí v menu vybrat 'Nová rezervace'. Zvolíte si typ úklidu (pravidelný, jednorázový, mytí oken atd.), vyplníte potřebné detaily a vyberete si volný termín, který vám vyhovuje."
        },
        {
            question: "Můžu zrušit nebo změnit termín úklidu?",
            answer: "Ano, termín můžete změnit nebo zrušit přímo v detailu vaší rezervace. Prosíme o provedení změn alespoň 24 hodin předem, abychom mohli přeplánovat kapacity našich kolegů."
        },
        {
            question: "Kdo jsou vaši úklidoví pracovníci?",
            answer: "Naši pracovníci jsou pečlivě vybíráni, procházejí osobním pohovorem, školením a kontrolou čistoty rejstříku trestů. V aplikaci vždy uvidíte, kdo k vám na úklid přijde, včetně jeho profilu a hodnocení ostatních klientů."
        },
        {
            question: "Co když nejsem spokojený s výsledkem úklidu?",
            answer: "Vaše spokojenost je pro nás absolutně klíčová. Pokud nejste s něčím spokojeni, vyfoťte prosím nedostatky a pošlete nám je přes aplikaci nebo kontaktujte naši podporu. Sjednáme nápravu v nejkratším možném čase."
        },
        {
            question: "Jak fungují referral (doporučující) kódy?",
            answer: "V sekci 'Body' najdete svůj unikátní kód. Pokud jej nasdílíte příteli a on jej zadá při své první registraci, oba získáte bonusové body na váš věrnostní účet poté, co proběhne jeho první úklid."
        },
        {
            question: "Kde najdu faktury a historii plateb?",
            answer: "Všechny doklady a přehled plateb najdete v sekci 'Historie úklidů' (původně Fakturace). Zde si můžete faktury stáhnout ve formátu PDF."
        },
        {
            question: "Jsou mé osobní údaje v aplikaci v bezpečí?",
            answer: "Naprosto. Aplikace využívá moderní šifrování a splňuje veškeré standardy GDPR. Vaše platební údaje a osobní informace jsou u nás v maximálním bezpečí."
        }
    ];

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6 pb-24">
            <div className="flex items-center gap-4 mb-2">
                <Button variant="ghost" size="icon" asChild className="rounded-full">
                    <Link to="/klient">
                        <ChevronLeft className="h-6 w-6" />
                    </Link>
                </Button>
                <h1 className="text-2xl font-black tracking-tight">Časté dotazy (FAQ)</h1>
            </div>

            <Card className="border-none shadow-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-[2rem] overflow-hidden">
                <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                            <HelpCircle className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-xl font-bold">Jak vám můžeme pomoci?</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        {faqs.map((faq, index) => (
                            <AccordionItem key={index} value={`item-${index}`} className="border-slate-200/60 dark:border-slate-700/60">
                                <AccordionTrigger className="text-left font-semibold hover:text-primary transition-colors py-4">
                                    {faq.question}
                                </AccordionTrigger>
                                <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>

            {/* Support Card */}
            <Card className="border-2 border-primary/20 bg-primary/5 rounded-[2rem] p-6 space-y-4 shadow-lg">
                <div className="flex items-center gap-3">
                    <MessageCircle className="h-6 w-6 text-primary" />
                    <h3 className="text-lg font-bold">Nenašli jste odpověď?</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                    Náš tým podpory je vám k dispozici každý pracovní den od 8:00 do 18:00.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <Button asChild variant="outline" className="rounded-xl border-primary/20 hover:bg-primary/10 gap-2">
                        <a href="tel:+420777645610">
                            <Phone className="h-4 w-4" />
                            Zavolat nám
                        </a>
                    </Button>
                    <Button asChild variant="outline" className="rounded-xl border-primary/20 hover:bg-primary/10 gap-2">
                        <a href="mailto:uklid@klinr.cz">
                            <Mail className="h-4 w-4" />
                            Napsat email
                        </a>
                    </Button>
                </div>
            </Card>
        </div>
    );
}
