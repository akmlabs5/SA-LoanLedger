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
  'void',
  'other'
]);

export const facilityTypeEnum = pgEnum('facility_type', [
  'revolving',
  'term',
  'bullet', 
  'bridge',
  'working_capital',
  'non_cash_guarantee'
]);

export const collateralTypeEnum = pgEnum('collateral_type', [
  'real_estate',
  'liquid_stocks',
  'other'
]);

export const loanStatusEnum = pgEnum('loan_status', [
  'active',
  'settled',
  'overdue',
  'cancelled'
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

export const pledgeTypeEnum = pgEnum('pledge_type', [
  'first_lien',
  'second_lien',
  'blanket'
]);

export const attachmentOwnerTypeEnum = pgEnum('attachment_owner_type', [
  'bank',
  'facility',
  'loan',
  'collateral',
  'chat_message'
]);

export const attachmentCategoryEnum = pgEnum('attachment_category', [
  'facility_agreement',
  'bank_correspondence',
  'facility_document',
  'amendment',
  'drawdown_request',
  'loan_documentation',
  'valuation_report',
  'asset_documentation',
  'compliance_document',
  'chat_attachment',
  'other'
]);

export const auditActionEnum = pgEnum('audit_action', [
  'upload',
  'download',
  'delete',
  'update_meta',
  'view'
]);

export const reminderTypeEnum = pgEnum('reminder_type', [
  'due_date',
  'payment',
  'review',
  'custom'
]);

export const reminderStatusEnum = pgEnum('reminder_status', [
  'pending',
  'sent',
  'failed'
]);

export const guaranteeStatusEnum = pgEnum('guarantee_status', [
  'active',
  'expired', 
  'renewed',
  'called',
  'cancelled'
]);

export const securityTypeEnum = pgEnum('security_type', [
  'cash_full',
  'cash_partial', 
  'cash_none',
  'non_cash'
]);

export const messageRoleEnum = pgEnum('message_role', [
  'user',
  'assistant',
  'system'
]);

export const guaranteeTypeEnum = pgEnum('guarantee_type', [
  'bid_bond',
  'performance_bond',
  'advance_payment_guarantee',
  'general_bank_guarantee',
  'retention_money_guarantee',
  'other'
]);

export const accountTypeEnum = pgEnum('account_type', [
  'personal',
  'organization'
]);

export const invitationStatusEnum = pgEnum('invitation_status', [
  'pending',
  'accepted',
  'expired',
  'cancelled'
]);

export const alertSeverityEnum = pgEnum('alert_severity', [
  'info',
  'warning',
  'error',
  'critical'
]);

export const alertTypeEnum = pgEnum('alert_type', [
  'security',
  'database',
  'email',
  'ssl',
  'cors',
  'redirect',
  'performance',
  'system'
]);

export const alertStatusEnum = pgEnum('alert_status', [
  'unread',
  'read',
  'resolved',
  'ignored'
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
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  accountType: accountTypeEnum("account_type").default('personal'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Organizations
export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  ownerId: varchar("owner_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_organizations_owner").on(table.ownerId),
]);

// Organization Members
export const organizationMembers = pgTable("organization_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  isOwner: boolean("is_owner").default(false),
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => [
  index("idx_org_members_user").on(table.userId),
  index("idx_org_members_org").on(table.organizationId),
  unique("unique_user_org").on(table.userId, table.organizationId),
]);

// Organization Invitations
export const organizationInvitations = pgTable("organization_invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  invitedBy: varchar("invited_by").references(() => users.id).notNull(),
  status: invitationStatusEnum("status").default('pending'),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_org_invitations_org").on(table.organizationId),
  index("idx_org_invitations_token").on(table.token),
  index("idx_org_invitations_email").on(table.email),
]);

// System Alerts for Admin Portal
export const systemAlerts = pgTable("system_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  severity: alertSeverityEnum("severity").notNull(),
  type: alertTypeEnum("type").notNull(),
  status: alertStatusEnum("status").default('unread'),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  details: jsonb("details"), // For stack traces, request info, etc.
  source: varchar("source", { length: 100 }), // e.g., 'smokeTests', 'logMonitor', 'server'
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by"),
}, (table) => [
  index("idx_alerts_severity").on(table.severity),
  index("idx_alerts_status").on(table.status),
  index("idx_alerts_created").on(table.createdAt),
]);

// Saudi Banks
export const banks = pgTable("banks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: 'cascade' }),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 10 }).notNull().unique(), // Keep global unique during migration
  targetLtv: decimal("target_ltv", { precision: 5, scale: 2 }).default('70.00'),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_banks_org").on(table.organizationId),
]);

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
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: 'cascade' }),
  bankId: varchar("bank_id").references(() => banks.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  facilityType: facilityTypeEnum("facility_type").notNull(),
  creditLimit: decimal("credit_limit", { precision: 15, scale: 2 }).notNull(),
  costOfFunding: decimal("cost_of_funding", { precision: 5, scale: 2 }).notNull(), // Margin over SIBOR (e.g., 1.5 for 1.5%)
  startDate: date("start_date").notNull(),
  expiryDate: date("expiry_date"), // Optional - for facilities with flexible terms
  terms: text("terms"),
  isActive: boolean("is_active").default(true),
  // Optional revolving period tracking for complex loan structures
  enableRevolvingTracking: boolean("enable_revolving_tracking").default(false),
  maxRevolvingPeriod: integer("max_revolving_period"), // Maximum days (e.g., 360)
  initialDrawdownDate: date("initial_drawdown_date"), // Set on first loan drawdown
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_facilities_org").on(table.organizationId),
  index("idx_facilities_bank").on(table.bankId),
  index("idx_facilities_user").on(table.userId),
]);

// Credit Lines (intermediate layer between facilities and loans)
export const creditLines = pgTable("credit_lines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  facilityId: varchar("facility_id").references(() => facilities.id).notNull(),
  userId: varchar("user_id").references(() => users.id), // Optional - for audit trail
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
  index("idx_credit_lines_org").on(table.organizationId),
  index("idx_credit_lines_facility").on(table.facilityId),
  index("idx_credit_lines_user").on(table.userId),
]);

// Collateral
export const collateral = pgTable("collateral", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: 'cascade' }),
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
}, (table) => [
  index("idx_collateral_org").on(table.organizationId),
  index("idx_collateral_user").on(table.userId),
]);

// Collateral Assignments (Links collateral to facilities, credit lines, or banks)
export const collateralAssignments = pgTable("collateral_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  collateralId: varchar("collateral_id").references(() => collateral.id, { onDelete: "restrict" }).notNull(),
  facilityId: varchar("facility_id").references(() => facilities.id, { onDelete: "cascade" }),
  creditLineId: varchar("credit_line_id").references(() => creditLines.id, { onDelete: "cascade" }),
  bankId: varchar("bank_id").references(() => banks.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id).notNull(),
  pledgeType: pledgeTypeEnum("pledge_type").notNull(),
  pledgedValue: decimal("pledged_value", { precision: 15, scale: 2 }),
  advanceRate: decimal("advance_rate", { precision: 5, scale: 2 }),
  effectiveDate: date("effective_date").notNull(),
  releaseDate: date("release_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // XOR constraint: exactly one of facilityId, creditLineId, or bankId must be set
  index("idx_collateral_assignments_collateral").on(table.collateralId),
  index("idx_collateral_assignments_facility").on(table.facilityId),
  index("idx_collateral_assignments_credit_line").on(table.creditLineId),
  index("idx_collateral_assignments_bank").on(table.bankId),
  index("idx_collateral_assignments_user").on(table.userId),
]);

// Loans (drawdowns from specific credit lines or facilities)
export const loans = pgTable("loans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: 'cascade' }),
  facilityId: varchar("facility_id").references(() => facilities.id, { onDelete: "restrict" }).notNull(),
  creditLineId: varchar("credit_line_id").references(() => creditLines.id, { onDelete: "restrict" }),
  userId: varchar("user_id").references(() => users.id).notNull(),
  parentLoanId: varchar("parent_loan_id"), // For revolving loans - forward reference
  cycleNumber: integer("cycle_number").default(1), // Track loan cycle for revolving facilities
  referenceNumber: varchar("reference_number", { length: 50 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  startDate: date("start_date").notNull(),
  dueDate: date("due_date").notNull(),
  chargesDueDate: date("charges_due_date"),
  siborRate: decimal("sibor_rate", { precision: 5, scale: 2 }).notNull(),
  siborTerm: varchar("sibor_term", { length: 50 }), // e.g., "3 Months SIBOR", "6 Months SIBOR"
  siborTermMonths: integer("sibor_term_months"), // 3, 6, 12 for calculations
  margin: decimal("margin", { precision: 5, scale: 2 }).notNull(), // Margin over SIBOR
  bankRate: decimal("bank_rate", { precision: 5, scale: 2 }).notNull(),
  lastAccrualDate: date("last_accrual_date"), // Track last interest accrual
  interestBasis: varchar("interest_basis", { length: 20 }).default('actual_360'), // Actual/360 or Actual/365
  notes: text("notes"),
  status: loanStatusEnum("status").default('active'),
  settledDate: date("settled_date"),
  settledAmount: decimal("settled_amount", { precision: 15, scale: 2 }),
  reversedAt: timestamp("reversed_at"), // When settlement was reversed
  reversalReason: text("reversal_reason"), // Why settlement was reversed
  reversedBy: varchar("reversed_by"), // User ID who reversed the settlement
  isDeleted: boolean("is_deleted").default(false), // Soft delete for audit trail
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_loans_org").on(table.organizationId),
  index("idx_loans_facility").on(table.facilityId),
  index("idx_loans_credit_line").on(table.creditLineId),
  index("idx_loans_user").on(table.userId),
  index("idx_loans_parent").on(table.parentLoanId),
  index("idx_loans_due_date").on(table.dueDate),
  index("idx_loans_status").on(table.status),
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

// User Preferences
export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  timezone: varchar("timezone", { length: 50 }).default('Asia/Riyadh'),
  language: varchar("language", { length: 10 }).default('en'),
  currency: varchar("currency", { length: 10 }).default('SAR'),
  dateFormat: varchar("date_format", { length: 20 }).default('DD/MM/YYYY'),
  numberFormat: varchar("number_format", { length: 20 }).default('en-SA'),
  theme: varchar("theme", { length: 20 }).default('light'),
  dashboardLayout: varchar("dashboard_layout", { length: 20 }).default('grid'),
  itemsPerPage: integer("items_per_page").default(10),
  enableNotifications: boolean("enable_notifications").default(true),
  enableSounds: boolean("enable_sounds").default(false),
  compactView: boolean("compact_view").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Daily Alerts Preferences
export const dailyAlertsPreferences = pgTable("daily_alerts_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  enabled: boolean("enabled").default(false),
  preferredTime: varchar("preferred_time", { length: 5 }).default('08:00'), // HH:MM format
  timezone: varchar("timezone", { length: 50 }).default('Asia/Riyadh'),
  enableCriticalAlerts: boolean("enable_critical_alerts").default(true),
  enableHighAlerts: boolean("enable_high_alerts").default(true),
  enableMediumAlerts: boolean("enable_medium_alerts").default(true),
  enableLowAlerts: boolean("enable_low_alerts").default(false),
  utilizationThreshold: decimal("utilization_threshold", { precision: 5, scale: 2 }).default('80.00'),
  concentrationThreshold: decimal("concentration_threshold", { precision: 5, scale: 2 }).default('40.00'),
  ltvThreshold: decimal("ltv_threshold", { precision: 5, scale: 2 }).default('70.00'),
  revolvingThreshold: decimal("revolving_threshold", { precision: 5, scale: 2 }).default('80.00'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat Conversations for Multi-Turn AI Assistant
export const chatConversations = pgTable("chat_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  organizationId: varchar("organization_id").references(() => organizations.id),
  title: varchar("title", { length: 255 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_chat_conversations_user").on(table.userId),
  index("idx_chat_conversations_organization").on(table.organizationId),
  index("idx_chat_conversations_active").on(table.isActive),
]);

// Chat Messages for Conversation History
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => chatConversations.id, { onDelete: 'cascade' }).notNull(),
  role: messageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata"), // Store additional context like file attachments, loan IDs, etc.
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_chat_messages_conversation").on(table.conversationId),
  index("idx_chat_messages_created").on(table.createdAt),
]);

// Modern Attachment System
export const attachments = pgTable("attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerType: attachmentOwnerTypeEnum("owner_type").notNull(),
  ownerId: varchar("owner_id").notNull(),
  bankId: varchar("bank_id").references(() => banks.id), // Denormalized for ACL, nullable for collateral
  userId: varchar("user_id").references(() => users.id).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  contentType: varchar("content_type", { length: 100 }).notNull(),
  fileSize: integer("file_size").notNull(),
  storageKey: text("storage_key").notNull(),
  category: attachmentCategoryEnum("category").notNull(),
  tags: text("tags").array(),
  description: text("description"),
  checksum: varchar("checksum", { length: 64 }),
  uploadedBy: varchar("uploaded_by").references(() => users.id).notNull(),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_attachments_owner").on(table.ownerType, table.ownerId),
  index("idx_attachments_bank").on(table.bankId),
  index("idx_attachments_user").on(table.userId),
  index("idx_attachments_category").on(table.category),
]);

// Attachment Audit Trail for Saudi Banking Compliance
export const attachmentAudit = pgTable("attachment_audit", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  attachmentId: varchar("attachment_id").references(() => attachments.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  action: auditActionEnum("action").notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_attachment_audit_attachment").on(table.attachmentId),
  index("idx_attachment_audit_user").on(table.userId),
  index("idx_attachment_audit_action").on(table.action),
  index("idx_attachment_audit_date").on(table.createdAt),
]);

// Legacy Document Attachments (keep for backward compatibility)
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
  loanId: varchar("loan_id").references(() => loans.id),
  facilityId: varchar("facility_id").references(() => facilities.id),
  bankId: varchar("bank_id").references(() => banks.id).notNull(),
  type: transactionTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  date: date("date").notNull(),
  reference: varchar("reference", { length: 100 }),
  memo: text("memo"), // User-provided description
  allocation: jsonb("allocation"), // {"interest": 100.00, "principal": 900.00, "fees": 50.00}
  createdBy: varchar("created_by").references(() => users.id).notNull(), // Audit trail
  idempotencyKey: varchar("idempotency_key", { length: 100 }), // Prevent duplicate transactions
  notes: text("notes"), // System-generated notes
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  unique("unique_idempotency_key").on(table.idempotencyKey),
  index("idx_transaction_user_date").on(table.userId, table.date),
  index("idx_transaction_loan").on(table.loanId),
  index("idx_transaction_type_date").on(table.type, table.date),
]);

// Audit Logs for compliance and tracking changes
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(), // 'loan', 'transaction', 'facility', etc.
  entityId: varchar("entity_id", { length: 100 }).notNull(),
  action: varchar("action", { length: 50 }).notNull(), // 'create', 'update', 'repay', 'settle', 'revolve', 'void', 'delete'
  before: jsonb("before"), // Previous state
  after: jsonb("after"), // New state
  ipAddress: varchar("ip_address", { length: 45 }), // IPv4 or IPv6
  userAgent: text("user_agent"),
  reason: text("reason"), // Optional reason for the change
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_audit_logs_entity").on(table.entityType, table.entityId),
  index("idx_audit_logs_user").on(table.userId),
  index("idx_audit_logs_date").on(table.createdAt),
]);

// Loan Reminders for due date and payment alerts
export const loanReminders = pgTable("loan_reminders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  loanId: varchar("loan_id").references(() => loans.id, { onDelete: "cascade" }).notNull(),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar("user_id").references(() => users.id), // Optional - for audit trail
  type: reminderTypeEnum("type").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message"),
  templateId: varchar("template_id").references(() => reminderTemplates.id),
  reminderDate: timestamp("reminder_date").notNull(),
  emailEnabled: boolean("email_enabled").default(true),
  calendarEnabled: boolean("calendar_enabled").default(false),
  status: reminderStatusEnum("status").default('pending'),
  sentAt: timestamp("sent_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_loan_reminders_loan").on(table.loanId),
  index("idx_loan_reminders_org").on(table.organizationId),
  index("idx_loan_reminders_user").on(table.userId),
  index("idx_loan_reminders_date").on(table.reminderDate),
  index("idx_loan_reminders_status").on(table.status),
]);

// Reminder Templates - Admin managed message templates
export const reminderTemplates = pgTable("reminder_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: reminderTypeEnum("type").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  subject: varchar("subject", { length: 200 }).notNull(),
  emailTemplate: text("email_template").notNull(),
  calendarTemplate: text("calendar_template").notNull(),
  variables: text("variables").array(), // Available variables like {loanReference}, {amount}, etc.
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_reminder_templates_type").on(table.type),
  index("idx_reminder_templates_active").on(table.isActive),
]);

// Organization Reminder Settings - Default preferences per organization
export const userReminderSettings = pgTable("user_reminder_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar("user_id").references(() => users.id), // Optional - for audit trail
  autoApplyEnabled: boolean("auto_apply_enabled").default(false),
  defaultEmailEnabled: boolean("default_email_enabled").default(true),
  defaultCalendarEnabled: boolean("default_calendar_enabled").default(false),
  defaultIntervals: integer("default_intervals").array().default([30, 15, 7, 1]), // Days before due date
  quickSetupPresets: jsonb("quick_setup_presets").default('[{"days": 7, "type": "due_date"}, {"days": 3, "type": "due_date"}, {"days": 1, "type": "payment"}]'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_user_reminder_settings_org").on(table.organizationId),
  index("idx_user_reminder_settings_user").on(table.userId),
  unique("unique_org_reminder_settings").on(table.organizationId), // One settings record per organization
]);

// Guarantees for non-cash facility types
export const guarantees = pgTable("guarantees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: 'cascade' }),
  facilityId: varchar("facility_id").references(() => facilities.id, { onDelete: "restrict" }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  guaranteeType: guaranteeTypeEnum("guarantee_type").notNull(),
  referenceNumber: varchar("reference_number", { length: 50 }).notNull(),
  beneficiaryName: varchar("beneficiary_name", { length: 200 }).notNull(),
  beneficiaryDetails: text("beneficiary_details"),
  guaranteeAmount: decimal("guarantee_amount", { precision: 15, scale: 2 }).notNull(),
  securityType: securityTypeEnum("security_type").notNull(),
  securityAmount: decimal("security_amount", { precision: 15, scale: 2 }).default('0.00'),
  securityDetails: text("security_details"),
  issueDate: date("issue_date").notNull(),
  expiryDate: date("expiry_date").notNull(),
  feeRate: decimal("fee_rate", { precision: 5, scale: 2 }).default('0.00'),
  purpose: text("purpose"),
  terms: text("terms"),
  status: guaranteeStatusEnum("status").default('active'),
  notes: text("notes"),
  renewalCount: integer("renewal_count").default(0),
  lastRenewalDate: date("last_renewal_date"),
  calledDate: date("called_date"),
  calledAmount: decimal("called_amount", { precision: 15, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_guarantees_org").on(table.organizationId),
  index("idx_guarantees_facility").on(table.facilityId),
  index("idx_guarantees_user").on(table.userId),
  index("idx_guarantees_expiry_date").on(table.expiryDate),
  index("idx_guarantees_status").on(table.status),
  index("idx_guarantees_reference").on(table.referenceNumber),
]);

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  facilities: many(facilities),
  creditLines: many(creditLines),
  loans: many(loans),
  collateral: many(collateral),
  documents: many(documents),
  attachments: many(attachments),
  aiInsightConfig: one(aiInsightConfig),
  exposureSnapshots: many(exposureSnapshots),
  transactions: many(transactions),
  bankContacts: many(bankContacts),
  loanReminders: many(loanReminders),
  guarantees: many(guarantees),
}));

export const banksRelations = relations(banks, ({ many }) => ({
  facilities: many(facilities),
  exposureSnapshots: many(exposureSnapshots),
  transactions: many(transactions),
  contacts: many(bankContacts),
  attachments: many(attachments),
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
  attachments: many(attachments),
  exposureSnapshots: many(exposureSnapshots),
  transactions: many(transactions),
  guarantees: many(guarantees),
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
  facility: one(facilities, {
    fields: [loans.facilityId],
    references: [facilities.id],
  }),
  creditLine: one(creditLines, {
    fields: [loans.creditLineId],
    references: [creditLines.id],
  }),
  user: one(users, {
    fields: [loans.userId],
    references: [users.id],
  }),
  documents: many(documents),
  attachments: many(attachments),
  transactions: many(transactions),
  reminders: many(loanReminders),
}));

export const collateralRelations = relations(collateral, ({ one, many }) => ({
  user: one(users, {
    fields: [collateral.userId],
    references: [users.id],
  }),
  documents: many(documents),
  attachments: many(attachments),
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

// Chat Conversation Relations
export const chatConversationsRelations = relations(chatConversations, ({ one, many }) => ({
  user: one(users, {
    fields: [chatConversations.userId],
    references: [users.id],
  }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  conversation: one(chatConversations, {
    fields: [chatMessages.conversationId],
    references: [chatConversations.id],
  }),
}));

// Attachment Relations
export const attachmentsRelations = relations(attachments, ({ one }) => ({
  user: one(users, {
    fields: [attachments.userId],
    references: [users.id],
  }),
  bank: one(banks, {
    fields: [attachments.bankId],
    references: [banks.id],
  }),
  uploadedByUser: one(users, {
    fields: [attachments.uploadedBy],
    references: [users.id],
  }),
}));

export const attachmentAuditRelations = relations(attachmentAudit, ({ one }) => ({
  attachment: one(attachments, {
    fields: [attachmentAudit.attachmentId],
    references: [attachments.id],
  }),
  user: one(users, {
    fields: [attachmentAudit.userId],
    references: [users.id],
  }),
}));

export const loanRemindersRelations = relations(loanReminders, ({ one }) => ({
  loan: one(loans, {
    fields: [loanReminders.loanId],
    references: [loans.id],
  }),
  user: one(users, {
    fields: [loanReminders.userId],
    references: [users.id],
  }),
}));

export const guaranteesRelations = relations(guarantees, ({ one }) => ({
  facility: one(facilities, {
    fields: [guarantees.facilityId],
    references: [facilities.id],
  }),
  user: one(users, {
    fields: [guarantees.userId],
    references: [users.id],
  }),
}));

// Zod Enums for validation
export const transactionTypeZodEnum = z.enum(['draw', 'repayment', 'fee', 'interest', 'limit_change', 'other']);
export const facilityTypeZodEnum = z.enum(['revolving', 'term', 'bullet', 'bridge', 'working_capital', 'non_cash_guarantee']);
export const guaranteeStatusZodEnum = z.enum(['active', 'expired', 'renewed', 'called', 'cancelled']);
export const guaranteeTypeZodEnum = z.enum(['bid_bond', 'performance_bond', 'advance_payment_guarantee', 'general_bank_guarantee', 'retention_money_guarantee', 'other']);
export const securityTypeZodEnum = z.enum(['cash_full', 'cash_partial', 'cash_none', 'non_cash']);
export const creditLineTypeZodEnum = z.enum(['working_capital', 'term_loan', 'trade_finance', 'real_estate_finance', 'equipment_finance', 'overdraft', 'letter_of_credit', 'bank_guarantee', 'other']);

export const pledgeTypeZodEnum = z.enum(['first_lien', 'second_lien', 'blanket']);
export const loanTypeZodEnum = z.enum(['working_capital', 'term_loan', 'trade_finance', 'real_estate_finance', 'equipment_finance', 'revolving_credit', 'overdraft', 'letter_of_credit', 'bank_guarantee', 'bridge_loan', 'murabaha', 'ijara', 'other']);
export const repaymentStructureZodEnum = z.enum(['bullet', 'installments', 'revolving', 'quarterly', 'semi_annual', 'annual', 'on_demand']);
export const collateralTypeZodEnum = z.enum(['real_estate', 'liquid_stocks', 'other']);
export const loanStatusZodEnum = z.enum(['active', 'settled', 'overdue']);
export const messageRoleZodEnum = z.enum(['user', 'assistant', 'system']);
export const attachmentOwnerTypeZodEnum = z.enum(['bank', 'facility', 'loan', 'collateral']);
export const attachmentCategoryZodEnum = z.enum([
  'facility_agreement',
  'bank_correspondence', 
  'facility_document',
  'amendment',
  'drawdown_request',
  'loan_documentation',
  'valuation_report',
  'asset_documentation',
  'compliance_document',
  'other'
]);
export const auditActionZodEnum = z.enum(['upload', 'download', 'delete', 'update_meta', 'view']);
export const reminderTypeZodEnum = z.enum(['due_date', 'payment', 'review', 'custom']);
export const reminderStatusZodEnum = z.enum(['pending', 'sent', 'failed']);

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
  .omit({ id: true, createdAt: true, initialDrawdownDate: true })
  .extend({
    facilityType: facilityTypeZodEnum,
    creditLimit: positiveDecimalString(15, 2),
    costOfFunding: z.string()
      .refine((val) => !isNaN(Number(val)), "Must be a valid number")
      .refine((val) => Number(val) >= 0, "Must be non-negative")
      .refine((val) => Number(val) <= 100, "Must be 100% or less"),
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Must be a valid date"),
    expiryDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Must be a valid date").optional().nullable(),
    enableRevolvingTracking: z.boolean().optional(),
    maxRevolvingPeriod: z.number().int().positive("Maximum period must be positive").optional().nullable(),
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
  .omit({ id: true, createdAt: true, updatedAt: true, isDeleted: true, cycleNumber: true })
  .extend({
    facilityId: z.string().min(1, "Facility is required"),
    amount: positiveDecimalString(15, 2),
    siborRate: z.string()
      .refine((val) => !isNaN(Number(val)), "Must be a valid number")
      .refine((val) => Number(val) >= 0, "Must be non-negative")
      .refine((val) => Number(val) <= 100, "Must be 100% or less"),
    margin: z.string()
      .refine((val) => !isNaN(Number(val)), "Must be a valid number")
      .refine((val) => Number(val) >= 0, "Must be non-negative")
      .refine((val) => Number(val) <= 20, "Must be 20% or less"),
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
    siborTermMonths: z.number().int().positive().optional(),
    lastAccrualDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Must be a valid date").optional(),
  });

export const insertCollateralAssignmentSchema = createInsertSchema(collateralAssignments)
  .omit({ id: true, createdAt: true })
  .extend({
    pledgeType: pledgeTypeZodEnum,
    pledgedValue: positiveDecimalString(15, 2).optional(),
    advanceRate: z.string()
      .refine((val) => !isNaN(Number(val)), "Must be a valid number")
      .refine((val) => Number(val) >= 0, "Must be non-negative")
      .refine((val) => Number(val) <= 100, "Must be 100% or less")
      .optional(),
    effectiveDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Must be a valid date"),
    releaseDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Must be a valid date").optional(),
  })
  .refine(
    (data) => {
      const hasExactlyOne = [data.facilityId, data.creditLineId, data.bankId].filter(Boolean).length === 1;
      return hasExactlyOne;
    },
    { message: "Must assign to exactly one of: facility, credit line, or bank" }
  );

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

export const insertAuditLogSchema = createInsertSchema(auditLogs)
  .omit({ id: true, createdAt: true })
  .extend({
    action: z.string().min(1, "Action is required"),
    entityType: z.string().min(1, "Entity type is required"),
    entityId: z.string().min(1, "Entity ID is required"),
  });

// Chat Conversation Schemas
export const insertChatConversationSchema = createInsertSchema(chatConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
}).extend({
  role: messageRoleZodEnum,
});

// Attachment Insert Schemas
export const insertAttachmentSchema = createInsertSchema(attachments)
  .omit({ id: true, createdAt: true, deletedAt: true })
  .extend({
    fileName: z.string().min(1, "File name is required").max(255),
    contentType: z.string().min(1, "Content type is required"),
    fileSize: z.number().positive("File size must be positive").max(26214400, "File must be less than 25MB"),
    storageKey: z.string().min(1, "Storage key is required"),
    category: attachmentCategoryZodEnum,
    tags: z.array(z.string()).optional(),
    description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
    checksum: z.string().length(64, "Checksum must be 64 characters").optional(),
  });

export const insertAttachmentAuditSchema = createInsertSchema(attachmentAudit)
  .omit({ id: true, createdAt: true })
  .extend({
    action: auditActionZodEnum,
    ipAddress: z.string().max(45).optional(),
    userAgent: z.string().optional(),
  });

// Attachment Upload Intent Schema
export const attachmentUploadIntentSchema = z.object({
  ownerType: attachmentOwnerTypeZodEnum,
  ownerId: z.string().uuid("Owner ID must be a valid UUID"),
  fileName: z.string().min(1, "File name is required").max(255),
  contentType: z.string().min(1, "Content type is required"),
  fileSize: z.number().positive("File size must be positive").max(26214400, "File must be less than 25MB"),
  category: attachmentCategoryZodEnum,
  tags: z.array(z.string()).optional(),
  description: z.string().max(1000).optional(),
});

// Attachment Metadata Update Schema
export const updateAttachmentMetaSchema = z.object({
  category: attachmentCategoryZodEnum.optional(),
  tags: z.array(z.string()).optional(),
  description: z.string().max(1000).optional(),
});

// Payment request schemas
export const paymentRequestSchema = z.object({
  amount: positiveDecimalString(15, 2),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Must be a valid date"),
  reference: z.string().optional(),
  memo: z.string().optional(),
  allocation: z.object({
    interest: z.number().min(0),
    principal: z.number().min(0),
    fees: z.number().min(0)
  }).optional(),
  idempotencyKey: z.string().optional(),
});

export const settlementRequestSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Must be a valid date"),
  amount: positiveDecimalString(15, 2).optional(), // If not provided, settle full outstanding
  memo: z.string().optional(),
});

export const revolveRequestSchema = z.object({
  newTerm: z.number().int().positive("Term must be positive"),
  siborTermMonths: z.number().int().positive("SIBOR term must be positive"),
  margin: z.string()
    .refine((val) => !isNaN(Number(val)), "Must be a valid number")
    .refine((val) => Number(val) >= 0, "Must be non-negative")
    .refine((val) => Number(val) <= 20, "Must be 20% or less"),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Must be a valid date"),
  memo: z.string().optional(),
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
export type CollateralAssignment = typeof collateralAssignments.$inferSelect;
export type InsertCollateralAssignment = z.infer<typeof insertCollateralAssignmentSchema>;
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
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type PaymentRequest = z.infer<typeof paymentRequestSchema>;
export type SettlementRequest = z.infer<typeof settlementRequestSchema>;
export type RevolveRequest = z.infer<typeof revolveRequestSchema>;

// Export enum types for use in frontend
export type TransactionType = z.infer<typeof transactionTypeZodEnum>;
export type FacilityType = z.infer<typeof facilityTypeZodEnum>;
export type CreditLineType = z.infer<typeof creditLineTypeZodEnum>;
export type LoanType = z.infer<typeof loanTypeZodEnum>;
export type RepaymentStructure = z.infer<typeof repaymentStructureZodEnum>;
export type CollateralType = z.infer<typeof collateralTypeZodEnum>;
export type LoanStatus = z.infer<typeof loanStatusZodEnum>;
export type Attachment = typeof attachments.$inferSelect;
export type InsertAttachment = z.infer<typeof insertAttachmentSchema>;
export type AttachmentAudit = typeof attachmentAudit.$inferSelect;
export type InsertAttachmentAudit = z.infer<typeof insertAttachmentAuditSchema>;
export type AttachmentOwnerType = z.infer<typeof attachmentOwnerTypeZodEnum>;
export type AttachmentCategory = z.infer<typeof attachmentCategoryZodEnum>;
export type AuditAction = z.infer<typeof auditActionZodEnum>;
export type ReminderType = z.infer<typeof reminderTypeZodEnum>;
export type ReminderStatus = z.infer<typeof reminderStatusZodEnum>;

// Loan Reminder Schemas
export const insertLoanReminderSchema = createInsertSchema(loanReminders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateLoanReminderSchema = insertLoanReminderSchema.partial().extend({
  id: z.string(),
});

export type InsertLoanReminder = z.infer<typeof insertLoanReminderSchema>;
export type UpdateLoanReminder = z.infer<typeof updateLoanReminderSchema>;
export type LoanReminder = typeof loanReminders.$inferSelect;

// Reminder Template Schemas
export const insertReminderTemplateSchema = createInsertSchema(reminderTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateReminderTemplateSchema = insertReminderTemplateSchema.partial().extend({
  id: z.string(),
});

export type InsertReminderTemplate = z.infer<typeof insertReminderTemplateSchema>;
export type UpdateReminderTemplate = z.infer<typeof updateReminderTemplateSchema>;
export type ReminderTemplate = typeof reminderTemplates.$inferSelect;

// User Reminder Settings Schemas
export const insertUserReminderSettingsSchema = createInsertSchema(userReminderSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateUserReminderSettingsSchema = insertUserReminderSettingsSchema.partial().extend({
  id: z.string(),
});

export type InsertUserReminderSettings = z.infer<typeof insertUserReminderSettingsSchema>;
export type UpdateUserReminderSettings = z.infer<typeof updateUserReminderSettingsSchema>;
export type UserReminderSettings = typeof userReminderSettings.$inferSelect;

// Guarantee Schemas
export const insertGuaranteeSchema = createInsertSchema(guarantees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  guaranteeType: guaranteeTypeZodEnum,
});

export const updateGuaranteeSchema = insertGuaranteeSchema.partial().extend({
  id: z.string(),
});

export type InsertGuarantee = z.infer<typeof insertGuaranteeSchema>;
export type UpdateGuarantee = z.infer<typeof updateGuaranteeSchema>;
export type Guarantee = typeof guarantees.$inferSelect;
export type GuaranteeStatus = z.infer<typeof guaranteeStatusZodEnum>;
export type GuaranteeType = z.infer<typeof guaranteeTypeZodEnum>;
export type SecurityType = z.infer<typeof securityTypeZodEnum>;

// User Preferences Schemas
export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  timezone: z.string().min(1, "Timezone is required"),
  language: z.string().min(1, "Language is required"),
  currency: z.string().min(1, "Currency is required"),
  dateFormat: z.string().min(1, "Date format is required"),
  numberFormat: z.string().min(1, "Number format is required"),
  theme: z.enum(['light', 'dark', 'system']),
  dashboardLayout: z.enum(['grid', 'list', 'compact']),
  itemsPerPage: z.number().min(5).max(100),
});

export const updateUserPreferencesSchema = insertUserPreferencesSchema.partial().extend({
  id: z.string(),
});

export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UpdateUserPreferences = z.infer<typeof updateUserPreferencesSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;

// Daily Alerts Preferences Schemas
export const insertDailyAlertsPreferencesSchema = createInsertSchema(dailyAlertsPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateDailyAlertsPreferencesSchema = insertDailyAlertsPreferencesSchema.partial().extend({
  id: z.string(),
});

export type InsertDailyAlertsPreferences = z.infer<typeof insertDailyAlertsPreferencesSchema>;
export type UpdateDailyAlertsPreferences = z.infer<typeof updateDailyAlertsPreferencesSchema>;
export type DailyAlertsPreferences = typeof dailyAlertsPreferences.$inferSelect;

// Chat Conversation Types
export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = z.infer<typeof insertChatConversationSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type MessageRole = z.infer<typeof messageRoleZodEnum>;

// Organization Schemas
export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1, "Organization name is required").max(255, "Organization name must be less than 255 characters"),
});

export const updateOrganizationSchema = insertOrganizationSchema.partial().extend({
  id: z.string(),
});

export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type UpdateOrganization = z.infer<typeof updateOrganizationSchema>;
export type Organization = typeof organizations.$inferSelect;

// Organization Member Schemas
export const insertOrganizationMemberSchema = createInsertSchema(organizationMembers).omit({
  id: true,
  joinedAt: true,
});

export type InsertOrganizationMember = z.infer<typeof insertOrganizationMemberSchema>;
export type OrganizationMember = typeof organizationMembers.$inferSelect;

// Organization Invitation Schemas
export const insertOrganizationInvitationSchema = createInsertSchema(organizationInvitations).omit({
  id: true,
  createdAt: true,
}).extend({
  email: z.string().email("Must be a valid email address"),
  expiresAt: z.date(),
});

export type InsertOrganizationInvitation = z.infer<typeof insertOrganizationInvitationSchema>;
export type OrganizationInvitation = typeof organizationInvitations.$inferSelect;

// System Alert Schemas
export const insertSystemAlertSchema = createInsertSchema(systemAlerts).omit({
  id: true,
  createdAt: true,
}).extend({
  severity: z.enum(['info', 'warning', 'error', 'critical']),
  type: z.enum(['security', 'database', 'email', 'ssl', 'cors', 'redirect', 'performance', 'system']),
  title: z.string().min(1).max(255),
  message: z.string().min(1),
});

export const updateSystemAlertSchema = insertSystemAlertSchema.partial().extend({
  id: z.string(),
  status: z.enum(['unread', 'read', 'resolved', 'ignored']).optional(),
});

export type InsertSystemAlert = z.infer<typeof insertSystemAlertSchema>;
export type UpdateSystemAlert = z.infer<typeof updateSystemAlertSchema>;
export type SystemAlert = typeof systemAlerts.$inferSelect;
