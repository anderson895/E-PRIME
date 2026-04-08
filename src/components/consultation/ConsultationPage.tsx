import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import type { Patient, MedicalRecord } from "@/types";
import { getAllPatients } from "@/services/patientService";
import { createMedicalRecord, getPatientRecords, updateMedicalRecord } from "@/services/recordService";
import { addSystemLog } from "@/services/adminService";
import {
  Search, Check, Loader2, UserCheck, Clipboard,
  Heart, Thermometer, Activity, Weight, Ruler, Wind, ShieldCheck,
} from "lucide-react";

export default function ConsultationPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingRecord, setPendingRecord] = useState<MedicalRecord | null>(null);
  const [loadingVitals, setLoadingVitals] = useState(false);

  const [form, setForm] = useState({
    chiefComplaint: "",
    historyOfPresentIllness: "",
    diagnosis: "",
    treatment: "",
    prescription: "",
    notes: "",
    followUpDate: "",
  });

  const [vitals, setVitals] = useState({
    bloodPressure: "",
    heartRate: "",
    temperature: "",
    respiratoryRate: "",
    weight: "",
    height: "",
    oxygenSaturation: "",
  });

  useEffect(() => {
    getAllPatients().then(setPatients).catch(() => {});
  }, []);

  const set = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const filteredPatients = patients.filter((p) => {
    const term = patientSearch.toLowerCase();
    return (
      p.status === "Active" &&
      `${p.firstName} ${p.lastName} ${p.patientId}`.toLowerCase().includes(term)
    );
  });

  const selectedPatient = patients.find(
    (p) => p.id === selectedPatientId || p.patientId === selectedPatientId
  );

  const handleSelectPatient = async (p: Patient) => {
    setSelectedPatientId(p.id);
    setPatientSearch(`${p.lastName}, ${p.firstName} (${p.patientId})`);
    setLoadingVitals(true);
    setPendingRecord(null);
    setVitals({ bloodPressure: "", heartRate: "", temperature: "", respiratoryRate: "", weight: "", height: "", oxygenSaturation: "" });
    setForm({ chiefComplaint: "", historyOfPresentIllness: "", diagnosis: "", treatment: "", prescription: "", notes: "", followUpDate: "" });

    try {
      const records = await getPatientRecords(p.id);
      const today = new Date().toISOString().split("T")[0];
      const pending = records.find((r) => r.status === "Pending" && r.date === today);
      if (pending) {
        setPendingRecord(pending);
        setVitals({
          bloodPressure: pending.vitals?.bloodPressure || "",
          heartRate: pending.vitals?.heartRate || "",
          temperature: pending.vitals?.temperature || "",
          respiratoryRate: pending.vitals?.respiratoryRate || "",
          weight: pending.vitals?.weight || "",
          height: pending.vitals?.height || "",
          oxygenSaturation: pending.vitals?.oxygenSaturation || "",
        });
        setForm((prev) => ({ ...prev, chiefComplaint: pending.chiefComplaint || "" }));
      }
    } catch {
      // No pending record — proceed normally
    } finally {
      setLoadingVitals(false);
    }
  };

  const handleSave = async () => {
    if (!selectedPatientId || !form.diagnosis) {
      addToast({ type: "error", title: "Select a patient and enter a diagnosis." });
      return;
    }

    setSaving(true);
    try {
      if (pendingRecord) {
        await updateMedicalRecord(pendingRecord.id, {
          doctorId: user?.uid || "",
          doctorName: user?.displayName || "",
          chiefComplaint: form.chiefComplaint,
          historyOfPresentIllness: form.historyOfPresentIllness,
          diagnosis: form.diagnosis,
          treatment: form.treatment,
          prescription: form.prescription,
          notes: form.notes,
          followUpDate: form.followUpDate || undefined,
          status: form.followUpDate ? "Follow-up" : "Completed",
        });
      } else {
        await createMedicalRecord({
          patientId: selectedPatientId,
          date: new Date().toISOString().split("T")[0],
          doctorId: user?.uid || "",
          doctorName: user?.displayName || "",
          chiefComplaint: form.chiefComplaint,
          historyOfPresentIllness: form.historyOfPresentIllness,
          diagnosis: form.diagnosis,
          treatment: form.treatment,
          prescription: form.prescription,
          notes: form.notes,
          followUpDate: form.followUpDate || undefined,
          vitals: { ...vitals },
          status: form.followUpDate ? "Follow-up" : "Completed",
        });
      }

      await addSystemLog({
        userId: user?.uid || "",
        userName: user?.displayName || "",
        action: "Consultation Recorded",
        details: `Patient: ${selectedPatient?.lastName}, ${selectedPatient?.firstName} | Dx: ${form.diagnosis}`,
        type: "record",
      });

      addToast({ type: "success", title: "Consultation saved successfully!" });
      setForm({ chiefComplaint: "", historyOfPresentIllness: "", diagnosis: "", treatment: "", prescription: "", notes: "", followUpDate: "" });
      setVitals({ bloodPressure: "", heartRate: "", temperature: "", respiratoryRate: "", weight: "", height: "", oxygenSaturation: "" });
      setSelectedPatientId("");
      setPatientSearch("");
      setPendingRecord(null);
    } catch (err: any) {
      addToast({ type: "error", title: "Failed to save", message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-red-800 focus:outline-none focus:ring-1 focus:ring-red-800";

  const cardClass = "bg-white rounded-xl border border-gray-200 shadow-sm p-5";

  const vitalItems: [string, string, React.ReactNode][] = [
    ["Blood Pressure", vitals.bloodPressure || "—", <Heart size={14} key="bp" className="text-red-400" />],
    ["Heart Rate", vitals.heartRate ? `${vitals.heartRate} bpm` : "—", <Activity size={14} key="hr" className="text-pink-400" />],
    ["Temperature", vitals.temperature ? `${vitals.temperature} °C` : "—", <Thermometer size={14} key="t" className="text-orange-400" />],
    ["Resp. Rate", vitals.respiratoryRate ? `${vitals.respiratoryRate}/min` : "—", <Wind size={14} key="rr" className="text-blue-400" />],
    ["Weight", vitals.weight ? `${vitals.weight} kg` : "—", <Weight size={14} key="w" className="text-emerald-400" />],
    ["Height", vitals.height ? `${vitals.height} cm` : "—", <Ruler size={14} key="h" className="text-purple-400" />],
    ["SpO2", vitals.oxygenSaturation ? `${vitals.oxygenSaturation}%` : "—", <Activity size={14} key="sp" className="text-cyan-400" />],
  ];

  return (
    <div className="space-y-5">
      {/* Patient Selection */}
      <div className={cardClass}>
        <h3 className="text-base font-bold text-red-900 flex items-center gap-2 mb-4">
          <UserCheck size={20} /> Select Patient
        </h3>

        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Search patient by name or ID..."
            value={patientSearch}
            onChange={(e) => {
              setPatientSearch(e.target.value);
              if (!e.target.value) { setSelectedPatientId(""); setPendingRecord(null); }
            }}
            className={`${inputClass} pl-10`}
          />
        </div>

        {patientSearch && !selectedPatientId && (
          <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
            {filteredPatients.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectPatient(p)}
                className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-sm flex items-center gap-3 border-b border-gray-100 last:border-0"
              >
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-900 text-xs font-bold">
                  {p.firstName[0]}{p.lastName[0]}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{p.lastName}, {p.firstName}</p>
                  <p className="text-xs text-gray-500">{p.patientId} · {p.gender} · {p.dateOfBirth}</p>
                </div>
              </button>
            ))}
            {filteredPatients.length === 0 && (
              <p className="px-4 py-3 text-sm text-gray-500">No matching patients.</p>
            )}
          </div>
        )}

        {loadingVitals && (
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
            <Loader2 size={14} className="animate-spin" /> Loading patient vitals...
          </div>
        )}

        {selectedPatient && !loadingVitals && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3">
            <Check size={18} className="text-emerald-600" />
            <span className="text-sm font-medium text-emerald-800">
              Selected: {selectedPatient.lastName}, {selectedPatient.firstName} ({selectedPatient.patientId})
            </span>
            <button
              onClick={() => { setSelectedPatientId(""); setPatientSearch(""); setPendingRecord(null); }}
              className="ml-auto text-xs text-emerald-700 hover:underline"
            >
              Change
            </button>
          </div>
        )}
      </div>

      {/* Vitals — read-only from nurse */}
      {selectedPatient && !loadingVitals && (
        <div className={cardClass}>
          <h3 className="text-base font-bold text-red-900 flex items-center gap-2 mb-1">
            <Activity size={20} /> Vital Signs
          </h3>

          {pendingRecord ? (
            <>
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium mb-3">
                <ShieldCheck size={13} />
                Recorded by nurse · {pendingRecord.date}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {vitalItems.map(([label, value, icon]) => (
                  <div key={label} className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                    <p className="flex items-center gap-1 text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                      {icon} {label}
                    </p>
                    <p className="font-semibold text-gray-800 text-sm">{value}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              ⚠️ No vitals recorded by the nurse yet for today. You may proceed with the consultation.
            </div>
          )}
        </div>
      )}

      {/* Consultation Details */}
      <div className={cardClass}>
        <h3 className="text-base font-bold text-red-900 flex items-center gap-2 mb-4">
          <Clipboard size={20} /> Consultation Details
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Chief Complaint</label>
            <input
              value={form.chiefComplaint}
              onChange={(e) => set("chiefComplaint", e.target.value)}
              placeholder="Patient's primary concern..."
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">History of Present Illness</label>
            <textarea
              value={form.historyOfPresentIllness}
              onChange={(e) => set("historyOfPresentIllness", e.target.value)}
              rows={3}
              placeholder="Duration, onset, severity, associated symptoms..."
              className={`${inputClass} resize-y`}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">
              Diagnosis <span className="text-red-500">*</span>
            </label>
            <input
              value={form.diagnosis}
              onChange={(e) => set("diagnosis", e.target.value)}
              placeholder="Primary diagnosis..."
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Treatment / Management</label>
            <textarea
              value={form.treatment}
              onChange={(e) => set("treatment", e.target.value)}
              rows={3}
              placeholder="Treatment plan, procedures, management..."
              className={`${inputClass} resize-y`}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Prescription (Rx)</label>
            <textarea
              value={form.prescription}
              onChange={(e) => set("prescription", e.target.value)}
              rows={3}
              placeholder="Medications, dosage, frequency, duration..."
              className={`${inputClass} resize-y`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Additional Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={2}
                placeholder="Any additional observations..."
                className={`${inputClass} resize-y`}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Follow-up Date</label>
              <input
                type="date"
                value={form.followUpDate}
                onChange={(e) => set("followUpDate", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-900 text-white text-sm font-semibold hover:bg-red-800 disabled:opacity-60 transition-colors"
          >
            {saving ? (
              <><Loader2 size={16} className="animate-spin" /> Saving...</>
            ) : (
              <><Check size={16} /> Save Consultation</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
