import { useState, useEffect, useCallback, useContext, createContext } from "react";
import {
  LayoutDashboard, BookOpen, FileText, Receipt, Package, TrendingUp,
  Plus, X, ChevronDown, Trash2, AlertTriangle, Wallet, Landmark,
  CreditCard, ArrowUpRight, ArrowDownRight, Warehouse, PieChart,
  Contact2, Users, Building2, MapPin, ShieldCheck, Settings as SettingsIcon,
  ShoppingCart, Factory, ClipboardList, HelpCircle, Globe, Cloud, HardDrive,
  Download, Search,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import * as XLSX from "xlsx";

/* ============================== helpers ============================== */

function uid(prefix = "id") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function monthKey(dateStr) {
  return (dateStr || todayStr()).slice(0, 7);
}
function formatCurrency(n, lang = "ar") {
  const num = Number(n) || 0;
  const sign = num < 0 ? "-" : "";
  const abs = Math.abs(num);
  const parts = abs.toFixed(2).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}${parts[0]}.${parts[1]} ${lang === "ar" ? "ر.س" : "SAR"}`;
}
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function exportReport(rows, filename, format) {
  if (!rows.length) return;
  if (format === "excel") {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `${filename}.xlsx`);
  } else if (format === "html") {
    const headers = Object.keys(rows[0]);
    const html = `<table dir="rtl" border="1" style="border-collapse:collapse;font-family:sans-serif">
      <tr>${headers.map((h) => `<th style="padding:6px 10px;background:#F5F0E4">${h}</th>`).join("")}</tr>
      ${rows.map((r) => `<tr>${headers.map((h) => `<td style="padding:6px 10px">${r[h]}</td>`).join("")}</tr>`).join("")}
    </table>`;
    downloadBlob(new Blob([html], { type: "text/html" }), `${filename}.html`);
  } else {
    const headers = Object.keys(rows[0]);
    const text = [headers.join("\t"), ...rows.map((r) => headers.map((h) => r[h]).join("\t"))].join("\n");
    downloadBlob(new Blob([text], { type: "text/plain;charset=utf-8" }), `${filename}.txt`);
  }
}

const TYPE_META = {
  asset: { label: "الأصول", normal: "debit", color: "#B45309" },
  liability: { label: "الخصوم", normal: "credit", color: "#B91C1C" },
  equity: { label: "حقوق الملكية", normal: "credit", color: "#047857" },
  revenue: { label: "الإيرادات", normal: "credit", color: "#047857" },
  expense: { label: "المصروفات", normal: "debit", color: "#B91C1C" },
};
const TYPE_ORDER = ["asset", "liability", "equity", "revenue", "expense"];
const STORAGE_KEY = "alameen-lite-data-v2";

/* ============================== i18n ============================== */

const STR = {
  ar: {
    appName: "الأمين لايت", tagline: "نظام محاسبي وERP متكامل",
    nav_dashboard: "لوحة التحكم", nav_accounts: "شجرة الحسابات", nav_entries: "القيود اليومية",
    nav_reports: "التقارير", nav_invoices: "الفواتير", nav_pos: "نقطة البيع",
    nav_inventory: "الأصناف والمخزون", nav_supplyProduction: "التوريد والإنتاج",
    nav_crm: "العملاء والموردون", nav_hr: "الموظفون والرواتب", nav_fixedAssets: "الأصول الثابتة",
    nav_orgSettings: "الفروع والمستودعات", nav_usersRoles: "المستخدمون والصلاحيات", nav_settings: "الإعدادات والمساعدة",
    grp_accounting: "المحاسبة", grp_sales: "المبيعات والمخزون", grp_enterprise: "المؤسسة", grp_admin: "الإدارة",
    title_dashboard: "لوحة التحكم", sub_dashboard: "نظرة عامة على المركز المالي",
    title_accounts: "شجرة الحسابات", sub_accounts: "إدارة الحسابات المحاسبية",
    title_entries: "القيود اليومية", sub_entries: "سجل العمليات المحاسبية بنظام القيد المزدوج",
    title_reports: "التقارير", sub_reports: "ميزان المراجعة وكشوف الحسابات ومراكز التكلفة",
    title_invoices: "الفواتير", sub_invoices: "فواتير المبيعات والمشتريات مع ترحيل تلقائي",
    title_pos: "نقطة البيع", sub_pos: "بيع سريع للعملاء النقديين",
    title_inventory: "الأصناف والمخزون", sub_inventory: "إدارة الأصناف عبر مستودعات متعددة",
    title_supplyProduction: "التوريد والإنتاج", sub_supplyProduction: "أوامر الشراء وأوامر التصنيع البسيطة",
    title_crm: "العملاء والموردون", sub_crm: "دليل جهات الاتصال التجارية",
    title_hr: "الموظفون والرواتب", sub_hr: "إدارة الموظفين وتشغيل الرواتب الشهرية",
    title_fixedAssets: "الأصول الثابتة", sub_fixedAssets: "سجل الأصول وإهلاكها الشهري",
    title_orgSettings: "الفروع والمستودعات ومراكز التكلفة", sub_orgSettings: "البنية التنظيمية للمنشأة",
    title_usersRoles: "المستخدمون والصلاحيات", sub_usersRoles: "تحكم هرمي بصلاحيات الوصول لكل وحدة",
    title_settings: "الإعدادات والمساعدة", sub_settings: "اللغة، الإصدار، مستوى الواجهة، ودليل الاستخدام",
    btn_add: "إضافة", btn_save: "حفظ", btn_cancel: "إلغاء", btn_edit: "تعديل", btn_delete: "حذف",
    btn_close: "إغلاق", btn_excel: "Excel", btn_html: "HTML", btn_text: "نصي",
    col_code: "الرمز", col_name: "الاسم", col_balance: "الرصيد", col_date: "التاريخ",
    col_description: "البيان", col_debit: "مدين", col_credit: "دائن", col_total: "الإجمالي", col_actions: "إجراءات",
    edition_desktop: "نسخة Desktop", edition_online: "نسخة أونلاين", edition_pro: "نسخة برو",
    edition_desktop_badge: "غير متصل — شبكة محلية", edition_online_badge: "متصل — مزامنة سحابية ✓", edition_pro_badge: "الإصدار الأساسي المبسّط",
    mode_simple: "مبسطة", mode_standard: "متوسطة", mode_advanced: "متقدمة",
    all_branches: "كل الفروع",
  },
  en: {
    appName: "Al-Ameen Lite", tagline: "Integrated accounting & ERP system",
    nav_dashboard: "Dashboard", nav_accounts: "Chart of Accounts", nav_entries: "Journal Entries",
    nav_reports: "Reports", nav_invoices: "Invoices", nav_pos: "Point of Sale",
    nav_inventory: "Items & Inventory", nav_supplyProduction: "Supply & Production",
    nav_crm: "Customers & Suppliers", nav_hr: "HR & Payroll", nav_fixedAssets: "Fixed Assets",
    nav_orgSettings: "Branches & Warehouses", nav_usersRoles: "Users & Permissions", nav_settings: "Settings & Help",
    grp_accounting: "Accounting", grp_sales: "Sales & Inventory", grp_enterprise: "Enterprise", grp_admin: "Administration",
    title_dashboard: "Dashboard", sub_dashboard: "Financial position overview",
    title_accounts: "Chart of Accounts", sub_accounts: "Manage ledger accounts",
    title_entries: "Journal Entries", sub_entries: "Double-entry transaction log",
    title_reports: "Reports", sub_reports: "Trial balance, account ledger & cost centers",
    title_invoices: "Invoices", sub_invoices: "Sales & purchase invoices with auto-posting",
    title_pos: "Point of Sale", sub_pos: "Fast checkout for walk-in customers",
    title_inventory: "Items & Inventory", sub_inventory: "Manage items across multiple warehouses",
    title_supplyProduction: "Supply & Production", sub_supplyProduction: "Purchase orders and simple assembly orders",
    title_crm: "Customers & Suppliers", sub_crm: "Business contact directory",
    title_hr: "HR & Payroll", sub_hr: "Manage employees and run monthly payroll",
    title_fixedAssets: "Fixed Assets", sub_fixedAssets: "Asset register and monthly depreciation",
    title_orgSettings: "Branches, Warehouses & Cost Centers", sub_orgSettings: "Organizational structure",
    title_usersRoles: "Users & Permissions", sub_usersRoles: "Hierarchical access control per module",
    title_settings: "Settings & Help", sub_settings: "Language, edition, UI complexity, and user guide",
    btn_add: "Add", btn_save: "Save", btn_cancel: "Cancel", btn_edit: "Edit", btn_delete: "Delete",
    btn_close: "Close", btn_excel: "Excel", btn_html: "HTML", btn_text: "Text",
    col_code: "Code", col_name: "Name", col_balance: "Balance", col_date: "Date",
    col_description: "Description", col_debit: "Debit", col_credit: "Credit", col_total: "Total", col_actions: "Actions",
    edition_desktop: "Desktop Edition", edition_online: "Online Edition", edition_pro: "Pro Edition",
    edition_desktop_badge: "Offline — local network", edition_online_badge: "Connected — cloud sync ✓", edition_pro_badge: "Simplified core edition",
    mode_simple: "Simple", mode_standard: "Standard", mode_advanced: "Advanced",
    all_branches: "All branches",
  },
};

const LangContext = createContext({ lang: "ar", t: (k) => k });
function useLang() {
  return useContext(LangContext);
}

/* ============================== nav config ============================== */

const NAV_GROUPS = [
  { titleKey: "grp_accounting", items: [
      { key: "dashboard", icon: LayoutDashboard },
      { key: "accounts", icon: BookOpen },
      { key: "entries", icon: FileText },
      { key: "reports", icon: TrendingUp },
  ]},
  { titleKey: "grp_sales", items: [
      { key: "invoices", icon: Receipt },
      { key: "pos", icon: ShoppingCart },
      { key: "inventory", icon: Package },
      { key: "supplyProduction", icon: Factory },
  ]},
  { titleKey: "grp_enterprise", items: [
      { key: "crm", icon: Contact2 },
      { key: "hr", icon: Users },
      { key: "fixedAssets", icon: Building2 },
  ]},
  { titleKey: "grp_admin", items: [
      { key: "orgSettings", icon: MapPin },
      { key: "usersRoles", icon: ShieldCheck },
      { key: "settings", icon: SettingsIcon },
  ]},
];

const MODE_KEYS = {
  simple: ["dashboard", "invoices", "pos", "inventory", "reports", "settings"],
  standard: ["dashboard", "invoices", "pos", "inventory", "reports", "settings", "accounts", "entries", "orgSettings", "crm", "supplyProduction"],
  advanced: ["dashboard", "invoices", "pos", "inventory", "reports", "settings", "accounts", "entries", "orgSettings", "crm", "supplyProduction", "hr", "fixedAssets", "usersRoles"],
};

/* ============================== seed data ============================== */

function seedData() {
  const accounts = [
    { id: "a1", code: "1001", name: "الصندوق", type: "asset" },
    { id: "a2", code: "1002", name: "البنك", type: "asset" },
    { id: "a3", code: "1003", name: "المدينون (الزبائن)", type: "asset" },
    { id: "a4", code: "1004", name: "المخزون", type: "asset" },
    { id: "a5", code: "1005", name: "الأصول الثابتة", type: "asset" },
    { id: "a6", code: "1006", name: "مجمع الإهلاك", type: "asset", normalOverride: "credit" },
    { id: "a7", code: "2001", name: "الدائنون (الموردون)", type: "liability" },
    { id: "a8", code: "3001", name: "رأس المال", type: "equity" },
    { id: "a9", code: "4001", name: "إيرادات المبيعات", type: "revenue" },
    { id: "a10", code: "5001", name: "تكلفة البضاعة المباعة", type: "expense" },
    { id: "a11", code: "5002", name: "مصاريف تشغيلية", type: "expense" },
    { id: "a12", code: "5003", name: "مصروف الرواتب", type: "expense" },
    { id: "a13", code: "5004", name: "مصروف الإهلاك", type: "expense" },
  ];
  const warehouses = [
    { id: "w1", name: "المستودع الرئيسي" },
    { id: "w2", name: "مستودع الفرع الثانوي" },
  ];
  const branches = [
    { id: "b1", name: "الفرع الرئيسي", city: "الرياض" },
    { id: "b2", name: "فرع جدة", city: "جدة" },
  ];
  const costCenters = [
    { id: "cc1", name: "الإدارة العامة" },
    { id: "cc2", name: "قسم المبيعات" },
  ];
  const roles = [
    { id: "r1", name: "مدير النظام", permissions: allTrue() },
    { id: "r2", name: "محاسب", permissions: { ...allTrue(), hr: false, purchaseOrders: false, usersRoles: false, supplyProduction: false } },
    { id: "r3", name: "موظف مبيعات", permissions: { dashboard: true, invoices: true, pos: true, inventory: true, crm: true, reports: false, accounts: false, entries: false, hr: false, fixedAssets: false, orgSettings: false, usersRoles: false, supplyProduction: false, settings: true } },
  ];
  const users = [
    { id: "u1", name: "أحمد المدير", roleId: "r1" },
    { id: "u2", name: "سارة المحاسبة", roleId: "r2" },
    { id: "u3", name: "خالد المبيعات", roleId: "r3" },
  ];
  const customers = [
    { id: "c1", name: "شركة النور التجارية", type: "customer", phone: "0501234567" },
    { id: "c2", name: "مؤسسة الفجر", type: "customer", phone: "0559876543" },
    { id: "c3", name: "مصنع الاتحاد للتوريدات", type: "supplier", phone: "0112223344" },
  ];
  const employees = [
    { id: "emp1", name: "محمد العتيبي", position: "محاسب", salary: 6000 },
    { id: "emp2", name: "فهد القحطاني", position: "مندوب مبيعات", salary: 4500 },
  ];
  const fixedAssets = [
    { id: "fa1", name: "سيارة توصيل", cost: 60000, usefulLifeMonths: 60, purchaseDate: todayStr(), accumulatedDepreciation: 0 },
  ];
  const items = [
    { id: "i1", name: "لابتوب Dell Inspiron", unit: "قطعة", barcodes: ["6281001"], cost: 2200, price: 2800, stock: { w1: 10, w2: 2 } },
    { id: "i2", name: "طابعة HP LaserJet", unit: "قطعة", barcodes: ["6281002"], cost: 650, price: 900, stock: { w1: 2, w2: 1 } },
    { id: "i3", name: "ورق تصوير A4 (رزمة)", unit: "رزمة", barcodes: ["6281003", "6281004"], cost: 15, price: 22, stock: { w1: 30, w2: 10 } },
  ];
  const entries = [
    {
      id: "e1", no: 1, date: todayStr(), description: "قيد افتتاحي - إيداع رأس المال",
      lines: [{ accountId: "a1", debit: 80000, credit: 0 }, { accountId: "a8", debit: 0, credit: 80000 }],
      posted: true, branchId: "b1", costCenterId: null,
    },
  ];
  return {
    accounts, warehouses, branches, costCenters, roles, users, customers, employees, fixedAssets, items, entries,
    invoices: [], purchaseOrders: [], productionOrders: [], payrollRuns: [], depreciationRuns: [],
    meta: { companyName: "مؤسستي التجارية", language: "ar", edition: "online", uiMode: "advanced", activeBranchId: "b1", activeUserId: "u1" },
  };
}
function allTrue() {
  return {
    dashboard: true, accounts: true, entries: true, reports: true, invoices: true, pos: true, inventory: true,
    supplyProduction: true, crm: true, hr: true, fixedAssets: true, orgSettings: true, usersRoles: true, settings: true,
  };
}

/* ============================== small UI atoms ============================== */

function StatCard({ icon: Icon, label, value, tone = "stone" }) {
  const toneMap = {
    amber: "text-amber-700 bg-amber-50 border-amber-200",
    emerald: "text-emerald-700 bg-emerald-50 border-emerald-200",
    red: "text-red-700 bg-red-50 border-red-200",
    stone: "text-stone-700 bg-stone-100 border-stone-200",
  };
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-4 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-full flex items-center justify-center border shrink-0 ${toneMap[tone]}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-stone-500 font-body">{label}</div>
        <div className="font-num text-lg font-semibold text-stone-900 truncate">{value}</div>
      </div>
    </div>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: "rgba(28,25,20,0.55)" }} onClick={onClose}>
      <div className={`bg-stone-50 rounded-2xl shadow-xl w-full ${wide ? "max-w-2xl" : "max-w-md"} overflow-y-auto`} style={{ maxHeight: "88vh" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 sticky top-0 bg-stone-50 z-10">
          <h3 className="font-display text-lg text-stone-900">{title}</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700"><X size={20} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <span className="block text-xs font-body text-stone-600 mb-1">{label}</span>
      {children}
    </label>
  );
}
const inputCls = "w-full border border-stone-300 rounded-lg px-3 py-2 text-sm font-body bg-white focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-amber-600";

function ExportBar({ rows, filename }) {
  const { t } = useLang();
  return (
    <div className="flex gap-2 justify-end">
      {["excel", "html", "text"].map((f) => (
        <button key={f} onClick={() => exportReport(rows, filename, f)} className="flex items-center gap-1 text-xs font-body px-3 py-1.5 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-100">
          <Download size={13} /> {t(`btn_${f === "excel" ? "excel" : f === "html" ? "html" : "text"}`)}
        </button>
      ))}
    </div>
  );
}

function EmptyRow({ colSpan, text }) {
  return (
    <tr><td colSpan={colSpan} className="px-4 py-6 text-center text-stone-400 font-body">{text}</td></tr>
  );
}

/* ============================== navigation ============================== */

function EditionBadge({ meta }) {
  const { t } = useLang();
  const map = { desktop: { icon: HardDrive, key: "edition_desktop_badge" }, online: { icon: Cloud, key: "edition_online_badge" }, pro: { icon: Package, key: "edition_pro_badge" } };
  const info = map[meta.edition];
  const Icon = info.icon;
  return (
    <div className="flex items-center gap-1.5 text-xs text-stone-400 font-body mt-1">
      <Icon size={12} /> <span>{t(info.key)}</span>
    </div>
  );
}

function Sidebar({ active, setActive, data, allowedKeys }) {
  const { t } = useLang();
  return (
    <aside className="hidden md:flex w-64 shrink-0 bg-stone-900 text-stone-100 flex-col min-h-screen sticky top-0">
      <div className="p-5 border-b border-stone-700">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full border-2 border-amber-600 flex items-center justify-center shrink-0">
            <span className="font-display text-amber-500 text-lg">أ</span>
          </div>
          <div className="min-w-0">
            <div className="font-display text-lg leading-tight">{t("appName")}</div>
            <div className="text-xs text-stone-400 truncate">{data.meta.companyName}</div>
          </div>
        </div>
        <EditionBadge meta={data.meta} />
      </div>
      <nav className="flex-1 p-3 space-y-3 overflow-y-auto">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((it) => allowedKeys.includes(it.key));
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.titleKey}>
              <div className="text-xs text-stone-500 font-body px-3 mb-1">{t(group.titleKey)}</div>
              <div className="space-y-1">
                {visibleItems.map((it) => {
                  const Icon = it.icon;
                  const isActive = active === it.key;
                  return (
                    <button key={it.key} onClick={() => setActive(it.key)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-colors ${isActive ? "bg-amber-700 text-white" : "text-stone-300 hover:bg-stone-800"}`}>
                      <Icon size={18} /> <span>{t(`nav_${it.key}`)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

function TopNav({ active, setActive, allowedKeys }) {
  const { t } = useLang();
  const flatItems = NAV_GROUPS.flatMap((g) => g.items).filter((it) => allowedKeys.includes(it.key));
  return (
    <div className="md:hidden sticky top-0 z-30 bg-stone-900 text-stone-100 overflow-x-auto">
      <div className="flex gap-1 p-2 w-max">
        {flatItems.map((it) => {
          const Icon = it.icon;
          const isActive = active === it.key;
          return (
            <button key={it.key} onClick={() => setActive(it.key)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs whitespace-nowrap font-body ${isActive ? "bg-amber-700 text-white" : "text-stone-300"}`}>
              <Icon size={14} /> <span>{t(`nav_${it.key}`)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================== Dashboard ============================== */

function DashboardView({ data, getAccountBalance, getTypeTotal }) {
  const { lang } = useLang();
  const [branchFilter, setBranchFilter] = useState("all");
  const { t } = useLang();

  const filteredEntries = branchFilter === "all" ? data.entries : data.entries.filter((e) => e.branchId === branchFilter);
  const localBalance = (account) => {
    let raw = 0;
    filteredEntries.forEach((e) => e.lines.forEach((l) => { if (l.accountId === account.id) raw += (Number(l.debit) || 0) - (Number(l.credit) || 0); }));
    const normal = account.normalOverride || TYPE_META[account.type].normal;
    return normal === "debit" ? raw : -raw;
  };
  const localTypeTotal = (type) => data.accounts.filter((a) => a.type === type).reduce((s, a) => s + localBalance(a), 0);

  const assets = localTypeTotal("asset");
  const liabilities = localTypeTotal("liability");
  const revenue = localTypeTotal("revenue");
  const expense = localTypeTotal("expense");
  const netIncome = revenue - expense;
  const cashAcc = data.accounts.find((a) => a.code === "1001");
  const bankAcc = data.accounts.find((a) => a.code === "1002");
  const cash = (cashAcc ? localBalance(cashAcc) : 0) + (bankAcc ? localBalance(bankAcc) : 0);

  const chartData = TYPE_ORDER.map((tpe) => ({ name: TYPE_META[tpe].label, value: Math.round(localTypeTotal(tpe)), color: TYPE_META[tpe].color }));
  const recentEntries = [...filteredEntries].slice(-5).reverse();
  const lowStock = data.items.filter((i) => Object.values(i.stock || {}).reduce((s, q) => s + Number(q), 0) <= 5);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <select className={inputCls} style={{ maxWidth: 220 }} value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
          <option value="all">{t("all_branches")}</option>
          {data.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Landmark} label="إجمالي الأصول" value={formatCurrency(assets, lang)} tone="amber" />
        <StatCard icon={CreditCard} label="إجمالي الخصوم" value={formatCurrency(liabilities, lang)} tone="red" />
        <StatCard icon={netIncome >= 0 ? ArrowUpRight : ArrowDownRight} label="صافي الربح" value={formatCurrency(netIncome, lang)} tone={netIncome >= 0 ? "emerald" : "red"} />
        <StatCard icon={Wallet} label="السيولة (صندوق + بنك)" value={formatCurrency(cash, lang)} tone="stone" />
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-4">
        <h3 className="font-display text-base text-stone-900 mb-3">ملخص المركز المالي حسب نوع الحساب</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e0d0" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#57534e" }} />
            <YAxis tick={{ fontSize: 11, fill: "#57534e" }} />
            <Tooltip formatter={(v) => formatCurrency(v, lang)} contentStyle={{ fontFamily: "IBM Plex Sans Arabic", direction: "rtl", textAlign: "right", fontSize: 12 }} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <h3 className="font-display text-base text-stone-900 mb-3">آخر القيود</h3>
          {recentEntries.length === 0 && <p className="text-sm text-stone-500 font-body">لا توجد قيود بعد.</p>}
          <ul className="space-y-2">
            {recentEntries.map((e) => {
              const total = e.lines.reduce((s, l) => s + Number(l.debit || 0), 0);
              return (
                <li key={e.id} className="flex items-center justify-between text-sm border-b border-stone-100 pb-2 last:border-0">
                  <div className="min-w-0"><div className="font-body text-stone-800 truncate">{e.description}</div><div className="text-xs text-stone-400 font-num">{e.date}</div></div>
                  <div className="font-num text-stone-900 shrink-0 ms-2">{formatCurrency(total, lang)}</div>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <h3 className="font-display text-base text-stone-900 mb-3 flex items-center gap-2"><AlertTriangle size={16} className="text-red-600" />أصناف منخفضة المخزون</h3>
          {lowStock.length === 0 && <p className="text-sm text-stone-500 font-body">جميع الأصناف بكميات كافية.</p>}
          <ul className="space-y-2">
            {lowStock.map((i) => {
              const total = Object.values(i.stock || {}).reduce((s, q) => s + Number(q), 0);
              return (
                <li key={i.id} className="flex items-center justify-between text-sm border-b border-stone-100 pb-2 last:border-0">
                  <span className="font-body text-stone-800">{i.name}</span>
                  <span className="font-num text-red-700 font-semibold">{total} {i.unit}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ============================== Accounts ============================== */

function AccountsView({ accounts, getAccountBalance, onAdd }) {
  const { lang, t } = useLang();
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={onAdd} className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white text-sm font-body px-4 py-2 rounded-lg"><Plus size={16} /> {t("btn_add")}</button>
      </div>
      {TYPE_ORDER.map((type) => {
        const list = accounts.filter((a) => a.type === type);
        if (list.length === 0) return null;
        return (
          <div key={type} className="bg-white border border-stone-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-stone-200" style={{ backgroundColor: "#F5F0E4" }}><h3 className="font-display text-sm text-stone-800">{TYPE_META[type].label}</h3></div>
            <table className="w-full text-sm">
              <thead><tr className="text-stone-500 font-body text-xs border-b border-stone-100"><th className="text-right px-4 py-2 font-medium">{t("col_code")}</th><th className="text-right px-4 py-2 font-medium">{t("col_name")}</th><th className="text-right px-4 py-2 font-medium">{t("col_balance")}</th></tr></thead>
              <tbody>
                {list.map((a) => {
                  const bal = getAccountBalance(a);
                  return (
                    <tr key={a.id} className="border-b border-stone-50 last:border-0">
                      <td className="px-4 py-2.5 font-num text-stone-500">{a.code}</td>
                      <td className="px-4 py-2.5 font-body text-stone-800">{a.name}</td>
                      <td className={`px-4 py-2.5 font-num font-semibold ${bal < 0 ? "text-red-700" : "text-stone-900"}`}>{formatCurrency(bal, lang)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

function AccountModal({ form, setForm, onSubmit, onClose }) {
  const { t } = useLang();
  return (
    <Modal title="إضافة حساب جديد" onClose={onClose}>
      <Field label="رمز الحساب"><input className={inputCls} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="مثال: 1007" /></Field>
      <Field label="اسم الحساب"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="مثال: عهدة نقدية" /></Field>
      <Field label="نوع الحساب">
        <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          {TYPE_ORDER.map((tpe) => <option key={tpe} value={tpe}>{TYPE_META[tpe].label}</option>)}
        </select>
      </Field>
      <button onClick={onSubmit} className="w-full bg-amber-700 hover:bg-amber-800 text-white font-body py-2.5 rounded-lg text-sm mt-2">{t("btn_save")}</button>
    </Modal>
  );
}

/* ============================== Journal Entries ============================== */

function EntriesView({ entries, accounts, costCenters, onAdd }) {
  const { lang, t } = useLang();
  const [openId, setOpenId] = useState(null);
  const accName = (id) => accounts.find((a) => a.id === id)?.name || "—";
  const ccName = (id) => costCenters.find((c) => c.id === id)?.name;
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={onAdd} className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white text-sm font-body px-4 py-2 rounded-lg"><Plus size={16} /> قيد يدوي جديد</button>
      </div>
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        {[...entries].reverse().map((e) => {
          const total = e.lines.reduce((s, l) => s + Number(l.debit || 0), 0);
          const isOpen = openId === e.id;
          return (
            <div key={e.id} className="border-b border-stone-100 last:border-0">
              <button onClick={() => setOpenId(isOpen ? null : e.id)} className="w-full flex items-center justify-between px-4 py-3 text-right hover:bg-stone-50">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-num text-xs text-stone-400 shrink-0">#{e.no}</span>
                  <div className="min-w-0 text-right">
                    <div className="font-body text-sm text-stone-800 truncate">{e.description}{e.costCenterId && <span className="text-stone-400"> · {ccName(e.costCenterId)}</span>}</div>
                    <div className="font-num text-xs text-stone-400">{e.date}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-num text-sm font-semibold text-stone-900">{formatCurrency(total, lang)}</span>
                  <ChevronDown size={16} className={`text-stone-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </div>
              </button>
              {isOpen && (
                <div className="px-4 pb-4">
                  <table className="w-full text-xs bg-stone-50 rounded-lg overflow-hidden">
                    <thead><tr className="text-stone-500 font-body"><th className="text-right px-3 py-2">الحساب</th><th className="text-right px-3 py-2">مدين</th><th className="text-right px-3 py-2">دائن</th></tr></thead>
                    <tbody>
                      {e.lines.map((l, idx) => (
                        <tr key={idx} className="border-t border-stone-100">
                          <td className="px-3 py-2 font-body text-stone-700">{accName(l.accountId)}</td>
                          <td className="px-3 py-2 font-num text-stone-700">{l.debit ? formatCurrency(l.debit, lang) : "—"}</td>
                          <td className="px-3 py-2 font-num text-stone-700">{l.credit ? formatCurrency(l.credit, lang) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
        {entries.length === 0 && <EmptyRow colSpan={1} text="لا توجد قيود بعد." />}
      </div>
      <p className="text-xs text-stone-400 font-body">ملاحظة: لا يمكن حذف أو تعديل القيود المرحّلة حفاظاً على سلامة الدفاتر المحاسبية.</p>
    </div>
  );
}

function EntryModal({ form, setForm, accounts, costCenters, onSubmit, onClose }) {
  const updateLine = (idx, patch) => setForm({ ...form, lines: form.lines.map((l, i) => (i === idx ? { ...l, ...patch } : l)) });
  const addLine = () => setForm({ ...form, lines: [...form.lines, { accountId: "", debit: 0, credit: 0 }] });
  const removeLine = (idx) => { if (form.lines.length <= 2) return; setForm({ ...form, lines: form.lines.filter((_, i) => i !== idx) }); };
  const totalDebit = form.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalCredit = form.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const balanced = totalDebit === totalCredit && totalDebit > 0;
  return (
    <Modal title="قيد يومية جديد" onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-3">
        <Field label="التاريخ"><input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
        <Field label="البيان"><input className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="وصف القيد" /></Field>
      </div>
      <Field label="مركز التكلفة (اختياري)">
        <select className={inputCls} value={form.costCenterId || ""} onChange={(e) => setForm({ ...form, costCenterId: e.target.value || null })}>
          <option value="">بدون</option>
          {costCenters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <div className="space-y-2 mt-2">
        {form.lines.map((line, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-2 items-center">
            <select className={`${inputCls} col-span-5`} value={line.accountId} onChange={(e) => updateLine(idx, { accountId: e.target.value })}>
              <option value="">اختر الحساب</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
            </select>
            <input type="number" placeholder="مدين" className={`${inputCls} col-span-3 font-num`} value={line.debit || ""} onChange={(e) => updateLine(idx, { debit: Number(e.target.value) || 0, credit: 0 })} />
            <input type="number" placeholder="دائن" className={`${inputCls} col-span-3 font-num`} value={line.credit || ""} onChange={(e) => updateLine(idx, { credit: Number(e.target.value) || 0, debit: 0 })} />
            <button onClick={() => removeLine(idx)} className="col-span-1 text-stone-400 hover:text-red-600 flex justify-center"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
      <button onClick={addLine} className="text-amber-700 text-xs font-body flex items-center gap-1 mt-2"><Plus size={14} /> إضافة سطر</button>
      <div className="flex items-center justify-between mt-4 p-3 rounded-lg bg-stone-100 text-sm font-num">
        <span>إجمالي المدين: {formatCurrency(totalDebit)}</span>
        <span>إجمالي الدائن: {formatCurrency(totalCredit)}</span>
        <span className={balanced ? "text-emerald-700 font-semibold" : "text-red-700 font-semibold"}>{balanced ? "متوازن ✓" : "غير متوازن"}</span>
      </div>
      <button disabled={!balanced} onClick={onSubmit} className="w-full bg-amber-700 hover:bg-amber-800 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-body py-2.5 rounded-lg text-sm mt-4">ترحيل القيد</button>
    </Modal>
  );
}

/* ============================== Inventory ============================== */

function InventoryView({ items, warehouses, onAdd, onEdit }) {
  const { lang, t } = useLang();
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={onAdd} className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white text-sm font-body px-4 py-2 rounded-lg"><Plus size={16} /> صنف جديد</button>
      </div>
      <div className="bg-white border border-stone-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-max">
          <thead>
            <tr className="text-stone-500 font-body text-xs border-b border-stone-100" style={{ backgroundColor: "#F5F0E4" }}>
              <th className="text-right px-4 py-2.5 font-medium">الصنف</th>
              <th className="text-right px-4 py-2.5 font-medium">الباركود</th>
              <th className="text-right px-4 py-2.5 font-medium">الوحدة</th>
              {warehouses.map((w) => <th key={w.id} className="text-right px-4 py-2.5 font-medium">{w.name}</th>)}
              <th className="text-right px-4 py-2.5 font-medium">الإجمالي</th>
              <th className="text-right px-4 py-2.5 font-medium">تكلفة الوحدة</th>
              <th className="text-right px-4 py-2.5 font-medium">سعر البيع</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => {
              const totalQty = Object.values(i.stock || {}).reduce((s, q) => s + Number(q), 0);
              const low = totalQty <= 5;
              return (
                <tr key={i.id} className="border-b border-stone-50 last:border-0 hover:bg-stone-50">
                  <td className="px-4 py-2.5 font-body text-stone-800">{i.name}</td>
                  <td className="px-4 py-2.5 font-num text-xs text-stone-500">{(i.barcodes || []).join(", ") || "—"}</td>
                  <td className="px-4 py-2.5 font-body text-stone-500">{i.unit}</td>
                  {warehouses.map((w) => <td key={w.id} className="px-4 py-2.5 font-num text-stone-600">{(i.stock && i.stock[w.id]) || 0}</td>)}
                  <td className={`px-4 py-2.5 font-num font-semibold ${low ? "text-red-700" : "text-stone-800"}`}>{totalQty} {low && <AlertTriangle size={12} className="inline mb-0.5" />}</td>
                  <td className="px-4 py-2.5 font-num text-stone-600">{formatCurrency(i.cost, lang)}</td>
                  <td className="px-4 py-2.5 font-num text-stone-600">{formatCurrency(i.price, lang)}</td>
                  <td className="px-4 py-2.5"><button onClick={() => onEdit(i)} className="text-xs text-amber-700 font-body hover:underline">تعديل</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {items.length === 0 && <p className="text-sm text-stone-500 font-body p-4">لا توجد أصناف بعد.</p>}
      </div>
    </div>
  );
}

function ItemModal({ form, setForm, warehouses, onSubmit, onClose, editing }) {
  const setStock = (wId, val) => setForm({ ...form, stock: { ...form.stock, [wId]: Number(val) || 0 } });
  return (
    <Modal title={editing ? "تعديل الصنف" : "صنف جديد"} onClose={onClose}>
      <Field label="اسم الصنف"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="وحدة القياس"><input className={inputCls} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="قطعة، كرتون..." /></Field>
        <Field label="الباركود (مفصول بفاصلة)"><input className={inputCls} value={(form.barcodes || []).join(", ")} onChange={(e) => setForm({ ...form, barcodes: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="تكلفة الوحدة"><input type="number" className={`${inputCls} font-num`} value={form.cost} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} /></Field>
        <Field label="سعر البيع"><input type="number" className={`${inputCls} font-num`} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></Field>
      </div>
      <div className="border-t border-stone-200 pt-3 mt-2">
        <span className="block text-xs font-body text-stone-600 mb-2">الكمية حسب المستودع</span>
        <div className="grid grid-cols-2 gap-2">
          {warehouses.map((w) => (
            <Field key={w.id} label={w.name}><input type="number" className={`${inputCls} font-num`} value={(form.stock && form.stock[w.id]) || 0} onChange={(e) => setStock(w.id, e.target.value)} /></Field>
          ))}
        </div>
      </div>
      <button onClick={onSubmit} className="w-full bg-amber-700 hover:bg-amber-800 text-white font-body py-2.5 rounded-lg text-sm mt-2">حفظ الصنف</button>
    </Modal>
  );
}

/* ============================== Invoices ============================== */

function InvoicesView({ invoices, branches, onAdd }) {
  const { lang, t } = useLang();
  const branchName = (id) => branches.find((b) => b.id === id)?.name || "—";
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={onAdd} className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white text-sm font-body px-4 py-2 rounded-lg"><Plus size={16} /> فاتورة جديدة</button>
      </div>
      <div className="bg-white border border-stone-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-max">
          <thead>
            <tr className="text-stone-500 font-body text-xs border-b border-stone-100" style={{ backgroundColor: "#F5F0E4" }}>
              <th className="text-right px-4 py-2.5 font-medium">رقم</th><th className="text-right px-4 py-2.5 font-medium">النوع</th>
              <th className="text-right px-4 py-2.5 font-medium">الطرف</th><th className="text-right px-4 py-2.5 font-medium">الفرع</th>
              <th className="text-right px-4 py-2.5 font-medium">التاريخ</th><th className="text-right px-4 py-2.5 font-medium">الدفع</th>
              <th className="text-right px-4 py-2.5 font-medium">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {[...invoices].reverse().map((inv) => (
              <tr key={inv.id} className="border-b border-stone-50 last:border-0 hover:bg-stone-50">
                <td className="px-4 py-2.5 font-num text-stone-500">#{inv.no}</td>
                <td className="px-4 py-2.5"><span className={`text-xs font-body px-2 py-0.5 rounded-full ${inv.type === "sale" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>{inv.type === "sale" ? "مبيعات" : "مشتريات"}</span></td>
                <td className="px-4 py-2.5 font-body text-stone-800">{inv.partyName}</td>
                <td className="px-4 py-2.5 font-body text-stone-500">{branchName(inv.branchId)}</td>
                <td className="px-4 py-2.5 font-num text-stone-500">{inv.date}</td>
                <td className="px-4 py-2.5 font-body text-stone-500">{inv.paymentMethod === "cash" ? "نقداً" : "آجل"}</td>
                <td className="px-4 py-2.5 font-num font-semibold text-stone-900">{formatCurrency(inv.total, lang)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {invoices.length === 0 && <p className="text-sm text-stone-500 font-body p-4">لا توجد فواتير بعد.</p>}
      </div>
    </div>
  );
}

function InvoiceModal({ form, setForm, items, warehouses, customers, costCenters, branches, onSubmit, onClose }) {
  const partyOptions = customers.filter((c) => c.type === (form.type === "sale" ? "customer" : "supplier"));
  const updateLine = (idx, patch) => {
    const lines = form.lines.map((l, i) => {
      if (i !== idx) return l;
      const merged = { ...l, ...patch };
      if (patch.itemId) {
        const item = items.find((it) => it.id === patch.itemId);
        merged.price = item ? (form.type === "sale" ? item.price : item.cost) : 0;
      }
      return merged;
    });
    setForm({ ...form, lines });
  };
  const addLine = () => setForm({ ...form, lines: [...form.lines, { itemId: "", warehouseId: warehouses[0]?.id || "", qty: 1, price: 0 }] });
  const removeLine = (idx) => { if (form.lines.length <= 1) return; setForm({ ...form, lines: form.lines.filter((_, i) => i !== idx) }); };
  const total = form.lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.price) || 0), 0);

  return (
    <Modal title="فاتورة جديدة" onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-3">
        <Field label="نوع الفاتورة">
          <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, customerId: "", newPartyName: "" })}>
            <option value="sale">فاتورة مبيعات</option><option value="purchase">فاتورة مشتريات</option>
          </select>
        </Field>
        <Field label="طريقة الدفع">
          <select className={inputCls} value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
            <option value="cash">نقداً</option><option value="credit">آجل</option>
          </select>
        </Field>
        <Field label={form.type === "sale" ? "العميل" : "المورد"}>
          <select className={inputCls} value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
            <option value="">اختر من الدليل</option>
            {partyOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            <option value="__new__">+ جهة جديدة</option>
          </select>
        </Field>
        {form.customerId === "__new__" ? (
          <Field label="اسم الجهة الجديدة"><input className={inputCls} value={form.newPartyName} onChange={(e) => setForm({ ...form, newPartyName: e.target.value })} /></Field>
        ) : (
          <Field label="الفرع">
            <select className={inputCls} value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
        )}
        <Field label="التاريخ"><input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
        <Field label="مركز التكلفة (اختياري)">
          <select className={inputCls} value={form.costCenterId || ""} onChange={(e) => setForm({ ...form, costCenterId: e.target.value || null })}>
            <option value="">بدون</option>
            {costCenters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
      </div>

      <div className="space-y-2 mt-2">
        {form.lines.map((line, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-2 items-center">
            <select className={`${inputCls} col-span-4`} value={line.itemId} onChange={(e) => updateLine(idx, { itemId: e.target.value })}>
              <option value="">اختر الصنف</option>
              {items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
            </select>
            <select className={`${inputCls} col-span-3`} value={line.warehouseId} onChange={(e) => updateLine(idx, { warehouseId: e.target.value })}>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            <input type="number" placeholder="الكمية" className={`${inputCls} col-span-1 font-num`} value={line.qty} onChange={(e) => updateLine(idx, { qty: Number(e.target.value) })} />
            <input type="number" placeholder="السعر" className={`${inputCls} col-span-2 font-num`} value={line.price} onChange={(e) => updateLine(idx, { price: Number(e.target.value) })} />
            <span className="col-span-1 font-num text-xs text-stone-500 text-center">{formatCurrency((Number(line.qty) || 0) * (Number(line.price) || 0))}</span>
            <button onClick={() => removeLine(idx)} className="col-span-1 text-stone-400 hover:text-red-600 flex justify-center"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
      <button onClick={addLine} className="text-amber-700 text-xs font-body flex items-center gap-1 mt-2"><Plus size={14} /> إضافة صنف</button>

      <div className="flex items-center justify-between mt-4 p-3 rounded-lg bg-stone-100 text-sm font-num font-semibold">
        <span className="font-body font-normal text-stone-600">الإجمالي</span><span className="text-stone-900">{formatCurrency(total)}</span>
      </div>
      <p className="text-xs text-stone-400 font-body mt-2">سيتم توليد القيد المحاسبي وتحديث كميات المخزون بالمستودع المحدد لكل سطر تلقائياً.</p>
      <button onClick={onSubmit} className="w-full bg-amber-700 hover:bg-amber-800 text-white font-body py-2.5 rounded-lg text-sm mt-3">حفظ الفاتورة وترحيل القيد</button>
    </Modal>
  );
}

/* ============================== POS ============================== */

function POSView({ items, warehouses, onCheckout }) {
  const { lang } = useLang();
  const [cart, setCart] = useState({});
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || "");
  const [search, setSearch] = useState("");

  const filtered = items.filter((i) => i.name.includes(search) || (i.barcodes || []).some((b) => b.includes(search)));
  const addToCart = (item) => setCart((c) => ({ ...c, [item.id]: (c[item.id] || 0) + 1 }));
  const removeFromCart = (item) => setCart((c) => {
    const next = { ...c };
    if (next[item.id] > 1) next[item.id] -= 1; else delete next[item.id];
    return next;
  });
  const cartLines = Object.entries(cart).map(([itemId, qty]) => {
    const item = items.find((i) => i.id === itemId);
    return { itemId, qty, price: item.price, name: item.name };
  });
  const total = cartLines.reduce((s, l) => s + l.qty * l.price, 0);

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="md:col-span-2 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute top-2.5 right-3 text-stone-400" />
          <input className={`${inputCls} pr-9`} placeholder="ابحث بالاسم أو الباركود..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.map((item) => {
            const stockQty = Object.values(item.stock || {}).reduce((s, q) => s + Number(q), 0);
            return (
              <button key={item.id} onClick={() => addToCart(item)} disabled={stockQty <= 0} className="bg-white border border-stone-200 rounded-xl p-3 text-right hover:border-amber-500 disabled:opacity-40 disabled:cursor-not-allowed">
                <div className="font-body text-sm text-stone-800 mb-1">{item.name}</div>
                <div className="font-num text-amber-700 font-semibold">{formatCurrency(item.price, lang)}</div>
                <div className="font-num text-xs text-stone-400">متوفر: {stockQty}</div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="bg-white border border-stone-200 rounded-xl p-4 h-fit sticky top-4">
        <h3 className="font-display text-base text-stone-900 mb-3">السلة</h3>
        <Field label="المستودع"><select className={inputCls} value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>{warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></Field>
        <ul className="space-y-2 mb-3">
          {cartLines.map((l) => (
            <li key={l.itemId} className="flex items-center justify-between text-sm">
              <span className="font-body text-stone-700 truncate">{l.name}</span>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => removeFromCart({ id: l.itemId })} className="w-6 h-6 rounded-full bg-stone-100 text-stone-600">−</button>
                <span className="font-num w-5 text-center">{l.qty}</span>
                <button onClick={() => addToCart({ id: l.itemId })} className="w-6 h-6 rounded-full bg-stone-100 text-stone-600">+</button>
              </div>
            </li>
          ))}
          {cartLines.length === 0 && <p className="text-xs text-stone-400 font-body">السلة فارغة</p>}
        </ul>
        <div className="flex justify-between font-num font-semibold border-t border-stone-200 pt-2 mb-3"><span className="font-body font-normal">الإجمالي</span><span>{formatCurrency(total, lang)}</span></div>
        <button
          disabled={cartLines.length === 0}
          onClick={() => { onCheckout(cartLines, warehouseId); setCart({}); }}
          className="w-full bg-amber-700 hover:bg-amber-800 disabled:bg-stone-300 text-white font-body py-2.5 rounded-lg text-sm"
        >
          إتمام البيع نقداً
        </button>
      </div>
    </div>
  );
}

/* ============================== Supply & Production ============================== */

function SupplyProductionView({ purchaseOrders, productionOrders, customers, items, onAddPO, onAddProd, onRunProd }) {
  const [tab, setTab] = useState("po");
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setTab("po")} className={`px-4 py-2 rounded-lg text-sm font-body ${tab === "po" ? "bg-amber-700 text-white" : "bg-white border border-stone-200 text-stone-600"}`}>أوامر الشراء</button>
        <button onClick={() => setTab("prod")} className={`px-4 py-2 rounded-lg text-sm font-body ${tab === "prod" ? "bg-amber-700 text-white" : "bg-white border border-stone-200 text-stone-600"}`}>أوامر التصنيع</button>
      </div>
      {tab === "po" && (
        <div className="space-y-3">
          <div className="flex justify-end"><button onClick={onAddPO} className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white text-sm font-body px-4 py-2 rounded-lg"><Plus size={16} /> أمر شراء جديد</button></div>
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="text-stone-500 font-body text-xs border-b" style={{ backgroundColor: "#F5F0E4" }}><th className="text-right px-4 py-2.5">رقم</th><th className="text-right px-4 py-2.5">المورد</th><th className="text-right px-4 py-2.5">التاريخ</th><th className="text-right px-4 py-2.5">عدد الأصناف</th><th className="text-right px-4 py-2.5">الحالة</th></tr></thead>
              <tbody>
                {[...purchaseOrders].reverse().map((po) => (
                  <tr key={po.id} className="border-b border-stone-50 last:border-0">
                    <td className="px-4 py-2.5 font-num text-stone-500">#{po.no}</td>
                    <td className="px-4 py-2.5 font-body text-stone-800">{customers.find((c) => c.id === po.supplierId)?.name || "—"}</td>
                    <td className="px-4 py-2.5 font-num text-stone-500">{po.date}</td>
                    <td className="px-4 py-2.5 font-num text-stone-600">{po.lines.length}</td>
                    <td className="px-4 py-2.5"><span className="text-xs font-body px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">مخطط له</span></td>
                  </tr>
                ))}
                {purchaseOrders.length === 0 && <EmptyRow colSpan={5} text="لا توجد أوامر شراء بعد. هذه الوثائق للتخطيط فقط ولا تُنشئ قيوداً محاسبية حتى تتحول لفاتورة مشتريات فعلية." />}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {tab === "prod" && (
        <div className="space-y-3">
          <div className="flex justify-end"><button onClick={onAddProd} className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white text-sm font-body px-4 py-2 rounded-lg"><Plus size={16} /> أمر تصنيع جديد</button></div>
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="text-stone-500 font-body text-xs border-b" style={{ backgroundColor: "#F5F0E4" }}><th className="text-right px-4 py-2.5">رقم</th><th className="text-right px-4 py-2.5">الصنف النهائي</th><th className="text-right px-4 py-2.5">الكمية</th><th className="text-right px-4 py-2.5">الحالة</th><th className="px-4 py-2.5"></th></tr></thead>
              <tbody>
                {[...productionOrders].reverse().map((po) => (
                  <tr key={po.id} className="border-b border-stone-50 last:border-0">
                    <td className="px-4 py-2.5 font-num text-stone-500">#{po.no}</td>
                    <td className="px-4 py-2.5 font-body text-stone-800">{items.find((i) => i.id === po.finishedItemId)?.name || "—"}</td>
                    <td className="px-4 py-2.5 font-num text-stone-600">{po.finishedQty}</td>
                    <td className="px-4 py-2.5"><span className={`text-xs font-body px-2 py-0.5 rounded-full ${po.status === "done" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>{po.status === "done" ? "منفّذ" : "قيد الانتظار"}</span></td>
                    <td className="px-4 py-2.5">{po.status !== "done" && <button onClick={() => onRunProd(po)} className="text-xs text-amber-700 font-body hover:underline">تنفيذ</button>}</td>
                  </tr>
                ))}
                {productionOrders.length === 0 && <EmptyRow colSpan={5} text="لا توجد أوامر تصنيع بعد." />}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function POModal({ form, setForm, customers, items, onSubmit, onClose }) {
  const suppliers = customers.filter((c) => c.type === "supplier");
  const updateLine = (idx, patch) => setForm({ ...form, lines: form.lines.map((l, i) => (i === idx ? { ...l, ...patch } : l)) });
  const addLine = () => setForm({ ...form, lines: [...form.lines, { itemId: "", qty: 1 }] });
  return (
    <Modal title="أمر شراء جديد" onClose={onClose}>
      <Field label="المورد"><select className={inputCls} value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}><option value="">اختر</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
      <Field label="التاريخ"><input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
      {form.lines.map((l, idx) => (
        <div key={idx} className="grid grid-cols-12 gap-2 mb-2">
          <select className={`${inputCls} col-span-8`} value={l.itemId} onChange={(e) => updateLine(idx, { itemId: e.target.value })}><option value="">اختر الصنف</option>{items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}</select>
          <input type="number" className={`${inputCls} col-span-4 font-num`} value={l.qty} onChange={(e) => updateLine(idx, { qty: Number(e.target.value) })} />
        </div>
      ))}
      <button onClick={addLine} className="text-amber-700 text-xs font-body flex items-center gap-1 mt-1 mb-3"><Plus size={14} /> إضافة صنف</button>
      <button onClick={onSubmit} className="w-full bg-amber-700 hover:bg-amber-800 text-white font-body py-2.5 rounded-lg text-sm">حفظ أمر الشراء</button>
    </Modal>
  );
}

function ProdModal({ form, setForm, items, warehouses, onSubmit, onClose }) {
  const updateComp = (idx, patch) => setForm({ ...form, components: form.components.map((c, i) => (i === idx ? { ...c, ...patch } : c)) });
  const addComp = () => setForm({ ...form, components: [...form.components, { itemId: "", qty: 1 }] });
  return (
    <Modal title="أمر تصنيع جديد" onClose={onClose}>
      <Field label="الصنف النهائي (المُجمَّع)"><select className={inputCls} value={form.finishedItemId} onChange={(e) => setForm({ ...form, finishedItemId: e.target.value })}><option value="">اختر</option>{items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}</select></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="الكمية المطلوب إنتاجها"><input type="number" className={`${inputCls} font-num`} value={form.finishedQty} onChange={(e) => setForm({ ...form, finishedQty: Number(e.target.value) })} /></Field>
        <Field label="مستودع التنفيذ"><select className={inputCls} value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}>{warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></Field>
      </div>
      <span className="block text-xs font-body text-stone-600 mb-2">المكوّنات المستهلكة</span>
      {form.components.map((c, idx) => (
        <div key={idx} className="grid grid-cols-12 gap-2 mb-2">
          <select className={`${inputCls} col-span-8`} value={c.itemId} onChange={(e) => updateComp(idx, { itemId: e.target.value })}><option value="">اختر الصنف</option>{items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}</select>
          <input type="number" className={`${inputCls} col-span-4 font-num`} value={c.qty} onChange={(e) => updateComp(idx, { qty: Number(e.target.value) })} />
        </div>
      ))}
      <button onClick={addComp} className="text-amber-700 text-xs font-body flex items-center gap-1 mt-1 mb-3"><Plus size={14} /> إضافة مكوّن</button>
      <p className="text-xs text-stone-400 font-body mb-3">سيتم خصم المكوّنات من المستودع وإضافة الصنف النهائي بتكلفة مرجّحة، دون التأثير على القيود المحاسبية (تحويل داخلي للمخزون).</p>
      <button onClick={onSubmit} className="w-full bg-amber-700 hover:bg-amber-800 text-white font-body py-2.5 rounded-lg text-sm">حفظ أمر التصنيع</button>
    </Modal>
  );
}

/* ============================== CRM ============================== */

function CRMView({ customers, invoices, onAdd }) {
  const { lang } = useLang();
  const [tab, setTab] = useState("customer");
  const list = customers.filter((c) => c.type === tab);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button onClick={() => setTab("customer")} className={`px-4 py-2 rounded-lg text-sm font-body ${tab === "customer" ? "bg-amber-700 text-white" : "bg-white border border-stone-200 text-stone-600"}`}>العملاء</button>
          <button onClick={() => setTab("supplier")} className={`px-4 py-2 rounded-lg text-sm font-body ${tab === "supplier" ? "bg-amber-700 text-white" : "bg-white border border-stone-200 text-stone-600"}`}>الموردون</button>
        </div>
        <button onClick={() => onAdd(tab)} className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white text-sm font-body px-4 py-2 rounded-lg"><Plus size={16} /> إضافة</button>
      </div>
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="text-stone-500 font-body text-xs border-b" style={{ backgroundColor: "#F5F0E4" }}><th className="text-right px-4 py-2.5">الاسم</th><th className="text-right px-4 py-2.5">الهاتف</th><th className="text-right px-4 py-2.5">عدد الفواتير</th><th className="text-right px-4 py-2.5">إجمالي التعامل</th></tr></thead>
          <tbody>
            {list.map((c) => {
              const related = invoices.filter((i) => i.customerId === c.id);
              const totalDeals = related.reduce((s, i) => s + i.total, 0);
              return (
                <tr key={c.id} className="border-b border-stone-50 last:border-0">
                  <td className="px-4 py-2.5 font-body text-stone-800">{c.name}</td>
                  <td className="px-4 py-2.5 font-num text-stone-500">{c.phone}</td>
                  <td className="px-4 py-2.5 font-num text-stone-600">{related.length}</td>
                  <td className="px-4 py-2.5 font-num font-semibold text-stone-900">{formatCurrency(totalDeals, lang)}</td>
                </tr>
              );
            })}
            {list.length === 0 && <EmptyRow colSpan={4} text="لا توجد جهات بعد." />}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-stone-400 font-body">ملاحظة: هذا دليل جهات اتصال وحجم تعامل إجمالي، وليس كشف حساب فرعي مفصّل (يتطلب ربط كل سطر قيد بالعميل، وهو خارج نطاق هذا العرض التجريبي).</p>
    </div>
  );
}

function CRMModal({ form, setForm, onSubmit, onClose }) {
  return (
    <Modal title="جهة اتصال جديدة" onClose={onClose}>
      <Field label="الاسم"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
      <Field label="الهاتف"><input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
      <Field label="النوع"><select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="customer">عميل</option><option value="supplier">مورد</option></select></Field>
      <button onClick={onSubmit} className="w-full bg-amber-700 hover:bg-amber-800 text-white font-body py-2.5 rounded-lg text-sm mt-2">حفظ</button>
    </Modal>
  );
}

/* ============================== HR ============================== */

function HRView({ employees, payrollRuns, onAdd, onRunPayroll }) {
  const { lang } = useLang();
  const totalSalaries = employees.reduce((s, e) => s + Number(e.salary), 0);
  const alreadyRanThisMonth = payrollRuns.some((p) => p.month === monthKey());
  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <button onClick={onAdd} className="flex items-center gap-2 bg-white border border-stone-300 text-stone-700 text-sm font-body px-4 py-2 rounded-lg"><Plus size={16} /> موظف جديد</button>
        <button disabled={alreadyRanThisMonth} onClick={onRunPayroll} className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800 disabled:bg-stone-300 text-white text-sm font-body px-4 py-2 rounded-lg">تشغيل رواتب هذا الشهر</button>
      </div>
      {alreadyRanThisMonth && <p className="text-xs text-emerald-700 font-body">✓ تم تشغيل رواتب هذا الشهر مسبقاً.</p>}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="text-stone-500 font-body text-xs border-b" style={{ backgroundColor: "#F5F0E4" }}><th className="text-right px-4 py-2.5">الاسم</th><th className="text-right px-4 py-2.5">المسمى الوظيفي</th><th className="text-right px-4 py-2.5">الراتب الشهري</th></tr></thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id} className="border-b border-stone-50 last:border-0"><td className="px-4 py-2.5 font-body text-stone-800">{e.name}</td><td className="px-4 py-2.5 font-body text-stone-500">{e.position}</td><td className="px-4 py-2.5 font-num text-stone-900 font-semibold">{formatCurrency(e.salary, lang)}</td></tr>
            ))}
          </tbody>
          <tfoot><tr className="border-t-2 border-stone-300"><td colSpan={2} className="px-4 py-3 font-body font-semibold text-stone-900">إجمالي الرواتب الشهرية</td><td className="px-4 py-3 font-num font-semibold text-stone-900">{formatCurrency(totalSalaries, lang)}</td></tr></tfoot>
        </table>
      </div>
      {payrollRuns.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b" style={{ backgroundColor: "#F5F0E4" }}><h3 className="font-display text-sm text-stone-800">سجل تشغيل الرواتب</h3></div>
          <table className="w-full text-sm">
            <tbody>{[...payrollRuns].reverse().map((p) => <tr key={p.id} className="border-b border-stone-50 last:border-0"><td className="px-4 py-2.5 font-num text-stone-500">{p.month}</td><td className="px-4 py-2.5 font-num font-semibold text-stone-900">{formatCurrency(p.total, lang)}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EmployeeModal({ form, setForm, onSubmit, onClose }) {
  return (
    <Modal title="موظف جديد" onClose={onClose}>
      <Field label="الاسم"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
      <Field label="المسمى الوظيفي"><input className={inputCls} value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} /></Field>
      <Field label="الراتب الشهري"><input type="number" className={`${inputCls} font-num`} value={form.salary} onChange={(e) => setForm({ ...form, salary: Number(e.target.value) })} /></Field>
      <button onClick={onSubmit} className="w-full bg-amber-700 hover:bg-amber-800 text-white font-body py-2.5 rounded-lg text-sm mt-2">حفظ</button>
    </Modal>
  );
}

/* ============================== Fixed Assets ============================== */

function FixedAssetsView({ fixedAssets, depreciationRuns, onAdd, onRunDepreciation }) {
  const { lang } = useLang();
  const alreadyRan = depreciationRuns.some((d) => d.month === monthKey());
  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <button onClick={onAdd} className="flex items-center gap-2 bg-white border border-stone-300 text-stone-700 text-sm font-body px-4 py-2 rounded-lg"><Plus size={16} /> أصل جديد</button>
        <button disabled={alreadyRan} onClick={onRunDepreciation} className="flex items-center gap-2 bg-amber-700 hover:bg-amber-800 disabled:bg-stone-300 text-white text-sm font-body px-4 py-2 rounded-lg">احتساب إهلاك هذا الشهر</button>
      </div>
      {alreadyRan && <p className="text-xs text-emerald-700 font-body">✓ تم احتساب إهلاك هذا الشهر مسبقاً.</p>}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="text-stone-500 font-body text-xs border-b" style={{ backgroundColor: "#F5F0E4" }}><th className="text-right px-4 py-2.5">الأصل</th><th className="text-right px-4 py-2.5">التكلفة</th><th className="text-right px-4 py-2.5">العمر (شهر)</th><th className="text-right px-4 py-2.5">مجمع الإهلاك</th><th className="text-right px-4 py-2.5">الصافي الدفتري</th></tr></thead>
          <tbody>
            {fixedAssets.map((a) => (
              <tr key={a.id} className="border-b border-stone-50 last:border-0">
                <td className="px-4 py-2.5 font-body text-stone-800">{a.name}</td>
                <td className="px-4 py-2.5 font-num text-stone-600">{formatCurrency(a.cost, lang)}</td>
                <td className="px-4 py-2.5 font-num text-stone-600">{a.usefulLifeMonths}</td>
                <td className="px-4 py-2.5 font-num text-red-700">{formatCurrency(a.accumulatedDepreciation, lang)}</td>
                <td className="px-4 py-2.5 font-num font-semibold text-stone-900">{formatCurrency(a.cost - a.accumulatedDepreciation, lang)}</td>
              </tr>
            ))}
            {fixedAssets.length === 0 && <EmptyRow colSpan={5} text="لا توجد أصول ثابتة بعد." />}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FixedAssetModal({ form, setForm, onSubmit, onClose }) {
  return (
    <Modal title="أصل ثابت جديد" onClose={onClose}>
      <Field label="اسم الأصل"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="التكلفة"><input type="number" className={`${inputCls} font-num`} value={form.cost} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} /></Field>
        <Field label="العمر الإنتاجي (بالأشهر)"><input type="number" className={`${inputCls} font-num`} value={form.usefulLifeMonths} onChange={(e) => setForm({ ...form, usefulLifeMonths: Number(e.target.value) })} /></Field>
      </div>
      <Field label="طريقة الدفع"><select className={inputCls} value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}><option value="cash">نقداً</option><option value="credit">آجل</option></select></Field>
      <button onClick={onSubmit} className="w-full bg-amber-700 hover:bg-amber-800 text-white font-body py-2.5 rounded-lg text-sm mt-2">حفظ وترحيل قيد الشراء</button>
    </Modal>
  );
}

/* ============================== Org Settings (branches / warehouses / cost centers) ============================== */

function OrgSettingsView({ branches, warehouses, costCenters, onAddBranch, onAddWarehouse, onAddCC }) {
  const [tab, setTab] = useState("branches");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  function submit() {
    if (!name.trim()) return;
    if (tab === "branches") onAddBranch({ name, city });
    if (tab === "warehouses") onAddWarehouse({ name });
    if (tab === "cc") onAddCC({ name });
    setName(""); setCity("");
  }
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setTab("branches")} className={`px-4 py-2 rounded-lg text-sm font-body ${tab === "branches" ? "bg-amber-700 text-white" : "bg-white border border-stone-200 text-stone-600"}`}>الفروع</button>
        <button onClick={() => setTab("warehouses")} className={`px-4 py-2 rounded-lg text-sm font-body ${tab === "warehouses" ? "bg-amber-700 text-white" : "bg-white border border-stone-200 text-stone-600"}`}>المستودعات</button>
        <button onClick={() => setTab("cc")} className={`px-4 py-2 rounded-lg text-sm font-body ${tab === "cc" ? "bg-amber-700 text-white" : "bg-white border border-stone-200 text-stone-600"}`}>مراكز التكلفة</button>
      </div>
      <div className="bg-white border border-stone-200 rounded-xl p-4 flex gap-2 items-end">
        <div className="flex-1"><Field label="الاسم"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field></div>
        {tab === "branches" && <div className="flex-1"><Field label="المدينة"><input className={inputCls} value={city} onChange={(e) => setCity(e.target.value)} /></Field></div>}
        <button onClick={submit} className="bg-amber-700 hover:bg-amber-800 text-white font-body px-4 py-2 rounded-lg text-sm mb-3">إضافة</button>
      </div>
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {tab === "branches" && branches.map((b) => <tr key={b.id} className="border-b border-stone-50 last:border-0"><td className="px-4 py-2.5 font-body text-stone-800">{b.name}</td><td className="px-4 py-2.5 font-body text-stone-500">{b.city}</td></tr>)}
            {tab === "warehouses" && warehouses.map((w) => <tr key={w.id} className="border-b border-stone-50 last:border-0"><td className="px-4 py-2.5 font-body text-stone-800">{w.name}</td></tr>)}
            {tab === "cc" && costCenters.map((c) => <tr key={c.id} className="border-b border-stone-50 last:border-0"><td className="px-4 py-2.5 font-body text-stone-800">{c.name}</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================== Users & Roles ============================== */

const PERMISSION_KEYS = ["dashboard", "accounts", "entries", "reports", "invoices", "pos", "inventory", "supplyProduction", "crm", "hr", "fixedAssets", "orgSettings", "usersRoles", "settings"];

function UsersRolesView({ roles, users, onAddRole, onAddUser, onTogglePermission }) {
  const [tab, setTab] = useState("users");
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setTab("users")} className={`px-4 py-2 rounded-lg text-sm font-body ${tab === "users" ? "bg-amber-700 text-white" : "bg-white border border-stone-200 text-stone-600"}`}>المستخدمون</button>
        <button onClick={() => setTab("roles")} className={`px-4 py-2 rounded-lg text-sm font-body ${tab === "roles" ? "bg-amber-700 text-white" : "bg-white border border-stone-200 text-stone-600"}`}>الأدوار والصلاحيات</button>
      </div>
      {tab === "users" && (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="text-stone-500 font-body text-xs border-b" style={{ backgroundColor: "#F5F0E4" }}><th className="text-right px-4 py-2.5">المستخدم</th><th className="text-right px-4 py-2.5">الدور</th></tr></thead>
            <tbody>{users.map((u) => <tr key={u.id} className="border-b border-stone-50 last:border-0"><td className="px-4 py-2.5 font-body text-stone-800">{u.name}</td><td className="px-4 py-2.5 font-body text-stone-500">{roles.find((r) => r.id === u.roleId)?.name}</td></tr>)}</tbody>
          </table>
          <div className="p-3 border-t border-stone-100"><button onClick={onAddUser} className="text-xs text-amber-700 font-body flex items-center gap-1"><Plus size={14} /> مستخدم جديد</button></div>
        </div>
      )}
      {tab === "roles" && (
        <div className="space-y-4">
          {roles.map((role) => (
            <div key={role.id} className="bg-white border border-stone-200 rounded-xl p-4">
              <h3 className="font-display text-sm text-stone-900 mb-3">{role.name}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PERMISSION_KEYS.map((k) => (
                  <label key={k} className="flex items-center gap-2 text-xs font-body text-stone-600">
                    <input type="checkbox" checked={role.permissions[k] !== false} onChange={() => onTogglePermission(role.id, k)} className="accent-amber-700" />
                    {k}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button onClick={onAddRole} className="text-xs text-amber-700 font-body flex items-center gap-1"><Plus size={14} /> دور جديد</button>
        </div>
      )}
    </div>
  );
}

/* ============================== Reports ============================== */

function ReportsView({ accounts, entries, costCenters }) {
  const { lang } = useLang();
  const [tab, setTab] = useState("trial");
  const [ledgerAccId, setLedgerAccId] = useState(accounts[0]?.id || "");

  const trialRows = accounts.map((a) => {
    const raw = entries.flatMap((e) => e.lines).filter((l) => l.accountId === a.id).reduce((s, l) => s + (Number(l.debit) || 0) - (Number(l.credit) || 0), 0);
    return { account: a, debit: raw >= 0 ? raw : 0, credit: raw < 0 ? -raw : 0 };
  });
  const totalDebit = trialRows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = trialRows.reduce((s, r) => s + r.credit, 0);

  const ledgerAcc = accounts.find((a) => a.id === ledgerAccId);
  const ledgerRows = [];
  if (ledgerAcc) {
    let running = 0;
    [...entries].sort((a, b) => (a.date > b.date ? 1 : -1)).forEach((e) => {
      e.lines.forEach((l) => {
        if (l.accountId !== ledgerAccId) return;
        const normal = ledgerAcc.normalOverride || TYPE_META[ledgerAcc.type].normal;
        const delta = normal === "debit" ? Number(l.debit || 0) - Number(l.credit || 0) : Number(l.credit || 0) - Number(l.debit || 0);
        running += delta;
        ledgerRows.push({ date: e.date, description: e.description, debit: l.debit, credit: l.credit, balance: running });
      });
    });
  }

  const ccRows = costCenters.map((cc) => {
    const related = entries.filter((e) => e.costCenterId === cc.id);
    const total = related.reduce((s, e) => s + e.lines.reduce((s2, l) => s2 + Number(l.debit || 0), 0), 0);
    return { costCenter: cc, count: related.length, total };
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setTab("trial")} className={`px-4 py-2 rounded-lg text-sm font-body ${tab === "trial" ? "bg-amber-700 text-white" : "bg-white border border-stone-200 text-stone-600"}`}>ميزان المراجعة</button>
        <button onClick={() => setTab("ledger")} className={`px-4 py-2 rounded-lg text-sm font-body ${tab === "ledger" ? "bg-amber-700 text-white" : "bg-white border border-stone-200 text-stone-600"}`}>كشف حساب</button>
        <button onClick={() => setTab("cc")} className={`px-4 py-2 rounded-lg text-sm font-body ${tab === "cc" ? "bg-amber-700 text-white" : "bg-white border border-stone-200 text-stone-600"}`}>مراكز التكلفة</button>
      </div>

      {tab === "trial" && (
        <div className="space-y-2">
          <ExportBar rows={trialRows.filter((r) => r.debit || r.credit).map((r) => ({ الحساب: `${r.account.code} - ${r.account.name}`, مدين: r.debit, دائن: r.credit }))} filename="trial-balance" />
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="text-stone-500 font-body text-xs border-b" style={{ backgroundColor: "#F5F0E4" }}><th className="text-right px-4 py-2.5">الحساب</th><th className="text-right px-4 py-2.5">مدين</th><th className="text-right px-4 py-2.5">دائن</th></tr></thead>
              <tbody>
                {trialRows.filter((r) => r.debit !== 0 || r.credit !== 0).map((r) => (
                  <tr key={r.account.id} className="border-b border-stone-50 last:border-0"><td className="px-4 py-2.5 font-body text-stone-800">{r.account.code} - {r.account.name}</td><td className="px-4 py-2.5 font-num text-stone-700">{r.debit ? formatCurrency(r.debit, lang) : "—"}</td><td className="px-4 py-2.5 font-num text-stone-700">{r.credit ? formatCurrency(r.credit, lang) : "—"}</td></tr>
                ))}
              </tbody>
              <tfoot><tr className="border-t-2 border-stone-300 font-semibold"><td className="px-4 py-3 font-body text-stone-900">الإجمالي {totalDebit === totalCredit ? <span className="text-emerald-700">(متوازن ✓)</span> : <span className="text-red-700">(غير متوازن ⚠)</span>}</td><td className="px-4 py-3 font-num text-stone-900">{formatCurrency(totalDebit, lang)}</td><td className="px-4 py-3 font-num text-stone-900">{formatCurrency(totalCredit, lang)}</td></tr></tfoot>
            </table>
          </div>
        </div>
      )}

      {tab === "ledger" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <select className={inputCls} style={{ maxWidth: 320 }} value={ledgerAccId} onChange={(e) => setLedgerAccId(e.target.value)}>{accounts.map((a) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}</select>
            <ExportBar rows={ledgerRows.map((r) => ({ التاريخ: r.date, البيان: r.description, مدين: r.debit || 0, دائن: r.credit || 0, الرصيد: r.balance }))} filename="account-ledger" />
          </div>
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="text-stone-500 font-body text-xs border-b" style={{ backgroundColor: "#F5F0E4" }}><th className="text-right px-4 py-2.5">التاريخ</th><th className="text-right px-4 py-2.5">البيان</th><th className="text-right px-4 py-2.5">مدين</th><th className="text-right px-4 py-2.5">دائن</th><th className="text-right px-4 py-2.5">الرصيد</th></tr></thead>
              <tbody>
                {ledgerRows.map((r, idx) => <tr key={idx} className="border-b border-stone-50 last:border-0"><td className="px-4 py-2.5 font-num text-stone-500">{r.date}</td><td className="px-4 py-2.5 font-body text-stone-800">{r.description}</td><td className="px-4 py-2.5 font-num text-stone-700">{r.debit ? formatCurrency(r.debit, lang) : "—"}</td><td className="px-4 py-2.5 font-num text-stone-700">{r.credit ? formatCurrency(r.credit, lang) : "—"}</td><td className="px-4 py-2.5 font-num font-semibold text-stone-900">{formatCurrency(r.balance, lang)}</td></tr>)}
                {ledgerRows.length === 0 && <EmptyRow colSpan={5} text="لا توجد حركات على هذا الحساب." />}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "cc" && (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="text-stone-500 font-body text-xs border-b" style={{ backgroundColor: "#F5F0E4" }}><th className="text-right px-4 py-2.5">مركز التكلفة</th><th className="text-right px-4 py-2.5">عدد القيود</th><th className="text-right px-4 py-2.5">إجمالي الحركة</th></tr></thead>
            <tbody>{ccRows.map((r) => <tr key={r.costCenter.id} className="border-b border-stone-50 last:border-0"><td className="px-4 py-2.5 font-body text-stone-800">{r.costCenter.name}</td><td className="px-4 py-2.5 font-num text-stone-600">{r.count}</td><td className="px-4 py-2.5 font-num font-semibold text-stone-900">{formatCurrency(r.total, lang)}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ============================== Settings & Help ============================== */

const HELP_TOPICS = [
  { q: "كيف أضيف حساباً محاسبياً جديداً؟", a: "من شاشة شجرة الحسابات، اضغط زر إضافة، ثم أدخل رمزاً فريداً واسماً ونوع الحساب (أصول/خصوم/حقوق ملكية/إيرادات/مصروفات)." },
  { q: "كيف أنشئ فاتورة وتُرحَّل تلقائياً؟", a: "من شاشة الفواتير اضغط فاتورة جديدة، اختر النوع والعميل/المورد والصنف والمستودع، وعند الحفظ يُنشأ القيد المحاسبي المرتبط ويُحدَّث المخزون تلقائياً." },
  { q: "ما معنى ميزان المراجعة المتوازن؟", a: "يعني أن إجمالي كل المبالغ المدينة عبر كل الحسابات يساوي إجمالي كل المبالغ الدائنة، وهو ضمان أساسي لسلامة نظام القيد المزدوج." },
  { q: "كيف تعمل الصلاحيات؟", a: "كل مستخدم مرتبط بدور، ولكل دور صلاحيات تحدد الشاشات التي يمكنه الوصول إليها. يمكن تعديل الصلاحيات من شاشة المستخدمون والصلاحيات." },
  { q: "ما الفرق بين نسخ Desktop والأونلاين والبرو؟", a: "Desktop تناسب العمل بدون إنترنت على شبكة محلية، الأونلاين تعتمد على مزامنة سحابية مستمرة، والبرو نسخة مبسطة للشركات الصغيرة بواجهة أقل تعقيداً." },
  { q: "كيف أُخرج مواد من أكثر من مستودع بفاتورة واحدة؟", a: "عند إضافة أسطر الفاتورة، اختر مستودعاً مختلفاً لكل سطر صنف حسب الحاجة." },
];

function SettingsView({ data, setData, allowedForEdition }) {
  const { lang, t } = useLang();
  const [openIdx, setOpenIdx] = useState(null);
  return (
    <div className="space-y-6">
      <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-4">
        <h3 className="font-display text-base text-stone-900">إعدادات عامة</h3>
        <Field label="اسم المنشأة"><input className={inputCls} value={data.meta.companyName} onChange={(e) => setData((d) => ({ ...d, meta: { ...d.meta, companyName: e.target.value } }))} /></Field>
        <Field label="اللغة / Language">
          <div className="flex gap-2">
            {["ar", "en"].map((l) => (
              <button key={l} onClick={() => setData((d) => ({ ...d, meta: { ...d.meta, language: l } }))} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-body border ${data.meta.language === l ? "bg-amber-700 text-white border-amber-700" : "border-stone-300 text-stone-600"}`}>
                <Globe size={14} /> {l === "ar" ? "العربية" : "English"}
              </button>
            ))}
          </div>
        </Field>
        <Field label="إصدار النظام">
          <div className="flex flex-wrap gap-2">
            {["desktop", "online", "pro"].map((ed) => (
              <button key={ed} onClick={() => setData((d) => ({ ...d, meta: { ...d.meta, edition: ed, uiMode: ed === "pro" ? "simple" : d.meta.uiMode } }))} className={`px-3 py-1.5 rounded-lg text-sm font-body border ${data.meta.edition === ed ? "bg-amber-700 text-white border-amber-700" : "border-stone-300 text-stone-600"}`}>
                {t(`edition_${ed}`)}
              </button>
            ))}
          </div>
        </Field>
        <Field label="مستوى تعقيد الواجهة">
          <div className="flex gap-2">
            {["simple", "standard", "advanced"].map((m) => (
              <button key={m} disabled={data.meta.edition === "pro"} onClick={() => setData((d) => ({ ...d, meta: { ...d.meta, uiMode: m } }))} className={`px-3 py-1.5 rounded-lg text-sm font-body border disabled:opacity-40 ${data.meta.uiMode === m ? "bg-amber-700 text-white border-amber-700" : "border-stone-300 text-stone-600"}`}>
                {t(`mode_${m}`)}
              </button>
            ))}
          </div>
          {data.meta.edition === "pro" && <p className="text-xs text-stone-400 font-body mt-1">نسخة برو تعمل دائماً بالواجهة المبسطة.</p>}
        </Field>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl p-4">
        <h3 className="font-display text-base text-stone-900 mb-3 flex items-center gap-2"><HelpCircle size={18} className="text-amber-700" /> دليل الاستخدام والمساعدة</h3>
        <div className="space-y-2">
          {HELP_TOPICS.map((topic, idx) => (
            <div key={idx} className="border border-stone-200 rounded-lg overflow-hidden">
              <button onClick={() => setOpenIdx(openIdx === idx ? null : idx)} className="w-full flex items-center justify-between px-3 py-2.5 text-right bg-stone-50 hover:bg-stone-100">
                <span className="font-body text-sm text-stone-800">{topic.q}</span>
                <ChevronDown size={16} className={`text-stone-400 transition-transform ${openIdx === idx ? "rotate-180" : ""}`} />
              </button>
              {openIdx === idx && <div className="px-3 py-2.5 text-sm font-body text-stone-600">{topic.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================== App ============================== */

export default function App() {
  const [data, setData] = useState(seedData());
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [toast, setToast] = useState("");

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountForm, setAccountForm] = useState({ code: "", name: "", type: "asset" });
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [entryForm, setEntryForm] = useState({ date: todayStr(), description: "", costCenterId: null, lines: [{ accountId: "", debit: 0, credit: 0 }, { accountId: "", debit: 0, credit: 0 }] });
  const [showItemModal, setShowItemModal] = useState(false);
  const [itemForm, setItemForm] = useState({ id: null, name: "", unit: "قطعة", barcodes: [], cost: 0, price: 0, stock: {} });
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({ type: "sale", paymentMethod: "cash", customerId: "", newPartyName: "", branchId: "b1", costCenterId: null, date: todayStr(), lines: [{ itemId: "", warehouseId: "w1", qty: 1, price: 0 }] });
  const [showPOModal, setShowPOModal] = useState(false);
  const [poForm, setPoForm] = useState({ supplierId: "", date: todayStr(), lines: [{ itemId: "", qty: 1 }] });
  const [showProdModal, setShowProdModal] = useState(false);
  const [prodForm, setProdForm] = useState({ finishedItemId: "", finishedQty: 1, warehouseId: "w1", components: [{ itemId: "", qty: 1 }] });
  const [showCRMModal, setShowCRMModal] = useState(false);
  const [crmForm, setCrmForm] = useState({ name: "", phone: "", type: "customer" });
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [empForm, setEmpForm] = useState({ name: "", position: "", salary: 0 });
  const [showFAModal, setShowFAModal] = useState(false);
  const [faForm, setFaForm] = useState({ name: "", cost: 0, usefulLifeMonths: 36, paymentMethod: "cash" });

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 2600); }

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY, false);
        if (res && res.value) setData(JSON.parse(res.value));
        else setData(seedData());
      } catch (err) {
        setData(seedData());
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try { await window.storage.set(STORAGE_KEY, JSON.stringify(data), false); } catch (err) { console.error("storage save failed", err); }
    })();
  }, [data, loaded]);

  const getAccountBalance = useCallback((account) => {
    let raw = 0;
    data.entries.forEach((e) => e.lines.forEach((l) => { if (l.accountId === account.id) raw += (Number(l.debit) || 0) - (Number(l.credit) || 0); }));
    const normal = account.normalOverride || TYPE_META[account.type].normal;
    return normal === "debit" ? raw : -raw;
  }, [data.entries]);
  const getTypeTotal = useCallback((type) => data.accounts.filter((a) => a.type === type).reduce((s, a) => s + getAccountBalance(a), 0), [data.accounts, getAccountBalance]);
  const findAcc = useCallback((code) => data.accounts.find((a) => a.code === code)?.id, [data.accounts]);

  const currentUser = data.users.find((u) => u.id === data.meta.activeUserId);
  const currentRole = data.roles.find((r) => r.id === currentUser?.roleId);
  const allowedKeys = (MODE_KEYS[data.meta.uiMode] || MODE_KEYS.advanced).filter((k) => !currentRole || currentRole.permissions[k] !== false);

  /* ---------- account / entry handlers ---------- */
  function openAccountModal() { setAccountForm({ code: "", name: "", type: "asset" }); setShowAccountModal(true); }
  function handleSaveAccount() {
    if (!accountForm.code.trim() || !accountForm.name.trim()) return showToast("يرجى إدخال رمز واسم الحساب");
    if (data.accounts.some((a) => a.code === accountForm.code.trim())) return showToast("رمز الحساب مستخدم مسبقاً");
    setData((d) => ({ ...d, accounts: [...d.accounts, { ...accountForm, id: uid("acc") }] }));
    setShowAccountModal(false); showToast("تمت إضافة الحساب ✓");
  }
  function openEntryModal() { setEntryForm({ date: todayStr(), description: "", costCenterId: null, lines: [{ accountId: "", debit: 0, credit: 0 }, { accountId: "", debit: 0, credit: 0 }] }); setShowEntryModal(true); }
  function handleSaveEntry() {
    const lines = entryForm.lines.filter((l) => l.accountId && (Number(l.debit) > 0 || Number(l.credit) > 0));
    const totalDebit = lines.reduce((s, l) => s + Number(l.debit || 0), 0);
    const totalCredit = lines.reduce((s, l) => s + Number(l.credit || 0), 0);
    if (lines.length < 2 || totalDebit !== totalCredit || totalDebit === 0) return showToast("القيد غير متوازن، تحقق من المبالغ");
    const newEntry = { id: uid("e"), no: data.entries.length + 1, date: entryForm.date, description: entryForm.description.trim() || "قيد يدوي", lines, posted: true, branchId: data.meta.activeBranchId, costCenterId: entryForm.costCenterId };
    setData((d) => ({ ...d, entries: [...d.entries, newEntry] }));
    setShowEntryModal(false); showToast("تم ترحيل القيد ✓");
  }

  /* ---------- item handlers ---------- */
  function openItemModal(item) { setItemForm(item ? { ...item } : { id: null, name: "", unit: "قطعة", barcodes: [], cost: 0, price: 0, stock: {} }); setShowItemModal(true); }
  function handleSaveItem() {
    if (!itemForm.name.trim()) return showToast("يرجى إدخال اسم الصنف");
    if (itemForm.id) setData((d) => ({ ...d, items: d.items.map((i) => (i.id === itemForm.id ? { ...itemForm } : i)) }));
    else setData((d) => ({ ...d, items: [...d.items, { ...itemForm, id: uid("item") }] }));
    setShowItemModal(false); showToast("تم حفظ الصنف ✓");
  }

  /* ---------- invoice handler (core auto-posting logic) ---------- */
  function openInvoiceModal() { setInvoiceForm({ type: "sale", paymentMethod: "cash", customerId: "", newPartyName: "", branchId: data.meta.activeBranchId, costCenterId: null, date: todayStr(), lines: [{ itemId: "", warehouseId: data.warehouses[0]?.id || "", qty: 1, price: 0 }] }); setShowInvoiceModal(true); }

  function postSaleOrPurchase(type, lines, partyName, customerId, paymentMethod, branchId, costCenterId, date, isPOS) {
    const validLines = lines.filter((l) => l.itemId && Number(l.qty) > 0);
    if (validLines.length === 0) return null;
    const total = validLines.reduce((s, l) => s + Number(l.qty) * Number(l.price), 0);

    const newItems = data.items.map((item) => {
      const line = validLines.find((l) => l.itemId === item.id);
      if (!line) return item;
      const qty = Number(line.qty);
      const wId = line.warehouseId || data.warehouses[0]?.id;
      if (type === "sale") {
        return { ...item, stock: { ...item.stock, [wId]: (Number(item.stock?.[wId]) || 0) - qty } };
      }
      const oldQty = Number(item.stock?.[wId]) || 0;
      const oldCost = Number(item.cost);
      const newQty = oldQty + qty;
      const newCost = newQty > 0 ? (oldQty * oldCost + qty * Number(line.price)) / newQty : Number(line.price);
      return { ...item, cost: Math.round(newCost * 100) / 100, stock: { ...item.stock, [wId]: newQty } };
    });

    const cashId = findAcc("1001"), arId = findAcc("1003"), invId = findAcc("1004"), apId = findAcc("2001"), salesId = findAcc("4001"), cogsId = findAcc("5001");
    let entryLines = [];
    if (type === "sale") {
      const settleAcc = paymentMethod === "cash" ? cashId : arId;
      entryLines.push({ accountId: settleAcc, debit: total, credit: 0 });
      entryLines.push({ accountId: salesId, debit: 0, credit: total });
      const totalCost = validLines.reduce((s, l) => { const item = data.items.find((i) => i.id === l.itemId); return s + Number(l.qty) * Number(item ? item.cost : 0); }, 0);
      if (totalCost > 0) { entryLines.push({ accountId: cogsId, debit: totalCost, credit: 0 }); entryLines.push({ accountId: invId, debit: 0, credit: totalCost }); }
    } else {
      const settleAcc = paymentMethod === "cash" ? cashId : apId;
      entryLines.push({ accountId: invId, debit: total, credit: 0 });
      entryLines.push({ accountId: settleAcc, debit: 0, credit: total });
    }

    const invoiceNo = data.invoices.length + 1;
    const newInvoice = { id: uid("inv"), no: invoiceNo, type, partyName, customerId: customerId || null, paymentMethod, branchId, costCenterId, date, lines: validLines, total };
    const newEntry = { id: uid("e"), no: data.entries.length + 1, date, description: `قيد آلي - فاتورة ${type === "sale" ? "مبيعات" : "مشتريات"} رقم ${invoiceNo} (${partyName})${isPOS ? " - نقطة بيع" : ""}`, lines: entryLines, posted: true, branchId, costCenterId, invoiceId: newInvoice.id };

    setData((d) => ({ ...d, items: newItems, invoices: [...d.invoices, newInvoice], entries: [...d.entries, newEntry] }));
    return newInvoice;
  }

  function handleSaveInvoice() {
    let partyName = "";
    let customerId = invoiceForm.customerId;
    if (customerId === "__new__") {
      if (!invoiceForm.newPartyName.trim()) return showToast("يرجى إدخال اسم الجهة الجديدة");
      partyName = invoiceForm.newPartyName.trim();
      const newContact = { id: uid("c"), name: partyName, type: invoiceForm.type === "sale" ? "customer" : "supplier", phone: "" };
      setData((d) => ({ ...d, customers: [...d.customers, newContact] }));
      customerId = newContact.id;
    } else {
      const c = data.customers.find((x) => x.id === customerId);
      if (!c) return showToast("يرجى اختيار العميل/المورد");
      partyName = c.name;
    }
    const result = postSaleOrPurchase(invoiceForm.type, invoiceForm.lines, partyName, customerId, invoiceForm.paymentMethod, invoiceForm.branchId, invoiceForm.costCenterId, invoiceForm.date, false);
    if (!result) return showToast("يرجى إكمال بيانات الفاتورة");
    setShowInvoiceModal(false); showToast("تم حفظ الفاتورة وترحيل القيد تلقائياً ✓");
  }

  function handlePOSCheckout(cartLines, warehouseId) {
    const lines = cartLines.map((l) => ({ itemId: l.itemId, warehouseId, qty: l.qty, price: l.price }));
    postSaleOrPurchase("sale", lines, "عميل نقدي", null, "cash", data.meta.activeBranchId, null, todayStr(), true);
    showToast("تم إتمام عملية البيع ✓");
  }

  /* ---------- purchase orders / production ---------- */
  function handleSavePO() {
    const lines = poForm.lines.filter((l) => l.itemId && Number(l.qty) > 0);
    if (!poForm.supplierId || lines.length === 0) return showToast("يرجى إكمال بيانات أمر الشراء");
    const newPO = { id: uid("po"), no: data.purchaseOrders.length + 1, supplierId: poForm.supplierId, date: poForm.date, lines, status: "open" 
