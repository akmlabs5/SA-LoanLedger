import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { AlertTriangle, Loader2 } from "lucide-react";
import { LoanWithDetails } from "@shared/types";
import { SAUDI_CHART_COLORS } from "@/lib/chart-colors";

interface PriorityStatusChartProps {
  loans: LoanWithDetails[];
  isLoading?: boolean;
}

interface UrgencyData {
  urgency: 'critical' | 'warning' | 'normal';
  amount: number;
  count: number;
  color: string;
}

const URGENCY_COLORS = {
  'critical': SAUDI_CHART_COLORS.status.error,
  'warning': SAUDI_CHART_COLORS.status.warning, 
  'normal': SAUDI_CHART_COLORS.saudiGreen,
};

export default function PriorityStatusChart({ loans, isLoading = false }: PriorityStatusChartProps) {
  if (isLoading) {
    return (
      <div className="h-[450px] bg-gradient-to-br from-green-50 to-slate-100 dark:from-green-950 dark:to-slate-900 rounded-lg flex items-center justify-center animate-pulse">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-gray-400 dark:text-gray-500 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading priority status...</p>
        </div>
      </div>
    );
  }

  if (!loans || loans.length === 0) {
    return (
      <div className="h-[450px] bg-gradient-to-br from-green-50 to-slate-100 dark:from-green-950 dark:to-slate-900 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">No priority data available</p>
          <p className="text-sm text-muted-foreground mt-2">Add loans to see priority status</p>
        </div>
      </div>
    );
  }

  const getLoanUrgency = (dueDate: string): 'critical' | 'warning' | 'normal' => {
    const today = new Date();
    const due = new Date(dueDate);
    const daysDiff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    if (daysDiff < 0) return 'critical';
    if (daysDiff <= 7) return 'critical';
    if (daysDiff <= 15) return 'warning';
    return 'normal';
  };

  const urgencyData = loans.reduce((acc: UrgencyData[], loan: LoanWithDetails) => {
    const urgency = getLoanUrgency(loan.dueDate);
    const amount = Number(loan.amount) || 0;
    
    const existing = acc.find((item: UrgencyData) => item.urgency === urgency);
    if (existing) {
      existing.amount += amount;
      existing.count += 1;
    } else {
      acc.push({
        urgency,
        amount: amount,
        count: 1,
        color: URGENCY_COLORS[urgency],
      });
    }
    return acc;
  }, [] as UrgencyData[]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-border rounded-lg shadow-lg">
          <p className="font-semibold capitalize text-foreground mb-1">
            {data.urgency} Priority
          </p>
          <p className="text-sm text-muted-foreground">
            {data.count} loans • ﷼{(data.amount / 1000000).toFixed(1)}M SAR
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div data-testid="chart-priority-status">
      <div className="h-[450px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={urgencyData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="amount"
            >
              {urgencyData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Simple Priority Legend */}
      <div className="mt-4 flex items-center justify-center space-x-6">
        {urgencyData
          .sort((a, b) => {
            const priority = { 'critical': 0, 'warning': 1, 'normal': 2 };
            return priority[a.urgency] - priority[b.urgency];
          })
          .map((item: any) => (
            <div key={item.urgency} className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-medium capitalize">{item.urgency}</span>
              </div>
              <p className="text-xs text-muted-foreground">{item.count} loans</p>
            </div>
          ))
        }
      </div>
    </div>
  );
}
