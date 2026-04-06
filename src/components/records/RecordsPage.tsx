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

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-maroon" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-maroon-200" />
          <input
            placeholder="Search by record ID, patient, diagnosis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field w-auto min-w-[140px]"
        >
          <option value="all">All Status</option>
          <option value="Completed">Completed</option>
          <option value="Pending">Pending</option>
          <option value="Follow-up">Follow-up</option>
        </select>
      </div>

      {/* Records Table */}
      <div className="section-card overflow-hidden">
        <div className="overflow-x-auto -mx-6 -mt-6">
          <table className="data-table min-w-[800px] mx-6 mt-6">
            <thead>
              <tr>
                <th>Record ID</th>
                <th>Date</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Diagnosis</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const p = getPatient(r.patientId);
                const isExpanded = expandedId === r.id;
                return (
                  <React.Fragment key={r.id}>
                    <tr className="cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : r.id)}>
                      <td className="font-mono text-xs font-semibold text-maroon">{r.recordId}</td>
                      <td>{r.date}</td>
                      <td className="font-medium">{p ? `${p.lastName}, ${p.firstName}` : "—"}</td>
                      <td className="text-maroon-300">{r.doctorName}</td>
                      <td className="max-w-[200px] truncate">{r.diagnosis}</td>
                      <td>
                        <span className={`badge ${r.status === "Completed" ? "badge-success" : r.status === "Pending" ? "badge-warning" : "badge-info"}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="text-right">
                        <button className="btn-ghost text-xs py-1 px-2">
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="!p-4 bg-maroon-50/30">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="font-semibold text-maroon mb-1">Chief Complaint</p>
                              <p className="text-maroon-300">{r.chiefComplaint || "—"}</p>

                              <p className="font-semibold text-maroon mb-1 mt-3">Diagnosis</p>
                              <p className="text-maroon-300">{r.diagnosis}</p>

                              <p className="font-semibold text-maroon mb-1 mt-3">Treatment</p>
                              <p className="text-maroon-300">{r.treatment}</p>

                              {r.prescription && (
                                <>
                                  <p className="font-semibold text-maroon mb-1 mt-3">Prescription</p>
                                  <p className="text-maroon-300">{r.prescription}</p>
                                </>
                              )}

                              {r.notes && (
                                <>
                                  <p className="font-semibold text-maroon mb-1 mt-3">Notes</p>
                                  <p className="text-maroon-300 italic">{r.notes}</p>
                                </>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-maroon mb-2">Vitals</p>
                              <div className="grid grid-cols-2 gap-2">
                                {[
                                  ["Blood Pressure", r.vitals.bloodPressure],
                                  ["Heart Rate", `${r.vitals.heartRate} bpm`],
                                  ["Temperature", r.vitals.temperature],
                                  ["Resp. Rate", `${r.vitals.respiratoryRate}/min`],
                                  ["Weight", r.vitals.weight],
                                  ["Height", r.vitals.height || "—"],
                                  ["SpO2", r.vitals.oxygenSaturation || "—"],
                                ].map(([label, value]) => (
                                  <div key={label} className="bg-white rounded-lg p-2.5 border border-maroon-50">
                                    <p className="text-[10px] text-maroon-200 uppercase tracking-wider">{label}</p>
                                    <p className="font-semibold text-maroon">{value}</p>
                                  </div>
                                ))}
                              </div>

                              {r.followUpDate && (
                                <div className="mt-3 p-2.5 bg-gold-50 border border-gold-200 rounded-lg">
                                  <p className="text-xs text-gold-700 font-semibold">
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
            <div className="text-center py-12 text-maroon-200">
              <FileText size={48} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No records found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
