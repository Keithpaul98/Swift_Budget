import { createClient } from "@/lib/supabase";

// Collects and reports client-side performance metrics to Supabase.
// Called once per page load after the page has fully loaded.
// Debounced to avoid duplicate reports on the same page.

let reported = false;

export async function reportPerformanceMetrics(userId: string) {
  if (reported) return;
  if (typeof window === "undefined" || !window.performance) return;

  // Wait for page to fully settle
  await new Promise((resolve) => setTimeout(resolve, 3000));

  reported = true;

  try {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (!nav) return;

    const pageLoadTime = Math.round(nav.loadEventEnd - nav.startTime);
    const domContentLoaded = Math.round(nav.domContentLoadedEventEnd - nav.startTime);
    const timeToInteractive = Math.round(nav.domInteractive - nav.startTime);

    // First Contentful Paint
    let fcp: number | null = null;
    const paintEntries = performance.getEntriesByType("paint");
    const fcpEntry = paintEntries.find((e) => e.name === "first-contentful-paint");
    if (fcpEntry) fcp = Math.round(fcpEntry.startTime);

    // Largest Contentful Paint
    let lcp: number | null = null;
    try {
      const lcpEntries = performance.getEntriesByType("largest-contentful-paint");
      if (lcpEntries.length > 0) {
        lcp = Math.round(lcpEntries[lcpEntries.length - 1].startTime);
      }
    } catch {
      // LCP not supported in all browsers
    }

    // API latency benchmark
    let apiLatency: number | null = null;
    try {
      const supabase = createClient();
      const start = performance.now();
      await supabase.from("categories").select("id").limit(1);
      apiLatency = Math.round(performance.now() - start);
    } catch {
      // Ignore
    }

    // Connection info
    const conn = (navigator as unknown as { connection?: { type?: string; effectiveType?: string; downlink?: number; rtt?: number } }).connection;
    const connectionType = conn?.type || "unknown";
    const effectiveType = conn?.effectiveType || "unknown";
    const downlink = conn?.downlink ?? null;
    const rtt = conn?.rtt ?? null;

    // Device info
    const deviceMemory = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? null;
    const hardwareConcurrency = navigator.hardwareConcurrency || 0;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const screenSize = `${window.screen.width}x${window.screen.height}`;

    // Resource breakdown
    const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    let totalTransferSize = 0;
    let jsSize = 0;
    let cssSize = 0;
    let imageSize = 0;
    resources.forEach((r) => {
      totalTransferSize += r.transferSize || 0;
      if (r.initiatorType === "script" || r.name.match(/\.js/)) jsSize += r.transferSize || 0;
      if (r.initiatorType === "css" || r.name.match(/\.css/)) cssSize += r.transferSize || 0;
      if (r.initiatorType === "img" || r.name.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)/)) imageSize += r.transferSize || 0;
    });

    const supabase = createClient();
    await supabase.from("user_performance_logs").insert({
      user_id: userId,
      page_url: window.location.pathname,
      page_load_time: pageLoadTime,
      dom_content_loaded: domContentLoaded,
      first_contentful_paint: fcp,
      largest_contentful_paint: lcp,
      time_to_interactive: timeToInteractive,
      api_latency: apiLatency,
      connection_type: connectionType,
      effective_type: effectiveType,
      downlink,
      rtt,
      device_memory: deviceMemory,
      hardware_concurrency: hardwareConcurrency,
      is_mobile: isMobile,
      screen_size: screenSize,
      user_agent: navigator.userAgent,
      total_resources: resources.length,
      total_transfer_size: totalTransferSize,
      js_size: jsSize,
      css_size: cssSize,
      image_size: imageSize,
    });
  } catch (err) {
    // Silent fail — don't affect user experience
    console.debug("Performance report failed:", err);
  }
}

// Reset for SPA navigation
export function resetPerformanceReporter() {
  reported = false;
}
