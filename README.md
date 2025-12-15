# 💰 Personal Expense Manager

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

A modern, feature-rich mobile first responsive personal finance application designed to help you track expenses, manage budgets, and visualize your financial health with ease. Built with performance and user experience in mind.

## ✨ Key Features

- **📊 Interactive Dashboard**: Real-time overview of your balance, monthly spending, and savings trends.
- **💸 Smart Expense Tracking**: Easily add expenses and income with support for multiple currencies and automatic conversion.
- **🔄 Recurring Transactions**: Set up automated rules for subscriptions, rent, and salary.
- **🏷️ Advanced Categorization**: Organize transactions with custom categories and color-coded tags.
- **👥 Group Expenses**: Create groups to share and split expenses with friends or family (with Row Level Security).
- **📈 Detailed Analytics**: Visualize spending habits with interactive charts and breakdown reports.
- **📱 Fully Responsive**: Seamless experience across desktop, tablet, and mobile devices.
- **🌓 Dark/Light Mode**: Beautifully designed themes to suit your preference.
- **🔒 Secure**: Enterprise-grade authentication and data protection via Supabase.

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI/Styling**: Tailwind CSS, Material UI (MUI), Lucide React
- **State Management**: TanStack Query (React Query), Zustand
- **Backend / Database**: Supabase (PostgreSQL, Auth, Realtime)
- **Charts**: Recharts
- **Forms**: React Hook Form, Zod

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A Supabase account

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/personal-expense-manager.git
    cd personal-expense-manager
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    Create a `.env` file in the root directory and add your Supabase credentials:
    ```env
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run the Development Server**
    ```bash
    npm run dev
    ```

## 🗄️ Database Setup

This project uses Supabase. You can set up the database schema by running the SQL scripts provided in the `database.sql` file (and any migration files) in your Supabase SQL Editor.

## 📦 Deployment

The app is optimized for deployment on **Vercel** or **Netlify**.

### Vercel (Recommended)
1.  Push your code to GitHub.
2.  Import the project into Vercel.
3.  Add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Vercel Project Settings > Environment Variables.
4.  Deploy!

## � Future Roadmap

- **📱 PWA Support**: Make the app installable on mobile devices with offline capabilities.
- **🎯 Budget Goals**: Set monthly spending limits per category with visual progress bars and alerts.
- **🧾 Receipt Scanning**: Client-side OCR (using Tesseract.js) to automatically extract data from receipt photos.
- **📥 CSV Import**: Bulk import transactions from your bank statements manually.
- **🤖 AI Insights**: Smart analysis of your spending habits (e.g., "You spent 15% less on dining out this month!").
- **⚖️ Debt Simplification**: "Splitwise-style" debt minimization for group expenses.
- **🏆 Gamification**: Achievements and streaks for consistent tracking and saving.

## �📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Made with ❤️ by Harshvardhan Sawal with the help of Antigravity!
