import { describe, it, expect, vi } from "vitest";
import { logAudit } from "@/lib/audit";

describe("logAudit", () => {
  it("calls supabase insert with correct parameters", async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
    const mockSupabase = { from: mockFrom } as any;

    await logAudit(
      mockSupabase,
      "user-123",
      "create",
      "transaction",
      42,
      null,
      { amount: 100 }
    );

    expect(mockFrom).toHaveBeenCalledWith("audit_logs");
    expect(mockInsert).toHaveBeenCalledWith([
      {
        user_id: "user-123",
        action: "create",
        entity_type: "transaction",
        entity_id: 42,
        old_values: null,
        new_values: { amount: 100 },
      },
    ]);
  });

  it("does not throw if supabase insert fails", async () => {
    const mockInsert = vi.fn().mockRejectedValue(new Error("DB error"));
    const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
    const mockSupabase = { from: mockFrom } as any;

    // Should not throw
    await expect(
      logAudit(mockSupabase, "user-123", "delete", "category", 5)
    ).resolves.toBeUndefined();
  });

  it("passes null for optional old/new values", async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
    const mockSupabase = { from: mockFrom } as any;

    await logAudit(mockSupabase, "user-123", "delete", "transaction", 10);

    expect(mockInsert).toHaveBeenCalledWith([
      expect.objectContaining({
        old_values: null,
        new_values: null,
      }),
    ]);
  });
});
