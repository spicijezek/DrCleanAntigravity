import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import {
  Home,
  Users,
  Briefcase,
  DollarSign,
  FileText,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Shield,
  Receipt,
  Lock,
  ClipboardCheck
} from "lucide-react"
import { useSidebarState } from "@/hooks/useSidebarState"
import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const navigationItems = [
  {
    title: "Dashboard",
    icon: Home,
    href: "/",
  },
  {
    title: "Clients",
    icon: Users,
    href: "/clients"
  },
  {
    title: "Jobs",
    icon: Briefcase,
    href: "/jobs"
  },
  {
    title: "Team",
    icon: UserCheck,
    href: "/team"
  },
  {
    title: "Protocols",
    icon: FileText,
    href: "/protocols"
  },
  {
    title: "Finances",
    icon: DollarSign,
    href: "/finances"
  }
]

const invoiceNavigationItems = [
  {
    title: "Invoices",
    icon: Receipt,
    href: "/invoices/generator"
  }
]

const adminNavigationItems = [
  {
    title: "User Approval",
    icon: Shield,
    href: "/admin/approval"
  },
  {
    title: "App Bookings",
    icon: Briefcase,
    href: "/admin/app-bookings"
  },
  {
    title: "App Registers",
    icon: UserCheck,
    href: "/admin/app-registers"
  },
  {
    title: "Správa Checklistů",
    icon: ClipboardCheck,
    href: "/admin/checklists"
  }
]

export function Sidebar() {
  const { collapsed, toggleCollapsed, shouldBeExpanded, handleMouseEnter, handleMouseLeave } = useSidebarState()
  const { profile, user } = useAuth()
  const [avatarUrl, setAvatarUrl] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const isInvoiceUser = profile?.roles?.includes('invoice_user')

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
    <div
      className={cn(
        "hidden md:flex flex-col fixed left-0 top-16 z-[10060] h-[calc(100vh-4rem)] bg-card border-r transition-all duration-300",
        shouldBeExpanded ? "w-64" : "w-16"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Sidebar Header with Profile Info */}
      {shouldBeExpanded && (
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 p-4 text-white">
          <div className="absolute top-0 right-0 -mt-2 -mr-2 h-16 w-16 rounded-full bg-white/10 blur-xl" />
          <div className="absolute bottom-0 left-0 -mb-2 -ml-2 h-12 w-12 rounded-full bg-white/10 blur-lg" />

          <div className="relative z-10 flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-white/20">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-white/20 text-white font-bold">
                {fullName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold leading-none truncate">{fullName}</p>
              <p className="text-[10px] text-blue-100 mt-1 truncate">{email}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col flex-1 p-2 overflow-y-auto">
        <nav className="flex-1 space-y-1">
          <div className={cn("text-[10px] font-semibold text-muted-foreground px-2 mb-2 uppercase tracking-wider", !shouldBeExpanded && "sr-only")}>Menu</div>
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.href;
            const isDisabled = isInvoiceUser;
            return (
              <Button
                key={item.href}
                variant="ghost"
                className={cn(
                  "w-full justify-start transition-all duration-200 rounded-xl py-3",
                  collapsed ? "px-2" : "px-3",
                  isActive
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  isDisabled && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => !isDisabled && navigate(item.href)}
                disabled={isDisabled}
              >
                {isDisabled ? <Lock className={cn("h-5 w-5", shouldBeExpanded ? "mr-3" : "")} /> : <item.icon className={cn("h-5 w-5", shouldBeExpanded ? "mr-3" : "")} />}
                {shouldBeExpanded && <span className="font-medium text-sm">{item.title}</span>}
              </Button>
            );
          })}

          {/* Invoices section */}
          {shouldBeExpanded && navigationItems.length > 0 && (
            <div className="text-[10px] font-semibold text-muted-foreground px-2 mt-4 mb-2 uppercase tracking-wider">Invoices</div>
          )}
          {invoiceNavigationItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Button
                key={item.href}
                variant="ghost"
                className={cn(
                  "w-full justify-start transition-all duration-200 rounded-xl py-3",
                  collapsed ? "px-2" : "px-3",
                  isActive
                    ? "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                onClick={() => navigate(item.href)}
              >
                <item.icon className={cn("h-5 w-5", shouldBeExpanded ? "mr-3" : "")} />
                {shouldBeExpanded && <span className="font-medium text-sm">{item.title}</span>}
              </Button>
            );
          })}

          {/* Admin-only navigation items */}
          {profile?.is_admin && (
            <>
              {shouldBeExpanded && (
                <div className="text-[10px] font-semibold text-muted-foreground px-2 mt-4 mb-2 uppercase tracking-wider">Admin</div>
              )}
              {adminNavigationItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Button
                    key={item.href}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start transition-all duration-200 rounded-xl py-3",
                      collapsed ? "px-2" : "px-3",
                      isActive
                        ? "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    onClick={() => navigate(item.href)}
                  >
                    <item.icon className={cn("h-5 w-5", shouldBeExpanded ? "mr-3" : "")} />
                    {shouldBeExpanded && <span className="font-medium text-sm">{item.title}</span>}
                  </Button>
                );
              })}
            </>
          )}
        </nav>

        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCollapsed}
          className="mt-4"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              {shouldBeExpanded && "Collapse"}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}