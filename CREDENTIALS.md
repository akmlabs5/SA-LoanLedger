# 🔑 Morouna Loans - Login Credentials

## ✅ Test User (Supabase Auth - WORKING)
```
Email: testuser@morounaloans.com
Password: testuser123
Auth Method: Supabase
Account Type: Personal (has default organization)
Features: Full access, optional 2FA
```

### How to Login:
1. Visit the unified login page (`/unified-login` or just login)
2. Enter: `testuser@morounaloans.com`
3. Enter: `testuser123`
4. Click "Sign In"
5. ✅ You'll be redirected to the dashboard

## Admin Account (Username/Password)
```
Username: admin
Password: admin123
Auth Method: Simple username/password
URL: /admin-portal or /unified-login
```

### How to Login:
1. Visit the unified login page
2. Enter: `admin` (username, not email)
3. Enter: `admin123`
4. Click "Sign In"
5. ✅ You'll be redirected to admin dashboard

## Regular Users (Supabase Auth)
```
Any email (e.g., user@example.com)
Password: User's chosen password (min 8 characters)
Auth Method: Supabase (with optional 2FA)
```

### How to Create Account:
1. Go to: `/supabase-signup`
2. Fill in email, password, name
3. Choose account type:
   - **Personal**: Gets a default organization named "{FirstName}'s Organization"
   - **Organization**: Provide custom organization name
4. Optional: Enable 2FA
5. Click "Create Account"
6. Verify email
7. Login at `/unified-login`

### ℹ️ Account Types Explained:
**Both account types work the same way!** Every user gets an organization automatically:

- **Personal Account**: 
  - Best for individual users
  - Organization auto-named as "Test's Organization"
  - Can still invite team members later
  
- **Organization Account**:
  - Best for businesses/teams
  - You choose the organization name during signup
  - Can invite team members (2-5 total)

---

## Quick Login Guide

### **Test User (Easiest):**
1. Go to: `/unified-login` or just login
2. Email: `testuser@morounaloans.com`
3. Password: `testuser123`
4. ✅ Works immediately!

### **Admin Login:**
1. Go to: `/unified-login` or `/admin-portal`
2. Username: `admin`
3. Password: `admin123`
4. ✅ Access admin portal

### **New Users:**
1. Go to: `/supabase-signup`
2. Create account with email/password
3. Verify email (check inbox)
4. Login at `/unified-login`

---

## Authentication Flow (How It Works)

### Unified Login Detection
The system automatically detects which auth method to use:
- **Email format** (`user@example.com`) → Supabase Auth
- **Username format** (`admin`) → Admin Auth

### Session Management
- Backend session created via Passport.js
- Session cookie (HTTP-only) sent to browser
- Sessions persist for 7 days
- Automatic token refresh for Replit Auth
- Supabase sessions handled client + server side

### Logout Flow
1. Click "Sign Out"
2. Clears Supabase session
3. Destroys backend session
4. Clears session cookies
5. Redirects to login page

---

## Environment Variables

### Already Configured ✅
```bash
# Supabase
SUPABASE_URL=https://kizxoarsjgsupkuhuxcz.supabase.co
SUPABASE_ANON_KEY=<configured>
SUPABASE_SERVICE_ROLE_KEY=<configured>
VITE_SUPABASE_URL=<configured>
VITE_SUPABASE_ANON_KEY=<configured>

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

---

## Development vs Production

### Development (Current Environment)
- Uses test credentials above ✅
- Development bypass mode for testing
- Session bridge connects Supabase to backend
- Logout cookie management for dev mode

### Production (akm-labs.com)
- Full email verification required
- 2FA available for all users
- Secure HTTPS-only sessions
- Production-grade security headers
- No development bypasses

---

## Troubleshooting

### ✅ Login Works But Redirects Back?
**FIXED!** The session bridge now properly connects Supabase authentication to the backend. This issue has been resolved.

### Can't Login?
- Verify you're using correct credentials
- Check email format vs username format
- Clear browser cookies and try again
- Ensure email is verified (for new signups)

### Session Issues?
- Logout and login again
- Clear browser cache
- Check browser console for errors
- Make sure cookies are enabled

---

## Security Features

- ✅ All passwords hashed (never stored in plain text)
- ✅ HTTP-only session cookies (XSS protected)
- ✅ 2FA codes expire after 10 minutes
- ✅ Sessions expire after 7 days
- ✅ Development logout cookie prevents unauthorized access
- ✅ HTTPS enforcement in production
- ✅ CORS protection
- ✅ Security headers (HSTS, X-Frame-Options, etc.)

---

**Save these credentials for accessing the platform!** 🔐
