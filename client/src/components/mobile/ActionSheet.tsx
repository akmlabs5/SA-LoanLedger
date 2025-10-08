import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface ActionItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "destructive";
  disabled?: boolean;
}

interface ActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  actions: ActionItem[];
}

export function ActionSheet({ open, onOpenChange, title, actions }: ActionSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl p-0 max-h-[80vh]"
        data-testid="action-sheet"
      >
        {title && (
          <SheetHeader className="px-4 pt-4 pb-2">
            <SheetTitle className="text-center">{title}</SheetTitle>
          </SheetHeader>
        )}
        <div className="py-2">
          {actions.map((action, index) => (
            <button
              key={action.id}
              onClick={() => {
                action.onClick();
                onOpenChange(false);
              }}
              disabled={action.disabled}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-4",
                "text-left font-medium transition-colors",
                "active:bg-accent/50 disabled:opacity-50 disabled:cursor-not-allowed",
                action.variant === "destructive"
                  ? "text-destructive"
                  : "text-foreground",
                index !== actions.length - 1 && "border-b border-border"
              )}
              data-testid={`action-${action.id}`}
            >
              {action.icon && <span className="text-xl">{action.icon}</span>}
              <span className="flex-1">{action.label}</span>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
