import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { MedicalRecord, Patient } from "@/types";
import { getAllRecords } from "@/services/recordService";
import { getAllPatients } from "@/services/patientService";
import { Search, FileText, Filter, Loader2, Eye } from "lucide-react";

export default function RecordsPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [r, p] = await Promise.all([getAllRecords(), getAllPatients()]);
        setRecords(r);
        setPatients(p);
      } catch {
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const getPatient = (patientId: string) =>
    patients.find((p) => p.id === patientId || p.patientId === patientId);

  const filtered = records.filter((r) => {
    const p = getPatient(r.patientId);
    const name = p ? `${p.firstName} ${p.lastName}` : "";
    const matchesSearch = `${r.recordId} ${name} ${r.diagnosis} ${r.doctorName}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-red-800 focus:outline-none focus:ring-1 focus:ring-red-800";

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-red-900" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Search by record ID, patient, diagnosis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputClass} pl-10`}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`${inputClass} w-auto min-w-[140px]`}
        >
          <option value="all">All Status</option>
          <option value="Completed">Completed</option>
          <option value="Pending">Pending</option>
          <option value="Follow-up">Follow-up</option>
        </select>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 overflow-hidden">
        <div className="overflow-x-auto -mx-6 -mt-6">
          <table className="min-w-[800px] w-full mx-6 mt-6 text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="pb-3 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Record ID</th>
                <th className="pb-3 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="pb-3 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Patient</th>
                <th className="pb-3 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Doctor</th>
                <th className="pb-3 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Diagnosis</th>
                <th className="pb-3 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((r) => {
                const p = getPatient(r.patientId);
                const isExpanded = expandedId === r.id;
                return (
                  <React.Fragment key={r.id}>
                    <tr
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : r.id)}
                    >
                      <td className="py-3 pr-4 font-mono text-xs font-semibold text-red-900">{r.recordId}</td>
                      <td className="py-3 pr-4 text-gray-700">{r.date}</td>
                      <td className="py-3 pr-4 font-medium text-gray-900">{p ? `${p.lastName}, ${p.firstName}` : "—"}</td>
                      <td className="py-3 pr-4 text-gray-600">{r.doctorName}</td>
                      <td className="py-3 pr-4 max-w-[200px] truncate text-gray-700">{r.diagnosis}</td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          r.status === "Completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : r.status === "Pending"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button className="inline-flex items-center justify-center p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors">
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="bg-gray-50 px-4 py-4 border-b border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                              {r.chiefComplaint && (
                                <>
                                  <p className="font-semibold text-red-900 mb-1">Chief Complaint</p>
                                  <p className="text-gray-600">{r.chiefComplaint}</p>
                                </>
                              )}
                              <p className="font-semibold text-red-900 mb-1 mt-3">Diagnosis</p>
                              <p className="text-gray-600">{r.diagnosis}</p>
                              <p className="font-semibold text-red-900 mb-1 mt-3">Treatment</p>
                              <p className="text-gray-600">{r.treatment || "—"}</p>
                              {r.prescription && (
                                <>
                                  <p className="font-semibold text-red-900 mb-1 mt-3">Prescription</p>
                                  <p className="text-gray-600">{r.prescription}</p>
                                </>
                              )}
                              {r.notes && (
                                <>
                                  <p className="font-semibold text-red-900 mb-1 mt-3">Notes</p>
                                  <p className="text-gray-600 italic">{r.notes}</p>
                                </>
                              )}
                            </div>

                            <div>
                              <p className="font-semibold text-red-900 mb-2">Vitals</p>
                              <div className="grid grid-cols-2 gap-2">
                                {[
                                  ["Blood Pressure", r.vitals?.bloodPressure],
                                  ["Heart Rate", r.vitals?.heartRate ? `${r.vitals.heartRate} bpm` : "—"],
                                  ["Temperature", r.vitals?.temperature],
                                  ["Resp. Rate", r.vitals?.respiratoryRate ? `${r.vitals.respiratoryRate}/min` : "—"],
                                  ["Weight", r.vitals?.weight],
                                  ["Height", r.vitals?.height || "—"],
                                  ["SpO2", r.vitals?.oxygenSaturation || "—"],
                                ].map(([label, value]) => (
                                  <div key={label} className="bg-white rounded-lg p-2.5 border border-gray-200">
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</p>
                                    <p className="font-semibold text-gray-800 mt-0.5">{value || "—"}</p>
                                  </div>
                                ))}
                              </div>
                              {r.followUpDate && (
                                <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                                  <p className="text-xs text-amber-800 font-semibold">
                                    Follow-up: {r.followUpDate}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <FileText size={48} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No records found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
