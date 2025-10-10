# Production Monitoring & Testing Guide

This guide covers the production monitoring and testing tools available for the Morouna Loans platform.

## 🧪 Automated Smoke Tests

Smoke tests verify that all security configurations are properly set up in production.

### What It Tests

- **Security Headers**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy
- **HSTS**: Strict-Transport-Security (production only)
- **CORS**: Validates allowed origins (akm-labs.com, www.akm-labs.com)
- **API Health**: Checks that API endpoints are responding
- **HTTPS Redirect**: Verifies HTTP to HTTPS redirect (production only)

### How to Run

```bash
# Run smoke tests
./smoke-test.sh
```

The script will:
- ✅ Show green checkmarks for passing tests
- ❌ Show red X marks for failing tests
- Exit with error code if any tests fail

### When to Run

- After deploying to production
- After changing security configurations
- Before going live with the custom domain
- As part of CI/CD pipeline (optional)

---

## 📊 Production Log Monitor

Real-time log monitoring that alerts you to errors, warnings, and security issues.

### What It Monitors

- **Security Issues**: Missing x-forwarded-proto, HTTPS redirect problems
- **Redirect Loops**: Detects potential infinite redirect loops
- **CORS Issues**: Cross-origin request problems
- **Database Errors**: Connection failures, query errors
- **API Errors**: 4xx and 5xx status codes
- **Email Issues**: SendGrid delivery failures
- **SSL/TLS Issues**: Certificate problems

### How to Run

```bash
# Option 1: Pipe server logs to monitor
npm run dev | ./monitor-logs.sh

# Option 2: Monitor production logs
tail -f /path/to/production.log | ./monitor-logs.sh
```

### Alert Format

```
🔴 [10:30:45] ERROR: Database connection failure
Log: ECONNREFUSED postgres://...
→ Action: Check DATABASE_URL and Neon status
```

### Severity Levels

- 🔴 **ERROR**: Critical issues requiring immediate attention
- ⚠️ **WARNING**: Issues that should be investigated
- ℹ️ **INFO**: Informational messages

### Summary Stats

The monitor prints a summary every 5 minutes showing:
- Total uptime
- Number of errors detected
- Number of warnings detected

---

## 🔒 HTTPS Redirect Monitoring

Built-in monitoring for the x-forwarded-proto header to ensure HTTPS redirects work correctly.

### What It Does

- Logs when x-forwarded-proto header is missing
- Logs all HTTPS redirects (HTTP → HTTPS)
- Helps diagnose redirect issues

### Log Examples

```
⚠️  Missing x-forwarded-proto header from 1.2.3.4 to /api/health
🔒 HTTPS redirect: GET / → https://akm-labs.com/
```

### How to Check

Look for these log entries in your production logs:
- Missing header warnings indicate proxy misconfiguration
- Redirect logs confirm HTTPS enforcement is working

---

## 📋 Monitoring Checklist

### After Deployment

- [ ] Run smoke tests: `./smoke-test.sh`
- [ ] Verify all tests pass (green checkmarks)
- [ ] Check for HTTPS redirect logs
- [ ] Monitor logs for first 30 minutes

### Daily Monitoring

- [ ] Run smoke tests once daily
- [ ] Check error count in log monitor summary
- [ ] Investigate any warnings or errors

### When Issues Occur

1. **Check smoke tests** - Run `./smoke-test.sh` to verify configuration
2. **Monitor logs** - Pipe logs to `./monitor-logs.sh` to see real-time alerts
3. **Review HTTPS logs** - Look for redirect or x-forwarded-proto issues
4. **Check specific patterns** - Monitor will show exactly what failed and suggest actions

---

## 🛠️ Troubleshooting

### Smoke Tests Failing

**Problem**: HSTS header not present  
**Solution**: Ensure NODE_ENV=production is set

**Problem**: CORS header missing  
**Solution**: Check allowed origins in server/index.ts

**Problem**: API health check fails  
**Solution**: Verify server is running and database is connected

### Log Monitor Issues

**Problem**: No alerts appearing  
**Solution**: Ensure logs are being piped correctly: `npm run dev | ./monitor-logs.sh`

**Problem**: Too many false positives  
**Solution**: Adjust patterns in server/logMonitor.ts

### HTTPS Redirect Issues

**Problem**: Missing x-forwarded-proto warnings  
**Solution**: Wait for SSL provisioning to complete, or contact Replit support

**Problem**: Redirect loops  
**Solution**: Check HTTPS redirect logic in server/index.ts

---

## 🎯 Quick Reference

```bash
# Run smoke tests
./smoke-test.sh

# Monitor development logs
npm run dev | ./monitor-logs.sh

# Monitor specific log file
tail -f /tmp/logs/Start_application_*.log | ./monitor-logs.sh

# Make scripts executable (if needed)
chmod +x smoke-test.sh monitor-logs.sh
```

---

## 📝 Notes

- **Smoke tests** are best run in staging/production environments
- **Log monitor** works in both development and production
- **HTTPS monitoring** is built into the server (always active in production)
- All tools are zero-dependency (use only Node.js built-ins)
