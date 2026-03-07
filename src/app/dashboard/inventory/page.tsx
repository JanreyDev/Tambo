"use client";

import { useState } from "react";
import {
  Package,
  Plus,
  Search,
  Download,
  AlertTriangle,
  Archive,
  Tag,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Modal, ModalButton } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

interface InventoryItem {
  id: string;
  item_name: string;
  category: string;
  quantity: number;
  unit: string;
  min_stock: number;
  location: string;
  condition: string;
  acquired_date: string;
  acquisition_cost: number;
  last_checked: string;
}

const mockItems: InventoryItem[] = [
  { id: "1", item_name: "Office Chair (Swivel)", category: "Furniture", quantity: 8, unit: "pcs", min_stock: 5, location: "Barangay Hall - Main Office", condition: "good", acquired_date: "2024-06-15", acquisition_cost: 3500, last_checked: "2026-03-01" },
  { id: "2", item_name: "Desktop Computer (Core i5)", category: "IT Equipment", quantity: 3, unit: "units", min_stock: 3, location: "Barangay Hall - Main Office", condition: "good", acquired_date: "2025-01-10", acquisition_cost: 35000, last_checked: "2026-03-01" },
  { id: "3", item_name: "Printer (Epson L3210)", category: "IT Equipment", quantity: 2, unit: "units", min_stock: 1, location: "Barangay Hall - Main Office", condition: "good", acquired_date: "2025-03-20", acquisition_cost: 8500, last_checked: "2026-03-01" },
  { id: "4", item_name: "Bond Paper A4 (Ream)", category: "Office Supplies", quantity: 15, unit: "reams", min_stock: 10, location: "Storage Room", condition: "good", acquired_date: "2026-02-28", acquisition_cost: 220, last_checked: "2026-03-05" },
  { id: "5", item_name: "Printer Ink (Black)", category: "Office Supplies", quantity: 2, unit: "bottles", min_stock: 3, location: "Storage Room", condition: "good", acquired_date: "2026-02-28", acquisition_cost: 350, last_checked: "2026-03-05" },
  { id: "6", item_name: "Folding Table (6ft)", category: "Furniture", quantity: 10, unit: "pcs", min_stock: 5, location: "Multi-Purpose Hall", condition: "fair", acquired_date: "2022-08-10", acquisition_cost: 2800, last_checked: "2026-02-15" },
  { id: "7", item_name: "Megaphone", category: "Equipment", quantity: 2, unit: "pcs", min_stock: 1, location: "Tanod Office", condition: "good", acquired_date: "2024-01-05", acquisition_cost: 1500, last_checked: "2026-03-01" },
  { id: "8", item_name: "First Aid Kit", category: "Medical", quantity: 3, unit: "kits", min_stock: 2, location: "Health Center", condition: "good", acquired_date: "2025-12-01", acquisition_cost: 2000, last_checked: "2026-03-01" },
  { id: "9", item_name: "Plastic Monobloc Chair", category: "Furniture", quantity: 50, unit: "pcs", min_stock: 30, location: "Multi-Purpose Hall", condition: "fair", acquired_date: "2023-05-15", acquisition_cost: 350, last_checked: "2026-02-15" },
  { id: "10", item_name: "Flashlight (Rechargeable)", category: "Equipment", quantity: 5, unit: "pcs", min_stock: 3, location: "Tanod Office", condition: "good", acquired_date: "2025-06-01", acquisition_cost: 500, last_checked: "2026-03-01" },
];

const categoriesFilter = ["All", "Furniture", "IT Equipment", "Office Supplies", "Equipment", "Medical"];

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showLowStock, setShowLowStock] = useState(false);
  const [viewItem, setViewItem] = useState<InventoryItem | null>(null);

  const filtered = mockItems.filter((i) => {
    if (search && !i.item_name.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter !== "All" && i.category !== categoryFilter) return false;
    if (showLowStock && i.quantity > i.min_stock) return false;
    return true;
  });

  const lowStockCount = mockItems.filter((i) => i.quantity <= i.min_stock).length;
  const totalValue = mockItems.reduce((sum, i) => sum + i.acquisition_cost * i.quantity, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Track barangay property and supplies"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Operations" }, { label: "Inventory" }]}
        actions={
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"><Download className="h-4 w-4" /> Export</button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "var(--accent-primary)" }}><Plus className="h-4 w-4" /> Add Item</button>
          </div>
        }
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Items" value={mockItems.length} icon={<Package className="h-5 w-5" />} />
        <StatCard label="Low Stock" value={lowStockCount} icon={<AlertTriangle className="h-5 w-5" />} />
        <StatCard label="Categories" value={categoriesFilter.length - 1} icon={<Tag className="h-5 w-5" />} />
        <StatCard label="Total Value" value={`₱${totalValue.toLocaleString()}`} icon={<Archive className="h-5 w-5" />} />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring" />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring">
          {categoriesFilter.map((c) => <option key={c}>{c}</option>)}
        </select>
        <button onClick={() => setShowLowStock(!showLowStock)}
          className={cn("flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors",
            showLowStock ? "border-red-300 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400" : "border-border hover:bg-muted text-muted-foreground")}>
          <AlertTriangle className="h-3 w-3" /> Low Stock Only
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Item</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Qty</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Location</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Condition</th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Value</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No items found.</td></tr>
            ) : (
              filtered.map((item) => {
                const isLow = item.quantity <= item.min_stock;
                return (
                  <tr key={item.id} className={cn("border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors", isLow && "bg-red-50/50 dark:bg-red-950/10")} onClick={() => setViewItem(item)}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">{item.item_name}</p>
                    </td>
                    <td className="px-4 py-3"><Badge variant="muted">{item.category}</Badge></td>
                    <td className="px-4 py-3">
                      <span className={cn("text-sm font-medium", isLow ? "text-red-600 dark:text-red-400" : "text-foreground")}>
                        {item.quantity} {item.unit}
                      </span>
                      {isLow && <AlertTriangle className="h-3 w-3 text-red-500 inline ml-1" />}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{item.location}</td>
                    <td className="px-4 py-3">
                      <Badge variant={item.condition === "good" ? "success" : item.condition === "fair" ? "warning" : "danger"}>{item.condition}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground text-right">₱{(item.acquisition_cost * item.quantity).toLocaleString()}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title={viewItem?.item_name || ""} description={viewItem?.category || ""} size="md"
        footer={<><ModalButton variant="secondary" onClick={() => setViewItem(null)}>Close</ModalButton><ModalButton variant="primary">Edit Item</ModalButton></>}>
        {viewItem && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={viewItem.condition === "good" ? "success" : viewItem.condition === "fair" ? "warning" : "danger"}>{viewItem.condition}</Badge>
              {viewItem.quantity <= viewItem.min_stock && <Badge variant="danger">Low Stock</Badge>}
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div><p className="text-[11px] text-muted-foreground uppercase">Quantity</p><p className="text-sm">{viewItem.quantity} {viewItem.unit} (min: {viewItem.min_stock})</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Location</p><p className="text-sm">{viewItem.location}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Unit Cost</p><p className="text-sm">₱{viewItem.acquisition_cost.toLocaleString()}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Total Value</p><p className="text-sm">₱{(viewItem.acquisition_cost * viewItem.quantity).toLocaleString()}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Acquired</p><p className="text-sm">{viewItem.acquired_date}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Last Checked</p><p className="text-sm">{viewItem.last_checked}</p></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
