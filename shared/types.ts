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
  creditLineId: string;
  userId: string;
  parentLoanId?: string;
  cycleNumber: number;
  referenceNumber: string;
  amount: string;
  startDate: string;
  dueDate: string;
  chargesDueDate?: string;
  siborRate: string;
  siborTerm: string;
  siborTermMonths: number;
  margin: string;
  bankRate: string;
  lastAccrualDate?: string;
  interestBasis: string;
  notes?: string;
  status: string;
  settledDate?: string;
  settledAmount?: string;
  isDeleted: boolean;
  updatedAt: string;
  createdAt: string;
  facility?: {
    id: string;
    bankId: string;
    userId: string;
    facilityType: string;
    creditLimit: string;
    costOfFunding: string;
    startDate: string;
    expiryDate: string;
    terms: string;
    isActive: boolean;
    createdAt: string;
    bank: {
      id: string;
      name: string;
      code: string;
      isActive: boolean;
      createdAt: string;
    };
  };
  creditLine: {
    id: string;
    facilityId: string;
    userId: string;
    creditLineType: string;
    name: string;
    description: string;
    creditLimit: string;
    availableLimit: string;
    interestRate: string;
    terms?: string;
    startDate?: string;
    expiryDate?: string;
    isActive: boolean;
    createdAt: string;
    facility: {
      id: string;
      bankId: string;
      userId: string;
      facilityType: string;
      creditLimit: string;
      costOfFunding: string;
      startDate: string;
      expiryDate: string;
      terms: string;
      isActive: boolean;
      createdAt: string;
      bank: {
        id: string;
        name: string;
        code: string;
        isActive: boolean;
        createdAt: string;
      };
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