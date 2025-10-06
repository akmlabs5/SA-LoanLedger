import type { Express } from "express";
import { isAuthenticated } from "../replitAuth";
import type { IStorage } from "../storage";

export function registerAuthRoutes(app: Express, storage: IStorage) {
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let user = await storage.getUser(userId);
      
      // If user doesn't exist in storage (development mode), create it
      if (!user) {
        user = await storage.upsertUser({
          id: userId,
          email: req.user.claims.email || 'developer@test.com',
          firstName: req.user.claims.first_name || 'Test',
          lastName: req.user.claims.last_name || 'Developer',
          profileImageUrl: req.user.claims.profile_image_url || null,
        });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}
