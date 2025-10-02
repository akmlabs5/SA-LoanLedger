import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import { SAUDI_CHART_COLORS, getBankColor } from "@/lib/chart-colors";

interface PortfolioDistributionChartProps {
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

export default function PortfolioDistributionChart({ portfolioSummary }: PortfolioDistributionChartProps) {
  if (!portfolioSummary?.bankExposures) {
    return (
      <div className="h-full bg-gradient-to-br from-green-50 to-slate-100 dark:from-green-950 dark:to-slate-900 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">No data available</p>
          <p className="text-sm text-muted-foreground mt-2">Add bank facilities to see chart</p>
        </div>
      </div>
    );
  }

  // Calculate total outstanding
  const totalOutstanding = portfolioSummary.bankExposures.reduce((sum, exp) => sum + exp.outstanding, 0);

  // Show empty state if no outstanding amounts
  if (totalOutstanding === 0 || portfolioSummary.bankExposures.length === 0) {
    return (
      <div className="h-full bg-gradient-to-br from-green-50 to-slate-100 dark:from-green-950 dark:to-slate-900 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">No outstanding loans</p>
          <p className="text-sm text-muted-foreground mt-2">Add loans to see portfolio distribution</p>
        </div>
      </div>
    );
  }

  const pieChartData = portfolioSummary.bankExposures.map((exposure, index) => ({
    name: exposure.bankName.length > 20 
      ? exposure.bankName.substring(0, 17) + '...' 
      : exposure.bankName,
    value: exposure.outstanding / 1000000,
    percentage: ((exposure.outstanding / totalOutstanding) * 100).toFixed(1),
    color: getBankColor(index),
  }));

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-border rounded-lg shadow-lg">
          <p className="font-semibold text-foreground">{data.name}</p>
          <p className="text-sm" style={{ color: data.payload.color }}>
            {data.value.toFixed(1)}M SAR ({data.payload.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex h-full flex-col" data-testid="chart-portfolio-distribution">
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieChartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${percentage}%`}
              outerRadius={130}
              fill={SAUDI_CHART_COLORS.saudiGreen}
              dataKey="value"
            >
              {pieChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 shrink-0 space-y-2 max-h-[120px] overflow-y-auto">
        {pieChartData.map((entry, index) => (
          <div key={index} className="flex items-center space-x-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            ></div>
            <span className="flex-1">{entry.name}</span>
            <span className="text-muted-foreground">{entry.value.toFixed(1)}M SAR</span>
          </div>
        ))}
      </div>
    </div>
  );
}
