import React, { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { BookingCard } from '@/components/client/dashboard/BookingCard';
import { Button } from '@/components/ui/button';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { Sparkles, CheckCircle2, AppWindow, ArrowRight, UserPlus, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function BookingConfirmation() {
    const location = useLocation();
    const navigate = useNavigate();
    const booking = location.state?.booking;

    useEffect(() => {
        if (!booking) {
            // Small delay to prevent flashing if state is being populated
            const timer = setTimeout(() => {
                if (!location.state?.booking) {
                    navigate('/landing', { replace: true });
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [booking, navigate, location.state]);

    if (!booking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="h-12 w-12 bg-primary/20 rounded-full" />
                    <p className="text-slate-400 font-medium">Načítám detail rezervace...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20 pt-12 md:pt-20">
            <div className="container mx-auto px-4 max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                {/* Success Header */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-500/10 mb-2">
                        <CheckCircle2 className="h-10 w-10 text-green-600 animate-bounce-slow" />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-900 leading-tight">
                        Rezervace byla <span className="text-primary italic">úspěšně</span> přijata!
                    </h1>
                    <p className="text-slate-500 max-w-xl mx-auto font-medium text-lg leading-relaxed">
                        Děkujeme za důvěru. Níže najdete detaily Vaší rezervace. Potvrzení jsme Vám také zaslali na email <span className="text-slate-900 font-bold underline decoration-primary/30 decoration-2 underline-offset-4">{booking.client?.email}</span>.
                    </p>
                </div>

                {/* Booking Card Mockup */}
                <div className="relative group perspective-1000">
                    <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-indigo-500/10 rounded-[3rem] blur-2xl opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-500"></div>
                    <div className="relative transform transition-transform duration-500 group-hover:scale-[1.01]">
                        <BookingCard
                            booking={booking}
                            onRatingSubmit={async () => { }}
                            isCollapsible={false}
                        />
                    </div>
                </div>

                {/* App Promo Section */}
                <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white relative group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                        <Sparkles className="h-48 w-48 text-primary" />
                    </div>
                    <div className="absolute -bottom-24 -left-24 h-64 w-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

                    <CardContent className="p-8 md:p-16 space-y-10 relative z-10 text-center md:text-left">
                        <div className="space-y-6 max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-primary-foreground text-xs font-black uppercase tracking-widest">
                                <Sparkles className="h-3.5 w-3.5" /> Výhoda pro vás
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black leading-[1.1] tracking-tight">
                                Mějte vše pod kontrolou <span className="text-primary italic">v jedné aplikaci.</span>
                            </h2>
                            <p className="text-slate-300 text-lg md:text-xl font-medium leading-relaxed">
                                Zaregistrujte se se stejným emailem (<span className="text-white font-bold">{booking.client?.email}</span>) a získejte přístup k věrnostnímu programu, online platbám a historii úklidů.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <PremiumButton
                                onClick={() => navigate('/klient-prihlaseni')}
                                className="h-16 px-10 text-lg font-bold group shadow-2xl shadow-primary/20"
                            >
                                Vytvořit účet v aplikaci
                                <UserPlus className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </PremiumButton>
                            <Button
                                variant="outline"
                                className="h-16 px-10 text-lg font-bold bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-2xl backdrop-blur-md transition-all active:scale-95"
                            >
                                Stáhnout mobilní aplikaci
                                <Download className="ml-3 h-5 w-5" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 pt-12 border-t border-white/10 mt-12">
                            <div className="flex items-center gap-4 group/item">
                                <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary group-hover/item:scale-110 transition-transform shadow-inner">
                                    <Sparkles className="h-6 w-6" />
                                </div>
                                <div className="text-sm">
                                    <p className="font-bold text-base text-white">Slevy & Bonusy</p>
                                    <p className="text-slate-400 font-medium">Věrnostní program s kredity</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 group/item">
                                <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary group-hover/item:scale-110 transition-transform shadow-inner">
                                    <CheckCircle2 className="h-6 w-6" />
                                </div>
                                <div className="text-sm">
                                    <p className="font-bold text-base text-white">Snadná správa</p>
                                    <p className="text-slate-400 font-medium">Změna termínu jedním klikem</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 group/item">
                                <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary group-hover/item:scale-110 transition-transform shadow-inner">
                                    <AppWindow className="h-6 w-6" />
                                </div>
                                <div className="text-sm">
                                    <p className="font-bold text-base text-white">Přehled faktur</p>
                                    <p className="text-slate-400 font-medium">Všechny doklady na jednom místě</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Return to Home */}
                <div className="text-center pt-8">
                    <Link to="/" className="inline-flex items-center text-slate-400 hover:text-primary font-bold transition-all group px-4 py-2 hover:bg-primary/5 rounded-full">
                        Zpět na úvodní stránku
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
