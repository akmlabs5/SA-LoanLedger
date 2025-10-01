import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CalendarDays, TrendingUp } from "lucide-react";
import { SAUDI_CHART_COLORS, CHART_STYLING } from "@/lib/chart-colors";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface UpcomingLoansByMonthChartProps {
  allBanks?: Array<{
    id: string;
    name: string;
  }>;
}

interface MonthData {
  month: string;
  monthKey: string;
  count: number;
  amount: number;
}

export default function UpcomingLoansByMonthChart({ allBanks }: UpcomingLoansByMonthChartProps) {
  const [selectedBank, setSelectedBank] = useState<string>("all");
  const [selectedFacilityType, setSelectedFacilityType] = useState<string>("all");

  const { data: monthlyData, isLoading } = useQuery<MonthData[]>({
    queryKey: ["/api/dashboard/upcoming-loans-by-month", selectedBank, selectedFacilityType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedBank !== "all") params.append("bankId", selectedBank);
      if (selectedFacilityType !== "all") params.append("facilityType", selectedFacilityType);
      
      const response = await fetch(`/api/dashboard/upcoming-loans-by-month?${params}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch monthly data');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="h-full bg-gradient-to-br from-green-50 to-slate-100 dark:from-green-950 dark:to-slate-900 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading chart data...</p>
        </div>
      </div>
    );
  }

  if (!monthlyData || monthlyData.length === 0) {
    return (
      <div className="h-full bg-gradient-to-br from-green-50 to-slate-100 dark:from-green-950 dark:to-slate-900 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <CalendarDays className="h-12 w-12 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">No upcoming loans</p>
          <p className="text-sm text-muted-foreground mt-2">Add active loans to see the chart</p>
        </div>
      </div>
    );
  }

  // Convert amounts to millions for better display
  const chartData = monthlyData.map(item => ({
    ...item,
    amountInMillions: item.amount / 1000000,
    countScaled: item.count // Keep count as is for now, will scale in rendering if needed
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-border rounded-lg shadow-lg">
          <p className="font-semibold text-foreground mb-2">{data.month}</p>
          <p className="text-sm" style={{ color: SAUDI_CHART_COLORS.status.error }}>
            Loans Due: {data.count}
          </p>
          <p className="text-sm" style={{ color: SAUDI_CHART_COLORS.saudiGreen }}>
            Total Amount: {data.amountInMillions.toFixed(2)}M SAR
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full flex flex-col" data-testid="chart-upcoming-loans">
      {/* Filter Controls */}
      <div className="flex flex-wrap gap-4 mb-4 pb-4 border-b border-border">
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="bank-filter" className="text-sm font-medium mb-2 block">
            Filter by Bank
          </Label>
          <Select value={selectedBank} onValueChange={setSelectedBank}>
            <SelectTrigger id="bank-filter" data-testid="select-bank-filter">
              <SelectValue placeholder="All Banks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Banks</SelectItem>
              {allBanks?.map(bank => (
                <SelectItem key={bank.id} value={bank.id}>
                  {bank.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="facility-filter" className="text-sm font-medium mb-2 block">
            Filter by Facility Type
          </Label>
          <Select value={selectedFacilityType} onValueChange={setSelectedFacilityType}>
            <SelectTrigger id="facility-filter" data-testid="select-facility-filter">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="term">Term Loan</SelectItem>
              <SelectItem value="revolving">Revolving Credit</SelectItem>
              <SelectItem value="working_capital">Working Capital</SelectItem>
              <SelectItem value="non_cash_guarantee">Non-Cash Guarantee</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={CHART_STYLING.margins.default}>
            <CartesianGrid strokeDasharray="3 3" stroke={SAUDI_CHART_COLORS.status.neutral} />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              yAxisId="left"
              tick={{ fontSize: 11 }}
              label={{ value: 'Number of Loans', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11 }}
              label={{ value: 'Amount (Millions SAR)', angle: 90, position: 'insideRight', style: { fontSize: 12 } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '10px' }}
              iconType="rect"
            />
            <Bar 
              yAxisId="left"
              dataKey="count" 
              fill={SAUDI_CHART_COLORS.status.error} 
              name="Number of Loans"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
            <Bar 
              yAxisId="right"
              dataKey="amountInMillions" 
              fill={SAUDI_CHART_COLORS.saudiGreen} 
              name="Total Amount (M SAR)"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
