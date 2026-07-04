"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X, Upload, Loader2, CheckCircle2, AlertCircle,
  Table, ChevronRight, FileSpreadsheet, ArrowRight, RefreshCw, AlertTriangle
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = "upload" | "mapping" | "importing" | "result";

interface PreviewData {
  headers: string[];
  sample_rows: string[][];
  total_rows: number;
  auto_mapping: Record<string, number>;
  required_fields: string[];
  optional_fields: string[];
}

export function ImportLotBuildingsModal({ open, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [mapping, setMapping] = useState<Record<string, number>>({});
  
  // Results
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset modal state on open
  useEffect(() => {
    if (open) {
      setStep("upload");
      setFile(null);
      setLoading(false);
      setErrorMsg("");
      setPreview(null);
      setMapping({});
      setResult(null);
    }
  }, [open]);

  // Close on Escape key press
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && step !== "importing") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, step, onClose]);

  if (!open) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith(".csv") || droppedFile.type === "text/csv")) {
      processFile(droppedFile);
    } else {
      setErrorMsg("Please select a valid CSV file (.csv)");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await api.lotsBuildings.importPreview(selectedFile);
      setPreview(data);
      
      // Build initial mapping using auto-detected values or -1
      const initialMapping: Record<string, number> = {};
      data.required_fields.forEach(field => {
        initialMapping[field] = data.auto_mapping[field] ?? -1;
      });
      data.optional_fields.forEach(field => {
        initialMapping[field] = data.auto_mapping[field] ?? -1;
      });
      
      setMapping(initialMapping);
      setStep("mapping");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to parse CSV file. Please make sure it is a valid format.");
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleMappingChange = (field: string, colIndex: number) => {
    setMapping(prev => ({ ...prev, [field]: colIndex }));
  };

  const handleExecuteImport = async () => {
    if (!file || !preview) return;

    // Check if required fields are mapped
    const missingRequired = preview.required_fields.some(field => mapping[field] === undefined || mapping[field] === -1);
    if (missingRequired) {
      setErrorMsg("Please map all required fields (Classification and Owner Name).");
      return;
    }

    setStep("importing");
    setLoading(true);
    setErrorMsg("");

    try {
      // Filter out unmapped fields (-1 values)
      const cleanMapping: Record<string, number> = {};
      Object.entries(mapping).forEach(([k, v]) => {
        if (v !== -1) cleanMapping[k] = v;
      });

      const res = await api.lotsBuildings.importCsv(file, cleanMapping);
      setResult({
        imported: res.imported,
        skipped: res.skipped,
        errors: res.errors || []
      });
      setStep("result");
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || "Import failed. Please check your data format and try again.");
      setStep("mapping");
    } finally {
      setLoading(false);
    }
  };

  const getFieldLabel = (field: string) => {
    switch (field) {
      case "classification": return "Classification (lot_only, building_only, lot_and_building)";
      case "owner_name": return "Owner Name";
      case "property_classification": return "Property Classification (residential, commercial, agricultural, etc.)";
      case "owner_contact": return "Owner Contact / Phone";
      case "owner_email": return "Owner Email";
      case "owner_address": return "Owner Address";
      case "size": return "Size";
      case "mri": return "MRI";
      case "purok": return "Purok/Zone";
      case "street": return "Street Name";
      case "exact_address": return "Exact Location Address";
      case "lot_number": return "Lot Number";
      case "block_number": return "Block Number";
      case "boundary_north": return "Boundary North";
      case "boundary_south": return "Boundary South";
      case "boundary_east": return "Boundary East";
      case "boundary_west": return "Boundary West";
      case "tax_declaration_number": return "Tax Declaration Number";
      case "registration_date": return "Registration Date";
      case "number_of_floors": return "Number of Floors";
      case "building_material": return "Building Material";
      case "year_constructed": return "Year Constructed";
      case "assessed_value": return "Assessed Value";
      case "market_value": return "Market Value";
      case "status": return "Status";
      case "latitude": return "Latitude";
      case "longitude": return "Longitude";
      default: return field;
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-card rounded-2xl border shadow-xl flex flex-col max-h-[90vh] overflow-hidden scale-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-accent-primary/10 text-accent-primary" style={{ color: "var(--accent-primary)", backgroundColor: "rgba(var(--accent-primary-rgb, 59, 130, 246), 0.1)" }}>
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Import Lots & Buildings</h2>
              <p className="text-xs text-muted-foreground">Upload an offline lots & buildings Excel or CSV database</p>
            </div>
          </div>
          {step !== "importing" && (
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors hover:bg-muted"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* Step 1: Upload */}
          {step === "upload" && (
            <div className="flex flex-col items-center justify-center py-8">
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-xl border-2 border-dashed border-border rounded-2xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-accent-primary/50 hover:bg-muted/30 transition-all duration-200 group text-center"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv,text/csv"
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                  {loading ? (
                    <Loader2 className="w-8 h-8 text-accent-primary animate-spin" style={{ color: "var(--accent-primary)" }} />
                  ) : (
                    <Upload className="w-8 h-8 text-muted-foreground group-hover:text-accent-primary transition-colors" style={{ color: "var(--accent-primary)" }} />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-base text-foreground">
                    {loading ? "Processing file..." : "Click to upload or drag & drop CSV file"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Only .csv database files are supported
                  </p>
                </div>
              </div>

              {errorMsg && (
                <div className="mt-4 flex items-center gap-2 text-sm text-red-500 bg-red-500/10 p-3 px-4 rounded-xl border border-red-500/20 max-w-xl w-full">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p>{errorMsg}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Column Mapping */}
          {step === "mapping" && preview && (
            <div className="flex flex-col gap-6">
              
              {/* File Info */}
              <div className="flex items-center justify-between p-4 bg-muted/30 border rounded-xl">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-accent-primary" style={{ color: "var(--accent-primary)" }} />
                  <div>
                    <p className="text-sm font-semibold text-foreground truncate max-w-md">{file?.name}</p>
                    <p className="text-xs text-muted-foreground">{preview.total_rows.toLocaleString()} data rows found</p>
                  </div>
                </div>
                <button
                  onClick={() => setStep("upload")}
                  className="text-xs font-semibold hover:underline flex items-center gap-1 text-accent-primary"
                  style={{ color: "var(--accent-primary)" }}
                >
                  <RefreshCw className="w-3 h-3" /> Change File
                </button>
              </div>

              {/* Data Preview */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                  <Table className="w-3.5 h-3.5" /> CSV Data Preview (First 3 Rows)
                </h3>
                <div className="border rounded-xl overflow-x-auto max-w-full bg-muted/10">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-muted/40 border-b">
                        {preview.headers.map((h, i) => (
                          <th key={i} className="px-3 py-2 font-semibold text-muted-foreground border-r last:border-r-0 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-[10px] text-muted-foreground/60">Col {i}</span>
                              <span className="truncate max-w-[120px]">{h || "—"}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.sample_rows.slice(0, 3).map((row, rIndex) => (
                        <tr key={rIndex} className="border-b last:border-b-0 hover:bg-muted/20">
                          {row.map((cell, cIndex) => (
                            <td key={cIndex} className="px-3 py-2 text-foreground border-r last:border-r-0 whitespace-nowrap truncate max-w-[120px]">
                              {cell || <span className="text-muted-foreground/30">—</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Column Mapping Form */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Map CSV Columns to Database Fields
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Required Fields */}
                  <div className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-background">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider text-accent-primary border-b pb-2 flex items-center justify-between" style={{ color: "var(--accent-primary)" }}>
                      <span>Required Fields</span>
                      <span className="text-[10px] font-normal text-red-500">Must be mapped</span>
                    </h4>
                    {preview.required_fields.map(field => (
                      <div key={field} className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                          {getFieldLabel(field)} <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={mapping[field] ?? -1}
                          onChange={(e) => handleMappingChange(field, parseInt(e.target.value))}
                          className="w-full text-xs h-9 px-3 border border-border rounded-lg bg-background hover:bg-muted/30 focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all duration-200 outline-none"
                        >
                          <option value={-1}>-- Select Column --</option>
                          {preview.headers.map((h, i) => (
                            <option key={i} value={i}>
                              Col {i}: {h || "—"}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>

                  {/* Optional Fields */}
                  <div className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-background">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider border-b pb-2 flex items-center justify-between">
                      <span>Optional Fields</span>
                      <span className="text-[10px] font-normal text-muted-foreground">Optional</span>
                    </h4>
                    {preview.optional_fields.map(field => (
                      <div key={field} className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-foreground">
                          {getFieldLabel(field)}
                        </label>
                        <select
                          value={mapping[field] ?? -1}
                          onChange={(e) => handleMappingChange(field, parseInt(e.target.value))}
                          className="w-full text-xs h-9 px-3 border border-border rounded-lg bg-background hover:bg-muted/30 focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all duration-200 outline-none"
                        >
                          <option value={-1}>Do Not Import</option>
                          {preview.headers.map((h, i) => (
                            <option key={i} value={i}>
                              Col {i}: {h || "—"}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>

                </div>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 p-3 px-4 rounded-xl border border-red-500/20">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p>{errorMsg}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 border-t pt-4">
                <button
                  onClick={onClose}
                  className="h-10 px-4 text-xs font-semibold rounded-lg border border-border hover:bg-muted text-foreground transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteImport}
                  className="inline-flex items-center gap-2 h-10 px-5 text-xs font-semibold rounded-lg text-white transition-all hover:opacity-90 active:scale-[0.98] duration-200"
                  style={{ background: "var(--accent-primary)" }}
                >
                  Start Import <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

          {/* Step 3: Importing Spinner */}
          {step === "importing" && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="w-12 h-12 text-accent-primary animate-spin" style={{ color: "var(--accent-primary)" }} />
              <div className="text-center">
                <p className="font-semibold text-foreground text-base">Importing Lots & Buildings...</p>
                <p className="text-xs text-muted-foreground mt-1">Please keep this window open while data is writing to database</p>
              </div>
            </div>
          )}

          {/* Step 4: Results Display */}
          {step === "result" && result && (
            <div className="flex flex-col gap-6 py-4">
              
              {/* Outcome Header */}
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-16 h-16 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Import Completed Successfully</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Processed offline database file mapping
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border bg-green-500/5 text-center flex flex-col gap-1">
                  <span className="text-2xl font-bold text-green-600">{result.imported.toLocaleString()}</span>
                  <span className="text-xs font-semibold text-muted-foreground">Properties Imported</span>
                </div>
                <div className={cn(
                  "p-4 rounded-xl border text-center flex flex-col gap-1",
                  result.skipped > 0 ? "bg-amber-500/5 border-amber-500/20" : "bg-muted/20"
                )}>
                  <span className={cn("text-2xl font-bold", result.skipped > 0 ? "text-amber-600" : "text-foreground")}>
                    {result.skipped.toLocaleString()}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">Duplicates / Rows Skipped</span>
                </div>
              </div>

              {/* Detailed Warnings / Skipped Rows Logs */}
              {result.errors.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> Import Warnings & Skip Logs
                  </h4>
                  <div className="border border-amber-500/20 rounded-xl p-3 bg-amber-500/5 max-h-48 overflow-y-auto text-xs flex flex-col gap-1 text-amber-800">
                    {result.errors.map((err, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="font-semibold text-amber-600">⚠️</span>
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Close Button */}
              <div className="flex justify-center border-t pt-6">
                <button
                  onClick={onClose}
                  className="h-10 px-8 text-xs font-semibold rounded-lg text-white transition-all hover:opacity-90 active:scale-[0.98] duration-200"
                  style={{ background: "var(--accent-primary)" }}
                >
                  Done & Refresh List
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>,
    document.body
  );
}
