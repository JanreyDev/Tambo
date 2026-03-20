import { describe, it, expect } from "vitest";
import { APP_VERSION, APP_VERSION_LABEL } from "../version";

describe("version", () => {
  it("exports a semver version string", () => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("exports a label prefixed with v", () => {
    expect(APP_VERSION_LABEL).toBe(`v${APP_VERSION}`);
  });

  it("current version is 5.0.0", () => {
    expect(APP_VERSION).toBe("5.0.0");
  });
});
