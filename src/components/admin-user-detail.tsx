"use client";

import { useState, useEffect, useCallback } from "react";
import { formatCurrency } from "@/types/database";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Activity,
  Gauge,
  Clock,
  KeyRound,
  Wifi,
  Smartphone,
  Monitor,
  Zap,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  LogIn,
  LogOut,
  UserPlus,
} from "lucide-react";
import { format } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";

interface UserDetailProps {
  userId: string;
  userEmail: string;
  username: string | null;
  supabase: SupabaseClient;
  onBack: () => void;
}

interface PerfLog {
  id: number;
  page_url: string;
  page_load_time: number | null;
  dom_content_loaded: number | null;
  first_contentful_paint: number | null;
  largest_contentful_paint: number | null;
  time_to_interactive: number | null;
  api_latency: number | null;
  connection_type: string;
  effective_type: string;
  downlink: number | null;
  rtt: number | null;
  device_memory: number | null;
  hardware_concurrency: number;
  is_mobile: boolean;
  screen_size: string;
  user_agent: string;
  total_resources: number;
  total_transfer_size: number;
  js_size: number;
  css_size: number;
  image_size: number;
  created_at: string;
}

interface AuthEvent {
  id: number;
  event_type: string;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface UserAuditLog {
  id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  created_at: string;
}

const EVENT_ICONS: Record<string, typeof LogIn> = {
  login: LogIn,
  logout: LogOut,
  signup: UserPlus,
  password_reset: KeyRound,
  password_change: KeyRound,
};

const EVENT_COLORS: Record<string, string> = {
  login: "text-green-600",
  logout: "text-muted-foreground",
  signup: "text-blue-600",
  password_reset: "text-yellow-600",
  password_change: "text-yellow-600",
};

export default function AdminUserDetail({ userId, userEmail, username, supabase, onBack }: UserDetailProps) {
  const [activeTab, setActiveTab] = useState<"performance" | "logs" | "auth">("performance");
  const [perfLogs, setPerfLogs] = useState<PerfLog[]>([]);
  const [authEvents, setAuthEvents] = useState<AuthEvent[]>([]);
  const [auditLogs, setAuditLogs] = useState<UserAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPerf, setSelectedPerf] = useState<PerfLog | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [perfResult, authResult, logsResult] = await Promise.all([
        supabase.rpc("admin_get_user_performance", { target_user_id: userId, log_limit: 30 }),
        supabase.rpc("admin_get_user_auth_events", { target_user_id: userId, log_limit: 50 }),
        supabase.rpc("admin_get_user_audit_logs", { target_user_id: userId, log_limit: 50 }),
      ]);

      setPerfLogs(perfResult.data || []);
      setAuthEvents(authResult.data || []);
      setAuditLogs(logsResult.data || []);
    } catch (err) {
      console.error("Error loading user detail:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-lg font-bold">{username || userEmail}</h2>
          <p className="text-xs text-muted-foreground">{userEmail}</p>
        </div>
        <Button variant="outline" size="sm" className="ml-auto shrink-0" onClick={loadData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <Button
          variant={activeTab === "performance" ? "default" : "ghost"}
          size="sm"
          className="shrink-0"
          onClick={() => setActiveTab("performance")}
        >
          <Gauge className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Performance</span>
        </Button>
        <Button
          variant={activeTab === "logs" ? "default" : "ghost"}
          size="sm"
          className="shrink-0"
          onClick={() => setActiveTab("logs")}
        >
          <Clock className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Activity Logs</span>
        </Button>
        <Button
          variant={activeTab === "auth" ? "default" : "ghost"}
          size="sm"
          className="shrink-0"
          onClick={() => setActiveTab("auth")}
        >
          <KeyRound className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Auth Events</span>
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Performance Tab */}
      {!loading && activeTab === "performance" && (
        <>
          {perfLogs.length > 0 ? (
            <>
              {/* Performance summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <SummaryCard
                  label="Avg Page Load"
                  value={Math.round(perfLogs.reduce((s, p) => s + (p.page_load_time || 0), 0) / perfLogs.length)}
                  unit="ms"
                  thresholds={[2000, 4000]}
                />
                <SummaryCard
                  label="Avg FCP"
                  value={Math.round(perfLogs.filter(p => p.first_contentful_paint).reduce((s, p) => s + (p.first_contentful_paint || 0), 0) / (perfLogs.filter(p => p.first_contentful_paint).length || 1))}
                  unit="ms"
                  thresholds={[1800, 3000]}
                />
                <SummaryCard
                  label="Avg API Latency"
                  value={Math.round(perfLogs.filter(p => p.api_latency).reduce((s, p) => s + (p.api_latency || 0), 0) / (perfLogs.filter(p => p.api_latency).length || 1))}
                  unit="ms"
                  thresholds={[200, 500]}
                />
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Snapshots</p>
                  <p className="text-lg font-bold">{perfLogs.length}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {perfLogs.filter(p => p.is_mobile).length} mobile / {perfLogs.filter(p => !p.is_mobile).length} desktop
                  </p>
                </div>
              </div>

              {/* Performance history list */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Performance History</CardTitle>
                  <CardDescription>Click a snapshot for full details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {perfLogs.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPerf(selectedPerf?.id === p.id ? null : p)}
                        className="w-full text-left rounded-lg border p-3 hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {p.is_mobile ? (
                              <Smartphone className="h-4 w-4 shrink-0 text-purple-500" />
                            ) : (
                              <Monitor className="h-4 w-4 shrink-0 text-purple-500" />
                            )}
                            <span className="text-sm font-medium truncate">{p.page_url}</span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <PerfBadge value={p.page_load_time} thresholds={[2000, 4000]} label="Load" />
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(p.created_at), "MMM d, h:mm a")}
                            </span>
                          </div>
                        </div>

                        {/* Expanded detail */}
                        {selectedPerf?.id === p.id && (
                          <div className="mt-3 pt-3 border-t space-y-3" onClick={(e) => e.stopPropagation()}>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              <MetricItem label="Page Load" value={p.page_load_time} unit="ms" thresholds={[2000, 4000]} />
                              <MetricItem label="DOM Loaded" value={p.dom_content_loaded} unit="ms" thresholds={[1500, 3000]} />
                              <MetricItem label="FCP" value={p.first_contentful_paint} unit="ms" thresholds={[1800, 3000]} />
                              <MetricItem label="LCP" value={p.largest_contentful_paint} unit="ms" thresholds={[2500, 4000]} />
                              <MetricItem label="TTI" value={p.time_to_interactive} unit="ms" thresholds={[3800, 7300]} />
                              <MetricItem label="API Latency" value={p.api_latency} unit="ms" thresholds={[200, 500]} />
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                              <div>
                                <p className="text-muted-foreground">Connection</p>
                                <p className="font-medium">{p.effective_type} ({p.connection_type})</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">RTT</p>
                                <p className="font-medium">{p.rtt != null ? `${p.rtt} ms` : "N/A"}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Screen</p>
                                <p className="font-medium">{p.screen_size}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Resources</p>
                                <p className="font-medium">{p.total_resources} ({formatBytes(p.total_transfer_size)})</p>
                              </div>
                            </div>

                            <div className="text-xs">
                              <p className="text-muted-foreground">User Agent</p>
                              <p className="font-mono bg-muted p-1.5 rounded mt-1 break-all">{p.user_agent}</p>
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Gauge className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">No performance data recorded yet for this user.</p>
                <p className="text-xs text-muted-foreground mt-1">Data is collected automatically when the user navigates the app.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Activity Logs Tab */}
      {!loading && activeTab === "logs" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity Logs</CardTitle>
            <CardDescription>Transaction and entity changes</CardDescription>
          </CardHeader>
          <CardContent>
            {auditLogs.length > 0 ? (
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 border-b pb-3 last:border-0 last:pb-0">
                    <div className={`rounded-full p-1.5 shrink-0 ${
                      log.action === "create" ? "bg-green-100 text-green-600" :
                      log.action === "update" ? "bg-blue-100 text-blue-600" :
                      "bg-red-100 text-red-600"
                    }`}>
                      <Activity className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-medium capitalize">{log.action}</span>{" "}
                        <span className="text-muted-foreground">{log.entity_type}</span>{" "}
                        <span className="text-xs text-muted-foreground">#{log.entity_id}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                      {log.new_values && (
                        <pre className="mt-1 text-xs bg-muted p-1.5 rounded overflow-x-auto max-h-20">
                          {JSON.stringify(log.new_values, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No activity logs for this user.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Auth Events Tab */}
      {!loading && activeTab === "auth" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Authentication Events</CardTitle>
            <CardDescription>Logins, logouts, password resets, and signups</CardDescription>
          </CardHeader>
          <CardContent>
            {authEvents.length > 0 ? (
              <div className="space-y-3">
                {authEvents.map((event) => {
                  const Icon = EVENT_ICONS[event.event_type] || Activity;
                  const colorClass = EVENT_COLORS[event.event_type] || "text-muted-foreground";
                  return (
                    <div key={event.id} className="flex items-start gap-3 border-b pb-3 last:border-0 last:pb-0">
                      <div className={`rounded-full p-1.5 shrink-0 bg-muted ${colorClass}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium capitalize">
                          {event.event_type.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(event.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                        {event.user_agent && (
                          <p className="text-xs text-muted-foreground mt-1 truncate max-w-full">
                            {event.user_agent.includes("Mobile") ? "📱 Mobile" : "🖥️ Desktop"}{" — "}
                            {event.user_agent.match(/Chrome\/[\d.]+|Firefox\/[\d.]+|Safari\/[\d.]+/)?.[0] || "Unknown browser"}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No auth events recorded yet.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper components
function SummaryCard({ label, value, unit, thresholds }: { label: string; value: number; unit: string; thresholds: [number, number] }) {
  const status = value <= thresholds[0] ? "good" : value <= thresholds[1] ? "moderate" : "slow";
  const colorClass = status === "good" ? "text-green-600" : status === "moderate" ? "text-yellow-600" : "text-red-600";
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold ${colorClass}`}>
        {value.toLocaleString()} <span className="text-xs font-normal">{unit}</span>
      </p>
    </div>
  );
}

function MetricItem({ label, value, unit, thresholds }: { label: string; value: number | null; unit: string; thresholds: [number, number] }) {
  if (value == null) return (
    <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-medium text-muted-foreground">N/A</p></div>
  );
  const status = value <= thresholds[0] ? "good" : value <= thresholds[1] ? "moderate" : "slow";
  const colorClass = status === "good" ? "text-green-600" : status === "moderate" ? "text-yellow-600" : "text-red-600";
  const Icon = status === "good" ? CheckCircle2 : AlertTriangle;
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${colorClass}`} />
        <p className={`text-sm font-medium ${colorClass}`}>{value.toLocaleString()} {unit}</p>
      </div>
    </div>
  );
}

function PerfBadge({ value, thresholds, label }: { value: number | null; thresholds: [number, number]; label: string }) {
  if (value == null) return null;
  const status = value <= thresholds[0] ? "good" : value <= thresholds[1] ? "moderate" : "slow";
  const bgClass = status === "good" ? "bg-green-100 text-green-700" : status === "moderate" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700";
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded ${bgClass}`}>
      {label}: {(value / 1000).toFixed(1)}s
    </span>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
