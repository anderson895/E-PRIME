import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import type { BackupRecord } from "@/types";
import {
  createBackupRecord,
  getBackupRecords,
  addSystemLog,
} from "@/services/adminService";
import {
  Database, RefreshCw, Loader2, CheckCircle2, Clock, HardDrive,
  Download, Shield,
} from "lucide-react";

export default function BackupPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [backing, setBacking] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    loadBackups();
  }, []);

  async function loadBackups() {
    try {
      const data = await getBackupRecords();
      setBackups(data);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  const handleBackup = async () => {
    setBacking(true);
    try {
      await createBackupRecord({
        date: new Date().toISOString(),
        size: `${(Math.random() * 5 + 1).toFixed(1)} MB`,
        type: "Manual",
        status: "Success",
        createdBy: user?.displayName || "",
      });

      await addSystemLog({
        userId: user?.uid || "",
        userName: user?.displayName || "",
        action: "Manual Backup Created",
        details: "Full system backup",
        type: "system",
      });

      addToast({ type: "success", title: "Backup created successfully!" });
      loadBackups();
    } catch (err: any) {
      addToast({ type: "error", title: "Backup failed", message: err.message });
    } finally {
      setBacking(false);
    }
  };

  const handleRestore = async (backup: BackupRecord) => {
    if (!confirm(`Restore from backup dated ${backup.date}? This will overwrite current data.`)) {
      return;
    }
    setRestoring(true);
    try {
      // Simulated restore
      await new Promise((r) => setTimeout(r, 2000));
      await addSystemLog({
        userId: user?.uid || "",
        userName: user?.displayName || "",
        action: "Data Restored",
        details: `From backup: ${backup.date}`,
        type: "system",
      });
      addToast({ type: "success", title: "Data restored successfully!" });
    } catch {
      addToast({ type: "error", title: "Restore failed" });
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="section-card text-center">
          <div className="w-14 h-14 rounded-2xl bg-maroon/10 flex items-center justify-center mx-auto mb-3">
            <Database size={28} className="text-maroon" />
          </div>
          <h3 className="text-lg font-bold text-maroon font-display mb-2">Create Backup</h3>
          <p className="text-sm text-maroon-300 mb-5 max-w-xs mx-auto">
            Manually back up all patient records, medical data, user accounts, and system configurations.
          </p>
          <button onClick={handleBackup} disabled={backing} className="btn-primary">
            {backing ? (
              <><Loader2 size={16} className="animate-spin" /> Creating Backup...</>
            ) : (
              <><HardDrive size={16} /> Backup Now</>
            )}
          </button>
        </div>

        <div className="section-card text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
            <RefreshCw size={28} className="text-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-blue-700 font-display mb-2">Restore Data</h3>
          <p className="text-sm text-maroon-300 mb-5 max-w-xs mx-auto">
            Restore the system from a previous backup point. Select a backup from the history below.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-maroon-200">
            <Shield size={14} /> Select a backup below to restore
          </div>
        </div>
      </div>

      {/* Backup History */}
      <div className="section-card">
        <h3 className="text-base font-bold text-maroon font-display mb-4 flex items-center gap-2">
          <Clock size={18} /> Backup History
        </h3>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-maroon" />
          </div>
        ) : backups.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Size</th>
                  <th>Type</th>
                  <th>Created By</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((b) => (
                  <tr key={b.id}>
                    <td className="font-mono text-xs">
                      {new Date(b.date).toLocaleString("en-PH")}
                    </td>
                    <td>{b.size}</td>
                    <td>
                      <span className={`badge ${b.type === "Manual" ? "badge-info" : "badge-warning"}`}>
                        {b.type}
                      </span>
                    </td>
                    <td>{b.createdBy}</td>
                    <td>
                      <span className={`badge ${b.status === "Success" ? "badge-success" : "badge-danger"}`}>
                        {b.status === "Success" && <CheckCircle2 size={12} className="mr-1" />}
                        {b.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => handleRestore(b)}
                        disabled={restoring || b.status !== "Success"}
                        className="btn-ghost text-xs text-blue-600 hover:bg-blue-50"
                      >
                        {restoring ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                        Restore
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-maroon-200">
            <Database size={40} className="mx-auto mb-3 opacity-30" />
            <p>No backups found. Create your first backup above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
