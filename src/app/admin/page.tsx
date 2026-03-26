"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ADMIN_EMAIL } from "@/lib/constants";
import { formatCurrency } from "@/types/database";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Users,
  ArrowLeftRight,
  FolderOpen,
  Target,
  Tag,
  Activity,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { format } from "date-fns";

interface SystemStats {
  total_users: number;
  total_transactions: number;
  total_categories: number;
  total_projects: number;
  total_budget_goals: number;
  transactions_today: number;
  signups_this_week: number;
}

interface RecentSignup {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  confirmed_at: string | null;
}

interface AuditLog {
  id: number;
  user_id: string;
  user_email: string;
  action: string;
  entity_type: string;
  entity_id: number;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  created_at: string;
}

interface UserActivity {
  user_id: string;
  email: string;
  username: string;
  signup_date: string;
  last_login: string | null;
  transaction_count: number;
  total_income: number;
  total_expenses: number;
}

export default function AdminPage() {
  const { user, loading: authLoading, supabase } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [signups, setSignups] = useState<RecentSignup[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "logs">("overview");
  const [expandedLog, setExpandedLog] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      // Check admin access
      if (user.email !== ADMIN_EMAIL) {
        router.push("/dashboard");
        return;
      }
      loadAdminData();
    }
  }, [authLoading, user]);

  const loadAdminData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch system stats
      const { data: statsData, error: statsError } = await supabase.rpc("admin_get_system_stats");
      if (statsError) throw statsError;
      if (statsData && statsData.length > 0) setStats(statsData[0]);

      // Fetch recent signups
      const { data: signupData, error: signupError } = await supabase.rpc("admin_get_recent_signups", { days_back: 30 });
      if (signupError) throw signupError;
      setSignups(signupData || []);

      // Fetch audit logs
      const { data: logData, error: logError } = await supabase.rpc("admin_get_audit_logs", { log_limit: 50 });
      if (logError) throw logError;
      setAuditLogs(logData || []);

      // Fetch user activity
      const { data: activityData, error: activityError } = await supabase.rpc("admin_get_user_activity");
      if (activityError) throw activityError;
      setUserActivity(activityData || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load admin data";
      setError(errorMessage);
      console.error("Admin data error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || user.email !== ADMIN_EMAIL) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">System logs & user management</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={loadAdminData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
          <p className="font-medium">Error loading admin data</p>
          <p className="mt-1">{error}</p>
          <p className="mt-2 text-xs">Make sure you've run the <code>003_admin_functions.sql</code> migration in Supabase SQL Editor.</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b pb-2">
        <Button
          variant={activeTab === "overview" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("overview")}
        >
          <Activity className="h-4 w-4 mr-2" />
          Overview
        </Button>
        <Button
          variant={activeTab === "users" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("users")}
        >
          <Users className="h-4 w-4 mr-2" />
          Users
        </Button>
        <Button
          variant={activeTab === "logs" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("logs")}
        >
          <Clock className="h-4 w-4 mr-2" />
          Audit Logs
        </Button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <>
          {/* Stats Grid */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold">{stats.total_users}</p>
                      <p className="text-xs text-muted-foreground">Total Users</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <ArrowLeftRight className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">{stats.total_transactions}</p>
                      <p className="text-xs text-muted-foreground">Transactions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Tag className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-2xl font-bold">{stats.total_categories}</p>
                      <p className="text-xs text-muted-foreground">Custom Categories</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <FolderOpen className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-2xl font-bold">{stats.total_projects}</p>
                      <p className="text-xs text-muted-foreground">Projects</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="text-2xl font-bold">{stats.total_budget_goals}</p>
                      <p className="text-xs text-muted-foreground">Budget Goals</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Activity className="h-5 w-5 text-cyan-500" />
                    <div>
                      <p className="text-2xl font-bold">{stats.transactions_today}</p>
                      <p className="text-xs text-muted-foreground">Today&apos;s Transactions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="text-2xl font-bold">{stats.signups_this_week}</p>
                      <p className="text-xs text-muted-foreground">Signups (7 days)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Signups */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Signups (30 days)</CardTitle>
              <CardDescription>{signups.length} new user{signups.length !== 1 ? "s" : ""}</CardDescription>
            </CardHeader>
            <CardContent>
              {signups.length > 0 ? (
                <div className="space-y-3">
                  {signups.map((signup) => (
                    <div key={signup.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium text-sm">{signup.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined {format(new Date(signup.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                      <div className="text-right">
                        {signup.confirmed_at ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Confirmed</span>
                        ) : (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">Unconfirmed</span>
                        )}
                        {signup.last_sign_in_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Last login: {format(new Date(signup.last_sign_in_at), "MMM d, h:mm a")}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No recent signups</p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User Activity</CardTitle>
            <CardDescription>All registered users and their activity</CardDescription>
          </CardHeader>
          <CardContent>
            {userActivity.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 font-medium">User</th>
                      <th className="pb-2 font-medium hidden sm:table-cell">Joined</th>
                      <th className="pb-2 font-medium text-center">Txns</th>
                      <th className="pb-2 font-medium text-right hidden sm:table-cell">Income</th>
                      <th className="pb-2 font-medium text-right hidden sm:table-cell">Expenses</th>
                      <th className="pb-2 font-medium text-right">Last Login</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userActivity.map((ua) => (
                      <tr key={ua.user_id} className="border-b last:border-0">
                        <td className="py-3">
                          <p className="font-medium truncate max-w-[150px]">{ua.username || ua.email}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">{ua.email}</p>
                        </td>
                        <td className="py-3 text-xs text-muted-foreground hidden sm:table-cell">
                          {format(new Date(ua.signup_date), "MMM d, yyyy")}
                        </td>
                        <td className="py-3 text-center">{ua.transaction_count}</td>
                        <td className="py-3 text-right text-green-600 hidden sm:table-cell">
                          {formatCurrency(ua.total_income)}
                        </td>
                        <td className="py-3 text-right text-red-600 hidden sm:table-cell">
                          {formatCurrency(ua.total_expenses)}
                        </td>
                        <td className="py-3 text-right text-xs text-muted-foreground">
                          {ua.last_login
                            ? format(new Date(ua.last_login), "MMM d, h:mm a")
                            : "Never"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No user data available</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Audit Logs Tab */}
      {activeTab === "logs" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Audit Logs</CardTitle>
            <CardDescription>Recent system activity across all users (last 50)</CardDescription>
          </CardHeader>
          <CardContent>
            {auditLogs.length > 0 ? (
              <div className="space-y-2">
                {auditLogs.map((log) => (
                  <div key={log.id} className="border rounded-lg p-3">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            log.action === "create"
                              ? "bg-green-100 text-green-700"
                              : log.action === "update"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {log.action}
                        </span>
                        <span className="text-sm font-medium">{log.entity_type}</span>
                        <span className="text-xs text-muted-foreground">#{log.entity_id}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          {log.user_email}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(log.created_at), "MMM d, h:mm a")}
                        </span>
                        {(log.old_values || log.new_values) && (
                          expandedLog === log.id ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )
                        )}
                      </div>
                    </div>
                    {expandedLog === log.id && (log.old_values || log.new_values) && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-1">
                          By: {log.user_email}
                        </p>
                        {log.new_values && (
                          <div className="mt-1">
                            <p className="text-xs font-medium text-muted-foreground">New Values:</p>
                            <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                              {JSON.stringify(log.new_values, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.old_values && (
                          <div className="mt-1">
                            <p className="text-xs font-medium text-muted-foreground">Old Values:</p>
                            <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                              {JSON.stringify(log.old_values, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No audit logs yet</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
