// Referenced from: blueprint:javascript_object_storage - protected file uploading
import type { Express } from "express";
import type { AppDependencies } from "../types";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "../objectStorage";
import { ObjectPermission, ObjectAccessGroupType } from "../objectAcl";
import { isAuthenticated } from "../replitAuth";

// Organization-scoped protected file uploading
export function registerObjectStorageRoutes(app: Express, deps: AppDependencies) {
  const { storage } = deps;

  // Endpoint for serving private objects with organization-based ACL
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req, res) => {
    const userId = req.user?.claims?.sub;
    const objectStorageService = new ObjectStorageService();
    
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      
      if (!canAccess) {
        return res.sendStatus(401);
      }
      
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Endpoint for getting the upload URL for an object entity
  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      return res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  // Endpoint for setting ACL policy after upload (loan documents)
  app.put("/api/objects/loan-documents", isAuthenticated, async (req, res) => {
    if (!req.body.documentURL) {
      return res.status(400).json({ error: "documentURL is required" });
    }

    const userId = req.user?.claims?.sub;
    const organizationId = req.organizationId;

    if (!organizationId) {
      return res.status(400).json({ error: "Organization context required" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.documentURL,
        {
          owner: userId!,
          // Private visibility with organization member access
          visibility: "private",
          aclRules: [
            {
              group: {
                type: ObjectAccessGroupType.ORGANIZATION_MEMBER,
                id: organizationId,
              },
              permission: ObjectPermission.READ,
            },
          ],
        },
      );

      res.status(200).json({
        objectPath: objectPath,
        message: "Document uploaded successfully",
      });
    } catch (error) {
      console.error("Error setting loan document:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Endpoint for setting ACL policy after upload (collateral photos/documents)
  app.put("/api/objects/collateral-documents", isAuthenticated, async (req, res) => {
    if (!req.body.documentURL) {
      return res.status(400).json({ error: "documentURL is required" });
    }

    const userId = req.user?.claims?.sub;
    const organizationId = req.organizationId;

    if (!organizationId) {
      return res.status(400).json({ error: "Organization context required" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.documentURL,
        {
          owner: userId!,
          // Private visibility with organization member access
          visibility: "private",
          aclRules: [
            {
              group: {
                type: ObjectAccessGroupType.ORGANIZATION_MEMBER,
                id: organizationId,
              },
              permission: ObjectPermission.READ,
            },
          ],
        },
      );

      res.status(200).json({
        objectPath: objectPath,
        message: "Collateral document uploaded successfully",
      });
    } catch (error) {
      console.error("Error setting collateral document:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Endpoint for setting ACL policy after upload (guarantee documents)
  app.put("/api/objects/guarantee-documents", isAuthenticated, async (req, res) => {
    if (!req.body.documentURL) {
      return res.status(400).json({ error: "documentURL is required" });
    }

    const userId = req.user?.claims?.sub;
    const organizationId = req.organizationId;

    if (!organizationId) {
      return res.status(400).json({ error: "Organization context required" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.documentURL,
        {
          owner: userId!,
          // Private visibility with organization member access
          visibility: "private",
          aclRules: [
            {
              group: {
                type: ObjectAccessGroupType.ORGANIZATION_MEMBER,
                id: organizationId,
              },
              permission: ObjectPermission.READ,
            },
          ],
        },
      );

      res.status(200).json({
        objectPath: objectPath,
        message: "Guarantee document uploaded successfully",
      });
    } catch (error) {
      console.error("Error setting guarantee document:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}
