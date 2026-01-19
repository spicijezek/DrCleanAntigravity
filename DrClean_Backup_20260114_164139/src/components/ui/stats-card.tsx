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
}

export function StatsCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  className
}: StatsCardProps) {
  const getColors = () => {
    switch (changeType) {
      case 'positive': return { border: 'bg-emerald-500', icon: 'text-emerald-600', bg: 'bg-emerald-50' };
      case 'negative': return { border: 'bg-rose-500', icon: 'text-rose-600', bg: 'bg-rose-50' };
      default: return { border: 'bg-blue-500', icon: 'text-blue-600', bg: 'bg-blue-50' };
    }
  };

  const colors = getColors();

  return (
    <Card className={cn(
      "rounded-[2rem] border-0 shadow-lg bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl overflow-hidden relative group hover:shadow-2xl transition-all duration-500 hover:-translate-y-1",
      className
    )}>
      <div className={cn("absolute left-0 top-0 bottom-0 w-1.5 z-20", colors.border)} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
          {title}
        </CardTitle>
        <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform", colors.bg, colors.icon)}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-black text-slate-900 dark:text-white leading-none">{value}</div>
        {change && (
          <p className={cn(
            "text-[10px] items-center gap-1 mt-3 font-black uppercase tracking-widest leading-none flex",
            changeType === "positive" && "text-emerald-600",
            changeType === "negative" && "text-rose-600",
            changeType === "neutral" && "text-muted-foreground/40"
          )}>
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  )
}