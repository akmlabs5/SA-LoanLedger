# 🔑 Morouna Loans - Login Credentials

## Test Account (Replit Auth)
```
Email: test@morounaloans.com
Username: testuser
Password: Testuser123
Auth Method: Replit Auth
```

## Admin Account (Username/Password)
```
Username: admin
Password: admin123
Auth Method: Simple username/password
URL: /admin-portal/login
```

## Regular Users (Supabase Auth)
```
Any email (e.g., user@example.com)
Password: User's chosen password
Auth Method: Supabase (with 2FA option)
```

---

## Quick Login Guide

### **Admin Login:**
1. Go to: `/admin-portal/login`
2. Username: `admin`
3. Password: `admin123`
4. Click "Sign In"

### **Test Account:**
1. Go to: `/auth/login`
2. Email: `test@morounaloans.com`
3. Password: `Testuser123`
4. Redirects to Replit Auth

### **New Users:**
1. Go to: `/supabase-signup`
2. Create account with email/password
3. Verify email
4. Login at `/auth/login`

---

## Environment Variables Needed

### For Supabase (New Users):
```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### For Admin (Already Set):
```bash
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

---

**Save these credentials for accessing the platform!**
