import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import type { Patient, MedicalRecord } from "@/types";
import { getAllPatients } from "@/services/patientService";
import { createMedicalRecord, getPatientRecords } from "@/services/recordService";
import { addSystemLog } from "@/services/adminService";
import {
  Search, Check, Loader2, UserCheck,
  Heart, Thermometer, Activity, Weight, Ruler, Wind, CheckCircle2,
} from "lucide-react";

export default function VitalsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [existingPending, setExistingPending] = useState<MedicalRecord | null>(null);
  const [checkingPending, setCheckingPending] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    bloodPressure: "",
    heartRate: "",
    temperature: "",
    respiratoryRate: "",
    weight: "",
    height: "",
    oxygenSaturation: "",
    chiefComplaint: "",
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

  // When patient is selected, check if there's already a pending vitals record today
  const handleSelectPatient = async (p: Patient) => {
    setSelectedPatientId(p.id);
    setPatientSearch(`${p.lastName}, ${p.firstName} (${p.patientId})`);
    setSaved(false);
    setCheckingPending(true);
    try {
      const records = await getPatientRecords(p.id);
      const today = new Date().toISOString().split("T")[0];
      const pending = records.find(
        (r) => r.status === "Pending" && r.date === today && r.vitals?.bloodPressure !== undefined
      );
      setExistingPending(pending || null);
      if (pending) {
        // Pre-fill form with existing vitals
        setForm({
          bloodPressure: pending.vitals?.bloodPressure || "",
          heartRate: pending.vitals?.heartRate || "",
          temperature: pending.vitals?.temperature || "",
          respiratoryRate: pending.vitals?.respiratoryRate || "",
          weight: pending.vitals?.weight || "",
          height: pending.vitals?.height || "",
          oxygenSaturation: pending.vitals?.oxygenSaturation || "",
          chiefComplaint: pending.chiefComplaint || "",
        });
      } else {
        setForm({
          bloodPressure: "", heartRate: "", temperature: "",
          respiratoryRate: "", weight: "", height: "",
          oxygenSaturation: "", chiefComplaint: "",
        });
      }
    } catch {
      setExistingPending(null);
    } finally {
      setCheckingPending(false);
    }
  };

  const handleSave = async () => {
    if (!selectedPatientId) {
      addToast({ type: "error", title: "Please select a patient first." });
      return;
    }
    if (!form.bloodPressure && !form.heartRate && !form.temperature) {
      addToast({ type: "error", title: "Please enter at least one vital sign." });
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
        historyOfPresentIllness: "",
        diagnosis: "",
        treatment: "",
        prescription: "",
        notes: `Vitals taken by nurse: ${user?.displayName || ""}`,
        vitals: {
          bloodPressure: form.bloodPressure,
          heartRate: form.heartRate,
          temperature: form.temperature,
          respiratoryRate: form.respiratoryRate,
          weight: form.weight,
          height: form.height,
          oxygenSaturation: form.oxygenSaturation,
        },
        status: "Pending",
      });

      await addSystemLog({
        userId: user?.uid || "",
        userName: user?.displayName || "",
        action: "Vitals Recorded",
        details: `Patient: ${selectedPatient?.lastName}, ${selectedPatient?.firstName} | BP: ${form.bloodPressure || "—"}`,
        type: "record",
      });

      setSaved(true);
      addToast({ type: "success", title: "Vitals saved! Patient is ready for consultation." });

      // Reset form for next patient
      setTimeout(() => {
        setForm({
          bloodPressure: "", heartRate: "", temperature: "",
          respiratoryRate: "", weight: "", height: "",
          oxygenSaturation: "", chiefComplaint: "",
        });
        setSelectedPatientId("");
        setPatientSearch("");
        setExistingPending(null);
        setSaved(false);
      }, 2500);
    } catch (err: any) {
      addToast({ type: "error", title: "Failed to save vitals", message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-red-800 focus:outline-none focus:ring-1 focus:ring-red-800";

  const cardClass = "bg-white rounded-xl border border-gray-200 shadow-sm p-5";

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
      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800 flex items-start gap-2">
        <Activity size={16} className="mt-0.5 flex-shrink-0" />
        <span>
          Record the patient's vital signs here before they see the doctor. The doctor will see these vitals automatically during consultation.
        </span>
      </div>

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
              if (!e.target.value) {
                setSelectedPatientId("");
                setExistingPending(null);
                setSaved(false);
              }
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

        {checkingPending && (
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
            <Loader2 size={14} className="animate-spin" /> Checking existing records...
          </div>
        )}

        {selectedPatient && !checkingPending && (
          <div className="mt-3 space-y-2">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3">
              <Check size={18} className="text-emerald-600" />
              <span className="text-sm font-medium text-emerald-800">
                Selected: {selectedPatient.lastName}, {selectedPatient.firstName} ({selectedPatient.patientId})
              </span>
              <button
                onClick={() => {
                  setSelectedPatientId("");
                  setPatientSearch("");
                  setExistingPending(null);
                  setSaved(false);
                }}
                className="ml-auto text-xs text-emerald-700 hover:underline"
              >
                Change
              </button>
            </div>
            {existingPending && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                ⚠️ Vitals already recorded for this patient today. You may update them below.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chief Complaint */}
      <div className={cardClass}>
        <h3 className="text-base font-bold text-red-900 mb-3">Chief Complaint</h3>
        <input
          value={form.chiefComplaint}
          onChange={(e) => set("chiefComplaint", e.target.value)}
          placeholder="Patient's primary concern (e.g. headache, fever, cough...)"
          className={inputClass}
        />
      </div>

      {/* Vitals Form */}
      <div className={cardClass}>
        <h3 className="text-base font-bold text-red-900 flex items-center gap-2 mb-4">
          <Activity size={20} /> Vital Signs
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {vitalFields.map(([label, key, placeholder, icon]) => (
            <div key={key}>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1">
                {icon} {label}
              </label>
              <input
                placeholder={placeholder}
                value={(form as any)[key]}
                onChange={(e) => set(key, e.target.value)}
                className={inputClass}
                disabled={!selectedPatientId}
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
          {saved ? (
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold">
              <CheckCircle2 size={16} /> Vitals Saved!
            </div>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving || !selectedPatientId}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-900 text-white text-sm font-semibold hover:bg-red-800 disabled:opacity-60 transition-colors"
            >
              {saving ? (
                <><Loader2 size={16} className="animate-spin" /> Saving...</>
              ) : (
                <><Check size={16} /> Save Vitals</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
