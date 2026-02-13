import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Clock, Users, Sparkles, AppWindow, Sofa, Phone, Check, Mail, Eye, CreditCard, ClipboardCheck, Gift, UserPlus, CheckCircle2, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import klinrLogo from '@/assets/Klinr Logo Full.png';
import landingHeroVideo from '@/assets/landing-hero-video.mp4';
import uklidVideo from '@/assets/uklid-video.mp4';
import windowCleaningImage from '@/assets/window-cleaning-image.jpg';
import upholsteryImage from '@/assets/upholstery-image-new.jpg';
import igiLogo from '@/assets/igi-vratislavice.png';
import medeaLogo from '@/assets/medea-therapy.png';
import kingsLogo from '@/assets/kings-barbers.png';
import xmLogo from '@/assets/xm.png';
import edoLogo from '@/assets/edo-finance.png';
import ref1 from '@/assets/Reference1.png';
import ref2 from '@/assets/Reference2.png';
import ref3 from '@/assets/Reference3.png';
import ref4 from '@/assets/Reference4.png';
import ref5 from '@/assets/Reference5.png';
import ref6 from '@/assets/Reference6.png';
import ref7 from '@/assets/Reference7.png';
import ref8 from '@/assets/Reference8.png';
import ref9 from '@/assets/Reference9.png';
import ref10 from '@/assets/Reference10.png';
import ref11 from '@/assets/Reference11.png';
import ref12 from '@/assets/Reference12.png';
import maidImage from '@/assets/maid.png';

const ReviewCard = ({ name, text }: { name: string; text: string }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const isLong = text.length > 150;

    return (
        <Card className="flex-shrink-0 w-[350px] mx-4 bg-white border-2 border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-1 text-yellow-500">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                </div>
                <div className="space-y-2">
                    <p className={cn(
                        "text-slate-600 text-sm leading-relaxed",
                        !isExpanded && isLong && "line-clamp-3"
                    )}>
                        {text}
                    </p>
                    {isLong && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsExpanded(!isExpanded);
                            }}
                            className="text-primary text-xs font-bold hover:underline"
                        >
                            {isExpanded ? 'Zobrazit méně' : 'číst dále...'}
                        </button>
                    )}
                </div>
                <div className="pt-2 border-t border-slate-50">
                    <p className="font-bold text-slate-900 text-sm">{name}</p>
                    <p className="text-slate-400 text-xs italic">Ověřený zákazník</p>
                </div>
            </CardContent>
        </Card>
    );
};

export default function LandingPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [selectedService, setSelectedService] = useState<string | null>(null);

    const reviews = [
        { name: "Michal Vaněk", text: "Oceňujeme příkladný přístup i skvěle odvedenou práci." },
        { name: "Jana Tomešová", text: "Poprvé jsem si objednala firmu na mytí oken , jednání s jednatelem bylo příjemné a odvedená práce perfektní" },
        { name: "Věra Matyášová", text: "Zlomila jsem si ruku a rozhodla jsem se, že si nechám poprvé v životě okna umýt. Nelituji, jednání s firmou bylo rychlé, příjemné, a odvedená práce vynikající. K čištění oken vlastními silami se už nikdy nevrátím!" },
        { name: "Martin Procházka", text: "Perfektně odvedená práce. Děkuji moc." },
        { name: "Carlos carlosino", text: "Mladá firma, což jsem se nejdříve bál, ale opak je pravdou . Jak majitel, tak uklízečky jsou profesionální a svou práci odvádí opravdu dokonale . Jsem s touto firmou opravdu spokojen a doufám, že jim to vydrží. Určitě tuto úklidovou službu doporučuji. Carlos" },
        { name: "Milena Šiftová", text: "Profesionální přístup. Excelentní kvalita. Příjemná cena." },
        { name: "Milena Elstnerová", text: "Velmi spokojená." },
        { name: "Dominika Skalická", text: "Výborné služby i komunikace. Mnohem lepší kvalita práce než od tří předchozích firem v regionu s masivní reklamou. Rychlejší, slušnější a levnější. Hlavně opravdu důslední a milí. Nesetkáte se s tím, že by vám řekli: “To nejde.” I pracovnice byly usměvavé, veselé, na vše se doptaly, čas využívaly k úklidu, nikoliv ke kouření za rohem… Vytvářely příjemnou atmosféru, práce jim nevadí. Vedoucí svůj personál osobně dlouhodobě školí přímo v terénu a úklid osobně kontroluje, zároveň je na personál milý. Jestli si chcete udělat “hotel” z vlastního domova, bezostyšně si lebedit a k tomu cítit, že je vám to přáno, tak se ozvěte. Pánové, není lepší dar k narození dítěte než služby takové firmy. ;-)" }
    ];

    // Track UTM parameters for Google Ads attribution
    useEffect(() => {
        const utmSource = searchParams.get('utm_source');
        const utmMedium = searchParams.get('utm_medium');
        const utmCampaign = searchParams.get('utm_campaign');

        if (utmSource || utmMedium || utmCampaign) {
            // Store UTM params in sessionStorage for attribution
            sessionStorage.setItem('landing_utm_source', utmSource || '');
            sessionStorage.setItem('landing_utm_medium', utmMedium || '');
            sessionStorage.setItem('landing_utm_campaign', utmCampaign || '');
        }
    }, [searchParams]);

    // Services data - matching ClientServices.tsx
    const services = [
        {
            id: 'cleaning',
            title: 'Úklid',
            description: 'Kompletní úklid domácnosti nebo firmy',
            media: uklidVideo,
            mediaType: 'video' as const,
            icon: Sparkles,
            buttonText: 'Chci naklizeno'
        },
        {
            id: 'window_cleaning',
            title: 'Mytí Oken',
            description: 'Péče o skla, rámy a parapety',
            media: windowCleaningImage,
            mediaType: 'image' as const,
            icon: AppWindow,
            buttonText: 'Spočítat cenu'
        },
        {
            id: 'upholstery_cleaning',
            title: 'Čištění Čalounění',
            description: 'Hloubkové čištění sedaček, koberců, matrací a křesel',
            media: upholsteryImage,
            mediaType: 'image' as const,
            icon: Sofa,
            buttonText: 'Kalkulace zdarma'
        }
    ];

    // Top 3 objections (placeholder - customize these!)
    const objections = [
        {
            id: 1,
            question: 'Kolik mě to bude stát?',
            answer: <span>Cena je důležitá. Proto u nás vždy vidíte finální <a href="#services" onClick={(e) => { e.preventDefault(); document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-primary font-semibold underline underline-offset-4 decoration-primary/40 hover:decoration-primary cursor-pointer transition-colors">kalkulaci</a> předem, bez skrytých poplatků a překvapení. Platíte jen za to, co si skutečně objednáte, a přesně víte, co je součástí úklidu.</span>
        },
        {
            id: 2,
            question: 'Koho si vlastně pustím domů/do firmy?',
            answer: 'Chápeme, že pustit cizího člověka domů, nebo do firmy není samozřejmost. Proto spolupracujeme jen s prověřenými partnery, jejichž pracovníci jsou vyškolení, pojištění a spolehliví. Garantujeme maximální profesionalitu, diskrétnost a bezpečnost. Váš prostor je v dobrých rukou.'
        },
        {
            id: 3,
            question: 'Už jsem měl špatnou zkušenost.',
            answer: 'Chápeme, že po špatné zkušenosti je těžké znovu důvěřovat. Proto si s Vámi rádi předem projdeme všechna očekávání a zaměříme se na to, co v minulosti nefungovalo. Po úklidu máte vždy možnost dát zpětnou vazbu a případné nedostatky ihned řešíme.'
        }
    ];

    const handleServiceSelect = (serviceId: string) => {
        setSelectedService(serviceId);
        // Redirect to specific service booking page
        const serviceUrls: Record<string, string> = {
            'cleaning': '/rezervace-uklid',
            'window_cleaning': '/rezervace-mytioken',
            'upholstery_cleaning': '/rezervace-cistenicalouneni'
        };
        const url = serviceUrls[serviceId] || `/rezervace?service=${serviceId}`;
        navigate(url);
    };

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                <div className="flex flex-nowrap h-16 sm:h-20 items-center justify-between gap-2 sm:gap-4 px-4 mx-auto max-w-7xl min-w-0">
                    <img src={klinrLogo} alt="Klinr" className="h-7 sm:h-8 w-auto flex-shrink-0" />
                    <Button
                        className="flex-shrink-0 whitespace-nowrap h-10 sm:h-11 px-4 sm:px-6 text-xs sm:text-base font-bold bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 hover:from-slate-800 hover:via-slate-700 hover:to-indigo-900 text-white border-0 shadow-lg shadow-slate-900/20 rounded-xl"
                        onClick={() => navigate('/klient-prihlaseni')}
                    >
                        Přihlášení | Registrace
                    </Button>
                </div>
            </header>

            {/* Hero Section - Centered */}
            <section className="py-12 sm:py-20 bg-gradient-to-br from-blue-50 via-white to-blue-50">
                <div className="container mx-auto max-w-5xl px-4">
                    {/* Centered content */}
                    <div className="text-center space-y-8">
                        {/* Headline */}
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground leading-tight">
                                Profesionální úklid bez starostí
                            </h1>
                            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
                                Péče o Vaši domácnost a firmu. Úklid, okna i čalounění - kvalitně a transparentně.
                            </p>
                        </div>

                        {/* Hero Video - Centered */}
                        <div className="relative max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-1000 delay-300 fill-mode-both">
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                                <video
                                    src={landingHeroVideo}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="w-full h-auto"
                                />
                                {/* Trust badge overlays */}
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <div className="bg-green-500 text-white px-3 py-1.5 rounded-full font-bold shadow-lg text-sm">
                                        Pojištění
                                    </div>
                                    <div className="bg-blue-500 text-white px-3 py-1.5 rounded-full font-bold shadow-lg text-sm">
                                        Prověření
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Lead Magnet & CTA */}
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500 fill-mode-both">
                            <p className="text-sm sm:text-base text-muted-foreground font-medium">
                                Zabere to jen 2 minuty. Využijte online kalkulačky zdarma.
                            </p>
                            <PremiumButton
                                size="lg"
                                className="w-full sm:w-auto text-lg px-8 py-6 h-auto bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 hover:from-slate-800 hover:via-slate-700 hover:to-indigo-900 text-white shadow-2xl shadow-slate-900/30 rounded-xl"
                                onClick={() => {
                                    document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                            >
                                Chci nezávaznou nabídku
                            </PremiumButton>
                        </div>

                        {/* Trust Indicators */}
                        <div className="flex flex-wrap justify-center gap-6 sm:gap-8 pt-4">
                            <div className="flex items-center gap-2">
                                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                <span className="font-semibold">9.6/10</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                <span className="font-semibold">100+ klientů</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-primary" />
                                <span className="font-semibold">Rychlý termín</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Service Selection - Now 3 columns on desktop, full-width on mobile */}
            <section id="services" className="py-16 sm:py-24 bg-white">
                <div className="container mx-auto max-w-7xl px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-4">
                            Vyberte si službu
                        </h2>
                        <p className="text-lg text-muted-foreground">
                            Nabízíme komplexní služby pro Váš domov i firmu
                        </p>
                    </div>

                    {/* 3 columns on desktop, full-width on mobile */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {services.map((service) => {
                            const Icon = service.icon;
                            return (
                                <Card
                                    key={service.id}
                                    className="cursor-pointer hover:shadow-xl transition-all border-2 hover:border-primary group hover:scale-[1.02] duration-300"
                                    onClick={() => handleServiceSelect(service.id)}
                                >
                                    <CardContent className="p-6 space-y-4">
                                        <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
                                            {service.mediaType === 'video' ? (
                                                <video
                                                    src={service.media}
                                                    autoPlay
                                                    loop
                                                    muted
                                                    playsInline
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <img
                                                    src={service.media}
                                                    alt={service.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Icon className="h-5 w-5 text-primary" />
                                                <h3 className="text-xl font-bold text-foreground">
                                                    {service.title}
                                                </h3>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {service.description}
                                            </p>
                                        </div>

                                        <Button
                                            className="w-full py-8 text-base font-semibold rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 hover:from-slate-800 hover:via-slate-700 hover:to-indigo-900 text-white border-0 shadow-lg shadow-slate-900/20 transition-all"
                                        >
                                            {service.buttonText} →
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Objections Section - The 3 Bullets */}
            <section className="py-16 sm:py-24 bg-muted/30">
                <div className="container mx-auto max-w-4xl px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-4">
                            Proč si vybrat Klinr?
                        </h2>
                    </div>

                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
                        {objections.map((objection) => (
                            <Card key={objection.id} className="border-2 hover:border-primary/50 transition-colors hover:scale-[1.01] duration-300">
                                <CardContent className="p-6">
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {objection.id}
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-lg font-bold text-foreground">
                                                {objection.question}
                                            </h3>
                                            <p className="text-muted-foreground">
                                                {objection.answer}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* CTA After Objections */}
                    <div className="mt-12 text-center">
                        <Button
                            size="lg"
                            className="w-full sm:w-auto text-lg px-8 py-6 h-auto bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 hover:from-slate-800 hover:via-slate-700 hover:to-indigo-900 text-white shadow-2xl shadow-slate-900/30 border-0 rounded-xl"
                            onClick={() => {
                                document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                        >
                            <Sparkles className="mr-2 h-5 w-5" />
                            Chci nezávaznou nabídku
                        </Button>
                    </div>
                </div>
            </section>

            {/* Client Reviews Marquee */}
            <section className="py-20 bg-slate-50/50 overflow-hidden border-y border-slate-100">
                <div className="mb-12 text-center">
                    <p className="text-sm text-primary font-black uppercase tracking-widest mb-3">Recenze od vás</p>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900">Co o nás říkají klienti</h2>
                </div>

                <div className="flex gap-4 animate-scroll-left w-max hover:[animation-play-state:paused] transition-all duration-500 py-4">
                    {[...reviews, ...reviews, ...reviews].map((review, index) => (
                        <ReviewCard key={index} name={review.name} text={review.text} />
                    ))}
                </div>
            </section>

            {/* App Presentation Section */}
            <section className="py-16 sm:py-24 bg-slate-50/50">
                <div className="container mx-auto max-w-5xl px-4">
                    <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white relative group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                            <Sparkles className="h-48 w-48 text-primary" />
                        </div>
                        <div className="absolute -bottom-24 -left-24 h-64 w-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

                        <CardContent className="p-8 md:p-16 space-y-10 relative z-10">
                            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
                                {/* Left Column: Content */}
                                <div className="flex-1 text-center md:text-left space-y-8">
                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-primary-foreground text-xs font-black uppercase tracking-widest">
                                        <Sparkles className="h-3.5 w-3.5" /> BONUS PRO VÁS
                                    </div>
                                    <h2 className="text-3xl md:text-5xl font-black leading-[1.1] tracking-tight">
                                        Mějte vše pod kontrolou <span className="text-primary italic">v jedné aplikaci.</span>
                                    </h2>
                                    <p className="text-slate-300 text-lg md:text-xl font-medium leading-relaxed max-w-xl">
                                        Zaregistrujte se zdarma a získejte přístup ke všem funkcím, od sledování úklidu až po věrnostní odměny.
                                    </p>

                                    <div className="pt-4 hidden md:block">
                                        <PremiumButton
                                            onClick={() => navigate('/klient-prihlaseni')}
                                            className="h-16 px-10 text-lg font-bold group shadow-[0_20px_50px_rgba(255,255,255,0.1)] bg-white text-slate-900 hover:bg-slate-100 border-0"
                                            showBubbles={false}
                                        >
                                            Vytvořit účet zdarma
                                            <UserPlus className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                        </PremiumButton>
                                    </div>
                                </div>

                                {/* Right Column: Visual Mockup */}
                                <div className="flex-1 w-full max-w-md">
                                    <div className="relative group/mockup">
                                        <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full scale-110 opacity-50 animate-pulse" />
                                        <div className="relative rounded-3xl border-2 border-white/10 bg-white/5 backdrop-blur-md p-10 flex flex-col items-center justify-center min-h-[320px] shadow-2xl overflow-hidden transition-transform duration-700 group-hover/mockup:scale-[1.02]">
                                            <div className="animate-sweep">
                                                <img
                                                    src={maidImage}
                                                    alt="Klinr App Representative"
                                                    className="h-48 w-48 object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
                                                />
                                            </div>
                                            <div className="mt-8 space-y-2 text-center">
                                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white/10 text-primary text-xs font-bold">
                                                    <AppWindow className="h-4 w-4" /> Náhled aplikace
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Mobile Button - Visible only on mobile, below image */}
                                    <div className="mt-8 block md:hidden">
                                        <PremiumButton
                                            onClick={() => navigate('/klient-prihlaseni')}
                                            className="w-full h-16 px-6 text-lg font-bold group shadow-[0_20px_50px_rgba(255,255,255,0.1)] bg-white text-slate-900 hover:bg-slate-100 border-0"
                                            showBubbles={false}
                                        >
                                            Vytvořit účet zdarma
                                            <UserPlus className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                        </PremiumButton>
                                    </div>
                                </div>
                            </div>

                            {/* Features Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-10 pt-12 border-t border-white/10 mt-12">
                                <div className="flex items-start gap-4 group/item">
                                    <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary group-hover/item:scale-110 transition-transform shadow-inner flex-shrink-0">
                                        <MapPin className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-base text-white">Sledování úklidu</p>
                                        <p className="text-slate-400 font-medium text-sm">Živý průběh úklidu přímo v aplikaci</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 group/item">
                                    <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary group-hover/item:scale-110 transition-transform shadow-inner flex-shrink-0">
                                        <Eye className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-base text-white">Profil uklízeče</p>
                                        <p className="text-slate-400 font-medium text-sm">Víte, kdo u vás uklízí</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 group/item">
                                    <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary group-hover/item:scale-110 transition-transform shadow-inner flex-shrink-0">
                                        <Users className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-base text-white">Nastavení preferencí</p>
                                        <p className="text-slate-400 font-medium text-sm">Děti, mazílčci, speciální instrukce</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 group/item">
                                    <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary group-hover/item:scale-110 transition-transform shadow-inner flex-shrink-0">
                                        <CreditCard className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-base text-white">Platba po úklidu</p>
                                        <p className="text-slate-400 font-medium text-sm">Pohodlná platba přímo v aplikaci</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 group/item">
                                    <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary group-hover/item:scale-110 transition-transform shadow-inner flex-shrink-0">
                                        <ClipboardCheck className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-base text-white">Kontrolní seznam</p>
                                        <p className="text-slate-400 font-medium text-sm">Přístup a správa checklistu úklidu</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 group/item">
                                    <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary group-hover/item:scale-110 transition-transform shadow-inner flex-shrink-0">
                                        <Gift className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-base text-white">Věrnostní body</p>
                                        <p className="text-slate-400 font-medium text-sm">Svíčky, masáže, vouchery na večeři</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>


            {/* Premium Footer */}
            <footer className="bg-slate-950 text-white py-16 border-t border-white/5">
                <div className="container mx-auto max-w-7xl px-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                        <div className="space-y-6">
                            <div className="flex items-center gap-2">
                                <img src={klinrLogo} alt="Klinr Logo" className="h-8 w-auto brightness-0 invert" />
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Profesionální úklidové služby pro domácnosti a firmy. Moderní přístup k úklidu s důrazem na kvalitu a technologii.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-black text-white uppercase tracking-widest text-xs mb-6 px-1 border-l-2 border-primary">Služby</h4>
                            <ul className="space-y-4 text-sm text-slate-400">
                                <li>
                                    <Link to="/rezervace-uklid" className="hover:text-primary transition-colors flex items-center gap-2">
                                        Úklid
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/rezervace-mytioken" className="hover:text-primary transition-colors flex items-center gap-2">
                                        Mytí oken
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/rezervace-cistenicalouneni" className="hover:text-primary transition-colors flex items-center gap-2">
                                        Čištění čalounění
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-black text-white uppercase tracking-widest text-xs mb-6 px-1 border-l-2 border-primary">Kontakt</h4>
                            <ul className="space-y-4 text-sm text-slate-400">
                                <li className="flex items-center gap-3 group">
                                    <div className="p-2 rounded-lg bg-white/5 border border-white/10 group-hover:border-primary/50 group-hover:bg-primary/10 transition-colors">
                                        <Phone className="h-4 w-4 text-primary" />
                                    </div>
                                    <a href="tel:+420777645610" className="hover:text-white transition-colors">+420 777 645 610</a>
                                </li>
                                <li className="flex items-center gap-3 group">
                                    <div className="p-2 rounded-lg bg-white/5 border border-white/10 group-hover:border-primary/50 group-hover:bg-primary/10 transition-colors">
                                        <Mail className="h-4 w-4 text-primary" />
                                    </div>
                                    <a href="mailto:uklid@klinr.cz" className="hover:text-white transition-colors">uklid@klinr.cz</a>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-black text-white uppercase tracking-widest text-xs mb-6 px-1 border-l-2 border-primary">Právní</h4>
                            <ul className="space-y-4 text-sm text-slate-400">
                                <li><Link to="/vop" className="hover:text-white transition-colors">VOP</Link></li>
                                <li><Link to="/zasady-ochrany-osobnich-udaju" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                                <li><Link to="/cookies" className="hover:text-white transition-colors">Cookies</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500 font-medium">
                        <p>&copy; {new Date().getFullYear()} Klinr. Všechna práva vyhrazena.</p>
                        <div className="flex gap-6">
                            <a href="https://klinr.cz" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">www.klinr.cz</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
