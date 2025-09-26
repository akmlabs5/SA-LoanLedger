import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp } from "lucide-react";
import { SAUDI_CHART_COLORS, getBankColor, CHART_STYLING } from "@/lib/chart-colors";

interface PortfolioChartProps {
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

// Using centralized Saudi-themed color palette

export default function PortfolioChart({ portfolioSummary }: PortfolioChartProps) {
  if (!portfolioSummary?.bankExposures) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Outstanding Loans by Bank</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] sm:h-[300px] lg:h-[350px] bg-gradient-to-br from-green-50 to-slate-100 dark:from-green-950 dark:to-slate-900 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">No data available</p>
              <p className="text-sm text-muted-foreground mt-2">Add bank facilities to see chart</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for bar chart
  const barChartData = portfolioSummary.bankExposures.map((exposure) => ({
    bank: exposure.bankName.length > 15 
      ? exposure.bankName.substring(0, 12) + '...' 
      : exposure.bankName,
    fullName: exposure.bankName,
    outstanding: exposure.outstanding / 1000000, // Convert to millions
    creditLimit: exposure.creditLimit / 1000000,
    utilization: exposure.utilization,
  }));

  // Prepare data for pie chart
  const pieChartData = portfolioSummary.bankExposures.map((exposure, index) => ({
    name: exposure.bankName.length > 20 
      ? exposure.bankName.substring(0, 17) + '...' 
      : exposure.bankName,
    value: exposure.outstanding / 1000000,
    percentage: ((exposure.outstanding / portfolioSummary.bankExposures.reduce((sum, exp) => sum + exp.outstanding, 0)) * 100).toFixed(1),
    color: getBankColor(index),
  }));

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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Outstanding vs Credit Limits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] sm:h-[300px] lg:h-[350px]" data-testid="chart-outstanding-loans">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={CHART_STYLING.margins.default}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLING.grid.stroke} />
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
        </CardContent>
      </Card>

      {/* Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] sm:h-[300px] lg:h-[350px]" data-testid="chart-portfolio-distribution">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${percentage}%`}
                  outerRadius={100}
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
          
          {/* Legend */}
          <div className="mt-4 space-y-2">
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
        </CardContent>
      </Card>
    </div>
  );
}
