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
        <Loader2 className="w-8 h-8 animate-spin text-maroon" />
      </div>
    );
  }

  const max = Math.max(...diagStats.map((d) => d.count), 1);

  // Monthly distribution
  const monthCounts: Record<string, number> = {};
  records.forEach((r) => {
    const m = r.date.slice(0, 7);
    monthCounts[m] = (monthCounts[m] || 0) + 1;
  });
  const months = Object.entries(monthCounts).sort((a, b) => a[0].localeCompare(b[0]));
  const maxMonth = Math.max(...months.map(([, c]) => c), 1);

  return (
    <div className="space-y-5">
      {/* Date Filter & Actions */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs font-semibold text-maroon-300 block mb-1">From</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange((p) => ({ ...p, start: e.target.value }))}
            className="input-field"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-maroon-300 block mb-1">To</label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange((p) => ({ ...p, end: e.target.value }))}
            className="input-field"
          />
        </div>
        <div className="flex gap-2 ml-auto no-print">
          <button onClick={handlePrint} className="btn-primary">
            <Printer size={16} /> Print
          </button>
          <button onClick={handleExportCSV} className="btn-secondary">
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
          { label: "Avg/Month", val: months.length ? Math.round(filteredRecords.length / months.length) : 0, icon: <TrendingUp size={20} />, bg: "bg-gold-50", text: "text-gold-600" },
        ].map((s, i) => (
          <div key={i} className="section-card !p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${s.bg} ${s.text} flex items-center justify-center`}>
                {s.icon}
              </div>
              <div>
                <p className="text-xs text-maroon-200 font-semibold">{s.label}</p>
                <p className="text-2xl font-bold text-maroon-800">{s.val}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Diagnoses */}
        <div className="section-card">
          <h3 className="text-base font-bold text-maroon font-display mb-4 flex items-center gap-2">
            <BarChart3 size={18} /> Top Diagnoses
          </h3>
          {diagStats.length > 0 ? (
            <div className="space-y-3">
              {diagStats.slice(0, 10).map(({ diagnosis, count }, i) => (
                <div key={diagnosis}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-maroon-300 truncate max-w-[75%] flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-maroon/10 text-maroon font-bold flex items-center justify-center text-[10px]">
                        {i + 1}
                      </span>
                      {diagnosis}
                    </span>
                    <span className="font-bold text-maroon">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-maroon-50 ml-7">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-maroon to-maroon-500 transition-all"
                      style={{ width: `${(count / max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-maroon-200 text-sm">No diagnosis data yet.</p>
          )}
        </div>

        {/* Monthly Distribution */}
        <div className="section-card">
          <h3 className="text-base font-bold text-maroon font-display mb-4 flex items-center gap-2">
            <Calendar size={18} /> Monthly Consultations
          </h3>
          {months.length > 0 ? (
            <div className="space-y-3">
              {months.map(([month, count]) => (
                <div key={month}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-maroon-300 font-mono">{month}</span>
                    <span className="font-bold text-maroon">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-maroon-50">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-gold to-gold-400 transition-all"
                      style={{ width: `${(count / maxMonth) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-maroon-200 text-sm">No monthly data yet.</p>
          )}
        </div>
      </div>

      {/* Patient Demographics */}
      <div className="section-card">
        <h3 className="text-base font-bold text-maroon font-display mb-4">
          Patient Demographics Summary
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Male", val: patients.filter((p) => p.gender === "Male").length },
            { label: "Female", val: patients.filter((p) => p.gender === "Female").length },
            { label: "Active", val: patients.filter((p) => p.status === "Active").length },
            { label: "Inactive", val: patients.filter((p) => p.status === "Inactive").length },
          ].map((d) => (
            <div key={d.label} className="text-center p-4 bg-maroon-50/40 rounded-xl">
              <p className="text-3xl font-bold text-maroon">{d.val}</p>
              <p className="text-xs text-maroon-200 font-medium mt-1">{d.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
