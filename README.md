# ePRIME-RHU

**Electronic Patient Record Information and Management System**  
*Rural Health Unit of Mogpog, Marinduque*

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript |
| Styling | Tailwind CSS + Shadcn UI patterns |
| Backend/DB | Firebase (Auth + Firestore) |
| File Storage | Cloudinary (patient photos, attachments) |
| Email | Nodemailer + Gmail SMTP (via Firebase Cloud Functions) |
| Build Tool | Vite |

---

## System Architecture

```
┌─────────────────────────────────────────────────┐
│                  Display Layer                   │
│  Login · Dashboard · Patients · Records · Admin  │
│         React + TypeScript + Tailwind            │
├─────────────────────────────────────────────────┤
│                Processing Layer                  │
│  Auth Context · Services · Form Validation       │
│         Firebase SDK · React Hooks               │
├──────────────────────┬──────────────────────────┤
│      Data Layer      │   Integration Layer       │
│  Firestore Database  │  Cloudinary (images)      │
│  Firebase Auth       │  Nodemailer (email)       │
│  Security Rules      │  Gmail SMTP               │
└──────────────────────┴──────────────────────────┘
```

---

## Setup Instructions

### 1. Clone & Install

```bash
git clone <repo-url>
cd eprime-rhu
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project called `eprime-rhu`
3. Enable **Authentication** → Email/Password sign-in
4. Enable **Cloud Firestore** (start in test mode, then deploy rules)
5. Copy your config to `.env`:

```bash
cp .env.example .env
# Edit .env with your Firebase credentials
```

6. Deploy Firestore security rules:

```bash
firebase deploy --only firestore:rules
```

### 3. Cloudinary Setup

1. Sign up at [cloudinary.com](https://cloudinary.com/)
2. Create an **unsigned upload preset** named `eprime_rhu_uploads`
3. Add your cloud name and API key to `.env`

### 4. Seed Database

```bash
# Edit scripts/seed.ts with your Firebase config, then:
npx tsx scripts/seed.ts
```

This creates 3 user accounts, 5 patients, and 4 medical records.

### 5. Email Setup (Nodemailer)

1. Enable 2FA on your Gmail account
2. Generate an [App Password](https://myaccount.google.com/apppasswords)
3. Deploy the email Cloud Function:

```bash
cd functions
npm install
firebase deploy --only functions
```

### 6. Run Development Server

```bash
npm run dev
```

Open `http://localhost:5173`

---

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@eprime-rhu.gov.ph | admin123 |
| Doctor | dr.santos@eprime-rhu.gov.ph | doctor123 |
| Nurse | nurse.reyes@eprime-rhu.gov.ph | nurse123 |

---

## Role-Based Access

### Doctor
- View dashboard with stats
- Search & view patient records
- Record consultations (diagnosis, treatment, prescription, vitals)
- View & generate reports

### Nurse / Health Staff
- View dashboard
- Register new patients (with Cloudinary photo upload)
- Search & view patient records
- Assist in updating medical records
- View reports

### Administrative Staff
- All Doctor and Nurse capabilities
- Manage user accounts (create, activate, deactivate)
- View system activity logs
- Create & restore backups
- Generate & export reports

---

## Project Structure

```
eprime-rhu/
├── public/
├── scripts/
│   └── seed.ts              # Database seeder
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   └── LoginPage.tsx
│   │   ├── layout/
│   │   │   └── Layout.tsx        # Sidebar + Header
│   │   ├── dashboard/
│   │   │   └── DashboardPage.tsx
│   │   ├── patients/
│   │   │   └── PatientsPage.tsx  # List + Form + Profile
│   │   ├── records/
│   │   │   └── RecordsPage.tsx
│   │   ├── consultation/
│   │   │   └── ConsultationPage.tsx
│   │   ├── reports/
│   │   │   └── ReportsPage.tsx
│   │   └── admin/
│   │       ├── AccountsPage.tsx
│   │       ├── LogsPage.tsx
│   │       └── BackupPage.tsx
│   ├── config/
│   │   ├── firebase.ts
│   │   └── cloudinary.ts
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── ToastContext.tsx
│   ├── services/
│   │   ├── authService.ts    # Firebase Auth operations
│   │   ├── patientService.ts # Patient CRUD
│   │   ├── recordService.ts  # Medical records CRUD
│   │   ├── adminService.ts   # Logs, users, backups
│   │   └── emailService.ts   # Nodemailer (server-side)
│   ├── types/
│   │   └── index.ts          # All TypeScript interfaces
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css             # Tailwind + custom utilities
├── firestore.rules
├── .env.example
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## Key Features

- **Role-based authentication** with Firebase Auth + Firestore role verification
- **Patient registration** with photo upload to Cloudinary
- **Medical records** with full vitals, diagnosis, treatment, and prescription tracking
- **Doctor consultation** workflow with searchable patient selection
- **Reports** with diagnosis statistics, demographics, CSV export, and print support
- **User management** (admin) with activate/deactivate
- **System audit logs** for all actions
- **Backup & recovery** management
- **Password reset** via Firebase Auth (or Nodemailer for custom emails)
- **Real-time updates** via Firestore subscriptions
- **Responsive design** — works on desktop, tablet, and mobile
- **Print-friendly** report layouts

---

## Build for Production

```bash
npm run build
```

Deploy the `dist/` folder to Firebase Hosting:

```bash
firebase deploy --only hosting
```

---

## License

Proprietary — Rural Health Unit of Mogpog, Marinduque
