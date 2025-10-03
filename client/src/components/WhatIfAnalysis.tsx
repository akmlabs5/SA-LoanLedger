import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, TrendingDown, TrendingUp, Loader2, Calendar, Percent, DollarSign } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface WhatIfAnalysisProps {
  loanId: string;
  loanAmount: number;
  currentRate: number;
  durationDays: number;
}

export function WhatIfAnalysis({ loanId, loanAmount, currentRate, durationDays }: WhatIfAnalysisProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("refinance");
  
  // Refinance inputs
  const [newRate, setNewRate] = useState(currentRate.toString());
  
  // Early payment inputs
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Term change inputs
  const [newDuration, setNewDuration] = useState(durationDays.toString());
  
  const [results, setResults] = useState<any>(null);

  const analysisMutation = useMutation({
    mutationFn: async (scenarios: any) => {
      return await apiRequest('POST', '/api/ai/what-if-analysis', {
        loanId,
        scenarios
      });
    },
    onSuccess: (data) => {
      setResults(data);
    }
  });

  const handleRunScenario = () => {
    const scenarios: any = {};
    
    if (activeTab === "refinance" && newRate) {
      scenarios.refinance = { newRate: parseFloat(newRate) };
    }
    
    if (activeTab === "earlyPayment" && paymentAmount) {
      scenarios.earlyPayment = {
        paymentAmount: parseFloat(paymentAmount),
        paymentDate
      };
    }
    
    if (activeTab === "termChange" && newDuration) {
      scenarios.termChange = { newDurationDays: parseInt(newDuration) };
    }
    
    analysisMutation.mutate(scenarios);
  };

  const getSavingsColor = (savings: number) => {
    if (savings > 0) return "text-green-600 dark:text-green-400";
    if (savings < 0) return "text-red-600 dark:text-red-400";
    return "text-gray-600 dark:text-gray-400";
  };

  const formatCurrency = (value: number) => {
    return `SAR ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-what-if">
          <Calculator className="h-4 w-4 mr-2" />
          What-If Analysis
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            What-If Scenario Analysis
          </DialogTitle>
          <DialogDescription>
            Explore different scenarios to optimize your loan and save money
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Current Loan Info & Scenario Inputs */}
          <div className="space-y-4">
            {/* Current Loan Summary */}
            {results && (
              <Card className="border-2 border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Current Loan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Principal:</span>
                    <span className="font-semibold">{formatCurrency(results.current.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Interest Rate:</span>
                    <span className="font-semibold">{results.current.rate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-semibold">{results.current.durationDays} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Interest Cost:</span>
                    <span className="font-semibold">{formatCurrency(results.current.interest)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-muted-foreground">Total Cost:</span>
                    <span className="font-bold text-lg">{formatCurrency(results.current.totalCost)}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Scenario Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 h-12">
                <TabsTrigger value="refinance" data-testid="tab-refinance" className="h-12">
                  <Percent className="h-3 w-3 mr-1" />
                  Refinance
                </TabsTrigger>
                <TabsTrigger value="earlyPayment" data-testid="tab-early-payment" className="h-12">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Early Pay
                </TabsTrigger>
                <TabsTrigger value="termChange" data-testid="tab-term-change" className="h-12">
                  <Calendar className="h-3 w-3 mr-1" />
                  Term
                </TabsTrigger>
              </TabsList>

              <TabsContent value="refinance" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="new-rate">New Interest Rate (%)</Label>
                  <Input
                    id="new-rate"
                    type="number"
                    step="0.01"
                    placeholder={currentRate.toString()}
                    value={newRate}
                    onChange={(e) => setNewRate(e.target.value)}
                    data-testid="input-new-rate"
                    className="h-12"
                  />
                  <p className="text-xs text-muted-foreground">
                    Current rate: {currentRate}%
                  </p>
                </div>
                <Button 
                  onClick={handleRunScenario}
                  disabled={!newRate || analysisMutation.isPending}
                  className="w-full h-12"
                  data-testid="button-run-refinance"
                >
                  {analysisMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Calculating...</>
                  ) : (
                    <><Calculator className="h-4 w-4 mr-2" /> Calculate Refinance Impact</>
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="earlyPayment" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="payment-amount">Payment Amount (SAR)</Label>
                  <Input
                    id="payment-amount"
                    type="number"
                    placeholder={loanAmount.toString()}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    data-testid="input-payment-amount"
                    className="h-12"
                  />
                  <p className="text-xs text-muted-foreground">
                    Full amount: {formatCurrency(loanAmount)}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment-date">Payment Date</Label>
                  <Input
                    id="payment-date"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    data-testid="input-payment-date"
                    className="h-12"
                  />
                </div>
                <Button 
                  onClick={handleRunScenario}
                  disabled={!paymentAmount || analysisMutation.isPending}
                  className="w-full h-12"
                  data-testid="button-run-early-payment"
                >
                  {analysisMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Calculating...</>
                  ) : (
                    <><Calculator className="h-4 w-4 mr-2" /> Calculate Payment Impact</>
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="termChange" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="new-duration">New Duration (Days)</Label>
                  <Input
                    id="new-duration"
                    type="number"
                    placeholder={durationDays.toString()}
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    data-testid="input-new-duration"
                    className="h-12"
                  />
                  <p className="text-xs text-muted-foreground">
                    Current duration: {durationDays} days
                  </p>
                </div>
                <Button 
                  onClick={handleRunScenario}
                  disabled={!newDuration || analysisMutation.isPending}
                  className="w-full h-12"
                  data-testid="button-run-term-change"
                >
                  {analysisMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Calculating...</>
                  ) : (
                    <><Calculator className="h-4 w-4 mr-2" /> Calculate Term Impact</>
                  )}
                </Button>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: Results */}
          <div className="space-y-4">
            {results && results.scenarios.length > 0 ? (
              results.scenarios.map((scenario: any, idx: number) => (
                <Card key={idx} className="border-2 border-purple-200 dark:border-purple-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{scenario.name}</CardTitle>
                      {scenario.savings !== undefined && (
                        <Badge className={scenario.savings > 0 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"}>
                          {scenario.savings > 0 ? (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          )}
                          {Math.abs(scenario.savingsPercent || scenario.differencePercent || 0).toFixed(1)}%
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {scenario.type === 'refinance' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">New Rate:</span>
                          <span className="font-semibold">{scenario.newRate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Interest Cost:</span>
                          <span className="font-semibold">{formatCurrency(scenario.interest)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Cost:</span>
                          <span className="font-semibold">{formatCurrency(scenario.totalCost)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t">
                          <span className="text-muted-foreground">Savings:</span>
                          <span className={`font-bold text-lg ${getSavingsColor(scenario.savings)}`}>
                            {formatCurrency(Math.abs(scenario.savings))}
                          </span>
                        </div>
                      </>
                    )}

                    {(scenario.type === 'earlyPayment' || scenario.type === 'partialPayment') && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Payment Amount:</span>
                          <span className="font-semibold">{formatCurrency(scenario.paymentAmount)}</span>
                        </div>
                        {scenario.type === 'partialPayment' && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Remaining Principal:</span>
                            <span className="font-semibold">{formatCurrency(scenario.remainingPrincipal)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Interest Cost:</span>
                          <span className="font-semibold">{formatCurrency(scenario.interestPaid || scenario.totalInterest)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t">
                          <span className="text-muted-foreground">Savings:</span>
                          <span className={`font-bold text-lg ${getSavingsColor(scenario.savings)}`}>
                            {formatCurrency(scenario.savings)}
                          </span>
                        </div>
                      </>
                    )}

                    {scenario.type === 'termChange' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">New Duration:</span>
                          <span className="font-semibold">{scenario.newDurationDays} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Interest Cost:</span>
                          <span className="font-semibold">{formatCurrency(scenario.interest)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Cost:</span>
                          <span className="font-semibold">{formatCurrency(scenario.totalCost)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t">
                          <span className="text-muted-foreground">Difference:</span>
                          <span className={`font-bold text-lg ${getSavingsColor(-scenario.difference)}`}>
                            {scenario.difference > 0 ? '+' : ''}{formatCurrency(Math.abs(scenario.difference))}
                          </span>
                        </div>
                      </>
                    )}

                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground italic">
                        💡 {scenario.recommendation}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-2 border-gray-200 dark:border-gray-700">
                <CardContent className="p-8 text-center">
                  <Calculator className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Select a scenario and click Calculate to see the results
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
