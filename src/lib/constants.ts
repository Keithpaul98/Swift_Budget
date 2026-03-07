// =============================================================================
// Centralized Constants
// =============================================================================

export const CHART_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
] as const;

export const ITEMS_PER_PAGE = 20;

export const DATE_FORMATS = {
  display: "MMM d, yyyy",
  monthYear: "MMMM yyyy",
  monthShort: "MMM",
  input: "yyyy-MM-dd",
} as const;

export const ERROR_MESSAGES = {
  generic: "An unexpected error occurred. Please try again.",
  loadFailed: (entity: string) => `Failed to load ${entity}`,
  saveFailed: (entity: string) => `Failed to save ${entity}`,
  deleteFailed: (entity: string) => `Failed to delete ${entity}`,
  amountPositive: "Amount must be greater than 0",
  nameEmpty: (entity: string) => `${entity} name cannot be empty`,
  endDateAfterStart: "End date must be after start date",
  thresholdRange: "Alert threshold must be between 1 and 100",
  descriptionEmpty: "Description cannot be empty",
  budgetPositive: "Budget must be greater than 0",
} as const;

export const ADMIN_EMAIL = "keithpaul.dev@gmail.com";
