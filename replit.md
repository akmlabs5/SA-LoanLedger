# Overview
Morouna Loans is a full-stack loan management system tailored for the Saudi Arabian market. It integrates SIBOR-based calculations and AI-driven insights to manage loan portfolios, offering tools for risk management, concentration alerts, and LTV monitoring. The system handles bank facilities, collateral tracking, and the entire loan lifecycle within a mobile-responsive design. Its core purpose is to provide intelligent insights for financial portfolio optimization, specifically addressing the unique requirements of the Saudi banking sector.

# User Preferences
Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend
The frontend is a React TypeScript SPA using Wouter for routing, TanStack Query for state management, and Shadcn/ui (Radix UI) for components. Styling uses Tailwind CSS with a Saudi-themed, mobile-first design. Forms use React Hook Form with Zod validation, and Recharts for data visualization. A unified date picker system (`@ark-ui/react date-picker`) ensures consistent UI/UX across all forms.

## Backend
The backend is built with Express.js, employing Drizzle ORM with Neon (PostgreSQL) for type-safe database operations. Authentication uses Replit Auth (OpenID Connect) with Passport.js and Supabase Auth for email-based Two-Factor Authentication (2FA). PostgreSQL-backed sessions ensure scalability. It follows a REST API pattern with an organized endpoint structure and a storage abstraction layer.

## Authentication
A unified login page detects user (email) or admin (username) credentials. User authentication uses Supabase Auth with email/password login and optional 2FA OTP verification via SendGrid, while admin uses simple username/password. The signup experience features transparent branding, account type selection (Personal/Organization), an optional 2FA toggle, and green-themed professional forms. All preferences are saved to the database. A session bridge connects Supabase authentication to Express sessions, automatically creating organizations for all new users and including organization data (organizationId, organizationName, isOwner) in user sessions. The Security settings tab provides password reset functionality and 2FA management for all Supabase users.

### Custom Email Verification System
The platform implements a custom email verification flow using SendGrid instead of Supabase's default mailer, ensuring all authentication emails use branded HTML templates from noreply@akm-labs.com. During signup, the Supabase Admin API creates users with `email_confirm: false`, suppressing automatic emails. Custom verification links are generated via `admin.generateLink()` and sent through SendGrid with beautiful HTML templates featuring Saudi-themed teal/green gradient branding. This approach provides complete control over email design while maintaining Supabase's secure authentication flow.

### Email Template System
A professional email template system provides 7 beautiful HTML templates with Saudi-themed teal/green gradient branding:
- **Email Verification**: For confirming user email addresses during signup (sent via custom flow using SendGrid)
- **Password Reset**: For secure password reset flows
- **MFA Code**: For 2FA OTP verification with large, centered code display
- **Welcome Email**: For new user onboarding
- **Password Changed**: For security notifications
- **Loan Payment Reminder**: For upcoming payment notifications with payment details and calendar integration
- **General Reminder**: Flexible template for any type of reminder with customizable sections

The `EmailTemplateService` supports variable substitution for placeholders like {{url}}, {{code}}, {{user.name}}, {{loan_name}}, {{payment_amount}}, and many more. All templates include text-based "Morouna Loans by AKM Labs" branding (no external images for spam-filter safety). 2FA OTP emails, team invitations, email verification, and payment reminders use these templates for a polished, professional experience sent from noreply@akm-labs.com.

## Multi-Tenant Team Collaboration
The platform supports organizational team collaboration for 2-5 members with complete data isolation. Organizations can be 'Personal' or 'Organization'. Team management includes an email-based invitation system via SendGrid with secure token-based acceptance, role-based access (Owner/Member), and team settings. All data (loan, facility, collateral, guarantee, bank) is scoped by `organizationId` with SQL-level enforcement and API route validation to ensure cross-tenant data isolation, including for AI Agent operations and report generation. User sessions include `organizationId`, `organizationName`, and `isOwner` flags.

## AI Intelligence System
A dual AI chat system powered by DeepSeek API provides support:
- **Hybrid Agent Chat (Green Button)**: A smart AI that teaches and executes actions. It detects intent to switch between teaching ("How do I...?") and execution modes ("Create a loan..."). It has 12 agentic functions (e.g., create/settle loans, analyze risks, export reports) and supports multi-turn conversations with session context.
- **Help Desk Chat (Blue Button)**: A dedicated Q&A assistant for platform features, offering single-turn answers without conversation history.

Additional AI features include rules-based portfolio risk analysis, bank concentration monitoring, LTV tracking, and email notifications via SendGrid with configurable alerts and optional calendar invites.

## Data Storage
The database schema is tailored for Saudi banking, storing Banks, Facilities, Loans (with SIBOR calculations), Collateral (with valuation history), Users, and Sessions, using UUID primary keys and foreign key relationships.

## Document Storage & Management
A comprehensive document storage system leverages Replit Object Storage with organization-scoped access control. The `DocumentUpload` component provides a drag-and-drop UI for PDF, Word, Excel, and image files (up to 25MB, max 15 per entity) with entity-specific categorization and metadata. Backend infrastructure uses presigned URLs for efficient uploads, and an ACL system ensures multi-tenant data isolation with `ORGANIZATION_MEMBER` rules. All uploads are scoped by `organizationId`, and cross-tenant access is blocked at storage and database levels.

## Mobile-First Touch Redesign
The application features a complete touch-first mobile redesign, eliminating hover dependencies. It uses native app patterns with a bottom tab bar navigation (Dashboard, Loans, Banks, AI, More), card-based layouts, action sheets, Floating Action Buttons (FAB), and 48px minimum touch targets. Page-specific optimizations are implemented for Dashboard, Loans, Banks, AI Chat, and Settings. Mobile UI renders for viewports `<1024px`, while desktop UI remains unchanged for `≥1024px`. Single-tap interactions are fully functional after addressing previous rendering issues.

## Admin Portal
A comprehensive admin portal with separate authentication provides system oversight, including a dashboard, analytics, user management, database management, security monitoring, system alerts, global settings, and email template management, secured with Bearer token-based API protection.

## Production Security & Monitoring
The platform includes enterprise-grade production security and monitoring:
- **Security Headers**: HSTS, X-Frame-Options, X-Content-Type-Options, XSS Protection, Referrer-Policy
- **HTTPS Enforcement**: Automatic HTTP to HTTPS redirect with x-forwarded-proto monitoring
- **CORS Protection**: Strict origin control for akm-labs.com and www.akm-labs.com
- **Automated Smoke Tests**: Verifies security headers, CORS, API health, and HTTPS redirects (`./smoke-test.sh`)
- **Real-Time Log Monitor**: Detects errors, security issues, redirect loops, CORS problems, database failures, and SSL issues with actionable alerts (`./monitor-logs.sh`)
- **Production Hardening**: Test endpoints disabled in production, comprehensive error logging, session security

## User Settings & Preferences
A comprehensive user settings system provides full customization of the platform experience. All settings are fully functional and persist across sessions:

### Profile & Theme
- **Profile Management**: Update first/last name (email locked to authentication provider)
- **Theme Switching**: Light, Dark, and System modes with OS preference detection and live updates. System mode automatically responds to OS theme changes. Ref-based listener management prevents memory leaks during theme transitions.

### Display Preferences  
- **Dashboard Layout**: Grid or List view toggle for loan cards on dashboard, persists user's choice
- **Compact View**: Toggle for condensed spacing throughout the app (reduces padding when enabled)
- **Items Per Page**: Pagination control (5-100 items) applied to History page and other lists
- **Enable Sounds**: Audio feedback for success/error actions (plays sounds on save, mutations)
- **Localization**: Timezone, language (EN/AR), currency (SAR), date format customization

### Notifications & Reminders
- **Default Reminder Intervals**: Pre-configured days before loan due date (e.g., 7, 3, 1 days)
- **Email/Calendar Reminders**: Toggle email and calendar invite generation for reminders
- **Auto-Apply to New Loans**: Automatically creates reminders for new loans based on default intervals
- **Daily Alerts**: Configurable alert timing and severity filters (Critical, High, Medium, Low)

### AI & Security
- **AI Insights Configuration**: Customizable thresholds for risk analysis, concentration monitoring, and LTV tracking
- **Security**: Password reset and 2FA management for Supabase users

All settings persist to the database with Zod validation and are applied system-wide immediately. A PreferencesContext provides global access to user preferences across the application.

## Key Features
The system supports bank-level collateral assignment, optional facility durations, and a revolving period tracking system. Users can create loans that exceed facility credit limits with warning notifications, allowing for flexible credit management.

### Cancelled Loan Management & Permanent Deletion
A comprehensive 3-tab loan management system separates Active, Settled, and Cancelled loans for clear organization:
- **Active Loans Tab**: Shows only active and overdue loans (excludes both settled and cancelled)
- **Settled Loans Tab**: Displays fully settled loans with undo settlement capability
- **Cancelled Loans Tab**: Lists cancelled loans with permanent deletion option

The system implements safe permanent deletion with multi-layer validation:
- **Safety Checks**: Only cancelled loans can be permanently deleted (validated at storage layer)
- **Organization Scoping**: All delete operations enforce organizationId validation for multi-tenant security
- **Confirmation Dialog**: Warns users about irreversible action before permanent deletion
- **Analytics Integrity**: All reports, dashboard analytics, and AI agent analysis automatically exclude cancelled loans from calculations using `getActiveLoansByUser`
- **Dual Implementation**: Both DbStorage (PostgreSQL) and MemStorage properly implement permanent deletion with identical safety checks

Available on both mobile and desktop interfaces with touch-optimized "Permanently Delete" buttons and native confirmation dialogs.

### Revolving Facility Logic
Revolving facilities support a **Maximum Loan Tenor** limit (e.g., 360 days) that applies to each individual loan independently, NOT cumulatively across all loans. This means:
- Each loan drawdown must not exceed the configured max tenor (e.g., ≤360 days)
- Multiple loans can coexist (e.g., two 180-day loans on a 360-day max tenor facility)
- The tenor limit validates individual loan duration, not the sum of all loan durations
- Credit limit remains the only cumulative constraint across all active loans

The UI and validation logic enforce per-loan tenor limits, allowing users to configure facilities with custom maximum loan durations while supporting unlimited revolving drawdowns within credit limits.

## Deployment & Domain
- **Production URL**: https://akm-labs.com (custom domain with SSL)
- **Email Domains**: noreply@akm-labs.com (auth), reminders@akm-labs.com (alerts)
- **SendGrid Authentication**: Fully authenticated domain with SPF/DKIM records
- **Email Branding**: Text-based "Morouna Loans" header (spam-filter safe, no external images)

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL.
- **Drizzle Kit**: Database migration and schema management.

## Authentication & Session Management
- **Replit Auth**: OpenID Connect provider.
- **Supabase Auth**: Email-based authentication with 2FA.
- **Passport.js**: Authentication middleware.
- **connect-pg-simple**: PostgreSQL session store.

## AI & Intelligence Services
- **DeepSeek API**: External AI service.
- **SendGrid**: Email service for notifications and alerts.

## UI & Frontend Libraries
- **Shadcn/ui**: Component library.
- **Radix UI**: Headless UI components.
- **Tailwind CSS**: Utility-first CSS framework.
- **TanStack Query**: Server state management.
- **Wouter**: Client-side routing.
- **React Hook Form**: Form state management.
- **Zod**: Schema validation.
- **Recharts**: Charting library.

## Saudi Market Integrations
- **SIBOR Rate API**: Integration for real-time SIBOR data.
- **Saudi Banks Database**: Pre-configured major Saudi banks.
- **SAR Currency Formatting**: Saudi Riyal currency display.