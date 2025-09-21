import { useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Building, 
  ArrowLeft, 
  LogIn, 
  Shield, 
  TrendingUp, 
  Calendar,
  CreditCard,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  BarChart3,
  FileText,
  Settings,
  Phone,
  Mail,
  MapPin,
  Plus,
  Edit,
  Trash2,
  Star,
  User
} from "lucide-react";
import { Link } from "wouter";
import { PortfolioSummary } from "@shared/types";
import BankContactsSection from "@/components/BankContactsSection";

export default function BankDetail() {
  const { bankId } = useParams();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: banks, isLoading: banksLoading } = useQuery({
    queryKey: ["/api/banks"],
    enabled: isAuthenticated,
  });

  const { data: facilities, isLoading: facilitiesLoading } = useQuery({
    queryKey: ["/api/facilities"],
    enabled: isAuthenticated,
  });

  const { data: portfolioSummary, isLoading: portfolioLoading } = useQuery({
    queryKey: ["/api/dashboard/portfolio"],
    enabled: isAuthenticated,
  });

  const { data: loans, isLoading: loansLoading } = useQuery({
    queryKey: ["/api/loans"],
    enabled: isAuthenticated,
  });

  const { data: bankContacts, isLoading: contactsLoading } = useQuery({
    queryKey: ["/api/banks", bankId, "contacts"],
    enabled: isAuthenticated && !!bankId,
  });

  // Find the specific bank
  const bank = (banks as any[])?.find((b: any) => b.id === bankId);
  const bankFacilities = (facilities as any[])?.filter((f: any) => f.bankId === bankId) || [];
  const bankExposure = (portfolioSummary as PortfolioSummary)?.bankExposures?.find(exp => exp.bankId === bankId);
  const bankLoans = (loans as any[])?.filter((l: any) => l.facility?.bankId === bankId) || [];

  // Show loading state while data is being fetched
  if (banksLoading || facilitiesLoading || portfolioLoading || loansLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Loading Bank Details</h2>
          <p className="text-gray-600 dark:text-gray-400">Please wait while we fetch your bank information...</p>
        </div>
      </div>
    );
  }

  // Only show "not found" after data has loaded
  if (!banksLoading && !bank) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Bank Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The requested bank could not be found.</p>
          <Link href="/banks">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Banks
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return (amount / 1000000).toFixed(3).replace(/\.?0+$/, '') + "M SAR";
  };

  const getConnectionStatus = () => {
    // This would be connected to real bank integration status
    return Math.random() > 0.5 ? 'connected' : 'disconnected';
  };

  const connectionStatus = getConnectionStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/banks">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Banks
              </Button>
            </Link>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">
                  {bank.code.substring(0, 3)}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{bank.name}</h1>
                <p className="text-gray-600 dark:text-gray-300">Code: {bank.code}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge className={connectionStatus === 'connected' 
              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400"
              : "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-900/20 dark:text-gray-400"
            }>
              {connectionStatus === 'connected' ? (
                <>
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Connected
                </>
              ) : (
                <>
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Not Connected
                </>
              )}
            </Badge>
            {connectionStatus !== 'connected' && (
              <Button className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white">
                <LogIn className="mr-2 h-4 w-4" />
                Connect Bank
              </Button>
            )}
          </div>
        </div>

        {/* Bank Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Exposure</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {bankExposure ? formatCurrency(bankExposure.outstanding) : '0M SAR'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="text-white text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Credit Limit</p>
                  <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                    {bankExposure ? formatCurrency(bankExposure.creditLimit) : '0M SAR'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center">
                  <CreditCard className="text-white text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Utilization</p>
                  <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                    {bankExposure ? `${bankExposure.utilization.toFixed(1)}%` : '0%'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center">
                  <BarChart3 className="text-white text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Active Loans</p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {bankLoans.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center">
                  <FileText className="text-white text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bank Facilities */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <span>Credit Facilities</span>
                  </div>
                  <Button size="sm" data-testid="button-add-facility">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Facility
                  </Button>
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">Your active facilities with this bank</p>
              </CardHeader>
              <CardContent>
                {bankFacilities.length === 0 ? (
                  <div className="text-center py-12">
                    <CreditCard className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No facilities found with this bank</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bankFacilities.map((facility: any) => (
                      <div key={facility.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 capitalize">
                              {facility.facilityType.replace('_', ' ')} Facility
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Active since {new Date(facility.startDate).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className={facility.isActive 
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                          }>
                            {facility.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Credit Limit</p>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {formatCurrency(parseFloat(facility.creditLimit))}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Cost of Funding</p>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              SIBOR + {facility.costOfFunding}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Start Date</p>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {new Date(facility.startDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Expiry Date</p>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {new Date(facility.expiryDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        {facility.terms && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Terms & Conditions</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                              {facility.terms}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Loans */}
            <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Active Loans</span>
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">Current loan drawdowns from this bank</p>
              </CardHeader>
              <CardContent>
                {bankLoans.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No active loans with this bank</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bankLoans.slice(0, 5).map((loan: any) => {
                      const daysUntilDue = Math.ceil((new Date(loan.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                      const urgency = daysUntilDue <= 7 ? 'critical' : daysUntilDue <= 15 ? 'warning' : 'normal';
                      
                      return (
                        <div key={loan.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h5 className="font-semibold text-gray-900 dark:text-gray-100">
                                {loan.referenceNumber}
                              </h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Due: {new Date(loan.dueDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900 dark:text-gray-100">
                                {formatCurrency(parseFloat(loan.amount))}
                              </p>
                              <Badge className={
                                urgency === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                                urgency === 'warning' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400' :
                                'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400'
                              }>
                                {daysUntilDue > 0 ? `${daysUntilDue} days` : 'Overdue'}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Interest: SIBOR + {loan.bankRate}% | Status: {loan.status}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bank Information & Actions */}
          <div className="space-y-6">
            {/* Bank Contacts */}
            <BankContactsSection 
              bankId={bankId!} 
              bankName={bank.name} 
              isAuthenticated={isAuthenticated} 
            />
            <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center space-x-2">
                  <Building className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Bank Code</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{bank.code}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Full Name</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{bank.name}</p>
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">+966 11 123 4567</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">corporate@{bank.code.toLowerCase()}.com.sa</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Riyadh, Saudi Arabia</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  View All Loans
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  Transaction History
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Performance Analytics
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  Manage Connection
                </Button>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Relationship Duration</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">2.5 years</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Average Rate</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">SIBOR + 2.75%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Payment Record</span>
                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
                    Excellent
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Last Activity</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">2 days ago</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}