
# CodeSheet

A modern full-stack web application for managing coding practice problems, designed as a comprehensive learning platform for competitive programming practice. Track your progress through various problem sets including Data Structures & Algorithms (DSA), SQL, System Design, and Web Development.

## Features

- **Multi-Category Problem Sets**: DSA, SQL, System Design, and Web Development problems
- **Progress Tracking**: Mark problems as solved, star favorites, and add personal notes
- **Authentication System**: Secure user management with Firebase Authentication (email/password and Google OAuth)
- **Admin Panel**: Bulk import problems via CSV/JSON files
- **Responsive Design**: Mobile-first approach with dark/light theme support
- **Real-time Sync**: Progress synchronized across devices using Firestore
- **Clean Interface**: Minimal, accessible design inspired by competitive programming platforms

##  Live Demo

The website is deployed at render and accessible [here](https://codesheet.onrender.com/)

## Tech Stack

### Frontend
- **React** with TypeScript for type safety
- **Tailwind CSS** for styling with **shadcn/ui** component library
- **Zustand** for state management
- **TanStack Query** for server state and caching
- **Wouter** for client-side routing
- **Vite** for fast development and optimized builds

### Backend
- **Node.js** with **Express.js** and TypeScript
- **Drizzle ORM** with **PostgreSQL** database
- **Firebase** for authentication and user data
- **Express Session** with PostgreSQL session store

### Development Tools
- **TypeScript** for type safety across the stack
- **ESBuild** for fast production builds
- **Hot Module Replacement** for seamless development

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Firebase project setup

### Installation

1. Clone the repository:
```bash
git clone https://github.com/sravanthskr/video-player.git
cd codesheet
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with:
```
DATABASE_URL=your_postgresql_connection_string
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
FIREBASE_PROJECT_ID=your_firebase_project_id
```

4. Set up the database:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Scripts

- `npm run dev` - Start development server with hot reloading
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run check` - Run TypeScript type checking
- `npm run db:push` - Push database schema changes

## Database Schema

The application uses PostgreSQL with Drizzle ORM for type-safe database operations:

- **Users**: Authentication state, profile data, and role management
- **Problems**: Structured problem data with categorization
- **Progress**: User-specific solved problems, starred items, and notes

## Sample Data

The project includes `sample-problems.json` with example problems across all categories. Admins can bulk import this data through the admin panel.

## Architecture

### Frontend Architecture
- Modular React components with TypeScript
- Zustand stores for auth, problems, and theme management
- TanStack Query for efficient server state management
- Responsive design with Tailwind CSS utilities

### Backend Architecture
- Express.js API with structured error handling
- Clean separation between route handlers and storage logic
- Session-based authentication with PostgreSQL storage
- RESTful endpoints under `/api` prefix

## Deployment

The application is configured for deployment on cloud platforms:

1. Build the project:
```bash
npm run build
```

2. The production server serves both API and static files on a single port
3. Environment variable `PORT` configures the server port (defaults to 10000)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with proper TypeScript types
4. Test your changes thoroughly
5. Submit a pull request
