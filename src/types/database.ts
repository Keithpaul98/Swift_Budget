// =============================================================================
// TypeScript Types for SwiftBudget Database Schema
// =============================================================================
// These types mirror your PostgreSQL tables from the Flask app.
// In TypeScript, an "interface" defines the shape of an object — what
// properties it has and what type each property is.
// =============================================================================

export interface User {
  id: string; // UUID
  username: string;
  email: string;
  profile_image: string | null;
  is_active: boolean;
  email_notifications: boolean;
  created_at: string; // ISO timestamp string from Supabase
  last_login: string | null;
  failed_login_attempts: number;
  account_locked_until: string | null;
}

export interface Category {
  id: number;
  name: string;
  type: "income" | "expense"; // Union type: can only be one of these two strings
  is_default: boolean;
  user_id: string | null; // null for default categories
  created_at: string;
}

export interface Transaction {
  id: number;
  user_id: string;
  category_id: number;
  project_id: number | null;
  type: "income" | "expense";
  amount: number;
  description: string;
  date: string; // "YYYY-MM-DD" format
  quantity: number | null;
  unit_price: number | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  // Joined data (optional — present when you fetch with related tables)
  category?: Category;
  project?: Project;
}

export interface BudgetGoal {
  id: number;
  user_id: string;
  category_id: number | null;
  amount: number;
  period: "weekly" | "monthly" | "yearly";
  start_date: string;
  end_date: string;
  alert_threshold: number; // percentage (e.g. 80 = 80%)
  is_active: boolean;
  created_at: string;
  // Joined data
  category?: Category;
}

export interface Project {
  id: number;
  user_id: string;
  name: string;
  description: string | null;
  color: string; // hex color like "#FF5733"
  is_active: boolean;
  created_at: string;
}

export interface RecurringTransaction {
  id: number;
  user_id: string;
  category_id: number;
  type: "income" | "expense";
  amount: number;
  description: string;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  start_date: string;
  end_date: string | null;
  next_occurrence: string;
  is_active: boolean;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: number;
  old_values: Record<string, unknown> | null; // JSON object
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

// =============================================================================
// Helper type for currency formatting
// =============================================================================
export const CURRENCY = {
  symbol: process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "MK",
  code: process.env.NEXT_PUBLIC_CURRENCY_CODE || "MWK",
} as const;

export function formatCurrency(amount: number): string {
  return `${CURRENCY.symbol} ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
