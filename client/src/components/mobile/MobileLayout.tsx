import { useIsMobile } from "@/hooks/use-mobile";
import { BottomTabBar } from "./BottomTabBar";

interface MobileLayoutProps {
  children: React.ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen pb-16">
      <div className="flex-1 overflow-y-auto">{children}</div>
      <BottomTabBar />
    </div>
  );
}
