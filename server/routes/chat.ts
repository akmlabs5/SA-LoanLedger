import type { Express } from "express";
import type { AppDependencies } from "../types";
import { isAuthenticated } from "../replitAuth";
import { attachOrganizationContext, requireOrganization } from "../organizationMiddleware";
import { insertChatConversationSchema, insertChatMessageSchema } from "@shared/schema";
import multer from "multer";
import path from "path";

const upload = multer({ dest: 'uploads/' });

export function registerChatRoutes(app: Express, deps: AppDependencies) {
  const { storage } = deps;

  // Get all conversations for the current user
  app.get('/api/chat/conversations', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const organizationId = req.organizationId;
      
      const conversations = await storage.getUserConversations(userId, organizationId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Get a specific conversation with messages
  app.get('/api/chat/conversations/:id', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const organizationId = req.organizationId;
      const conversationId = req.params.id;
      
      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation || conversation.userId !== userId || conversation.organizationId !== organizationId) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      const messages = await storage.getConversationMessages(conversationId);
      
      res.json({ conversation, messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  // Create a new conversation
  app.post('/api/chat/conversations', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const organizationId = req.organizationId;
      
      const conversationData = insertChatConversationSchema.parse({
        userId,
        organizationId,
        title: req.body.title || 'New Conversation',
        isActive: true,
      });
      
      const conversation = await storage.createConversation(conversationData);
      res.json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  // Bulk save: Create conversation with all messages at once (transactional)
  app.post('/api/chat/conversations/bulk-save', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const organizationId = req.organizationId;
      
      const { title, messages } = req.body;
      
      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ message: "Messages array is required" });
      }
      
      // Import db for transaction
      const { db } = await import('../db');
      const { chatConversations, chatMessages } = await import('@shared/schema');
      
      // Execute bulk save in a transaction for atomicity
      const conversation = await db.transaction(async (tx) => {
        // Create conversation
        const conversationData = insertChatConversationSchema.parse({
          userId,
          organizationId,
          title: title || 'New Conversation',
          isActive: true,
        });
        
        const [newConversation] = await tx.insert(chatConversations).values(conversationData).returning();
        
        // Bulk insert all messages in the same transaction
        const messageData = messages.map((msg: any) => {
          return insertChatMessageSchema.parse({
            conversationId: newConversation.id,
            role: msg.role,
            content: msg.content,
            metadata: msg.metadata,
          });
        });
        
        await tx.insert(chatMessages).values(messageData);
        
        return newConversation;
      });
      
      res.json(conversation);
    } catch (error) {
      console.error("Error bulk saving conversation:", error);
      res.status(500).json({ message: "Failed to save conversation" });
    }
  });

  // Add a message to a conversation
  app.post('/api/chat/conversations/:id/messages', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const organizationId = req.organizationId;
      const conversationId = req.params.id;
      
      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation || conversation.userId !== userId || conversation.organizationId !== organizationId) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      const messageData = insertChatMessageSchema.parse({
        conversationId,
        role: req.body.role || 'user',
        content: req.body.content,
        metadata: req.body.metadata,
      });
      
      const message = await storage.addMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // Delete a conversation
  app.delete('/api/chat/conversations/:id', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const organizationId = req.organizationId;
      const conversationId = req.params.id;
      
      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation || conversation.userId !== userId || conversation.organizationId !== organizationId) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      await storage.deleteConversation(conversationId);
      res.json({ message: "Conversation deleted successfully" });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ message: "Failed to delete conversation" });
    }
  });

  // Upload a file to a conversation
  app.post('/api/chat/conversations/:id/upload', isAuthenticated, attachOrganizationContext, requireOrganization, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const organizationId = req.organizationId;
      const conversationId = req.params.id;
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation || conversation.userId !== userId || conversation.organizationId !== organizationId) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      const fileName = req.file.originalname;
      
      // For now, return basic file info without text extraction
      // Text extraction can be added later if needed
      res.json({ 
        message: "File upload functionality is not yet implemented",
        fileName
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });
}
