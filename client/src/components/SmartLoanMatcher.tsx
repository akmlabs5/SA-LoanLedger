import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface LoanMatcherProps {
  onFacilitySelect?: (facilityId: string) => void;
}

export function SmartLoanMatcher({ onFacilitySelect }: LoanMatcherProps) {
  const [open, setOpen] = useState(false);
  const [loanAmount, setLoanAmount] = useState("");
  const [facilityType, setFacilityType] = useState("");
  const [duration, setDuration] = useState("");
  const [results, setResults] = useState<any>(null);

  const matchMutation = useMutation({
    mutationFn: async (data: { loanAmount: number; facilityType?: string; duration?: number }) => {
      return await apiRequest('POST', '/api/ai/loan-matcher', data);
    },
    onSuccess: (data) => {
      setResults(data);
    }
  });

  const handleAnalyze = () => {
    const amount = parseFloat(loanAmount);
    if (!amount || amount <= 0) {
      return;
    }

    matchMutation.mutate({
      loanAmount: amount,
      facilityType: facilityType && facilityType !== 'any' ? facilityType : undefined,
      duration: duration ? parseInt(duration) : undefined
    });
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    // Reset form state when dialog closes
    if (!isOpen) {
      setLoanAmount("");
      setFacilityType("");
      setDuration("");
      setResults(null);
    }
  };

  const handleSelectFacility = (facilityId: string) => {
    if (onFacilitySelect) {
      onFacilitySelect(facilityId);
      handleOpenChange(false); // Use handleOpenChange to ensure form resets
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Excellent</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">Good</Badge>;
    return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">Fair</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" data-testid="button-smart-matcher">
          <Sparkles className="h-4 w-4 mr-2" />
          Smart Loan Matcher
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Smart Loan Matcher
          </DialogTitle>
          <DialogDescription>
            Let AI analyze your facilities and recommend the best option for your loan
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Input Form */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="loan-amount">Loan Amount (SAR) *</Label>
              <Input
                id="loan-amount"
                type="number"
                placeholder="100000"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                data-testid="input-loan-amount"
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facility-type">Facility Type (Optional)</Label>
              <Select value={facilityType} onValueChange={setFacilityType}>
                <SelectTrigger data-testid="select-facility-type" className="h-12">
                  <SelectValue placeholder="Any Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Type</SelectItem>
                  <SelectItem value="term">Term Loan</SelectItem>
                  <SelectItem value="revolving">Revolving</SelectItem>
                  <SelectItem value="working_capital">Working Capital</SelectItem>
                  <SelectItem value="overdraft">Overdraft</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (Days, Optional)</Label>
              <Input
                id="duration"
                type="number"
                placeholder="90"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                data-testid="input-duration"
                className="h-12"
              />
            </div>
          </div>

          <Button 
            onClick={handleAnalyze} 
            disabled={!loanAmount || matchMutation.isPending}
            className="w-full h-12"
            data-testid="button-analyze"
          >
            {matchMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 mr-2" />
                Analyze Facilities
              </>
            )}
          </Button>

          {/* Results */}
          {results && (
            <div className="space-y-4">
              {results.recommendation ? (
                <>
                  {/* Top Recommendation */}
                  <Card className="border-2 border-green-500 dark:border-green-600">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          🏆 Top Recommendation
                        </CardTitle>
                        {getScoreBadge(results.recommendation.score)}
                      </div>
                      <CardDescription>{results.recommendation.facilityName}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Available Credit</p>
                          <p className="font-semibold text-lg">
                            SAR {results.recommendation.availableCredit.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Utilization</p>
                          <p className="font-semibold text-lg">
                            {results.recommendation.utilizationPercent}%
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Interest Rate</p>
                          <p className="font-semibold text-lg">
                            {results.recommendation.interestRate}%
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Match Score</p>
                          <p className={`font-semibold text-lg ${getScoreColor(results.recommendation.score)}`}>
                            {results.recommendation.score}/100
                          </p>
                        </div>
                      </div>

                      {results.recommendation.reasons.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-green-700 dark:text-green-400">
                            ✓ Strengths:
                          </p>
                          {results.recommendation.reasons.map((reason: string, idx: number) => (
                            <p key={idx} className="text-sm text-green-600 dark:text-green-500 flex items-start gap-2">
                              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              {reason}
                            </p>
                          ))}
                        </div>
                      )}

                      {results.recommendation.warnings.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                            ⚠ Considerations:
                          </p>
                          {results.recommendation.warnings.map((warning: string, idx: number) => (
                            <p key={idx} className="text-sm text-yellow-600 dark:text-yellow-500 flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              {warning}
                            </p>
                          ))}
                        </div>
                      )}

                      {onFacilitySelect && (
                        <Button 
                          className="w-full h-12"
                          onClick={() => handleSelectFacility(results.recommendation.facilityId)}
                          data-testid="button-select-recommended"
                        >
                          Use This Facility
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  {/* Alternatives */}
                  {results.alternatives && results.alternatives.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm text-muted-foreground">
                        Alternative Options
                      </h3>
                      {results.alternatives.map((alt: any) => (
                        <Card key={alt.facilityId} className="border border-gray-300 dark:border-gray-700">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-medium">{alt.facilityName}</p>
                              {getScoreBadge(alt.score)}
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                              <div>
                                Available: SAR {alt.availableCredit.toLocaleString()}
                              </div>
                              <div>
                                Utilization: {alt.utilizationPercent}%
                              </div>
                              <div>
                                Rate: {alt.interestRate}%
                              </div>
                            </div>
                            {onFacilitySelect && (
                              <Button 
                                variant="outline" 
                                className="w-full mt-2 h-12"
                                onClick={() => handleSelectFacility(alt.facilityId)}
                                data-testid={`button-select-alt-${alt.facilityId}`}
                              >
                                Use This Facility
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Card className="border-2 border-yellow-500 dark:border-yellow-600">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-yellow-700 dark:text-yellow-400">
                          {results.message}
                        </p>
                        {results.allFacilities && results.allFacilities.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <p className="text-sm text-muted-foreground">
                              Facility Status:
                            </p>
                            {results.allFacilities.map((fac: any) => (
                              <div key={fac.facilityId} className="text-sm">
                                <p className="font-medium">{fac.facilityName}</p>
                                <p className="text-red-600 dark:text-red-400">
                                  {fac.warnings[0]}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
