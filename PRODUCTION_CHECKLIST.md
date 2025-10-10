# 🚀 Production Deployment Checklist

## Pre-Launch Verification

### ✅ Security Configuration
- [x] HTTPS redirect enabled (production only)
- [x] Security headers configured (HSTS, X-Frame-Options, X-Content-Type-Options)
- [x] CORS restricted to akm-labs.com domains
- [x] Test endpoints disabled in production
- [x] Session security with PostgreSQL store
- [x] Admin portal authentication secured

### ✅ Email System
- [x] SendGrid domain authenticated (akm-labs.com)
- [x] SPF and DKIM records configured
- [x] Text-based email branding (spam-safe)
- [x] 7 professional HTML templates ready
- [x] Dual sender addresses (noreply@, reminders@)
- [x] All templates tested and inbox-verified

### ✅ Database & Storage
- [x] Neon PostgreSQL configured
- [x] Drizzle ORM schema validated
- [x] Multi-tenant data isolation enforced
- [x] Replit Object Storage configured
- [x] Organization-scoped access control

### ✅ Authentication & Authorization
- [x] Replit Auth integration (OpenID Connect)
- [x] Supabase Auth with 2FA support
- [x] Email/password login with OTP verification
- [x] Admin portal separate authentication
- [x] Role-based access (Owner/Member)

### ✅ Monitoring & Testing
- [x] Automated smoke tests (`./smoke-test.sh`)
- [x] Real-time log monitoring (`./monitor-logs.sh`)
- [x] x-forwarded-proto monitoring
- [x] Error detection and alerts configured
- [x] Production logging enabled

---

## Launch Day Steps

### 1. Domain & SSL Verification
```bash
# Check SSL certificate status
curl -I https://akm-labs.com

# Expected: 200 OK with security headers
# If "not private" warning: Wait for SSL provisioning (15-60 min)
```

### 2. Run Smoke Tests
```bash
# Run comprehensive security tests
./smoke-test.sh

# All tests must show: ✅ (green checkmark)
# Fix any ❌ (red X) before proceeding
```

### 3. Test Core Functionality
- [ ] User signup with email verification
- [ ] Login with 2FA (if enabled)
- [ ] Create organization
- [ ] Invite team member
- [ ] Create bank and facility
- [ ] Create loan with SIBOR calculation
- [ ] Add collateral and guarantee
- [ ] Upload documents
- [ ] Test AI chat (both green and blue buttons)
- [ ] Generate PDF/Excel reports
- [ ] Test email notifications
- [ ] Verify mobile UI on actual devices

### 4. Start Production Monitoring
```bash
# Monitor logs in real-time
tail -f /var/log/production.log | ./monitor-logs.sh

# Watch for:
# 🔴 Errors (require immediate attention)
# ⚠️ Warnings (investigate soon)
# ℹ️ Info (normal operations)
```

### 5. Performance Check
- [ ] Dashboard loads < 2 seconds
- [ ] API responses < 500ms
- [ ] Database queries optimized
- [ ] No N+1 query issues
- [ ] Frontend bundle size reasonable

---

## First Hour Monitoring

### Critical Metrics to Watch
1. **HTTPS Redirects**: Should see `🔒 HTTPS redirect` logs
2. **x-forwarded-proto**: Should NOT see `⚠️ Missing x-forwarded-proto` warnings
3. **Database**: Connection stable, no timeout errors
4. **API Errors**: No 5xx errors in logs
5. **Email Delivery**: SendGrid requests successful

### Run Smoke Tests Hourly
```bash
# Run every hour for first 6 hours
*/60 * * * * /path/to/smoke-test.sh
```

### Alert Triggers
- Any 🔴 **ERROR** in log monitor → Investigate immediately
- More than 10 ⚠️ **WARNING** per minute → Check patterns
- Smoke test failures → Roll back if critical

---

## Daily Operations

### Morning Checklist
- [ ] Run smoke tests: `./smoke-test.sh`
- [ ] Check error count from previous day
- [ ] Review any email delivery failures
- [ ] Verify database backups completed
- [ ] Check SSL certificate expiry (90 days)

### Weekly Checklist
- [ ] Review log monitor summary
- [ ] Update smoke test patterns (if needed)
- [ ] Check for dependency updates
- [ ] Review SendGrid usage/quotas
- [ ] Verify domain authentication status

### Monthly Checklist
- [ ] Full security audit
- [ ] Review all monitoring alerts
- [ ] Update production documentation
- [ ] Test disaster recovery plan
- [ ] Review access logs for anomalies

---

## Rollback Plan

If critical issues occur:

### 1. Immediate Actions
```bash
# Stop current deployment
# (Use Replit rollback feature)

# Check logs for root cause
tail -n 1000 /var/log/production.log | ./monitor-logs.sh
```

### 2. Rollback Triggers
- Database connection failures > 5 minutes
- API error rate > 10% of requests
- HTTPS redirect loops detected
- Complete email service failure
- Security breach detected

### 3. Communication Plan
- Notify users via status page
- Email affected organizations
- Post incident report within 24 hours

---

## Success Criteria

### Platform is Production-Ready When:
- [x] All smoke tests pass consistently
- [x] SSL certificate active and valid
- [x] Zero critical errors in first hour
- [x] Email delivery working (inbox, not spam)
- [x] Multi-tenant isolation verified
- [x] Mobile UI fully functional
- [x] Admin portal accessible
- [x] AI features operational
- [x] Reports generating correctly
- [x] Monitoring alerts working

---

## Emergency Contacts

### Service Providers
- **Replit Support**: Support tickets for SSL/domain issues
- **SendGrid Support**: For email delivery problems
- **Neon Support**: For database emergencies

### Internal Team
- **Admin Portal**: /admin (for system oversight)
- **Monitoring Dashboard**: Real-time health status
- **Database Backups**: Automated via Neon

---

## Final Pre-Launch Command

```bash
# Run this before announcing launch
./smoke-test.sh && echo "🚀 Ready for launch!" || echo "❌ Fix issues before launch"
```

---

## Post-Launch Notes

Record any issues encountered and resolutions:

**Date**: _______________

**Issues**: 
- 

**Resolutions**:
- 

**Lessons Learned**:
- 
