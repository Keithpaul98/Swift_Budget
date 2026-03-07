import { describe, it, expect } from "vitest";
import {
  CHART_COLORS,
  ITEMS_PER_PAGE,
  ERROR_MESSAGES,
  ADMIN_EMAIL,
} from "@/lib/constants";

describe("Constants", () => {
  it("has 6 chart colors", () => {
    expect(CHART_COLORS).toHaveLength(6);
  });

  it("chart colors are valid hex values", () => {
    CHART_COLORS.forEach((color) => {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  it("ITEMS_PER_PAGE is a positive number", () => {
    expect(ITEMS_PER_PAGE).toBeGreaterThan(0);
  });

  it("ADMIN_EMAIL is valid", () => {
    expect(ADMIN_EMAIL).toContain("@");
  });
});

describe("ERROR_MESSAGES", () => {
  it("generic message is a string", () => {
    expect(typeof ERROR_MESSAGES.generic).toBe("string");
  });

  it("loadFailed returns formatted string", () => {
    expect(ERROR_MESSAGES.loadFailed("transactions")).toBe(
      "Failed to load transactions"
    );
  });

  it("saveFailed returns formatted string", () => {
    expect(ERROR_MESSAGES.saveFailed("category")).toBe(
      "Failed to save category"
    );
  });

  it("deleteFailed returns formatted string", () => {
    expect(ERROR_MESSAGES.deleteFailed("project")).toBe(
      "Failed to delete project"
    );
  });

  it("nameEmpty returns formatted string", () => {
    expect(ERROR_MESSAGES.nameEmpty("Category")).toBe(
      "Category name cannot be empty"
    );
  });

  it("amountPositive is a string", () => {
    expect(typeof ERROR_MESSAGES.amountPositive).toBe("string");
  });

  it("endDateAfterStart is a string", () => {
    expect(typeof ERROR_MESSAGES.endDateAfterStart).toBe("string");
  });

  it("thresholdRange is a string", () => {
    expect(typeof ERROR_MESSAGES.thresholdRange).toBe("string");
  });
});
