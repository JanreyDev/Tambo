"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  Plus,
  Search,
  Download,
  AlertTriangle,
  Tag,
  Boxes,
  ShoppingCart,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Bot,
  ArrowRightLeft,
  Truck,
  LayoutGrid,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Modal, ModalButton } from "@/components/ui/modal";
import { MabiniButton } from "@/components/ui/mabini-button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface InventoryCategory {
  id: string;
  name: string;
  description: string | null;
}

interface InventoryItem {
  id: string;
  barangay_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  sku: string | null;
  quantity: number;
  minimum_stock: number;
  unit: string | null;
  location: string | null;
  expiry_date: string | null;
  condition: "good" | "fair" | "poor" | "condemned";
  photo_file_id: string | null;
  status: "in_stock" | "low_stock" | "out_of_stock";
  // resolved from join/api
  category?: InventoryCategory | null;
}

interface InventoryTransaction {
  id: string;
  item_id: string;
  transaction_type: "in" | "out" | "adjustment" | "transfer" | "disposal";
  quantity: number;
  unit_cost: number | null;
  reference_number: string | null;
  notes: string | null;
  transaction_date: string | null;
  // may come joined
  item?: { name: string } | null;
}

interface Supplier {
  id: string;
  name: string;
  contact_person: string | null;
  contact_number: string | null;
  email: string | null;
  address: string | null;
  tin_number: string | null;
  notes: string | null;
}

interface Asset {
  id: string;
  name: string;
  [key: string]: unknown;
}

type ActiveTab = "items" | "transactions" | "suppliers" | "assets";

// ─── Form helpers ─────────────────────────────────────────────────────────────

function FormInput({
  label, name, value, placeholder, required, type, error, onChange, className,
}: {
  label: string; name: string; value: string; placeholder?: string;
  required?: boolean; type?: string; error?: string;
  onChange: (name: string, value: string) => void; className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type || "text"}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring",
          error ? "border-red-500" : "border-border"
        )}
      />
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FormSelect({
  label, name, value, options, required, error, onChange, className,
}: {
  label: string; name: string; value: string;
  options: { value: string; label: string }[];
  required?: boolean; error?: string;
  onChange: (name: string, value: string) => void; className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        className={cn(
          "w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring",
          error ? "border-red-500" : "border-border"
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label || "\u2014 Select \u2014"}</option>
        ))}
      </select>
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function FormTextarea({
  label, name, value, placeholder, rows, required, onChange, className,
}: {
  label: string; name: string; value: string; placeholder?: string;
  rows?: number; required?: boolean;
  onChange: (name: string, value: string) => void; className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        rows={rows || 3}
        className="w-full px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring resize-none"
      />
    </div>
  );
}

// ─── Badge helpers ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "success" | "warning" | "danger" }> = {
    in_stock:    { label: "In Stock",    variant: "success" },
    low_stock:   { label: "Low Stock",   variant: "warning" },
    out_of_stock:{ label: "Out of Stock",variant: "danger"  },
  };
  const s = map[status] ?? { label: status, variant: "warning" as const };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

function ConditionBadge({ condition }: { condition: string }) {
  const map: Record<string, { label: string; variant: "success" | "warning" | "danger" }> = {
    good:      { label: "Good",      variant: "success" },
    fair:      { label: "Fair",      variant: "warning" },
    poor:      { label: "Poor",      variant: "danger"  },
    condemned: { label: "Condemned", variant: "danger"  },
  };
  const s = map[condition] ?? { label: condition, variant: "warning" as const };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

function TxTypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    in:         "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    out:        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    adjustment: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    transfer:   "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
    disposal:   "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  };
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap capitalize", map[type] ?? "bg-muted text-muted-foreground")}>
      {type}
    </span>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

type Toast = { id: string; type: "success" | "error" | "warning" | "info"; title: string; message?: string };

function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2" style={{ maxWidth: 360 }}>
      {toasts.map((t) => (
        <div key={t.id} className={cn(
          "flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm animate-in slide-in-from-right-5 fade-in duration-300",
          t.type === "success" && "bg-green-50 dark:bg-green-950/80 border-green-200 dark:border-green-800",
          t.type === "error"   && "bg-red-50 dark:bg-red-950/80 border-red-200 dark:border-red-800",
          t.type === "warning" && "bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800",
          t.type === "info"    && "bg-blue-50 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800",
        )}>
          <div className={cn("w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold text-white",
            t.type === "success" && "bg-green-500",
            t.type === "error"   && "bg-red-500",
            t.type === "warning" && "bg-amber-500",
            t.type === "info"    && "bg-blue-500",
          )}>
            {t.type === "success" ? "\u2713" : t.type === "error" ? "\u2715" : t.type === "warning" ? "!" : "i"}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn("text-sm font-semibold",
              t.type === "success" && "text-green-800 dark:text-green-200",
              t.type === "error"   && "text-red-800 dark:text-red-200",
              t.type === "warning" && "text-amber-800 dark:text-amber-200",
              t.type === "info"    && "text-blue-800 dark:text-blue-200",
            )}>{t.title}</p>
            {t.message && <p className={cn("text-xs mt-0.5",
              t.type === "success" && "text-green-600 dark:text-green-300",
              t.type === "error"   && "text-red-600 dark:text-red-300",
              t.type === "warning" && "text-amber-600 dark:text-amber-300",
              t.type === "info"    && "text-blue-600 dark:text-blue-300",
            )}>{t.message}</p>}
          </div>
          <button onClick={() => onDismiss(t.id)} className="shrink-0 p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <span className="text-xs text-muted-foreground">&times;</span>
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

interface ItemForm {
  name: string;
  category_id: string;
  description: string;
  sku: string;
  quantity: string;
  minimum_stock: string;
  unit: string;
  location: string;
  expiry_date: string;
  condition: string;
  status: string;
}

const emptyItemForm: ItemForm = {
  name: "",
  category_id: "",
  description: "",
  sku: "",
  quantity: "0",
  minimum_stock: "0",
  unit: "",
  location: "",
  expiry_date: "",
  condition: "good",
  status: "in_stock",
};

interface TxForm {
  item_id: string;
  transaction_type: string;
  quantity: string;
  unit_cost: string;
  reference_number: string;
  notes: string;
  transaction_date: string;
}

const emptyTxForm: TxForm = {
  item_id: "",
  transaction_type: "in",
  quantity: "",
  unit_cost: "",
  reference_number: "",
  notes: "",
  transaction_date: "",
};

interface SupplierForm {
  name: string;
  contact_person: string;
  contact_number: string;
  email: string;
  address: string;
  tin_number: string;
  notes: string;
}

const emptySupplierForm: SupplierForm = {
  name: "",
  contact_person: "",
  contact_number: "",
  email: "",
  address: "",
  tin_number: "",
  notes: "",
};

const ITEM_FORM_TABS = ["Item Info", "Details"];

export default function InventoryPage() {
  const router = useRouter();

  // Data
  const [categories, setCategories]     = useState<InventoryCategory[]>([]);
  const [items, setItems]               = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [suppliers, setSuppliers]       = useState<Supplier[]>([]);
  const [assets, setAssets]             = useState<Asset[]>([]);
  const [loading, setLoading]           = useState(true);

  // UI
  const [activeTab, setActiveTab]       = useState<ActiveTab>("items");
  const [search, setSearch]             = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter]     = useState("");

  // Item modals
  const [viewItem, setViewItem]         = useState<InventoryItem | null>(null);
  const [showItemCreate, setShowItemCreate] = useState(false);
  const [showItemEdit, setShowItemEdit]     = useState(false);
  const [editingItem, setEditingItem]       = useState<InventoryItem | null>(null);
  const [showItemDelete, setShowItemDelete] = useState(false);
  const [deleteItem, setDeleteItem]         = useState<InventoryItem | null>(null);
  const [itemFormTab, setItemFormTab]       = useState(0);
  const [itemForm, setItemForm]             = useState<ItemForm>(emptyItemForm);
  const [itemFormErrors, setItemFormErrors] = useState<Record<string, string>>({});
  const [itemSubmitting, setItemSubmitting] = useState(false);

  // Transaction modal
  const [showTxCreate, setShowTxCreate] = useState(false);
  const [txForm, setTxForm]             = useState<TxForm>(emptyTxForm);
  const [txFormErrors, setTxFormErrors] = useState<Record<string, string>>({});
  const [txSubmitting, setTxSubmitting] = useState(false);

  // Supplier modals
  const [showSupplierCreate, setShowSupplierCreate] = useState(false);
  const [showSupplierEdit, setShowSupplierEdit]     = useState(false);
  const [showSupplierDelete, setShowSupplierDelete] = useState(false);
  const [editingSupplier, setEditingSupplier]       = useState<Supplier | null>(null);
  const [deleteSupplier, setDeleteSupplier]         = useState<Supplier | null>(null);
  const [supplierForm, setSupplierForm]             = useState<SupplierForm>(emptySupplierForm);
  const [supplierFormErrors, setSupplierFormErrors] = useState<Record<string, string>>({});
  const [supplierSubmitting, setSupplierSubmitting] = useState(false);

  // Action menus
  const [itemMenu, setItemMenu]         = useState<string | null>(null);
  const [supplierMenu, setSupplierMenu] = useState<string | null>(null);

  // Toasts
  const [toasts, setToasts]             = useState<Toast[]>([]);

  const addToast = useCallback((type: Toast["type"], title: string, message?: string) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, itemRes, txRes, supplierRes, assetRes] = await Promise.allSettled([
        api.get<{ data: InventoryCategory[] }>("/inventory-categories"),
        api.get<{ data: InventoryItem[] }>("/inventory-items"),
        api.get<{ data: InventoryTransaction[] }>("/inventory-transactions"),
        api.get<{ data: Supplier[] }>("/suppliers"),
        api.get<{ data: Asset[] }>("/assets"),
      ]);

      if (catRes.status === "fulfilled") {
        const r = catRes.value as { data?: InventoryCategory[] } | InventoryCategory[];
        setCategories(Array.isArray(r) ? r : (r as { data?: InventoryCategory[] }).data ?? []);
      }
      if (itemRes.status === "fulfilled") {
        const r = itemRes.value as { data?: InventoryItem[] } | InventoryItem[];
        setItems(Array.isArray(r) ? r : (r as { data?: InventoryItem[] }).data ?? []);
      }
      if (txRes.status === "fulfilled") {
        const r = txRes.value as { data?: InventoryTransaction[] } | InventoryTransaction[];
        setTransactions(Array.isArray(r) ? r : (r as { data?: InventoryTransaction[] }).data ?? []);
      }
      if (supplierRes.status === "fulfilled") {
        const r = supplierRes.value as { data?: Supplier[] } | Supplier[];
        setSuppliers(Array.isArray(r) ? r : (r as { data?: Supplier[] }).data ?? []);
      }
      if (assetRes.status === "fulfilled") {
        const r = assetRes.value as { data?: Asset[] } | Asset[];
        setAssets(Array.isArray(r) ? r : (r as { data?: Asset[] }).data ?? []);
      }
    } catch {
      addToast("error", "Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Close menus on outside click
  useEffect(() => {
    const handler = () => { setItemMenu(null); setSupplierMenu(null); };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  // ── Derived stats ──────────────────────────────────────────────────────────

  const totalItems    = items.length;
  const inStockCount  = items.filter((i) => i.status === "in_stock").length;
  const lowStockCount = items.filter((i) => i.status === "low_stock").length;
  const outStockCount = items.filter((i) => i.status === "out_of_stock").length;

  // ── Item filtering ─────────────────────────────────────────────────────────

  const filteredItems = items.filter((i) => {
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter && i.category_id !== categoryFilter) return false;
    if (statusFilter && i.status !== statusFilter) return false;
    return true;
  });

  // ── Item form ──────────────────────────────────────────────────────────────

  const handleItemField = (name: string, value: string) => {
    setItemForm((f) => ({ ...f, [name]: value } as ItemForm));
    setItemFormErrors((e) => { const n = { ...e }; delete n[name]; return n; });
  };

  const validateItemForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!itemForm.name.trim()) errors.name = "Item name is required";
    if (itemForm.quantity !== undefined && itemForm.quantity !== "" && (!Number.isInteger(Number(itemForm.quantity)) || Number(itemForm.quantity) < 0)) {
      errors.quantity = "Must be a non-negative whole number";
    }
    setItemFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openItemCreate = () => {
    setItemForm({
      ...emptyItemForm,
      quantity: "0",
      minimum_stock: "0",
      condition: "good",
      status: "in_stock"
    });
    setItemFormErrors({});
    setItemFormTab(0);
    setShowItemCreate(true);
  };

  const openItemEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setItemForm({
      name:          item.name,
      category_id:   item.category_id ?? "",
      description:   item.description ?? "",
      sku:           item.sku ?? "",
      quantity:      String(item.quantity),
      minimum_stock: String(item.minimum_stock),
      unit:          item.unit ?? "",
      location:      item.location ?? "",
      expiry_date:   item.expiry_date ?? "",
      condition:     item.condition,
      status:        item.status,
    });
    setItemFormErrors({});
    setItemFormTab(0);
    setItemMenu(null);
    setShowItemEdit(true);
  };

  const submitItemCreate = async () => {
    if (!validateItemForm()) return;
    setItemSubmitting(true);
    try {
      const res = await api.post<{ data?: InventoryItem; message?: string }>("/inventory-items", {
        name:          itemForm.name.trim(),
        category_id:   itemForm.category_id || undefined,
        description:   itemForm.description || undefined,
        sku:           itemForm.sku || undefined,
        quantity:      Number(itemForm.quantity || 0),
        minimum_stock: Number(itemForm.minimum_stock || 0),
        unit:          itemForm.unit || undefined,
        location:      itemForm.location || undefined,
        expiry_date:   itemForm.expiry_date || undefined,
        condition:     itemForm.condition || "good",
        status:        itemForm.status || "in_stock",
      });
      const newItem = (res as { data?: InventoryItem }).data ?? (res as unknown as InventoryItem);
      if (newItem?.id) setItems((prev) => [newItem, ...prev]);
      addToast("success", "Item Added", `${itemForm.name} has been added to inventory.`);
      setShowItemCreate(false);
      fetchAll();
    } catch (err: unknown) {
      addToast("error", "Failed to add item", (err as { message?: string })?.message);
    } finally {
      setItemSubmitting(false);
    }
  };

  const submitItemEdit = async () => {
    if (!editingItem || !validateItemForm()) return;
    setItemSubmitting(true);
    try {
      await api.put(`/inventory-items/${editingItem.id}`, {
        name:          itemForm.name.trim(),
        category_id:   itemForm.category_id || undefined,
        description:   itemForm.description || undefined,
        sku:           itemForm.sku || undefined,
        quantity:      Number(itemForm.quantity || 0),
        minimum_stock: Number(itemForm.minimum_stock || 0),
        unit:          itemForm.unit || undefined,
        location:      itemForm.location || undefined,
        expiry_date:   itemForm.expiry_date || undefined,
        condition:     itemForm.condition || "good",
        status:        itemForm.status || "in_stock",
      });
      addToast("success", "Item Updated", `${itemForm.name} has been updated.`);
      setShowItemEdit(false);
      setEditingItem(null);
      fetchAll();
    } catch (err: unknown) {
      addToast("error", "Failed to update item", (err as { message?: string })?.message);
    } finally {
      setItemSubmitting(false);
    }
  };

  const submitItemDelete = async () => {
    if (!deleteItem) return;
    try {
      await api.delete(`/inventory-items/${deleteItem.id}`);
      setItems((prev) => prev.filter((i) => i.id !== deleteItem.id));
      addToast("success", "Item Deleted", `${deleteItem.name} has been removed.`);
      setShowItemDelete(false);
      setDeleteItem(null);
    } catch (err: unknown) {
      addToast("error", "Failed to delete item", (err as { message?: string })?.message);
    }
  };

  // ── Transaction form ───────────────────────────────────────────────────────

  const handleTxField = (name: string, value: string) => {
    setTxForm((f) => ({ ...f, [name]: value } as TxForm));
    setTxFormErrors((e) => { const n = { ...e }; delete n[name]; return n; });
  };

  const validateTxForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!txForm.item_id) errors.item_id = "Item is required";
    if (!txForm.transaction_type) errors.transaction_type = "Transaction type is required";
    if (!txForm.quantity.trim()) errors.quantity = "Quantity is required";
    else if (!Number.isInteger(Number(txForm.quantity)) || Number(txForm.quantity) <= 0) {
      errors.quantity = "Must be a positive whole number";
    }
    setTxFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openTxCreate = () => {
    setTxForm({
      ...emptyTxForm,
      transaction_type: "in",
      quantity: "",
      transaction_date: new Date().toISOString().split("T")[0] ?? ""
    });
    setTxFormErrors({});
    setShowTxCreate(true);
  };

  const submitTxCreate = async () => {
    if (!validateTxForm()) return;
    setTxSubmitting(true);
    try {
      await api.post("/inventory-transactions", {
        item_id:          txForm.item_id,
        transaction_type: txForm.transaction_type,
        quantity:         Number(txForm.quantity),
        unit_cost:        txForm.unit_cost ? Number(txForm.unit_cost) : undefined,
        reference_number: txForm.reference_number || undefined,
        notes:            txForm.notes || undefined,
        transaction_date: txForm.transaction_date || undefined,
      });
      addToast("success", "Transaction Logged", "Inventory transaction has been recorded.");
      setShowTxCreate(false);
      fetchAll();
    } catch (err: unknown) {
      addToast("error", "Failed to log transaction", (err as { message?: string })?.message);
    } finally {
      setTxSubmitting(false);
    }
  };

  // ── Supplier form ──────────────────────────────────────────────────────────

  const handleSupplierField = (name: string, value: string) => {
    setSupplierForm((f) => ({ ...f, [name]: value } as SupplierForm));
    setSupplierFormErrors((e) => { const n = { ...e }; delete n[name]; return n; });
  };

  const validateSupplierForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!supplierForm.name.trim()) errors.name = "Supplier name is required";
    setSupplierFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openSupplierCreate = () => {
    setSupplierForm(emptySupplierForm);
    setSupplierFormErrors({});
    setShowSupplierCreate(true);
  };

  const openSupplierEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setSupplierForm({
      name:           s.name,
      contact_person: s.contact_person ?? "",
      contact_number: s.contact_number ?? "",
      email:          s.email ?? "",
      address:        s.address ?? "",
      tin_number:     s.tin_number ?? "",
      notes:          s.notes ?? "",
    });
    setSupplierFormErrors({});
    setSupplierMenu(null);
    setShowSupplierEdit(true);
  };

  const submitSupplierCreate = async () => {
    if (!validateSupplierForm()) return;
    setSupplierSubmitting(true);
    try {
      await api.post("/suppliers", {
        name:           supplierForm.name.trim(),
        contact_person: supplierForm.contact_person || undefined,
        contact_number: supplierForm.contact_number || undefined,
        email:          supplierForm.email || undefined,
        address:        supplierForm.address || undefined,
        tin_number:     supplierForm.tin_number || undefined,
        notes:          supplierForm.notes || undefined,
      });
      addToast("success", "Supplier Added", `${supplierForm.name} has been added.`);
      setShowSupplierCreate(false);
      fetchAll();
    } catch (err: unknown) {
      addToast("error", "Failed to add supplier", (err as { message?: string })?.message);
    } finally {
      setSupplierSubmitting(false);
    }
  };

  const submitSupplierEdit = async () => {
    if (!editingSupplier || !validateSupplierForm()) return;
    setSupplierSubmitting(true);
    try {
      await api.post(`/suppliers`, {
        name:           supplierForm.name.trim(),
        contact_person: supplierForm.contact_person || undefined,
        contact_number: supplierForm.contact_number || undefined,
        email:          supplierForm.email || undefined,
        address:        supplierForm.address || undefined,
        tin_number:     supplierForm.tin_number || undefined,
        notes:          supplierForm.notes || undefined,
      });
      addToast("success", "Supplier Updated", `${supplierForm.name} has been updated.`);
      setShowSupplierEdit(false);
      setEditingSupplier(null);
      fetchAll();
    } catch (err: unknown) {
      addToast("error", "Failed to update supplier", (err as { message?: string })?.message);
    } finally {
      setSupplierSubmitting(false);
    }
  };

  const submitSupplierDelete = async () => {
    if (!deleteSupplier) return;
    try {
      await api.delete(`/suppliers/${deleteSupplier.id}`);
      setSuppliers((prev) => prev.filter((s) => s.id !== deleteSupplier.id));
      addToast("success", "Supplier Deleted", `${deleteSupplier.name} has been removed.`);
      setShowSupplierDelete(false);
      setDeleteSupplier(null);
    } catch (err: unknown) {
      addToast("error", "Failed to delete supplier", (err as { message?: string })?.message);
    }
  };

  // ── Category name lookup ───────────────────────────────────────────────────

  const categoryName = (id: string | null | undefined): string => {
    if (!id) return "—";
    return categories.find((c) => c.id === id)?.name ?? "—";
  };

  // ── Item name lookup ───────────────────────────────────────────────────────

  const itemName = (id: string | null | undefined): string => {
    if (!id) return "—";
    return items.find((i) => i.id === id)?.name ?? "—";
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Inventory"
        description="Track barangay property, supplies, and assets"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Operations" },
          { label: "Inventory" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => addToast("info", "Export started", "Inventory report is being generated.")}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
            >
              <Download className="h-4 w-4" /> Export
            </button>
            <button
              onClick={openItemCreate}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors"
              style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}
            >
              <Plus className="h-4 w-4" /> Add Item
            </button>
          </div>
        }
      />

      {/* Mabini AI Banner */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-accent-primary/20 bg-accent-bg/30">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-accent-bg">
          <Bot className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">Mabini AI Inventory Insights</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            Ask Mabini to analyze stock levels, identify expiring items, or recommend reorder quantities based on transaction history.
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard/ai")}
          className="shrink-0 px-3 py-1.5 text-[10px] font-semibold rounded-lg hover:opacity-80 transition-opacity"
          style={{ background: "var(--accent-primary)", color: "#fff" }}
        >
          Ask Mabini
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Items"
          value={loading ? "—" : totalItems}
          icon={<Package className="h-5 w-5" />}
        />
        <StatCard
          label="In Stock"
          value={loading ? "—" : inStockCount}
          icon={<Boxes className="h-5 w-5" />}
        />
        <StatCard
          label="Low Stock"
          value={loading ? "—" : lowStockCount}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <StatCard
          label="Out of Stock"
          value={loading ? "—" : outStockCount}
          icon={<ShoppingCart className="h-5 w-5" />}
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg glass-subtle w-fit">
        {(["items", "transactions", "suppliers", "assets"] as ActiveTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize",
              activeTab === tab
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Items Tab ── */}
      {activeTab === "items" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search items..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl glass-input focus:outline-none focus:ring-2 focus:ring-accent-ring"
            >
              <option value="">All Status</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>

          {/* Table */}
          <div className="rounded-xl glass overflow-hidden">
            {loading ? (
              <div className="p-12 flex justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-accent-primary border-t-transparent animate-spin" />
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Item</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Qty / Unit</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Condition</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Location</th>
                    <th className="w-10 px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-16">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                            <Package className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-foreground">No inventory items found</p>
                            <p className="text-xs text-muted-foreground mt-1">Add barangay property and supplies to start tracking stock levels.</p>
                          </div>
                          <button
                            onClick={openItemCreate}
                            className="px-4 py-2 text-xs font-semibold rounded-lg text-white"
                            style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}
                          >
                            + Add Item
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => setViewItem(item)}
                        className={cn(
                          "border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors",
                          item.status === "out_of_stock" && "bg-red-50/40 dark:bg-red-950/10",
                          item.status === "low_stock"    && "bg-amber-50/40 dark:bg-amber-950/10",
                        )}
                      >
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-foreground">{item.name}</p>
                          {item.sku && <p className="text-[11px] text-muted-foreground">{item.sku}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="muted">{categoryName(item.category_id)}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("text-sm font-medium",
                            item.status === "out_of_stock" ? "text-red-600 dark:text-red-400" :
                            item.status === "low_stock"    ? "text-amber-600 dark:text-amber-400" :
                            "text-foreground"
                          )}>
                            {item.quantity}{item.unit ? ` ${item.unit}` : ""}
                          </span>
                          {item.status !== "in_stock" && (
                            <AlertTriangle className="h-3 w-3 text-amber-500 inline ml-1" />
                          )}
                          <p className="text-[11px] text-muted-foreground">min: {item.minimum_stock}</p>
                        </td>
                        <td className="px-4 py-3"><ConditionBadge condition={item.condition} /></td>
                        <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{item.location ?? "—"}</td>
                        <td className="px-2 py-3">
                          <div
                            className="relative"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={(e) => { e.stopPropagation(); setItemMenu(itemMenu === item.id ? null : item.id); }}
                              className="p-1.5 rounded hover:bg-muted"
                            >
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </button>
                            {itemMenu === item.id && (
                              <div className="absolute right-0 top-8 z-20 w-44 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-border py-1">
                                <button onClick={() => { setViewItem(item); setItemMenu(null); }} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2">
                                  <Eye className="h-3.5 w-3.5" /> View
                                </button>
                                <button onClick={() => openItemEdit(item)} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2">
                                  <Edit className="h-3.5 w-3.5" /> Edit
                                </button>
                                <button onClick={() => { setDeleteItem(item); setShowItemDelete(true); setItemMenu(null); }} className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-muted flex items-center gap-2">
                                  <Trash2 className="h-3.5 w-3.5" /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── Transactions Tab ── */}
      {activeTab === "transactions" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={openTxCreate}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors"
              style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}
            >
              <Plus className="h-4 w-4" /> Log Transaction
            </button>
          </div>

          <div className="rounded-xl glass overflow-hidden">
            {loading ? (
              <div className="p-12 flex justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-accent-primary border-t-transparent animate-spin" />
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Item</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Qty</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Reference #</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-16">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                            <ArrowRightLeft className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-foreground">No transactions recorded</p>
                            <p className="text-xs text-muted-foreground mt-1">Log stock movements to keep inventory records accurate.</p>
                          </div>
                          <button
                            onClick={openTxCreate}
                            className="px-4 py-2 text-xs font-semibold rounded-lg text-white"
                            style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}
                          >
                            + Log Transaction
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3"><TxTypeBadge type={tx.transaction_type} /></td>
                        <td className="px-4 py-3 text-sm text-foreground">{tx.item?.name ?? itemName(tx.item_id)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-foreground">{tx.quantity}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{tx.reference_number ?? "—"}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{tx.transaction_date ?? "—"}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">{tx.notes ?? "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── Suppliers Tab ── */}
      {activeTab === "suppliers" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={openSupplierCreate}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors"
              style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}
            >
              <Plus className="h-4 w-4" /> Add Supplier
            </button>
          </div>

          <div className="rounded-xl glass overflow-hidden">
            {loading ? (
              <div className="p-12 flex justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-accent-primary border-t-transparent animate-spin" />
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Supplier</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Contact Person</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Phone</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">TIN</th>
                    <th className="w-10 px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {suppliers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-16">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                            <Truck className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-foreground">No suppliers on record</p>
                            <p className="text-xs text-muted-foreground mt-1">Add your barangay&apos;s suppliers and vendors.</p>
                          </div>
                          <button
                            onClick={openSupplierCreate}
                            className="px-4 py-2 text-xs font-semibold rounded-lg text-white"
                            style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)" }}
                          >
                            + Add Supplier
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    suppliers.map((s) => (
                      <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-foreground">{s.name}</p>
                          {s.address && <p className="text-[11px] text-muted-foreground">{s.address}</p>}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{s.contact_person ?? "—"}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{s.contact_number ?? "—"}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{s.email ?? "—"}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{s.tin_number ?? "—"}</td>
                        <td className="px-2 py-3">
                          <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => { e.stopPropagation(); setSupplierMenu(supplierMenu === s.id ? null : s.id); }}
                              className="p-1.5 rounded hover:bg-muted"
                            >
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </button>
                            {supplierMenu === s.id && (
                              <div className="absolute right-0 top-8 z-20 w-44 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-border py-1">
                                <button onClick={() => openSupplierEdit(s)} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2">
                                  <Edit className="h-3.5 w-3.5" /> Edit
                                </button>
                                <button onClick={() => { setDeleteSupplier(s); setShowSupplierDelete(true); setSupplierMenu(null); }} className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-muted flex items-center gap-2">
                                  <Trash2 className="h-3.5 w-3.5" /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── Assets Tab ── */}
      {activeTab === "assets" && (
        <div className="space-y-4">
          <div className="rounded-xl glass overflow-hidden">
            {loading ? (
              <div className="p-12 flex justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-accent-primary border-t-transparent animate-spin" />
              </div>
            ) : assets.length === 0 ? (
              <div className="p-16 flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <LayoutGrid className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">No assets on record</p>
                  <p className="text-xs text-muted-foreground mt-1">Barangay assets will appear here once they are registered in the system.</p>
                </div>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Asset Name</th>
                    {Object.keys(assets[0] ?? {}).filter((k) => k !== "id" && k !== "name").slice(0, 4).map((key) => (
                      <th key={key} className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {key.replace(/_/g, " ")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset) => (
                    <tr key={asset.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{asset.name}</td>
                      {Object.keys(assets[0] ?? {}).filter((k) => k !== "id" && k !== "name").slice(0, 4).map((key) => (
                        <td key={key} className="px-4 py-3 text-sm text-muted-foreground">
                          {String(asset[key] ?? "—")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── View Item Modal ── */}
      <Modal
        open={!!viewItem}
        onClose={() => setViewItem(null)}
        title={viewItem?.name ?? ""}
        description={categoryName(viewItem?.category_id)}
        size="md"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => setViewItem(null)}>Close</ModalButton>
            <ModalButton variant="primary" onClick={() => { if (viewItem) { openItemEdit(viewItem); setViewItem(null); } }}>
              Edit Item
            </ModalButton>
          </>
        }
      >
        {viewItem && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <ConditionBadge condition={viewItem.condition} />
              <StatusBadge status={viewItem.status} />
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase">Quantity</p>
                <p className="text-sm">{viewItem.quantity} {viewItem.unit ?? ""}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase">Min Stock</p>
                <p className="text-sm">{viewItem.minimum_stock}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase">Location</p>
                <p className="text-sm">{viewItem.location ?? "Not indicated"}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase">SKU</p>
                <p className="text-sm">{viewItem.sku ?? "—"}</p>
              </div>
              {viewItem.expiry_date && (
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase">Expiry Date</p>
                  <p className="text-sm">{viewItem.expiry_date}</p>
                </div>
              )}
              {viewItem.description && (
                <div className="col-span-2">
                  <p className="text-[11px] text-muted-foreground uppercase">Description</p>
                  <p className="text-sm">{viewItem.description}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Create Item Modal ── */}
      <Modal
        open={showItemCreate}
        onClose={() => { setShowItemCreate(false); }}
        title="Add New Item"
        size="lg"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => setShowItemCreate(false)}>Cancel</ModalButton>
            {itemFormTab > 0 && (
              <ModalButton variant="secondary" onClick={() => setItemFormTab((t) => t - 1)}>Previous</ModalButton>
            )}
            {itemFormTab < ITEM_FORM_TABS.length - 1 ? (
              <ModalButton variant="primary" onClick={() => setItemFormTab((t) => t + 1)}>Next</ModalButton>
            ) : (
              <ModalButton variant="primary" onClick={submitItemCreate} disabled={itemSubmitting}>
                {itemSubmitting ? "Saving…" : "Save Item"}
              </ModalButton>
            )}
          </>
        }
      >
        <div className="flex border-b border-border mb-6">
          {ITEM_FORM_TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setItemFormTab(i)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                itemFormTab === i
                  ? "border-accent-primary text-accent-text"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {itemFormTab === 0 && (
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              className="col-span-2"
              onChange={handleItemField}
              label="Item Name"
              name="name"
              value={itemForm.name ?? ""}
              placeholder="e.g. Office Chair"
              required
              error={itemFormErrors.name}
            />
            <FormSelect
              onChange={handleItemField}
              label="Category"
              name="category_id"
              value={itemForm.category_id ?? ""}
              options={[{ value: "", label: "— Select Category —" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
            />
            <FormInput
              onChange={handleItemField}
              label="SKU / Code"
              name="sku"
              value={itemForm.sku ?? ""}
              placeholder="e.g. INV-2026-001"
            />
            <FormInput
              onChange={handleItemField}
              label="Quantity"
              name="quantity"
              value={itemForm.quantity ?? "0"}
              type="number"
              placeholder="0"
              required
              error={itemFormErrors.quantity}
            />
            <FormInput
              onChange={handleItemField}
              label="Minimum Stock Level"
              name="minimum_stock"
              value={itemForm.minimum_stock ?? "0"}
              type="number"
              placeholder="0"
            />
            <FormInput
              onChange={handleItemField}
              label="Unit"
              name="unit"
              value={itemForm.unit ?? ""}
              placeholder="e.g. pcs, box, ream"
            />
            <FormTextarea
              className="col-span-2"
              onChange={handleItemField}
              label="Description"
              name="description"
              value={itemForm.description ?? ""}
              placeholder="Optional description of this item"
            />
          </div>
        )}

        {itemFormTab === 1 && (
          <div className="grid grid-cols-2 gap-4">
            <FormSelect
              onChange={handleItemField}
              label="Condition"
              name="condition"
              value={itemForm.condition ?? "good"}
              options={[
                { value: "good",      label: "Good" },
                { value: "fair",      label: "Fair" },
                { value: "poor",      label: "Poor" },
                { value: "condemned", label: "Condemned" },
              ]}
              required
            />
            <FormSelect
              onChange={handleItemField}
              label="Status"
              name="status"
              value={itemForm.status ?? "in_stock"}
              options={[
                { value: "in_stock",    label: "In Stock" },
                { value: "low_stock",   label: "Low Stock" },
                { value: "out_of_stock",label: "Out of Stock" },
              ]}
              required
            />
            <FormInput
              onChange={handleItemField}
              label="Storage Location"
              name="location"
              value={itemForm.location ?? ""}
              placeholder="e.g. Storage Room, Health Center"
            />
            <FormInput
              onChange={handleItemField}
              label="Expiry Date"
              name="expiry_date"
              value={itemForm.expiry_date ?? ""}
              type="date"
            />
          </div>
        )}
      </Modal>

      {/* ── Edit Item Modal ── */}
      <Modal
        open={showItemEdit}
        onClose={() => { setShowItemEdit(false); setEditingItem(null); }}
        title="Edit Item"
        size="lg"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => { setShowItemEdit(false); setEditingItem(null); }}>Cancel</ModalButton>
            {itemFormTab > 0 && (
              <ModalButton variant="secondary" onClick={() => setItemFormTab((t) => t - 1)}>Previous</ModalButton>
            )}
            {itemFormTab < ITEM_FORM_TABS.length - 1 ? (
              <ModalButton variant="primary" onClick={() => setItemFormTab((t) => t + 1)}>Next</ModalButton>
            ) : (
              <ModalButton variant="primary" onClick={submitItemEdit} disabled={itemSubmitting}>
                {itemSubmitting ? "Saving…" : "Update Item"}
              </ModalButton>
            )}
          </>
        }
      >
        <div className="flex border-b border-border mb-6">
          {ITEM_FORM_TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setItemFormTab(i)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                itemFormTab === i
                  ? "border-accent-primary text-accent-text"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {itemFormTab === 0 && (
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              className="col-span-2"
              onChange={handleItemField}
              label="Item Name"
              name="name"
              value={itemForm.name ?? ""}
              placeholder="e.g. Office Chair"
              required
              error={itemFormErrors.name}
            />
            <FormSelect
              onChange={handleItemField}
              label="Category"
              name="category_id"
              value={itemForm.category_id ?? ""}
              options={[{ value: "", label: "— Select Category —" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
            />
            <FormInput
              onChange={handleItemField}
              label="SKU / Code"
              name="sku"
              value={itemForm.sku ?? ""}
              placeholder="e.g. INV-2026-001"
            />
            <FormInput
              onChange={handleItemField}
              label="Quantity"
              name="quantity"
              value={itemForm.quantity ?? "0"}
              type="number"
              required
              error={itemFormErrors.quantity}
            />
            <FormInput
              onChange={handleItemField}
              label="Minimum Stock Level"
              name="minimum_stock"
              value={itemForm.minimum_stock ?? "0"}
              type="number"
            />
            <FormInput
              onChange={handleItemField}
              label="Unit"
              name="unit"
              value={itemForm.unit ?? ""}
              placeholder="e.g. pcs, box, ream"
            />
            <FormTextarea
              className="col-span-2"
              onChange={handleItemField}
              label="Description"
              name="description"
              value={itemForm.description ?? ""}
              placeholder="Optional description"
            />
          </div>
        )}

        {itemFormTab === 1 && (
          <div className="grid grid-cols-2 gap-4">
            <FormSelect
              onChange={handleItemField}
              label="Condition"
              name="condition"
              value={itemForm.condition ?? "good"}
              options={[
                { value: "good",      label: "Good" },
                { value: "fair",      label: "Fair" },
                { value: "poor",      label: "Poor" },
                { value: "condemned", label: "Condemned" },
              ]}
              required
            />
            <FormSelect
              onChange={handleItemField}
              label="Status"
              name="status"
              value={itemForm.status ?? "in_stock"}
              options={[
                { value: "in_stock",    label: "In Stock" },
                { value: "low_stock",   label: "Low Stock" },
                { value: "out_of_stock",label: "Out of Stock" },
              ]}
              required
            />
            <FormInput
              onChange={handleItemField}
              label="Storage Location"
              name="location"
              value={itemForm.location ?? ""}
              placeholder="e.g. Storage Room, Health Center"
            />
            <FormInput
              onChange={handleItemField}
              label="Expiry Date"
              name="expiry_date"
              value={itemForm.expiry_date ?? ""}
              type="date"
            />
          </div>
        )}
      </Modal>

      {/* ── Delete Item Modal ── */}
      <Modal
        open={showItemDelete}
        onClose={() => { setShowItemDelete(false); setDeleteItem(null); }}
        title="Delete Item"
        description="This action cannot be undone."
        size="sm"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => { setShowItemDelete(false); setDeleteItem(null); }}>Cancel</ModalButton>
            <ModalButton variant="danger" onClick={submitItemDelete}>Delete</ModalButton>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-foreground">{deleteItem?.name}</span>?
          All associated transaction records may also be affected.
        </p>
      </Modal>

      {/* ── Log Transaction Modal ── */}
      <Modal
        open={showTxCreate}
        onClose={() => setShowTxCreate(false)}
        title="Log Inventory Transaction"
        size="md"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => setShowTxCreate(false)}>Cancel</ModalButton>
            <ModalButton variant="primary" onClick={submitTxCreate} disabled={txSubmitting}>
              {txSubmitting ? "Saving…" : "Log Transaction"}
            </ModalButton>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <FormSelect
            className="col-span-2"
            onChange={handleTxField}
            label="Item"
            name="item_id"
            value={txForm.item_id ?? ""}
            options={[{ value: "", label: "— Select Item —" }, ...items.map((i) => ({ value: i.id, label: i.name }))]}
            required
            error={txFormErrors.item_id}
          />
          <FormSelect
            onChange={handleTxField}
            label="Transaction Type"
            name="transaction_type"
            value={txForm.transaction_type ?? "in"}
            options={[
              { value: "in",         label: "Stock In" },
              { value: "out",        label: "Stock Out" },
              { value: "adjustment", label: "Adjustment" },
              { value: "transfer",   label: "Transfer" },
              { value: "disposal",   label: "Disposal" },
            ]}
            required
            error={txFormErrors.transaction_type}
          />
          <FormInput
            onChange={handleTxField}
            label="Quantity"
            name="quantity"
            value={txForm.quantity ?? ""}
            type="number"
            placeholder="e.g. 10"
            required
            error={txFormErrors.quantity}
          />
          <FormInput
            onChange={handleTxField}
            label="Unit Cost (optional)"
            name="unit_cost"
            value={txForm.unit_cost ?? ""}
            type="number"
            placeholder="e.g. 350.00"
          />
          <FormInput
            onChange={handleTxField}
            label="Reference Number"
            name="reference_number"
            value={txForm.reference_number ?? ""}
            placeholder="e.g. PO-2026-001"
          />
          <FormInput
            onChange={handleTxField}
            label="Transaction Date"
            name="transaction_date"
            value={txForm.transaction_date ?? ""}
            type="date"
          />
          <FormTextarea
            className="col-span-2"
            onChange={handleTxField}
            label="Notes"
            name="notes"
            value={txForm.notes ?? ""}
            placeholder="Additional details about this transaction"
          />
        </div>
      </Modal>

      {/* ── Create Supplier Modal ── */}
      <Modal
        open={showSupplierCreate}
        onClose={() => setShowSupplierCreate(false)}
        title="Add Supplier"
        size="md"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => setShowSupplierCreate(false)}>Cancel</ModalButton>
            <ModalButton variant="primary" onClick={submitSupplierCreate} disabled={supplierSubmitting}>
              {supplierSubmitting ? "Saving…" : "Save Supplier"}
            </ModalButton>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            className="col-span-2"
            onChange={handleSupplierField}
            label="Supplier Name"
            name="name"
            value={supplierForm.name ?? ""}
            placeholder="e.g. Office Warehouse Ph"
            required
            error={supplierFormErrors.name}
          />
          <FormInput
            onChange={handleSupplierField}
            label="Contact Person"
            name="contact_person"
            value={supplierForm.contact_person ?? ""}
            placeholder="e.g. Juan dela Cruz"
          />
          <FormInput
            onChange={handleSupplierField}
            label="Contact Number"
            name="contact_number"
            value={supplierForm.contact_number ?? ""}
            placeholder="e.g. 09171234567"
          />
          <FormInput
            onChange={handleSupplierField}
            label="Email"
            name="email"
            value={supplierForm.email ?? ""}
            type="email"
            placeholder="supplier@email.com"
          />
          <FormInput
            onChange={handleSupplierField}
            label="TIN Number"
            name="tin_number"
            value={supplierForm.tin_number ?? ""}
            placeholder="e.g. 000-000-000-000"
          />
          <FormTextarea
            className="col-span-2"
            onChange={handleSupplierField}
            label="Address"
            name="address"
            value={supplierForm.address ?? ""}
            placeholder="Complete address"
            rows={2}
          />
          <FormTextarea
            className="col-span-2"
            onChange={handleSupplierField}
            label="Notes"
            name="notes"
            value={supplierForm.notes ?? ""}
            placeholder="Additional notes"
            rows={2}
          />
        </div>
      </Modal>

      {/* ── Edit Supplier Modal ── */}
      <Modal
        open={showSupplierEdit}
        onClose={() => { setShowSupplierEdit(false); setEditingSupplier(null); }}
        title="Edit Supplier"
        size="md"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => { setShowSupplierEdit(false); setEditingSupplier(null); }}>Cancel</ModalButton>
            <ModalButton variant="primary" onClick={submitSupplierEdit} disabled={supplierSubmitting}>
              {supplierSubmitting ? "Saving…" : "Update Supplier"}
            </ModalButton>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            className="col-span-2"
            onChange={handleSupplierField}
            label="Supplier Name"
            name="name"
            value={supplierForm.name ?? ""}
            required
            error={supplierFormErrors.name}
          />
          <FormInput
            onChange={handleSupplierField}
            label="Contact Person"
            name="contact_person"
            value={supplierForm.contact_person ?? ""}
          />
          <FormInput
            onChange={handleSupplierField}
            label="Contact Number"
            name="contact_number"
            value={supplierForm.contact_number ?? ""}
          />
          <FormInput
            onChange={handleSupplierField}
            label="Email"
            name="email"
            value={supplierForm.email ?? ""}
            type="email"
          />
          <FormInput
            onChange={handleSupplierField}
            label="TIN Number"
            name="tin_number"
            value={supplierForm.tin_number ?? ""}
          />
          <FormTextarea
            className="col-span-2"
            onChange={handleSupplierField}
            label="Address"
            name="address"
            value={supplierForm.address ?? ""}
            rows={2}
          />
          <FormTextarea
            className="col-span-2"
            onChange={handleSupplierField}
            label="Notes"
            name="notes"
            value={supplierForm.notes ?? ""}
            rows={2}
          />
        </div>
      </Modal>

      {/* ── Delete Supplier Modal ── */}
      <Modal
        open={showSupplierDelete}
        onClose={() => { setShowSupplierDelete(false); setDeleteSupplier(null); }}
        title="Delete Supplier"
        description="This action cannot be undone."
        size="sm"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => { setShowSupplierDelete(false); setDeleteSupplier(null); }}>Cancel</ModalButton>
            <ModalButton variant="danger" onClick={submitSupplierDelete}>Delete</ModalButton>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          Are you sure you want to remove{" "}
          <span className="font-semibold text-foreground">{deleteSupplier?.name}</span>{" "}
          from the supplier list?
        </p>
      </Modal>

      {/* Toast stack */}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      <MabiniButton pageContext="You are on the Inventory page. This page manages barangay equipment, supplies, assets, transactions, and suppliers. You can ask about stock levels, expiring items, low stock alerts, or supplier details." />
    </div>
  );
}
