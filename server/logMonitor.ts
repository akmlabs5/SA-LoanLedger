#!/usr/bin/env node

/**
 * Production Log Monitor
 * Watches logs for errors and alerts in real-time
 * Run: npm run monitor-logs
 */

import { config } from './config';

const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[36m',
  MAGENTA: '\x1b[35m',
  RESET: '\x1b[0m'
};

interface LogPattern {
  pattern: RegExp;
  severity: 'error' | 'warning' | 'info';
  description: string;
  action?: string;
}

const LOG_PATTERNS: LogPattern[] = [
  // Security Issues
  {
    pattern: /Missing x-forwarded-proto/i,
    severity: 'warning',
    description: 'HTTPS redirect may not be working',
    action: 'Check Replit proxy configuration'
  },
  {
    pattern: /HTTPS redirect/i,
    severity: 'info',
    description: 'HTTP traffic being redirected to HTTPS'
  },
  
  // Redirect Loops
  {
    pattern: /redirect.*redirect|redirect.*301.*301/i,
    severity: 'error',
    description: 'Potential redirect loop detected',
    action: 'Check HTTPS redirect logic in server/index.ts'
  },
  
  // CORS Issues
  {
    pattern: /CORS|cross-origin|Access-Control/i,
    severity: 'warning',
    description: 'CORS-related activity detected'
  },
  
  // Database Errors
  {
    pattern: /ECONNREFUSED.*postgres|database connection failed/i,
    severity: 'error',
    description: 'Database connection failure',
    action: 'Check DATABASE_URL and Neon status'
  },
  
  // API Errors
  {
    pattern: /\b5\d{2}\b.*error|internal server error/i,
    severity: 'error',
    description: 'Server error (5xx)',
    action: 'Check application logs for stack trace'
  },
  {
    pattern: /\b4\d{2}\b.*unauthorized|authentication failed/i,
    severity: 'warning',
    description: 'Authentication/authorization issue',
    action: 'Check auth configuration and user credentials'
  },
  
  // Email Issues
  {
    pattern: /sendgrid.*error|email.*failed/i,
    severity: 'error',
    description: 'Email delivery failure',
    action: 'Check SendGrid API key and configuration'
  },
  
  // Rate Limiting
  {
    pattern: /too many requests|rate limit/i,
    severity: 'warning',
    description: 'Rate limiting triggered',
    action: 'Consider increasing limits or blocking IP'
  },
  
  // SSL/TLS Issues
  {
    pattern: /ssl.*error|certificate.*invalid|ERR_CERT/i,
    severity: 'error',
    description: 'SSL/TLS certificate issue',
    action: 'Wait for SSL provisioning or check domain configuration'
  }
];

class LogMonitor {
  private errorCount = 0;
  private warningCount = 0;
  private startTime = Date.now();
  
  analyzeLog(logLine: string): void {
    for (const { pattern, severity, description, action } of LOG_PATTERNS) {
      if (pattern.test(logLine)) {
        this.logAlert(severity, description, logLine, action);
        
        if (severity === 'error') this.errorCount++;
        if (severity === 'warning') this.warningCount++;
        
        return; // Only match first pattern
      }
    }
  }
  
  private logAlert(severity: 'error' | 'warning' | 'info', description: string, logLine: string, action?: string): void {
    const timestamp = new Date().toLocaleTimeString();
    let color = COLORS.RESET;
    let icon = 'ℹ️';
    
    switch (severity) {
      case 'error':
        color = COLORS.RED;
        icon = '🔴';
        break;
      case 'warning':
        color = COLORS.YELLOW;
        icon = '⚠️';
        break;
      case 'info':
        color = COLORS.BLUE;
        icon = 'ℹ️';
        break;
    }
    
    console.log(`\n${color}${icon} [${timestamp}] ${severity.toUpperCase()}: ${description}${COLORS.RESET}`);
    console.log(`${COLORS.MAGENTA}Log: ${logLine.trim()}${COLORS.RESET}`);
    
    if (action) {
      console.log(`${COLORS.GREEN}→ Action: ${action}${COLORS.RESET}`);
    }
  }
  
  printSummary(): void {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    console.log(`\n${COLORS.BLUE}=== Monitoring Summary ===${COLORS.RESET}`);
    console.log(`Uptime: ${uptime}s`);
    console.log(`${COLORS.RED}Errors: ${this.errorCount}${COLORS.RESET}`);
    console.log(`${COLORS.YELLOW}Warnings: ${this.warningCount}${COLORS.RESET}`);
  }
}

async function monitorLogs() {
  const isProduction = config.get('NODE_ENV') === 'production';
  const monitor = new LogMonitor();
  
  console.log(`${COLORS.YELLOW}📊 Production Log Monitor Started${COLORS.RESET}`);
  console.log(`Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  console.log(`Monitoring for errors, warnings, and security issues...\n`);
  
  // Monitor stdin (if logs are piped)
  process.stdin.setEncoding('utf8');
  
  process.stdin.on('data', (data: string) => {
    const lines = data.split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        monitor.analyzeLog(line);
      }
    });
  });
  
  process.stdin.on('end', () => {
    monitor.printSummary();
    process.exit(0);
  });
  
  // Print summary every 5 minutes
  setInterval(() => {
    monitor.printSummary();
  }, 300000);
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log(`\n${COLORS.YELLOW}Shutting down log monitor...${COLORS.RESET}`);
    monitor.printSummary();
    process.exit(0);
  });
}

// Run monitor
monitorLogs().catch(error => {
  console.error(`${COLORS.RED}Fatal error:${COLORS.RESET}`, error);
  process.exit(1);
});
