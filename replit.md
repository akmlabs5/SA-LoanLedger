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
A unified login page detects user (email) or admin (username) credentials. User authentication includes email/password login with optional 2FA OTP verification via SendGrid, while admin uses username/password. The signup experience features transparent branding, account type selection (Personal/Organization), an optional 2FA toggle, and green-themed professional forms. All preferences are saved to the database.

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

## Key Features
The system supports bank-level collateral assignment, optional facility durations, and a revolving period tracking system. Users can create loans that exceed facility credit limits with warning notifications, allowing for flexible credit management. User settings include daily alerts and feature showcases.

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