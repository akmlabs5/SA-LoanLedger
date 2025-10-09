// Natural Language Query Processor
import { IStorage } from './storage';

interface QueryResult {
  answer: string;
  data?: any;
  type: 'text' | 'number' | 'list' | 'chart';
  queryUnderstood: boolean;
}

export class NLQProcessor {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  async processQuery(query: string, organizationId: string): Promise<QueryResult> {
    const lowerQuery = query.toLowerCase();

    // Bank exposure queries
    if (this.matchesPattern(lowerQuery, ['exposure', 'bank', 'how much', 'owe'])) {
      return await this.handleBankExposureQuery(lowerQuery, organizationId);
    }

    // Due date queries
    if (this.matchesPattern(lowerQuery, ['due', 'when', 'upcoming', 'this month', 'this week'])) {
      return await this.handleDueDateQuery(lowerQuery, organizationId);
    }

    // Interest rate queries
    if (this.matchesPattern(lowerQuery, ['interest', 'rate', 'highest', 'lowest', 'average'])) {
      return await this.handleInterestRateQuery(lowerQuery, organizationId);
    }

    // Portfolio metrics queries
    if (this.matchesPattern(lowerQuery, ['total', 'outstanding', 'portfolio', 'how many loans'])) {
      return await this.handlePortfolioMetricsQuery(lowerQuery, organizationId);
    }

    // LTV queries
    if (this.matchesPattern(lowerQuery, ['ltv', 'loan to value', 'collateral'])) {
      return await this.handleLTVQuery(lowerQuery, organizationId);
    }

    // Facility queries
    if (this.matchesPattern(lowerQuery, ['facility', 'facilities', 'credit line', 'available credit'])) {
      return await this.handleFacilityQuery(lowerQuery, organizationId);
    }

    // Default: query not understood
    return {
      answer: "I'm not sure how to answer that question. Try asking about bank exposure, due dates, interest rates, portfolio totals, LTV, or facilities.",
      queryUnderstood: false,
      type: 'text'
    };
  }

  private matchesPattern(query: string, keywords: string[]): boolean {
    return keywords.some(keyword => query.includes(keyword));
  }

  private extractBankName(query: string): string | null {
    const bankPatterns = [
      'anb', 'arab national bank',
      'rjh', 'al rajhi', 'rajhi',
      'inma', 'alinma', 'alinma bank',
      'alb', 'albilad', 'bank albilad',
      'bja', 'jazira', 'aljazira', 'bank aljazira',
      'bsf', 'banque saudi fransi', 'banque',
      'rib', 'riyad', 'riyad bank',
      'sab', 'saudi awwal', 'awwal', 'awwal bank',
      'saib', 'saudi investment bank', 'investment bank',
      'snb', 'saudi national bank', 'national bank'
    ];

    for (const pattern of bankPatterns) {
      if (query.includes(pattern)) {
        return pattern;
      }
    }
    return null;
  }

  private async handleBankExposureQuery(query: string, organizationId: string): Promise<QueryResult> {
    const loans = await this.storage.getActiveLoansByUser(organizationId);
    const banks = await this.storage.getAllBanks();
    
    const bankName = this.extractBankName(query);
    
    if (bankName) {
      // Specific bank query
      const targetBank = banks.find(b => 
        b.name.toLowerCase().includes(bankName) || 
        b.code.toLowerCase().includes(bankName)
      );
      
      if (!targetBank) {
        return {
          answer: `I couldn't find a bank matching "${bankName}" in your portfolio.`,
          queryUnderstood: true,
          type: 'text'
        };
      }
      
      const bankLoans = loans.filter((l: any) => l.facility?.bankId === targetBank.id);
      const totalExposure = bankLoans.reduce((sum: number, l: any) => 
        sum + parseFloat(l.amount.toString()), 0);
      
      return {
        answer: `Your total exposure to ${targetBank.name} is SAR ${totalExposure.toLocaleString('en-US', { minimumFractionDigits: 2 })} across ${bankLoans.length} loan(s).`,
        data: {
          bankName: targetBank.name,
          exposure: totalExposure,
          loanCount: bankLoans.length,
          loans: bankLoans
        },
        queryUnderstood: true,
        type: 'number'
      };
    } else {
      // General exposure query - show all banks
      const exposureByBank = banks.map(bank => {
        const bankLoans = loans.filter((l: any) => l.facility?.bankId === bank.id);
        const exposure = bankLoans.reduce((sum: number, l: any) => 
          sum + parseFloat(l.amount.toString()), 0);
        return {
          bankName: bank.name,
          bankCode: bank.code,
          exposure,
          loanCount: bankLoans.length
        };
      }).filter(b => b.exposure > 0).sort((a, b) => b.exposure - a.exposure);
      
      const totalExposure = exposureByBank.reduce((sum, b) => sum + b.exposure, 0);
      
      return {
        answer: `Your total exposure is SAR ${totalExposure.toLocaleString('en-US', { minimumFractionDigits: 2 })} across ${exposureByBank.length} bank(s).`,
        data: exposureByBank,
        queryUnderstood: true,
        type: 'list'
      };
    }
  }

  private async handleDueDateQuery(query: string, organizationId: string): Promise<QueryResult> {
    const loans = await this.storage.getActiveLoansByUser(organizationId);
    const now = new Date();
    
    let filteredLoans: any[] = [];
    let timeFrame = '';
    
    if (query.includes('this week')) {
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      filteredLoans = loans.filter((l: any) => {
        const dueDate = new Date(l.dueDate);
        return dueDate >= now && dueDate <= nextWeek;
      });
      timeFrame = 'this week';
    } else if (query.includes('this month')) {
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      filteredLoans = loans.filter((l: any) => {
        const dueDate = new Date(l.dueDate);
        return dueDate >= now && dueDate <= nextMonth;
      });
      timeFrame = 'this month';
    } else {
      // Next 30 days
      const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      filteredLoans = loans.filter((l: any) => {
        const dueDate = new Date(l.dueDate);
        return dueDate >= now && dueDate <= next30Days;
      });
      timeFrame = 'in the next 30 days';
    }
    
    filteredLoans.sort((a: any, b: any) => 
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
    
    const totalAmount = filteredLoans.reduce((sum: number, l: any) => 
      sum + parseFloat(l.amount.toString()), 0);
    
    return {
      answer: `You have ${filteredLoans.length} loan(s) due ${timeFrame} totaling SAR ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}.`,
      data: filteredLoans.map((l: any) => ({
        id: l.id,
        amount: parseFloat(l.amount),
        dueDate: l.dueDate,
        bankName: l.facility?.bank?.name || 'Unknown',
        referenceNumber: l.referenceNumber
      })),
      queryUnderstood: true,
      type: 'list'
    };
  }

  private async handleInterestRateQuery(query: string, organizationId: string): Promise<QueryResult> {
    const loans = await this.storage.getActiveLoansByUser(organizationId);
    
    if (loans.length === 0) {
      return {
        answer: "You don't have any active loans.",
        queryUnderstood: true,
        type: 'text'
      };
    }
    
    // Filter out loans without valid interest rates
    const loansWithRates = loans.filter((l: any) => {
      const rate = parseFloat(l.interestRate?.toString() || '');
      return !isNaN(rate) && isFinite(rate);
    });
    
    if (loansWithRates.length === 0) {
      return {
        answer: "None of your active loans have interest rates set.",
        queryUnderstood: true,
        type: 'text'
      };
    }
    
    const rates = loansWithRates.map((l: any) => parseFloat(l.interestRate.toString()));
    
    if (query.includes('highest')) {
      const highestRate = Math.max(...rates);
      const highestLoans = loansWithRates.filter((l: any) => 
        parseFloat(l.interestRate.toString()) === highestRate
      );
      
      return {
        answer: `Your highest interest rate is ${highestRate}% on ${highestLoans.length} loan(s).`,
        data: highestLoans.map((l: any) => ({
          id: l.id,
          referenceNumber: l.referenceNumber,
          amount: parseFloat(l.amount),
          rate: parseFloat(l.interestRate),
          bankName: l.facility?.bank?.name || 'Unknown'
        })),
        queryUnderstood: true,
        type: 'list'
      };
    } else if (query.includes('lowest')) {
      const lowestRate = Math.min(...rates);
      const lowestLoans = loansWithRates.filter((l: any) => 
        parseFloat(l.interestRate.toString()) === lowestRate
      );
      
      return {
        answer: `Your lowest interest rate is ${lowestRate}% on ${lowestLoans.length} loan(s).`,
        data: lowestLoans.map((l: any) => ({
          id: l.id,
          referenceNumber: l.referenceNumber,
          amount: parseFloat(l.amount),
          rate: parseFloat(l.interestRate),
          bankName: l.facility?.bank?.name || 'Unknown'
        })),
        queryUnderstood: true,
        type: 'list'
      };
    } else {
      // Average
      const avgRate = rates.reduce((sum, r) => sum + r, 0) / rates.length;
      
      return {
        answer: `Your average interest rate across ${loansWithRates.length} loan(s) is ${avgRate.toFixed(2)}%.`,
        data: { averageRate: avgRate, loanCount: loansWithRates.length },
        queryUnderstood: true,
        type: 'number'
      };
    }
  }

  private async handlePortfolioMetricsQuery(query: string, organizationId: string): Promise<QueryResult> {
    const loans = await this.storage.getActiveLoansByUser(organizationId);
    const facilities = await this.storage.getUserFacilities(organizationId);
    
    const totalOutstanding = loans.reduce((sum: number, l: any) => 
      sum + parseFloat(l.amount.toString()), 0);
    const totalCreditLimit = facilities.reduce((sum: number, f: any) => 
      sum + parseFloat(f.limit.toString()), 0);
    const availableCredit = totalCreditLimit - totalOutstanding;
    
    if (query.includes('how many')) {
      return {
        answer: `You have ${loans.length} active loan(s) and ${facilities.length} facility/facilities.`,
        data: { activeLoans: loans.length, facilities: facilities.length },
        queryUnderstood: true,
        type: 'number'
      };
    }
    
    return {
      answer: `Your portfolio has SAR ${totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })} outstanding with SAR ${availableCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })} available credit.`,
      data: {
        totalOutstanding,
        totalCreditLimit,
        availableCredit,
        utilization: (totalOutstanding / totalCreditLimit * 100).toFixed(2)
      },
      queryUnderstood: true,
      type: 'number'
    };
  }

  private async handleLTVQuery(query: string, organizationId: string): Promise<QueryResult> {
    const loans = await this.storage.getActiveLoansByUser(organizationId);
    const collateral = await this.storage.getUserCollateral(organizationId);
    
    const totalOutstanding = loans.reduce((sum: number, l: any) => 
      sum + parseFloat(l.amount.toString()), 0);
    const totalCollateralValue = collateral.reduce((sum: number, c: any) => 
      sum + parseFloat(c.currentValue.toString()), 0);
    
    const ltv = totalCollateralValue > 0 
      ? (totalOutstanding / totalCollateralValue * 100).toFixed(2)
      : 'N/A';
    
    return {
      answer: `Your portfolio LTV is ${ltv}% (SAR ${totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })} loans against SAR ${totalCollateralValue.toLocaleString('en-US', { minimumFractionDigits: 2 })} collateral).`,
      data: {
        ltv: typeof ltv === 'string' ? null : parseFloat(ltv),
        totalOutstanding,
        totalCollateralValue,
        collateralCount: collateral.length
      },
      queryUnderstood: true,
      type: 'number'
    };
  }

  private async handleFacilityQuery(query: string, organizationId: string): Promise<QueryResult> {
    const facilities = await this.storage.getUserFacilities(organizationId);
    const loans = await this.storage.getActiveLoansByUser(organizationId);
    
    const facilityData = facilities.map((f: any) => {
      const facilityLoans = loans.filter((l: any) => l.facilityId === f.id);
      const outstanding = facilityLoans.reduce((sum: number, l: any) => 
        sum + parseFloat(l.amount.toString()), 0);
      const limit = parseFloat(f.limit.toString());
      const available = limit - outstanding;
      
      return {
        id: f.id,
        bankName: f.bank?.name || 'Unknown',
        type: f.facilityType,
        limit,
        outstanding,
        available,
        utilization: (outstanding / limit * 100).toFixed(2)
      };
    });
    
    const totalAvailable = facilityData.reduce((sum, f) => sum + f.available, 0);
    
    return {
      answer: `You have ${facilities.length} facility/facilities with SAR ${totalAvailable.toLocaleString('en-US', { minimumFractionDigits: 2 })} total available credit.`,
      data: facilityData,
      queryUnderstood: true,
      type: 'list'
    };
  }
}
