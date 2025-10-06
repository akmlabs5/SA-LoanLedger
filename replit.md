# Overview

This platform is a full-stack loan management system tailored for the Saudi Arabian market, integrating SIBOR-based calculations and AI-driven insights. It helps users manage loan portfolios by providing tools for risk management, concentration alerts, and LTV monitoring. The system handles bank facilities, collateral tracking, and the full loan lifecycle, all within a mobile-responsive design. Its core purpose is to offer intelligent insights for financial portfolio optimization, specifically targeting the unique requirements of the Saudi banking sector.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client-side is a React TypeScript single-page application, using Wouter for routing, TanStack Query for state management, and Shadcn/ui (built on Radix UI) for components. Styling is handled by Tailwind CSS with a Saudi-themed color scheme and mobile-first design. Forms use React Hook Form with Zod validation, and Recharts is used for data visualization.

## Backend Architecture
The server is built with Express.js, utilizing Drizzle ORM with Neon (PostgreSQL) for type-safe database operations. Authentication is managed via Replit Auth (OpenID Connect) and Passport.js, with PostgreSQL-backed sessions. It follows a REST API pattern, organizing endpoints by resource, and includes a storage abstraction layer for maintainability.

## AI Intelligence System
The platform incorporates a rules-based AI for intelligent insights, including portfolio risk analysis (bank concentration, LTV monitoring), and email notifications for loan due dates via SendGrid. It integrates with DeepSeek API for advanced insights and operates on user-configurable thresholds to provide actionable recommendations. Key AI features include a Smart Loan Matcher, What-If Scenario Analysis, a Natural Language Query System, Auto-Categorized Daily Alerts, and the ability to attach files to AI chat for context enrichment.

## Data Storage Architecture
The database schema is designed for the Saudi banking context, storing information on Banks (pre-populated), Facilities, Loans (with SIBOR calculations), Collateral (with valuation history), Users (via Replit Auth), and Sessions. It uses UUID primary keys and proper foreign key relationships.

## Mobile-First Design
The application is optimized for mobile devices with responsive breakpoints, touch-friendly elements, mobile-specific navigation, and optimized form layouts, ensuring a seamless experience across devices.

## Admin Portal
A separate, isolated admin portal with its own authentication system provides system stats, user management, and maintenance controls. It features a 3D animated authentication interface and robust security architecture.

## Key Features
- **Bank-Level Collateral Assignment**: Collateral can be assigned to specific facilities or total bank exposure for flexible risk management.
- **Optional Facility Duration**: Facilities can be configured without fixed expiry dates.
- **Revolving Period Tracking System**: Optional tracking of cumulative usage days for facilities with revolving credit.
- **User Settings Enhancements**: Includes daily alerts configuration, a feature showcase, and user tips.

# API Keys & Configuration Status

## Currently Configured ✓
- **DATABASE_URL**: PostgreSQL database connection (Neon)
- **SESSION_SECRET**: Express session encryption
- **REPLIT_DOMAINS**: Replit authentication domain
- **REPL_ID**: Replit application ID

## Optional Services (Not Configured)
- **SUPABASE_URL**: Supabase authentication service (optional alternative auth)
- **SUPABASE_ANON_KEY**: Supabase anonymous key for client-side auth
- **SENDGRID_API_KEY**: Email notifications for loan due dates and alerts
- **DEEPSEEK_API_KEY**: Advanced AI insights and natural language queries
- **ADMIN_USERNAME**: Admin portal username (defaults to 'admin')
- **ADMIN_PASSWORD**: Admin portal password (defaults to 'admin123')

## Infrastructure Improvements (Completed)
- **Centralized Configuration**: All environment variables validated on startup with clear error messages
- **Modular Architecture**: Server code organized into focused modules (auth, banks, loans, facilities, admin, etc.)
- **Graceful Degradation**: Optional services fail gracefully with informative warnings
- **Enhanced Security**: Production-specific validations and development mode safeguards

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL.
- **Drizzle Kit**: Database migration and schema management.

## Authentication & Session Management
- **Replit Auth**: OpenID Connect provider.
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