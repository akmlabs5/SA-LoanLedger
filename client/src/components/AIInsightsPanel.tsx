import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  AlertTriangle, 
  AlertCircle, 
  Lightbulb, 
  TrendingUp, 
  Eye
} from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";

interface AIInsight {
  id: string;
  type: 'critical' | 'warning' | 'opportunity' | 'alert' | 'savings';
  category: string;
  title: string;
  description: string;
  actionRequired?: string;
  savings?: number;
  risk?: string;
  recommendation?: string;
}

export default function AIInsightsPanel() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: insights, isLoading, error } = useQuery({
    queryKey: ["/api/ai-insights"],
    enabled: isAuthenticated,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [error, toast]);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5" />;
      case 'opportunity':
        return <Lightbulb className="h-5 w-5" />;
      case 'alert':
        return <TrendingUp className="h-5 w-5" />;
      case 'savings':
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <Bot className="h-5 w-5" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'opportunity':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'alert':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'savings':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getInsightIconColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      case 'opportunity':
        return 'text-blue-600';
      case 'alert':
        return 'text-orange-600';
      case 'savings':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Card className="mb-6" data-testid="card-ai-insights">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg font-semibold text-foreground">
            <Bot className="text-primary mr-2 h-5 w-5" />
            Intelligent Portfolio Insights
          </CardTitle>
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm" data-testid="button-view-all-insights">
              <Eye className="h-4 w-4 mr-1" />
              View All
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <Bot className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-pulse" />
            <p className="text-muted-foreground">Analyzing your portfolio...</p>
          </div>
        ) : !insights || insights.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
            <Bot className="text-green-600 mt-1 h-5 w-5" />
            <div className="flex-1">
              <h3 className="font-medium text-green-800">Portfolio Looking Good!</h3>
              <p className="text-sm text-green-700 mt-1">
                No critical issues detected. Your portfolio is well-balanced and within safe limits.
              </p>
              <p className="text-xs text-green-600 mt-2">
                AI monitoring continues 24/7 for any changes requiring attention.
              </p>
            </div>
          </div>
        ) : (
          insights.slice(0, 5).map((insight: AIInsight) => (
            <div 
              key={insight.id}
              className={`border rounded-lg p-4 flex items-start space-x-3 ${getInsightColor(insight.type)}`}
              data-testid={`insight-${insight.id}`}
            >
              <div className={getInsightIconColor(insight.type)}>
                {getInsightIcon(insight.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{insight.title}</h3>
                  <Badge variant="outline" className="text-xs">
                    {insight.category}
                  </Badge>
                </div>
                <p className="text-sm mb-2">{insight.description}</p>
                
                {insight.actionRequired && (
                  <p className="text-xs font-medium mb-2">
                    <strong>Action Required:</strong> {insight.actionRequired}
                  </p>
                )}
                
                {insight.risk && (
                  <p className="text-xs mb-2">
                    <strong>Risk:</strong> {insight.risk}
                  </p>
                )}
                
                {insight.recommendation && (
                  <p className="text-xs mb-2">
                    <strong>Recommendation:</strong> {insight.recommendation}
                  </p>
                )}
                
                {insight.savings && (
                  <p className="text-xs font-medium">
                    <strong>Potential Savings:</strong> {(insight.savings / 1000).toFixed(0)}K SAR annually
                  </p>
                )}
              </div>
            </div>
          ))
        )}
        
        {insights && insights.length > 5 && (
          <div className="text-center pt-4 border-t border-border">
            <Button variant="outline" size="sm" data-testid="button-view-more-insights">
              View {insights.length - 5} More Insights
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
