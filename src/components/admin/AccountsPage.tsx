import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import type { UserAccount, UserRole } from "@/types";
import { registerUser } from "@/services/authService";
import {
  getAllUsers,
  deactivateUser,
  activateUser,
  updateUserAccount,
} from "@/services/adminService";
import { addSystemLog } from "@/services/adminService";
import {
  Shield, Plus, Trash2, UserCheck, UserX, Loader2, X, Search,
  Edit, Check,
} from "lucide-react";

export default function AccountsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    displayName: "",
    role: "Nurse" as UserRole,
    contactNumber: "",
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    try {
      const data = await getAllUsers();
      setAccounts(data);
    } catch {
      addToast({ type: "error", title: "Failed to load accounts" });
    } finally {
      setLoading(false);
    }
  }

  const handleCreate = async () => {
    if (!form.email || !form.password || !form.displayName) {
      addToast({ type: "error", title: "Fill all required fields" });
      return;
    }
    setSaving(true);
    try {
      await registerUser(
        form.email,
        form.password,
        form.displayName,
        form.role,
        form.contactNumber
      );
      await addSystemLog({
        userId: user?.uid || "",
        userName: user?.displayName || "",
        action: "User Account Created",
        details: `${form.displayName} (${form.role})`,
        type: "admin",
      });
      addToast({ type: "success", title: "Account created successfully" });
      setForm({ email: "", password: "", displayName: "", role: "Nurse", contactNumber: "" });
      setShowForm(false);
      loadAccounts();
    } catch (err: any) {
      addToast({ type: "error", title: "Failed to create account", message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (account: UserAccount) => {
    try {
      if (account.isActive) {
        await deactivateUser(account.uid);
        addToast({ type: "info", title: `${account.displayName} deactivated` });
      } else {
        await activateUser(account.uid);
        addToast({ type: "success", title: `${account.displayName} activated` });
      }
      loadAccounts();
    } catch {
      addToast({ type: "error", title: "Failed to update account" });
    }
  };

  const filtered = accounts.filter(
    (a) =>
      a.displayName.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      a.role.toLowerCase().includes(search.toLowerCase())
  );

  const roleBadge = (role: string) => {
    const map: Record<string, string> = {
      Doctor: "badge-info",
      Nurse: "badge-success",
      "Administrative Staff": "badge-warning",
    };
    return map[role] || "badge-info";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-maroon-200" />
          <input
            placeholder="Search accounts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary whitespace-nowrap">
          <Plus size={16} /> Add User
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="section-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-maroon font-display">New User Account</h3>
            <button onClick={() => setShowForm(false)}><X size={18} className="text-maroon-200" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-maroon-300 block mb-1">Full Name *</label>
              <input value={form.displayName} onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="text-xs font-semibold text-maroon-300 block mb-1">Email *</label>
              <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="text-xs font-semibold text-maroon-300 block mb-1">Password *</label>
              <input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} className="input-field" placeholder="Min. 6 characters" />
            </div>
            <div>
              <label className="text-xs font-semibold text-maroon-300 block mb-1">Role *</label>
              <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as UserRole }))} className="input-field">
                <option value="Doctor">Doctor</option>
                <option value="Nurse">Nurse</option>
                <option value="Administrative Staff">Administrative Staff</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-maroon-300 block mb-1">Contact Number</label>
              <input value={form.contactNumber} onChange={(e) => setForm((p) => ({ ...p, contactNumber: e.target.value }))} className="input-field" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowForm(false)} className="btn-ghost text-sm">Cancel</button>
            <button onClick={handleCreate} disabled={saving} className="btn-primary text-sm">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Create Account
            </button>
          </div>
        </div>
      )}

      {/* Accounts List */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-maroon" /></div>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => (
            <div key={a.uid} className="section-card !p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-maroon/10 flex items-center justify-center text-maroon font-bold text-xs flex-shrink-0">
                {a.displayName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-maroon-800">{a.displayName}</p>
                <p className="text-xs text-maroon-200">{a.email} {a.contactNumber && `· ${a.contactNumber}`}</p>
              </div>
              <span className={`badge ${roleBadge(a.role)}`}>{a.role}</span>
              <span className={`badge ${a.isActive ? "badge-success" : "badge-danger"}`}>
                {a.isActive ? "Active" : "Inactive"}
              </span>
              <button
                onClick={() => toggleActive(a)}
                className={`btn-ghost text-xs ${a.isActive ? "text-red-500 hover:bg-red-50" : "text-emerald-600 hover:bg-emerald-50"}`}
                title={a.isActive ? "Deactivate" : "Activate"}
              >
                {a.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-maroon-200">
              <Shield size={48} className="mx-auto mb-3 opacity-30" />
              <p>No accounts found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
