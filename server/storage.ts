import {
  users,
  banks,
  bankContacts,
  facilities,
  creditLines,
  collateral,
  collateralAssignments,
  loans,
  documents,
  attachments,
  attachmentAudit,
  loanReminders,
  reminderTemplates,
  userReminderSettings,
  userPreferences,
  dailyAlertsPreferences,
  guarantees,
  aiInsightConfig,
  exposureSnapshots,
  transactions,
  auditLogs,
  chatConversations,
  chatMessages,
  type User,
  type UpsertUser,
  type Bank,
  type InsertBank,
  type BankContact,
  type InsertBankContact,
  type Facility,
  type InsertFacility,
  type CreditLine,
  type InsertCreditLine,
  type Collateral,
  type InsertCollateral,
  type Loan,
  type InsertLoan,
  type Document,
  type InsertDocument,
  type LoanReminder,
  type InsertLoanReminder,
  type UpdateLoanReminder,
  type Guarantee,
  type InsertGuarantee,
  type UpdateGuarantee,
  type AiInsightConfig,
  type InsertAiInsightConfig,
  type ExposureSnapshot,
  type InsertExposureSnapshot,
  type Transaction,
  type InsertTransaction,
  type TransactionType,
  type CollateralAssignment,
  type InsertCollateralAssignment,
  type AuditLog,
  type InsertAuditLog,
  type PaymentRequest,
  type SettlementRequest,
  type RevolveRequest,
  type Attachment,
  type InsertAttachment,
  type AttachmentAudit,
  type InsertAttachmentAudit,
  type AttachmentOwnerType,
  type AttachmentCategory,
  type ReminderTemplate,
  type InsertReminderTemplate,
  type UpdateReminderTemplate,
  type UserReminderSettings,
  type InsertUserReminderSettings,
  type UpdateUserReminderSettings,
  type UserPreferences,
  type InsertUserPreferences,
  type DailyAlertsPreferences,
  type InsertDailyAlertsPreferences,
  type ChatConversation,
  type InsertChatConversation,
  type ChatMessage,
  type InsertChatMessage,
  organizations,
  organizationMembers,
  organizationInvitations,
  type Organization,
  type InsertOrganization,
  type OrganizationMember,
  type InsertOrganizationMember,
  type OrganizationInvitation,
  type InsertOrganizationInvitation,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc, sql, gte, lte, isNull, isNotNull, ne } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Bank operations
  getAllBanks(organizationId?: string): Promise<Bank[]>;
  createBank(bank: InsertBank): Promise<Bank>;
  
  // Bank Contact operations
  getBankContacts(bankId: string, organizationId: string): Promise<Array<BankContact & { bank: Bank }>>;
  createBankContact(contact: InsertBankContact): Promise<BankContact>;
  updateBankContact(contactId: string, organizationId: string, contact: Partial<InsertBankContact>): Promise<BankContact>;
  deleteBankContact(contactId: string, organizationId: string): Promise<void>;
  setPrimaryContact(contactId: string, bankId: string, organizationId: string): Promise<BankContact>;
  
  // Facility operations
  getUserFacilities(organizationId: string): Promise<Array<Facility & { bank: Bank }>>;
  getFacilityWithBank(facilityId: string): Promise<(Facility & { bank: Bank }) | undefined>;
  createFacility(facility: InsertFacility): Promise<Facility>;
  updateFacility(facilityId: string, organizationId: string, facility: Partial<InsertFacility>): Promise<Facility>;
  deleteFacility(facilityId: string, organizationId: string): Promise<void>;
  
  // Collateral operations
  getUserCollateral(organizationId: string): Promise<Collateral[]>;
  createCollateral(collateral: InsertCollateral): Promise<Collateral>;
  updateCollateral(collateralId: string, organizationId: string, collateral: Partial<InsertCollateral>): Promise<Collateral>;
  deleteCollateral(collateralId: string, organizationId: string): Promise<void>;
  
  // Collateral Assignment operations
  getUserCollateralAssignments(organizationId: string): Promise<Array<CollateralAssignment & { 
    collateral: Collateral; 
    facility?: Facility & { bank: Bank }; 
    creditLine?: CreditLine & { facility: Facility & { bank: Bank } } 
  }>>;
  createCollateralAssignment(assignment: InsertCollateralAssignment): Promise<CollateralAssignment>;
  updateCollateralAssignment(assignmentId: string, organizationId: string, assignment: Partial<InsertCollateralAssignment>): Promise<CollateralAssignment>;
  deleteCollateralAssignment(assignmentId: string, organizationId: string): Promise<void>;
  
  // Credit Line operations
  getUserCreditLines(organizationId: string): Promise<Array<CreditLine & { facility: Facility & { bank: Bank } }>>;
  createCreditLine(creditLine: InsertCreditLine): Promise<CreditLine>;
  updateCreditLine(creditLineId: string, organizationId: string, creditLine: Partial<InsertCreditLine>): Promise<CreditLine>;
  
  // Loan operations
  getUserLoans(organizationId: string): Promise<Loan[]>;
  getActiveLoansByUser(organizationId: string): Promise<(Loan & { facility: Facility & { bank: Bank } })[]>;
  getSettledLoansByUser(organizationId: string): Promise<(Loan & { facility: Facility & { bank: Bank } })[]>;
  getCancelledLoansByUser(organizationId: string): Promise<(Loan & { facility: Facility & { bank: Bank } })[]>;
  getLoanById(loanId: string): Promise<(Loan & { facility: Facility & { bank: Bank } }) | undefined>;
  createLoan(loan: InsertLoan): Promise<Loan>;
  updateLoan(loanId: string, loan: Partial<InsertLoan>, userId: string, reason?: string): Promise<Loan>;
  deleteLoan(loanId: string, organizationId: string, reason?: string): Promise<void>;
  permanentlyDeleteLoan(loanId: string, organizationId: string): Promise<void>;
  
  // Payment and settlement operations
  processPayment(loanId: string, payment: PaymentRequest, userId: string): Promise<{ loan: Loan; transactions: Transaction[] }>;
  settleLoan(loanId: string, settlement: SettlementRequest, userId: string): Promise<{ loan: Loan; transactions: Transaction[] }>;
  reverseLoanSettlement(loanId: string, reason: string, userId: string): Promise<Loan>;
  revolveLoan(loanId: string, revolve: RevolveRequest, userId: string): Promise<{ oldLoan: Loan; newLoan: Loan; transactions: Transaction[] }>;
  
  // Ledger operations
  getLoanLedger(loanId: string): Promise<Transaction[]>;
  calculateLoanBalance(loanId: string): Promise<{ principal: number; interest: number; fees: number; total: number }>;
  accrueInterest(loanId: string, toDate: string, userId: string): Promise<Transaction[]>;
  
  // Document operations
  createDocument(document: InsertDocument): Promise<Document>;
  getLoanDocuments(loanId: string): Promise<Document[]>;
  
  // Loan Reminder operations
  getLoanReminders(loanId: string): Promise<LoanReminder[]>;
  getUserReminders(userId: string): Promise<Array<LoanReminder & { loan: Loan }>>;
  createLoanReminder(reminder: InsertLoanReminder): Promise<LoanReminder>;
  updateLoanReminder(reminderId: string, organizationId: string, reminder: Partial<UpdateLoanReminder>): Promise<LoanReminder>;
  deleteLoanReminder(reminderId: string, organizationId: string): Promise<void>;
  
  // Reminder Template operations
  getAllReminderTemplates(): Promise<ReminderTemplate[]>;
  getReminderTemplate(id: string): Promise<ReminderTemplate | undefined>;
  createReminderTemplate(template: InsertReminderTemplate): Promise<ReminderTemplate>;
  updateReminderTemplate(id: string, template: Partial<UpdateReminderTemplate>): Promise<ReminderTemplate>;
  deleteReminderTemplate(id: string): Promise<void>;
  
  // User Reminder Settings operations
  getUserReminderSettings(userId: string): Promise<UserReminderSettings | undefined>;
  createUserReminderSettings(settings: InsertUserReminderSettings): Promise<UserReminderSettings>;
  updateUserReminderSettings(userId: string, settings: Partial<UpdateUserReminderSettings>): Promise<UserReminderSettings>;
  upsertUserReminderSettings(settings: InsertUserReminderSettings): Promise<UserReminderSettings>;
  
  // User Preferences operations
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  upsertUserPreferences(preferences: Partial<InsertUserPreferences> & { userId: string }): Promise<UserPreferences>;
  
  // Daily Alerts Preferences operations
  getDailyAlertsPreferences(userId: string): Promise<DailyAlertsPreferences | undefined>;
  upsertDailyAlertsPreferences(preferences: InsertDailyAlertsPreferences): Promise<DailyAlertsPreferences>;
  
  // Guarantee operations
  getUserGuarantees(organizationId: string): Promise<Array<Guarantee & { facility: Facility & { bank: Bank } }>>;
  getFacilityGuarantees(facilityId: string): Promise<Guarantee[]>;
  getGuaranteeById(guaranteeId: string): Promise<Guarantee | undefined>;
  createGuarantee(guarantee: InsertGuarantee): Promise<Guarantee>;
  updateGuarantee(guaranteeId: string, organizationId: string, guarantee: Partial<UpdateGuarantee>): Promise<Guarantee>;
  deleteGuarantee(guaranteeId: string, organizationId: string): Promise<void>;
  
  // AI Insight Config operations
  getUserAiConfig(userId: string): Promise<AiInsightConfig | undefined>;
  upsertAiConfig(config: InsertAiInsightConfig): Promise<AiInsightConfig>;
  
  // Dashboard analytics
  getUserPortfolioSummary(userId: string): Promise<{
    totalOutstanding: number;
    totalCreditLimit: number;
    availableCredit: number;
    portfolioLtv: number;
    activeLoansCount: number;
    bankExposures: Array<{
      bankId: string;
      bankName: string;
      outstanding: number;
      creditLimit: number;
      utilization: number;
    }>;
  }>;

  // Exposure Snapshot operations
  listExposureSnapshots(filters: {
    userId: string;
    from?: string;
    to?: string;
    bankId?: string;
    facilityId?: string;
  }): Promise<Array<ExposureSnapshot & { bank?: Bank; facility?: Facility }>>;
  addExposureSnapshots(snapshots: InsertExposureSnapshot[]): Promise<ExposureSnapshot[]>;

  // Transaction operations
  listTransactions(filters: {
    userId: string;
    from?: string;
    to?: string;
    bankId?: string;
    facilityId?: string;
    loanId?: string;
    type?: TransactionType;
    limit?: number;
    offset?: number;
  }): Promise<Array<Transaction & { bank: Bank; facility?: Facility; loan?: Loan }>>;
  getTransactionCount(filters: {
    userId: string;
    from?: string;
    to?: string;
    bankId?: string;
    facilityId?: string;
    loanId?: string;
    type?: TransactionType;
  }): Promise<number>;
  addTransaction(transaction: InsertTransaction): Promise<Transaction>;
  
  // Bank Performance operations
  getBankPerformance(bankId: string, organizationId: string): Promise<{
    relationshipDuration: {
      days: number;
      years: number;
    };
    averageRateByFacility: Array<{
      facilityId: string;
      facilityName: string;
      avgAllInRate: number;
      loanCount: number;
    }>;
    paymentRecord: {
      score: 'Excellent' | 'Good' | 'Fair' | 'Poor';
      earlyCount: number;
      onTimeCount: number;
      lateCount: number;
      totalCount: number;
    };
    lastActivity: string | null;
  }>;
  
  // Attachment operations
  getAttachmentsByOwner(ownerType: AttachmentOwnerType, ownerId: string, userId: string): Promise<Attachment[]>;
  createAttachment(attachment: InsertAttachment): Promise<Attachment>;
  updateAttachmentMetadata(attachmentId: string, metadata: Partial<Pick<InsertAttachment, 'category' | 'tags' | 'description'>>, userId: string): Promise<Attachment>;
  deleteAttachment(attachmentId: string, userId: string): Promise<void>;
  getAttachmentById(attachmentId: string, userId: string): Promise<Attachment | undefined>;
  
  // Attachment audit operations
  createAttachmentAudit(audit: InsertAttachmentAudit): Promise<AttachmentAudit>;
  getAttachmentAuditTrail(attachmentId: string): Promise<AttachmentAudit[]>;
  
  // Chat Conversation operations
  getUserConversations(userId: string): Promise<ChatConversation[]>;
  getConversation(conversationId: string): Promise<ChatConversation | undefined>;
  createConversation(conversation: InsertChatConversation): Promise<ChatConversation>;
  updateConversation(conversationId: string, updates: Partial<InsertChatConversation>): Promise<ChatConversation>;
  deleteConversation(conversationId: string): Promise<void>;
  
  // Chat Message operations
  getConversationMessages(conversationId: string): Promise<ChatMessage[]>;
  addMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Organization operations
  createOrganization(organization: InsertOrganization): Promise<Organization>;
  getOrganization(organizationId: string): Promise<Organization | undefined>;
  getUserOrganization(userId: string): Promise<Organization | undefined>;
  updateOrganization(organizationId: string, updates: Partial<InsertOrganization>): Promise<Organization>;
  
  // Organization Member operations
  addMember(member: InsertOrganizationMember): Promise<OrganizationMember>;
  removeMember(userId: string, organizationId: string): Promise<void>;
  getOrganizationMembers(organizationId: string): Promise<Array<OrganizationMember & { user: User }>>;
  getOrganizationMembership(userId: string): Promise<OrganizationMember | undefined>;
  isUserInOrganization(userId: string, organizationId: string): Promise<boolean>;
  
  // Organization Invitation operations
  createInvitation(invitation: InsertOrganizationInvitation): Promise<OrganizationInvitation>;
  getInvitation(token: string): Promise<OrganizationInvitation | undefined>;
  deleteInvitation(invitationId: string): Promise<void>;
  getOrganizationInvitations(organizationId: string): Promise<OrganizationInvitation[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Bank operations
  async getAllBanks(organizationId?: string): Promise<Bank[]> {
    if (organizationId) {
      // Return both global banks (organizationId is null) AND organization-specific banks
      return await db.select().from(banks)
        .where(and(
          eq(banks.isActive, true),
          or(
            isNull(banks.organizationId),
            eq(banks.organizationId, organizationId)
          )
        ))
        .orderBy(asc(banks.name));
    }
    return await db.select().from(banks).where(eq(banks.isActive, true)).orderBy(asc(banks.name));
  }

  async createBank(bank: InsertBank): Promise<Bank> {
    const [newBank] = await db.insert(banks).values(bank).returning();
    return newBank;
  }

  // Bank Contact operations
  async getBankContacts(bankId: string, organizationId: string): Promise<Array<BankContact & { bank: Bank }>> {
    return await db
      .select()
      .from(bankContacts)
      .leftJoin(banks, eq(bankContacts.bankId, banks.id))
      .where(and(
        eq(bankContacts.bankId, bankId),
        eq(banks.organizationId, organizationId),
        eq(bankContacts.isActive, true)
      ))
      .orderBy(desc(bankContacts.isPrimary), asc(bankContacts.name))
      .then(rows => rows.map(row => ({
        ...row.bank_contacts,
        bank: row.banks!
      })));
  }

  async createBankContact(contact: InsertBankContact): Promise<BankContact> {
    const [newContact] = await db.insert(bankContacts).values({
      ...contact,
      updatedAt: new Date()
    }).returning();
    return newContact;
  }

  async updateBankContact(contactId: string, organizationId: string, contact: Partial<InsertBankContact>): Promise<BankContact> {
    const [updatedContact] = await db
      .update(bankContacts)
      .set({
        ...contact,
        updatedAt: new Date()
      })
      .where(and(
        eq(bankContacts.id, contactId),
        eq(bankContacts.organizationId, organizationId)
      ))
      .returning();
    return updatedContact;
  }

  async deleteBankContact(contactId: string, organizationId: string): Promise<void> {
    await db
      .update(bankContacts)
      .set({ 
        isActive: false, 
        updatedAt: new Date() 
      })
      .where(and(
        eq(bankContacts.id, contactId),
        eq(bankContacts.organizationId, organizationId)
      ));
  }

  async setPrimaryContact(contactId: string, bankId: string, organizationId: string): Promise<BankContact> {
    // First, unset any existing primary contact for this bank and organization
    await db
      .update(bankContacts)
      .set({ 
        isPrimary: false, 
        updatedAt: new Date() 
      })
      .where(and(
        eq(bankContacts.bankId, bankId),
        eq(bankContacts.organizationId, organizationId),
        eq(bankContacts.isPrimary, true)
      ));

    // Then, set the new primary contact
    const [updatedContact] = await db
      .update(bankContacts)
      .set({ 
        isPrimary: true, 
        updatedAt: new Date() 
      })
      .where(eq(bankContacts.id, contactId))
      .returning();
    
    return updatedContact;
  }

  // Facility operations
  async getUserFacilities(organizationId: string): Promise<Array<Facility & { bank: Bank }>> {
    const results = await db
      .select()
      .from(facilities)
      .innerJoin(banks, eq(facilities.bankId, banks.id))
      .where(and(eq(facilities.organizationId, organizationId), eq(facilities.isActive, true)))
      .orderBy(desc(facilities.createdAt));

    return results.map(result => ({
      ...result.facilities,
      bank: result.banks,
    }));
  }

  async getFacilityWithBank(facilityId: string): Promise<(Facility & { bank: Bank }) | undefined> {
    const result = await db
      .select()
      .from(facilities)
      .innerJoin(banks, eq(facilities.bankId, banks.id))
      .where(eq(facilities.id, facilityId))
      .limit(1);

    if (result.length === 0) return undefined;

    return {
      ...result[0].facilities,
      bank: result[0].banks,
    };
  }

  async createFacility(facility: InsertFacility): Promise<Facility> {
    const [newFacility] = await db.insert(facilities).values(facility).returning();
    return newFacility;
  }

  async updateFacility(facilityId: string, organizationId: string, facility: Partial<InsertFacility>): Promise<Facility> {
    const [updatedFacility] = await db
      .update(facilities)
      .set(facility)
      .where(and(
        eq(facilities.id, facilityId),
        eq(facilities.organizationId, organizationId)
      ))
      .returning();
    return updatedFacility;
  }

  async deleteFacility(facilityId: string, organizationId: string): Promise<void> {
    await db
      .update(facilities)
      .set({ 
        isActive: false, 
        updatedAt: new Date() 
      })
      .where(and(
        eq(facilities.id, facilityId),
        eq(facilities.organizationId, organizationId)
      ));
  }

  // Credit Line operations
  async getUserCreditLines(organizationId: string): Promise<Array<CreditLine & { facility: Facility & { bank: Bank } }>> {
    const result = await db
      .select()
      .from(creditLines)
      .innerJoin(facilities, eq(creditLines.facilityId, facilities.id))
      .innerJoin(banks, eq(facilities.bankId, banks.id))
      .where(and(eq(creditLines.organizationId, organizationId), eq(creditLines.isActive, true)))
      .orderBy(desc(creditLines.createdAt));

    return result.map(row => ({
      ...row.credit_lines,
      facility: {
        ...row.facilities,
        bank: row.banks,
      },
    }));
  }

  async createCreditLine(creditLine: InsertCreditLine): Promise<CreditLine> {
    const [newCreditLine] = await db.insert(creditLines).values(creditLine).returning();
    return newCreditLine;
  }

  async updateCreditLine(creditLineId: string, organizationId: string, creditLine: Partial<InsertCreditLine>): Promise<CreditLine> {
    const [updatedCreditLine] = await db
      .update(creditLines)
      .set(creditLine)
      .where(and(
        eq(creditLines.id, creditLineId),
        eq(creditLines.organizationId, organizationId)
      ))
      .returning();
    return updatedCreditLine;
  }

  // Collateral operations
  async getUserCollateral(organizationId: string): Promise<Collateral[]> {
    return await db
      .select()
      .from(collateral)
      .where(and(eq(collateral.organizationId, organizationId), eq(collateral.isActive, true)))
      .orderBy(desc(collateral.createdAt));
  }

  async createCollateral(collateralData: InsertCollateral): Promise<Collateral> {
    const [newCollateral] = await db.insert(collateral).values(collateralData).returning();
    return newCollateral;
  }

  async updateCollateral(collateralId: string, organizationId: string, collateralData: Partial<InsertCollateral>): Promise<Collateral> {
    const [updatedCollateral] = await db
      .update(collateral)
      .set(collateralData)
      .where(and(
        eq(collateral.id, collateralId),
        eq(collateral.organizationId, organizationId)
      ))
      .returning();
    return updatedCollateral;
  }

  async deleteCollateral(collateralId: string, organizationId: string): Promise<void> {
    await db
      .update(collateral)
      .set({ 
        isActive: false, 
        updatedAt: new Date() 
      })
      .where(and(
        eq(collateral.id, collateralId),
        eq(collateral.organizationId, organizationId)
      ));
  }

  // Collateral Assignment operations
  async getUserCollateralAssignments(organizationId: string): Promise<Array<CollateralAssignment & { 
    collateral: Collateral; 
    facility?: Facility & { bank: Bank }; 
    creditLine?: CreditLine & { facility: Facility & { bank: Bank } } 
  }>> {
    const result = await db
      .select()
      .from(collateralAssignments)
      .leftJoin(collateral, eq(collateralAssignments.collateralId, collateral.id))
      .leftJoin(facilities, eq(collateralAssignments.facilityId, facilities.id))
      .leftJoin(banks, eq(facilities.bankId, banks.id))
      .leftJoin(creditLines, eq(collateralAssignments.creditLineId, creditLines.id))
      .where(and(
        eq(collateral.organizationId, organizationId),
        eq(collateralAssignments.isActive, true)
      ))
      .orderBy(desc(collateralAssignments.createdAt));

    return result.map(row => ({
      ...row.collateral_assignments,
      collateral: row.collateral!,
      facility: row.facilities ? { ...row.facilities, bank: row.banks! } : undefined,
      creditLine: row.credit_lines ? { 
        ...row.credit_lines, 
        facility: row.facilities ? { ...row.facilities, bank: row.banks! } : undefined as any
      } : undefined,
    }));
  }

  async createCollateralAssignment(assignmentData: InsertCollateralAssignment): Promise<CollateralAssignment> {
    const [newAssignment] = await db.insert(collateralAssignments).values(assignmentData).returning();
    return newAssignment;
  }

  async updateCollateralAssignment(assignmentId: string, organizationId: string, assignmentData: Partial<InsertCollateralAssignment>): Promise<CollateralAssignment> {
    const [updatedAssignment] = await db
      .update(collateralAssignments)
      .set(assignmentData)
      .where(and(
        eq(collateralAssignments.id, assignmentId),
        eq(collateralAssignments.organizationId, organizationId)
      ))
      .returning();
    return updatedAssignment;
  }

  async deleteCollateralAssignment(assignmentId: string, organizationId: string): Promise<void> {
    await db
      .update(collateralAssignments)
      .set({ isActive: false })
      .where(and(
        eq(collateralAssignments.id, assignmentId),
        eq(collateralAssignments.organizationId, organizationId)
      ));
  }

  // Loan operations
  async getUserLoans(organizationId: string): Promise<Loan[]> {
    return await db
      .select()
      .from(loans)
      .where(eq(loans.organizationId, organizationId))
      .orderBy(desc(loans.createdAt));
  }

  async getActiveLoansByUser(organizationId: string): Promise<(Loan & { facility: Facility & { bank: Bank } })[]> {
    const result = await db
      .select()
      .from(loans)
      .innerJoin(facilities, eq(loans.facilityId, facilities.id))
      .innerJoin(banks, eq(facilities.bankId, banks.id))
      .where(and(
        eq(loans.organizationId, organizationId), 
        or(eq(loans.status, 'active'), eq(loans.status, 'overdue'))
      ))
      .orderBy(asc(loans.dueDate));

    return result.map(row => ({
      ...row.loans,
      facility: {
        ...row.facilities,
        bank: row.banks,
      },
    }));
  }

  async getSettledLoansByUser(organizationId: string): Promise<(Loan & { facility: Facility & { bank: Bank } })[]> {
    const result = await db
      .select()
      .from(loans)
      .innerJoin(facilities, eq(loans.facilityId, facilities.id))
      .innerJoin(banks, eq(facilities.bankId, banks.id))
      .where(and(eq(loans.organizationId, organizationId), eq(loans.status, 'settled')))
      .orderBy(desc(loans.settledDate));

    return result.map(row => ({
      ...row.loans,
      facility: {
        ...row.facilities,
        bank: row.banks,
      },
    }));
  }

  async getCancelledLoansByUser(organizationId: string): Promise<(Loan & { facility: Facility & { bank: Bank } })[]> {
    const result = await db
      .select()
      .from(loans)
      .innerJoin(facilities, eq(loans.facilityId, facilities.id))
      .innerJoin(banks, eq(facilities.bankId, banks.id))
      .where(and(eq(loans.organizationId, organizationId), eq(loans.status, 'cancelled')))
      .orderBy(desc(loans.createdAt));

    return result.map(row => ({
      ...row.loans,
      facility: {
        ...row.facilities,
        bank: row.banks,
      },
    }));
  }

  async createLoan(loan: InsertLoan): Promise<Loan> {
    const [newLoan] = await db.insert(loans).values(loan).returning();
    return newLoan;
  }

  async getLoanById(loanId: string): Promise<(Loan & { facility: Facility & { bank: Bank } }) | undefined> {
    const result = await db
      .select()
      .from(loans)
      .innerJoin(facilities, eq(loans.facilityId, facilities.id))
      .innerJoin(banks, eq(facilities.bankId, banks.id))
      .where(eq(loans.id, loanId))
      .limit(1);
    
    if (result.length === 0) return undefined;
    
    const row = result[0];
    return {
      ...row.loans,
      facility: {
        ...row.facilities,
        bank: row.banks,
      },
    };
  }

  async updateLoan(loanId: string, loan: Partial<InsertLoan>): Promise<Loan> {
    const [updatedLoan] = await db
      .update(loans)
      .set(loan)
      .where(eq(loans.id, loanId))
      .returning();
    return updatedLoan;
  }

  async settleLoan(loanId: string, settlement: SettlementRequest, userId: string): Promise<{ loan: Loan; transactions: Transaction[] }> {
    return await db.transaction(async (tx) => {
      // Get facility to find bank ID first
      const [facility] = await tx
        .select()
        .from(facilities)
        .where(eq(facilities.id, (
          await tx.select({ facilityId: loans.facilityId })
            .from(loans)
            .where(eq(loans.id, loanId))
            .limit(1)
        )[0].facilityId))
        .limit(1);

      if (!facility) {
        throw new Error('Facility not found for loan');
      }

      // Create settlement transaction first (with all required fields)
      const settlementTransaction: InsertTransaction = {
        userId,
        loanId,
        facilityId: facility.id,
        bankId: facility.bankId,
        type: 'repayment',
        amount: (settlement.amount || 0).toString(),
        date: settlement.date,
        memo: settlement.memo || 'Loan settlement',
        reference: `SETTLE-${loanId.substring(0, 8).toUpperCase()}`,
        createdBy: userId,
        idempotencyKey: `SETTLE:${loanId}:${settlement.date}`,
        allocation: { settlement: parseFloat((settlement.amount || 0).toString()) },
      };

      const [transaction] = await tx
        .insert(transactions)
        .values(settlementTransaction)
        .returning();

      // Then update loan status
      const [settledLoan] = await tx
        .update(loans)
        .set({
          status: 'settled',
          settledDate: settlement.date,
          settledAmount: (settlement.amount || 0).toString(),
        })
        .where(eq(loans.id, loanId))
        .returning();

      return { loan: settledLoan, transactions: [transaction] };
    });
  }

  async reverseLoanSettlement(loanId: string, reason: string, userId: string): Promise<Loan> {
    return await db.transaction(async (tx) => {
      // Get loan to verify it's settled
      const [loan] = await tx
        .select()
        .from(loans)
        .where(eq(loans.id, loanId))
        .limit(1);

      if (!loan) {
        throw new Error('Loan not found');
      }

      if (loan.status !== 'settled') {
        throw new Error('Loan is not settled - cannot reverse settlement');
      }

      // Create audit log for the reversal
      await tx.insert(auditLogs).values({
        userId,
        entityType: 'loan',
        entityId: loanId,
        action: 'settlement_reversed',
        changes: {
          previousStatus: 'settled',
          previousSettledDate: loan.settledDate,
          previousSettledAmount: loan.settledAmount,
          reversalReason: reason,
        },
      });

      // Update loan: revert to active, record reversal details
      const [reversedLoan] = await tx
        .update(loans)
        .set({
          status: 'active',
          settledDate: null,
          settledAmount: null,
          reversedAt: new Date(),
          reversalReason: reason,
          reversedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(loans.id, loanId))
        .returning();

      return reversedLoan;
    });
  }

  async deleteLoan(loanId: string, organizationId: string, reason?: string): Promise<void> {
    // First verify the loan belongs to the organization
    const loan = await this.getLoanById(loanId);
    if (!loan || loan.organizationId !== organizationId) {
      throw new Error('Loan not found or access denied');
    }

    await db
      .update(loans)
      .set({
        status: 'cancelled',
        updatedAt: new Date()
      })
      .where(and(eq(loans.id, loanId), eq(loans.organizationId, organizationId)));
  }

  async permanentlyDeleteLoan(loanId: string, organizationId: string): Promise<void> {
    // First verify the loan belongs to the organization and is cancelled
    const loan = await this.getLoanById(loanId);
    if (!loan || loan.organizationId !== organizationId) {
      throw new Error('Loan not found or access denied');
    }
    
    if (loan.status !== 'cancelled') {
      throw new Error('Only cancelled loans can be permanently deleted');
    }

    // Permanently delete the loan from database
    await db
      .delete(loans)
      .where(and(eq(loans.id, loanId), eq(loans.organizationId, organizationId)));
  }

  async calculateLoanBalance(loanId: string): Promise<{ principal: number; interest: number; fees: number; total: number }> {
    const loan = await db
      .select()
      .from(loans)
      .where(eq(loans.id, loanId))
      .limit(1);

    if (loan.length === 0) {
      throw new Error('Loan not found');
    }

    // For now, return simple balance calculation based on loan amount
    // This can be enhanced later with transaction tracking
    const principal = Number(loan[0].amount);
    const interest = 0; // TODO: Calculate based on SIBOR + margin
    const fees = 0; // TODO: Calculate any applicable fees
    const total = principal + interest + fees;

    return {
      principal,
      interest,
      fees,
      total
    };
  }

  async getLoanLedger(loanId: string): Promise<Transaction[]> {
    const result = await db
      .select()
      .from(transactions)
      .where(eq(transactions.loanId, loanId))
      .orderBy(desc(transactions.createdAt));
    
    return result;
  }

  async processPayment(loanId: string, payment: PaymentRequest, userId: string): Promise<{ loan: Loan; transactions: Transaction[] }> {
    return await db.transaction(async (tx) => {
      // Get loan and facility information
      const [loan] = await tx
        .select()
        .from(loans)
        .where(eq(loans.id, loanId))
        .limit(1);

      if (!loan) {
        throw new Error('Loan not found');
      }

      const [facility] = await tx
        .select()
        .from(facilities)
        .where(eq(facilities.id, loan.facilityId))
        .limit(1);

      if (!facility) {
        throw new Error('Facility not found for loan');
      }

      // Create payment transaction
      const paymentTransaction: InsertTransaction = {
        userId,
        loanId,
        facilityId: loan.facilityId,
        bankId: facility.bankId,
        type: 'repayment',
        amount: payment.amount.toString(),
        date: payment.date,
        memo: payment.memo || 'Payment processed',
        reference: payment.reference || null,
        createdBy: userId,
        idempotencyKey: payment.idempotencyKey || `PAY:${loanId}:${payment.date}:${Date.now()}`,
        allocation: payment.allocation || null,
      };

      const [transaction] = await tx
        .insert(transactions)
        .values(paymentTransaction)
        .returning();

      return { loan, transactions: [transaction] };
    });
  }

  async revolveLoan(loanId: string, revolve: RevolveRequest, userId: string): Promise<{ oldLoan: Loan; newLoan: Loan; transactions: Transaction[] }> {
    // Simple implementation - mark old loan as settled and create new loan
    const oldLoan = await this.getLoanById(loanId);
    if (!oldLoan) throw new Error('Loan not found');
    
    // For now, return a simple revolve (this can be enhanced later)
    const newLoan = { ...oldLoan, id: 'new-' + loanId };
    return { oldLoan, newLoan, transactions: [] };
  }

  async accrueInterest(loanId: string, toDate: string, userId: string): Promise<Transaction[]> {
    // Simple implementation - return empty array for now
    // This can be enhanced with actual interest calculation logic
    return [];
  }

  // Document operations
  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db.insert(documents).values(document).returning();
    return newDocument;
  }

  async getLoanDocuments(loanId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(and(eq(documents.loanId, loanId), eq(documents.isActive, true)))
      .orderBy(desc(documents.createdAt));
  }

  // Loan Reminder operations
  async getLoanReminders(loanId: string): Promise<LoanReminder[]> {
    return await db
      .select()
      .from(loanReminders)
      .where(and(eq(loanReminders.loanId, loanId), eq(loanReminders.isActive, true)))
      .orderBy(asc(loanReminders.reminderDate));
  }

  async getUserReminders(userId: string): Promise<Array<LoanReminder & { loan: Loan }>> {
    return await db
      .select({
        id: loanReminders.id,
        loanId: loanReminders.loanId,
        userId: loanReminders.userId,
        type: loanReminders.type,
        title: loanReminders.title,
        message: loanReminders.message,
        reminderDate: loanReminders.reminderDate,
        emailEnabled: loanReminders.emailEnabled,
        calendarEnabled: loanReminders.calendarEnabled,
        status: loanReminders.status,
        sentAt: loanReminders.sentAt,
        isActive: loanReminders.isActive,
        createdAt: loanReminders.createdAt,
        updatedAt: loanReminders.updatedAt,
        loan: loans,
      })
      .from(loanReminders)
      .innerJoin(loans, eq(loanReminders.loanId, loans.id))
      .where(and(eq(loanReminders.userId, userId), eq(loanReminders.isActive, true)))
      .orderBy(asc(loanReminders.reminderDate));
  }

  async createLoanReminder(reminder: InsertLoanReminder): Promise<LoanReminder> {
    const [result] = await db.insert(loanReminders).values(reminder).returning();
    return result;
  }

  async updateLoanReminder(reminderId: string, organizationId: string, reminder: Partial<UpdateLoanReminder>): Promise<LoanReminder> {
    const [result] = await db
      .update(loanReminders)
      .set({ ...reminder, updatedAt: new Date() })
      .where(and(
        eq(loanReminders.id, reminderId),
        eq(loanReminders.organizationId, organizationId)
      ))
      .returning();
    
    if (!result) {
      throw new Error('Reminder not found');
    }
    
    return result;
  }

  async deleteLoanReminder(reminderId: string, organizationId: string): Promise<void> {
    await db
      .update(loanReminders)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(
        eq(loanReminders.id, reminderId),
        eq(loanReminders.organizationId, organizationId)
      ));
  }

  // Reminder Template operations
  async getAllReminderTemplates(): Promise<ReminderTemplate[]> {
    return await db
      .select()
      .from(reminderTemplates)
      .orderBy(asc(reminderTemplates.type), asc(reminderTemplates.name));
  }

  async getReminderTemplate(id: string): Promise<ReminderTemplate | undefined> {
    const [result] = await db
      .select()
      .from(reminderTemplates)
      .where(eq(reminderTemplates.id, id));
    return result;
  }

  async createReminderTemplate(template: InsertReminderTemplate): Promise<ReminderTemplate> {
    const [result] = await db.insert(reminderTemplates).values(template).returning();
    return result;
  }

  async updateReminderTemplate(id: string, template: Partial<UpdateReminderTemplate>): Promise<ReminderTemplate> {
    const [result] = await db
      .update(reminderTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(reminderTemplates.id, id))
      .returning();
    
    if (!result) {
      throw new Error('Template not found');
    }
    
    return result;
  }

  async deleteReminderTemplate(id: string): Promise<void> {
    await db
      .update(reminderTemplates)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(reminderTemplates.id, id));
  }

  // User Reminder Settings operations
  async getUserReminderSettings(userId: string): Promise<UserReminderSettings | undefined> {
    const [result] = await db
      .select()
      .from(userReminderSettings)
      .where(eq(userReminderSettings.userId, userId));
    return result;
  }

  async createUserReminderSettings(settings: InsertUserReminderSettings): Promise<UserReminderSettings> {
    const [result] = await db.insert(userReminderSettings).values(settings).returning();
    return result;
  }

  async updateUserReminderSettings(userId: string, settings: Partial<UpdateUserReminderSettings>): Promise<UserReminderSettings> {
    const [result] = await db
      .update(userReminderSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(userReminderSettings.userId, userId))
      .returning();
    
    if (!result) {
      throw new Error('User reminder settings not found');
    }
    
    return result;
  }

  async upsertUserReminderSettings(settings: InsertUserReminderSettings): Promise<UserReminderSettings> {
    // Try to get existing settings
    const existing = await this.getUserReminderSettings(settings.userId);
    
    if (existing) {
      // Update existing settings
      return this.updateUserReminderSettings(settings.userId, settings);
    } else {
      // Create new settings
      return this.createUserReminderSettings(settings);
    }
  }

  // User Preferences operations
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const [result] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    return result;
  }

  async upsertUserPreferences(preferences: Partial<InsertUserPreferences> & { userId: string }): Promise<UserPreferences> {
    console.log("🔧 upsertUserPreferences called with:", JSON.stringify(preferences, null, 2));
    
    const [result] = await db
      .insert(userPreferences)
      .values(preferences as InsertUserPreferences)
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          ...preferences,
          updatedAt: new Date(),
        },
      })
      .returning();
    
    console.log("✅ upsertUserPreferences result:", result ? "SUCCESS" : "FAILED");
    return result;
  }

  async getDailyAlertsPreferences(userId: string): Promise<DailyAlertsPreferences | undefined> {
    const [result] = await db
      .select()
      .from(dailyAlertsPreferences)
      .where(eq(dailyAlertsPreferences.userId, userId));
    return result;
  }

  async upsertDailyAlertsPreferences(preferences: InsertDailyAlertsPreferences): Promise<DailyAlertsPreferences> {
    const [result] = await db
      .insert(dailyAlertsPreferences)
      .values(preferences)
      .onConflictDoUpdate({
        target: dailyAlertsPreferences.userId,
        set: {
          ...preferences,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  // Guarantee operations
  async getUserGuarantees(organizationId: string): Promise<Array<Guarantee & { facility: Facility & { bank: Bank } }>> {
    return await db
      .select({
        id: guarantees.id,
        facilityId: guarantees.facilityId,
        userId: guarantees.userId,
        referenceNumber: guarantees.referenceNumber,
        beneficiaryName: guarantees.beneficiaryName,
        beneficiaryDetails: guarantees.beneficiaryDetails,
        guaranteeAmount: guarantees.guaranteeAmount,
        securityType: guarantees.securityType,
        securityAmount: guarantees.securityAmount,
        securityDetails: guarantees.securityDetails,
        issueDate: guarantees.issueDate,
        expiryDate: guarantees.expiryDate,
        feeRate: guarantees.feeRate,
        purpose: guarantees.purpose,
        terms: guarantees.terms,
        status: guarantees.status,
        notes: guarantees.notes,
        renewalCount: guarantees.renewalCount,
        lastRenewalDate: guarantees.lastRenewalDate,
        calledDate: guarantees.calledDate,
        calledAmount: guarantees.calledAmount,
        isActive: guarantees.isActive,
        createdAt: guarantees.createdAt,
        updatedAt: guarantees.updatedAt,
        facility: {
          id: facilities.id,
          bankId: facilities.bankId,
          userId: facilities.userId,
          facilityType: facilities.facilityType,
          creditLimit: facilities.creditLimit,
          costOfFunding: facilities.costOfFunding,
          startDate: facilities.startDate,
          expiryDate: facilities.expiryDate,
          terms: facilities.terms,
          isActive: facilities.isActive,
          createdAt: facilities.createdAt,
          bank: banks,
        },
      })
      .from(guarantees)
      .innerJoin(facilities, eq(guarantees.facilityId, facilities.id))
      .innerJoin(banks, eq(facilities.bankId, banks.id))
      .where(and(eq(guarantees.organizationId, organizationId), eq(guarantees.isActive, true)))
      .orderBy(desc(guarantees.createdAt));
  }

  async getFacilityGuarantees(facilityId: string): Promise<Guarantee[]> {
    return await db
      .select()
      .from(guarantees)
      .where(and(eq(guarantees.facilityId, facilityId), eq(guarantees.isActive, true)))
      .orderBy(desc(guarantees.createdAt));
  }

  async getGuaranteeById(guaranteeId: string): Promise<Guarantee | undefined> {
    const [guarantee] = await db
      .select()
      .from(guarantees)
      .where(and(eq(guarantees.id, guaranteeId), eq(guarantees.isActive, true)))
      .limit(1);
    return guarantee;
  }

  async createGuarantee(guarantee: InsertGuarantee): Promise<Guarantee> {
    const [result] = await db.insert(guarantees).values(guarantee).returning();
    return result;
  }

  async updateGuarantee(guaranteeId: string, organizationId: string, guarantee: Partial<UpdateGuarantee>): Promise<Guarantee> {
    const [result] = await db
      .update(guarantees)
      .set({ ...guarantee, updatedAt: new Date() })
      .where(and(
        eq(guarantees.id, guaranteeId),
        eq(guarantees.organizationId, organizationId)
      ))
      .returning();
    
    if (!result) {
      throw new Error('Guarantee not found');
    }
    
    return result;
  }

  async deleteGuarantee(guaranteeId: string, organizationId: string): Promise<void> {
    await db
      .update(guarantees)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(
        eq(guarantees.id, guaranteeId),
        eq(guarantees.organizationId, organizationId)
      ));
  }

  // AI Insight Config operations
  async getUserAiConfig(userId: string): Promise<AiInsightConfig | undefined> {
    const [config] = await db
      .select()
      .from(aiInsightConfig)
      .where(eq(aiInsightConfig.userId, userId))
      .limit(1);
    return config;
  }

  async upsertAiConfig(config: InsertAiInsightConfig): Promise<AiInsightConfig> {
    const [upsertedConfig] = await db
      .insert(aiInsightConfig)
      .values(config)
      .onConflictDoUpdate({
        target: aiInsightConfig.userId,
        set: {
          ...config,
          updatedAt: new Date(),
        },
      })
      .returning();
    return upsertedConfig;
  }

  // Dashboard analytics
  async getUserPortfolioSummary(organizationId: string): Promise<{
    totalOutstanding: number;
    totalCreditLimit: number;
    availableCredit: number;
    portfolioLtv: number;
    portfolioFacilityLtv: number;
    portfolioOutstandingLtv: number;
    activeLoansCount: number;
    bankExposures: Array<{
      bankId: string;
      bankName: string;
      outstanding: number;
      creditLimit: number;
      utilization: number;
      facilityLtv: number;
      outstandingLtv: number;
    }>;
  }> {
    // Get active loans with facilities and banks
    const activeLoans = await this.getActiveLoansByUser(organizationId);
    
    // Get user facilities
    const userFacilities = await db
      .select()
      .from(facilities)
      .innerJoin(banks, eq(facilities.bankId, banks.id))
      .where(and(eq(facilities.organizationId, organizationId), eq(facilities.isActive, true)));

    // Calculate totals
    const totalOutstanding = activeLoans.reduce((sum, loan) => sum + parseFloat(loan.amount), 0);
    const totalCreditLimit = userFacilities.reduce((sum, facility) => sum + parseFloat(facility.facilities.creditLimit), 0);
    const availableCredit = Math.max(0, totalCreditLimit - totalOutstanding);

    // Get total collateral value for LTV calculation (portfolio-level)
    const userCollateralList = await this.getUserCollateral(organizationId);
    const totalCollateralValue = userCollateralList.reduce((sum, col) => sum + parseFloat(col.currentValue), 0);
    const portfolioLtv = totalCollateralValue > 0 ? (totalOutstanding / totalCollateralValue) * 100 : 0;
    const portfolioFacilityLtv = totalCreditLimit > 0 ? (totalCollateralValue / totalCreditLimit) * 100 : 0;
    const portfolioOutstandingLtv = totalOutstanding > 0 ? (totalCollateralValue / totalOutstanding) * 100 : 0;

    // Calculate bank exposures
    const bankExposuresMap = new Map<string, { bankId: string; bankName: string; outstanding: number; creditLimit: number; }>();

    // FIRST: Initialize map with all facilities (ensures facilities without loans appear)
    userFacilities.forEach(facility => {
      const bankId = facility.banks.id;
      const bankName = facility.banks.name;
      const creditLimit = parseFloat(facility.facilities.creditLimit);

      const existing = bankExposuresMap.get(bankId);
      if (existing) {
        existing.creditLimit += creditLimit;
      } else {
        bankExposuresMap.set(bankId, {
          bankId,
          bankName,
          outstanding: 0,
          creditLimit,
        });
      }
    });

    // SECOND: Add outstanding amounts from active loans
    activeLoans.forEach(loan => {
      const bankId = loan.facility.bank.id;
      const bankName = loan.facility.bank.name;
      const amount = parseFloat(loan.amount);

      const existing = bankExposuresMap.get(bankId);
      if (existing) {
        existing.outstanding += amount;
      } else {
        // Edge case: loan's bank not in map (shouldn't happen if facility exists)
        bankExposuresMap.set(bankId, {
          bankId,
          bankName,
          outstanding: amount,
          creditLimit: 0,
        });
      }
    });

    // THIRD: Calculate bank-specific collateral values
    const bankCollateralMap = new Map<string, number>();
    
    // Get active collateral assignments with collateral details
    const activeAssignments = await db
      .select()
      .from(collateralAssignments)
      .innerJoin(collateral, eq(collateralAssignments.collateralId, collateral.id))
      .where(and(
        eq(collateral.organizationId, organizationId),
        eq(collateralAssignments.isActive, true)
      ));

    // Build facility->bank map for quick lookup
    const facilityToBankMap = new Map<string, string>();
    userFacilities.forEach(facility => {
      facilityToBankMap.set(facility.facilities.id, facility.banks.id);
    });

    // Aggregate collateral by bank
    activeAssignments.forEach(assignment => {
      const collateralValue = parseFloat(assignment.collateral.currentValue);
      let targetBankId: string | null = null;

      // Check if assigned directly to a bank
      if (assignment.collateral_assignments.bankId) {
        targetBankId = assignment.collateral_assignments.bankId;
      }
      // Check if assigned to a facility
      else if (assignment.collateral_assignments.facilityId) {
        targetBankId = facilityToBankMap.get(assignment.collateral_assignments.facilityId) || null;
      }

      // Add collateral value to bank's total
      if (targetBankId) {
        const currentValue = bankCollateralMap.get(targetBankId) || 0;
        bankCollateralMap.set(targetBankId, currentValue + collateralValue);
      }
    });

    const bankExposures = Array.from(bankExposuresMap.values()).map(exposure => {
      const bankCollateralValue = bankCollateralMap.get(exposure.bankId) || 0;
      return {
        ...exposure,
        utilization: exposure.creditLimit > 0 ? (exposure.outstanding / exposure.creditLimit) * 100 : 0,
        facilityLtv: exposure.creditLimit > 0 ? (bankCollateralValue / exposure.creditLimit) * 100 : 0,
        outstandingLtv: exposure.outstanding > 0 ? (bankCollateralValue / exposure.outstanding) * 100 : 0,
      };
    });

    return {
      totalOutstanding,
      totalCreditLimit,
      availableCredit,
      portfolioLtv,
      portfolioFacilityLtv,
      portfolioOutstandingLtv,
      activeLoansCount: activeLoans.length,
      bankExposures,
    };
  }

  // Exposure Snapshot operations
  async listExposureSnapshots(filters: {
    userId: string;
    from?: string;
    to?: string;
    bankId?: string;
    facilityId?: string;
  }): Promise<Array<ExposureSnapshot & { bank?: Bank; facility?: Facility }>> {
    // Build dynamic where conditions
    const conditions = [eq(exposureSnapshots.userId, filters.userId)];

    if (filters.from) {
      conditions.push(gte(exposureSnapshots.date, filters.from));
    }

    if (filters.to) {
      conditions.push(lte(exposureSnapshots.date, filters.to));
    }

    if (filters.bankId) {
      conditions.push(eq(exposureSnapshots.bankId, filters.bankId));
    }

    if (filters.facilityId) {
      conditions.push(eq(exposureSnapshots.facilityId, filters.facilityId));
    }

    const results = await db
      .select()
      .from(exposureSnapshots)
      .leftJoin(banks, eq(exposureSnapshots.bankId, banks.id))
      .leftJoin(facilities, eq(exposureSnapshots.facilityId, facilities.id))
      .where(and(...conditions))
      .orderBy(desc(exposureSnapshots.date), asc(banks.name));

    return results.map(result => ({
      ...result.exposure_snapshots,
      bank: result.banks || undefined,
      facility: result.facilities || undefined,
    }));
  }

  async addExposureSnapshots(snapshots: InsertExposureSnapshot[]): Promise<ExposureSnapshot[]> {
    const results = await db.insert(exposureSnapshots).values(snapshots).returning();
    return results;
  }

  // Transaction operations
  async listTransactions(filters: {
    userId: string;
    from?: string;
    to?: string;
    bankId?: string;
    facilityId?: string;
    loanId?: string;
    type?: TransactionType;
    limit?: number;
    offset?: number;
  }): Promise<Array<Transaction & { bank: Bank; facility?: Facility; loan?: Loan }>> {
    const conditions = [eq(transactions.userId, filters.userId)];

    if (filters.from) {
      conditions.push(gte(transactions.date, filters.from));
    }

    if (filters.to) {
      conditions.push(lte(transactions.date, filters.to));
    }

    if (filters.bankId) {
      conditions.push(eq(transactions.bankId, filters.bankId));
    }

    if (filters.facilityId) {
      conditions.push(eq(transactions.facilityId, filters.facilityId));
    }

    if (filters.loanId) {
      conditions.push(eq(transactions.loanId, filters.loanId));
    }

    if (filters.type) {
      conditions.push(eq(transactions.type, filters.type));
    }

    const results = await db
      .select()
      .from(transactions)
      .innerJoin(banks, eq(transactions.bankId, banks.id))
      .leftJoin(facilities, eq(transactions.facilityId, facilities.id))
      .leftJoin(loans, eq(transactions.loanId, loans.id))
      .where(and(...conditions))
      .orderBy(desc(transactions.date), desc(transactions.createdAt))
      .limit(filters.limit || 50)
      .offset(filters.offset || 0);

    return results.map(result => ({
      ...result.transactions,
      bank: result.banks,
      facility: result.facilities || undefined,
      loan: result.loans || undefined,
    }));
  }

  async getTransactionCount(filters: {
    userId: string;
    from?: string;
    to?: string;
    bankId?: string;
    facilityId?: string;
    loanId?: string;
    type?: TransactionType;
  }): Promise<number> {
    const conditions = [eq(transactions.userId, filters.userId)];

    if (filters.from) {
      conditions.push(gte(transactions.date, filters.from));
    }

    if (filters.to) {
      conditions.push(lte(transactions.date, filters.to));
    }

    if (filters.bankId) {
      conditions.push(eq(transactions.bankId, filters.bankId));
    }

    if (filters.facilityId) {
      conditions.push(eq(transactions.facilityId, filters.facilityId));
    }

    if (filters.loanId) {
      conditions.push(eq(transactions.loanId, filters.loanId));
    }

    if (filters.type) {
      conditions.push(eq(transactions.type, filters.type));
    }

    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(and(...conditions));

    return result.count;
  }

  async addTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [result] = await db.insert(transactions).values(transaction).returning();
    return result;
  }

  // Bank Performance operations
  async getBankPerformance(bankId: string, organizationId: string): Promise<{
    relationshipDuration: {
      days: number;
      years: number;
    };
    averageRateByFacility: Array<{
      facilityId: string;
      facilityName: string;
      avgAllInRate: number;
      loanCount: number;
    }>;
    paymentRecord: {
      score: 'Excellent' | 'Good' | 'Fair' | 'Poor';
      earlyCount: number;
      onTimeCount: number;
      lateCount: number;
      totalCount: number;
    };
    lastActivity: string | null;
  }> {
    // Get all facilities for this bank and organization
    const bankFacilities = await db
      .select()
      .from(facilities)
      .where(and(
        eq(facilities.bankId, bankId),
        eq(facilities.organizationId, organizationId)
      ))
      .orderBy(asc(facilities.createdAt));

    // 1. Calculate relationship duration from earliest facility
    let relationshipDuration = { days: 0, years: 0 };
    if (bankFacilities.length > 0) {
      const earliestDate = new Date(bankFacilities[0].createdAt!);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - earliestDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const diffYears = Number((diffDays / 365).toFixed(1));
      relationshipDuration = { days: diffDays, years: diffYears };
    }

    // 2. Calculate average all-in rate per facility (weighted by outstanding)
    const averageRateByFacility: Array<{
      facilityId: string;
      facilityName: string;
      avgAllInRate: number;
      loanCount: number;
    }> = [];

    for (const facility of bankFacilities) {
      // Get active loans for this facility
      const facilityLoans = await db
        .select()
        .from(loans)
        .where(and(
          eq(loans.facilityId, facility.id),
          eq(loans.status, 'active')
        ));

      if (facilityLoans.length > 0) {
        // Calculate weighted average rate
        let totalWeightedRate = 0;
        let totalOutstanding = 0;

        for (const loan of facilityLoans) {
          const balance = await this.calculateLoanBalance(loan.id);
          const outstanding = parseFloat(balance.total);
          const allInRate = parseFloat(loan.siborRate) + parseFloat(loan.marginRate);
          
          totalWeightedRate += allInRate * outstanding;
          totalOutstanding += outstanding;
        }

        const avgAllInRate = totalOutstanding > 0 
          ? Number((totalWeightedRate / totalOutstanding).toFixed(2))
          : 0;

        averageRateByFacility.push({
          facilityId: facility.id,
          facilityName: facility.name || `${facility.facilityType} - ${facility.creditLimit} SAR`,
          avgAllInRate,
          loanCount: facilityLoans.length
        });
      }
    }

    // 3. Calculate payment record score
    const facilityIds = bankFacilities.map(f => f.id);
    const allLoans = await db
      .select()
      .from(loans)
      .where(and(
        sql`${loans.facilityId} = ANY(${facilityIds})`,
        or(
          eq(loans.status, 'settled'),
          eq(loans.status, 'active')
        )
      ));

    let earlyCount = 0;
    let onTimeCount = 0;
    let lateCount = 0;

    for (const loan of allLoans) {
      if (loan.status === 'settled' && loan.settlementDate && loan.dueDate) {
        const settleDate = new Date(loan.settlementDate);
        const dueDate = new Date(loan.dueDate);
        
        if (settleDate < dueDate) {
          earlyCount++;
        } else if (settleDate.toDateString() === dueDate.toDateString()) {
          onTimeCount++;
        } else {
          lateCount++;
        }
      } else if (loan.status === 'active' && loan.dueDate) {
        const today = new Date();
        const dueDate = new Date(loan.dueDate);
        
        if (today > dueDate) {
          lateCount++;
        }
      }
    }

    const totalCount = earlyCount + onTimeCount + lateCount;
    let score: 'Excellent' | 'Good' | 'Fair' | 'Poor' = 'Poor';

    if (totalCount > 0) {
      const earlyPercent = (earlyCount / totalCount) * 100;
      const latePercent = (lateCount / totalCount) * 100;

      if (earlyPercent >= 90 && latePercent === 0) {
        score = 'Excellent';
      } else if ((earlyCount + onTimeCount) / totalCount >= 0.7 && latePercent < 10) {
        score = 'Good';
      } else if ((earlyCount + onTimeCount) / totalCount >= 0.5 && latePercent < 30) {
        score = 'Fair';
      }
    }

    // 4. Get last activity (most recent loan drawdown)
    const recentLoan = await db
      .select()
      .from(loans)
      .where(sql`${loans.facilityId} = ANY(${facilityIds})`)
      .orderBy(desc(loans.createdAt))
      .limit(1);

    const lastActivity = recentLoan.length > 0 ? recentLoan[0].createdAt!.toISOString() : null;

    return {
      relationshipDuration,
      averageRateByFacility,
      paymentRecord: {
        score,
        earlyCount,
        onTimeCount,
        lateCount,
        totalCount
      },
      lastActivity
    };
  }

  // Attachment operations
  async getAttachmentsByOwner(ownerType: AttachmentOwnerType, ownerId: string, userId: string): Promise<Attachment[]> {
    return await db
      .select()
      .from(attachments)
      .where(and(
        eq(attachments.ownerType, ownerType),
        eq(attachments.ownerId, ownerId),
        eq(attachments.userId, userId),
        isNull(attachments.deletedAt)
      ))
      .orderBy(desc(attachments.createdAt));
  }

  async createAttachment(attachment: InsertAttachment): Promise<Attachment> {
    const [result] = await db.insert(attachments).values(attachment).returning();
    return result;
  }

  async updateAttachmentMetadata(
    attachmentId: string, 
    metadata: Partial<Pick<InsertAttachment, 'category' | 'tags' | 'description'>>, 
    userId: string
  ): Promise<Attachment> {
    const result = await db
      .update(attachments)
      .set(metadata)
      .where(and(
        eq(attachments.id, attachmentId),
        eq(attachments.userId, userId),
        isNull(attachments.deletedAt)
      ))
      .returning();
    
    if (result.length === 0) {
      throw new Error('Attachment not found or access denied');
    }
    
    return result[0];
  }

  async deleteAttachment(attachmentId: string, userId: string): Promise<void> {
    await db
      .update(attachments)
      .set({ deletedAt: new Date() })
      .where(and(
        eq(attachments.id, attachmentId),
        eq(attachments.userId, userId)
      ));
  }

  async getAttachmentById(attachmentId: string, userId: string): Promise<Attachment | undefined> {
    const [result] = await db
      .select()
      .from(attachments)
      .where(and(
        eq(attachments.id, attachmentId),
        eq(attachments.userId, userId),
        isNull(attachments.deletedAt)
      ))
      .limit(1);
    return result;
  }

  // Attachment audit operations
  async createAttachmentAudit(audit: InsertAttachmentAudit): Promise<AttachmentAudit> {
    const [result] = await db.insert(attachmentAudit).values(audit).returning();
    return result;
  }

  async getAttachmentAuditTrail(attachmentId: string): Promise<AttachmentAudit[]> {
    return await db
      .select()
      .from(attachmentAudit)
      .where(eq(attachmentAudit.attachmentId, attachmentId))
      .orderBy(desc(attachmentAudit.createdAt));
  }

  // Chat Conversation operations
  async getUserConversations(userId: string): Promise<ChatConversation[]> {
    return await db
      .select()
      .from(chatConversations)
      .where(and(
        eq(chatConversations.userId, userId),
        eq(chatConversations.isActive, true)
      ))
      .orderBy(desc(chatConversations.updatedAt));
  }

  async getConversation(conversationId: string): Promise<ChatConversation | undefined> {
    const [result] = await db
      .select()
      .from(chatConversations)
      .where(and(
        eq(chatConversations.id, conversationId),
        eq(chatConversations.isActive, true)
      ))
      .limit(1);
    return result;
  }

  async createConversation(conversation: InsertChatConversation): Promise<ChatConversation> {
    const [result] = await db
      .insert(chatConversations)
      .values(conversation)
      .returning();
    return result;
  }

  async updateConversation(conversationId: string, updates: Partial<InsertChatConversation>): Promise<ChatConversation> {
    const [result] = await db
      .update(chatConversations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(chatConversations.id, conversationId))
      .returning();
    return result;
  }

  async deleteConversation(conversationId: string): Promise<void> {
    await db
      .update(chatConversations)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(chatConversations.id, conversationId));
  }

  // Chat Message operations
  async getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId))
      .orderBy(asc(chatMessages.createdAt));
  }

  async addMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [result] = await db
      .insert(chatMessages)
      .values(message)
      .returning();
    return result;
  }

  // Organization operations
  async createOrganization(organization: InsertOrganization): Promise<Organization> {
    const [result] = await db
      .insert(organizations)
      .values(organization)
      .returning();
    return result;
  }

  async getOrganization(organizationId: string): Promise<Organization | undefined> {
    const [result] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, organizationId));
    return result;
  }

  async getUserOrganization(userId: string): Promise<Organization | undefined> {
    const [membership] = await db
      .select()
      .from(organizationMembers)
      .where(eq(organizationMembers.userId, userId));
    
    if (!membership) return undefined;

    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, membership.organizationId));
    return org;
  }

  async updateOrganization(organizationId: string, updates: Partial<InsertOrganization>): Promise<Organization> {
    const [result] = await db
      .update(organizations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(organizations.id, organizationId))
      .returning();
    return result;
  }

  // Organization Member operations
  async addMember(member: InsertOrganizationMember): Promise<OrganizationMember> {
    const [result] = await db
      .insert(organizationMembers)
      .values(member)
      .returning();
    return result;
  }

  async removeMember(userId: string, organizationId: string): Promise<void> {
    await db
      .delete(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.organizationId, organizationId)
        )
      );
  }

  async getOrganizationMembers(organizationId: string): Promise<Array<OrganizationMember & { user: User }>> {
    const results = await db
      .select({
        id: organizationMembers.id,
        userId: organizationMembers.userId,
        organizationId: organizationMembers.organizationId,
        isOwner: organizationMembers.isOwner,
        joinedAt: organizationMembers.joinedAt,
        user: users,
      })
      .from(organizationMembers)
      .innerJoin(users, eq(organizationMembers.userId, users.id))
      .where(eq(organizationMembers.organizationId, organizationId));
    
    return results.map(r => ({
      id: r.id,
      userId: r.userId,
      organizationId: r.organizationId,
      isOwner: r.isOwner,
      joinedAt: r.joinedAt,
      user: r.user,
    }));
  }

  async getOrganizationMembership(userId: string): Promise<OrganizationMember | undefined> {
    const [result] = await db
      .select()
      .from(organizationMembers)
      .where(eq(organizationMembers.userId, userId));
    return result;
  }

  async isUserInOrganization(userId: string, organizationId: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.organizationId, organizationId)
        )
      );
    return !!result;
  }

  // Organization Invitation operations
  async createInvitation(invitation: InsertOrganizationInvitation): Promise<OrganizationInvitation> {
    const [result] = await db
      .insert(organizationInvitations)
      .values(invitation)
      .returning();
    return result;
  }

  async getInvitation(token: string): Promise<OrganizationInvitation | undefined> {
    const [result] = await db
      .select()
      .from(organizationInvitations)
      .where(eq(organizationInvitations.token, token));
    return result;
  }

  async deleteInvitation(invitationId: string): Promise<void> {
    await db
      .delete(organizationInvitations)
      .where(eq(organizationInvitations.id, invitationId));
  }

  async getOrganizationInvitations(organizationId: string): Promise<OrganizationInvitation[]> {
    return await db
      .select()
      .from(organizationInvitations)
      .where(eq(organizationInvitations.organizationId, organizationId))
      .orderBy(desc(organizationInvitations.createdAt));
  }
}

// In-memory storage fallback implementation
export class MemoryStorage implements IStorage {
  private users = new Map<string, User>();
  private banks = new Map<string, Bank>();
  private bankContacts = new Map<string, BankContact>();
  private facilities = new Map<string, Facility>();
  private creditLines = new Map<string, CreditLine>();
  private collateral = new Map<string, Collateral>();
  private collateralAssignments = new Map<string, CollateralAssignment>();
  private loans = new Map<string, Loan>();
  private documents = new Map<string, Document>();
  private loanReminders = new Map<string, LoanReminder>();
  private reminderTemplates = new Map<string, ReminderTemplate>();
  private userReminderSettings = new Map<string, UserReminderSettings>();
  private userPreferences = new Map<string, UserPreferences>();
  private guarantees = new Map<string, Guarantee>();
  private aiConfigs = new Map<string, AiInsightConfig>();
  private dailyAlertsPrefs = new Map<string, DailyAlertsPreferences>();
  private exposureSnapshots = new Map<string, ExposureSnapshot>();
  private transactions = new Map<string, Transaction>();
  private attachments = new Map<string, Attachment>();
  private attachmentAudits = new Map<string, AttachmentAudit>();
  private chatConversations = new Map<string, ChatConversation>();
  private chatMessages = new Map<string, ChatMessage>();
  private organizations = new Map<string, Organization>();
  private organizationMembers = new Map<string, OrganizationMember>();
  private organizationInvitations = new Map<string, OrganizationInvitation>();

  constructor() {
    // Initialize with default Saudi banks
    this.initializeDefaultBanks();
    // Initialize with default reminder templates
    this.initializeDefaultTemplates();
  }

  private initializeDefaultBanks() {
    const defaultBanks = [
      { id: 'ANB', code: 'ANB', name: 'Arab National Bank', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'RJH', code: 'RJH', name: 'Al Rajhi Bank', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'INMA', code: 'INMA', name: 'Alinma Bank', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'ALB', code: 'ALB', name: 'Bank Albilad', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'BJA', code: 'BJA', name: 'Bank AlJazira', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'BSF', code: 'BSF', name: 'Banque Saudi Fransi', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'RIB', code: 'RIB', name: 'Riyad Bank', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'SAB', code: 'SAB', name: 'Saudi Awwal Bank', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'SAIB', code: 'SAIB', name: 'Saudi Investment Bank', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'SNB', code: 'SNB', name: 'Saudi National Bank', isActive: true, createdAt: new Date(), updatedAt: new Date() }
    ];

    defaultBanks.forEach(bank => this.banks.set(bank.id, bank));
  }

  private initializeDefaultTemplates() {
    const defaultTemplates: ReminderTemplate[] = [
      {
        id: 'tpl_due_date_standard',
        type: 'due_date',
        name: 'Standard Due Date Alert',
        subject: 'Loan Payment Due - {loanReference}',
        emailTemplate: `Dear Valued Customer,

This is a friendly reminder that your loan payment is approaching its due date.

Loan Details:
- Reference: {loanReference}
- Bank: {bankName}
- Amount Due: {amount} SAR
- Due Date: {dueDate}

Please ensure timely payment to avoid any penalties or disruptions to your credit facility.

If you have already made the payment, please disregard this message.

Best regards,
Saudi Loan Management Team`,
        calendarTemplate: `Loan Payment Due - {loanReference}

Amount: {amount} SAR
Due Date: {dueDate}
Bank: {bankName}

Reference: {loanReference}`,
        variables: ['{loanReference}', '{amount}', '{dueDate}', '{bankName}'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'tpl_payment_urgent',
        type: 'payment',
        name: 'Urgent Payment Reminder',
        subject: 'Urgent: Loan Payment Overdue - {loanReference}',
        emailTemplate: `Dear Valued Customer,

This is an urgent reminder regarding your loan payment.

Loan Details:
- Reference: {loanReference}
- Bank: {bankName}
- Outstanding Amount: {amount} SAR
- Original Due Date: {dueDate}

Your payment is now overdue. Please arrange immediate payment to avoid:
- Late payment penalties
- Negative impact on your credit rating
- Potential legal action

If you need assistance with payment arrangements, please contact us immediately.

Best regards,
Saudi Loan Management Team`,
        calendarTemplate: `URGENT: Loan Payment Overdue - {loanReference}

Amount: {amount} SAR
Due Date (Passed): {dueDate}
Bank: {bankName}

Immediate payment required!

Reference: {loanReference}`,
        variables: ['{loanReference}', '{amount}', '{dueDate}', '{bankName}'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'tpl_review_annual',
        type: 'review',
        name: 'Annual Loan Review',
        subject: 'Annual Loan Review Required - {loanReference}',
        emailTemplate: `Dear Valued Customer,

It's time for your annual loan review.

Loan Details:
- Reference: {loanReference}
- Bank: {bankName}
- Current Outstanding: {amount} SAR
- Review Date: {dueDate}

As part of our standard procedures, we need to review your loan facility. This review helps ensure:
- Your credit terms remain optimal
- Documentation is up to date
- Facility limits meet your business needs

Please prepare:
1. Updated financial statements
2. Current business plan
3. Any changes to your business structure

We will contact you shortly to schedule a meeting.

Best regards,
Saudi Loan Management Team`,
        calendarTemplate: `Annual Loan Review - {loanReference}

Review Date: {dueDate}
Bank: {bankName}
Current Balance: {amount} SAR

Prepare financial documents and business updates.

Reference: {loanReference}`,
        variables: ['{loanReference}', '{amount}', '{dueDate}', '{bankName}'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'tpl_due_date_7days',
        type: 'due_date',
        name: '7-Day Advance Notice',
        subject: 'Reminder: Loan Payment Due in 7 Days - {loanReference}',
        emailTemplate: `Dear Valued Customer,

This is an advance reminder that your loan payment will be due in 7 days.

Loan Details:
- Reference: {loanReference}
- Bank: {bankName}
- Amount Due: {amount} SAR
- Due Date: {dueDate}

This early notification allows you to plan your cash flow accordingly.

Payment Methods:
- Bank transfer to your facility account
- Through your online banking portal
- Visit your bank branch

Thank you for your continued business.

Best regards,
Saudi Loan Management Team`,
        calendarTemplate: `Payment Due in 7 Days - {loanReference}

Amount: {amount} SAR
Due Date: {dueDate}
Bank: {bankName}

Plan your payment in advance.

Reference: {loanReference}`,
        variables: ['{loanReference}', '{amount}', '{dueDate}', '{bankName}'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    defaultTemplates.forEach(template => this.reminderTemplates.set(template.id, template));
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existing = this.users.get(userData.id);
    const user: User = {
      ...userData,
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.users.set(userData.id, user);
    return user;
  }

  // Bank operations
  async getAllBanks(organizationId?: string): Promise<Bank[]> {
    return Array.from(this.banks.values())
      .filter(bank => bank.isActive && (!organizationId || bank.organizationId === organizationId));
  }

  async createBank(bank: InsertBank): Promise<Bank> {
    const newBank: Bank = {
      ...bank,
      id: bank.id || this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.banks.set(newBank.id, newBank);
    return newBank;
  }

  // Bank Contact operations
  async getBankContacts(bankId: string, organizationId: string): Promise<Array<BankContact & { bank: Bank }>> {
    const bank = this.banks.get(bankId);
    if (!bank) return [];

    return Array.from(this.bankContacts.values())
      .filter(contact => contact.bankId === bankId && contact.organizationId === organizationId && contact.isActive)
      .map(contact => ({ ...contact, bank }))
      .sort((a, b) => {
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        return a.name.localeCompare(b.name);
      });
  }

  async createBankContact(contact: InsertBankContact): Promise<BankContact> {
    const newContact: BankContact = {
      ...contact,
      id: this.generateId(),
      isActive: contact.isActive ?? true, // Ensure isActive is set to true by default
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.bankContacts.set(newContact.id, newContact);
    console.log(`✅ Created bank contact: ${newContact.name} for bank ${newContact.bankId} (ID: ${newContact.id})`);
    return newContact;
  }

  async updateBankContact(contactId: string, organizationId: string, contact: Partial<InsertBankContact>): Promise<BankContact> {
    const existing = this.bankContacts.get(contactId);
    if (!existing || existing.organizationId !== organizationId) {
      throw new Error('Contact not found');
    }

    const updated: BankContact = {
      ...existing,
      ...contact,
      updatedAt: new Date(),
    };
    this.bankContacts.set(contactId, updated);
    return updated;
  }

  async deleteBankContact(contactId: string, organizationId: string): Promise<void> {
    const existing = this.bankContacts.get(contactId);
    if (existing && existing.organizationId === organizationId) {
      existing.isActive = false;
      existing.updatedAt = new Date();
      this.bankContacts.set(contactId, existing);
    }
  }

  async setPrimaryContact(contactId: string, bankId: string, organizationId: string): Promise<BankContact> {
    // First, unset all primary contacts for this bank/organization
    for (const contact of this.bankContacts.values()) {
      if (contact.bankId === bankId && contact.organizationId === organizationId && contact.isPrimary) {
        contact.isPrimary = false;
        contact.updatedAt = new Date();
      }
    }

    // Set the specified contact as primary
    const contact = this.bankContacts.get(contactId);
    if (!contact) throw new Error('Contact not found');

    contact.isPrimary = true;
    contact.updatedAt = new Date();
    this.bankContacts.set(contactId, contact);
    return contact;
  }

  // Stub implementations for other methods (simplified for core functionality)
  async getUserFacilities(organizationId: string): Promise<Array<Facility & { bank: Bank }>> {
    const userFacilities = Array.from(this.facilities.values())
      .filter(facility => facility.organizationId === organizationId && (facility.isActive ?? true));
    
    return userFacilities.map(facility => {
      const bank = this.banks.get(facility.bankId);
      if (!bank) {
        console.warn(`Bank not found for facility ${facility.id}: ${facility.bankId}`);
        // Return facility with a placeholder bank to avoid breaking the UI
        return {
          ...facility,
          bank: {
            id: facility.bankId,
            code: facility.bankId,
            name: `Bank ${facility.bankId}`,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        };
      }
      return { ...facility, bank };
    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getFacilityWithBank(facilityId: string): Promise<(Facility & { bank: Bank }) | undefined> {
    return undefined;
  }

  async createFacility(facility: InsertFacility): Promise<Facility> {
    const newFacility: Facility = {
      ...facility,
      id: this.generateId(),
      isActive: facility.isActive ?? true, // Ensure isActive is set to true by default
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.facilities.set(newFacility.id, newFacility);
    console.log(`✅ Created facility: ${newFacility.facilityType} for bank ${newFacility.bankId} (ID: ${newFacility.id})`);
    return newFacility;
  }

  async updateFacility(facilityId: string, organizationId: string, facility: Partial<InsertFacility>): Promise<Facility> {
    const existing = this.facilities.get(facilityId);
    if (!existing || existing.organizationId !== organizationId) {
      throw new Error('Facility not found');
    }

    const updated: Facility = {
      ...existing,
      ...facility,
      updatedAt: new Date(),
    };
    this.facilities.set(facilityId, updated);
    return updated;
  }

  async deleteFacility(facilityId: string, organizationId: string): Promise<void> {
    const existing = this.facilities.get(facilityId);
    if (!existing || existing.organizationId !== organizationId) {
      throw new Error('Facility not found');
    }
    
    // Remove the facility from memory
    this.facilities.delete(facilityId);
    console.log(`✅ Deleted facility: ${existing.facilityType} for bank ${existing.bankId} (ID: ${facilityId})`);
  }

  async getUserCollateral(organizationId: string): Promise<Collateral[]> {
    return [];
  }

  async createCollateral(collateral: InsertCollateral): Promise<Collateral> {
    const newCollateral: Collateral = {
      ...collateral,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.collateral.set(newCollateral.id, newCollateral);
    return newCollateral;
  }

  async updateCollateral(collateralId: string, organizationId: string, collateral: Partial<InsertCollateral>): Promise<Collateral> {
    const existing = this.collateral.get(collateralId);
    if (!existing || existing.organizationId !== organizationId) {
      throw new Error('Collateral not found');
    }

    const updated: Collateral = {
      ...existing,
      ...collateral,
      updatedAt: new Date(),
    };
    this.collateral.set(collateralId, updated);
    return updated;
  }

  async deleteCollateral(collateralId: string, organizationId: string): Promise<void> {
    const existing = this.collateral.get(collateralId);
    if (existing && existing.organizationId === organizationId) {
      const updated = { ...existing, isActive: false, updatedAt: new Date() };
      this.collateral.set(collateralId, updated);
    }
  }

  // Collateral Assignment operations (simplified in-memory implementation)
  async getUserCollateralAssignments(organizationId: string): Promise<Array<CollateralAssignment & { 
    collateral: Collateral; 
    facility?: Facility & { bank: Bank }; 
    creditLine?: CreditLine & { facility: Facility & { bank: Bank } } 
  }>> {
    return [];
  }

  async createCollateralAssignment(assignment: InsertCollateralAssignment): Promise<CollateralAssignment> {
    const newAssignment: CollateralAssignment = {
      ...assignment,
      id: this.generateId(),
      createdAt: new Date(),
    };
    this.collateralAssignments.set(newAssignment.id, newAssignment);
    return newAssignment;
  }

  async updateCollateralAssignment(assignmentId: string, organizationId: string, assignment: Partial<InsertCollateralAssignment>): Promise<CollateralAssignment> {
    const existing = this.collateralAssignments.get(assignmentId);
    if (!existing || existing.organizationId !== organizationId) {
      throw new Error('Collateral assignment not found');
    }

    const updated: CollateralAssignment = {
      ...existing,
      ...assignment,
    };
    this.collateralAssignments.set(assignmentId, updated);
    return updated;
  }

  async deleteCollateralAssignment(assignmentId: string, organizationId: string): Promise<void> {
    const existing = this.collateralAssignments.get(assignmentId);
    if (existing && existing.organizationId === organizationId) {
      const updated = { ...existing, isActive: false };
      this.collateralAssignments.set(assignmentId, updated);
    }
  }

  async getUserCreditLines(organizationId: string): Promise<Array<CreditLine & { facility: Facility & { bank: Bank } }>> {
    return [];
  }

  async createCreditLine(creditLine: InsertCreditLine): Promise<CreditLine> {
    const newCreditLine: CreditLine = {
      ...creditLine,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.creditLines.set(newCreditLine.id, newCreditLine);
    return newCreditLine;
  }

  async updateCreditLine(creditLineId: string, organizationId: string, creditLine: Partial<InsertCreditLine>): Promise<CreditLine> {
    const existing = this.creditLines.get(creditLineId);
    if (!existing || existing.organizationId !== organizationId) {
      throw new Error('Credit line not found');
    }

    const updated: CreditLine = {
      ...existing,
      ...creditLine,
      updatedAt: new Date(),
    };
    this.creditLines.set(creditLineId, updated);
    return updated;
  }

  async getUserLoans(organizationId: string): Promise<Loan[]> {
    return Array.from(this.loans.values()).filter(loan => loan.organizationId === organizationId);
  }

  async getActiveLoansByUser(organizationId: string): Promise<(Loan & { facility: Facility & { bank: Bank } })[]> {
    const userLoans = Array.from(this.loans.values()).filter(loan => 
      loan.organizationId === organizationId && 
      (loan.status === 'active' || loan.status === 'overdue')
    );
    
    // Join with facility and bank data
    return userLoans.map(loan => {
      const facility = this.facilities.get(loan.facilityId);
      if (!facility) {
        throw new Error(`Facility not found for loan ${loan.id}`);
      }
      
      const bank = this.banks.get(facility.bankId);
      if (!bank) {
        throw new Error(`Bank not found for facility ${facility.id}`);
      }
      
      return {
        ...loan,
        facility: {
          ...facility,
          bank,
        },
      };
    });
  }

  async getSettledLoansByUser(organizationId: string): Promise<(Loan & { facility: Facility & { bank: Bank } })[]> {
    const userLoans = Array.from(this.loans.values()).filter(loan => loan.organizationId === organizationId && loan.status === 'settled');
    
    // Join with facility and bank data
    return userLoans.map(loan => {
      const facility = this.facilities.get(loan.facilityId);
      if (!facility) {
        throw new Error(`Facility not found for loan ${loan.id}`);
      }
      
      const bank = this.banks.get(facility.bankId);
      if (!bank) {
        throw new Error(`Bank not found for facility ${facility.id}`);
      }
      
      return {
        ...loan,
        facility: {
          ...facility,
          bank,
        },
      };
    });
  }

  async getCancelledLoansByUser(organizationId: string): Promise<(Loan & { facility: Facility & { bank: Bank } })[]> {
    const userLoans = Array.from(this.loans.values()).filter(loan => loan.organizationId === organizationId && loan.status === 'cancelled');
    
    // Join with facility and bank data
    return userLoans.map(loan => {
      const facility = this.facilities.get(loan.facilityId);
      if (!facility) {
        throw new Error(`Facility not found for loan ${loan.id}`);
      }
      
      const bank = this.banks.get(facility.bankId);
      if (!bank) {
        throw new Error(`Bank not found for facility ${facility.id}`);
      }
      
      return {
        ...loan,
        facility: {
          ...facility,
          bank,
        },
      };
    });
  }

  async createLoan(loan: InsertLoan): Promise<Loan> {
    const newLoan: Loan = {
      ...loan,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: loan.status || 'active', // Ensure status is set
      siborTerm: loan.siborTerm || null, // Handle new siborTerm field
    };
    this.loans.set(newLoan.id, newLoan);
    return newLoan;
  }

  async updateLoan(loanId: string, loan: Partial<InsertLoan>): Promise<Loan> {
    const existing = this.loans.get(loanId);
    if (!existing) throw new Error('Loan not found');

    const updated: Loan = {
      ...existing,
      ...loan,
      updatedAt: new Date(),
    };
    this.loans.set(loanId, updated);
    return updated;
  }


  async deleteLoan(loanId: string, organizationId: string, reason?: string): Promise<void> {
    const loan = this.loans.get(loanId);
    if (loan && loan.organizationId === organizationId) {
      loan.status = 'cancelled';
      loan.updatedAt = new Date();
      this.loans.set(loanId, loan);
    } else {
      throw new Error('Loan not found or access denied');
    }
  }

  async permanentlyDeleteLoan(loanId: string, organizationId: string): Promise<void> {
    const loan = this.loans.get(loanId);
    if (!loan || loan.organizationId !== organizationId) {
      throw new Error('Loan not found or access denied');
    }
    
    if (loan.status !== 'cancelled') {
      throw new Error('Only cancelled loans can be permanently deleted');
    }

    // Permanently remove from memory
    this.loans.delete(loanId);
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const newDocument: Document = {
      ...document,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.documents.set(newDocument.id, newDocument);
    return newDocument;
  }

  async getLoanDocuments(loanId: string): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(doc => doc.loanId === loanId);
  }

  // Loan Reminder operations
  async getLoanReminders(loanId: string): Promise<LoanReminder[]> {
    return Array.from(this.loanReminders.values())
      .filter(reminder => reminder.loanId === loanId && reminder.isActive)
      .sort((a, b) => new Date(a.reminderDate).getTime() - new Date(b.reminderDate).getTime());
  }

  async getUserReminders(userId: string): Promise<Array<LoanReminder & { loan: Loan }>> {
    const userReminders = Array.from(this.loanReminders.values())
      .filter(reminder => reminder.userId === userId && reminder.isActive);
    
    return userReminders.map(reminder => {
      const loan = this.loans.get(reminder.loanId);
      if (!loan) throw new Error('Loan not found for reminder');
      return { ...reminder, loan };
    }).sort((a, b) => new Date(a.reminderDate).getTime() - new Date(b.reminderDate).getTime());
  }

  async createLoanReminder(reminder: InsertLoanReminder): Promise<LoanReminder> {
    const newReminder: LoanReminder = {
      ...reminder,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.loanReminders.set(newReminder.id, newReminder);
    return newReminder;
  }

  async updateLoanReminder(reminderId: string, organizationId: string, reminder: Partial<UpdateLoanReminder>): Promise<LoanReminder> {
    const existing = this.loanReminders.get(reminderId);
    if (!existing || existing.organizationId !== organizationId) {
      throw new Error('Reminder not found');
    }

    const updated: LoanReminder = {
      ...existing,
      ...reminder,
      updatedAt: new Date(),
    };
    this.loanReminders.set(reminderId, updated);
    return updated;
  }

  async deleteLoanReminder(reminderId: string, organizationId: string): Promise<void> {
    const existing = this.loanReminders.get(reminderId);
    if (existing && existing.organizationId === organizationId) {
      existing.isActive = false;
      existing.updatedAt = new Date();
    }
  }

  async getUserAiConfig(userId: string): Promise<AiInsightConfig | undefined> {
    return Array.from(this.aiConfigs.values()).find(config => config.userId === userId);
  }

  async upsertAiConfig(config: InsertAiInsightConfig): Promise<AiInsightConfig> {
    const existing = Array.from(this.aiConfigs.values()).find(c => c.userId === config.userId);
    const newConfig: AiInsightConfig = {
      ...config,
      id: existing?.id || this.generateId(),
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.aiConfigs.set(newConfig.id, newConfig);
    return newConfig;
  }

  async getDailyAlertsPreferences(userId: string): Promise<DailyAlertsPreferences | undefined> {
    return Array.from(this.dailyAlertsPrefs.values()).find(pref => pref.userId === userId);
  }

  async upsertDailyAlertsPreferences(preferences: InsertDailyAlertsPreferences): Promise<DailyAlertsPreferences> {
    const existing = Array.from(this.dailyAlertsPrefs.values()).find(p => p.userId === preferences.userId);
    const newPrefs: DailyAlertsPreferences = {
      ...preferences,
      id: existing?.id || this.generateId(),
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.dailyAlertsPrefs.set(newPrefs.id, newPrefs);
    return newPrefs;
  }

  async getUserPortfolioSummary(userId: string): Promise<{
    totalOutstanding: number;
    totalCreditLimit: number;
    availableCredit: number;
    portfolioLtv: number;
    portfolioFacilityLtv: number;
    portfolioOutstandingLtv: number;
    activeLoansCount: number;
    bankExposures: Array<{
      bankId: string;
      bankName: string;
      outstanding: number;
      creditLimit: number;
      utilization: number;
      facilityLtv: number;
      outstandingLtv: number;
    }>;
  }> {
    // Get user facilities
    const userFacilities = Array.from(this.facilities.values()).filter(f => f.userId === userId);
    
    // Get user credit lines
    const userCreditLines = Array.from(this.creditLines.values()).filter(cl => {
      const facility = this.facilities.get(cl.facilityId);
      return facility && facility.userId === userId;
    });
    
    // Get user loans
    const userLoans = Array.from(this.loans.values()).filter(loan => {
      if (loan.facilityId) {
        const facility = this.facilities.get(loan.facilityId);
        return facility && facility.userId === userId;
      }
      return false;
    });
    
    // Calculate totals
    const totalCreditLimit = userFacilities.reduce((sum, f) => sum + Number(f.creditLimit || 0), 0);
    const totalOutstanding = userLoans
      .filter(loan => loan.status === 'active')
      .reduce((sum, loan) => sum + Number(loan.amount || 0), 0);
    const activeLoansCount = userLoans.filter(loan => loan.status === 'active').length;
    
    // Get total collateral value for LTV calculation (portfolio-level)
    const userCollateralList = Array.from(this.collateral.values()).filter(c => c.userId === userId);
    const totalCollateralValue = userCollateralList.reduce((sum, col) => sum + Number(col.currentValue || 0), 0);
    const portfolioLtv = totalCollateralValue > 0 ? (totalOutstanding / totalCollateralValue) * 100 : 0;
    const portfolioFacilityLtv = totalCreditLimit > 0 ? (totalCollateralValue / totalCreditLimit) * 100 : 0;
    const portfolioOutstandingLtv = totalOutstanding > 0 ? (totalCollateralValue / totalOutstanding) * 100 : 0;
    
    // Group by bank to create bank exposures
    const bankGroups = new Map<string, {
      bankId: string;
      bankName: string;
      creditLimit: number;
      outstanding: number;
    }>();
    
    // Process facilities by bank
    userFacilities.forEach(facility => {
      const bank = this.banks.get(facility.bankId);
      if (bank) {
        const existing = bankGroups.get(facility.bankId) || {
          bankId: facility.bankId,
          bankName: bank.name,
          creditLimit: 0,
          outstanding: 0,
        };
        existing.creditLimit += Number(facility.creditLimit || 0);
        bankGroups.set(facility.bankId, existing);
      }
    });
    
    // Add outstanding amounts by bank
    userLoans.filter(loan => loan.status === 'active').forEach(loan => {
      if (loan.facilityId) {
        const facility = this.facilities.get(loan.facilityId);
        if (facility) {
          const existing = bankGroups.get(facility.bankId);
          if (existing) {
            existing.outstanding += Number(loan.amount || 0);
            bankGroups.set(facility.bankId, existing);
          }
        }
      }
    });
    
    // Calculate bank-specific collateral values
    const bankCollateralMap = new Map<string, number>();
    
    // Get active collateral assignments
    const activeAssignments = Array.from(this.collateralAssignments.values())
      .filter(a => a.isActive && a.userId === userId);

    // Build facility->bank map for quick lookup
    const facilityToBankMap = new Map<string, string>();
    userFacilities.forEach(facility => {
      facilityToBankMap.set(facility.id, facility.bankId);
    });

    // Aggregate collateral by bank
    activeAssignments.forEach(assignment => {
      const collateralItem = this.collateral.get(assignment.collateralId);
      if (!collateralItem) return;

      const collateralValue = Number(collateralItem.currentValue || 0);
      let targetBankId: string | null = null;

      // Check if assigned directly to a bank
      if (assignment.bankId) {
        targetBankId = assignment.bankId;
      }
      // Check if assigned to a facility
      else if (assignment.facilityId) {
        targetBankId = facilityToBankMap.get(assignment.facilityId) || null;
      }

      // Add collateral value to bank's total
      if (targetBankId) {
        const currentValue = bankCollateralMap.get(targetBankId) || 0;
        bankCollateralMap.set(targetBankId, currentValue + collateralValue);
      }
    });
    
    // Create bank exposures array with utilization and LTV metrics
    const bankExposures = Array.from(bankGroups.values()).map(bank => {
      const bankCollateralValue = bankCollateralMap.get(bank.bankId) || 0;
      return {
        ...bank,
        utilization: bank.creditLimit > 0 ? (bank.outstanding / bank.creditLimit) * 100 : 0,
        facilityLtv: bank.creditLimit > 0 ? (bankCollateralValue / bank.creditLimit) * 100 : 0,
        outstandingLtv: bank.outstanding > 0 ? (bankCollateralValue / bank.outstanding) * 100 : 0,
      };
    });
    
    return {
      totalOutstanding,
      totalCreditLimit,
      availableCredit: totalCreditLimit - totalOutstanding,
      portfolioLtv,
      portfolioFacilityLtv,
      portfolioOutstandingLtv,
      activeLoansCount,
      bankExposures,
    };
  }

  async listExposureSnapshots(filters: {
    userId: string;
    from?: string;
    to?: string;
    bankId?: string;
    facilityId?: string;
  }): Promise<Array<ExposureSnapshot & { bank?: Bank; facility?: Facility }>> {
    return [];
  }

  async addExposureSnapshots(snapshots: InsertExposureSnapshot[]): Promise<ExposureSnapshot[]> {
    return [];
  }

  async listTransactions(filters: {
    userId: string;
    from?: string;
    to?: string;
    bankId?: string;
    facilityId?: string;
    loanId?: string;
    type?: TransactionType;
    limit?: number;
    offset?: number;
  }): Promise<Array<Transaction & { bank: Bank; facility?: Facility; loan?: Loan }>> {
    return [];
  }

  async getTransactionCount(filters: {
    userId: string;
    from?: string;
    to?: string;
    bankId?: string;
    facilityId?: string;
    loanId?: string;
    type?: TransactionType;
  }): Promise<number> {
    return 0;
  }

  async addTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const newTransaction: Transaction = {
      ...transaction,
      id: this.generateId(),
      createdAt: new Date(),
    };
    this.transactions.set(newTransaction.id, newTransaction);
    return newTransaction;
  }

  // Bank Performance operations
  async getBankPerformance(bankId: string, organizationId: string): Promise<{
    relationshipDuration: {
      days: number;
      years: number;
    };
    averageRateByFacility: Array<{
      facilityId: string;
      facilityName: string;
      avgAllInRate: number;
      loanCount: number;
    }>;
    paymentRecord: {
      score: 'Excellent' | 'Good' | 'Fair' | 'Poor';
      earlyCount: number;
      onTimeCount: number;
      lateCount: number;
      totalCount: number;
    };
    lastActivity: string | null;
  }> {
    // Get all facilities for this bank and organization
    const bankFacilities = Array.from(this.facilities.values())
      .filter(f => f.bankId === bankId && f.organizationId === organizationId)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));

    // 1. Calculate relationship duration from earliest facility
    let relationshipDuration = { days: 0, years: 0 };
    if (bankFacilities.length > 0 && bankFacilities[0].createdAt) {
      const earliestDate = new Date(bankFacilities[0].createdAt);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - earliestDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const diffYears = Number((diffDays / 365).toFixed(1));
      relationshipDuration = { days: diffDays, years: diffYears };
    }

    // 2. Calculate average all-in rate per facility (weighted by outstanding)
    const averageRateByFacility: Array<{
      facilityId: string;
      facilityName: string;
      avgAllInRate: number;
      loanCount: number;
    }> = [];

    for (const facility of bankFacilities) {
      // Get active loans for this facility
      const facilityLoans = Array.from(this.loans.values()).filter(
        l => l.facilityId === facility.id && l.status === 'active'
      );

      if (facilityLoans.length > 0) {
        // Calculate weighted average rate (using loan amount as proxy for outstanding)
        let totalWeightedRate = 0;
        let totalOutstanding = 0;

        for (const loan of facilityLoans) {
          const outstanding = parseFloat(loan.amount);
          const allInRate = parseFloat(loan.siborRate) + parseFloat(loan.marginRate);
          
          totalWeightedRate += allInRate * outstanding;
          totalOutstanding += outstanding;
        }

        const avgAllInRate = totalOutstanding > 0 
          ? Number((totalWeightedRate / totalOutstanding).toFixed(2))
          : 0;

        averageRateByFacility.push({
          facilityId: facility.id,
          facilityName: facility.name || `${facility.facilityType} - ${facility.creditLimit} SAR`,
          avgAllInRate,
          loanCount: facilityLoans.length
        });
      }
    }

    // 3. Calculate payment record score
    const facilityIds = bankFacilities.map(f => f.id);
    const allLoans = Array.from(this.loans.values()).filter(
      l => facilityIds.includes(l.facilityId) && (l.status === 'settled' || l.status === 'active')
    );

    let earlyCount = 0;
    let onTimeCount = 0;
    let lateCount = 0;

    for (const loan of allLoans) {
      if (loan.status === 'settled' && loan.settlementDate && loan.dueDate) {
        const settleDate = new Date(loan.settlementDate);
        const dueDate = new Date(loan.dueDate);
        
        if (settleDate < dueDate) {
          earlyCount++;
        } else if (settleDate.toDateString() === dueDate.toDateString()) {
          onTimeCount++;
        } else {
          lateCount++;
        }
      } else if (loan.status === 'active' && loan.dueDate) {
        const today = new Date();
        const dueDate = new Date(loan.dueDate);
        
        if (today > dueDate) {
          lateCount++;
        }
      }
    }

    const totalCount = earlyCount + onTimeCount + lateCount;
    let score: 'Excellent' | 'Good' | 'Fair' | 'Poor' = 'Poor';

    if (totalCount > 0) {
      const earlyPercent = (earlyCount / totalCount) * 100;
      const latePercent = (lateCount / totalCount) * 100;

      if (earlyPercent >= 90 && latePercent === 0) {
        score = 'Excellent';
      } else if ((earlyCount + onTimeCount) / totalCount >= 0.7 && latePercent < 10) {
        score = 'Good';
      } else if ((earlyCount + onTimeCount) / totalCount >= 0.5 && latePercent < 30) {
        score = 'Fair';
      }
    }

    // 4. Get last activity (most recent loan drawdown)
    const recentLoans = Array.from(this.loans.values())
      .filter(l => facilityIds.includes(l.facilityId))
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));

    const lastActivity = recentLoans.length > 0 && recentLoans[0].createdAt 
      ? recentLoans[0].createdAt.toISOString() 
      : null;

    return {
      relationshipDuration,
      averageRateByFacility,
      paymentRecord: {
        score,
        earlyCount,
        onTimeCount,
        lateCount,
        totalCount
      },
      lastActivity
    };
  }

  // New methods for loan lifecycle management
  async getLoanById(loanId: string): Promise<(Loan & { facility: Facility & { bank: Bank } }) | undefined> {
    const loan = this.loans.get(loanId);
    if (!loan) return undefined;
    
    const facility = this.facilities.get(loan.facilityId);
    if (!facility) return undefined;
    
    const bank = this.banks.get(facility.bankId);
    if (!bank) return undefined;
    
    return {
      ...loan,
      facility: {
        ...facility,
        bank,
      },
    };
  }

  async createTransaction(transaction: InsertTransaction, userId: string): Promise<Transaction> {
    const newTransaction: Transaction = {
      ...transaction,
      id: this.generateId(),
      createdBy: userId,
      createdAt: new Date(),
    };
    this.transactions.set(newTransaction.id, newTransaction);
    return newTransaction;
  }

  async createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog> {
    const newAuditLog: AuditLog = {
      ...auditLog,
      id: this.generateId(),
      createdAt: new Date(),
    };
    // For memory storage, we'll just log audit events
    console.log(`🔍 AUDIT: ${auditLog.action} on ${auditLog.entityType}:${auditLog.entityId} by ${auditLog.userId}`);
    return newAuditLog;
  }

  async getEntityAuditTrail(entityType: string, entityId: string): Promise<AuditLog[]> {
    // For memory storage, return empty array
    return [];
  }

  async processPayment(loanId: string, payment: PaymentRequest, userId: string): Promise<{ loan: Loan; transactions: Transaction[] }> {
    const loan = this.loans.get(loanId);
    if (!loan) throw new Error('Loan not found');

    // Simple payment processing for memory storage
    const paymentTransaction: Transaction = {
      id: this.generateId(),
      userId,
      loanId,
      facilityId: loan.facilityId,
      bankId: '', // We'll need to get this from facility
      type: 'repayment',
      amount: payment.amount,
      date: payment.date,
      memo: payment.memo || 'Payment processed',
      createdBy: userId,
      createdAt: new Date(),
      reference: null,
      notes: null,
      allocation: null,
      idempotencyKey: payment.idempotencyKey || null,
    };

    this.transactions.set(paymentTransaction.id, paymentTransaction);

    return { loan, transactions: [paymentTransaction] };
  }

  async settleLoan(loanId: string, settlement: SettlementRequest, userId: string): Promise<{ loan: Loan; transactions: Transaction[] }> {
    const loan = this.loans.get(loanId);
    if (!loan) throw new Error('Loan not found');

    // Update loan status to settled
    const updatedLoan: Loan = {
      ...loan,
      status: 'settled',
      settledDate: settlement.date,
      settledAmount: settlement.amount || loan.amount,
      updatedAt: new Date(),
    };
    
    this.loans.set(loanId, updatedLoan);

    const settlementTransaction: Transaction = {
      id: this.generateId(),
      userId,
      loanId,
      facilityId: loan.facilityId,
      bankId: '',
      type: 'repayment',
      amount: settlement.amount || loan.amount,
      date: settlement.date,
      memo: settlement.memo || 'Loan settled',
      createdBy: userId,
      createdAt: new Date(),
      reference: null,
      notes: null,
      allocation: null,
      idempotencyKey: null,
    };

    this.transactions.set(settlementTransaction.id, settlementTransaction);

    return { loan: updatedLoan, transactions: [settlementTransaction] };
  }

  async reverseLoanSettlement(loanId: string, reason: string, userId: string): Promise<Loan> {
    const loan = this.loans.get(loanId);
    if (!loan) throw new Error('Loan not found');

    if (loan.status !== 'settled') {
      throw new Error('Loan is not settled - cannot reverse settlement');
    }

    // Create audit log
    console.log(`🔍 AUDIT: settlement_reversed on loan:${loanId} by ${userId} - Reason: ${reason}`);

    // Revert loan to active status
    const reversedLoan: Loan = {
      ...loan,
      status: 'active',
      settledDate: null,
      settledAmount: null,
      reversedAt: new Date(),
      reversalReason: reason,
      reversedBy: userId,
      updatedAt: new Date(),
    };

    this.loans.set(loanId, reversedLoan);

    return reversedLoan;
  }

  async revolveLoan(loanId: string, revolve: RevolveRequest, userId: string): Promise<{ oldLoan: Loan; newLoan: Loan; transactions: Transaction[] }> {
    const oldLoan = this.loans.get(loanId);
    if (!oldLoan) throw new Error('Loan not found');

    // Mark old loan as settled
    const settledLoan: Loan = {
      ...oldLoan,
      status: 'settled',
      settledDate: new Date().toISOString().split('T')[0],
      updatedAt: new Date(),
    };
    this.loans.set(loanId, settledLoan);

    // Create new loan with updated terms
    const newLoan: Loan = {
      ...oldLoan,
      id: this.generateId(),
      parentLoanId: loanId,
      cycleNumber: (oldLoan.cycleNumber || 1) + 1,
      dueDate: revolve.dueDate,
      siborTermMonths: revolve.siborTermMonths,
      margin: revolve.margin,
      status: 'active',
      settledDate: null,
      settledAmount: null,
      lastAccrualDate: new Date().toISOString().split('T')[0],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.loans.set(newLoan.id, newLoan);

    return { oldLoan: settledLoan, newLoan, transactions: [] };
  }

  async getLoanLedger(loanId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(t => t.loanId === loanId);
  }

  async calculateLoanBalance(loanId: string): Promise<{ principal: number; interest: number; fees: number; total: number }> {
    const loan = this.loans.get(loanId);
    if (!loan) throw new Error('Loan not found');

    const loanTransactions = Array.from(this.transactions.values()).filter(t => t.loanId === loanId);
    
    let principal = Number(loan.amount);
    let interest = 0;
    let fees = 0;

    // Simple balance calculation for memory storage
    loanTransactions.forEach(transaction => {
      const amount = Number(transaction.amount);
      if (transaction.type === 'repayment') {
        principal -= amount;
      } else if (transaction.type === 'interest') {
        interest += amount;
      } else if (transaction.type === 'fee') {
        fees += amount;
      }
    });

    const total = Math.max(0, principal + interest + fees);

    return { principal: Math.max(0, principal), interest, fees, total };
  }

  async accrueInterest(loanId: string, toDate: string, userId: string): Promise<Transaction[]> {
    // Simple interest accrual for memory storage
    return [];
  }

  // Attachment operations
  async getAttachmentsByOwner(ownerType: AttachmentOwnerType, ownerId: string, userId: string): Promise<Attachment[]> {
    return Array.from(this.attachments.values())
      .filter(attachment => 
        attachment.ownerType === ownerType &&
        attachment.ownerId === ownerId &&
        attachment.userId === userId &&
        !attachment.deletedAt
      )
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createAttachment(attachment: InsertAttachment): Promise<Attachment> {
    const newAttachment: Attachment = {
      ...attachment,
      id: this.generateId(),
      createdAt: new Date(),
      deletedAt: null,
    };
    this.attachments.set(newAttachment.id, newAttachment);
    return newAttachment;
  }

  async updateAttachmentMetadata(
    attachmentId: string, 
    metadata: Partial<Pick<InsertAttachment, 'category' | 'tags' | 'description'>>, 
    userId: string
  ): Promise<Attachment> {
    const attachment = this.attachments.get(attachmentId);
    if (!attachment || attachment.userId !== userId || attachment.deletedAt) {
      throw new Error('Attachment not found or access denied');
    }
    
    const updatedAttachment = { ...attachment, ...metadata };
    this.attachments.set(attachmentId, updatedAttachment);
    return updatedAttachment;
  }

  async deleteAttachment(attachmentId: string, userId: string): Promise<void> {
    const attachment = this.attachments.get(attachmentId);
    if (!attachment || attachment.userId !== userId) {
      return; // Silent fail for consistency with database behavior
    }
    
    const deletedAttachment = { ...attachment, deletedAt: new Date() };
    this.attachments.set(attachmentId, deletedAttachment);
  }

  async getAttachmentById(attachmentId: string, userId: string): Promise<Attachment | undefined> {
    const attachment = this.attachments.get(attachmentId);
    if (!attachment || attachment.userId !== userId || attachment.deletedAt) {
      return undefined;
    }
    return attachment;
  }

  // Attachment audit operations
  async createAttachmentAudit(audit: InsertAttachmentAudit): Promise<AttachmentAudit> {
    const newAudit: AttachmentAudit = {
      ...audit,
      id: this.generateId(),
      createdAt: new Date(),
    };
    this.attachmentAudits.set(newAudit.id, newAudit);
    return newAudit;
  }

  async getAttachmentAuditTrail(attachmentId: string): Promise<AttachmentAudit[]> {
    return Array.from(this.attachmentAudits.values())
      .filter(audit => audit.attachmentId === attachmentId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  // Chat Conversation operations
  async getUserConversations(userId: string): Promise<ChatConversation[]> {
    return Array.from(this.chatConversations.values())
      .filter(conv => conv.userId === userId && conv.isActive)
      .sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0));
  }

  async getConversation(conversationId: string): Promise<ChatConversation | undefined> {
    const conversation = this.chatConversations.get(conversationId);
    if (conversation && conversation.isActive) {
      return conversation;
    }
    return undefined;
  }

  async createConversation(conversation: InsertChatConversation): Promise<ChatConversation> {
    const newConversation: ChatConversation = {
      ...conversation,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.chatConversations.set(newConversation.id, newConversation);
    return newConversation;
  }

  async updateConversation(conversationId: string, updates: Partial<InsertChatConversation>): Promise<ChatConversation> {
    const existing = this.chatConversations.get(conversationId);
    if (!existing) throw new Error('Conversation not found');

    const updated: ChatConversation = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.chatConversations.set(conversationId, updated);
    return updated;
  }

  async deleteConversation(conversationId: string): Promise<void> {
    const existing = this.chatConversations.get(conversationId);
    if (existing) {
      existing.isActive = false;
      existing.updatedAt = new Date();
    }
  }

  // Chat Message operations
  async getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(msg => msg.conversationId === conversationId)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
  }

  async addMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const newMessage: ChatMessage = {
      ...message,
      id: this.generateId(),
      createdAt: new Date(),
    };
    this.chatMessages.set(newMessage.id, newMessage);
    
    // Update conversation's updatedAt timestamp
    const conversation = this.chatConversations.get(message.conversationId);
    if (conversation) {
      conversation.updatedAt = new Date();
    }
    
    return newMessage;
  }

  // Reminder Template operations
  async getAllReminderTemplates(): Promise<ReminderTemplate[]> {
    return Array.from(this.reminderTemplates.values())
      .filter(template => template.isActive)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getReminderTemplate(id: string): Promise<ReminderTemplate | undefined> {
    return this.reminderTemplates.get(id);
  }

  async createReminderTemplate(template: InsertReminderTemplate): Promise<ReminderTemplate> {
    const newTemplate: ReminderTemplate = {
      ...template,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.reminderTemplates.set(newTemplate.id, newTemplate);
    return newTemplate;
  }

  async updateReminderTemplate(id: string, template: Partial<UpdateReminderTemplate>): Promise<ReminderTemplate> {
    const existing = this.reminderTemplates.get(id);
    if (!existing) throw new Error('Template not found');

    const updated: ReminderTemplate = {
      ...existing,
      ...template,
      updatedAt: new Date(),
    };
    this.reminderTemplates.set(id, updated);
    return updated;
  }

  async deleteReminderTemplate(id: string): Promise<void> {
    const existing = this.reminderTemplates.get(id);
    if (existing) {
      existing.isActive = false;
      existing.updatedAt = new Date();
    }
  }

  // User Reminder Settings operations
  async getUserReminderSettings(userId: string): Promise<UserReminderSettings | undefined> {
    return Array.from(this.userReminderSettings.values()).find(settings => settings.userId === userId);
  }

  async createUserReminderSettings(settings: InsertUserReminderSettings): Promise<UserReminderSettings> {
    const newSettings: UserReminderSettings = {
      ...settings,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.userReminderSettings.set(newSettings.id, newSettings);
    return newSettings;
  }

  async updateUserReminderSettings(userId: string, settings: Partial<UpdateUserReminderSettings>): Promise<UserReminderSettings> {
    const existing = Array.from(this.userReminderSettings.values()).find(s => s.userId === userId);
    if (!existing) throw new Error('User reminder settings not found');

    const updated: UserReminderSettings = {
      ...existing,
      ...settings,
      updatedAt: new Date(),
    };
    this.userReminderSettings.set(existing.id, updated);
    return updated;
  }

  async upsertUserReminderSettings(settings: InsertUserReminderSettings): Promise<UserReminderSettings> {
    const existing = await this.getUserReminderSettings(settings.userId);
    
    if (existing) {
      return this.updateUserReminderSettings(settings.userId, settings);
    } else {
      return this.createUserReminderSettings(settings);
    }
  }

  // User Preferences operations
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    return Array.from(this.userPreferences.values()).find(preferences => preferences.userId === userId);
  }

  async upsertUserPreferences(preferences: Partial<InsertUserPreferences> & { userId: string }): Promise<UserPreferences> {
    const existing = Array.from(this.userPreferences.values()).find(p => p.userId === preferences.userId);
    const newPreferences: UserPreferences = {
      ...(existing || {}),
      ...preferences,
      id: existing?.id || this.generateId(),
      userId: preferences.userId,
      timezone: preferences.timezone || existing?.timezone || 'Asia/Riyadh',
      language: preferences.language || existing?.language || 'en',
      currency: preferences.currency || existing?.currency || 'SAR',
      dateFormat: preferences.dateFormat || existing?.dateFormat || 'DD/MM/YYYY',
      numberFormat: preferences.numberFormat || existing?.numberFormat || 'en-SA',
      theme: preferences.theme || existing?.theme || 'light',
      dashboardLayout: preferences.dashboardLayout || existing?.dashboardLayout || 'grid',
      itemsPerPage: preferences.itemsPerPage || existing?.itemsPerPage || 10,
      enableNotifications: preferences.enableNotifications ?? existing?.enableNotifications ?? true,
      enableSounds: preferences.enableSounds ?? existing?.enableSounds ?? false,
      compactView: preferences.compactView ?? existing?.compactView ?? false,
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.userPreferences.set(newPreferences.id, newPreferences);
    return newPreferences;
  }

  // Guarantee operations
  async getUserGuarantees(organizationId: string): Promise<Array<Guarantee & { facility: Facility & { bank: Bank } }>> {
    return [];
  }

  async getFacilityGuarantees(facilityId: string): Promise<Guarantee[]> {
    return Array.from(this.guarantees.values()).filter(g => g.facilityId === facilityId && g.isActive);
  }

  async getGuaranteeById(guaranteeId: string): Promise<Guarantee | undefined> {
    return this.guarantees.get(guaranteeId);
  }

  async createGuarantee(guarantee: InsertGuarantee): Promise<Guarantee> {
    const newGuarantee: Guarantee = {
      ...guarantee,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.guarantees.set(newGuarantee.id, newGuarantee);
    return newGuarantee;
  }

  async updateGuarantee(guaranteeId: string, organizationId: string, guarantee: Partial<UpdateGuarantee>): Promise<Guarantee> {
    const existing = this.guarantees.get(guaranteeId);
    if (!existing || existing.organizationId !== organizationId) {
      throw new Error('Guarantee not found');
    }

    const updated: Guarantee = {
      ...existing,
      ...guarantee,
      updatedAt: new Date(),
    };
    this.guarantees.set(guaranteeId, updated);
    return updated;
  }

  async deleteGuarantee(guaranteeId: string, organizationId: string): Promise<void> {
    const existing = this.guarantees.get(guaranteeId);
    if (existing && existing.organizationId === organizationId) {
      existing.isActive = false;
      existing.updatedAt = new Date();
    }
  }

  // Organization operations
  async createOrganization(organization: InsertOrganization): Promise<Organization> {
    const newOrg: Organization = {
      ...organization,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.organizations.set(newOrg.id, newOrg);
    return newOrg;
  }

  async getOrganization(organizationId: string): Promise<Organization | undefined> {
    return this.organizations.get(organizationId);
  }

  async getUserOrganization(userId: string): Promise<Organization | undefined> {
    const membership = Array.from(this.organizationMembers.values())
      .find(m => m.userId === userId);
    
    if (!membership) return undefined;
    return this.organizations.get(membership.organizationId);
  }

  async updateOrganization(organizationId: string, updates: Partial<InsertOrganization>): Promise<Organization> {
    const existing = this.organizations.get(organizationId);
    if (!existing) throw new Error('Organization not found');

    const updated: Organization = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.organizations.set(organizationId, updated);
    return updated;
  }

  // Organization Member operations
  async addMember(member: InsertOrganizationMember): Promise<OrganizationMember> {
    const newMember: OrganizationMember = {
      ...member,
      id: this.generateId(),
      joinedAt: new Date(),
    };
    this.organizationMembers.set(newMember.id, newMember);
    return newMember;
  }

  async removeMember(userId: string, organizationId: string): Promise<void> {
    const member = Array.from(this.organizationMembers.values())
      .find(m => m.userId === userId && m.organizationId === organizationId);
    
    if (member) {
      this.organizationMembers.delete(member.id);
    }
  }

  async getOrganizationMembers(organizationId: string): Promise<Array<OrganizationMember & { user: User }>> {
    const members = Array.from(this.organizationMembers.values())
      .filter(m => m.organizationId === organizationId);
    
    return members.map(m => {
      const user = this.users.get(m.userId);
      if (!user) throw new Error(`User ${m.userId} not found`);
      return { ...m, user };
    });
  }

  async getOrganizationMembership(userId: string): Promise<OrganizationMember | undefined> {
    return Array.from(this.organizationMembers.values())
      .find(m => m.userId === userId);
  }

  async isUserInOrganization(userId: string, organizationId: string): Promise<boolean> {
    return Array.from(this.organizationMembers.values())
      .some(m => m.userId === userId && m.organizationId === organizationId);
  }

  // Organization Invitation operations
  async createInvitation(invitation: InsertOrganizationInvitation): Promise<OrganizationInvitation> {
    const newInvitation: OrganizationInvitation = {
      ...invitation,
      id: this.generateId(),
      createdAt: new Date(),
    };
    this.organizationInvitations.set(newInvitation.id, newInvitation);
    return newInvitation;
  }

  async getInvitation(token: string): Promise<OrganizationInvitation | undefined> {
    return Array.from(this.organizationInvitations.values())
      .find(inv => inv.token === token);
  }

  async deleteInvitation(invitationId: string): Promise<void> {
    this.organizationInvitations.delete(invitationId);
  }

  async getOrganizationInvitations(organizationId: string): Promise<OrganizationInvitation[]> {
    return Array.from(this.organizationInvitations.values())
      .filter(inv => inv.organizationId === organizationId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }
}

// Storage factory based on database availability
export function createStorage(databaseAvailable: boolean): IStorage {
  if (databaseAvailable) {
    console.log("✅ Using database storage");
    return new DatabaseStorage();
  } else {
    console.log("🧠 Using in-memory storage fallback");
    return new MemoryStorage();
  }
}

// Will be initialized in routes after database check
export let storage: IStorage;

export function initializeStorage(databaseAvailable: boolean): void {
  storage = createStorage(databaseAvailable);
}
