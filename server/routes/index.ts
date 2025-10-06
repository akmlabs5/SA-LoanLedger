import type { Express } from "express";
import type { AppDependencies } from "../types";
import { registerAuthRoutes } from "./auth";
import { registerBanksRoutes } from "./banks";
import { registerDashboardRoutes } from "./dashboard";
import { registerFacilitiesRoutes } from "./facilities";
import { registerCollateralRoutes } from "./collateral";
import { registerLoansRoutes } from "./loans";
import { registerAdminRoutes } from "./admin";
import { registerAiRoutes } from "./ai";
import { registerRemindersRoutes } from "./reminders";
import { registerGuaranteesRoutes } from "./guarantees";
import { registerAttachmentsRoutes } from "./attachments";
import { registerMiscRoutes } from "./misc";

export function registerAllRoutes(app: Express, deps: AppDependencies) {
  registerAuthRoutes(app, deps);
  registerBanksRoutes(app, deps);
  registerDashboardRoutes(app, deps);
  registerFacilitiesRoutes(app, deps);
  registerCollateralRoutes(app, deps);
  registerLoansRoutes(app, deps);
  registerAdminRoutes(app, deps);
  registerAiRoutes(app, deps);
  registerRemindersRoutes(app, deps);
  registerGuaranteesRoutes(app, deps);
  registerAttachmentsRoutes(app, deps);
  registerMiscRoutes(app, deps);
}
