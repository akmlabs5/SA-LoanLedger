import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Calendar, Download, FileText, FileSpreadsheet, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function Reports() {
  const { isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportType, setReportType] = useState("facility-summary");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Set default dates (last 3 months)
  React.useEffect(() => {
    const today = new Date();
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(today.getMonth() - 3);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(threeMonthsAgo.toISOString().split('T')[0]);
  }, []);

  const handleDownloadReport = async (format: 'pdf' | 'excel') => {
    setIsGenerating(true);
    
    try {
      let endpoint = '/api/reports/facility-summary';
      if (reportType === 'bank-exposures') {
        endpoint = '/api/reports/bank-exposures';
      }
      
      const params = new URLSearchParams({
        format,
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });
      
      const response = await fetch(`${endpoint}?${params}`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate report');
      }
      
      // Get filename from response headers or create default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `report-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) {
          filename = match[1];
        }
      }
      
      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Report Generated",
        description: `Your ${format.toUpperCase()} report has been downloaded successfully.`
      });
      
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate professional facility reports and export portfolio data
          </p>
        </div>
        <Badge variant="secondary" className="bg-saudi/10 text-saudi">
          <TrendingUp className="w-4 h-4 mr-1" />
          Professional Export
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Report Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Report Configuration
            </CardTitle>
            <CardDescription>
              Configure your report parameters and date range
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="report-type">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger data-testid="select-report-type">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facility-summary">Facility Summary Report</SelectItem>
                  <SelectItem value="bank-exposures">Bank Exposure Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  data-testid="input-start-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  data-testid="input-end-date"
                />
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Export Format</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => handleDownloadReport('pdf')}
                  disabled={isGenerating}
                  className="h-12 flex-col gap-1"
                  variant="outline"
                  data-testid="button-download-pdf"
                >
                  <FileText className="w-4 h-4" />
                  <span className="text-xs">PDF Report</span>
                </Button>
                
                <Button
                  onClick={() => handleDownloadReport('excel')}
                  disabled={isGenerating}
                  className="h-12 flex-col gap-1"
                  variant="outline"
                  data-testid="button-download-excel"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span className="text-xs">Excel Export</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Report Preview</CardTitle>
            <CardDescription>
              Preview of the selected report format
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportType === 'facility-summary' ? (
                <div className="space-y-3">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2">KAM Office Facility Report</h4>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>• Total exposure summary by bank</p>
                      <p>• Bank-by-bank facility breakdowns</p>
                      <p>• Credit limits and utilization rates</p>
                      <p>• Professional Saudi banking format</p>
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium mb-1">Includes:</p>
                    <ul className="space-y-0.5 ml-3">
                      <li>• ANB, SAB, RAJ exposure details</li>
                      <li>• Period-over-period changes</li>
                      <li>• Coverage ratios and risk metrics</li>
                      <li>• Facility-specific terms and conditions</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2">Bank Exposure Analysis</h4>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>• Historical exposure trends</p>
                      <p>• Bank concentration analysis</p>
                      <p>• Utilization rate tracking</p>
                      <p>• Risk concentration alerts</p>
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium mb-1">Analytics:</p>
                    <ul className="space-y-0.5 ml-3">
                      <li>• Time-series exposure data</li>
                      <li>• Bank diversification metrics</li>
                      <li>• Credit limit efficiency</li>
                      <li>• Portfolio concentration risk</li>
                    </ul>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>
                    Report Period: {startDate || 'Not set'} to {endDate || 'Not set'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Export Actions</CardTitle>
          <CardDescription>
            Generate common reports with predefined settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button
              onClick={() => {
                setReportType('facility-summary');
                handleDownloadReport('pdf');
              }}
              disabled={isGenerating}
              variant="outline"
              className="h-16 flex-col gap-2"
              data-testid="button-quick-facility-pdf"
            >
              <FileText className="w-5 h-5" />
              <div className="text-center">
                <div className="font-medium text-xs">Current Facility Report</div>
                <div className="text-xs text-muted-foreground">PDF Format</div>
              </div>
            </Button>

            <Button
              onClick={() => {
                setReportType('facility-summary');
                handleDownloadReport('excel');
              }}
              disabled={isGenerating}
              variant="outline"
              className="h-16 flex-col gap-2"
              data-testid="button-quick-facility-excel"
            >
              <FileSpreadsheet className="w-5 h-5" />
              <div className="text-center">
                <div className="font-medium text-xs">Portfolio Analysis</div>
                <div className="text-xs text-muted-foreground">Excel Format</div>
              </div>
            </Button>

            <Button
              onClick={() => {
                setReportType('bank-exposures');
                handleDownloadReport('pdf');
              }}
              disabled={isGenerating}
              variant="outline"
              className="h-16 flex-col gap-2"
              data-testid="button-quick-exposure-pdf"
            >
              <TrendingUp className="w-5 h-5" />
              <div className="text-center">
                <div className="font-medium text-xs">Bank Exposure Trends</div>
                <div className="text-xs text-muted-foreground">Analysis Report</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {isGenerating && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="w-[300px]">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-saudi"></div>
                <div>
                  <p className="font-medium">Generating Report</p>
                  <p className="text-sm text-muted-foreground">Please wait...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}