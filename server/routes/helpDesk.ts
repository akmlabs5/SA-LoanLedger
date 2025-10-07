import type { Express } from "express";
import { isAuthenticated } from "../replitAuth";
import { HelpDeskService } from "../helpDeskService";

export function registerHelpDeskRoutes(app: Express) {
  const helpDeskService = new HelpDeskService();

  // Process help desk questions (no conversation history)
  app.post('/api/help/chat', isAuthenticated, async (req: any, res) => {
    try {
      const { question } = req.body;

      if (!question || typeof question !== 'string') {
        return res.status(400).json({ answer: "Question is required" });
      }

      const response = await helpDeskService.processQuestion(question);
      res.json(response);
    } catch (error) {
      console.error("Error processing help desk question:", error);
      res.status(500).json({ 
        answer: "Failed to process help request. Please try again.",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}
