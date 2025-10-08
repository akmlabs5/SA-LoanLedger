import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MobileHeaderProps {
  title: string;
  backButton?: boolean;
  rightAction?: React.ReactNode;
  className?: string;
}

export function MobileHeader({
  title,
  backButton = false,
  rightAction,
  className,
}: MobileHeaderProps) {
  const [, setLocation] = useLocation();

  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-background border-b border-border",
        "h-14 flex items-center px-4 gap-3",
        className
      )}
      data-testid="mobile-header"
    >
      {backButton && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.history.back()}
          className="h-9 w-9 active:bg-accent/50"
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}
      <h1 className="text-lg font-semibold flex-1 truncate">{title}</h1>
      {rightAction}
    </header>
  );
}
