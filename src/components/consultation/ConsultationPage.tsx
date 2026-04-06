import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import type { Patient, MedicalRecord } from "@/types";
import { getAllPatients } from "@/services/patientService";
import { createMedicalRecord } from "@/services/recordService";
import { addSystemLog } from "@/services/adminService";
import {
  Stethoscope, Search, Check, Loader2, UserCheck, Clipboard,
  Heart, Thermometer, Activity, Weight, Ruler, Wind,
} from "lucide-react";

export default function ConsultationPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    chiefComplaint: "",
    historyOfPresentIllness: "",
    diagnosis: "",
    treatment: "",
    prescription: "",
    notes: "",
    followUpDate: "",
    // Vitals
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
      (`${p.firstName} ${p.lastName} ${p.patientId}`.toLowerCase().includes(term))
    );
  });

  const selectedPatient = patients.find(
    (p) => p.id === selectedPatientId || p.patientId === selectedPatientId
  );

  const handleSave = async () => {
    if (!selectedPatientId || !form.diagnosis) {
      addToast({ type: "error", title: "Select a patient and enter a diagnosis." });
      return;
    }

    setSaving(true);
    try {
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
        vitals: {
          bloodPressure: form.bloodPressure,
          heartRate: form.heartRate,
          temperature: form.temperature,
          respiratoryRate: form.respiratoryRate,
          weight: form.weight,
          height: form.height,
          oxygenSaturation: form.oxygenSaturation,
        },
        status: form.followUpDate ? "Follow-up" : "Completed",
      });

      await addSystemLog({
        userId: user?.uid || "",
        userName: user?.displayName || "",
        action: "Consultation Recorded",
        details: `Patient: ${selectedPatient?.lastName}, ${selectedPatient?.firstName} | Dx: ${form.diagnosis}`,
        type: "record",
      });

      addToast({ type: "success", title: "Consultation saved successfully!" });

      // Reset form
      setForm({
        chiefComplaint: "", historyOfPresentIllness: "", diagnosis: "",
        treatment: "", prescription: "", notes: "", followUpDate: "",
        bloodPressure: "", heartRate: "", temperature: "",
        respiratoryRate: "", weight: "", height: "", oxygenSaturation: "",
      });
      setSelectedPatientId("");
      setPatientSearch("");
    } catch (err: any) {
      addToast({ type: "error", title: "Failed to save", message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const vitalFields: [string, string, string, React.ReactNode][] = [
    ["Blood Pressure", "bloodPressure", "e.g. 120/80 mmHg", <Heart size={16} key="bp" className="text-red-400" />],
    ["Heart Rate", "heartRate", "bpm", <Activity size={16} key="hr" className="text-pink-400" />],
    ["Temperature", "temperature", "°C", <Thermometer size={16} key="t" className="text-orange-400" />],
    ["Resp. Rate", "respiratoryRate", "/min", <Wind size={16} key="rr" className="text-blue-400" />],
    ["Weight", "weight", "kg", <Weight size={16} key="w" className="text-emerald-400" />],
    ["Height", "height", "cm", <Ruler size={16} key="h" className="text-purple-400" />],
    ["SpO2", "oxygenSaturation", "%", <Activity size={16} key="sp" className="text-cyan-400" />],
  ];

  return (
    <div className="space-y-5">
      {/* Patient Selection */}
      <div className="section-card">
        <h3 className="text-base font-bold text-maroon font-display flex items-center gap-2 mb-4">
          <UserCheck size={20} /> Select Patient
        </h3>

        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-maroon-200" />
          <input
            placeholder="Search patient by name or ID..."
            value={patientSearch}
            onChange={(e) => setPatientSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        {patientSearch && !selectedPatientId && (
          <div className="mt-2 max-h-48 overflow-y-auto border border-maroon-50 rounded-lg">
            {filteredPatients.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedPatientId(p.id);
                  setPatientSearch(`${p.lastName}, ${p.firstName} (${p.patientId})`);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-maroon-50 text-sm flex items-center gap-3 border-b border-maroon-50 last:border-0"
              >
                <div className="w-8 h-8 rounded-full bg-maroon/10 flex items-center justify-center text-maroon text-xs font-bold">
                  {p.firstName[0]}{p.lastName[0]}
                </div>
                <div>
                  <p className="font-medium text-maroon-800">{p.lastName}, {p.firstName}</p>
                  <p className="text-xs text-maroon-200">{p.patientId} · {p.gender} · {p.dateOfBirth}</p>
                </div>
              </button>
            ))}
            {filteredPatients.length === 0 && (
              <p className="px-4 py-3 text-sm text-maroon-200">No matching patients.</p>
            )}
          </div>
        )}

        {selectedPatient && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3">
            <Check size={18} className="text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">
              Selected: {selectedPatient.lastName}, {selectedPatient.firstName} ({selectedPatient.patientId})
            </span>
            <button
              onClick={() => { setSelectedPatientId(""); setPatientSearch(""); }}
              className="ml-auto text-xs text-emerald-600 hover:underline"
            >
              Change
            </button>
          </div>
        )}
      </div>

      {/* Vitals */}
      <div className="section-card">
        <h3 className="text-base font-bold text-maroon font-display flex items-center gap-2 mb-4">
          <Activity size={20} /> Vitals
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {vitalFields.map(([label, key, placeholder, icon]) => (
            <div key={key}>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-maroon-300 mb-1">
                {icon} {label}
              </label>
              <input
                placeholder={placeholder}
                value={(form as any)[key]}
                onChange={(e) => set(key, e.target.value)}
                className="input-field"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Consultation Details */}
      <div className="section-card">
        <h3 className="text-base font-bold text-maroon font-display flex items-center gap-2 mb-4">
          <Clipboard size={20} /> Consultation Details
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-maroon-300 mb-1 block">Chief Complaint</label>
            <input
              value={form.chiefComplaint}
              onChange={(e) => set("chiefComplaint", e.target.value)}
              placeholder="Patient's primary concern..."
              className="input-field"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-maroon-300 mb-1 block">History of Present Illness</label>
            <textarea
              value={form.historyOfPresentIllness}
              onChange={(e) => set("historyOfPresentIllness", e.target.value)}
              rows={3}
              placeholder="Duration, onset, severity, associated symptoms..."
              className="input-field resize-y"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-maroon-300 mb-1 block">
              Diagnosis <span className="text-red-500">*</span>
            </label>
            <input
              value={form.diagnosis}
              onChange={(e) => set("diagnosis", e.target.value)}
              placeholder="Primary diagnosis..."
              className="input-field"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-maroon-300 mb-1 block">Treatment / Management</label>
            <textarea
              value={form.treatment}
              onChange={(e) => set("treatment", e.target.value)}
              rows={3}
              placeholder="Treatment plan, procedures, management..."
              className="input-field resize-y"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-maroon-300 mb-1 block">Prescription (Rx)</label>
            <textarea
              value={form.prescription}
              onChange={(e) => set("prescription", e.target.value)}
              rows={3}
              placeholder="Medications, dosage, frequency, duration..."
              className="input-field resize-y"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-maroon-300 mb-1 block">Additional Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={2}
                placeholder="Any additional observations..."
                className="input-field resize-y"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-maroon-300 mb-1 block">Follow-up Date</label>
              <input
                type="date"
                value={form.followUpDate}
                onChange={(e) => set("followUpDate", e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-maroon-50">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
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
