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
  unique,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const transactionTypeEnum = pgEnum('transaction_type', [
  'draw',
  'repayment', 
  'fee',
  'interest',
  'limit_change',
  'other'
]);

export const facilityTypeEnum = pgEnum('facility_type', [
  'revolving',
  'term',
  'bullet', 
  'bridge',
  'working_capital'
]);

export const collateralTypeEnum = pgEnum('collateral_type', [
  'real_estate',
  'liquid_stocks',
  'other'
]);

export const loanStatusEnum = pgEnum('loan_status', [
  'active',
  'settled',
  'overdue'
]);

export const creditLineTypeEnum = pgEnum('credit_line_type', [
  'working_capital',
  'term_loan',
  'trade_finance',
  'real_estate_finance',
  'equipment_finance',
  'overdraft',
  'letter_of_credit',
  'bank_guarantee',
  'other'
]);

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

// Bank Contacts (Account Managers)
export const bankContacts = pgTable("bank_contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bankId: varchar("bank_id").references(() => banks.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  title: varchar("title", { length: 100 }),
  department: varchar("department", { length: 100 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  mobile: varchar("mobile", { length: 50 }),
  extension: varchar("extension", { length: 20 }),
  notes: text("notes"),
  isPrimary: boolean("is_primary").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_bank_contacts_bank").on(table.bankId),
  index("idx_bank_contacts_user").on(table.userId),
]);

// Bank Facilities
export const facilities = pgTable("facilities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bankId: varchar("bank_id").references(() => banks.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  facilityType: facilityTypeEnum("facility_type").notNull(),
  creditLimit: decimal("credit_limit", { precision: 15, scale: 2 }).notNull(),
  costOfFunding: decimal("cost_of_funding", { precision: 5, scale: 2 }).notNull(), // SIBOR + margin
  startDate: date("start_date").notNull(),
  expiryDate: date("expiry_date").notNull(),
  terms: text("terms"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Credit Lines (intermediate layer between facilities and loans)
export const creditLines = pgTable("credit_lines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  facilityId: varchar("facility_id").references(() => facilities.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  creditLineType: creditLineTypeEnum("credit_line_type").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  creditLimit: decimal("credit_limit", { precision: 15, scale: 2 }).notNull(),
  availableLimit: decimal("available_limit", { precision: 15, scale: 2 }).notNull().default('0.00'),
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }), // Optional override of facility rate
  terms: text("terms"),
  startDate: date("start_date"),
  expiryDate: date("expiry_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Ensure credit line limit doesn't exceed facility limit via application logic
  index("idx_credit_lines_facility").on(table.facilityId),
  index("idx_credit_lines_user").on(table.userId),
]);

// Collateral
export const collateral = pgTable("collateral", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: collateralTypeEnum("type").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  currentValue: decimal("current_value", { precision: 15, scale: 2 }).notNull(),
  valuationDate: date("valuation_date").notNull(),
  valuationSource: varchar("valuation_source", { length: 100 }),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Loans (drawdowns from specific credit lines)
export const loans = pgTable("loans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creditLineId: varchar("credit_line_id").references(() => creditLines.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  referenceNumber: varchar("reference_number", { length: 50 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  startDate: date("start_date").notNull(),
  dueDate: date("due_date").notNull(),
  chargesDueDate: date("charges_due_date"),
  siborRate: decimal("sibor_rate", { precision: 5, scale: 2 }).notNull(),
  bankRate: decimal("bank_rate", { precision: 5, scale: 2 }).notNull(),
  notes: text("notes"),
  status: loanStatusEnum("status").default('active'),
  settledDate: date("settled_date"),
  settledAmount: decimal("settled_amount", { precision: 15, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_loans_credit_line").on(table.creditLineId),
  index("idx_loans_user").on(table.userId),
  index("idx_loans_due_date").on(table.dueDate),
]);

// Loan Templates for Saudi Banking Standards
export const loanTemplates = pgTable("loan_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  loanType: varchar("loan_type", { length: 50 }).notNull(), // working_capital, term_loan, trade_finance, etc.
  creditLineType: creditLineTypeEnum("credit_line_type").notNull(),
  defaultDurationMonths: integer("default_duration_months").notNull(),
  minAmount: decimal("min_amount", { precision: 15, scale: 2 }),
  maxAmount: decimal("max_amount", { precision: 15, scale: 2 }),
  defaultInterestMargin: decimal("default_interest_margin", { precision: 5, scale: 2 }).notNull(), // Margin over SIBOR
  repaymentStructure: varchar("repayment_structure", { length: 50 }).notNull(), // bullet, installments, revolving
  requiredDocuments: text("required_documents").array(), // Array of required document types
  collateralRequired: boolean("collateral_required").default(false),
  termsAndConditions: text("terms_and_conditions"),
  eligibilityCriteria: text("eligibility_criteria"),
  isActive: boolean("is_active").default(true),
  isSystemTemplate: boolean("is_system_template").default(false), // True for built-in Saudi templates
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_loan_templates_type").on(table.loanType),
  index("idx_loan_templates_credit_line_type").on(table.creditLineType),
]);

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

// Exposure Snapshots for tracking exposure over time
export const exposureSnapshots = pgTable("exposure_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  date: date("date").notNull(),
  bankId: varchar("bank_id").references(() => banks.id), // nullable for total aggregation
  facilityId: varchar("facility_id").references(() => facilities.id), // optional for facility-specific snapshots
  outstanding: decimal("outstanding", { precision: 15, scale: 2 }).notNull(),
  creditLimit: decimal("credit_limit", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Prevent duplicate global totals (where both bankId and facilityId are NULL)
  uniqueIndex("unique_global_exposure").on(table.userId, table.date).where(sql`${table.bankId} IS NULL AND ${table.facilityId} IS NULL`),
  
  // Prevent duplicate bank-level totals (where facilityId is NULL but bankId is not NULL)
  uniqueIndex("unique_bank_exposure").on(table.userId, table.date, table.bankId).where(sql`${table.facilityId} IS NULL AND ${table.bankId} IS NOT NULL`),
  
  // Prevent duplicate facility-level snapshots (where both bankId and facilityId are not NULL)
  uniqueIndex("unique_facility_exposure").on(table.userId, table.date, table.bankId, table.facilityId).where(sql`${table.bankId} IS NOT NULL AND ${table.facilityId} IS NOT NULL`),
  
  // Performance indexes for common queries
  index("idx_exposure_user_date").on(table.userId, table.date),
  index("idx_exposure_user_bank_date").on(table.userId, table.bankId, table.date),
  index("idx_exposure_user_bank_facility_date").on(table.userId, table.bankId, table.facilityId, table.date),
]);

// Transaction History
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  date: date("date").notNull(),
  bankId: varchar("bank_id").references(() => banks.id).notNull(),
  facilityId: varchar("facility_id").references(() => facilities.id),
  loanId: varchar("loan_id").references(() => loans.id),
  type: transactionTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  reference: varchar("reference", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Performance indexes for common queries
  index("idx_transaction_user_date").on(table.userId, table.date),
  index("idx_transaction_user_bank_date").on(table.userId, table.bankId, table.date),
  index("idx_transaction_type_date").on(table.type, table.date),
]);

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  facilities: many(facilities),
  creditLines: many(creditLines),
  loans: many(loans),
  collateral: many(collateral),
  documents: many(documents),
  aiInsightConfig: one(aiInsightConfig),
  exposureSnapshots: many(exposureSnapshots),
  transactions: many(transactions),
  bankContacts: many(bankContacts),
}));

export const banksRelations = relations(banks, ({ many }) => ({
  facilities: many(facilities),
  exposureSnapshots: many(exposureSnapshots),
  transactions: many(transactions),
  contacts: many(bankContacts),
}));

export const bankContactsRelations = relations(bankContacts, ({ one }) => ({
  bank: one(banks, {
    fields: [bankContacts.bankId],
    references: [banks.id],
  }),
  user: one(users, {
    fields: [bankContacts.userId],
    references: [users.id],
  }),
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
  creditLines: many(creditLines),
  documents: many(documents),
  exposureSnapshots: many(exposureSnapshots),
  transactions: many(transactions),
}));

export const creditLinesRelations = relations(creditLines, ({ one, many }) => ({
  facility: one(facilities, {
    fields: [creditLines.facilityId],
    references: [facilities.id],
  }),
  user: one(users, {
    fields: [creditLines.userId],
    references: [users.id],
  }),
  loans: many(loans),
}));

export const loansRelations = relations(loans, ({ one, many }) => ({
  creditLine: one(creditLines, {
    fields: [loans.creditLineId],
    references: [creditLines.id],
  }),
  user: one(users, {
    fields: [loans.userId],
    references: [users.id],
  }),
  documents: many(documents),
  transactions: many(transactions),
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

export const exposureSnapshotsRelations = relations(exposureSnapshots, ({ one }) => ({
  user: one(users, {
    fields: [exposureSnapshots.userId],
    references: [users.id],
  }),
  bank: one(banks, {
    fields: [exposureSnapshots.bankId],
    references: [banks.id],
  }),
  facility: one(facilities, {
    fields: [exposureSnapshots.facilityId],
    references: [facilities.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  bank: one(banks, {
    fields: [transactions.bankId],
    references: [banks.id],
  }),
  facility: one(facilities, {
    fields: [transactions.facilityId],
    references: [facilities.id],
  }),
  loan: one(loans, {
    fields: [transactions.loanId],
    references: [loans.id],
  }),
}));

export const loanTemplatesRelations = relations(loanTemplates, ({ many }) => ({
  // No explicit foreign key relations as templates are standalone reference data
}));

// Zod Enums for validation
export const transactionTypeZodEnum = z.enum(['draw', 'repayment', 'fee', 'interest', 'limit_change', 'other']);
export const facilityTypeZodEnum = z.enum(['revolving', 'term', 'bullet', 'bridge', 'working_capital']);
export const creditLineTypeZodEnum = z.enum(['working_capital', 'term_loan', 'trade_finance', 'real_estate_finance', 'equipment_finance', 'overdraft', 'letter_of_credit', 'bank_guarantee', 'other']);
export const loanTypeZodEnum = z.enum(['working_capital', 'term_loan', 'trade_finance', 'real_estate_finance', 'equipment_finance', 'revolving_credit', 'overdraft', 'letter_of_credit', 'bank_guarantee', 'bridge_loan', 'murabaha', 'ijara', 'other']);
export const repaymentStructureZodEnum = z.enum(['bullet', 'installments', 'revolving', 'quarterly', 'semi_annual', 'annual', 'on_demand']);
export const collateralTypeZodEnum = z.enum(['real_estate', 'liquid_stocks', 'other']);
export const loanStatusZodEnum = z.enum(['active', 'settled', 'overdue']);

// Helper function to validate decimal strings
const decimalString = (precision: number, scale: number) => 
  z.string()
    .refine((val) => !isNaN(Number(val)), "Must be a valid number")
    .refine((val) => Number(val) >= 0, "Must be non-negative")
    .refine((val) => {
      const [integer, decimal] = val.split('.');
      const integerLength = integer?.length || 0;
      const decimalLength = decimal?.length || 0;
      return integerLength <= (precision - scale) && decimalLength <= scale;
    }, `Must have at most ${precision - scale} integer digits and ${scale} decimal places`);

const positiveDecimalString = (precision: number, scale: number) => 
  z.string()
    .refine((val) => !isNaN(Number(val)), "Must be a valid number")
    .refine((val) => Number(val) > 0, "Must be positive")
    .refine((val) => {
      const [integer, decimal] = val.split('.');
      const integerLength = integer?.length || 0;
      const decimalLength = decimal?.length || 0;
      return integerLength <= (precision - scale) && decimalLength <= scale;
    }, `Must have at most ${precision - scale} integer digits and ${scale} decimal places`);

// Insert Schemas with enhanced validation
export const insertBankSchema = createInsertSchema(banks).omit({ id: true, createdAt: true });

export const insertBankContactSchema = createInsertSchema(bankContacts)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
    title: z.string().max(100, "Title must be less than 100 characters").optional(),
    department: z.string().max(100, "Department must be less than 100 characters").optional(),
    email: z.string().email("Must be a valid email address").optional(),
    phone: z.string().max(50, "Phone must be less than 50 characters").optional(),
    mobile: z.string().max(50, "Mobile must be less than 50 characters").optional(),
    extension: z.string().max(20, "Extension must be less than 20 characters").optional(),
    notes: z.string().optional(),
    isPrimary: z.boolean().default(false),
  });

export const insertFacilitySchema = createInsertSchema(facilities)
  .omit({ id: true, createdAt: true })
  .extend({
    facilityType: facilityTypeZodEnum,
    creditLimit: positiveDecimalString(15, 2),
    costOfFunding: z.string()
      .refine((val) => !isNaN(Number(val)), "Must be a valid number")
      .refine((val) => Number(val) >= 0, "Must be non-negative")
      .refine((val) => Number(val) <= 100, "Must be 100% or less"),
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Must be a valid date"),
    expiryDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Must be a valid date"),
  });

export const insertCreditLineSchema = createInsertSchema(creditLines)
  .omit({ id: true, createdAt: true, availableLimit: true })
  .extend({
    creditLineType: creditLineTypeZodEnum,
    creditLimit: positiveDecimalString(15, 2),
    interestRate: z.string()
      .refine((val) => !isNaN(Number(val)), "Must be a valid number")
      .refine((val) => Number(val) >= 0, "Must be non-negative")
      .refine((val) => Number(val) <= 100, "Must be 100% or less")
      .optional(),
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Must be a valid date").optional(),
    expiryDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Must be a valid date").optional(),
  });

export const insertLoanTemplateSchema = createInsertSchema(loanTemplates)
  .omit({ id: true, createdAt: true })
  .extend({
    loanType: loanTypeZodEnum,
    creditLineType: creditLineTypeZodEnum,
    repaymentStructure: repaymentStructureZodEnum,
    defaultInterestMargin: z.string()
      .refine((val) => !isNaN(Number(val)), "Must be a valid number")
      .refine((val) => Number(val) >= 0, "Must be non-negative")
      .refine((val) => Number(val) <= 10, "Must be 10% or less"),
    minAmount: positiveDecimalString(15, 2).optional(),
    maxAmount: positiveDecimalString(15, 2).optional(),
    defaultDurationMonths: z.number().int().positive("Duration must be positive"),
    requiredDocuments: z.array(z.string()).optional(),
  });

export const insertCollateralSchema = createInsertSchema(collateral)
  .omit({ id: true, createdAt: true })
  .extend({
    type: collateralTypeZodEnum,
    currentValue: positiveDecimalString(15, 2),
    valuationDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Must be a valid date"),
  });

export const insertLoanSchema = createInsertSchema(loans)
  .omit({ id: true, createdAt: true })
  .extend({
    amount: positiveDecimalString(15, 2),
    siborRate: z.string()
      .refine((val) => !isNaN(Number(val)), "Must be a valid number")
      .refine((val) => Number(val) >= 0, "Must be non-negative")
      .refine((val) => Number(val) <= 100, "Must be 100% or less"),
    bankRate: z.string()
      .refine((val) => !isNaN(Number(val)), "Must be a valid number")
      .refine((val) => Number(val) >= 0, "Must be non-negative")
      .refine((val) => Number(val) <= 100, "Must be 100% or less"),
    status: loanStatusZodEnum.optional(),
    settledAmount: z.string()
      .refine((val) => !isNaN(Number(val)), "Must be a valid number")
      .refine((val) => Number(val) >= 0, "Must be non-negative")
      .optional(),
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Must be a valid date"),
    dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Must be a valid date"),
  });

export const insertDocumentSchema = createInsertSchema(documents)
  .omit({ id: true, createdAt: true })
  .extend({
    fileSize: z.number().int().positive("File size must be positive"),
    version: z.number().int().positive("Version must be positive").optional(),
  });

export const insertAiInsightConfigSchema = createInsertSchema(aiInsightConfig)
  .omit({ id: true, updatedAt: true })
  .extend({
    concentrationRiskThreshold: z.string()
      .refine((val) => !isNaN(Number(val)), "Must be a valid number")
      .refine((val) => Number(val) >= 0 && Number(val) <= 100, "Must be between 0 and 100")
      .optional(),
    ltvOutstandingThreshold: z.string()
      .refine((val) => !isNaN(Number(val)), "Must be a valid number")
      .refine((val) => Number(val) >= 0 && Number(val) <= 100, "Must be between 0 and 100")
      .optional(),
    ltvLimitThreshold: z.string()
      .refine((val) => !isNaN(Number(val)), "Must be a valid number")
      .refine((val) => Number(val) >= 0 && Number(val) <= 100, "Must be between 0 and 100")
      .optional(),
    cashFlowStrainThreshold: z.string()
      .refine((val) => !isNaN(Number(val)), "Must be a valid number")
      .refine((val) => Number(val) >= 0 && Number(val) <= 100, "Must be between 0 and 100")
      .optional(),
    rateDifferentialThreshold: z.string()
      .refine((val) => !isNaN(Number(val)), "Must be a valid number")
      .refine((val) => Number(val) >= 0, "Must be non-negative")
      .optional(),
    dueDateAlertDays: z.number().int().nonnegative("Must be non-negative").optional(),
  });

export const insertExposureSnapshotSchema = createInsertSchema(exposureSnapshots)
  .omit({ id: true, createdAt: true })
  .extend({
    outstanding: decimalString(15, 2),
    creditLimit: positiveDecimalString(15, 2),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), "Must be a valid date"),
  });

export const insertTransactionSchema = createInsertSchema(transactions)
  .omit({ id: true, createdAt: true })
  .extend({
    type: transactionTypeZodEnum,
    amount: decimalString(15, 2),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), "Must be a valid date"),
  });

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Bank = typeof banks.$inferSelect;
export type InsertBank = z.infer<typeof insertBankSchema>;
export type BankContact = typeof bankContacts.$inferSelect;
export type InsertBankContact = z.infer<typeof insertBankContactSchema>;
export type Facility = typeof facilities.$inferSelect;
export type InsertFacility = z.infer<typeof insertFacilitySchema>;
export type CreditLine = typeof creditLines.$inferSelect;
export type InsertCreditLine = z.infer<typeof insertCreditLineSchema>;
export type Collateral = typeof collateral.$inferSelect;
export type InsertCollateral = z.infer<typeof insertCollateralSchema>;
export type Loan = typeof loans.$inferSelect;
export type InsertLoan = z.infer<typeof insertLoanSchema>;
export type LoanTemplate = typeof loanTemplates.$inferSelect;
export type InsertLoanTemplate = z.infer<typeof insertLoanTemplateSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type AiInsightConfig = typeof aiInsightConfig.$inferSelect;
export type InsertAiInsightConfig = z.infer<typeof insertAiInsightConfigSchema>;
export type ExposureSnapshot = typeof exposureSnapshots.$inferSelect;
export type InsertExposureSnapshot = z.infer<typeof insertExposureSnapshotSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

// Export enum types for use in frontend
export type TransactionType = z.infer<typeof transactionTypeZodEnum>;
export type FacilityType = z.infer<typeof facilityTypeZodEnum>;
export type CreditLineType = z.infer<typeof creditLineTypeZodEnum>;
export type LoanType = z.infer<typeof loanTypeZodEnum>;
export type RepaymentStructure = z.infer<typeof repaymentStructureZodEnum>;
export type CollateralType = z.infer<typeof collateralTypeZodEnum>;
export type LoanStatus = z.infer<typeof loanStatusZodEnum>;
