"use client";

import { useState, useEffect, useCallback } from "react";
import AdminUserDetail from "@/components/admin-user-detail";
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
  Gauge,
  Wifi,
  Smartphone,
  Monitor,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Eye,
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

interface PerformanceMetrics {
  // Page load timing
  pageLoadTime: number | null;
  domContentLoaded: number | null;
  firstContentfulPaint: number | null;
  largestContentfulPaint: number | null;
  timeToInteractive: number | null;
  // API latency
  apiLatency: number | null;
  apiLatencyStatus: "good" | "moderate" | "slow" | null;
  // Connection info
  connectionType: string;
  effectiveType: string;
  downlink: number | null;
  rtt: number | null;
  // Device
  deviceMemory: number | null;
  hardwareConcurrency: number;
  isMobile: boolean;
  userAgent: string;
  screenSize: string;
  // Resource stats
  totalResources: number;
  totalTransferSize: number;
  jsSize: number;
  cssSize: number;
  imageSize: number;
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
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "logs" | "performance">("overview");
  const [expandedLog, setExpandedLog] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserActivity | null>(null);
  const [perfMetrics, setPerfMetrics] = useState<PerformanceMetrics | null>(null);
  const [perfLoading, setPerfLoading] = useState(false);

  const collectPerformanceMetrics = useCallback(async () => {
    setPerfLoading(true);
    try {
      const metrics: PerformanceMetrics = {
        pageLoadTime: null,
        domContentLoaded: null,
        firstContentfulPaint: null,
        largestContentfulPaint: null,
        timeToInteractive: null,
        apiLatency: null,
        apiLatencyStatus: null,
        connectionType: "unknown",
        effectiveType: "unknown",
        downlink: null,
        rtt: null,
        deviceMemory: null,
        hardwareConcurrency: navigator.hardwareConcurrency || 0,
        isMobile: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent),
        userAgent: navigator.userAgent,
        screenSize: `${window.screen.width}x${window.screen.height}`,
        totalResources: 0,
        totalTransferSize: 0,
        jsSize: 0,
        cssSize: 0,
        imageSize: 0,
      };

      // Navigation timing
      const navEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
      if (navEntries.length > 0) {
        const nav = navEntries[0];
        metrics.pageLoadTime = Math.round(nav.loadEventEnd - nav.startTime);
        metrics.domContentLoaded = Math.round(nav.domContentLoadedEventEnd - nav.startTime);
        metrics.timeToInteractive = Math.round(nav.domInteractive - nav.startTime);
      }

      // Paint timing (FCP)
      const paintEntries = performance.getEntriesByType("paint");
      const fcp = paintEntries.find((e) => e.name === "first-contentful-paint");
      if (fcp) metrics.firstContentfulPaint = Math.round(fcp.startTime);

      // LCP via PerformanceObserver
      try {
        const lcpPromise = new Promise<number>((resolve) => {
          const existingEntries = performance.getEntriesByType("largest-contentful-paint");
          if (existingEntries.length > 0) {
            resolve(Math.round(existingEntries[existingEntries.length - 1].startTime));
            return;
          }
          // If no existing LCP, use FCP as fallback
          resolve(metrics.firstContentfulPaint || 0);
        });
        metrics.largestContentfulPaint = await lcpPromise;
      } catch {
        // LCP not available
      }

      // API latency benchmark — measure a real Supabase round trip
      const apiStart = performance.now();
      await supabase.from("categories").select("id").limit(1);
      const apiEnd = performance.now();
      metrics.apiLatency = Math.round(apiEnd - apiStart);
      metrics.apiLatencyStatus =
        metrics.apiLatency < 200 ? "good" : metrics.apiLatency < 500 ? "moderate" : "slow";

      // Connection info
      const conn = (navigator as unknown as { connection?: { effectiveType?: string; type?: string; downlink?: number; rtt?: number } }).connection;
      if (conn) {
        metrics.connectionType = conn.type || "unknown";
        metrics.effectiveType = conn.effectiveType || "unknown";
        metrics.downlink = conn.downlink ?? null;
        metrics.rtt = conn.rtt ?? null;
      }

      // Device memory
      metrics.deviceMemory = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? null;

      // Resource breakdown
      const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
      metrics.totalResources = resources.length;
      let totalTransfer = 0;
      let jsSize = 0;
      let cssSize = 0;
      let imageSize = 0;
      resources.forEach((r) => {
        const size = r.transferSize || 0;
        totalTransfer += size;
        if (r.initiatorType === "script" || r.name.endsWith(".js")) jsSize += size;
        else if (r.initiatorType === "css" || r.name.endsWith(".css")) cssSize += size;
        else if (r.initiatorType === "img" || /\.(png|jpg|jpeg|gif|webp|svg|ico)/.test(r.name)) imageSize += size;
      });
      metrics.totalTransferSize = totalTransfer;
      metrics.jsSize = jsSize;
      metrics.cssSize = cssSize;
      metrics.imageSize = imageSize;

      setPerfMetrics(metrics);
    } catch (err) {
      console.error("Performance metrics error:", err);
    } finally {
      setPerfLoading(false);
    }
  }, [supabase]);

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

  // Collect perf metrics when switching to performance tab
  useEffect(() => {
    if (activeTab === "performance" && !perfMetrics && !perfLoading) {
      collectPerformanceMetrics();
    }
  }, [activeTab, perfMetrics, perfLoading, collectPerformanceMetrics]);

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

      {/* Tab Navigation — scrollable on mobile */}
      <div className="flex gap-2 border-b pb-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <Button
          variant={activeTab === "overview" ? "default" : "ghost"}
          size="sm"
          className="shrink-0"
          onClick={() => setActiveTab("overview")}
        >
          <Activity className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Overview</span>
        </Button>
        <Button
          variant={activeTab === "users" ? "default" : "ghost"}
          size="sm"
          className="shrink-0"
          onClick={() => setActiveTab("users")}
        >
          <Users className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Users</span>
        </Button>
        <Button
          variant={activeTab === "logs" ? "default" : "ghost"}
          size="sm"
          className="shrink-0"
          onClick={() => setActiveTab("logs")}
        >
          <Clock className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Audit Logs</span>
        </Button>
        <Button
          variant={activeTab === "performance" ? "default" : "ghost"}
          size="sm"
          className="shrink-0"
          onClick={() => setActiveTab("performance")}
        >
          <Gauge className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Performance</span>
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
        selectedUser ? (
          <AdminUserDetail
            userId={selectedUser.user_id}
            userEmail={selectedUser.email}
            username={selectedUser.username}
            supabase={supabase}
            onBack={() => setSelectedUser(null)}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">User Activity</CardTitle>
              <CardDescription>All registered users — click a user to view detailed analytics</CardDescription>
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
                        <th className="pb-2 font-medium text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {userActivity.map((ua) => (
                        <tr
                          key={ua.user_id}
                          className="border-b last:border-0 hover:bg-accent/50 cursor-pointer transition-colors"
                          onClick={() => setSelectedUser(ua)}
                        >
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
                          <td className="py-3 text-center">
                            <Eye className="h-4 w-4 text-muted-foreground" />
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
        )
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
      {/* Performance Tab */}
      {activeTab === "performance" && (
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">Real-time client-side performance metrics from your current session.</p>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 self-start sm:self-auto"
              onClick={() => { setPerfMetrics(null); collectPerformanceMetrics(); }}
              disabled={perfLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${perfLoading ? "animate-spin" : ""}`} />
              Re-measure
            </Button>
          </div>

          {perfLoading && (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {perfMetrics && (
            <>
              {/* Core Web Vitals */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Core Web Vitals & Page Load
                  </CardTitle>
                  <CardDescription>Key metrics that affect user experience</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <MetricCard
                      label="Page Load"
                      value={perfMetrics.pageLoadTime}
                      unit="ms"
                      thresholds={[2000, 4000]}
                    />
                    <MetricCard
                      label="DOM Content Loaded"
                      value={perfMetrics.domContentLoaded}
                      unit="ms"
                      thresholds={[1500, 3000]}
                    />
                    <MetricCard
                      label="First Contentful Paint"
                      value={perfMetrics.firstContentfulPaint}
                      unit="ms"
                      thresholds={[1800, 3000]}
                    />
                    <MetricCard
                      label="Largest Contentful Paint"
                      value={perfMetrics.largestContentfulPaint}
                      unit="ms"
                      thresholds={[2500, 4000]}
                    />
                    <MetricCard
                      label="Time to Interactive"
                      value={perfMetrics.timeToInteractive}
                      unit="ms"
                      thresholds={[3800, 7300]}
                    />
                    <MetricCard
                      label="API Latency (Supabase)"
                      value={perfMetrics.apiLatency}
                      unit="ms"
                      thresholds={[200, 500]}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Network & Connection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Wifi className="h-5 w-5 text-blue-500" />
                    Network & Connection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Connection Type</p>
                      <p className="text-sm font-medium">{perfMetrics.connectionType}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Effective Type</p>
                      <p className={`text-sm font-medium ${
                        perfMetrics.effectiveType === "4g" ? "text-green-600" :
                        perfMetrics.effectiveType === "3g" ? "text-yellow-600" : "text-red-600"
                      }`}>
                        {perfMetrics.effectiveType}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Downlink Speed</p>
                      <p className="text-sm font-medium">
                        {perfMetrics.downlink !== null ? `${perfMetrics.downlink} Mbps` : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Round-Trip Time</p>
                      <p className={`text-sm font-medium ${
                        perfMetrics.rtt !== null && perfMetrics.rtt > 300 ? "text-red-600" :
                        perfMetrics.rtt !== null && perfMetrics.rtt > 100 ? "text-yellow-600" : "text-green-600"
                      }`}>
                        {perfMetrics.rtt !== null ? `${perfMetrics.rtt} ms` : "N/A"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Device Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {perfMetrics.isMobile ? (
                      <Smartphone className="h-5 w-5 text-purple-500" />
                    ) : (
                      <Monitor className="h-5 w-5 text-purple-500" />
                    )}
                    Device Info
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Device Type</p>
                      <p className="text-sm font-medium">{perfMetrics.isMobile ? "Mobile" : "Desktop"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Screen</p>
                      <p className="text-sm font-medium">{perfMetrics.screenSize}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">CPU Cores</p>
                      <p className="text-sm font-medium">{perfMetrics.hardwareConcurrency}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Device Memory</p>
                      <p className="text-sm font-medium">
                        {perfMetrics.deviceMemory ? `${perfMetrics.deviceMemory} GB` : "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground">User Agent</p>
                    <p className="text-xs font-mono bg-muted p-2 rounded mt-1 break-all">
                      {perfMetrics.userAgent}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Resource Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5 text-cyan-500" />
                    Resource Breakdown
                  </CardTitle>
                  <CardDescription>Network resources loaded for this page</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Resources</p>
                      <p className="text-lg font-bold">{perfMetrics.totalResources}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Transfer</p>
                      <p className="text-lg font-bold">{formatBytes(perfMetrics.totalTransferSize)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">JavaScript</p>
                      <p className="text-lg font-bold text-yellow-600">{formatBytes(perfMetrics.jsSize)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">CSS</p>
                      <p className="text-lg font-bold text-blue-600">{formatBytes(perfMetrics.cssSize)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Images</p>
                      <p className="text-lg font-bold text-green-600">{formatBytes(perfMetrics.imageSize)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}

// Helper: format bytes to human-readable
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

// Helper: metric card with color-coded thresholds
function MetricCard({
  label,
  value,
  unit,
  thresholds,
}: {
  label: string;
  value: number | null;
  unit: string;
  thresholds: [number, number]; // [good, moderate] — above moderate = slow
}) {
  if (value === null) {
    return (
      <div className="rounded-lg border p-3">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold text-muted-foreground">N/A</p>
      </div>
    );
  }

  const status = value <= thresholds[0] ? "good" : value <= thresholds[1] ? "moderate" : "slow";
  const colorClass = status === "good" ? "text-green-600" : status === "moderate" ? "text-yellow-600" : "text-red-600";
  const Icon = status === "good" ? CheckCircle2 : status === "moderate" ? AlertTriangle : AlertTriangle;

  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2 mt-1">
        <Icon className={`h-4 w-4 ${colorClass}`} />
        <p className={`text-lg font-bold ${colorClass}`}>
          {value.toLocaleString()} <span className="text-xs font-normal">{unit}</span>
        </p>
      </div>
      <p className={`text-xs mt-0.5 ${colorClass}`}>
        {status === "good" ? "Good" : status === "moderate" ? "Needs improvement" : "Poor"}
      </p>
    </div>
  );
}
