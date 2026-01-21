import React from 'react';
import { useState } from 'react';
import { ClientBottomNav } from './ClientBottomNav';
import { useAuth } from '@/contexts/AuthContext';
import { User, Menu, Home, PlusCircle, FileText, Award, CheckSquare, LogOut, Phone } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import phoneBadgeIcon from '@/assets/phone-badge-icon.png';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import customProfileIcon from '@/assets/custom-profile-icon.png';
import customMenuIcon from '@/assets/custom-menu-icon.png';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const fullName = user?.user_metadata?.full_name || 'Klient';
  const isProfileActive = location.pathname === '/klient/profil';
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { icon: Home, label: 'Přehled', path: '/klient' },
    { icon: PlusCircle, label: 'Nová rezervace', path: '/klient/sluzby' },
    { icon: FileText, label: 'Fakturace', path: '/klient/fakturace' },
    { icon: Award, label: 'Věrnostní program', path: '/klient/vernost' },
    { icon: CheckSquare, label: 'Checklisty', path: '/klient/checklist' },
    { icon: User, label: 'Můj profil', path: '/klient/profil' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="relative h-16 w-full max-w-7xl mx-auto flex items-center justify-center">
          {/* Left: Hamburger Menu - Absolutely Positioned */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="flex items-center justify-center h-10 w-10 rounded-full transition-colors hover:bg-muted/50">
                  <img src={customMenuIcon} alt="Menu" className="h-[19px] w-[19px] object-contain opacity-90" />
                  <span className="sr-only">Otevřít menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0 border-r-0">
                <div className="flex flex-col h-full bg-background animate-in slide-in-from-left duration-300">
                  {/* Menu Header with Bubble Animation */}
                  <div className="relative overflow-hidden bg-primary p-6 text-primary-foreground">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                    <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-20 w-20 rounded-full bg-white/10 blur-xl" />

                    <div className="relative z-10 flex items-center gap-3 mb-2">
                      <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold border-2 border-white/20">
                        {fullName[0]}
                      </div>
                      <div>
                        <p className="text-lg font-semibold leading-none">{fullName}</p>
                        <p className="text-sm text-primary-foreground/80 mt-1 truncate max-w-[180px]">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => (
                      <SheetClose key={item.path} asChild>
                        <Link
                          to={item.path}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm",
                            location.pathname === item.path
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                          {item.label}
                        </Link>
                      </SheetClose>
                    ))}

                    {/* Admin Back Button */}
                    {(user?.app_metadata?.role === 'admin' || user?.user_metadata?.role === 'admin' || user?.email === 'stepan.tomov5@seznam.cz') && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs font-semibold text-muted-foreground px-4 mb-2 uppercase tracking-wider">Admin</p>
                        <SheetClose asChild>
                          <Link
                            to="/"
                            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-orange-600 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/30"
                          >
                            <User className="h-5 w-5" />
                            Zpět do administrace
                          </Link>
                        </SheetClose>
                      </div>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div className="p-6 border-t space-y-4 bg-muted/20">
                    <SheetClose asChild>
                      <a
                        href="tel:+420777645610"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50 text-green-700 border border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/50"
                      >
                        <Phone className="h-5 w-5" />
                        <div>
                          <p className="text-sm font-semibold">Potřebujete pomoc?</p>
                          <p className="text-xs text-green-600 dark:text-green-500">Zavolejte nám</p>
                        </div>
                      </a>
                    </SheetClose>

                    <Button
                      className="w-full justify-start gap-3 font-bold"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-5 w-5" />
                      Odhlásit se
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Center: Branding (Optional, but nice to have space for it) */}
          <div className="text-lg font-bold text-foreground/90">
            {/* Dr.Clean */}
          </div>

          {/* Right: Profile - Absolutely Positioned */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20">
            <Link
              to="/klient/profil"
              className={cn(
                "flex items-center justify-center h-10 w-10 rounded-full transition-colors hover:bg-muted/50",
                isProfileActive && "bg-primary/5"
              )}
            >
              <img src={customProfileIcon} alt="Profil" className="h-[19px] w-[19px] object-contain opacity-90" />
            </Link>
          </div>
        </div>
      </header>
      <main className="pb-24 pt-8">
        {children}
      </main>
      <ClientBottomNav />
    </div>
  );
}