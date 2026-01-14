import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  title: string
  children: React.ReactNode
  className?: string
  gradient?: boolean
}

export function MetricCard({ title, children, className, gradient = false }: MetricCardProps) {
  return (
    <Card className={cn(
      "transition-all duration-300 hover:shadow-medium",
      gradient && "bg-gradient-primary text-white border-0",
      className
    )}>
      <CardHeader>
        <CardTitle className={cn(
          "text-lg",
          gradient ? "text-white" : "text-foreground"
        )}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}