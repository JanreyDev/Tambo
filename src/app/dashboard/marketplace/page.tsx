"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  Loader2,
  ShoppingBag,
  Package,
  ChevronRight,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  Star,
  TrendingUp,
  Truck,
  ReceiptText,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface MarketplaceProduct {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  original_price: number | null;
  stock_qty: number;
  unit: string;
  sku: string | null;
  supplier_name: string | null;
  image_file_id: string | null;
  rating: number;
  total_orders: number;
  is_active: boolean;
  is_featured: boolean;
  tag: string | null;
  created_at: string;
  updated_at: string;
}

interface MarketplaceOrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  subtotal: number;
}

interface MarketplaceOrder {
  id: string;
  barangay_id: string;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string | null;
  subtotal: number;
  total_amount: number;
  delivery_address: string;
  contact_person: string;
  contact_number: string;
  po_number: string | null;
  notes: string | null;
  expected_delivery_date: string | null;
  delivered_date: string | null;
  created_at: string;
  items: MarketplaceOrderItem[];
}

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

type ProductFormData = {
  name: string;
  description: string;
  category: string;
  price: string;
  original_price: string;
  stock_qty: string;
  unit: string;
  sku: string;
  supplier_name: string;
  is_active: boolean;
  is_featured: boolean;
  tag: string;
};

const EMPTY_FORM: ProductFormData = {
  name: "",
  description: "",
  category: "",
  price: "",
  original_price: "",
  stock_qty: "",
  unit: "",
  sku: "",
  supplier_name: "",
  is_active: true,
  is_featured: false,
  tag: "",
};

const CATEGORIES = [
  "Office Supplies",
  "Cleaning & Sanitation",
  "Medical & Health",
  "IT Equipment",
  "Furniture",
  "Electrical",
  "Plumbing",
  "Construction",
  "Food & Groceries",
  "Forms & Documents",
  "Others",
];

const UNITS = ["pc", "box", "pack", "ream", "roll", "set", "pair", "kg", "liter", "meter", "bottle", "bag"];

const ORDER_STATUSES = [
  { value: "pending",    label: "Pending",    color: "amber" },
  { value: "confirmed",  label: "Confirmed",  color: "blue" },
  { value: "processing", label: "Processing", color: "violet" },
  { value: "shipped",    label: "Shipped",    color: "indigo" },
  { value: "delivered",  label: "Delivered",  color: "green" },
  { value: "cancelled",  label: "Cancelled",  color: "red" },
];

const PAYMENT_STATUSES = [
  { value: "unpaid",   label: "Unpaid",   color: "red" },
  { value: "partial",  label: "Partial",  color: "amber" },
  { value: "paid",     label: "Paid",     color: "green" },
  { value: "refunded", label: "Refunded", color: "slate" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function peso(amount: number): string {
  return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

function orderStatusStyle(status: string): string {
  const s = ORDER_STATUSES.find((o) => o.value === status);
  if (!s) return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  const map: Record<string, string> = {
    amber:  "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
    blue:   "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
    violet: "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400",
    indigo: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400",
    green:  "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400",
    red:    "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
    slate:  "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  };
  return map[s.color] ?? map.slate;
}

function paymentStatusStyle(status: string): string {
  const s = PAYMENT_STATUSES.find((p) => p.value === status);
  if (!s) return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  const map: Record<string, string> = {
    red:   "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
    green: "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400",
    slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  };
  return map[s.color] ?? map.slate;
}

// ── API calls ─────────────────────────────────────────────────────────────────

const marketplaceApi = {
  products: {
    list(params: Record<string, string>): Promise<PaginatedResponse<MarketplaceProduct>> {
      return api.get("/founder/bcmp/marketplace/products", { params });
    },
    create(data: Record<string, unknown>): Promise<{ product: MarketplaceProduct }> {
      return api.post("/founder/bcmp/marketplace/products", data);
    },
    update(id: string, data: Record<string, unknown>): Promise<{ product: MarketplaceProduct }> {
      return api.put(`/founder/bcmp/marketplace/products/${id}`, data);
    },
    delete(id: string): Promise<{ message: string }> {
      return api.delete(`/founder/bcmp/marketplace/products/${id}`);
    },
  },
  orders: {
    list(params: Record<string, string>): Promise<PaginatedResponse<MarketplaceOrder>> {
      return api.get("/founder/bcmp/marketplace/orders", { params });
    },
    updateStatus(
      id: string,
      data: Record<string, string | null>,
    ): Promise<{ order: MarketplaceOrder }> {
      return api.patch(`/founder/bcmp/marketplace/orders/${id}/status`, data);
    },
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const [tab, setTab] = useState<"products" | "orders">("products");

  // Products state
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsMeta, setProductsMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [productSearch, setProductSearch] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productActiveFilter, setProductActiveFilter] = useState<"" | "true" | "false">("");
  const [productPage, setProductPage] = useState(1);

  // Orders state
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersMeta, setOrdersMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("");
  const [orderPaymentFilter, setOrderPaymentFilter] = useState("");
  const [orderPage, setOrderPage] = useState(1);

  // Product form modal
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MarketplaceProduct | null>(null);
  const [form, setForm] = useState<ProductFormData>(EMPTY_FORM);
  const [formSaving, setFormSaving] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<MarketplaceProduct | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Order detail
  const [viewOrder, setViewOrder] = useState<MarketplaceOrder | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // ── Data fetchers ────────────────────────────────────────────────────────

  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const params: Record<string, string> = {
        per_page: "20",
        page: String(productPage),
      };
      if (productSearch) params.search = productSearch;
      if (productCategory) params.category = productCategory;
      if (productActiveFilter) params.is_active = productActiveFilter;

      const res = await marketplaceApi.products.list(params);
      setProducts(res.data);
      setProductsMeta({ current_page: res.current_page, last_page: res.last_page, total: res.total });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load products.");
    } finally {
      setProductsLoading(false);
    }
  }, [productSearch, productCategory, productActiveFilter, productPage]);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const params: Record<string, string> = {
        per_page: "20",
        page: String(orderPage),
      };
      if (orderSearch) params.search = orderSearch;
      if (orderStatusFilter) params.status = orderStatusFilter;
      if (orderPaymentFilter) params.payment_status = orderPaymentFilter;

      const res = await marketplaceApi.orders.list(params);
      setOrders(res.data);
      setOrdersMeta({ current_page: res.current_page, last_page: res.last_page, total: res.total });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load orders.");
    } finally {
      setOrdersLoading(false);
    }
  }, [orderSearch, orderStatusFilter, orderPaymentFilter, orderPage]);

  useEffect(() => {
    if (tab === "products") fetchProducts();
  }, [tab, fetchProducts]);

  useEffect(() => {
    if (tab === "orders") fetchOrders();
  }, [tab, fetchOrders]);

  // ── Product form ─────────────────────────────────────────────────────────

  function openAdd() {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(p: MarketplaceProduct) {
    setEditingProduct(p);
    setForm({
      name: p.name,
      description: p.description ?? "",
      category: p.category,
      price: String(p.price),
      original_price: p.original_price != null ? String(p.original_price) : "",
      stock_qty: String(p.stock_qty),
      unit: p.unit,
      sku: p.sku ?? "",
      supplier_name: p.supplier_name ?? "",
      is_active: p.is_active,
      is_featured: p.is_featured,
      tag: p.tag ?? "",
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingProduct(null);
    setForm(EMPTY_FORM);
  }

  function setField<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSaveProduct() {
    if (!form.name.trim()) { toast.error("Product name is required."); return; }
    if (!form.category.trim()) { toast.error("Category is required."); return; }
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0) {
      toast.error("Enter a valid price."); return;
    }
    if (!form.stock_qty || isNaN(Number(form.stock_qty)) || Number(form.stock_qty) < 0) {
      toast.error("Enter a valid stock quantity."); return;
    }
    if (!form.unit.trim()) { toast.error("Unit is required."); return; }

    setFormSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        category: form.category,
        price: Number(form.price),
        original_price: form.original_price ? Number(form.original_price) : null,
        stock_qty: Number(form.stock_qty),
        unit: form.unit,
        sku: form.sku.trim() || null,
        supplier_name: form.supplier_name.trim() || null,
        is_active: form.is_active,
        is_featured: form.is_featured,
        tag: form.tag.trim() || null,
      };

      if (editingProduct) {
        await marketplaceApi.products.update(editingProduct.id, payload);
        toast.success("Product updated.");
      } else {
        await marketplaceApi.products.create(payload);
        toast.success("Product created.");
      }

      closeForm();
      fetchProducts();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save product.");
    } finally {
      setFormSaving(false);
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await marketplaceApi.products.delete(deleteTarget.id);
      toast.success("Product deleted.");
      setDeleteTarget(null);
      fetchProducts();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete product.");
    } finally {
      setDeleteLoading(false);
    }
  }

  // ── Order status update ──────────────────────────────────────────────────

  async function handleOrderStatusUpdate(
    order: MarketplaceOrder,
    field: "status" | "payment_status",
    value: string,
  ) {
    setUpdatingOrderId(order.id);
    try {
      const res = await marketplaceApi.orders.updateStatus(order.id, { [field]: value });
      setOrders((prev) => prev.map((o) => (o.id === order.id ? res.order : o)));
      if (viewOrder?.id === order.id) setViewOrder(res.order);
      toast.success("Order updated.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update order.");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span>BCMP</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground font-medium">Marketplace</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Marketplace Admin</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage the global product catalog and fulfil barangay orders.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => (tab === "products" ? fetchProducts() : fetchOrders())}
            className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {tab === "products" && (
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white text-sm font-semibold hover:from-orange-700 hover:to-amber-700 transition-all shadow-lg shadow-orange-500/20"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {(["products", "orders"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize -mb-px ${
              tab === t
                ? "border-orange-500 text-orange-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "products" ? <Package className="w-4 h-4" /> : <ReceiptText className="w-4 h-4" />}
            {t === "products" ? "Products" : "Orders"}
            {t === "products" && productsMeta.total > 0 && (
              <span className="px-1.5 py-0.5 rounded-md bg-muted text-[10px] font-semibold text-muted-foreground">
                {productsMeta.total}
              </span>
            )}
            {t === "orders" && ordersMeta.total > 0 && (
              <span className="px-1.5 py-0.5 rounded-md bg-muted text-[10px] font-semibold text-muted-foreground">
                {ordersMeta.total}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Products Tab ───────────────────────────────────────────────── */}
      {tab === "products" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => { setProductSearch(e.target.value); setProductPage(1); }}
                placeholder="Search by name, SKU, or supplier..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-input-border bg-input-bg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
              />
            </div>
            <select
              value={productCategory}
              onChange={(e) => { setProductCategory(e.target.value); setProductPage(1); }}
              className="px-3 py-2 text-sm rounded-xl border border-input-border bg-input-bg text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={productActiveFilter}
              onChange={(e) => { setProductActiveFilter(e.target.value as "" | "true" | "false"); setProductPage(1); }}
              className="px-3 py-2 text-sm rounded-xl border border-input-border bg-input-bg text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          {/* Table */}
          {productsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-muted/50 flex items-center justify-center">
                <ShoppingBag className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">No products found.</p>
              <button
                onClick={openAdd}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white text-sm font-semibold hover:from-orange-700 hover:to-amber-700 transition-all"
              >
                Add First Product
              </button>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto] gap-4 px-5 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                <span>Product</span>
                <span className="w-24 text-right">Price</span>
                <span className="w-16 text-center">Stock</span>
                <span className="w-20 text-center">Orders</span>
                <span className="w-20 text-center">Rating</span>
                <span className="w-16 text-center">Status</span>
                <span className="w-16 text-center">Actions</span>
              </div>
              <div className="divide-y divide-border">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto] gap-4 items-center px-5 py-3 hover:bg-muted/20 transition-colors"
                  >
                    {/* Product info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-xs font-semibold text-foreground truncate">{p.name}</p>
                        {p.is_featured && (
                          <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 text-[9px] font-bold flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5" />
                            Featured
                          </span>
                        )}
                        {p.tag && (
                          <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 text-[9px] font-semibold">
                            {p.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {p.category}
                        {p.sku && ` · SKU: ${p.sku}`}
                        {p.supplier_name && ` · ${p.supplier_name}`}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="w-24 text-right">
                      <p className="text-xs font-semibold text-foreground">{peso(p.price)}</p>
                      {p.original_price && p.original_price > p.price && (
                        <p className="text-[10px] text-muted-foreground line-through">{peso(p.original_price)}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground">per {p.unit}</p>
                    </div>

                    {/* Stock */}
                    <div className="w-16 text-center">
                      <span className={`text-xs font-semibold ${p.stock_qty === 0 ? "text-red-500" : p.stock_qty < 10 ? "text-amber-500" : "text-foreground"}`}>
                        {p.stock_qty}
                      </span>
                    </div>

                    {/* Total orders */}
                    <div className="w-20 text-center">
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                        <TrendingUp className="w-3 h-3" />
                        {p.total_orders}
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="w-20 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-xs text-foreground">{p.rating.toFixed(1)}</span>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="w-16 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        p.is_active
                          ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                      }`}>
                        {p.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="w-16 flex items-center justify-center gap-1">
                      <button
                        onClick={() => openEdit(p)}
                        className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(p)}
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Products Pagination */}
          {productsMeta.last_page > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Page {productsMeta.current_page} of {productsMeta.last_page} · {productsMeta.total} products
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                  disabled={productsMeta.current_page <= 1}
                  className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setProductPage((p) => Math.min(productsMeta.last_page, p + 1))}
                  disabled={productsMeta.current_page >= productsMeta.last_page}
                  className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Orders Tab ─────────────────────────────────────────────────── */}
      {tab === "orders" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => { setOrderSearch(e.target.value); setOrderPage(1); }}
                placeholder="Search order #, contact, or PO..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-input-border bg-input-bg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
              />
            </div>
            <select
              value={orderStatusFilter}
              onChange={(e) => { setOrderStatusFilter(e.target.value); setOrderPage(1); }}
              className="px-3 py-2 text-sm rounded-xl border border-input-border bg-input-bg text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            >
              <option value="">All Statuses</option>
              {ORDER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select
              value={orderPaymentFilter}
              onChange={(e) => { setOrderPaymentFilter(e.target.value); setOrderPage(1); }}
              className="px-3 py-2 text-sm rounded-xl border border-input-border bg-input-bg text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            >
              <option value="">All Payments</option>
              {PAYMENT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {/* Table */}
          {ordersLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-muted/50 flex items-center justify-center">
                <Truck className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No orders found.</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-4 px-5 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                <span className="w-32">Order #</span>
                <span>Contact</span>
                <span className="w-24 text-right">Amount</span>
                <span className="w-28 text-center">Order Status</span>
                <span className="w-28 text-center">Payment</span>
                <span className="w-24 text-center">Date</span>
                <span className="w-16 text-center">View</span>
              </div>
              <div className="divide-y divide-border">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-4 items-center px-5 py-3 hover:bg-muted/20 transition-colors"
                  >
                    {/* Order number */}
                    <div className="w-32">
                      <p className="text-xs font-mono font-semibold text-foreground">{order.order_number}</p>
                      {order.po_number && (
                        <p className="text-[10px] text-muted-foreground">PO: {order.po_number}</p>
                      )}
                    </div>

                    {/* Contact */}
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{order.contact_person}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{order.contact_number}</p>
                    </div>

                    {/* Amount */}
                    <div className="w-24 text-right">
                      <p className="text-xs font-semibold text-foreground">{peso(order.total_amount)}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                      </p>
                    </div>

                    {/* Order status */}
                    <div className="w-28 text-center">
                      <select
                        value={order.status}
                        disabled={updatingOrderId === order.id}
                        onChange={(e) => handleOrderStatusUpdate(order, "status", e.target.value)}
                        className={`w-full px-2 py-1 rounded-lg text-[11px] font-semibold border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/30 ${orderStatusStyle(order.status)}`}
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Payment status */}
                    <div className="w-28 text-center">
                      <select
                        value={order.payment_status}
                        disabled={updatingOrderId === order.id}
                        onChange={(e) => handleOrderStatusUpdate(order, "payment_status", e.target.value)}
                        className={`w-full px-2 py-1 rounded-lg text-[11px] font-semibold border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/30 ${paymentStatusStyle(order.payment_status)}`}
                      >
                        {PAYMENT_STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Date */}
                    <div className="w-24 text-center">
                      <p className="text-[10px] text-muted-foreground">{fmtDate(order.created_at)}</p>
                    </div>

                    {/* View */}
                    <div className="w-16 flex justify-center">
                      <button
                        onClick={() => setViewOrder(order)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                        title="View order"
                      >
                        <ReceiptText className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Orders Pagination */}
          {ordersMeta.last_page > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Page {ordersMeta.current_page} of {ordersMeta.last_page} · {ordersMeta.total} orders
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOrderPage((p) => Math.max(1, p - 1))}
                  disabled={ordersMeta.current_page <= 1}
                  className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setOrderPage((p) => Math.min(ordersMeta.last_page, p + 1))}
                  disabled={ordersMeta.current_page >= ordersMeta.last_page}
                  className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Product Form Modal ──────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  {editingProduct ? "Edit Product" : "Add Product"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {editingProduct ? `Editing: ${editingProduct.name}` : "Add a new product to the marketplace catalog."}
                </p>
              </div>
              <button
                onClick={closeForm}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {/* Name + Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    placeholder="e.g. A4 Bond Paper"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-input-border bg-input-bg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setField("category", e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-input-border bg-input-bg text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  placeholder="Product description..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-input-border bg-input-bg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 resize-none"
                />
              </div>

              {/* Price + Original Price + Unit */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Price (₱) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setField("price", e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-input-border bg-input-bg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Original Price (₱)
                    <span className="text-[10px] ml-1 text-muted-foreground/60">for strikethrough</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.original_price}
                    onChange={(e) => setField("original_price", e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-input-border bg-input-bg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Unit <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.unit}
                    onChange={(e) => setField("unit", e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-input-border bg-input-bg text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                  >
                    <option value="">Select unit</option>
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              {/* Stock + SKU + Supplier */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Stock Qty <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.stock_qty}
                    onChange={(e) => setField("stock_qty", e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-input-border bg-input-bg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">SKU</label>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(e) => setField("sku", e.target.value)}
                    placeholder="e.g. PAPER-A4-80G"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-input-border bg-input-bg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Supplier</label>
                  <input
                    type="text"
                    value={form.supplier_name}
                    onChange={(e) => setField("supplier_name", e.target.value)}
                    placeholder="Supplier name"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-input-border bg-input-bg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Tag */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Tag
                  <span className="text-[10px] ml-1 text-muted-foreground/60">e.g. &quot;New&quot;, &quot;Sale&quot;, &quot;Limited&quot;</span>
                </label>
                <input
                  type="text"
                  value={form.tag}
                  onChange={(e) => setField("tag", e.target.value)}
                  placeholder="Optional badge label"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-input-border bg-input-bg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                />
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <div
                    onClick={() => setField("is_active", !form.is_active)}
                    className={`relative w-9 h-5 rounded-full transition-colors ${form.is_active ? "bg-orange-500" : "bg-slate-300 dark:bg-slate-600"}`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${form.is_active ? "translate-x-4" : "translate-x-0"}`} />
                  </div>
                  <span className="text-sm text-foreground font-medium">Active</span>
                  <span className="text-xs text-muted-foreground">Visible to barangays</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <div
                    onClick={() => setField("is_featured", !form.is_featured)}
                    className={`relative w-9 h-5 rounded-full transition-colors ${form.is_featured ? "bg-amber-500" : "bg-slate-300 dark:bg-slate-600"}`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${form.is_featured ? "translate-x-4" : "translate-x-0"}`} />
                  </div>
                  <span className="text-sm text-foreground font-medium">Featured</span>
                  <span className="text-xs text-muted-foreground">Shown first in listings</span>
                </label>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-border shrink-0">
              <button
                onClick={closeForm}
                disabled={formSaving}
                className="px-4 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={formSaving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white text-sm font-semibold hover:from-orange-700 hover:to-amber-700 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingProduct ? "Save Changes" : "Add Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950/50 shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Delete Product?</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  <strong>{deleteTarget.name}</strong> will be soft-deleted. This cannot be undone if there are completed orders referencing it.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {deleteLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Order Detail Modal ──────────────────────────────────────────── */}
      {viewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-foreground">{viewOrder.order_number}</h2>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${orderStatusStyle(viewOrder.status)}`}>
                    {ORDER_STATUSES.find((s) => s.value === viewOrder.status)?.label ?? viewOrder.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Ordered {fmtDate(viewOrder.created_at)}
                  {viewOrder.po_number && ` · PO: ${viewOrder.po_number}`}
                </p>
              </div>
              <button
                onClick={() => setViewOrder(null)}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {/* Contact */}
              <div className="bg-muted/40 rounded-xl p-4 space-y-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Delivery Info</p>
                <p className="text-sm font-medium text-foreground">{viewOrder.contact_person}</p>
                <p className="text-xs text-muted-foreground">{viewOrder.contact_number}</p>
                <p className="text-xs text-muted-foreground">{viewOrder.delivery_address}</p>
                {viewOrder.payment_method && (
                  <p className="text-xs text-muted-foreground capitalize">
                    Payment: {viewOrder.payment_method.replace("_", " ")}
                  </p>
                )}
                {viewOrder.notes && (
                  <p className="text-xs text-muted-foreground italic mt-1">Note: {viewOrder.notes}</p>
                )}
              </div>

              {/* Status controls */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Order Status
                  </label>
                  <select
                    value={viewOrder.status}
                    disabled={updatingOrderId === viewOrder.id}
                    onChange={(e) => handleOrderStatusUpdate(viewOrder, "status", e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-sm font-semibold border border-input-border focus:outline-none focus:ring-2 focus:ring-orange-500/30 ${orderStatusStyle(viewOrder.status)}`}
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Payment Status
                  </label>
                  <select
                    value={viewOrder.payment_status}
                    disabled={updatingOrderId === viewOrder.id}
                    onChange={(e) => handleOrderStatusUpdate(viewOrder, "payment_status", e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-sm font-semibold border border-input-border focus:outline-none focus:ring-2 focus:ring-orange-500/30 ${paymentStatusStyle(viewOrder.payment_status)}`}
                  >
                    {PAYMENT_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dates */}
              {(viewOrder.expected_delivery_date || viewOrder.delivered_date) && (
                <div className="grid grid-cols-2 gap-3">
                  {viewOrder.expected_delivery_date && (
                    <div className="bg-muted/40 rounded-xl p-3">
                      <p className="text-[10px] text-muted-foreground mb-0.5">Expected Delivery</p>
                      <p className="text-xs font-medium text-foreground">{fmtDate(viewOrder.expected_delivery_date)}</p>
                    </div>
                  )}
                  {viewOrder.delivered_date && (
                    <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-0.5">Delivered</p>
                        <p className="text-xs font-medium text-green-700 dark:text-green-400">{fmtDate(viewOrder.delivered_date)}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Items */}
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Items ({viewOrder.items.length})
                </p>
                <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
                  {viewOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-xs font-medium text-foreground">{item.product_name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {item.quantity} {item.unit} × {peso(item.unit_price)}
                        </p>
                      </div>
                      <p className="text-xs font-semibold text-foreground">{peso(item.subtotal)}</p>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
                    <p className="text-xs font-semibold text-foreground">Total</p>
                    <p className="text-sm font-bold text-orange-600 dark:text-orange-400">{peso(viewOrder.total_amount)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end p-5 border-t border-border shrink-0">
              <button
                onClick={() => setViewOrder(null)}
                className="px-5 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
