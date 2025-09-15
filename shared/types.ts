// API Response Types for Frontend
export interface PortfolioSummary {
  totalOutstanding: number;
  totalCreditLimit: number;
  availableCredit: number;
  portfolioLtv: number;
  activeLoansCount: number;
  bankExposures: BankExposure[];
}

export interface BankExposure {
  bankId: string;
  bankName: string;
  outstanding: number;
  creditLimit: number;
  utilization: number;
}

export interface SiborRate {
  rate: number;
  monthlyChange: number;
  lastUpdated: string;
}

export interface LoanWithDetails {
  id: string;
  facilityId: string;
  userId: string;
  referenceNumber: string;
  amount: string;
  startDate: string;
  dueDate: string;
  chargesDueDate?: string;
  siborRate: string;
  bankRate: string;
  notes?: string;
  status: string;
  settledDate?: string;
  settledAmount?: string;
  createdAt: string;
  facility: {
    id: string;
    facilityType: string;
    bank: {
      id: string;
      name: string;
      code: string;
    };
  };
}

export interface AIInsight {
  id: string;
  type: 'warning' | 'opportunity' | 'alert';
  category: 'Portfolio Risk' | 'LTV Threshold' | 'Cash Flow Optimization' | 'Payment Schedule' | 'Interest Rate Arbitrage';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
  timestamp: string;
}