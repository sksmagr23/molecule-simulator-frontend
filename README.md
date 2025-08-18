# Molecular Simulator Frontend

A React-based frontend for the Molecular Simulator application with Google OAuth integration and 3D molecular visualization.

## Features

- **Authentication**: Google OAuth 2.0 integration
- **Responsive Design**: Modern UI with Tailwind CSS
- **Routing**: React Router for seamless navigation
- **3D Visualization**: Ready for molecular structure rendering
- **Background**: Beautiful background image integration

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── pages/
│   ├── Auth.tsx          # Authentication page with Google sign-in
│   ├── Landing.tsx       # Dashboard after successful authentication
│   └── Simulator.tsx     # Molecular visualization platform
├── App.tsx               # Main app with routing
├── main.tsx              # Entry point
└── index.css             # Global styles with background image
```

## Pages

### Auth Page (`/auth`)
- Starting page with "Molecule Simulator" title
- Centered Google sign-in button
- Beautiful background with molecular theme

### Landing Page (`/landing`)
- Welcome message after successful authentication
- Feature overview cards
- Navigation to simulator

### Simulator Page (`/simulator`)
- Placeholder for molecular visualization
- Navigation back to dashboard
- Ready for 3D rendering implementation

## Backend Integration

The frontend integrates with the backend at `http://localhost:3000`:
- Google OAuth flow starts at `/auth/google`
- Successful authentication redirects to `/landing`
- Logout handled through backend endpoint

## Technologies Used

- **React 19** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Three.js** ready for 3D graphics

## Development

- **Port**: 5173 (Vite default)
- **Hot Reload**: Enabled in development mode
- **TypeScript**: Full type safety
- **ESLint**: Code quality and consistency
