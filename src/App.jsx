import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { fbLoad, fbSave, fbListen } from "./firebase-storage";

// ─── ERROR BOUNDARY ───────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: "sans-serif", textAlign: "center" }}>
          <h2 style={{ color: "#DC2626" }}>Something went wrong</h2>
          <pre style={{ background: "#f5f5f5", padding: 16, borderRadius: 8, textAlign: "left", fontSize: 12, overflow: "auto", maxWidth: 600, margin: "16px auto" }}>
            {this.state.error?.toString()}
          </pre>
          <button onClick={() => { this.setState({ hasError: false, error: null }); }} style={{ padding: "8px 20px", borderRadius: 6, border: "none", background: "#B45309", color: "#fff", cursor: "pointer", fontSize: 14 }}>Try Again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── COMPANY LOGO ─────────────────────────────────────────────────

// ─── CONFIG: YOUR EXACT SHIFT PATTERNS ─────────────────────────────
const DEFAULT_SHIFTS = {
  "early-prod":    { label: "Early Production", time: "5:00 AM – 1:30 PM",  hours: 8.5, color: "#C2410C", bg: "#FFF7ED", dot: "#EA580C" },
  "morning-std":   { label: "Morning",          time: "6:00 AM – 2:30 PM",  hours: 8.5, color: "#B45309", bg: "#FFFBEB", dot: "#D97706" },
  "morning-proc":  { label: "Morning Process",  time: "7:00 AM – 3:30 PM",  hours: 8.5, color: "#0E7490", bg: "#ECFEFF", dot: "#06B6D4" },
  "morning-late":  { label: "Morning Late",     time: "7:30 AM – 4:00 PM",  hours: 8.5, color: "#7E22CE", bg: "#FAF5FF", dot: "#A855F7" },
  "office":        { label: "Office",           time: "9:00 AM – 5:30 PM",  hours: 8.5, color: "#047857", bg: "#ECFDF5", dot: "#10B981" },
  "arvo-std":      { label: "Afternoon",        time: "3:30 PM – 12:00 AM", hours: 8.5, color: "#1D4ED8", bg: "#EFF6FF", dot: "#3B82F6" },
  "arvo-proc":     { label: "Afternoon Process", time: "5:00 PM – 1:30 AM", hours: 8.5, color: "#4338CA", bg: "#EEF2FF", dot: "#6366F1" },
};

const DEPARTMENTS = ["Production", "Accounts", "Sales"];
const LEAVE_TYPES = ["Annual Leave", "Personal/Sick Leave", "Unpaid Leave"];

const DEFAULT_PRODUCTS = [
  { id: "prod-1", name: "Paneer", price: 10.10 },
  { id: "prod-2", name: "Yoghurt 1kg", price: 2.95 },
  { id: "prod-3", name: "Yoghurt 2kg", price: 5.25 },
  { id: "prod-4", name: "Mango Lassi", price: 1.50 },
  { id: "prod-5", name: "Milk Badam", price: 1.50 },
  { id: "prod-6", name: "Kesar Milk", price: 1.50 },
  { id: "prod-7", name: "Khajoor Milk", price: 1.50 },
  { id: "prod-8", name: "Mango Shrikhand", price: 4.05 },
  { id: "prod-9", name: "Kesar and Elaichi Shrikhand", price: 4.05 },
];

// ─── SEED DATA ──────────────────────────────────────────────────────
const SEED_EMPLOYEES = [
  // Management / Salaried
  { name: "Raj Krishna", role: "Accounts Manager", dept: "Accounts", rate: 64.90, pin: "4104", leaveInit: { annual: 35.1, personal: 19.1 }, empType: "full-time" },
  { name: "Gopi Dhamija", role: "Production Supervisor", dept: "Production", rate: 40.87, pin: "8160", leaveInit: { annual: 29.1, personal: 13.4 }, empType: "full-time" },
  { name: "Prateek Kumar", role: "Production Supervisor", dept: "Production", rate: 37.30, pin: "1681", leaveInit: { annual: 7.1, personal: 6.5 }, empType: "full-time" },
  { name: "Prabhkeerat Singh", role: "Sales Representative", dept: "Sales", rate: 32.96, pin: "1547", leaveInit: { annual: 20.3, personal: 18.9 }, empType: "full-time" },
  { name: "Mohit Sivia", role: "Sales Representative", dept: "Sales", rate: 48.08, pin: "9738", leaveInit: { annual: 10.6, personal: 10.8 }, empType: "full-time" },
  // Process Workers
  { name: "Bushar Ahmed", role: "Process Worker", dept: "Production", rate: 29.50, pin: "1943", leaveInit: { annual: 14.0, personal: 1.0 }, empType: "full-time" },
  { name: "Sandesh Adhikari", role: "Process Worker", dept: "Production", rate: 26.00, pin: "3819", leaveInit: { annual: 9.1, personal: 1.5 }, empType: "full-time" },
  { name: "Anannya Rehman Amiya", role: "Process Worker", dept: "Production", rate: 26.00, pin: "5693", leaveInit: { annual: 0.2, personal: 0.1 }, empType: "full-time" },
  { name: "Majid Ali", role: "Process Worker", dept: "Production", rate: 29.00, pin: "9529", leaveInit: { annual: 7.6, personal: 1.7 }, empType: "full-time" },
  { name: "Tikaram Badari Sharma", role: "Process Worker", dept: "Production", rate: 32.00, pin: "1380", leaveInit: { annual: 5.3, personal: 3.9 }, empType: "part-time" },
  { name: "Kumaramanjunath Baleattiguppe Sadashivappa", role: "Process Worker", dept: "Production", rate: 26.00, pin: "1797", leaveInit: { annual: 7.5, personal: 4.0 }, empType: "full-time" },
  { name: "Razia Bibi", role: "Process Worker", dept: "Production", rate: 29.50, pin: "5316", leaveInit: { annual: 14.9, personal: 10.1 }, empType: "full-time" },
  { name: "Marites Cabaltera", role: "Process Worker", dept: "Production", rate: 29.50, pin: "9821", leaveInit: { annual: 10.0, personal: 20.5 }, empType: "full-time" },
  { name: "Chetna Chetna", role: "Process Worker", dept: "Production", rate: 26.00, pin: "6999", leaveInit: { annual: 12.0, personal: 3.8 }, empType: "full-time" },
  { name: "Anita Dangi", role: "Process Worker", dept: "Production", rate: 34.00, pin: "1354", leaveInit: { annual: 3.8, personal: 4.5 }, empType: "full-time" },
  { name: "Eldefer Dequino", role: "Process Worker", dept: "Production", rate: 34.00, pin: "3608", leaveInit: { annual: 10.8, personal: 16.5 }, empType: "full-time" },
  { name: "Tanjilalam Emon", role: "Process Worker", dept: "Production", rate: 32.00, pin: "3204", leaveInit: { annual: 6.4, personal: 1.3 }, empType: "full-time" },
  { name: "Louie Fortes", role: "Process Worker", dept: "Production", rate: 31.50, pin: "8533", leaveInit: { annual: 4.3, personal: 36.5 }, empType: "full-time" },
  { name: "Jahid Hasan", role: "Process Worker", dept: "Production", rate: 32.00, pin: "1818", leaveInit: { annual: 1.7, personal: 0.1 }, empType: "full-time" },
  { name: "Mdkamrul Hasan", role: "Process Worker", dept: "Production", rate: 26.00, pin: "3996", leaveInit: { annual: 9.7, personal: 0.2 }, empType: "full-time" },
  { name: "Nimra Habib", role: "Process Worker", dept: "Production", rate: 26.00, pin: "8823", leaveInit: { annual: 0.8, personal: 0.4 }, empType: "full-time" },
  { name: "Navneet Kaur Virk", role: "Process Worker", dept: "Production", rate: 26.00, pin: "5250", leaveInit: { annual: 2.4, personal: 1.2 }, empType: "full-time" },
  { name: "Sabnam Khadka", role: "Process Worker", dept: "Production", rate: 26.00, pin: "1284", leaveInit: { annual: 0.5, personal: 0.1 }, empType: "part-time" },
  { name: "Ashwani Kumar Kumar", role: "Process Worker", dept: "Production", rate: 26.00, pin: "2855", leaveInit: { annual: 12.5, personal: 3.8 }, empType: "full-time" },
  { name: "Sang Kyung Lee", role: "Process Worker", dept: "Production", rate: 29.50, pin: "5863", leaveInit: { annual: 10.6, personal: 0.6 }, empType: "full-time" },
  { name: "Manoj Manjunath", role: "Process Worker", dept: "Production", rate: 33.00, pin: "1309", leaveInit: { annual: 31.0, personal: 15.5 }, empType: "full-time" },
  { name: "Kundan Neupane", role: "Process Worker", dept: "Production", rate: 28.00, pin: "8233", leaveInit: { annual: 5.9, personal: 1.9 }, empType: "full-time" },
  { name: "Sargam Nasrullah", role: "Process Worker", dept: "Production", rate: 29.00, pin: "6406", leaveInit: { annual: 1.3, personal: 0.6 }, empType: "full-time" },
  { name: "Bora Ozcelik", role: "Process Worker", dept: "Production", rate: 28.50, pin: "4952", leaveInit: { annual: 9.1, personal: 0.2 }, empType: "full-time" },
  { name: "Sreejan Kumar Paul", role: "Process Worker", dept: "Production", rate: 29.00, pin: "6970", leaveInit: { annual: 8.5, personal: 4.6 }, empType: "full-time" },
  { name: "Amisha Pun", role: "Process Worker", dept: "Production", rate: 29.00, pin: "5165", leaveInit: { annual: 6.2, personal: 4.5 }, empType: "full-time" },
  { name: "Miskur Rumi", role: "Process Worker", dept: "Production", rate: 34.00, pin: "2602", leaveInit: { annual: 6.7, personal: 8.3 }, empType: "full-time" },
  { name: "Yatin Sethi", role: "Process Worker", dept: "Production", rate: 34.00, pin: "9273", leaveInit: { annual: 13.0, personal: 2.3 }, empType: "full-time" },
  { name: "Vijay Sharma", role: "Process Worker", dept: "Production", rate: 31.50, pin: "3271", leaveInit: { annual: 37.4, personal: 3.5 }, empType: "full-time" },
  { name: "Nidhi Sharma", role: "Process Worker", dept: "Production", rate: 29.00, pin: "2501", leaveInit: { annual: 7.4, personal: 0.8 }, empType: "full-time" },
  { name: "Harshit Sharma", role: "Process Worker", dept: "Production", rate: 29.00, pin: "3823", leaveInit: { annual: 0.4, personal: 0.2 }, empType: "full-time" },
  { name: "Karthik Shelvaraju", role: "Process Worker", dept: "Production", rate: 28.00, pin: "4934", leaveInit: { annual: 6.9, personal: 1.3 }, empType: "full-time" },
  { name: "Abhay Singh", role: "Process Worker", dept: "Production", rate: 26.00, pin: "5292", leaveInit: { annual: 5.4, personal: 2.4 }, empType: "full-time" },
  { name: "Ragwinder Singh", role: "Process Worker", dept: "Production", rate: 29.50, pin: "9140", leaveInit: { annual: 27.5, personal: 1.2 }, empType: "full-time" },
  { name: "Rohan Sood", role: "Process Worker", dept: "Production", rate: 26.00, pin: "7269", leaveInit: { annual: 8.9, personal: 1.8 }, empType: "full-time" },
  { name: "Samundra Tuladhar", role: "Process Worker", dept: "Production", rate: 34.00, pin: "4325", leaveInit: { annual: 27.8, personal: 7.8 }, empType: "full-time" },
  { name: "Yash Yash", role: "Process Worker", dept: "Production", rate: 29.00, pin: "9236", leaveInit: { annual: 2.0, personal: 3.1 }, empType: "full-time" },
  // Owner
  { name: "Tanisha Sharma", role: "Owner", dept: "Production", rate: 0, pin: "cherry2077", leaveInit: { annual: 50.4, personal: 25.2 }, empType: "full-time" },
];

function generateUniquePin(usedPins) {
  let pin;
  do {
    pin = String(Math.floor(1000 + Math.random() * 9000)); // 1000-9999
  } while (usedPins.has(pin));
  usedPins.add(pin);
  return pin;
}

function buildEmployees() {
  return SEED_EMPLOYEES.map((e, i) => {
    return {
      id: `emp-${i + 1}`,
      ...e,
      initials: e.name.split(" ").filter(n => n.length > 0).slice(0, 2).map(n => n[0].toUpperCase()).join(""),
      pin: e.pin,
      isManager: e.name === "Gopi Dhamija" || e.name === "Prateek Kumar" || e.name === "Tanisha Sharma",
      isAccounts: e.name === "Raj Krishna",
      isOwner: e.name === "Tanisha Sharma",
      canExportMYOB: e.name === "Gopi Dhamija" || e.name === "Prateek Kumar" || e.name === "Raj Krishna" || e.name === "Tanisha Sharma",
      clockedIn: false,
      clockInTime: null,
      hourlyRate: e.rate,
      leaveBalance: e.leaveInit || { annual: 20, personal: 10 },
      employmentType: e.empType || "full-time",
      daysPerWeek: e.empType === "part-time" ? (e.daysPerWeek || 3) : 5,
    };
  });
}

// ─── HELPERS ─────────────────────────────────────────────────────────
function getWeekStart(d) {
  const date = new Date(d);
  const day = date.getDay();
  date.setDate(date.getDate() - day + (day === 0 ? -6 : 1));
  date.setHours(0, 0, 0, 0);
  return date;
}

function getDays(start) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function fmtDate(d, style) {
  if (style === "day") return d.toLocaleDateString("en-AU", { weekday: "short" });
  if (style === "num") return d.getDate();
  if (style === "full") return d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
  if (style === "iso") {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

function weekKey(start) { return fmtDate(start, "iso"); }

// ─── STORAGE LAYER (Firebase) ────────────────────────────────────────
const STORE_KEYS = {
  employees: "employees",
  roster: "roster",
  leave: "leave",
  swaps: "swaps",
  timelog: "timelog",
  shifts: "shifts",
  notifications: "notifications",
  products: "products",
  purchases: "purchases",
};

async function load(key) {
  return await fbLoad(key);
}

async function save(key, data) {
  await fbSave(key, data);
}

// ─── ICONS ───────────────────────────────────────────────────────────
const I = {
  Calendar: (p) => <svg {...p} width={p?.size||18} height={p?.size||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  Clock: (p) => <svg {...p} width={p?.size||18} height={p?.size||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  Users: (p) => <svg {...p} width={p?.size||18} height={p?.size||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  FileText: (p) => <svg {...p} width={p?.size||18} height={p?.size||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>,
  Swap: (p) => <svg {...p} width={p?.size||18} height={p?.size||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3l4 4-4 4"/><path d="M20 7H4"/><path d="M8 21l-4-4 4-4"/><path d="M4 17h16"/></svg>,
  ChevL: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>,
  ChevR: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>,
  Check: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>,
  X: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>,
  Plus: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>,
  LogIn: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>,
  LogOut: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>,
  Lock: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  Download: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Home: (p) => <svg {...p} width={p?.size||18} height={p?.size||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Bell: (p) => <svg {...p} width={p?.size||18} height={p?.size||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  ShoppingBag: (p) => <svg {...p} width={p?.size||18} height={p?.size||18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
};

// ─── STYLES ──────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&display=swap');
:root {
  --bg: #F6F5F0; --surface: #FFFFFF; --surface2: #FAF9F6;
  --ink: #1A1714; --ink2: #6B6560; --ink3: #A8A29E;
  --border: #E7E5E0; --border2: #D6D3CD;
  --accent: #B45309; --accent-bg: #FFFBEB;
  --green: #15803D; --green-bg: #F0FDF4;
  --red: #B91C1C; --red-bg: #FEF2F2;
  --blue: #1D4ED8; --blue-bg: #EFF6FF;
  --radius: 10px; --radius-lg: 14px;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Outfit', sans-serif; background: var(--bg); color: var(--ink); }
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 4px; }
nav::-webkit-scrollbar { display: none; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes spin { to { transform: rotate(360deg); } }
.fade-up { animation: fadeUp .35s ease both; }
.fade-in { animation: fadeIn .25s ease both; }
@media print {
  header, nav, .fade-up { animation: none !important; }
  header { position: static !important; }
  nav { display: none !important; }
  button:not(.print-keep) { display: none !important; }
  main { padding: 0 !important; }
  body { background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
}
`;

// ─── MYOB ACCOUNTRIGHT CSV EXPORT ─────────────────────────────────────
function exportMYOBTimesheets(timelog, employees, dateFrom, dateTo) {
  // MYOB AccountRight timesheet import format
  // Columns: Employee Card ID, Last Name, First Name, Date, Start Time, End Time, Hours, Activity, Notes
  const headers = [
    "Co./Last Name",
    "First Name",
    "Date",
    "Start Time",
    "End Time",
    "Hours Worked",
    "Payroll Category",
    "Notes",
  ];

  const rows = timelog
    .filter(t => {
      if (!t.clockOut) return false; // skip incomplete entries
      if (dateFrom && t.date < dateFrom) return false;
      if (dateTo && t.date > dateTo) return false;
      return true;
    })
    .map(t => {
      const emp = employees.find(e => e.id === t.empId);
      const nameParts = (emp?.name || t.empName || "").split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      // Parse clock times to calculate hours
      let hours = 8.5; // default
      try {
        const parseTime = (str) => {
          const [time, period] = str.trim().split(" ");
          let [h, m] = time.split(":").map(Number);
          if (period?.toUpperCase() === "PM" && h !== 12) h += 12;
          if (period?.toUpperCase() === "AM" && h === 12) h = 0;
          return h + m / 60;
        };
        const start = parseTime(t.clockIn);
        let end = parseTime(t.clockOut);
        if (end < start) end += 24; // overnight shift
        hours = Math.round((end - start - 0.5) * 100) / 100; // subtract 30min break
      } catch {}

      // Format date as DD/MM/YYYY for MYOB
      const [y, m, d] = t.date.split("-");
      const myobDate = `${d}/${m}/${y}`;

      return [
        lastName,
        firstName,
        myobDate,
        t.clockIn,
        t.clockOut,
        hours.toFixed(2),
        "Base Hourly", // default payroll category — user can adjust in MYOB
        `${t.dept} - Exported from SK Roster`,
      ];
    });

  if (rows.length === 0) {
    return null;
  }

  const csvContent = [
    headers.join(","),
    ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const today = fmtDate(new Date(), "iso");
  link.download = `SK_Roster_MYOB_Timesheets_${today}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return rows.length;
}

// ─── PURCHASE PAYROLL EXPORT ──────────────────────────────────────────
function exportPurchasesCSV(purchases, filterType) {
  const filtered = purchases.filter(function(p) {
    if (p.status !== "approved") return false;
    if (filterType === "payroll" && p.paymentMethod !== "payroll deduction") return false;
    if (filterType === "cash" && p.paymentMethod !== "paid cash") return false;
    return true;
  });

  if (filtered.length === 0) return null;

  var headers = ["Employee", "Date", "Items", "Qty", "Total", "Payment Method", "Approved By"];

  var rows = filtered.map(function(p) {
    var itemsText = (p.items || []).map(function(i) { return i.qty + "x " + i.name; }).join("; ");
    var totalQty = (p.items || []).reduce(function(s, i) { return s + i.qty; }, 0);
    return [
      p.employeeName || "",
      p.submittedDate || "",
      itemsText,
      totalQty,
      (p.total || 0).toFixed(2),
      p.paymentMethod || "",
      p.approvedBy || ""
    ];
  });

  var csvContent = [
    headers.join(","),
    rows.map(function(r) {
      return r.map(function(cell) {
        return '"' + String(cell).replace(/"/g, '""') + '"';
      }).join(",");
    }).join("\n")
  ].join("\n");

  var blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  var url = URL.createObjectURL(blob);
  var link = document.createElement("a");
  link.href = url;
  var today = fmtDate(new Date(), "iso");
  link.download = "SK_Staff_Purchases_" + (filterType || "all") + "_" + today + ".csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return filtered.length;
}

// ═══════════════════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════════════════
function SKRosterInner() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null); // logged-in employee obj
  const [employees, setEmployees] = useState([]);
  const [roster, setRoster] = useState({});
  const [leaves, setLeaves] = useState([]);
  const [swaps, setSwaps] = useState([]);
  const [timelog, setTimelog] = useState([]);
  const [SHIFTS, setSHIFTS] = useState(DEFAULT_SHIFTS);
  const [notifications, setNotifications] = useState([]);
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [purchases, setPurchases] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [deptFilter, setDeptFilter] = useState("All");

  // ─── INIT: Load or seed ────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      let emps = await load(STORE_KEYS.employees);
      if (!emps) {
        emps = buildEmployees();
        await save(STORE_KEYS.employees, emps);
      }
      const r = (await load(STORE_KEYS.roster)) || {};
      const l = (await load(STORE_KEYS.leave)) || [];
      const s = (await load(STORE_KEYS.swaps)) || [];
      const t = (await load(STORE_KEYS.timelog)) || [];
      const sh = (await load(STORE_KEYS.shifts)) || DEFAULT_SHIFTS;
      const n = (await load(STORE_KEYS.notifications)) || [];
      const pr = (await load(STORE_KEYS.products)) || DEFAULT_PRODUCTS;
      const pu = (await load(STORE_KEYS.purchases)) || [];
      setEmployees(emps);
      setRoster(r);
      setLeaves(l);
      setSwaps(s);
      setTimelog(t);
      setSHIFTS(sh);
      setNotifications(n);
      setProducts(pr);
      setPurchases(pu);
      setReady(true);
    })();
  }, []);

  // ─── REAL-TIME SYNC: Listen for changes from other devices ─────────
  useEffect(() => {
    if (!ready) return;
    const unsubs = [
      fbListen(STORE_KEYS.employees, (data) => { if (data) setEmployees(data); }),
      fbListen(STORE_KEYS.roster, (data) => { if (data) setRoster(data); }),
      fbListen(STORE_KEYS.leave, (data) => { if (data) setLeaves(data); }),
      fbListen(STORE_KEYS.swaps, (data) => { if (data) setSwaps(data); }),
      fbListen(STORE_KEYS.timelog, (data) => { if (data) setTimelog(data); }),
      fbListen(STORE_KEYS.shifts, (data) => { if (data) setSHIFTS(data); }),
      fbListen(STORE_KEYS.notifications, (data) => { if (data) setNotifications(data); }),
      fbListen(STORE_KEYS.products, (data) => { if (data) setProducts(data); }),
      fbListen(STORE_KEYS.purchases, (data) => { if (data) setPurchases(data); }),
    ];
    return () => unsubs.forEach(u => u());
  }, [ready]);

  // ─── PERSIST helpers ───────────────────────────────────────────────
  const persist = useCallback(async (key, data) => { await save(key, data); }, []);

  const notify = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }, []);

  const sendNotification = useCallback(async (targetEmpIds, message, category = "general") => {
    const notif = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      message,
      category,
      targetEmpIds, // array of emp IDs, or "all" for everyone, or "managers" for managers
      createdAt: new Date().toISOString(),
      readBy: [],
    };
    const updated = [notif, ...notifications].slice(0, 100); // keep last 100
    setNotifications(updated);
    await save(STORE_KEYS.notifications, updated);
  }, [notifications]);

  // ─── MONTHLY LEAVE ACCRUAL ─────────────────────────────────────────
  useEffect(() => {
    if (!ready || employees.length === 0) return;
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const accrualKey = "lastAccrual";

    (async () => {
      const lastAccrual = await load(accrualKey);
      if (lastAccrual === monthKey) return; // already accrued this month

      // Full-time monthly rates (personal/sick combined as per NES)
      const FT_ANNUAL = 1.67, FT_PERSONAL = 0.83;

      const updated = employees.map(emp => {
        const type = emp.employmentType || "full-time";
        if (type === "casual") return emp; // casuals don't accrue

        const ratio = type === "part-time" ? (emp.daysPerWeek || 3) / 5 : 1;
        return {
          ...emp,
          leaveBalance: {
            annual: Math.round((emp.leaveBalance.annual + FT_ANNUAL * ratio) * 100) / 100,
            personal: Math.round(((emp.leaveBalance.personal || 0) + FT_PERSONAL * ratio) * 100) / 100,
          }
        };
      });

      setEmployees(updated);
      await save(STORE_KEYS.employees, updated);
      await save(accrualKey, monthKey);
    })();
  }, [ready, employees.length]);

  // ─── AUTH ──────────────────────────────────────────────────────────
  const login = (emp) => { setUser(emp); setTab("dashboard"); };
  const logout = () => { setUser(null); };
  const isManager = user?.isManager;

  // ─── ROSTER ACTIONS ────────────────────────────────────────────────
  const days = useMemo(() => getDays(weekStart), [weekStart]);
  const wk = weekKey(weekStart);

  const assignShift = async (empId, dayIso, shiftKey) => {
    const next = { ...roster };
    if (!next[wk]) next[wk] = {};
    if (!next[wk][empId]) next[wk][empId] = {};
    next[wk][empId][dayIso] = shiftKey;
    setRoster(next);
    await persist(STORE_KEYS.roster, next);
    setModal(null);
    notify("Shift assigned");
  };

  const removeShift = async (empId, dayIso) => {
    const next = { ...roster };
    if (next[wk]?.[empId]) { delete next[wk][empId][dayIso]; }
    setRoster(next);
    await persist(STORE_KEYS.roster, next);
    notify("Shift removed");
  };

  const getShift = (empId, dayIso) => roster[wk]?.[empId]?.[dayIso] || null;

  const copyPreviousWeek = async () => {
    var prevStart = new Date(weekStart);
    prevStart.setDate(prevStart.getDate() - 7);
    var prevWk = weekKey(prevStart);
    var prevData = roster[prevWk];
    if (!prevData || Object.keys(prevData).length === 0) {
      notify("No roster data in previous week to copy");
      return;
    }
    // Map previous week's day offsets to this week's dates
    var prevDays = getDays(prevStart);
    var thisDays = getDays(weekStart);
    var next = { ...roster };
    if (!next[wk]) next[wk] = {};
    var count = 0;
    Object.keys(prevData).forEach(function(empId) {
      if (!next[wk][empId]) next[wk][empId] = {};
      prevDays.forEach(function(prevDay, i) {
        var prevIso = fmtDate(prevDay, "iso");
        var thisIso = fmtDate(thisDays[i], "iso");
        var shift = prevData[empId]?.[prevIso];
        if (shift && !next[wk][empId][thisIso]) {
          next[wk][empId][thisIso] = shift;
          count++;
        }
      });
    });
    setRoster(next);
    await persist(STORE_KEYS.roster, next);
    notify("Copied " + count + " shifts from previous week");
  };

  // ─── LEAVE ACTIONS ─────────────────────────────────────────────────
  const submitLeave = async (data) => {
    const next = [...leaves, { ...data, id: `lv-${Date.now()}`, status: "pending", submittedDate: fmtDate(new Date(), "iso"), employeeId: user.id, employeeName: user.name, department: user.dept }];
    setLeaves(next);
    await persist(STORE_KEYS.leave, next);
    setModal(null);
    notify("Leave request submitted");
    sendNotification("managers", `${user.name} requested ${data.type} (${data.startDate} → ${data.endDate})`, "leave");
  };

  const handleLeave = async (id, status) => {
    const leave = leaves.find(l => l.id === id);
    const next = leaves.map(l => l.id === id ? { ...l, status } : l);
    setLeaves(next);
    await persist(STORE_KEYS.leave, next);
    notify(`Leave ${status}`);
    if (leave) sendNotification([leave.employeeId], `Your ${leave.type} (${leave.startDate} → ${leave.endDate}) has been ${status}`, "leave");
  };

  // ─── SWAP ACTIONS ──────────────────────────────────────────────────
  const submitSwap = async (data) => {
    const next = [...swaps, { ...data, id: `sw-${Date.now()}`, status: "pending", submittedDate: fmtDate(new Date(), "iso"), requesterId: user.id, requesterName: user.name }];
    setSwaps(next);
    await persist(STORE_KEYS.swaps, next);
    setModal(null);
    notify("Swap request submitted");
    sendNotification("managers", `${user.name} requested a shift swap for ${data.date}`, "swap");
  };

  const handleSwap = async (id, status) => {
    const sw = swaps.find(s => s.id === id);
    if (status === "approved" && sw) {
      // actually swap the shifts in roster
      const next = { ...roster };
      const wkKey = sw.weekKey;
      if (next[wkKey]) {
        const shift1 = next[wkKey]?.[sw.requesterId]?.[sw.date];
        const shift2 = next[wkKey]?.[sw.targetId]?.[sw.date];
        if (!next[wkKey][sw.requesterId]) next[wkKey][sw.requesterId] = {};
        if (!next[wkKey][sw.targetId]) next[wkKey][sw.targetId] = {};
        next[wkKey][sw.requesterId][sw.date] = shift2 || null;
        next[wkKey][sw.targetId][sw.date] = shift1 || null;
        setRoster(next);
        await persist(STORE_KEYS.roster, next);
      }
    }
    const nextSwaps = swaps.map(s => s.id === id ? { ...s, status } : s);
    setSwaps(nextSwaps);
    await persist(STORE_KEYS.swaps, nextSwaps);
    notify(`Swap ${status}`);
    if (sw) sendNotification([sw.requesterId], `Your shift swap for ${sw.date} has been ${status}`, "swap");
  };

  // ─── PURCHASE ACTIONS ─────────────────────────────────────────────
  const submitPurchase = async (data) => {
    const next = [...purchases, {
      ...data,
      id: `pur-${Date.now()}`,
      status: "pending",
      submittedDate: fmtDate(new Date(), "iso"),
      submittedTime: new Date().toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" }),
      employeeId: user.id,
      employeeName: user.name,
      department: user.dept,
      paymentMethod: null,
    }];
    setPurchases(next);
    await persist(STORE_KEYS.purchases, next);
    setModal(null);
    notify("Purchase request submitted");
    sendNotification("managers", `${user.name} submitted a purchase request ($${data.total.toFixed(2)})`, "purchase");
  };

  const handlePurchase = async (id, status, paymentMethod) => {
    const nextPurchases = purchases.map(p => p.id === id ? { ...p, status, paymentMethod: paymentMethod || null, approvedBy: user.name, approvedDate: fmtDate(new Date(), "iso") } : p);
    setPurchases(nextPurchases);
    await persist(STORE_KEYS.purchases, nextPurchases);
    notify(`Purchase ${status}`);
    const pur = purchases.find(p => p.id === id);
    if (pur) sendNotification([pur.employeeId], `Your purchase request ($${pur.total.toFixed(2)}) has been ${status}${paymentMethod ? ` — ${paymentMethod}` : ""}`, "purchase");
  };

  const saveProducts = async (newProducts) => {
    setProducts(newProducts);
    await persist(STORE_KEYS.products, newProducts);
    notify("Products updated");
  };

  // ─── GEOLOCATION CONFIG ─────────────────────────────────────────────
  const SITES = {
    hornsby:  { name: "Hornsby Factory",  lat: -33.69702, lng: 151.11281, address: "Unit 6, 8 Leighton Place, Hornsby" },
    yennora:  { name: "Yennora Office",   lat: -33.86338, lng: 150.97844, address: "5 Antill St, Yennora" },
  };
  const GEOFENCE_RADIUS = 50; // metres

  // Employees assigned to Yennora — everyone else defaults to Hornsby
  const YENNORA_STAFF = ["Raj Krishna", "Mohit Sivia", "Prabhkeerat Singh"];
  const getEmployeeSite = (empName) => YENNORA_STAFF.includes(empName) ? SITES.yennora : SITES.hornsby;

  const getDistanceMetres = (lat1, lng1, lat2, lng2) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const [geoStatus, setGeoStatus] = useState(null);
  const [geoDistance, setGeoDistance] = useState(null);
  const [pendingClock, setPendingClock] = useState(null); // { action, lat, lng, distance, siteName }

  const checkLocationAndClock = async (action) => {
    setGeoStatus("checking");
    setGeoDistance(null);
    setPendingClock(null);

    if (!navigator.geolocation) {
      setGeoStatus("unavailable");
      notify("Geolocation not supported on this device", "error");
      return;
    }

    const site = getEmployeeSite(user.name);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const dist = getDistanceMetres(pos.coords.latitude, pos.coords.longitude, site.lat, site.lng);
        setGeoDistance(Math.round(dist));

        if (dist <= GEOFENCE_RADIUS) {
          setGeoStatus("success");
          setPendingClock({ action, lat: pos.coords.latitude, lng: pos.coords.longitude, distance: Math.round(dist), siteName: site.name });
        } else {
          setGeoStatus("too_far");
          notify(`Too far from ${site.name} (${Math.round(dist)}m away). Must be within ${GEOFENCE_RADIUS}m.`, "error");
        }
      },
      (err) => {
        if (err.code === 1) {
          setGeoStatus("denied");
          notify("Location permission denied. On iPhone: Settings → Safari → Location → Allow. On Android: tap the lock icon → Permissions → Location → Allow. Then refresh.", "error");
        } else if (err.code === 3) {
          setGeoStatus("unavailable");
          notify("Location timed out. Make sure you're outdoors or near a window and try again.", "error");
        } else {
          setGeoStatus("unavailable");
          notify("Could not get your location. Please try again.", "error");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const completeClock = async (photo) => {
    if (!pendingClock) return;
    const { action, lat, lng, distance, siteName } = pendingClock;
    if (action === "in") await doClockIn(lat, lng, distance, siteName, photo);
    else await doClockOut(lat, lng, distance, siteName, photo);
    setPendingClock(null);
  };

  // ─── CLOCK IN/OUT ──────────────────────────────────────────────────
  const doClockIn = async (lat, lng, distance, siteName, photo) => {
    const now = new Date();
    const entry = {
      id: `tl-${Date.now()}`, empId: user.id, empName: user.name, dept: user.dept,
      date: fmtDate(now, "iso"),
      clockIn: now.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" }),
      clockOut: null,
      location: { lat, lng, distance, site: siteName },
      photo: photo || null,
    };
    const nextLog = [...timelog, entry];
    setTimelog(nextLog);
    await persist(STORE_KEYS.timelog, nextLog);
    const nextEmps = employees.map(e => e.id === user.id ? { ...e, clockedIn: true, clockInTime: entry.clockIn } : e);
    setEmployees(nextEmps);
    setUser({ ...user, clockedIn: true, clockInTime: entry.clockIn });
    await persist(STORE_KEYS.employees, nextEmps);
    notify(`Clocked in at ${siteName}! (${distance}m)`);
  };

  const doClockOut = async (lat, lng, distance, siteName, photo) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });
    const todayIso = fmtDate(now, "iso");
    const nextLog = timelog.map(t => (t.empId === user.id && t.date === todayIso && !t.clockOut) ? { ...t, clockOut: timeStr, locationOut: { lat, lng, distance, site: siteName }, photoOut: photo || null } : t);
    setTimelog(nextLog);
    await persist(STORE_KEYS.timelog, nextLog);
    const nextEmps = employees.map(e => e.id === user.id ? { ...e, clockedIn: false, clockInTime: null } : e);
    setEmployees(nextEmps);
    setUser({ ...user, clockedIn: false, clockInTime: null });
    await persist(STORE_KEYS.employees, nextEmps);
    notify(`Clocked out at ${siteName}! (${distance}m)`);
  };

  // ─── ADD EMPLOYEE ───────────────────────────────────────────────────
  const addEmployee = async (data) => {
    const newId = `emp-${Date.now()}`;
    const usedPins = new Set(employees.map(e => e.pin));
    const newPin = generateUniquePin(usedPins);
    const newEmp = {
      id: newId,
      name: `${data.firstName} ${data.lastName}`,
      role: data.role,
      dept: "Production",
      rate: parseFloat(data.hourlyRate) || 26,
      initials: `${(data.firstName[0] || "").toUpperCase()}${(data.lastName[0] || "").toUpperCase()}`,
      pin: newPin,
      isManager: false,
      isAccounts: false,
      canExportMYOB: false,
      clockedIn: false,
      clockInTime: null,
      hourlyRate: parseFloat(data.hourlyRate) || 26,
      startDate: data.startDate || null,
      phone: data.phone || null,
      email: data.email || null,
      leaveBalance: { annual: 0, personal: 0 },
    };
    const nextEmps = [...employees, newEmp];
    setEmployees(nextEmps);
    await persist(STORE_KEYS.employees, nextEmps);
    setModal(null);
    notify(`${newEmp.name} added (PIN: ${newPin})`);
  };

  // ─── RESET DATA ────────────────────────────────────────────────────
  const resetAll = async () => {
    const emps = buildEmployees();
    setEmployees(emps); setRoster({}); setLeaves([]); setSwaps([]); setTimelog([]);
    setUser(null);
    await save(STORE_KEYS.employees, emps);
    await save(STORE_KEYS.roster, {});
    await save(STORE_KEYS.leave, []);
    await save(STORE_KEYS.swaps, []);
    await save(STORE_KEYS.timelog, []);
    notify("All data reset");
  };

  // ─── FILTERED EMPLOYEES ────────────────────────────────────────────
  // Managers (non-owner) see Production only; Owner & Accounts see all/filtered
  const canSeeAllDepts = user?.isOwner || user?.isAccounts;
  const filtered = useMemo(() => {
    if (isManager && !canSeeAllDepts) return employees.filter(e => e.dept === "Production");
    if (deptFilter === "All") return employees;
    return employees.filter(e => e.dept === deptFilter);
  }, [employees, deptFilter, isManager, canSeeAllDepts]);

  // ─── LOADING ───────────────────────────────────────────────────────
  if (!ready) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "'Outfit', sans-serif", background: "#F6F5F0" }}>
      <style>{CSS}</style>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 48, height: 48, border: "3px solid #E7E5E0", borderTopColor: "#B45309", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
        <div style={{ color: "#6B6560", fontSize: 14 }}>Loading SK Roster...</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );

  // ─── LOGIN SCREEN ──────────────────────────────────────────────────
  if (!user) return <LoginScreen employees={employees} onLogin={login} onReset={resetAll} />;

  // ─── TABS ──────────────────────────────────────────────────────────
  const isAccounts = user?.isAccounts;
  const canExport = user?.canExportMYOB;
  const canAddEmployee = user?.name === "Gopi Dhamija" || user?.name === "Prateek Kumar" || user?.name === "Raj Krishna" || user?.name === "Tanisha Sharma";

  const managerTabs = [
    { id: "dashboard", label: "Dashboard", icon: I.Home },
    { id: "roster", label: "Roster", icon: I.Calendar },
    { id: "timesheets", label: "Timesheets", icon: I.Clock },
    { id: "leave", label: "Leave", icon: I.FileText },
    { id: "swaps", label: "Swaps", icon: I.Swap },
    { id: "shop", label: "Shop", icon: I.ShoppingBag },
    { id: "people", label: "People", icon: I.Users },
  ];
  const accountsTabs = [
    { id: "dashboard", label: "Dashboard", icon: I.Home },
    { id: "roster", label: "Roster", icon: I.Calendar },
    { id: "timesheets", label: "Timesheets", icon: I.Clock },
    { id: "clock", label: "Clock In/Out", icon: I.Clock },
    { id: "leave", label: "Leave", icon: I.FileText },
    { id: "shop", label: "Shop", icon: I.ShoppingBag },
    { id: "people", label: "People", icon: I.Users },
  ];
  const empTabs = [
    { id: "dashboard", label: "Dashboard", icon: I.Home },
    { id: "roster", label: "My Roster", icon: I.Calendar },
    { id: "clock", label: "Clock In/Out", icon: I.Clock },
    { id: "leave", label: "Leave", icon: I.FileText },
    { id: "swaps", label: "Swap Shift", icon: I.Swap },
    { id: "shop", label: "Shop", icon: I.ShoppingBag },
  ];
  const currentTabs = isManager ? managerTabs : isAccounts ? accountsTabs : empTabs;

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", background: "var(--bg)", minHeight: "100vh", color: "var(--ink)" }}>
      <style>{CSS}</style>

      {/* Toast */}
      {toast && (
        <div className="fade-up" style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, padding: "10px 18px", borderRadius: "var(--radius)", background: toast.type === "success" ? "var(--green)" : "var(--red)", color: "#fff", fontSize: 13, fontWeight: 500, boxShadow: "0 8px 24px rgba(0,0,0,.15)" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header style={{ background: "var(--ink)", color: "var(--bg)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg, #D97706, #B45309)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 10, fontFamily: "'Fraunces', serif", color: "#fff" }}>SK</div>
            <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: -0.3 }}>SK Roster</span>
            {isManager && !user?.isOwner && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "rgba(217,119,6,.25)", color: "#FBBF24", fontWeight: 600 }}>MANAGER</span>}
            {user?.isOwner && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "rgba(220,38,38,.2)", color: "#F87171", fontWeight: 600 }}>OWNER</span>}
            {isAccounts && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "rgba(29,78,216,.25)", color: "#60A5FA", fontWeight: 600 }}>ACCOUNTS</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => setShowNotifs(!showNotifs)} style={{ position: "relative", padding: "4px 6px", borderRadius: 6, border: "1px solid rgba(255,255,255,.15)", background: "transparent", color: "rgba(246,245,240,.6)", cursor: "pointer" }}>
              <I.Bell size={15} />
              {(() => { const unread = notifications.filter(n => !n.readBy?.includes(user.id) && (n.targetEmpIds === "all" || n.targetEmpIds === "managers" && isManager || Array.isArray(n.targetEmpIds) && n.targetEmpIds.includes(user.id))).length; return unread > 0 ? <span style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: 8, background: "#EF4444", color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{unread > 9 ? "9+" : unread}</span> : null; })()}
            </button>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, fontWeight: 500 }}>{user.name}</div>
              <div style={{ fontSize: 9, opacity: .5 }}>{user.dept}</div>
            </div>
            <button onClick={logout} style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,.15)", background: "transparent", color: "rgba(246,245,240,.6)", cursor: "pointer", fontSize: 10, fontFamily: "inherit" }}>Sign out</button>
          </div>
        </div>
        {/* Notification dropdown */}
        {showNotifs && (
          <div style={{ position: "absolute", right: 16, top: 48, width: 320, maxHeight: 400, overflowY: "auto", background: "var(--surface)", borderRadius: 12, border: "1px solid var(--border)", boxShadow: "0 8px 30px rgba(0,0,0,.15)", zIndex: 200, padding: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 8px 12px" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>Notifications</span>
              <button onClick={async () => {
                const updated = notifications.map(n => ({ ...n, readBy: [...new Set([...(n.readBy || []), user.id])] }));
                setNotifications(updated);
                await persist(STORE_KEYS.notifications, updated);
              }} style={{ fontSize: 10, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Mark all read</button>
            </div>
            {notifications.filter(n => n.targetEmpIds === "all" || (n.targetEmpIds === "managers" && isManager) || (Array.isArray(n.targetEmpIds) && n.targetEmpIds.includes(user.id))).length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", color: "var(--ink3)", fontSize: 12 }}>No notifications</div>
            ) : (
              notifications.filter(n => n.targetEmpIds === "all" || (n.targetEmpIds === "managers" && isManager) || (Array.isArray(n.targetEmpIds) && n.targetEmpIds.includes(user.id))).slice(0, 20).map(n => (
                <div key={n.id} style={{ padding: "8px 10px", borderRadius: 8, marginBottom: 4, background: n.readBy?.includes(user.id) ? "transparent" : "var(--accent-bg)", fontSize: 12, color: "var(--ink)", lineHeight: 1.4 }}>
                  <div>{n.message}</div>
                  <div style={{ fontSize: 9, color: "var(--ink3)", marginTop: 4 }}>{new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              ))
            )}
          </div>
        )}
        <nav style={{ display: "flex", gap: 1, overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none", padding: "0 12px 8px", borderTop: "1px solid rgba(255,255,255,.06)" }}>
          {currentTabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 500, fontFamily: "inherit", background: tab === t.id ? "rgba(255,255,255,.12)" : "transparent", color: tab === t.id ? "#F6F5F0" : "rgba(246,245,240,.4)", transition: "all .2s", whiteSpace: "nowrap", flexShrink: 0 }}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main style={{ maxWidth: 1360, margin: "0 auto", padding: "16px 20px" }}>

        {/* ──── DASHBOARD (Managers, Accounts, Owner) ──── */}
        {(isManager || isAccounts) && tab === "dashboard" && (
          <div className="fade-up">
            <h2 style={{ fontSize: 18, fontWeight: 600, fontFamily: "'Fraunces', serif", marginBottom: 16 }}>Dashboard</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>

              {/* Today's Headcount */}
              <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: "18px 20px" }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "var(--ink2)", marginBottom: 10 }}>Today's Headcount</div>
                {(() => {
                  const todayIso = fmtDate(new Date(), "iso");
                  const deptEmps = canSeeAllDepts ? employees : employees.filter(e => e.dept === "Production");
                  var morningShifts = {}, afternoonShifts = {};
                  deptEmps.forEach(function(emp) {
                    var shift = getShift(emp.id, todayIso);
                    if (shift && SHIFTS[shift]) {
                      var label = (SHIFTS[shift].label || "").toLowerCase();
                      if (label.indexOf("morning") >= 0 || label.indexOf("early") >= 0 || label.indexOf("office") >= 0) {
                        morningShifts[shift] = (morningShifts[shift] || 0) + 1;
                      } else if (label.indexOf("afternoon") >= 0) {
                        afternoonShifts[shift] = (afternoonShifts[shift] || 0) + 1;
                      } else {
                        morningShifts[shift] = (morningShifts[shift] || 0) + 1;
                      }
                    }
                  });
                  var morningTotal = Object.values(morningShifts).reduce(function(a, b) { return a + b; }, 0);
                  var afternoonTotal = Object.values(afternoonShifts).reduce(function(a, b) { return a + b; }, 0);
                  var total = morningTotal + afternoonTotal;
                  return (
                    <>
                      <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Fraunces', serif", color: "var(--accent)", marginBottom: 12 }}>{total} <span style={{ fontSize: 14, fontWeight: 400, color: "var(--ink2)" }}>on shift today</span></div>
                      {morningTotal > 0 && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink3)", textTransform: "uppercase", letterSpacing: .5, marginBottom: 4 }}>Morning — {morningTotal}</div>
                          {Object.entries(morningShifts).map(function(entry) { return (
                            <div key={entry[0]} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, paddingLeft: 8 }}>
                              <span style={{ color: SHIFTS[entry[0]]?.color, fontWeight: 500 }}>{SHIFTS[entry[0]]?.label}</span>
                              <span style={{ fontWeight: 600 }}>{entry[1]}</span>
                            </div>
                          ); })}
                        </div>
                      )}
                      {afternoonTotal > 0 && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink3)", textTransform: "uppercase", letterSpacing: .5, marginBottom: 4 }}>Afternoon — {afternoonTotal}</div>
                          {Object.entries(afternoonShifts).map(function(entry) { return (
                            <div key={entry[0]} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, paddingLeft: 8 }}>
                              <span style={{ color: SHIFTS[entry[0]]?.color, fontWeight: 500 }}>{SHIFTS[entry[0]]?.label}</span>
                              <span style={{ fontWeight: 600 }}>{entry[1]}</span>
                            </div>
                          ); })}
                        </div>
                      )}
                      {total === 0 && <div style={{ fontSize: 12, color: "var(--ink3)" }}>No shifts rostered today</div>}
                    </>
                  );
                })()}
              </div>

              {/* On Leave This Week */}
              <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: "18px 20px" }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "var(--ink2)", marginBottom: 10 }}>On Leave This Week</div>
                {(() => {
                  const weekDays = days.map(d => fmtDate(d, "iso"));
                  const onLeave = employees.filter(emp =>
                    leaves.some(l => l.status === "approved" && l.employeeId === emp.id && weekDays.some(d => d >= l.startDate && d <= l.endDate))
                  );
                  return onLeave.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {onLeave.map(emp => {
                        const lv = leaves.find(l => l.status === "approved" && l.employeeId === emp.id && weekDays.some(d => d >= l.startDate && d <= l.endDate));
                        return (
                          <div key={emp.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div style={{ width: 22, height: 22, borderRadius: 6, background: `hsl(${parseInt(emp.id.split("-")[1]) * 43 % 360}, 35%, 88%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 600, color: `hsl(${parseInt(emp.id.split("-")[1]) * 43 % 360}, 35%, 40%)` }}>{emp.initials}</div>
                              <span style={{ fontWeight: 500 }}>{emp.name.split(" ")[0]}</span>
                            </div>
                            <span style={{ fontSize: 10, color: "var(--ink3)" }}>{lv?.type?.replace(" Leave", "")}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : <div style={{ fontSize: 12, color: "var(--ink3)" }}>No one on leave this week</div>;
                })()}
              </div>

              {/* Total Hours This Week (for Raj and Owner) */}
              {canSeeAllDepts && (
                <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: "18px 20px" }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "var(--ink2)", marginBottom: 10 }}>Rostered Hours This Week</div>
                  {(() => {
                    const thisWeekStart = getWeekStart(new Date());
                    const thisWeekDays = getDays(thisWeekStart).map(d => fmtDate(d, "iso"));
                    const thisWk = weekKey(thisWeekStart);
                    const empHours = employees.map(emp => {
                      let total = 0;
                      thisWeekDays.forEach(d => {
                        const shift = roster[thisWk]?.[emp.id]?.[d] || null;
                        if (shift && SHIFTS[shift]) total += (SHIFTS[shift].hours - 0.5);
                      });
                      return { emp, total: Math.round(total * 10) / 10 };
                    }).filter(e => e.total > 0).sort((a, b) => b.total - a.total);
                    const grandTotal = Math.round(empHours.reduce((a, b) => a + b.total, 0) * 10) / 10;
                    return (
                      <>
                        <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Fraunces', serif", color: "var(--accent)", marginBottom: 8 }}>{grandTotal} <span style={{ fontSize: 14, fontWeight: 400, color: "var(--ink2)" }}>total hours</span></div>
                        <div style={{ maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
                          {empHours.slice(0, 15).map(({ emp, total }) => (
                            <div key={emp.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                              <span>{emp.name}</span>
                              <span style={{ fontWeight: 600, color: total > 40 ? "var(--red)" : "var(--ink)" }}>{total}h{total > 40 ? " ⚠️" : ""}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Pending Requests */}
              <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: "18px 20px" }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "var(--ink2)", marginBottom: 10 }}>Pending Requests</div>
                {(() => {
                  const pendingLeaves = leaves.filter(l => l.status === "pending");
                  const pendingSwaps = swaps.filter(s => s.status === "pending");
                  const pendingPurchases = purchases.filter(p => p.status === "pending");
                  return (
                    <>
                      <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Fraunces', serif", color: pendingLeaves.length > 0 ? "#DC2626" : "var(--ink3)" }}>{pendingLeaves.length}</div>
                          <div style={{ fontSize: 10, color: "var(--ink3)" }}>Leave</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Fraunces', serif", color: pendingSwaps.length > 0 ? "#D97706" : "var(--ink3)" }}>{pendingSwaps.length}</div>
                          <div style={{ fontSize: 10, color: "var(--ink3)" }}>Swaps</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Fraunces', serif", color: pendingPurchases.length > 0 ? "#7C3AED" : "var(--ink3)" }}>{pendingPurchases.length}</div>
                          <div style={{ fontSize: 10, color: "var(--ink3)" }}>Purchases</div>
                        </div>
                      </div>
                      {pendingLeaves.length > 0 && <button onClick={() => setTab("leave")} style={{ fontSize: 11, color: "var(--accent)", background: "var(--accent-bg)", border: "none", padding: "5px 12px", borderRadius: 5, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>Review Leave →</button>}
                      {pendingSwaps.length > 0 && <button onClick={() => setTab("swaps")} style={{ fontSize: 11, color: "var(--accent)", background: "var(--accent-bg)", border: "none", padding: "5px 12px", borderRadius: 5, cursor: "pointer", fontFamily: "inherit", fontWeight: 500, marginLeft: 6 }}>Review Swaps →</button>}
                      {pendingPurchases.length > 0 && <button onClick={() => setTab("shop")} style={{ fontSize: 11, color: "var(--accent)", background: "var(--accent-bg)", border: "none", padding: "5px 12px", borderRadius: 5, cursor: "pointer", fontFamily: "inherit", fontWeight: 500, marginLeft: 6 }}>Review Purchases →</button>}
                    </>
                  );
                })()}
              </div>

              {/* Attendance This Month */}
              <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: "18px 20px", gridColumn: "1 / -1" }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "var(--ink2)", marginBottom: 10 }}>Attendance This Month</div>
                {(() => {
                  const now = new Date();
                  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                  const today = new Date(); today.setHours(0,0,0,0);
                  const pastDays = [];
                  for (let d = new Date(monthStart); d <= today; d.setDate(d.getDate() + 1)) {
                    pastDays.push(fmtDate(new Date(d), "iso"));
                  }
                  if (pastDays.length === 0) return <div style={{ fontSize: 12, color: "var(--ink3)" }}>No data yet this month</div>;

                  const deptEmps = canSeeAllDepts ? employees.filter(e => !e.isOwner) : employees.filter(e => e.dept === "Production" && !e.isOwner);
                  
                  const stats = deptEmps.map(emp => {
                    let rostered = 0, attended = 0;
                    pastDays.forEach(dayIso => {
                      const dayDate = new Date(dayIso + "T00:00:00");
                      const wkStart = getWeekStart(dayDate);
                      const wkKey = fmtDate(wkStart, "iso");
                      const shift = roster[wkKey]?.[emp.id]?.[dayIso];
                      if (shift) {
                        rostered++;
                        const clockedIn = timelog.some(t => t.empId === emp.id && t.date === dayIso && t.type === "in");
                        if (clockedIn) attended++;
                      }
                    });
                    const rate = rostered > 0 ? Math.round((attended / rostered) * 100) : null;
                    return { emp, rostered, attended, rate };
                  }).filter(s => s.rostered > 0).sort((a, b) => (a.rate ?? 100) - (b.rate ?? 100));

                  const monthName = now.toLocaleDateString("en-AU", { month: "long", year: "numeric" });

                  return (
                    <>
                      <div style={{ fontSize: 11, color: "var(--ink3)", marginBottom: 8 }}>{monthName} — {pastDays.length} days tracked</div>
                      <div style={{ maxHeight: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                        {stats.map(({ emp, rostered, attended, rate }) => (
                          <div key={emp.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ width: 22, height: 22, borderRadius: 6, background: `hsl(${parseInt(emp.id.split("-")[1]) * 43 % 360}, 35%, 88%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 600, color: `hsl(${parseInt(emp.id.split("-")[1]) * 43 % 360}, 35%, 40%)` }}>{emp.initials}</div>
                              <span style={{ fontSize: 12 }}>{emp.name}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 11, color: "var(--ink3)" }}>{attended}/{rostered} days</span>
                              <span style={{ fontSize: 12, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: rate >= 95 ? "rgba(21,128,61,.08)" : rate >= 80 ? "rgba(217,119,6,.08)" : "rgba(220,38,38,.08)", color: rate >= 95 ? "#15803D" : rate >= 80 ? "#D97706" : "#DC2626" }}>{rate}%</span>
                            </div>
                          </div>
                        ))}
                        {stats.length === 0 && <div style={{ fontSize: 12, color: "var(--ink3)" }}>No rostered shifts with clock-in data yet</div>}
                      </div>
                    </>
                  );
                })()}
              </div>

            </div>
          </div>
        )}

        {/* ──── EMPLOYEE DASHBOARD ──── */}
        {!isManager && !isAccounts && tab === "dashboard" && (
          <div className="fade-up">
            <h2 style={{ fontSize: 18, fontWeight: 600, fontFamily: "'Fraunces', serif", marginBottom: 16 }}>Welcome, {user.name.split(" ")[0]}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>

              {/* Today's Shift */}
              <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: "18px 20px" }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "var(--ink2)", marginBottom: 10 }}>Today's Shift</div>
                {(() => {
                  const todayIso = fmtDate(new Date(), "iso");
                  const shift = getShift(user.id, todayIso);
                  const onLeave = leaves.some(l => l.status === "approved" && l.employeeId === user.id && todayIso >= l.startDate && todayIso <= l.endDate);
                  if (onLeave) return <div style={{ fontSize: 16, fontWeight: 600, color: "#DC2626" }}>On Leave</div>;
                  if (!shift) return <div style={{ fontSize: 16, fontWeight: 600, color: "var(--ink3)" }}>Day off</div>;
                  return (
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Fraunces', serif", color: SHIFTS[shift]?.color }}>{SHIFTS[shift]?.label}</div>
                      <div style={{ fontSize: 14, color: "var(--ink2)", marginTop: 4 }}>{SHIFTS[shift]?.time}</div>
                      <div style={{ fontSize: 12, color: "var(--ink3)", marginTop: 2 }}>{SHIFTS[shift]?.hours - 0.5} hours (excl. 30min lunch)</div>
                    </div>
                  );
                })()}
              </div>

              {/* My Hours This Week */}
              <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: "18px 20px" }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "var(--ink2)", marginBottom: 10 }}>My Hours This Week</div>
                {(() => {
                  const thisWeekStart = getWeekStart(new Date());
                  const thisWeekDays = getDays(thisWeekStart).map(d => fmtDate(d, "iso"));
                  const thisWk = weekKey(thisWeekStart);
                  let total = 0;
                  const dayShifts = thisWeekDays.map(d => {
                    const shift = roster[thisWk]?.[user.id]?.[d] || null;
                    if (shift && SHIFTS[shift]) total += (SHIFTS[shift].hours - 0.5);
                    return { date: d, shift };
                  });
                  total = Math.round(total * 10) / 10;
                  return (
                    <>
                      <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Fraunces', serif", color: "var(--accent)", marginBottom: 8 }}>{total} <span style={{ fontSize: 14, fontWeight: 400, color: "var(--ink2)" }}>hours</span></div>
                      <div style={{ display: "flex", gap: 4 }}>
                        {dayShifts.map((ds, i) => (
                          <div key={i} style={{ flex: 1, textAlign: "center", padding: "4px 2px", borderRadius: 4, background: ds.shift ? (SHIFTS[ds.shift]?.bg || "#f0f0f0") : "var(--surface2)", fontSize: 9 }}>
                            <div style={{ fontWeight: 500, color: "var(--ink3)" }}>{["M","T","W","T","F","S","S"][i]}</div>
                            <div style={{ fontWeight: 600, color: ds.shift ? SHIFTS[ds.shift]?.color : "var(--ink3)", marginTop: 2 }}>{ds.shift ? (SHIFTS[ds.shift]?.hours - 0.5) : "—"}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* My Pending Requests */}
              <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: "18px 20px" }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "var(--ink2)", marginBottom: 10 }}>My Requests</div>
                {(() => {
                  const myLeaves = leaves.filter(l => l.employeeId === user.id && l.status === "pending");
                  const mySwaps = swaps.filter(s => s.requesterId === user.id && s.status === "pending");
                  const recentLeaves = leaves.filter(l => l.employeeId === user.id && l.status !== "pending").slice(-2);
                  return (
                    <>
                      {myLeaves.length > 0 && myLeaves.map(l => (
                        <div key={l.id} style={{ padding: "6px 10px", borderRadius: 6, background: "rgba(217,119,6,.06)", marginBottom: 4, fontSize: 12 }}>
                          <span style={{ color: "#D97706", fontWeight: 600 }}>Pending: </span>
                          <span>{l.type} ({l.startDate} → {l.endDate})</span>
                        </div>
                      ))}
                      {mySwaps.length > 0 && mySwaps.map(s => (
                        <div key={s.id} style={{ padding: "6px 10px", borderRadius: 6, background: "rgba(29,78,216,.06)", marginBottom: 4, fontSize: 12 }}>
                          <span style={{ color: "#1D4ED8", fontWeight: 600 }}>Swap pending: </span>
                          <span>{s.date}</span>
                        </div>
                      ))}
                      {recentLeaves.map(l => (
                        <div key={l.id} style={{ padding: "6px 10px", borderRadius: 6, background: l.status === "approved" ? "rgba(21,128,61,.06)" : "rgba(220,38,38,.06)", marginBottom: 4, fontSize: 12 }}>
                          <span style={{ color: l.status === "approved" ? "#15803D" : "#DC2626", fontWeight: 600 }}>{l.status === "approved" ? "Approved" : "Declined"}: </span>
                          <span>{l.type} ({l.startDate})</span>
                        </div>
                      ))}
                      {myLeaves.length === 0 && mySwaps.length === 0 && recentLeaves.length === 0 && (
                        <div style={{ fontSize: 12, color: "var(--ink3)" }}>No pending requests</div>
                      )}
                    </>
                  );
                })()}
              </div>

            </div>
          </div>
        )}

        {/* ──── MANAGER: ROSTER ──── */}
        {(isManager || isAccounts) && tab === "roster" && (
          <div className="fade-up">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); }} style={btnIcon}><I.ChevL /></button>
                <h2 style={{ fontSize: 16, fontWeight: 600, fontFamily: "'Fraunces', serif", minWidth: 180, textAlign: "center" }}>
                  {fmtDate(days[0])} – {fmtDate(days[6])}
                </h2>
                <button onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); }} style={btnIcon}><I.ChevR /></button>
                <button onClick={() => setWeekStart(getWeekStart(new Date()))} style={{ ...btnIcon, fontSize: 11, padding: "5px 10px", width: "auto" }}>Today</button>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {canSeeAllDepts && (
                  <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={selectSt}>
                    <option>All</option>
                    {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                  </select>
                )}
                {isManager && !canSeeAllDepts && <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink2)" }}>Production</span>}
                {isManager && <button onClick={function() { if (window.confirm("Copy all shifts from previous week to this week? Existing shifts won't be overwritten.")) copyPreviousWeek(); }} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontSize: 11, fontFamily: "inherit", color: "var(--ink2)" }}>Copy Prev Week</button>}
                {isManager && <button onClick={() => {
                  // Build a clean HTML table for printing
                  const weekLabel = `${fmtDate(days[0])} – ${fmtDate(days[6])}`;
                  const dayHeaders = days.map(d => `<th style="padding:6px 4px;text-align:center;font-size:11px;border:1px solid #ddd;background:#f5f5f0">${fmtDate(d, "day")}<br/>${fmtDate(d, "num")}</th>`).join("");
                  const rows = [...filtered].sort((a, b) => {
                    var shiftKeys = Object.keys(SHIFTS);
                    function getMostCommonShift(empId) {
                      var counts = {};
                      days.forEach(function(d) {
                        var s = getShift(empId, fmtDate(d, "iso"));
                        if (s) counts[s] = (counts[s] || 0) + 1;
                      });
                      var best = null, bestCount = 0;
                      Object.keys(counts).forEach(function(k) {
                        if (counts[k] > bestCount) { best = k; bestCount = counts[k]; }
                      });
                      return best;
                    }
                    var shiftA = getMostCommonShift(a.id);
                    var shiftB = getMostCommonShift(b.id);
                    var idxA = shiftA ? shiftKeys.indexOf(shiftA) : 999;
                    var idxB = shiftB ? shiftKeys.indexOf(shiftB) : 999;
                    if (idxA !== idxB) return idxA - idxB;
                    return a.name.localeCompare(b.name);
                  }).map(emp => {
                    const cells = days.map(d => {
                      const iso = fmtDate(d, "iso");
                      const shift = getShift(emp.id, iso);
                      const onLeave = leaves.some(l => l.status === "approved" && l.employeeId === emp.id && iso >= l.startDate && iso <= l.endDate);
                      if (onLeave) return `<td style="padding:4px;text-align:center;font-size:10px;border:1px solid #ddd;background:#FEE2E2;color:#DC2626;font-weight:600">Leave</td>`;
                      if (shift && SHIFTS[shift]) return `<td style="padding:4px;text-align:center;font-size:10px;border:1px solid #ddd;background:${SHIFTS[shift].bg};color:${SHIFTS[shift].color};font-weight:600">${SHIFTS[shift].label}<br/><span style="font-weight:400;font-size:9px">${SHIFTS[shift].time.split("–")[0].trim()}</span></td>`;
                      return `<td style="padding:4px;text-align:center;border:1px solid #ddd;color:#ccc;font-size:10px">—</td>`;
                    }).join("");
                    return `<tr><td style="padding:6px 10px;font-size:11px;font-weight:500;border:1px solid #ddd;white-space:nowrap">${emp.name}</td>${cells}</tr>`;
                  }).join("");
                  const html = `<!DOCTYPE html><html><head><title>Roster ${weekLabel}</title><style>body{font-family:Arial,sans-serif;padding:20px}table{border-collapse:collapse;width:100%}@media print{body{padding:10px}}</style></head><body><h2 style="margin:0 0 4px;font-size:16px">Sharma's Kitchen — Weekly Roster</h2><p style="margin:0 0 14px;color:#666;font-size:13px">${weekLabel}</p><table><thead><tr><th style="padding:6px 10px;text-align:left;font-size:11px;border:1px solid #ddd;background:#f5f5f0">Employee</th>${dayHeaders}</tr></thead><tbody>${rows}</tbody></table><p style="margin-top:16px;font-size:10px;color:#999">Printed ${new Date().toLocaleString("en-AU")}</p></body></html>`;
                  const w = window.open("", "_blank");
                  w.document.write(html);
                  w.document.close();
                  setTimeout(() => { w.print(); }, 500);
                }} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontSize: 11, fontFamily: "inherit", color: "var(--ink2)" }}><I.Download /> PDF</button>}
              </div>
            </div>
            {/* Shift Legend */}
            <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
              {Object.entries(SHIFTS).map(([k, s]) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "var(--ink2)" }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: s.dot }} />{s.label}
                </div>
              ))}
              {user?.isOwner && <button onClick={() => setModal({ type: "manageShifts" })} style={{ fontSize: 10, color: "var(--accent)", background: "var(--accent-bg)", border: "none", padding: "3px 8px", borderRadius: 4, cursor: "pointer", fontFamily: "inherit", fontWeight: 500, marginLeft: 4 }}>+ Manage Shifts</button>}
            </div>
            {/* Grid */}
            <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "180px repeat(7, 1fr)", borderBottom: "2px solid var(--border)" }}>
                <div style={{ padding: "10px 14px", fontWeight: 600, fontSize: 12, color: "var(--ink2)" }}>Employee</div>
                {days.map((d, i) => {
                  const isToday = fmtDate(d, "iso") === fmtDate(new Date(), "iso");
                  return (
                    <div key={i} style={{ padding: "8px 4px", textAlign: "center", borderLeft: "1px solid var(--border)", background: isToday ? "var(--accent-bg)" : "transparent" }}>
                      <div style={{ fontSize: 10, fontWeight: 500, color: isToday ? "var(--accent)" : "var(--ink3)" }}>{fmtDate(d, "day")}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: isToday ? "var(--accent)" : "var(--ink)", fontFamily: "'Fraunces', serif" }}>{fmtDate(d, "num")}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ maxHeight: 480, overflowY: "auto" }}>
                {[...filtered].sort((a, b) => {
                  // Sort by most common shift this week, then alphabetically
                  var shiftKeys = Object.keys(SHIFTS);
                  function getMostCommonShift(empId) {
                    var counts = {};
                    days.forEach(function(d) {
                      var s = getShift(empId, fmtDate(d, "iso"));
                      if (s) counts[s] = (counts[s] || 0) + 1;
                    });
                    var best = null, bestCount = 0;
                    Object.keys(counts).forEach(function(k) {
                      if (counts[k] > bestCount) { best = k; bestCount = counts[k]; }
                    });
                    return best;
                  }
                  var shiftA = getMostCommonShift(a.id);
                  var shiftB = getMostCommonShift(b.id);
                  var idxA = shiftA ? shiftKeys.indexOf(shiftA) : 999;
                  var idxB = shiftB ? shiftKeys.indexOf(shiftB) : 999;
                  if (idxA !== idxB) return idxA - idxB;
                  return a.name.localeCompare(b.name);
                }).map(emp => (
                  <div key={emp.id} style={{ display: "grid", gridTemplateColumns: "180px repeat(7, 1fr)", borderBottom: "1px solid #f3f2ee" }}>
                    <div style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: `hsl(${parseInt(emp.id.split("-")[1]) * 43 % 360}, 35%, 88%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, color: `hsl(${parseInt(emp.id.split("-")[1]) * 43 % 360}, 35%, 40%)`, flexShrink: 0 }}>{emp.initials}</div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.2 }}>{emp.name}</div>
                        <div style={{ fontSize: 9, color: "var(--ink3)" }}>{emp.role}</div>
                      </div>
                    </div>
                    {days.map((d, di) => {
                      const iso = fmtDate(d, "iso");
                      const shift = getShift(emp.id, iso);
                      const isToday = iso === fmtDate(new Date(), "iso");
                      // Check if employee has approved leave on this day
                      const onLeave = leaves.some(l => l.status === "approved" && l.empId === emp.id && iso >= l.startDate && iso <= l.endDate);
                      return (
                        <div key={di} style={{ padding: "4px 3px", display: "flex", alignItems: "center", justifyContent: "center", borderLeft: "1px solid #f3f2ee", background: onLeave ? "rgba(239,68,68,.04)" : isToday ? "rgba(180,83,9,.02)" : "transparent" }}>
                          {onLeave ? (
                            <div style={{ width: "92%", padding: "4px 2px", borderRadius: 6, background: "rgba(239,68,68,.08)", color: "#DC2626", fontSize: 8, fontWeight: 600, border: "1px solid rgba(239,68,68,.15)", textAlign: "center", lineHeight: 1.3 }}>On<br/>Leave</div>
                          ) : shift ? (
                            isManager ? (
                              <button className="print-keep" onClick={() => removeShift(emp.id, iso)} title="Click to remove" style={{ width: "92%", padding: "4px 2px", borderRadius: 6, background: SHIFTS[shift]?.bg || "#f0f0f0", color: SHIFTS[shift]?.color || "#333", fontSize: 9, fontWeight: 600, border: `1px solid ${SHIFTS[shift]?.color || "#ccc"}22`, cursor: "pointer", fontFamily: "inherit", lineHeight: 1.2, textAlign: "center", transition: "transform .15s" }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.06)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                                {SHIFTS[shift]?.label?.replace(" Process", " Proc") || shift}
                                <div style={{ fontSize: 8, fontWeight: 400, opacity: .7, marginTop: 1 }}>{SHIFTS[shift]?.time?.split("–")[0]?.trim()}</div>
                              </button>
                            ) : (
                              <div style={{ width: "92%", padding: "4px 2px", borderRadius: 6, background: SHIFTS[shift]?.bg || "#f0f0f0", color: SHIFTS[shift]?.color || "#333", fontSize: 9, fontWeight: 600, border: `1px solid ${SHIFTS[shift]?.color || "#ccc"}22`, fontFamily: "inherit", lineHeight: 1.2, textAlign: "center" }}>
                                {SHIFTS[shift]?.label?.replace(" Process", " Proc") || shift}
                                <div style={{ fontSize: 8, fontWeight: 400, opacity: .7, marginTop: 1 }}>{SHIFTS[shift]?.time?.split("–")[0]?.trim()}</div>
                              </div>
                            )
                          ) : (
                            isManager ? (
                              <button onClick={() => setModal({ type: "assignShift", empId: emp.id, empName: emp.name, day: iso })} style={{ width: 24, height: 24, borderRadius: 6, border: "1.5px dashed var(--border2)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: .3, transition: "opacity .2s" }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = .3}><I.Plus /></button>
                            ) : (
                              <div style={{ fontSize: 8, color: "var(--ink3)" }}>—</div>
                            )
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
              {/* Daily shift totals */}
              <div style={{ display: "grid", gridTemplateColumns: "180px repeat(7, 1fr)", borderTop: "2px solid var(--border)" }}>
                <div style={{ padding: "6px 14px", fontSize: 10, fontWeight: 600, color: "var(--ink3)" }}>MORNING</div>
                {days.map(function(d, i) {
                  var iso = fmtDate(d, "iso");
                  var count = 0;
                  filtered.forEach(function(emp) {
                    var s = getShift(emp.id, iso);
                    if (s && SHIFTS[s]) {
                      var label = (SHIFTS[s].label || "").toLowerCase();
                      if (label.indexOf("morning") >= 0 || label.indexOf("early") >= 0 || label.indexOf("office") >= 0) count++;
                    }
                  });
                  return <div key={i} style={{ padding: "6px 4px", textAlign: "center", fontSize: 13, fontWeight: 700, color: count > 0 ? "var(--accent)" : "var(--ink3)", borderLeft: "1px solid var(--border)" }}>{count || "-"}</div>;
                })}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "180px repeat(7, 1fr)", borderTop: "1px solid #f3f2ee", borderRadius: "0 0 12px 12px" }}>
                <div style={{ padding: "6px 14px", fontSize: 10, fontWeight: 600, color: "var(--ink3)" }}>AFTERNOON</div>
                {days.map(function(d, i) {
                  var iso = fmtDate(d, "iso");
                  var count = 0;
                  filtered.forEach(function(emp) {
                    var s = getShift(emp.id, iso);
                    if (s && SHIFTS[s]) {
                      var label = (SHIFTS[s].label || "").toLowerCase();
                      if (label.indexOf("afternoon") >= 0) count++;
                    }
                  });
                  return <div key={i} style={{ padding: "6px 4px", textAlign: "center", fontSize: 13, fontWeight: 700, color: count > 0 ? "#1D4ED8" : "var(--ink3)", borderLeft: "1px solid var(--border)" }}>{count || "-"}</div>;
                })}
              </div>
            </div>
          </div>
        )}

        {/* ──── EMPLOYEE: MY ROSTER ──── */}
        {!isManager && !isAccounts && tab === "roster" && (
          <div className="fade-up">
            <h2 style={{ fontSize: 18, fontWeight: 600, fontFamily: "'Fraunces', serif", marginBottom: 4 }}>My Roster</h2>
            <p style={{ fontSize: 13, color: "var(--ink2)", marginBottom: 16 }}>Your upcoming shifts</p>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
              <button onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); }} style={btnIcon}><I.ChevL /></button>
              <span style={{ fontSize: 14, fontWeight: 500, minWidth: 160, textAlign: "center" }}>{fmtDate(days[0])} – {fmtDate(days[6])}</span>
              <button onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); }} style={btnIcon}><I.ChevR /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {days.map((d, i) => {
                const iso = fmtDate(d, "iso");
                const shift = getShift(user.id, iso);
                const isToday = iso === fmtDate(new Date(), "iso");
                const isPast = d < new Date() && !isToday;
                return (
                  <div key={i} style={{ background: "var(--surface)", borderRadius: "var(--radius)", border: isToday ? "2px solid var(--accent)" : "1px solid var(--border)", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", opacity: isPast ? .5 : 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 44, textAlign: "center" }}>
                        <div style={{ fontSize: 10, fontWeight: 500, color: isToday ? "var(--accent)" : "var(--ink3)", textTransform: "uppercase" }}>{fmtDate(d, "day")}</div>
                        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Fraunces', serif", color: isToday ? "var(--accent)" : "var(--ink)" }}>{fmtDate(d, "num")}</div>
                      </div>
                      {shift ? (
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: SHIFTS[shift]?.color }}>{SHIFTS[shift]?.label}</div>
                          <div style={{ fontSize: 12, color: "var(--ink2)" }}>{SHIFTS[shift]?.time}</div>
                        </div>
                      ) : (
                        <div style={{ fontSize: 13, color: "var(--ink3)", fontStyle: "italic" }}>Day off</div>
                      )}
                    </div>
                    {isToday && <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 4, background: "var(--accent-bg)", color: "var(--accent)" }}>TODAY</span>}
                  </div>
                );
              })}
            </div>

            {/* Team Roster - same department only */}
            <h3 style={{ fontSize: 15, fontWeight: 600, fontFamily: "'Fraunces', serif", marginTop: 24, marginBottom: 12 }}>Team Roster — {user.dept}</h3>
            <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)", overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: `140px repeat(7, 1fr)`, fontSize: 11, fontWeight: 600 }}>
                <div style={{ padding: "8px 12px", color: "var(--ink3)" }}>Employee</div>
                {days.map((d, i) => {
                  const isToday = fmtDate(d, "iso") === fmtDate(new Date(), "iso");
                  return <div key={i} style={{ padding: "8px 4px", textAlign: "center", color: isToday ? "var(--accent)" : "var(--ink3)" }}>{fmtDate(d, "day")}<br/><span style={{ fontWeight: 700 }}>{fmtDate(d, "num")}</span></div>;
                })}
              </div>
              {employees.filter(e => e.dept === user.dept && e.id !== user.id && !e.isOwner).sort((a, b) => a.name.localeCompare(b.name)).map(emp => (
                <div key={emp.id} style={{ display: "grid", gridTemplateColumns: `140px repeat(7, 1fr)`, borderTop: "1px solid var(--border)", alignItems: "center" }}>
                  <div style={{ padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: `hsl(${parseInt(emp.id.split("-")[1]) * 43 % 360}, 35%, 88%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 600, color: `hsl(${parseInt(emp.id.split("-")[1]) * 43 % 360}, 35%, 40%)` }}>{emp.initials}</div>
                    <span style={{ fontSize: 11, fontWeight: 500 }}>{emp.name.split(" ")[0]}</span>
                  </div>
                  {days.map((d, di) => {
                    const iso = fmtDate(d, "iso");
                    const shift = getShift(emp.id, iso);
                    const onLeave = leaves.some(l => l.status === "approved" && l.empId === emp.id && iso >= l.startDate && iso <= l.endDate);
                    return (
                      <div key={di} style={{ padding: "4px 3px", display: "flex", alignItems: "center", justifyContent: "center", borderLeft: "1px solid #f3f2ee" }}>
                        {onLeave ? (
                          <div style={{ fontSize: 8, fontWeight: 600, color: "#DC2626" }}>Leave</div>
                        ) : shift ? (
                          <div style={{ width: "92%", padding: "3px 2px", borderRadius: 5, background: SHIFTS[shift]?.bg, color: SHIFTS[shift]?.color, fontSize: 8, fontWeight: 600, textAlign: "center", border: `1px solid ${SHIFTS[shift]?.color}22` }}>{SHIFTS[shift]?.label?.replace(" Production", "").replace(" Process", " Proc")}</div>
                        ) : (
                          <div style={{ fontSize: 8, color: "var(--ink3)" }}>—</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
        {!isManager && tab === "clock" && (
          <ClockScreen
            user={user}
            geoStatus={geoStatus}
            geoDistance={geoDistance}
            GEOFENCE_RADIUS={GEOFENCE_RADIUS}
            getEmployeeSite={getEmployeeSite}
            checkLocationAndClock={checkLocationAndClock}
            completeClock={completeClock}
            pendingClock={pendingClock}
            timelog={timelog}
            fmtDate={fmtDate}
          />
        )}

        {/* ──── MANAGER/ACCOUNTS: TIMESHEETS ──── */}
        {(isManager || isAccounts) && tab === "timesheets" && (
          <div className="fade-up">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, fontFamily: "'Fraunces', serif" }}>Timesheets</h2>
              {canExport && <button onClick={() => {
                const count = exportMYOBTimesheets(timelog, employees);
                if (count) notify(`Exported ${count} entries for MYOB`);
                else notify("No completed timesheet entries to export", "error");
              }} style={{ ...btnPrimary, background: "#15803D" }}>
                <I.Download /> Export for MYOB
              </button>}
            </div>
            {/* Live status */}
            <div style={{ background: "var(--ink)", borderRadius: "var(--radius-lg)", padding: 20, marginBottom: 16, color: "var(--bg)" }}>
              <div style={{ fontSize: 12, fontWeight: 500, opacity: .5, marginBottom: 10 }}>Currently clocked in</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {employees.filter(e => e.clockedIn).length === 0 && <div style={{ fontSize: 12, opacity: .4 }}>Nobody currently clocked in</div>}
                {employees.filter(e => e.clockedIn).sort((a, b) => a.name.localeCompare(b.name)).map(e => (
                  <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 7, background: "rgba(21,128,61,.15)", border: "1px solid rgba(21,128,61,.2)" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E" }} />
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{e.name}</span>
                    <span style={{ fontSize: 10, opacity: .5 }}>since {e.clockInTime}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* MYOB Export Info */}
            {canExport && <div style={{ background: "var(--green-bg)", borderRadius: "var(--radius)", border: "1px solid #BBF7D0", padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ fontSize: 16, marginTop: 1 }}>📋</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--green)", marginBottom: 2 }}>MYOB AccountRight Export</div>
                <div style={{ fontSize: 12, color: "var(--ink2)", lineHeight: 1.5 }}>
                  Click "Export for MYOB" to download a CSV file. In MYOB, go to <strong>File → Import Data → Timesheets</strong> and select the downloaded file. Only completed entries (clocked in AND out) are included. The default payroll category is "Base Hourly" — adjust in MYOB if needed.
                </div>
              </div>
            </div>}
            {/* Log table */}
            <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 90px 90px 80px 68px", padding: "10px 16px", borderBottom: "2px solid var(--border)", fontSize: 10, fontWeight: 600, color: "var(--ink3)", textTransform: "uppercase", letterSpacing: .5 }}>
                <div>Employee</div><div>Date</div><div>Clock In</div><div>Clock Out</div><div>Location</div><div>Photos</div>
              </div>
              <div style={{ maxHeight: 360, overflowY: "auto" }}>
                {timelog.slice().reverse().slice(0, 50).map(t => (
                  <div key={t.id} style={{ display: "grid", gridTemplateColumns: "1fr 100px 90px 90px 80px 68px", padding: "9px 16px", borderBottom: "1px solid #f3f2ee", fontSize: 13, alignItems: "center" }}>
                    <div style={{ fontWeight: 500 }}>{t.empName} <span style={{ fontSize: 10, color: "var(--ink3)" }}>({t.dept})</span></div>
                    <div style={{ color: "var(--ink2)" }}>{t.date}</div>
                    <div>{t.clockIn}</div>
                    <div>{t.clockOut || <span style={{ color: "var(--green)", fontWeight: 500, fontSize: 11 }}>Active</span>}</div>
                    <div>{t.location ? <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: t.location.distance <= GEOFENCE_RADIUS ? "var(--green-bg)" : "var(--red-bg)", color: t.location.distance <= GEOFENCE_RADIUS ? "var(--green)" : "var(--red)", fontWeight: 600 }} title={t.location.site || ""}>📍 {t.location.distance}m{t.location.site ? ` · ${t.location.site.split(" ")[0]}` : ""}</span> : <span style={{ fontSize: 10, color: "var(--ink3)" }}>—</span>}</div>
                    <div style={{ display: "flex", gap: 3 }}>
                      {t.photo ? <img src={t.photo} alt="" onClick={() => setModal({ type: "viewPhoto", photo: t.photo, empName: t.empName, date: t.date, time: t.clockIn, label: "Clock In" })} style={{ width: 28, height: 28, borderRadius: 5, objectFit: "cover", cursor: "pointer", border: "1px solid var(--border)" }} title="Clock In" /> : <span style={{ width: 28, height: 28, borderRadius: 5, background: "var(--surface2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "var(--ink3)" }}>IN</span>}
                      {t.photoOut ? <img src={t.photoOut} alt="" onClick={() => setModal({ type: "viewPhoto", photo: t.photoOut, empName: t.empName, date: t.date, time: t.clockOut, label: "Clock Out" })} style={{ width: 28, height: 28, borderRadius: 5, objectFit: "cover", cursor: "pointer", border: "1px solid var(--border)" }} title="Clock Out" /> : <span style={{ width: 28, height: 28, borderRadius: 5, background: "var(--surface2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "var(--ink3)" }}>OUT</span>}
                    </div>
                  </div>
                ))}
                {timelog.length === 0 && <div style={{ padding: 20, textAlign: "center", color: "var(--ink3)", fontSize: 13 }}>No time entries yet. Employees can clock in from their view.</div>}
              </div>
            </div>
          </div>
        )}

        {/* ──── LEAVE (both views) ──── */}
        {tab === "leave" && (
          <div className="fade-up">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, fontFamily: "'Fraunces', serif" }}>Leave {isManager ? "Management" : "Requests"}</h2>
              {!isManager && <button onClick={() => setModal({ type: "newLeave" })} style={btnPrimary}><I.Plus /> Request Leave</button>}
            </div>
            {/* My leave balance (employee) */}
            {!isManager && (
              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                {[{ label: "Annual", val: user.leaveBalance.annual, color: "var(--accent)" }, { label: "Personal/Sick", val: user.leaveBalance.personal || 0, color: "var(--blue)" }].map(b => (
                  <div key={b.label} style={{ flex: 1, background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: 14, textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Fraunces', serif", color: b.color }}>{b.val}</div>
                    <div style={{ fontSize: 11, color: "var(--ink2)" }}>{b.label} days</div>
                  </div>
                ))}
              </div>
            )}
            {/* Leave list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(isManager ? leaves : leaves.filter(l => l.employeeId === user.id)).sort((a, b) => a.status === "pending" ? -1 : 1).map(l => (
                <div key={l.id} style={{ background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", borderLeft: `3px solid ${l.status === "pending" ? "var(--accent)" : l.status === "approved" ? "var(--green)" : "var(--red)"}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{l.employeeName}</div>
                    <div style={{ fontSize: 12, color: "var(--ink2)" }}>{l.type} · {l.reason || ""}</div>
                  </div>
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{l.startDate} → {l.endDate}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, textTransform: "capitalize", background: l.status === "pending" ? "var(--accent-bg)" : l.status === "approved" ? "var(--green-bg)" : "var(--red-bg)", color: l.status === "pending" ? "var(--accent)" : l.status === "approved" ? "var(--green)" : "var(--red)" }}>{l.status}</span>
                    {isManager && l.status === "pending" && (
                      <>
                        <button onClick={() => handleLeave(l.id, "approved")} style={{ ...btnSmall, background: "var(--green-bg)", color: "var(--green)" }}><I.Check /></button>
                        <button onClick={() => handleLeave(l.id, "declined")} style={{ ...btnSmall, background: "var(--red-bg)", color: "var(--red)" }}><I.X /></button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {(isManager ? leaves : leaves.filter(l => l.employeeId === user.id)).length === 0 && (
                <div style={{ textAlign: "center", padding: 40, color: "var(--ink3)", fontSize: 13 }}>No leave requests yet</div>
              )}
            </div>
          </div>
        )}

        {/* ──── SWAPS (both views) ──── */}
        {tab === "swaps" && (
          <div className="fade-up">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, fontFamily: "'Fraunces', serif" }}>{isManager ? "Swap Requests" : "Request a Shift Swap"}</h2>
              {!isManager && <button onClick={() => setModal({ type: "newSwap" })} style={btnPrimary}><I.Plus /> New Swap Request</button>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(isManager ? swaps : swaps.filter(s => s.requesterId === user.id)).map(s => {
                const target = employees.find(e => e.id === s.targetId);
                return (
                  <div key={s.id} style={{ background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", borderLeft: `3px solid ${s.status === "pending" ? "var(--accent)" : s.status === "approved" ? "var(--green)" : "var(--red)"}` }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{s.requesterName} <span style={{ color: "var(--ink3)", fontWeight: 400 }}>↔</span> {target?.name || "Unknown"}</div>
                      <div style={{ fontSize: 12, color: "var(--ink2)" }}>Date: {s.date} · Reason: {s.reason || "—"}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, textTransform: "capitalize", background: s.status === "pending" ? "var(--accent-bg)" : s.status === "approved" ? "var(--green-bg)" : "var(--red-bg)", color: s.status === "pending" ? "var(--accent)" : s.status === "approved" ? "var(--green)" : "var(--red)" }}>{s.status}</span>
                      {isManager && s.status === "pending" && (
                        <>
                          <button onClick={() => handleSwap(s.id, "approved")} style={{ ...btnSmall, background: "var(--green-bg)", color: "var(--green)" }}><I.Check /></button>
                          <button onClick={() => handleSwap(s.id, "declined")} style={{ ...btnSmall, background: "var(--red-bg)", color: "var(--red)" }}><I.X /></button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              {(isManager ? swaps : swaps.filter(s => s.requesterId === user.id)).length === 0 && (
                <div style={{ textAlign: "center", padding: 40, color: "var(--ink3)", fontSize: 13 }}>No swap requests yet</div>
              )}
            </div>
          </div>
        )}

        {/* ──── PEOPLE (Manager + Accounts) ──── */}
        {(isManager || isAccounts) && tab === "people" && (
          <div className="fade-up">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, fontFamily: "'Fraunces', serif" }}>People ({employees.length})</h2>
              <div style={{ display: "flex", gap: 8 }}>
                {canAddEmployee && <button onClick={() => setModal({ type: "addEmployee" })} style={btnPrimary}><I.Plus /> Add Employee</button>}
                <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={selectSt}>
                  <option>All</option>
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
              {filtered.map(emp => (
                <div key={emp.id} style={{ background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: "16px 18px", position: "relative" }}>
                  <div style={{ position: "absolute", top: 12, right: 12, width: 7, height: 7, borderRadius: "50%", background: emp.clockedIn ? "var(--green)" : "var(--border2)" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: `hsl(${parseInt(emp.id.split("-")[1]) * 43 % 360}, 35%, 88%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: `hsl(${parseInt(emp.id.split("-")[1]) * 43 % 360}, 35%, 40%)` }}>{emp.initials}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{emp.name} {emp.isOwner && <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: "rgba(220,38,38,.1)", color: "var(--red)", fontWeight: 600 }}>OWNER</span>} {emp.isManager && !emp.isOwner && <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: "var(--accent-bg)", color: "var(--accent)", fontWeight: 600 }}>MGR</span>} {emp.isAccounts && <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: "var(--blue-bg)", color: "var(--blue)", fontWeight: 600 }}>ACC</span>}</div>
                      <div style={{ fontSize: 11, color: "var(--ink2)" }}>{emp.role} · {emp.dept}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      <span style={tagSt("var(--accent)")}>AL: {emp.leaveBalance.annual}d</span>
                      <span style={tagSt("var(--blue)")}>PL: {emp.leaveBalance.personal || 0}d</span>
                      <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 3, background: emp.employmentType === "casual" ? "rgba(107,107,107,.1)" : emp.employmentType === "part-time" ? "rgba(14,165,233,.1)" : "rgba(34,197,94,.1)", color: emp.employmentType === "casual" ? "#6B6B6B" : emp.employmentType === "part-time" ? "#0EA5E9" : "#22C55E", fontWeight: 600 }}>{emp.employmentType === "full-time" ? "FT" : emp.employmentType === "part-time" ? `PT ${emp.daysPerWeek || 3}d/wk` : "CAS"}</span>
                    </div>
                    {(user?.isOwner || user?.isAccounts) && <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink2)" }}>${emp.hourlyRate}/hr</span>}
                  </div>
                  {user?.isOwner && <div style={{ fontSize: 10, color: "var(--ink3)", marginTop: 4 }}>PIN: {emp.pin}</div>}
                  {(user?.isOwner || user?.isAccounts) && <button onClick={() => setModal({ type: "editLeaveBalance", emp })} style={{ fontSize: 10, color: "var(--accent)", background: "var(--accent-bg)", border: "none", padding: "4px 10px", borderRadius: 5, cursor: "pointer", fontFamily: "inherit", fontWeight: 500, marginTop: 6 }}>Edit Leave Balances</button>}
                  {user?.isOwner && emp.id !== user.id && <button onClick={function() { if (window.confirm("Remove " + emp.name + " from the roster? This cannot be undone.")) { var next = employees.filter(function(e) { return e.id !== emp.id; }); setEmployees(next); persist(STORE_KEYS.employees, next); notify(emp.name + " removed"); } }} style={{ fontSize: 10, color: "#DC2626", background: "rgba(220,38,38,.08)", border: "none", padding: "4px 10px", borderRadius: 5, cursor: "pointer", fontFamily: "inherit", fontWeight: 500, marginTop: 4 }}>Remove Employee</button>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ──── SHOP ──── */}
        {tab === "shop" && (
          <div className="fade-up">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, fontFamily: "'Fraunces', serif" }}>Staff Shop</h2>
              <button onClick={() => setModal({ type: "newPurchase" })} style={btnPrimary}><I.Plus /> New Purchase</button>
            </div>
            {(isManager || isAccounts) && (
              <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                {user?.isOwner && <button onClick={() => setModal({ type: "manageProducts" })} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 500, color: "var(--ink2)" }}>Manage Products</button>}
                <button onClick={function() { var n = exportPurchasesCSV(purchases, "payroll"); if (n) { notify("Exported " + n + " payroll purchases"); } else { notify("No payroll purchases to export"); } }} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 500, color: "var(--ink2)", display: "flex", alignItems: "center", gap: 4 }}><I.Download /> Export Payroll</button>
                <button onClick={function() { var n = exportPurchasesCSV(purchases, "all"); if (n) { notify("Exported " + n + " purchases"); } else { notify("No purchases to export"); } }} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 500, color: "var(--ink3)", display: "flex", alignItems: "center", gap: 4 }}><I.Download /> Export All</button>
              </div>
            )}
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink2)", marginBottom: 8 }}>Purchases</div>
            {(!purchases || purchases.length === 0) ? (
              <div style={{ fontSize: 12, color: "var(--ink3)", padding: 20, textAlign: "center" }}>No purchases yet</div>
            ) : (
              <div>
                {purchases.map(function(p) {
                  var itemsText = (p.items || []).map(function(item) { return item.qty + "x " + item.name; }).join(", ");
                  var totalText = p.total != null ? p.total.toFixed(2) : "0.00";
                  return (
                    <div key={p.id} style={{ background: "var(--surface)", borderRadius: 12, border: "1px solid var(--border)", padding: "12px 16px", marginBottom: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>{p.employeeName || "You"}</div>
                          <div style={{ fontSize: 11, color: "var(--ink3)" }}>{itemsText}</div>
                          <div style={{ fontSize: 10, color: "var(--ink3)" }}>{p.submittedDate || ""}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontWeight: 600 }}>{"$"}{totalText}</div>
                          <div style={{ fontSize: 10, fontWeight: 600, color: p.status === "approved" ? "#15803D" : p.status === "declined" ? "#DC2626" : "#D97706" }}>{p.status}</div>
                        </div>
                      </div>
                      {(isManager || isAccounts) && p.status === "pending" && (
                        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                          <button onClick={() => handlePurchase(p.id, "approved", "payroll deduction")} style={{ padding: "5px 10px", borderRadius: 5, border: "none", background: "rgba(21,128,61,.1)", color: "#15803D", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Payroll</button>
                          <button onClick={() => handlePurchase(p.id, "approved", "paid cash")} style={{ padding: "5px 10px", borderRadius: 5, border: "none", background: "rgba(14,165,233,.1)", color: "#0EA5E9", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cash</button>
                          <button onClick={() => handlePurchase(p.id, "declined")} style={{ padding: "5px 10px", borderRadius: 5, border: "none", background: "rgba(220,38,38,.1)", color: "#DC2626", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Decline</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ──── MODALS ──── */}
      {modal && (
        <div style={overlaySt} onClick={() => setModal(null)}>
          <div style={modalSt} className="fade-up" onClick={e => e.stopPropagation()}>

            {/* Assign Shift */}
            {modal.type === "assignShift" && (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Assign Shift</h3>
                <p style={{ fontSize: 13, color: "var(--ink2)", marginBottom: 16 }}>{modal.empName} — {new Date(modal.day + "T00:00").toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {Object.entries(SHIFTS).map(([key, s]) => (
                    <button key={key} onClick={() => assignShift(modal.empId, modal.day, key)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", borderRadius: 8, border: `1.5px solid ${s.color}22`, background: s.bg, cursor: "pointer", fontFamily: "inherit", transition: "border-color .2s" }} onMouseEnter={e => e.currentTarget.style.borderColor = s.color} onMouseLeave={e => e.currentTarget.style.borderColor = `${s.color}22`}>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: s.color }}>{s.label}</div>
                        <div style={{ fontSize: 11, color: "var(--ink2)" }}>{s.time}</div>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{s.hours}h</div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* New Leave */}
            {modal.type === "newLeave" && <LeaveForm onSubmit={submitLeave} onCancel={() => setModal(null)} user={user} roster={roster} weekStart={weekStart} />}

            {/* New Swap */}
            {modal.type === "newSwap" && <SwapForm employees={employees} user={user} wk={wk} days={days} getShift={getShift} SHIFTS={SHIFTS} onSubmit={submitSwap} onCancel={() => setModal(null)} />}

            {/* Add Employee */}
            {modal.type === "addEmployee" && <AddEmployeeForm onSubmit={addEmployee} onCancel={() => setModal(null)} />}

            {/* View Photo */}
            {modal.type === "viewPhoto" && (
              <>
                <div style={{ textAlign: "center" }}>
                  <img src={modal.photo} alt="" style={{ width: 240, height: 240, borderRadius: 14, objectFit: "cover", border: "2px solid var(--border)", marginBottom: 12 }} />
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{modal.empName}</div>
                  <div style={{ fontSize: 12, color: "var(--ink2)" }}>{modal.label ? modal.label + " — " : ""}{modal.date} at {modal.time}</div>
                </div>
              </>
            )}

            {/* Edit Leave Balance */}
            {modal.type === "editLeaveBalance" && <EditLeaveBalanceForm emp={modal.emp} onSave={(empId, newBalances, empType, dpw) => {
              const updated = employees.map(e => e.id === empId ? { ...e, leaveBalance: newBalances, employmentType: empType, daysPerWeek: dpw } : e);
              setEmployees(updated);
              persist(STORE_KEYS.employees, updated);
              notify(`Leave balances updated for ${modal.emp.name}`);
              setModal(null);
            }} onCancel={() => setModal(null)} />}

            {/* Manage Shifts */}
            {modal.type === "manageShifts" && <ManageShiftsForm shifts={SHIFTS} onSave={(newShifts) => {
              setSHIFTS(newShifts);
              persist(STORE_KEYS.shifts, newShifts);
              notify("Shift types updated");
              setModal(null);
            }} onCancel={() => setModal(null)} />}

            {modal.type === "newPurchase" && <PurchaseForm products={products} onSubmit={submitPurchase} onCancel={() => setModal(null)} />}

            {modal.type === "manageProducts" && <ManageProductsForm products={products} onSave={(newProducts) => {
              saveProducts(newProducts);
              setModal(null);
            }} onCancel={() => setModal(null)} />}

            <button onClick={() => setModal(null)} style={{ marginTop: 12, width: "100%", padding: 9, borderRadius: 7, border: "1px solid var(--border)", background: "var(--surface2)", cursor: "pointer", fontFamily: "inherit", fontWeight: 500, fontSize: 12, color: "var(--ink2)" }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SKRoster() {
  return <ErrorBoundary><SKRosterInner /></ErrorBoundary>;
}

// ═════════════════════════════════════════════════════════════════════
// LOGIN SCREEN
// ═════════════════════════════════════════════════════════════════════
function LoginScreen({ employees, onLogin, onReset }) {
  const [search, setSearch] = useState("");
  const [showPin, setShowPin] = useState(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);

  const filtered = (search ? employees.filter(e => e.name.toLowerCase().includes(search.toLowerCase())) : employees).sort((a, b) => a.name.localeCompare(b.name));
  const managers = employees.filter(e => e.isManager);

  const tryLogin = (emp) => {
    if (locked) return;
    if (pin === emp.pin) { onLogin(emp); }
    else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 3) {
        setLocked(true);
        setError("Too many attempts. Locked for 60 seconds.");
        let remaining = 60;
        setLockTimer(remaining);
        const interval = setInterval(() => {
          remaining -= 1;
          setLockTimer(remaining);
          if (remaining <= 0) {
            clearInterval(interval);
            setLocked(false);
            setAttempts(0);
            setError("");
            setLockTimer(0);
          }
        }, 1000);
      } else {
        setError(`Incorrect PIN (${3 - newAttempts} attempts remaining)`);
        setTimeout(() => setError(""), 2000);
      }
      setPin("");
    }
  };

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", background: "#1A1714", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#F6F5F0" }}>
      <style>{CSS}</style>
      <div className="fade-up" style={{ width: "100%", maxWidth: 420, padding: 20 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "linear-gradient(135deg, #D97706, #B45309)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20, fontFamily: "'Fraunces', serif", color: "#fff", marginBottom: 12 }}>SK</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Fraunces', serif", marginBottom: 4 }}>SK Roster</h1>
          <p style={{ fontSize: 13, opacity: .5 }}>Sharma's Kitchen Roster System</p>
        </div>

        {!showPin ? (
          <>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search your name..." style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.06)", color: "#F6F5F0", fontSize: 14, fontFamily: "inherit", marginBottom: 12, outline: "none" }} />
            <div style={{ maxHeight: 340, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
              {filtered.map(emp => (
                <button key={emp.id} onClick={() => { setShowPin(emp); setPin(""); }} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "11px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,.06)", background: "rgba(255,255,255,.03)", cursor: "pointer", fontFamily: "inherit", color: "#F6F5F0", textAlign: "left", transition: "background .2s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.08)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.03)"}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: `hsl(${parseInt(emp.id.split("-")[1]) * 43 % 360}, 30%, 30%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600 }}>{emp.initials}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{emp.name}</div>
                    <div style={{ fontSize: 11, opacity: .4 }}>{emp.role} · {emp.dept}</div>
                  </div>
                  {emp.isOwner && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 3, background: "rgba(220,38,38,.2)", color: "#F87171", fontWeight: 600 }}>OWNER</span>}
                  {emp.isManager && !emp.isOwner && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 3, background: "rgba(217,119,6,.2)", color: "#FBBF24", fontWeight: 600 }}>MGR</span>}
                  {emp.isAccounts && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 3, background: "rgba(29,78,216,.2)", color: "#60A5FA", fontWeight: 600 }}>ACC</span>}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.06)" }}>
              <div style={{ fontSize: 11, opacity: .5, lineHeight: 1.6 }}>
                Forgotten your PIN? Contact Tanisha or your manager.
              </div>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `hsl(${parseInt(showPin.id.split("-")[1]) * 43 % 360}, 30%, 30%)`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 600, marginBottom: 12 }}>{showPin.initials}</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 2 }}>{showPin.name}</div>
            <div style={{ fontSize: 12, opacity: .5, marginBottom: 20 }}>{showPin.role}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginBottom: 12 }}>
              <I.Lock />
              <input value={pin} onChange={e => !locked && setPin(e.target.value)} onKeyDown={e => e.key === "Enter" && tryLogin(showPin)} type="password" maxLength={20} placeholder={locked ? "Locked" : "Enter PIN"} disabled={locked} style={{ width: 160, padding: "10px 14px", borderRadius: 8, border: locked ? "1px solid rgba(239,68,68,.3)" : "1px solid rgba(255,255,255,.12)", background: locked ? "rgba(239,68,68,.08)" : "rgba(255,255,255,.06)", color: "#F6F5F0", fontSize: 16, fontFamily: "monospace", textAlign: "center", outline: "none", letterSpacing: 2, opacity: locked ? .5 : 1 }} autoFocus />
            </div>
            {error && <div style={{ color: "#EF4444", fontSize: 12, marginBottom: 8 }}>{error}{locked && lockTimer > 0 ? ` (${lockTimer}s)` : ""}</div>}
            <button onClick={() => tryLogin(showPin)} disabled={locked} style={{ padding: "10px 28px", borderRadius: 8, border: "none", background: locked ? "rgba(255,255,255,.1)" : "linear-gradient(135deg, #D97706, #B45309)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: locked ? "not-allowed" : "pointer", fontFamily: "inherit", marginBottom: 12, opacity: locked ? .4 : 1 }}>Sign In</button>
            <br />
            <button onClick={() => { setShowPin(null); setPin(""); setAttempts(0); setError(""); }} style={{ fontSize: 12, color: "rgba(246,245,240,.4)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>← Back</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// LEAVE FORM
// ═════════════════════════════════════════════════════════════════════
function LeaveForm({ onSubmit, onCancel, user, roster, weekStart }) {
  const [type, setType] = useState(LEAVE_TYPES[0]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  // Date restrictions based on leave type
  const isSick = type === "Personal/Sick Leave";
  const today = new Date();
  const todayStr = fmtDate(today, "iso");

  let minStart, maxStart, dateHint;
  if (isSick) {
    // Sick leave: any date from today, but warn on short notice
    minStart = todayStr;
    maxStart = undefined;
    dateHint = null;
  } else if (type === "Unpaid Leave") {
    minStart = todayStr;
    maxStart = undefined;
    dateHint = null;
  } else {
    // Annual & Personal: 14 days notice
    const twoWeeks = new Date(today);
    twoWeeks.setDate(twoWeeks.getDate() + 14);
    minStart = fmtDate(twoWeeks, "iso");
    maxStart = undefined;
    dateHint = "Minimum 2 weeks notice required";
  }

  // Check if selected sick leave date falls on a rostered shift
  const isRosteredSickDay = (() => {
    if (!isSick || !startDate) return false;
    if (!user || !roster) return false;
    const selectedDate = new Date(startDate + "T00:00:00");
    const wkStart = getWeekStart(selectedDate);
    const wk = weekKey(wkStart);
    const dayKey = fmtDate(selectedDate, "iso");
    const rosterWeek = roster[wk];
    if (!rosterWeek) return false;
    const shift = rosterWeek[user.id]?.[dayKey];
    return !!shift;
  })();

  // Check if annual/personal leave dates violate 14-day rule
  const isDateTooSoon = (() => {
    if (isSick || type === "Unpaid Leave") return false;
    if (!startDate) return false;
    const twoWeeks = new Date(today);
    twoWeeks.setDate(twoWeeks.getDate() + 14);
    const twoWeeksStr = fmtDate(twoWeeks, "iso");
    return startDate < twoWeeksStr;
  })();

  // Reset dates when type changes if they fall outside new range
  const handleTypeChange = (newType) => {
    setType(newType);
    setStartDate("");
    setEndDate("");
  };

  const canSubmit = startDate && endDate && !isDateTooSoon && !isRosteredSickDay;

  return (
    <>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Request Leave</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <label style={labelSt}>Leave Type</label>
          <select value={type} onChange={e => handleTypeChange(e.target.value)} style={inputSt}>{LEAVE_TYPES.map(t => <option key={t}>{t}</option>)}</select>
        </div>
        {dateHint && <div style={{ fontSize: 11, color: isSick ? "var(--blue)" : "var(--accent)", padding: "6px 10px", borderRadius: 6, background: isSick ? "var(--blue-bg)" : "var(--accent-bg)" }}>{dateHint}</div>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div><label style={labelSt}>Start Date</label><input type="date" value={startDate} min={minStart} max={maxStart} onChange={e => setStartDate(e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>End Date</label><input type="date" value={endDate} min={startDate || minStart} onChange={e => setEndDate(e.target.value)} style={inputSt} /></div>
        </div>
        {isDateTooSoon && <div style={{ fontSize: 11, color: "#DC2626", padding: "8px 10px", borderRadius: 6, background: "rgba(220,38,38,.08)", border: "1px solid rgba(220,38,38,.15)", lineHeight: 1.5 }}>🚫 {type} requires a minimum of 2 weeks notice. Please select a date at least 14 days from today.</div>}
        {isRosteredSickDay && <div style={{ fontSize: 11, color: "#DC2626", padding: "8px 10px", borderRadius: 6, background: "rgba(220,38,38,.08)", border: "1px solid rgba(220,38,38,.15)", lineHeight: 1.5 }}>🚫 You cannot apply for sick leave on a day you are rostered to work. Please contact your manager directly if you are unwell today.</div>}
        <div><label style={labelSt}>{isSick ? "Reason (attach medical certificate by email)" : "Reason"}</label><input value={reason} onChange={e => setReason(e.target.value)} placeholder={isSick ? "e.g. Unwell — certificate to follow" : "Brief reason..."} style={inputSt} /></div>
        <button onClick={() => { if (canSubmit) onSubmit({ type, startDate, endDate, reason }); }} disabled={!canSubmit} style={{ ...btnPrimary, width: "100%", justifyContent: "center", opacity: !canSubmit ? .5 : 1 }}>Submit Request</button>
      </div>
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════
// EDIT LEAVE BALANCE FORM
// ═════════════════════════════════════════════════════════════════════
function EditLeaveBalanceForm({ emp, onSave, onCancel }) {
  const [annual, setAnnual] = useState(emp.leaveBalance.annual);
  const [personal, setPersonal] = useState(emp.leaveBalance.personal || 0);
  const [employmentType, setEmploymentType] = useState(emp.employmentType || "full-time");
  const [daysPerWeek, setDaysPerWeek] = useState(emp.daysPerWeek || 5);

  const numInput = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--ink)", fontSize: 14, fontFamily: "inherit", outline: "none", textAlign: "center" };

  return (
    <>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Edit Leave Balances</h3>
      <div style={{ fontSize: 13, color: "var(--ink2)", marginBottom: 14 }}>{emp.name}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <label style={labelSt}>Employment Type</label>
          <select value={employmentType} onChange={e => setEmploymentType(e.target.value)} style={{ ...numInput, textAlign: "left" }}>
            <option value="full-time">Full-time (accrues 1.67 AL / 0.83 PL per month)</option>
            <option value="part-time">Part-time (pro-rata accrual based on days per week)</option>
            <option value="casual">Casual (no leave accrual)</option>
          </select>
        </div>
        {employmentType === "part-time" && (
          <div>
            <label style={labelSt}>Days per week</label>
            <select value={daysPerWeek} onChange={e => setDaysPerWeek(parseInt(e.target.value))} style={numInput}>
              <option value={1}>1 day (20% of full-time)</option>
              <option value={2}>2 days (40% of full-time)</option>
              <option value={3}>3 days (60% of full-time)</option>
              <option value={4}>4 days (80% of full-time)</option>
            </select>
          </div>
        )}
        {employmentType === "casual" && (
          <div style={{ fontSize: 11, color: "var(--ink3)", padding: "6px 10px", borderRadius: 6, background: "var(--surface2)" }}>Casual employees do not accrue leave. Leave loading is included in their hourly rate.</div>
        )}
        <div>
          <label style={labelSt}>Annual Leave (days)</label>
          <input type="number" min={0} max={999} step={0.01} value={annual} onChange={e => setAnnual(Math.max(0, parseFloat(e.target.value) || 0))} style={numInput} />
        </div>
        <div>
          <label style={labelSt}>Personal/Sick Leave (days)</label>
          <input type="number" min={0} max={999} step={0.01} value={personal} onChange={e => setPersonal(Math.max(0, parseFloat(e.target.value) || 0))} style={numInput} />
        </div>
        <button onClick={() => onSave(emp.id, { annual, personal }, employmentType, daysPerWeek)} style={{ ...btnPrimary, width: "100%", justifyContent: "center" }}>Save Balances</button>
      </div>
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════
// MANAGE SHIFTS FORM (Owner only)
// ═════════════════════════════════════════════════════════════════════
const SHIFT_COLORS = [
  { color: "#C2410C", bg: "#FFF7ED", dot: "#EA580C", name: "Orange" },
  { color: "#B45309", bg: "#FFFBEB", dot: "#D97706", name: "Amber" },
  { color: "#0E7490", bg: "#ECFEFF", dot: "#06B6D4", name: "Cyan" },
  { color: "#7E22CE", bg: "#FAF5FF", dot: "#A855F7", name: "Purple" },
  { color: "#047857", bg: "#ECFDF5", dot: "#10B981", name: "Green" },
  { color: "#1D4ED8", bg: "#EFF6FF", dot: "#3B82F6", name: "Blue" },
  { color: "#4338CA", bg: "#EEF2FF", dot: "#6366F1", name: "Indigo" },
  { color: "#BE123C", bg: "#FFF1F2", dot: "#F43F5E", name: "Rose" },
  { color: "#0F766E", bg: "#F0FDFA", dot: "#14B8A6", name: "Teal" },
  { color: "#A16207", bg: "#FEFCE8", dot: "#EAB308", name: "Yellow" },
];

function ManageShiftsForm({ shifts, onSave, onCancel }) {
  const [localShifts, setLocalShifts] = useState({ ...shifts });
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newHours, setNewHours] = useState(8.5);
  const [newColorIdx, setNewColorIdx] = useState(0);
  const [editingKey, setEditingKey] = useState(null);
  const [editLabel, setEditLabel] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editHours, setEditHours] = useState(8.5);

  const addShift = () => {
    if (!newLabel.trim() || !newTime.trim()) return;
    const key = newLabel.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const c = SHIFT_COLORS[newColorIdx % SHIFT_COLORS.length];
    setLocalShifts({ ...localShifts, [key]: { label: newLabel.trim(), time: newTime.trim(), hours: newHours, color: c.color, bg: c.bg, dot: c.dot } });
    setNewLabel(""); setNewTime(""); setNewHours(8.5); setAdding(false);
  };

  const deleteShift = (key) => {
    const updated = { ...localShifts };
    delete updated[key];
    setLocalShifts(updated);
  };

  const saveEdit = (key) => {
    setLocalShifts({ ...localShifts, [key]: { ...localShifts[key], label: editLabel, time: editTime, hours: editHours } });
    setEditingKey(null);
  };

  const inp = { width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--ink)", fontSize: 12, fontFamily: "inherit", outline: "none" };

  return (
    <>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Manage Shift Types</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 400, overflowY: "auto", marginBottom: 12 }}>
        {Object.entries(localShifts).map(([key, s]) => (
          <div key={key} style={{ padding: "10px 12px", borderRadius: 8, border: `1px solid ${s.color}22`, background: s.bg }}>
            {editingKey === key ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <input value={editLabel} onChange={e => setEditLabel(e.target.value)} placeholder="Shift name" style={inp} />
                <input value={editTime} onChange={e => setEditTime(e.target.value)} placeholder="e.g. 9:00 AM – 5:30 PM" style={inp} />
                <input type="number" step={0.5} min={1} max={16} value={editHours} onChange={e => setEditHours(parseFloat(e.target.value) || 8)} style={inp} />
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => saveEdit(key)} style={{ flex: 1, padding: "6px", borderRadius: 5, border: "none", background: s.color, color: "#fff", fontSize: 11, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>Save</button>
                  <button onClick={() => setEditingKey(null)} style={{ flex: 1, padding: "6px", borderRadius: 5, border: "1px solid var(--border)", background: "var(--surface)", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: s.color }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: "var(--ink2)" }}>{s.time} · {s.hours}hrs</div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => { setEditingKey(key); setEditLabel(s.label); setEditTime(s.time); setEditHours(s.hours); }} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontFamily: "inherit" }}>Edit</button>
                  <button onClick={() => deleteShift(key)} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, border: "1px solid rgba(220,38,38,.2)", background: "rgba(220,38,38,.05)", color: "#DC2626", cursor: "pointer", fontFamily: "inherit" }}>Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {adding ? (
        <div style={{ padding: 12, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface2)", display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Shift name (e.g. Night Shift)" style={inp} />
          <input value={newTime} onChange={e => setNewTime(e.target.value)} placeholder="Time (e.g. 10:00 PM – 6:30 AM)" style={inp} />
          <div style={{ display: "flex", gap: 8 }}>
            <input type="number" step={0.5} min={1} max={16} value={newHours} onChange={e => setNewHours(parseFloat(e.target.value) || 8)} placeholder="Hours" style={{ ...inp, flex: 1 }} />
            <select value={newColorIdx} onChange={e => setNewColorIdx(parseInt(e.target.value))} style={{ ...inp, flex: 1 }}>
              {SHIFT_COLORS.map((c, i) => <option key={i} value={i}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={addShift} style={{ flex: 1, padding: "8px", borderRadius: 6, border: "none", background: "var(--accent)", color: "#fff", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>Add Shift</button>
            <button onClick={() => setAdding(false)} style={{ flex: 1, padding: "8px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{ width: "100%", padding: "8px", borderRadius: 6, border: "1.5px dashed var(--border2)", background: "transparent", fontSize: 12, cursor: "pointer", fontFamily: "inherit", color: "var(--ink2)", marginBottom: 12 }}>+ Add New Shift Type</button>
      )}
      <button onClick={() => onSave(localShifts)} style={{ ...btnPrimary, width: "100%", justifyContent: "center" }}>Save All Changes</button>
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════
// SWAP FORM
// ═════════════════════════════════════════════════════════════════════
function SwapForm({ employees, user, wk, days, getShift, SHIFTS, onSubmit, onCancel }) {
  const [targetId, setTargetId] = useState("");
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");

  const others = employees.filter(e => e.id !== user.id).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Request Shift Swap</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <label style={labelSt}>Swap with</label>
          <select value={targetId} onChange={e => setTargetId(e.target.value)} style={inputSt}>
            <option value="">Select colleague...</option>
            {others.map(e => <option key={e.id} value={e.id}>{e.name} ({e.role})</option>)}
          </select>
        </div>
        <div>
          <label style={labelSt}>Date</label>
          <select value={date} onChange={e => setDate(e.target.value)} style={inputSt}>
            <option value="">Select day...</option>
            {days.map(d => {
              const iso = fmtDate(d, "iso");
              const myShift = getShift(user.id, iso);
              return <option key={iso} value={iso}>{fmtDate(d, "full")} {myShift ? `(${SHIFTS[myShift]?.label})` : "(Day off)"}</option>;
            })}
          </select>
        </div>
        <div><label style={labelSt}>Reason</label><input value={reason} onChange={e => setReason(e.target.value)} placeholder="Why do you need to swap?" style={inputSt} /></div>
        <button onClick={() => { if (targetId && date) onSubmit({ targetId, targetName: others.find(e => e.id === targetId)?.name, date, reason, weekKey: wk }); }} disabled={!targetId || !date} style={{ ...btnPrimary, width: "100%", justifyContent: "center", opacity: (!targetId || !date) ? .5 : 1 }}>Submit Swap Request</button>
      </div>
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════
// PURCHASE FORM
// ═════════════════════════════════════════════════════════════════════
function PurchaseForm({ products, onSubmit, onCancel }) {
  const [cart, setCart] = useState({});
  const safeProducts = Array.isArray(products) ? products : [];

  const updateQty = (prodId, delta) => {
    setCart(prev => {
      const next = { ...prev };
      const qty = (next[prodId] || 0) + delta;
      if (qty <= 0) { delete next[prodId]; } else { next[prodId] = qty; }
      return next;
    });
  };

  const items = Object.entries(cart).map(([prodId, qty]) => {
    const prod = safeProducts.find(p => p.id === prodId);
    return prod ? { id: prodId, name: prod.name, price: prod.price, qty } : null;
  }).filter(Boolean);

  const total = items.reduce((sum, i) => sum + (i.price * i.qty), 0);

  return (
    <>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>New Purchase Request</h3>
      <div style={{ maxHeight: 360, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
        {safeProducts.map(p => {
          const qty = cart[p.id] || 0;
          return (
            <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 8, background: qty > 0 ? "var(--accent-bg)" : "var(--surface2)", border: qty > 0 ? "1px solid var(--accent)" : "1px solid var(--border)", transition: "all .2s" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: "var(--ink3)" }}>{"$"}{p.price.toFixed(2)}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {qty > 0 && (
                  <button onClick={() => updateQty(p.id, -1)} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit", color: "var(--ink2)" }}>-</button>
                )}
                {qty > 0 && <span style={{ fontSize: 14, fontWeight: 600, minWidth: 20, textAlign: "center" }}>{qty}</span>}
                <button onClick={() => updateQty(p.id, 1)} style={{ width: 28, height: 28, borderRadius: 6, border: "none", background: "var(--accent)", color: "#fff", cursor: "pointer", fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>+</button>
              </div>
            </div>
          );
        })}
      </div>
      {items.length > 0 && (
        <div style={{ padding: "12px 14px", borderRadius: 8, background: "var(--surface2)", border: "1px solid var(--border)", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--ink2)" }}>{items.reduce((s, i) => s + i.qty, 0)} items</span>
            <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Fraunces', serif", color: "var(--accent)" }}>{"$"}{total.toFixed(2)}</span>
          </div>
        </div>
      )}
      <button onClick={() => { if (items.length > 0) onSubmit({ items, total }); }} disabled={items.length === 0} style={{ ...btnPrimary, width: "100%", justifyContent: "center", opacity: items.length === 0 ? .5 : 1 }}>Submit Purchase Request</button>
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════
// MANAGE PRODUCTS FORM (Owner only)
// ═════════════════════════════════════════════════════════════════════
function ManageProductsForm({ products, onSave, onCancel }) {
  const [list, setList] = useState([...products]);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");

  const addProduct = () => {
    if (!newName.trim() || !newPrice) return;
    const id = `prod-${Date.now()}`;
    setList([...list, { id, name: newName.trim(), price: parseFloat(newPrice) }]);
    setNewName("");
    setNewPrice("");
  };

  const removeProduct = (id) => {
    setList(list.filter(p => p.id !== id));
  };

  const updatePrice = (id, price) => {
    setList(list.map(p => p.id === id ? { ...p, price: parseFloat(price) || 0 } : p));
  };

  const updateName = (id, name) => {
    setList(list.map(p => p.id === id ? { ...p, name } : p));
  };

  return (
    <>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Manage Products</h3>
      <div style={{ maxHeight: 320, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
        {list.map(p => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 7, background: "var(--surface2)", border: "1px solid var(--border)" }}>
            <input value={p.name} onChange={e => updateName(p.id, e.target.value)} style={{ flex: 2, padding: "6px 8px", borderRadius: 5, border: "1px solid var(--border)", fontSize: 12, fontFamily: "inherit", background: "var(--surface)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
              <span style={{ fontSize: 12, color: "var(--ink3)" }}>$</span>
              <input type="number" step="0.01" value={p.price} onChange={e => updatePrice(p.id, e.target.value)} style={{ width: 70, padding: "6px 8px", borderRadius: 5, border: "1px solid var(--border)", fontSize: 12, fontFamily: "inherit", background: "var(--surface)" }} />
            </div>
            <button onClick={() => removeProduct(p.id)} style={{ width: 26, height: 26, borderRadius: 5, border: "none", background: "rgba(220,38,38,.08)", color: "#DC2626", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>×</button>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Product name" style={{ flex: 2, padding: "8px 10px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 12, fontFamily: "inherit" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
          <span style={{ fontSize: 12, color: "var(--ink3)" }}>$</span>
          <input type="number" step="0.01" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="0.00" style={{ width: 70, padding: "8px 10px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 12, fontFamily: "inherit" }} />
        </div>
        <button onClick={addProduct} disabled={!newName.trim() || !newPrice} style={{ padding: "8px 14px", borderRadius: 6, border: "none", background: "var(--accent)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", opacity: (!newName.trim() || !newPrice) ? .5 : 1 }}>Add</button>
      </div>
      <button onClick={() => onSave(list)} style={{ ...btnPrimary, width: "100%", justifyContent: "center" }}>Save Products</button>
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════
// CLOCK SCREEN WITH CAMERA
// ═════════════════════════════════════════════════════════════════════
function ClockScreen({ user, geoStatus, geoDistance, GEOFENCE_RADIUS, getEmployeeSite, checkLocationAndClock, completeClock, pendingClock, timelog, fmtDate }) {
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [photoZoom, setPhotoZoom] = useState(null);

  // When GPS passes and pendingClock is set, auto-open camera
  React.useEffect(() => {
    if (pendingClock && !cameraActive && !capturedPhoto) {
      openCamera();
    }
  }, [pendingClock]);

  const streamRef = React.useRef(null);

  const openCamera = async () => {
    setCapturedPhoto(null);
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("Camera not supported on this browser. Try Chrome or Safari.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 480 }, height: { ideal: 480 } },
        audio: false
      });
      streamRef.current = stream;
      setCameraActive(true);
    } catch (err) {
      console.error("Camera error:", err);
      if (err.name === "NotAllowedError") {
        setCameraError("Camera permission denied. On iPhone: Settings → Safari → Camera → Allow. On Android: tap the lock icon in address bar → Permissions → Camera → Allow. Then refresh.");
      } else if (err.name === "NotFoundError") {
        setCameraError("No camera found on this device.");
      } else if (err.name === "NotReadableError") {
        setCameraError("Camera is in use by another app. Close other apps and try again.");
      } else {
        setCameraError("Camera error: " + err.message);
      }
      setCameraActive(false);
    }
  };

  // Attach stream to video element after it renders
  React.useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.setAttribute("playsinline", "true");
      videoRef.current.setAttribute("webkit-playsinline", "true");
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play().catch(() => {});
      };
    }
  }, [cameraActive]);

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = 240;
    canvas.height = 240;
    const ctx = canvas.getContext("2d");
    // Draw video frame cropped to square
    const v = videoRef.current;
    const size = Math.min(v.videoWidth, v.videoHeight);
    const sx = (v.videoWidth - size) / 2;
    const sy = (v.videoHeight - size) / 2;
    ctx.drawImage(v, sx, sy, size, size, 0, 0, 240, 240);
    // Compress to small JPEG
    const dataUrl = canvas.toDataURL("image/jpeg", 0.5);
    setCapturedPhoto(dataUrl);
    stopCamera();
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const retake = () => {
    setCapturedPhoto(null);
    openCamera();
  };

  // Cleanup on unmount
  React.useEffect(() => { return () => stopCamera(); }, []);

  const site = getEmployeeSite(user.name);

  return (
    <div className="fade-up" style={{ maxWidth: 440 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, fontFamily: "'Fraunces', serif", marginBottom: 16 }}>Clock In / Out</h2>
      <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", padding: 28, textAlign: "center" }}>
        <div style={{ fontSize: 40, fontWeight: 700, fontFamily: "'Fraunces', serif", marginBottom: 4 }}>
          {new Date().toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}
        </div>
        <div style={{ fontSize: 13, color: "var(--ink2)", marginBottom: 16 }}>{fmtDate(new Date(), "full")}</div>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: user.clockedIn ? "var(--green)" : "var(--ink3)", margin: "0 auto 8px" }} />
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 16 }}>
          {user.clockedIn ? `Clocked in since ${user.clockInTime}` : "Not clocked in"}
        </div>

        {/* Geo status messages */}
        {geoStatus === "checking" && (
          <div style={{ padding: "10px 16px", borderRadius: 8, background: "var(--accent-bg)", marginBottom: 14, fontSize: 13, color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <div style={{ width: 14, height: 14, border: "2px solid var(--accent)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
            Checking your location...
          </div>
        )}
        {geoStatus === "too_far" && (
          <div style={{ padding: "10px 16px", borderRadius: 8, background: "var(--red-bg)", marginBottom: 14, fontSize: 12, color: "var(--red)", lineHeight: 1.5 }}>
            <strong>Too far from {site.name}</strong> — you are {geoDistance}m away. Must be within {GEOFENCE_RADIUS}m.
          </div>
        )}
        {geoStatus === "denied" && (
          <div style={{ padding: "10px 16px", borderRadius: 8, background: "var(--red-bg)", marginBottom: 14, fontSize: 12, color: "var(--red)", lineHeight: 1.5 }}>
            <strong>Location access denied</strong> — please enable location permissions.
          </div>
        )}
        {geoStatus === "success" && !cameraActive && !capturedPhoto && (
          <div style={{ padding: "10px 16px", borderRadius: 8, background: "var(--green-bg)", marginBottom: 14, fontSize: 12, color: "var(--green)" }}>
            ✓ Location verified ({geoDistance}m from {site.name}) — now take a selfie to confirm
          </div>
        )}

        {/* Camera view */}
        {cameraActive && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ position: "relative", width: 200, height: 200, margin: "0 auto", borderRadius: 14, overflow: "hidden", border: "3px solid var(--accent)", background: "#000" }}>
              <video ref={videoRef} autoPlay playsInline webkit-playsinline="true" muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", background: "#000" }} />
            </div>
            <div style={{ fontSize: 11, color: "var(--ink2)", marginTop: 8, marginBottom: 10 }}>📸 Position your face in the frame</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button onClick={takePhoto} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Take Photo</button>
              <button onClick={() => { stopCamera(); }} style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface2)", fontSize: 13, cursor: "pointer", fontFamily: "inherit", color: "var(--ink2)" }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Photo preview + confirm */}
        {capturedPhoto && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ width: 160, height: 160, margin: "0 auto", borderRadius: 14, overflow: "hidden", border: "3px solid var(--green)" }}>
              <img src={capturedPhoto} alt="Clock photo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ fontSize: 11, color: "var(--green)", marginTop: 8, fontWeight: 500 }}>✓ Photo captured</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 10 }}>
              <button onClick={async () => { await completeClock(capturedPhoto); setCapturedPhoto(null); }} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: pendingClock?.action === "in" ? "var(--green)" : "var(--red)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                Confirm Clock {pendingClock?.action === "in" ? "In" : "Out"}
              </button>
              <button onClick={retake} style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface2)", fontSize: 13, cursor: "pointer", fontFamily: "inherit", color: "var(--ink2)" }}>Retake</button>
            </div>
          </div>
        )}

        {cameraError && (
          <div style={{ padding: "10px 16px", borderRadius: 8, background: "var(--red-bg)", marginBottom: 14, fontSize: 12, color: "var(--red)" }}>{cameraError}</div>
        )}

        {/* Main clock button — only show when camera not active */}
        {!cameraActive && !capturedPhoto && (
          <button
            onClick={() => checkLocationAndClock(user.clockedIn ? "out" : "in")}
            disabled={geoStatus === "checking"}
            style={{ padding: "12px 32px", borderRadius: 10, border: "none", background: geoStatus === "checking" ? "var(--ink3)" : user.clockedIn ? "var(--red)" : "var(--green)", color: "#fff", fontSize: 15, fontWeight: 600, cursor: geoStatus === "checking" ? "wait" : "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 8, opacity: geoStatus === "checking" ? .7 : 1 }}
          >
            {user.clockedIn ? <><I.LogOut /> Clock Out</> : <><I.LogIn /> Clock In</>}
          </button>
        )}

        <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 8, background: "var(--surface2)", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 10, color: "var(--ink3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            GPS + Photo verification · {GEOFENCE_RADIUS}m radius · {site.address}
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Recent entries */}
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Recent entries</div>
        {timelog.filter(t => t.empId === user.id).slice(-5).reverse().map(t => (
          <div key={t.id} style={{ background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: "10px 14px", marginBottom: 6, fontSize: 13 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div>{t.date} · {t.clockIn} → {t.clockOut || "..."}</div>
                {t.location && <div style={{ fontSize: 10, color: "var(--ink3)", marginTop: 2 }}>📍 {t.location.distance}m from {t.location.site || "factory"}</div>}
              </div>
              {t.photo && <img src={t.photo} alt="" onClick={() => setPhotoZoom(t.photo)} style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover", cursor: "pointer", border: "1px solid var(--border)" }} />}
            </div>
          </div>
        ))}
        {timelog.filter(t => t.empId === user.id).length === 0 && <div style={{ fontSize: 12, color: "var(--ink3)" }}>No entries yet</div>}
      </div>

      {/* Photo zoom modal */}
      {photoZoom && (
        <div onClick={() => setPhotoZoom(null)} style={{ position: "fixed", inset: 0, background: "rgba(26,23,20,.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, cursor: "pointer" }}>
          <img src={photoZoom} alt="" style={{ width: 280, height: 280, borderRadius: 16, objectFit: "cover", boxShadow: "0 20px 50px rgba(0,0,0,.3)" }} />
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// ADD EMPLOYEE FORM
// ═════════════════════════════════════════════════════════════════════
function AddEmployeeForm({ onSubmit, onCancel }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("Process Worker");
  const [hourlyRate, setHourlyRate] = useState("26");
  const [startDate, setStartDate] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const canSubmit = firstName.trim() && lastName.trim() && hourlyRate;

  return (
    <>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Add New Employee</h3>
      <p style={{ fontSize: 12, color: "var(--ink2)", marginBottom: 14 }}>A PIN will be automatically generated</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div><label style={labelSt}>First Name *</label><input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="e.g. Rahul" style={inputSt} /></div>
          <div><label style={labelSt}>Last Name *</label><input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="e.g. Singh" style={inputSt} /></div>
        </div>
        <div>
          <label style={labelSt}>Role / Position</label>
          <select value={role} onChange={e => setRole(e.target.value)} style={inputSt}>
            <option>Process Worker</option>
            <option>Production Supervisor</option>
            <option>Accounts Manager</option>
            <option>Sales Representative</option>
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div><label style={labelSt}>Hourly Rate ($) *</label><input type="number" step="0.01" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>Start Date</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputSt} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div><label style={labelSt}>Phone</label><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="04xx xxx xxx" style={inputSt} /></div>
          <div><label style={labelSt}>Email</label><input value={email} onChange={e => setEmail(e.target.value)} placeholder="name@email.com" style={inputSt} /></div>
        </div>
        <button onClick={() => { if (canSubmit) onSubmit({ firstName: firstName.trim(), lastName: lastName.trim(), role, hourlyRate, startDate, phone, email }); }} disabled={!canSubmit} style={{ ...btnPrimary, width: "100%", justifyContent: "center", opacity: canSubmit ? 1 : .5 }}>Add Employee</button>
      </div>
    </>
  );
}

// ─── SHARED STYLES ───────────────────────────────────────────────────
const btnIcon = { width: 30, height: 30, borderRadius: 7, border: "1px solid var(--border)", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 };
const selectSt = { padding: "6px 10px", borderRadius: 7, border: "1px solid var(--border)", fontSize: 12, fontFamily: "'Outfit', sans-serif", background: "var(--surface)" };
const btnPrimary = { padding: "8px 16px", borderRadius: 7, border: "none", background: "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit', sans-serif", display: "inline-flex", alignItems: "center", gap: 6 };
const btnSmall = { width: 28, height: 28, borderRadius: 6, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" };
const overlaySt = { position: "fixed", inset: 0, background: "rgba(26,23,20,.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 };
const modalSt = { background: "var(--surface)", borderRadius: 16, padding: 24, maxWidth: 400, width: "92%", boxShadow: "0 20px 50px rgba(0,0,0,.2)" };
const labelSt = { display: "block", fontSize: 11, fontWeight: 600, color: "var(--ink2)", marginBottom: 4, textTransform: "uppercase", letterSpacing: .5 };
const inputSt = { width: "100%", padding: "9px 12px", borderRadius: 7, border: "1px solid var(--border)", fontSize: 13, fontFamily: "'Outfit', sans-serif", background: "var(--surface2)" };
const tagSt = (c) => ({ padding: "2px 7px", borderRadius: 4, fontSize: 10, fontWeight: 600, background: `${c}15`, color: c });
