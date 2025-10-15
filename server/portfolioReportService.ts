import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { IStorage } from './storage';

export interface PortfolioReportOptions {
  organizationId: string;
  reportType: 'comprehensive' | 'loans' | 'facilities' | 'summary';
  format: 'pdf' | 'docx' | 'excel';
  includeCharts?: boolean;
}

export class PortfolioReportService {
  constructor(private storage: IStorage) {}

  async generateReport(options: PortfolioReportOptions): Promise<Buffer> {
    // Fetch all portfolio data
    const [activeLoans, settledLoans, cancelledLoans, facilities, banks, collateral, guarantees] = await Promise.all([
      this.storage.getActiveLoansByUser(options.organizationId),
      this.storage.getSettledLoansByUser(options.organizationId),
      this.storage.getCancelledLoansByUser(options.organizationId),
      this.storage.getUserFacilities(options.organizationId),
      this.storage.getAllBanks(),
      this.storage.getUserCollateral(options.organizationId),
      this.storage.getUserGuarantees(options.organizationId),
    ]);

    // Calculate metrics with safe BigInt/Decimal handling
    const totalOutstanding = activeLoans.reduce((sum: number, loan: any) => sum + Number(loan.amount?.toString() ?? 0), 0);
    const totalSettled = settledLoans.reduce((sum: number, loan: any) => sum + Number(loan.amount?.toString() ?? 0), 0);
    const overdueLoans = activeLoans.filter((loan: any) => new Date(loan.dueDate) < new Date());
    const totalOverdue = overdueLoans.reduce((sum: number, loan: any) => sum + Number(loan.amount?.toString() ?? 0), 0);

    // Calculate weighted average rate
    let totalWeightedRate = 0;
    let totalAmount = 0;
    activeLoans.forEach((loan: any) => {
      const amount = Number(loan.amount?.toString() ?? 0);
      const rate = Number(loan.siborRate?.toString() ?? 0) + Number(loan.margin?.toString() ?? 0);
      totalWeightedRate += amount * rate;
      totalAmount += amount;
    });
    const avgRate = totalAmount > 0 ? (totalWeightedRate / totalAmount).toFixed(2) : '0.00';

    // Bank exposure calculation
    const bankExposures: any = {};
    activeLoans.forEach((loan: any) => {
      if (!bankExposures[loan.bankName]) {
        bankExposures[loan.bankName] = 0;
      }
      bankExposures[loan.bankName] += Number(loan.amount?.toString() ?? 0);
    });

    const reportData = {
      activeLoans,
      settledLoans,
      cancelledLoans,
      facilities,
      banks,
      collateral,
      guarantees,
      metrics: {
        totalOutstanding,
        totalSettled,
        totalOverdue,
        avgRate,
        activeLoanCount: activeLoans.length,
        settledLoanCount: settledLoans.length,
        overdueLoanCount: overdueLoans.length,
      },
      bankExposures,
    };

    if (options.format === 'pdf') {
      return this.generatePDF(reportData, options.reportType);
    } else if (options.format === 'excel') {
      return this.generateExcel(reportData, options.reportType);
    } else if (options.format === 'docx') {
      return this.generateDOCX(reportData, options.reportType);
    }

    throw new Error('Unsupported format');
  }

  private generatePDF(data: any, reportType: string): Buffer {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Header
    doc.setFontSize(24);
    doc.text('Portfolio Report', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-SA')}`, pageWidth / 2, 28, { align: 'center' });
    doc.text(`Report Type: ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`, pageWidth / 2, 34, { align: 'center' });

    let yPos = 45;

    // Portfolio Summary
    doc.setFontSize(16);
    doc.text('Portfolio Summary', 14, yPos);
    yPos += 8;

    doc.setFontSize(10);
    const summaryData = [
      ['Total Outstanding', `SAR ${data.metrics.totalOutstanding.toLocaleString()}`],
      ['Total Settled', `SAR ${data.metrics.totalSettled.toLocaleString()}`],
      ['Total Overdue', `SAR ${data.metrics.totalOverdue.toLocaleString()}`],
      ['Average Interest Rate', `${data.metrics.avgRate}%`],
      ['Active Loans', data.metrics.activeLoanCount.toString()],
      ['Settled Loans', data.metrics.settledLoanCount.toString()],
      ['Overdue Loans', data.metrics.overdueLoanCount.toString()],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Bank Exposures
    if (Object.keys(data.bankExposures).length > 0) {
      doc.setFontSize(16);
      doc.text('Bank Exposures', 14, yPos);
      yPos += 8;

      const bankData = Object.entries(data.bankExposures).map(([bank, amount]: [string, any]) => [
        bank,
        `SAR ${amount.toLocaleString()}`,
        `${((amount / data.metrics.totalOutstanding) * 100).toFixed(1)}%`
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Bank', 'Exposure', '% of Portfolio']],
        body: bankData,
        theme: 'grid',
        headStyles: { fillColor: [52, 152, 219] },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Active Loans (if comprehensive or loans report)
    if ((reportType === 'comprehensive' || reportType === 'loans') && data.activeLoans.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(16);
      doc.text('Active Loans', 14, yPos);
      yPos += 8;

      const loanData = data.activeLoans.map((loan: any) => {
        const amount = Number(loan.amount?.toString() ?? 0);
        const rate = Number(loan.siborRate?.toString() ?? 0) + Number(loan.margin?.toString() ?? 0);
        return [
          loan.bankName || 'N/A',
          loan.facilityType || 'N/A',
          `SAR ${amount.toLocaleString()}`,
          `${rate.toFixed(2)}%`,
          new Date(loan.dueDate).toLocaleDateString('en-SA'),
        ];
      });

      autoTable(doc, {
        startY: yPos,
        head: [['Bank', 'Facility Type', 'Amount', 'Rate', 'Due Date']],
        body: loanData,
        theme: 'striped',
        headStyles: { fillColor: [46, 204, 113] },
        styles: { fontSize: 8 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Facilities (if comprehensive or facilities report)
    if ((reportType === 'comprehensive' || reportType === 'facilities') && data.facilities.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(16);
      doc.text('Facilities', 14, yPos);
      yPos += 8;

      const facilityData = data.facilities.map((fac: any) => {
        const facLoans = data.activeLoans.filter((l: any) => l.facilityId === fac.id);
        const utilization = facLoans.reduce((sum: number, l: any) => sum + Number(l.amount?.toString() ?? 0), 0);
        const rawLimit = fac.creditLimit ?? fac.limit;
        const limit = rawLimit ? Number(rawLimit.toString()) : 0;
        const utilizationPct = limit > 0 ? ((utilization / limit) * 100).toFixed(1) : '0.0';
        const bankName = fac.bank?.name || 'Unknown Bank';
        
        return [
          bankName,
          fac.facilityType || 'N/A',
          `SAR ${limit.toLocaleString()}`,
          `SAR ${utilization.toLocaleString()}`,
          `${utilizationPct}%`,
        ];
      });

      autoTable(doc, {
        startY: yPos,
        head: [['Bank', 'Type', 'Limit', 'Utilized', 'Utilization %']],
        body: facilityData,
        theme: 'striped',
        headStyles: { fillColor: [155, 89, 182] },
        styles: { fontSize: 8 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Collateral (if comprehensive)
    if (reportType === 'comprehensive' && data.collateral.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(16);
      doc.text('Collateral', 14, yPos);
      yPos += 8;

      const collateralData = data.collateral.map((col: any) => {
        const value = Number(col.value?.toString() ?? 0);
        return [
          col.type || 'N/A',
          `SAR ${value.toLocaleString()}`,
          `${col.ltvRatio}%`,
          col.description || '-',
        ];
      });

      autoTable(doc, {
        startY: yPos,
        head: [['Type', 'Value', 'LTV %', 'Description']],
        body: collateralData,
        theme: 'striped',
        headStyles: { fillColor: [230, 126, 34] },
        styles: { fontSize: 8 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Guarantees (if comprehensive)
    if (reportType === 'comprehensive' && data.guarantees.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(16);
      doc.text('Guarantees', 14, yPos);
      yPos += 8;

      const guaranteeData = data.guarantees.map((guar: any) => {
        const amount = Number(guar.amount?.toString() ?? 0);
        return [
          guar.guarantorName || 'N/A',
          `SAR ${amount.toLocaleString()}`,
          guar.guaranteeType || 'N/A',
          guar.validUntil ? new Date(guar.validUntil).toLocaleDateString('en-SA') : 'N/A',
        ];
      });

      autoTable(doc, {
        startY: yPos,
        head: [['Guarantor', 'Amount', 'Type', 'Valid Until']],
        body: guaranteeData,
        theme: 'striped',
        headStyles: { fillColor: [231, 76, 60] },
        styles: { fontSize: 8 },
      });
    }

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Morouna Loans - Portfolio Report | Page ${i} of ${totalPages}`,
        pageWidth / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    return Buffer.from(doc.output('arraybuffer'));
  }

  private generateExcel(data: any, reportType: string): Buffer {
    const workbook = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ['Portfolio Summary', ''],
      ['Metric', 'Value'],
      ['Total Outstanding', `SAR ${data.metrics.totalOutstanding.toLocaleString()}`],
      ['Total Settled', `SAR ${data.metrics.totalSettled.toLocaleString()}`],
      ['Total Overdue', `SAR ${data.metrics.totalOverdue.toLocaleString()}`],
      ['Average Interest Rate', `${data.metrics.avgRate}%`],
      ['Active Loans', data.metrics.activeLoanCount],
      ['Settled Loans', data.metrics.settledLoanCount],
      ['Overdue Loans', data.metrics.overdueLoanCount],
      [''],
      ['Bank Exposures', ''],
      ['Bank', 'Exposure', '% of Portfolio'],
      ...Object.entries(data.bankExposures).map(([bank, amount]: [string, any]) => [
        bank,
        amount,
        `${((amount / data.metrics.totalOutstanding) * 100).toFixed(1)}%`
      ])
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Active Loans Sheet
    if ((reportType === 'comprehensive' || reportType === 'loans') && data.activeLoans.length > 0) {
      const loansData = [
        ['Bank', 'Facility Type', 'Amount', 'SIBOR Rate', 'Margin', 'All-in Rate', 'Due Date', 'Purpose'],
        ...data.activeLoans.map((loan: any) => {
          const amount = Number(loan.amount?.toString() ?? 0);
          const siborRate = Number(loan.siborRate?.toString() ?? 0);
          const margin = Number(loan.margin?.toString() ?? 0);
          const rate = siborRate + margin;
          return [
            loan.bankName || 'N/A',
            loan.facilityType || 'N/A',
            amount,
            siborRate,
            margin,
            rate,
            new Date(loan.dueDate).toLocaleDateString('en-SA'),
            loan.purpose || '-',
          ];
        })
      ];

      const loansSheet = XLSX.utils.aoa_to_sheet(loansData);
      XLSX.utils.book_append_sheet(workbook, loansSheet, 'Active Loans');
    }

    // Facilities Sheet
    if ((reportType === 'comprehensive' || reportType === 'facilities') && data.facilities.length > 0) {
      const facilitiesData = [
        ['Bank', 'Facility Type', 'Credit Limit', 'Utilized', 'Available', 'Utilization %', 'Start Date', 'Expiry Date'],
        ...data.facilities.map((fac: any) => {
          const facLoans = data.activeLoans.filter((l: any) => l.facilityId === fac.id);
          const utilization = facLoans.reduce((sum: number, l: any) => sum + Number(l.amount?.toString() ?? 0), 0);
          const rawLimit = fac.creditLimit ?? fac.limit;
          const limit = rawLimit ? Number(rawLimit.toString()) : 0;
          const available = limit - utilization;
          const utilizationPct = limit > 0 ? ((utilization / limit) * 100).toFixed(1) : '0.0';
          const bankName = fac.bank?.name || 'Unknown Bank';
          
          return [
            bankName,
            fac.facilityType || 'N/A',
            limit,
            utilization,
            available,
            `${utilizationPct}%`,
            fac.startDate ? new Date(fac.startDate).toLocaleDateString('en-SA') : 'N/A',
            fac.expiryDate ? new Date(fac.expiryDate).toLocaleDateString('en-SA') : 'N/A',
          ];
        })
      ];

      const facilitiesSheet = XLSX.utils.aoa_to_sheet(facilitiesData);
      XLSX.utils.book_append_sheet(workbook, facilitiesSheet, 'Facilities');
    }

    // Collateral Sheet
    if (reportType === 'comprehensive' && data.collateral.length > 0) {
      const collateralData = [
        ['Type', 'Value', 'LTV %', 'Description', 'Location'],
        ...data.collateral.map((col: any) => {
          const value = Number(col.value?.toString() ?? 0);
          return [
            col.type || 'N/A',
            value,
            col.ltvRatio,
            col.description || '-',
            col.location || '-',
          ];
        })
      ];

      const collateralSheet = XLSX.utils.aoa_to_sheet(collateralData);
      XLSX.utils.book_append_sheet(workbook, collateralSheet, 'Collateral');
    }

    // Guarantees Sheet
    if (reportType === 'comprehensive' && data.guarantees.length > 0) {
      const guaranteesData = [
        ['Guarantor', 'Amount', 'Type', 'Valid Until', 'Notes'],
        ...data.guarantees.map((guar: any) => {
          const amount = Number(guar.amount?.toString() ?? 0);
          return [
            guar.guarantorName || 'N/A',
            amount,
            guar.guaranteeType || 'N/A',
            guar.validUntil ? new Date(guar.validUntil).toLocaleDateString('en-SA') : 'N/A',
            guar.notes || '-',
          ];
        })
      ];

      const guaranteesSheet = XLSX.utils.aoa_to_sheet(guaranteesData);
      XLSX.utils.book_append_sheet(workbook, guaranteesSheet, 'Guarantees');
    }

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return excelBuffer;
  }

  private generateDOCX(data: any, reportType: string): Buffer {
    // For DOCX, we'll create a simple text-based document structure
    // Since we don't have a proper DOCX library, we'll use HTML-like formatting
    // that can be converted to DOCX by the mammoth library (text extraction)
    
    // For now, return a formatted text document as a buffer
    const lines: string[] = [];
    
    lines.push('PORTFOLIO REPORT');
    lines.push('================\n');
    lines.push(`Generated: ${new Date().toLocaleDateString('en-SA')}`);
    lines.push(`Report Type: ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}\n\n`);
    
    lines.push('PORTFOLIO SUMMARY');
    lines.push('-----------------');
    lines.push(`Total Outstanding: SAR ${data.metrics.totalOutstanding.toLocaleString()}`);
    lines.push(`Total Settled: SAR ${data.metrics.totalSettled.toLocaleString()}`);
    lines.push(`Total Overdue: SAR ${data.metrics.totalOverdue.toLocaleString()}`);
    lines.push(`Average Interest Rate: ${data.metrics.avgRate}%`);
    lines.push(`Active Loans: ${data.metrics.activeLoanCount}`);
    lines.push(`Settled Loans: ${data.metrics.settledLoanCount}`);
    lines.push(`Overdue Loans: ${data.metrics.overdueLoanCount}\n\n`);
    
    if (Object.keys(data.bankExposures).length > 0) {
      lines.push('BANK EXPOSURES');
      lines.push('--------------');
      Object.entries(data.bankExposures).forEach(([bank, amount]: [string, any]) => {
        const pct = ((amount / data.metrics.totalOutstanding) * 100).toFixed(1);
        lines.push(`${bank}: SAR ${amount.toLocaleString()} (${pct}%)`);
      });
      lines.push('\n');
    }
    
    if ((reportType === 'comprehensive' || reportType === 'loans') && data.activeLoans.length > 0) {
      lines.push('ACTIVE LOANS');
      lines.push('------------');
      data.activeLoans.forEach((loan: any) => {
        const amount = Number(loan.amount?.toString() ?? 0);
        const rate = Number(loan.siborRate?.toString() ?? 0) + Number(loan.margin?.toString() ?? 0);
        lines.push(`${loan.bankName} - ${loan.facilityType}`);
        lines.push(`  Amount: SAR ${amount.toLocaleString()}`);
        lines.push(`  Rate: ${rate.toFixed(2)}%`);
        lines.push(`  Due Date: ${new Date(loan.dueDate).toLocaleDateString('en-SA')}\n`);
      });
      lines.push('\n');
    }
    
    if ((reportType === 'comprehensive' || reportType === 'facilities') && data.facilities.length > 0) {
      lines.push('FACILITIES');
      lines.push('----------');
      data.facilities.forEach((fac: any) => {
        const facLoans = data.activeLoans.filter((l: any) => l.facilityId === fac.id);
        const utilization = facLoans.reduce((sum: number, l: any) => sum + Number(l.amount?.toString() ?? 0), 0);
        const rawLimit = fac.creditLimit ?? fac.limit;
        const limit = rawLimit ? Number(rawLimit.toString()) : 0;
        const utilizationPct = limit > 0 ? ((utilization / limit) * 100).toFixed(1) : '0.0';
        const bankName = fac.bank?.name || 'Unknown Bank';
        
        lines.push(`${bankName} - ${fac.facilityType}`);
        lines.push(`  Limit: SAR ${limit.toLocaleString()}`);
        lines.push(`  Utilized: SAR ${utilization.toLocaleString()} (${utilizationPct}%)`);
        lines.push(`  Available: SAR ${(limit - utilization).toLocaleString()}\n`);
      });
      lines.push('\n');
    }

    if (reportType === 'comprehensive' && data.collateral.length > 0) {
      lines.push('COLLATERAL');
      lines.push('----------');
      data.collateral.forEach((col: any) => {
        const value = Number(col.value?.toString() ?? 0);
        lines.push(`${col.type}: SAR ${value.toLocaleString()} (LTV: ${col.ltvRatio}%)`);
        if (col.description) lines.push(`  Description: ${col.description}`);
        lines.push('');
      });
      lines.push('\n');
    }

    if (reportType === 'comprehensive' && data.guarantees.length > 0) {
      lines.push('GUARANTEES');
      lines.push('----------');
      data.guarantees.forEach((guar: any) => {
        const amount = Number(guar.amount?.toString() ?? 0);
        lines.push(`${guar.guarantorName}: SAR ${amount.toLocaleString()}`);
        lines.push(`  Type: ${guar.guaranteeType}`);
        if (guar.validUntil) {
          lines.push(`  Valid Until: ${new Date(guar.validUntil).toLocaleDateString('en-SA')}`);
        }
        lines.push('');
      });
    }

    lines.push('\n---');
    lines.push('Morouna Loans - Portfolio Report');
    
    return Buffer.from(lines.join('\n'), 'utf-8');
  }
}
