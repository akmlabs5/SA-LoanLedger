import { useLocation, Link } from "wouter";
import { useState, useEffect, useRef, useCallback } from "react";
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
  History,
  LogOut,
  FileText,
  Menu,
  X,
  Home,
  Boxes,
  Lightbulb,
  HelpCircle,
  TrendingUp
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { User as UserType } from "@shared/schema";
import { cn } from "@/lib/utils";
import { FloatingAgentChat } from "./FloatingAgentChat";
import { useQuery } from "@tanstack/react-query";
// import { HelpDeskChat } from "./HelpDeskChat"; // Removed - will be added to landing page later

interface AppLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  {
    title: "Main",
    items: [
      {
        title: "Dashboard",
        url: "/",
        icon: LayoutDashboard,
      },
      {
        title: "AI Assistant",
        url: "/ai-chat",
        icon: MessageCircle,
      },
    ],
  },
  {
    title: "Portfolio",
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
    ],
  },
  {
    title: "Reports & History",
    items: [
      {
        title: "Reports",
        url: "/reports",
        icon: FileText,
      },
      {
        title: "History",
        url: "/history",
        icon: History,
      },
      {
        title: "Trends",
        url: "/analytics",
        icon: TrendingUp,
      },
    ],
  },
  {
    title: "Settings & Support",
    items: [
      {
        title: "User Settings",
        url: "/user-settings",
        icon: Settings,
      },
      {
        title: "Features & Tips",
        url: "/features-tips",
        icon: Boxes,
      },
      {
        title: "Help Desk",
        url: "/help-desk",
        icon: HelpCircle,
      },
    ],
  },
];

// Feature flag to use Supabase Auth - DISABLED for development  
const USE_SUPABASE_AUTH = false; // Change to true when ready for production

// Core navigation items for mobile bottom nav
const coreNavItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Loans", url: "/loans", icon: Receipt },
  { title: "Banks", url: "/banks", icon: Building2 },
  { title: "Reports", url: "/reports", icon: FileText },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, authSystem, clearAuthCache } = useAuth();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  // Only use Supabase auth if enabled
  const supabaseAuth = USE_SUPABASE_AUTH ? useSupabaseAuth() : null;
  
  // Fetch user preferences for theme
  const { data: preferences } = useQuery({
    queryKey: ['/api/user/preferences'],
    enabled: !!user,
  });
  
  // Apply theme based on user preferences
  useEffect(() => {
    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    
    // Get theme with fallback to 'light' if null/undefined
    const theme = preferences?.theme || 'light';
    
    if (theme === 'dark') {
      applyTheme(true);
    } else if (theme === 'light') {
      applyTheme(false);
    } else if (theme === 'system') {
      // Check OS preference
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);
      
      // Listen for OS theme changes
      const listener = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener('change', listener);
      
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [preferences?.theme]);
  
  // Close mobile menu when location changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);
  
  // Handle mobile menu toggle
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  // Handle scroll locking when mobile menu is open
  useEffect(() => {
    if (!isMobile) {
      // Ensure classes are removed on desktop
      document.body.classList.remove('overflow-hidden', 'touch-none');
      return;
    }
    
    if (mobileMenuOpen) {
      // Lock scroll when drawer is open
      document.body.classList.add('overflow-hidden');
      // Note: removed touch-none to allow tab interactions
    } else {
      // Restore scroll when drawer is closed
      document.body.classList.remove('overflow-hidden', 'touch-none');
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('overflow-hidden', 'touch-none');
    };
  }, [isMobile, mobileMenuOpen]);

  const handleSignOut = async () => {
    if (USE_SUPABASE_AUTH && supabaseAuth?.signOut) {
      await supabaseAuth.signOut();
    } else {
      // Clear authentication cache before logout
      clearAuthCache();
      
      // Call logout endpoint to clear server session
      try {
        await fetch("/api/logout", { 
          method: "GET",
          credentials: "include"
        });
      } catch (error) {
        console.error("Logout error:", error);
      }
      
      // Redirect to unified login page
      setLocation("/unified-login");
    }
  };

  // Mobile Bottom Navigation Component
  const MobileBottomNav = () => (
    <div className={cn(
      "lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border shadow-lg pb-[env(safe-area-inset-bottom,0px)] transition-all duration-200",
      mobileMenuOpen && "opacity-70"
    )}>
      <div className="grid grid-cols-4 gap-0">
        {coreNavItems.map((item) => {
          const isActive = location === item.url;
          return (
            <Link
              key={item.url}
              href={item.url}
              data-testid={`mobile-nav-${item.title.toLowerCase()}`}
              onClick={() => {
                // Close mobile drawer when navigating via bottom nav
                if (mobileMenuOpen) {
                  setMobileMenuOpen(false);
                }
              }}
              className={cn(
                "flex flex-col items-center justify-center p-3 min-h-[64px] transition-all duration-200 active:scale-95",
                "lg:hover:bg-accent/50 active:bg-accent",
                isActive
                  ? "text-saudi bg-saudi/5 border-t-2 border-saudi"
                  : "text-muted-foreground lg:hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5 mb-1", isActive && "text-saudi")} />
              <span className={cn(
                "text-xs font-medium truncate max-w-full",
                isActive && "text-saudi"
              )}>
                {item.title}
              </span>
              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-saudi" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="relative">
      <SidebarProvider>
        {/* Conditionally render sidebar on mobile, always render on desktop */}
        {(!isMobile || mobileMenuOpen) && (
          <Sidebar 
            ref={sidebarRef}
            variant="inset" 
            className={cn(
              "border-r border-border transition-all duration-300",
              isMobile && "fixed inset-y-0 left-0 z-[60] w-80 bg-background shadow-2xl block animate-in slide-in-from-left duration-300"
            )}
            role={isMobile && mobileMenuOpen ? "dialog" : undefined}
            aria-modal={isMobile && mobileMenuOpen ? "true" : undefined}
          >
          <SidebarHeader className="border-b border-border">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                    Saudi Loan Portfolio Management
                  </h1>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    By AKM-Labs
                  </p>
                </div>
              </div>
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                  className="h-8 w-8 lg:hidden"
                  data-testid="button-close-mobile-menu"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="px-3 pt-2">
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
                          className={cn(
                            "font-medium text-sm lg:hover:bg-accent/50 data-[state=open]:bg-accent/50 rounded-lg transition-all duration-200 active:scale-[0.98]",
                            isMobile ? "h-12 px-4 text-base" : "h-10 px-3",
                            (item as any).comingSoon && "cursor-not-allowed opacity-60"
                          )}
                        >
                          <Link 
                            href={(item as any).comingSoon ? "#" : item.url} 
                            className="flex items-center gap-3 w-full"
                            onClick={(e) => {
                              if ((item as any).comingSoon) {
                                e.preventDefault();
                              }
                            }}
                          >
                            <item.icon className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
                            <span className="font-medium tracking-tight flex-1">{item.title}</span>
                            {(item as any).comingSoon && (
                              <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                            )}
                          </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
          </SidebarContent>

          <SidebarFooter className="border-t border-border">
            <div className={cn(
              "flex items-center gap-3 p-4 rounded-xl lg:hover:bg-accent/50 lg:hover:text-accent-foreground cursor-pointer transition-all duration-200",
              isMobile && "p-3"
            )}>
              <Avatar className={cn(isMobile ? "h-10 w-10" : "h-9 w-9")}>
                <AvatarFallback className="bg-saudi text-white text-sm font-semibold">
                  {(user as any)?.firstName?.charAt(0) || (user as any)?.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <p className={cn(
                  "font-semibold truncate tracking-tight",
                  isMobile ? "text-base" : "text-sm"
                )}>
                  {(user as any)?.firstName} {(user as any)?.lastName}
                </p>
                <p className={cn(
                  "text-muted-foreground truncate font-normal",
                  isMobile ? "text-sm" : "text-xs"
                )}>
                  {(user as any)?.email}
                </p>
              </div>
            </div>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>
        )}

        <SidebarInset className={cn(isMobile && "w-full")}>
          {/* Mobile Header with Menu Toggle */}
          <header className={cn(
            "flex shrink-0 items-center gap-2 border-b px-4 bg-sidebar",
            isMobile ? "h-14" : "h-16"
          )}>
            {/* Mobile Menu Toggle */}
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  toggleMobileMenu();
                  // Haptic feedback simulation
                  if ('vibrate' in navigator) {
                    navigator.vibrate(10);
                  }
                }}
                className="h-9 w-9 lg:hidden mr-2 active:scale-95 transition-transform duration-100"
                data-testid="button-mobile-menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            
            {/* Desktop Sidebar Trigger */}
            {!isMobile && <SidebarTrigger className="-ml-1" />}
            {!isMobile && <div className="h-4 w-px bg-border mx-2" />}
            
            <div className="flex items-center justify-between flex-1">
              <div className="flex items-center gap-2">
                {isMobile && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-saudi text-white mr-2">
                    <University className="h-3 w-3" />
                  </div>
                )}
                <div className="flex flex-col">
                  <h2 className={cn(
                    "font-semibold truncate",
                    isMobile ? "text-base" : "text-lg"
                  )}>
                    {navigation.flatMap(g => g.items).find(item => item.url === location)?.title || 'Dashboard'}
                  </h2>
                  {isMobile && location !== '/' && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Link href="/" className="lg:hover:text-foreground transition-colors">
                        Dashboard
                      </Link>
                      <span className="mx-1">›</span>
                      <span className="text-foreground">
                        {navigation.flatMap(g => g.items).find(item => item.url === location)?.title}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size={isMobile ? "sm" : "icon"} 
                  data-testid="button-notifications"
                  className={cn(
                    "active:scale-95 transition-transform duration-100 text-foreground lg:hover:text-foreground lg:hover:bg-accent",
                    isMobile && "h-9 w-9"
                  )}
                >
                  <Bell className={cn(isMobile ? "h-4 w-4" : "h-4 w-4")} />
                  {isMobile && <span className="sr-only">Notifications</span>}
                </Button>
                {!isMobile && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleSignOut}
                    className="text-red-600 lg:hover:text-red-600 lg:hover:bg-red-50"
                    data-testid="button-signout"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                )}
                {isMobile && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleSignOut}
                    className="text-red-600 lg:hover:text-red-600 lg:hover:bg-red-50 h-9 px-2 active:scale-95 transition-all duration-100"
                    data-testid="button-signout-mobile"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="sr-only">Sign Out</span>
                  </Button>
                )}
              </div>
            </div>
          </header>

          <main className={cn(
            "flex-1 overflow-auto",
            isMobile && "pb-[calc(64px+env(safe-area-inset-bottom,0px))]" // Add bottom padding for mobile nav + iOS safe areas
          )}>
            {children}
          </main>
        </SidebarInset>
        
        {/* Mobile Menu Overlay */}
        {isMobile && mobileMenuOpen && (
          <div 
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
            onClick={() => {
              setMobileMenuOpen(false);
              // Haptic feedback
              if ('vibrate' in navigator) {
                navigator.vibrate(5);
              }
            }}
            data-testid="mobile-menu-overlay"
          />
        )}
      </SidebarProvider>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
      
      {/* Floating AI Agent Chat - Desktop only */}
      {!isMobile && <FloatingAgentChat />}
    </div>
  );
}