"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  Users, Plus, Trash2, Edit2, Shield, Search, X, 
  Loader2, Check, AlertCircle, Eye, EyeOff, UserCheck, UserX 
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/toast";
import type { Resident } from "@/lib/types";

// Default permission mappings based on roles
const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  secretary: [
    'residents.view', 'residents.create', 'residents.edit',
    'establishments.view', 'establishments.create', 'establishments.edit',
    'lots-buildings.view', 'lots-buildings.create', 'lots-buildings.edit',
    'documents.view', 'documents.create', 'documents.edit', 'documents.approve',
    'kp-cases.view', 'kp-cases.create', 'kp-cases.edit',
    'blotters.view', 'blotters.create', 'blotters.edit',
    'vawc.view', 'vawc.create', 'vawc.edit', 'vawc.delete',
    'officials.view', 'officials.manage',
    'finance.view', 'finance.create',
    'reports.view', 'reports.export',
    'users.view', 'ai.access', 'sms.send', 'sms.blast'
  ],
  treasurer: [
    'residents.view', 'documents.view', 'documents.create',
    'finance.view', 'finance.create', 'finance.approve',
    'reports.view', 'reports.export', 'ai.access'
  ],
  kagawad: [
    'residents.view', 'establishments.view', 'documents.view', 'documents.create',
    'kp-cases.view', 'kp-cases.create', 'blotters.view', 'blotters.create',
    'reports.view', 'ai.access'
  ],
  health_worker: [
    'residents.view', 'residents.edit', 'documents.view', 'reports.view', 'ai.access'
  ],
  sk_chairman: [
    'residents.view', 'documents.view', 'documents.create', 'reports.view', 'ai.access'
  ],
  tanod: [
    'residents.view', 'blotters.view', 'blotters.create', 'ai.access'
  ],
  vawc_desk_officer: [
    'residents.view', 'documents.view', 'documents.create',
    'vawc.view', 'vawc.create', 'vawc.edit', 'vawc.delete',
    'blotters.view', 'reports.view', 'ai.access'
  ],
  staff: [
    'residents.view', 'documents.view', 'ai.access'
  ]
};

interface StaffUser {
  id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  extension_name: string | null;
  username: string;
  email: string;
  phone: string | null;
  status: "active" | "suspended";
  role: string;
  custom_permissions: string[];
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [permissionsGrouped, setPermissionsGrouped] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);

  // Custom Delete Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<StaffUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Form state
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [extensionName, setExtensionName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Resident linking state
  const [residentSearchQuery, setResidentSearchQuery] = useState("");
  const [residentResults, setResidentResults] = useState<Resident[]>([]);
  const [searchingResident, setSearchingResident] = useState(false);
  const [selectedResidentName, setSelectedResidentName] = useState("");
  const [selectedRole, setSelectedRole] = useState("staff");
  const [userStatus, setUserStatus] = useState<"active" | "suspended">("active");
  const [checkedPermissions, setCheckedPermissions] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, rolesData, permissionsData] = await Promise.all([
        api.users.list(),
        api.users.roles(),
        api.users.permissions()
      ]);
      setUsers(usersData);
      setRoles(rolesData);
      setPermissionsGrouped(permissionsData);
    } catch (err) {
      toast("error", "Failed to load staff accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Load matching residents based on query
  useEffect(() => {
    if (residentSearchQuery.trim().length < 2) {
      setResidentResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        setSearchingResident(true);
        const res = await api.residents.list({ search: residentSearchQuery, per_page: 10 });
        setResidentResults(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setSearchingResident(false);
      }
    }, 450);

    return () => clearTimeout(delayDebounce);
  }, [residentSearchQuery]);

  // Update permissions checkboxes when role changes during addition
  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    // Only auto-precheck if we are NOT editing, or if we want to reset permissions
    if (!editingUser) {
      setCheckedPermissions(ROLE_DEFAULT_PERMISSIONS[role] || []);
    }
  };

  // Toggle permission checked state
  const togglePermission = (perm: string) => {
    setCheckedPermissions(prev => 
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  // Filtered users for list
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const search = searchQuery.toLowerCase();
      const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
      return fullName.includes(search) || 
             u.username.toLowerCase().includes(search) || 
             u.email.toLowerCase().includes(search);
    });
  }, [users, searchQuery]);

  // Open modal for adding
  const openAddModal = () => {
    setEditingUser(null);
    setResidentSearchQuery("");
    setResidentResults([]);
    setSelectedResidentName("");
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setExtensionName("");
    setUsername("");
    setEmail("");
    setPhone("");
    setPassword("");
    setConfirmPassword("");
    setShowConfirmPassword(false);
    setSelectedRole("staff");
    setUserStatus("active");
    setCheckedPermissions(ROLE_DEFAULT_PERMISSIONS["staff"] || []);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const openEditModal = (user: StaffUser) => {
    setEditingUser(user);
    setResidentSearchQuery("");
    setResidentResults([]);
    setSelectedResidentName("");
    setFirstName(user.first_name);
    setMiddleName(user.middle_name || "");
    setLastName(user.last_name);
    setExtensionName(user.extension_name || "");
    setUsername(user.username);
    setEmail(user.email);
    setPhone(user.phone || "");
    setPassword(""); // Leave password empty by default
    setConfirmPassword("");
    setShowConfirmPassword(false);
    setSelectedRole(user.role);
    setUserStatus(user.status);
    setCheckedPermissions(user.custom_permissions || []);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!editingUser && !selectedResidentName) {
      toast("error", "Please select a resident to create a staff account.");
      return;
    }

    if (!firstName.trim() || !lastName.trim() || !username.trim() || !email.trim()) {
      toast("error", "Please fill in all required fields (username, email).");
      return;
    }

    if (!editingUser && !password.trim()) {
      toast("error", "Password is required for new accounts.");
      return;
    }

    if (password && password !== confirmPassword) {
      toast("error", "Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);
      const payload: any = {
        first_name: firstName,
        middle_name: middleName || null,
        last_name: lastName,
        extension_name: extensionName || null,
        username: username,
        email: email,
        phone: phone || null,
        role: selectedRole,
        custom_permissions: checkedPermissions
      };

      if (password) {
        payload.password = password;
      }

      if (editingUser) {
        payload.status = userStatus;
        await api.users.update(editingUser.id, payload);
        toast("success", "Staff account updated successfully.");
      } else {
        await api.users.create(payload);
        toast("success", "Staff account created successfully.");
      }
      
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      let msg = err.message || "An error occurred.";
      if (err.errors && typeof err.errors === "object") {
        const firstError = Object.values(err.errors)[0];
        if (Array.isArray(firstError) && firstError.length > 0) {
          msg = firstError[0];
        }
      }
      toast("error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (user: StaffUser) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  // Execute actual deletion
  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      setDeleting(true);
      await api.users.delete(userToDelete.id);
      toast("success", "Staff account deleted successfully.");
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      loadData();
    } catch (err) {
      toast("error", "Failed to delete staff account.");
    } finally {
      setDeleting(false);
    }
  };

  // Render role badges cleanly
  const renderRoleBadge = (roleName: string) => {
    const isKap = roleName === "kapitan";
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
        isKap ? "bg-amber-950/40 text-amber-400 border border-amber-800/30" : "bg-blue-950/40 text-blue-400 border border-blue-800/30"
      }`}>
        <Shield className="w-3 h-3" />
        {roleName}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="w-7 h-7 text-accent" />
            Staff Accounts & Access Controls
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your barangay staff accounts, adjust login credentials, and configure granular checkboxes to restrict or allow access to specific modules.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 bg-accent text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-accent-hover transition-colors duration-150 shadow-lg shadow-accent/20"
        >
          <Plus className="w-4 h-4" />
          Add Staff Member
        </button>
      </div>

      {/* Main List */}
      <div className="rounded-xl border border-card-border bg-card/85 backdrop-blur-md overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-card-border flex items-center justify-between gap-4 bg-card/50">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, email, username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-input-bg border border-input-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
            />
          </div>
          <div className="text-xs text-muted-foreground">
            Total: <span className="font-semibold text-foreground">{users.length}</span> staff
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
            <p className="text-sm text-muted-foreground">Loading staff members...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No staff accounts found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-card-border bg-card/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                  <th className="px-5 py-3.5">Name</th>
                  <th className="px-5 py-3.5">Credentials</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Custom Permissions</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border/60">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-card/25 transition-colors">
                    {/* Name */}
                    <td className="px-5 py-4">
                      <div className="font-semibold text-foreground text-sm">
                        {u.last_name.toUpperCase()}, {u.first_name.toUpperCase()} {u.middle_name ? `${u.middle_name[0]}.` : ""}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {u.phone || "No phone listed"}
                      </div>
                    </td>
                    
                    {/* Credentials */}
                    <td className="px-5 py-4">
                      <div className="text-xs font-mono text-muted-foreground">
                        @{u.username}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {u.email}
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-4">
                      {renderRoleBadge(u.role)}
                    </td>

                    {/* Custom Permissions count */}
                    <td className="px-5 py-4">
                      <span className="text-xs font-semibold text-muted-foreground">
                        {u.custom_permissions?.length || 0} overrides enabled
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        u.status === "active" ? "bg-emerald-950/40 text-emerald-400" : "bg-red-950/40 text-red-400"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === "active" ? "bg-emerald-400" : "bg-red-400"}`} />
                        {u.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1.5 rounded-lg border border-card-border hover:bg-card text-muted-foreground hover:text-foreground transition-all duration-150"
                          title="Edit Permissions & Profile"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => openDeleteModal(u)}
                            className="p-1.5 rounded-lg border border-red-950/30 bg-red-950/10 hover:bg-red-950/30 text-red-400/80 hover:text-red-400 transition-all duration-150"
                            title="Delete Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-4xl rounded-2xl border border-card-border bg-[#020617] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-card-border flex items-center justify-between bg-card/40">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Shield className="w-5 h-5 text-accent" />
                {editingUser ? `Configure Access: ${editingUser.first_name} ${editingUser.last_name}` : "Configure New Staff Access"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Profile Details Group */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-accent uppercase tracking-wider">1. Staff Profile Details</h3>
                
                {!editingUser && (
                  <div className="bg-card/40 p-4 rounded-xl border border-card-border/60 relative">
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                      Optional: Link to Existing Resident
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search residents by name..."
                        value={residentSearchQuery}
                        onChange={(e) => setResidentSearchQuery(e.target.value)}
                        className="w-full bg-input-bg border border-input-border rounded-lg pl-9 pr-10 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent"
                      />
                      {searchingResident && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-accent" />
                      )}
                      {residentSearchQuery && !searchingResident && (
                        <button
                          type="button"
                          onClick={() => {
                            setResidentSearchQuery("");
                            setResidentResults([]);
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Search Results Dropdown */}
                    {residentResults.length > 0 && (
                      <div className="absolute left-4 right-4 z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-card-border bg-[#020617] shadow-xl divide-y divide-card-border/60">
                        {residentResults.map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => {
                              setFirstName(r.first_name);
                              setMiddleName(r.middle_name || "");
                              setLastName(r.last_name);
                              setExtensionName(r.extension_name || "");
                              setEmail(r.email || "");
                              setPhone(r.mobile_number || "");
                              setSelectedResidentName(`${r.first_name} ${r.last_name}`);
                              setResidentResults([]);
                              setResidentSearchQuery("");
                              toast("success", `Auto-filled details for resident: ${r.first_name} ${r.last_name}`);
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-card/40 transition-colors text-xs text-foreground flex items-center justify-between"
                          >
                            <div>
                              <span className="font-semibold">{r.last_name.toUpperCase()}, {r.first_name.toUpperCase()}</span>{" "}
                              {r.middle_name && `${r.middle_name[0]}.`}
                              <span className="text-[10px] text-muted-foreground font-mono ml-2">({r.resident_number})</span>
                            </div>
                            <span className="text-[10px] text-accent uppercase font-semibold">Select</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {selectedResidentName && (
                      <div className="mt-3 flex items-center justify-between bg-emerald-950/20 border border-emerald-800/30 rounded-lg px-3 py-1.5 text-xs text-emerald-400">
                        <span>Linked to resident: <strong>{selectedResidentName}</strong></span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedResidentName("");
                            setFirstName("");
                            setMiddleName("");
                            setLastName("");
                            setExtensionName("");
                            setEmail("");
                            setPhone("");
                          }}
                          className="text-[10px] font-bold underline hover:text-emerald-300"
                        >
                          Clear / Reset
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Static staff name when editing */}
                {editingUser && (
                  <div className="bg-card/40 p-4 rounded-xl border border-card-border/60 text-sm">
                    <span className="text-xs font-bold text-muted-foreground uppercase block mb-1">Linked Resident Staff</span>
                    <span className="font-semibold text-foreground text-base">
                      {editingUser.first_name.toUpperCase()} {editingUser.middle_name ? `${editingUser.middle_name.toUpperCase()} ` : ""}{editingUser.last_name.toUpperCase()}
                    </span>
                    <span className="text-xs text-muted-foreground block mt-0.5">Email: {editingUser.email} | Phone: {editingUser.phone || "N/A"}</span>
                  </div>
                )}

                 {/* Account Credentials Fields */}
                {(selectedResidentName || editingUser) && (
                  <div className="space-y-4 p-4 rounded-xl border border-card-border/40 bg-card/10">
                    {/* Row 1: Email & Base Role */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Email */}
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">Email Address *</label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-input-bg border border-input-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
                          placeholder="Specify email for account..."
                        />
                      </div>

                      {/* Role Selection */}
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">Base Role *</label>
                        <select
                          value={selectedRole}
                          onChange={(e) => handleRoleChange(e.target.value)}
                          className="w-full bg-input-bg border border-input-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
                        >
                          {roles.map((r) => (
                            <option key={r} value={r}>
                              {r.toUpperCase()}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Row 2: Username */}
                    <div className="grid grid-cols-1 gap-4">
                      {/* Username */}
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">Username *</label>
                        <input
                          type="text"
                          required
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full bg-input-bg border border-input-border rounded-lg px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-accent"
                        />
                      </div>
                    </div>

                    {/* Row 3: Password & Confirm Password */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Password */}
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">
                          {editingUser ? "Change Password (Leave blank to keep current)" : "Password *"}
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            required={!editingUser}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-input-bg border border-input-border rounded-lg pl-3 pr-10 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">
                          {editingUser ? "Confirm New Password" : "Confirm Password *"}
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            required={!editingUser ? true : !!password}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-input-bg border border-input-border rounded-lg pl-3 pr-10 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Status Selection (Only when editing) */}
                    {editingUser && (
                      <div className="border-t border-card-border/30 pt-3">
                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Login Status *</label>
                        <div className="flex gap-2 max-w-xs">
                          <button
                            type="button"
                            onClick={() => setUserStatus("active")}
                            className={`flex-1 py-2 rounded-lg border text-sm font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 ${
                              userStatus === "active" 
                                ? "bg-emerald-950/30 border-emerald-500 text-emerald-400" 
                                : "border-input-border bg-input-bg text-muted-foreground"
                            }`}
                          >
                            <UserCheck className="w-4 h-4" />
                            Active
                          </button>
                          <button
                            type="button"
                            onClick={() => setUserStatus("suspended")}
                            className={`flex-1 py-2 rounded-lg border text-sm font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 ${
                              userStatus === "suspended" 
                                ? "bg-red-950/30 border-red-500 text-red-400" 
                                : "border-input-border bg-input-bg text-muted-foreground"
                            }`}
                          >
                            <UserX className="w-4 h-4" />
                            Suspended
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Checkbox Grouped Permissions Grid */}
              <div className="space-y-4 pt-4 border-t border-card-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-accent uppercase tracking-wider">2. Grouped Module Access Permissions</h3>
                  <button
                    type="button"
                    onClick={() => setCheckedPermissions(ROLE_DEFAULT_PERMISSIONS[selectedRole] || [])}
                    className="text-[10px] font-semibold text-accent hover:text-orange-400 underline transition-colors"
                  >
                    Reset to Default Role Permissions
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(permissionsGrouped).map(([groupName, groupPerms]) => (
                    <div 
                      key={groupName} 
                      className="p-4 rounded-xl border border-card-border bg-card/20 flex flex-col gap-2.5"
                    >
                      <h4 className="text-xs font-bold text-foreground border-b border-card-border/60 pb-1.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                        {groupName}
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(groupPerms).map(([permName, permLabel]) => {
                          const isChecked = checkedPermissions.includes(permName);
                          return (
                            <label 
                              key={permName} 
                              className={`flex items-start gap-2.5 p-2 rounded-lg border transition-all duration-150 cursor-pointer ${
                                isChecked 
                                  ? "bg-accent/5 border-accent/35 text-foreground" 
                                  : "border-transparent text-muted-foreground hover:bg-card/30"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => togglePermission(permName)}
                                className="mt-1 accent-accent"
                              />
                              <div className="flex-1">
                                <p className="text-xs font-semibold">{permLabel}</p>
                                <span className="text-[9px] font-mono opacity-50 block mt-0.5">{permName}</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t border-card-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 border border-card-border rounded-lg text-sm font-semibold text-muted-foreground hover:bg-card hover:text-foreground transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 bg-accent text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-accent-hover transition-colors duration-150 disabled:opacity-50 shadow-md shadow-accent/10"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingUser ? "Save Configuration" : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {isDeleteModalOpen && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md rounded-2xl border border-card-border bg-[#020617] shadow-2xl p-6 space-y-6 text-center">
            {/* Warning Icon */}
            <div className="w-12 h-12 rounded-full bg-red-950/30 border border-red-500/30 text-red-500 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-foreground">Permanently Delete Staff?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Are you sure you want to permanently delete the staff account for{" "}
                <strong className="text-foreground">
                  {userToDelete.first_name.toUpperCase()} {userToDelete.last_name.toUpperCase()}
                </strong>
                ? This user will lose access to the barangay panel immediately. This action cannot be undone.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setUserToDelete(null);
                }}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 border border-card-border rounded-lg text-xs font-semibold text-muted-foreground hover:bg-card hover:text-foreground transition-colors disabled:opacity-50"
              >
                Keep Account
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 text-white px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 shadow-md shadow-red-500/10"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
