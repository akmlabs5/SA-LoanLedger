import type { IStorage } from "./storage";
import { sendTemplateReminderEmail } from "./emailService";

export class ReminderScheduler {
  private storage: IStorage;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  /**
   * Start the reminder scheduler
   * Checks for due reminders every 15 minutes
   */
  start(): void {
    if (this.isRunning) {
      console.log('⏰ Reminder scheduler is already running');
      return;
    }

    console.log('⏰ Starting reminder scheduler - checking every 15 minutes');
    this.isRunning = true;

    // Run immediately on start
    this.checkAndSendReminders();

    // Then run every 15 minutes
    this.intervalId = setInterval(() => {
      this.checkAndSendReminders();
    }, 15 * 60 * 1000); // 15 minutes
  }

  /**
   * Stop the reminder scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      console.log('⏰ Reminder scheduler stopped');
    }
  }

  /**
   * Check for due reminders and send emails
   */
  private async checkAndSendReminders(): Promise<void> {
    try {
      const now = new Date();
      console.log(`🔔 Checking for due reminders at ${now.toISOString()}`);

      // Query database directly for due reminders
      const { loanReminders } = await import('@shared/schema');
      const { db } = await import('./db');
      const { and, eq, lte } = await import('drizzle-orm');

      const dueReminders = await db
        .select()
        .from(loanReminders)
        .where(
          and(
            eq(loanReminders.status, 'pending'),
            eq(loanReminders.isActive, true),
            lte(loanReminders.reminderDate, now)
          )
        );

      if (dueReminders.length === 0) {
        console.log('✅ No due reminders found');
        return;
      }

      console.log(`📧 Found ${dueReminders.length} due reminder(s) to send`);

      // Process each reminder
      for (const reminder of dueReminders) {
        try {
          await this.processReminder(reminder);
        } catch (error) {
          console.error(`❌ Error processing reminder ${reminder.id}:`, error);
          // Continue processing other reminders even if one fails
        }
      }

      console.log(`✅ Finished processing due reminders`);
    } catch (error) {
      console.error('❌ Error in reminder scheduler:', error);
    }
  }

  /**
   * Process a single reminder - send email and update status
   */
  private async processReminder(reminder: any): Promise<void> {
    try {
      // Only send email if enabled
      if (!reminder.emailEnabled) {
        console.log(`⏭️  Skipping email for reminder ${reminder.id} (email disabled)`);
        await this.markReminderAsSent(reminder.id, reminder.organizationId);
        return;
      }

      // Get user, loan, facility, bank, and template data
      const user = await this.storage.getUser(reminder.userId);
      if (!user) {
        console.error(`❌ User not found for reminder ${reminder.id}`);
        return;
      }

      const loan = await this.storage.getLoanById(reminder.loanId);
      if (!loan) {
        console.error(`❌ Loan not found for reminder ${reminder.id}`);
        return;
      }

      const facilityWithBank = await this.storage.getFacilityWithBank(loan.facilityId);
      const facility = facilityWithBank;
      const bank = facilityWithBank?.bank || undefined;

      // Get template if specified
      let template = undefined;
      if (reminder.templateId) {
        try {
          template = await this.storage.getReminderTemplate(reminder.templateId);
        } catch (error) {
          console.log(`Template ${reminder.templateId} not found, using default`);
        }
      }

      // Send the email
      const emailSent = await sendTemplateReminderEmail(
        user,
        loan,
        reminder,
        template,
        bank,
        facility
      );

      if (emailSent) {
        console.log(`✅ Email sent successfully for reminder ${reminder.id}`);
        await this.markReminderAsSent(reminder.id, reminder.organizationId);
      } else {
        console.error(`❌ Failed to send email for reminder ${reminder.id}`);
        // Don't mark as sent if email failed - will retry next cycle
      }
    } catch (error) {
      console.error(`❌ Error processing reminder ${reminder.id}:`, error);
      throw error;
    }
  }

  /**
   * Mark a reminder as sent
   */
  private async markReminderAsSent(reminderId: string, organizationId: string): Promise<void> {
    try {
      await this.storage.updateLoanReminder(reminderId, organizationId, {
        status: 'sent',
        sentAt: new Date(),
      });
      console.log(`✅ Reminder ${reminderId} marked as sent`);
    } catch (error) {
      console.error(`❌ Error marking reminder ${reminderId} as sent:`, error);
      throw error;
    }
  }
}
