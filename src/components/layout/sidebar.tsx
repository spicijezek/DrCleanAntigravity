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
  ClipboardCheck,
  Star
} from "lucide-react"
import { useSidebarState } from "@/hooks/useSidebarState"
import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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
  { title: "Checklists", icon: ClipboardCheck, href: "/admin/checklists" },
  { title: "Loyalty", icon: Star, href: "/admin/loyalty" },
];

const invoiceItems = [
  { title: "Invoices", icon: Receipt, href: "/invoices/generator" },
];

export function Sidebar() {
  const { collapsed, shouldBeExpanded, handleMouseEnter, handleMouseLeave } = useSidebarState()
  const { profile } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const isInvoiceUser = profile?.roles?.includes('invoice_user')

  return (
    <div
      className={cn(
        "hidden md:flex flex-col fixed left-0 top-[60px] z-[10060] h-[calc(100vh-60px)] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-r transition-all duration-300 ease-in-out shadow-lg",
        shouldBeExpanded ? "w-64" : "w-16"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto custom-scrollbar">
        <nav className="flex-1 space-y-2">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.href;
            const isDisabled = isInvoiceUser;
            return (
              <Button
                key={item.href}
                variant="ghost"
                className={cn(
                  "w-full justify-start items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm cursor-pointer",
                  !shouldBeExpanded ? "px-2 justify-center" : "px-4",
                  isActive
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  isDisabled && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => !isDisabled && navigate(item.href)}
                disabled={isDisabled}
              >
                <item.icon className={cn("h-5 w-5 shrink-0 transition-transform duration-200", isActive && "scale-105")} />
                {shouldBeExpanded && <span className="truncate">{item.title}</span>}
              </Button>
            );
          })}

          {/* Admin Section */}
          {profile?.is_admin && (
            <>
              {adminItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Button
                    key={item.href}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm cursor-pointer",
                      !shouldBeExpanded ? "px-2 justify-center" : "px-4",
                      isActive
                        ? "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    onClick={() => navigate(item.href)}
                  >
                    <item.icon className={cn("h-5 w-5 shrink-0 transition-transform duration-200", isActive && "scale-105")} />
                    {shouldBeExpanded && <span className="truncate">{item.title}</span>}
                  </Button>
                );
              })}

              {/* Invoices */}
              {invoiceItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Button
                    key={item.href}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm cursor-pointer",
                      !shouldBeExpanded ? "px-2 justify-center" : "px-4",
                      isActive
                        ? "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    onClick={() => navigate(item.href)}
                  >
                    <item.icon className={cn("h-5 w-5 shrink-0 transition-transform duration-200", isActive && "scale-105")} />
                    {shouldBeExpanded && <span className="truncate">{item.title}</span>}
                  </Button>
                );
              })}

              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm cursor-pointer",
                  !shouldBeExpanded ? "px-2 justify-center" : "px-4",
                  location.pathname === '/invoices/storage'
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                onClick={() => navigate('/invoices/storage')}
              >
                <FileText className="h-5 w-5 shrink-0" />
                {shouldBeExpanded && <span className="truncate">Storage</span>}
              </Button>

              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm cursor-pointer",
                  !shouldBeExpanded ? "px-2 justify-center" : "px-4",
                  location.pathname === '/invoices/default-info'
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                onClick={() => navigate('/invoices/default-info')}
              >
                <Receipt className="h-5 w-5 shrink-0" />
                {shouldBeExpanded && <span className="truncate">Default Info</span>}
              </Button>
            </>
          )}
        </nav>

        {shouldBeExpanded && (
          <div className="mt-6 px-2">
            <Button
              onClick={() => navigate('/klient')}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md rounded-xl py-6 text-sm font-semibold"
            >
              Client App
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}