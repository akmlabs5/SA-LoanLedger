import type { Express } from "express";
import type { AppDependencies } from "../types";
import { isAuthenticated } from "../replitAuth";
import { attachOrganizationContext, requireOrganization } from "../organizationMiddleware";
import { insertCollateralSchema, insertCollateralAssignmentSchema } from "@shared/schema";

export function registerCollateralRoutes(app: Express, deps: AppDependencies) {
  const { storage } = deps;

  app.get('/api/collateral', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const organizationId = req.organizationId;
      const collateral = await storage.getUserCollateral(organizationId);
      res.json(collateral);
    } catch (error) {
      console.error("Error fetching collateral:", error);
      res.status(500).json({ message: "Failed to fetch collateral" });
    }
  });

  app.post('/api/collateral', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const organizationId = req.organizationId;
      
      const { facilityId, bankId, pledgeType, ...collateralFields } = req.body;
      
      if (!facilityId && !bankId) {
        return res.status(400).json({ message: "Either facility or bank selection is required for collateral creation" });
      }
      
      if (facilityId && bankId) {
        return res.status(400).json({ message: "Cannot assign to both facility and bank. Choose one." });
      }
      
      if (!pledgeType) {
        return res.status(400).json({ message: "Pledge type is required for collateral creation" });
      }
      
      const collateralData = insertCollateralSchema.parse({ ...collateralFields, organizationId });
      
      if (facilityId) {
        const userFacilities = await storage.getUserFacilities(organizationId);
        const facility = userFacilities.find((f: any) => f.id === facilityId);
        if (!facility) {
          return res.status(403).json({ message: "Facility not found or access denied" });
        }
      }
      
      if (bankId) {
        const userFacilities = await storage.getUserFacilities(organizationId);
        const hasRelationship = userFacilities.some((f: any) => f.bankId === bankId);
        if (!hasRelationship) {
          return res.status(403).json({ message: "No relationship found with this bank" });
        }
      }
      
      const collateral = await storage.createCollateral(collateralData);
      
      try {
        const assignmentData: any = {
          collateralId: collateral.id,
          pledgeType,
          effectiveDate: new Date().toISOString().split('T')[0],
          isActive: true,
          organizationId
        };
        
        if (facilityId) {
          assignmentData.facilityId = facilityId;
        } else {
          assignmentData.bankId = bankId;
        }
        
        await storage.createCollateralAssignment(assignmentData);
        
        res.json(collateral);
      } catch (assignmentError) {
        try {
          await storage.deleteCollateral(collateral.id);
        } catch (rollbackError) {
          console.error("Failed to rollback collateral after assignment failure:", rollbackError);
        }
        throw assignmentError;
      }
      
    } catch (error) {
      console.error("Error creating collateral:", error);
      res.status(400).json({ message: "Failed to create collateral and assignment" });
    }
  });

  app.put('/api/collateral/:id', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const collateralId = req.params.id;
      const updates = req.body;
      const collateral = await storage.updateCollateral(collateralId, updates);
      res.json(collateral);
    } catch (error) {
      console.error("Error updating collateral:", error);
      res.status(400).json({ message: "Failed to update collateral" });
    }
  });

  app.delete('/api/collateral/:id', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const collateralId = req.params.id;
      await storage.deleteCollateral(collateralId);
      res.json({ message: "Collateral deleted successfully" });
    } catch (error) {
      console.error("Error deleting collateral:", error);
      res.status(500).json({ message: "Failed to delete collateral" });
    }
  });

  app.get('/api/collateral-assignments', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const organizationId = req.organizationId;
      const assignments = await storage.getUserCollateralAssignments(organizationId);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching collateral assignments:", error);
      res.status(500).json({ message: "Failed to fetch collateral assignments" });
    }
  });

  app.post('/api/collateral-assignments', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const organizationId = req.organizationId;
      const assignmentData = insertCollateralAssignmentSchema.parse({ ...req.body, organizationId });
      
      const userCollateral = await storage.getUserCollateral(organizationId);
      const userFacilities = await storage.getUserFacilities(organizationId);
      const userCreditLines = await storage.getUserCreditLines(organizationId);
      
      if (!userCollateral.find((c: any) => c.id === assignmentData.collateralId)) {
        return res.status(403).json({ message: "Collateral not found or access denied" });
      }
      
      if (!assignmentData.facilityId && !assignmentData.creditLineId) {
        return res.status(400).json({ message: "Either facilityId or creditLineId must be specified" });
      }
      
      if (assignmentData.facilityId) {
        const facility = userFacilities.find((f: any) => f.id === assignmentData.facilityId);
        if (!facility) {
          return res.status(403).json({ message: "Facility not found or access denied" });
        }
      }
      
      if (assignmentData.creditLineId) {
        const creditLine = userCreditLines.find((cl: any) => cl.id === assignmentData.creditLineId);
        if (!creditLine) {
          return res.status(403).json({ message: "Credit line not found or access denied" });
        }
        
        if (assignmentData.facilityId && creditLine.facility.id !== assignmentData.facilityId) {
          return res.status(400).json({ message: "Credit line does not belong to the specified facility" });
        }
      }
      
      const assignment = await storage.createCollateralAssignment(assignmentData);
      res.json(assignment);
    } catch (error) {
      console.error("Error creating collateral assignment:", error);
      res.status(400).json({ message: "Failed to create collateral assignment" });
    }
  });

  app.put('/api/collateral-assignments/:id', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const assignmentId = req.params.id;
      const organizationId = req.organizationId;
      const updates = req.body;
      
      const userAssignments = await storage.getUserCollateralAssignments(organizationId);
      const existingAssignment = userAssignments.find((a: any) => a.id === assignmentId);
      
      if (!existingAssignment) {
        return res.status(403).json({ message: "Assignment not found or access denied" });
      }
      
      if (updates.facilityId || updates.creditLineId) {
        const userFacilities = await storage.getUserFacilities(organizationId);
        const userCreditLines = await storage.getUserCreditLines(organizationId);
        
        if (updates.facilityId && !userFacilities.find((f: any) => f.id === updates.facilityId)) {
          return res.status(403).json({ message: "Facility not found or access denied" });
        }
        
        if (updates.creditLineId && !userCreditLines.find((cl: any) => cl.id === updates.creditLineId)) {
          return res.status(403).json({ message: "Credit line not found or access denied" });
        }
        
        if (updates.facilityId && updates.creditLineId) {
          const creditLine = userCreditLines.find((cl: any) => cl.id === updates.creditLineId);
          if (creditLine && creditLine.facility.id !== updates.facilityId) {
            return res.status(400).json({ message: "Credit line does not belong to the specified facility" });
          }
        }
      }
      
      const assignment = await storage.updateCollateralAssignment(assignmentId, updates);
      res.json(assignment);
    } catch (error) {
      console.error("Error updating collateral assignment:", error);
      res.status(400).json({ message: "Failed to update collateral assignment" });
    }
  });

  app.delete('/api/collateral-assignments/:id', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const assignmentId = req.params.id;
      const organizationId = req.organizationId;
      
      const userAssignments = await storage.getUserCollateralAssignments(organizationId);
      const existingAssignment = userAssignments.find((a: any) => a.id === assignmentId);
      
      if (!existingAssignment) {
        return res.status(403).json({ message: "Assignment not found or access denied" });
      }
      
      await storage.deleteCollateralAssignment(assignmentId);
      res.json({ message: "Collateral assignment deleted successfully" });
    } catch (error) {
      console.error("Error deleting collateral assignment:", error);
      res.status(500).json({ message: "Failed to delete collateral assignment" });
    }
  });
}
