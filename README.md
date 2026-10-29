# Sirisoft Timesheet Pro — Next.js & shadcn/ui Modernization

A reverse-engineered, high-performance modernization of the [Sirisoft Timesheet Portal](https://timesheet.sirisoft.co.th/timesheet). Built with **Next.js 16 (App Router + Turbopack)**, **Tailwind CSS v4**, and **shadcn/ui**.

---

## 🛡️ Critical Safety Policy & Backend Guard

Per strict operational requirements:
> **"Dont accidentally send anything to backend (CRUD, only R is allowed; get method else not)"**

### How This Guarantee Is Enforced:
1. **Hardcoded Interceptor Boundary ([`src/services/apiSafetyClient.ts`](file:///Users/sinthonwilke/On%20My%20Mac/GitLocal/fake_timesheet/src/services/apiSafetyClient.ts))**:
   - Every network dispatch to the backend is intercepted.
   - Any method other than `GET` or `HEAD` (such as `POST`, `PUT`, `DELETE`, `PATCH`) is **strictly blocked** before leaving the client.
   - Blocked requests log an alert in the in-app **Safety Audit Log** and never reach the remote server (`backend.timesheet.sirisoft.co.th`).
2. **Local Reactive Store & Optimistic State**:
   - All mutations (creating entries, editing, deleting, batch approving, rejecting, cutoff locking) persist safely in browser storage (`localStorage`), giving you a fully functioning app with instant feedback and zero risk of corrupting remote records.

---

## 🔍 Reverse-Engineering Summary

From decompiling the original Angular bundles (`main.cc5767fe013d0105.js`, `configuration.json`):

| Area | Original Implementation | Reverse-Engineered Details |
|---|---|---|
| **Base API** | `https://backend.timesheet.sirisoft.co.th/api` | Behind Kong 2.8.1 API Gateway with Azure AD Bearer tokens (`clientId: d6a5eecc-b482-4539-a823-15867c6e8b3f`) |
| **All-Day Rule** | Splits workday into 2 halves | First half: `09:00 - 12:00` (3 hrs), Second half: `13:00 - 18:00` (5 hrs) with 1h lunch (Total = 8.0 hrs) |
| **Statuses** | `Nl` Enum | `Waiting`, `Approve`, `Reject` (with rejection reason) |
| **Leaves** | `Wy` Enum | `0` (None), `1` (Half Day - 4 hrs), `2` (Full Day - 8 hrs) |
| **Cutoff Lock** | `/timesheet-service/config/timesheet` | `unlock_timesheet_date` (blocks entries prior to date) |
| **Assets** | S3 / CloudFront | Authentic SVGs and logos extracted to `public/assets/images/` |

---

## 🚀 UX & UI Improvements

| Legacy Portal | Modernized Next.js + shadcn/ui Portal |
|---|---|
| Rigid PrimeNG / Material hybrid tables | Sleek **shadcn/ui** design with Sirisoft Emerald brand palette (`#238763`) |
| Only list view available | **Dual View Modes**: Interactive **Table View** + Visual **Monthly Timeline Calendar** |
| Confusing all-day checkbox | **Smart Time Dialog**: Auto-split 8-hour workday, instant duration presets (Morning 3h, Afternoon 5h, 1h Spike) |
| Single-item approval | **Batch Approval Hub**: Select all, 1-click batch approve, reject with required explanation |
| Basic table export | Client-side **Excel (.xlsx)** & **CSV** exports with complete metadata |
| No compliance view | **Incomplete Timesheet Audit**: Automatically flags days with under 8.0 hours logged |
| Hardcoded user state | **Multi-Persona Switcher**: Seamlessly switch between **Employee**, **PM**, and **Admin** |

---

## 💻 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for Production
```bash
npm run build
npm run start
```

---

## 👥 Personas Included for Testing
Switch between personas via the top-right profile dropdown:
- **Somchai Jaidee** (`Senior Frontend Engineer`, Role: `Employee`) — Record time entries, track personal leaves, test validation.
- **Sarah Jenkins** (`Lead Project Manager`, Role: `Manager`) — Review pending team timesheets, batch approve/reject, inspect approval histories.
- **Chavalit Techalead** (`Director of Engineering`, Role: `Admin`) — Access system settings, change monthly cutoff lock date, inspect audit logs.
