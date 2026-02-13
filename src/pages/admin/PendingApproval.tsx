import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import klinrLogoFavicon from '@/assets/Klinr Logo Favicon.png';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Clock, LogOut, ShieldCheck } from 'lucide-react';

export default function PendingApproval() {
  const { signOut, profile } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1527515673516-9b552e6aeeb4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center relative p-4 overflow-hidden">
      {/* Dynamic Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-slate-900/90 to-black/95 backdrop-blur-sm" />

      <Card className="w-full max-w-md relative z-10 border-0 bg-white/10 backdrop-blur-2xl shadow-[0_32px_64px_-15px_rgba(0,0,0,0.5)] rounded-[2.5rem] text-white overflow-hidden animate-in fade-in zoom-in-95 duration-700">
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

        <CardHeader className="text-center space-y-6 pt-10 pb-4">
          <div className="mx-auto h-24 w-24 flex items-center justify-center transform hover:scale-105 transition-transform duration-500 group">
            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl group-hover:blur-3xl transition-all opacity-50" />
            <img
              src={klinrLogoFavicon}
              alt="Klinr"
              className="h-20 w-20 relative z-10 drop-shadow-2xl animate-spin-pulse"
            />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
              Account Pending
            </CardTitle>
            <CardDescription className="text-blue-100/60 font-medium tracking-wide uppercase text-[10px]">
              Ověření vašeho účtu probíhá
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-10 space-y-6">
          <div className="text-center space-y-4">
            <p className="text-blue-100/80 text-sm leading-relaxed font-medium">
              Děkujeme za registraci u <span className="text-white font-bold">Klinr</span>! Váš účet byl úspěšně vytvořen a nyní čeká na schválení administrátorem.
            </p>
            <p className="text-blue-100/60 text-xs italic">
              Jakmile bude váš přístup schválen, obdržíte e-mail s potvrzením a budete moci začít využívat systém.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 p-5 rounded-3xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-blue-200/80 flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5" />
              Co se bude dít dál?
            </h3>
            <ul className="text-xs text-blue-100/70 space-y-2.5">
              <li className="flex items-start gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                <span>Administrátor prověří vaši registraci a přidělené role.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                <span>Systém vám automaticky odešle aktivační e-mail.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                <span>Poté získáte plný přístup k vašemu digitálnímu rozhraní.</span>
              </li>
            </ul>
          </div>

          <div className="pt-2">
            <Button
              variant="outline"
              className="w-full h-12 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white rounded-[1.25rem] transition-all flex items-center justify-center gap-3 font-semibold group"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 text-white/40 group-hover:text-white transition-colors" />
              Odhlásit se
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Footer Branding */}
      <div className="absolute bottom-8 text-center animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-500">
        <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] drop-shadow-sm">
          &copy; 2026 KLINR &bull; All Rights Reserved
        </p>
      </div>
    </div>
  );
}