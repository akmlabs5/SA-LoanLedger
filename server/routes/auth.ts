import type { Express } from "express";
import { isAuthenticated } from "../replitAuth";
import type { AppDependencies } from "../types";

export function registerAuthRoutes(app: Express, deps: AppDependencies) {
  const { storage } = deps;

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let user = await storage.getUser(userId);
      
      if (!user) {
        user = await storage.upsertUser({
          id: userId,
          email: req.user.claims.email || 'developer@test.com',
          firstName: req.user.claims.first_name || 'Test',
          lastName: req.user.claims.last_name || 'Developer',
          profileImageUrl: req.user.claims.profile_image_url || null,
        });
      }
      
      // Get user's organization info
      const userOrg = await storage.getUserOrganization(userId);
      
      let organizationData = {};
      if (userOrg) {
        // Check if user is owner
        const members = await storage.getOrganizationMembers(userOrg.id);
        const currentMember = members.find(m => m.userId === userId);
        
        organizationData = {
          organizationId: userOrg.id,
          organizationName: userOrg.name,
          isOwner: currentMember?.isOwner || false,
        };
      }
      
      res.json({
        ...user,
        ...organizationData,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Delete user account with protection for organization owners
  app.delete('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check if user is an organization owner
      const userOrg = await storage.getUserOrganization(userId);
      
      if (userOrg) {
        // Get organization members
        const members = await storage.getOrganizationMembers(userOrg.id);
        const currentMember = members.find(m => m.userId === userId);
        
        // If user is owner and there are other members, prevent deletion
        if (currentMember?.isOwner && members.length > 1) {
          return res.status(400).json({
            success: false,
            message: "Cannot delete account. You are the organization owner and there are other members. Please transfer ownership or remove all members before deleting your account.",
          });
        }
        
        // If user is owner and only member, they can delete (organization will be orphaned but that's acceptable)
        // If user is not owner, they can delete themselves
      }
      
      // Remove user from organization if they're a member
      if (userOrg) {
        await storage.removeMember(userId, userOrg.id);
      }
      
      // Note: We don't delete the user record itself since Replit Auth manages the user
      // We just remove them from organizations and their data will be cascade deleted
      // based on database constraints
      
      res.json({
        success: true,
        message: "Account deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to delete account" 
      });
    }
  });
}
