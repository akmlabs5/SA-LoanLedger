import { useState } from "react";
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
  ChevronRight
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
import { 
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { ExposureSnapshot, Transaction, Bank } from "@shared/schema";

interface HistoryFilters {
  dateFrom: string;
  dateTo: string;
  bankId: string;
  facilityId: string;
  loanId: string;
  transactionType: string;
}

interface TransactionResponse {
  data: Transaction[];
  total: number;
  limit: number;
  offset: number;
}

type TimeframeType = '30D' | '6M' | '1Y' | 'MAX';

export default function HistoryPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25);
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeType>('1Y');
  const [filters, setFilters] = useState<HistoryFilters>({
    dateFrom: format(subYears(new Date(), 1), 'yyyy-MM-dd'),
    dateTo: format(new Date(), 'yyyy-MM-dd'),
    bankId: '',
    facilityId: '',
    loanId: '',
    transactionType: '',
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

  // Fetch transactions for table
  const transactionParams = new URLSearchParams({
    from: filters.dateFrom,
    to: filters.dateTo,
    limit: pageSize.toString(),
    offset: ((currentPage - 1) * pageSize).toString(),
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
    queryKey: ['/api/history/transactions', transactionParams],
    queryFn: () => 
      fetch(`/api/history/transactions?${transactionParams}`)
        .then(res => res.json()),
  });

  const transactions = transactionResponse?.data || [];
  const totalPages = Math.ceil((transactionResponse?.total || 0) / pageSize);

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

  // Get unique bank names for chart colors
  const bankNames = banks.map(bank => bank.name.replace(/[^a-zA-Z0-9]/g, '_'));
  const bankColors = [
    '#059669', // Saudi Green primary
    '#10b981', // Emerald
    '#3b82f6', // Blue  
    '#8b5cf6', // Purple
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#06b6d4', // Cyan
    '#84cc16', // Lime
  ];

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

  const getTransactionTypeColor = (type: string) => {
    const colorMap = {
      draw: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      repayment: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      fee: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      interest: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      limit_change: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };
    return colorMap[type as keyof typeof colorMap] || colorMap.other;
  };

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
    <div className="p-6 space-y-6 bg-background min-h-screen">
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
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-saudi" />
              Exposure Over Time
            </CardTitle>
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
          ) : chartData.length > 0 ? (
            <div className="h-80 w-full" data-testid="chart-exposure-trends">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      banks.find(b => b.name.replace(/[^a-zA-Z0-9]/g, '_') === name)?.name || name
                    ]}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  {bankNames.map((bankName, index) => (
                    <Area
                      key={bankName}
                      type="monotone"
                      dataKey={bankName}
                      stackId="1"
                      stroke={bankColors[index % bankColors.length]}
                      fill={bankColors[index % bankColors.length]}
                      fillOpacity={0.6}
                    />
                  ))}
                </AreaChart>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date-from">From Date</Label>
              <Input
                id="date-from"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                data-testid="input-date-from"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-to">To Date</Label>
              <Input
                id="date-to"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                data-testid="input-date-to"
              />
            </div>
            <div className="space-y-2">
              <Label>Bank</Label>
              <Select
                value={filters.bankId}
                onValueChange={(value) => setFilters(prev => ({ ...prev, bankId: value }))}
                data-testid="select-bank-filter"
              >
                <SelectTrigger>
                  <SelectValue placeholder="All banks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All banks</SelectItem>
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
                onValueChange={(value) => setFilters(prev => ({ ...prev, transactionType: value }))}
                data-testid="select-transaction-type-filter"
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="draw">Draw</SelectItem>
                  <SelectItem value="repayment">Repayment</SelectItem>
                  <SelectItem value="fee">Fee</SelectItem>
                  <SelectItem value="interest">Interest</SelectItem>
                  <SelectItem value="limit_change">Limit Change</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

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
              <div className="rounded-md border" data-testid="table-transactions">
                <Table>
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
                    {transactions.map((transaction) => (
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, transactionResponse?.total || 0)} of {transactionResponse?.total || 0} transactions
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      data-testid="button-prev-page"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <div className="text-sm font-medium">
                      Page {currentPage} of {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      data-testid="button-next-page"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
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
  );
}