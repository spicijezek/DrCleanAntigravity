import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Smartphone, ArrowRight, Download } from "lucide-react";
import klinrLogo from "@/assets/Klinr Logo Full.png";

export default function MobileAppInfo() {
    const currentUrl = window.location.origin + "/klient-prihlaseni";
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(currentUrl)}`;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">

                {/* Left Column: Text Content */}
                <div className="space-y-6 text-center md:text-left">
                    <img src={klinrLogo} alt="Klinr" className="h-12 mx-auto md:mx-0" />

                    <div className="space-y-4">
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">
                            Pro nejlepší zážitek použijte <span className="text-primary">mobilní verzi</span>
                        </h1>
                        <p className="text-lg text-slate-600">
                            Klientská zóna je optimalizována pro mobilní telefony. Pro správu vašich úklidů, faktur a věrnostních bodů prosím pokračujte na svém telefonu.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                        {/* Placeholder buttons for app stores if they existed, or just instructions */}
                        <div className="flex items-center gap-4 text-sm text-slate-500 font-medium bg-white p-4 rounded-xl border shadow-sm">
                            <Smartphone className="h-10 w-10 text-primary" />
                            <div className="text-left">
                                <p className="text-xs uppercase tracking-wider font-bold text-slate-400">Naskenujte QR kód</p>
                                <p className="text-slate-900">a pokračujte v mobilu</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: QR Code Card */}
                <div className="flex justify-center">
                    <Card className="w-full max-w-sm border-0 shadow-2xl bg-white overflow-hidden relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardContent className="p-8 flex flex-col items-center space-y-6">
                            <div className="relative">
                                <div className="absolute -inset-4 bg-gradient-to-tr from-primary to-purple-600 rounded-3xl blur-lg opacity-30 animate-pulse" />
                                <div className="relative bg-white p-4 rounded-2xl shadow-inner border border-slate-100">
                                    <img
                                        src={qrCodeUrl}
                                        alt="QR Code"
                                        className="w-48 h-48 object-contain"
                                    />
                                </div>
                            </div>

                            <div className="text-center space-y-2">
                                <p className="font-bold text-slate-900">Otevřít v mobilu</p>
                                <p className="text-sm text-slate-500">Namiřte fotoaparát na kód</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}
