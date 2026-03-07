import { describe, it, expect } from "vitest";
import { formatCurrency } from "@/types/database";

describe("formatCurrency", () => {
  it("formats zero correctly", () => {
    expect(formatCurrency(0)).toBe("MK 0.00");
  });

  it("formats positive integers with two decimals", () => {
    expect(formatCurrency(100)).toBe("MK 100.00");
  });

  it("formats decimal amounts correctly", () => {
    expect(formatCurrency(99.5)).toBe("MK 99.50");
  });

  it("formats large numbers with commas", () => {
    expect(formatCurrency(1000000)).toBe("MK 1,000,000.00");
  });

  it("rounds to two decimal places", () => {
    expect(formatCurrency(10.999)).toBe("MK 11.00");
  });

  it("handles negative amounts", () => {
    const result = formatCurrency(-500);
    expect(result).toContain("500.00");
  });

  it("formats small decimal amounts", () => {
    expect(formatCurrency(0.01)).toBe("MK 0.01");
  });

  it("formats amounts with exact two decimals", () => {
    expect(formatCurrency(42.42)).toBe("MK 42.42");
  });
});
