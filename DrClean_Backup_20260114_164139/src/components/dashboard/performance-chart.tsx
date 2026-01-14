import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricCard } from "@/components/ui/metric-card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

const revenueData = [
  { month: 'Led', revenue: 32000, jobs: 180, clients: 85 },
  { month: 'Úno', revenue: 35500, jobs: 195, clients: 92 },
  { month: 'Bře', revenue: 38200, jobs: 210, clients: 98 },
  { month: 'Dub', revenue: 41800, jobs: 225, clients: 105 },
  { month: 'Kvě', revenue: 39600, jobs: 215, clients: 110 },
  { month: 'Čer', revenue: 45230, jobs: 252, clients: 127 }
]

const adPerformanceData = [
  { campaign: 'Úklid domů', clicks: 1250, conversions: 85, cost: 890 },
  { campaign: 'Kancelářské úklidy', clicks: 980, conversions: 67, cost: 720 },
  { campaign: 'Generální úklidy', clicks: 750, conversions: 52, cost: 650 },
  { campaign: 'Pravidelné úklidy', clicks: 1580, conversions: 108, cost: 1120 }
]

export function PerformanceChart() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <MetricCard title="Měsíční vývoj tržeb" className="md:col-span-2">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="month" 
              className="text-muted-foreground"
            />
            <YAxis 
              className="text-muted-foreground"
              tickFormatter={(value) => `${value.toLocaleString()} CZK`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
              formatter={(value: any, name: string) => [
                name === 'revenue' ? `${value.toLocaleString()} CZK` : value,
                name === 'revenue' ? 'Tržby' : name === 'jobs' ? 'Úklidy' : 'Klienti'
              ]}
            />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: 'hsl(var(--primary-glow))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </MetricCard>

      <MetricCard title="Výkonnost Google Ads kampaní">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={adPerformanceData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="campaign" 
              className="text-muted-foreground text-xs"
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis className="text-muted-foreground" />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Bar 
              dataKey="conversions" 
              fill="hsl(var(--success))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </MetricCard>

      <MetricCard title="Růst klientské základny" gradient>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="month" 
              stroke="rgba(255,255,255,0.8)"
            />
            <YAxis stroke="rgba(255,255,255,0.8)" />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255,255,255,0.95)',
                border: 'none',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))'
              }}
              formatter={(value: any) => [value, 'Počet klientů']}
            />
            <Line 
              type="monotone" 
              dataKey="clients" 
              stroke="rgba(255,255,255,0.9)" 
              strokeWidth={3}
              dot={{ fill: 'white', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: 'white' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </MetricCard>
    </div>
  )
}