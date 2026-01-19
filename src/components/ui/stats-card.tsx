import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number | React.ReactNode
  change?: string
  changeType?: "positive" | "negative" | "neutral"
  icon: LucideIcon
  className?: string
  iconClassName?: string
  borderClass?: string
}

export function StatsCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  className,
  iconClassName,
  borderClass
}: StatsCardProps) {
  return (
    <Card className={cn(
      "transition-all duration-300 hover:shadow-medium",
      borderClass ? `border-l-4 ${borderClass}` : "",
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
        <div className={cn("p-2 rounded-xl", iconClassName)}>
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {change && (
          <div className="mt-2 text-xs">
            <span className={cn(
              "px-2 py-1 rounded-full font-medium",
              changeType === "positive" && "bg-emerald-500/10 text-emerald-500",
              changeType === "negative" && "bg-rose-500/10 text-rose-500",
              changeType === "neutral" && "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
            )}>
              {change}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}