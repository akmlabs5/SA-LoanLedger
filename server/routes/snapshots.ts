import type { Express } from "express";
import type { AppDependencies } from "../types";
import { isAuthenticated } from "../replitAuth";
import { attachOrganizationContext, requireOrganization } from "../organizationMiddleware";

export function registerSnapshotRoutes(app: Express, deps: AppDependencies) {
  const { storage } = deps;

  // Capture a manual portfolio snapshot
  app.post('/api/snapshots/capture', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const organizationId = req.organizationId;
      const snapshotDate = req.body.snapshotDate || new Date().toISOString().split('T')[0];
      
      // Check if snapshot already exists for this date
      const existing = await storage.getSnapshotByDate(organizationId, snapshotDate);
      if (existing) {
        return res.status(400).json({ message: "Snapshot already exists for this date" });
      }
      
      // Get all active loans
      const activeLoans = await storage.getActiveLoansByUser(organizationId);
      
      // Calculate portfolio metrics
      const totalOutstanding = activeLoans.reduce((sum, loan) => 
        sum + Number(loan.amount?.toString() || 0), 0
      );
      
      const activeLoansCount = activeLoans.length;
      
      // Get all facilities to calculate total credit limit
      const facilities = await storage.getUserFacilities(organizationId);
      const totalCreditLimit = facilities.reduce((sum, facility) => 
        sum + Number(facility.creditLimit?.toString() || 0), 0
      );
      
      // Calculate LTV
      const collateralAssignments = await storage.getUserCollateralAssignments(organizationId);
      const totalCollateralValue = collateralAssignments.reduce((sum: number, assignment: any) => {
        const collateral = assignment.collateral;
        return sum + Number(collateral?.currentValue?.toString() || 0);
      }, 0);
      
      const portfolioLtv = totalCollateralValue > 0 
        ? ((totalOutstanding / totalCollateralValue) * 100).toFixed(2) 
        : "0";
      
      // Group loans by bank for bank exposures
      const bankExposures: Record<string, any> = {};
      for (const loan of activeLoans) {
        const facility = facilities.find(f => f.id === loan.facilityId);
        if (facility && facility.bank) {
          const bankId = facility.bank.id;
          const bankName = facility.bank.name;
          
          if (!bankExposures[bankId]) {
            bankExposures[bankId] = {
              bankId,
              bankName,
              totalExposure: 0,
              loanCount: 0,
              facilities: []
            };
          }
          
          bankExposures[bankId].totalExposure += Number(loan.amount?.toString() || 0);
          bankExposures[bankId].loanCount += 1;
          
          const facilityExists = bankExposures[bankId].facilities.find(
            (f: any) => f.facilityId === facility.id
          );
          if (!facilityExists) {
            bankExposures[bankId].facilities.push({
              facilityId: facility.id,
              facilityType: facility.facilityType,
              exposure: Number(loan.amount?.toString() || 0)
            });
          } else {
            facilityExists.exposure += Number(loan.amount?.toString() || 0);
          }
        }
      }
      
      // Additional metrics
      const metrics = {
        avgLoanSize: activeLoansCount > 0 ? totalOutstanding / activeLoansCount : 0,
        maxLoanSize: activeLoans.length > 0 
          ? Math.max(...activeLoans.map(l => Number(l.amount?.toString() || 0))) 
          : 0,
        minLoanSize: activeLoans.length > 0 
          ? Math.min(...activeLoans.map(l => Number(l.amount?.toString() || 0))) 
          : 0,
        utilizationRate: totalCreditLimit > 0 
          ? ((totalOutstanding / totalCreditLimit) * 100).toFixed(2) 
          : "0",
        bankCount: Object.keys(bankExposures).length,
        facilityCount: facilities.length
      };
      
      const snapshot = await storage.createPortfolioSnapshot({
        organizationId,
        snapshotDate,
        totalOutstanding: totalOutstanding.toString(),
        totalCreditLimit: totalCreditLimit.toString(),
        portfolioLtv,
        activeLoansCount,
        bankExposuresJson: bankExposures,
        metricsJson: metrics
      });
      
      res.json(snapshot);
    } catch (error) {
      console.error("Error capturing portfolio snapshot:", error);
      res.status(500).json({ message: "Failed to capture portfolio snapshot" });
    }
  });

  // Get snapshot by specific date
  app.get('/api/snapshots/date/:date', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const organizationId = req.organizationId;
      const { date } = req.params;
      
      const snapshot = await storage.getSnapshotByDate(organizationId, date);
      if (!snapshot) {
        return res.status(404).json({ message: "Snapshot not found for this date" });
      }
      
      res.json(snapshot);
    } catch (error) {
      console.error("Error fetching snapshot:", error);
      res.status(500).json({ message: "Failed to fetch snapshot" });
    }
  });

  // Get snapshots in a date range
  app.get('/api/snapshots/range', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const organizationId = req.organizationId;
      const { from, to } = req.query;
      
      if (!from || !to) {
        return res.status(400).json({ message: "Both 'from' and 'to' dates are required" });
      }
      
      const snapshots = await storage.getSnapshotsInRange(organizationId, from as string, to as string);
      res.json(snapshots);
    } catch (error) {
      console.error("Error fetching snapshots:", error);
      res.status(500).json({ message: "Failed to fetch snapshots" });
    }
  });

  // Get latest snapshot
  app.get('/api/snapshots/latest', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const organizationId = req.organizationId;
      
      const snapshot = await storage.getLatestSnapshot(organizationId);
      if (!snapshot) {
        return res.status(404).json({ message: "No snapshots found" });
      }
      
      res.json(snapshot);
    } catch (error) {
      console.error("Error fetching latest snapshot:", error);
      res.status(500).json({ message: "Failed to fetch latest snapshot" });
    }
  });
}
