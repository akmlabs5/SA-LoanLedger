import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900">
      <div className={`max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 ${className}`}>
        {children}
      </div>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, icon, actions, className = "" }: PageHeaderProps) {
  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {icon && (
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 text-white rounded-lg flex items-center justify-center">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            {subtitle && <div className="text-sm text-muted-foreground mt-1">{subtitle}</div>}
          </div>
        </div>
        {actions && <div className="flex items-center space-x-2">{actions}</div>}
      </div>
    </div>
  );
}

interface SectionProps {
  children: ReactNode;
  className?: string;
}

export function Section({ children, className = "" }: SectionProps) {
  return <div className={`space-y-4 sm:space-y-6 ${className}`}>{children}</div>;
}
