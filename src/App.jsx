import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { fbLoad, fbSave, fbListen } from "./firebase-storage";

// ─── COMPANY LOGO ─────────────────────────────────────────────────

// ─── CONFIG: YOUR EXACT SHIFT PATTERNS ─────────────────────────────
const SHIFTS = {
  "early-prod":    { label: "Early Production", time: "5:00 AM – 1:30 PM",  hours: 8.5, color: "#C2410C", bg: "#FFF7ED", dot: "#EA580C" },
  "morning-std":   { label: "Morning",          time: "6:00 AM – 2:30 PM",  hours: 8.5, color: "#B45309", bg: "#FFFBEB", dot: "#D97706" },
  "morning-proc":  { label: "Morning Process",  time: "7:00 AM – 3:30 PM",  hours: 8.5, color: "#0E7490", bg: "#ECFEFF", dot: "#06B6D4" },
  "morning-late":  { label: "Morning Late",     time: "7:30 AM – 4:00 PM",  hours: 8.5, color: "#7E22CE", bg: "#FAF5FF", dot: "#A855F7" },
  "arvo-std":      { label: "Afternoon",        time: "3:30 PM – 12:00 AM", hours: 8.5, color: "#1D4ED8", bg: "#EFF6FF", dot: "#3B82F6" },
  "arvo-proc":     { label: "Afternoon Process", time: "5:00 PM – 1:30 AM", hours: 8.5, color: "#4338CA", bg: "#EEF2FF", dot: "#6366F1" },
};

const DEPARTMENTS = ["Production", "Accounts", "Sales"];
const LEAVE_TYPES = ["Annual Leave", "Sick Leave", "Personal Leave", "Parental Leave", "Workers Comp", "Unpaid Leave"];

// ─── SEED DATA ──────────────────────────────────────────────────────
const SEED_EMPLOYEES = [
  // Management / Salaried
  { name: "Raj Krishna", role: "Accounts Manager", dept: "Accounts", rate: 64.90 },
  { name: "Gopi Dhamija", role: "Production Supervisor", dept: "Production", rate: 40.87 },
  { name: "Prateek Kumar", role: "Production Supervisor", dept: "Production", rate: 37.30 },
  { name: "Prabhkeerat Singh", role: "Sales Representative", dept: "Sales", rate: 32.96 },
  { name: "Mohit Sivia", role: "Sales Representative", dept: "Sales", rate: 48.08 },
  // Process Workers
  { name: "Bushar Ahmed", role: "Process Worker", dept: "Production", rate: 29.50 },
  { name: "Sandesh Adhikari", role: "Process Worker", dept: "Production", rate: 26.00 },
  { name: "Siddhant Amritkar", role: "Process Worker", dept: "Production", rate: 29.00 },
  { name: "Anannya Rehman Amiya", role: "Process Worker", dept: "Production", rate: 26.00 },
  { name: "Majid Ali", role: "Process Worker", dept: "Production", rate: 29.00 },
  { name: "Tikaram Badari Sharma", role: "Process Worker", dept: "Production", rate: 32.00 },
  { name: "Kumaramanjunath Baleattiguppe Sadashivappa", role: "Process Worker", dept: "Production", rate: 26.00 },
  { name: "Razia Bibi", role: "Process Worker", dept: "Production", rate: 29.50 },
  { name: "Marites Cabaltera", role: "Process Worker", dept: "Production", rate: 29.50 },
  { name: "Chetna Chetna", role: "Process Worker", dept: "Production", rate: 26.00 },
  { name: "Anita Dangi", role: "Process Worker", dept: "Production", rate: 34.00 },
  { name: "Eldefer Dequino", role: "Process Worker", dept: "Production", rate: 34.00 },
  { name: "Tanjilalam Emon", role: "Process Worker", dept: "Production", rate: 32.00 },
  { name: "Louie Fortes", role: "Process Worker", dept: "Production", rate: 31.50 },
  { name: "Jahid Hasan", role: "Process Worker", dept: "Production", rate: 32.00 },
  { name: "Mdkamrul Hasan", role: "Process Worker", dept: "Production", rate: 26.00 },
  { name: "Nimra Habib", role: "Process Worker", dept: "Production", rate: 26.00 },
  { name: "Navneet Kaur Virk", role: "Process Worker", dept: "Production", rate: 26.00 },
  { name: "Gurpreet Kaur", role: "Process Worker", dept: "Production", rate: 26.00 },
  { name: "Om Karki", role: "Process Worker", dept: "Production", rate: 26.00 },
  { name: "Sabnam Khadka", role: "Process Worker", dept: "Production", rate: 26.00 },
  { name: "Ashwani Kumar Kumar", role: "Process Worker", dept: "Production", rate: 26.00 },
  { name: "Sang Kyung Lee", role: "Process Worker", dept: "Production", rate: 29.50 },
  { name: "Manoj Manjunath", role: "Process Worker", dept: "Production", rate: 33.00 },
  { name: "Kundan Neupane", role: "Process Worker", dept: "Production", rate: 28.00 },
  { name: "Anjali Neupane", role: "Process Worker", dept: "Production", rate: 26.00 },
  { name: "Sargam Nasrullah", role: "Process Worker", dept: "Production", rate: 29.00 },
  { name: "Bora Ozcelik", role: "Process Worker", dept: "Production", rate: 28.50 },
  { name: "Sreejan Kumar Paul", role: "Process Worker", dept: "Production", rate: 29.00 },
  { name: "Amisha Pun", role: "Process Worker", dept: "Production", rate: 29.00 },
  { name: "Miskur Rumi", role: "Process Worker", dept: "Production", rate: 34.00 },
  { name: "Rahul Rahul", role: "Process Worker", dept: "Production", rate: 29.00 },
  { name: "Yatin Sethi", role: "Process Worker", dept: "Production", rate: 34.00 },
  { name: "Vijay Sharma", role: "Process Worker", dept: "Production", rate: 31.50 },
  { name: "Nidhi Sharma", role: "Process Worker", dept: "Production", rate: 29.00 },
  { name: "Harshit Sharma", role: "Process Worker", dept: "Production", rate: 29.00 },
  { name: "Karthik Shelvaraju", role: "Process Worker", dept: "Production", rate: 28.00 },
  { name: "Abhay Singh", role: "Process Worker", dept: "Production", rate: 26.00 },
  { name: "Ragwinder Singh", role: "Process Worker", dept: "Production", rate: 29.50 },
  { name: "Devkaran Singh", role: "Process Worker", dept: "Production", rate: 29.00 },
  { name: "Rohan Sood", role: "Process Worker", dept: "Production", rate: 26.00 },
  { name: "Surendra Sunar", role: "Process Worker", dept: "Production", rate: 26.00 },
  { name: "Samundra Tuladhar", role: "Process Worker", dept: "Production", rate: 34.00 },
  { name: "Yash Yash", role: "Process Worker", dept: "Production", rate: 29.00 },
  // Owner
  { name: "Tanisha Sharma", role: "Owner", dept: "Production", rate: 0 },
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
  const usedPins = new Set();
  return SEED_EMPLOYEES.map((e, i) => {
    const pin = e.name === "Tanisha Sharma" ? "cherry2077" : generateUniquePin(usedPins);
    return {
      id: `emp-${i + 1}`,
      ...e,
      initials: e.name.split(" ").filter(n => n.length > 0).slice(0, 2).map(n => n[0].toUpperCase()).join(""),
      pin,
      isManager: e.name === "Gopi Dhamija" || e.name === "Prateek Kumar" || e.name === "Tanisha Sharma",
      isAccounts: e.name === "Raj Krishna",
      isOwner: e.name === "Tanisha Sharma",
      canExportMYOB: e.name === "Gopi Dhamija" || e.name === "Prateek Kumar" || e.name === "Raj Krishna" || e.name === "Tanisha Sharma",
      clockedIn: false,
      clockInTime: null,
      hourlyRate: e.rate,
      leaveBalance: { annual: 20, sick: 10, personal: 3 },
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
  if (style === "iso") return d.toISOString().split("T")[0];
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

// ═══════════════════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════════════════
export default function SKRoster() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null); // logged-in employee obj
  const [employees, setEmployees] = useState([]);
  const [roster, setRoster] = useState({});
  const [leaves, setLeaves] = useState([]);
  const [swaps, setSwaps] = useState([]);
  const [timelog, setTimelog] = useState([]);
  const [tab, setTab] = useState("roster");
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
      setEmployees(emps);
      setRoster(r);
      setLeaves(l);
      setSwaps(s);
      setTimelog(t);
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
    ];
    return () => unsubs.forEach(u => u());
  }, [ready]);

  // ─── PERSIST helpers ───────────────────────────────────────────────
  const persist = useCallback(async (key, data) => { await save(key, data); }, []);

  const notify = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }, []);

  // ─── AUTH ──────────────────────────────────────────────────────────
  const login = (emp) => { setUser(emp); setTab("roster"); };
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

  // ─── LEAVE ACTIONS ─────────────────────────────────────────────────
  const submitLeave = async (data) => {
    const next = [...leaves, { ...data, id: `lv-${Date.now()}`, status: "pending", submittedDate: fmtDate(new Date(), "iso"), employeeId: user.id, employeeName: user.name, department: user.dept }];
    setLeaves(next);
    await persist(STORE_KEYS.leave, next);
    setModal(null);
    notify("Leave request submitted");
  };

  const handleLeave = async (id, status) => {
    const next = leaves.map(l => l.id === id ? { ...l, status } : l);
    setLeaves(next);
    await persist(STORE_KEYS.leave, next);
    notify(`Leave ${status}`);
  };

  // ─── SWAP ACTIONS ──────────────────────────────────────────────────
  const submitSwap = async (data) => {
    const next = [...swaps, { ...data, id: `sw-${Date.now()}`, status: "pending", submittedDate: fmtDate(new Date(), "iso"), requesterId: user.id, requesterName: user.name }];
    setSwaps(next);
    await persist(STORE_KEYS.swaps, next);
    setModal(null);
    notify("Swap request submitted");
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
  };

  // ─── GEOLOCATION CONFIG ─────────────────────────────────────────────
  const SITES = {
    hornsby:  { name: "Hornsby Factory",  lat: -33.6967, lng: 151.1131, address: "8 Leighton Place, Hornsby" },
    yennora:  { name: "Yennora Office",   lat: -33.8636, lng: 150.9785, address: "5 Antill St, Yennora" },
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
          // Don't clock in yet — pass to camera step
          setPendingClock({ action, lat: pos.coords.latitude, lng: pos.coords.longitude, distance: Math.round(dist), siteName: site.name });
        } else {
          setGeoStatus("too_far");
          notify(`Too far from ${site.name} (${Math.round(dist)}m away). Must be within ${GEOFENCE_RADIUS}m.`, "error");
        }
      },
      (err) => {
        if (err.code === 1) {
          setGeoStatus("denied");
          notify("Location permission denied. Please enable location access.", "error");
        } else {
          setGeoStatus("unavailable");
          notify("Could not get your location. Please try again.", "error");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
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
      leaveBalance: { annual: 20, sick: 10, personal: 3 },
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
  const filtered = useMemo(() => {
    if (deptFilter === "All") return employees;
    return employees.filter(e => e.dept === deptFilter);
  }, [employees, deptFilter]);

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
    { id: "roster", label: "Roster", icon: I.Calendar },
    { id: "timesheets", label: "Timesheets", icon: I.Clock },
    { id: "leave", label: "Leave", icon: I.FileText },
    { id: "swaps", label: "Swaps", icon: I.Swap },
    { id: "people", label: "People", icon: I.Users },
  ];
  const accountsTabs = [
    { id: "roster", label: "My Roster", icon: I.Calendar },
    { id: "timesheets", label: "Timesheets", icon: I.Clock },
    { id: "clock", label: "Clock In/Out", icon: I.Clock },
    { id: "leave", label: "Leave", icon: I.FileText },
    { id: "people", label: "People", icon: I.Users },
  ];
  const empTabs = [
    { id: "roster", label: "My Roster", icon: I.Calendar },
    { id: "clock", label: "Clock In/Out", icon: I.Clock },
    { id: "leave", label: "Leave", icon: I.FileText },
    { id: "swaps", label: "Swap Shift", icon: I.Swap },
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
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, fontWeight: 500 }}>{user.name}</div>
              <div style={{ fontSize: 9, opacity: .5 }}>{user.dept}</div>
            </div>
            <button onClick={logout} style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,.15)", background: "transparent", color: "rgba(246,245,240,.6)", cursor: "pointer", fontSize: 10, fontFamily: "inherit" }}>Sign out</button>
          </div>
        </div>
        <nav style={{ display: "flex", gap: 1, overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none", padding: "0 12px 8px", borderTop: "1px solid rgba(255,255,255,.06)" }}>
          {currentTabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 500, fontFamily: "inherit", background: tab === t.id ? "rgba(255,255,255,.12)" : "transparent", color: tab === t.id ? "#F6F5F0" : "rgba(246,245,240,.4)", transition: "all .2s", whiteSpace: "nowrap", flexShrink: 0 }}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main style={{ maxWidth: 1360, margin: "0 auto", padding: "16px 20px" }}>

        {/* ──── MANAGER: ROSTER ──── */}
        {isManager && tab === "roster" && (
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
              <div style={{ display: "flex", gap: 6 }}>
                <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={selectSt}>
                  <option>All</option>
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>
            {/* Shift Legend */}
            <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              {Object.entries(SHIFTS).map(([k, s]) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "var(--ink2)" }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: s.dot }} />{s.label}
                </div>
              ))}
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
                {filtered.map(emp => (
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
                      return (
                        <div key={di} style={{ padding: "4px 3px", display: "flex", alignItems: "center", justifyContent: "center", borderLeft: "1px solid #f3f2ee", background: isToday ? "rgba(180,83,9,.02)" : "transparent" }}>
                          {shift ? (
                            <button onClick={() => removeShift(emp.id, iso)} title="Click to remove" style={{ width: "92%", padding: "4px 2px", borderRadius: 6, background: SHIFTS[shift]?.bg || "#f0f0f0", color: SHIFTS[shift]?.color || "#333", fontSize: 9, fontWeight: 600, border: `1px solid ${SHIFTS[shift]?.color || "#ccc"}22`, cursor: "pointer", fontFamily: "inherit", lineHeight: 1.2, textAlign: "center", transition: "transform .15s" }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.06)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                              {SHIFTS[shift]?.label?.replace(" Process", " Proc") || shift}
                              <div style={{ fontSize: 8, fontWeight: 400, opacity: .7, marginTop: 1 }}>{SHIFTS[shift]?.time?.split("–")[0]?.trim()}</div>
                            </button>
                          ) : (
                            <button onClick={() => setModal({ type: "assignShift", empId: emp.id, empName: emp.name, day: iso })} style={{ width: 24, height: 24, borderRadius: 6, border: "1.5px dashed var(--border2)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: .3, transition: "opacity .2s" }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = .3}><I.Plus /></button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ──── EMPLOYEE: MY ROSTER ──── */}
        {!isManager && tab === "roster" && (
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
          </div>
        )}

        {/* ──── EMPLOYEE: CLOCK IN/OUT ──── */}
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
                {employees.filter(e => e.clockedIn).map(e => (
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 90px 90px 80px 44px", padding: "10px 16px", borderBottom: "2px solid var(--border)", fontSize: 10, fontWeight: 600, color: "var(--ink3)", textTransform: "uppercase", letterSpacing: .5 }}>
                <div>Employee</div><div>Date</div><div>Clock In</div><div>Clock Out</div><div>Location</div><div>Photo</div>
              </div>
              <div style={{ maxHeight: 360, overflowY: "auto" }}>
                {timelog.slice().reverse().slice(0, 50).map(t => (
                  <div key={t.id} style={{ display: "grid", gridTemplateColumns: "1fr 100px 90px 90px 80px 44px", padding: "9px 16px", borderBottom: "1px solid #f3f2ee", fontSize: 13, alignItems: "center" }}>
                    <div style={{ fontWeight: 500 }}>{t.empName} <span style={{ fontSize: 10, color: "var(--ink3)" }}>({t.dept})</span></div>
                    <div style={{ color: "var(--ink2)" }}>{t.date}</div>
                    <div>{t.clockIn}</div>
                    <div>{t.clockOut || <span style={{ color: "var(--green)", fontWeight: 500, fontSize: 11 }}>Active</span>}</div>
                    <div>{t.location ? <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: t.location.distance <= GEOFENCE_RADIUS ? "var(--green-bg)" : "var(--red-bg)", color: t.location.distance <= GEOFENCE_RADIUS ? "var(--green)" : "var(--red)", fontWeight: 600 }} title={t.location.site || ""}>📍 {t.location.distance}m{t.location.site ? ` · ${t.location.site.split(" ")[0]}` : ""}</span> : <span style={{ fontSize: 10, color: "var(--ink3)" }}>—</span>}</div>
                    <div>{t.photo ? <img src={t.photo} alt="" onClick={() => setModal({ type: "viewPhoto", photo: t.photo, empName: t.empName, date: t.date, time: t.clockIn })} style={{ width: 30, height: 30, borderRadius: 6, objectFit: "cover", cursor: "pointer", border: "1px solid var(--border)" }} /> : <span style={{ fontSize: 10, color: "var(--ink3)" }}>—</span>}</div>
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
                {[{ label: "Annual", val: user.leaveBalance.annual, color: "var(--accent)" }, { label: "Sick", val: user.leaveBalance.sick, color: "var(--blue)" }, { label: "Personal", val: user.leaveBalance.personal, color: "#7E22CE" }].map(b => (
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
                    <div style={{ display: "flex", gap: 5 }}>
                      <span style={tagSt("var(--accent)")}>AL: {emp.leaveBalance.annual}d</span>
                      <span style={tagSt("var(--blue)")}>SL: {emp.leaveBalance.sick}d</span>
                      <span style={tagSt("#7E22CE")}>PL: {emp.leaveBalance.personal}d</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink2)" }}>${emp.hourlyRate}/hr</span>
                  </div>
                  {user?.isOwner && <div style={{ fontSize: 10, color: "var(--ink3)", marginTop: 4 }}>PIN: {emp.pin}</div>}
                </div>
              ))}
            </div>
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
            {modal.type === "newLeave" && <LeaveForm onSubmit={submitLeave} onCancel={() => setModal(null)} />}

            {/* New Swap */}
            {modal.type === "newSwap" && <SwapForm employees={employees} user={user} wk={wk} days={days} getShift={getShift} onSubmit={submitSwap} onCancel={() => setModal(null)} />}

            {/* Add Employee */}
            {modal.type === "addEmployee" && <AddEmployeeForm onSubmit={addEmployee} onCancel={() => setModal(null)} />}

            {/* View Photo */}
            {modal.type === "viewPhoto" && (
              <>
                <div style={{ textAlign: "center" }}>
                  <img src={modal.photo} alt="" style={{ width: 240, height: 240, borderRadius: 14, objectFit: "cover", border: "2px solid var(--border)", marginBottom: 12 }} />
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{modal.empName}</div>
                  <div style={{ fontSize: 12, color: "var(--ink2)" }}>{modal.date} at {modal.time}</div>
                </div>
              </>
            )}

            <button onClick={() => setModal(null)} style={{ marginTop: 12, width: "100%", padding: 9, borderRadius: 7, border: "1px solid var(--border)", background: "var(--surface2)", cursor: "pointer", fontFamily: "inherit", fontWeight: 500, fontSize: 12, color: "var(--ink2)" }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
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

  const filtered = search ? employees.filter(e => e.name.toLowerCase().includes(search.toLowerCase())) : employees;
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
            <div style={{ textAlign: "center", marginTop: 20 }}>
              <button onClick={onReset} style={{ fontSize: 11, color: "rgba(246,245,240,.3)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Reset all data</button>
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
function LeaveForm({ onSubmit, onCancel }) {
  const [type, setType] = useState(LEAVE_TYPES[0]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  return (
    <>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Request Leave</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <label style={labelSt}>Leave Type</label>
          <select value={type} onChange={e => setType(e.target.value)} style={inputSt}>{LEAVE_TYPES.map(t => <option key={t}>{t}</option>)}</select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div><label style={labelSt}>Start Date</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputSt} /></div>
          <div><label style={labelSt}>End Date</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inputSt} /></div>
        </div>
        <div><label style={labelSt}>Reason</label><input value={reason} onChange={e => setReason(e.target.value)} placeholder="Brief reason..." style={inputSt} /></div>
        <button onClick={() => { if (startDate && endDate) onSubmit({ type, startDate, endDate, reason }); }} disabled={!startDate || !endDate} style={{ ...btnPrimary, width: "100%", justifyContent: "center", opacity: (!startDate || !endDate) ? .5 : 1 }}>Submit Request</button>
      </div>
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════
// SWAP FORM
// ═════════════════════════════════════════════════════════════════════
function SwapForm({ employees, user, wk, days, getShift, onSubmit, onCancel }) {
  const [targetId, setTargetId] = useState("");
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");

  const others = employees.filter(e => e.id !== user.id);

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

  const openCamera = async () => {
    setCapturedPhoto(null);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 480 }, height: { ideal: 480 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      setCameraError("Camera access denied. Please allow camera permissions.");
      setCameraActive(false);
    }
  };

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
            <div style={{ position: "relative", width: 200, height: 200, margin: "0 auto", borderRadius: 14, overflow: "hidden", border: "3px solid var(--accent)" }}>
              <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
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
