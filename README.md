# GST Client Management System

A modern, responsive React application for managing GST clients and billing details.

## Features

- **Dashboard**: Overview of client management.
- **Client Management**: Add, Edit, Delete, and Search clients.
- **Responsive Design**: Fully responsive sidebar and layout for mobile and desktop.
- **Modern UI**: Clean interface using a custom design system and Lucide icons.
- **Data Persistence**: Uses LocalStorage to persist client data.

## Tech Stack

- React 19
- Vite
- React Router DOM
- Lucide React (Icons)
- CSS Variables & Flexbox/Grid Layout

## Getting Started

1.  **Install Dependencies**:

    ```bash
    npm install
    ```

2.  **Run Development Server**:

    ```bash
    npm run dev
    ```

3.  **Build for Production**:
    ```bash
    npm run build
    ```

## Project Structure

- `src/components`: Reusable UI components (Sidebar, Navbar).
- `src/pages`: Page components (AddClient, Clients).
- `src/index.css`: Global styles and design system.
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
