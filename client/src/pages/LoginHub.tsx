import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Shield, Users, TrendingUp } from "lucide-react";

export default function LoginHub() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg">
              <Building2 className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Morouna Loans
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Comprehensive loan portfolio management platform designed for the Saudi Arabian market with SIBOR-based calculations and intelligent risk management.
          </p>
        </div>

        {/* Login Options */}
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Regular User Login */}
          <Card 
            className="bg-white/10 backdrop-blur-xl border-white/20 lg:hover:bg-white/15 transition-all duration-300 group cursor-pointer"
            onClick={() => setLocation('/auth/login')}
            data-testid="card-user-login"
          >
            <CardHeader className="text-center pb-6">
              <div className="mx-auto mb-4 p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full w-16 h-16 flex items-center justify-center lg:group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-white mb-2">Regular User</CardTitle>
              <CardDescription className="text-gray-300 text-lg">
                Access your loan portfolio and manage your banking relationships
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-gray-300">
                  <TrendingUp className="w-4 h-4 mr-3 text-purple-400" />
                  <span>Portfolio Dashboard & Analytics</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <Building2 className="w-4 h-4 mr-3 text-blue-400" />
                  <span>Bank Facilities Management</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <Shield className="w-4 h-4 mr-3 text-green-400" />
                  <span>SIBOR-based Calculations</span>
                </div>
              </div>
              <Button 
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 lg:hover:from-purple-700 lg:hover:to-blue-700 text-white font-semibold py-3 text-lg transition-all duration-300 lg:group-hover:shadow-lg lg:group-hover:shadow-purple-500/25"
                size="lg"
                data-testid="button-continue-replit"
              >
                Continue with Replit
              </Button>
            </CardContent>
          </Card>

          {/* Admin Login */}
          <Card 
            className="bg-white/10 backdrop-blur-xl border-white/20 lg:hover:bg-white/15 transition-all duration-300 group cursor-pointer"
            onClick={() => setLocation('/admin-portal/login')}
            data-testid="card-admin-login"
          >
            <CardHeader className="text-center pb-6">
              <div className="mx-auto mb-4 p-4 bg-gradient-to-r from-red-600 to-orange-600 rounded-full w-16 h-16 flex items-center justify-center lg:group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-white mb-2">Administrator</CardTitle>
              <CardDescription className="text-gray-300 text-lg">
                System administration and user management portal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-gray-300">
                  <Users className="w-4 h-4 mr-3 text-red-400" />
                  <span>User Management & Oversight</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <TrendingUp className="w-4 h-4 mr-3 text-orange-400" />
                  <span>System Analytics & Reports</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <Shield className="w-4 h-4 mr-3 text-yellow-400" />
                  <span>Security & Maintenance</span>
                </div>
              </div>
              <Button 
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 lg:hover:from-red-700 lg:hover:to-orange-700 text-white font-semibold py-3 text-lg transition-all duration-300 lg:group-hover:shadow-lg lg:group-hover:shadow-red-500/25"
                size="lg"
                data-testid="button-admin-portal"
              >
                Admin Portal
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-gray-400 text-sm">
            Designed for Saudi Arabian banking regulations and SIBOR integration
          </p>
        </div>
      </div>
    </div>
  );
}