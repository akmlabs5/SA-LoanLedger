import {
  users,
  banks,
  bankContacts,
  facilities,
  creditLines,
  collateral,
  loans,
  documents,
  aiInsightConfig,
  exposureSnapshots,
  transactions,
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
  type AiInsightConfig,
  type InsertAiInsightConfig,
  type ExposureSnapshot,
  type InsertExposureSnapshot,
  type Transaction,
  type InsertTransaction,
  type TransactionType,
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
  
  // Credit Line operations
  getUserCreditLines(userId: string): Promise<Array<CreditLine & { facility: Facility & { bank: Bank } }>>;
  createCreditLine(creditLine: InsertCreditLine): Promise<CreditLine>;
  updateCreditLine(creditLineId: string, creditLine: Partial<InsertCreditLine>): Promise<CreditLine>;
  
  // Loan operations
  getUserLoans(userId: string): Promise<Loan[]>;
  getActiveLoansByUser(userId: string): Promise<(Loan & { creditLine: CreditLine & { facility: Facility & { bank: Bank } } })[]>;
  getSettledLoansByUser(userId: string): Promise<(Loan & { creditLine: CreditLine & { facility: Facility & { bank: Bank } } })[]>;
  createLoan(loan: InsertLoan): Promise<Loan>;
  updateLoan(loanId: string, loan: Partial<InsertLoan>): Promise<Loan>;
  settleLoan(loanId: string, settledAmount: number): Promise<Loan>;
  
  // Document operations
  createDocument(document: InsertDocument): Promise<Document>;
  getLoanDocuments(loanId: string): Promise<Document[]>;
  
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

  // Loan operations
  async getUserLoans(userId: string): Promise<Loan[]> {
    return await db
      .select()
      .from(loans)
      .where(eq(loans.userId, userId))
      .orderBy(desc(loans.createdAt));
  }

  async getActiveLoansByUser(userId: string): Promise<(Loan & { creditLine: CreditLine & { facility: Facility & { bank: Bank } } })[]> {
    const result = await db
      .select()
      .from(loans)
      .innerJoin(creditLines, eq(loans.creditLineId, creditLines.id))
      .innerJoin(facilities, eq(creditLines.facilityId, facilities.id))
      .innerJoin(banks, eq(facilities.bankId, banks.id))
      .where(and(eq(loans.userId, userId), eq(loans.status, 'active')))
      .orderBy(asc(loans.dueDate));

    return result.map(row => ({
      ...row.loans,
      creditLine: {
        ...row.credit_lines,
        facility: {
          ...row.facilities,
          bank: row.banks,
        },
      },
    }));
  }

  async getSettledLoansByUser(userId: string): Promise<(Loan & { creditLine: CreditLine & { facility: Facility & { bank: Bank } } })[]> {
    const result = await db
      .select()
      .from(loans)
      .innerJoin(creditLines, eq(loans.creditLineId, creditLines.id))
      .innerJoin(facilities, eq(creditLines.facilityId, facilities.id))
      .innerJoin(banks, eq(facilities.bankId, banks.id))
      .where(and(eq(loans.userId, userId), eq(loans.status, 'settled')))
      .orderBy(desc(loans.settledDate));

    return result.map(row => ({
      ...row.loans,
      creditLine: {
        ...row.credit_lines,
        facility: {
          ...row.facilities,
          bank: row.banks,
        },
      },
    }));
  }

  async createLoan(loan: InsertLoan): Promise<Loan> {
    const [newLoan] = await db.insert(loans).values(loan).returning();
    return newLoan;
  }

  async updateLoan(loanId: string, loan: Partial<InsertLoan>): Promise<Loan> {
    const [updatedLoan] = await db
      .update(loans)
      .set(loan)
      .where(eq(loans.id, loanId))
      .returning();
    return updatedLoan;
  }

  async settleLoan(loanId: string, settledAmount: number): Promise<Loan> {
    const [settledLoan] = await db
      .update(loans)
      .set({
        status: 'settled',
        settledDate: new Date().toISOString().split('T')[0],
        settledAmount: settledAmount.toString(),
      })
      .where(eq(loans.id, loanId))
      .returning();
    return settledLoan;
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
    activeLoansCount: number;
    bankExposures: Array<{
      bankId: string;
      bankName: string;
      outstanding: number;
      creditLimit: number;
      utilization: number;
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

    // Calculate bank exposures
    const bankExposuresMap = new Map<string, { bankId: string; bankName: string; outstanding: number; creditLimit: number; }>();

    // Add outstanding amounts by bank
    activeLoans.forEach(loan => {
      const bankId = loan.creditLine.facility.bank.id;
      const bankName = loan.creditLine.facility.bank.name;
      const amount = parseFloat(loan.amount);

      if (bankExposuresMap.has(bankId)) {
        const existing = bankExposuresMap.get(bankId)!;
        existing.outstanding += amount;
      } else {
        bankExposuresMap.set(bankId, {
          bankId,
          bankName,
          outstanding: amount,
          creditLimit: 0,
        });
      }
    });

    // Add credit limits by bank
    userFacilities.forEach(facility => {
      const bankId = facility.banks.id;
      const bankName = facility.banks.name;
      const creditLimit = parseFloat(facility.facilities.creditLimit);

      if (bankExposuresMap.has(bankId)) {
        const existing = bankExposuresMap.get(bankId)!;
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

    const bankExposures = Array.from(bankExposuresMap.values()).map(exposure => ({
      ...exposure,
      utilization: exposure.creditLimit > 0 ? (exposure.outstanding / exposure.creditLimit) * 100 : 0,
    }));

    return {
      totalOutstanding,
      totalCreditLimit,
      availableCredit,
      portfolioLtv,
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
}

// In-memory storage fallback implementation
export class MemoryStorage implements IStorage {
  private users = new Map<string, User>();
  private banks = new Map<string, Bank>();
  private bankContacts = new Map<string, BankContact>();
  private facilities = new Map<string, Facility>();
  private creditLines = new Map<string, CreditLine>();
  private collateral = new Map<string, Collateral>();
  private loans = new Map<string, Loan>();
  private documents = new Map<string, Document>();
  private aiConfigs = new Map<string, AiInsightConfig>();
  private exposureSnapshots = new Map<string, ExposureSnapshot>();
  private transactions = new Map<string, Transaction>();

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
    return [];
  }

  async getActiveLoansByUser(userId: string): Promise<(Loan & { creditLine: CreditLine & { facility: Facility & { bank: Bank } } })[]> {
    return [];
  }

  async getSettledLoansByUser(userId: string): Promise<(Loan & { creditLine: CreditLine & { facility: Facility & { bank: Bank } } })[]> {
    return [];
  }

  async createLoan(loan: InsertLoan): Promise<Loan> {
    const newLoan: Loan = {
      ...loan,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
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

  async settleLoan(loanId: string, settledAmount: number): Promise<Loan> {
    const existing = this.loans.get(loanId);
    if (!existing) throw new Error('Loan not found');

    const updated: Loan = {
      ...existing,
      status: 'settled',
      settledAmount,
      settledDate: new Date(),
      updatedAt: new Date(),
    };
    this.loans.set(loanId, updated);
    return updated;
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
    activeLoansCount: number;
    bankExposures: Array<{
      bankId: string;
      bankName: string;
      outstanding: number;
      creditLimit: number;
      utilization: number;
    }>;
  }> {
    return {
      totalOutstanding: 0,
      totalCreditLimit: 0,
      availableCredit: 0,
      portfolioLtv: 0,
      activeLoansCount: 0,
      bankExposures: [],
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
      updatedAt: new Date(),
    };
    this.transactions.set(newTransaction.id, newTransaction);
    return newTransaction;
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
