import { Sheet, SheetContent } from "@/contenthub-ui/sheet.v1";
import { FLOATING_SHEET_FRAME_CONTENT_CLASS } from "./layout/FloatingSheetFrame";
import { ActivityDrawerContent } from "./ActivityDrawerContent";

interface ActivityDrawerProps {
  postId: string | null;
  onClose: () => void;
}

export function ActivityDrawer({ postId, onClose }: ActivityDrawerProps) {
  if (!postId) return null;

  return (
    <Sheet open={true} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side="right" 
        inset="floating" 
        floatingSize="md" 
        className={FLOATING_SHEET_FRAME_CONTENT_CLASS}
      >
        <ActivityDrawerContent postId={postId} onClose={onClose} />
      </SheetContent>
    </Sheet>
  );
}
