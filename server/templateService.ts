import { Loan, LoanReminder, ReminderTemplate, User, Bank, Facility } from '@shared/schema';

interface TemplateContext {
  loan: Loan;
  reminder?: LoanReminder;
  user?: User;
  bank?: Bank;
  facility?: Facility;
  currentDate?: Date;
}

interface TemplateVariables {
  // Loan variables
  loanAmount: string;
  loanAmountRaw: string;
  referenceNumber: string;
  dueDate: string;
  dueDateRaw: string;
  loanType: string;
  interestRate: string;
  
  // Bank and Facility variables
  bankName: string;
  facilityName: string;
  facilityType: string;
  
  // User variables
  userName: string;
  userEmail: string;
  
  // Reminder variables
  reminderDate: string;
  reminderMessage: string;
  
  // System variables
  currentDate: string;
  platformName: string;
  
  // Formatted amounts
  loanAmountFormatted: string;
  loanAmountMillion: string;
}

export class TemplateService {
  /**
   * Render a template by substituting variables with actual data
   */
  static renderTemplate(template: string, context: TemplateContext): string {
    const variables = this.buildTemplateVariables(context);
    
    let rendered = template;
    
    // Replace all variables in the format {variableName}
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      rendered = rendered.replace(regex, value || '');
    });
    
    return rendered;
  }

  /**
   * Render email template with loan data
   */
  static renderEmailTemplate(template: ReminderTemplate, context: TemplateContext): {
    subject: string;
    body: string;
  } {
    return {
      subject: this.renderTemplate(template.subject || 'Loan Payment Reminder', context),
      body: this.renderTemplate(template.emailTemplate || '', context)
    };
  }

  /**
   * Render calendar template with loan data
   */
  static renderCalendarTemplate(template: ReminderTemplate, context: TemplateContext): {
    title: string;
    description: string;
  } {
    return {
      title: this.renderTemplate(template.subject || 'Loan Payment Reminder', context),
      description: this.renderTemplate(template.calendarTemplate || '', context)
    };
  }

  /**
   * Build template variables from context data
   */
  private static buildTemplateVariables(context: TemplateContext): TemplateVariables {
    const { loan, reminder, user, bank, facility, currentDate = new Date() } = context;
    
    // Format loan amount
    const amount = parseFloat(loan.amount);
    const amountInMillions = amount / 1000000;
    
    // Format dates
    const formatDate = (date: Date | string) => {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toLocaleDateString('en-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const formatDateShort = (date: Date | string) => {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toLocaleDateString('en-SA');
    };

    return {
      // Loan variables
      loanAmount: amount.toLocaleString('en-SA', { 
        style: 'currency', 
        currency: 'SAR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0 
      }),
      loanAmountRaw: amount.toString(),
      loanAmountFormatted: `${amount.toLocaleString('en-SA')} SAR`,
      loanAmountMillion: `${amountInMillions.toFixed(1)}M SAR`,
      referenceNumber: loan.referenceNumber || '',
      dueDate: formatDate(loan.dueDate),
      dueDateRaw: formatDateShort(loan.dueDate),
      loanType: loan.siborTerm || 'Loan',
      interestRate: loan.siborRate ? `${loan.siborRate}%` : '',
      
      // Bank and Facility variables
      bankName: bank?.name || '',
      facilityName: facility?.id || '',
      facilityType: facility?.facilityType || '',
      
      // User variables
      userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
      userEmail: user?.email || '',
      
      // Reminder variables
      reminderDate: reminder ? formatDate(reminder.reminderDate) : '',
      reminderMessage: reminder?.message || '',
      
      // System variables
      currentDate: formatDate(currentDate),
      platformName: 'Saudi Loan Management Platform'
    };
  }

  /**
   * Get list of available template variables for documentation
   */
  static getAvailableVariables(): Array<{ key: string; description: string; example: string }> {
    return [
      { key: 'loanAmount', description: 'Formatted loan amount with currency', example: 'SAR 1,500,000' },
      { key: 'loanAmountRaw', description: 'Raw loan amount as number', example: '1500000' },
      { key: 'loanAmountFormatted', description: 'Loan amount with SAR suffix', example: '1,500,000 SAR' },
      { key: 'loanAmountMillion', description: 'Loan amount in millions', example: '1.5M SAR' },
      { key: 'referenceNumber', description: 'Loan reference number', example: 'LN-2024-001' },
      { key: 'dueDate', description: 'Formatted due date', example: 'December 31, 2024' },
      { key: 'dueDateRaw', description: 'Short format due date', example: '31/12/2024' },
      { key: 'loanType', description: 'SIBOR term or loan identifier', example: '3 Months SIBOR' },
      { key: 'interestRate', description: 'SIBOR rate percentage', example: '5.75%' },
      { key: 'bankName', description: 'Name of the bank', example: 'Al Rajhi Bank' },
      { key: 'facilityName', description: 'Facility identifier', example: 'facility-abc-123' },
      { key: 'facilityType', description: 'Type of facility', example: 'term' },
      { key: 'userName', description: 'User\'s full name', example: 'Ahmed Al-Salem' },
      { key: 'userEmail', description: 'User\'s email address', example: 'ahmed@company.com' },
      { key: 'reminderDate', description: 'Reminder date', example: 'December 30, 2024' },
      { key: 'reminderMessage', description: 'Custom reminder message', example: 'Payment due soon' },
      { key: 'currentDate', description: 'Current date', example: 'September 29, 2025' },
      { key: 'platformName', description: 'Platform name', example: 'Saudi Loan Management Platform' }
    ];
  }

  /**
   * Validate template for missing variables
   */
  static validateTemplate(template: string): {
    isValid: boolean;
    missingVariables: string[];
    unknownVariables: string[];
  } {
    const availableVars = this.getAvailableVariables().map(v => v.key);
    const templateVars = this.extractVariablesFromTemplate(template);
    
    const unknownVariables = templateVars.filter(v => !availableVars.includes(v));
    const missingVariables: string[] = []; // Could implement required vars logic
    
    return {
      isValid: unknownVariables.length === 0,
      missingVariables,
      unknownVariables
    };
  }

  /**
   * Extract variable names from template
   */
  private static extractVariablesFromTemplate(template: string): string[] {
    const regex = /\{([^}]+)\}/g;
    const variables: string[] = [];
    let match;
    
    while ((match = regex.exec(template)) !== null) {
      variables.push(match[1]);
    }
    
    return Array.from(new Set(variables)); // Remove duplicates
  }

  /**
   * Generate sample template content with variables
   */
  static generateSampleEmailTemplate(): {
    subject: string;
    body: string;
  } {
    return {
      subject: 'Payment Reminder: {referenceNumber} - Due {dueDate}',
      body: `Dear Valued Customer,

This is a friendly reminder that your loan payment is due soon.

Loan Details:
- Reference Number: {referenceNumber}
- Amount: {loanAmount}
- Due Date: {dueDate}
- Bank: {bankName}
- Facility: {facilityName}

{reminderMessage}

Please ensure sufficient funds are available in your account for automatic deduction, or contact us if you need to arrange alternative payment methods.

For any questions, please don't hesitate to reach out to your relationship manager.

Best regards,
{platformName}

Note: This is an automated reminder generated on {currentDate}`
    };
  }

  /**
   * Generate sample calendar template content
   */
  static generateSampleCalendarTemplate(): {
    title: string;
    description: string;
  } {
    return {
      title: 'Loan Payment Due - {referenceNumber}',
      description: `Loan Payment Reminder

Reference: {referenceNumber}
Amount: {loanAmountMillion}
Due Date: {dueDate}
Bank: {bankName}

{reminderMessage}

Please ensure sufficient funds are available for this payment.

Generated by {platformName}`
    };
  }
}