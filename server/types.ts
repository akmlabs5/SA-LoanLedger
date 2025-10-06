import type { IStorage } from "./storage";
import type { Config } from "./config";
import type { Server } from "http";

export interface AppDependencies {
  storage: IStorage;
  config: Config;
  server: Server;
  databaseAvailable: boolean;
}
