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
import { registerAgentRoutes } from "./agent";
import { registerHelpDeskRoutes } from "./helpDesk";
import { registerOrganizationRoutes } from "./organization";
import { registerReportsRoutes } from "./reports";
import { registerObjectStorageRoutes } from "./objectStorage";

export function registerAllRoutes(app: Express, deps: AppDependencies) {
  registerAuthRoutes(app, deps);
  registerBanksRoutes(app, deps);
  registerDashboardRoutes(app, deps);
  registerFacilitiesRoutes(app, deps);
  registerCollateralRoutes(app, deps);
  registerLoansRoutes(app, deps);
  registerAdminRoutes(app, deps);
  registerAiRoutes(app, deps);
  registerAgentRoutes(app, deps);
  registerHelpDeskRoutes(app);
  registerRemindersRoutes(app, deps);
  registerGuaranteesRoutes(app, deps);
  registerAttachmentsRoutes(app, deps);
  registerMiscRoutes(app, deps);
  registerOrganizationRoutes(app, deps);
  registerReportsRoutes(app, deps);
  registerObjectStorageRoutes(app, deps);
}
