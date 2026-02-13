import { Button } from "@/components/ui/button"
import klinrLogoCropped from '@/assets/Klinr Logo Full.png'
import {
  Settings,
  User,
  LogOut,
  Menu,
  Home,
  Users,
  Briefcase,
  DollarSign,
  FileText,
  UserCheck,
  Shield,
  Receipt,
  ClipboardCheck
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useState, useEffect } from "react"
import SettingsPage from "@/pages/admin/Settings"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { supabase } from "@/integrations/supabase/client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { useNavigate, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"

export function Header() {
  const { signOut, user, profile } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    { title: "Dashboard", icon: Home, href: "/" },
    { title: "Clients", icon: Users, href: "/clients" },
    { title: "Jobs", icon: Briefcase, href: "/jobs" },
    { title: "Team", icon: UserCheck, href: "/team" },
    { title: "Finances", icon: DollarSign, href: "/finances" },
  ];

  const adminItems = [
    { title: "User Approval", icon: Shield, href: "/admin/approval" },
    { title: "App Bookings", icon: Briefcase, href: "/admin/app-bookings" },
    { title: "App Registers", icon: UserCheck, href: "/admin/app-registers" },
  ];

  const invoiceItems = [
    { title: "Invoices", icon: Receipt, href: "/invoices/generator" },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  useEffect(() => {
    if (user) {
      fetchUserAvatar();
    }
  }, [user]);

  const fetchUserAvatar = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      console.error('Error fetching avatar:', error);
    }
  };

  const fullName = user?.user_metadata?.full_name || 'Admin';
  const email = user?.email || '';

  return (

    <>
      <header className="sticky top-0 z-[10100] w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm transition-all duration-300">
        <div className="relative h-[60px] w-full flex items-center justify-between px-6">
          {/* Left: Hamburger Menu - Absolutely Positioned on Mobile */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 md:relative md:left-auto md:top-auto md:translate-y-0">
            {/* Hamburger Trigger - Mobile ONLY */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Open menu" className="text-muted-foreground hover:text-foreground">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0 border-r-0 z-[10200]">
                  <div className="flex flex-col h-full bg-background animate-in slide-in-from-left duration-300">
                    {/* Menu Header with Bubble Animation */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white">
                      <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                      <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-20 w-20 rounded-full bg-white/10 blur-xl" />

                      <div className="relative z-10 flex items-center gap-3 mb-2">
                        <Avatar className="h-12 w-12 border-2 border-white/20">
                          <AvatarImage src={avatarUrl} />
                          <AvatarFallback className="bg-white/20 text-white font-bold">
                            {fullName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-lg font-semibold leading-none">{fullName}</p>
                          <p className="text-sm text-blue-100 mt-1 truncate max-w-[180px]">{email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
                      {navigationItems.map((item) => (
                        <SheetClose key={item.href} asChild>
                          <div
                            onClick={() => navigate(item.href)}
                            className={cn(
                              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm cursor-pointer",
                              location.pathname === item.href
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            <item.icon className="h-5 w-5" />
                            {item.title}
                          </div>
                        </SheetClose>
                      ))}

                      {/* Admin Items */}
                      {profile?.is_admin && (
                        <>
                          {adminItems.map((item) => (
                            <SheetClose key={item.href} asChild>
                              <div
                                onClick={() => navigate(item.href)}
                                className={cn(
                                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm cursor-pointer",
                                  location.pathname === item.href
                                    ? "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                              >
                                <item.icon className="h-5 w-5" />
                                {item.title}
                              </div>
                            </SheetClose>
                          ))}

                          {/* Invoices Sub-section */}
                          {invoiceItems.map((item) => (
                            <SheetClose key={item.href} asChild>
                              <div
                                onClick={() => navigate(item.href)}
                                className={cn(
                                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm cursor-pointer",
                                  location.pathname === item.href
                                    ? "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                              >
                                <item.icon className="h-5 w-5" />
                                {item.title}
                              </div>
                            </SheetClose>
                          ))}

                          <SheetClose asChild>
                            <div
                              onClick={() => navigate('/invoices/storage')}
                              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm cursor-pointer text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                              <FileText className="h-5 w-5" />
                              Storage
                            </div>
                          </SheetClose>
                          <SheetClose asChild>
                            <div
                              onClick={() => navigate('/invoices/default-info')}
                              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm cursor-pointer text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                              <Settings className="h-5 w-5" />
                              Default Info
                            </div>
                          </SheetClose>

                          {/* Link to Client App */}
                          <div className="mt-6 px-2">
                            <SheetClose asChild>
                              <Button
                                onClick={() => navigate('/klient')}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md rounded-xl py-6"
                              >
                                Switch to Client App
                              </Button>
                            </SheetClose>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t bg-muted/20">
                      <SheetClose asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-3"
                          onClick={handleSignOut}
                        >
                          <LogOut className="h-5 w-5" />
                          Sign Out
                        </Button>
                      </SheetClose>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Company logo */}
            <div className="flex items-center cursor-pointer group" onClick={() => navigate('/')}>
              <div className="relative">
                <img
                  src={klinrLogoCropped}
                  alt="Klinr"
                  className="h-[32px] w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            </div>
          </div>

          {/* Right: Profile - Absolutely Positioned on Mobile */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 md:relative md:right-auto md:top-auto md:translate-y-0 md:ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="flex items-center justify-center rounded-full h-10 w-10 border border-input/50 bg-background/50 backdrop-blur-sm shadow-sm hover:bg-accent hover:text-accent-foreground transition-all">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                      {fullName[0]}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg border border-border/50 bg-background/95 backdrop-blur-xl">
                <div className="flex items-center justify-start gap-2 p-3 border-b mb-1">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{fullName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{email}</p>
                  </div>
                </div>
                <DropdownMenuItem onClick={() => setShowSettings(true)} className="cursor-pointer rounded-lg m-1">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowSettings(true)} className="cursor-pointer rounded-lg m-1">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive cursor-pointer rounded-lg m-1">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header >

      {showSettings && (
        <SettingsPage onClose={() => setShowSettings(false)} />
      )
      }
    </>
  );
}