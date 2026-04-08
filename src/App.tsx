import React, { useState } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import LoginPage from "@/components/auth/LoginPage";
import Layout from "@/components/layout/Layout";
import DashboardPage from "@/components/dashboard/DashboardPage";
import PatientsPage from "@/components/patients/PatientsPage";
import RecordsPage from "@/components/records/RecordsPage";
import ConsultationPage from "@/components/consultation/ConsultationPage";
import VitalsPage from "@/components/vitals/VitalsPage";
import ReportsPage from "@/components/reports/ReportsPage";
import AccountsPage from "@/components/admin/AccountsPage";
import LogsPage from "@/components/admin/LogsPage";
import BackupPage from "@/components/admin/BackupPage";
import { Loader2 } from "lucide-react";

function AppContent() {
  const { user, initializing } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Show full-screen loader ONLY during the initial Firebase auth check.
  // Login-attempt loading is handled inside LoginPage itself via the `loading` flag.
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-maroon mx-auto mb-3" />
          <p className="text-sm text-maroon-300">Loading ePRIME-RHU...</p>
        </div>
      </div>
    );
  }

  // Not logged in → show login
  if (!user) {
    return <LoginPage />;
  }

  // Logged in → show dashboard with appropriate page
  const renderPage = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardPage />;
      case "patients":
        return <PatientsPage />;
      case "records":
        return <RecordsPage />;
      case "consultation":
        return user.role === "Doctor" ? <ConsultationPage /> : <DashboardPage />;
      case "vitals":
        return user.role === "Nurse" ? <VitalsPage /> : <DashboardPage />;
      case "reports":
        return <ReportsPage />;
      case "accounts":
        return user.role === "Administrative Staff" ? <AccountsPage /> : <DashboardPage />;
      case "logs":
        return user.role === "Administrative Staff" ? <LogsPage /> : <DashboardPage />;
      case "backup":
        return user.role === "Administrative Staff" ? <BackupPage /> : <DashboardPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}