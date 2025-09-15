import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable not set - email notifications disabled");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== "default_key") {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
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
  if (!process.env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY === "default_key") {
    console.log('Email notification would be sent to:', userEmail);
    console.log('Due loans:', dueLoans.length);
    return true; // Simulate success when API key not available
  }

  try {
    const totalAmount = dueLoans.reduce((sum, loan) => sum + parseFloat(loan.amount), 0);
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #006600;">Saudi Loan Manager - Payment Due Alert</h2>
        
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
        Saudi Loan Management Team</p>
        
        <hr>
        <p style="font-size: 12px; color: #666;">This is an automated notification from your Saudi Loan Management Platform.</p>
      </div>
    `;

    await mailService.send({
      to: userEmail,
      from: 'noreply@saudiloanmanager.com', // This should be a verified sender in SendGrid
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
  if (!process.env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY === "default_key") {
    console.log('AI Alert notification would be sent to:', userEmail);
    console.log('Alert:', alertType, alertMessage);
    return true;
  }

  try {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #006600;">Saudi Loan Manager - AI Portfolio Alert</h2>
        
        <p>Dear Valued Client,</p>
        
        <p>Our AI monitoring system has detected an important update regarding your loan portfolio:</p>
        
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #856404;">${alertType}</h3>
          <p style="margin-bottom: 0;">${alertMessage}</p>
        </div>
        
        <p>Please log in to your dashboard to review the detailed recommendations and take appropriate action.</p>
        
        <p>Best regards,<br>
        Saudi Loan Management AI System</p>
        
        <hr>
        <p style="font-size: 12px; color: #666;">This is an automated AI-generated notification from your Saudi Loan Management Platform.</p>
      </div>
    `;

    await mailService.send({
      to: userEmail,
      from: 'ai-alerts@saudiloanmanager.com', // This should be a verified sender in SendGrid
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
