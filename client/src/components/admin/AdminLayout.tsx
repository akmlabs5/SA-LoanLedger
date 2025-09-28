import { useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  Database, 
  Settings, 
  Shield,
  Activity,
  AlertTriangle,
  LogOut,
  Search,
  Bell,
  BarChart3
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const adminNavigation = [
  {
    title: "Dashboard",
    items: [
      {
        title: "Overview",
        url: "/admin-portal/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Analytics",
        url: "/admin-portal/analytics",
        icon: BarChart3,
      },
    ],
  },
  {
    title: "User Management",
    items: [
      {
        title: "All Users",
        url: "/admin-portal/users",
        icon: Users,
      },
      {
        title: "User Activities",
        url: "/admin-portal/user-activities",
        icon: Activity,
      },
    ],
  },
  {
    title: "System Control",
    items: [
      {
        title: "Database",
        url: "/admin-portal/database",
        icon: Database,
      },
      {
        title: "Security",
        url: "/admin-portal/security",
        icon: Shield,
      },
      {
        title: "System Settings",
        url: "/admin-portal/settings",
        icon: Settings,
      },
      {
        title: "Alerts",
        url: "/admin-portal/alerts",
        icon: AlertTriangle,
      },
    ],
  },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();

  const handleSignOut = () => {
    // Clear admin session
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    
    // Redirect to admin login
    window.location.href = "/";
  };

  // Get admin user from localStorage
  const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{"name":"Admin","role":"System Administrator"}');

  return (
    <SidebarProvider>
      <Sidebar variant="inset" className="border-r border-border bg-gradient-to-b from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
        <SidebarHeader className="border-b border-border bg-gradient-to-r from-red-600 to-orange-600 text-white">
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm border border-white/30">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm font-semibold tracking-tight">Admin Portal</h1>
              <p className="text-xs text-white/80 font-normal">System Control Center</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-3 bg-white/50 dark:bg-black/20">
          <div className="mb-6 mt-4">
            <div className="relative">
              <Search className="absolute left-3 h-4 w-4 text-muted-foreground top-1/2 -translate-y-1/2" />
              <Input 
                placeholder="Search admin..." 
                className="pl-10 h-10 bg-background/50 border-border text-sm font-normal rounded-lg"
                data-testid="input-admin-search"
              />
            </div>
          </div>

          {adminNavigation.map((group) => (
            <SidebarGroup key={group.title} className="mb-6">
              <SidebarGroupLabel className="text-xs font-medium text-red-700 dark:text-red-300 uppercase tracking-wider mb-3 px-1">
                {group.title}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={location === item.url}
                        data-testid={`nav-admin-${item.title.toLowerCase().replace(' ', '-')}`}
                        className="h-10 px-3 font-medium text-sm hover:bg-red-100 dark:hover:bg-red-900/20 data-[state=open]:bg-red-100 dark:data-[state=open]:bg-red-900/20 rounded-lg transition-all duration-200"
                      >
                        <Link href={item.url} className="flex items-center gap-3 w-full">
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter className="border-t border-border bg-white/50 dark:bg-black/20 p-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-8 w-8 border border-red-200 dark:border-red-800">
              <AvatarImage src="/admin-avatar.png" />
              <AvatarFallback className="bg-red-600 text-white text-xs font-medium">
                {adminUser.name?.split(' ').map((n: string) => n[0]).join('') || 'AD'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {adminUser.name || 'Admin User'}
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 truncate">
                {adminUser.role || 'System Administrator'}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {/* notification center */}} 
              className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/20"
              data-testid="button-admin-notifications"
            >
              <Bell className="h-4 w-4 text-red-600 dark:text-red-400" />
            </Button>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSignOut}
            className="w-full justify-start gap-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
            data-testid="button-admin-signout"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <div className="text-sm text-red-700 dark:text-red-300 font-medium">
              Admin Mode
            </div>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-6 bg-gradient-to-br from-gray-50 to-red-50/30 dark:from-gray-950 dark:to-red-950/10">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}