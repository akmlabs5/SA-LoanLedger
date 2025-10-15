# Overview
Morouna Loans is a full-stack loan management system designed for the Saudi Arabian market. It integrates SIBOR-based calculations and AI-driven insights to manage loan portfolios, offering tools for risk management, concentration alerts, and LTV monitoring. The system handles bank facilities, collateral tracking, and the entire loan lifecycle within a mobile-responsive design. Its core purpose is to provide intelligent insights for financial portfolio optimization, specifically addressing the unique requirements of the Saudi banking sector. The project aims to deliver a robust, secure, and user-friendly platform that enhances financial decision-making for individuals and organizations in Saudi Arabia.

# Recent Changes

## October 15, 2025 - New Loan Confirmation Email System
- **Branded Email Template**: Created NEW_LOAN_CONFIRMATION email template with professional green HTML design matching existing branded templates
- **Professional Wording**: Removed "friendly reminder" and "automatic deduction" language, replaced with professional confirmation message: "Your loan has been successfully created and is now active in the system"
- **Calendar Invite Enhancement**: Updated calendar invite subject to include both bank and loan reference: "Loan Payment Due - {Bank Name} - {Loan Reference}"
- **Dedicated Email Function**: Created sendLoanConfirmationEmail() function in emailService.ts for loan creation notifications with proper template rendering
- **Facility Name Handling**: Safe facility name formatting from facilityType enum (facilities don't have name field) - transforms "working_capital" to "Working Capital Facility"
- **Template Variables**: Includes reference_number, bank_name, facility_name, loan_amount, due_date, all_in_rate with proper formatting
- **Subject Line Fix**: Fixed template syntax from ${variables.reference_number} to {{reference_number}} for proper variable replacement
- **Email Details**: Shows loan reference, bank name, facility type, amount (formatted SAR), due date, and calculated all-in rate (SIBOR + margin)

## October 15, 2025 - AI-Powered Document Generation
- **Portfolio Report Service**: Created comprehensive report generation service supporting PDF, Excel, and Word formats with all portfolio data (loans, facilities, collateral, guarantees, metrics)
- **AI Function Calling**: Added generatePortfolioReport function to AI chat - users can ask "give me a report" and AI generates and downloads it
- **Multiple Report Types**: Comprehensive (full portfolio), Loans (active/settled focus), Facilities (banking facilities), Summary (metrics and exposures)
- **Professional Formatting**: PDF uses jsPDF with tables, Excel has multiple sheets, Word generates structured text documents
- **Automatic Downloads**: Base64 encoding with proper MIME types, browser automatically downloads generated reports
- **Safe BigInt Handling**: All amount calculations use Number(value?.toString() ?? 0) pattern throughout report generation
- **Bug Fixes**: Fixed jsPDF import issue (named import instead of default), corrected loan property names in AI scenarios (interestRate→bankRate, drawdownDate→startDate)
- **UI**: Clean, simple chat interface - users can request reports naturally in conversation

## October 15, 2025 - AI Chat Complete Overhaul
- **Temporary Chat Mode**: Chat now starts in temporary in-memory mode - messages stored in React state, not database by default
- **Optional Save Feature**: Added "Save Conversation" button with title dialog - users can save important chats, quick questions don't clutter saved list
- **Transactional Bulk Save**: Created `/api/chat/conversations/bulk-save` endpoint with proper database transaction for atomic save operations (all messages or none)
- **AI Context Fix**: Fixed critical bug where AI didn't receive user's latest message - now properly includes complete conversation history
- **Auto-Cleanup Scheduler**: Background job runs every 24 hours to delete conversations older than 30 days, preventing database bloat
- **Multi-tenant Safety**: All chat operations maintain organizationId filtering and data isolation
- **Visual Indicators**: Clear UI shows unsaved vs saved conversation state with badges and helpful hints
- **Missing AI Endpoint**: Created `/api/ai/chat` endpoint that was causing chat to fail - AI now responds properly to all messages
- **Data-Aware AI**: AI now fetches ALL user portfolio data (active/settled/cancelled loans, facilities, banks, collateral, guarantees) and includes it in context for data-driven responses with actual numbers, not generic advice
- **Concise Data-Driven Prompt**: Upgraded AI system prompt to be concise and data-focused - instructs AI to ALWAYS use actual portfolio data, show specific amounts/dates/banks, calculate from provided data, less explanation and more numbers
- **PDF Export Feature**: Added `/api/chat/conversations/:id/export-pdf` endpoint for downloading chat conversations as formatted PDF documents with proper pagination and branding
- **File Upload Placeholder**: File upload endpoint exists but marked as not yet implemented for future enhancement
- **Mobile Scroll Fix**: Fixed mobile chat scrolling with proper viewport height calculations (calc(100vh-4rem)), removed fixed input positioning, added overflow-y-auto with WebKit smooth scrolling for iOS

## October 14, 2025 - Bank Performance Metrics Bug Fixes
- **Fixed Average Rate Calculation**: Corrected field name from `loan.marginRate` to `loan.margin` in getBankPerformance, resolving NaN/null avgAllInRate display (now correctly shows calculated rates like 7.15%)
- **Fixed Payment Record Tracking**: Corrected settlement date field from `loan.settlementDate` to `loan.settledDate`, enabling proper settled loan counting in payment performance metrics
- **Enhanced Facility Display**: Added formatFacilityType() helper function to transform raw database values (e.g., "working_capital") into user-friendly names (e.g., "Working Capital Facility"), supporting all Saudi banking facility types including Murabaha, Tawarruq, and Ijara
- **Multi-tenant Validation**: Verified all performance calculations maintain proper organizationId filtering and data isolation

# User Preferences
Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Design
The frontend is a React TypeScript SPA with a mobile-first design using Shadcn/ui (Radix UI) and Tailwind CSS, featuring a Saudi-themed aesthetic. It utilizes Wouter for routing, TanStack Query for state management, React Hook Form with Zod for form validation, and Recharts for data visualization. A unified date picker system ensures consistent UI. The application features a complete touch-first mobile redesign with native app patterns, including a bottom tab bar, card-based layouts, and action sheets. User settings allow for theme switching (Light/Dark/System), dashboard layout preferences, compact view, pagination control, sound toggles, and localization (timezone, language, currency, date format).

## Backend and Authentication
The backend is built with Express.js and Drizzle ORM with Neon (PostgreSQL). Authentication uses a unified login page leveraging Replit Auth (OpenID Connect) for admins and Supabase Auth for users, supporting email/password login with optional 2FA via SendGrid. A custom email verification system uses SendGrid with branded HTML templates for all authentication emails. The platform supports multi-tenant team collaboration with complete data isolation, using `organizationId` for all data scoping and API validation. User sessions include `organizationId`, `organizationName`, and `isOwner` flags.

## AI and Intelligence System
A dual AI chat system powered by DeepSeek API provides support: a Hybrid Agent Chat for executing actions and teaching, and a Help Desk Chat for Q&A. Additional AI features include rules-based portfolio risk analysis, bank concentration monitoring, and LTV tracking with configurable email notifications.

## Data Management
The database schema is tailored for Saudi banking, storing Banks, Facilities, Loans (with SIBOR calculations), Collateral, Users, and Sessions using UUIDs and foreign key relationships. A comprehensive document storage system leverages Replit Object Storage with organization-scoped access control, supporting drag-and-drop uploads and an ACL system for multi-tenant data isolation. Loan management includes Active, Settled, and Cancelled loan tabs, with safe permanent deletion for cancelled loans. Revolving facilities support a maximum loan tenor limit per individual loan.

## Admin Portal and Security
A separate admin portal provides system oversight, including user and database management, security monitoring, and email template management, secured with Bearer token-based API protection. Production security includes HSTS, HTTPS enforcement, CORS protection, automated smoke tests, real-time log monitoring, and production hardening.

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