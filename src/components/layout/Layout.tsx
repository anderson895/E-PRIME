import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Home, Users, FileText, Stethoscope, BarChart3, Shield,
  ClipboardList, Database, LogOut, Menu, X, Bell,
  ChevronDown, Activity,
} from "lucide-react";
import logoUrl from "@/logo.png";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

function getNavItems(role: string): NavItem[] {
  const common: NavItem[] = [
    { id: "dashboard", label: "Dashboard", icon: <Home size={18} /> },
    { id: "patients", label: "Patient Records", icon: <Users size={18} /> },
    { id: "records", label: "Medical Records", icon: <FileText size={18} /> },
  ];

  if (role === "Doctor") {
    return [
      ...common,
      { id: "consultation", label: "Consultation", icon: <Stethoscope size={18} /> },
      { id: "reports", label: "Reports", icon: <BarChart3 size={18} /> },
    ];
  }
  if (role === "Nurse") {
    return [
      ...common,
      { id: "vitals", label: "Take Vitals", icon: <Activity size={18} /> },
      { id: "reports", label: "Reports", icon: <BarChart3 size={18} /> },
    ];
  }
  // Administrative Staff
  return [
    ...common,
    { id: "reports", label: "Reports", icon: <BarChart3 size={18} /> },
    { id: "accounts", label: "User Accounts", icon: <Shield size={18} /> },
    { id: "logs", label: "System Logs", icon: <ClipboardList size={18} /> },
    { id: "backup", label: "Backup & Recovery", icon: <Database size={18} /> },
  ];
}

interface LayoutProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
}

export default function Layout({ activeTab, onTabChange, children }: LayoutProps) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  if (!user) return null;
  const navItems = getNavItems(user.role);
  const initials = user.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-cream">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 bottom-0 z-50 w-64 flex flex-col
          bg-gradient-to-b from-maroon-800 to-maroon
          transition-transform duration-300 lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
              <img src={logoUrl} alt="ePRIME-RHU" className="w-9 h-9 object-contain" />
            </div>
            <div>
              <h1 className="text-gold font-display font-bold text-lg tracking-wide leading-tight">
                ePRIME-RHU
              </h1>
              <p className="text-[10px] text-white/50 leading-tight">
                Mogpog, Marinduque
              </p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="ml-auto lg:hidden text-white/60 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-0.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                setSidebarOpen(false);
              }}
              className={`sidebar-link w-full ${activeTab === item.id ? "active" : ""}`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gold flex items-center justify-center text-maroon font-bold text-xs flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user.displayName}
              </p>
              <p className="text-[11px] text-white/50">{user.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg 
              bg-white/10 text-white/70 hover:text-white hover:bg-white/15
              text-xs font-medium transition-colors"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-maroon-50 px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-1.5 rounded-lg hover:bg-maroon-50 text-maroon transition-colors"
              >
                <Menu size={22} />
              </button>
              {/* Logo visible in top nav on mobile */}
              <img
                src={logoUrl}
                alt="ePRIME-RHU"
                className="w-8 h-8 object-contain lg:hidden rounded-full"
              />
              <div>
                <h2 className="text-lg font-bold text-maroon leading-tight">
                  {navItems.find((n) => n.id === activeTab)?.label || "Dashboard"}
                </h2>
                <p className="text-xs text-maroon font-medium hidden sm:block">
                  {new Date().toLocaleDateString("en-PH", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setNotifOpen((prev) => !prev)}
                  className="relative p-2 rounded-lg hover:bg-maroon-50 text-maroon transition-colors"
                >
                  <Bell size={20} />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                </button>

                {/* Dropdown */}
                {notifOpen && (
                  <>
                    {/* backdrop */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setNotifOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <span className="font-bold text-maroon text-sm">Notifications</span>
                        <span className="text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">1 new</span>
                      </div>
                      <ul className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                        <li className="px-4 py-3 hover:bg-maroon-50 transition-colors cursor-pointer">
                          <p className="text-sm font-semibold text-maroon">System Ready</p>
                          <p className="text-xs text-gray-500 mt-0.5">ePRIME-RHU is running normally.</p>
                          <p className="text-[10px] text-gray-400 mt-1">Just now</p>
                        </li>
                      </ul>
                      <div className="px-4 py-2 border-t border-gray-100 text-center">
                        <button
                          onClick={() => setNotifOpen(false)}
                          className="text-xs text-maroon font-semibold hover:underline"
                        >
                          Dismiss all
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* User avatar (desktop) */}
              <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-maroon-50">
                <div className="w-8 h-8 rounded-full bg-maroon/10 flex items-center justify-center text-maroon font-bold text-xs">
                  {initials}
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-maroon leading-tight">
                    {user.displayName}
                  </p>
                  <p className="text-[11px] text-maroon/60 font-medium">{user.role}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
