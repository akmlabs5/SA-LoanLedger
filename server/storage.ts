import {
  users,
  banks,
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
  
  // Facility operations
  getUserFacilities(userId: string): Promise<Array<Facility & { bank: Bank }>>;
  getFacilityWithBank(facilityId: string): Promise<(Facility & { bank: Bank }) | undefined>;
  createFacility(facility: InsertFacility): Promise<Facility>;
  updateFacility(facilityId: string, facility: Partial<InsertFacility>): Promise<Facility>;
  
  // Collateral operations
  getUserCollateral(userId: string): Promise<Collateral[]>;
  createCollateral(collateral: InsertCollateral): Promise<Collateral>;
  updateCollateral(collateralId: string, collateral: Partial<InsertCollateral>): Promise<Collateral>;
  
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

export const storage = new DatabaseStorage();
