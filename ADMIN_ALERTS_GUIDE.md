# 🔔 Admin Portal - Automatic Alert Notifications

## What's New?

Your admin portal now **automatically receives notifications** when security issues, errors, or problems are detected by the monitoring system!

---

## How It Works

### **Automatic Detection** 
The system monitors for:
- 🔴 **Security Issues**: Missing headers, HTTPS problems
- 💾 **Database Errors**: Connection failures, query errors
- 📧 **Email Failures**: SendGrid delivery problems
- 🔒 **SSL Issues**: Certificate problems
- 🌐 **CORS Problems**: Unauthorized access attempts
- 🔄 **Redirect Loops**: HTTPS redirect issues
- ⚡ **Performance Issues**: Slow queries, timeouts
- 🖥️ **System Errors**: Server crashes, critical failures

### **Automatic Logging**
When a problem is detected:
1. ✅ Alert is saved to database
2. ✅ Logged to console for immediate visibility
3. ✅ Available in admin portal instantly

### **Admin Portal Notifications**
View alerts in your admin portal:
- **Dashboard**: See alert counts and recent issues
- **Alert List**: Browse all alerts with filtering
- **Actions**: Mark as read or resolve alerts

---

## Accessing Alerts in Admin Portal

### **1. View All Alerts**
**URL**: `https://akm-labs.com/admin` → Click "Alerts" section

**API Endpoint**: `GET /api/admin/alerts?hours=24`
- Returns alerts from last 24 hours (customizable)
- Shows: severity, type, title, message, timestamp
- Status: unread, read, resolved, ignored

**Example Response**:
```json
[
  {
    "id": "alert-123",
    "severity": "error",
    "type": "database",
    "title": "Database Connection Failed",
    "message": "Unable to connect to PostgreSQL",
    "status": "unread",
    "createdAt": "2025-10-10T10:30:00Z",
    "details": {
      "error": "ECONNREFUSED",
      "host": "ep-green-night-afyvn3k1.c-2.us-west-2.aws.neon.tech"
    }
  }
]
```

### **2. View Alert Counts**
**API Endpoint**: `GET /api/admin/alerts/counts`

Returns:
- Total alerts
- Count by status (unread, read, resolved)
- Count by type (security, database, email, etc.)
- Count by severity (info, warning, error, critical)

**Example Response**:
```json
{
  "total": 45,
  "unread": 12,
  "read": 20,
  "resolved": 13,
  "byType": {
    "security": 5,
    "database": 8,
    "email": 2,
    "ssl": 1,
    "cors": 3,
    "redirect": 4,
    "performance": 10,
    "system": 12
  },
  "bySeverity": {
    "info": 20,
    "warning": 15,
    "error": 8,
    "critical": 2
  }
}
```

### **3. Mark Alert as Read**
**API Endpoint**: `POST /api/admin/alerts/:alertId/read`

Marks an alert as read (dismisses notification)

### **4. Resolve Alert**
**API Endpoint**: `POST /api/admin/alerts/:alertId/resolve`

Marks an alert as resolved (issue fixed)
- Records who resolved it
- Records when it was resolved

---

## Alert Types & Sources

### **Alert Severities**
1. 🔵 **Info**: Normal operations, non-critical updates
2. ⚠️ **Warning**: Issues that need attention soon
3. ❌ **Error**: Problems that need fixing
4. 🔴 **Critical**: Urgent issues requiring immediate action

### **Alert Types**
- `security`: Security-related issues
- `database`: Database connection/query problems
- `email`: Email delivery failures
- `ssl`: SSL/certificate issues
- `cors`: Cross-origin request problems
- `redirect`: HTTPS redirect issues
- `performance`: Slow queries, timeouts
- `system`: Server errors, crashes

### **Alert Sources**
- `server`: From application server
- `smokeTests`: From security smoke tests
- `logMonitor`: From real-time log monitoring
- `emailService`: From SendGrid email service

---

## Example Scenarios

### **Scenario 1: Database Connection Fails**
1. ✅ Database connection error occurs
2. ✅ Alert created automatically:
   ```
   Severity: error
   Type: database
   Title: "Database Connection Failed"
   Message: "ECONNREFUSED to PostgreSQL"
   ```
3. ✅ Shows in admin portal immediately
4. ✅ You see notification badge with count
5. ✅ You click to view details and resolve

### **Scenario 2: Email Delivery Fails**
1. ✅ SendGrid fails to send email
2. ✅ Alert created:
   ```
   Severity: error
   Type: email
   Title: "Email Delivery Failure"
   Message: "Failed to send to user@example.com"
   ```
3. ✅ Admin sees notification
4. ✅ Can investigate SendGrid quota/config

### **Scenario 3: Security Header Missing**
1. ✅ Smoke test detects missing HSTS header
2. ✅ Alert created:
   ```
   Severity: warning
   Type: security
   Title: "Security Header Missing"
   Message: "HSTS header not found in production"
   ```
3. ✅ Admin sees alert
4. ✅ Can fix security config

---

## Integration with Monitoring Tools

### **Automatic Integration**
The alert system is integrated with:

1. **Smoke Tests** (`./smoke-test.sh`)
   - Failed tests create alerts automatically
   - Shows which security check failed

2. **Log Monitor** (`./monitor-logs.sh`)
   - Detected errors create alerts
   - Provides context and fix suggestions

3. **Server Error Handler**
   - All 500-level errors create alerts (production only)
   - Includes stack trace and request details

4. **Email Service**
   - Failed SendGrid deliveries create alerts
   - Shows recipient and error reason

---

## Using Alerts in Your Admin UI

### **Example: Display Alert Badge**
Show unread count in your admin nav:

```typescript
// Fetch unread count
const { data: counts } = useQuery({
  queryKey: ['/api/admin/alerts/counts'],
});

// Display badge
<Badge variant="destructive">
  {counts?.unread || 0}
</Badge>
```

### **Example: Alert List Component**
```typescript
const { data: alerts } = useQuery({
  queryKey: ['/api/admin/alerts'],
  queryFn: async () => {
    const res = await fetch('/api/admin/alerts?hours=24');
    return res.json();
  }
});

return (
  <div>
    {alerts?.map(alert => (
      <div key={alert.id} className="alert">
        <span className={`severity-${alert.severity}`}>
          {alert.severity.toUpperCase()}
        </span>
        <h3>{alert.title}</h3>
        <p>{alert.message}</p>
        <button onClick={() => resolveAlert(alert.id)}>
          Resolve
        </button>
      </div>
    ))}
  </div>
);
```

---

## Testing the Alert System

### **Create a Test Alert** (Development)
```bash
# From terminal
curl -X POST http://localhost:5000/api/test/create-alert \
  -H "Content-Type: application/json" \
  -d '{
    "severity": "warning",
    "type": "system",
    "title": "Test Alert",
    "message": "This is a test notification"
  }'
```

### **View in Admin Portal**
1. Go to `/admin`
2. Check alerts section
3. Should see test alert
4. Click to mark as read/resolved

---

## Quick Reference

```bash
# Get recent alerts
GET /api/admin/alerts?hours=24

# Get alert counts (for badges)
GET /api/admin/alerts/counts

# Mark as read
POST /api/admin/alerts/:id/read

# Resolve alert
POST /api/admin/alerts/:id/resolve
```

---

## Benefits

✅ **No Manual Checking** - Errors automatically create alerts  
✅ **Immediate Visibility** - See problems as they happen  
✅ **Context Included** - Each alert has details to help debug  
✅ **Actionable** - Mark as read or resolved to track progress  
✅ **Audit Trail** - Know who fixed what and when  
✅ **Production Ready** - Only logs critical errors in production  

---

**Your admin portal now has automatic notifications! No more manual log checking - you'll see problems instantly.** 🎉
