import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  User,
  Settings,
  Bell,
  Users,
  HelpCircle,
  LogOut,
  ChevronRight,
  Shield,
  Sparkles,
} from "lucide-react";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface SettingsItem {
  id: string;
  label: string;
  icon: typeof User;
  path?: string;
  onClick?: () => void;
  badge?: string | number;
  variant?: "default" | "destructive";
}

interface SettingsSection {
  title?: string;
  items: SettingsItem[];
}

export default function MorePage() {
  const isMobile = useIsMobile();
  const [, setLocation] = useLocation();

  const { data: user } = useQuery<any>({
    queryKey: ["/api/user"],
  });

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const sections: SettingsSection[] = [
    {
      items: [
        {
          id: "profile",
          label: user?.isAdmin ? "Admin Profile" : "Profile",
          icon: User,
          path: "/settings",
        },
      ],
    },
    {
      title: "Organization",
      items: [
        {
          id: "team",
          label: "Team Settings",
          icon: Users,
          path: "/settings?tab=team",
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          id: "notifications",
          label: "Notifications",
          icon: Bell,
          path: "/settings?tab=notifications",
        },
        {
          id: "ai-config",
          label: "AI Configuration",
          icon: Sparkles,
          path: "/settings?tab=ai",
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          id: "help",
          label: "Help & Support",
          icon: HelpCircle,
          path: "/help",
        },
      ],
    },
    {
      items: [
        {
          id: "logout",
          label: "Logout",
          icon: LogOut,
          onClick: handleLogout,
          variant: "destructive",
        },
      ],
    },
  ];

  if (user?.isAdmin) {
    sections.splice(1, 0, {
      title: "Admin",
      items: [
        {
          id: "admin-portal",
          label: "Admin Portal",
          icon: Shield,
          path: "/admin",
        },
      ],
    });
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background">
      {isMobile && <MobileHeader title="More" />}

      <div className="max-w-2xl mx-auto">
        {/* Profile Section */}
        <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.profileImage} />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {user?.username ? getInitials(user.username) : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold truncate">
                {user?.username || "User"}
              </h2>
              {user?.email && (
                <p className="text-sm text-muted-foreground truncate">
                  {user.email}
                </p>
              )}
              {user?.organizationName && (
                <p className="text-sm text-muted-foreground truncate mt-1">
                  {user.organizationName}
                  {user?.isOwner && " (Owner)"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="py-2">
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {section.title && (
                <h3 className="px-6 py-3 text-sm font-semibold text-muted-foreground">
                  {section.title}
                </h3>
              )}
              <div className="bg-card">
                {section.items.map((item, itemIndex) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.onClick) {
                          item.onClick();
                        } else if (item.path) {
                          setLocation(item.path);
                        }
                      }}
                      className={cn(
                        "w-full flex items-center gap-4 px-6 py-4",
                        "active:bg-accent/50 transition-colors",
                        itemIndex !== section.items.length - 1 &&
                          "border-b border-border",
                        item.variant === "destructive" && "text-destructive"
                      )}
                      data-testid={`settings-item-${item.id}`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="flex-1 text-left font-medium">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
                          {item.badge}
                        </span>
                      )}
                      {item.path && (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                  );
                })}
              </div>
              {sectionIndex !== sections.length - 1 && (
                <Separator className="my-2" />
              )}
            </div>
          ))}
        </div>

        {/* App Version */}
        <div className="text-center py-6 text-sm text-muted-foreground">
          <p>Morouna Loans</p>
          <p className="text-xs mt-1">by AKM Labs</p>
        </div>
      </div>
    </div>
  );
}
