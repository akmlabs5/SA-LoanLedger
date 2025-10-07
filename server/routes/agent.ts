import type { Express } from "express";
import type { AppDependencies } from "../types";
import { isAuthenticated } from "../replitAuth";
import { AgentService } from "../agentService";

export function registerAgentRoutes(app: Express, deps: AppDependencies) {
  const { storage } = deps;
  const agentService = new AgentService(storage);

  // Process agentic chat messages
  app.post('/api/agent/chat', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { messages } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ message: "Messages array is required" });
      }

      const response = await agentService.processChat(messages, userId);
      res.json(response);
    } catch (error) {
      console.error("Error processing agent chat:", error);
      res.status(500).json({ 
        message: "Failed to process agent request",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}
