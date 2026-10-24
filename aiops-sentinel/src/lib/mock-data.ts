// Mock data generators for infrastructure monitoring
export interface LogEntry {
  id: string;
  timestamp: string;
  service: string;
  level: "ERROR" | "WARN" | "INFO" | "DEBUG" | "FATAL";
  message: string;
  traceId: string;
  stackTrace?: string;
  metadata: Record<string, string>;
}

export interface Metric {
  service: string;
  cpu: number;
  memory: number;
  latency: number;
  errorRate: number;
  requestsPerSec: number;
  timestamp: string;
}

export interface Alert {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  service: string;
  timestamp: string;
  status: "firing" | "resolved" | "acknowledged";
  description: string;
  fingerprint: string;
}

export interface Trace {
  traceId: string;
  spans: {
    spanId: string;
    service: string;
    operation: string;
    duration: number;
    status: "OK" | "ERROR";
    startTime: string;
  }[];
}

export interface Incident {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "detected" | "triaging" | "remediating" | "resolved" | "regressed";
  detectedAt: string;
  services: string[];
  errorCount: number;
  sessionsAffected: number;
  fingerprint: string;
  rootCause?: string;
  remediation?: string;
  translatedAlert?: string;
  audioAlert?: string | null;
  relatedLogs: LogEntry[];
  relatedAlerts: Alert[];
  relatedTraces: Trace[];
  timeline: { time: string; event: string; agent: string }[];
}

const SERVICES = [
  "api-gateway",
  "auth-service",
  "payment-service",
  "user-service",
  "notification-service",
  "order-service",
  "inventory-service",
  "search-service",
];

const ERROR_MESSAGES = [
  { msg: "ECONNREFUSED: Connection refused to database pool", service: "payment-service", fatal: true },
  { msg: "TypeError: Cannot read properties of undefined (reading 'userId')", service: "auth-service", fatal: true },
  { msg: "TimeoutError: Request timed out after 30000ms", service: "api-gateway", fatal: false },
  { msg: "ENOMEM: JavaScript heap out of memory", service: "order-service", fatal: true },
  { msg: "MongoServerError: E11000 duplicate key error", service: "user-service", fatal: false },
  { msg: "CORS policy: No 'Access-Control-Allow-Origin' header present", service: "api-gateway", fatal: false },
  { msg: "JWT malformed: invalid token signature", service: "auth-service", fatal: true },
  { msg: "Redis connection to 10.0.3.42:6379 failed - ETIMEDOUT", service: "notification-service", fatal: true },
  { msg: "RangeError: Maximum call stack size exceeded", service: "search-service", fatal: true },
  { msg: "FATAL: Kubernetes pod OOMKilled - container exceeded memory limit", service: "inventory-service", fatal: true },
];

const STACK_TRACES: Record<string, string> = {
  "payment-service": `    at Pool.connect (node_modules/pg-pool/index.js:45:11)
    at PaymentProcessor.processCharge (/src/services/payment.ts:127:22)
    at OrderController.checkout (/src/controllers/order.ts:89:15)
    at Layer.handle (/node_modules/express/lib/router/layer.js:95:5)`,
  "auth-service": `    at AuthMiddleware.verify (/src/middleware/auth.ts:43:18)
    at TokenService.decode (/src/services/token.ts:67:12)
    at SessionManager.validate (/src/services/session.ts:31:9)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)`,
  "api-gateway": `    at ClientRequest.<anonymous> (/src/proxy/upstream.ts:112:7)
    at GatewayRouter.forward (/src/router/gateway.ts:89:14)
    at RateLimiter.check (/src/middleware/rateLimit.ts:45:11)`,
  "order-service": `    at OrderAggregator.buildReport (/src/aggregators/order.ts:234:5)
    at ReportGenerator.generate (/src/services/report.ts:56:18)
    at CronJob.execute (/src/jobs/dailyReport.ts:12:9)`,
};

let counter = 0;
function uid() { return `${Date.now()}-${++counter}`; }

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateLogs(count: number = 20): LogEntry[] {
  const logs: LogEntry[] = [];
  for (let i = 0; i < count; i++) {
    const error = randomFrom(ERROR_MESSAGES);
    const level = error.fatal
      ? randomFrom(["ERROR", "FATAL"] as const)
      : randomFrom(["WARN", "ERROR"] as const);
    logs.push({
      id: uid(),
      timestamp: new Date(Date.now() - randomBetween(0, 3600000)).toISOString(),
      service: error.service,
      level,
      message: error.msg,
      traceId: `trace-${uid()}`,
      stackTrace: STACK_TRACES[error.service],
      metadata: {
        host: `k8s-node-${randomBetween(1, 8)}`,
        pod: `${error.service}-${randomBetween(1000, 9999)}`,
        region: randomFrom(["us-east-1", "eu-west-1", "ap-south-1"]),
      },
    });
  }
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function generateMetrics(): Metric[] {
  return SERVICES.map((service) => ({
    service,
    cpu: Math.round((20 + Math.random() * 70) * 10) / 10,
    memory: Math.round((30 + Math.random() * 60) * 10) / 10,
    latency: Math.round(50 + Math.random() * 950),
    errorRate: Math.round(Math.random() * 15 * 100) / 100,
    requestsPerSec: Math.round(100 + Math.random() * 4900),
    timestamp: new Date().toISOString(),
  }));
}

export function generateAlerts(count: number = 8): Alert[] {
  const alerts: Alert[] = [];
  const titles = [
    "High Error Rate Detected",
    "CPU Usage Exceeding 90%",
    "Memory Leak Suspected",
    "Database Connection Pool Exhausted",
    "Latency SLA Breach",
    "Pod CrashLoopBackOff",
    "SSL Certificate Expiring",
    "Disk Usage Critical",
    "Upstream Service Unreachable",
    "Rate Limit Threshold Exceeded",
  ];
  for (let i = 0; i < count; i++) {
    const svc = randomFrom(SERVICES);
    alerts.push({
      id: uid(),
      title: randomFrom(titles),
      severity: randomFrom(["critical", "high", "medium", "low"]),
      service: svc,
      timestamp: new Date(Date.now() - randomBetween(0, 7200000)).toISOString(),
      status: randomFrom(["firing", "resolved", "acknowledged"]),
      description: `Anomaly detected in ${svc}: ${randomFrom(titles).toLowerCase()}`,
      fingerprint: `fp-${svc}-${randomBetween(100, 999)}`,
    });
  }
  return alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function generateTraces(count: number = 5): Trace[] {
  const traces: Trace[] = [];
  for (let i = 0; i < count; i++) {
    const traceId = `trace-${uid()}`;
    const numSpans = randomBetween(3, 6);
    const spans = [];
    for (let j = 0; j < numSpans; j++) {
      const svc = SERVICES[j % SERVICES.length];
      spans.push({
        spanId: `span-${uid()}`,
        service: svc,
        operation: randomFrom(["GET /api/v1/users", "POST /api/v1/orders", "PUT /api/v1/payments", "GET /health", "POST /auth/login"]),
        duration: randomBetween(5, 2000),
        status: Math.random() > 0.7 ? "ERROR" as const : "OK" as const,
        startTime: new Date(Date.now() - randomBetween(0, 60000)).toISOString(),
      });
    }
    traces.push({ traceId, spans });
  }
  return traces;
}

export function generateIncidents(): Incident[] {
  const logs = generateLogs(30);
  const alerts = generateAlerts(10);
  const traces = generateTraces(8);

  const incidents: Incident[] = [
    {
      id: uid(),
      title: "Database Connection Pool Exhausted - Payment Service",
      severity: "critical",
      status: "detected",
      detectedAt: new Date(Date.now() - 300000).toISOString(),
      services: ["payment-service", "order-service"],
      errorCount: 1247,
      sessionsAffected: 8934,
      fingerprint: "fp-payment-db-001",
      relatedLogs: logs.filter((l) => l.service === "payment-service").slice(0, 5),
      relatedAlerts: alerts.filter((a) => a.severity === "critical").slice(0, 3),
      relatedTraces: traces.slice(0, 2),
      timeline: [
        { time: new Date(Date.now() - 300000).toISOString(), event: "Error spike detected (1247 errors/5min)", agent: "Sweep Agent" },
        { time: new Date(Date.now() - 280000).toISOString(), event: "Fingerprinted: ECONNREFUSED on pg-pool", agent: "Sweep Agent" },
        { time: new Date(Date.now() - 260000).toISOString(), event: "Correlated with 3 firing alerts", agent: "Triage Agent" },
      ],
    },
    {
      id: uid(),
      title: "Auth Token Validation Failure - JWT Malformed",
      severity: "high",
      status: "triaging",
      detectedAt: new Date(Date.now() - 600000).toISOString(),
      services: ["auth-service", "api-gateway"],
      errorCount: 523,
      sessionsAffected: 3421,
      fingerprint: "fp-auth-jwt-002",
      rootCause: "JWT secret rotation caused mismatch between auth-service v2.3.1 and api-gateway v2.2.9. The auth-service was deployed with new RS256 keys but api-gateway still references the old HS256 secret.",
      relatedLogs: logs.filter((l) => l.service === "auth-service").slice(0, 4),
      relatedAlerts: alerts.filter((a) => a.severity === "high").slice(0, 2),
      relatedTraces: traces.slice(2, 4),
      timeline: [
        { time: new Date(Date.now() - 600000).toISOString(), event: "JWT errors spiking across auth-service", agent: "Sweep Agent" },
        { time: new Date(Date.now() - 580000).toISOString(), event: "Root cause identified: JWT secret rotation mismatch", agent: "Triage Agent" },
        { time: new Date(Date.now() - 550000).toISOString(), event: "Suspect file: /src/services/token.ts line 67", agent: "Triage Agent" },
        { time: new Date(Date.now() - 520000).toISOString(), event: "Remediation in progress...", agent: "Remediation Agent" },
      ],
    },
    {
      id: uid(),
      title: "Memory Leak in Order Service - OOMKilled",
      severity: "critical",
      status: "remediating",
      detectedAt: new Date(Date.now() - 1200000).toISOString(),
      services: ["order-service", "inventory-service"],
      errorCount: 89,
      sessionsAffected: 1567,
      fingerprint: "fp-order-oom-003",
      rootCause: "Unbounded array growth in OrderAggregator.buildReport() - daily report job accumulates all orders in memory without pagination. Container hit 2Gi limit after processing ~50K orders.",
      remediation: "1. Add pagination to OrderAggregator.buildReport() with 1000-record batches\n2. Increase memory limit to 4Gi as temporary fix\n3. Add memory usage monitoring with auto-restart threshold\n4. Implement streaming aggregation for large datasets",
      relatedLogs: logs.filter((l) => l.service === "order-service").slice(0, 3),
      relatedAlerts: alerts.slice(0, 2),
      relatedTraces: traces.slice(4, 6),
      timeline: [
        { time: new Date(Date.now() - 1200000).toISOString(), event: "OOMKilled events detected on order-service pods", agent: "Sweep Agent" },
        { time: new Date(Date.now() - 1150000).toISOString(), event: "Fingerprinted: heap out of memory in OrderAggregator", agent: "Sweep Agent" },
        { time: new Date(Date.now() - 1100000).toISOString(), event: "Root cause: unbounded array in buildReport()", agent: "Triage Agent" },
        { time: new Date(Date.now() - 1050000).toISOString(), event: "Code fix generated: pagination + streaming", agent: "Remediation Agent" },
        { time: new Date(Date.now() - 1000000).toISOString(), event: "Fix validated in sandbox environment", agent: "Validation Agent" },
      ],
    },
    {
      id: uid(),
      title: "Redis Connection Timeout - Notification Service",
      severity: "medium",
      status: "resolved",
      detectedAt: new Date(Date.now() - 3600000).toISOString(),
      services: ["notification-service"],
      errorCount: 342,
      sessionsAffected: 2100,
      fingerprint: "fp-notif-redis-004",
      rootCause: "Redis sentinel failover caused 45s connection timeout. Primary node crashed, sentinel promoted replica but notification-service connection pool held stale connections.",
      remediation: "1. Configure Redis client with sentinel support and automatic reconnection\n2. Set connection timeout to 5s with retry backoff\n3. Add health check endpoint that validates Redis connectivity\n4. Implement circuit breaker pattern for Redis operations",
      relatedLogs: logs.filter((l) => l.service === "notification-service").slice(0, 3),
      relatedAlerts: alerts.filter((a) => a.status === "resolved").slice(0, 2),
      relatedTraces: traces.slice(6, 8),
      timeline: [
        { time: new Date(Date.now() - 3600000).toISOString(), event: "ETIMEDOUT errors from Redis detected", agent: "Sweep Agent" },
        { time: new Date(Date.now() - 3500000).toISOString(), event: "Root cause: Redis sentinel failover", agent: "Triage Agent" },
        { time: new Date(Date.now() - 3400000).toISOString(), event: "Fix: sentinel config + circuit breaker", agent: "Remediation Agent" },
        { time: new Date(Date.now() - 3300000).toISOString(), event: "PR merged, monitoring post-deploy", agent: "Validation Agent" },
        { time: new Date(Date.now() - 3200000).toISOString(), event: "Error rate back to 0% — resolved", agent: "Validation Agent" },
      ],
    },
  ];

  return incidents;
}

export function generateMetricsTimeSeries(points: number = 24): { time: string; cpu: number; memory: number; latency: number; errorRate: number }[] {
  const data = [];
  for (let i = points; i >= 0; i--) {
    const t = new Date(Date.now() - i * 3600000);
    const spike = i < 5 ? Math.random() * 30 : 0;
    data.push({
      time: t.toISOString(),
      cpu: Math.round((35 + Math.random() * 25 + spike) * 10) / 10,
      memory: Math.round((45 + Math.random() * 20 + spike * 0.5) * 10) / 10,
      latency: Math.round(120 + Math.random() * 200 + spike * 15),
      errorRate: Math.round((0.5 + Math.random() * 2 + spike * 0.3) * 100) / 100,
    });
  }
  return data;
}
