// Auto-Categorized Daily Alerts System
import { IStorage } from './storage';
import { MailService } from '@sendgrid/mail';
import { config } from './config';

const mailService = new MailService();
const sendgridKey = config.get('SENDGRID_API_KEY');
if (sendgridKey) {
  mailService.setApiKey(sendgridKey);
}

const FROM_EMAIL = config.get('SENDGRID_FROM_EMAIL');

export interface Alert {
  id: string;
  category: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  actionRequired?: string;
  data?: any;
}

export interface DailyAlertSummary {
  date: string;
  userId: string;
  userEmail: string;
  alerts: Alert[];
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

export class DailyAlertsService {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  async generateDailyAlerts(userId: string): Promise<Alert[]> {
    const alerts: Alert[] = [];
    const now = new Date();
    
    // Get user's active data
    const loans = await this.storage.getActiveLoansByUser(userId);
    const facilities = await this.storage.getUserFacilities(userId);
    const collateral = await this.storage.getUserCollateral(userId);
    
    // 1. CRITICAL: Loans overdue
    const overdueLoans = loans.filter((l: any) => {
      // Only check active loans (not settled/cancelled/restructured)
      if (l.status !== 'active') {
        return false;
      }
      const dueDate = new Date(l.dueDate);
      return dueDate < now;
    });
    
    if (overdueLoans.length > 0) {
      const totalOverdue = overdueLoans.reduce((sum: number, l: any) => 
        sum + parseFloat(l.amount.toString()), 0);
      
      alerts.push({
        id: `overdue-${Date.now()}`,
        category: 'critical',
        title: `${overdueLoans.length} Overdue Loan(s)`,
        message: `You have ${overdueLoans.length} overdue loan(s) totaling SAR ${totalOverdue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        actionRequired: 'Immediate payment or renegotiation required',
        data: overdueLoans.map((l: any) => ({
          id: l.id,
          referenceNumber: l.referenceNumber,
          amount: parseFloat(l.amount),
          dueDate: l.dueDate,
          daysOverdue: Math.ceil((now.getTime() - new Date(l.dueDate).getTime()) / (1000 * 60 * 60 * 24))
        }))
      });
    }
    
    // 2. CRITICAL: Facilities expiring within 7 days
    const expiringFacilities = facilities.filter((f: any) => {
      if (!f.expiryDate) return false;
      const expiryDate = new Date(f.expiryDate);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
    });
    
    if (expiringFacilities.length > 0) {
      alerts.push({
        id: `facilities-expiring-${Date.now()}`,
        category: 'critical',
        title: `${expiringFacilities.length} Facility/Facilities Expiring Soon`,
        message: `${expiringFacilities.length} facility/facilities will expire within 7 days`,
        actionRequired: 'Contact bank to renew or close facilities',
        data: expiringFacilities.map((f: any) => ({
          id: f.id,
          bankName: f.bank?.name || 'Unknown',
          type: f.facilityType,
          expiryDate: f.expiryDate,
          daysUntilExpiry: Math.ceil((new Date(f.expiryDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        }))
      });
    }
    
    // 3. HIGH: Loans due within 7 days
    const upcomingLoans = loans.filter((l: any) => {
      // Only check active loans
      if (l.status !== 'active') {
        return false;
      }
      const dueDate = new Date(l.dueDate);
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDue > 0 && daysUntilDue <= 7;
    });
    
    if (upcomingLoans.length > 0) {
      const totalDue = upcomingLoans.reduce((sum: number, l: any) => 
        sum + parseFloat(l.amount.toString()), 0);
      
      alerts.push({
        id: `upcoming-${Date.now()}`,
        category: 'high',
        title: `${upcomingLoans.length} Loan(s) Due Within 7 Days`,
        message: `${upcomingLoans.length} loan(s) totaling SAR ${totalDue.toLocaleString('en-US', { minimumFractionDigits: 2 })} due within 7 days`,
        actionRequired: 'Ensure sufficient funds or arrange renewal',
        data: upcomingLoans.map((l: any) => ({
          id: l.id,
          referenceNumber: l.referenceNumber,
          amount: parseFloat(l.amount),
          dueDate: l.dueDate,
          daysUntilDue: Math.ceil((new Date(l.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        }))
      });
    }
    
    // 4. HIGH: High facility utilization (>80%)
    const highUtilizationFacilities = facilities.map((f: any) => {
      const facilityLoans = loans.filter((l: any) => l.facilityId === f.id);
      const outstanding = facilityLoans.reduce((sum: number, l: any) => 
        sum + parseFloat(l.amount.toString()), 0);
      const limit = parseFloat(f.limit.toString());
      
      // Guard against zero or invalid limits
      if (limit <= 0 || !isFinite(limit)) {
        return null;
      }
      
      const utilization = (outstanding / limit) * 100;
      
      return {
        facility: f,
        utilization,
        outstanding,
        limit
      };
    }).filter((f): f is NonNullable<typeof f> => f !== null && f.utilization > 80);
    
    if (highUtilizationFacilities.length > 0) {
      alerts.push({
        id: `high-utilization-${Date.now()}`,
        category: 'high',
        title: `${highUtilizationFacilities.length} Facility/Facilities with High Utilization`,
        message: `${highUtilizationFacilities.length} facility/facilities exceeding 80% utilization`,
        actionRequired: 'Consider requesting limit increase or reducing exposure',
        data: highUtilizationFacilities.map(f => ({
          bankName: f.facility.bank?.name || 'Unknown',
          type: f.facility.facilityType,
          utilization: f.utilization.toFixed(2),
          outstanding: f.outstanding,
          limit: f.limit
        }))
      });
    }
    
    // 5. MEDIUM: Bank concentration risk (>40% to single bank)
    const banks = await this.storage.getAllBanks();
    const totalExposure = loans.reduce((sum: number, l: any) => 
      sum + parseFloat(l.amount.toString()), 0);
    
    const bankConcentration = banks.map(bank => {
      const bankLoans = loans.filter((l: any) => l.facility?.bankId === bank.id);
      const bankExposure = bankLoans.reduce((sum: number, l: any) => 
        sum + parseFloat(l.amount.toString()), 0);
      const concentration = totalExposure > 0 ? (bankExposure / totalExposure) * 100 : 0;
      
      return {
        bank,
        exposure: bankExposure,
        concentration
      };
    }).filter(b => b.concentration > 40);
    
    if (bankConcentration.length > 0) {
      alerts.push({
        id: `concentration-${Date.now()}`,
        category: 'medium',
        title: `Bank Concentration Risk Detected`,
        message: `${bankConcentration.length} bank(s) exceed 40% of portfolio exposure`,
        actionRequired: 'Consider diversifying across more banks',
        data: bankConcentration.map(b => ({
          bankName: b.bank.name,
          exposure: b.exposure,
          concentration: b.concentration.toFixed(2)
        }))
      });
    }
    
    // 6. MEDIUM: High LTV ratio (>70%)
    const totalCollateralValue = collateral.reduce((sum: number, c: any) => 
      sum + parseFloat(c.currentValue.toString()), 0);
    
    if (totalCollateralValue > 0) {
      const ltv = (totalExposure / totalCollateralValue) * 100;
      
      if (ltv > 70) {
        alerts.push({
          id: `high-ltv-${Date.now()}`,
          category: 'medium',
          title: 'High Loan-to-Value Ratio',
          message: `Portfolio LTV is ${ltv.toFixed(2)}% (exceeds 70% threshold)`,
          actionRequired: 'Consider adding collateral or reducing loan amounts',
          data: {
            ltv: ltv.toFixed(2),
            totalLoans: totalExposure,
            totalCollateral: totalCollateralValue
          }
        });
      }
    }
    
    // 7. MEDIUM: Revolving period nearing limit (>80% used)
    const facilitiesWithRevolving = facilities.filter((f: any) => f.enableRevolvingTracking);
    
    for (const facility of facilitiesWithRevolving) {
      try {
        const facilityLoans = loans.filter((l: any) => l.facilityId === facility.id);
        
        if (facilityLoans.length > 0) {
          let totalDaysUsed = 0;
          
          for (const loan of facilityLoans) {
            const startDate = new Date(loan.startDate);
            const dueDate = new Date(loan.dueDate);
            const daysUsed = Math.ceil((dueDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            totalDaysUsed += daysUsed;
          }
          
          const maxPeriod = facility.maxRevolvingPeriod || 360;
          
          // Guard against zero or invalid maxPeriod
          if (maxPeriod <= 0 || !isFinite(maxPeriod)) {
            continue; // Skip this facility
          }
          
          const usagePercent = (totalDaysUsed / maxPeriod) * 100;
          
          if (usagePercent > 80) {
            alerts.push({
              id: `revolving-limit-${facility.id}`,
              category: 'medium',
              title: `Revolving Period Limit Approaching`,
              message: `Facility at ${facility.bank?.name || 'Unknown'} has used ${usagePercent.toFixed(1)}% of revolving period`,
              actionRequired: 'Monitor usage and plan for period renewal',
              data: {
                bankName: facility.bank?.name || 'Unknown',
                daysUsed: totalDaysUsed,
                maxDays: maxPeriod,
                usagePercent: usagePercent.toFixed(2)
              }
            });
          }
        }
      } catch (error) {
        console.error('Error calculating revolving usage for facility:', error);
      }
    }
    
    // 8. LOW: Loans due within 30 days (not in 7-day window)
    const monthlyUpcoming = loans.filter((l: any) => {
      // Only check active loans
      if (l.status !== 'active') {
        return false;
      }
      const dueDate = new Date(l.dueDate);
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDue > 7 && daysUntilDue <= 30;
    });
    
    if (monthlyUpcoming.length > 0) {
      const totalDue = monthlyUpcoming.reduce((sum: number, l: any) => 
        sum + parseFloat(l.amount.toString()), 0);
      
      alerts.push({
        id: `monthly-upcoming-${Date.now()}`,
        category: 'low',
        title: `${monthlyUpcoming.length} Loan(s) Due Within 30 Days`,
        message: `${monthlyUpcoming.length} loan(s) totaling SAR ${totalDue.toLocaleString('en-US', { minimumFractionDigits: 2 })} due within 30 days`,
        actionRequired: 'Plan ahead for upcoming payments',
        data: monthlyUpcoming.length
      });
    }
    
    return alerts;
  }

  async generateAndSendDailyDigest(userId: string, userEmail: string): Promise<void> {
    const alerts = await this.generateDailyAlerts(userId);
    
    if (alerts.length === 0) {
      // No alerts, skip sending email
      return;
    }
    
    const summary: DailyAlertSummary = {
      date: new Date().toISOString().split('T')[0],
      userId,
      userEmail,
      alerts,
      criticalCount: alerts.filter(a => a.category === 'critical').length,
      highCount: alerts.filter(a => a.category === 'high').length,
      mediumCount: alerts.filter(a => a.category === 'medium').length,
      lowCount: alerts.filter(a => a.category === 'low').length
    };
    
    await this.sendAlertEmail(summary);
  }

  private async sendAlertEmail(summary: DailyAlertSummary): Promise<void> {
    if (!process.env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY === "default_key") {
      console.log('Daily alert email would be sent to:', summary.userEmail);
      console.log('Alerts:', summary.alerts.length);
      return; // Simulate success when API key not available
    }
    
    const criticalAlerts = summary.alerts.filter(a => a.category === 'critical');
    const highAlerts = summary.alerts.filter(a => a.category === 'high');
    const mediumAlerts = summary.alerts.filter(a => a.category === 'medium');
    const lowAlerts = summary.alerts.filter(a => a.category === 'low');
    
    let emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Daily Portfolio Alert Digest</h2>
        <p style="color: #666;">Date: ${summary.date}</p>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">Summary</h3>
          <p style="margin: 5px 0;">
            <span style="color: #dc2626; font-weight: bold;">${summary.criticalCount} Critical</span> | 
            <span style="color: #ea580c; font-weight: bold;">${summary.highCount} High</span> | 
            <span style="color: #f59e0b; font-weight: bold;">${summary.mediumCount} Medium</span> | 
            <span style="color: #3b82f6; font-weight: bold;">${summary.lowCount} Low</span>
          </p>
        </div>
    `;
    
    // Critical Alerts
    if (criticalAlerts.length > 0) {
      emailHtml += `
        <div style="margin: 20px 0;">
          <h3 style="color: #dc2626; border-left: 4px solid #dc2626; padding-left: 10px;">Critical Alerts</h3>
      `;
      
      for (const alert of criticalAlerts) {
        emailHtml += `
          <div style="background: #fee2e2; padding: 15px; border-radius: 8px; margin: 10px 0;">
            <h4 style="margin: 0 0 5px 0; color: #991b1b;">${alert.title}</h4>
            <p style="margin: 5px 0; color: #7f1d1d;">${alert.message}</p>
            ${alert.actionRequired ? `<p style="margin: 5px 0; color: #991b1b; font-weight: bold;">Action: ${alert.actionRequired}</p>` : ''}
          </div>
        `;
      }
      
      emailHtml += `</div>`;
    }
    
    // High Priority Alerts
    if (highAlerts.length > 0) {
      emailHtml += `
        <div style="margin: 20px 0;">
          <h3 style="color: #ea580c; border-left: 4px solid #ea580c; padding-left: 10px;">High Priority Alerts</h3>
      `;
      
      for (const alert of highAlerts) {
        emailHtml += `
          <div style="background: #ffedd5; padding: 15px; border-radius: 8px; margin: 10px 0;">
            <h4 style="margin: 0 0 5px 0; color: #9a3412;">${alert.title}</h4>
            <p style="margin: 5px 0; color: #7c2d12;">${alert.message}</p>
            ${alert.actionRequired ? `<p style="margin: 5px 0; color: #9a3412; font-weight: bold;">Action: ${alert.actionRequired}</p>` : ''}
          </div>
        `;
      }
      
      emailHtml += `</div>`;
    }
    
    // Medium Priority Alerts
    if (mediumAlerts.length > 0) {
      emailHtml += `
        <div style="margin: 20px 0;">
          <h3 style="color: #f59e0b; border-left: 4px solid #f59e0b; padding-left: 10px;">Medium Priority Alerts</h3>
      `;
      
      for (const alert of mediumAlerts) {
        emailHtml += `
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 10px 0;">
            <h4 style="margin: 0 0 5px 0; color: #92400e;">${alert.title}</h4>
            <p style="margin: 5px 0; color: #78350f;">${alert.message}</p>
            ${alert.actionRequired ? `<p style="margin: 5px 0; color: #92400e;">Action: ${alert.actionRequired}</p>` : ''}
          </div>
        `;
      }
      
      emailHtml += `</div>`;
    }
    
    // Low Priority Alerts
    if (lowAlerts.length > 0) {
      emailHtml += `
        <div style="margin: 20px 0;">
          <h3 style="color: #3b82f6; border-left: 4px solid #3b82f6; padding-left: 10px;">Low Priority Alerts</h3>
      `;
      
      for (const alert of lowAlerts) {
        emailHtml += `
          <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 10px 0;">
            <h4 style="margin: 0 0 5px 0; color: #1e40af;">${alert.title}</h4>
            <p style="margin: 5px 0; color: #1e3a8a;">${alert.message}</p>
          </div>
        `;
      }
      
      emailHtml += `</div>`;
    }
    
    emailHtml += `
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; color: #666; font-size: 12px;">
          <p>This is an automated daily digest from your Loan Management System.</p>
        </div>
      </div>
    `;
    
    try {
      await mailService.send({
        to: summary.userEmail,
        from: FROM_EMAIL,
        subject: 'Daily Portfolio Alert Digest',
        html: emailHtml,
      });
      
      console.log('Daily alert email sent successfully to:', summary.userEmail);
    } catch (error) {
      console.error('SendGrid daily alert email error:', error);
      throw error;
    }
  }
}
