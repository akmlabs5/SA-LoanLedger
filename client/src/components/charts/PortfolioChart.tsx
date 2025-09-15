import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp } from "lucide-react";

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

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function PortfolioChart({ portfolioSummary }: PortfolioChartProps) {
  if (!portfolioSummary?.bankExposures) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Outstanding Loans by Bank</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-gradient-to-br from-blue-50 to-slate-100 rounded-lg flex items-center justify-center">
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
    color: COLORS[index % COLORS.length],
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-border rounded-lg shadow-lg">
          <p className="font-semibold">{data.fullName}</p>
          <p className="text-sm text-blue-600">
            Outstanding: {data.outstanding.toFixed(1)}M SAR
          </p>
          <p className="text-sm text-gray-600">
            Credit Limit: {data.creditLimit.toFixed(1)}M SAR
          </p>
          <p className="text-sm text-orange-600">
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
        <div className="bg-white p-3 border border-border rounded-lg shadow-lg">
          <p className="font-semibold">{data.name}</p>
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
          <div className="h-[300px]" data-testid="chart-outstanding-loans">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
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
                  fill="#3B82F6" 
                  name="Outstanding"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="creditLimit" 
                  fill="#E5E7EB" 
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
          <div className="h-[300px]" data-testid="chart-portfolio-distribution">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${percentage}%`}
                  outerRadius={100}
                  fill="#8884d8"
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
