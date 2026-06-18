import { describe, it, expect } from "vitest";
import { cn, resolvePhotoUrl } from "../utils";

describe("cn()", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("deduplicates conflicting Tailwind classes", () => {
    // tailwind-merge should resolve p-4 + p-2 to p-2
    expect(cn("p-4", "p-2")).toBe("p-2");
  });

  it("handles undefined and null inputs", () => {
    expect(cn("foo", undefined, null, "bar")).toBe("foo bar");
  });

  it("returns empty string for no input", () => {
    expect(cn()).toBe("");
  });

  it("handles array inputs via clsx", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });
});

describe("resolvePhotoUrl()", () => {
  it("returns null for null input", () => {
    expect(resolvePhotoUrl(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(resolvePhotoUrl(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(resolvePhotoUrl("")).toBeNull();
  });

  it("strips localhost origin and returns relative path", () => {
    const url = "http://localhost:8000/storage/bcmp/photo.jpg";
    expect(resolvePhotoUrl(url)).toBe("/storage/bcmp/photo.jpg");
  });

  it("strips 127.0.0.1 origin and returns relative path", () => {
    const url = "http://127.0.0.1:8000/storage/bcmp/photo.jpg";
    expect(resolvePhotoUrl(url)).toBe("/storage/bcmp/photo.jpg");
  });

  it("strips custom IP origin and returns relative path for local storage URLs", () => {
    const url = "http://167.172.89.188:8011/storage/bcmp/photo.jpg";
    expect(resolvePhotoUrl(url)).toBe("/storage/bcmp/photo.jpg");
  });

  it("preserves query string when stripping localhost", () => {
    const url = "http://localhost:8000/storage/photo.jpg?w=200&h=200";
    expect(resolvePhotoUrl(url)).toBe("/storage/photo.jpg?w=200&h=200");
  });

  it("returns external URLs unchanged", () => {
    const url = "https://primex.sgp1.digitaloceanspaces.com/bcmp/photo.jpg";
    expect(resolvePhotoUrl(url)).toBe(url);
  });

  it("returns relative paths unchanged", () => {
    expect(resolvePhotoUrl("/storage/bcmp/photo.jpg")).toBe("/storage/bcmp/photo.jpg");
  });

  it("returns invalid URLs as-is", () => {
    expect(resolvePhotoUrl("not-a-url")).toBe("not-a-url");
  });
});
