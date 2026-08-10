import { ArrowLeft, Clock3, Sparkles } from "lucide-react";
import { ActivityFeed } from "./ActivityFeed";

interface ActivityDrawerContentProps {
  postId: string;
  onClose: () => void;
}

export function ActivityDrawerContent({ postId, onClose }: ActivityDrawerContentProps) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-muted transition-colors duration-300">
      <div className="border-b border-border bg-[rgba(247,248,251,0.92)] dark:bg-[rgba(24,27,34,0.92)] px-6 py-5 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-[#303030] transition-colors hover:bg-muted"
              onClick={onClose}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[22px] tracking-[-0.6px] text-foreground">Activity</p>
                <span className="rounded-full bg-[#eef4ff] px-3 py-1 text-[12px] text-primary">
                  Timeline
                </span>
              </div>
              <p className="mt-1 text-[13px] text-muted-foreground">
                A cleaner audit trail for content edits, approvals, scheduling, and delivery changes.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2">
              <Clock3 size={14} />
              <span>Most recent first</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-[#6b36b7] ">
              <Sparkles size={14} />
              <span>Premium audit view</span>
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-6 py-6">
        <div className="mx-auto max-w-[920px] rounded-[24px] border border-border bg-background p-2 shadow-[0_24px_60px_rgba(15,23,42,0.06)] dark:shadow-none">
          <div className="rounded-[20px] bg-[linear-gradient(180deg,#ffffff_0%,#fafbfd_100%)] px-2 py-2">
            <ActivityFeed postId={postId} />
          </div>
        </div>
      </div>
    </div>
  );
}
