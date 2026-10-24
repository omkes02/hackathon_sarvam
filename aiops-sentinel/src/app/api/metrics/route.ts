// API Route: GET /api/metrics — System metrics & time series
import { NextResponse } from "next/server";
import { generateMetrics, generateMetricsTimeSeries } from "@/lib/mock-data";

export async function GET() {
  const current = generateMetrics();
  const timeSeries = generateMetricsTimeSeries(24);

  // Calculate aggregate health score
  const avgCpu = current.reduce((s, m) => s + m.cpu, 0) / current.length;
  const avgMemory = current.reduce((s, m) => s + m.memory, 0) / current.length;
  const avgErrorRate = current.reduce((s, m) => s + m.errorRate, 0) / current.length;
  const healthScore = Math.max(0, Math.round(100 - avgCpu * 0.3 - avgMemory * 0.2 - avgErrorRate * 5));

  return NextResponse.json({
    current,
    timeSeries,
    aggregate: {
      healthScore,
      avgCpu: Math.round(avgCpu * 10) / 10,
      avgMemory: Math.round(avgMemory * 10) / 10,
      avgErrorRate: Math.round(avgErrorRate * 100) / 100,
      totalRequests: current.reduce((s, m) => s + m.requestsPerSec, 0),
      serviceCount: current.length,
    },
  });
}
