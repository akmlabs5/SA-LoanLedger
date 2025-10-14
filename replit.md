# Overview
Morouna Loans is a full-stack loan management system designed for the Saudi Arabian market. It integrates SIBOR-based calculations and AI-driven insights to manage loan portfolios, offering tools for risk management, concentration alerts, and LTV monitoring. The system handles bank facilities, collateral tracking, and the entire loan lifecycle within a mobile-responsive design. Its core purpose is to provide intelligent insights for financial portfolio optimization, specifically addressing the unique requirements of the Saudi banking sector. The project aims to deliver a robust, secure, and user-friendly platform that enhances financial decision-making for individuals and organizations in Saudi Arabia.

# Recent Changes

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