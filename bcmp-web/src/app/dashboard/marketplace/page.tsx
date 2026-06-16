"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { MabiniButton } from "@/components/ui/mabini-button";
import { Modal, ModalButton } from "@/components/ui/modal";
import { api } from "@/lib/api";
import {
  ShoppingCart, Search, Star, Package,
  Minus, Plus, Trash2, ShoppingBag, CheckCircle,
  FileText, ChevronRight, Clock,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────

interface Product {
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
  rating: number;
  total_orders: number;
  is_active: boolean;
  is_featured: boolean;
  tag: string | null;
}

interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  subtotal: number;
}

interface Order {
  id: string;
  order_number: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  payment_status: "unpaid" | "paid" | "refunded";
  payment_method: string | null;
  subtotal: number;
  total_amount: number;
  delivery_address: string;
  contact_person: string;
  contact_number: string;
  notes: string | null;
  po_number: string | null;
  created_at: string;
  items?: OrderItem[];
}

interface OrderItem {
  id: string;
  product_name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface CheckoutForm {
  delivery_address: string;
  contact_person: string;
  contact_number: string;
  payment_method: string;
  po_number: string;
  notes: string;
}

const CATEGORIES = ["All", "Office Supplies", "Furniture", "Equipment", "Medical", "Cleaning", "Vehicles", "IT/Tech", "Others"];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
  shipped: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400",
  delivered: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
};

const PAYMENT_COLORS: Record<string, string> = {
  unpaid: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  refunded: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
};

function peso(n: number) {
  return "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function MarketplacePage() {
  const [tab, setTab] = useState<"browse" | "cart" | "orders">("browse");
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartLoading, setCartLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [checkoutDone, setCheckoutDone] = useState<Order | null>(null);
  const [checkout, setCheckout] = useState<CheckoutForm>({
    delivery_address: "", contact_person: "", contact_number: "",
    payment_method: "cod", po_number: "", notes: "",
  });
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchProducts = useCallback(async (q?: string, cat?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("search", q);
      if (cat && cat !== "All") params.set("category", cat);
      const data = await api.get<{ data: Product[] }>(`/marketplace/products?${params}`);
      setProducts((data as { data: Product[] }).data ?? []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCart = useCallback(async () => {
    try {
      const data = await api.get<{ items: CartItem[]; total: number }>("/marketplace/cart");
      setCart((data as { items: CartItem[]; total: number }).items ?? []);
      setCartTotal((data as { items: CartItem[]; total: number }).total ?? 0);
    } catch { /* non-critical */ }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await api.get<{ data: Order[] }>("/marketplace/orders");
      setOrders((data as { data: Order[] }).data ?? []);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => { fetchProducts(); fetchCart(); }, [fetchProducts, fetchCart]);
  useEffect(() => { if (tab === "orders") fetchOrders(); }, [tab, fetchOrders]);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => fetchProducts(val || undefined, category !== "All" ? category : undefined), 400);
  };

  const handleCategory = (cat: string) => {
    setCategory(cat);
    fetchProducts(search || undefined, cat !== "All" ? cat : undefined);
  };

  const addToCart = async (product: Product) => {
    setCartLoading(true);
    try {
      await api.post("/marketplace/cart", { product_id: product.id, quantity: 1 });
      await fetchCart();
    } catch { /* non-critical */ } finally {
      setCartLoading(false);
    }
  };

  const updateCartQty = async (item: CartItem, qty: number) => {
    if (qty < 1) return;
    try {
      await api.patch(`/marketplace/cart/${item.id}`, { quantity: qty });
      await fetchCart();
    } catch { /* non-critical */ }
  };

  const removeFromCart = async (item: CartItem) => {
    try {
      await api.delete(`/marketplace/cart/${item.id}`);
      await fetchCart();
    } catch { /* non-critical */ }
  };

  const placeOrder = async () => {
    setPlacing(true);
    try {
      const data = await api.post<{ order: Order }>("/marketplace/checkout", checkout);
      setCheckoutDone((data as { order: Order }).order);
      setShowCheckout(false);
      await fetchCart();
      await fetchOrders();
    } catch { /* non-critical */ } finally {
      setPlacing(false);
    }
  };

  const cancelOrder = async (order: Order) => {
    try {
      await api.patch(`/marketplace/orders/${order.id}/cancel`);
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: "cancelled" } : o));
      if (selectedOrder?.id === order.id) setSelectedOrder(prev => prev ? { ...prev, status: "cancelled" } : null);
    } catch { /* non-critical */ }
  };

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <PageHeader
        title="Marketplace"
        description="Order supplies and equipment from PrimeX Essentials"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Marketplace" }]}
        actions={
          <MabiniButton pageContext="You are on the Marketplace page. Barangay staff can browse and purchase supplies, equipment, vehicles, and other items from PrimeX Essentials catalog. Orders are placed for delivery to the barangay. Payment options: COD, check, bank transfer." />
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 glass rounded-xl p-1 w-fit">
        {[
          { key: "browse", label: "Browse", icon: ShoppingBag },
          { key: "cart", label: cartCount > 0 ? `Cart (${cartCount})` : "Cart", icon: ShoppingCart },
          { key: "orders", label: "My Orders", icon: FileText },
        ].map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key ? "bg-accent-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── BROWSE ── */}
      {tab === "browse" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent-primary"
              />
            </div>
            <select
              value={category}
              onChange={e => handleCategory(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent-primary"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="glass rounded-xl p-4 animate-pulse space-y-3">
                  <div className="h-28 bg-muted rounded-lg" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-2.5 bg-muted rounded w-1/2" />
                  <div className="h-8 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="glass rounded-xl p-12 text-center">
              <Package className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {products.map(product => (
                <div key={product.id} className="glass rounded-xl overflow-hidden hover:shadow-lg hover:shadow-black/5 transition-all">
                  <button onClick={() => setSelectedProduct(product)} className="w-full text-left">
                    <div className="h-28 bg-muted/30 flex items-center justify-center border-b border-border relative">
                      <Package className="w-10 h-10 text-muted-foreground/30" />
                      {product.is_featured && (
                        <span className="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-white uppercase tracking-wider">
                          Featured
                        </span>
                      )}
                      {product.tag && (
                        <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500 text-white">
                          {product.tag}
                        </span>
                      )}
                      {product.stock_qty === 0 && (
                        <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                          <span className="text-xs font-bold text-muted-foreground">Out of Stock</span>
                        </div>
                      )}
                    </div>
                  </button>
                  <div className="p-3">
                    <p className="text-xs font-semibold text-foreground leading-tight line-clamp-2 mb-1">{product.name}</p>
                    <p className="text-[10px] text-muted-foreground mb-2">{product.category} · per {product.unit}</p>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-bold text-accent-primary">{peso(product.price)}</p>
                        {product.original_price && product.original_price > product.price && (
                          <p className="text-[10px] text-muted-foreground line-through">{peso(product.original_price)}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                        <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                        {product.rating.toFixed(1)}
                      </div>
                    </div>
                    <button
                      onClick={() => addToCart(product)}
                      disabled={product.stock_qty === 0 || cartLoading}
                      className="w-full py-1.5 rounded-lg text-xs font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ background: product.stock_qty === 0 ? undefined : "var(--accent-primary)" }}
                    >
                      {product.stock_qty === 0 ? "Out of Stock" : "Add to Cart"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CART ── */}
      {tab === "cart" && (
        <div className="space-y-4 max-w-2xl">
          {cart.length === 0 ? (
            <div className="glass rounded-xl p-12 text-center">
              <ShoppingCart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Your cart is empty</p>
              <button onClick={() => setTab("browse")} className="mt-3 text-xs text-accent-primary hover:underline">
                Browse products
              </button>
            </div>
          ) : (
            <>
              <div className="glass rounded-xl overflow-hidden divide-y divide-border">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-4 p-4">
                    <div className="w-12 h-12 rounded-lg bg-muted/30 flex items-center justify-center shrink-0">
                      <Package className="w-6 h-6 text-muted-foreground/30" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">{peso(item.product.price)} per {item.product.unit}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => updateCartQty(item, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 disabled:opacity-40"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQty(item, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock_qty}
                        className="w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 disabled:opacity-40"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-sm font-bold text-accent-primary shrink-0">{peso(item.subtotal)}</p>
                    <button onClick={() => removeFromCart(item)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="glass rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total ({cartCount} item{cartCount !== 1 ? "s" : ""})</p>
                  <p className="text-xl font-bold text-foreground">{peso(cartTotal)}</p>
                </div>
                <button
                  onClick={() => setShowCheckout(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: "var(--accent-primary)" }}
                >
                  <ShoppingCart className="w-4 h-4" />
                  Checkout
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── ORDERS ── */}
      {tab === "orders" && (
        <div className="space-y-3 max-w-3xl">
          {orders.length === 0 ? (
            <div className="glass rounded-xl p-12 text-center">
              <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No orders yet</p>
              <button onClick={() => setTab("browse")} className="mt-3 text-xs text-accent-primary hover:underline">
                Start shopping
              </button>
            </div>
          ) : (
            orders.map(order => (
              <button
                key={order.id}
                onClick={async () => {
                  const data = await api.get<{ order: Order }>(`/marketplace/orders/${order.id}`);
                  setSelectedOrder((data as { order: Order }).order ?? order);
                }}
                className="w-full glass rounded-xl p-4 text-left hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-foreground">{order.order_number}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {new Date(order.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[order.status] ?? ""}`}>
                      {order.status}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${PAYMENT_COLORS[order.payment_status] ?? ""}`}>
                      {order.payment_status}
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-sm font-bold text-accent-primary">{peso(order.total_amount)}</p>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <Modal
          open={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          title={selectedProduct.name}
          size="md"
          footer={
            selectedProduct.stock_qty > 0 ? (
              <ModalButton variant="primary" onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}>
                Add to Cart
              </ModalButton>
            ) : undefined
          }
        >
          <div className="space-y-4">
            <div className="h-32 bg-muted/30 rounded-xl flex items-center justify-center">
              <Package className="w-12 h-12 text-muted-foreground/30" />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="glass rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Price</p>
                <p className="font-bold text-accent-primary text-base">{peso(selectedProduct.price)}</p>
                <p className="text-[10px] text-muted-foreground">per {selectedProduct.unit}</p>
              </div>
              <div className="glass rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Stock</p>
                <p className={`font-bold text-base ${selectedProduct.stock_qty === 0 ? "text-red-500" : "text-emerald-600"}`}>
                  {selectedProduct.stock_qty === 0 ? "Out of Stock" : `${selectedProduct.stock_qty} ${selectedProduct.unit}s`}
                </p>
              </div>
            </div>
            {selectedProduct.description && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Description</p>
                <p className="text-sm text-foreground">{selectedProduct.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              {selectedProduct.sku && <p>SKU: <span className="text-foreground font-mono">{selectedProduct.sku}</span></p>}
              {selectedProduct.supplier_name && <p>Supplier: <span className="text-foreground">{selectedProduct.supplier_name}</span></p>}
              <p>Category: <span className="text-foreground">{selectedProduct.category}</span></p>
              <div className="flex items-center gap-0.5">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="text-foreground">{selectedProduct.rating.toFixed(1)}</span>
                <span className="ml-1">({selectedProduct.total_orders} orders)</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Checkout Modal */}
      <Modal
        open={showCheckout}
        onClose={() => setShowCheckout(false)}
        title="Place Order"
        size="md"
        disableOutsideClick
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => setShowCheckout(false)}>Cancel</ModalButton>
            <ModalButton
              variant="primary"
              onClick={placeOrder}
              disabled={placing || !checkout.delivery_address || !checkout.contact_person || !checkout.contact_number}
            >
              {placing ? "Placing..." : `Confirm Order · ${peso(cartTotal)}`}
            </ModalButton>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Delivery Address *</label>
            <textarea
              value={checkout.delivery_address}
              onChange={e => setCheckout(c => ({ ...c, delivery_address: e.target.value }))}
              rows={2}
              placeholder="Barangay Hall address or delivery point"
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent-primary resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Contact Person *</label>
              <input
                value={checkout.contact_person}
                onChange={e => setCheckout(c => ({ ...c, contact_person: e.target.value }))}
                placeholder="Full name"
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Contact Number *</label>
              <input
                value={checkout.contact_number}
                onChange={e => setCheckout(c => ({ ...c, contact_number: e.target.value }))}
                placeholder="+63 9XX XXX XXXX"
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent-primary"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Payment Method</label>
              <select
                value={checkout.payment_method}
                onChange={e => setCheckout(c => ({ ...c, payment_method: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent-primary"
              >
                <option value="cod">Cash on Delivery</option>
                <option value="check">Check</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">PO Number (optional)</label>
              <input
                value={checkout.po_number}
                onChange={e => setCheckout(c => ({ ...c, po_number: e.target.value }))}
                placeholder="Purchase Order #"
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent-primary"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes (optional)</label>
            <textarea
              value={checkout.notes}
              onChange={e => setCheckout(c => ({ ...c, notes: e.target.value }))}
              rows={2}
              placeholder="Special instructions, delivery schedule, etc."
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent-primary resize-none"
            />
          </div>
          <div className="glass rounded-lg p-3 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Items ({cartCount})</span><span>{peso(cartTotal)}</span>
            </div>
            <div className="flex items-center justify-between font-bold text-foreground mt-1">
              <span>Total</span><span className="text-accent-primary">{peso(cartTotal)}</span>
            </div>
          </div>
        </div>
      </Modal>

      {/* Order Success Modal */}
      {checkoutDone && (
        <Modal
          open={!!checkoutDone}
          onClose={() => { setCheckoutDone(null); setTab("orders"); }}
          title=""
          size="sm"
          hideCloseButton
        >
          <div className="text-center py-4">
            <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-foreground">Order Placed!</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Order <span className="font-mono font-semibold">{checkoutDone.order_number}</span> has been submitted.
            </p>
            <p className="text-xs text-muted-foreground mt-3">You will be contacted for delivery confirmation.</p>
            <button
              onClick={() => { setCheckoutDone(null); setTab("orders"); }}
              className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: "var(--accent-primary)" }}
            >
              View Orders
            </button>
          </div>
        </Modal>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <Modal
          open={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Order ${selectedOrder.order_number}`}
          size="lg"
          footer={
            selectedOrder.status === "pending" ? (
              <ModalButton variant="danger" onClick={() => cancelOrder(selectedOrder)}>
                Cancel Order
              </ModalButton>
            ) : undefined
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="glass rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Status</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize mt-1 inline-block ${STATUS_COLORS[selectedOrder.status] ?? ""}`}>
                  {selectedOrder.status}
                </span>
              </div>
              <div className="glass rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Payment</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize mt-1 inline-block ${PAYMENT_COLORS[selectedOrder.payment_status] ?? ""}`}>
                  {selectedOrder.payment_status}
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Order Items</p>
              <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
                {(selectedOrder.items ?? []).map(item => (
                  <div key={item.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <div>
                      <p className="font-medium text-foreground">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">{item.quantity} {item.unit} × {peso(item.unit_price)}</p>
                    </div>
                    <p className="font-bold text-accent-primary">{peso(item.subtotal)}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass rounded-lg p-3 space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span><span>{peso(selectedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between font-bold text-foreground">
                <span>Total</span><span className="text-accent-primary">{peso(selectedOrder.total_amount)}</span>
              </div>
            </div>
            <div className="text-sm space-y-1.5">
              <p><span className="text-muted-foreground">Deliver to:</span> {selectedOrder.delivery_address}</p>
              <p><span className="text-muted-foreground">Contact:</span> {selectedOrder.contact_person} · {selectedOrder.contact_number}</p>
              {selectedOrder.payment_method && (
                <p><span className="text-muted-foreground">Payment:</span> {selectedOrder.payment_method.toUpperCase().replace("_", " ")}</p>
              )}
              {selectedOrder.po_number && (
                <p><span className="text-muted-foreground">PO:</span> <span className="font-mono">{selectedOrder.po_number}</span></p>
              )}
              {selectedOrder.notes && <p><span className="text-muted-foreground">Notes:</span> {selectedOrder.notes}</p>}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
