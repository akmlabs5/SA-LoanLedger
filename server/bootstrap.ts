import type { Express } from "express";
import { createServer, type Server } from "http";
import cookieParser from "cookie-parser";
import { createStorage, type IStorage, initializeStorage } from "./storage";
import { setupAuth } from "./replitAuth";
import { initializeDatabase } from "./db";
import { config } from "./config";
import type { AppDependencies } from "./types";

let globalStorage: IStorage;

export async function initializeApp(app: Express): Promise<AppDependencies> {
  const databaseAvailable = await initializeDatabase();
  
  globalStorage = createStorage(databaseAvailable);
  
  initializeStorage(databaseAvailable);
  
  app.use(cookieParser());
  
  await setupAuth(app, databaseAvailable);

  await initializeDefaultBanks();

  const httpServer = createServer(app);

  return {
    storage: globalStorage,
    config: config.getAll(),
    server: httpServer,
    databaseAvailable,
  };
}

async function initializeDefaultBanks() {
  try {
    const existingBanks = await globalStorage.getAllBanks();
    
    if (existingBanks.length === 0) {
      const saudiBanks = [
        { name: "Arab National Bank", code: "ANB" },
        { name: "Al Rajhi Bank", code: "RJH" },
        { name: "Alinma Bank", code: "INMA" },
        { name: "Bank Albilad", code: "ALB" },
        { name: "Bank AlJazira", code: "BJA" },
        { name: "Banque Saudi Fransi", code: "BSF" },
        { name: "Riyad Bank", code: "RIB" },
        { name: "Saudi Awwal Bank", code: "SAB" },
        { name: "Saudi Investment Bank", code: "SAIB" },
        { name: "Saudi National Bank", code: "SNB" },
      ];

      for (const bank of saudiBanks) {
        await globalStorage.createBank(bank);
      }
      
      console.log("Default Saudi banks initialized");
    }
  } catch (error) {
    console.error("Error initializing default banks:", error);
  }
}
