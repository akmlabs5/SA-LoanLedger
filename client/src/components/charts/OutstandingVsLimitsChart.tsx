import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import { SAUDI_CHART_COLORS, CHART_STYLING } from "@/lib/chart-colors";

interface OutstandingVsLimitsChartProps {
  portfolioSummary?: {
    bankExposures: Array<{
      bankId: string;
      bankName: string;
      outstanding: number;
      creditLimit: number;
      utilization: number;
    }>;
  };
}

export default function OutstandingVsLimitsChart({ portfolioSummary }: OutstandingVsLimitsChartProps) {
  if (!portfolioSummary?.bankExposures || portfolioSummary.bankExposures.length === 0) {
    return (
      <div className="h-full bg-gradient-to-br from-green-50 to-slate-100 dark:from-green-950 dark:to-slate-900 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">No banking relationships</p>
          <p className="text-sm text-muted-foreground mt-2">Add facilities to compare limits</p>
        </div>
      </div>
    );
  }

  const barChartData = portfolioSummary.bankExposures.map((exposure) => ({
    bank: exposure.bankName.length > 15 
      ? exposure.bankName.substring(0, 12) + '...' 
      : exposure.bankName,
    fullName: exposure.bankName,
    outstanding: exposure.outstanding / 1000000,
    creditLimit: exposure.creditLimit / 1000000,
    utilization: exposure.utilization,
  }));

  // Check if all data is zero
  const hasData = barChartData.some(item => item.outstanding > 0 || item.creditLimit > 0);
  
  if (!hasData) {
    return (
      <div className="h-full bg-gradient-to-br from-green-50 to-slate-100 dark:from-green-950 dark:to-slate-900 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">No facility limits set</p>
          <p className="text-sm text-muted-foreground mt-2">Configure credit limits to see comparison</p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-border rounded-lg shadow-lg">
          <p className="font-semibold text-foreground">{data.fullName}</p>
          <p className="text-sm" style={{ color: SAUDI_CHART_COLORS.saudiGreen }}>
            Outstanding: {data.outstanding.toFixed(1)}M SAR
          </p>
          <p className="text-sm text-muted-foreground">
            Credit Limit: {data.creditLimit.toFixed(1)}M SAR
          </p>
          <p className="text-sm" style={{ color: SAUDI_CHART_COLORS.saudiGold }}>
            Utilization: {data.utilization.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full" data-testid="chart-outstanding-vs-limits">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={barChartData} margin={CHART_STYLING.margins.default}>
          <CartesianGrid strokeDasharray="3 3" stroke={SAUDI_CHART_COLORS.status.neutral} />
          <XAxis 
            dataKey="bank" 
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            label={{ value: 'SAR (Millions)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="outstanding" 
            fill={SAUDI_CHART_COLORS.saudiGreen} 
            name="Outstanding"
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="creditLimit" 
            fill={SAUDI_CHART_COLORS.status.neutral} 
            name="Available"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
