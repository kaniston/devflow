# DevFlow — Collaborative Project Management & Developer Workspace

A modern project management platform designed to help development teams organize projects, manage tasks, track issues, and collaborate through a centralized workspace.

🔗 **Live Demo:** https://devflow-kaniston.vercel.app/  
📂 **GitHub Repository:** https://github.com/kaniston/devflow

---

## 🚀 Overview

DevFlow is a responsive web application built to simplify project and task management. It provides a centralized dashboard where users can manage projects, organize tasks, track issues, and manage team workspace membership.

The application combines a modern interface with Supabase authentication and database integration.

## ✨ Features

- **Dashboard:** Overview of projects, tasks, and workspace activity.
- **Authentication:** User registration, login, and protected routes.
- **Project Management:** Create, view, and manage projects.
- **Task Management:** Organize and track tasks.
- **Issue Tracking:** Manage and monitor project issues.
- **Team Management:** View team members, roles, and invitations.
- **Workspace Invitations:** Invite members with role-based access.
- **Responsive Design:** Optimized for desktop, tablet, and mobile devices.
- **Database Integration:** Supabase-powered backend and data storage.

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React, TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS v4 |
| Backend | Supabase |
| Database | PostgreSQL |
| Authentication | Supabase Auth |
| Serverless Functions | Supabase Edge Functions |
| Routing | React Router |
| Version Control | Git & GitHub |
| Deployment | Vercel |

## 📸 Application Modules

- Dashboard
- Projects
- Tasks
- Issues
- Team Management
- Authentication

## ⚙️ Getting Started

Follow these steps to run DevFlow locally.

### 1. Clone the repository

```bash
git clone https://github.com/kaniston/devflow.git
```

### 2. Navigate to the project folder

```bash
cd devflow
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_publishable_key
```

Replace the placeholder values with your own Supabase project credentials.

**Important:** Never expose your Supabase service-role key or other secret keys in frontend environment variables.

### 5. Start the development server

```bash
npm run dev
```

Open the local URL displayed in your terminal.

### 6. Build for production

```bash
npm run build
```

## 🗄️ Backend Configuration

DevFlow uses Supabase for:

- User authentication
- PostgreSQL database
- Workspace and membership management
- Invitation handling through Edge Functions
- Database access policies

To run the complete application, configure the required Supabase tables, authentication settings, access policies, and Edge Functions.

## 📱 Responsive Design

DevFlow is designed to support:

- Desktop screens
- Tablets
- Mobile devices

## 🔐 Security

- Supabase authentication
- Protected application routes
- Environment-based configuration
- Database Row Level Security (RLS)
- Role-based workspace membership and invitation handling

## 🎯 Project Objective

The objective of DevFlow is to develop a modern, full-stack project management application while gaining practical experience in frontend development, backend integration, authentication, database management, and deployment.

## 👨‍💻 Developer

**Kaniston S**  
B.Sc. Computer Science Student  
Loyola College

Interested in full-stack development, software engineering, and building practical applications.

---

⭐ If you find this project interesting, feel free to explore the repository!

**Built with React, TypeScript, and Supabase.**
