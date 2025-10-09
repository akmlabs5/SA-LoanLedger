import type { Express } from "express";
import type { AppDependencies } from "../types";
import { isAuthenticated } from "../replitAuth";
import { attachOrganizationContext, requireOrganization } from "../organizationMiddleware";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import xlsx from "xlsx";

export function registerReportsRoutes(app: Express, deps: AppDependencies) {
  const { storage } = deps;

  // Facility Summary Report
  app.get('/api/reports/facility-summary', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const organizationId = req.organizationId;
      const format = req.query.format || 'pdf';
      const startDate = req.query.startDate;
      const endDate = req.query.endDate;

      if (!organizationId) {
        return res.status(400).json({ error: 'Organization context required' });
      }

      // Fetch data for the report - organization-scoped
      const facilities = await storage.getUserFacilities(organizationId);
      const allBanks = await storage.getAllBanks();
      const loans = await storage.getActiveLoansByUser(organizationId);
      
      // Filter to ensure only organization data
      const orgFacilities = facilities.filter((f: any) => f.organizationId === organizationId);
      const orgLoans = loans.filter((l: any) => l.organizationId === organizationId);
      const banks = allBanks;

      // Prepare report data
      const reportData = orgFacilities.map((facility: any) => {
        const bank = banks.find((b: any) => b.id === facility.bankId);
        const facilityLoans = orgLoans.filter((l: any) => l.facilityId === facility.id);
        const totalOutstanding = facilityLoans.reduce((sum: number, loan: any) => sum + (loan.outstandingBalance || 0), 0);
        
        return {
          bankName: bank?.name || 'Unknown',
          facilityType: facility.facilityType || '-',
          creditLimit: facility.creditLimit || 0,
          outstanding: totalOutstanding,
          utilization: facility.creditLimit > 0 ? ((totalOutstanding / facility.creditLimit) * 100).toFixed(2) : '0',
          expiryDate: facility.expiryDate || '-',
        };
      });

      if (format === 'pdf') {
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(20);
        doc.text('Facility Summary Report', 14, 20);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
        if (startDate && endDate) {
          doc.text(`Period: ${startDate} to ${endDate}`, 14, 34);
        }

        // Table
        autoTable(doc, {
          startY: startDate && endDate ? 40 : 35,
          head: [['Bank', 'Type', 'Credit Limit (SAR)', 'Outstanding (SAR)', 'Utilization %', 'Expiry Date']],
          body: reportData.map((row: any) => [
            row.bankName,
            row.facilityType,
            row.creditLimit.toLocaleString(),
            row.outstanding.toLocaleString(),
            row.utilization,
            row.expiryDate
          ]),
          theme: 'grid',
          headStyles: { fillColor: [22, 101, 52] }, // Saudi green
          styles: { fontSize: 9 }
        });

        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=facility-report-${new Date().toISOString().split('T')[0]}.pdf`);
        res.send(pdfBuffer);

      } else if (format === 'excel') {
        const worksheet = xlsx.utils.json_to_sheet(reportData.map((row: any) => ({
          'Bank': row.bankName,
          'Facility Type': row.facilityType,
          'Credit Limit (SAR)': row.creditLimit,
          'Outstanding (SAR)': row.outstanding,
          'Utilization %': row.utilization,
          'Expiry Date': row.expiryDate
        })));

        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Facility Summary');

        const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=facility-report-${new Date().toISOString().split('T')[0]}.xlsx`);
        res.send(excelBuffer);
      } else {
        res.status(400).json({ error: 'Invalid format' });
      }
    } catch (error: any) {
      console.error('Error generating facility summary report:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Bank Exposures Report
  app.get('/api/reports/bank-exposures', isAuthenticated, attachOrganizationContext, requireOrganization, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const organizationId = req.organizationId;
      const format = req.query.format || 'pdf';
      const startDate = req.query.startDate;
      const endDate = req.query.endDate;

      if (!organizationId) {
        return res.status(400).json({ error: 'Organization context required' });
      }

      // Fetch exposure data - organization-scoped
      const facilities = await storage.getUserFacilities(organizationId);
      const allBanks = await storage.getAllBanks();
      const loans = await storage.getActiveLoansByUser(organizationId);
      
      // Filter to ensure only organization data
      const orgFacilities = facilities.filter((f: any) => f.organizationId === organizationId);
      const orgLoans = loans.filter((l: any) => l.organizationId === organizationId);
      const banks = allBanks;

      // Calculate bank exposures - using organization-scoped data
      const bankExposures = banks.map((bank: any) => {
        const bankFacilities = orgFacilities.filter((f: any) => f.bankId === bank.id);
        const totalLimit = bankFacilities.reduce((sum: number, f: any) => sum + (f.creditLimit || 0), 0);
        
        const bankLoans = orgLoans.filter((l: any) => 
          bankFacilities.some((f: any) => f.id === l.facilityId)
        );
        const totalOutstanding = bankLoans.reduce((sum: number, loan: any) => sum + (loan.outstandingBalance || 0), 0);
        
        return {
          bankName: bank.name,
          totalFacilities: bankFacilities.length,
          totalLimit,
          totalOutstanding,
          utilization: totalLimit > 0 ? ((totalOutstanding / totalLimit) * 100).toFixed(2) : '0',
          activeLoans: bankLoans.length
        };
      }).filter((exposure: any) => exposure.totalLimit > 0 || exposure.totalOutstanding > 0);

      if (format === 'pdf') {
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(20);
        doc.text('Bank Exposures Report', 14, 20);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
        if (startDate && endDate) {
          doc.text(`Period: ${startDate} to ${endDate}`, 14, 34);
        }

        // Table
        autoTable(doc, {
          startY: startDate && endDate ? 40 : 35,
          head: [['Bank', 'Facilities', 'Total Limit (SAR)', 'Outstanding (SAR)', 'Utilization %', 'Active Loans']],
          body: bankExposures.map((row: any) => [
            row.bankName,
            row.totalFacilities,
            row.totalLimit.toLocaleString(),
            row.totalOutstanding.toLocaleString(),
            row.utilization,
            row.activeLoans
          ]),
          theme: 'grid',
          headStyles: { fillColor: [22, 101, 52] }, // Saudi green
          styles: { fontSize: 9 }
        });

        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=bank-exposures-${new Date().toISOString().split('T')[0]}.pdf`);
        res.send(pdfBuffer);

      } else if (format === 'excel') {
        const worksheet = xlsx.utils.json_to_sheet(bankExposures.map((row: any) => ({
          'Bank': row.bankName,
          'Total Facilities': row.totalFacilities,
          'Total Limit (SAR)': row.totalLimit,
          'Outstanding (SAR)': row.totalOutstanding,
          'Utilization %': row.utilization,
          'Active Loans': row.activeLoans
        })));

        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Bank Exposures');

        const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=bank-exposures-${new Date().toISOString().split('T')[0]}.xlsx`);
        res.send(excelBuffer);
      } else {
        res.status(400).json({ error: 'Invalid format' });
      }
    } catch (error: any) {
      console.error('Error generating bank exposures report:', error);
      res.status(500).json({ error: error.message });
    }
  });
}
