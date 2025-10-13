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

// Helper function to ensure exactly 3 insights are returned
function ensureExactlyThreeInsights(insights: AIInsight[], portfolioSummary: any): AIInsight[] {
  const result = [...insights];

  // If we have 3 or more, return first 3
  if (result.length >= 3) {
    return result.slice(0, 3);
  }

  // Safe calculations with zero guards
  const totalOutstanding = portfolioSummary?.totalOutstanding || 0;
  const totalCreditLimit = portfolioSummary?.totalCreditLimit || 0;
  const availableCredit = portfolioSummary?.availableCredit || 0;
  const activeLoansCount = portfolioSummary?.activeLoansCount || 0;
  
  const creditAvailabilityPct = totalCreditLimit > 0 
    ? ((availableCredit / totalCreditLimit) * 100).toFixed(1) 
    : '0.0';
  
  const utilizationPct = totalCreditLimit > 0 
    ? ((totalOutstanding / totalCreditLimit) * 100).toFixed(1) 
    : '0.0';

  // If we have less than 3, add default insights to reach 3
  const defaultInsights: AIInsight[] = [
    {
      id: 'default-portfolio-health',
      type: 'opportunity',
      category: 'Portfolio Optimization',
      title: 'Portfolio Health Check',
      description: activeLoansCount > 0 
        ? `Your portfolio has ${(totalOutstanding / 1000000).toFixed(1)}M SAR outstanding across ${activeLoansCount} active loan(s) with ${creditAvailabilityPct}% credit availability.`
        : 'Start building your loan portfolio by adding facilities and tracking your banking relationships.',
      recommendation: 'Monitor facility utilization and maintain diversified bank relationships for optimal financial flexibility.',
    },
    {
      id: 'default-facility-utilization',
      type: 'opportunity',
      category: 'Portfolio Optimization',
      title: 'Facility Utilization Review',
      description: totalCreditLimit > 0
        ? `Current portfolio utilization: ${utilizationPct}% with ${(availableCredit / 1000000).toFixed(1)}M SAR available credit across all facilities.`
        : 'Add bank facilities to your portfolio to track credit utilization and optimize facility management.',
      recommendation: 'Review underutilized facilities and consider consolidating to improve cost efficiency and strengthen key banking relationships.',
    },
    {
      id: 'default-cost-review',
      type: 'opportunity',
      category: 'Cost Efficiency',
      title: 'Rate Structure Review',
      description: 'Regular review of facility rates and terms ensures competitive pricing aligned with current banking relationships.',
      recommendation: 'Schedule periodic rate reviews with relationship managers to ensure competitive SIBOR margins and facility fees.',
    },
  ];

  // Add default insights until we have exactly 3
  while (result.length < 3 && defaultInsights.length > 0) {
    const defaultInsight = defaultInsights[result.length - insights.length];
    if (defaultInsight) {
      result.push(defaultInsight);
    }
  }

  return result.slice(0, 3);
}

export async function generateAIInsights(organizationId: string, storage: IStorage, userId?: string): Promise<AIInsight[]> {
  try {
    const portfolioSummary = await storage.getUserPortfolioSummary(organizationId);
    const activeLoans = await storage.getActiveLoansByUser(organizationId);
    const userCollateral = await storage.getUserCollateral(organizationId);
    const aiConfig = userId ? await storage.getUserAiConfig(userId) : undefined;

    const insights: AIInsight[] = [];

    // 1. Portfolio Risk Concentration Alert
    const concentrationThreshold = aiConfig?.concentrationRiskThreshold ? parseFloat(aiConfig.concentrationRiskThreshold) : 40;
    if (portfolioSummary.totalOutstanding > 0) {
      portfolioSummary.bankExposures.forEach(exposure => {
        const exposurePercentage = (exposure.outstanding / portfolioSummary.totalOutstanding) * 100;
        if (exposurePercentage > concentrationThreshold) {
          insights.push({
            id: `concentration-${exposure.bankId}`,
            type: 'warning',
            category: 'Risk Management',
            title: 'Concentration Risk Detected',
            description: `${exposure.bankName} represents ${exposurePercentage.toFixed(1)}% of your total exposure (${(exposure.outstanding / 1000000).toFixed(1)}M SAR of ${(portfolioSummary.totalOutstanding / 1000000).toFixed(1)}M SAR total portfolio).`,
            recommendation: `Consider diversifying across additional banks to reduce concentration risk. Target maximum ${concentrationThreshold}% exposure per bank.`,
          });
        }
      });
    }

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
            category: 'Risk Management',
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
        category: 'Portfolio Optimization',
        title: 'Payment Schedule Concentration',
        description: `${(totalDueAmount / 1000000).toFixed(1)}M SAR due in next 7 days across ${nextWeekLoans.length} loan(s)`,
        recommendation: 'Consider staggering payment dates or utilizing revolving facilities for smoother cash flow management',
        savings: totalDueAmount * 0.005,
      });
    }

    // 4. Payment Schedule Optimization Alert
    const cashFlowThreshold = aiConfig?.cashFlowStrainThreshold ? parseFloat(aiConfig.cashFlowStrainThreshold) : 20;
    const estimatedMonthlyCashFlow = portfolioSummary.totalOutstanding * 0.1; // Simplified estimation
    const weeklyDueAmount = nextWeekLoans.reduce((sum, loan) => sum + parseFloat(loan.amount), 0);
    
    if (estimatedMonthlyCashFlow > 0 && nextWeekLoans.length > 1) {
      const cashFlowPercentage = (weeklyDueAmount / estimatedMonthlyCashFlow) * 100;
      if (cashFlowPercentage > cashFlowThreshold) {
        insights.push({
          id: 'payment-schedule-optimization',
          type: 'alert',
          category: 'Risk Management',
          title: 'Cash Flow Bottleneck Detected',
          description: `Week ahead: ${(weeklyDueAmount / 1000000).toFixed(1)}M SAR due across ${nextWeekLoans.length} loans. This represents ${cashFlowPercentage.toFixed(1)}% of your typical monthly cash flow.`,
          risk: 'Potential liquidity strain',
          recommendation: '1. Negotiate staggered payment dates 2. Utilize revolving facilities for temporary bridge 3. Consider early payment of smaller loans',
        });
      }
    }

    // 5. Interest Rate Arbitrage Opportunity
    const rateDifferentialThreshold = aiConfig?.rateDifferentialThreshold ? parseFloat(aiConfig.rateDifferentialThreshold) : 0.5;
    const bankRates = portfolioSummary.bankExposures.map(exposure => {
      const facilityLoans = activeLoans.filter(loan => loan.facility?.bank?.id === exposure.bankId);
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
            category: 'Cost Efficiency',
            title: 'Interest Rate Arbitrage Opportunity',
            description: `Rate Differential: ${lowRateBank.bankName} at ${lowRateBank.avgRate.toFixed(2)}% total cost vs ${highRateBank.bankName} at ${highRateBank.avgRate.toFixed(2)}% total cost (${(highRateBank.avgRate - lowRateBank.avgRate).toFixed(2)}% difference)`,
            savings: annualSavings,
            recommendation: `Consider refinancing ${highRateBank.bankName} loan with ${lowRateBank.bankName} facility. Available: ${((lowRateBank.creditLimit - lowRateBank.outstanding) / 1000000).toFixed(1)}M SAR`,
          });
        }
      });
    });

    // Use Deepseek for AI-generated insights if available
    if (process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY !== "default_key") {
      try {
        const aiGeneratedInsights = await generateAdvancedInsights(portfolioSummary, activeLoans, userCollateral);
        // Replace all insights with AI-generated ones if successful
        if (aiGeneratedInsights.length > 0) {
          return ensureExactlyThreeInsights(aiGeneratedInsights, portfolioSummary);
        }
      } catch (error) {
        console.error('Error generating AI insights:', error);
      }
    }

    // Fallback to rules-based insights, ensure exactly 3
    return ensureExactlyThreeInsights(insights, portfolioSummary);
  } catch (error) {
    console.error('Error generating insights:', error);
    // Even in error cases, return 3 default insights
    const fallbackSummary = {
      totalOutstanding: 0,
      totalCreditLimit: 0,
      availableCredit: 0,
      activeLoansCount: 0,
    };
    return ensureExactlyThreeInsights([], fallbackSummary);
  }
}

async function generateAdvancedInsights(
  portfolioSummary: any,
  activeLoans: any[],
  userCollateral: any[]
): Promise<AIInsight[]> {
  try {
    // Calculate upcoming loans in next 30 days
    const currentDate = new Date();
    const next30DaysLoans = activeLoans.filter(loan => {
      const dueDate = new Date(loan.dueDate);
      const daysDiff = Math.ceil((dueDate.getTime() - currentDate.getTime()) / (1000 * 3600 * 24));
      return daysDiff <= 30 && daysDiff >= 0;
    });
    const next30DaysAmount = next30DaysLoans.reduce((sum, loan) => sum + parseFloat(loan.amount), 0);

    // Calculate dual LTV metrics
    const totalCollateralValue = userCollateral.reduce((sum, col) => sum + parseFloat(col.currentValue), 0);
    const facilityLTV = totalCollateralValue > 0 ? (portfolioSummary.totalCreditLimit / totalCollateralValue) * 100 : 0;
    const outstandingLTV = totalCollateralValue > 0 ? (portfolioSummary.totalOutstanding / totalCollateralValue) * 100 : 0;

    const prompt = `You are a loan advisor to a borrower in the Saudi Arabian market, working with Saudi banks offering predominantly Islamic facilities.

Pricing structure:
- Cash facilities: SIBOR (base rate) + margin
- Non-cash guarantees: Takaful cost for issuance

Your role: Support borrowers with strong monitoring and control of their loan portfolios through data-driven insights.

Analyze this Saudi Arabian loan portfolio using ONLY the provided data:

Portfolio Summary:
- Total Outstanding: ${(portfolioSummary.totalOutstanding / 1000000).toFixed(1)}M SAR
- Total Credit Limit: ${(portfolioSummary.totalCreditLimit / 1000000).toFixed(1)}M SAR
- Facility LTV (Collateral/Total Limits): ${facilityLTV.toFixed(1)}%
- Outstanding LTV (Collateral/Outstanding): ${outstandingLTV.toFixed(1)}%
- Active Loans: ${portfolioSummary.activeLoansCount}
- Loans due in next 30 days: ${next30DaysLoans.length} (${(next30DaysAmount / 1000000).toFixed(1)}M SAR)

Bank Exposures:
${portfolioSummary.bankExposures.map((exp: any) => 
      `- ${exp.bankName}: ${(exp.outstanding / 1000000).toFixed(1)}M SAR outstanding, ${exp.utilization.toFixed(1)}% utilization, ${((exp.creditLimit - exp.outstanding) / 1000000).toFixed(1)}M SAR available`
    ).join('\n')}

Collateral:
${userCollateral.map(col => 
      `- ${col.type}: ${(parseFloat(col.currentValue) / 1000000).toFixed(1)}M SAR`
    ).join('\n')}

Active Loans Details:
${activeLoans.slice(0, 10).map(loan => 
      `- ${loan.facility?.bank?.name || 'Unknown Bank'}: ${(parseFloat(loan.amount) / 1000000).toFixed(1)}M SAR at SIBOR+${parseFloat(loan.bankRate).toFixed(2)}%, due ${new Date(loan.dueDate).toLocaleDateString('en-GB')}`
    ).join('\n')}

Provide EXACTLY 3 strategic insights focusing EXCLUSIVELY on:
1. **Portfolio Optimization** - How to better utilize existing facilities and optimize structure
2. **Risk Management** - Concentration risks, LTV breaches, payment timing issues, covenant compliance
3. **Cost Efficiency** - Rate arbitrage opportunities within current portfolio, refinancing savings

CRITICAL RULES:
- Use ONLY the data provided above
- Do NOT reference market conditions, trends, Vision 2030, or external factors
- Do NOT make assumptions about SIBOR direction or future rate movements
- Focus on actionable optimizations using existing facilities
- Provide specific numbers and calculations based on the data
- Each insight must have a clear recommendation with quantified impact

Respond with JSON format:
{
  "insights": [
    {
      "type": "opportunity" | "warning" | "critical",
      "category": "Portfolio Optimization" | "Risk Management" | "Cost Efficiency",
      "title": "Brief specific title",
      "description": "Detailed analysis with specific numbers from the data",
      "recommendation": "Specific actionable steps with quantified impact"
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
            content: "You are a loan advisor specializing in Saudi Arabian loan portfolio management. You provide data-driven insights based strictly on the borrower's current portfolio data without referencing external market conditions."
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1500,
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
    
    const formattedInsights = result.insights.map((insight: any, index: number) => ({
      id: `ai-generated-${index}`,
      type: insight.type || 'opportunity',
      category: insight.category || 'Portfolio Optimization',
      title: insight.title,
      description: insight.description,
      recommendation: insight.recommendation,
    }));

    // Ensure exactly 3 insights
    return formattedInsights.slice(0, 3);
  } catch (error) {
    console.error('Error generating advanced insights:', error);
    return [];
  }
}
