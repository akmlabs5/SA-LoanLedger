import type { Express } from "express";
import type { AppDependencies } from "../types";
import { isAuthenticated } from "../replitAuth";
import { attachOrganizationContext, requireOrganization } from "../organizationMiddleware";
import { insertFacilitySchema } from "@shared/schema";

async function initializeSampleFacilities(storage: any, organizationId: string) {
  try {
    const userFacilities = await storage.getUserFacilities(organizationId);
    
    if (userFacilities.length === 0) {
      const banks = await storage.getAllBanks();
      
      if (banks.length > 0) {
        console.log("Initializing sample facilities for new user");
      }
    }
  } catch (error) {
    console.error("Error initializing sample facilities:", error);
  }
}

export function registerFacilitiesRoutes(app: Express, deps: AppDependencies) {
  const { storage } = deps;

  app.get('/api/facilities', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const organizationId = req.organizationId;
      
      await initializeSampleFacilities(storage, organizationId);
      
      const facilities = await storage.getUserFacilities(organizationId);
      res.json(facilities);
    } catch (error) {
      console.error("Error fetching facilities:", error);
      res.status(500).json({ message: "Failed to fetch facilities" });
    }
  });

  app.post('/api/facilities', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const organizationId = req.organizationId;
      const facilityData = insertFacilitySchema.parse({ ...req.body, organizationId });
      const facility = await storage.createFacility(facilityData);
      res.json(facility);
    } catch (error) {
      console.error("Error creating facility:", error);
      res.status(400).json({ message: "Failed to create facility" });
    }
  });

  app.get('/api/facilities/:facilityId', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const organizationId = req.organizationId;
      const { facilityId } = req.params;
      
      const facility = await storage.getFacilityWithBank(facilityId);
      
      if (!facility) {
        return res.status(404).json({ message: "Facility not found" });
      }

      if (facility.organizationId !== organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(facility);
    } catch (error) {
      console.error("Error fetching facility:", error);
      res.status(500).json({ message: "Failed to fetch facility" });
    }
  });

  app.get('/api/facilities/:facilityId/revolving-usage', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const organizationId = req.organizationId;
      const { facilityId } = req.params;
      
      const facility = await storage.getFacilityWithBank(facilityId);
      
      if (!facility) {
        return res.status(404).json({ message: "Facility not found" });
      }

      if (facility.organizationId !== organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (!facility.enableRevolvingTracking || !facility.maxRevolvingPeriod) {
        return res.status(400).json({ message: "Revolving period tracking is not enabled for this facility" });
      }
      
      const allLoans = await storage.getUserLoans(organizationId);
      const facilityLoans = allLoans.filter((loan: any) => loan.facilityId === facilityId);
      
      let totalDaysUsed = 0;
      let activeLoansCount = 0;
      
      for (const loan of facilityLoans) {
        try {
          const startDate = new Date(loan.startDate);
          
          let endDate: Date;
          if (loan.settledDate) {
            const settled = new Date(loan.settledDate);
            const due = new Date(loan.dueDate);
            endDate = settled < due ? settled : due;
          } else {
            endDate = new Date(loan.dueDate);
          }
          
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.warn(`Invalid dates for loan ${loan.id}, skipping duration calculation`);
            continue;
          }
          
          const loanDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (loanDays > 0) {
            totalDaysUsed += loanDays;
          }
          
          if (loan.status === 'active') {
            activeLoansCount++;
          }
        } catch (error) {
          console.error(`Error calculating days for loan ${loan.id}:`, error);
          continue;
        }
      }
      
      const maxPeriod = facility.maxRevolvingPeriod;
      const daysRemaining = Math.max(0, Math.round(maxPeriod - totalDaysUsed));
      
      let percentageUsed = (totalDaysUsed / maxPeriod) * 100;
      if (!isFinite(percentageUsed)) {
        percentageUsed = 0;
      }
      percentageUsed = Math.min(100, Math.max(0, Math.round(percentageUsed * 10) / 10));
      
      let status: 'available' | 'warning' | 'critical' | 'expired';
      if (percentageUsed >= 100) {
        status = 'expired';
      } else if (percentageUsed >= 90) {
        status = 'critical';
      } else if (percentageUsed >= 70) {
        status = 'warning';
      } else {
        status = 'available';
      }
      
      const canRevolve = daysRemaining > 0;
      
      const usageData = {
        daysUsed: Math.round(totalDaysUsed),
        daysRemaining,
        percentageUsed,
        status,
        canRevolve,
        activeLoans: activeLoansCount,
        totalLoans: facilityLoans.length,
        maxRevolvingPeriod: maxPeriod,
      };
      
      res.json(usageData);
    } catch (error) {
      console.error("Error calculating revolving usage:", error);
      res.status(500).json({ message: "Failed to calculate revolving usage" });
    }
  });

  app.put('/api/facilities/:facilityId', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const organizationId = req.organizationId;
      const { facilityId } = req.params;
      const updateData = req.body;
      
      delete updateData.id;
      delete updateData.organizationId;
      delete updateData.createdAt;
      delete updateData.updatedAt;
      
      const userFacilities = await storage.getUserFacilities(organizationId);
      const facility = userFacilities.find((f: any) => f.id === facilityId);
      
      if (!facility) {
        return res.status(404).json({ message: "Facility not found or access denied" });
      }
      
      const facilityUpdateSchema = insertFacilitySchema.omit({ organizationId: true }).partial();
      const validatedData = facilityUpdateSchema.parse(updateData);
      
      const updatedFacility = await storage.updateFacility(facilityId, validatedData);
      res.json(updatedFacility);
    } catch (error) {
      console.error("Error updating facility:", error);
      res.status(400).json({ message: "Failed to update facility" });
    }
  });

  app.delete('/api/facilities/:facilityId', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const { facilityId } = req.params;
      await storage.deleteFacility(facilityId);
      res.json({ message: "Facility deleted successfully" });
    } catch (error) {
      console.error("Error deleting facility:", error);
      res.status(500).json({ message: "Failed to delete facility" });
    }
  });
}
