"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { MabiniButton } from "@/components/ui/mabini-button";
import {
  ShoppingBag, Package, Truck, Receipt, Star, Clock,
  Search, Filter, ChevronRight, Tag, Shield,
  Boxes, ClipboardList, Banknote, BadgeCheck, Warehouse,
} from "lucide-react";

// ── Feature Cards ────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: ShoppingBag,
    title: "One-Click Procurement",
    description: "Browse and order office supplies, equipment, cleaning materials, and everything your barangay needs. No more calling suppliers or driving to stores.",
    color: "#8b5cf6",
  },
  {
    icon: Truck,
    title: "Direct Delivery to Barangay",
    description: "Orders delivered straight to your barangay hall. Track deliveries in real-time from warehouse to your door. No middlemen.",
    color: "#3b82f6",
  },
  {
    icon: Tag,
    title: "Government-Friendly Pricing",
    description: "Bulk pricing, COD, and payment terms designed for LGU procurement processes. Competitive prices because we buy direct from manufacturers.",
    color: "#22c55e",
  },
  {
    icon: Receipt,
    title: "Auto-Generated Documents",
    description: "Purchase orders, delivery receipts, official receipts, and liquidation reports generated automatically. Ready for COA audit anytime.",
    color: "#f59e0b",
  },
  {
    icon: Shield,
    title: "COA-Compliant Procurement",
    description: "Every transaction follows government procurement rules. Canvass sheets, purchase requests, and abstract of quotations built into the workflow.",
    color: "#ef4444",
  },
  {
    icon: Boxes,
    title: "Inventory Integration",
    description: "Orders automatically update your barangay inventory. Track consumption, reorder points, and stock levels in one place.",
    color: "#06b6d4",
  },
];

// ── Mock Product Categories ──────────────────────────────────────────

const CATEGORIES = [
  { name: "Office Supplies", count: 245, icon: ClipboardList, color: "#3b82f6", image: "A4 papers, pens, folders, ink, toner" },
  { name: "Cleaning & Sanitation", count: 89, icon: Package, color: "#22c55e", image: "Disinfectants, trash bags, mops, soap" },
  { name: "IT & Electronics", count: 52, icon: Package, color: "#8b5cf6", image: "Printers, USB drives, cables, routers" },
  { name: "Furniture & Fixtures", count: 38, icon: Warehouse, color: "#f59e0b", image: "Chairs, desks, filing cabinets, shelves" },
  { name: "Barangay Operations", count: 124, icon: BadgeCheck, color: "#ef4444", image: "ID cards, stamps, stickers, certificates" },
  { name: "Medical & First Aid", count: 67, icon: Package, color: "#06b6d4", image: "First aid kits, medicines, PPE, thermometers" },
];

// ── Mock Products ────────────────────────────────────────────────────

const MOCK_PRODUCTS = [
  { name: "A4 Bond Paper (5 reams)", price: 875, originalPrice: 1050, supplier: "Prime Essentials", rating: 4.8, orders: 342, tag: "Best Seller" },
  { name: "Epson 003 Ink Set (CMYK)", price: 1200, originalPrice: 1500, supplier: "Prime Essentials", rating: 4.9, orders: 215, tag: "Official" },
  { name: "Ballpen Blue (50pcs)", price: 375, originalPrice: 450, supplier: "Prime Essentials", rating: 4.7, orders: 189, tag: null },
  { name: "Barangay Official Stamp", price: 450, originalPrice: null, supplier: "Prime Essentials", rating: 5.0, orders: 98, tag: "Custom" },
];

export default function MarketplacePage() {
  const [activeCategory] = useState<string | null>(null);

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <PageHeader
        title="Marketplace"
        description="Barangay procurement and supply portal powered by Prime Essentials"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Marketplace" }]}
      />

      {/* Coming Soon Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-violet-200 dark:border-violet-800/50 bg-gradient-to-br from-violet-50 via-white to-amber-50 dark:from-violet-950/30 dark:via-background dark:to-amber-950/20 p-6 lg:p-8">
        <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-violet-500 text-white text-[10px] font-bold uppercase tracking-wider">
          Coming Soon
        </div>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-7 h-7 text-violet-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Your Barangay&apos;s Trusted Supplier
            </h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl leading-relaxed">
              <strong>Marketplace</strong> connects your barangay directly to <strong>Prime Essentials</strong> -- PrimeX&apos;s supply division. Order everything from office supplies to equipment, delivered to your barangay hall with COA-compliant documentation.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <div className="flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                Under Development
              </div>
              <span className="text-xs text-muted-foreground">Target: Q3 2026</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Grid Preview */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-3">Product Categories</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {CATEGORIES.map((cat, i) => {
            const Icon = cat.icon;
            const active = activeCategory === cat.name;
            return (
              <div
                key={i}
                className={`glass rounded-xl p-3 hover:shadow-lg hover:shadow-black/5 transition-all cursor-pointer text-center ${
                  active ? "ring-2 ring-violet-500" : ""
                }`}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: `${cat.color}12` }}>
                  <Icon className="w-5 h-5" style={{ color: cat.color }} />
                </div>
                <p className="text-xs font-bold text-foreground">{cat.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{cat.count} items</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search Bar Preview */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <div className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-muted/50 border border-border text-sm text-muted-foreground">
            Search products... (e.g., &quot;A4 paper&quot;, &quot;ink&quot;, &quot;stamp&quot;)
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Product Cards Preview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground">Popular Products</h3>
          <span className="text-xs text-muted-foreground">Showing preview</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {MOCK_PRODUCTS.map((p, i) => (
            <div key={i} className="glass rounded-xl overflow-hidden hover:shadow-lg hover:shadow-black/5 transition-all group">
              {/* Product image placeholder */}
              <div className="h-32 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center relative">
                <Package className="w-10 h-10 text-muted-foreground/20" />
                {p.tag && (
                  <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold text-white ${
                    p.tag === "Best Seller" ? "bg-amber-500" : p.tag === "Official" ? "bg-blue-500" : "bg-violet-500"
                  }`}>
                    {p.tag}
                  </span>
                )}
              </div>
              <div className="p-3">
                <p className="text-xs font-semibold text-foreground line-clamp-2 min-h-[32px]">{p.name}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="text-[10px] font-bold text-foreground">{p.rating}</span>
                  <span className="text-[10px] text-muted-foreground">({p.orders} orders)</span>
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-base font-bold text-foreground flex items-center">
                    <Banknote className="w-3.5 h-3.5 mr-0.5 text-emerald-500" />
                    {p.price.toLocaleString()}
                  </span>
                  {p.originalPrice && (
                    <span className="text-[10px] text-muted-foreground line-through">
                      {p.originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <BadgeCheck className="w-3 h-3 text-violet-500" />
                  <span className="text-[10px] text-violet-600 dark:text-violet-400 font-medium">{p.supplier}</span>
                </div>
                <button
                  className="w-full mt-3 py-2 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-85 min-h-[36px]"
                  style={{ background: "var(--accent-primary)" }}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="glass rounded-xl p-5">
        <h3 className="text-sm font-bold text-foreground mb-4">How Marketplace Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { step: 1, title: "Browse & Order", desc: "Search products, add to cart, submit purchase request", icon: Search },
            { step: 2, title: "Approve & Process", desc: "Kapitan or treasurer approves the order with proper documentation", icon: ClipboardList },
            { step: 3, title: "We Deliver", desc: "Prime Essentials ships directly to your barangay hall", icon: Truck },
            { step: 4, title: "Receive & Record", desc: "Confirm delivery, auto-updates inventory, COA docs generated", icon: Receipt },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.step} className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-2 relative" style={{ background: "var(--accent-primary)" }}>
                  <Icon className="w-5 h-5 text-white" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-2 flex items-center justify-center text-[9px] font-bold" style={{ borderColor: "var(--accent-primary)", color: "var(--accent-primary)" }}>
                    {s.step}
                  </span>
                </div>
                <p className="text-xs font-bold text-foreground">{s.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature Cards */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-3">What Marketplace Will Include</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="glass rounded-xl p-4 hover:shadow-lg hover:shadow-black/5 transition-all">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${f.color}12` }}>
                  <Icon className="w-5 h-5" style={{ color: f.color }} />
                </div>
                <h4 className="text-sm font-bold text-foreground">{f.title}</h4>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{f.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      <MabiniButton pageContext="You are on the Marketplace (Barangay Procurement) page. This feature is coming soon. Marketplace is the procurement portal powered by Prime Essentials, a PrimeX division. Barangays can order office supplies, equipment, and materials directly, with delivery to their barangay hall. All transactions are COA-compliant with auto-generated procurement documents." />
    </div>
  );
}
