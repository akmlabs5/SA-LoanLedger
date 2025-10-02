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
  guarantees,
  aiInsightConfig,
  exposureSnapshots,
  transactions,
  auditLogs,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql, gte, lte, isNull, isNotNull } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Bank operations
  getAllBanks(): Promise<Bank[]>;
  createBank(bank: InsertBank): Promise<Bank>;
  
  // Bank Contact operations
  getBankContacts(bankId: string, userId: string): Promise<Array<BankContact & { bank: Bank }>>;
  createBankContact(contact: InsertBankContact): Promise<BankContact>;
  updateBankContact(contactId: string, contact: Partial<InsertBankContact>): Promise<BankContact>;
  deleteBankContact(contactId: string): Promise<void>;
  setPrimaryContact(contactId: string, bankId: string, userId: string): Promise<BankContact>;
  
  // Facility operations
  getUserFacilities(userId: string): Promise<Array<Facility & { bank: Bank }>>;
  getFacilityWithBank(facilityId: string): Promise<(Facility & { bank: Bank }) | undefined>;
  createFacility(facility: InsertFacility): Promise<Facility>;
  updateFacility(facilityId: string, facility: Partial<InsertFacility>): Promise<Facility>;
  deleteFacility(facilityId: string): Promise<void>;
  
  // Collateral operations
  getUserCollateral(userId: string): Promise<Collateral[]>;
  createCollateral(collateral: InsertCollateral): Promise<Collateral>;
  updateCollateral(collateralId: string, collateral: Partial<InsertCollateral>): Promise<Collateral>;
  deleteCollateral(collateralId: string): Promise<void>;
  
  // Collateral Assignment operations
  getUserCollateralAssignments(userId: string): Promise<Array<CollateralAssignment & { 
    collateral: Collateral; 
    facility?: Facility & { bank: Bank }; 
    creditLine?: CreditLine & { facility: Facility & { bank: Bank } } 
  }>>;
  createCollateralAssignment(assignment: InsertCollateralAssignment): Promise<CollateralAssignment>;
  updateCollateralAssignment(assignmentId: string, assignment: Partial<InsertCollateralAssignment>): Promise<CollateralAssignment>;
  deleteCollateralAssignment(assignmentId: string): Promise<void>;
  
  // Credit Line operations
  getUserCreditLines(userId: string): Promise<Array<CreditLine & { facility: Facility & { bank: Bank } }>>;
  createCreditLine(creditLine: InsertCreditLine): Promise<CreditLine>;
  updateCreditLine(creditLineId: string, creditLine: Partial<InsertCreditLine>): Promise<CreditLine>;
  
  // Loan operations
  getUserLoans(userId: string): Promise<Loan[]>;
  getActiveLoansByUser(userId: string): Promise<(Loan & { facility: Facility & { bank: Bank } })[]>;
  getSettledLoansByUser(userId: string): Promise<(Loan & { facility: Facility & { bank: Bank } })[]>;
  getLoanById(loanId: string): Promise<(Loan & { facility: Facility & { bank: Bank } }) | undefined>;
  createLoan(loan: InsertLoan): Promise<Loan>;
  updateLoan(loanId: string, loan: Partial<InsertLoan>, userId: string, reason?: string): Promise<Loan>;
  deleteLoan(loanId: string, userId: string, reason?: string): Promise<void>;
  
  // Payment and settlement operations
  processPayment(loanId: string, payment: PaymentRequest, userId: string): Promise<{ loan: Loan; transactions: Transaction[] }>;
  settleLoan(loanId: string, settlement: SettlementRequest, userId: string): Promise<{ loan: Loan; transactions: Transaction[] }>;
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
  updateLoanReminder(reminderId: string, reminder: Partial<UpdateLoanReminder>): Promise<LoanReminder>;
  deleteLoanReminder(reminderId: string): Promise<void>;
  
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
  upsertUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  
  // Guarantee operations
  getUserGuarantees(userId: string): Promise<Array<Guarantee & { facility: Facility & { bank: Bank } }>>;
  getFacilityGuarantees(facilityId: string): Promise<Guarantee[]>;
  getGuaranteeById(guaranteeId: string): Promise<Guarantee | undefined>;
  createGuarantee(guarantee: InsertGuarantee): Promise<Guarantee>;
  updateGuarantee(guaranteeId: string, guarantee: Partial<UpdateGuarantee>): Promise<Guarantee>;
  deleteGuarantee(guaranteeId: string): Promise<void>;
  
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
  
  // Attachment operations
  getAttachmentsByOwner(ownerType: AttachmentOwnerType, ownerId: string, userId: string): Promise<Attachment[]>;
  createAttachment(attachment: InsertAttachment): Promise<Attachment>;
  updateAttachmentMetadata(attachmentId: string, metadata: Partial<Pick<InsertAttachment, 'category' | 'tags' | 'description'>>, userId: string): Promise<Attachment>;
  deleteAttachment(attachmentId: string, userId: string): Promise<void>;
  getAttachmentById(attachmentId: string, userId: string): Promise<Attachment | undefined>;
  
  // Attachment audit operations
  createAttachmentAudit(audit: InsertAttachmentAudit): Promise<AttachmentAudit>;
  getAttachmentAuditTrail(attachmentId: string): Promise<AttachmentAudit[]>;
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
  async getAllBanks(): Promise<Bank[]> {
    return await db.select().from(banks).where(eq(banks.isActive, true)).orderBy(asc(banks.name));
  }

  async createBank(bank: InsertBank): Promise<Bank> {
    const [newBank] = await db.insert(banks).values(bank).returning();
    return newBank;
  }

  // Bank Contact operations
  async getBankContacts(bankId: string, userId: string): Promise<Array<BankContact & { bank: Bank }>> {
    return await db
      .select()
      .from(bankContacts)
      .leftJoin(banks, eq(bankContacts.bankId, banks.id))
      .where(and(
        eq(bankContacts.bankId, bankId),
        eq(bankContacts.userId, userId),
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

  async updateBankContact(contactId: string, contact: Partial<InsertBankContact>): Promise<BankContact> {
    const [updatedContact] = await db
      .update(bankContacts)
      .set({
        ...contact,
        updatedAt: new Date()
      })
      .where(eq(bankContacts.id, contactId))
      .returning();
    return updatedContact;
  }

  async deleteBankContact(contactId: string): Promise<void> {
    await db
      .update(bankContacts)
      .set({ 
        isActive: false, 
        updatedAt: new Date() 
      })
      .where(eq(bankContacts.id, contactId));
  }

  async setPrimaryContact(contactId: string, bankId: string, userId: string): Promise<BankContact> {
    // First, unset any existing primary contact for this bank and user
    await db
      .update(bankContacts)
      .set({ 
        isPrimary: false, 
        updatedAt: new Date() 
      })
      .where(and(
        eq(bankContacts.bankId, bankId),
        eq(bankContacts.userId, userId),
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
  async getUserFacilities(userId: string): Promise<Array<Facility & { bank: Bank }>> {
    const results = await db
      .select()
      .from(facilities)
      .innerJoin(banks, eq(facilities.bankId, banks.id))
      .where(and(eq(facilities.userId, userId), eq(facilities.isActive, true)))
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

  async updateFacility(facilityId: string, facility: Partial<InsertFacility>): Promise<Facility> {
    const [updatedFacility] = await db
      .update(facilities)
      .set(facility)
      .where(eq(facilities.id, facilityId))
      .returning();
    return updatedFacility;
  }

  async deleteFacility(facilityId: string): Promise<void> {
    await db
      .update(facilities)
      .set({ 
        isActive: false, 
        updatedAt: new Date() 
      })
      .where(eq(facilities.id, facilityId));
  }

  // Credit Line operations
  async getUserCreditLines(userId: string): Promise<Array<CreditLine & { facility: Facility & { bank: Bank } }>> {
    const result = await db
      .select()
      .from(creditLines)
      .innerJoin(facilities, eq(creditLines.facilityId, facilities.id))
      .innerJoin(banks, eq(facilities.bankId, banks.id))
      .where(and(eq(creditLines.userId, userId), eq(creditLines.isActive, true)))
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

  async updateCreditLine(creditLineId: string, creditLine: Partial<InsertCreditLine>): Promise<CreditLine> {
    const [updatedCreditLine] = await db
      .update(creditLines)
      .set(creditLine)
      .where(eq(creditLines.id, creditLineId))
      .returning();
    return updatedCreditLine;
  }

  // Collateral operations
  async getUserCollateral(userId: string): Promise<Collateral[]> {
    return await db
      .select()
      .from(collateral)
      .where(and(eq(collateral.userId, userId), eq(collateral.isActive, true)))
      .orderBy(desc(collateral.createdAt));
  }

  async createCollateral(collateralData: InsertCollateral): Promise<Collateral> {
    const [newCollateral] = await db.insert(collateral).values(collateralData).returning();
    return newCollateral;
  }

  async updateCollateral(collateralId: string, collateralData: Partial<InsertCollateral>): Promise<Collateral> {
    const [updatedCollateral] = await db
      .update(collateral)
      .set(collateralData)
      .where(eq(collateral.id, collateralId))
      .returning();
    return updatedCollateral;
  }

  async deleteCollateral(collateralId: string): Promise<void> {
    await db
      .update(collateral)
      .set({ 
        isActive: false, 
        updatedAt: new Date() 
      })
      .where(eq(collateral.id, collateralId));
  }

  // Collateral Assignment operations
  async getUserCollateralAssignments(userId: string): Promise<Array<CollateralAssignment & { 
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
      .where(and(eq(collateralAssignments.userId, userId), eq(collateralAssignments.isActive, true)))
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

  async updateCollateralAssignment(assignmentId: string, assignmentData: Partial<InsertCollateralAssignment>): Promise<CollateralAssignment> {
    const [updatedAssignment] = await db
      .update(collateralAssignments)
      .set(assignmentData)
      .where(eq(collateralAssignments.id, assignmentId))
      .returning();
    return updatedAssignment;
  }

  async deleteCollateralAssignment(assignmentId: string): Promise<void> {
    await db
      .update(collateralAssignments)
      .set({ isActive: false })
      .where(eq(collateralAssignments.id, assignmentId));
  }

  // Loan operations
  async getUserLoans(userId: string): Promise<Loan[]> {
    return await db
      .select()
      .from(loans)
      .where(eq(loans.userId, userId))
      .orderBy(desc(loans.createdAt));
  }

  async getActiveLoansByUser(userId: string): Promise<(Loan & { facility: Facility & { bank: Bank } })[]> {
    const result = await db
      .select()
      .from(loans)
      .innerJoin(facilities, eq(loans.facilityId, facilities.id))
      .innerJoin(banks, eq(facilities.bankId, banks.id))
      .where(and(eq(loans.userId, userId), eq(loans.status, 'active')))
      .orderBy(asc(loans.dueDate));

    return result.map(row => ({
      ...row.loans,
      facility: {
        ...row.facilities,
        bank: row.banks,
      },
    }));
  }

  async getSettledLoansByUser(userId: string): Promise<(Loan & { facility: Facility & { bank: Bank } })[]> {
    const result = await db
      .select()
      .from(loans)
      .innerJoin(facilities, eq(loans.facilityId, facilities.id))
      .innerJoin(banks, eq(facilities.bankId, banks.id))
      .where(and(eq(loans.userId, userId), eq(loans.status, 'settled')))
      .orderBy(desc(loans.settledDate));

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

  async deleteLoan(loanId: string): Promise<void> {
    await db
      .update(loans)
      .set({
        status: 'cancelled',
        updatedAt: new Date()
      })
      .where(eq(loans.id, loanId));
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

  async updateLoanReminder(reminderId: string, reminder: Partial<UpdateLoanReminder>): Promise<LoanReminder> {
    const [result] = await db
      .update(loanReminders)
      .set({ ...reminder, updatedAt: new Date() })
      .where(eq(loanReminders.id, reminderId))
      .returning();
    
    if (!result) {
      throw new Error('Reminder not found');
    }
    
    return result;
  }

  async deleteLoanReminder(reminderId: string): Promise<void> {
    await db
      .update(loanReminders)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(loanReminders.id, reminderId));
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

  async upsertUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const [result] = await db
      .insert(userPreferences)
      .values(preferences)
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          ...preferences,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  // Guarantee operations
  async getUserGuarantees(userId: string): Promise<Array<Guarantee & { facility: Facility & { bank: Bank } }>> {
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
      .where(and(eq(guarantees.userId, userId), eq(guarantees.isActive, true)))
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

  async updateGuarantee(guaranteeId: string, guarantee: Partial<UpdateGuarantee>): Promise<Guarantee> {
    const [result] = await db
      .update(guarantees)
      .set({ ...guarantee, updatedAt: new Date() })
      .where(eq(guarantees.id, guaranteeId))
      .returning();
    
    if (!result) {
      throw new Error('Guarantee not found');
    }
    
    return result;
  }

  async deleteGuarantee(guaranteeId: string): Promise<void> {
    await db
      .update(guarantees)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(guarantees.id, guaranteeId));
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
    // Get active loans with facilities and banks
    const activeLoans = await this.getActiveLoansByUser(userId);
    
    // Get user facilities
    const userFacilities = await db
      .select()
      .from(facilities)
      .innerJoin(banks, eq(facilities.bankId, banks.id))
      .where(and(eq(facilities.userId, userId), eq(facilities.isActive, true)));

    // Calculate totals
    const totalOutstanding = activeLoans.reduce((sum, loan) => sum + parseFloat(loan.amount), 0);
    const totalCreditLimit = userFacilities.reduce((sum, facility) => sum + parseFloat(facility.facilities.creditLimit), 0);
    const availableCredit = totalCreditLimit - totalOutstanding;

    // Get total collateral value for LTV calculation
    const userCollateralList = await this.getUserCollateral(userId);
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

    const bankExposures = Array.from(bankExposuresMap.values()).map(exposure => ({
      ...exposure,
      utilization: exposure.creditLimit > 0 ? (exposure.outstanding / exposure.creditLimit) * 100 : 0,
      facilityLtv: exposure.creditLimit > 0 ? (totalCollateralValue / exposure.creditLimit) * 100 : 0,
      outstandingLtv: exposure.outstanding > 0 ? (totalCollateralValue / exposure.outstanding) * 100 : 0,
    }));

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
  private exposureSnapshots = new Map<string, ExposureSnapshot>();
  private transactions = new Map<string, Transaction>();
  private attachments = new Map<string, Attachment>();
  private attachmentAudits = new Map<string, AttachmentAudit>();

  constructor() {
    // Initialize with default Saudi banks
    this.initializeDefaultBanks();
  }

  private initializeDefaultBanks() {
    const defaultBanks = [
      { id: 'ANB', code: 'ANB', name: 'Arab National Bank', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'SABB', code: 'SABB', name: 'Saudi British Bank', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'RAJHI', code: 'RAJHI', name: 'Al Rajhi Bank', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'NCB', code: 'NCB', name: 'National Commercial Bank', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'RIYADBANK', code: 'RIYADBANK', name: 'Riyad Bank', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'SAMBABANK', code: 'SAMBABANK', name: 'Samba Financial Group', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'BANQUE', code: 'BANQUE', name: 'Banque Saudi Fransi', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'ALBILAD', code: 'ALBILAD', name: 'Bank AlBilad', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'ALJAZIRA', code: 'ALJAZIRA', name: 'Bank AlJazira', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'ALINMA', code: 'ALINMA', name: 'Alinma Bank', isActive: true, createdAt: new Date(), updatedAt: new Date() }
    ];

    defaultBanks.forEach(bank => this.banks.set(bank.id, bank));
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
  async getAllBanks(): Promise<Bank[]> {
    return Array.from(this.banks.values()).filter(bank => bank.isActive);
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
  async getBankContacts(bankId: string, userId: string): Promise<Array<BankContact & { bank: Bank }>> {
    const bank = this.banks.get(bankId);
    if (!bank) return [];

    return Array.from(this.bankContacts.values())
      .filter(contact => contact.bankId === bankId && contact.userId === userId && contact.isActive)
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

  async updateBankContact(contactId: string, contact: Partial<InsertBankContact>): Promise<BankContact> {
    const existing = this.bankContacts.get(contactId);
    if (!existing) throw new Error('Contact not found');

    const updated: BankContact = {
      ...existing,
      ...contact,
      updatedAt: new Date(),
    };
    this.bankContacts.set(contactId, updated);
    return updated;
  }

  async deleteBankContact(contactId: string): Promise<void> {
    const existing = this.bankContacts.get(contactId);
    if (existing) {
      existing.isActive = false;
      existing.updatedAt = new Date();
      this.bankContacts.set(contactId, existing);
    }
  }

  async setPrimaryContact(contactId: string, bankId: string, userId: string): Promise<BankContact> {
    // First, unset all primary contacts for this bank/user
    for (const contact of this.bankContacts.values()) {
      if (contact.bankId === bankId && contact.userId === userId && contact.isPrimary) {
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
  async getUserFacilities(userId: string): Promise<Array<Facility & { bank: Bank }>> {
    const userFacilities = Array.from(this.facilities.values())
      .filter(facility => facility.userId === userId && (facility.isActive ?? true));
    
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

  async updateFacility(facilityId: string, facility: Partial<InsertFacility>): Promise<Facility> {
    const existing = this.facilities.get(facilityId);
    if (!existing) throw new Error('Facility not found');

    const updated: Facility = {
      ...existing,
      ...facility,
      updatedAt: new Date(),
    };
    this.facilities.set(facilityId, updated);
    return updated;
  }

  async deleteFacility(facilityId: string): Promise<void> {
    const existing = this.facilities.get(facilityId);
    if (!existing) throw new Error('Facility not found');
    
    // Remove the facility from memory
    this.facilities.delete(facilityId);
    console.log(`✅ Deleted facility: ${existing.facilityType} for bank ${existing.bankId} (ID: ${facilityId})`);
  }

  async getUserCollateral(userId: string): Promise<Collateral[]> {
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

  async updateCollateral(collateralId: string, collateral: Partial<InsertCollateral>): Promise<Collateral> {
    const existing = this.collateral.get(collateralId);
    if (!existing) throw new Error('Collateral not found');

    const updated: Collateral = {
      ...existing,
      ...collateral,
      updatedAt: new Date(),
    };
    this.collateral.set(collateralId, updated);
    return updated;
  }

  async deleteCollateral(collateralId: string): Promise<void> {
    const existing = this.collateral.get(collateralId);
    if (existing) {
      const updated = { ...existing, isActive: false, updatedAt: new Date() };
      this.collateral.set(collateralId, updated);
    }
  }

  // Collateral Assignment operations (simplified in-memory implementation)
  async getUserCollateralAssignments(userId: string): Promise<Array<CollateralAssignment & { 
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

  async updateCollateralAssignment(assignmentId: string, assignment: Partial<InsertCollateralAssignment>): Promise<CollateralAssignment> {
    const existing = this.collateralAssignments.get(assignmentId);
    if (!existing) throw new Error('Collateral assignment not found');

    const updated: CollateralAssignment = {
      ...existing,
      ...assignment,
    };
    this.collateralAssignments.set(assignmentId, updated);
    return updated;
  }

  async deleteCollateralAssignment(assignmentId: string): Promise<void> {
    const existing = this.collateralAssignments.get(assignmentId);
    if (existing) {
      const updated = { ...existing, isActive: false };
      this.collateralAssignments.set(assignmentId, updated);
    }
  }

  async getUserCreditLines(userId: string): Promise<Array<CreditLine & { facility: Facility & { bank: Bank } }>> {
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

  async updateCreditLine(creditLineId: string, creditLine: Partial<InsertCreditLine>): Promise<CreditLine> {
    const existing = this.creditLines.get(creditLineId);
    if (!existing) throw new Error('Credit line not found');

    const updated: CreditLine = {
      ...existing,
      ...creditLine,
      updatedAt: new Date(),
    };
    this.creditLines.set(creditLineId, updated);
    return updated;
  }

  async getUserLoans(userId: string): Promise<Loan[]> {
    return Array.from(this.loans.values()).filter(loan => loan.userId === userId);
  }

  async getActiveLoansByUser(userId: string): Promise<(Loan & { creditLine: CreditLine & { facility: Facility & { bank: Bank } } })[]> {
    const userLoans = Array.from(this.loans.values()).filter(loan => loan.userId === userId && loan.status === 'active');
    
    // Return simple structure without creditLine for now to avoid complex joins
    return userLoans.map(loan => ({
      ...loan,
      creditLine: undefined as any
    }));
  }

  async getSettledLoansByUser(userId: string): Promise<(Loan & { creditLine: CreditLine & { facility: Facility & { bank: Bank } } })[]> {
    const userLoans = Array.from(this.loans.values()).filter(loan => loan.userId === userId && loan.status === 'settled');
    
    // Return simple structure without creditLine for now to avoid complex joins
    return userLoans.map(loan => ({
      ...loan,
      creditLine: undefined as any
    }));
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


  async deleteLoan(loanId: string): Promise<void> {
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

  async updateLoanReminder(reminderId: string, reminder: Partial<UpdateLoanReminder>): Promise<LoanReminder> {
    const existing = this.loanReminders.get(reminderId);
    if (!existing) throw new Error('Reminder not found');

    const updated: LoanReminder = {
      ...existing,
      ...reminder,
      updatedAt: new Date(),
    };
    this.loanReminders.set(reminderId, updated);
    return updated;
  }

  async deleteLoanReminder(reminderId: string): Promise<void> {
    const existing = this.loanReminders.get(reminderId);
    if (existing) {
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
    
    // Get total collateral value for LTV calculation
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
    
    // Create bank exposures array with utilization and LTV metrics
    const bankExposures = Array.from(bankGroups.values()).map(bank => ({
      ...bank,
      utilization: bank.creditLimit > 0 ? (bank.outstanding / bank.creditLimit) * 100 : 0,
      facilityLtv: bank.creditLimit > 0 ? (totalCollateralValue / bank.creditLimit) * 100 : 0,
      outstandingLtv: bank.outstanding > 0 ? (totalCollateralValue / bank.outstanding) * 100 : 0,
    }));
    
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

  // New methods for loan lifecycle management
  async getLoanById(loanId: string): Promise<Loan | undefined> {
    return this.loans.get(loanId);
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

  async upsertUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const existing = Array.from(this.userPreferences.values()).find(p => p.userId === preferences.userId);
    const newPreferences: UserPreferences = {
      ...preferences,
      id: existing?.id || this.generateId(),
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.userPreferences.set(newPreferences.id, newPreferences);
    return newPreferences;
  }

  // Guarantee operations
  async getUserGuarantees(userId: string): Promise<Array<Guarantee & { facility: Facility & { bank: Bank } }>> {
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

  async updateGuarantee(guaranteeId: string, guarantee: Partial<UpdateGuarantee>): Promise<Guarantee> {
    const existing = this.guarantees.get(guaranteeId);
    if (!existing) throw new Error('Guarantee not found');

    const updated: Guarantee = {
      ...existing,
      ...guarantee,
      updatedAt: new Date(),
    };
    this.guarantees.set(guaranteeId, updated);
    return updated;
  }

  async deleteGuarantee(guaranteeId: string): Promise<void> {
    const existing = this.guarantees.get(guaranteeId);
    if (existing) {
      existing.isActive = false;
      existing.updatedAt = new Date();
    }
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
