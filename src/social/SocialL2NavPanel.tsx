import { L2NavLayout } from '@/contenthub-ui/L2NavLayout.v1'

const SECTIONS = [
  { label: "Publish",     children: ["Calendar", "View drafts", "Approve posts", "Fix failed posts", "Fix rejected posts", "Expired posts"] },
  { label: "Engage",      children: ["View all engagements", "Assigned to me", "Approve replies", "Fix rejected replies", "View spam"] },
  { label: "Reports",     children: ["All channels", "Post performance", "Response trends", "Best time to post"] },
  { label: "Competitors", children: ["Benchmarking", "Posts"] },
  { label: "Libraries",   children: ["Post library", "Media library", "Reply templates"] },
  { label: "Agents",      children: ["Publishing agent", "Engagement agent"] },
  { label: "Settings",    children: ["Approvals", "Link in bio", "Tags", "AI posts", "AI prompts"] },
]

export interface SocialL2NavPanelProps {
  activeItem: string
  onActiveItemChange: (key: string) => void
}

export function SocialL2NavPanel({ activeItem, onActiveItemChange }: SocialL2NavPanelProps) {
  return (
    <L2NavLayout
      sections={SECTIONS}
      headerAction={{ label: "Create post", onClick: () => onActiveItemChange("Create post") }}
      activeItem={activeItem}
      onActiveItemChange={onActiveItemChange}
    />
  )
}
