import { useState } from "react";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Guarantee, Facility, Bank } from "@shared/schema";
import { 
  Plus, 
  Search, 
  Filter, 
  Shield, 
  Calendar, 
  Building, 
  TrendingUp,
  Users,
  FileText,
  Eye,
  CheckCircle,
  AlertTriangle,
  Clock,
  XCircle
} from "lucide-react";
import { Link } from "wouter";

type GuaranteeWithFacility = Guarantee & { 
  facility: Facility & { bank: Bank } 
};

export default function GuaranteesPage() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: guarantees, isLoading } = useQuery<GuaranteeWithFacility[]>({
    queryKey: ["/api/guarantees"],
  });

  const filteredGuarantees = guarantees?.filter(guarantee => {
    const matchesSearch = 
      guarantee.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guarantee.beneficiaryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guarantee.facility.bank.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || guarantee.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "active": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "expired": return <XCircle className="h-4 w-4 text-red-600" />;
      case "renewed": return <Clock className="h-4 w-4 text-blue-600" />;
      case "called": return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default: return <CheckCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "expired": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "renewed": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "called": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const formatCurrency = (amount: number | string | null) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(numAmount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isExpiringSoon = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const stats = {
    total: guarantees?.length || 0,
    active: guarantees?.filter(g => g.status === "active").length || 0,
    expiringSoon: guarantees?.filter(g => g.expiryDate && isExpiringSoon(g.expiryDate)).length || 0,
    totalAmount: guarantees?.reduce((sum, g) => sum + (g.guaranteeAmount || 0), 0) || 0,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bank Guarantees</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your bank guarantee portfolio</p>
          </div>
          <Link href="/guarantees/create">
            <Button className="bg-green-600 lg:hover:bg-green-700 text-white" data-testid="button-create-guarantee">
              <Plus className="h-4 w-4 mr-2" />
              Issue New Guarantee
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Guarantees</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white" data-testid="stat-total-guarantees">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white" data-testid="stat-active-guarantees">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Expiring Soon</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white" data-testid="stat-expiring-guarantees">{stats.expiringSoon}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white" data-testid="stat-total-amount">{formatCurrency(stats.totalAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by reference, beneficiary, or bank..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-guarantees"
                  />
                </div>
              </div>
              <div className="w-full sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger data-testid="select-status-filter">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="renewed">Renewed</SelectItem>
                    <SelectItem value="called">Called</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Guarantees List */}
        {filteredGuarantees.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {guarantees?.length === 0 ? "No guarantees yet" : "No guarantees found"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {guarantees?.length === 0 
                  ? "Get started by issuing your first bank guarantee" 
                  : "Try adjusting your search or filter criteria"
                }
              </p>
              {guarantees?.length === 0 && (
                <Link href="/guarantees/create">
                  <Button className="bg-green-600 lg:hover:bg-green-700 text-white" data-testid="button-create-first-guarantee">
                    <Plus className="h-4 w-4 mr-2" />
                    Issue First Guarantee
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredGuarantees.map((guarantee) => (
              <Card key={guarantee.id} className="lg:hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white" data-testid={`text-reference-${guarantee.id}`}>
                          {guarantee.referenceNumber}
                        </h3>
                        <Badge className={getStatusColor(guarantee.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(guarantee.status)}
                            {guarantee.status.charAt(0).toUpperCase() + guarantee.status.slice(1)}
                          </div>
                        </Badge>
                        {guarantee.expiryDate && isExpiringSoon(guarantee.expiryDate) && (
                          <Badge variant="outline" className="text-orange-600 border-orange-300">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Expiring Soon
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">Beneficiary:</span>
                          <span className="font-medium" data-testid={`text-beneficiary-${guarantee.id}`}>{guarantee.beneficiaryName}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">Bank:</span>
                          <span className="font-medium" data-testid={`text-bank-${guarantee.id}`}>{guarantee.facility.bank.name}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                          <span className="font-medium" data-testid={`text-amount-${guarantee.id}`}>{formatCurrency(guarantee.guaranteeAmount)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">Expires:</span>
                          <span className="font-medium" data-testid={`text-expiry-${guarantee.id}`}>{formatDate(guarantee.expiryDate)}</span>
                        </div>
                      </div>

                      {guarantee.purpose && (
                        <div className="flex items-start gap-2 mt-2">
                          <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
                          <span className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2" data-testid={`text-purpose-${guarantee.id}`}>
                            {guarantee.purpose}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Link href={`/guarantees/${guarantee.id}`}>
                        <Button variant="outline" size="sm" data-testid={`button-view-${guarantee.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}