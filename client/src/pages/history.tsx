import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, subMonths, subYears } from "date-fns";
import { 
  Calendar,
  Download,
  Filter,
  TrendingUp,
  Building2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Eye,
  EyeOff,
  ChevronDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ModernDatePicker } from "@/components/ui/date-picker";
import { 
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { ExposureSnapshot, Transaction, Bank } from "@shared/schema";
import { SAUDI_CHART_COLORS, getBankColor, getTransactionTypeStyle } from "@/lib/chart-colors";

// Settlement data interface
interface LoanSettlement {
  loanId: string;
  referenceNumber: string;
  bankName: string;
  facilityId: string;
  amount: number;
  totalDrawn: number;
  totalRepaid: number;
  principalPaid: number;
  totalInterestPaid: number;
  interestCharges: number;
  feeCharges: number;
  totalCharges: number;
  outstandingBalance: number;
  settlementProgress: number;
  principalProgress: number;
  interestProgress: number;
  settlementStatus: 'active' | 'settled' | 'overdue';
  dueDate: string;
  settledDate?: string;
  startDate: string;
  transactionCount: number;
  lastTransactionDate?: number;
  breakdown: {
    principalOwed: number;
    principalPaid: number;
    principalRemaining: number;
    interestOwed: number;
    interestPaid: number;
    interestRemaining: number;
    feesOwed: number;
    feesRemaining: number;
  };
}

interface SettlementSummary {
  totalLoans: number;
  activeLoans: number;
  settledLoans: number;
  overdueLoans: number;
  totalOutstanding: number;
  averageSettlementProgress: number;
}

interface HistoryFilters {
  dateFrom: string;
  dateTo: string;
  bankId: string;
  facilityId: string;
  loanId: string;
  transactionType: string;
  settlementStatus: string;
}

interface TransactionResponse {
  data: Transaction[];
  total: number;
  limit: number;
  offset: number;
}

interface SettlementResponse {
  data: LoanSettlement[];
  summary: SettlementSummary;
}

type TimeframeType = '30D' | '6M' | '1Y' | 'MAX';

type DatePreset = 
  | 'custom'
  | 'this_quarter'
  | 'last_quarter'
  | 'this_year'
  | 'last_year'
  | '2024_q1'
  | '2024_q2'
  | '2024_q3'
  | '2024_q4'
  | '2025_q1'
  | '2025_q2'
  | '2025_q3'
  | '2025_q4';

const getPresetDateRange = (preset: DatePreset): { from: string; to: string } => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-11
  const currentQuarter = Math.floor(currentMonth / 3); // 0-3

  switch (preset) {
    case 'this_quarter': {
      const quarterStart = new Date(currentYear, currentQuarter * 3, 1);
      const quarterEnd = new Date(currentYear, (currentQuarter + 1) * 3, 0);
      return {
        from: format(quarterStart, 'yyyy-MM-dd'),
        to: format(quarterEnd, 'yyyy-MM-dd'),
      };
    }
    case 'last_quarter': {
      const lastQuarter = currentQuarter === 0 ? 3 : currentQuarter - 1;
      const lastQuarterYear = currentQuarter === 0 ? currentYear - 1 : currentYear;
      const quarterStart = new Date(lastQuarterYear, lastQuarter * 3, 1);
      const quarterEnd = new Date(lastQuarterYear, (lastQuarter + 1) * 3, 0);
      return {
        from: format(quarterStart, 'yyyy-MM-dd'),
        to: format(quarterEnd, 'yyyy-MM-dd'),
      };
    }
    case 'this_year': {
      return {
        from: `${currentYear}-01-01`,
        to: format(today, 'yyyy-MM-dd'),
      };
    }
    case 'last_year': {
      return {
        from: `${currentYear - 1}-01-01`,
        to: `${currentYear - 1}-12-31`,
      };
    }
    case '2024_q1':
      return { from: '2024-01-01', to: '2024-03-31' };
    case '2024_q2':
      return { from: '2024-04-01', to: '2024-06-30' };
    case '2024_q3':
      return { from: '2024-07-01', to: '2024-09-30' };
    case '2024_q4':
      return { from: '2024-10-01', to: '2024-12-31' };
    case '2025_q1':
      return { from: '2025-01-01', to: '2025-03-31' };
    case '2025_q2':
      return { from: '2025-04-01', to: '2025-06-30' };
    case '2025_q3':
      return { from: '2025-07-01', to: '2025-09-30' };
    case '2025_q4':
      return { from: '2025-10-01', to: '2025-12-31' };
    default:
      return { from: '', to: '' };
  }
};

export default function HistoryPage() {
  // Fetch user preferences for items per page
  const { data: userPreferences } = useQuery({
    queryKey: ['/api/user/preferences'],
  });
  
  const itemsPerPage = userPreferences?.itemsPerPage || 10;
  const [visibleTransactions, setVisibleTransactions] = useState(itemsPerPage);
  
  // Bank visibility controls for interactive chart
  const [visibleBanks, setVisibleBanks] = useState<Set<string>>(new Set());
  const [showTop5Only, setShowTop5Only] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeType>('1Y');
  const [selectedDatePreset, setSelectedDatePreset] = useState<DatePreset>('custom');
  const [filters, setFilters] = useState<HistoryFilters>({
    dateFrom: format(subYears(new Date(), 1), 'yyyy-MM-dd'),
    dateTo: format(new Date(), 'yyyy-MM-dd'),
    bankId: '',
    facilityId: '',
    loanId: '',
    transactionType: '',
    settlementStatus: '',
  });

  // Calculate date ranges based on timeframe
  const getDateRange = (timeframe: TimeframeType) => {
    const today = new Date();
    switch (timeframe) {
      case '30D':
        return {
          from: format(subDays(today, 30), 'yyyy-MM-dd'),
          to: format(today, 'yyyy-MM-dd')
        };
      case '6M':
        return {
          from: format(subMonths(today, 6), 'yyyy-MM-dd'),
          to: format(today, 'yyyy-MM-dd')
        };
      case '1Y':
        return {
          from: format(subYears(today, 1), 'yyyy-MM-dd'),
          to: format(today, 'yyyy-MM-dd')
        };
      case 'MAX':
        return {
          from: '2024-01-01',
          to: format(today, 'yyyy-MM-dd')
        };
      default:
        return {
          from: format(subYears(today, 1), 'yyyy-MM-dd'),
          to: format(today, 'yyyy-MM-dd')
        };
    }
  };

  // Update filters when timeframe changes
  const handleTimeframeChange = (timeframe: TimeframeType) => {
    setSelectedTimeframe(timeframe);
    const dateRange = getDateRange(timeframe);
    setFilters(prev => ({
      ...prev,
      dateFrom: dateRange.from,
      dateTo: dateRange.to,
    }));
  };

  // Handle date preset selection
  const handleDatePresetChange = (preset: DatePreset) => {
    setSelectedDatePreset(preset);
    if (preset !== 'custom') {
      const dateRange = getPresetDateRange(preset);
      setFilters(prev => ({
        ...prev,
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
      }));
    }
  };

  // Reset visible transactions when filters change
  useEffect(() => {
    setVisibleTransactions(itemsPerPage);
  }, [filters, itemsPerPage]);

  // Fetch banks for filtering
  const { data: banks = [] } = useQuery<Bank[]>({
    queryKey: ['/api/banks'],
  });

  // Fetch exposure snapshots for chart
  const exposureParams = new URLSearchParams({
    from: filters.dateFrom,
    to: filters.dateTo,
    ...(filters.bankId && { bankId: filters.bankId }),
    ...(filters.facilityId && { facilityId: filters.facilityId }),
  }).toString();

  const { 
    data: exposureData = [], 
    isLoading: exposureLoading,
    error: exposureError 
  } = useQuery<ExposureSnapshot[]>({
    queryKey: ['/api/history/exposures', exposureParams],
    queryFn: () => 
      fetch(`/api/history/exposures?${exposureParams}`)
        .then(res => res.json()),
  });

  // Fetch transactions for table - fetch enough to support load more functionality
  // We'll slice on the client side based on visibleTransactions
  const fetchLimit = Math.max(visibleTransactions, 100); // Always fetch at least 100 or what we need
  const transactionParams = new URLSearchParams({
    from: filters.dateFrom,
    to: filters.dateTo,
    limit: fetchLimit.toString(),
    offset: '0',
    ...(filters.bankId && { bankId: filters.bankId }),
    ...(filters.facilityId && { facilityId: filters.facilityId }),
    ...(filters.loanId && { loanId: filters.loanId }),
    ...(filters.transactionType && { type: filters.transactionType }),
  }).toString();

  const { 
    data: transactionResponse,
    isLoading: transactionLoading,
    error: transactionError 
  } = useQuery<TransactionResponse>({
    queryKey: ['/api/history/transactions', filters, fetchLimit],
    queryFn: () => 
      fetch(`/api/history/transactions?${transactionParams}`)
        .then(res => res.json()),
  });

  const transactions = transactionResponse?.data || [];
  const totalTransactions = transactionResponse?.total || 0;

  // Fetch settlement data for loan grouping
  const settlementParams = new URLSearchParams({
    ...(filters.bankId && { bankId: filters.bankId }),
    ...(filters.facilityId && { facilityId: filters.facilityId }),
    from: filters.dateFrom,
    to: filters.dateTo,
  }).toString();

  const { 
    data: settlementResponse,
    isLoading: settlementLoading 
  } = useQuery<SettlementResponse>({
    queryKey: ['/api/history/loan-settlements', settlementParams],
    queryFn: () => 
      fetch(`/api/history/loan-settlements?${settlementParams}`)
        .then(res => res.json()),
  });

  const loanSettlements = settlementResponse?.data || [];
  const settlementSummary = settlementResponse?.summary;

  // Process exposure data for chart
  const processExposureData = () => {
    if (!exposureData.length) return [];

    // Group by date and aggregate by bank
    const groupedData = exposureData.reduce((acc, snapshot) => {
      if (!snapshot.bankId) return acc; // Skip global aggregations
      
      const dateKey = snapshot.date;
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          total: 0,
        };
      }

      const bankName = banks.find(b => b.id === snapshot.bankId)?.name || 'Unknown';
      const bankKey = bankName.replace(/[^a-zA-Z0-9]/g, '_');
      
      acc[dateKey][bankKey] = parseFloat(snapshot.outstanding);
      acc[dateKey].total += parseFloat(snapshot.outstanding);

      return acc;
    }, {} as any);

    return Object.values(groupedData).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  const chartData = processExposureData();

  // Enhanced bank management for interactive chart
  const processedBankData = () => {
    if (!chartData.length) return { topBanks: [], otherBanks: [], allBanks: [] };
    
    // Calculate total exposure per bank across all time periods
    const bankTotals = banks.map(bank => {
      const bankKey = bank.name.replace(/[^a-zA-Z0-9]/g, '_');
      const total = chartData.reduce((sum, dataPoint: any) => {
        return sum + (dataPoint[bankKey] || 0);
      }, 0);
      return { bank, bankKey, total, name: bank.name };
    }).filter(item => item.total > 0)
      .sort((a, b) => b.total - a.total);

    const topBanks = bankTotals.slice(0, 5);
    const otherBanks = bankTotals.slice(5);
    
    return { topBanks, otherBanks, allBanks: bankTotals };
  };

  const { topBanks, otherBanks, allBanks } = processedBankData();
  
  // Initialize visible banks with top 5 on first load (moved to useEffect to avoid render issues)
  useEffect(() => {
    if (showTop5Only && visibleBanks.size === 0 && topBanks.length > 0) {
      setVisibleBanks(new Set(topBanks.map(item => item.bankKey)));
    }
  }, [showTop5Only, topBanks.length, visibleBanks.size]);

  // Enhanced chart data with "Others" aggregation
  const enhancedChartData = chartData.map((dataPoint: any) => {
    const enhanced = { ...dataPoint };
    
    // Calculate "Others" total if showing top 5 only
    if (showTop5Only && otherBanks.length > 0) {
      enhanced.Others = otherBanks.reduce((sum, item) => {
        return sum + (dataPoint[item.bankKey] || 0);
      }, 0);
    }
    
    return enhanced;
  });

  // Get banks to display in chart
  const getBanksToDisplay = () => {
    if (showTop5Only) {
      const result = topBanks.map(item => item.bankKey);
      if (otherBanks.length > 0) result.push('Others');
      return result;
    }
    return allBanks
      .filter(item => visibleBanks.has(item.bankKey))
      .map(item => item.bankKey);
  };

  const banksToDisplay = getBanksToDisplay();

  // Settlement status formatting
  const getSettlementStatusColor = (status: string) => {
    const colorMap = {
      active: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      settled: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      overdue: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return colorMap[status as keyof typeof colorMap] || colorMap.active;
  };

  const formatSettlementStatus = (status: string) => {
    const statusMap = {
      active: 'Active',
      settled: 'Settled',
      overdue: 'Overdue'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  // Transaction type formatting
  const formatTransactionType = (type: string) => {
    const typeMap = {
      draw: 'Draw',
      repayment: 'Repayment', 
      fee: 'Fee',
      interest: 'Interest',
      limit_change: 'Limit Change',
      other: 'Other'
    };
    return typeMap[type as keyof typeof typeMap] || type;
  };

  // Use centralized Saudi-themed styling
  const getTransactionTypeColor = getTransactionTypeStyle;

  // Format currency
  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  if (exposureError || transactionError) {
    return (
      <div className="p-6">
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <AlertDescription className="text-red-800 dark:text-red-200">
            Failed to load history data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground" data-testid="text-page-title">
            Portfolio History
          </h1>
          <p className="text-muted-foreground mt-1">
            Track exposure trends and transaction history over time
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            data-testid="button-export-transactions"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button 
            variant="outline"
            size="sm" 
            data-testid="button-filter-toggle"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
        </div>

        {/* Timeframe Selection */}
          <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" style={{ color: SAUDI_CHART_COLORS.saudiGreen }} />
                Exposure Over Time
              </CardTitle>
              
              {/* Controls Row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                {/* View Toggle */}
                <div className="flex items-center gap-2">
                  <Button
                    variant={showTop5Only ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setShowTop5Only(true);
                      setVisibleBanks(new Set(topBanks.map(item => item.bankKey)));
                    }}
                    data-testid="button-top5-view"
                  >
                    Top 5
                  </Button>
                  <Button
                    variant={!showTop5Only ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setShowTop5Only(false);
                      setVisibleBanks(new Set(allBanks.map(item => item.bankKey)));
                    }}
                    data-testid="button-all-banks-view"
                  >
                    All Banks
                  </Button>
                </div>
                
                {/* Timeframe Selection */}
                <div className="flex items-center gap-2">
                  {(['30D', '6M', '1Y', 'MAX'] as TimeframeType[]).map((timeframe) => (
                    <Button
                      key={timeframe}
                      variant={selectedTimeframe === timeframe ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleTimeframeChange(timeframe)}
                      data-testid={`button-timeframe-${timeframe.toLowerCase()}`}
                    >
                      {timeframe}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Bank Toggle Controls - Only show when not in Top 5 mode */}
            {!showTop5Only && allBanks.length > 0 && (
              <div className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {allBanks.map((item, index) => {
                    const isVisible = visibleBanks.has(item.bankKey);
                    return (
                      <Button
                        key={item.bankKey}
                        variant={isVisible ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          const newVisible = new Set(visibleBanks);
                          if (isVisible) {
                            newVisible.delete(item.bankKey);
                          } else {
                            newVisible.add(item.bankKey);
                          }
                          setVisibleBanks(newVisible);
                        }}
                        className="text-xs"
                        data-testid={`button-toggle-${item.bankKey}`}
                      >
                        {isVisible ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                        {item.name}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {exposureLoading ? (
              <div className="h-80 flex items-center justify-center">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-64 w-full" />
                </div>
              </div>
            ) : enhancedChartData.length > 0 ? (
              <div className="h-80 w-full" data-testid="chart-exposure-trends">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={enhancedChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="date" 
                      className="text-muted-foreground text-sm"
                      tickFormatter={(value) => format(new Date(value), 'MMM yyyy')}
                    />
                    <YAxis 
                      className="text-muted-foreground text-sm"
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <Tooltip 
                      labelFormatter={(value) => format(new Date(value as string), 'MMM dd, yyyy')}
                      formatter={(value: number, name: string) => {
                        if (name === 'Others') {
                          return [formatCurrency(value), 'Other Banks'];
                        }
                        const bank = banks.find(b => b.name.replace(/[^a-zA-Z0-9]/g, '_') === name);
                        return [formatCurrency(value), bank?.name || name];
                      }}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    {banksToDisplay.map((bankKey, index) => {
                      const color = bankKey === 'Others' 
                        ? SAUDI_CHART_COLORS.status.neutral 
                        : getBankColor(index);
                      
                      return (
                        <Line
                          key={bankKey}
                          type="monotone"
                          dataKey={bankKey}
                          stroke={color}
                          strokeWidth={2}
                          dot={{ fill: color, strokeWidth: 2, r: 3 }}
                          activeDot={{ r: 5, stroke: color, strokeWidth: 2 }}
                          connectNulls={false}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No exposure data available for the selected period</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filters Row */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-saudi" />
              Transaction Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="space-y-2">
                <Label>Date Preset</Label>
                <Select
                  value={selectedDatePreset}
                  onValueChange={(value) => handleDatePresetChange(value as DatePreset)}
                  data-testid="select-date-preset"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Custom" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Custom</SelectItem>
                    <SelectItem value="this_quarter">This Quarter</SelectItem>
                    <SelectItem value="last_quarter">Last Quarter</SelectItem>
                    <SelectItem value="this_year">This Year</SelectItem>
                    <SelectItem value="last_year">Last Year</SelectItem>
                    <SelectItem value="2024_q1">2024 Q1</SelectItem>
                    <SelectItem value="2024_q2">2024 Q2</SelectItem>
                    <SelectItem value="2024_q3">2024 Q3</SelectItem>
                    <SelectItem value="2024_q4">2024 Q4</SelectItem>
                    <SelectItem value="2025_q1">2025 Q1</SelectItem>
                    <SelectItem value="2025_q2">2025 Q2</SelectItem>
                    <SelectItem value="2025_q3">2025 Q3</SelectItem>
                    <SelectItem value="2025_q4">2025 Q4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-from">From Date</Label>
                <ModernDatePicker
                  value={filters.dateFrom}
                  onChange={(value) => {
                    setFilters(prev => ({ ...prev, dateFrom: value }));
                    setSelectedDatePreset('custom');
                  }}
                  placeholder="Select from date"
                  dataTestId="input-date-from"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-to">To Date</Label>
                <ModernDatePicker
                  value={filters.dateTo}
                  onChange={(value) => {
                    setFilters(prev => ({ ...prev, dateTo: value }));
                    setSelectedDatePreset('custom');
                  }}
                  placeholder="Select to date"
                  dataTestId="input-date-to"
                />
              </div>
              <div className="space-y-2">
                <Label>Bank</Label>
                <Select
                  value={filters.bankId}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, bankId: value === 'all' ? '' : value }))}
                  data-testid="select-bank-filter"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All banks" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All banks</SelectItem>
                    {banks.map((bank) => (
                      <SelectItem key={bank.id} value={bank.id}>
                        {bank.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Transaction Type</Label>
                <Select
                  value={filters.transactionType}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, transactionType: value === 'all' ? '' : value }))}
                  data-testid="select-transaction-type-filter"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="draw">Draw</SelectItem>
                    <SelectItem value="repayment">Repayment</SelectItem>
                    <SelectItem value="fee">Fee</SelectItem>
                    <SelectItem value="interest">Interest</SelectItem>
                    <SelectItem value="limit_change">Limit Change</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Settlement Status</Label>
                <Select
                  value={filters.settlementStatus}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, settlementStatus: value === 'all' ? '' : value }))}
                  data-testid="select-settlement-status-filter"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="settled">Settled</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settlement Summary */}
        {settlementSummary && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-saudi" />
                Loan Settlement Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Loan Status Overview */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{settlementSummary.totalLoans}</div>
                    <div className="text-sm text-muted-foreground">Total Loans</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{settlementSummary.activeLoans}</div>
                    <div className="text-sm text-muted-foreground">Active</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{settlementSummary.settledLoans}</div>
                    <div className="text-sm text-muted-foreground">Settled</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{settlementSummary.overdueLoans}</div>
                    <div className="text-sm text-muted-foreground">Overdue</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">
                      {formatCurrency(settlementSummary.totalOutstanding)}
                    </div>
                    <div className="text-sm text-muted-foreground">Outstanding</div>
                  </div>
                </div>
                
                {/* Principal vs Interest Breakdown */}
                {loanSettlements.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-foreground mb-3">Payment Allocation Analysis</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
                        <div className="text-lg font-bold text-blue-600">
                          {formatCurrency(loanSettlements.reduce((sum, loan) => sum + loan.principalPaid, 0))}
                        </div>
                        <div className="text-sm text-muted-foreground">Principal Paid</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          vs. {formatCurrency(loanSettlements.reduce((sum, loan) => sum + loan.breakdown.principalRemaining, 0))} remaining
                        </div>
                      </div>
                      <div className="bg-orange-50 dark:bg-orange-950 rounded-lg p-4">
                        <div className="text-lg font-bold text-orange-600">
                          {formatCurrency(loanSettlements.reduce((sum, loan) => sum + loan.totalInterestPaid, 0))}
                        </div>
                        <div className="text-sm text-muted-foreground">Interest Paid</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          vs. {formatCurrency(loanSettlements.reduce((sum, loan) => sum + loan.breakdown.interestRemaining, 0))} remaining
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-4">
                        <div className="text-lg font-bold text-gray-600">
                          {formatCurrency(loanSettlements.reduce((sum, loan) => sum + loan.feeCharges, 0))}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Fees</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Administrative charges
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loan Settlement Progress */}
        {loanSettlements.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-saudi" />
                Loan Settlement Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loanSettlements.slice(0, 10).map((loan) => (
                  <div key={loan.loanId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium">{loan.referenceNumber}</div>
                          <div className="text-sm text-muted-foreground">{loan.bankName}</div>
                        </div>
                        <Badge 
                          className={getSettlementStatusColor(loan.settlementStatus)}
                          data-testid={`badge-settlement-${loan.settlementStatus}`}
                        >
                          {formatSettlementStatus(loan.settlementStatus)}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(loan.outstandingBalance)}</div>
                        <div className="text-sm text-muted-foreground">Outstanding</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Settlement Progress</span>
                        <span>{loan.settlementProgress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-saudi h-2 rounded-full transition-all duration-300"
                          style={{ width: `${loan.settlementProgress}%` }}
                          data-testid={`progress-settlement-${loan.loanId}`}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <div className="font-medium text-muted-foreground mb-1">Principal</div>
                          <div className="flex justify-between">
                            <span className="text-green-600">Paid:</span>
                            <span>{formatCurrency(loan.principalPaid)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Remaining:</span>
                            <span>{formatCurrency(loan.breakdown.principalRemaining)}</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-1">
                            <div 
                              className="bg-blue-500 h-1 rounded-full"
                              style={{ width: `${loan.principalProgress}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-muted-foreground mb-1">Interest & Fees</div>
                          <div className="flex justify-between">
                            <span className="text-orange-600">Paid:</span>
                            <span>{formatCurrency(loan.totalInterestPaid)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Remaining:</span>
                            <span>{formatCurrency(loan.breakdown.interestRemaining + loan.breakdown.feesRemaining)}</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-1">
                            <div 
                              className="bg-orange-500 h-1 rounded-full"
                              style={{ width: `${loan.interestProgress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transactions Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-saudi" />
                Transaction History
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                {transactionResponse?.total || 0} transactions found
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {transactionLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : transactions.length > 0 ? (
              <>
                <div className="overflow-x-auto rounded-md border" data-testid="table-transactions">
                  <Table className="min-w-[720px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Date</TableHead>
                        <TableHead>Bank</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.slice(0, visibleTransactions).map((transaction) => (
                        <TableRow key={transaction.id} data-testid={`row-transaction-${transaction.id}`}>
                          <TableCell className="font-medium">
                            {format(new Date(transaction.date), 'MMM dd')}
                          </TableCell>
                          <TableCell>
                            {banks.find(b => b.id === transaction.bankId)?.name || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={getTransactionTypeColor(transaction.type)}
                              data-testid={`badge-transaction-type-${transaction.type}`}
                            >
                              {formatTransactionType(transaction.type)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(transaction.amount)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {transaction.reference || '-'}
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-[200px] truncate">
                            {transaction.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Load More Button */}
                {totalTransactions > visibleTransactions && (
                  <div className="mt-4 flex justify-center">
                    <Button 
                      variant="outline" 
                      onClick={() => setVisibleTransactions(prev => prev + itemsPerPage)}
                      data-testid="button-load-more-transactions"
                    >
                      <ChevronDown className="mr-2 h-4 w-4" />
                      Load more ({totalTransactions - visibleTransactions} remaining)
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <div className="space-y-3">
                  <Building2 className="h-12 w-12 mx-auto opacity-50" />
                  <p>No transactions found for the selected criteria</p>
                  <p className="text-sm">Try adjusting your filters to see more results</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}