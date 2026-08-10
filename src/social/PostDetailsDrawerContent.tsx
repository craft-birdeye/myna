import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MoreVertical,
  Sparkles,
  XCircle,
} from "lucide-react";
import { APPROVAL_DATA, type ApprovalLocation } from "./data/approvalData";
import { POST_DATA, StatusType, type PostPage } from "./data/postData";
import { FacebookIcon, InstagramIcon, LinkedInIcon } from "./PlatformIcons";
import { ActivityFeed } from "./ActivityFeed";

interface PostDetailsDrawerContentProps {
  postId: string;
  onClose: () => void;
  /** Prev/next navigation */
  postIndex?: number;
  postTotal?: number;
  hasPrev?: boolean;
  hasNext?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
}

type Platform = "facebook" | "instagram" | "linkedin";
type ActiveTab = "overview" | "activity";

const RV = { } as const;

const statusConfig: Record<StatusType, { bg: string; color: string; label: string }> = {
  published:      { bg: "#edf8ef", color: "#2f7d32",  label: "Published" },
  draft:          { bg: "#eef1f5", color: "#4f5d75",  label: "Draft" },
  rejected:       { bg: "#fff1f0", color: "#d14334",  label: "Rejected" },
  awaiting:       { bg: "#fff4da", color: "#b67a00",  label: "Awaiting approval" },
  scheduled:      { bg: "#ebf4ff", color: "#1565b4",  label: "Scheduled" },
  "ai-suggested": { bg: "#f3ecff", color: "#6b36b7",  label: "AI Suggested" },
  expired:        { bg: "#eef1f5", color: "#6b7280",  label: "Expired" },
};

const platformMeta: Record<Platform, { label: string; color: string }> = {
  facebook:  { label: "Facebook",  color: "#1877F2" },
  instagram: { label: "Instagram", color: "#E1306C" },
  linkedin:  { label: "LinkedIn",  color: "#0A66C2" },
};

const publishedInsights: Record<string, {
  impressions: string; reach: string; likes: string;
  comments: string; shares: string; engagementRate: string;
  recommendation: string; predictedPerformance: string; goal: string;
}> = {
  "post-1": {
    impressions: "18.4K", reach: "12.7K", likes: "428",
    comments: "36", shares: "54", engagementRate: "4.1%",
    recommendation: "Boost this post",
    predictedPerformance: "Likely to stay above your median reach for another 48 hours. Strong candidate for paid amplification.",
    goal: "Reach",
  },
};

const aiSuggestionInsights: Record<string, {
  reason: string; benefit: string; useCase: string;
  engagementUplift: string; reachEstimate: string; confidence: string;
}> = {
  "post-6": {
    reason: "High-confidence match for educational mortgage content that performs well across all three channels. Sweat equity themes have driven 2× saves vs. your portfolio average over the past 30 days.",
    benefit: "Expected to outperform the median awareness post by 22% based on recent audience behavior.",
    useCase: "Engagement",
    engagementUplift: "+22%",
    reachEstimate: "8.4K–12K",
    confidence: "High",
  },
  "post-8": {
    reason: "Strong fit for first-time homebuyer audiences responding to motivational guidance and consultation CTAs. Similar posts in New York drove a 3× spike in profile visits last quarter.",
    benefit: "Predicted to generate higher saves and profile visits than the last three comparable drafts.",
    useCase: "Reach",
    engagementUplift: "+18%",
    reachEstimate: "6.2K–9K",
    confidence: "Medium",
  },
};

const postCreators: Record<string, string> = {
  "post-1": "Mark Johnson",
  "post-2": "Sarah Chen",
  "post-3": "Alex Rivera",
  "post-4": "Mark Johnson",
  "post-5": "Jordan Davis",
  "post-6": "Sarah Chen",
  "post-7": "Alex Rivera",
  "post-8": "Jordan Davis",
};

// ─── UI Primitives ────────────────────────────────────────────────────────────

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.34,
        backgroundImage: "linear-gradient(135deg, rgb(211,220,255) 0%, rgb(236,227,252) 100%)",
        color: "#4a3f8a",
        fontFamily: "'Roboto:Medium', sans-serif",
        ...RV,
      }}
    >
      {initials}
    </div>
  );
}

function PlatformIcon({ platform }: { platform: Platform }) {
  return (
    <div className="h-[16px] w-[16px] shrink-0">
      {platform === "facebook" ? <FacebookIcon /> : platform === "instagram" ? <InstagramIcon /> : <LinkedInIcon />}
    </div>
  );
}

/**
 * Section title — small-caps label above content.
 * No card border; sections are separated by divide-y on the parent.
 */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.09em] text-muted-foreground" style={RV}>
        {title}
      </p>
      {children}
    </div>
  );
}

/** Metric tile — flat bg, no border, clear type hierarchy. */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[6px] bg-[#f6f8fa] dark:bg-[#252a35] px-3.5 py-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground" style={RV}>{label}</p>
      <p className="mt-1.5 text-[16px] font-medium tracking-[-0.3px] text-foreground" style={RV}>{value}</p>
    </div>
  );
}

/** Rows used inside a Section for pages / locations. */
function PageList({
  pages,
}: {
  pages: Array<{
    id: string;
    name: string;
    city?: string;
    statusText?: string;
    tone?: "default" | "success" | "danger";
  }>;
}) {
  const [showAll, setShowAll] = useState(false);
  const INITIAL_COUNT = 10;
  const visible = showAll ? pages : pages.slice(0, INITIAL_COUNT);
  const hasMore = pages.length > INITIAL_COUNT;

  return (
    <div className="space-y-1.5">
      {visible.map((page) => (
        <div
          key={page.id}
          className="flex items-center justify-between gap-3 rounded-[6px] bg-[#f6f8fa] dark:bg-[#252a35] px-3.5 py-2.5"
        >
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-foreground" style={RV}>
              {page.name}
            </p>
            {page.city ? (
              <p className="mt-0.5 text-[11px] text-muted-foreground" style={RV}>{page.city}</p>
            ) : null}
          </div>
          {page.statusText ? (
            <span
              className={`shrink-0 rounded-[99px] px-2.5 py-0.5 text-[11px] ${
                page.tone === "success"
                  ? "bg-[#edf8ef] text-[#2f7d32]  "
                  : page.tone === "danger"
                  ? "bg-[#fff1f0] text-[#d14334]  "
                  : "bg-[#eef2f6] text-[#475467]  "
              }`}
              style={RV}
            >
              {page.statusText}
            </span>
          ) : null}
        </div>
      ))}
      {hasMore && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="mt-1 w-full rounded-[6px] border border-border bg-background py-2 text-[12px] font-medium text-primary transition-colors hover:bg-muted"
          style={RV}
        >
          {showAll ? "Show less" : `See all ${pages.length} pages`}
        </button>
      )}
    </div>
  );
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatExpiry(isoDate: string) {
  return new Date(isoDate).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

function getPostPages(
  postId: string,
  fallbackLocation: string,
  platforms: Platform[],
  approvalLocations?: { id: string; name: string; city: string }[],
): PostPage[] {
  const post = POST_DATA[postId];
  if (post?.pages?.length) return post.pages;
  if (approvalLocations?.length) {
    return approvalLocations.map((loc) => ({ id: loc.id, name: loc.name, platforms }));
  }
  return [{ id: `${postId}-default-page`, name: `Motto Mortgage ${fallbackLocation}`, platforms }];
}

// ─── Post Summary ─────────────────────────────────────────────────────────────

interface PostSummaryProps {
  post: { platforms: Platform[]; date: string; time?: string };
  createdBy: string;
  /** Pass locations only for awaiting/rejected posts to show approval counts */
  approvalLocations?: { status: "pending" | "approved" | "rejected" }[];
}

function PostSummary({ post, createdBy, approvalLocations }: PostSummaryProps) {
  const approved = approvalLocations?.filter((l) => l.status === "approved").length ?? 0;
  const rejected = approvalLocations?.filter((l) => l.status === "rejected").length ?? 0;
  const pending  = approvalLocations ? approvalLocations.length - approved - rejected : 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Creator + date — single inline row */}
      <div className="flex items-center gap-2">
        <Avatar name={createdBy} size={22} />
        <span className="text-[12.5px] font-medium text-foreground" style={RV}>
          {createdBy}
        </span>
        <span className="text-[#d0d5de] select-none">·</span>
        <span className="text-[12px] text-muted-foreground" style={RV}>
          {post.date}{post.time ? ` · ${post.time}` : ""}
        </span>
      </div>

      {/* Platform chips — uniform height, brand-color dot as indicator */}
      <div className="flex flex-wrap gap-1.5">
        {post.platforms.map((p) => (
          <span
            key={p}
            className="inline-flex items-center gap-[5px] rounded-[5px] border border-border bg-[#f6f8fa] dark:bg-[#252a35] px-2 py-[4px] text-[11.5px] text-muted-foreground"
            style={RV}
          >
            <PlatformIcon platform={p} />
            {platformMeta[p].label}
          </span>
        ))}
      </div>

      {/* Approval breakdown (awaiting / rejected only) */}
      {approvalLocations && (approved > 0 || pending > 0 || rejected > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {approved > 0 && (
            <span className="inline-flex items-center gap-[5px] rounded-[5px] border border-[#c6e8c8] bg-[#edf8ef]  px-2 py-[4px] text-[11.5px] text-[#2f7d32] " style={RV}>
              <CheckCircle2 size={11} />
              {approved} Approved
            </span>
          )}
          {pending > 0 && (
            <span className="inline-flex items-center gap-[5px] rounded-[5px] border border-[#fde4a0] bg-[#fef3d6] dark:bg-[#3d311c] px-2 py-[4px] text-[11.5px] text-[#b67a00]" style={RV}>
              <Clock3 size={11} />
              {pending} Pending
            </span>
          )}
          {rejected > 0 && (
            <span className="inline-flex items-center gap-[5px] rounded-[5px] border border-[#fac9c3] bg-[#fef6f5] dark:bg-[#3d2320] px-2 py-[4px] text-[11.5px] text-destructive" style={RV}>
              <XCircle size={11} />
              {rejected} Rejected
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Shimmer Skeleton ─────────────────────────────────────────────────────────

const SHIMMER_CLS =
  "rounded-[4px] bg-[linear-gradient(90deg,var(--shimmer-from)_25%,var(--shimmer-via)_50%,var(--shimmer-from)_75%)] bg-[length:200%_100%] animate-[shimmer_1.6s_linear_infinite]";

function S({ className }: { className?: string }) {
  return <div className={`${SHIMMER_CLS} ${className ?? ""}`} />;
}

function DrawerShimmer() {
  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      {/* Header */}
      <div className="shrink-0 border-b border-border px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <S className="h-9 w-9 rounded-[7px]" />
            <S className="h-5 w-28" />
            <S className="h-5 w-20 rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <S className="h-9 w-24 rounded-[7px]" />
            <S className="h-9 w-24 rounded-[7px]" />
            <S className="h-9 w-9 rounded-[7px]" />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-2">
        {/* Left — info */}
        <div className="flex flex-col border-b border-border bg-background xl:border-b-0 xl:border-r xl:border-r-[#eef1f6] dark:xl:border-r-[#2e3340]">
          {/* Tab bar */}
          <div className="flex shrink-0 items-center gap-6 border-b border-border px-[30px] py-4">
            <S className="h-3.5 w-16" />
            <S className="h-3.5 w-16" />
          </div>
          {/* Content */}
          <div className="flex-1 space-y-7 px-[30px] py-6">
            {/* Section 1 */}
            <div className="space-y-3">
              <S className="h-2.5 w-20" />
              <div className="grid grid-cols-3 gap-2">
                <S className="h-16 rounded-[6px]" />
                <S className="h-16 rounded-[6px]" />
                <S className="h-16 rounded-[6px]" />
              </div>
            </div>
            {/* Section 2 */}
            <div className="space-y-3">
              <S className="h-2.5 w-28" />
              <S className="h-20 rounded-[6px]" />
            </div>
            {/* Section 3 — pages */}
            <div className="space-y-3">
              <S className="h-2.5 w-24" />
              {[0, 1, 2, 3].map((i) => (
                <S key={i} className="h-11 w-full rounded-[6px]" />
              ))}
            </div>
          </div>
        </div>

        {/* Right — preview */}
        <div className="flex flex-col gap-4 bg-[#f0f3f6] dark:bg-[#181b22] px-[30px] py-6">
          {/* Channel tabs */}
          <S className="h-10 w-full rounded-[8px]" />
          {/* Location */}
          <S className="h-3.5 w-44" />
          {/* Preview card */}
          <div className="flex-1 rounded-[8px] border border-border bg-background p-[30px]">
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <S className="h-11 w-11 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <S className="h-3.5 w-36" />
                  <S className="h-3 w-24" />
                </div>
              </div>
              <div className="space-y-2">
                <S className="h-3 w-full" />
                <S className="h-3 w-11/12" />
                <S className="h-3 w-3/4" />
                <S className="mt-2 h-3 w-24 rounded-full" />
              </div>
              <S className="h-52 w-full rounded-[6px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function PostDetailsDrawerContent({
  postId, onClose,
  postIndex, postTotal, hasPrev, hasNext, onPrev, onNext,
}: PostDetailsDrawerContentProps) {
  const post = POST_DATA[postId];
  const approvalData = APPROVAL_DATA[postId];

  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("facebook");
  const [previewVisible, setPreviewVisible] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [tabVisible, setTabVisible] = useState(true);
  const [selectedPageId, setSelectedPageId] = useState<string>("");
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const locationDropdownRef = useRef<HTMLDivElement>(null);

  // Shimmer loading — visible for 3 s, then fades out over 400 ms
  const [shimmerPhase, setShimmerPhase] = useState<"visible" | "fading" | "gone">("visible");
  useEffect(() => {
    setShimmerPhase("visible");
    const t1 = window.setTimeout(() => setShimmerPhase("fading"),  1600);
    const t2 = window.setTimeout(() => setShimmerPhase("gone"),    2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [postId]);

  // Reset all transient state when the post changes
  useEffect(() => {
    if (post?.platforms?.length) setSelectedPlatform(post.platforms[0]);
    setActiveTab("overview");
    setTabVisible(true);
    setLocationDropdownOpen(false);
    const pages = getPostPages(
      postId,
      POST_DATA[postId]?.location ?? "",
      POST_DATA[postId]?.platforms ?? [],
      APPROVAL_DATA[postId]?.locations,
    );
    setSelectedPageId(pages[0]?.id ?? "");
  }, [postId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close dropdown on outside click
  useEffect(() => {
    if (!locationDropdownOpen) return;
    const handle = (e: MouseEvent) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(e.target as Node)) {
        setLocationDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [locationDropdownOpen]);

  if (!post) {
    return (
      <div className="flex h-full items-center justify-center bg-white">
        <p className="text-[#555]" style={{ fontFamily: "'Roboto:Regular',sans-serif" }}>Post not found</p>
      </div>
    );
  }

  const sConfig = statusConfig[post.status];
  const allPages = getPostPages(postId, post.location, post.platforms, approvalData?.locations);
  const selectedPage = allPages.find((p) => p.id === selectedPageId) ?? allPages[0];
  const rejectionStep = approvalData?.steps.find((s) => s.status === "rejected");
  const rejectionReason =
    rejectionStep?.approvers.find((a) => a.rejectionReason)?.rejectionReason ||
    approvalData?.locations.find((loc) => loc.rejectionReason)?.rejectionReason;
  const publishedData = publishedInsights[postId];
  const aiData = aiSuggestionInsights[postId];
  const approvalSummary = useMemo(() => {
    if (!approvalData) return [];
    return approvalData.steps.map((step) => ({
      id: String(step.stepNumber),
      title: step.title,
      status: step.status,
      pending: step.approvers.filter((a) => !a.responded).map((a) => a.isCurrentUser ? "You" : a.name),
      resolved: step.approvers.filter((a) => a.responded).map((a) => a.isCurrentUser ? "You" : a.name),
    }));
  }, [approvalData]);

  const switchPlatform = (platform: Platform) => {
    if (platform === selectedPlatform) return;
    setPreviewVisible(false);
    window.setTimeout(() => { setSelectedPlatform(platform); setPreviewVisible(true); }, 120);
  };

  const selectPage = (pageId: string) => {
    setLocationDropdownOpen(false);
    if (pageId === selectedPage?.id) return;
    setPreviewVisible(false);
    window.setTimeout(() => { setSelectedPageId(pageId); setPreviewVisible(true); }, 120);
  };

  const switchTab = (tab: ActiveTab) => {
    if (tab === activeTab) return;
    setTabVisible(false);
    window.setTimeout(() => { setActiveTab(tab); setTabVisible(true); }, 140);
  };

  // ── Header CTAs ──────────────────────────────────────────────────────────────
  const headerActions = (() => {
    if (post.status === "published") return (
      <>
        <button className="h-9 rounded-[7px] border border-border bg-background px-4 text-[13px] text-muted-foreground transition-colors hover:bg-muted" style={RV}>View live post</button>
        <button className="h-9 rounded-[7px] bg-[#1f78d1] px-4 text-[13px] text-white transition-opacity hover:opacity-90" style={RV}>Boost post</button>
      </>
    );
    if (post.status === "draft") return (
      <button className="h-9 rounded-[7px] bg-[#1f78d1] px-4 text-[13px] text-white transition-opacity hover:opacity-90" style={RV}>Edit draft</button>
    );
    if (post.status === "awaiting") return (
      <>
        <button className="h-9 rounded-[7px] border border-[#f0c9c3] bg-background px-4 text-[13px] text-[#d14334] transition-colors hover:bg-muted" style={RV}>Reject</button>
        <button className="h-9 rounded-[7px] bg-[#1f78d1] px-4 text-[13px] text-white transition-opacity hover:opacity-90" style={RV}>Approve</button>
      </>
    );
    if (post.status === "rejected") return (
      <>
        <button className="h-9 rounded-[7px] border border-border bg-background px-4 text-[13px] text-muted-foreground transition-colors hover:bg-muted" style={RV}>Edit post</button>
        <button className="h-9 rounded-[7px] bg-[#1f78d1] px-4 text-[13px] text-white transition-opacity hover:opacity-90" style={RV}>Resubmit</button>
      </>
    );
    if (post.status === "ai-suggested") return (
      <>
        <button className="h-9 rounded-[7px] border border-border bg-background px-4 text-[13px] text-muted-foreground transition-colors hover:bg-muted" style={RV}>Customize</button>
        <button className="h-9 rounded-[7px] bg-[#6b36b7] px-4 text-[13px] text-white transition-opacity hover:opacity-90" style={RV}>Use this post</button>
      </>
    );
    if (post.status === "scheduled") return (
      <button className="h-9 rounded-[7px] border border-border bg-background px-4 text-[13px] text-muted-foreground transition-colors hover:bg-muted" style={RV}>View post</button>
    );
    return null;
  })();

  // ── Overview sections — returns array so parent can add divide-y ─────────────
  const renderOverviewSections = (): ReactNode[] => {
    // ── Scheduled ──────────────────────────────────────────────────────────────
    if (post.status === "scheduled") {
      return [
        ...(post.expiryDate ? [
          <div key="expiry" className="flex items-center gap-2.5 rounded-[6px] border border-border bg-[#f6f8fa] dark:bg-[#252a35] px-3.5 py-2.5">
            <Clock3 size={13} className="shrink-0 text-muted-foreground" />
            <span className="text-[12px] text-muted-foreground" style={RV}>
              Expires automatically on {formatExpiry(post.expiryDate)}
            </span>
          </div>,
        ] : []),

        <Section key="pages" title="Pages & Locations">
          <PageList pages={allPages.map((p) => ({
            id: p.id, name: p.name, city: post.location,
          }))} />
        </Section>,
      ];
    }

    // ── Published ──────────────────────────────────────────────────────────────
    if (post.status === "published") {
      return [
        <Section key="perf" title="Performance">
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Impressions"  value={publishedData?.impressions    || "14.2K"} />
            <Stat label="Reach"        value={publishedData?.reach          || "9.8K"} />
            <Stat label="Engagement"   value={publishedData?.engagementRate || "3.8%"} />
            <Stat label="Likes"        value={publishedData?.likes          || "312"} />
            <Stat label="Comments"     value={publishedData?.comments       || "21"} />
            <Stat label="Shares"       value={publishedData?.shares         || "46"} />
          </div>
        </Section>,

        <Section key="ai" title="AI Recommendation">
          <div className="rounded-[6px] border border-border bg-[#f6f8fa] dark:bg-[#252a35] px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[5px] bg-[#eef2fa] text-[#4f5d75] ">
                <Bot size={13} />
              </div>
              <div>
                <p className="text-[13px] font-medium text-foreground" style={RV}>
                  {publishedData?.recommendation || "Boost this post"}
                </p>
                <p className="mt-1 text-[12px] leading-[19px] text-muted-foreground" style={RV}>
                  {publishedData?.predictedPerformance || "This post is showing above-baseline engagement and is a strong candidate for amplification."}
                </p>
                <span
                  className="mt-2.5 inline-block rounded-[99px] px-2.5 py-0.5 text-[11px] font-medium text-[#1565b4] "
                  style={{ backgroundColor: "#ebf4ff", ...RV }}
                >
                  Suggested goal: {publishedData?.goal || "Reach"}
                </span>
              </div>
            </div>
          </div>
        </Section>,

        <Section key="pages" title="Pages & Locations">
          <PageList pages={allPages.map((p) => ({
            id: p.id, name: p.name, city: post.location,
          }))} />
        </Section>,
      ];
    }

    // ── Draft ──────────────────────────────────────────────────────────────────
    if (post.status === "draft") {
      return [
        <Section key="pages" title="Pages & Locations">
          <PageList pages={allPages.map((p) => ({
            id: p.id, name: p.name, city: post.location,
          }))} />
        </Section>,
      ];
    }

    // ── Awaiting approval ──────────────────────────────────────────────────────
    if (post.status === "awaiting") {
      return [
        <Section key="flow" title={approvalData?.workflowTitle ?? "Approval Flow"}>
          <div className="space-y-2">
            {approvalSummary.map((step, index) => (
              <div key={step.id} className="relative flex gap-3">
                {index < approvalSummary.length - 1 && (
                  <div className="absolute left-[15px] top-9 h-[calc(100%-10px)] w-px bg-[#eef1f6] " />
                )}
                <div className="relative z-[1] mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background">
                  {step.status === "complete" ? (
                    <CheckCircle2 size={14} className="text-[#2f7d32]" />
                  ) : step.status === "rejected" ? (
                    <XCircle size={14} className="text-[#d14334]" />
                  ) : (
                    <Clock3 size={14} className={step.status === "current" ? "text-primary" : "text-muted-foreground"} />
                  )}
                </div>
                <div className={`min-w-0 flex-1 pb-1 ${
                  step.status === "current"
                    ? "rounded-r-[6px] border-l-2 border-[#1f78d1]  bg-[#f4f8ff]  pl-3 pr-3 py-2.5"
                    : "py-0.5 pl-1"
                }`}>
                  <p className="text-[13px] font-medium text-foreground" style={RV}>{step.title}</p>
                  <p className="mt-0.5 text-[11px] leading-[17px] text-muted-foreground" style={RV}>
                    {step.pending.length
                      ? `Pending: ${step.pending.join(", ")}`
                      : `Completed by ${step.resolved.join(", ") || "reviewers"}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>,

        <Section key="pages" title="Pages & Locations">
          <PageList
            pages={(approvalData?.locations || allPages).map((page: ApprovalLocation | PostPage) => ({
              id: page.id,
              name: page.name,
              city: "city" in page ? page.city : post.location,
              statusText:
                "status" in page
                  ? page.status === "approved" ? "Approved" : page.status === "rejected" ? "Rejected" : "Pending"
                  : "Pending",
              tone: (
                "status" in page
                  ? page.status === "approved" ? "success" : page.status === "rejected" ? "danger" : "default"
                  : "default"
              ) as "default" | "success" | "danger",
            }))}
          />
        </Section>,
      ];
    }

    // ── Rejected ───────────────────────────────────────────────────────────────
    if (post.status === "rejected") {
      return [
        <Section key="reason" title="Rejection Reason">
          <div className="rounded-[6px] border border-[#fad3cf] bg-[#f6f8fa] dark:bg-[#252a35] px-4 py-3.5">
            <div className="flex items-start gap-2.5">
              <XCircle size={15} className="mt-0.5 shrink-0 text-[#d14334]" />
              <p className="text-[13px] leading-[20px] text-[#9f2f25] " style={RV}>
                {rejectionReason || "This post needs revision before it can be approved."}
              </p>
            </div>
          </div>
        </Section>,

        <Section key="pages" title="Pages & Locations">
          <PageList
            pages={(approvalData?.locations || allPages).map((page: ApprovalLocation | PostPage) => ({
              id: page.id,
              name: page.name,
              city: "city" in page ? page.city : post.location,
              statusText: "status" in page ? (page.status === "approved" ? "Approved" : "Rejected") : "Rejected",
              tone: ("status" in page ? (page.status === "approved" ? "success" : "danger") : "danger") as "success" | "danger",
            }))}
          />
        </Section>,
      ];
    }

    // ── AI Suggested ───────────────────────────────────────────────────────────
    if (post.status === "ai-suggested") {
      const ai = aiData ?? {
        reason: "This concept aligns with recent top-performing educational content in your portfolio.",
        benefit: "Projected to outperform the recent average based on engagement signals.",
        useCase: "Engagement",
        engagementUplift: "+15%",
        reachEstimate: "5K–8K",
        confidence: "Medium",
      };

      return [
        <Section key="why" title="Why This Is Suggested">
          <div className="rounded-[6px] border border-border bg-[#f6f8fa] dark:bg-[#252a35] px-4 py-3.5">
            <div className="flex items-start gap-2.5">
              <Sparkles size={14} className="mt-0.5 shrink-0 text-[#6b36b7] " />
              <p className="text-[13px] leading-[20px] text-[#3d2475] " style={RV}>
                {ai.reason}
              </p>
            </div>
          </div>
        </Section>,

        <Section key="outcome" title="Expected Outcome">
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Engagement uplift" value={ai.engagementUplift} />
            <Stat label="Reach estimate"    value={ai.reachEstimate} />
            <Stat label="Confidence"        value={ai.confidence} />
          </div>
          <p className="text-[12px] leading-[19px] text-muted-foreground" style={RV}>{ai.benefit}</p>
        </Section>,

        <Section key="action" title="Suggested Action">
          <div className="flex gap-2">
            <button
              className="flex-1 rounded-[7px] border border-border bg-background py-2.5 text-[13px] font-medium text-[#6b36b7]  transition-colors hover:bg-muted"
              style={RV}
            >
              Customize before publishing
            </button>
            <button
              className="flex-1 rounded-[7px] bg-[#6b36b7] py-2.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
              style={RV}
            >
              Use this post
            </button>
          </div>
        </Section>,

        <Section key="pages" title="Pages & Locations">
          <PageList pages={allPages.map((p) => ({
            id: p.id, name: p.name, city: post.location,
          }))} />
        </Section>,
      ];
    }

    // ── Expired / fallback ─────────────────────────────────────────────────────
    return [
      <Section key="pages" title="Pages & Locations">
        <PageList pages={allPages.map((p) => ({
          id: p.id, name: p.name, city: post.location,
        }))} />
      </Section>,
    ];
  };

  const overviewSections = [
    <Section key="summary" title="Summary">
      <PostSummary
        post={post}
        createdBy={postCreators[postId] ?? "Mark Johnson"}
        approvalLocations={
          post.status === "awaiting" || post.status === "rejected"
            ? approvalData?.locations
            : undefined
        }
      />
    </Section>,
    ...renderOverviewSections(),
  ];

  // ── Render ─────────────────────────────────────────────────────────────────────

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-background transition-colors duration-300">

      {/* ── Shimmer overlay — sits on top, fades out after 3 s ── */}
      {shimmerPhase !== "gone" && (
        <div
          className={`pointer-events-none absolute inset-0 z-20 transition-opacity duration-[400ms] ${
            shimmerPhase === "fading" ? "opacity-0" : "opacity-100"
          }`}
        >
          <DrawerShimmer />
        </div>
      )}

      {/* ── Header ── */}
      <div className="shrink-0 border-b border-border bg-background px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left: back + title + status */}
          <div className="flex min-w-0 items-center gap-3">
            <button
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[7px] border border-border bg-background text-muted-foreground transition-colors hover:bg-muted"
              onClick={onClose}
            >
              <ArrowLeft size={16} />
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[20px] font-medium tracking-[-0.5px] text-foreground" style={RV}>
                Post details
              </p>
              <span
                className="rounded-[99px] px-2.5 py-0.5 text-[11px] font-medium"
                style={{ backgroundColor: sConfig.bg, color: sConfig.color, ...RV }}
              >
                {sConfig.label}
              </span>
            </div>
          </div>

          {/* Right: prev/next navigator + CTAs + more */}
          <div className="flex items-center gap-2">
            {/* Prev / counter / Next */}
            {postTotal !== undefined && postTotal > 1 && (
              <div className="flex items-center rounded-[7px] border border-border bg-background overflow-hidden">
                <button
                  disabled={!hasPrev}
                  onClick={onPrev}
                  className="flex h-9 w-8 items-center justify-center text-muted-foreground transition-colors hover:bg-[#f0f3f6] dark:hover:bg-[#2e3340] disabled:opacity-30 disabled:cursor-default"
                >
                  <ChevronLeft size={15} />
                </button>
                <span className="border-x border-border px-2.5 text-[12px] tabular-nums text-muted-foreground" style={RV}>
                  {postIndex} / {postTotal}
                </span>
                <button
                  disabled={!hasNext}
                  onClick={onNext}
                  className="flex h-9 w-8 items-center justify-center text-muted-foreground transition-colors hover:bg-[#f0f3f6] dark:hover:bg-[#2e3340] disabled:opacity-30 disabled:cursor-default"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            )}
            {headerActions}
            <button className="flex h-9 w-9 items-center justify-center rounded-[7px] border border-border bg-background text-muted-foreground transition-colors hover:bg-muted">
              <MoreVertical size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Two-column body ── */}
      <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-2">

        {/* ── Left: Overview / Activity ── */}
        <div className="flex min-h-0 flex-col bg-background border-b border-border xl:border-b-0 xl:border-r xl:border-r-[#eef1f6] dark:xl:border-r-[#2e3340]">

          {/* Tab bar */}
          <div className="flex shrink-0 items-center gap-1 border-b border-border px-6">
            {(["Overview", "Activity"] as const).map((tab) => {
              const key = tab.toLowerCase() as ActiveTab;
              return (
                <button
                  key={tab}
                  onClick={() => switchTab(key)}
                  className={`-mb-px border-b-2 py-3.5 pr-4 text-[13px] transition-colors ${
                    activeTab === key
                      ? "border-[#1f78d1]  font-medium text-primary"
                      : "border-transparent text-muted-foreground hover:text-[#374151] dark:hover:text-[#9ba2b0]"
                  }`}
                  style={RV}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="min-h-0 flex-1 overflow-auto">
            <div className={`transition-opacity duration-150 ${tabVisible ? "opacity-100" : "opacity-0"}`}>

              {/* Overview tab */}
              {activeTab === "overview" && (
                <div className="px-[30px] py-6">
                  <div className="divide-y divide-[#f0f3f8] dark:divide-[#2e3340]">
                    {overviewSections.map((section, i) => (
                      <div key={i} className={i === 0 ? "pb-5" : "py-5"}>
                        {section}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Activity tab */}
              {activeTab === "activity" && (
                <div className="px-[30px] py-6">
                  <ActivityFeed postId={postId} />
                </div>
              )}

            </div>
          </div>

        </div>

        {/* ── Right: Preview ── */}
        <div className="flex min-h-0 flex-col overflow-auto bg-[#f0f3f6] dark:bg-[#181b22] ">
          <div className="w-full px-[30px] py-6">

            {/* 1. Channel switcher — full row */}
            {post.platforms.length > 1 ? (
              <div className="mb-4 flex items-center gap-1 rounded-[8px] border border-border bg-background p-1">
                {post.platforms.map((platform) => (
                  <button
                    key={platform}
                    onClick={() => switchPlatform(platform)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-[6px] px-3 py-2 text-[12px] transition-all duration-200 ${
                      selectedPlatform === platform
                        ? "bg-[#f0f5ff]  font-medium text-primary"
                        : "text-muted-foreground hover:bg-[#f0f3f6] dark:hover:bg-[#2e3340] hover:text-[#374151] dark:hover:text-[#9ba2b0]"
                    }`}
                    style={RV}
                  >
                    <PlatformIcon platform={platform} />
                    <span>{platformMeta[platform].label}</span>
                  </button>
                ))}
              </div>
            ) : null}

            {/* 2. Location dropdown */}
            <div className="relative mb-4" ref={locationDropdownRef}>
              <button
                onClick={() => setLocationDropdownOpen((o) => !o)}
                className="flex items-center gap-1.5 rounded-[6px] px-0 py-1 transition-colors hover:opacity-80"
                style={RV}
              >
                <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Preview for
                </span>
                <span className="text-[12px] font-medium text-muted-foreground">
                  {selectedPage?.name ?? `Motto Mortgage ${post.location}`}
                </span>
                <ChevronDown
                  size={12}
                  className={`text-[#9aa3b2] transition-transform duration-150 ${locationDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {locationDropdownOpen && (
                <div className="absolute left-0 top-full z-50 mt-1.5 w-[280px] overflow-hidden rounded-[8px] border border-border bg-background shadow-[0_8px_24px_rgba(15,23,42,0.10)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
                  <div className="max-h-[220px] overflow-y-auto py-1">
                    {allPages.map((page) => {
                      const isActive = page.id === (selectedPage?.id ?? allPages[0]?.id);
                      const initials = page.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
                      return (
                        <button
                          key={page.id}
                          onClick={() => selectPage(page.id)}
                          className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[#f0f3f6] dark:hover:bg-[#2e3340] ${isActive ? "bg-[#f4f8ff] " : ""}`}
                          style={RV}
                        >
                          <div
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-medium text-[#4a3f8a]"
                            style={{ backgroundImage: "linear-gradient(135deg, rgb(211,220,255) 0%, rgb(236,227,252) 100%)" }}
                          >
                            {initials}
                          </div>
                          <p className="flex-1 truncate text-[13px] text-foreground" style={RV}>{page.name}</p>
                          {isActive && <CheckCircle2 size={14} className="shrink-0 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Preview card */}
            <div className="rounded-[8px] border border-border bg-background dark:shadow-none">
              <div
                className={`space-y-5 px-[30px] py-[30px] transition-opacity duration-200 ${previewVisible ? "opacity-100" : "opacity-0"}`}
              >
                {/* Author row */}
                <div className="flex items-center gap-3">
                  <Avatar name={selectedPage?.name ?? `Motto Mortgage ${post.location}`} size={44} />
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-medium text-foreground" style={RV}>
                      {selectedPage?.name ?? `Motto Mortgage ${post.location}`}
                    </p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground" style={RV}>
                      {post.date}{post.time ? ` · ${post.time}` : ""}
                    </p>
                  </div>
                </div>

                {/* Caption — no container box */}
                <div>
                  <p
                    className="whitespace-pre-wrap text-[14px] leading-[22px] text-foreground"
                    style={{ fontFamily: "'Roboto:Regular', sans-serif", ...RV }}
                  >
                    {post.caption}
                  </p>
                  {post.hashtags ? (
                    <p
                      className="mt-3 text-[14px] leading-[22px] text-primary"
                      style={{ fontFamily: "'Roboto:Regular', sans-serif", ...RV }}
                    >
                      {post.hashtags}
                    </p>
                  ) : null}
                </div>

                {/* Image */}
                {post.image ? (
                  <div className="overflow-hidden rounded-[6px] border border-border">
                    <img src={post.image} alt="Post preview" className="h-auto w-full object-cover" />
                  </div>
                ) : null}

                {/* Expired notice */}
                {post.expiryDate && post.status === "expired" ? (
                  <div className="flex items-start gap-3 rounded-[6px] border border-border bg-[#f6f8fa] dark:bg-[#252a35] px-4 py-3">
                    <Clock3 size={14} className="mt-0.5 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-[13px] font-medium text-foreground" style={RV}>Expired automatically</p>
                      <p className="mt-0.5 text-[12px] text-muted-foreground" style={RV}>
                        Removed on {formatExpiry(post.expiryDate)} where supported.
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
