# Overview

Morouna Loans is a full-stack loan management system designed for the Saudi Arabian market. It integrates SIBOR-based calculations and AI-driven insights to help users manage loan portfolios, offering tools for risk management, concentration alerts, and LTV monitoring. The system handles bank facilities, collateral tracking, and the entire loan lifecycle, all within a mobile-responsive design. Its core purpose is to provide intelligent insights for financial portfolio optimization, specifically addressing the unique requirements of the Saudi banking sector.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is a React TypeScript single-page application using Wouter for routing, TanStack Query for state management, and Shadcn/ui (built on Radix UI) for components. Styling is managed with Tailwind CSS, featuring a Saudi-themed color scheme and mobile-first design. Forms utilize React Hook Form with Zod validation, and Recharts is used for data visualization.

## Backend Architecture
The backend is built with Express.js, employing Drizzle ORM with Neon (PostgreSQL) for type-safe database operations. Authentication uses Replit Auth (OpenID Connect) with Passport.js and Supabase Auth for email-based Two-Factor Authentication (2FA). PostgreSQL-backed sessions ensure scalability. It follows a REST API pattern with an organized endpoint structure and a storage abstraction layer.

## Authentication UI
The platform features a unified login page with a green-themed design, automatically detecting user (email) or admin (username) credentials. User authentication includes email/password login with optional 2FA OTP verification via SendGrid, while admin authentication uses username/password. The design incorporates "Morouna Loans by AKM Labs" branding in the lower right corner, a tagline, rounded inputs, and cyan gradient buttons. During signup, users can optionally enable Two-Factor Authentication via a checkbox, with the preference saved to the database and enforced on subsequent logins.

## AI Intelligence System
A dual AI chat system powered by DeepSeek API provides comprehensive support:

**Hybrid Agent Chat (Green Button - Bottom Right)**
- Smart AI that both teaches and executes actions
- Detects intent: "How do I...?" triggers teaching mode, "Create a loan..." triggers execution
- 12 agentic functions: create/settle loans, set reminders, calculate totals, analyze risks, check facilities, monitor LTV, suggest refinancing, export reports
- Multi-turn conversations with session-based context
- Function calling with OpenAI-compatible interface

**Help Desk Chat (Blue Button - Bottom Left)**
- Dedicated Q&A assistant for learning platform features
- Single-turn Q&A format (no conversation history)
- Comprehensive knowledge of all Morouna features, navigation, and Saudi banking concepts
- Guides users on "how to" use features without executing actions
- Instant answers to feature discovery, troubleshooting, and best practices

Additional AI features include rules-based portfolio risk analysis, bank concentration monitoring, LTV tracking, email notifications via SendGrid, and user-configurable alert thresholds.

## Data Storage Architecture
The database schema is tailored for the Saudi banking context, storing information on Banks, Facilities, Loans (with SIBOR calculations), Collateral (with valuation history), Users, and Sessions. It uses UUID primary keys and proper foreign key relationships.

## Mobile-First Design
The application is optimized for mobile devices with responsive breakpoints, touch-friendly elements, mobile-specific navigation, and optimized form layouts for a seamless experience across devices. Mitigation for mobile hover persistence issues includes instant transitions and strong active state visual feedback.

## Admin Portal
A comprehensive admin portal with its own authentication provides system oversight. Features include a dashboard for real-time statistics, analytics for platform usage and loan trends, user management with activity logs, database management, security monitoring, system alerts, global settings, and email template management. Security is maintained with separate authentication and Bearer token-based API protection.

## Key Features
The system supports bank-level collateral assignment, optional facility durations, and a revolving period tracking system. User settings include daily alerts configuration, a feature showcase, and user tips.

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL.
- **Drizzle Kit**: Database migration and schema management.

## Authentication & Session Management
- **Replit Auth**: OpenID Connect provider for main app authentication.
- **Supabase Auth**: Email-based authentication with 2FA OTP support.
- **Passport.js**: Authentication middleware.
- **connect-pg-simple**: PostgreSQL session store.

## AI & Intelligence Services
- **DeepSeek API**: External AI service for advanced insights.
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

## Development & Build Tools
- **Vite**: Build tool and development server.
- **TypeScript**: Type safety.
- **ESBuild**: JavaScript bundler.
- **PostCSS**: CSS processing.

## Saudi Market Integrations
- **SIBOR Rate API**: Integration for real-time SIBOR data.
- **Saudi Banks Database**: Pre-configured major Saudi banks.
- **SAR Currency Formatting**: Saudi Riyal currency display.