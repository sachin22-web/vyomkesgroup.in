# AI Rules for Fusion Starter Application

This document outlines the core technologies used in this project and provides guidelines for library usage to maintain consistency and best practices.

## Tech Stack Overview

*   **Frontend Framework**: React 18 with TypeScript for building dynamic user interfaces.
*   **Build Tool**: Vite for a fast development experience and optimized production builds.
*   **Client-Side Routing**: React Router 6 for declarative navigation within the Single Page Application (SPA).
*   **Styling**: Tailwind CSS 3 for a utility-first approach to styling, complemented by custom theme variables.
*   **UI Components**: Radix UI primitives are used as a foundation for accessible and unstyled components, which are then styled with Tailwind CSS.
*   **Icons**: Lucide React provides a comprehensive and customizable icon set.
*   **Backend Framework**: Express.js handles API requests and server-side logic.
*   **Database**: MongoDB is used for data persistence, with Mongoose as the Object Data Modeling (ODM) library.
*   **Form Management & Validation**: React Hook Form for efficient form handling, integrated with Zod for robust schema validation.
*   **Server State Management**: React Query is utilized for managing and synchronizing server state on the client.
*   **Date Utilities**: `date-fns` for parsing, formatting, and manipulating dates.

## Library Usage Rules

To ensure consistency, maintainability, and leverage the existing setup, please adhere to the following rules when developing new features or modifying existing ones:

*   **UI Components**:
    *   **Existing Components**: Always prioritize using components from `client/components/ui/` (e.g., `Button`, `Card`, `Input`, `Dialog`, `Select`, `Switch`, `Tabs`).
    *   **New Components**: If a required UI component does not exist, build it using Radix UI primitives and style it with Tailwind CSS.
    *   **Icons**: Use icons from `lucide-react`.
*   **Styling**:
    *   **Tailwind CSS**: All styling should primarily use Tailwind CSS utility classes.
    *   **Class Merging**: Use the `cn` utility function (from `client/lib/utils.ts`) for combining and conditionally applying Tailwind classes.
*   **Forms**:
    *   **Form Management**: Use `react-hook-form` for all form handling logic.
    *   **Validation**: Implement form validation using `zod` schemas, integrated with `react-hook-form` via `@hookform/resolvers`.
    *   **Form UI**: Utilize the `Form`, `FormField`, `FormControl`, `FormLabel`, `FormItem`, `FormMessage`, and `FormDescription` components from `client/components/ui/form.tsx` for consistent form layouts and accessibility.
*   **Data Fetching (Client-side)**:
    *   **React Query**: Use `@tanstack/react-query` for fetching, caching, and updating server data.
    *   **API Utility**: Use the `api` utility function (from `client/lib/api.ts`) for making authenticated API requests.
*   **Notifications**:
    *   **Toasts**: Use `sonner` for displaying transient notifications to the user. The `Toaster` component from `client/components/ui/sonner.tsx` is already configured.
*   **Date Handling**:
    *   **`date-fns`**: Use `date-fns` for any date formatting, parsing, or manipulation tasks.
*   **Responsive Design**:
    *   **Tailwind Utilities**: Ensure all layouts and components are responsive using Tailwind's built-in responsive utility classes.
    *   **Mobile Detection**: The `useIsMobile` hook (from `client/hooks/use-mobile.tsx`) can be used for conditional rendering specific to mobile devices.
*   **Database Interactions (Server-side)**:
    *   **Mongoose**: All database operations should be performed using Mongoose models (e.g., `User`, `Plan`, `Investment`).
    *   **DB Connection Check**: Always check `isDbConnected()` (from `server/db.ts`) before performing database operations, especially in routes that might run in demo mode.
*   **Authentication & Authorization (Server-side)**:
    *   **Middleware**: Protect API routes using `requireAuth` and `requireAdmin` middleware (from `server/routes/auth.ts`).
    *   **Password Hashing**: Use `bcryptjs` for securely hashing and comparing passwords.
    *   **JWT**: `jsonwebtoken` is used for creating and verifying authentication tokens.
*   **File Uploads (Server-side)**:
    *   **Multer**: Use `multer` for handling file uploads to the server.
    *   **Storage**: Uploaded files should be stored in the `public/uploads` directory.