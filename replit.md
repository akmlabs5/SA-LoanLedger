# Overview

This is a comprehensive loan management platform specifically designed for the Saudi Arabian market. The system is a full-stack web application that enables users to manage loan portfolios with SIBOR (Saudi Interbank Offered Rate) based calculations. It features intelligent Rules-Based AI insights for portfolio risk management, concentration alerts, and LTV (Loan-to-Value) monitoring. The platform is mobile-responsive and designed to handle complex financial data including bank facilities, collateral tracking, and loan lifecycle management.

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