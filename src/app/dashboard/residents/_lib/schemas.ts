/**
 * Resident form Zod schemas.
 *
 * Single source of truth for client-side validation rules. Wire to the
 * existing `validateForm()` in page.tsx via `residentSchema.safeParse(form)`.
 *
 * Phase 3.1 lands the schema + unit tests. A future pass should also generate
 * server-side rules from this (e.g. zod-to-laravel codegen) so FE/BE stay in sync.
 */

import { z } from "zod";

const PH_MOBILE_RE = /^09\d{9}$/;
const ZIP_RE = /^\d{4}$/;
const LAT_PH_MIN = 4.5;
const LAT_PH_MAX = 21.5;
const LNG_PH_MIN = 116;
const LNG_PH_MAX = 127;

// Helpers — accept both empty string and undefined as "unset" for optional fields
const optionalString = z
  .string()
  .optional()
  .transform((v) => (v && v.trim().length > 0 ? v.trim() : undefined));

const optionalDate = z
  .string()
  .optional()
  .transform((v) => (v && v.trim().length > 0 ? v.trim() : undefined))
  .refine((v) => v === undefined || /^\d{4}-\d{2}-\d{2}/.test(v), {
    message: "Date must be in YYYY-MM-DD format.",
  });

const requiredName = z
  .string({ message: "Required" })
  .trim()
  .min(1, "Required")
  .max(100, "Maximum 100 characters");

const phMobile = z
  .string()
  .optional()
  .transform((v) => (v ? v.replace(/\s/g, "") : v))
  .refine((v) => v === undefined || v === "" || PH_MOBILE_RE.test(v), {
    message: "Must be a valid PH number (09XX XXX XXXX).",
  });

const email = z
  .string()
  .optional()
  .transform((v) => (v && v.trim().length > 0 ? v.trim() : undefined))
  .refine(
    (v) => v === undefined || /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v),
    { message: "Must be a valid email address." }
  );

const numericString = (label: string, opts?: { min?: number; max?: number }) =>
  z
    .string()
    .optional()
    .transform((v) => (v && v.trim().length > 0 ? v.trim() : undefined))
    .refine(
      (v) => {
        if (v === undefined) return true;
        if (!/^\d+(\.\d+)?$/.test(v)) return false;
        const n = Number(v);
        if (opts?.min !== undefined && n < opts.min) return false;
        if (opts?.max !== undefined && n > opts.max) return false;
        return true;
      },
      {
        message:
          opts?.min !== undefined || opts?.max !== undefined
            ? `${label} must be between ${opts.min ?? "?"} and ${opts.max ?? "?"}.`
            : `${label} must be a number.`,
      }
    );

// ── Core resident schema (matches what the form actually collects) ────
//
// We accept loose `Record<string, string | boolean>` from form state and
// validate only the fields that have rules. Unrecognized keys are passed
// through untouched (via .catchall).
export const residentSchema = z
  .object({
    // Required identity
    first_name: requiredName,
    last_name: requiredName,
    sex: z.enum(["M", "F", "male", "female", "Male", "Female"], {
      message: "Sex is required.",
    }),
    date_of_birth: z
      .string({ message: "Date of birth is required." })
      .min(1, "Date of birth is required.")
      .refine((v) => /^\d{4}-\d{2}-\d{2}/.test(v), {
        message: "Date must be in YYYY-MM-DD format.",
      }),
    place_of_birth: requiredName,
    civil_status: z.enum(
      [
        "Single",
        "Married",
        "Widowed",
        "Separated",
        "Divorced",
        "Annulled",
        "Live-in",
      ],
      { message: "Civil status is required." }
    ),
    resident_type: z.enum(["Permanent", "Transient", "Transferee"], {
      message: "Residence type is required.",
    }),

    // Optional identity
    middle_name: optionalString,
    extension_name: z.string().optional(),
    nickname: optionalString,

    // Contact
    mobile_number: phMobile,
    email,
    telephone: optionalString,

    // Address
    house_block_lot: optionalString,
    street: optionalString,
    purok: optionalString,
    zip_code: z
      .string()
      .optional()
      .transform((v) => (v && v.trim().length > 0 ? v.trim() : undefined))
      .refine((v) => v === undefined || ZIP_RE.test(v), {
        message: "ZIP must be 4 digits.",
      }),

    // Coordinates (Philippine bounds)
    latitude: numericString("Latitude", { min: LAT_PH_MIN, max: LAT_PH_MAX }),
    longitude: numericString("Longitude", { min: LNG_PH_MIN, max: LNG_PH_MAX }),

    // Demographics
    citizenship: optionalString,
    religion: optionalString,
    ethnicity: optionalString,

    // Physical
    height_cm: numericString("Height", { min: 30, max: 250 }),
    weight_kg: numericString("Weight", { min: 1, max: 500 }),
    blood_type: optionalString,
    complexion: optionalString,

    // Family
    mothers_maiden_name: optionalString,

    // Education + livelihood
    livelihood_type: optionalString,
    occupation: optionalString,
    monthly_income_range: optionalString,
    skills: optionalString,

    // Government IDs (loose — every issuer has its own format)
    sss_gsis_number: optionalString,
    philhealth_number: optionalString,
    pagibig_number: optionalString,
    tin_number: optionalString,
    pwd_id: optionalString,
    senior_citizen_id: optionalString,

    // Voter
    voter_precinct_number: optionalString,

    // Emergency contact
    emergency_contact_name: optionalString,
    emergency_contact_phone: phMobile,
    emergency_contact_address: optionalString,

    // Notes
    health_history: optionalString,
    other_remarks: optionalString,

    // Status / type flags
    status: z.enum(["active", "inactive", "deceased", "transferred", "archived"]).optional(),
    is_voter: z.boolean().optional(),
    is_head_of_household: z.boolean().optional(),
    is_organ_donor: z.boolean().optional(),

    // Audit / system fields the form sometimes carries (passed through)
    registration_date: optionalDate,
    transferred_date: optionalDate,
    deceased_date: optionalDate,
  })
  .catchall(z.unknown());

export type ResidentForm = z.infer<typeof residentSchema>;

/**
 * Validate a form state record and return either { ok: true, data }
 * or { ok: false, errors } where `errors` is a flat field → message map.
 */
export function validateResident(
  form: Record<string, string | boolean | undefined>
): { ok: true; data: ResidentForm } | { ok: false; errors: Record<string, string> } {
  const result = residentSchema.safeParse(form);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".");
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return { ok: false, errors };
}
