import React, { useState, useEffect, createContext, useContext } from "react";

/* ============================== Context & Global Helpers ============================== */
const LangContext = createContext();

// دالة لتوليد معرف فريد وبسيط
function uid(prefix = "") {
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
}

// دالة لجلب تاريخ اليوم بصيغة YYYY-MM-DD
function todayStr() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

// دالة لجلب السنة والشهر الحاليين لمعالجة العمليات الدورية كالإهلاك والرواتب (YYYY-MM)
function monthKey() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${month}`;
}

/* ============================== Translations Dictionary (STR) ============================== */
const STR = {
  ar: {
    app_title: "الأمين لايت",
    title_dashboard: "لوحة التحكم",
    sub_dashboard: "ملخص مالي ومخزني سريع لأداء شركتك",
    title_accounts: "شجرة الحسابات",
    sub_accounts: "إدارة الحسابات المالية وتصنيفاتها المعتمدة",
    title_entries: "القيود اليومية",
    sub_entries: "تسجيل وترحيل القيود المحاسبية المزدوجة يدوياً",
    title_inventory: "إدارة المخزون",
    sub_inventory: "إدارة الأصناف، وحداتها، ومراقبة الكميات بالمستودعات",
    title_invoices: "الفواتير",
    sub_invoices: "إنشاء وإصدار فواتير المبيعات والمشتريات والربط المحاسبي",
    title_pos: "نقطة البيع (POS)",
    sub_pos: "واجهة بيع سريعة للمبيعات المباشرة وربطها بالصندوق والمخزن",
    title_supplyProduction: "التصنيع وسلاسل الإمداد",
    sub_supplyProduction: "أوامر الشراء وإدارة عمليات التصنيع وتحويل المواد",
    title_crm: "العملاء والمبيعات (CRM)",
    sub_crm: "بيانات العملاء، الموردين وتتبع تفاعلاتهم",
    title_hr: "الموارد البشرية والرواتب",
    sub_hr: "ملفات الموظفين واحتساب مسيرات الرواتب الشهرية والقيود الخاصة بها",
    title_fixedAssets: "الأصول الثابتة",
    sub_fixedAssets: "تسجيل الأصول، فترات عمرها الإنتاجي، والاحتساب التلقائي للإهلاك",
    title_orgSettings: "الفروع والمراكز",
    sub_orgSettings: "تهيئة فروع الشركة، مستودعاتها، ومراكز التكلفة المتاحة",
    title_usersRoles: "المستخدمين والصلاحيات",
    sub_usersRoles: "توزيع الصلاحيات وأدوار الموظفين لضبط الأمان والنظام",
    title_reports: "التقارير المالية",
    sub_reports: "استخراج القوائم المالية، ميزان المراجعة، وتقارير مراكز التكلفة",
    title_settings: "الإعدادات العامة",
    sub_settings: "ضبط لغة الواجهة الأساسية والنسخ الاحتياطي للبيانات المحلية",
  },
  en: {
    app_title: "Al-Ameen Lite",
    title_dashboard: "Dashboard",
    sub_dashboard: "Quick financial & inventory performance overview",
    title_accounts: "Chart of Accounts",
    sub_accounts: "Manage financial accounts and their classifications",
    title_entries: "Journal Entries",
    sub_entries: "Record and post double-entry bookkeeping manually",
    title_inventory: "Inventory Management",
    sub_inventory: "Items, units, and stock tracking across warehouses",
    title_invoices: "Invoices",
    sub_invoices: "Issue sales/purchase invoices linked to finance and stock",
    title_pos: "Point of Sale (POS)",
    sub_pos: "Fast checkout interface linked directly to cash & inventory",
    title_supplyProduction: "Supply & Production",
    sub_supplyProduction: "Purchase orders, production cycles, and BOM",
    title_crm: "CRM",
    sub_crm: "Customers, suppliers data, and sales opportunities",
    title_hr: "HR & Payroll",
    sub_hr: "Employee profiles, monthly payroll processing & journal auto-posts",
    title_fixedAssets: "Fixed Assets",
    sub_fixedAssets: "Assets register, useful life tracking, and depreciation runs",
    title_orgSettings: "Branches & Centers",
    sub_orgSettings: "Setup company branches, warehouses, and cost centers",
    title_usersRoles: "Users & Permissions",
    sub_usersRoles: "Distribute permissions and user roles to ensure security",
    title_reports: "Financial Reports",
    sub_reports: "Extract financial statements, Trial Balance & cost center analyses",
    title_settings: "General Settings",
    sub_settings: "Configure main UI language and local data backups",
  }
};

/* ============================== Dummy Initial Data ============================== */
const INITIAL_DATA = {
  meta: {
    language: "ar",
    activeBranchId: "b1",
    activeWarehouseId: "w1",
    activeUserId: "u1"
  },
  users: [
    { id: "u1", name: "أحمد محاسب النظام", roleId: "r1" },
    { id: "u2", name: "خالد مسؤول المستودع", roleId: "r2" }
  ],
  roles: [
    { id: "r1", name: "مدير النظام / محاسب رئيسي", permissions: { dashboard: true, accounts: true, entries: true, inventory: true, invoices: true, pos: true, supplyProduction: true, crm: true, hr: true, fixedAssets: true, orgSettings: true, usersRoles: true, reports: true, settings: true } },
    { id: "r2", name: "أمين مخزن", permissions: { dashboard: true, accounts: false, entries: false, inventory: true, invoices: true, pos: false, supplyProduction: true, crm: false, hr: false, fixedAssets: false, orgSettings: false, usersRoles: false, reports: false, settings: false } }
  ],
  branches: [
    { id: "b1", name: "الفرع الرئيسي - الرياض" },
    { id: "b2", name: "فرع الغربية - جدة" }
  ],
  warehouses: [
    { id: "w1", name: "المستودع المركزي", branchId: "b1" },
    { id: "w2", name: "مستودع العرض المباشر", branchId: "b1" }
  ],
  costCenters: [
    { id: "cc1", name: "قسم المشاريع الإنشائية" },
    { id: "cc2", name: "قسم المبيعات والتسويق" }
  ],
  accounts: [
    { id: "a1", code: "1001", name: "الصندوق", type: "asset", parentId: null },
    { id: "a2", code: "1002", name: "البنك العربي", type: "asset", parentId: null },
    { id: "a3", code: "1003", name: "الذمم المدينة (العملاء)", type: "asset", parentId: null },
    { id: "a4", code: "1004", name: "مخزون المواد الجاهزة", type: "asset", parentId: null },
    { id: "a5", code: "1005", name: "الأصول الثابتة - آلات ومعدات", type: "asset", parentId: null },
    { id: "a6", code: "1006", name: "مجمع إهلاك الأصول الثابتة", type: "asset", parentId: null },
    { id: "a7", code: "2001", name: "الذمم الدائنة (الموردين)", type: "liability", parentId: null },
    { id: "a8", code: "3001", name: "رأس المال المدفوع", type: "equity", parentId: null },
    { id: "a9", code: "4001", name: "إيرادات المبيعات الرئيسية", type: "revenue", parentId: null },
    { id: "a10", code: "5001", name: "تكلفة البضاعة المباعة", type: "expense", parentId: null },
    { id: "a11", code: "5002", name: "مصروفات الرواتب والأجور", type: "expense", parentId: null }
  ],
  entries: [
    {
      id: "e1",
      no: 1,
      date: "2026-01-01",
      description: "القيد الافتتاحي - بدء النشاط برأس مال بالصندوق",
      posted: true,
      branchId: "b1",
      costCenterId: null,
      lines: [
        { accountId: "a1", debit: 100000, credit: 0 },
        { accountId: "a8", debit: 0, credit: 100000 }
      ]
    }
  ],
  items: [
    { id: "it1", name: "شاشة كمبيوتر 27 بوصة", unit: "قطعة", barcodes: ["628100200"], cost: 600, price: 850, stock: { w1: 50, w2: 12 } },
    { id: "it2", name: "لوحة مفاتيح ميكانيكية", unit: "قطعة", barcodes: ["628100300"], cost: 120, price: 180, stock: { w1: 100, w2: 5 } }
  ],
  invoices: [],
  purchaseOrders: [],
  productionOrders: [],
  customers: [
    { id: "c1", name: "شركة النخبة للتجارة", phone: "0500000001", type: "customer" },
    { id: "s1", name: "مؤسسة التوريدات المتقدمة", phone: "0500000002", type: "supplier" }
  ],
  employees: [
    { id: "emp1", name: "سعيد محمد", position: "مهندس برمجيات", salary: 12000 }
  ],
  payrollRuns: [],
  fixedAssets: [],
  depreciationRuns: []
};

/* ============================== Simple UI Components ============================== */
function Sidebar({ active, setActive, data, allowedKeys }) {
  return (
    <aside className="w-64 bg-stone-900 text-stone-300 flex-col hidden md:flex min-h-screen border-l border-stone-800">
      <div className="p-5 border-b border-stone-800 flex items-center gap-2">
        <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
        <h1 className="font-display font-bold text-lg text-white">الأمين لايت ERP</h1>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {allowedKeys.map((key) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={`w-full text-right px-3 py-2 rounded-lg text-sm font-body transition-all flex items-center justify-between ${
              active === key ? "bg-stone-800 text-white font-medium" : "hover:bg-stone-800/50 text-stone-400"
            }`}
          >
            <span>{STR[data.meta.language || "ar"][`title_${key}`]}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

function TopNav({ active, setActive, allowedKeys }) {
  return (
    <header className="bg-stone-900 text-stone-300 md:hidden flex items-center justify-between px-4 py-3 border-b border-stone-800">
      <h1 className="font-display font-bold text-sm text-white">الأمين لايت ERP</h1>
      <select
        value={active}
        onChange={(e) => setActive(e.target.value)}
        className="bg-stone-800 text-xs rounded border border-stone-700 px-2 py-1 text-white font-body focus:outline-none"
      >
        {allowedKeys.map((key) => (
          <option key={key} value={key}>{STR.ar[`title_${key}`]}</option>
        ))}
      </select>
    </header>
  );
}

/* --- Views & Forms --- */
function DashboardView({ data, getAccountBalance, getTypeTotal }) {
  const t = useContext(LangContext).t;
  const cashBalance = getAccountBalance("a1"); // الصندوق
  const assetsTotal = getTypeTotal("asset");
  const liabilitiesTotal = getTypeTotal("liability");
  const revenuesTotal = getTypeTotal("revenue");
  const expensesTotal = getTypeTotal("expense");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
          <p className="text-xs text-stone-400 font-body">سيولة الصندوق</p>
          <p className="text-2xl font-display font-semibold text-stone-800 mt-1">{cashBalance} <span className="text-xs text-stone-500">ر.س</span></p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
          <p className="text-xs text-stone-400 font-body">إجمالي الأصول</p>
          <p className="text-2xl font-display font-semibold text-stone-800 mt-1">{assetsTotal} <span className="text-xs text-stone-500">ر.س</span></p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
          <p className="text-xs text-stone-400 font-body">إجمالي الإيرادات</p>
          <p className="text-2xl font-display font-semibold text-emerald-600 mt-1">+{revenuesTotal} <span className="text-xs text-stone-500">ر.س</span></p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
          <p className="text-xs text-stone-400 font-body">إجمالي المصروفات</p>
          <p className="text-2xl font-display font-semibold text-rose-600 mt-1">-{expensesTotal} <span className="text-xs text-stone-500">ر.س</span></p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
        <h3 className="font-display font-semibold text-stone-800 text-sm mb-4">قائمة المركز المالي المبسطة</h3>
        <div className="space-y-3 font-body text-sm">
          <div className="flex justify-between border-b pb-2">
            <span>الأصول (Assets)</span>
            <span className="font-semibold">{assetsTotal} ر.س</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span>الالتزامات (Liabilities)</span>
            <span className="font-semibold text-rose-600">{liabilitiesTotal} ر.س</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span>حقوق الملكية (Equity)</span>
            <span className="font-semibold text-stone-700">{getTypeTotal("equity")} ر.س</span>
          </div>
          <div className="flex justify-between pt-2 text-emerald-700 font-semibold bg-emerald-50 px-2 rounded">
            <span>الأرباح التشغيلية الحالية (Net Income)</span>
            <span>{revenuesTotal - expensesTotal} ر.س</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountsView({ accounts, getAccountBalance, onAdd }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-stone-200 flex items-center justify-between">
        <h3 className="font-display font-semibold text-sm text-stone-800">دليل شجرة الحسابات المعتمدة</h3>
        <button onClick={onAdd} className="bg-stone-900 hover:bg-stone-800 text-white text-xs px-3 py-1.5 rounded-lg font-body transition-all">إضافة حساب +</button>
      </div>
      <table className="w-full text-right text-sm font-body">
        <thead className="bg-stone-50 text-stone-500 text-xs">
          <tr>
            <th className="p-3">رمز الحساب</th>
            <th className="p-3">اسم الحساب</th>
            <th className="p-3">النوع الإداري</th>
            <th className="p-3">الرصيد الحالي</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100 text-stone-700">
          {accounts.map((acc) => (
            <tr key={acc.id} className="hover:bg-stone-50/50">
              <td className="p-3 font-mono font-bold text-stone-900">{acc.code}</td>
              <td className="p-3 font-semibold">{acc.name}</td>
              <td className="p-3"><span className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded text-xs">{acc.type}</span></td>
              <td className="p-3 font-bold text-stone-800">{getAccountBalance(acc.id)} ر.س</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EntriesView({ entries, accounts, costCenters, onAdd }) {
  const getAccountName = (id) => accounts.find((a) => a.id === id)?.name || "غير محدد";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-sm text-stone-800">دفتر القيود اليومية المحاسبية</h3>
        <button onClick={onAdd} className="bg-stone-900 hover:bg-stone-800 text-white text-xs px-3 py-1.5 rounded-lg font-body transition-all">إنشاء قيد يدوي +</button>
      </div>

      <div className="space-y-4">
        {entries.map((entry) => (
          <div key={entry.id} className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden p-5 space-y-3">
            <div className="flex items-center justify-between border-b pb-3 border-stone-100">
              <div>
                <span className="text-xs bg-stone-100 text-stone-600 font-mono px-2 py-1 rounded">قيد رقم #{entry.no}</span>
                <p className="text-xs text-stone-400 font-body mt-1">{entry.date} - {entry.description}</p>
              </div>
              {entry.costCenterId && (
                <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-1 rounded">
                  مركز التكلفة: {costCenters.find((c) => c.id === entry.costCenterId)?.name}
                </span>
              )}
            </div>

            <table className="w-full text-right text-xs font-body">
              <thead>
                <tr className="text-stone-400">
                  <th className="pb-2">اسم الحساب المالي</th>
                  <th className="pb-2 text-left">مدين (Debit)</th>
                  <th className="pb-2 text-left">دائن (Credit)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {entry.lines.map((l, i) => (
                  <tr key={i} className="text-stone-700">
                    <td className="py-2">{getAccountName(l.accountId)}</td>
                    <td className="py-2 text-left font-semibold text-stone-800">{l.debit > 0 ? `${l.debit} ر.س` : "—"}</td>
                    <td className="py-2 text-left font-semibold text-stone-800">{l.credit > 0 ? `${l.credit} ر.س` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}

function InventoryView({ items, warehouses, onAdd, onEdit }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-stone-200 flex items-center justify-between">
        <h3 className="font-display font-semibold text-sm text-stone-800">بيان مستويات المخازن والأصناف</h3>
        <button onClick={onAdd} className="bg-stone-900 hover:bg-stone-800 text-white text-xs px-3 py-1.5 rounded-lg font-body transition-all">إضافة صنف جديد +</button>
      </div>
      <table className="w-full text-right text-sm font-body">
        <thead className="bg-stone-50 text-stone-500 text-xs">
          <tr>
            <th className="p-3">اسم الصنف</th>
            <th className="p-3">وحدة القياس</th>
            <th className="p-3">سعر التكلفة</th>
            <th className="p-3">سعر البيع</th>
            <th className="p-3">الكميات بمستودع (المستودع المركزي)</th>
            <th className="p-3 text-left">إجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100 text-stone-700">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-stone-50/50">
              <td className="p-3 font-semibold">{item.name}</td>
              <td className="p-3 text-stone-500 text-xs">{item.unit}</td>
              <td className="p-3">{item.cost} ر.س</td>
              <td className="p-3 font-semibold text-emerald-600">{item.price} ر.س</td>
              <td className="p-3 font-bold text-stone-800">{item.stock?.w1 || 0} وحدة</td>
              <td className="p-3 text-left">
                <button onClick={() => onEdit(item)} className="text-xs text-stone-500 hover:text-stone-900 font-semibold underline">تعديل</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InvoicesView({ invoices, branches, onAdd }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-sm text-stone-800">سجل فواتير المبيعات والمشتريات</h3>
        <button onClick={onAdd} className="bg-stone-900 hover:bg-stone-800 text-white text-xs px-3 py-1.5 rounded-lg font-body transition-all">إصدار فاتورة جديدة +</button>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <table className="w-full text-right text-sm font-body">
          <thead className="bg-stone-50 text-stone-500 text-xs">
            <tr>
              <th className="p-3">الرقم التلقائي</th>
              <th className="p-3">النوع</th>
              <th className="p-3">تاريخ الإصدار</th>
              <th className="p-3">الطرف الثاني</th>
              <th className="p-3">طريقة الدفع</th>
              <th className="p-3 text-left">الإجمالي النهائي</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-stone-700">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-stone-50/50">
                <td className="p-3 font-mono">#{inv.no}</td>
                <td className="p-3 font-semibold">
                  <span className={`px-2 py-0.5 rounded text-xs ${inv.type === "sale" ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"}`}>
                    {inv.type === "sale" ? "مبيعات" : "مشتريات"}
                  </span>
                </td>
                <td className="p-3 text-stone-500 text-xs">{inv.date}</td>
                <td className="p-3 font-semibold">{inv.partyName}</td>
                <td className="p-3 text-xs">{inv.paymentMethod === "cash" ? "نقدي" : "آجل"}</td>
                <td className="p-3 text-left font-bold text-stone-800">{inv.total} ر.س</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function POSView({ items, warehouses, onCheckout }) {
  const [cart, setCart] = useState([]);
  const [warehouseId, setWarehouseId] = useState("w1");

  function addToCart(item) {
    const existing = cart.find((c) => c.itemId === item.id);
    if (existing) {
      setCart(cart.map((c) => (c.itemId === item.id ? { ...c, qty: c.qty + 1 } : c)));
    } else {
      setCart([...cart, { itemId: item.id, name: item.name, qty: 1, price: item.price }]);
    }
  }

  function updateCartQty(itemId, newQty) {
    if (newQty <= 0) {
      setCart(cart.filter((c) => c.itemId !== itemId));
    } else {
      setCart(cart.map((c) => (c.itemId === itemId ? { ...c, qty: newQty } : c)));
    }
  }

  const total = cart.reduce((sum, item) => sum + item.qty * item.price, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* الأصناف المتاحة */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
          <span className="text-sm font-semibold text-stone-800">اختر المستودع للبيع المباشر:</span>
          <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className="bg-stone-50 border border-stone-200 text-xs rounded px-2 py-1 focus:outline-none">
            {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((item) => (
            <div key={item.id} onClick={() => addToCart(item)} className="bg-white p-4 rounded-xl border border-stone-200 hover:border-stone-400 transition-all cursor-pointer flex flex-col justify-between">
              <div>
                <h4 className="font-semibold text-stone-800 text-sm font-display">{item.name}</h4>
                <p className="text-xs text-stone-400 font-body mt-1">الرصيد المتاح: {item.stock[warehouseId] || 0} {item.unit}</p>
              </div>
              <div className="flex items-center justify-between mt-4 border-t pt-3 border-stone-50">
                <span className="text-xs font-mono text-stone-400">باركود: {item.barcodes[0] || "—"}</span>
                <span className="text-sm font-bold text-emerald-600">{item.price} ر.س</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* سلة البيع والدفع */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm h-fit space-y-4">
        <h3 className="font-display font-semibold text-stone-800 text-sm">سلة المبيعات النشطة</h3>

        {cart.length === 0 ? (
          <p className="text-stone-400 text-xs text-center py-10 font-body">السلة فارغة حالياً. انقر على الأصناف للبدء.</p>
        ) : (
          <>
            <div className="divide-y divide-stone-100 max-h-60 overflow-y-auto space-y-2">
              {cart.map((item) => (
                <div key={item.itemId} className="flex items-center justify-between text-xs font-body py-2">
                  <div>
                    <p className="font-semibold text-stone-800">{item.name}</p>
                    <p className="text-stone-400">{item.price} ر.س / وحدة</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateCartQty(item.itemId, item.qty - 1)} className="bg-stone-100 hover:bg-stone-200 rounded h-5 w-5 flex items-center justify-center font-bold">-</button>
                    <span className="font-bold">{item.qty}</span>
                    <button onClick={() => updateCartQty(item.itemId, item.qty + 1)} className="bg-stone-100 hover:bg-stone-200 rounded h-5 w-5 flex items-center justify-center font-bold">+</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm font-semibold text-stone-800">
                <span>الإجمالي الإجمالي</span>
                <span>{total} ر.س</span>
              </div>
              <button
                onClick={() => {
                  onCheckout(cart, warehouseId);
                  setCart([]);
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-body py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all"
              >
                دفع وطباعة فاتورة نقدية (ر.س)
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SupplyProductionView({ purchaseOrders, productionOrders, customers, items, onAddPO, onAddProd, onRunProd }) {
  const getSupplierName = (id) => customers.find((c) => c.id === id)?.name || "مورد مجهول";
  const getItemName = (id) => items.find((i) => i.id === id)?.name || "صنف مجهول";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* أوامر الشراء المجدولة */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-stone-100">
            <h3 className="font-display font-semibold text-stone-800 text-sm">أوامر الشراء ومتابعة الموردين</h3>
            <button onClick={onAddPO} className="bg-stone-950 text-white text-xs px-2.5 py-1.5 rounded font-body">أمر شراء جديد +</button>
          </div>
          <div className="space-y-3">
            {purchaseOrders.length === 0 ? <p className="text-xs text-stone-400 py-4 text-center">لا توجد طلبات شراء مسجلة</p> : null}
            {purchaseOrders.map((po) => (
              <div key={po.id} className="border border-stone-100 rounded-lg p-3 text-xs font-body space-y-2 bg-stone-50/50">
                <div className="flex justify-between font-bold">
                  <span>طلب شراء #{po.no}</span>
                  <span className="text-stone-400">{po.date}</span>
                </div>
                <p className="text-stone-600">المورد: {getSupplierName(po.supplierId)}</p>
                <div className="bg-white p-2 rounded border border-stone-100 text-[11px] text-stone-500">
                  {po.lines.map((l, i) => <div key={i}>{getItemName(l.itemId)} × {l.qty} وحدة</div>)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* أوامر وعمليات التصنيع */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-stone-100">
            <h3 className="font-display font-semibold text-stone-800 text-sm">أوامر التصنيع ومراقبة الإنتاج</h3>
            <button onClick={onAddProd} className="bg-stone-950 text-white text-xs px-2.5 py-1.5 rounded font-body">تشغيل دورة تصنيع +</button>
          </div>
          <div className="space-y-3">
            {productionOrders.length === 0 ? <p className="text-xs text-stone-400 py-4 text-center">لم تطلق أي عمليات تصنيع حتى الآن</p> : null}
            {productionOrders.map((po) => (
              <div key={po.id} className="border border-stone-100 rounded-lg p-3 text-xs font-body space-y-2 bg-stone-50/50">
                <div className="flex justify-between font-bold items-center">
                  <span>عملية إنتاج #{po.no}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] ${po.status === "done" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                    {po.status === "done" ? "منتهية" : "جاري المعالجة"}
                  </span>
                </div>
                <p className="text-stone-800 font-semibold">الصنف المستهدف: {getItemName(po.finishedItemId)} (×{po.finishedQty})</p>
                {po.status === "pending" && (
                  <button onClick={() => onRunProd(po)} className="w-full bg-stone-900 text-stone-50 hover:bg-black font-semibold text-[11px] py-1 rounded transition-all">تأكيد سحب المكونات وإنهاء التصنيع</button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CRMView({ customers, invoices, onAdd }) {
  const customerList = customers.filter((c) => c.type === "customer");
  const supplierList = customers.filter((c) => c.type === "supplier");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b pb-2 border-stone-100">
            <h3 className="font-display font-semibold text-stone-800 text-sm">سجل بيانات العملاء</h3>
            <button onClick={() => onAdd("customer")} className="bg-stone-900 text-white text-xs px-2 py-1 rounded font-body">+ عميل</button>
          </div>
          <table className="w-full text-right text-xs font-body">
            <thead>
              <tr className="text-stone-400">
                <th className="pb-2">الاسم</th>
                <th className="pb-2">رقم التواصل</th>
              </tr>
            </thead>
            <tbody>
              {customerList.map((c) => (
                <tr key={c.id} className="text-stone-700">
                  <td className="py-2 font-semibold">{c.name}</td>
                  <td className="py-2">{c.phone || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b pb-2 border-stone-100">
            <h3 className="font-display font-semibold text-stone-800 text-sm">سجل الموردين المعتمدين</h3>
            <button onClick={() => onAdd("supplier")} className="bg-stone-900 text-white text-xs px-2 py-1 rounded font-body">+ مورد</button>
          </div>
          <table className="w-full text-right text-xs font-body">
            <thead>
              <tr className="text-stone-400">
                <th className="pb-2">الاسم</th>
                <th className="pb-2">رقم التواصل</th>
              </tr>
            </thead>
            <tbody>
              {supplierList.map((s) => (
                <tr key={s.id} className="text-stone-700">
                  <td className="py-2 font-semibold">{s.name}</td>
                  <td className="py-2">{s.phone || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function HRView({ employees, payrollRuns, onAdd, onRunPayroll }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-sm text-stone-800">بيانات الموظفين والرواتب</h3>
        <div className="flex gap-2">
          <button onClick={onAdd} className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs px-3 py-1.5 rounded-lg font-body transition-all">إضافة موظف +</button>
          <button onClick={onRunPayroll} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg font-body transition-all">تشغيل الرواتب هذا الشهر ⚙️</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          <table className="w-full text-right text-sm font-body">
            <thead className="bg-stone-50 text-stone-500 text-xs">
              <tr>
                <th className="p-3">اسم الموظف</th>
                <th className="p-3">المسمى الوظيفي</th>
                <th className="p-3">الراتب الأساسي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {employees.map((e) => (
                <tr key={e.id} className="hover:bg-stone-50/50">
                  <td className="p-3 font-semibold">{e.name}</td>
                  <td className="p-3 text-stone-500 text-xs">{e.position}</td>
                  <td className="p-3 font-bold text-stone-800">{e.salary} ر.س</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-4 h-fit">
          <h3 className="font-display font-semibold text-stone-800 text-sm">مسيرات الرواتب المصروفة</h3>
          <div className="space-y-2">
            {payrollRuns.length === 0 ? <p className="text-xs text-stone-400 py-4 text-center">لم يصرف أي مسير رواتب حتى الآن</p> : null}
            {payrollRuns.map((p) => (
              <div key={p.id} className="bg-stone-50 p-3 rounded-lg border border-stone-100 flex justify-between items-center text-xs font-body">
                <div>
                  <p className="font-bold text-stone-800">مسير شهر: {p.month}</p>
                  <p className="text-[10px] text-stone-400 mt-1">توليد القيد تلقائياً</p>
                </div>
                <span className="font-bold text-stone-700">{p.total} ر.س</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FixedAssetsView({ fixedAssets, depreciationRuns, onAdd, onRunDepreciation }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-sm text-stone-800">سجل إهلاك الأصول الثابتة</h3>
        <div className="flex gap-2">
          <button onClick={onAdd} className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs px-3 py-1.5 rounded-lg font-body transition-all">شراء أصل ثابت جديد +</button>
          <button onClick={onRunDepreciation} className="bg-stone-900 hover:bg-stone-850 text-white text-xs px-3 py-1.5 rounded-lg font-body transition-all">تشغيل الإهلاك الشهري ⚙️</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          <table className="w-full text-right text-sm font-body">
            <thead className="bg-stone-50 text-stone-500 text-xs">
              <tr>
                <th className="p-3">اسم الأصل</th>
                <th className="p-3">تكلفة الاقتناء</th>
                <th className="p-3">العمر الإنتاجي</th>
                <th className="p-3">مجمع الإهلاك الحالي</th>
                <th className="p-3">القيمة الدفترية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {fixedAssets.map((asset) => {
                const bookValue = asset.cost - asset.accumulatedDepreciation;
                return (
                  <tr key={asset.id} className="hover:bg-stone-50/50">
                    <td className="p-3 font-semibold">{asset.name}</td>
                    <td className="p-3">{asset.cost} ر.س</td>
                    <td className="p-3 text-xs text-stone-500">{asset.usefulLifeMonths} شهر</td>
                    <td className="p-3 text-rose-600 font-semibold">{asset.accumulatedDepreciation} ر.س</td>
                    <td className="p-3 font-bold text-stone-800">{bookValue} ر.س</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-4 h-fit">
          <h3 className="font-display font-semibold text-stone-800 text-sm">عمليات الاحتساب الدورية للبرنامج</h3>
          <div className="space-y-2">
            {depreciationRuns.length === 0 ? <p className="text-xs text-stone-400 py-4 text-center">لا توجد عمليات إهلاك مرصودة</p> : null}
            {depreciationRuns.map((dr) => (
              <div key={dr.id} className="bg-stone-50 p-3 rounded-lg border border-stone-100 flex justify-between items-center text-xs font-body">
                <div>
                  <p className="font-bold text-stone-800">إهلاك شهر: {dr.month}</p>
                </div>
                <span className="font-bold text-rose-600">-{dr.total} ر.س</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function OrgSettingsView({ branches, warehouses, costCenters, onAddBranch, onAddWarehouse, onAddCC }) {
  const [bName, setBName] = useState("");
  const [wName, setWName] = useState("");
  const [ccName, setCCName] = useState("");

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* الفروع */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm space-y-4">
        <h3 className="font-display font-semibold text-stone-800 text-sm">الفروع الإدارية للشركة</h3>
        <div className="flex gap-2">
          <input type="text" placeholder="اسم الفرع الجديد" value={bName} onChange={(e) => setBName(e.target.value)} className="bg-stone-50 border border-stone-200 text-xs rounded p-2 flex-1 focus:outline-none" />
          <button onClick={() => { if (bName.trim()) { onAddBranch({ name: bName }); setBName(""); } }} className="bg-stone-900 text-white text-xs px-3 rounded">+</button>
        </div>
        <ul className="divide-y divide-stone-100 text-xs font-body text-stone-700">
          {branches.map((b) => <li key={b.id} className="py-2 font-semibold">📍 {b.name}</li>)}
        </ul>
      </div>

      {/* المستودعات */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm space-y-4">
        <h3 className="font-display font-semibold text-stone-800 text-sm">المستودعات ومواقع التخزين</h3>
        <div className="flex gap-2">
          <input type="text" placeholder="اسم المستودع" value={wName} onChange={(e) => setWName(e.target.value)} className="bg-stone-50 border border-stone-200 text-xs rounded p-2 flex-1 focus:outline-none" />
          <button onClick={() => { if (wName.trim()) { onAddWarehouse({ name: wName, branchId: "b1" }); setWName(""); } }} className="bg-stone-900 text-white text-xs px-3 rounded">+</button>
        </div>
        <ul className="divide-y divide-stone-100 text-xs font-body text-stone-700">
          {warehouses.map((w) => <li key={w.id} className="py-2 font-semibold">📦 {w.name}</li>)}
        </ul>
      </div>

      {/* مراكز التكلفة */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm space-y-4">
        <h3 className="font-display font-semibold text-stone-800 text-sm">مراكز التكلفة المحاسبية</h3>
        <div className="flex gap-2">
          <input type="text" placeholder="مركز التكلفة" value={ccName} onChange={(e) => setCCName(e.target.value)} className="bg-stone-50 border border-stone-200 text-xs rounded p-2 flex-1 focus:outline-none" />
          <button onClick={() => { if (ccName.trim()) { onAddCC({ name: ccName }); setCCName(""); } }} className="bg-stone-900 text-white text-xs px-3 rounded">+</button>
        </div>
        <ul className="divide-y divide-stone-100 text-xs font-body text-stone-700">
          {costCenters.map((cc) => <li key={cc.id} className="py-2 font-semibold">🏷️ {cc.name}</li>)}
        </ul>
      </div>
    </div>
  );
}

function UsersRolesView({ roles, users, onTogglePermission }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-4">
        <h3 className="font-display font-semibold text-stone-800 text-sm">جدول مصفوفة الصلاحيات والأدوار الأمنية</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs font-body">
            <thead className="bg-stone-50 text-stone-500 text-[10px]">
              <tr>
                <th className="p-2">الدور الوظيفي</th>
                <th className="p-2">الحسابات</th>
                <th className="p-2">القيود</th>
                <th className="p-2">المخزن</th>
                <th className="p-2">الفواتير</th>
                <th className="p-2">الموارد البشرية</th>
                <th className="p-2">التقارير</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {roles.map((r) => (
                <tr key={r.id}>
                  <td className="p-2 font-semibold">{r.name}</td>
                  <td className="p-2"><input type="checkbox" checked={!!r.permissions.accounts} onChange={() => onTogglePermission(r.id, "accounts")} /></td>
                  <td className="p-2"><input type="checkbox" checked={!!r.permissions.entries} onChange={() => onTogglePermission(r.id, "entries")} /></td>
                  <td className="p-2"><input type="checkbox" checked={!!r.permissions.inventory} onChange={() => onTogglePermission(r.id, "inventory")} /></td>
                  <td className="p-2"><input type="checkbox" checked={!!r.permissions.invoices} onChange={() => onTogglePermission(r.id, "invoices")} /></td>
                  <td className="p-2"><input type="checkbox" checked={!!r.permissions.hr} onChange={() => onTogglePermission(r.id, "hr")} /></td>
                  <td className="p-2"><input type="checkbox" checked={!!r.permissions.reports} onChange={() => onTogglePermission(r.id, "reports")} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ReportsView({ accounts, entries }) {
  const [reportType, setReportType] = useState("trialBalance");

  // دالة لحساب الإجمالي المدين والدائن لكل حساب في دفتر اليومية
  const getAccountFinancials = (id) => {
    let debitSum = 0;
    let creditSum = 0;
    entries.forEach((entry) => {
      if (!entry.posted) return;
      entry.lines.forEach((l) => {
        if (l.accountId === id) {
          debitSum += Number(l.debit || 0);
          creditSum += Number(l.credit || 0);
        }
      });
    });
    return { debitSum, creditSum, balance: debitSum - creditSum };
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-6">
      <div className="flex items-center justify-between border-b pb-4 border-stone-100">
        <h3 className="font-display font-semibold text-stone-800 text-sm">مستخرج القوائم والتقارير والختاميات المباشرة</h3>
        <div className="flex gap-1.5">
          <button onClick={() => setReportType("trialBalance")} className={`text-xs px-3 py-1.5 rounded font-body transition-all ${reportType === "trialBalance" ? "bg-stone-900 text-white font-semibold" : "bg-stone-50 hover:bg-stone-100"}`}>ميزان المراجعة</button>
          <button onClick={() => setReportType("incomeStatement")} className={`text-xs px-3 py-1.5 rounded font-body transition-all ${reportType === "incomeStatement" ? "bg-stone-900 text-white font-semibold" : "bg-stone-50 hover:bg-stone-100"}`}>قائمة الدخل</button>
        </div>
      </div>

      {reportType === "trialBalance" && (
        <div className="space-y-4">
          <h4 className="font-display text-stone-800 text-xs font-bold">ميزان المراجعة بالأرصدة</h4>
          <table className="w-full text-right text-xs font-body">
            <thead className="bg-stone-50 text-stone-500">
              <tr>
                <th className="p-2">الحساب</th>
                <th className="p-2 text-left">أرصدة مدينة</th>
                <th className="p-2 text-left">أرصدة دائنة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50 text-stone-700">
              {accounts.map((acc) => {
                const { balance } = getAccountFinancials(acc.id);
                return (
                  <tr key={acc.id}>
                    <td className="p-2 font-semibold">{acc.name}</td>
                    <td className="p-2 text-left font-mono font-bold text-stone-800">{balance > 0 ? `${balance} ر.س` : "—"}</td>
                    <td className="p-2 text-left font-mono font-bold text-stone-800">{balance < 0 ? `${Math.abs(balance)} ر.س` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {reportType === "incomeStatement" && (
        <div className="space-y-4">
          <h4 className="font-display text-stone-800 text-xs font-bold">قائمة الدخل للفترة الحالية</h4>
          <div className="space-y-3 font-body text-xs">
            <div className="bg-emerald-50 text-emerald-950 p-3 rounded-lg flex justify-between font-bold">
              <span>إيرادات المبيعات والخدمات</span>
              <span>{accounts.filter(a => a.type === "revenue").reduce((s, acc) => s + Math.abs(getAccountFinancials(acc.id).balance), 0)} ر.س</span>
            </div>
            <div className="bg-stone-50 text-stone-950 p-3 rounded-lg flex justify-between font-bold">
              <span>تكلفة النشاط والمشتريات</span>
              <span>{accounts.filter(a => a.type === "expense" && a.code.startsWith("5001")).reduce((s, acc) => s + getAccountFinancials(acc.id).balance, 0)} ر.س</span>
            </div>
            <div className="bg-stone-50 text-stone-950 p-3 rounded-lg flex justify-between font-bold">
              <span>المصروفات التشغيلية والعمومية (الرواتب والإهلاك والتشغيل)</span>
              <span>{accounts.filter(a => a.type === "expense" && !a.code.startsWith("5001")).reduce((s, acc) => s + getAccountFinancials(acc.id).balance, 0)} ر.س</span>
            </div>
            <div className="border-t pt-4 flex justify-between text-sm font-semibold text-stone-900 px-3">
              <span>صافي الأرباح / الخسائر الحالية</span>
              <span>
                {accounts.filter(a => a.type === "revenue").reduce((s, acc) => s + Math.abs(getAccountFinancials(acc.id).balance), 0) -
                 accounts.filter(a => a.type === "expense").reduce((s, acc) => s + getAccountFinancials(acc.id).balance, 0)} ر.س
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsView({ data, setData }) {
  function handleBackup() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `al_ameen_lite_backup_${todayStr()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  function handleRestore(e) {
    const fileReader = new FileReader();
    fileReader.readAsText(e.target.files[0], "UTF-8");
    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.accounts && parsed.entries) {
          setData(parsed);
          alert("تم استعادة النسخة الاحتياطية بنجاح بنسبة 100% ✓");
        } else {
          alert("الملف المرفوع لا يتوافق مع بنية بيانات الأمين ERP");
        }
      } catch (err) {
        alert("فشل في استعادة البيانات، تأكد من سلامة الملف المرفوع.");
      }
    };
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-6">
      <div className="space-y-4">
        <h4 className="font-display font-semibold text-stone-800 text-sm">تغيير لغة نظام ERP الموحد</h4>
        <div className="flex gap-2">
          <button
            onClick={() => setData((d) => ({ ...d, meta: { ...d.meta, language: "ar" } }))}
            className={`text-xs px-4 py-2 rounded-lg font-body transition-all ${data.meta.language === "ar" ? "bg-stone-900 text-white font-semibold" : "bg-stone-100 hover:bg-stone-200"}`}
          >
            العربية (AR)
          </button>
          <button
            onClick={() => setData((d) => ({ ...d, meta: { ...d.meta, language: "en" } }))}
            className={`text-xs px-4 py-2 rounded-lg font-body transition-all ${data.meta.language === "en" ? "bg-stone-900 text-white font-semibold" : "bg-stone-100 hover:bg-stone-200"}`}
          >
            English (EN)
          </button>
        </div>
      </div>

      <div className="border-t pt-6 space-y-4">
        <h4 className="font-display font-semibold text-stone-800 text-sm">النسخ الاحتياطي وتأمين قواعد البيانات</h4>
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={handleBackup} className="bg-stone-900 hover:bg-stone-850 text-white text-xs px-4 py-2.5 rounded-lg font-body font-semibold">تصدير قاعدة البيانات (JSON)</button>
          <div className="relative">
            <input type="file" accept=".json" onChange={handleRestore} className="absolute inset-0 opacity-0 cursor-pointer w-full" />
            <button className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs px-4 py-2.5 rounded-lg font-body font-semibold w-full">استيراد قاعدة بيانات محفوظة</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================== Modals Forms ============================== */
function AccountModal({ form, setForm, onSubmit, onClose }) {
  return (
    <div className="fixed inset-0 bg-stone-900/60 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h3 className="font-display font-semibold text-stone-800 text-base border-b pb-3 border-stone-100">إضافة حساب جديد بالدليل</h3>
        <div className="space-y-3 text-xs font-body">
          <div>
            <label className="block text-stone-500 mb-1">رمز الحساب (الباركود الرقمي)</label>
            <input type="text" placeholder="مثال: 1003" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full bg-stone-50 border border-stone-200 rounded p-2 focus:outline-none" />
          </div>
          <div>
            <label className="block text-stone-500 mb-1">اسم الحساب (ميزانية عمومية / أرباح وخسائر)</label>
            <input type="text" placeholder="مثال: البنك المركزي" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-stone-50 border border-stone-200 rounded p-2 focus:outline-none" />
          </div>
          <div>
            <label className="block text-stone-500 mb-1">التبويب المحاسبي الرئيسي</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full bg-stone-50 border border-stone-200 rounded p-2 focus:outline-none">
              <option value="asset">أصول (Assets)</option>
              <option value="liability">خصوم / التزامات (Liabilities)</option>
              <option value="equity">حقوق ملكية (Equity)</option>
              <option value="revenue">إيرادات (Revenues)</option>
              <option value="expense">مصروفات (Expenses)</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 pt-4">
          <button onClick={onSubmit} className="bg-stone-900 text-white px-4 py-2 rounded text-xs font-body font-semibold flex-1">حفظ الحساب</button>
          <button onClick={onClose} className="bg-stone-100 text-stone-700 px-4 py-2 rounded text-xs font-body flex-1">إلغاء</button>
        </div>
      </div>
    </div>
  );
}

function EntryModal({ form, setForm, accounts, costCenters, onSubmit, onClose }) {
  function addLine() {
    setForm({ ...form, lines: [...form.lines, { accountId: "", debit: 0, credit: 0 }] });
  }

  function removeLine(index) {
    setForm({ ...form, lines: form.lines.filter((_, i) => i !== index) });
  }

  function updateLine(index, key, val) {
    setForm({
      ...form,
      lines: form.lines.map((line, i) => (i === index ? { ...line, [key]: val } : line)),
    });
  }

  return (
    <div className="fixed inset-0 bg-stone-900/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-4 my-8">
        <h3 className="font-display font-semibold text-stone-800 text-base border-b pb-3 border-stone-100">إعداد وتدوين قيد يدوي مزدوج</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-body">
          <div>
            <label className="block text-stone-500 mb-1">تاريخ القيد</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full bg-stone-50 border border-stone-200 rounded p-2 focus:outline-none" />
          </div>
          <div>
            <label className="block text-stone-500 mb-1">بيان وشرح القيد</label>
            <input type="text" placeholder="قيد رواتب / تسوية صندوق..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full bg-stone-50 border border-stone-200 rounded p-2 focus:outline-none" />
          </div>
          <div>
            <label className="block text-stone-500 mb-1">ربط بمركز تكلفة مخصص (اختياري)</label>
            <select value={form.costCenterId || ""} onChange={(e) => setForm({ ...form, costCenterId: e.target.value || null })} className="w-full bg-stone-50 border border-stone-200 rounded p-2 focus:outline-none">
              <option value="">لا يوجد مركز تكلفة</option>
              {costCenters.map((cc) => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-2 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-800">أطراف القيد المزدوج</span>
            <button onClick={addLine} className="text-xs text-stone-500 hover:text-stone-900 font-semibold underline">+ إضافة سطر</button>
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {form.lines.map((l, index) => (
              <div key={index} className="flex gap-2 items-center">
                <select value={l.accountId} onChange={(e) => updateLine(index, "accountId", e.target.value)} className="bg-stone-50 border border-stone-200 text-xs rounded p-2 flex-1 focus:outline-none">
                  <option value="">اختر الحساب...</option>
                  {accounts.map((acc) => <option key={acc.id} value={acc.id}>{acc.name} ({acc.code})</option>)}
                </select>
                <input type="number" placeholder="مدين" value={l.debit || ""} onChange={(e) => updateLine(index, "debit", Number(e.target.value))} className="bg-stone-50 border border-stone-200 text-xs rounded p-2 w-20 focus:outline-none" />
                <input type="number" placeholder="دائن" value={l.credit || ""} onChange={(e) => updateLine(index, "credit", Number(e.target.value))} className="bg-stone-50 border border-stone-200 text-xs rounded p-2 w-20 focus:outline-none" />
                <button onClick={() => removeLine(index)} className="text-rose-600 hover:text-rose-800 font-semibold text-xs px-2">X</button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <button onClick={onSubmit} className="bg-stone-900 text-white px-4 py-2 rounded text-xs font-body font-semibold flex-1">ترحيل وحفظ القيد</button>
          <button onClick={onClose} className="bg-stone-100 text-stone-700 px-4 py-2 rounded text-xs font-body flex-1">إلغاء</button>
        </div>
      </div>
    </div>
  );
}

function ItemModal({ form, setForm, warehouses, onSubmit, onClose, editing }) {
  return (
    <div className="fixed inset-0 bg-stone-900/60 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h3 className="font-display font-semibold text-stone-800 text-base border-b pb-3 border-stone-100">{editing ? "تعديل الصنف الحالي" : "إضافة صنف تجاري جديد"}</h3>
        <div className="space-y-3 text-xs font-body">
          <div>
            <label className="block text-stone-500 mb-1">اسم الصنف</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-stone-50 border border-stone-200 rounded p-2 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-stone-500 mb-1">سعر التكلفة</label>
              <input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} className="w-full bg-stone-50 border border-stone-200 rounded p-2 focus:outline-none" />
            </div>
            <div>
              <label className="block text-stone-500 mb-1">سعر البيع الافتراضي</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="w-full bg-stone-50 border border-stone-200 rounded p-2 focus:outline-none" />
            </div>
          </div>
        </div>
        <div className="flex gap-2 pt-4">
          <button onClick={onSubmit} className="bg-stone-900 text-white px-4 py-2 rounded text-xs font-body font-semibold flex-1">{editing ? "حفظ التعديلات" : "إضافة الصنف"}</button>
          <button onClick={onClose} className="bg-stone-100 text-stone-700 px-4 py-2 rounded text-xs font-body flex-1">إلغاء</button>
        </div>
      </div>
    </div>
  );
}

function InvoiceModal({ form, setForm, items, warehouses, customers, costCenters, branches, onSubmit, onClose }) {
  function addLine() {
    setForm({ ...form, lines: [...form.lines, { itemId: "", warehouseId: warehouses[0]?.id || "", qty: 1, price: 0 }] });
  }

  function removeLine(index) {
    setForm({ ...form, lines: form.lines.filter((_, i) => i !== index) });
  }

  function updateLine(index, key, val) {
    setForm({
      ...form,
      lines: form.lines.map((line, i) => {
        if (i !== index) return line;
        const next = { ...line, [key]: val };
        if (key === "itemId") {
          const matchedItem = items.find((it) => it.id === val);
          next.price = form.type === "sale" ? matchedItem?.price || 0 : matchedItem?.cost || 0;
        }
        return next;
      }),
    });
  }

  return (
    <div className="fixed inset-0 bg-stone-900/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-6 space-y-4 my-8">
        <h3 className="font-display font-semibold text-stone-800 text-base border-b pb-3 border-stone-100">تحرير وتعميد فاتورة</h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-body">
          <div>
            <label className="block text-stone-400 mb-1">نوع الفاتورة</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full bg-stone-50 border border-stone-200 rounded p-1.5 focus:outline-none">
              <option value="sale">فاتورة مبيعات</option>
              <option value="purchase">فاتورة مشتريات</option>
            </select>
          </div>
          <div>
            <label className="block text-stone-400 mb-1">طريقة الدفع</label>
            <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="w-full bg-stone-50 border border-stone-200 rounded p-1.5 focus:outline-none">
              <option value="cash">نقدي (كاش)</option>
              <option value="credit">آجل (ذمم)</option>
            </select>
          </div>
          <div>
            <label className="block text-stone-400 mb-1">الفرع المسؤول</label>
            <select value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })} className="w-full bg-stone-50 border border-stone-200 rounded p-1.5 focus:outline-none">
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-stone-400 mb-1">تاريخ اليوم</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full bg-stone-50 border border-stone-200 rounded p-1.5 focus:outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-[11px] font-body">
          <div>
            <label className="block text-stone-400 mb-1">العميل / المورد</label>
            <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} className="w-full bg-stone-50 border border-stone-200 rounded p-1.5 focus:outline-none">
              <option value="">زبون مبيعات مباشر (نقدي)</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              <option value="__new__">+ إضافة عميل/مورد جديد</option>
            </select>
          </div>
          {form.customerId === "__new__" && (
            <div>
              <label className="block text-stone-400 mb-1">اسم الطرف الثاني الجديد</label>
              <input type="text" placeholder="اسم العميل أو المورد الجديد" value={form.newPartyName} onChange={(e) => setForm({ ...form, newPartyName: e.target.value })} className="w-full bg-stone-50 border border-stone-200 rounded p-1.5 focus:outline-none" />
            </div>
          )}
        </div>

        <div className="space-y-2 pt-4">
          <div className="flex items-center justify-between border-b pb-1">
            <span className="text-xs font-bold text-stone-800">تفاصيل السطور والأصناف</span>
            <button onClick={addLine} className="text-xs text-stone-500 hover:text-stone-900 font-semibold underline">+ إضافة صنف</button>
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {form.lines.map((l, index) => (
              <div key={index} className="flex gap-2 items-center text-[11px]">
                <select value={l.itemId} onChange={(e) => updateLine(index, "itemId", e.target.value)} className="bg-stone-50 border border-stone-200 rounded p-1.5 flex-1 focus:outline-none">
                  <option value="">اختر الصنف...</option>
                  {items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
                </select>
                <select value={l.warehouseId} onChange={(e) => updateLine(index, "warehouseId", e.target.value)} className="bg-stone-50 border border-stone-200 rounded p-1.5 w-24 focus:outline-none">
                  {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
                <input type="number" placeholder="الكمية" value={l.qty} onChange={(e) => updateLine(index, "qty", Number(e.target.value))} className="bg-stone-50 border border-stone-200 rounded p-1.5 w-16 focus:outline-none" />
                <input type="number" placeholder="السعر" value={l.price || ""} onChange={(e) => updateLine(index, "price", Number(e.target.value))} className="bg-stone-50 border border-stone-200 rounded p-1.5 w-20 focus:outline-none" />
                <button onClick={() => removeLine(index)} className="text-rose-600 hover:text-rose-800 font-bold px-1 text-xs">X</button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <button onClick={onSubmit} className="bg-stone-900 text-white px-4 py-2 rounded text-xs font-body font-semibold flex-1">ترحيل وحفظ الفاتورة وقيدها المزدوج</button>
          <button onClick={onClose} className="bg-stone-100 text-stone-700 px-4 py-2 rounded text-xs font-body flex-1">إلغاء</button>
        </div>
      </div>
    </div>
  );
}

function POModal({ form, setForm, customers, items, onSubmit, onClose }) {
  function updateLine(index, key, val) {
    setForm({
      ...form,
      lines: form.lines.map((l, i) => (i === index ? { ...l, [key]: val } : l)),
    });
  }

  return (
    <div className="fixed inset-0 bg-stone-900/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h3 className="font-display font-semibold text-stone-800 text-base border-b pb-3 border-stone-100 font-bold">إنشاء أمر شراء</h3>
        <div className="space-y-3 text-xs font-body">
          <div>
            <label className="block text-stone-500 mb-1">المورد المستهدف</label>
            <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} className="w-full bg-stone-50 border border-stone-200 rounded p-2 focus:outline-none">
              <option value="">اختر مورد...</option>
              {customers.filter((c) => c.type === "supplier").map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <h4 className="font-bold text-stone-800 my-2">الصنف والكمية المطلوبة</h4>
            {form.lines.map((l, i) => (
              <div key={i} className="flex gap-2">
                <select value={l.itemId} onChange={(e) => updateLine(i, "itemId", e.target.value)} className="bg-stone-50 border border-stone-200 rounded p-1.5 flex-1 text-xs">
                  <option value="">اختر صنف...</option>
                  {items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
                </select>
                <input type="number" placeholder="الكمية" value={l.qty} onChange={(e) => updateLine(i, "qty", Number(e.target.value))} className="bg-stone-50 border border-stone-200 rounded p-1.5 w-20 text-xs text-center" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2 pt-4">
          <button onClick={onSubmit} className="bg-stone-900 text-white px-4 py-2 rounded text-xs font-body font-semibold flex-1">حفظ أمر الشراء</button>
          <button onClick={onClose} className="bg-stone-100 text-stone-700 px-4 py-2 rounded text-xs font-body flex-1">إلغاء</button>
        </div>
      </div>
    </div>
  );
}

function ProdModal({ form, setForm, items, warehouses, onSubmit, onClose }) {
  function updateComponent(index, key, val) {
    setForm({
      ...form,
      components: form.components.map((c, i) => (i === index ? { ...c, [key]: val } : c)),
    });
  }

  return (
    <div className="fixed inset-0 bg-stone-900/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h3 className="font-display font-semibold text-stone-800 text-base border-b pb-3 border-stone-100 font-bold">بدء دورة تصنيع إنتاجية</h3>
        <div className="space-y-3 text-xs font-body">
          <div>
            <label className="block text-stone-500 mb-1">المنتج النهائي المصنع</label>
            <select value={form.finishedItemId} onChange={(e) => setForm({ ...form, finishedItemId: e.target.value })} className="w-full bg-stone-50 border border-stone-200 rounded p-2 text-xs">
              <option value="">اختر المنتج...</option>
              {items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-stone-500 mb-1">الكمية المستهدفة للإنتاج</label>
              <input type="number" value={form.finishedQty} onChange={(e) => setForm({ ...form, finishedQty: Number(e.target.value) })} className="w-full bg-stone-50 border border-stone-200 rounded p-2 text-xs" />
            </div>
            <div>
              <label className="block text-stone-500 mb-1">المستودع المستلم</label>
              <select value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })} className="w-full bg-stone-50 border border-stone-200 rounded p-2 text-xs">
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-stone-800 my-2">المواد الخام المستهلكة (BOM)</h4>
            {form.components.map((c, i) => (
              <div key={i} className="flex gap-2">
                <select value={c.itemId} onChange={(e) => updateComponent(i, "itemId", e.target.value)} className="bg-stone-50 border border-stone-200 rounded p-1.5 flex-1 text-xs">
                  <option value="">صنف خام...</option>
                  {items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
                </select>
                <input type="number" placeholder="الكمية" value={c.qty} onChange={(e) => updateComponent(i, "qty", Number(e.target.value))} className="bg-stone-50 border border-stone-200 rounded p-1.5 w-20 text-xs text-center" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2 pt-4">
          <button onClick={onSubmit} className="bg-stone-900 text-white px-4 py-2 rounded text-xs font-body font-semibold flex-1">حفظ دورة التصنيع</button>
          <button onClick={onClose} className="bg-stone-100 text-stone-700 px-4 py-2 rounded text-xs font-body flex-1">إلغاء</button>
        </div>
      </div>
    </div>
  );
}

function CRMModal({ form, setForm, onSubmit, onClose }) {
  return (
    <div className="fixed inset-0 bg-stone-900/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h3 className="font-display font-semibold text-stone-800 text-base border-b pb-3 border-stone-100 font-bold">إضافة طرف تجاري (CRM)</h3>
        <div className="space-y-3 text-xs font-body">
          <div>
            <label className="block text-stone-500 mb-1">الاسم التجاري الكامل</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-stone-50 border border-stone-200 rounded p-2 text-xs" />
          </div>
          <div>
            <label className="block text-stone-500 mb-1">رقم الجوال والتواصل</label>
            <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full bg-stone-50 border border-stone-200 rounded p-2 text-xs" />
          </div>
        </div>
        <div className="flex gap-2 pt-4">
          <button onClick={onSubmit} className="bg-stone-900 text-white px-4 py-2 rounded text-xs font-body font-semibold flex-1">إضافة وحفظ</button>
          <button onClick={onClose} className="bg-stone-100 text-stone-700 px-4 py-2 rounded text-xs font-body flex-1">إلغاء</button>
        </div>
      </div>
    </div>
  );
}

function EmployeeModal({ form, setForm, onSubmit, onClose }) {
  return (
    <div className="fixed inset-0 bg-stone-900/60 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h3 className="font-display font-semibold text-stone-800 text-base border-b pb-3 border-stone-100">تسجيل موظف جديد بملف الموارد البشرية</h3>
        <div className="space-y-3 text-xs font-body">
          <div>
            <label className="block text-stone-500 mb-1">الاسم الكامل للموظف</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-stone-50 border border-stone-200 rounded p-2 focus:outline-none" />
          </div>
          <div>
            <label className="block text-stone-500 mb-1">المسمى والصفة الوظيفية</label>
            <input type="text" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="w-full bg-stone-50 border border-stone-200 rounded p-2 focus:outline-none" />
          </div>
          <div>
            <label className="block text-stone-500 mb-1">الراتب الأساسي المعتمد شهرياً</label>
            <input type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: Number(e.target.value) })} className="w-full bg-stone-50 border border-stone-200 rounded p-2 focus:outline-none" />
          </div>
        </div>
        <div className="flex gap-2 pt-4">
          <button onClick={onSubmit} className="bg-stone-900 text-white px-4 py-2 rounded text-xs font-body font-semibold flex-1">حفظ وحفظ الملف للموظف</button>
          <button onClick={onClose} className="bg-stone-100 text-stone-700 px-4 py-2 rounded text-xs font-body flex-1">إلغاء</button>
        </div>
      </div>
    </div>
  );
}

function FixedAssetModal({ form, setForm, onSubmit, onClose }) {
  return (
    <div className="fixed inset-0 bg-stone-900/60 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h3 className="font-display font-semibold text-stone-800 text-base border-b pb-3 border-stone-100">شراء وتسجيل أصل ثابت جديد</h3>
        <div className="space-y-3 text-xs font-body">
          <div>
            <label className="block text-stone-500 mb-1">اسم الأصل المقتنى</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-stone-50 border border-stone-200 rounded p-2 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-stone-500 mb-1">تكلفة الاقتناء الإجمالية</label>
              <input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} className="w-full bg-stone-50 border border-stone-200 rounded p-2 focus:outline-none" />
            </div>
            <div>
              <label className="block text-stone-500 mb-1">العمر الإنتاجي (بالشهور)</label>
              <input type="number" value={form.usefulLifeMonths} onChange={(e) => setForm({ ...form, usefulLifeMonths: Number(e.target.value) })} className="w-full bg-stone-50 border border-stone-200 rounded p-2 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-stone-500 mb-1">طريقة الدفع للشراء</label>
            <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="w-full bg-stone-50 border border-stone-200 rounded p-2 focus:outline-none">
              <option value="cash">نقداً من صندوق الشركة</option>
              <option value="credit">آجل بالذمة للمورد</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 pt-4">
          <button onClick={onSubmit} className="bg-stone-900 text-white px-4 py-2 rounded text-xs font-body font-semibold flex-1">ترحيل قيد الشراء وتسجيل الأصل</button>
          <button onClick={onClose} className="bg-stone-100 text-stone-700 px-4 py-2 rounded text-xs font-body flex-1">إلغاء</button>
        </div>
      </div>
    </div>
  );
}

/* ============================== Core App Component ============================== */
export default function App() {
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem("al_ameen_lite_erp_data");
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });

  const [activeTab, setActiveTab] = useState("dashboard");
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState("");

  // حالات فتح النوافذ المنبثقة للنماذج (Modals)
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPOModal, setShowPOModal] = useState(false);
  const [showProdModal, setShowProdModal] = useState(false);
  const [showCRMModal, setShowCRMModal] = useState(false);
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [showFAModal, setShowFAModal] = useState(false);

  // حالات النماذج الفردية (Forms States)
  const [accountForm, setAccountForm] = useState({ code: "", name: "", type: "asset" });
  const [entryForm, setEntryForm] = useState({ date: todayStr(), description: "", costCenterId: null, lines: [{ accountId: "", debit: 0, credit: 0 }, { accountId: "", debit: 0, credit: 0 }] });
  const [itemForm, setItemForm] = useState({ id: null, name: "", unit: "قطعة", barcodes: [], cost: 0, price: 0, stock: {} });
  const [invoiceForm, setInvoiceForm] = useState({ type: "sale", paymentMethod: "cash", customerId: "", newPartyName: "", branchId: "b1", costCenterId: null, date: todayStr(), lines: [] });
  const [poForm, setPoForm] = useState({ supplierId: "", date: todayStr(), lines: [{ itemId: "", qty: 1 }] });
  const [prodForm, setProdForm] = useState({ finishedItemId: "", finishedQty: 1, warehouseId: "w1", components: [{ itemId: "", qty: 1 }] });
  const [crmForm, setCrmForm] = useState({ name: "", phone: "", type: "customer" });
  const [empForm, setEmpForm] = useState({ name: "", position: "", salary: 0 });
  const [faForm, setFaForm] = useState({ name: "", cost: 0, usefulLifeMonths: 36, paymentMethod: "cash" });

  useEffect(() => {
    localStorage.setItem("al_ameen_lite_erp_data", JSON.stringify(data));
    setLoaded(true);
  }, [data]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  }

  // التعرف على المستخدم الحالي وصلاحياته
  const currentUser = data.users.find((u) => u.id === data.meta.activeUserId) || data.users[0];
  const currentRole = data.roles.find((r) => r.id === currentUser?.roleId);

  // تصفية التبويبات المسموحة للمستخدم حسب دوره في النظام
  const allowedKeys = Object.keys(currentRole?.permissions || {}).filter(
    (key) => currentRole?.permissions[key] === true
  );

  /* ---------- Financial Helpers ---------- */
  function findAcc(code) {
    return data.accounts.find((a) => a.code === code)?.id || null;
  }

  // حساب رصيد الحساب المالي من واقع قيود اليومية المزدوجة المرحلة والمثبتة
  function getAccountBalance(accId) {
    let bal = 0;
    data.entries.forEach((entry) => {
      if (!entry.posted) return;
      entry.lines.forEach((l) => {
        if (l.accountId === accId) {
          bal += Number(l.debit || 0) - Number(l.credit || 0);
        }
      });
    });
    return bal;
  }

  // الحصول على إجمالي الفئات المالية (أصول، خصوم، إيرادات ومصروفات)
  function getTypeTotal(type) {
    return data.accounts
      .filter((a) => a.type === type)
      .reduce((sum, acc) => sum + Math.abs(getAccountBalance(acc.id)), 0);
  }

  /* ---------- Account Handlers ---------- */
  function openAccountModal() {
    setAccountForm({ code: "", name: "", type: "asset" });
    setShowAccountModal(true);
  }

  function handleSaveAccount() {
    if (!accountForm.code.trim() || !accountForm.name.trim()) return showToast("يرجى ملء كافة حقول الحساب");
    if (data.accounts.some((a) => a.code === accountForm.code)) return showToast("رقم الحساب أو الكود مسجل مسبقاً بدليل الحسابات!");

    const newAcc = { id: uid("a"), ...accountForm, parentId: null };
    setData((d) => ({ ...d, accounts: [...d.accounts, newAcc] }));
    setShowAccountModal(false);
    showToast("تم إدراج الحساب المالي بنجاح ✓");
  }

  /* ---------- Journal Entry Handlers ---------- */
  function openEntryModal() {
    setEntryForm({
      date: todayStr(),
      description: "",
      costCenterId: null,
      lines: [
        { accountId: "", debit: 0, credit: 0 },
        { accountId: "", debit: 0, credit: 0 }
      ]
    });
    setShowEntryModal(true);
  }

  function handleSaveEntry() {
    const lines = entryForm.lines.filter((l) => l.accountId && (Number(l.debit) > 0 || Number(l.credit) > 0));
    if (lines.length < 2) return showToast("القيد المحاسبي يجب أن يحتوي على طرفين على الأقل");

    const totalDebit = lines.reduce((s, l) => s + Number(l.debit), 0);
    const totalCredit = lines.reduce((s, l) => s + Number(l.credit), 0);

    if (totalDebit !== totalCredit) return showToast(`القيد غير متوازن مالياً! الفرق: ${totalDebit - totalCredit}`);

    const newEntry = {
      id: uid("e"),
      no: data.entries.length + 1,
      date: entryForm.date,
      description: entryForm.description || "قيد يدوي",
      lines,
      posted: true,
      branchId: data.meta.activeBranchId,
      costCenterId: entryForm.costCenterId,
    };
    setData((d) => ({ ...d, entries: [...d.entries, newEntry] }));
    setShowEntryModal(false);
    showToast("تم ترحيل القيد بنجاح ✓");
  }

  /* ---------- Inventory Handlers ---------- */
  function openItemModal() {
    setItemForm({ id: null, name: "", unit: "قطعة", barcodes: [], cost: 0, price: 0, stock: {} });
    setShowItemModal(true);
  }

  function handleEditItem(item) {
    setItemForm({ ...item });
    setShowItemModal(true);
  }

  function handleSaveItem() {
    if (!itemForm.name.trim()) return showToast("يرجى إدخال اسم الصنف");
    if (itemForm.id) {
      setData((d) => ({
        ...d,
        items: d.items.map((it) => (it.id === itemForm.id ? itemForm : it)),
      }));
      showToast("تم تعديل الصنف بنجاح ✓");
    } else {
      setData((d) => ({
        ...d,
        items: [...d.items, { ...itemForm, id: uid("item") }],
      }));
      showToast("تمت إضافة الصنف الجديد ✓");
    }
    setShowItemModal(false);
  }

  /* ---------- Invoices / POS Handlers ---------- */
  function openInvoiceModal() {
    setInvoiceForm({
      type: "sale",
      paymentMethod: "cash",
      customerId: "",
      newPartyName: "",
      branchId: data.meta.activeBranchId || "b1",
      costCenterId: null,
      date: todayStr(),
      lines: [{ itemId: "", warehouseId: data.warehouses[0]?.id || "w1", qty: 1, price: 0 }],
    });
    setShowInvoiceModal(true);
  }

  function handleSaveInvoice() {
    const lines = invoiceForm.lines.filter((l) => l.itemId && Number(l.qty) > 0);
    if (!lines.length) return showToast("الفاتورة فارغة أو تحتوي أسطر غير مكتملة");

    let finalPartyName = "زبون نقدي";
    let partyId = invoiceForm.customerId;

    if (invoiceForm.customerId === "__new__") {
      if (!invoiceForm.newPartyName.trim()) return showToast("يرجى إدخال اسم العميل/المورد الجديد");
      const newId = uid("party");
      partyId = newId;
      finalPartyName = invoiceForm.newPartyName;
      setData((d) => ({
        ...d,
        customers: [...d.customers, { id: newId, name: finalPartyName, type: invoiceForm.type === "sale" ? "customer" : "supplier", phone: "" }],
      }));
    } else if (invoiceForm.customerId) {
      finalPartyName = data.customers.find((c) => c.id === invoiceForm.customerId)?.name || "—";
    }

    const total = lines.reduce((s, l) => s + l.qty * l.price, 0);

    // حساب تأثير المخزون وتحديث الكميات
    const updatedItems = data.items.map((item) => {
      const nextStock = { ...(item.stock || {}) };
      lines.forEach((l) => {
        if (l.itemId === item.id) {
          const change = invoiceForm.type === "sale" ? -l.qty : l.qty;
          nextStock[l.warehouseId] = (nextStock[l.warehouseId] || 0) + change;
        }
      });
      return { ...item, stock: nextStock };
    });

    // توليد القيد المزدوج التلقائي
    const isSale = invoiceForm.type === "sale";
    const debitAccId = isSale
      ? invoiceForm.paymentMethod === "cash"
        ? findAcc("1001") // الصندوق
        : findAcc("1003") // المدينون
      : findAcc("1004"); // المخزون في المشتريات

    const creditAccId = isSale
      ? findAcc("4001") // إيرادات المبيعات
      : invoiceForm.paymentMethod === "cash"
      ? findAcc("1001") // الصندوق
      : findAcc("2001"); // الدائنون

    const journalLines = [
      { accountId: debitAccId, debit: total, credit: 0 },
      { accountId: creditAccId, debit: 0, credit: total },
    ];

    const newEntryNo = data.entries.length + 1;
    const newEntry = {
      id: uid("e"),
      no: newEntryNo,
      date: invoiceForm.date,
      description: `فاتورة ${isSale ? "مبيعات" : "مشتريات"} رقم ${newEntryNo} - ${finalPartyName}`,
      lines: journalLines,
      posted: true,
      branchId: invoiceForm.branchId,
      costCenterId: invoiceForm.costCenterId,
    };

    const newInvoice = {
      id: uid("inv"),
      no: data.invoices.length + 1,
      type: invoiceForm.type,
      customerId: partyId,
      partyName: finalPartyName,
      branchId: invoiceForm.branchId,
      costCenterId: invoiceForm.costCenterId,
      date: invoiceForm.date,
      paymentMethod: invoiceForm.paymentMethod,
      lines,
      total,
    };

    setData((d) => ({
      ...d,
      items: updatedItems,
      entries: [...d.entries, newEntry],
      invoices: [...d.invoices, newInvoice],
    }));

    setShowInvoiceModal(false);
    showToast("تم حفظ الفاتورة وترحيل القيد وتحديث المخزون تلقائياً ✓");
  }

  function handlePOSCheckout(cartLines, warehouseId) {
    const total = cartLines.reduce((s, l) => s + l.qty * l.price, 0);
    const date = todayStr();

    const updatedItems = data.items.map((item) => {
      const nextStock = { ...(item.stock || {}) };
      cartLines.forEach((l) => {
        if (l.itemId === item.id) {
          nextStock[warehouseId] = (nextStock[warehouseId] || 0) - l.qty;
        }
      });
      return { ...item, stock: nextStock };
    });

    const newEntryNo = data.entries.length + 1;
    const journalLines = [
      { accountId: findAcc("1001"), debit: total, credit: 0 }, // الصندوق
      { accountId: findAcc("4001"), debit: 0, credit: total }, // المبيعات
    ];

    const newEntry = {
      id: uid("e"),
      no: newEntryNo,
      date,
      description: `فاتورة نقطة بيع (نقدي) رقم ${newEntryNo}`,
      lines: journalLines,
      posted: true,
      branchId: data.meta.activeBranchId,
      costCenterId: null,
    };

    const newInvoice = {
      id: uid("inv"),
      no: data.invoices.length + 1,
      type: "sale",
      customerId: "",
      partyName: "زبون نقدي - POS",
      branchId: data.meta.activeBranchId,
      costCenterId: null,
      date,
      paymentMethod: "cash",
      lines: cartLines.map((l) => ({ ...l, warehouseId })),
      total,
    };

    setData((d) => ({
      ...d,
      items: updatedItems,
      entries: [...d.entries, newEntry],
      invoices: [...d.invoices, newInvoice],
    }));
    showToast("تمت عملية البيع بنجاح وترحيل القيد نقداً ✓");
  }

  /* ---------- Supply & Production Handlers ---------- */
  function openPOModal() {
    setPoForm({ supplierId: "", date: todayStr(), lines: [{ itemId: "", qty: 1 }] });
    setShowPOModal(true);
  }

  function handleSavePO() {
    if (!poForm.supplierId) return showToast("يرجى اختيار المورد");
    const validLines = poForm.lines.filter((l) => l.itemId && l.qty > 0);
    if (!validLines.length) return showToast("أمر الشراء فارغ");
    const newPO = {
      id: uid("po"),
      no: data.purchaseOrders.length + 1,
      supplierId: poForm.supplierId,
      date: poForm.date,
      lines: validLines,
    };
    setData((d) => ({ ...d, purchaseOrders: [...d.purchaseOrders, newPO] }));
    setShowPOModal(false);
    showToast("تم حفظ أمر الشراء ✓");
  }

  function openProdModal() {
    setProdForm({ finishedItemId: "", finishedQty: 1, warehouseId: "w1", components: [{ itemId: "", qty: 1 }] });
    setShowProdModal(true);
  }

  function handleSaveProd() {
    if (!prodForm.finishedItemId) return showToast("يرجى تحديد الصنف النهائي");
    const validComponents = prodForm.components.filter((c) => c.itemId && c.qty > 0);
    if (!validComponents.length) return showToast("يرجى إضافة مكونات مستهلكة");
    const newProd = {
      id: uid("pr"),
      no: data.productionOrders.length + 1,
      finishedItemId: prodForm.finishedItemId,
      finishedQty: prodForm.finishedQty,
      warehouseId: prodForm.warehouseId,
      components: validComponents,
      status: "pending",
    };
    setData((d) => ({ ...d, productionOrders: [...d.productionOrders, newProd] }));
    setShowProdModal(false);
    showToast("تم إنشاء أمر التصنيع بنجاح ✓");
  }

  function handleRunProd(po) {
    // التحقق من كفاية المواد في المخزن قبل التشغيل
    let canProcess = true;
    const itemsPatch = data.items.map((item) => {
      const nextStock = { ...(item.stock || {}) };
      if (item.id === po.finishedItemId) {
        nextStock[po.warehouseId] = (nextStock[po.warehouseId] || 0) + po.finishedQty;
      }
      po.components.forEach((comp) => {
        if (comp.itemId === item.id) {
          const currentStock = nextStock[po.warehouseId] || 0;
          if (currentStock < comp.qty) {
            canProcess = false;
          } else {
            nextStock[po.warehouseId] = currentStock - comp.qty;
          }
        }
      });
      return { ...item, stock: nextStock };
    });

    if (!canProcess) return showToast("فشل التنفيذ: الكمية المتوفرة من المكونات في المستودع غير كافية!");

    setData((d) => ({
      ...d,
      items: itemsPatch,
      productionOrders: d.productionOrders.map((p) => (p.id === po.id ? { ...p, status: "done" } : p)),
    }));
    showToast("تم تصنيع المنتج بنحو صحيح وتحديث مستويات المخزون ✓");
  }

  /* ---------- CRM / HR / Fixed Assets Handlers ---------- */
  function openCRMModal(type) {
    setCrmForm({ name: "", phone: "", type });
    setShowCRMModal(true);
  }

  function handleSaveCRM() {
    if (!crmForm.name.trim()) return showToast("يرجى ملء حقل الاسم");
    setData((d) => ({ ...d, customers: [...d.customers, { ...crmForm, id: uid("crm") }] }));
    setShowCRMModal(false);
    showToast("تمت الإضافة بنجاح ✓");
  }

  function openEmpModal() {
    setEmpForm({ name: "", position: "", salary: 0 });
    setShowEmpModal(true);
  }

  function handleSaveEmployee() {
    if (!empForm.name.trim() || empForm.salary <= 0) return showToast("يرجى ملء تفاصيل الموظف والراتب");
    setData((d) => ({ ...d, employees: [...d.employees, { ...empForm, id: uid("emp") }] }));
    setShowEmpModal(false);
    showToast("تمت إضافة الموظف بنجاح ✓");
  }

  function handleRunPayroll() {
    const month = monthKey();
    if (data.payrollRuns.some((p) => p.month === month)) return showToast("تم تشغيل رواتب هذا الشهر مسبقاً");
    const total = data.employees.reduce((s, e) => s + e.salary, 0);
    if (total === 0) return showToast("لا يوجد موظفون مسجلون لتشغيل الرواتب");

    // توليد القيد المحاسبي للرواتب تلقائياً
    const newEntryNo = data.entries.length + 1;
    const journalLines = [
      { accountId: findAcc("5002"), debit: total, credit: 0 }, // مصروف رواتب (مصاريف تشغيلية)
      { accountId: findAcc("1001"), debit: 0, credit: total }, // من الصندوق
    ];

    const newEntry = {
      id: uid("e"),
      no: newEntryNo,
      date: todayStr(),
      description: `قيد الرواتب والأجور لشهر ${month}`,
      lines: journalLines,
      posted: true,
      branchId: data.meta.activeBranchId,
      costCenterId: null,
    };

    setData((d) => ({
      ...d,
      payrollRuns: [...d.payrollRuns, { id: uid("pr"), month, total }],
      entries: [...d.entries, newEntry],
    }));
    showToast(`تم تشغيل الرواتب بمبلغ ${total} ر.س وترحيل قيدها بنجاح ✓`);
  }

  function openFAModal() {
    setFaForm({ name: "", cost: 0, usefulLifeMonths: 36, paymentMethod: "cash" });
    setShowFAModal(true);
  }

  function handleSaveFixedAsset() {
    if (!faForm.name.trim() || faForm.cost <= 0) return showToast("يرجى إدخال تفاصيل الأصل وتكلفته");
    const newId = uid("fa");

    // ترحيل قيد شراء الأصل
    const debitAccId = findAcc("a5") || findAcc("1005"); // الأصول الثابتة
    const creditAccId = faForm.paymentMethod === "cash" ? findAcc("1001") : findAcc("2001");
    const newEntryNo = data.entries.length + 1;

    const newEntry = {
      id: uid("e"),
      no: newEntryNo,
      date: todayStr(),
      description: `شراء أصل ثابت: ${faForm.name}`,
      lines: [
        { accountId: debitAccId, debit: faForm.cost, credit: 0 },
        { accountId: creditAccId, debit: 0, credit: faForm.cost },
      ],
      posted: true,
      branchId: data.meta.activeBranchId,
      costCenterId: null,
    };

    setData((d) => ({
      ...d,
      fixedAssets: [...d.fixedAssets, { id: newId, name: faForm.name, cost: faForm.cost, usefulLifeMonths: faForm.usefulLifeMonths, purchaseDate: todayStr(), accumulatedDepreciation: 0 }],
      entries: [...d.entries, newEntry],
    }));

    setShowFAModal(false);
    showToast("تم حفظ الأصل الثابت الجديد وترحيل قيد الشراء ✓");
  }

  function handleRunDepreciation() {
    const month = monthKey();
    if (data.depreciationRuns.some((dr) => dr.month === month)) return showToast("تم احتساب الإهلاك لهذا الشهر مسبقاً");

    let totalDepreciation = 0;
    const nextAssets = data.fixedAssets.map((asset) => {
      const monthlyDep = Math.round(asset.cost / asset.usefulLifeMonths);
      const possibleAccDep = asset.accumulatedDepreciation + monthlyDep;
      if (possibleAccDep <= asset.cost) {
        totalDepreciation += monthlyDep;
        return { ...asset, accumulatedDepreciation: possibleAccDep };
      }
      return asset;
    });

    if (totalDepreciation === 0) return showToast("لم يتبقَّ أصول تحتاج إلى إهلاك لهذا الشهر!");

    const newEntryNo = data.entries.length + 1;
    const newEntry = {
      id: uid("e"),
      no: newEntryNo,
      date: todayStr(),
      description: `قيد الإهلاك الشهري للأصول لشهر ${month}`,
      lines: [
        { accountId: findAcc("5004") || findAcc("5002"), debit: totalDepreciation, credit: 0 }, // مصروف الإهلاك
        { accountId: findAcc("1006"), debit: 0, credit: totalDepreciation }, // مجمع الإهلاك
      ],
      posted: true,
      branchId: data.meta.activeBranchId,
      costCenterId: null,
    };

    setData((d) => ({
      ...d,
      fixedAssets: nextAssets,
      depreciationRuns: [...d.depreciationRuns, { id: uid("dep"), month, total: totalDepreciation }],
      entries: [...d.entries, newEntry],
    }));
    showToast(`تم تشغيل عملية الإهلاك بقيمة ${totalDepreciation} ر.س ✓`);
  }

  /* ---------- Org & Settings Handlers ---------- */
  function handleAddBranch(b) { setData((d) => ({ ...d, branches: [...d.branches, { ...b, id: uid("b") }] })); showToast("تمت إضافة الفرع ✓"); }
  function handleAddWarehouse(w) { setData((d) => ({ ...d, warehouses: [...d.warehouses, { ...w, id: uid("w") }] })); showToast("تمت إضافة المستودع ✓"); }
  function handleAddCC(c) { setData((d) => ({ ...d, costCenters: [...d.costCenters, { ...c, id: uid("cc") }] })); showToast("تمت إضافة مركز التكلفة ✓"); }
  
  function handleTogglePermission(roleId, permKey) {
    setData((d) => ({
      ...d,
      roles: d.roles.map((r) => {
        if (r.id !== roleId) return r;
        return { ...r, permissions: { ...r.permissions, [permKey]: !r.permissions[permKey] } };
      }),
    }));
  }

  /* ============================== Render Main Layout ============================== */

  if (!loaded) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center font-body text-stone-500">
        جاري تحميل نظام الأمين لايت...
      </div>
    );
  }

  const translations = STR[data.meta.language] || STR.ar;
  const t = (key) => translations[key] || key;

  return (
    <LangContext.Provider value={{ lang: data.meta.language, t }}>
      <div className="min-h-screen bg-stone-50 flex flex-col md:flex-row" dir={data.meta.language === "ar" ? "rtl" : "ltr"}>
        <Sidebar active={activeTab} setActive={setActiveTab} data={data} allowedKeys={allowedKeys} />
        <TopNav active={activeTab} setActive={setActiveTab} allowedKeys={allowedKeys} />

        <main className="flex-1 p-5 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-200 pb-4 flex-wrap gap-3">
            <div>
              <h2 className="font-display text-2xl text-stone-900">{t(`title_${activeTab}`)}</h2>
              <p className="text-xs text-stone-400 font-body">{t(`sub_${activeTab}`)}</p>
            </div>
            {/* User Session Info */}
            <div className="flex items-center gap-2 bg-stone-100 px-3 py-1.5 rounded-lg text-xs font-body">
              <span className="font-semibold text-stone-800">{currentUser?.name}</span>
              <span className="text-stone-400">|</span>
              <span className="text-stone-500">{currentRole?.name}</span>
            </div>
          </div>

          {/* Core Views */}
          {activeTab === "dashboard" && <DashboardView data={data} getAccountBalance={getAccountBalance} getTypeTotal={getTypeTotal} />}
          {activeTab === "accounts" && <AccountsView accounts={data.accounts} getAccountBalance={getAccountBalance} onAdd={openAccountModal} />}
          {activeTab === "entries" && <EntriesView entries={data.entries} accounts={data.accounts} costCenters={data.costCenters} onAdd={openEntryModal} />}
          {activeTab === "inventory" && <InventoryView items={data.items} warehouses={data.warehouses} onAdd={openItemModal} onEdit={handleEditItem} />}
          {activeTab === "invoices" && <InvoicesView invoices={data.invoices} branches={data.branches} onAdd={openInvoiceModal} />}
          {activeTab === "pos" && <POSView items={data.items} warehouses={data.warehouses} onCheckout={handlePOSCheckout} />}
          {activeTab === "supplyProduction" && <SupplyProductionView purchaseOrders={data.purchaseOrders} productionOrders={data.productionOrders} customers={data.customers} items={data.items} onAddPO={openPOModal} onAddProd={openProdModal} onRunProd={handleRunProd} />}
          {activeTab === "crm" && <CRMView customers={data.customers} invoices={data.invoices} onAdd={openCRMModal} />}
          {activeTab === "hr" && <HRView employees={data.employees} payrollRuns={data.payrollRuns} onAdd={openEmpModal} onRunPayroll={handleRunPayroll} />}
          {activeTab === "fixedAssets" && <FixedAssetsView fixedAssets={data.fixedAssets} depreciationRuns={data.depreciationRuns} onAdd={openFAModal} onRunDepreciation={handleRunDepreciation} />}
          {activeTab === "orgSettings" && <OrgSettingsView branches={data.branches} warehouses={data.warehouses} costCenters={data.costCenters} onAddBranch={handleAddBranch} onAddWarehouse={handleAddWarehouse} onAddCC={handleAddCC} />}
          {activeTab === "usersRoles" && <UsersRolesView roles={data.roles} users={data.users} onAddRole={() => {}} onAddUser={() => {}} onTogglePermission={handleTogglePermission} />}
          {activeTab === "reports" && <ReportsView accounts={data.accounts} entries={data.entries} costCenters={data.costCenters} />}
          {activeTab === "settings" && <SettingsView data={data} setData={setData} />}
        </main>

        {/* --- Modals --- */}
        {showAccountModal && <AccountModal form={accountForm} setForm={setAccountForm} onSubmit={handleSaveAccount} onClose={() => setShowAccountModal(false)} />}
        {showEntryModal && <EntryModal form={entryForm} setForm={setEntryForm} accounts={data.accounts} costCenters={data.costCenters} onSubmit={handleSaveEntry} onClose={() => setShowEntryModal(false)} />}
        {showItemModal && <ItemModal form={itemForm} setForm={setItemForm} warehouses={data.warehouses} onSubmit={handleSaveItem} onClose={() => setShowItemModal(false)} editing={!!itemForm.id} />}
        {showInvoiceModal && <InvoiceModal form={invoiceForm} setForm={setInvoiceForm} items={data.items} warehouses={data.warehouses} customers={data.customers} costCenters={data.costCenters} branches={data.branches} onSubmit={handleSaveInvoice} onClose={() => setShowInvoiceModal(false)} />}
        {showPOModal && <POModal form={poForm} setForm={setPoForm} customers={data.customers} items={data.items} onSubmit={handleSavePO} onClose={() => setShowPOModal(false)} />}
        {showProdModal && <ProdModal form={prodForm} setForm={setProdForm} items={data.items} warehouses={data.warehouses} onSubmit={handleSaveProd} onClose={() => setShowProdModal(false)} />}
        {showCRMModal && <CRMModal form={crmForm} setForm={setCrmForm} onSubmit={handleSaveCRM} onClose={() => setShowCRMModal(false)} />}
        {showEmpModal && <EmployeeModal form={empForm} setForm={setEmpForm} onSubmit={handleSaveEmployee} onClose={() => setShowEmpModal(false)} />}
        {showFAModal && <FixedAssetModal form={faForm} setForm={setFaForm} onSubmit={handleSaveFixedAsset} onClose={() => setShowFAModal(false)} />}

        {/* --- Global Toast --- */}
        {toast && (
          <div className="fixed bottom-5 left-5 right-5 md:left-auto bg-stone-900 text-stone-100 text-sm font-body px-5 py-3.5 rounded-xl shadow-2xl z-50 flex items-center gap-3 border border-stone-700 animate-slide-up">
            <span>{toast}</span>
          </div>
        )}
      </div>
    </LangContext.Provider>
  );
}
