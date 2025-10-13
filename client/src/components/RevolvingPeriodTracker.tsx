import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface RevolvingPeriodTrackerProps {
  loanId: string;
  maxRevolvingPeriod: number;
  className?: string;
  compact?: boolean;
}

interface RevolvingUsageData {
  daysUsed: number;
  daysRemaining: number;
  percentageUsed: number;
  status: 'available' | 'warning' | 'critical' | 'expired';
  canRevolve: boolean;
  maxRevolvingPeriod: number;
  loanStatus: string;
}

export function RevolvingPeriodTracker({ 
  loanId, 
  maxRevolvingPeriod, 
  className,
  compact = false 
}: RevolvingPeriodTrackerProps) {
  const { data: usageData, isLoading, error } = useQuery<RevolvingUsageData>({
    queryKey: ["/api/loans", loanId, "revolving-usage"],
    queryFn: async () => {
      const response = await fetch(`/api/loans/${loanId}/revolving-usage`);
      if (!response.ok) {
        throw new Error('Failed to fetch revolving usage data');
      }
      return response.json();
    },
    enabled: !!loanId,
  });

  if (isLoading) {
    return (
      <Card className={className} data-testid="card-revolving-tracker-loading">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Loan Revolving Period</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error || !usageData) {
    return (
      <Card className={className} data-testid="card-revolving-tracker-error">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Loan Revolving Period</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800" data-testid="alert-error-state">
            <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
              This facility doesn't have revolving period tracking enabled. You can still monitor your loan normally.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const { daysUsed, daysRemaining, percentageUsed, status, canRevolve, loanStatus } = usageData;

  // Status color and icon
  const getStatusConfig = () => {
    switch (status) {
      case 'available':
        return {
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-950',
          borderColor: 'border-green-200 dark:border-green-800',
          progressColor: 'bg-green-500',
          icon: CheckCircle2,
          label: 'On Track',
          message: 'This loan is within the allowed revolving period limit set by the bank.'
        };
      case 'warning':
        return {
          color: 'text-yellow-600 dark:text-yellow-400',
          bgColor: 'bg-yellow-50 dark:bg-yellow-950',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          progressColor: 'bg-yellow-500',
          icon: AlertTriangle,
          label: 'Warning',
          message: 'This loan is approaching the maximum allowed duration. Consider settling soon.'
        };
      case 'critical':
        return {
          color: 'text-orange-600 dark:text-orange-400',
          bgColor: 'bg-orange-50 dark:bg-orange-950',
          borderColor: 'border-orange-200 dark:border-orange-800',
          progressColor: 'bg-orange-500',
          icon: AlertTriangle,
          label: 'Critical',
          message: 'This loan is very close to exceeding the maximum allowed duration. Settle immediately.'
        };
      case 'expired':
        return {
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-950',
          borderColor: 'border-red-200 dark:border-red-800',
          progressColor: 'bg-red-500',
          icon: XCircle,
          label: 'Expired',
          message: 'This loan has exceeded the maximum allowed revolving period. Please settle this loan.'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  if (compact) {
    return (
      <div 
        className={`flex items-center justify-between p-3 rounded-lg border ${statusConfig.borderColor} ${statusConfig.bgColor} ${className}`}
        data-testid="card-revolving-tracker-compact"
      >
        <div className="flex items-center space-x-3">
          <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
          <div>
            <p className="text-sm font-medium" data-testid="text-days-used-compact">
              Loan Duration: <span data-testid="value-days-used">{daysUsed}</span> / {maxRevolvingPeriod} days
            </p>
            <p className="text-xs text-muted-foreground" data-testid="text-days-remaining-compact">
              <span data-testid="value-days-remaining">{daysRemaining}</span> days remaining before limit
            </p>
          </div>
        </div>
        <Badge variant={status === 'available' ? "default" : status === 'expired' ? "destructive" : "outline"} className="text-xs" data-testid="badge-revolve-status-compact">
          {statusConfig.label}
        </Badge>
      </div>
    );
  }

  return (
    <Card className={className} data-testid="card-revolving-tracker-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Loan Revolving Period</span>
          </CardTitle>
          <Badge 
            variant={status === 'available' ? 'default' : status === 'expired' ? 'destructive' : 'outline'}
            className="text-xs"
            data-testid="badge-status-label"
          >
            {statusConfig.label}
          </Badge>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          This tracks how long this loan has been active (not your loan's due date). Maximum {maxRevolvingPeriod} days from first loan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Usage Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Loan Days Used</p>
            <p className="text-2xl font-bold" data-testid="text-days-used">{daysUsed}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Days Remaining</p>
            <p className="text-2xl font-bold" data-testid="text-days-remaining">{daysRemaining}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Duration Used</span>
            <span className="font-medium" data-testid="text-usage-percent">{percentageUsed.toFixed(1)}%</span>
          </div>
          <Progress 
            value={percentageUsed} 
            className="h-2"
            data-testid="progress-revolving-usage"
          />
        </div>

        {/* Status Alert */}
        <Alert className={`${statusConfig.borderColor} ${statusConfig.bgColor}`}>
          <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
          <AlertDescription className={`text-sm ${statusConfig.color}`}>
            {statusConfig.message}
          </AlertDescription>
        </Alert>

        {/* Loan Status */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Loan Status</span>
            <Badge variant={loanStatus === 'active' ? 'default' : 'secondary'} data-testid="badge-loan-status">
              {loanStatus.charAt(0).toUpperCase() + loanStatus.slice(1)}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
