# 🧪 Admin Alert System - Testing Guide

## Quick Start Testing

### Prerequisites
- Admin portal running at `http://localhost:5000/admin-portal`
- Admin credentials: `username: admin` / `password: admin123`

---

## Step 1: Access Admin Portal

1. Navigate to: `http://localhost:5000/admin-portal/login`
2. Login with admin credentials
3. You should see the admin dashboard

---

## Step 2: Check Notification Badge

1. Look at the bottom left sidebar footer
2. You should see a **bell icon** 🔔
3. If there are unread alerts, a **red badge** will show the count
4. Click the bell icon to navigate to the alerts page

---

## Step 3: View Alerts Page

1. Navigate to: `/admin-portal/alerts` (or click bell icon)
2. You should see:
   - 4 stat cards: Total, Unread, Read, Resolved
   - Filter controls: Time Range, Status, Severity
   - Alert list (may be empty if no alerts exist)

---

## Step 4: Create Test Alerts

### Option A: Using the Test Endpoint (Recommended)

1. **Login to get your admin token:**
```bash
curl -X POST http://localhost:5000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Response will include a `token` field. Copy this token.

2. **Create a test alert:**
```bash
# Replace YOUR_TOKEN with the actual token from step 1
curl -X POST http://localhost:5000/api/admin/test/create-alert \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "severity": "error",
    "type": "database",
    "title": "Database Connection Slow",
    "message": "Database response time exceeded 5 seconds",
    "details": {"avgResponseTime": "5.3s", "threshold": "2s"}
  }'
```

3. **Create more test alerts with different severities:**

**Warning Alert:**
```bash
curl -X POST http://localhost:5000/api/admin/test/create-alert \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "severity": "warning",
    "type": "security",
    "title": "Multiple Failed Login Attempts",
    "message": "User attempted login 5 times with wrong password",
    "details": {"userId": "user123", "attempts": 5}
  }'
```

**Critical Alert:**
```bash
curl -X POST http://localhost:5000/api/admin/test/create-alert \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "severity": "critical",
    "type": "ssl",
    "title": "SSL Certificate Expiring Soon",
    "message": "SSL certificate will expire in 3 days",
    "details": {"domain": "akm-labs.com", "expiresIn": "3 days"}
  }'
```

**Info Alert:**
```bash
curl -X POST http://localhost:5000/api/admin/test/create-alert \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "severity": "info",
    "type": "system",
    "title": "System Update Available",
    "message": "A new system update is available for installation",
    "details": {"version": "2.1.0", "releaseDate": "2025-10-15"}
  }'
```

### Option B: Trigger Automatic Alerts

**Cause a server error (production mode only):**
- In production, 500-level errors automatically create alerts
- Test by accessing a non-existent API endpoint that causes an error

---

## Step 5: Verify Alerts Display

1. **Refresh the alerts page** (`/admin-portal/alerts`)
2. You should now see:
   - Updated stat cards with counts
   - Test alerts in the list
   - Color-coded severity badges (Critical=Red, Error=Orange, Warning=Yellow, Info=Blue)
   - Type badges (database, security, ssl, system, etc.)
   - Status badges (unread, read, resolved)

---

## Step 6: Test Alert Actions

### Mark as Read
1. Find an **unread** alert (status badge shows "unread")
2. Click the **eye icon** 👁️ button on the right
3. Alert status changes to "read"
4. Unread count in stats decreases

### Resolve Alert
1. Find any alert that's not "resolved"
2. Click the **checkmark icon** ✓✓ button (green)
3. Alert status changes to "resolved"
4. Resolved count in stats increases

---

## Step 7: Test Filters

### Time Range Filter
1. Change dropdown from "Last 24 Hours" to other options
2. Alert list updates to show only alerts within that timeframe

### Status Filter
1. Select "Unread" - shows only unread alerts
2. Select "Resolved" - shows only resolved alerts
3. Select "All Statuses" - shows everything

### Severity Filter
1. Select "Critical" - shows only critical alerts
2. Select "Error" - shows only errors
3. Try different combinations of filters

---

## Step 8: Test Notification Badge

1. Create a new test alert (see Step 4)
2. Check the **bell icon** in the sidebar
3. Badge count should increase
4. Click bell to go to alerts page
5. Mark alerts as read
6. Badge count should decrease

---

## Step 9: Test Auto-Refresh

1. Stay on the alerts page
2. Open a new terminal and create a new alert
3. Wait 30 seconds (auto-refresh interval)
4. Stats and counts should update automatically

---

## Expected Behavior

### ✅ What Should Work

1. **Notification Badge:**
   - Shows unread count
   - Updates in real-time (30-second refresh)
   - Clicking navigates to alerts page

2. **Stats Cards:**
   - Total alerts count
   - Unread, Read, Resolved counts
   - Updates after actions

3. **Alert List:**
   - Shows all alerts with details
   - Color-coded by severity
   - Expandable details section
   - Relative timestamps ("2 minutes ago")

4. **Actions:**
   - Mark as read (changes status)
   - Resolve (changes status, records who/when)
   - Both actions update counts

5. **Filters:**
   - Time range (1h, 6h, 24h, 3d, 1w)
   - Status (all, unread, read, resolved)
   - Severity (all, critical, error, warning, info)
   - Filters work independently and together

---

## API Endpoints Reference

```bash
# Get alert counts (for badge)
GET /api/admin/alerts/counts
Authorization: Bearer YOUR_TOKEN

# Get recent alerts
GET /api/admin/alerts?hours=24
Authorization: Bearer YOUR_TOKEN

# Mark alert as read
POST /api/admin/alerts/:alertId/read
Authorization: Bearer YOUR_TOKEN

# Resolve alert
POST /api/admin/alerts/:alertId/resolve
Authorization: Bearer YOUR_TOKEN

# Create test alert
POST /api/admin/test/create-alert
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
Body: {
  "severity": "error|warning|info|critical",
  "type": "security|database|email|ssl|cors|redirect|performance|system",
  "title": "Alert Title",
  "message": "Alert message",
  "details": {}
}
```

---

## Troubleshooting

### Badge not showing count
- Check browser console for errors
- Verify admin token is valid
- Refresh the page

### Alerts not appearing
- Check database connection
- Verify schema was pushed (`npm run db:push`)
- Check server logs for errors

### Actions not working
- Verify admin authentication
- Check network tab for failed requests
- Ensure alertId is correct

### Filters not working
- Check query parameters in URL
- Verify filter values are valid
- Refresh the page

---

## Production Testing

Once deployed to production (`https://akm-labs.com`):

1. **Automatic Error Logging:**
   - 500-level errors automatically create alerts
   - No manual test endpoint needed

2. **Monitoring Integration:**
   - Smoke tests create alerts on failure
   - Log monitor creates alerts for detected issues
   - Email service creates alerts on delivery failures

3. **Real Alerts:**
   - Database connection failures
   - SSL certificate issues
   - Security violations (CORS, missing headers)
   - Performance problems

---

## Success Criteria ✅

- [x] Notification badge shows correct unread count
- [x] Badge updates when new alerts are created
- [x] Clicking badge navigates to alerts page
- [x] Alerts page displays all alerts with correct data
- [x] Stats cards show accurate counts
- [x] Mark as read action works
- [x] Resolve action works
- [x] Filters work correctly
- [x] Auto-refresh works (30-second interval)
- [x] Test endpoint creates alerts successfully
- [x] Alert details are expandable and readable

---

**Your admin alert notification system is fully functional!** 🎉
