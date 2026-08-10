import { useMemo, useState } from "react";
import { MessageSquareDashed } from "lucide-react";
import { CalendarView } from "./CalendarView";
import { CreatePostView } from "./CreatePostView";
import { PostDetailsDrawer } from "./PostDetailsDrawer";
import { ActivityDrawer } from "./ActivityDrawer";
import { ApprovePostsView } from "./ApprovePostsView";
import { RejectedPostsView } from "./RejectedPostsView";
import { ExpiredPostsView } from "./ExpiredPostsView";
import { ApprovalsSetupView } from "./ApprovalsSetupView";
import { POST_DATA, type PostData } from "./data/postData";

// Ordered list of post IDs visible in the calendar (deduped, in visual order)
const CALENDAR_POST_IDS = ["post-3", "post-1", "post-2", "post-4", "post-5", "post-10", "post-9", "post-6", "post-7", "post-8", "post-11"];

interface SocialViewProps {
  /** If omitted, the component manages its own active-item state */
  activeItem?: string;
  onActiveItemChange?: (key: string) => void;
}

function PlaceholderPanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex h-full items-center justify-center bg-background p-8">
      <div className="max-w-[440px] rounded-[12px] border border-border bg-muted p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#e8effe] text-[#2552ed] ">
          <MessageSquareDashed className="h-5 w-5" />
        </div>
        <h2 className="mt-4 text-[20px] tracking-[-0.4px] text-foreground">{title}</h2>
        <p className="mt-2 text-[14px] leading-[1.6] text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function SocialView({ activeItem: activeItemProp, onActiveItemChange: onChangeProp }: SocialViewProps) {
  // When used standalone (v2.5 App calls <SocialView /> with no props),
  // manage state internally so the component is fully self-contained.
  const [internalActiveItem, setInternalActiveItem] = useState("Publish/Calendar");
  const activeItem = activeItemProp ?? internalActiveItem;
  const onActiveItemChange = onChangeProp ?? setInternalActiveItem;

  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedActivityPostId, setSelectedActivityPostId] = useState<string | null>(null);
  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const expiredPosts = useMemo(
    () => Object.values(POST_DATA).filter((post) => post.status === "expired"),
    [],
  );
  void expiredPosts; // referenced for future use

  const handlePublish = (mode: "publish" | "schedule" | "draft", expiryDate?: string) => {
    if (mode === "draft") {
      setToastMessage("Draft saved");
      window.setTimeout(() => setToastMessage(null), 100);
      onActiveItemChange("Publish/Calendar");
      return;
    }

    const newId = `post-new-${Date.now()}`;
    const newPost: PostData = {
      postId: newId,
      status: mode === "publish" ? "published" : "scheduled",
      platforms: ["facebook", "instagram", "linkedin"],
      time: "10:00 AM",
      date: "Sat, Mar 7, 2026",
      caption:
        "Nothing beats a freshly grilled burger stacked with juicy patties, soft buns, and bold flavors in every bite.",
      hashtags: "#BurgerLife #EatHappy",
      image: "https://picsum.photos/seed/burger/600/400",
      location: "All locations",
      scheduledFor: mode === "publish" ? "Published now" : "Scheduled for Mar 7, 10:00 AM",
      ...(expiryDate ? { expiryDate } : {}),
    };

    POST_DATA[newId] = newPost;
    setHighlightedPostId(newId);
    setToastMessage(mode === "publish" ? "Post published successfully" : "Post scheduled successfully");
    onActiveItemChange("Publish/Calendar");

    window.setTimeout(() => setHighlightedPostId(null), 5000);
    window.setTimeout(() => setToastMessage(null), 100);
  };

  const renderContent = () => {
    switch (activeItem) {
      case "Create post":
        return <CreatePostView onBack={() => onActiveItemChange("Publish/Calendar")} onPublish={handlePublish} />;
      case "Publish/Calendar":
        return (
          <CalendarView
            onPostClick={(id) => setSelectedPostId(id)}
            onActivityClick={(id) => setSelectedActivityPostId(id)}
            onViewExpiredPosts={() => onActiveItemChange("Publish/Expired posts")}
            highlightedPostId={highlightedPostId}
            toastMessage={toastMessage}
          />
        );
      case "Publish/Approve posts":
        return <ApprovePostsView onOpenDetails={(id) => setSelectedPostId(id)} onOpenActivity={(id) => setSelectedActivityPostId(id)} />;
      case "Publish/Fix rejected posts":
        return <RejectedPostsView onOpenDetails={(id) => setSelectedPostId(id)} onOpenActivity={(id) => setSelectedActivityPostId(id)} />;
      case "Publish/Expired posts":
        return (
          <ExpiredPostsView
            onCreatePost={() => onActiveItemChange("Create post")}
            onOpenActivity={(id) => setSelectedActivityPostId(id)}
          />
        );
      case "Settings/Approvals":
        return <ApprovalsSetupView />;
      default:
        return (
          <PlaceholderPanel
            title="Social"
            description="Select an item from the left navigation to get started."
          />
        );
    }
  };

  return (
    <div className="relative flex h-full min-h-0 flex-1 overflow-hidden bg-background">
      {renderContent()}
      <PostDetailsDrawer postId={selectedPostId} postIds={CALENDAR_POST_IDS} onClose={() => setSelectedPostId(null)} />
      <ActivityDrawer postId={selectedActivityPostId} onClose={() => setSelectedActivityPostId(null)} />
    </div>
  );
}
