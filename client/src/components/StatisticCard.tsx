import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatisticCardProps {
  title: string;
  value: string;
  suffix: string;
  metaInfo: string | React.ReactNode;
  icon: LucideIcon;
  testId?: string;
  onClick?: () => void;
}

export default function StatisticCard({ 
  title, 
  value, 
  suffix, 
  metaInfo, 
  icon: Icon, 
  testId,
  onClick 
}: StatisticCardProps) {
  return (
    <Card 
      className={`bg-card border border-border shadow-sm hover:shadow-md transition-shadow duration-200 min-h-[120px] ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline space-x-2">
              <p className="text-3xl font-bold text-foreground" data-testid={testId}>
                {value}
              </p>
              <span className="text-sm text-muted-foreground">{suffix}</span>
            </div>
            <div className="text-xs text-muted-foreground font-medium">
              {metaInfo}
            </div>
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon className="text-primary h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}