"use client";

/**
 * Census Mode -- Mobile-only resident registration
 *
 * This page renders the SAME ResidentsPage component used on the desktop dashboard.
 * The census layout provides a minimal mobile chrome (no sidebar, no header).
 * CSS class "census-mobile-view" on the parent adjusts layout for single-column mobile.
 *
 * Why not extract? The form is 3,295 lines with tightly coupled state (photo system,
 * map, duplicate detection, 15+ combobox entry sets). Importing directly means
 * zero code duplication and one form to maintain.
 */
import ResidentsPage from "@/app/dashboard/residents/page";

export default function CensusPage() {
  return <ResidentsPage />;
}
