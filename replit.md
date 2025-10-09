# Overview

Morouna Loans is a full-stack loan management system designed for the Saudi Arabian market. It integrates SIBOR-based calculations and AI-driven insights to help users manage loan portfolios, offering tools for risk management, concentration alerts, and LTV monitoring. The system handles bank facilities, collateral tracking, and the entire loan lifecycle, all within a mobile-responsive design. Its core purpose is to provide intelligent insights for financial portfolio optimization, specifically addressing the unique requirements of the Saudi banking sector.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is a React TypeScript single-page application using Wouter for routing, TanStack Query for state management, and Shadcn/ui (built on Radix UI) for components. Styling is managed with Tailwind CSS, featuring a Saudi-themed color scheme and mobile-first design. Forms utilize React Hook Form with Zod validation, and Recharts is used for data visualization.

**Unified Date Picker System:**
- All forms use ModernDatePicker component (@ark-ui/react date-picker) for consistent UI/UX
- Beautiful dropdown calendar with year/month selectors, navigation controls, and clear button
- Replaces all native HTML date inputs across 13+ pages (collateral, facility, guarantee, loan, payment, reports, bank, history forms)
- Consistent props API: `value`, `onChange`, `placeholder`, `dataTestId`
- Fully accessible with proper ARIA labels and keyboard navigation

## Backend Architecture
The backend is built with Express.js, employing Drizzle ORM with Neon (PostgreSQL) for type-safe database operations. Authentication uses Replit Auth (OpenID Connect) with Passport.js and Supabase Auth for email-based Two-Factor Authentication (2FA). PostgreSQL-backed sessions ensure scalability. It follows a REST API pattern with an organized endpoint structure and a storage abstraction layer.

## Authentication UI
The platform features a unified login page with a green-themed design, automatically detecting user (email) or admin (username) credentials. User authentication includes email/password login with optional 2FA OTP verification via SendGrid, while admin authentication uses username/password. 

**Signup Experience:**
- **Transparent Logo**: Clean white transparent logo (noBgWhite_1759919560002.png) displayed in circular container on all auth pages
- **Account Type Selection**: Radio buttons for Personal or Organization accounts with clear white indicator when selected
- **Visual Indicators**: Bright white circular indicator dot visible when account type is selected
- **Two-Factor Authentication**: Optional 2FA toggle with Shield icon for enhanced security
- **Professional Forms**: Clean green-themed design with rounded inputs, icon-decorated fields, and proper validation
- **Preferences Storage**: All signup preferences (2FA, account type, organization name) saved to database and enforced on login

The design incorporates "Morouna Loans by AKM Labs" branding, emerald gradient backgrounds, and mobile-responsive layouts.

## Multi-Tenant Team Collaboration
The platform now supports organizational team collaboration, enabling 2-5 members to work together on shared loan portfolios with complete data isolation between organizations.

**Organization Types:**
- **Personal**: Individual account with private data
- **Organization**: Team account with shared access (owner + up to 4 members)

**Team Management Features:**
- **Invitation System**: Owners send email invitations via SendGrid with secure token-based acceptance
- **Role-Based Access**: Owner role with exclusive permissions (invite, remove members); Member role with full portfolio access
- **Team Settings**: Dedicated tab in user settings showing organization info, member list, invite form, and pending invitations
- **Invitation Flow**: Token-based links with validation, expiration (7 days), and consent-respecting acceptance (no forced auto-join)
- **Member Removal**: Owners can remove members; automatic cleanup of user's organization association
- **Account Protection**: Prevents organization owners from deleting accounts when other members exist

**Data Isolation:**
- All loan, facility, collateral, guarantee, and bank data is scoped by `organizationId`
- SQL-level enforcement via WHERE clauses on all queries
- Cross-tenant data access blocked by organization middleware
- API routes validate organization context on all mutations
- AI Agent operations respect organization boundaries
- Route-level validation ensures loans/facilities belong to requesting organization before access
- Critical fixes applied: facility creation, loan settlement, AI insights, and report generation now properly enforce organizational boundaries
- **Report Security (Oct 2025)**: PDF/Excel export endpoints now filter all data by organizationId to prevent cross-tenant data leakage

**User Context:**
- User session includes `organizationId`, `organizationName`, and `isOwner` flags
- Frontend components conditionally render owner-only actions
- Organization context automatically attached to all authenticated requests

**Security Model:**
- Token-based invitation system with email verification
- Email matching enforced on invitation acceptance  
- Organization ownership checks on all privileged operations
- Complete data isolation prevents cross-tenant attacks
- Facility ownership validation blocks cross-organization spoofing

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

**Email Reminders & Calendar Invites:**
- Loan reminders sent via SendGrid with customizable templates
- Optional calendar invite (.ics file) attachment when enabled
- "Add to Calendar" button in reminder emails for one-click calendar integration
- Compatible with Google Calendar, Outlook, Apple Calendar, and other iCalendar-compatible apps
- Automatic event details: loan reference, amount, due date, and bank information

## Data Storage Architecture
The database schema is tailored for the Saudi banking context, storing information on Banks, Facilities, Loans (with SIBOR calculations), Collateral (with valuation history), Users, and Sessions. It uses UUID primary keys and proper foreign key relationships.

## Mobile-First Touch Redesign
The application features a complete touch-first mobile redesign that eliminates hover dependencies entirely. The mobile experience uses native app patterns with:

**Mobile Navigation:**
- Bottom tab bar with 5 tabs: Dashboard, Loans, Banks, AI, More
- Fixed positioning at bottom-0 (h-16) with proper z-indexing
- Active tab indicators with Saudi green accent color
- MobileLayout wrapper that conditionally renders mobile UI for viewports <1024px

**Touch-First UI Patterns:**
- Card-based layouts replace tables on mobile
- Action sheets (bottom slide-up) replace dropdown menus
- Floating Action Buttons (FAB) for quick actions positioned at bottom-20
- Horizontal scrolling metrics with snap points
- 48px minimum touch targets throughout
- Active (pressed) states only - zero hover states on mobile
- Active feedback: active:scale-[0.96-0.98], active:bg-accent/50

**Page-Specific Mobile Optimizations:**
- **Dashboard**: Horizontal scrolling stat cards, condensed bank/loan cards, hidden charts on mobile
- **Loans**: Swipeable loan cards, ActionSheet for loan actions, FAB for create loan
- **Banks**: Expandable facility sections, ActionSheet for bank actions, condensed metrics
- **AI Chat**: Full-screen mobile chat, input at bottom-16, FloatingAgentChat at bottom-24, visible delete buttons
- **More/Settings**: Native app-style settings list with profile section and grouped options

**Mobile Components Library** (`client/src/components/mobile/`):
- BottomTabBar: 5-tab navigation system
- MobileHeader: Page headers with back button and actions
- ActionSheet: Bottom slide-up menu system
- FloatingActionButton: Quick action FAB component
- MobileLayout: Conditional mobile wrapper

**Responsive Breakpoint:** Mobile UI renders for `<lg` breakpoint (< 1024px), desktop UI completely unchanged for `≥lg` breakpoint.

**Critical Fix - Single-Tap Interactions:**
- Removed global touch event listeners from AppLayout that were causing React re-renders on every tap
- Previous issue: First tap triggered state update → re-render → onClick handler lost; second tap worked
- Solution: Eliminated global `touchstart`/`touchend` listeners that called `setTouchStart()` on every interaction
- Result: All buttons, links, tabs, and interactive elements now respond to single tap across all mobile browsers
- Note: Swipe-to-open sidebar removed in favor of bottom tab navigation and hamburger menu

## Admin Portal
A comprehensive admin portal with its own authentication provides system oversight. Features include a dashboard for real-time statistics, analytics for platform usage and loan trends, user management with activity logs, database management, security monitoring, system alerts, global settings, and email template management. Security is maintained with separate authentication and Bearer token-based API protection.

## Key Features
The system supports bank-level collateral assignment, optional facility durations, and a revolving period tracking system. User settings include daily alerts configuration, a feature showcase, and user tips.

**Loan Creation Flexibility:**
- Users can create loans that exceed facility credit limits (over-limit drawdowns allowed)
- System shows a warning notification when loan amount exceeds available credit, but allows proceeding
- This enables overdraft scenarios and flexible credit management while keeping users informed

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