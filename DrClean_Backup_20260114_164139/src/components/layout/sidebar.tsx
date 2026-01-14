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
  const { profile } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const isInvoiceUser = profile?.roles?.includes('invoice_user')

  return (
    <div
      className={cn(
        "hidden md:block fixed left-0 top-16 z-[10060] h-[calc(100vh-4rem)] bg-card border-r transition-all duration-300",
        shouldBeExpanded ? "w-64" : "w-16"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex flex-col h-full p-4">
        <nav className="flex-1 space-y-2">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.href;
            const isDisabled = isInvoiceUser;
            return (
              <Button
                key={item.href}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start transition-all duration-200 hover:bg-sky-50 dark:hover:bg-sky-900/20 hover:text-sky-700 dark:hover:text-sky-300",
                  collapsed ? "px-2" : "px-3",
                  isActive && "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border-r-2 border-sky-500",
                  isDisabled && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => !isDisabled && navigate(item.href)}
                disabled={isDisabled}
              >
                {isDisabled ? <Lock className={cn("h-4 w-4", shouldBeExpanded ? "mr-3" : "")} /> : <item.icon className={cn("h-4 w-4", shouldBeExpanded ? "mr-3" : "")} />}
                {shouldBeExpanded && <span>{item.title}</span>}
              </Button>
            );
          })}

          {/* Invoices section */}
          {invoiceNavigationItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Button
                key={item.href}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start transition-all duration-200 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300",
                  collapsed ? "px-2" : "px-3",
                  isActive && "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-r-2 border-purple-500"
                )}
                onClick={() => navigate(item.href)}
              >
                <item.icon className={cn("h-4 w-4", shouldBeExpanded ? "mr-3" : "")} />
                {shouldBeExpanded && <span>{item.title}</span>}
              </Button>
            );
          })}

          {/* Admin-only navigation items */}
          {profile?.is_admin && (
            <>
              {adminNavigationItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Button
                    key={item.href}
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start transition-all duration-200 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-700 dark:hover:text-orange-300",
                      collapsed ? "px-2" : "px-3",
                      isActive && "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-r-2 border-orange-500"
                    )}
                    onClick={() => navigate(item.href)}
                  >
                    <item.icon className={cn("h-4 w-4", shouldBeExpanded ? "mr-3" : "")} />
                    {shouldBeExpanded && <span>{item.title}</span>}
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