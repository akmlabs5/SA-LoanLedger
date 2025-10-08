import type { Express } from "express";
import type { AppDependencies } from "../types";
import { isAuthenticated } from "../replitAuth";
import { attachOrganizationContext, requireOrganization } from "../organizationMiddleware";
import { insertGuaranteeSchema, updateGuaranteeSchema } from "@shared/schema";

export function registerGuaranteesRoutes(app: Express, deps: AppDependencies) {
  const { storage } = deps;

  app.get('/api/guarantees', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const organizationId = req.organizationId;
      const guarantees = await storage.getUserGuarantees(organizationId);
      res.json(guarantees);
    } catch (error) {
      console.error("Error fetching guarantees:", error);
      res.status(500).json({ message: "Failed to fetch guarantees" });
    }
  });

  app.get('/api/guarantees/:guaranteeId', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const organizationId = req.organizationId;
      const { guaranteeId } = req.params;
      
      const guarantee = await storage.getGuaranteeById(guaranteeId);
      if (!guarantee || guarantee.organizationId !== organizationId) {
        return res.status(404).json({ message: "Guarantee not found" });
      }
      
      res.json(guarantee);
    } catch (error) {
      console.error("Error fetching guarantee:", error);
      res.status(500).json({ message: "Failed to fetch guarantee" });
    }
  });

  app.post('/api/guarantees', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const organizationId = req.organizationId;
      
      const guaranteeData = insertGuaranteeSchema.parse({
        ...req.body,
        organizationId,
      });
      
      // Verify organization owns the facility
      const userFacilities = await storage.getUserFacilities(organizationId);
      const facility = userFacilities.find(f => f.id === guaranteeData.facilityId);
      if (!facility) {
        return res.status(404).json({ message: "Facility not found" });
      }
      
      const guarantee = await storage.createGuarantee(guaranteeData);
      res.status(201).json(guarantee);
    } catch (error) {
      console.error("Error creating guarantee:", error);
      res.status(500).json({ message: "Failed to create guarantee" });
    }
  });

  app.put('/api/guarantees/:guaranteeId', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const organizationId = req.organizationId;
      const { guaranteeId } = req.params;
      
      // Verify organization owns the guarantee
      const existingGuarantee = await storage.getGuaranteeById(guaranteeId);
      if (!existingGuarantee || existingGuarantee.organizationId !== organizationId) {
        return res.status(404).json({ message: "Guarantee not found" });
      }
      
      const guaranteeData = updateGuaranteeSchema.parse({
        ...req.body,
        id: guaranteeId,
      });
      
      const guarantee = await storage.updateGuarantee(guaranteeId, organizationId, guaranteeData);
      res.json(guarantee);
    } catch (error) {
      console.error("Error updating guarantee:", error);
      res.status(500).json({ message: "Failed to update guarantee" });
    }
  });

  app.delete('/api/guarantees/:guaranteeId', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const organizationId = req.organizationId;
      const { guaranteeId } = req.params;
      
      // Verify organization owns the guarantee
      const existingGuarantee = await storage.getGuaranteeById(guaranteeId);
      if (!existingGuarantee || existingGuarantee.organizationId !== organizationId) {
        return res.status(404).json({ message: "Guarantee not found" });
      }
      
      await storage.deleteGuarantee(guaranteeId, organizationId);
      res.status(200).json({ message: "Guarantee deleted successfully" });
    } catch (error) {
      console.error("Error deleting guarantee:", error);
      res.status(500).json({ message: "Failed to delete guarantee" });
    }
  });

  app.get('/api/facilities/:facilityId/guarantees', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const organizationId = req.organizationId;
      const { facilityId } = req.params;
      
      // Verify organization owns the facility
      const userFacilities = await storage.getUserFacilities(organizationId);
      const facility = userFacilities.find(f => f.id === facilityId);
      if (!facility) {
        return res.status(404).json({ message: "Facility not found" });
      }
      
      const guarantees = await storage.getFacilityGuarantees(facilityId);
      res.json(guarantees);
    } catch (error) {
      console.error("Error fetching facility guarantees:", error);
      res.status(500).json({ message: "Failed to fetch facility guarantees" });
    }
  });
}
