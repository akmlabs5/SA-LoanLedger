import { useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Building2, 
  Receipt, 
  Shield, 
  ShieldCheck,
  MessageCircle, 
  Settings, 
  University,
  User,
  Bell,
  Search,
  History,
  LogOut
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
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
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
        title: "Guarantees",
        url: "/guarantees",
        icon: ShieldCheck,
      },
      {
        title: "Collateral",
        url: "/collateral",
        icon: Shield,
      },
      {
        title: "History",
        url: "/history",
        icon: History,
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

// Feature flag to use Supabase Auth
const USE_SUPABASE_AUTH = import.meta.env.VITE_SUPABASE_URL && 
  import.meta.env.VITE_SUPABASE_ANON_KEY;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, authSystem } = useAuth();
  const { signOut: supabaseSignOut } = useSupabaseAuth();

  const handleSignOut = async () => {
    if (USE_SUPABASE_AUTH || authSystem === 'supabase') {
      await supabaseSignOut();
    } else {
      // Replit Auth sign out
      window.location.href = "/api/logout";
    }
  };

  return (
    <SidebarProvider>
      <Sidebar variant="inset" className="border-r border-border">
        <SidebarHeader className="border-b border-border">
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-saudi text-white">
              <University className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm font-semibold tracking-tight">Saudi Loan Manager</h1>
              <p className="text-xs text-muted-foreground font-normal">Portfolio Management</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-3">
          <div className="mb-6 mt-4">
            <div className="relative">
              <Search className="absolute left-3 h-4 w-4 text-muted-foreground top-1/2 -translate-y-1/2" />
              <Input 
                placeholder="Search..." 
                className="pl-10 h-10 bg-background/50 border-border text-sm font-normal rounded-lg"
                data-testid="input-search"
              />
            </div>
          </div>

          {navigation.map((group) => (
            <SidebarGroup key={group.title} className="mb-6">
              <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">
                {group.title}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={location === item.url}
                        data-testid={`nav-${item.title.toLowerCase().replace(' ', '-')}`}
                        className="h-10 px-3 font-medium text-sm hover:bg-accent/50 data-[state=open]:bg-accent/50 rounded-lg transition-all duration-200"
                      >
                        <a href={item.url} className="flex items-center gap-3">
                          <item.icon className="h-4 w-4" />
                          <span className="font-medium tracking-tight">{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}

          <SidebarGroup className="mt-auto mb-6">
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">
              System
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    data-testid="nav-settings"
                    className="h-10 px-3 font-medium text-sm hover:bg-accent/50 rounded-lg transition-all duration-200"
                  >
                    <a href="/settings" className="flex items-center gap-3">
                      <Settings className="h-4 w-4" />
                      <span className="font-medium tracking-tight">Settings</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-border">
          <div className="flex items-center gap-3 p-4 rounded-xl hover:bg-accent/50 hover:text-accent-foreground cursor-pointer transition-all duration-200">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-saudi text-white text-sm font-semibold">
                {(user as any)?.firstName?.charAt(0) || (user as any)?.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <p className="text-sm font-semibold truncate tracking-tight">
                {(user as any)?.firstName} {(user as any)?.lastName}
              </p>
              <p className="text-xs text-muted-foreground truncate font-normal">
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
              <DropdownMenuItem 
                onClick={handleSignOut}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
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