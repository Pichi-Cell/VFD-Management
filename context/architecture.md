# Project Architecture Overview

This project is a **VFD (Variable Frequency Drive) Repair Management System** designed for DMD Compresores. It tracks the complete lifecycle of a repair, from reception to final technical report.

## Tech Stack

### Backend
- **Framework**: Node.js with Express.js
- **Database**: PostgreSQL (hosted/local)
- **Authentication**: JWT (JSON Web Tokens) with `bcryptjs` for password hashing.
- **File Handling**: `multer` for image uploads (stored in `./uploads`).
- **Communication**: `nodemailer` for email notifications.

### Frontend
- **Framework**: React.js (Vite-based)
- **Styling**: Tailwind CSS for a premium, custom UI.
- **State Management**: `@tanstack/react-query` for server-state synchronization.
- **Icons**: `lucide-react`.
- **Navigation**: `react-router-dom`.

## Directory Structure

```text
/Variadores
├── /backend
│   ├── /controllers    # Business logic for repairs, auth, clients, vfds
│   ├── /middleware     # Auth and validation middleware
│   ├── /routes         # Express route definitions
│   ├── db.js           # Database connection pool
│   ├── index.js        # Entry point
│   └── schema.sql      # Database initialization script
├── /frontend
│   ├── /src
│   │   ├── /components # Reusable UI components (Layout, Modals, etc.)
│   │   ├── /pages      # Main application pages (Kanban, RepairDetail, Settings)
│   │   ├── /services   # API communication (dataService.js)
│   │   ├── App.jsx     # Routing and core logic
│   │   └── main.jsx    # Client entry point
│   └── tailwind.config.js
└── /context            # Project documentation and memory reservoir
```

## Global Development Rules
1. **Consistency**: Follow the existing high-contrast, premium UI design language.
2. **Data Integrity**: Ensure all database operations are properly typed (especially integer sanitization for hours).
3. **Security**: All API routes (except public auth) require a valid JWT `x-auth-token`.
4. **Modularity**: Keep components small and specialized.
