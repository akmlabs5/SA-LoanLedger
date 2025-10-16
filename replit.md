# Overview
Morouna Loans is a full-stack loan management system for the Saudi Arabian market. It integrates SIBOR-based calculations and AI-driven insights to manage loan portfolios, offering tools for risk management, concentration alerts, and LTV monitoring. The system handles bank facilities, collateral tracking, and the entire loan lifecycle within a mobile-responsive design. Its core purpose is to provide intelligent insights for financial portfolio optimization, specifically addressing the unique requirements of the Saudi banking sector, aiming to enhance financial decision-making.

# User Preferences
Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Design
The frontend is a React TypeScript SPA with a mobile-first design using Shadcn/ui (Radix UI) and Tailwind CSS, featuring a Saudi-themed aesthetic. It uses Wouter for routing, TanStack Query for state management, React Hook Form with Zod for validation, and Recharts for data visualization. It includes a complete touch-first mobile redesign with native app patterns and a unified date picker system. User settings allow for theme switching, dashboard layout preferences, compact view, pagination control, sound toggles, and localization.

## Backend and Authentication
The backend is built with Express.js and Drizzle ORM with Neon (PostgreSQL). Authentication uses a unified login page leveraging Replit Auth (OpenID Connect) for admins and Supabase Auth for users, supporting email/password login with optional 2FA via SendGrid. A custom email verification system uses SendGrid with branded HTML templates. The platform supports multi-tenant team collaboration with complete data isolation, using `organizationId` for all data scoping and API validation.

## AI and Intelligence System
A dual AI chat system powered by DeepSeek API provides support: a Hybrid Agent Chat for executing actions and teaching, and a Help Desk Chat for Q&A. Additional AI features include rules-based portfolio risk analysis, bank concentration monitoring, and LTV tracking with configurable email notifications. The AI is data-aware, fetching all user portfolio data (loans, facilities, collateral, guarantees) for data-driven responses. Automated daily snapshots of portfolio metrics are captured.

## Data Management
The database schema is tailored for Saudi banking, storing Banks, Facilities, Loans (with SIBOR calculations), Collateral, Users, and Sessions using UUIDs and foreign key relationships. A comprehensive document storage system leverages Replit Object Storage with organization-scoped access control. Loan management includes Active, Settled, and Cancelled loan tabs, with safe permanent deletion for cancelled loans. Revolving facilities support a maximum loan tenor limit per individual loan. Historical payment tracking is implemented via a `loanPayments` table and API, enabling multi-year reporting and analytics. All query keys for user-specific resources include user.id to ensure proper cache isolation between different accounts/organizations.

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