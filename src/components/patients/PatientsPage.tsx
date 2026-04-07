import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import type { Patient } from "@/types";
import {
  getAllPatients,
  createPatient,
  updatePatient,
  deactivatePatient,
  searchPatients,
} from "@/services/patientService";
import { addSystemLog } from "@/services/adminService";
import { uploadToCloudinary, getCloudinaryThumbnail } from "@/config/cloudinary";
import {
  Search, UserPlus, Users, Eye, Edit, Trash2, X, Loader2,
  Phone, MapPin, Droplets, AlertCircle, Camera, ChevronLeft,
  Calendar, User, Heart, FileText, Activity,
} from "lucide-react";

interface Props {
  onViewPatient?: (patient: Patient) => void;
}

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-red-800 focus:outline-none focus:ring-1 focus:ring-red-800";

const cardClass = "bg-white rounded-xl border border-gray-200 shadow-sm p-5";

export default function PatientsPage({ onViewPatient }: Props) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);

  const canRegister = user?.role === "Nurse" || user?.role === "Administrative Staff";

  useEffect(() => {
    loadPatients();
  }, []);

  async function loadPatients() {
    try {
      const data = await getAllPatients();
      setPatients(data);
    } catch (err) {
      addToast({ type: "error", title: "Failed to load patients" });
    } finally {
      setLoading(false);
    }
  }

  const filtered = patients.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.firstName.toLowerCase().includes(term) ||
      p.lastName.toLowerCase().includes(term) ||
      p.patientId.toLowerCase().includes(term) ||
      p.contactNumber.includes(term)
    );
  });

  if (viewingPatient) {
    return (
      <PatientProfile
        patient={viewingPatient}
        onBack={() => setViewingPatient(null)}
        onEdit={(p) => { setEditingPatient(p); setShowForm(true); setViewingPatient(null); }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Search by name, ID, or contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`${inputClass} pl-10`}
          />
        </div>
        {canRegister && (
          <button
            onClick={() => { setEditingPatient(null); setShowForm(true); }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-900 text-white text-sm font-semibold hover:bg-red-800 transition-colors whitespace-nowrap"
          >
            <UserPlus size={16} />
            Register Patient
          </button>
        )}
      </div>

      {/* Registration / Edit Form */}
      {showForm && (
        <PatientForm
          patient={editingPatient}
          onClose={() => { setShowForm(false); setEditingPatient(null); }}
          onSaved={() => { setShowForm(false); setEditingPatient(null); loadPatients(); }}
        />
      )}

      {/* Patient Cards */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-red-900" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow group border-l-4 border-l-red-900"
              onClick={() => setViewingPatient(p)}
            >
              {/* Avatar */}
              <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center text-red-900 font-bold text-sm flex-shrink-0">
                {p.photoURL ? (
                  <img src={getCloudinaryThumbnail(p.photoURL, 44, 44)} className="w-11 h-11 rounded-full object-cover" alt="" />
                ) : (
                  `${p.firstName[0]}${p.lastName[0]}`
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 group-hover:text-red-900 transition-colors">
                  {p.lastName}, {p.firstName} {p.middleName}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500 mt-0.5">
                  <span className="font-mono">{p.patientId}</span>
                  <span>{p.gender}</span>
                  <span>{p.dateOfBirth}</span>
                  <span className="flex items-center gap-1">
                    <Phone size={10} /> {p.contactNumber}
                  </span>
                </div>
              </div>

              {/* Status & Action */}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                p.status === "Active"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-red-100 text-red-800"
              }`}>
                {p.status}
              </span>
              <Eye size={18} className="text-gray-400 group-hover:text-red-900 transition-colors flex-shrink-0" />
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Users size={48} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium text-gray-500">No patients found</p>
              <p className="text-xs mt-1 text-gray-400">
                {searchTerm ? "Try a different search term" : "Register a new patient to get started"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Patient Registration / Edit Form ───────────────────────────
interface FormProps {
  patient: Patient | null;
  onClose: () => void;
  onSaved: () => void;
}

function PatientForm({ patient, onClose, onSaved }: FormProps) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    firstName: patient?.firstName || "",
    middleName: patient?.middleName || "",
    lastName: patient?.lastName || "",
    suffix: patient?.suffix || "",
    dateOfBirth: patient?.dateOfBirth || "",
    gender: (patient?.gender || "Male") as "Male" | "Female",
    civilStatus: (patient?.civilStatus || "Single") as Patient["civilStatus"],
    address: patient?.address || "",
    barangay: patient?.barangay || "",
    municipality: patient?.municipality || "Mogpog",
    province: patient?.province || "Marinduque",
    contactNumber: patient?.contactNumber || "",
    email: patient?.email || "",
    bloodType: patient?.bloodType || "O+",
    allergies: patient?.allergies || "",
    emergencyContactName: patient?.emergencyContactName || "",
    emergencyContactNumber: patient?.emergencyContactNumber || "",
    emergencyContactRelation: patient?.emergencyContactRelation || "",
  });

  const set = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.firstName || !form.lastName || !form.dateOfBirth) {
      addToast({ type: "error", title: "Please fill all required fields" });
      return;
    }

    setSaving(true);
    try {
      let photoURL = patient?.photoURL || "";

      if (photoFile) {
        const result = await uploadToCloudinary(photoFile, "patients");
        photoURL = result.url;
      }

      if (patient) {
        await updatePatient(patient.id, { ...form, photoURL });
        addToast({ type: "success", title: "Patient updated successfully" });
      } else {
        await createPatient({
          ...form,
          photoURL,
          status: "Active",
          registeredBy: user?.uid || "",
        } as any);
        addToast({ type: "success", title: "Patient registered successfully" });

        await addSystemLog({
          userId: user?.uid || "",
          userName: user?.displayName || "",
          action: "Patient Registered",
          details: `${form.lastName}, ${form.firstName}`,
          type: "record",
        });
      }

      onSaved();
    } catch (err: any) {
      addToast({ type: "error", title: "Failed to save", message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const fields: [string, string, string, boolean?][] = [
    ["First Name", "firstName", "text", true],
    ["Middle Name", "middleName", "text"],
    ["Last Name", "lastName", "text", true],
    ["Suffix (Jr, III, etc.)", "suffix", "text"],
    ["Date of Birth", "dateOfBirth", "date", true],
    ["Contact Number", "contactNumber", "tel"],
    ["Email", "email", "email"],
    ["Address", "address", "text"],
    ["Barangay", "barangay", "text"],
    ["Municipality", "municipality", "text"],
    ["Province", "province", "text"],
    ["Blood Type", "bloodType", "text"],
    ["Allergies", "allergies", "text"],
    ["Emergency Contact Name", "emergencyContactName", "text"],
    ["Emergency Contact Number", "emergencyContactNumber", "tel"],
    ["Emergency Contact Relation", "emergencyContactRelation", "text"],
  ];

  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-red-900">
          {patient ? "Edit Patient" : "New Patient Registration"}
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Photo Upload */}
      <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-200">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center overflow-hidden">
          {photoFile ? (
            <img src={URL.createObjectURL(photoFile)} className="w-16 h-16 object-cover" alt="" />
          ) : patient?.photoURL ? (
            <img src={patient.photoURL} className="w-16 h-16 object-cover" alt="" />
          ) : (
            <Camera size={24} className="text-gray-400" />
          )}
        </div>
        <div>
          <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-medium text-gray-600 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
            <Camera size={14} />
            {photoFile ? "Change Photo" : "Upload Photo"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && setPhotoFile(e.target.files[0])}
            />
          </label>
          <p className="text-[10px] text-gray-400 mt-1">JPG, PNG. Max 5MB. Stored on Cloudinary.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {fields.map(([label, key, type, required]) => (
          <div key={key}>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
              type={type}
              value={(form as any)[key]}
              onChange={(e) => set(key, e.target.value)}
              className={inputClass}
            />
          </div>
        ))}

        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">
            Gender <span className="text-red-500">*</span>
          </label>
          <select
            value={form.gender}
            onChange={(e) => set("gender", e.target.value)}
            className={inputClass}
          >
            <option>Male</option>
            <option>Female</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Civil Status</label>
          <select
            value={form.civilStatus}
            onChange={(e) => set("civilStatus", e.target.value)}
            className={inputClass}
          >
            <option>Single</option>
            <option>Married</option>
            <option>Widowed</option>
            <option>Separated</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 justify-end">
        <button
          onClick={onClose}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-900 text-white text-sm font-semibold hover:bg-red-800 disabled:opacity-60 transition-colors"
        >
          {saving ? (
            <><Loader2 size={16} className="animate-spin" /> Saving...</>
          ) : patient ? (
            "Update Patient"
          ) : (
            <><UserPlus size={16} /> Register Patient</>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Patient Profile View ───────────────────────────────────────
interface ProfileProps {
  patient: Patient;
  onBack: () => void;
  onEdit: (p: Patient) => void;
}

function PatientProfile({ patient, onBack, onEdit }: ProfileProps) {
  const [tab, setTab] = useState<"info" | "history" | "vitals">("info");
  const [records, setRecords] = useState<import("@/types").MedicalRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [recordsError, setRecordsError] = useState<string | null>(null);

  useEffect(() => {
    setRecordsLoading(true);
    setRecordsError(null);
    import("@/services/recordService").then(({ getPatientRecords }) => {
      getPatientRecords(patient.id)
        .then((data) => {
          setRecords(data);
          setRecordsLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load patient records:", err);
          setRecordsError("Failed to load records. Please try again.");
          setRecordsLoading(false);
        });
    });
  }, [patient.id]);

  const initials = `${patient.firstName[0]}${patient.lastName[0]}`;

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-red-900 hover:text-red-700 transition-colors px-0"
      >
        <ChevronLeft size={16} /> Back to Patient List
      </button>

      {/* Header */}
      <div className={cardClass}>
        <div className="flex flex-wrap items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-900 to-red-700 flex items-center justify-center text-white font-bold text-xl flex-shrink-0 overflow-hidden">
            {patient.photoURL ? (
              <img src={patient.photoURL} className="w-16 h-16 rounded-full object-cover" alt="" />
            ) : initials}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-red-900">
              {patient.lastName}, {patient.firstName} {patient.middleName} {patient.suffix}
            </h2>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
              <span className="font-mono text-xs font-semibold text-gray-700">{patient.patientId}</span>
              <span>{patient.gender}</span>
              <span>DOB: {patient.dateOfBirth}</span>
              <span className="flex items-center gap-1"><Droplets size={12} /> {patient.bloodType}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              patient.status === "Active"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-red-100 text-red-800"
            }`}>
              {patient.status}
            </span>
            <button
              onClick={() => onEdit(patient)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Edit size={14} /> Edit
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-200">
        {(["info", "history", "vitals"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-sm rounded-lg font-medium transition-all capitalize ${
              tab === t
                ? "bg-red-900 text-white shadow-sm"
                : "text-gray-500 hover:text-red-900 hover:bg-red-50"
            }`}
          >
            {t === "info" ? "Personal Info" : t === "history" ? "Medical History" : "Vitals"}
          </button>
        ))}
      </div>

      <div className={cardClass}>
        {tab === "info" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              ["Contact", patient.contactNumber, <Phone size={14} key="p" />],
              ["Email", patient.email || "—", <User size={14} key="e" />],
              ["Address", `${patient.address}, ${patient.barangay}, ${patient.municipality}, ${patient.province}`, <MapPin size={14} key="a" />],
              ["Civil Status", patient.civilStatus, <Heart size={14} key="c" />],
              ["Blood Type", patient.bloodType, <Droplets size={14} key="b" />],
              ["Allergies", patient.allergies || "None", <AlertCircle size={14} key="al" />],
              ["Emergency Contact", `${patient.emergencyContactName} (${patient.emergencyContactRelation}) — ${patient.emergencyContactNumber}`, <Phone size={14} key="ec" />],
              ["Registered", patient.registeredDate, <Calendar size={14} key="r" />],
            ].map(([label, value, icon]) => (
              <div key={label as string}>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-1">
                  {icon} {label as string}
                </div>
                <p className="text-sm text-gray-800">{value as string}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "history" && (
          recordsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-red-900" /></div>
          ) : recordsError ? (
            <p className="text-center text-red-500 py-8">{recordsError}</p>
          ) : records.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No medical records found.</p>
          ) : (
            <div className="space-y-4">
              {records.map((r) => (
                <div key={r.id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex justify-between flex-wrap gap-2 mb-2">
                    <span className="font-semibold text-red-900 text-sm">{r.date} — {r.recordId}</span>
                    <span className="text-xs text-gray-400">{r.doctorName}</span>
                  </div>
                  <p className="text-sm text-gray-700"><strong className="text-gray-600">Complaint:</strong> {r.chiefComplaint}</p>
                  <p className="text-sm text-gray-700 mt-1"><strong className="text-gray-600">Diagnosis:</strong> {r.diagnosis}</p>
                  <p className="text-sm text-gray-700 mt-1"><strong className="text-gray-600">Treatment:</strong> {r.treatment}</p>
                  {r.prescription && (
                    <p className="text-sm text-gray-700 mt-1"><strong className="text-gray-600">Rx:</strong> {r.prescription}</p>
                  )}
                  {r.notes && (
                    <p className="text-xs text-gray-400 mt-2 italic">{r.notes}</p>
                  )}
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                    r.status === "Completed"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          )
        )}

        {tab === "vitals" && (
          recordsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-red-900" /></div>
          ) : recordsError ? (
            <p className="text-center text-red-500 py-8">{recordsError}</p>
          ) : records.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No vitals recorded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    {["Date","BP","HR","Temp","RR","Weight","Height","SpO2"].map((h) => (
                      <th key={h} className="pb-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {records.map((r) => (
                    <tr key={r.id} className="text-gray-700">
                      <td className="py-2 pr-4">{r.date}</td>
                      <td className="py-2 pr-4">{r.vitals.bloodPressure}</td>
                      <td className="py-2 pr-4">{r.vitals.heartRate} bpm</td>
                      <td className="py-2 pr-4">{r.vitals.temperature}</td>
                      <td className="py-2 pr-4">{r.vitals.respiratoryRate}/min</td>
                      <td className="py-2 pr-4">{r.vitals.weight}</td>
                      <td className="py-2 pr-4">{r.vitals.height || "—"}</td>
                      <td className="py-2 pr-4">{r.vitals.oxygenSaturation || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}