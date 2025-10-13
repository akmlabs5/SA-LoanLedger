import type { Express } from "express";
import type { AppDependencies } from "../types";
import { isAuthenticated } from "../replitAuth";
import { attachOrganizationContext, requireOrganization } from "../organizationMiddleware";
import multer from "multer";
import { ObjectStorageService } from "../objectStorage";
import { ObjectAccessGroupType, ObjectPermission } from "../objectAcl";
import { ObjectNotFoundError } from "../objectStorage";

// Configure multer for memory storage (temporary)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

export function registerDocumentsRoutes(app: Express, deps: AppDependencies) {
  const { storage } = deps;

  // Upload document endpoint (connects existing DocumentUpload component to object storage)
  app.post("/api/documents/upload", isAuthenticated, attachOrganizationContext, requireOrganization, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const { entityType, entityId, category, description } = req.body;
      const userId = req.user?.claims?.sub;
      const organizationId = req.organizationId;

      if (!organizationId) {
        return res.status(400).json({ error: "Organization context required" });
      }

      // Get upload URL from object storage
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();

      // Upload file to object storage using the presigned URL
      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: req.file.buffer,
        headers: {
          'Content-Type': req.file.mimetype,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to storage');
      }

      // Set ACL policy for the uploaded file
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        uploadURL,
        {
          owner: userId!,
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

      // Create attachment record in database
      const attachment = await storage.createAttachment({
        ownerType: entityType as any,
        ownerId: entityId,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        fileUrl: objectPath, // Store the object storage path
        userId: userId!,
        category: category || 'other',
        description: description || null,
      });

      res.status(200).json({
        success: true,
        document: attachment,
        message: "Document uploaded successfully",
      });

    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ 
        error: "Failed to upload document",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get documents for entity
  app.get("/api/documents/:entityType/:entityId", isAuthenticated, async (req, res) => {
    try {
      const { entityType, entityId } = req.params;
      const userId = req.user?.claims?.sub;

      const documents = await storage.getAttachmentsByOwner(
        entityType as any,
        entityId,
        userId!
      );

      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  // Delete document
  app.delete("/api/documents/:documentId", isAuthenticated, async (req, res) => {
    try {
      const { documentId } = req.params;
      const userId = req.user?.claims?.sub;

      await storage.deleteAttachment(documentId, userId!);

      res.json({ success: true, message: "Document deleted successfully" });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });
}
