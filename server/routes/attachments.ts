import type { Express } from "express";
import type { AppDependencies } from "../types";
import { isAuthenticated } from "../replitAuth";
import {
  insertAttachmentSchema,
  insertAttachmentAuditSchema,
  attachmentUploadIntentSchema,
  updateAttachmentMetaSchema,
  attachmentOwnerTypeZodEnum,
} from "@shared/schema";
import { z } from "zod";
import crypto from "crypto";

export function registerAttachmentsRoutes(app: Express, deps: AppDependencies) {
  const { storage } = deps;

  app.post('/api/attachments/upload-intent', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const uploadData = attachmentUploadIntentSchema.parse(req.body);
      
      // Generate storage key
      const timestamp = new Date().toISOString().slice(0, 7); // YYYY-MM format
      const fileId = crypto.randomUUID();
      const sanitizedFileName = uploadData.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storageKey = `attachments/${uploadData.ownerType}/${uploadData.ownerId}/${timestamp}/${fileId}_${sanitizedFileName}`;
      
      // For now, we'll return a mock signed URL since object storage integration will be added later
      const signedUrl = `${process.env.PUBLIC_OBJECT_SEARCH_PATHS || '/storage'}/${storageKey}`;
      
      res.json({
        storageKey,
        uploadUrl: signedUrl,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
      });
    } catch (error) {
      console.error('Error creating upload intent:', error);
      res.status(400).json({ message: 'Failed to create upload intent' });
    }
  });

  app.post('/api/attachments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const attachmentData = insertAttachmentSchema.parse({
        ...req.body,
        userId,
        uploadedBy: userId,
      });
      
      const attachment = await storage.createAttachment(attachmentData);
      
      // Log audit trail
      await storage.createAttachmentAudit({
        attachmentId: attachment.id,
        userId,
        action: 'upload',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { fileName: attachment.fileName, fileSize: attachment.fileSize },
      });
      
      res.status(201).json(attachment);
    } catch (error) {
      console.error('Error creating attachment:', error);
      res.status(400).json({ message: 'Failed to create attachment' });
    }
  });

  app.get('/api/attachments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate query parameters with Zod
      const querySchema = z.object({
        ownerType: attachmentOwnerTypeZodEnum,
        ownerId: z.string().min(1),
      });
      
      const { ownerType, ownerId } = querySchema.parse(req.query);
      
      const attachments = await storage.getAttachmentsByOwner(
        ownerType,
        ownerId,
        userId
      );
      
      res.json(attachments);
    } catch (error) {
      console.error('Error fetching attachments:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid query parameters', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to fetch attachments' });
      }
    }
  });

  app.get('/api/attachments/:attachmentId/download', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { attachmentId } = req.params;
      
      const attachment = await storage.getAttachmentById(attachmentId, userId);
      if (!attachment) {
        return res.status(404).json({ message: 'Attachment not found' });
      }
      
      // Generate signed download URL (mock for now)
      const downloadUrl = `${process.env.PUBLIC_OBJECT_SEARCH_PATHS || '/storage'}/${attachment.storageKey}`;
      
      // Log audit trail
      await storage.createAttachmentAudit({
        attachmentId: attachment.id,
        userId,
        action: 'download',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { fileName: attachment.fileName },
      });
      
      res.json({
        downloadUrl,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
        fileName: attachment.fileName,
        contentType: attachment.contentType,
      });
    } catch (error) {
      console.error('Error getting attachment download URL:', error);
      res.status(500).json({ message: 'Failed to get download URL' });
    }
  });

  app.patch('/api/attachments/:attachmentId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { attachmentId } = req.params;
      const metadata = updateAttachmentMetaSchema.parse(req.body);
      
      const attachment = await storage.updateAttachmentMetadata(attachmentId, metadata, userId);
      
      // Log audit trail
      await storage.createAttachmentAudit({
        attachmentId: attachment.id,
        userId,
        action: 'update_meta',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { changes: metadata },
      });
      
      res.json(attachment);
    } catch (error) {
      console.error('Error updating attachment metadata:', error);
      res.status(400).json({ message: 'Failed to update attachment metadata' });
    }
  });

  app.delete('/api/attachments/:attachmentId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { attachmentId } = req.params;
      
      await storage.deleteAttachment(attachmentId, userId);
      
      // Log audit trail
      await storage.createAttachmentAudit({
        attachmentId,
        userId,
        action: 'delete',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: {},
      });
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting attachment:', error);
      res.status(500).json({ message: 'Failed to delete attachment' });
    }
  });

  app.get('/api/attachments/:attachmentId/audit', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { attachmentId } = req.params;
      
      // Verify user has access to the attachment
      const attachment = await storage.getAttachmentById(attachmentId, userId);
      if (!attachment) {
        return res.status(404).json({ message: 'Attachment not found' });
      }
      
      const auditTrail = await storage.getAttachmentAuditTrail(attachmentId);
      res.json(auditTrail);
    } catch (error) {
      console.error('Error fetching attachment audit trail:', error);
      res.status(500).json({ message: 'Failed to fetch audit trail' });
    }
  });
}
