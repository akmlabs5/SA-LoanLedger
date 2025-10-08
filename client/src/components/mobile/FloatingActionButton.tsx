import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps {
  onClick: () => void;
  icon?: React.ReactNode;
  label?: string;
  className?: string;
}

export function FloatingActionButton({
  onClick,
  icon,
  label = "Add",
  className,
}: FloatingActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      size="lg"
      className={cn(
        "fixed bottom-20 right-4 z-40",
        "h-14 w-14 rounded-full shadow-lg",
        "lg:hidden",
        "active:scale-95 transition-transform",
        className
      )}
      data-testid="fab-button"
      aria-label={label}
    >
      {icon || <Plus className="h-6 w-6" />}
    </Button>
  );
}
