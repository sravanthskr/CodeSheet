# Overview

This is a modern full-stack web application for managing coding practice problems, designed as a comprehensive learning platform similar to competitive programming sheets. The application provides a clean, minimal interface for users to track their progress through various problem sets including Data Structures & Algorithms (DSA), SQL, System Design, and Web Development. It features a robust authentication system with Firebase, responsive design with dark/light theme support, and admin capabilities for content management including bulk CSV/JSON imports.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client-side is built with React 18 and TypeScript, utilizing a modern component-based architecture:

- **UI Framework**: React with TypeScript for type safety and better developer experience
- **Styling**: Tailwind CSS with shadcn/ui components for consistent, accessible design patterns
- **State Management**: Zustand for lightweight, modular state management across authentication, problems, and theme stores
- **Routing**: Wouter for client-side routing with a minimal footprint
- **Data Fetching**: TanStack Query for server state management and caching
- **Build Tool**: Vite for fast development and optimized production builds

The architecture follows a modular pattern with separate stores for different concerns (auth, problems, theme) and reusable UI components from the shadcn/ui library.

## Backend Architecture
The server-side uses Node.js with Express in a minimalist setup:

- **Framework**: Express.js with TypeScript for API routes
- **Development**: Hot reloading with Vite integration for seamless full-stack development
- **Storage Interface**: Abstracted storage layer with in-memory implementation (designed for easy database integration)
- **API Design**: RESTful endpoints under `/api` prefix with structured error handling

The backend is architected with a clean separation between route handlers and storage logic, making it easy to swap storage implementations.

## Database Design
Currently uses an in-memory storage implementation with a well-defined interface:

- **User Management**: User profiles with authentication state, progress tracking, and role-based access
- **Problem Management**: Structured problem data with categorization by topic, difficulty, and sheet type
- **Progress Tracking**: User-specific solved problems, starred items, and notes
- **Schema**: Drizzle ORM configured for PostgreSQL with proper migrations support

The database schema is designed for scalability with proper relationships between users and their progress data.

## Authentication System
Firebase Authentication integration provides secure user management:

- **Multi-Provider Support**: Email/password and Google OAuth authentication
- **User Profiles**: Stored in Firestore with role-based access control (admin/user)
- **Progress Tracking**: Real-time synchronization of user progress across devices
- **Security**: Firebase handles authentication tokens and session management

## Theme System
Comprehensive theming with system preference detection:

- **Theme Options**: Light, dark, and system-based theme switching
- **CSS Variables**: Uses CSS custom properties for consistent theming across components
- **Persistence**: Theme preferences stored in localStorage
- **System Integration**: Automatically detects and responds to system theme changes

## Component Architecture
Modular component design with clear separation of concerns:

- **UI Components**: Reusable shadcn/ui components with consistent styling
- **Business Logic**: Custom hooks and stores handle application state
- **Form Handling**: React Hook Form with Zod validation for type-safe forms
- **Responsive Design**: Mobile-first approach with Tailwind CSS responsive utilities

# External Dependencies

## Firebase Services
- **Firebase Authentication**: User authentication with email/password and Google OAuth
- **Firestore Database**: User profiles, progress tracking, and application data storage
- **Firebase SDK**: Client-side integration for real-time data synchronization

## Database and ORM
- **PostgreSQL**: Primary database (configured via Drizzle)
- **Drizzle ORM**: Type-safe database operations with automatic migration support
- **Neon Database**: Serverless PostgreSQL integration

## UI and Styling
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Radix UI**: Accessible component primitives for complex UI elements
- **Lucide React**: Consistent icon set throughout the application
- **shadcn/ui**: Pre-built accessible component library

## Development Tools
- **Vite**: Fast build tool with hot module replacement
- **TypeScript**: Type safety across the entire application
- **ESBuild**: Fast JavaScript bundler for production builds

## Data Processing
- **Papa Parse**: CSV parsing for bulk problem imports
- **Date-fns**: Date manipulation and formatting utilities

## State Management and Queries
- **Zustand**: Lightweight state management for client-side state
- **TanStack Query**: Server state management with caching and synchronization
- **React Hook Form**: Form state management with validation

## Session Management
- **Connect PG Simple**: PostgreSQL session store for Express sessions
- **Express Session**: Session middleware for user authentication state