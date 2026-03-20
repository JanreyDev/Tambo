import { describe, it, expect, beforeEach, vi } from "vitest";
import "fake-indexeddb/auto";

// We need to reset the IDB state between tests. fake-indexeddb/auto replaces
// the global indexedDB. The simplest approach: re-import the module fresh each
// test via vi.importActual after resetting the global IDB.

// Import the functions under test
import {
  queueSubmission,
  getPendingCount,
  getAllPending,
  removePending,
  updatePendingAttempt,
  saveDraft,
  loadDraft,
  clearDraft,
} from "../census-offline";

// Between tests, replace the global indexedDB with a fresh instance
// so each test starts with an empty database.
beforeEach(async () => {
  const FDBFactory = (await import("fake-indexeddb/lib/FDBFactory")).default;
  const fresh = new FDBFactory();
  Object.defineProperty(globalThis, "indexedDB", {
    value: fresh,
    writable: true,
    configurable: true,
  });
});

describe("pending submissions (offline queue)", () => {
  it("starts with zero pending", async () => {
    const count = await getPendingCount();
    expect(count).toBe(0);
  });

  it("queues a submission and increments count", async () => {
    await queueSubmission({ first_name: "Juan", last_name: "Dela Cruz" });
    const count = await getPendingCount();
    expect(count).toBe(1);
  });

  it("retrieves all pending submissions", async () => {
    await queueSubmission({ first_name: "Juan" });
    await queueSubmission({ first_name: "Maria" });

    const pending = await getAllPending();
    expect(pending).toHaveLength(2);
    expect(pending[0].payload).toEqual({ first_name: "Juan" });
    expect(pending[1].payload).toEqual({ first_name: "Maria" });
    expect(pending[0].attempts).toBe(0);
    expect(pending[0].created_at).toBeTruthy();
  });

  it("removes a pending submission by id", async () => {
    await queueSubmission({ first_name: "Juan" });
    const pending = await getAllPending();
    const id = pending[0].id!;

    await removePending(id);
    const count = await getPendingCount();
    expect(count).toBe(0);
  });

  it("updates attempt count and error on failure", async () => {
    await queueSubmission({ first_name: "Juan" });
    const pending = await getAllPending();
    const id = pending[0].id!;

    await updatePendingAttempt(id, "Network error");

    const updated = await getAllPending();
    expect(updated[0].attempts).toBe(1);
    expect(updated[0].last_error).toBe("Network error");
  });
});

describe("draft auto-save", () => {
  it("returns null for non-existent draft", async () => {
    const draft = await loadDraft("census-step-1");
    expect(draft).toBeNull();
  });

  it("saves and loads a draft", async () => {
    const data = { step: 1, first_name: "Juan", last_name: "Dela Cruz" };
    await saveDraft("census-step-1", data);

    const loaded = await loadDraft("census-step-1");
    expect(loaded).toEqual(data);
  });

  it("overwrites existing draft with same key", async () => {
    await saveDraft("census-step-1", { step: 1, first_name: "Juan" });
    await saveDraft("census-step-1", { step: 1, first_name: "Updated" });

    const loaded = await loadDraft("census-step-1");
    expect(loaded).toEqual({ step: 1, first_name: "Updated" });
  });

  it("clears a draft by key", async () => {
    await saveDraft("census-step-1", { step: 1 });
    await clearDraft("census-step-1");

    const loaded = await loadDraft("census-step-1");
    expect(loaded).toBeNull();
  });

  it("handles multiple independent drafts", async () => {
    await saveDraft("step-1", { name: "Juan" });
    await saveDraft("step-2", { address: "Zambales" });

    expect(await loadDraft("step-1")).toEqual({ name: "Juan" });
    expect(await loadDraft("step-2")).toEqual({ address: "Zambales" });

    await clearDraft("step-1");
    expect(await loadDraft("step-1")).toBeNull();
    expect(await loadDraft("step-2")).toEqual({ address: "Zambales" });
  });
});
