import React, { useState, useEffect } from "react";
import type { SystemLog } from "@/types";
import { getSystemLogs } from "@/services/adminService";
import { ClipboardList, Loader2, Search, Filter } from "lucide-react";

export default function LogsPage() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    getSystemLogs(200)
      .then(setLogs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter((l) => {
    const matchesSearch = `${l.userName} ${l.action} ${l.details}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || l.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const typeBadge = (type: string) => {
    const map: Record<string, string> = {
      auth: "badge-info",
      record: "badge-success",
      system: "badge-warning",
      admin: "bg-purple-50 text-purple-700 border border-purple-200",
    };
    return map[type] || "badge-info";
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-maroon" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-maroon-200" />
          <input
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="input-field w-auto min-w-[130px]"
        >
          <option value="all">All Types</option>
          <option value="auth">Auth</option>
          <option value="record">Record</option>
          <option value="system">System</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="section-card overflow-hidden">
        <div className="overflow-x-auto -mx-6 -mt-6">
          <table className="data-table min-w-[700px] mx-6 mt-6">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Details</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id}>
                  <td className="font-mono text-xs whitespace-nowrap">{l.timestamp}</td>
                  <td className="font-medium">{l.userName}</td>
                  <td>{l.action}</td>
                  <td className="text-maroon-300 max-w-[250px] truncate">{l.details}</td>
                  <td>
                    <span className={`badge ${typeBadge(l.type)}`}>{l.type}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-maroon-200">
              <ClipboardList size={48} className="mx-auto mb-3 opacity-30" />
              <p>No logs found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
