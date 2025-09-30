import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Loader2 } from "lucide-react";
import { LoanWithDetails } from "@shared/types";
import { SAUDI_CHART_COLORS, CHART_STYLING } from "@/lib/chart-colors";

interface LoansByBankChartProps {
  loans: LoanWithDetails[];
  isLoading?: boolean;
}

interface BankData {
  bank: string;
  fullName: string;
  amount: number;
  count: number;
}

export default function LoansByBankChart({ loans, isLoading = false }: LoansByBankChartProps) {
  if (isLoading) {
    return (
      <div className="h-full bg-gradient-to-br from-green-50 to-slate-100 dark:from-green-950 dark:to-slate-900 rounded-lg flex items-center justify-center animate-pulse">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-gray-400 dark:text-gray-500 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading bank distribution...</p>
        </div>
      </div>
    );
  }

  if (!loans || loans.length === 0) {
    return (
      <div className="h-full bg-gradient-to-br from-green-50 to-slate-100 dark:from-green-950 dark:to-slate-900 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">No data available</p>
          <p className="text-sm text-muted-foreground mt-2">Add loans to see bank distribution</p>
        </div>
      </div>
    );
  }

  const bankData = loans.reduce((acc: BankData[], loan: LoanWithDetails) => {
    const bankName = loan.creditLine?.facility?.bank?.name || 'Unknown Bank';
    const amount = Number(loan.amount) || 0;
    
    const existing = acc.find((item: BankData) => item.fullName === bankName);
    if (existing) {
      existing.amount += amount;
      existing.count += 1;
    } else {
      acc.push({
        bank: bankName.length > 15 ? bankName.substring(0, 12) + '...' : bankName,
        fullName: bankName,
        amount: amount / 1000000, // Convert to millions
        count: 1,
      });
    }
    return acc;
  }, [] as BankData[]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-border rounded-lg shadow-lg">
          <p className="font-semibold text-foreground">{data.fullName}</p>
          <p className="text-sm" style={{ color: SAUDI_CHART_COLORS.saudiGreen }}>
            {data.count} loans • ﷼{data.amount.toFixed(1)}M SAR
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full" data-testid="chart-loans-by-bank">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={bankData} layout="horizontal" margin={CHART_STYLING.margins.default}>
          <CartesianGrid strokeDasharray="3 3" stroke={SAUDI_CHART_COLORS.status.neutral} />
          <XAxis 
            type="number" 
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            dataKey="bank" 
            type="category" 
            tick={{ fontSize: 12 }}
            width={100}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="amount" 
            fill={SAUDI_CHART_COLORS.saudiGreen} 
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
