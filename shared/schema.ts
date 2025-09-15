import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  integer,
  boolean,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Saudi Banks
export const banks = pgTable("banks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bank Facilities
export const facilities = pgTable("facilities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bankId: varchar("bank_id").references(() => banks.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  facilityType: varchar("facility_type", { length: 50 }).notNull(), // 'revolving', 'term', 'bullet', 'bridge', 'working_capital'
  creditLimit: decimal("credit_limit", { precision: 15, scale: 2 }).notNull(),
  costOfFunding: decimal("cost_of_funding", { precision: 5, scale: 2 }).notNull(), // SIBOR + margin
  startDate: date("start_date").notNull(),
  expiryDate: date("expiry_date").notNull(),
  terms: text("terms"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Collateral
export const collateral = pgTable("collateral", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'real_estate', 'liquid_stocks', 'other'
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  currentValue: decimal("current_value", { precision: 15, scale: 2 }).notNull(),
  valuationDate: date("valuation_date").notNull(),
  valuationSource: varchar("valuation_source", { length: 100 }),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Loans
export const loans = pgTable("loans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  facilityId: varchar("facility_id").references(() => facilities.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  referenceNumber: varchar("reference_number", { length: 50 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  startDate: date("start_date").notNull(),
  dueDate: date("due_date").notNull(),
  chargesDueDate: date("charges_due_date"),
  siborRate: decimal("sibor_rate", { precision: 5, scale: 2 }).notNull(),
  bankRate: decimal("bank_rate", { precision: 5, scale: 2 }).notNull(),
  notes: text("notes"),
  status: varchar("status", { length: 20 }).default('active'), // 'active', 'settled', 'overdue'
  settledDate: date("settled_date"),
  settledAmount: decimal("settled_amount", { precision: 15, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI Insights Configuration
export const aiInsightConfig = pgTable("ai_insight_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  concentrationRiskThreshold: decimal("concentration_risk_threshold", { precision: 5, scale: 2 }).default('40.00'),
  ltvOutstandingThreshold: decimal("ltv_outstanding_threshold", { precision: 5, scale: 2 }).default('75.00'),
  ltvLimitThreshold: decimal("ltv_limit_threshold", { precision: 5, scale: 2 }).default('90.00'),
  cashFlowStrainThreshold: decimal("cash_flow_strain_threshold", { precision: 5, scale: 2 }).default('20.00'),
  rateDifferentialThreshold: decimal("rate_differential_threshold", { precision: 5, scale: 2 }).default('0.50'),
  dueDateAlertDays: integer("due_date_alert_days").default(30),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Document Attachments
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  loanId: varchar("loan_id").references(() => loans.id),
  facilityId: varchar("facility_id").references(() => facilities.id),
  collateralId: varchar("collateral_id").references(() => collateral.id),
  userId: varchar("user_id").references(() => users.id).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(),
  fileSize: integer("file_size").notNull(),
  fileUrl: text("file_url").notNull(),
  version: integer("version").default(1),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  facilities: many(facilities),
  loans: many(loans),
  collateral: many(collateral),
  documents: many(documents),
  aiInsightConfig: one(aiInsightConfig),
}));

export const banksRelations = relations(banks, ({ many }) => ({
  facilities: many(facilities),
}));

export const facilitiesRelations = relations(facilities, ({ one, many }) => ({
  bank: one(banks, {
    fields: [facilities.bankId],
    references: [banks.id],
  }),
  user: one(users, {
    fields: [facilities.userId],
    references: [users.id],
  }),
  loans: many(loans),
  documents: many(documents),
}));

export const loansRelations = relations(loans, ({ one, many }) => ({
  facility: one(facilities, {
    fields: [loans.facilityId],
    references: [facilities.id],
  }),
  user: one(users, {
    fields: [loans.userId],
    references: [users.id],
  }),
  documents: many(documents),
}));

export const collateralRelations = relations(collateral, ({ one, many }) => ({
  user: one(users, {
    fields: [collateral.userId],
    references: [users.id],
  }),
  documents: many(documents),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  loan: one(loans, {
    fields: [documents.loanId],
    references: [loans.id],
  }),
  facility: one(facilities, {
    fields: [documents.facilityId],
    references: [facilities.id],
  }),
  collateral: one(collateral, {
    fields: [documents.collateralId],
    references: [collateral.id],
  }),
  user: one(users, {
    fields: [documents.userId],
    references: [users.id],
  }),
}));

export const aiInsightConfigRelations = relations(aiInsightConfig, ({ one }) => ({
  user: one(users, {
    fields: [aiInsightConfig.userId],
    references: [users.id],
  }),
}));

// Insert Schemas
export const insertBankSchema = createInsertSchema(banks).omit({ id: true, createdAt: true });
export const insertFacilitySchema = createInsertSchema(facilities).omit({ id: true, createdAt: true });
export const insertCollateralSchema = createInsertSchema(collateral).omit({ id: true, createdAt: true });
export const insertLoanSchema = createInsertSchema(loans).omit({ id: true, createdAt: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, createdAt: true });
export const insertAiInsightConfigSchema = createInsertSchema(aiInsightConfig).omit({ id: true, updatedAt: true });

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Bank = typeof banks.$inferSelect;
export type InsertBank = z.infer<typeof insertBankSchema>;
export type Facility = typeof facilities.$inferSelect;
export type InsertFacility = z.infer<typeof insertFacilitySchema>;
export type Collateral = typeof collateral.$inferSelect;
export type InsertCollateral = z.infer<typeof insertCollateralSchema>;
export type Loan = typeof loans.$inferSelect;
export type InsertLoan = z.infer<typeof insertLoanSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type AiInsightConfig = typeof aiInsightConfig.$inferSelect;
export type InsertAiInsightConfig = z.infer<typeof insertAiInsightConfigSchema>;
