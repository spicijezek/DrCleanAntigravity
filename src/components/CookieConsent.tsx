import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Cookie, ShieldCheck, X } from 'lucide-react';

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookie_consent');
        if (!consent) {
            // Show banner after a short delay
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleConsent = (type: 'all' | 'necessary' | 'decline') => {
        localStorage.setItem('cookie_consent', type);
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-in slide-in-from-bottom-full duration-500">
            <div className="container max-w-5xl mx-auto">
                <div className="bg-slate-900/95 backdrop-blur-md text-white p-6 rounded-2xl shadow-2xl border border-white/10 flex flex-col md:flex-row items-center gap-6">

                    {/* Icon & Text */}
                    <div className="flex-1 space-y-2 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-2 text-primary font-bold mb-1">
                            <Cookie className="h-5 w-5" />
                            <span>Nastavení cookies</span>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            Používáme soubory cookies k zajištění funkčnosti webu a pro analýzu návštěvnosti.
                            Vybírejte dle libosti, respektujeme vaše soukromí.{" "}
                            <a href="/cookies" className="text-white font-bold underline underline-offset-4 hover:text-primary transition-colors">
                                Více informací
                            </a>
                        </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-wrap justify-center gap-3 w-full md:w-auto">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleConsent('decline')}
                            className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white rounded-xl"
                        >
                            Odmítnout
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleConsent('necessary')}
                            className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white rounded-xl"
                        >
                            Pouze nezbytné
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => handleConsent('all')}
                            className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(var(--primary),0.3)]"
                        >
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            Přijmout vše
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
