import React, { useState, useEffect } from "react";
import type { Patient, MedicalRecord } from "@/types";
import { getAllPatients } from "@/services/patientService";
import { getAllRecords, getDiagnosisStats } from "@/services/recordService";
import {
  BarChart3, Printer, Download, Loader2, Calendar, Users,
  Stethoscope, TrendingUp, FileText,
} from "lucide-react";

export default function ReportsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [diagStats, setDiagStats] = useState<{ diagnosis: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  useEffect(() => {
    async function load() {
      try {
        const [p, r, d] = await Promise.all([
          getAllPatients(),
          getAllRecords(),
          getDiagnosisStats(),
        ]);
        setPatients(p);
        setRecords(r);
        setDiagStats(d);
      } catch {
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredRecords = records.filter((r) => {
    if (dateRange.start && r.date < dateRange.start) return false;
    if (dateRange.end && r.date > dateRange.end) return false;
    return true;
  });

  const handleExportCSV = () => {
    const header = "Record ID,Date,Patient ID,Doctor,Diagnosis,Treatment,Status\n";
    const rows = filteredRecords
      .map((r) =>
        `"${r.recordId}","${r.date}","${r.patientId}","${r.doctorName}","${r.diagnosis}","${r.treatment}","${r.status}"`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eprime-rhu-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-red-900" />
      </div>
    );
  }

  const max = Math.max(...diagStats.map((d) => d.count), 1);

  const monthCounts: Record<string, number> = {};
  records.forEach((r) => {
    const m = r.date.slice(0, 7);
    monthCounts[m] = (monthCounts[m] || 0) + 1;
  });
  const months = Object.entries(monthCounts).sort((a, b) => a[0].localeCompare(b[0]));
  const maxMonth = Math.max(...months.map(([, c]) => c), 1);

  const inputClass =
    "rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-red-800 focus:outline-none focus:ring-1 focus:ring-red-800";

  const cardClass = "bg-white rounded-xl border border-gray-200 shadow-sm p-5";

  return (
    <div className="space-y-5">
      {/* Date Filter & Actions */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">From</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange((p) => ({ ...p, start: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">To</label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange((p) => ({ ...p, end: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div className="flex gap-2 ml-auto no-print">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-900 text-white text-sm font-semibold hover:bg-red-800 transition-colors"
          >
            <Printer size={16} /> Print
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Patients", val: patients.length, icon: <Users size={20} />, bg: "bg-blue-50", text: "text-blue-600" },
          { label: "Total Consultations", val: filteredRecords.length, icon: <Stethoscope size={20} />, bg: "bg-emerald-50", text: "text-emerald-600" },
          { label: "Unique Diagnoses", val: diagStats.length, icon: <FileText size={20} />, bg: "bg-purple-50", text: "text-purple-600" },
          { label: "Avg/Month", val: months.length ? Math.round(filteredRecords.length / months.length) : 0, icon: <TrendingUp size={20} />, bg: "bg-amber-50", text: "text-amber-600" },
        ].map((s, i) => (
          <div key={i} className={`${cardClass} !p-4`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${s.bg} ${s.text} flex items-center justify-center flex-shrink-0`}>
                {s.icon}
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900">{s.val}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Diagnoses */}
        <div className={cardClass}>
          <h3 className="text-base font-bold text-red-900 mb-4 flex items-center gap-2">
            <BarChart3 size={18} /> Top Diagnoses
          </h3>
          {diagStats.length > 0 ? (
            <div className="space-y-3">
              {diagStats.slice(0, 10).map(({ diagnosis, count }, i) => (
                <div key={diagnosis}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 truncate max-w-[75%] flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-red-100 text-red-900 font-bold flex items-center justify-center text-[10px] flex-shrink-0">
                        {i + 1}
                      </span>
                      {diagnosis}
                    </span>
                    <span className="font-bold text-red-900">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 ml-7">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-red-900 to-red-600 transition-all"
                      style={{ width: `${(count / max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No diagnosis data yet.</p>
          )}
        </div>

        {/* Monthly Distribution */}
        <div className={cardClass}>
          <h3 className="text-base font-bold text-red-900 mb-4 flex items-center gap-2">
            <Calendar size={18} /> Monthly Consultations
          </h3>
          {months.length > 0 ? (
            <div className="space-y-3">
              {months.map(([month, count]) => (
                <div key={month}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 font-mono">{month}</span>
                    <span className="font-bold text-amber-700">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all"
                      style={{ width: `${(count / maxMonth) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No monthly data yet.</p>
          )}
        </div>
      </div>

      {/* Patient Demographics */}
      <div className={cardClass}>
        <h3 className="text-base font-bold text-red-900 mb-4">
          Patient Demographics Summary
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Male", val: patients.filter((p) => p.gender === "Male").length },
            { label: "Female", val: patients.filter((p) => p.gender === "Female").length },
            { label: "Active", val: patients.filter((p) => p.status === "Active").length },
            { label: "Inactive", val: patients.filter((p) => p.status === "Inactive").length },
          ].map((d) => (
            <div key={d.label} className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-3xl font-bold text-red-900">{d.val}</p>
              <p className="text-xs text-gray-500 font-medium mt-1">{d.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
