import { useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Building2, 
  Receipt, 
  Shield, 
  MessageCircle, 
  Settings, 
  University,
  User,
  Bell,
  Search
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
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User as UserType } from "@shared/schema";

interface AppLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Portfolio Management",
    items: [
      {
        title: "Bank Exposures",
        url: "/banks",
        icon: Building2,
      },
      {
        title: "Loans",
        url: "/loans", 
        icon: Receipt,
      },
      {
        title: "Collateral",
        url: "/collateral",
        icon: Shield,
      },
    ],
  },
  {
    title: "Intelligence",
    items: [
      {
        title: "AI Assistant",
        url: "/ai-chat",
        icon: MessageCircle,
      },
    ],
  },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  return (
    <SidebarProvider>
      <Sidebar variant="inset" className="border-r border-border">
        <SidebarHeader className="border-b border-border">
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-saudi text-white">
              <University className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm font-semibold">Saudi Loan Manager</h1>
              <p className="text-xs text-muted-foreground">Portfolio Management</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2">
          <div className="mb-4 mt-2">
            <div className="relative">
              <Search className="absolute left-2 h-4 w-4 text-muted-foreground top-1/2 -translate-y-1/2" />
              <Input 
                placeholder="Search..." 
                className="pl-8 h-9 bg-background/50 border-border"
                data-testid="input-search"
              />
            </div>
          </div>

          {navigation.map((group) => (
            <SidebarGroup key={group.title}>
              <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={location === item.url}
                        data-testid={`nav-${item.title.toLowerCase().replace(' ', '-')}`}
                      >
                        <a href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}

          <SidebarGroup className="mt-auto">
            <SidebarGroupLabel>System</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild data-testid="nav-settings">
                    <a href="/settings">
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-border">
          <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent hover:text-accent-foreground cursor-pointer">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-saudi text-white text-xs">
                {(user as any)?.firstName?.charAt(0) || (user as any)?.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <p className="text-sm font-medium truncate">
                {(user as any)?.firstName} {(user as any)?.lastName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {(user as any)?.email}
              </p>
            </div>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="h-4 w-px bg-border mx-2" />
          <div className="flex items-center justify-between flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">
                {navigation.flatMap(g => g.items).find(item => item.url === location)?.title || 'Dashboard'}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" data-testid="button-notifications">
                <Bell className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.location.href = "/api/logout"}
                data-testid="button-logout"
              >
                <User className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}