import { describe, it, expect } from "vitest";
import { validateResident, residentSchema } from "./schemas";

// Minimum valid resident — every required field set to a sensible value
const validResident = {
  first_name: "Juan",
  last_name: "Dela Cruz",
  sex: "M",
  date_of_birth: "1990-01-15",
  place_of_birth: "Manila",
  civil_status: "Single",
  resident_type: "Permanent",
  mobile_number: "09171234567",
};

describe("residentSchema", () => {
  describe("required fields", () => {
    it("accepts a minimum-valid resident", () => {
      const result = validateResident(validResident);
      expect(result.ok).toBe(true);
    });

    it("rejects when first_name is missing", () => {
      const result = validateResident({ ...validResident, first_name: "" });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.first_name).toBeTruthy();
    });

    it("rejects when last_name is missing", () => {
      const result = validateResident({ ...validResident, last_name: "" });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.last_name).toBeTruthy();
    });

    it("rejects unknown sex value", () => {
      const result = validateResident({ ...validResident, sex: "X" });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.sex).toBeTruthy();
    });

    it("accepts all valid sex / gender values", () => {
      const genders = ["M", "F", "male", "female", "Male", "Female", "Lesbian", "Gay", "Bisexual", "Transgender", "Queer", "Intersex", "Other", "Prefer not to say"];
      for (const sex of genders) {
        const result = validateResident({ ...validResident, sex });
        expect(result.ok, `sex="${sex}" should validate`).toBe(true);
      }
    });

    it("rejects malformed date_of_birth", () => {
      const result = validateResident({ ...validResident, date_of_birth: "not-a-date" });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.date_of_birth).toBeTruthy();
    });

    it("rejects unknown civil_status", () => {
      const result = validateResident({ ...validResident, civil_status: "Confused" });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.civil_status).toBeTruthy();
    });

    it("accepts all valid civil statuses", () => {
      const statuses = ["Single", "Married", "Widowed", "Separated", "Divorced", "Annulled", "Live-in"];
      for (const civil_status of statuses) {
        const result = validateResident({ ...validResident, civil_status });
        expect(result.ok, `civil_status="${civil_status}" should validate`).toBe(true);
      }
    });
  });

  describe("PH mobile number", () => {
    it("accepts canonical 09XXXXXXXXX format", () => {
      const result = validateResident({ ...validResident, mobile_number: "09171234567" });
      expect(result.ok).toBe(true);
    });

    it("accepts spaced 09XX XXX XXXX format (strips spaces)", () => {
      const result = validateResident({ ...validResident, mobile_number: "0917 123 4567" });
      expect(result.ok).toBe(true);
    });

    it("rejects landline format", () => {
      const result = validateResident({ ...validResident, mobile_number: "8123-4567" });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.mobile_number).toBeTruthy();
    });

    it("rejects truncated mobile", () => {
      const result = validateResident({ ...validResident, mobile_number: "09171" });
      expect(result.ok).toBe(false);
    });

    it("rejects empty string (required)", () => {
      const result = validateResident({ ...validResident, mobile_number: "" });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.mobile_number).toBe("Mobile number is required.");
    });
  });

  describe("email", () => {
    it("accepts valid email", () => {
      const result = validateResident({ ...validResident, email: "juan@example.com" });
      expect(result.ok).toBe(true);
    });

    it("rejects malformed email", () => {
      const result = validateResident({ ...validResident, email: "not-an-email" });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.email).toBeTruthy();
    });

    it("treats empty email as unset", () => {
      const result = validateResident({ ...validResident, email: "" });
      expect(result.ok).toBe(true);
    });
  });

  describe("ZIP code", () => {
    it("accepts 4-digit ZIP", () => {
      const result = validateResident({ ...validResident, zip_code: "1700" });
      expect(result.ok).toBe(true);
    });

    it("rejects 3-digit ZIP", () => {
      const result = validateResident({ ...validResident, zip_code: "170" });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.zip_code).toBeTruthy();
    });

    it("rejects non-numeric ZIP", () => {
      const result = validateResident({ ...validResident, zip_code: "170A" });
      expect(result.ok).toBe(false);
    });
  });

  describe("Philippine coordinates", () => {
    it("accepts Manila lat/lng", () => {
      const result = validateResident({ ...validResident, latitude: "14.5995", longitude: "120.9842" });
      expect(result.ok).toBe(true);
    });

    it("rejects lat outside PH (e.g. New York)", () => {
      const result = validateResident({ ...validResident, latitude: "40.7128", longitude: "-74.006" });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.latitude || result.errors.longitude).toBeTruthy();
      }
    });

    it("rejects non-numeric lat/lng", () => {
      const result = validateResident({ ...validResident, latitude: "abc" });
      expect(result.ok).toBe(false);
    });

    it("treats empty coords as unset", () => {
      const result = validateResident({ ...validResident, latitude: "", longitude: "" });
      expect(result.ok).toBe(true);
    });
  });

  describe("height + weight", () => {
    it("accepts realistic adult height/weight", () => {
      const result = validateResident({ ...validResident, height_cm: "170", weight_kg: "65" });
      expect(result.ok).toBe(true);
    });

    it("rejects negative height", () => {
      const result = validateResident({ ...validResident, height_cm: "-5" });
      expect(result.ok).toBe(false);
    });

    it("rejects implausibly large weight (>500kg)", () => {
      const result = validateResident({ ...validResident, weight_kg: "800" });
      expect(result.ok).toBe(false);
    });
  });

  describe("status enum", () => {
    it("accepts all valid statuses", () => {
      for (const status of ["active", "inactive", "deceased", "transferred", "archived"]) {
        const result = validateResident({ ...validResident, status });
        expect(result.ok, `status="${status}" should validate`).toBe(true);
      }
    });

    it("rejects unknown status", () => {
      const result = validateResident({ ...validResident, status: "ghosted" });
      expect(result.ok).toBe(false);
    });
  });

  describe("schema type export", () => {
    it("exposes residentSchema for type-level use", () => {
      // Compile-time check: parse() should succeed on minimum-valid input
      const parsed = residentSchema.safeParse(validResident);
      expect(parsed.success).toBe(true);
    });
  });

  describe("minor guardian validation", () => {
    it("accepts an adult (18+) with missing guardian fields", () => {
      const result = validateResident({
        ...validResident,
        date_of_birth: "2000-01-01",
        guardian_name: "",
        guardian_relationship: "",
      });
      expect(result.ok).toBe(true);
    });

    it("rejects a minor (<18) with missing guardian fields", () => {
      const result = validateResident({
        ...validResident,
        date_of_birth: "2015-01-01",
        guardian_name: "",
        guardian_relationship: "",
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.guardian_name).toBe("Guardian name is required for minors.");
        expect(result.errors.guardian_relationship).toBe("Guardian relationship is required for minors.");
      }
    });

    it("accepts a minor (<18) with complete guardian fields", () => {
      const result = validateResident({
        ...validResident,
        date_of_birth: "2015-01-01",
        guardian_name: "Jane Doe",
        guardian_relationship: "Mother",
        guardian_phone: "09171234567",
      });
      expect(result.ok).toBe(true);
    });
  });

  describe("multi-field error collection", () => {
    it("collects errors from multiple fields in one pass", () => {
      const result = validateResident({
        ...validResident,
        first_name: "",
        last_name: "",
        sex: "X" as never,
        mobile_number: "bad",
        email: "also-bad",
        zip_code: "1",
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.first_name).toBeTruthy();
        expect(result.errors.last_name).toBeTruthy();
        expect(result.errors.sex).toBeTruthy();
        expect(result.errors.mobile_number).toBeTruthy();
        expect(result.errors.email).toBeTruthy();
        expect(result.errors.zip_code).toBeTruthy();
      }
    });
  });
});
