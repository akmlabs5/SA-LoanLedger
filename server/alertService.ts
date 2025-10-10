import { db } from './db';
import { systemAlerts, type InsertSystemAlert } from '@shared/schema';
import { eq, desc, and, gte } from 'drizzle-orm';
import { log } from './vite';

export class AlertService {
  
  /**
   * Create a new system alert
   */
  static async createAlert(alert: InsertSystemAlert) {
    try {
      const [newAlert] = await db.insert(systemAlerts).values(alert).returning();
      
      // Log to console for immediate visibility
      const icon = this.getSeverityIcon(alert.severity);
      log(`${icon} ALERT [${alert.type}]: ${alert.title}`);
      
      return newAlert;
    } catch (error) {
      console.error('Failed to create alert:', error);
      throw error;
    }
  }
  
  /**
   * Get all unread alerts
   */
  static async getUnreadAlerts() {
    return await db
      .select()
      .from(systemAlerts)
      .where(eq(systemAlerts.status, 'unread'))
      .orderBy(desc(systemAlerts.createdAt))
      .limit(100);
  }
  
  /**
   * Get recent alerts (last 24 hours)
   */
  static async getRecentAlerts(hours: number = 24) {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return await db
      .select()
      .from(systemAlerts)
      .where(gte(systemAlerts.createdAt, cutoffTime))
      .orderBy(desc(systemAlerts.createdAt))
      .limit(200);
  }
  
  /**
   * Get all alerts with pagination
   */
  static async getAllAlerts(limit: number = 50, offset: number = 0) {
    return await db
      .select()
      .from(systemAlerts)
      .orderBy(desc(systemAlerts.createdAt))
      .limit(limit)
      .offset(offset);
  }
  
  /**
   * Mark alert as read
   */
  static async markAsRead(alertId: string) {
    const [updated] = await db
      .update(systemAlerts)
      .set({ status: 'read' })
      .where(eq(systemAlerts.id, alertId))
      .returning();
    
    return updated;
  }
  
  /**
   * Mark alert as resolved
   */
  static async resolveAlert(alertId: string, resolvedBy?: string) {
    const [updated] = await db
      .update(systemAlerts)
      .set({ 
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedBy 
      })
      .where(eq(systemAlerts.id, alertId))
      .returning();
    
    return updated;
  }
  
  /**
   * Get alert count by status
   */
  static async getAlertCounts() {
    const all = await db.select().from(systemAlerts);
    
    type Alert = typeof all[0];
    
    return {
      total: all.length,
      unread: all.filter((a: Alert) => a.status === 'unread').length,
      read: all.filter((a: Alert) => a.status === 'read').length,
      resolved: all.filter((a: Alert) => a.status === 'resolved').length,
      ignored: all.filter((a: Alert) => a.status === 'ignored').length,
      byType: {
        security: all.filter((a: Alert) => a.type === 'security').length,
        database: all.filter((a: Alert) => a.type === 'database').length,
        email: all.filter((a: Alert) => a.type === 'email').length,
        ssl: all.filter((a: Alert) => a.type === 'ssl').length,
        cors: all.filter((a: Alert) => a.type === 'cors').length,
        redirect: all.filter((a: Alert) => a.type === 'redirect').length,
        performance: all.filter((a: Alert) => a.type === 'performance').length,
        system: all.filter((a: Alert) => a.type === 'system').length,
      },
      bySeverity: {
        info: all.filter((a: Alert) => a.severity === 'info').length,
        warning: all.filter((a: Alert) => a.severity === 'warning').length,
        error: all.filter((a: Alert) => a.severity === 'error').length,
        critical: all.filter((a: Alert) => a.severity === 'critical').length,
      }
    };
  }
  
  /**
   * Helper: Get severity icon
   */
  private static getSeverityIcon(severity: string): string {
    switch (severity) {
      case 'critical': return '🔴';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📊';
    }
  }
  
  /**
   * Quick alert helpers for common scenarios
   */
  static async alertDatabaseError(message: string, details?: any) {
    return this.createAlert({
      severity: 'error',
      type: 'database',
      title: 'Database Error',
      message,
      details,
      source: 'server',
      status: 'unread'
    });
  }
  
  static async alertSecurityIssue(title: string, message: string, details?: any) {
    return this.createAlert({
      severity: 'warning',
      type: 'security',
      title,
      message,
      details,
      source: 'server',
      status: 'unread'
    });
  }
  
  static async alertEmailFailure(message: string, details?: any) {
    return this.createAlert({
      severity: 'error',
      type: 'email',
      title: 'Email Delivery Failure',
      message,
      details,
      source: 'emailService',
      status: 'unread'
    });
  }
  
  static async alertSSLIssue(message: string, details?: any) {
    return this.createAlert({
      severity: 'critical',
      type: 'ssl',
      title: 'SSL/Certificate Issue',
      message,
      details,
      source: 'server',
      status: 'unread'
    });
  }
}
