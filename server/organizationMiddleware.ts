import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

/**
 * Middleware that attaches organization context to authenticated requests
 * Must be used AFTER authentication middleware
 * 
 * Adds to request:
 * - organizationId: The user's organization ID
 * - organizationName: The organization name
 * - isOrgOwner: Whether the user is the organization owner
 */
export async function attachOrganizationContext(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Get user ID from authentication middleware
    const userId = (req as any).user?.claims?.sub;

    if (!userId) {
      // If no user ID, skip organization context (let auth middleware handle it)
      return next();
    }

    // Get user's organization
    const organization = await storage.getUserOrganization(userId);

    if (!organization) {
      console.warn(`No organization found for user ${userId}`);
      return next();
    }

    // Get organization members to check if user is owner
    const members = await storage.getOrganizationMembers(organization.id);
    const currentMember = members.find(m => m.userId === userId);

    // Attach organization context to request
    (req as any).organizationId = organization.id;
    (req as any).organizationName = organization.name;
    (req as any).isOrgOwner = currentMember?.isOwner || false;

    next();
  } catch (error) {
    console.error("Organization context middleware error:", error);
    // Don't fail the request, just log the error and continue
    next();
  }
}

/**
 * Middleware that requires organization context to be present
 * Returns 404 if user has no organization
 */
export function requireOrganization(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const organizationId = (req as any).organizationId;

  if (!organizationId) {
    return res.status(404).json({
      success: false,
      message: "Organization not found"
    });
  }

  next();
}

/**
 * Middleware that requires user to be organization owner
 * Must be used AFTER attachOrganizationContext
 */
export function requireOrgOwner(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const isOrgOwner = (req as any).isOrgOwner;

  if (!isOrgOwner) {
    return res.status(403).json({
      success: false,
      message: "Only organization owners can perform this action"
    });
  }

  next();
}
