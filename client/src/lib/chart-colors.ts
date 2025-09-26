// Saudi-themed color palette for charts and visualizations

export const SAUDI_CHART_COLORS = {
  // Primary Saudi Colors
  saudiGreen: '#1B7B34',
  saudiGold: '#DAA520',
  
  // Extended palette for multiple data series
  palette: [
    '#1B7B34', // Saudi Green (primary)
    '#DAA520', // Saudi Gold
    '#1E3A8A', // Deep Blue
    '#059669', // Emerald Green
    '#DC2626', // Red (for alerts/critical)
    '#7C3AED', // Purple
    '#0891B2', // Cyan
    '#EA580C', // Orange
  ],
  
  // Status-specific colors
  status: {
    success: '#10B981',
    warning: '#F59E0B', 
    error: '#EF4444',
    info: '#3B82F6',
    neutral: '#6B7280',
  },
  
  // Transaction type colors (maintaining existing functionality)
  transactionTypes: {
    draw: '#3B82F6',
    repayment: '#10B981', 
    fee: '#F59E0B',
    interest: '#8B5CF6',
    limit_change: '#F97316',
    other: '#6B7280',
  },
  
  // Urgency colors for loan classifications
  urgency: {
    critical: '#DC2626',
    warning: '#D97706',
    normal: '#059669',
  },
  
  // Bank-specific colors (for consistent bank representation)
  banks: {
    // Will be assigned dynamically but maintain consistency
    primary: '#1B7B34',
    secondary: '#DAA520', 
    tertiary: '#1E3A8A',
  }
};

export const CHART_STYLING = {
  // Common chart styling constants
  margins: {
    default: { top: 20, right: 30, left: 20, bottom: 20 },
    compact: { top: 10, right: 20, left: 10, bottom: 10 },
    large: { top: 30, right: 40, left: 30, bottom: 30 },
  },
  
  // Responsive heights
  heights: {
    mobile: '250px',
    tablet: '300px', 
    desktop: '350px',
  },
  
  // Animation settings
  animation: {
    duration: 300,
    easing: 'ease-in-out',
  },
  
  // Typography
  typography: {
    titleSize: '1.25rem',
    labelSize: '0.875rem',
    tooltipSize: '0.75rem',
  }
};

// Utility function to get consistent bank colors
export const getBankColor = (index: number): string => {
  return SAUDI_CHART_COLORS.palette[index % SAUDI_CHART_COLORS.palette.length];
};

// Utility function to get transaction type color with background classes
export const getTransactionTypeStyle = (type: string) => {
  const styleMap = {
    draw: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    repayment: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', 
    fee: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    interest: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    limit_change: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  };
  return styleMap[type as keyof typeof styleMap] || styleMap.other;
};