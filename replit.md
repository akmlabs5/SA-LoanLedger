# Overview

This is a comprehensive loan management platform specifically designed for the Saudi Arabian market. The system is a full-stack web application that enables users to manage loan portfolios with SIBOR (Saudi Interbank Offered Rate) based calculations. It features intelligent Rules-Based AI insights for portfolio risk management, concentration alerts, and LTV (Loan-to-Value) monitoring. The platform is mobile-responsive and designed to handle complex financial data including bank facilities, collateral tracking, and loan lifecycle management.

## Recent Updates - October 2, 2025

### User Settings Enhancements
- **Daily Alerts Settings Tab**: Complete configuration interface for personalized email alerts. Features enable/disable toggle, time picker (08:00-20:00), priority-based category selection (Critical/High/Medium/Low with color-coded badges), and customizable thresholds for concentration (40%), LTV (70%), utilization (80%), and revolving period (80%). Includes "Send Test Email" button for immediate digest preview. Form rehydrates with saved preferences and shows loading skeleton during data fetch. Database table `dailyAlertsPreferences` stores user-specific settings.
- **Feature Showcase Tab**: Comprehensive platform capabilities overview organized into 4 sections: (1) Core Features - Bank Management, Facility Tracking, Loan Lifecycle, Collateral Tracking, Document Management, Reminder System, (2) AI-Powered Features - AI Chat Assistant, Smart Loan Matcher, What-If Scenarios, Natural Language Queries, Daily Alerts, PDF Export, (3) Analytics & Insights - Portfolio Dashboard, Bank Performance, Exposure Tracking, LTV Monitoring, SIBOR Integration, Mobile-First Design, (4) Coming Soon - Arabic Language Support, Advanced Reporting, Multi-Currency, API Integration. Features 22 total cards with lucide-react icons, responsive grid layout (1/2/3 columns), and "Coming Soon" badges.
- **User Tips Tab**: Interactive guidance and best practices organized into 5 sections: (1) Quick Start Guide with 5 numbered steps for new users, (2) Keyboard Shortcuts covering navigation, quick actions, forms, and search, (3) Best Practices for collateral, reminders, risk monitoring, and portfolio optimization, (4) Pro Tips for advanced AI features and smart workflows, (5) Mobile Usage tips for responsive touch-friendly navigation. Each section features appropriate icons and scannable content for quick reference.
- **API Endpoints**: GET/POST `/api/user/daily-alerts-preferences` for loading and saving user alert preferences with proper authentication and validation.

### Advanced AI Features Completed
- **File Attachments for AI Chat**: Upload PDF, DOCX, TXT, XLSX files to AI conversations with automatic text extraction for context enrichment. Metadata stored in database with 10MB file size limit. Extracted text seamlessly included in AI chat context.
- **PDF Export for Conversations**: One-click export of AI conversation history to professionally formatted PDF documents with proper pagination, metadata headers (title, date, message count), and timestamped message formatting. Export button appears in chat header for conversations with messages.
- **Smart Loan Matcher**: AI-powered facility recommendation engine using 100-point scoring algorithm. Analyzes available credit (40pts), current utilization (20pts), interest rates (20pts), facility type match (10pts), and revolving period availability (10pts). Returns top recommendation with detailed reasons/warnings plus 2 alternatives for comparison. Integrated as quick action button on dashboard.
- **What-If Scenario Analysis**: Comprehensive financial simulation tool for loan optimization. Three scenario types: (1) Refinancing - calculates savings from different interest rates, (2) Early Payment - models full/partial prepayment impact with timeline-aware calculations, (3) Term Change - explores extending/reducing loan duration. Results display color-coded savings/costs with percentage impact badges and plain-language recommendations. Includes input validation and zero-interest guards. Accessible from loan detail page for active loans.
- **Natural Language Query System**: Instant portfolio insights through natural language questions. Handles 6 query categories: bank exposure, due dates, interest rates, portfolio metrics, LTV ratios, and facility availability. Pattern-based matching translates questions like "What's my exposure to ANB?" into structured data queries. Returns formatted answers with supporting data. API endpoint `/api/ai/natural-query` provides sub-second responses without AI model latency. Filters loans with invalid interest rates to prevent calculation errors.
- **Auto-Categorized Daily Alerts**: Intelligent portfolio monitoring with email digest delivery. Analyzes 8 alert types: (1) Overdue loans - Critical, (2) Facilities expiring within 7 days - Critical, (3) Loans due within 7 days - High, (4) High facility utilization >80% - High, (5) Bank concentration risk >40% - Medium, (6) Portfolio LTV >70% - Medium, (7) Revolving period >80% used - Medium, (8) Loans due within 30 days - Low. Status-aware detection excludes settled/cancelled loans. Zero-division guards for facility limits and revolving periods. HTML email digest with color-coded severity sections. API endpoints `/api/ai/daily-alerts` (view) and `/api/ai/daily-alerts/send` (email) for manual triggers. Gracefully degrades without SendGrid configuration.

## Previous Updates - October 1, 2025

### Optional Facility Duration
- **Flexible Term Toggle**: Added "Fixed Duration" toggle to facility creation - enables facilities without fixed expiry dates
- **Database Schema**: Made `expiryDate` optional in facilities table for flexible-term facilities
- **Smart Validation**: Expiry date only required when "Fixed Duration" is enabled
- **UX Enhancement**: Clear visual indicators showing "Flexible Term" for facilities without expiry dates
- **Use Case**: Enables facilities that can be terminated upon negotiation with the bank rather than fixed-term arrangements

### Bank Linkage Architecture Fix
- **Direct Facility Relationship**: Loans now access bank information directly via `loan.facility.bank` instead of the indirect `loan.creditLine.facility.bank` path
- **Schema Enhancement**: Added direct facility relation to loansRelations in schema.ts for cleaner data access
- **Type Safety**: Updated IStorage interfaces and LoanWithDetails type to reflect actual nested return structures
- **Comprehensive Update**: Fixed all frontend components (loans list, detail pages, charts) and backend logic (routes, AI insights, dashboard)
- **Resolved "Unknown Bank" Bug**: Loans with facilityId but no creditLineId now correctly display bank information
- **Backward Compatible**: Retained creditLine relationship for legacy support while prioritizing direct facility access

### Revolving Period Tracking System
- **Optional Revolving Tracking**: Facilities can now track cumulative usage days across all loans (e.g., 360-day annual limits)
- **Flexible Configuration**: Configurable maximum revolving period per facility, not hardcoded
- **Visual Tracker Component**: Color-coded progress widget (green/yellow/red) showing days used, remaining, and status
- **Intelligent Validation**: Loan creation automatically checks remaining days and blocks if exceeded
- **Database Schema**: Added `enableRevolvingTracking`, `maxRevolvingPeriod`, and `initialDrawdownDate` fields to facilities table
- **API Endpoint**: `/api/facilities/:facilityId/revolving-usage` calculates cumulative days with proper date handling
- **Bank Detail Integration**: Tracker displays automatically for facilities with tracking enabled
- **Backward Compatible**: Completely optional feature that doesn't affect existing simple facilities

## Previous Updates - September 28, 2025

### Complete Admin Portal System
- **Separate Admin Portal**: Implemented completely isolated admin portal with its own authentication system at `/admin-portal/login`
- **3D Animated Authentication**: Beautiful red/orange themed 3D authentication interface with glassmorphism effects, light beams, and mouse tracking animations
- **Admin Security Architecture**: Comprehensive security system with session-based authentication, route guards, and proper authorization middleware
- **Admin Dashboard**: Full-featured dashboard with system stats, user management, and maintenance controls
- **Admin User Management**: Interface for viewing and managing regular users with loan portfolio summaries
- **Authentication Isolation**: Admin authentication completely separated from regular user auth system using dedicated credentials (username: 'admin', password: 'admin123')
- **Session Management**: 24-hour session expiry with proper token validation and automatic cleanup
- **API Security**: Protected admin endpoints with Bearer token authentication and proper middleware validation

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client-side is built as a single-page application using React with TypeScript. It implements a component-based architecture using:
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: Shadcn/ui components built on top of Radix UI primitives
- **Styling**: Tailwind CSS with custom Saudi-themed color scheme and mobile-first responsive design
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Charts**: Recharts library for portfolio visualization and analytics

The frontend follows a page-based structure with dedicated views for dashboard, loans, banks, and collateral management. Authentication state is managed through custom hooks that integrate with the backend auth system.

## Backend Architecture
The server is built with Express.js and follows a REST API pattern with the following architectural decisions:
- **Database Layer**: Drizzle ORM with PostgreSQL (specifically Neon serverless) for type-safe database operations
- **Authentication**: Replit Auth integration using OpenID Connect with passport.js for session management
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple for scalability
- **API Structure**: RESTful endpoints organized by resource (loans, facilities, banks, collateral) with consistent response patterns
- **Middleware**: Request logging, JSON parsing, and authentication guards

The server implements a storage abstraction layer to separate business logic from database operations, making the code more maintainable and testable.

## AI Intelligence System
The platform includes a rules-based AI system that generates intelligent insights:
- **Portfolio Risk Analysis**: Monitors bank concentration risk with configurable thresholds
- **LTV Monitoring**: Tracks loan-to-value ratios against collateral values
- **Email Notifications**: SendGrid integration for loan due date alerts
- **DeepSeek API Integration**: External AI service for advanced insights (configurable)

The AI system operates on user-configurable thresholds and generates actionable recommendations for portfolio optimization.

## Data Storage Architecture
The database schema is designed around the Saudi banking context:
- **Banks**: Pre-populated with major Saudi banks (ANB, SABB, Al Rajhi, etc.)
- **Facilities**: Credit lines and loan facilities linked to specific banks
- **Loans**: Individual loan instances tied to facilities with SIBOR-based calculations
- **Collateral**: Asset tracking with valuation history for LTV calculations
- **Users**: Replit Auth integration with profile management
- **Sessions**: Secure session storage for authentication persistence

The schema uses UUID primary keys and includes proper foreign key relationships with cascade behaviors.

## Mobile-First Design
The application is optimized for mobile devices with:
- Responsive breakpoints using Tailwind CSS
- Touch-friendly interface elements
- Mobile-specific navigation patterns
- Optimized form layouts for small screens
- Progressive enhancement for desktop features

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL database with connection pooling
- **Drizzle Kit**: Database migration and schema management tool

## Authentication & Session Management
- **Replit Auth**: OpenID Connect authentication provider
- **Passport.js**: Authentication middleware for Node.js
- **connect-pg-simple**: PostgreSQL session store for Express sessions

## AI & Intelligence Services
- **DeepSeek API**: External AI service for advanced portfolio insights and recommendations
- **SendGrid**: Email service for loan due notifications and alerts

## UI & Frontend Libraries
- **Shadcn/ui**: Component library built on Radix UI primitives
- **Radix UI**: Headless UI components for accessibility and functionality
- **Tailwind CSS**: Utility-first CSS framework for styling
- **TanStack Query**: Server state management and data fetching
- **Wouter**: Lightweight client-side routing
- **React Hook Form**: Form state management with validation
- **Zod**: TypeScript-first schema validation
- **Recharts**: Chart library for data visualization

## Development & Build Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Type safety across the entire application
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind and Autoprefixer

## Saudi Market Integrations
- **SIBOR Rate API**: Integration for real-time Saudi Interbank Offered Rate data
- **Saudi Banks Database**: Pre-configured list of major Saudi banks and their codes
- **SAR Currency Formatting**: Saudi Riyal currency display and calculations