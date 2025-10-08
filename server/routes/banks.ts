import type { Express } from "express";
import { isAuthenticated } from "../replitAuth";
import { attachOrganizationContext, requireOrganization } from "../organizationMiddleware";
import type { AppDependencies } from "../types";
import {
  insertBankContactSchema,
} from "@shared/schema";

export function registerBanksRoutes(app: Express, deps: AppDependencies) {
  const { storage } = deps;

  app.get('/api/banks', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const organizationId = req.organizationId;
      const banks = await storage.getAllBanks(organizationId);
      res.json(banks);
    } catch (error) {
      console.error("Error fetching banks:", error);
      res.status(500).json({ message: "Failed to fetch banks" });
    }
  });

  app.get('/api/banks/:bankId', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const organizationId = req.organizationId;
      const { bankId } = req.params;
      const banks = await storage.getAllBanks(organizationId);
      const bank = banks.find(b => b.id === bankId);
      
      if (!bank) {
        return res.status(404).json({ message: "Bank not found" });
      }
      
      res.json(bank);
    } catch (error) {
      console.error("Error fetching bank:", error);
      res.status(500).json({ message: "Failed to fetch bank" });
    }
  });

  app.get('/api/banks/:bankId/contacts', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const organizationId = req.organizationId;
      const { bankId } = req.params;
      const contacts = await storage.getBankContacts(bankId, organizationId);
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching bank contacts:", error);
      res.status(500).json({ message: "Failed to fetch bank contacts" });
    }
  });

  app.post('/api/banks/:bankId/contacts', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const organizationId = req.organizationId;
      const { bankId } = req.params;
      const contactData = insertBankContactSchema.parse({ 
        ...req.body, 
        organizationId, 
        bankId 
      });
      const contact = await storage.createBankContact(contactData);
      res.json(contact);
    } catch (error) {
      console.error("Error creating bank contact:", error);
      res.status(400).json({ message: "Failed to create bank contact" });
    }
  });

  app.put('/api/bank-contacts/:contactId', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const organizationId = req.organizationId;
      const { contactId } = req.params;
      const contactData = req.body;
      delete contactData.id;
      delete contactData.organizationId;
      delete contactData.bankId;
      
      const contact = await storage.updateBankContact(contactId, organizationId, contactData);
      res.json(contact);
    } catch (error) {
      console.error("Error updating bank contact:", error);
      res.status(400).json({ message: "Failed to update bank contact" });
    }
  });

  app.delete('/api/bank-contacts/:contactId', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const organizationId = req.organizationId;
      const { contactId } = req.params;
      await storage.deleteBankContact(contactId, organizationId);
      res.json({ message: "Bank contact deleted successfully" });
    } catch (error) {
      console.error("Error deleting bank contact:", error);
      res.status(500).json({ message: "Failed to delete bank contact" });
    }
  });

  app.put('/api/bank-contacts/:contactId/set-primary', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const organizationId = req.organizationId;
      const { contactId } = req.params;
      const { bankId } = req.body;
      
      const contact = await storage.setPrimaryContact(contactId, bankId, organizationId);
      res.json(contact);
    } catch (error) {
      console.error("Error setting primary contact:", error);
      res.status(400).json({ message: "Failed to set primary contact" });
    }
  });

  app.get('/api/banks/:bankId/analytics', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const organizationId = req.organizationId;
      const { bankId } = req.params;

      const allFacilities = await storage.getUserFacilities(organizationId);
      const facilities = allFacilities.filter(f => f.bankId === bankId);

      const allLoans = await storage.getUserLoans(organizationId);
      const loans = allLoans.filter(loan => 
        facilities.some(f => f.id === loan.facilityId)
      );

      const activeLoans = loans.filter(l => l.status === 'active').length;
      const settledLoans = loans.filter(l => l.status === 'settled').length;
      const cancelledLoans = loans.filter(l => l.status === 'cancelled').length;

      const activeLoansList = loans.filter(l => l.status === 'active');
      const balancePromises = activeLoansList.map(loan => storage.getLoanBalance(loan.id));
      const balances = await Promise.all(balancePromises);

      const totalOutstanding = balances.reduce((sum, balance) => {
        return sum + (balance ? parseFloat(balance.total) : 0);
      }, 0);

      const totalCreditLimit = facilities.reduce((sum, f) => sum + parseFloat(f.limit), 0);
      const utilizationRate = totalCreditLimit > 0 ? (totalOutstanding / totalCreditLimit) * 100 : 0;

      const loanIds = loans.map(l => l.id);
      const transactionPromises = loanIds.map(loanId => storage.getLoanTransactions(loanId));
      const transactionArrays = await Promise.all(transactionPromises);
      const transactions = transactionArrays.flat();

      const paymentsByMonth: Record<string, number> = {};
      const interestByMonth: Record<string, number> = {};

      transactions.forEach(t => {
        const date = new Date(t.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (t.transactionType === 'payment' || t.transactionType === 'settlement') {
          paymentsByMonth[monthKey] = (paymentsByMonth[monthKey] || 0) + parseFloat(t.amount);
        }
        
        if (t.transactionType === 'interest_accrual') {
          interestByMonth[monthKey] = (interestByMonth[monthKey] || 0) + parseFloat(t.amount);
        }
      });

      const facilityUtilization = await Promise.all(
        facilities.map(async facility => {
          const facilityLoans = loans.filter(l => l.facilityId === facility.id && l.status === 'active');
          
          const facilityBalancePromises = facilityLoans.map(loan => storage.getLoanBalance(loan.id));
          const facilityBalances = await Promise.all(facilityBalancePromises);
          
          const facilityOutstanding = facilityBalances.reduce((sum, balance) => {
            return sum + (balance ? parseFloat(balance.total) : 0);
          }, 0);
          
          const utilization = parseFloat(facility.limit) > 0 
            ? (facilityOutstanding / parseFloat(facility.limit)) * 100 
            : 0;

          return {
            facilityId: facility.id,
            facilityName: `${(facility.type || 'facility').replace('_', ' ').toUpperCase()} - ${parseFloat(facility.limit).toLocaleString('en-SA')} SAR`,
            limit: parseFloat(facility.limit),
            outstanding: facilityOutstanding,
            utilization: Math.round(utilization * 10) / 10,
            activeLoans: facilityLoans.length
          };
        })
      );

      res.json({
        summary: {
          totalOutstanding,
          totalCreditLimit,
          utilizationRate: Math.round(utilizationRate * 10) / 10,
          activeLoans,
          settledLoans,
          cancelledLoans,
          facilitiesCount: facilities.length
        },
        facilityUtilization,
        paymentsByMonth,
        interestByMonth,
        loanStatusBreakdown: {
          active: activeLoans,
          settled: settledLoans,
          cancelled: cancelledLoans
        }
      });
    } catch (error) {
      console.error("Error fetching bank analytics:", error);
      res.status(500).json({ message: "Failed to fetch bank analytics" });
    }
  });

  app.post('/api/banks/migrate-names', isAuthenticated, async (req: any, res) => {
    try {
      const updated: string[] = [];
      
      const bankMigrations = [
        { oldPattern: 'Arab National Bank', newName: 'Arab National Bank', newCode: 'ANB' },
        { oldPattern: 'Al Rajhi', newName: 'Al Rajhi Bank', newCode: 'RJH' },
        { oldPattern: 'Alinma', newName: 'Alinma Bank', newCode: 'INMA' },
        { oldPattern: 'Albilad', newName: 'Bank Albilad', newCode: 'ALB' },
        { oldPattern: 'AlJazira', newName: 'Bank AlJazira', newCode: 'BJA' },
        { oldPattern: 'Banque Saudi Fransi', newName: 'Banque Saudi Fransi', newCode: 'BSF' },
        { oldPattern: 'Riyad Bank', newName: 'Riyad Bank', newCode: 'RIB' },
        { oldPattern: 'Saudi British Bank', newName: 'Saudi Awwal Bank', newCode: 'SAB' },
        { oldPattern: 'SABB', newName: 'Saudi Awwal Bank', newCode: 'SAB' },
        { oldPattern: 'Saudi Investment Bank', newName: 'Saudi Investment Bank', newCode: 'SAIB' },
        { oldPattern: 'Saudi National Bank', newName: 'Saudi National Bank', newCode: 'SNB' },
      ];

      const allBanks = await storage.getAllBanks();
      
      for (const bank of allBanks) {
        const migration = bankMigrations.find(m => 
          bank.name.includes(m.oldPattern) || bank.code === m.newCode
        );
        
        if (migration) {
          if (bank.name !== migration.newName || bank.code !== migration.newCode) {
            const db = (storage as any).db;
            if (db) {
              await db.update({ name: migration.newName, code: migration.newCode })
                .from('banks')
                .where('id', bank.id);
              
              updated.push(`${bank.name} (${bank.code}) → ${migration.newName} (${migration.newCode})`);
            }
          }
        }
      }
      
      res.json({ 
        message: 'Bank migration completed', 
        updated,
        count: updated.length 
      });
    } catch (error) {
      console.error("Error migrating bank names:", error);
      res.status(500).json({ message: "Failed to migrate bank names" });
    }
  });
}
