import type { Express } from "express";
import type { AppDependencies } from "../types";
import { isAuthenticated } from "../replitAuth";
import { attachOrganizationContext, requireOrganization } from "../organizationMiddleware";
import { NLQProcessor } from "../nlqProcessor";
import { DailyAlertsService } from "../dailyAlerts";
import { generateAIInsights } from "../aiInsights";
import { insertAiInsightConfigSchema } from "@shared/schema";

export function registerAiRoutes(app: Express, deps: AppDependencies) {
  const { storage } = deps;

  // Natural Language Query
  app.post('/api/ai/natural-query', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const organizationId = req.organizationId;
      const { query } = req.body;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Query is required" });
      }
      
      const nlqProcessor = new NLQProcessor(storage);
      const result = await nlqProcessor.processQuery(query, organizationId);
      
      res.json(result);
    } catch (error) {
      console.error("Error processing natural language query:", error);
      res.status(500).json({ message: "Failed to process query" });
    }
  });

  // Daily Alerts - Generate alerts for current user
  app.get('/api/ai/daily-alerts', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const organizationId = req.organizationId;
      
      const alertsService = new DailyAlertsService(storage);
      const alerts = await alertsService.generateDailyAlerts(organizationId);
      
      res.json({ alerts, count: alerts.length });
    } catch (error) {
      console.error("Error generating daily alerts:", error);
      res.status(500).json({ message: "Failed to generate alerts" });
    }
  });

  // Daily Alerts - Send digest email
  app.post('/api/ai/daily-alerts/send', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const organizationId = req.organizationId;
      const userId = req.user.claims.sub;
      const userEmail = req.user.claims.email || req.body.email;
      
      if (!userEmail) {
        return res.status(400).json({ message: "Email address is required" });
      }
      
      const alertsService = new DailyAlertsService(storage);
      await alertsService.generateAndSendDailyDigest(organizationId, userId, userEmail);
      
      res.json({ message: "Daily digest sent successfully" });
    } catch (error) {
      console.error("Error sending daily digest:", error);
      res.status(500).json({ message: "Failed to send daily digest" });
    }
  });

  // What-If Scenario Analysis
  app.post('/api/ai/what-if-analysis', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const organizationId = req.organizationId;
      const { loanId, scenarios } = req.body;
      
      if (!loanId) {
        return res.status(400).json({ message: "Loan ID is required" });
      }
      
      // Validate scenario inputs
      if (scenarios?.refinance?.newRate !== undefined) {
        if (scenarios.refinance.newRate < 0 || scenarios.refinance.newRate > 100) {
          return res.status(400).json({ message: "Interest rate must be between 0 and 100" });
        }
      }
      if (scenarios?.earlyPayment?.paymentAmount !== undefined) {
        if (scenarios.earlyPayment.paymentAmount <= 0) {
          return res.status(400).json({ message: "Payment amount must be positive" });
        }
      }
      if (scenarios?.termChange?.newDurationDays !== undefined) {
        if (scenarios.termChange.newDurationDays <= 0) {
          return res.status(400).json({ message: "Duration must be positive" });
        }
      }
      
      // Get the loan and verify it belongs to user's organization
      const loan = await storage.getLoanById(loanId);
      if (!loan || loan.organizationId !== organizationId) {
        return res.status(404).json({ message: "Loan not found" });
      }
      
      const currentAmount = parseFloat(loan.amount.toString());
      const currentRate = parseFloat(loan.interestRate.toString());
      const currentDueDate = new Date(loan.dueDate);
      const drawdownDate = new Date(loan.drawdownDate);
      const currentDurationDays = Math.ceil((currentDueDate.getTime() - drawdownDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Calculate current loan cost
      const currentDailyRate = currentRate / 365 / 100;
      const currentInterest = currentAmount * currentDailyRate * currentDurationDays;
      const currentTotalCost = currentAmount + currentInterest;
      
      const results: any = {
        current: {
          amount: currentAmount,
          rate: currentRate,
          durationDays: currentDurationDays,
          interest: currentInterest,
          totalCost: currentTotalCost,
          dueDate: loan.dueDate
        },
        scenarios: []
      };
      
      // Refinancing Scenario
      if (scenarios?.refinance) {
        const newRate = scenarios.refinance.newRate;
        const newDailyRate = newRate / 365 / 100;
        const refinanceInterest = currentAmount * newDailyRate * currentDurationDays;
        const refinanceTotalCost = currentAmount + refinanceInterest;
        const savings = currentInterest - refinanceInterest;
        const savingsPercent = currentInterest > 0 ? (savings / currentInterest) * 100 : 0;
        
        results.scenarios.push({
          type: 'refinance',
          name: 'Refinance at Different Rate',
          newRate,
          interest: refinanceInterest,
          totalCost: refinanceTotalCost,
          savings,
          savingsPercent,
          recommendation: savings > 0 
            ? `Refinancing would save SAR ${savings.toFixed(2)} (${savingsPercent.toFixed(1)}% reduction in interest)`
            : `Refinancing would increase cost by SAR ${Math.abs(savings).toFixed(2)}`
        });
      }
      
      // Early Payment Scenario
      if (scenarios?.earlyPayment) {
        const paymentAmount = scenarios.earlyPayment.paymentAmount;
        const paymentDate = scenarios.earlyPayment.paymentDate ? new Date(scenarios.earlyPayment.paymentDate) : new Date();
        let daysElapsed = Math.ceil((paymentDate.getTime() - drawdownDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Clamp days elapsed to loan duration
        daysElapsed = Math.max(0, Math.min(daysElapsed, currentDurationDays));
        
        if (paymentAmount >= currentAmount) {
          // Full early payment
          const interestPaid = currentAmount * currentDailyRate * daysElapsed;
          const totalPaid = currentAmount + interestPaid;
          const savings = currentInterest - interestPaid;
          const savingsPercent = currentInterest > 0 ? (savings / currentInterest) * 100 : 0;
          
          results.scenarios.push({
            type: 'earlyPayment',
            name: 'Full Early Payment',
            paymentAmount,
            paymentDate,
            daysElapsed,
            interestPaid,
            totalPaid,
            savings,
            savingsPercent,
            recommendation: `Paying off the loan early would save SAR ${savings.toFixed(2)} (${savingsPercent.toFixed(1)}% of total interest)`
          });
        } else {
          // Partial early payment
          const remainingPrincipal = currentAmount - paymentAmount;
          const interestToDate = currentAmount * currentDailyRate * daysElapsed;
          const remainingDays = currentDurationDays - daysElapsed;
          const futureInterest = remainingPrincipal * currentDailyRate * remainingDays;
          const totalInterest = interestToDate + futureInterest;
          const totalCost = currentAmount + totalInterest;
          const savings = currentInterest - totalInterest;
          const savingsPercent = currentInterest > 0 ? (savings / currentInterest) * 100 : 0;
          
          results.scenarios.push({
            type: 'partialPayment',
            name: 'Partial Early Payment',
            paymentAmount,
            paymentDate,
            daysElapsed,
            remainingPrincipal,
            interestToDate,
            futureInterest,
            totalInterest,
            totalCost,
            savings,
            savingsPercent,
            recommendation: `Partial payment of SAR ${paymentAmount.toFixed(2)} would save SAR ${savings.toFixed(2)} (${savingsPercent.toFixed(1)}% reduction in interest)`
          });
        }
      }
      
      // Term Extension/Reduction Scenario
      if (scenarios?.termChange) {
        const newDurationDays = scenarios.termChange.newDurationDays;
        const newInterest = currentAmount * currentDailyRate * newDurationDays;
        const newTotalCost = currentAmount + newInterest;
        const difference = newInterest - currentInterest;
        const differencePercent = currentInterest > 0 ? (difference / currentInterest) * 100 : 0;
        
        const newDueDate = new Date(drawdownDate);
        newDueDate.setDate(newDueDate.getDate() + newDurationDays);
        
        results.scenarios.push({
          type: 'termChange',
          name: newDurationDays > currentDurationDays ? 'Extend Loan Term' : 'Reduce Loan Term',
          newDurationDays,
          newDueDate: newDueDate.toISOString(),
          interest: newInterest,
          totalCost: newTotalCost,
          difference,
          differencePercent,
          recommendation: newDurationDays > currentDurationDays
            ? `Extending the term by ${newDurationDays - currentDurationDays} days would cost an additional SAR ${difference.toFixed(2)} in interest`
            : `Reducing the term by ${currentDurationDays - newDurationDays} days would save SAR ${Math.abs(difference).toFixed(2)} in interest`
        });
      }
      
      res.json(results);
      
    } catch (error) {
      console.error("Error in what-if analysis:", error);
      res.status(500).json({ message: "Failed to perform what-if analysis" });
    }
  });

  // Smart Loan Matcher - recommend optimal facility for new loan
  app.post('/api/ai/loan-matcher', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const organizationId = req.organizationId;
      const { loanAmount, facilityType, duration } = req.body;
      
      if (!loanAmount || loanAmount <= 0) {
        return res.status(400).json({ message: "Valid loan amount is required" });
      }
      
      // Get all organization facilities with their loans
      const facilities = await storage.getUserFacilities(organizationId);
      const loans = await storage.getActiveLoansByUser(organizationId);
      
      if (facilities.length === 0) {
        return res.json({
          recommendation: null,
          message: "No facilities available. Please create a facility first."
        });
      }
      
      // Analyze each facility
      const facilityScores = await Promise.all(facilities.map(async (facility: any) => {
        // Calculate current utilization
        const facilityLoans = loans.filter((l: any) => l.facilityId === facility.id);
        const currentOutstanding = facilityLoans.reduce((sum: number, l: any) => 
          sum + parseFloat(l.amount.toString()), 0);
        const creditLimit = parseFloat(facility.limit.toString());
        const availableCredit = creditLimit - currentOutstanding;
        const utilizationPercent = (currentOutstanding / creditLimit) * 100;
        
        let score = 0;
        const reasons: string[] = [];
        const warnings: string[] = [];
        
        // 1. Available Credit (40 points)
        if (availableCredit < loanAmount) {
          score = 0;
          warnings.push(`Insufficient credit: SAR ${availableCredit.toFixed(2)} available, SAR ${loanAmount.toFixed(2)} needed`);
        } else {
          const creditRatio = availableCredit / loanAmount;
          if (creditRatio >= 3) {
            score += 40;
            reasons.push("Excellent available credit");
          } else if (creditRatio >= 1.5) {
            score += 30;
            reasons.push("Good available credit");
          } else {
            score += 20;
            warnings.push("Limited available credit after drawdown");
          }
        }
        
        // 2. Current Utilization (20 points) - lower is better
        if (utilizationPercent < 30) {
          score += 20;
          reasons.push("Low utilization");
        } else if (utilizationPercent < 60) {
          score += 15;
        } else if (utilizationPercent < 80) {
          score += 10;
          warnings.push("High utilization");
        } else {
          score += 5;
          warnings.push("Very high utilization");
        }
        
        // 3. Interest Rate (20 points) - lower is better
        const rate = parseFloat(facility.costOfFunding.toString());
        const minRate = Math.min(...facilities.map((f: any) => parseFloat(f.costOfFunding.toString())));
        if (rate === minRate) {
          score += 20;
          reasons.push(`Best interest rate: ${rate}%`);
        } else {
          const rateDiff = rate - minRate;
          if (rateDiff < 0.5) {
            score += 15;
          } else if (rateDiff < 1.0) {
            score += 10;
          } else {
            score += 5;
            warnings.push(`Higher interest rate: ${rate}% vs ${minRate}%`);
          }
        }
        
        // 4. Facility Type Match (10 points)
        if (facilityType && facility.facilityType === facilityType) {
          score += 10;
          reasons.push("Facility type matches requirement");
        } else if (facilityType) {
          score += 5;
        }
        
        // 5. Revolving Period Check (10 points)
        if (facility.enableRevolvingTracking && duration) {
          try {
            const response = await fetch(`http://localhost:${process.env.PORT || 5000}/api/facilities/${facility.id}/revolving-usage`, {
              headers: { 'Authorization': req.headers.authorization || '' }
            });
            const usage = await response.json();
            
            const remainingDays = usage.remainingDays || 0;
            if (remainingDays >= duration) {
              score += 10;
              reasons.push(`Sufficient revolving period: ${remainingDays} days available`);
            } else {
              score += 0;
              warnings.push(`Insufficient revolving period: ${remainingDays} days available, ${duration} needed`);
            }
          } catch {
            score += 5; // Give partial credit if check fails
          }
        } else {
          score += 5; // Not applicable
        }
        
        return {
          facilityId: facility.id,
          facilityName: `${facility.bank?.name || 'Unknown Bank'} - ${facility.facilityType}`,
          bankName: facility.bank?.name || 'Unknown Bank',
          score,
          availableCredit,
          utilizationPercent: utilizationPercent.toFixed(2),
          interestRate: rate,
          creditLimit,
          currentOutstanding,
          reasons,
          warnings,
          isEligible: availableCredit >= loanAmount
        };
      }));
      
      // Sort by score (highest first)
      facilityScores.sort((a, b) => b.score - a.score);
      
      // Filter eligible facilities
      const eligibleFacilities = facilityScores.filter(f => f.isEligible);
      
      if (eligibleFacilities.length === 0) {
        return res.json({
          recommendation: null,
          message: "No facilities have sufficient available credit for this loan amount.",
          allFacilities: facilityScores
        });
      }
      
      const topRecommendation = eligibleFacilities[0];
      const alternatives = eligibleFacilities.slice(1, 3); // Top 2 alternatives
      
      res.json({
        recommendation: topRecommendation,
        alternatives,
        allFacilities: facilityScores,
        message: `Recommended: ${topRecommendation.facilityName} (Score: ${topRecommendation.score}/100)`
      });
      
    } catch (error) {
      console.error("Error in loan matcher:", error);
      res.status(500).json({ message: "Failed to analyze facilities" });
    }
  });

  // AI Insights
  app.get('/api/ai-insights', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const organizationId = req.organizationId;
      const userId = req.user.claims.sub;
      const insights = await generateAIInsights(organizationId, storage, userId);
      res.json(insights);
    } catch (error) {
      console.error("Error generating AI insights:", error);
      res.status(500).json({ message: "Failed to generate AI insights" });
    }
  });

  // AI Config
  app.get('/api/ai-config', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let config = await storage.getUserAiConfig(userId);
      
      if (!config) {
        config = {
          userId,
          concentrationRiskThreshold: '40',
          ltvOutstandingThreshold: '75',
          ltvLimitThreshold: '90'
        };
      }
      
      res.json(config);
    } catch (error) {
      console.error("Error fetching AI config:", error);
      res.status(500).json({ message: "Failed to fetch AI config" });
    }
  });

  app.put('/api/ai-config', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const configData = insertAiInsightConfigSchema.parse({ ...req.body, userId });
      const config = await storage.upsertAiConfig(configData);
      res.json(config);
    } catch (error) {
      console.error("Error updating AI config:", error);
      res.status(400).json({ message: "Failed to update AI config" });
    }
  });
}
