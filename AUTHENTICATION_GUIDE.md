# 🔐 Authentication System Guide

## Overview

The Morouna Loans platform uses **three different authentication methods** for different user types:

1. **Test Account** - Replit Auth (for quick testing)
2. **Regular Users** - Supabase Auth (secure with 2FA)
3. **Admin** - Simple username/password (browser-accessible)

---

## 🧪 Test Account (Replit Auth)

### **Credentials:**
```
Email: test@morounaloans.com
Username: testuser
Password: Testuser123
Auth Method: Replit Auth
```

### **How It Works:**
1. User enters `test@morounaloans.com` on login page
2. System detects this is the test account
3. Redirects to Replit Auth (OAuth)
4. User logs in with their Replit credentials
5. Returns to app as test user

### **Purpose:**
- Quick testing without email verification
- No 2FA required
- Fast development workflow
- Uses Replit's secure OAuth

---

## 👥 Regular Users (Supabase Auth)

### **Example:**
```
Email: user@example.com (any email except test account)
Password: UserPassword123
Auth Method: Supabase Auth
```

### **How It Works:**
1. User enters their email on login page
2. System detects this is NOT the test account
3. Uses Supabase authentication
4. User enters email/password
5. Optional: 2FA verification code sent via email
6. User is authenticated

### **Features:**
- ✅ Email verification on signup
- ✅ Two-Factor Authentication (2FA) optional
- ✅ Forgot password flow
- ✅ Secure password hashing
- ✅ Professional security standards

### **Signup Flow:**
1. Visit `/supabase-signup`
2. Enter email, password, and user details
3. Receive verification email
4. Click verification link
5. Account activated
6. Can login with 2FA

---

## 🛡️ Admin (Simple Username/Password)

### **Credentials:**
```
Username: admin (NOT an email format)
Password: Set via ADMIN_PASSWORD environment variable
Auth Method: Simple username/password
```

### **How It Works:**
1. Admin enters username `admin` (not email format)
2. System detects this is admin login
3. Checks against environment credentials
4. Generates session token
5. Admin is authenticated

### **Why This Approach?**
- ✅ Access from any browser (no Replit dependency)
- ✅ Simple and secure
- ✅ No external OAuth needed
- ✅ Environment-based password management
- ✅ Can set custom admin credentials via env vars

### **Setting Admin Credentials:**
```bash
# In environment secrets
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password-here
```

---

## 🔄 Login Flow Detection

The login page automatically detects which authentication method to use:

```
User enters identifier on login page
│
├─ Is it "test@morounaloans.com"?
│  └─ Yes → Use Replit Auth
│
├─ Is it email format (contains @)?
│  └─ Yes → Use Supabase Auth (regular user)
│
└─ Is it username format (no @)?
   └─ Yes → Use Admin Auth (username/password)
```

---

## 📱 User Experience

### **Test Account Login:**
1. Go to `/auth/login`
2. Enter: `test@morounaloans.com`
3. Enter: `Testuser123`
4. Click "Sign In"
5. → Redirected to Replit Auth
6. → Authenticated as test user

### **Regular User Login:**
1. Go to `/auth/login`
2. Enter: your email (e.g., `john@example.com`)
3. Enter: your password
4. Click "Sign In"
5. → If 2FA enabled: Enter OTP code from email
6. → Authenticated as regular user

### **Admin Login:**
1. Go to `/admin-portal/login`
2. Enter: `admin` (username, not email)
3. Enter: your admin password
4. Click "Sign In"
5. → Authenticated as admin
6. → Access admin portal

---

## 🔒 Security Features

### **Test Account:**
- Uses Replit's OAuth security
- No password stored locally
- Session managed by Replit

### **Regular Users:**
- Passwords hashed with Supabase
- Optional 2FA via email OTP
- Email verification required
- Forgot password support
- Secure session tokens

### **Admin:**
- Environment-based password
- Session token stored in localStorage
- Bearer token authentication for API
- Session expiry (24 hours production, 7 days dev)
- Protected routes with middleware

---

## 🧪 Testing Each Flow

### **1. Test Test Account:**
```bash
# Login page
Email: test@morounaloans.com
Password: Testuser123
→ Should redirect to Replit Auth
```

### **2. Test Regular User:**
```bash
# First signup at /supabase-signup
Email: newuser@example.com
Password: SecurePass123
→ Should send verification email
→ After verification, can login
→ Optional: Enable 2FA in settings
```

### **3. Test Admin:**
```bash
# Admin login page
Username: admin
Password: [your ADMIN_PASSWORD env var]
→ Should access admin portal immediately
```

---

## 🌐 Access Points

### **Regular Users:**
- Login Hub: `/` (home page)
- Direct Login: `/auth/login`
- Signup: `/supabase-signup`

### **Admin:**
- Login Hub: `/` (click Admin Portal)
- Direct Login: `/admin-portal/login`

### **Test Account:**
- Same as regular users
- Just use test email

---

## 📋 Quick Reference

| User Type | Identifier | Auth Method | 2FA | Access From |
|-----------|-----------|-------------|-----|-------------|
| Test Account | test@morounaloans.com | Replit Auth | ❌ | Any browser (via Replit) |
| Regular User | user@example.com | Supabase Auth | ✅ Optional | Any browser |
| Admin | admin | Username/Password | ❌ | Any browser |

---

## 🔧 Configuration

### **Environment Variables Needed:**

**For Supabase Auth (Regular Users):**
```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**For Admin:**
```bash
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
```

**For Replit Auth (Test Account):**
- No additional config needed
- Uses Replit's built-in OAuth

---

## ✅ Summary

**Three authentication systems working together:**

1. **Test Account** (`test@morounaloans.com`)
   - Uses Replit Auth OAuth
   - Password: `Testuser123`
   - For quick testing

2. **Regular Users** (any other email)
   - Uses Supabase Auth
   - Supports 2FA, forgot password, email verification
   - Professional security

3. **Admin** (`admin` username)
   - Simple username/password
   - Access from any browser
   - Environment-based credentials
   - No external OAuth dependency

**All three work seamlessly from the same login page with automatic detection!** 🎉
