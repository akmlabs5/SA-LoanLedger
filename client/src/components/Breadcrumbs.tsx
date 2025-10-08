import { ChevronRight, Home } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-4">
      <Link href="/">
        <Button variant="ghost" size="sm" className="h-8 px-2">
          <Home className="h-3 w-3" />
        </Button>
      </Link>

      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-1">
          <ChevronRight className="h-3 w-3" />
          {item.href ? (
            <Link href={item.href}>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground lg:hover:text-foreground">
                {item.label}
              </Button>
            </Link>
          ) : (
            <span className="text-foreground font-medium px-2">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}