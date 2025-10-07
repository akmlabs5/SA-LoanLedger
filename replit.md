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
The platform features a unified login page with a green-themed design, automatically detecting user (email) or admin (username) credentials. User authentication includes email/password login with 2FA OTP verification via SendGrid, while admin authentication uses username/password. The design incorporates Morouna branding, a tagline, rounded inputs, and cyan gradient buttons.

## AI Intelligence System
A rules-based AI provides intelligent insights, including portfolio risk analysis (bank concentration, LTV monitoring) and email notifications via SendGrid. It integrates with DeepSeek API for advanced insights and operates on user-configurable thresholds, offering features like a Smart Loan Matcher, What-If Scenario Analysis, Natural Language Query System, Auto-Categorized Daily Alerts, and file attachment to AI chat.

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