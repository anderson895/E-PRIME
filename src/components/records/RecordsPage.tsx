import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { MedicalRecord, Patient } from "@/types";
import { getAllRecords } from "@/services/recordService";
import { getAllPatients } from "@/services/patientService";
import { Search, FileText, Filter, Loader2, Eye, Printer } from "lucide-react";

function printRecord(record: MedicalRecord, patient: Patient | undefined) {
  const patientName = patient
    ? `${patient.lastName}, ${patient.firstName} ${patient.middleName || ""}`.trim()
    : "Unknown Patient";
  const patientInfo = patient
    ? `${patient.patientId} · ${patient.gender} · DOB: ${patient.dateOfBirth} · ${patient.address}, ${patient.barangay}, ${patient.municipality}`
    : "";

  const vitalsRows = [
    ["Blood Pressure", record.vitals?.bloodPressure || "—"],
    ["Heart Rate", record.vitals?.heartRate ? `${record.vitals.heartRate} bpm` : "—"],
    ["Temperature", record.vitals?.temperature || "—"],
    ["Respiratory Rate", record.vitals?.respiratoryRate ? `${record.vitals.respiratoryRate}/min` : "—"],
    ["Weight", record.vitals?.weight || "—"],
    ["Height", record.vitals?.height || "—"],
    ["SpO2", record.vitals?.oxygenSaturation || "—"],
  ];

  const win = window.open("", "_blank");
  if (!win) return;

  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Medical Record - ${record.recordId}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: A4 portrait; margin: 1.2cm 1.4cm; }
    body {
      font-family: Arial, sans-serif;
      font-size: 10px;
      color: #1a1a1a;
      line-height: 1.4;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Header ── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2.5px solid #7b0f14;
      padding-bottom: 7px;
      margin-bottom: 8px;
    }
    .header-left h1 { font-size: 15px; color: #7b0f14; font-weight: bold; letter-spacing: 0.03em; }
    .header-left p  { font-size: 9px; color: #666; margin-top: 1px; }
    .header-right   { text-align: right; }
    .record-id      { font-size: 13px; font-weight: bold; color: #7b0f14; }
    .record-meta    { font-size: 9px; color: #777; margin-top: 2px; }
    .status-badge   {
      display: inline-block; padding: 1px 8px;
      border-radius: 99px; font-size: 9px; font-weight: bold;
      margin-top: 3px;
    }
    .status-Completed { background: #d1fae5; color: #065f46; }
    .status-Pending   { background: #fef3c7; color: #92400e; }
    .status-Follow-up { background: #dbeafe; color: #1e40af; }

    /* ── Patient bar ── */
    .patient-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #fafafa;
      border: 1px solid #ddd;
      border-radius: 5px;
      padding: 6px 10px;
      margin-bottom: 8px;
    }
    .patient-name { font-size: 12px; font-weight: bold; }
    .patient-meta { font-size: 9px; color: #666; margin-top: 1px; }

    /* ── Vitals row ── */
    .vitals-row {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 4px;
      margin-bottom: 8px;
    }
    .vital-cell {
      background: #f5f5f5;
      border: 1px solid #e2e2e2;
      border-radius: 3px;
      padding: 4px 6px;
      text-align: center;
    }
    .vital-label { font-size: 7.5px; color: #999; text-transform: uppercase; letter-spacing: 0.04em; }
    .vital-value { font-size: 11px; font-weight: bold; color: #111; margin-top: 2px; }

    /* ── Body grid ── */
    .body-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 8px;
    }
    .col { display: flex; flex-direction: column; gap: 7px; }

    /* ── Section ── */
    .section { page-break-inside: avoid; }
    .section-title {
      font-size: 8.5px;
      font-weight: bold;
      color: #7b0f14;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      border-bottom: 1px solid #e5e5e5;
      padding-bottom: 2px;
      margin-bottom: 4px;
    }
    .section-body {
      font-size: 10px;
      color: #1a1a1a;
      white-space: pre-wrap;
      line-height: 1.45;
    }

    /* ── Follow-up box ── */
    .followup-box {
      background: #fffbeb;
      border: 1px solid #fbbf24;
      border-radius: 3px;
      padding: 4px 8px;
      font-size: 9px;
      font-weight: bold;
      color: #92400e;
      page-break-inside: avoid;
    }

    /* ── Footer strip ── */
    .footer-strip {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-top: 1px solid #ddd;
      padding-top: 6px;
      margin-top: 6px;
    }
    .sig-block { text-align: center; }
    .sig-line  { border-top: 1px solid #333; width: 160px; margin-bottom: 3px; }
    .sig-name  { font-size: 10px; font-weight: bold; }
    .sig-role  { font-size: 9px; color: #555; }
    .print-meta { font-size: 8.5px; color: #aaa; text-align: right; }
  </style>
</head>
<body>

  <!-- HEADER -->
  <div class="header">
    <div class="header-left">
      <h1>ePRIME-RHU</h1>
      <p>Rural Health Unit &nbsp;·&nbsp; Mogpog, Marinduque</p>
    </div>
    <div class="header-right">
      <div class="record-id">${record.recordId}</div>
      <div class="record-meta">Date: ${record.date}</div>
      <span class="status-badge status-${record.status}">${record.status}</span>
    </div>
  </div>

  <!-- PATIENT -->
  <div class="patient-bar">
    <div>
      <div class="patient-name">${patientName}</div>
      <div class="patient-meta">${patientInfo}</div>
    </div>
  </div>

  <!-- VITALS (single compact row) -->
  <div class="vitals-row">
    ${vitalsRows.map(([label, value]) => `
      <div class="vital-cell">
        <div class="vital-label">${label}</div>
        <div class="vital-value">${value}</div>
      </div>`).join("")}
  </div>

  <!-- BODY: two-column -->
  <div class="body-grid">

    <!-- LEFT: Complaint · HPI · Diagnosis -->
    <div class="col">
      ${record.chiefComplaint ? `
      <div class="section">
        <div class="section-title">Chief Complaint</div>
        <div class="section-body">${record.chiefComplaint}</div>
      </div>` : ""}

      ${record.historyOfPresentIllness ? `
      <div class="section">
        <div class="section-title">History of Present Illness</div>
        <div class="section-body">${record.historyOfPresentIllness}</div>
      </div>` : ""}

      <div class="section">
        <div class="section-title">Diagnosis</div>
        <div class="section-body">${record.diagnosis || "—"}</div>
      </div>
    </div>

    <!-- RIGHT: Treatment · Prescription · Notes · Follow-up -->
    <div class="col">
      ${record.treatment ? `
      <div class="section">
        <div class="section-title">Treatment / Management</div>
        <div class="section-body">${record.treatment}</div>
      </div>` : ""}

      ${record.prescription ? `
      <div class="section">
        <div class="section-title">Prescription (Rx)</div>
        <div class="section-body">${record.prescription}</div>
      </div>` : ""}

      ${record.notes ? `
      <div class="section">
        <div class="section-title">Additional Notes</div>
        <div class="section-body">${record.notes}</div>
      </div>` : ""}

      ${record.followUpDate ? `
      <div class="followup-box">Follow-up Date: &nbsp;<strong>${record.followUpDate}</strong></div>` : ""}
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer-strip">
    <div class="print-meta" style="text-align:left; color:#aaa; font-size:8.5px;">
      ePRIME-RHU &nbsp;·&nbsp; Mogpog, Marinduque
    </div>
    <div class="sig-block">
      <div class="sig-line"></div>
      <div class="sig-name">${record.doctorName}</div>
      <div class="sig-role">Attending Physician</div>
    </div>
    <div class="print-meta">
      Printed: ${new Date().toLocaleString("en-PH")}
    </div>
  </div>

  <script>window.onload = function(){ window.print(); }</script>
</body>
</html>`);
  win.document.close();
}

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

  const selectClass =
    "rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-red-800 focus:outline-none focus:ring-1 focus:ring-red-800 w-full sm:w-auto sm:min-w-[160px] shrink-0";

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
          className={selectClass}
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
                <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Actions</th>
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
                      <td className="py-3 pr-4 max-w-[200px] truncate text-gray-700">{r.diagnosis || <span className="text-gray-400 italic">Pending</span>}</td>
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
                        <div className="flex items-center justify-end gap-1">
                          <button
                            title="View"
                            className="inline-flex items-center justify-center p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            title="Print"
                            onClick={(e) => { e.stopPropagation(); printRecord(r, p); }}
                            className="inline-flex items-center justify-center p-1.5 rounded-md text-gray-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                          >
                            <Printer size={14} />
                          </button>
                        </div>
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
                              <p className="text-gray-600">{r.diagnosis || "—"}</p>
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
                              {/* Print button inside expanded view */}
                              <button
                                onClick={() => printRecord(r, p)}
                                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-800 text-xs font-semibold hover:bg-red-50 transition-colors"
                              >
                                <Printer size={13} /> Print This Record
                              </button>
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
