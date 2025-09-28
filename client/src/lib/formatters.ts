export const formatCurrency = (amount: number, options?: {
  showDecimals?: boolean;
  compact?: boolean;
}): string => {
  const { showDecimals = true, compact = false } = options || {};

  if (compact) {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(showDecimals ? 1 : 0)}M SAR`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(showDecimals ? 1 : 0)}K SAR`;
    }
  }

  return new Intl.NumberFormat('en-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);
};

export const formatPercentage = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

export const formatDate = (date: string | Date, format: 'short' | 'long' = 'short'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (format === 'long') {
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const formatFacilityType = (facilityType: string): string => {
  return facilityType.replace(/_/g, ' ');
};