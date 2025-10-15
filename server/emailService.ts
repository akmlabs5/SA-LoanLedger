import { MailService } from '@sendgrid/mail';
import { TemplateService } from './templateService';
import { Loan, LoanReminder, ReminderTemplate, User, Bank, Facility } from '@shared/schema';
import { config } from './config';
import { createEvent, EventAttributes } from 'ics';

if (!config.has('SENDGRID_API_KEY')) {
  console.warn("SENDGRID_API_KEY environment variable not set - email notifications disabled");
}

export const mailService = new MailService();
const sendgridKey = config.get('SENDGRID_API_KEY');
if (sendgridKey) {
  mailService.setApiKey(sendgridKey);
}

// Different FROM addresses for different email types
export const FROM_EMAIL_AUTH: string = 'noreply@akm-labs.com';  // For authentication emails
export const FROM_EMAIL_REMINDERS: string = 'reminders@akm-labs.com';  // For reminder emails
export const FROM_EMAIL: string = FROM_EMAIL_AUTH;  // Default to auth email

/**
 * Generate a calendar invite (.ics file) for a loan reminder
 */
export function generateCalendarInvite(
  reminder: LoanReminder,
  loan: Loan,
  user: User,
  bank?: Bank,
  facility?: Facility
): string | null {
  try {
    const reminderDate = new Date(reminder.reminderDate);
    
    // Create event attributes
    const event: EventAttributes = {
      start: [
        reminderDate.getFullYear(),
        reminderDate.getMonth() + 1,
        reminderDate.getDate(),
        reminderDate.getHours(),
        reminderDate.getMinutes()
      ],
      duration: { hours: 1, minutes: 0 }, // 1-hour reminder
      title: reminder.title || `Loan Payment Reminder - ${loan.referenceNumber}`,
      description: reminder.message || `Payment reminder for loan ${loan.referenceNumber}. Amount: ${loan.amount} SAR. Due: ${new Date(loan.dueDate).toLocaleDateString('en-SA')}`,
      location: bank?.name || 'Morouna Loans',
      status: 'CONFIRMED',
      busyStatus: 'FREE',
      organizer: { name: 'Morouna Loans', email: FROM_EMAIL },
      attendees: [
        {
          name: (user.firstName && user.lastName) ? `${user.firstName} ${user.lastName}` : (user.email || 'User'),
          email: user.email || '',
          rsvp: true,
          partstat: 'ACCEPTED',
          role: 'REQ-PARTICIPANT'
        }
      ]
    };

    const { error, value } = createEvent(event);
    
    if (error) {
      console.error('Error creating calendar event:', error);
      return null;
    }
    
    return value || null;
  } catch (error) {
    console.error('Error generating calendar invite:', error);
    return null;
  }
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}): Promise<void> {
  if (!config.has('SENDGRID_API_KEY')) {
    console.log('Email would be sent to:', options.to);
    console.log('Subject:', options.subject);
    return;
  }

  const emailData: any = {
    to: options.to,
    from: FROM_EMAIL,
    subject: options.subject,
  };
  
  if (options.text) emailData.text = options.text;
  if (options.html) emailData.html = options.html;
  
  await mailService.send(emailData);
}

interface LoanDueNotification {
  id: string;
  referenceNumber: string;
  amount: string;
  dueDate: string;
  facility: {
    bank: {
      name: string;
    };
  };
}

export async function sendLoanDueNotification(
  userEmail: string,
  dueLoans: LoanDueNotification[]
): Promise<boolean> {
  if (!config.has('SENDGRID_API_KEY')) {
    console.log('Email notification would be sent to:', userEmail);
    console.log('Due loans:', dueLoans.length);
    return true; // Simulate success when API key not available
  }

  try {
    const totalAmount = dueLoans.reduce((sum, loan) => sum + parseFloat(loan.amount), 0);
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #006600;">Morouna Loans - Payment Due Alert</h2>
        
        <p>Dear Valued Client,</p>
        
        <p>You have ${dueLoans.length} loan(s) due within the next 7 days with a total amount of <strong>${(totalAmount / 1000000).toFixed(1)}M SAR</strong>.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Loans Due:</h3>
          ${dueLoans.map(loan => `
            <div style="border-bottom: 1px solid #dee2e6; padding: 10px 0;">
              <strong>${loan.facility.bank.name}</strong> - ${loan.referenceNumber}<br>
              Amount: ${(parseFloat(loan.amount) / 1000000).toFixed(1)}M SAR<br>
              Due Date: ${new Date(loan.dueDate).toLocaleDateString('en-SA')}
            </div>
          `).join('')}
        </div>
        
        <p>Please ensure sufficient funds are available to meet these obligations. Contact your relationship manager if you need to discuss payment arrangements.</p>
        
        <p>Best regards,<br>
        Morouna Loans Team</p>
        
        <hr>
        <p style="font-size: 12px; color: #666;">This is an automated notification from your Morouna Loans Platform.</p>
      </div>
    `;

    await mailService.send({
      to: userEmail,
      from: FROM_EMAIL_REMINDERS,
      subject: `Loan Payment Due Alert - ${dueLoans.length} loan(s) due soon`,
      html: emailHtml,
    });

    console.log('Loan due notification sent successfully to:', userEmail);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export async function sendAIAlertNotification(
  userEmail: string,
  alertType: string,
  alertMessage: string
): Promise<boolean> {
  if (!config.has('SENDGRID_API_KEY')) {
    console.log('AI Alert notification would be sent to:', userEmail);
    console.log('Alert:', alertType, alertMessage);
    return true;
  }

  try {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #006600;">Morouna Loans - AI Portfolio Alert</h2>
        
        <p>Dear Valued Client,</p>
        
        <p>Our AI monitoring system has detected an important update regarding your loan portfolio:</p>
        
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #856404;">${alertType}</h3>
          <p style="margin-bottom: 0;">${alertMessage}</p>
        </div>
        
        <p>Please log in to your dashboard to review the detailed recommendations and take appropriate action.</p>
        
        <p>Best regards,<br>
        Morouna Loans AI System</p>
        
        <hr>
        <p style="font-size: 12px; color: #666;">This is an automated AI-generated notification from your Morouna Loans Platform.</p>
      </div>
    `;

    await mailService.send({
      to: userEmail,
      from: FROM_EMAIL_REMINDERS,
      subject: `AI Portfolio Alert - ${alertType}`,
      html: emailHtml,
    });

    console.log('AI alert notification sent successfully to:', userEmail);
    return true;
  } catch (error) {
    console.error('SendGrid AI alert email error:', error);
    return false;
  }
}

/**
 * Send template-based reminder email using the template rendering system
 */
export async function sendTemplateReminderEmail(
  user: User,
  loan: Loan,
  reminder: LoanReminder,
  template?: ReminderTemplate,
  bank?: Bank,
  facility?: Facility
): Promise<boolean> {
  if (!config.has('SENDGRID_API_KEY')) {
    console.log('Template reminder email would be sent to:', user.email);
    console.log('Loan:', loan.referenceNumber);
    console.log('Template:', template?.name || 'Default');
    return true; // Simulate success when API key not available
  }

  try {
    // Check if user has a valid email address
    if (!user.email) {
      console.error('Cannot send email: User has no email address');
      return false;
    }

    // If no template provided, use a default email template
    const emailTemplate = template || {
      id: 'default',
      name: 'Default Reminder',
      type: 'custom' as const,
      subject: 'Payment Reminder: {referenceNumber} - Due {dueDate}',
      emailTemplate: `Dear {userName},

This is a friendly reminder that your loan payment is due soon.

Loan Details:
- Reference Number: {referenceNumber}
- Amount: {loanAmount}
- Due Date: {dueDate}
- Bank: {bankName}

{reminderMessage}

Please ensure sufficient funds are available in your account for automatic deduction, or contact us if you need to arrange alternative payment methods.

Best regards,
{platformName}

Note: This is an automated reminder generated on {currentDate}`,
      calendarTemplate: '',
      variables: null,
      isActive: true,
      createdAt: null,
      updatedAt: null
    };

    // Build template context
    const context = {
      loan,
      reminder,
      user,
      bank,
      facility,
      currentDate: new Date()
    };

    // Render the email content using template service
    const renderedEmail = TemplateService.renderEmailTemplate(emailTemplate, context);

    // Convert plain text to HTML with basic formatting
    const emailBody = renderedEmail.body || 'No content available';
    let htmlBody = emailBody
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;"><p>')
      .replace(/$/, '</p></div>');

    // Generate calendar invite if calendar is enabled
    const emailData: any = {
      to: user.email,
      from: FROM_EMAIL_REMINDERS,
      subject: renderedEmail.subject || 'Loan Payment Reminder',
      html: htmlBody,
    };

    // Add calendar invite attachment if enabled
    if (reminder.calendarEnabled) {
      const calendarInvite = generateCalendarInvite(reminder, loan, user, bank, facility);
      
      if (calendarInvite) {
        // Add calendar button to email HTML
        const calendarButton = `
          <div style="text-align: center; margin: 30px 0;">
            <a href="cid:calendar-invite.ics" style="display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              📅 Add to Calendar
            </a>
          </div>
        `;
        
        // Insert button before closing div
        htmlBody = htmlBody.replace('</div>', `${calendarButton}</div>`);
        emailData.html = htmlBody;
        
        // Attach .ics file
        emailData.attachments = [
          {
            content: Buffer.from(calendarInvite).toString('base64'),
            filename: 'loan-reminder.ics',
            type: 'text/calendar',
            disposition: 'attachment',
            contentId: 'calendar-invite.ics'
          }
        ];
        
        console.log('Calendar invite attached to email');
      }
    }

    await mailService.send(emailData);

    console.log('Template reminder email sent successfully to:', user.email);
    console.log('Subject:', renderedEmail.subject);
    
    return true;
  } catch (error) {
    console.error('SendGrid template reminder email error:', error);
    return false;
  }
}

/**
 * Send loan confirmation email with branded HTML template and calendar invite
 */
export async function sendLoanConfirmationEmail(
  user: User,
  loan: Loan,
  bank?: Bank,
  facility?: Facility
): Promise<boolean> {
  if (!config.has('SENDGRID_API_KEY')) {
    console.log('Loan confirmation email would be sent to:', user.email);
    console.log('Loan:', loan.referenceNumber);
    return true;
  }

  try {
    // Check if user has a valid email address
    if (!user.email) {
      console.error('Cannot send email: User has no email address');
      return false;
    }

    // Import EmailTemplateService
    const { EmailTemplateService, EmailTemplateType } = await import('./emailTemplates/templates');

    // Calculate all-in rate
    const siborRate = Number(loan.siborRate?.toString() ?? 0);
    const margin = Number(loan.margin?.toString() ?? 0);
    const allInRate = (siborRate + margin).toFixed(2);

    // Format loan amount
    const amount = Number(loan.amount?.toString() ?? 0);
    const formattedAmount = `${amount.toLocaleString('en-US')} SAR`;

    // Format due date
    const dueDate = new Date(loan.dueDate);
    const formattedDueDate = dueDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Format facility name from type
    const facilityName = facility ? 
      facility.facilityType.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ') + ' Facility' 
      : 'N/A';

    // Build template variables
    const templateVars = {
      user_name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email,
      reference_number: loan.referenceNumber || 'N/A',
      bank_name: bank?.name || 'N/A',
      facility_name: facilityName,
      loan_amount: formattedAmount,
      due_date: formattedDueDate,
      all_in_rate: allInRate
    };

    // Render the email using the template service
    const emailContent = EmailTemplateService.getTemplate(
      EmailTemplateType.NEW_LOAN_CONFIRMATION,
      templateVars
    );

    // Prepare email data
    const emailData: any = {
      to: user.email,
      from: FROM_EMAIL_REMINDERS,
      subject: emailContent.subject,
      html: emailContent.html,
    };

    // Generate calendar invite for the due date
    const reminderDate = new Date(loan.dueDate);
    reminderDate.setHours(9, 0, 0, 0);

    const event: EventAttributes = {
      start: [
        reminderDate.getFullYear(),
        reminderDate.getMonth() + 1,
        reminderDate.getDate(),
        reminderDate.getHours(),
        reminderDate.getMinutes()
      ],
      duration: { hours: 1, minutes: 0 },
      title: `Loan Payment Due - ${bank?.name || 'Bank'} - ${loan.referenceNumber}`,
      description: `Payment due for loan ${loan.referenceNumber}. Amount: ${formattedAmount}. Bank: ${bank?.name || 'N/A'}. Facility: ${facilityName}.`,
      location: bank?.name || 'Morouna Loans',
      status: 'CONFIRMED',
      busyStatus: 'FREE',
      organizer: { name: 'Morouna Loans', email: FROM_EMAIL },
      attendees: [
        {
          name: templateVars.user_name,
          email: user.email || '',
          rsvp: true,
          partstat: 'ACCEPTED',
          role: 'REQ-PARTICIPANT'
        }
      ]
    };

    const { error, value } = createEvent(event);
    
    if (!error && value) {
      // Attach .ics file
      emailData.attachments = [
        {
          content: Buffer.from(value).toString('base64'),
          filename: 'loan-payment-due.ics',
          type: 'text/calendar',
          disposition: 'attachment',
          contentId: 'calendar-invite.ics'
        }
      ];
      
      console.log('Calendar invite attached to loan confirmation email');
    }

    await mailService.send(emailData);

    console.log('Loan confirmation email sent successfully to:', user.email);
    console.log('Subject:', emailContent.subject);
    
    return true;
  } catch (error) {
    console.error('SendGrid loan confirmation email error:', error);
    return false;
  }
}

/**
 * Send a simple reminder email without template (fallback)
 */
export async function sendSimpleReminderEmail(
  userEmail: string,
  reminderTitle: string,
  reminderMessage: string,
  loanReference?: string
): Promise<boolean> {
  if (!config.has('SENDGRID_API_KEY')) {
    console.log('Simple reminder email would be sent to:', userEmail);
    console.log('Title:', reminderTitle);
    return true;
  }

  try {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
        <h2 style="color: #006600;">Morouna Loans - Reminder</h2>
        
        <p>Dear Valued Client,</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">${reminderTitle}</h3>
          <p style="margin-bottom: 0; white-space: pre-wrap;">${reminderMessage}</p>
        </div>
        
        ${loanReference ? `<p><strong>Loan Reference:</strong> ${loanReference}</p>` : ''}
        
        <p>Please take appropriate action as needed. Contact your relationship manager if you have any questions.</p>
        
        <p>Best regards,<br>
        Morouna Loans Team</p>
        
        <hr>
        <p style="font-size: 12px; color: #666;">This is an automated reminder from your Morouna Loans Platform.</p>
      </div>
    `;

    await mailService.send({
      to: userEmail,
      from: FROM_EMAIL_REMINDERS,
      subject: reminderTitle,
      html: emailHtml,
    });

    console.log('Simple reminder email sent successfully to:', userEmail);
    return true;
  } catch (error) {
    console.error('SendGrid simple reminder email error:', error);
    return false;
  }
}
