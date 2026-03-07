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
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
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

const formTabs = ["Item Info", "Details"];

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showLowStock, setShowLowStock] = useState(false);
  const [viewItem, setViewItem] = useState<InventoryItem | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [formTab, setFormTab] = useState(0);
  const [form, setForm] = useState<Record<string, string>>({});
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  const filtered = mockItems.filter((i) => {
    if (search && !i.item_name.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter !== "All" && i.category !== categoryFilter) return false;
    if (showLowStock && i.quantity > i.min_stock) return false;
    return true;
  });

  const lowStockCount = mockItems.filter((i) => i.quantity <= i.min_stock).length;
  const totalValue = mockItems.reduce((sum, i) => sum + i.acquisition_cost * i.quantity, 0);

  const openCreate = () => {
    setForm({});
    setFormTab(0);
    setShowCreate(true);
  };

  const openEdit = (item: InventoryItem) => {
    setForm({
      item_name: item.item_name,
      category: item.category,
      quantity: String(item.quantity),
      unit: item.unit,
      unit_cost: String(item.acquisition_cost),
      condition: item.condition === "good" ? "Good" : item.condition === "fair" ? "Fair" : item.condition === "poor" ? "Poor" : "New",
      location: item.location,
      date_acquired: item.acquired_date,
      reorder_level: String(item.min_stock),
    });
    setFormTab(0);
    setShowEdit(true);
    setActionMenu(null);
  };

  const Input = ({ label, name, value, placeholder, required, type }: { label: string; name: string; value: string; placeholder?: string; required?: boolean; type?: string }) => (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input type={type || "text"} value={value} onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))} placeholder={placeholder} className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring" />
    </div>
  );

  const Select = ({ label, name, value, options, required }: { label: string; name: string; value: string; options: string[]; required?: boolean }) => (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <select value={value} onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring">
        {options.map((o) => <option key={o} value={o}>{o || "\u2014 Select \u2014"}</option>)}
      </select>
    </div>
  );

  const Textarea = ({ label, name, value, placeholder, rows, required }: { label: string; name: string; value: string; placeholder?: string; rows?: number; required?: boolean }) => (
    <div className="col-span-2">
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <textarea value={value} onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))} placeholder={placeholder} rows={rows || 3} className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent-ring resize-none" />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Track barangay property and supplies"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Operations" }, { label: "Inventory" }]}
        actions={
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"><Download className="h-4 w-4" /> Export</button>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{ background: "var(--accent-primary)" }}><Plus className="h-4 w-4" /> Add Item</button>
          </div>
        }
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Items" value={mockItems.length} icon={<Package className="h-5 w-5" />} />
        <StatCard label="Low Stock" value={lowStockCount} icon={<AlertTriangle className="h-5 w-5" />} />
        <StatCard label="Categories" value={categoriesFilter.length - 1} icon={<Tag className="h-5 w-5" />} />
        <StatCard label="Total Value" value={`\u20B1${totalValue.toLocaleString()}`} icon={<Archive className="h-5 w-5" />} />
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
              <th className="w-10 px-2 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No items found.</td></tr>
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
                    <td className="px-4 py-3 text-sm text-foreground text-right">{"\u20B1"}{(item.acquisition_cost * item.quantity).toLocaleString()}</td>
                    <td className="px-2 py-3">
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setActionMenu(actionMenu === item.id ? null : item.id)} className="p-1.5 rounded hover:bg-muted"><MoreHorizontal className="h-4 w-4 text-muted-foreground" /></button>
                        {actionMenu === item.id && (
                          <div className="absolute right-0 top-8 z-20 w-44 bg-card border border-border rounded-lg shadow-lg py-1">
                            <button onClick={() => { setViewItem(item); setActionMenu(null); }} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"><Eye className="h-3.5 w-3.5" /> View</button>
                            <button onClick={() => openEdit(item)} className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"><Edit className="h-3.5 w-3.5" /> Edit</button>
                            <button onClick={() => { setShowDelete(true); setActionMenu(null); }} className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-muted flex items-center gap-2"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* View Item Modal */}
      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title={viewItem?.item_name || ""} description={viewItem?.category || ""} size="md"
        footer={<><ModalButton variant="secondary" onClick={() => setViewItem(null)}>Close</ModalButton><ModalButton variant="primary" onClick={() => { if (viewItem) { openEdit(viewItem); setViewItem(null); } }}>Edit Item</ModalButton></>}>
        {viewItem && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={viewItem.condition === "good" ? "success" : viewItem.condition === "fair" ? "warning" : "danger"}>{viewItem.condition}</Badge>
              {viewItem.quantity <= viewItem.min_stock && <Badge variant="danger">Low Stock</Badge>}
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div><p className="text-[11px] text-muted-foreground uppercase">Quantity</p><p className="text-sm">{viewItem.quantity} {viewItem.unit} (min: {viewItem.min_stock})</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Location</p><p className="text-sm">{viewItem.location}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Unit Cost</p><p className="text-sm">{"\u20B1"}{viewItem.acquisition_cost.toLocaleString()}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Total Value</p><p className="text-sm">{"\u20B1"}{(viewItem.acquisition_cost * viewItem.quantity).toLocaleString()}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Acquired</p><p className="text-sm">{viewItem.acquired_date}</p></div>
              <div><p className="text-[11px] text-muted-foreground uppercase">Last Checked</p><p className="text-sm">{viewItem.last_checked}</p></div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create/Edit Item Form Modal */}
      <Modal open={showCreate || showEdit} onClose={() => { setShowCreate(false); setShowEdit(false); }} title={showEdit ? "Edit Item" : "Add New Item"} size="lg"
        footer={<>
          <ModalButton variant="secondary" onClick={() => { setShowCreate(false); setShowEdit(false); }}>Cancel</ModalButton>
          {formTab > 0 && <ModalButton variant="secondary" onClick={() => setFormTab((t) => t - 1)}>Previous</ModalButton>}
          {formTab < formTabs.length - 1 ? <ModalButton variant="primary" onClick={() => setFormTab((t) => t + 1)}>Next</ModalButton> : <ModalButton variant="primary">{showEdit ? "Update" : "Save"}</ModalButton>}
        </>}>
        <div className="flex border-b border-border mb-6">
          {formTabs.map((tab, i) => (
            <button key={tab} onClick={() => setFormTab(i)} className={cn("px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors", formTab === i ? "border-accent-primary text-accent-text" : "border-transparent text-muted-foreground hover:text-foreground")}>{tab}</button>
          ))}
        </div>
        {formTab === 0 && (
          <div className="grid grid-cols-2 gap-4">
            <Input label="Item Name" name="item_name" value={form.item_name || ""} placeholder="e.g. Office Chair" required />
            <Select label="Category" name="category" value={form.category || ""} options={["", "Office Supplies", "Furniture", "Equipment", "Cleaning", "Medical", "Disaster Preparedness", "Others"]} />
            <Input label="Quantity" name="quantity" value={form.quantity || ""} placeholder="e.g. 10" type="number" required />
            <Select label="Unit" name="unit" value={form.unit || ""} options={["", "pcs", "box", "ream", "pack", "bottle", "gallon", "set"]} />
            <Input label="Unit Cost" name="unit_cost" value={form.unit_cost || ""} placeholder="e.g. 3500" type="number" required />
          </div>
        )}
        {formTab === 1 && (
          <div className="grid grid-cols-2 gap-4">
            <Select label="Condition" name="condition" value={form.condition || ""} options={["", "New", "Good", "Fair", "Poor", "For Disposal"]} />
            <Input label="Location" name="location" value={form.location || ""} placeholder="e.g. Storage Room" />
            <Input label="Date Acquired" name="date_acquired" value={form.date_acquired || ""} type="date" />
            <Input label="Supplier" name="supplier" value={form.supplier || ""} placeholder="e.g. Office Warehouse" />
            <Input label="Serial Number" name="serial_number" value={form.serial_number || ""} placeholder="e.g. SN-12345" />
            <Input label="Reorder Level" name="reorder_level" value={form.reorder_level || ""} placeholder="e.g. 5" type="number" />
            <Textarea label="Notes" name="notes" value={form.notes || ""} placeholder="Additional notes about this item..." />
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Confirm Delete" description="This action cannot be undone." size="sm"
        footer={<><ModalButton variant="secondary" onClick={() => setShowDelete(false)}>Cancel</ModalButton><ModalButton variant="danger" onClick={() => setShowDelete(false)}>Delete</ModalButton></>}>
        <p className="text-sm text-muted-foreground">Are you sure you want to delete this inventory item?</p>
      </Modal>
    </div>
  );
}
