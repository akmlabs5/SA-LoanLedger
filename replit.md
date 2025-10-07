# Overview

**Morouna Loans** is a full-stack loan management system tailored for the Saudi Arabian market, integrating SIBOR-based calculations and AI-driven insights. It helps users manage loan portfolios by providing tools for risk management, concentration alerts, and LTV monitoring. The system handles bank facilities, collateral tracking, and the full loan lifecycle, all within a mobile-responsive design. Its core purpose is to offer intelligent insights for financial portfolio optimization, specifically targeting the unique requirements of the Saudi banking sector.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client-side is a React TypeScript single-page application, using Wouter for routing, TanStack Query for state management, and Shadcn/ui (built on Radix UI) for components. Styling is handled by Tailwind CSS with a Saudi-themed color scheme and mobile-first design. Forms use React Hook Form with Zod validation, and Recharts is used for data visualization.

## Backend Architecture
The server is built with Express.js, utilizing Drizzle ORM with Neon (PostgreSQL) for type-safe database operations. Authentication is managed via dual systems: Replit Auth (OpenID Connect) with Passport.js for standard authentication, and Supabase Auth for enhanced security with email-based Two-Factor Authentication (2FA). PostgreSQL-backed sessions ensure scalability. It follows a REST API pattern, organizing endpoints by resource, and includes a storage abstraction layer for maintainability.

## Authentication UI
The platform features a unified login page with a vibrant green-themed design inspired by the Morouna brand:
- **Single Login Form**: One unified form that automatically detects whether credentials are for a user (email) or admin (username)
- **User Authentication**: Email/password login with 2FA OTP verification for enhanced security via SendGrid
- **Admin Authentication**: Username/password login for administrative access (automatically detected)
- **Morouna Branding**: Vibrant green gradient background (from-emerald-400 via-green-500 to-teal-600)
- **Logo Display**: Prominent Morouna waveform logo at the top with brand name "Morouna Loans"
- **Tagline**: "Manage Your Financial Journey"
- **Modern Design**: Rounded inputs, cyan gradient buttons, and shadow effects inspired by modern fitness apps

## AI Intelligence System
The platform incorporates a rules-based AI for intelligent insights, including portfolio risk analysis (bank concentration, LTV monitoring), and email notifications for loan due dates via SendGrid. It integrates with DeepSeek API for advanced insights and operates on user-configurable thresholds to provide actionable recommendations. Key AI features include a Smart Loan Matcher, What-If Scenario Analysis, a Natural Language Query System, Auto-Categorized Daily Alerts, and the ability to attach files to AI chat for context enrichment.

## Data Storage Architecture
The database schema is designed for the Saudi banking context, storing information on Banks (pre-populated), Facilities, Loans (with SIBOR calculations), Collateral (with valuation history), Users (via Replit Auth), and Sessions. It uses UUID primary keys and proper foreign key relationships.

## Mobile-First Design
The application is optimized for mobile devices with responsive breakpoints, touch-friendly elements, mobile-specific navigation, and optimized form layouts, ensuring a seamless experience across devices.

### Mobile Touch Optimizations (October 2025)
- **Fixed Sticky Hover Issue**: Resolved the double-click problem on mobile where buttons and tabs showed hover states on first tap
- **Solution**: Implemented `@media (hover: none)` CSS rule to disable hover effects on touch-only devices
- **Touch Feedback**: Added `active:scale-[0.98]` for visual feedback on tap
- **Enhanced Responsiveness**: All interactive elements use `touch-action: manipulation` to prevent double-tap zoom delays

### Mobile Layout Overflow Fixes (October 2025)
- **Global Overflow Prevention**: Added `overflow-x: hidden` to body element to prevent horizontal scrolling
- **Dashboard Header Optimization**: 
  - Implemented flex-wrap on Quick Access controls for proper wrapping on small screens
  - Changed Select width from fixed `w-48` to responsive `w-40 sm:w-48`
  - Added `whitespace-nowrap` to prevent text wrapping on labels, badges, and timestamps
  - Replaced `space-x-*` with `gap-*` utilities for better flex-wrap behavior
- **Responsive Spacing**: Consistent use of responsive gaps (`gap-2 sm:gap-3`) throughout header sections
- **Content Containment**: All elements now properly fit within viewport boundaries on mobile devices

### Development Cache-Busting System (October 2025)
Implemented a comprehensive cache-busting solution to ensure latest code changes are immediately visible during development:

**Development Mode (auto-enabled when NODE_ENV=development)**:
- Service worker registration completely disabled to prevent caching interference with HMR
- Automatic cache clearing on app startup: unregisters any lingering service workers and deletes all `morouna-*` caches
- Aggressive HTTP cache-control headers: `no-store, no-cache, must-revalidate` on all HTML/JS responses
- Cache-busting meta tags in index.html to prevent browser-level caching
- Visible version badge (v2.0.3) on dashboard for instant verification of loaded version

**Production Mode (auto-enabled when built for production)**:
- Service worker registered with stable version query parameter (`/sw.js?v=v1.0.2`)
- Full PWA functionality preserved with offline support and asset caching
- Stable worker registration prevents thrashing and maintains offline behavior

**Version Management**:
- **CRITICAL**: When releasing new versions, update both `SW_VERSION` in `client/src/main.tsx` and `CACHE_VERSION` in `client/public/sw.js` to the same value
- Version format: `v1.0.X` where X increments for each release
- Current version: `v1.0.2`

## Admin Portal
A comprehensive admin portal with its own authentication system provides complete system oversight and management. Features include:

### Core Functionality (Phase 1 & 2 Complete)
- **Dashboard**: Real-time system statistics, activity feed, and health monitoring
- **Analytics**: Platform usage metrics, loan trends, bank distribution charts with Recharts visualizations
- **User Management**: All users overview and detailed activity logs with filtering, pagination, and CSV export
- **Database Management**: Health monitoring, connection status, table statistics, recent queries, and backup controls
- **Security Monitor**: Failed login tracking, access logs, active admin sessions, and security settings
- **System Alerts**: Alert dashboard with error/warning/info notifications and acknowledgment functionality
- **System Settings**: Global configuration for email, AI, features, and maintenance mode
- **Email Templates**: Custom template management for notifications and reminders

### Security & Privacy
- Separate authentication system with Bearer token-based API protection
- All admin endpoints secured with `isAdminAuthenticated` middleware
- Privacy-safe activity logging that excludes sensitive loan/bank details
- Try-catch fallback for iframe navigation during development
- 3D animated authentication interface with gradient design

### Navigation & UX
- Organized sidebar with grouped navigation (Dashboard, User Management, System Control)
- Responsive mobile-first design matching the main application
- Real-time data updates with TanStack Query
- Loading states and skeletons for better UX

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

## Supabase Authentication (2FA Service) - CONFIGURED ✓
- **SUPABASE_URL**: Supabase project URL (configured)
- **SUPABASE_ANON_KEY**: Supabase anonymous key for client-side auth (configured)
- **SUPABASE_SERVICE_ROLE_KEY**: Server-side admin key (configured)
- **Status**: Full 2FA implementation with email-based OTP verification
- **Features**: Sign-up, sign-in with 2FA, OTP verification, 2FA toggle in user settings
- **Email Service**: Uses SendGrid via noreply@akm-labs.com for OTP delivery
- **Database Integration**: User 2FA preferences stored in PostgreSQL users table

## Optional Services (Not Configured)
- **DEEPSEEK_API_KEY**: Advanced AI insights and natural language queries
- **ADMIN_USERNAME**: Admin portal username (defaults to 'admin')
- **ADMIN_PASSWORD**: Admin portal password (defaults to 'admin123')

## Email Service (SendGrid) - CONFIGURED ✓
- **SENDGRID_API_KEY**: Email service API key (configured)
- **SENDGRID_FROM_EMAIL**: Sender email address (defaults to 'reminders@aim-labs.com')
- **Status**: Live email reminders ready to send
- **Verified Sender**: reminders@aim-labs.com (Single Sender Verification complete)
- **Domain Authentication**: Recommended for production (DNS CNAME records required)
- **Email Templates**: 4 default templates available in admin portal
- **Features Enabled**: Loan due date reminders, AI alerts, daily alert digest

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
- **Replit Auth**: OpenID Connect provider for main app authentication.
- **Supabase Auth**: Email-based authentication with built-in 2FA OTP support.
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