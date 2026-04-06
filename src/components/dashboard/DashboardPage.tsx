import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Users, Stethoscope, Calendar, Activity, TrendingUp,
  Clock, ArrowUpRight, Heart,
} from "lucide-react";
import type { Patient, MedicalRecord } from "@/types";
import { getAllPatients } from "@/services/patientService";
import { getAllRecords } from "@/services/recordService";

export default function DashboardPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [p, r] = await Promise.all([getAllPatients(), getAllRecords()]);
        setPatients(p);
        setRecords(r);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const today = new Date().toISOString().split("T")[0];
  const thisMonth = today.slice(0, 7);

  const stats = [
    {
      label: "Total Patients",
      value: patients.length,
      icon: <Users size={22} />,
      color: "bg-blue-500",
      bgLight: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      label: "Total Consultations",
      value: records.length,
      icon: <Stethoscope size={22} />,
      color: "bg-emerald-500",
      bgLight: "bg-emerald-50",
      textColor: "text-emerald-600",
    },
    {
      label: "This Month",
      value: records.filter((r) => r.date.startsWith(thisMonth)).length,
      icon: <Calendar size={22} />,
      color: "bg-gold",
      bgLight: "bg-gold-50",
      textColor: "text-gold-600",
    },
    {
      label: "Active Patients",
      value: patients.filter((p) => p.status === "Active").length,
      icon: <Activity size={22} />,
      color: "bg-red-500",
      bgLight: "bg-red-50",
      textColor: "text-red-600",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-maroon border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="section-card bg-gradient-to-r from-maroon to-maroon-600 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-display font-bold">
              Welcome back, {user?.displayName?.split(" ")[0]}
            </h2>
            <p className="text-white/80 text-sm mt-1">
              Here's what's happening at RHU Mogpog today.
            </p>
          </div>
          <Heart size={48} className="text-gold/30" fill="currentColor" />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="stat-card group cursor-default">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                  {s.label}
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {s.value}
                </p>
              </div>
              <div
                className={`w-11 h-11 rounded-xl ${s.bgLight} ${s.textColor} flex items-center justify-center group-hover:scale-110 transition-transform`}
              >
                {s.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Consultations Table */}
      <div className="section-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-maroon font-display">
            Recent Consultations
          </h3>
          <span className="badge badge-info">
            <Clock size={12} className="mr-1" />
            Last {Math.min(records.length, 10)} records
          </span>
        </div>

        <div className="overflow-x-auto -mx-6">
          <table className="data-table min-w-[700px] mx-6">
            <thead>
              <tr>
                <th>Record ID</th>
                <th>Date</th>
                <th>Patient</th>
                <th>Diagnosis</th>
                <th>Doctor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.slice(0, 10).map((r) => {
                const p = patients.find((pt) => pt.id === r.patientId || pt.patientId === r.patientId);
                return (
                  <tr key={r.id}>
                    <td className="font-mono text-xs font-semibold text-maroon">
                      {r.recordId}
                    </td>
                    <td className="text-gray-600">{r.date}</td>
                    <td className="font-medium text-gray-800">
                      {p ? `${p.lastName}, ${p.firstName}` : "—"}
                    </td>
                    <td className="max-w-[220px] truncate text-gray-600">
                      {r.diagnosis}
                    </td>
                    <td className="text-gray-600">{r.doctorName}</td>
                    <td>
                      <span
                        className={`badge ${
                          r.status === "Completed"
                            ? "badge-success"
                            : r.status === "Pending"
                            ? "badge-warning"
                            : "badge-info"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {records.length === 0 && (
            <p className="text-center text-gray-500 py-8 text-sm">
              No consultations recorded yet.
            </p>
          )}
        </div>
      </div>

      {/* Quick Stats - Diagnosis Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="section-card">
          <h3 className="text-base font-bold text-maroon font-display mb-4">
            Top Diagnoses
          </h3>
          {(() => {
            const counts: Record<string, number> = {};
            records.forEach((r) => {
              counts[r.diagnosis] = (counts[r.diagnosis] || 0) + 1;
            });
            const sorted = Object.entries(counts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 6);
            const max = Math.max(...sorted.map(([, c]) => c), 1);

            return sorted.length > 0 ? (
              <div className="space-y-3">
                {sorted.map(([diag, count]) => (
                  <div key={diag}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 truncate max-w-[80%]">
                        {diag}
                      </span>
                      <span className="font-bold text-gray-800">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-maroon to-maroon-500 transition-all duration-500"
                        style={{ width: `${(count / max) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No data yet.</p>
            );
          })()}
        </div>

        <div className="section-card">
          <h3 className="text-base font-bold text-maroon font-display mb-4">
            Patient Demographics
          </h3>
          <div className="space-y-3">
            {[
              {
                label: "Male",
                val: patients.filter((p) => p.gender === "Male").length,
                color: "bg-blue-500",
              },
              {
                label: "Female",
                val: patients.filter((p) => p.gender === "Female").length,
                color: "bg-pink-500",
              },
            ].map((d) => (
              <div key={d.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">{d.label}</span>
                  <span className="font-bold text-gray-800">
                    {d.val} ({patients.length ? Math.round((d.val / patients.length) * 100) : 0}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div
                    className={`h-2 rounded-full ${d.color} transition-all duration-500`}
                    style={{
                      width: `${patients.length ? (d.val / patients.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}

            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-200">
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-maroon">
                  {patients.filter((p) => p.status === "Active").length}
                </p>
                <p className="text-[11px] text-gray-500 font-medium">Active</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-maroon">
                  {patients.filter((p) => p.status === "Inactive").length}
                </p>
                <p className="text-[11px] text-gray-500 font-medium">Inactive</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}