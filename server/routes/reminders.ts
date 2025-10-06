import type { Express } from "express";
import type { AppDependencies } from "../types";
import { isAuthenticated } from "../replitAuth";
import { sendTemplateReminderEmail } from "../emailService";
import { CalendarService } from "../calendarService";
import {
  insertLoanReminderSchema,
  updateLoanReminderSchema,
  insertUserReminderSettingsSchema,
} from "@shared/schema";

export function registerRemindersRoutes(app: Express, deps: AppDependencies) {
  const { storage } = deps;

  // Loan Reminder routes
  app.get('/api/loans/:loanId/reminders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { loanId } = req.params;
      
      // Verify user owns the loan
      const loan = await storage.getLoanById(loanId);
      if (!loan || loan.userId !== userId) {
        return res.status(404).json({ message: "Loan not found" });
      }
      
      const reminders = await storage.getLoanReminders(loanId);
      res.json(reminders);
    } catch (error) {
      console.error("Error fetching loan reminders:", error);
      res.status(500).json({ message: "Failed to fetch reminders" });
    }
  });

  app.post('/api/loans/:loanId/reminders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { loanId } = req.params;
      
      // Verify user owns the loan
      const loan = await storage.getLoanById(loanId);
      if (!loan || loan.userId !== userId) {
        return res.status(404).json({ message: "Loan not found" });
      }
      
      const reminderData = insertLoanReminderSchema.parse({
        ...req.body,
        loanId,
        userId,
        reminderDate: new Date(req.body.reminderDate),
      });
      
      const reminder = await storage.createLoanReminder(reminderData);
      
      // Send email notification if email is enabled for the reminder
      if (reminder.emailEnabled) {
        try {
          // Get user data for email
          const user = await storage.getUser(userId);
          if (!user) {
            console.error(`User not found for reminder email: ${userId}`);
            return;
          }
          
          // Get bank and facility data for template context
          const facility = await storage.getFacilityById(loan.facilityId);
          let bank = null;
          if (facility?.bankId) {
            bank = await storage.getBankById(facility.bankId);
          }
          
          // Get template if specified
          let template = null;
          if (reminderData.templateId) {
            try {
              const templates = await storage.getReminderTemplates();
              template = templates.find(t => t.id === reminderData.templateId) || null;
            } catch (error) {
              console.log('Template not found, using default:', error);
            }
          }
          
          // Send template-based email
          const emailSent = await sendTemplateReminderEmail(
            user, 
            loan, 
            reminder, 
            template, 
            bank, 
            facility
          );
          
          if (emailSent) {
            console.log(`Email notification sent for reminder ${reminder.id}`);
          } else {
            console.error(`Failed to send email notification for reminder ${reminder.id}`);
          }
        } catch (emailError) {
          console.error('Error sending reminder email:', emailError);
          // Don't fail the reminder creation if email sending fails
        }
      }
      
      res.status(201).json(reminder);
    } catch (error) {
      console.error("Error creating reminder:", error);
      res.status(500).json({ message: "Failed to create reminder" });
    }
  });

  app.put('/api/reminders/:reminderId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { reminderId } = req.params;
      
      // First verify the reminder exists and user owns it
      const existingReminders = await storage.getUserReminders(userId);
      const existingReminder = existingReminders.find(r => r.id === reminderId);
      
      if (!existingReminder) {
        return res.status(404).json({ message: "Reminder not found" });
      }
      
      const reminderData = updateLoanReminderSchema.parse({
        ...req.body,
        id: reminderId,
      });
      
      const reminder = await storage.updateLoanReminder(reminderId, reminderData);
      res.json(reminder);
    } catch (error) {
      console.error("Error updating reminder:", error);
      res.status(500).json({ message: "Failed to update reminder" });
    }
  });

  app.delete('/api/reminders/:reminderId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { reminderId } = req.params;
      
      // First verify the reminder exists and user owns it
      const existingReminders = await storage.getUserReminders(userId);
      const existingReminder = existingReminders.find(r => r.id === reminderId);
      
      if (!existingReminder) {
        return res.status(404).json({ message: "Reminder not found" });
      }
      
      await storage.deleteLoanReminder(reminderId);
      res.status(200).json({ message: "Reminder deleted successfully" });
    } catch (error) {
      console.error("Error deleting reminder:", error);
      res.status(500).json({ message: "Failed to delete reminder" });
    }
  });

  app.get('/api/user/reminders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reminders = await storage.getUserReminders(userId);
      res.json(reminders);
    } catch (error) {
      console.error("Error fetching user reminders:", error);
      res.status(500).json({ message: "Failed to fetch user reminders" });
    }
  });

  // User reminder settings endpoints
  app.get('/api/user/reminder-settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const settings = await storage.getUserReminderSettings(userId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching user reminder settings:", error);
      res.status(500).json({ message: "Failed to fetch reminder settings" });
    }
  });

  app.post('/api/user/reminder-settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const settingsData = insertUserReminderSettingsSchema.parse({
        ...req.body,
        userId,
      });
      
      const settings = await storage.upsertUserReminderSettings(settingsData);
      res.json(settings);
    } catch (error) {
      console.error("Error saving user reminder settings:", error);
      
      // Return 400 for validation errors
      if (error instanceof Error && error.message.includes('ZodError')) {
        return res.status(400).json({ message: "Invalid settings data", details: error.message });
      }
      
      res.status(500).json({ message: "Failed to save reminder settings" });
    }
  });

  // Calendar invite endpoints
  app.get('/api/reminders/:reminderId/calendar', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { reminderId } = req.params;
      
      // Verify the reminder exists and user owns it
      const existingReminders = await storage.getUserReminders(userId);
      const reminder = existingReminders.find(r => r.id === reminderId);
      
      if (!reminder) {
        return res.status(404).json({ message: "Reminder not found" });
      }

      // Fetch the loan data separately
      const loan = await storage.getLoanById(reminder.loanId);
      if (!loan || loan.userId !== userId) {
        return res.status(404).json({ message: "Loan not found" });
      }

      const user = await storage.getUser(userId);
      const userEmail = user?.email || 'user@example.com';
      
      const icsContent = CalendarService.generateICSFile(reminder, loan, userEmail);
      const fileName = CalendarService.generateFileName(reminder, loan);
      
      res.set({
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-cache'
      });
      
      res.send(icsContent);
    } catch (error) {
      console.error("Error generating calendar invite:", error);
      res.status(500).json({ message: "Failed to generate calendar invite" });
    }
  });

  app.get('/api/loans/:loanId/reminders/calendar', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { loanId } = req.params;
      
      // Verify loan ownership  
      const loan = await storage.getLoanById(loanId);
      if (!loan || loan.userId !== userId) {
        return res.status(404).json({ message: "Loan not found" });
      }

      // Get all reminders for this loan
      const loanReminders = await storage.getLoanReminders(loanId);
      
      if (loanReminders.length === 0) {
        return res.status(404).json({ message: "No reminders found for this loan" });
      }

      // Create reminders with loan data for bulk generation
      const remindersWithLoan = loanReminders.map(reminder => ({
        ...reminder,
        loan: loan
      }));

      const user = await storage.getUser(userId);
      const userEmail = user?.email || 'user@example.com';
      
      const icsContent = CalendarService.generateBulkICSFile(remindersWithLoan, userEmail);
      const fileName = `loan-${loan.referenceNumber}-reminders-${new Date().toISOString().split('T')[0]}.ics`;
      
      res.set({
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-cache'
      });
      
      res.send(icsContent);
    } catch (error) {
      console.error("Error generating bulk calendar invites:", error);
      res.status(500).json({ message: "Failed to generate calendar invites" });
    }
  });

  app.get('/api/user/reminders/calendar', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const remindersWithLoans = await storage.getUserReminders(userId);
      
      if (remindersWithLoans.length === 0) {
        return res.status(404).json({ message: "No reminders found" });
      }

      const user = await storage.getUser(userId);
      const userEmail = user?.email || 'user@example.com';
      
      const icsContent = CalendarService.generateBulkICSFile(remindersWithLoans, userEmail);
      const fileName = CalendarService.generateBulkFileName();
      
      res.set({
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-cache'
      });
      
      res.send(icsContent);
    } catch (error) {
      console.error("Error generating all calendar invites:", error);
      res.status(500).json({ message: "Failed to generate calendar invites" });
    }
  });
}
