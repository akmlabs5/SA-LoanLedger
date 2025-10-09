import type { Express } from "express";
import { FROM_EMAIL_REMINDERS } from "../emailService";
import { mailService } from "../emailService";
import { EmailTemplateService, EmailTemplateType } from "../emailTemplates/templates";

export function registerTestEmailRoutes(app: Express) {
  
  // Test endpoint to send sample reminder emails
  app.post('/api/test/send-reminder-emails', async (req, res) => {
    const testEmail = req.body.email || 'abdullah@akm-labs.com';
    
    try {
      // Test 1: Loan Payment Reminder
      const loanReminderTemplate = EmailTemplateService.getTemplate(
        EmailTemplateType.LOAN_PAYMENT_REMINDER,
        {
          user_name: 'Abdullah',
          loan_name: 'Al Rajhi Bank - Working Capital Facility',
          bank_name: 'Al Rajhi Bank',
          payment_amount: 'SAR 250,000.00',
          due_date: 'October 25, 2025',
          days_remaining: '16',
          dashboard_url: 'https://akm-labs.com/dashboard',
          payment_url: 'https://akm-labs.com/payments'
        }
      );

      await mailService.send({
        to: testEmail,
        from: FROM_EMAIL_REMINDERS,
        subject: loanReminderTemplate.subject,
        text: loanReminderTemplate.text,
        html: loanReminderTemplate.html
      });

      // Test 2: General Reminder
      const generalReminderTemplate = EmailTemplateService.getTemplate(
        EmailTemplateType.GENERAL_REMINDER,
        {
          reminder_title: 'Facility Review Due',
          reminder_heading: 'Annual Facility Review Required',
          user_name: 'Abdullah',
          reminder_message: 'Your annual facility review is coming up. Please prepare the required documentation and financial statements for submission.',
          details_title: 'Review Details',
          detail_label_1: 'Facility Name',
          detail_value_1: 'SNB - Term Loan Facility',
          detail_label_2: 'Review Date',
          detail_value_2: 'November 15, 2025',
          detail_label_3: 'Current Limit',
          detail_value_3: 'SAR 5,000,000',
          detail_label_4: 'Status',
          detail_value_4: 'Active',
          highlight_label: 'Days Until Review',
          highlight_value: '37',
          calendar_title: 'Add to Calendar',
          calendar_message: 'A calendar invite for the review meeting has been attached to this email.',
          action_url: 'https://akm-labs.com/facilities',
          action_button_text: 'View Facility Details',
          additional_info_title: 'What to Prepare',
          additional_info_text: 'Please have your latest financial statements, cash flow projections, and compliance certificates ready for the review meeting.',
          alert_title: 'Important Reminder',
          alert_message: 'Timely submission of review documents helps ensure uninterrupted facility access and favorable renewal terms.'
        }
      );

      await mailService.send({
        to: testEmail,
        from: FROM_EMAIL_REMINDERS,
        subject: generalReminderTemplate.subject,
        text: generalReminderTemplate.text,
        html: generalReminderTemplate.html
      });

      res.json({ 
        success: true, 
        message: `Test emails sent successfully to ${testEmail}`,
        templates: [
          'Loan Payment Reminder',
          'General Reminder'
        ]
      });

    } catch (error) {
      console.error('Error sending test emails:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to send test emails',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}
