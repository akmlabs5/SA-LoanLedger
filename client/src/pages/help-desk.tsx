import { HelpCircle } from "lucide-react";

export default function HelpDeskPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 sm:px-6 py-6 max-w-4xl">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <HelpCircle className="h-24 w-24 text-primary/20 mb-6" />
          <h1 className="text-4xl font-bold text-foreground mb-4" data-testid="text-page-title">
            Help Desk
          </h1>
          <p className="text-xl text-muted-foreground" data-testid="text-coming-soon">
            Coming Soon
          </p>
        </div>
      </div>
    </div>
  );
}
