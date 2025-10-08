import { Home, FileText, Building2, Sparkles, MoreHorizontal } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface TabItem {
  id: string;
  label: string;
  icon: typeof Home;
  path: string;
}

const tabs: TabItem[] = [
  { id: "dashboard", label: "Dashboard", icon: Home, path: "/" },
  { id: "loans", label: "Loans", icon: FileText, path: "/loans" },
  { id: "banks", label: "Banks", icon: Building2, path: "/banks" },
  { id: "ai", label: "AI", icon: Sparkles, path: "/ai-chat" },
  { id: "more", label: "More", icon: MoreHorizontal, path: "/more" },
];

export function BottomTabBar() {
  const [location, setLocation] = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border lg:hidden pb-[env(safe-area-inset-bottom,0px)]"
      data-testid="bottom-tab-bar"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0px)' }}
    >
      <div className="flex items-center justify-around h-16 max-w-screen-xl mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.path);

          return (
            <button
              key={tab.id}
              onClick={() => setLocation(tab.path)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full",
                "active:bg-accent/50 transition-colors duration-150",
                "min-w-0 px-1"
              )}
              data-testid={`tab-${tab.id}`}
              aria-label={tab.label}
            >
              <Icon
                className={cn(
                  "h-5 w-5 mb-1 transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "text-xs font-medium transition-colors truncate",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
