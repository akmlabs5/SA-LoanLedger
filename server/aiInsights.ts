import type { IStorage } from "./storage";

// Deepseek API configuration
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "default_key";

export interface AIInsight {
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

export async function generateAIInsights(userId: string, storage: IStorage): Promise<AIInsight[]> {
  try {
    const portfolioSummary = await storage.getUserPortfolioSummary(userId);
    const activeLoans = await storage.getActiveLoansByUser(userId);
    const userCollateral = await storage.getUserCollateral(userId);
    const aiConfig = await storage.getUserAiConfig(userId);

    const insights: AIInsight[] = [];

    // 1. Portfolio Risk Concentration Alert
    const concentrationThreshold = aiConfig?.concentrationRiskThreshold ? parseFloat(aiConfig.concentrationRiskThreshold) : 40;
    portfolioSummary.bankExposures.forEach(exposure => {
      const exposurePercentage = (exposure.outstanding / portfolioSummary.totalOutstanding) * 100;
      if (exposurePercentage > concentrationThreshold) {
        insights.push({
          id: `concentration-${exposure.bankId}`,
          type: 'warning',
          category: 'Portfolio Risk Concentration',
          title: 'Concentration Risk Detected',
          description: `${exposure.bankName} represents ${exposurePercentage.toFixed(1)}% of your total exposure (${(exposure.outstanding / 1000000).toFixed(1)}M SAR of ${(portfolioSummary.totalOutstanding / 1000000).toFixed(1)}M SAR total portfolio).`,
          recommendation: `Consider diversifying across additional banks to reduce concentration risk. Target maximum ${concentrationThreshold}% exposure per bank.`,
        });
      }
    });

    // 2. LTV Threshold Breach Warning
    const ltvOutstandingThreshold = aiConfig?.ltvOutstandingThreshold ? parseFloat(aiConfig.ltvOutstandingThreshold) : 75;
    const totalCollateralValue = userCollateral.reduce((sum, col) => sum + parseFloat(col.currentValue), 0);
    
    if (totalCollateralValue > 0) {
      portfolioSummary.bankExposures.forEach(exposure => {
        const ltvOutstanding = (exposure.outstanding / totalCollateralValue) * 100;
        if (ltvOutstanding > ltvOutstandingThreshold) {
          const excessAmount = exposure.outstanding - (totalCollateralValue * (ltvOutstandingThreshold / 100));
          insights.push({
            id: `ltv-${exposure.bankId}`,
            type: 'critical',
            category: 'LTV Threshold Breach',
            title: 'LTV Limit Exceeded',
            description: `${exposure.bankName} Facility: Current LTV on Outstanding = ${ltvOutstanding.toFixed(1)}% (Target: <${ltvOutstandingThreshold}%)`,
            actionRequired: `Reduce outstanding by ${(excessAmount / 1000000).toFixed(1)}M SAR, OR provide additional collateral worth ${(excessAmount / 1000000).toFixed(1)}M SAR`,
            risk: 'Potential margin call or facility review',
          });
        }
      });
    }

    // 3. Cash Flow Optimization Insight
    const currentDate = new Date();
    const nextWeekLoans = activeLoans.filter(loan => {
      const dueDate = new Date(loan.dueDate);
      const daysDiff = Math.ceil((dueDate.getTime() - currentDate.getTime()) / (1000 * 3600 * 24));
      return daysDiff <= 7 && daysDiff >= 0;
    });

    if (nextWeekLoans.length > 0) {
      const totalDueAmount = nextWeekLoans.reduce((sum, loan) => sum + parseFloat(loan.amount), 0);
      const currentSiborRate = 5.75; // This would come from real API
      
      insights.push({
        id: 'cash-flow-optimization',
        type: 'opportunity',
        category: 'Cash Flow Optimization',
        title: 'Strategic Refinancing Opportunity',
        description: `${(totalDueAmount / 1000000).toFixed(1)}M SAR due in next 7 days with SIBOR trending upward (+0.25% this month)`,
        recommendation: 'Lock in current rates before further increases',
        savings: totalDueAmount * 0.005, // Estimated annual savings if rates rise 0.5%
      });
    }

    // 4. Payment Schedule Optimization Alert
    const cashFlowThreshold = aiConfig?.cashFlowStrainThreshold ? parseFloat(aiConfig.cashFlowStrainThreshold) : 20;
    const estimatedMonthlyCashFlow = portfolioSummary.totalOutstanding * 0.1; // Simplified estimation
    const weeklyDueAmount = nextWeekLoans.reduce((sum, loan) => sum + parseFloat(loan.amount), 0);
    const cashFlowPercentage = (weeklyDueAmount / estimatedMonthlyCashFlow) * 100;

    if (cashFlowPercentage > cashFlowThreshold && nextWeekLoans.length > 1) {
      insights.push({
        id: 'payment-schedule-optimization',
        type: 'alert',
        category: 'Payment Schedule Optimization',
        title: 'Cash Flow Bottleneck Detected',
        description: `Week ahead: ${(weeklyDueAmount / 1000000).toFixed(1)}M SAR due across ${nextWeekLoans.length} loans. This represents ${cashFlowPercentage.toFixed(1)}% of your typical monthly cash flow.`,
        risk: 'Potential liquidity strain',
        recommendation: '1. Negotiate staggered payment dates 2. Utilize revolving facilities for temporary bridge 3. Consider early payment of smaller loans',
      });
    }

    // 5. Interest Rate Arbitrage Opportunity
    const rateDifferentialThreshold = aiConfig?.rateDifferentialThreshold ? parseFloat(aiConfig.rateDifferentialThreshold) : 0.5;
    const bankRates = portfolioSummary.bankExposures.map(exposure => {
      const facilityLoans = activeLoans.filter(loan => loan.creditLine?.facility?.bank?.id === exposure.bankId);
      const avgRate = facilityLoans.length > 0 
        ? facilityLoans.reduce((sum, loan) => sum + parseFloat(loan.bankRate), 0) / facilityLoans.length 
        : 0;
      return { ...exposure, avgRate };
    });

    bankRates.forEach(highRateBank => {
      bankRates.forEach(lowRateBank => {
        if (highRateBank.bankId !== lowRateBank.bankId && 
            highRateBank.avgRate - lowRateBank.avgRate > rateDifferentialThreshold &&
            lowRateBank.creditLimit - lowRateBank.outstanding > 0) {
          
          const potentialSavingsAmount = Math.min(highRateBank.outstanding, lowRateBank.creditLimit - lowRateBank.outstanding);
          const annualSavings = potentialSavingsAmount * ((highRateBank.avgRate - lowRateBank.avgRate) / 100);
          
          insights.push({
            id: `arbitrage-${highRateBank.bankId}-${lowRateBank.bankId}`,
            type: 'savings',
            category: 'Interest Rate Arbitrage',
            title: 'Interest Rate Arbitrage Detected',
            description: `Rate Differential Opportunity: ${lowRateBank.bankName}: SIBOR + ${lowRateBank.avgRate.toFixed(1)}% vs Current ${highRateBank.bankName} Loan: SIBOR + ${highRateBank.avgRate.toFixed(1)}%`,
            savings: annualSavings,
            recommendation: `Consider refinancing ${highRateBank.bankName} loan with ${lowRateBank.bankName} facility. Available: ${((lowRateBank.creditLimit - lowRateBank.outstanding) / 1000000).toFixed(1)}M SAR`,
          });
        }
      });
    });

    // Use Deepseek for additional insights if available
    if (process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY !== "default_key") {
      try {
        const aiGeneratedInsights = await generateAdvancedInsights(portfolioSummary, activeLoans, userCollateral);
        insights.push(...aiGeneratedInsights);
      } catch (error) {
        console.error('Error generating AI insights:', error);
      }
    }

    return insights;
  } catch (error) {
    console.error('Error generating insights:', error);
    return [];
  }
}

async function generateAdvancedInsights(
  portfolioSummary: any,
  activeLoans: any[],
  userCollateral: any[]
): Promise<AIInsight[]> {
  try {
    const prompt = `
    Analyze this Saudi Arabian loan portfolio and provide strategic financial insights:

    Portfolio Summary:
    - Total Outstanding: ${(portfolioSummary.totalOutstanding / 1000000).toFixed(1)}M SAR
    - Total Credit Limit: ${(portfolioSummary.totalCreditLimit / 1000000).toFixed(1)}M SAR
    - Portfolio LTV: ${portfolioSummary.portfolioLtv.toFixed(1)}%
    - Active Loans: ${portfolioSummary.activeLoansCount}

    Bank Exposures:
    ${portfolioSummary.bankExposures.map((exp: any) => 
      `- ${exp.bankName}: ${(exp.outstanding / 1000000).toFixed(1)}M SAR outstanding, ${exp.utilization.toFixed(1)}% utilization`
    ).join('\n')}

    Collateral:
    ${userCollateral.map(col => 
      `- ${col.type}: ${(parseFloat(col.currentValue) / 1000000).toFixed(1)}M SAR`
    ).join('\n')}

    Provide 1-2 strategic insights focusing on:
    1. Market-specific opportunities for Saudi Arabia
    2. Risk optimization strategies
    3. SIBOR rate impact analysis

    Respond with JSON in this format:
    {
      "insights": [
        {
          "type": "opportunity",
          "category": "Market Strategy",
          "title": "Brief Title",
          "description": "Detailed analysis",
          "recommendation": "Specific action"
        }
      ]
    }
    `;

    // Call Deepseek API using fetch
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are a Saudi Arabian banking and finance expert specializing in loan portfolio optimization and risk management."
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Deepseek API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content received from Deepseek API');
    }

    const result = JSON.parse(content || '{"insights": []}');
    
    return result.insights.map((insight: any, index: number) => ({
      id: `ai-generated-${index}`,
      type: insight.type || 'opportunity',
      category: insight.category,
      title: insight.title,
      description: insight.description,
      recommendation: insight.recommendation,
    }));
  } catch (error) {
    console.error('Error generating advanced insights:', error);
    return [];
  }
}
