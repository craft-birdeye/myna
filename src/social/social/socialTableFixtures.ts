export type SocialApprovalWorkflowRow = {
  id: string;
  name: string;
  status: "Enabled" | "Disabled";
  lastUpdated: string;
  updatedBy: string;
};

export type SocialReportRow = {
  id: string;
  channel: string;
  postsPublished: number;
  engagementRate: number;
  responseRate: number;
  avgResponseMins: number;
  lastUpdated: string;
};

function seeded(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rand: () => number, list: readonly T[]): T {
  return list[Math.floor(rand() * list.length)] as T;
}

const WORKFLOW_NAMES = [
  "Compliance check",
  "Manager review",
  "Team lead sign-off",
  "Regional sign-off",
  "Local manager approval",
  "Brand and legal approval",
  "Promotion validation",
  "Policy escalation",
] as const;

const REVIEWERS = [
  "Emma",
  "Samuel",
  "James",
  "Ethan",
  "Evelyn",
  "Ava",
  "Noah",
  "Mia",
  "Liam",
] as const;

export function buildApprovalWorkflowRows(seedValue = 42, count = 18): SocialApprovalWorkflowRow[] {
  const rand = seeded(seedValue);
  const now = new Date("2026-03-14T10:00:00Z").getTime();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now - Math.floor(rand() * 1000 * 60 * 60 * 24 * 45));
    const status: SocialApprovalWorkflowRow["status"] = rand() > 0.35 ? "Enabled" : "Disabled";
    return {
      id: `wf-${index + 1}`,
      name: `${pick(rand, WORKFLOW_NAMES)} ${index > 7 ? `#${index - 7}` : ""}`.trim(),
      status,
      lastUpdated: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      updatedBy: pick(rand, REVIEWERS),
    };
  });
}

const CHANNELS = [
  "Facebook",
  "Instagram",
  "LinkedIn",
  "Google Business",
  "X",
] as const;

export function buildReportRows(seedValue = 7, count = 26): SocialReportRow[] {
  const rand = seeded(seedValue);
  const now = new Date("2026-03-14T10:00:00Z").getTime();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now - Math.floor(rand() * 1000 * 60 * 60 * 24 * 30));
    const postsPublished = 12 + Math.floor(rand() * 140);
    const responseRate = 45 + Math.floor(rand() * 54);
    return {
      id: `sr-${index + 1}`,
      channel: pick(rand, CHANNELS),
      postsPublished,
      engagementRate: Number((0.8 + rand() * 5.1).toFixed(1)),
      responseRate,
      avgResponseMins: 8 + Math.floor(rand() * 190),
      lastUpdated: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };
  });
}
