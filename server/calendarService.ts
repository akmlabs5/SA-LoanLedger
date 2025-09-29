import { LoanReminder, Loan, ReminderTemplate, User, Bank, Facility } from '@shared/schema';
import { TemplateService } from './templateService';

interface CalendarEvent {
  uid: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  organizer?: string;
  attendee?: string;
}

export class CalendarService {
  /**
   * Generate ICS (iCalendar) file content for a loan reminder
   */
  static generateICSFile(reminder: LoanReminder, loan: Loan, userEmail: string): string {
    const event: CalendarEvent = {
      uid: `loan-reminder-${reminder.id}@saudiloanmanager.com`,
      title: `Loan Payment Reminder - ${loan.referenceNumber}`,
      description: this.generateEventDescription(reminder, loan),
      startDate: new Date(reminder.reminderDate),
      endDate: new Date(new Date(reminder.reminderDate).getTime() + 60 * 60 * 1000), // 1 hour duration
      location: 'Saudi Arabia',
      organizer: 'noreply@saudiloanmanager.com',
      attendee: userEmail,
    };

    return this.buildICSContent(event);
  }

  /**
   * Generate ICS file using a template with loan context data
   */
  static generateICSFileWithTemplate(
    reminder: LoanReminder, 
    loan: Loan, 
    userEmail: string,
    template?: ReminderTemplate,
    user?: User,
    bank?: Bank,
    facility?: Facility
  ): string {
    let title: string;
    let description: string;

    if (template) {
      // Use template with variable substitution
      const context = { loan, reminder, user, bank, facility };
      const rendered = TemplateService.renderCalendarTemplate(template, context);
      title = rendered.title;
      description = rendered.description;
    } else {
      // Fallback to default generation
      title = `Loan Payment Reminder - ${loan.referenceNumber}`;
      description = this.generateEventDescription(reminder, loan);
    }

    const event: CalendarEvent = {
      uid: `loan-reminder-${reminder.id}@saudiloanmanager.com`,
      title,
      description,
      startDate: new Date(reminder.reminderDate),
      endDate: new Date(new Date(reminder.reminderDate).getTime() + 60 * 60 * 1000),
      location: 'Saudi Arabia',
      organizer: 'noreply@saudiloanmanager.com',
      attendee: userEmail,
    };

    return this.buildICSContent(event);
  }

  /**
   * Generate ICS file for multiple reminders (bulk calendar export)
   */
  static generateBulkICSFile(reminders: Array<LoanReminder & { loan: Loan }>, userEmail: string): string {
    const events: CalendarEvent[] = reminders.map(reminder => ({
      uid: `loan-reminder-${reminder.id}@saudiloanmanager.com`,
      title: `Loan Payment Reminder - ${reminder.loan.referenceNumber}`,
      description: this.generateEventDescription(reminder, reminder.loan),
      startDate: new Date(reminder.reminderDate),
      endDate: new Date(new Date(reminder.reminderDate).getTime() + 60 * 60 * 1000),
      location: 'Saudi Arabia',
      organizer: 'noreply@saudiloanmanager.com',
      attendee: userEmail,
    }));

    return this.buildBulkICSContent(events);
  }

  /**
   * Generate bulk ICS file with template support
   */
  static generateBulkICSFileWithTemplate(
    reminders: Array<LoanReminder & { 
      loan: Loan;
      user?: User;
      bank?: Bank;
      facility?: Facility;
    }>, 
    userEmail: string,
    template?: ReminderTemplate
  ): string {
    const events: CalendarEvent[] = reminders.map(reminder => {
      let title: string;
      let description: string;

      if (template) {
        const context = { 
          loan: reminder.loan, 
          reminder, 
          user: reminder.user, 
          bank: reminder.bank, 
          facility: reminder.facility 
        };
        const rendered = TemplateService.renderCalendarTemplate(template, context);
        title = rendered.title;
        description = rendered.description;
      } else {
        title = `Loan Payment Reminder - ${reminder.loan.referenceNumber}`;
        description = this.generateEventDescription(reminder, reminder.loan);
      }

      return {
        uid: `loan-reminder-${reminder.id}@saudiloanmanager.com`,
        title,
        description,
        startDate: new Date(reminder.reminderDate),
        endDate: new Date(new Date(reminder.reminderDate).getTime() + 60 * 60 * 1000),
        location: 'Saudi Arabia',
        organizer: 'noreply@saudiloanmanager.com',
        attendee: userEmail,
      };
    });

    return this.buildBulkICSContent(events);
  }

  private static generateEventDescription(reminder: LoanReminder, loan: Loan): string {
    const amount = parseFloat(loan.amount);
    const formattedAmount = `${(amount / 1000000).toFixed(1)}M SAR`;
    
    return [
      `Loan Payment Reminder`,
      ``,
      `Reference: ${loan.referenceNumber}`,
      `Amount: ${formattedAmount}`,
      `Due Date: ${new Date(loan.dueDate).toLocaleDateString('en-SA')}`,
      ``,
      `Custom Message: ${reminder.message || 'No additional message'}`,
      ``,
      `Please ensure sufficient funds are available for this payment.`,
      ``,
      `Generated by Saudi Loan Management Platform`
    ].join('\n');
  }

  private static buildICSContent(event: CalendarEvent): string {
    const now = new Date();
    const timestamp = this.formatICSDate(now);
    
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Saudi Loan Manager//Loan Reminder//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${event.uid}`,
      `DTSTAMP:${timestamp}`,
      `DTSTART:${this.formatICSDate(event.startDate)}`,
      `DTEND:${this.formatICSDate(event.endDate)}`,
      `SUMMARY:${this.escapeICSText(event.title)}`,
      `DESCRIPTION:${this.escapeICSText(event.description)}`,
      `LOCATION:${this.escapeICSText(event.location || '')}`,
      `ORGANIZER:MAILTO:${event.organizer}`,
      `ATTENDEE:MAILTO:${event.attendee}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'SEQUENCE:0',
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'DESCRIPTION:Reminder',
      'ACTION:DISPLAY',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
  }

  private static buildBulkICSContent(events: CalendarEvent[]): string {
    const now = new Date();
    const timestamp = this.formatICSDate(now);
    
    const header = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Saudi Loan Manager//Loan Reminders//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    const eventBlocks = events.map(event => [
      'BEGIN:VEVENT',
      `UID:${event.uid}`,
      `DTSTAMP:${timestamp}`,
      `DTSTART:${this.formatICSDate(event.startDate)}`,
      `DTEND:${this.formatICSDate(event.endDate)}`,
      `SUMMARY:${this.escapeICSText(event.title)}`,
      `DESCRIPTION:${this.escapeICSText(event.description)}`,
      `LOCATION:${this.escapeICSText(event.location || '')}`,
      `ORGANIZER:MAILTO:${event.organizer}`,
      `ATTENDEE:MAILTO:${event.attendee}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'SEQUENCE:0',
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'DESCRIPTION:Reminder',
      'ACTION:DISPLAY',
      'END:VALARM',
      'END:VEVENT'
    ].join('\r\n'));

    const footer = ['END:VCALENDAR'];

    return [...header, ...eventBlocks, ...footer].join('\r\n');
  }

  /**
   * Format date for ICS format (YYYYMMDDTHHMMSSZ in UTC)
   */
  private static formatICSDate(date: Date): string {
    // Format as YYYYMMDDTHHMMSSZ per RFC 5545
    const s = date.toISOString();
    return s.slice(0, 19).replace(/[-:]/g, '') + 'Z';
  }

  /**
   * Escape special characters for ICS text fields
   */
  private static escapeICSText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r');
  }

  /**
   * Generate a downloadable filename for the ICS file
   */
  static generateFileName(reminder: LoanReminder, loan: Loan): string {
    const dateStr = new Date(reminder.reminderDate).toISOString().split('T')[0];
    const safeRef = loan.referenceNumber.replace(/[^a-zA-Z0-9]/g, '-');
    return `loan-reminder-${safeRef}-${dateStr}.ics`;
  }

  /**
   * Generate filename for bulk calendar export
   */
  static generateBulkFileName(): string {
    const dateStr = new Date().toISOString().split('T')[0];
    return `loan-reminders-${dateStr}.ics`;
  }
}