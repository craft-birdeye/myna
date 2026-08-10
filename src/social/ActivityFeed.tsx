import { useState } from 'react';
import {
  Sparkles,
  Edit3,
  Clock3,
  Image as ImageIcon,
  MapPin,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { POST_ACTIVITIES, type Activity } from './data/postData';

const RV = { } as const;

const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'caption_edited',
    user: { name: 'Sarah Mitchell', avatar: 'gradient' },
    timestamp: 'just now',
    description: 'edited the caption and hashtags',
    details: {
      before: 'Try our new Spicy Chicken Sandwich! Available for a limited time. #McDonalds #NewMenu',
      after: 'Introducing our NEW Spicy Chicken Sandwich! 🔥 Crispy, juicy, and packed with flavor. Limited time only! #McDonalds #SpicyChicken #NewMenu #LimitedTime',
    },
  },
  {
    id: '2',
    type: 'image_changed',
    user: { name: 'David Rodriguez', avatar: 'gradient' },
    timestamp: '5mins',
    description: 'updated the post image',
    details: {
      beforeImage: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&h=300&fit=crop',
      afterImage: 'https://images.unsplash.com/photo-1607013251379-e6eecfffe234?w=400&h=300&fit=crop',
    },
  },
  {
    id: '3',
    type: 'multi_location_edit',
    user: { name: 'Marketing Team', avatar: 'gradient' },
    timestamp: '15mins',
    description: 'applied Happy Meal promotion rules to Facebook pages',
    details: { locations: ['Facebook'], count: 3 },
  },
  {
    id: '4',
    type: 'scheduled',
    user: { name: 'Jessica Martinez', avatar: 'gradient' },
    timestamp: 'Mar 19, 2026 11:42 AM',
    description: 'scheduled this post for 10 locations on Mar 20, 9:00 AM',
    details: {
      count: 10,
      locations: ['Atlanta Downtown', 'Boston Commons', 'Los Angeles Westwood', 'Chicago Loop', 'Denver Tech Center', 'Houston Galleria', 'Miami Beach', 'New York Times Square', 'Seattle Pike Place', 'Phoenix Scottsdale'],
    },
  },
  {
    id: '5',
    type: 'partial_approval',
    user: { name: 'Regional Manager', avatar: 'gradient' },
    timestamp: 'Mar 19, 2026 10:15 AM',
    description: 'approved 5 of 10 locations',
    details: {
      locations: ['Atlanta Downtown', 'Boston Commons', 'Los Angeles Westwood', 'Chicago Loop', 'Denver Tech Center'],
    },
  },
  {
    id: '6',
    type: 'location_removed',
    user: { name: 'Michael Chen', avatar: 'gradient' },
    timestamp: 'Mar 19, 2026 9:30 AM',
    description: 'removed location',
    details: { locations: ['Phoenix Scottsdale'] },
  },
  {
    id: '7',
    type: 'caption_edited',
    user: { name: 'Sarah Mitchell', avatar: 'gradient' },
    timestamp: 'Mar 18, 2026 4:20 PM',
    description: 'edited the post caption',
    details: {
      before: "McDonald's meals in every celebration that brings smiles, happiness, and togetherness. #FamilyTime",
      after: "McDonald's meals make every celebration special with smiles, happiness, and unforgettable moments. #FamilyTime #Celebration",
    },
  },
  {
    id: '8',
    type: 'media_updated',
    user: { name: 'David Rodriguez', avatar: 'gradient' },
    timestamp: 'Mar 18, 2026 3:15 PM',
    description: 'updated the post image for 8 locations',
    details: { count: 8 },
  },
  {
    id: '9',
    type: 'location_added',
    user: { name: 'Michael Chen', avatar: 'gradient' },
    timestamp: 'Mar 18, 2026 1:30 PM',
    description: 'added 3 new locations',
    details: { locations: ['Miami Beach', 'Seattle Pike Place', 'Phoenix Scottsdale'] },
  },
  {
    id: '10',
    type: 'approved',
    user: { name: 'Regional Manager', avatar: 'gradient' },
    timestamp: 'Mar 18, 2026 12:45 PM',
    description: 'approved the remaining 5 locations',
    details: {
      locations: ['Houston Galleria', 'Miami Beach', 'New York Times Square', 'Seattle Pike Place', 'Phoenix Scottsdale'],
    },
  },
  {
    id: '11',
    type: 'rejected',
    user: { name: 'Brand Compliance', avatar: 'gradient' },
    timestamp: 'Mar 18, 2026 11:20 AM',
    description: 'rejected Boston Commons location',
    details: {
      locations: ['Boston Commons'],
      rejectionReason: 'Image does not meet brand guidelines — logo placement incorrect.',
    },
  },
  {
    id: '12',
    type: 'caption_edited',
    user: { name: 'Sarah Mitchell', avatar: 'gradient' },
    timestamp: 'Mar 18, 2026 10:00 AM',
    description: 'edited the post caption',
    details: {
      before: 'Start your morning right with our breakfast menu!',
      after: 'Start your morning right with our delicious breakfast menu! Fresh ingredients, hot coffee, and your favorites. ☀️',
    },
  },
  {
    id: '13',
    type: 'created',
    user: { name: 'Sarah Mitchell', avatar: 'gradient' },
    timestamp: 'Mar 18, 2026 9:00 AM',
    description: 'created this post',
  },
];

function getIconConfig(type: Activity['type']): { icon: React.ReactNode; bg: string; color: string } {
  const s = { size: 13, strokeWidth: 2 };
  switch (type) {
    case 'created':
      return { icon: <Sparkles {...s} />, bg: '#f3ecff', color: '#6b36b7' };
    case 'ai_generated':
      return { icon: <Sparkles {...s} />, bg: '#f3ecff', color: '#6b36b7' };
    case 'edited':
    case 'caption_edited':
      return { icon: <Edit3 {...s} />, bg: '#f0f3f8', color: '#4f5d75' };
    case 'scheduled':
    case 'rescheduled':
      return { icon: <Clock3 {...s} />, bg: '#ebf4ff', color: '#1f78d1' };
    case 'media_updated':
    case 'image_changed':
      return { icon: <ImageIcon {...s} />, bg: '#f0f3f8', color: '#4f5d75' };
    case 'location_added':
      return { icon: <MapPin {...s} />, bg: '#edf8ef', color: '#2f7d32' };
    case 'location_removed':
      return { icon: <MapPin {...s} />, bg: '#fff1f0', color: '#d14334' };
    case 'approved':
    case 'partial_approval':
      return { icon: <CheckCircle2 {...s} />, bg: '#edf8ef', color: '#2f7d32' };
    case 'rejected':
      return { icon: <XCircle {...s} />, bg: '#fff1f0', color: '#d14334' };
    case 'multi_location_edit':
    case 'bulk_edit':
      return { icon: <RefreshCw {...s} />, bg: '#fff4da', color: '#b67a00' };
    default:
      return { icon: <Edit3 {...s} />, bg: '#f0f3f8', color: '#4f5d75' };
  }
}

export function ActivityFeed({ postId }: { postId?: string }) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const activities: Activity[] = postId && POST_ACTIVITIES[postId]
    ? POST_ACTIVITIES[postId]
    : mockActivities;

  const toggleItem = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const groupedActivities = activities.reduce((acc, activity) => {
    const date = activity.timestamp.includes('Mar')
      ? activity.timestamp.split(',')[0] + ', 2026'
      : 'Today';
    if (!acc[date]) acc[date] = [];
    acc[date].push(activity);
    return acc;
  }, {} as Record<string, Activity[]>);

  return (
    <div className="w-full space-y-6">
      {Object.entries(groupedActivities).map(([date, items]) => (
        <div key={date}>
          {/* Date group header — matches Section title style */}
          <p
            className="mb-3 text-[10px] font-medium uppercase tracking-[0.09em] text-muted-foreground"
            style={RV}
          >
            {date}
          </p>

          {/* Activity rows */}
          <div className="divide-y divide-[#f0f3f8] dark:divide-[#2e3340]">
            {items.map((activity) => {
              const { icon, bg, color } = getIconConfig(activity.type);
              const isExpanded = expandedItems.has(activity.id);

              return (
                <div key={activity.id} className="py-4">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: bg, color }}
                    >
                      {icon}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      {/* Timestamp */}
                      <p className="text-[11px] text-muted-foreground" style={RV}>
                        {activity.timestamp}
                      </p>

                      {/* User + description */}
                      <p className="mt-0.5 text-[13px] leading-[20px] text-foreground" style={RV}>
                        <span className="font-medium">{activity.user.name}</span>
                        {' '}
                        <span className="text-muted-foreground">{activity.description}</span>
                      </p>

                      {/* Detail blocks */}
                      {activity.details && (
                        <div className="mt-2.5 space-y-2">

                          {/* Caption / schedule before → after */}
                          {(activity.type === 'caption_edited' || activity.type === 'bulk_edit' || activity.type === 'rescheduled') &&
                            activity.details.before && activity.details.after && (
                            <div className="rounded-[6px] border border-border bg-muted px-3.5 py-3">
                              <p
                                className="mb-2 text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground"
                                style={RV}
                              >
                                {activity.type === 'rescheduled' ? 'Schedule' : 'Caption'}
                              </p>
                              <div className="space-y-2">
                                <p className="text-[12px] leading-[18px] text-muted-foreground line-through" style={RV}>
                                  {activity.details.before}
                                </p>
                                <div className="flex items-center gap-1.5">
                                  <div className="h-px flex-1 bg-[#e4e9f2] " />
                                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0 text-muted-foreground">
                                    <path d="M6 2v8M6 10l-3-3M6 10l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                  <div className="h-px flex-1 bg-[#e4e9f2] " />
                                </div>
                                <p className="text-[12px] leading-[18px] text-foreground" style={RV}>
                                  {activity.details.after}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Image before → after */}
                          {activity.type === 'image_changed' &&
                            activity.details.beforeImage && activity.details.afterImage && (
                            <div className="rounded-[6px] border border-border bg-muted px-3.5 py-3">
                              <p
                                className="mb-2.5 text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground"
                                style={RV}
                              >
                                Image
                              </p>
                              <div className="flex items-center gap-2.5">
                                <div className="flex-1 overflow-hidden rounded-[5px] border border-border">
                                  <img
                                    src={activity.details.beforeImage}
                                    alt="Before"
                                    className="h-[100px] w-full object-cover opacity-60 grayscale"
                                  />
                                  <p className="py-1 text-center text-[10px] text-muted-foreground" style={RV}>Before</p>
                                </div>
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-muted-foreground">
                                  <path d="M4 7H10M10 7L7 4M10 7L7 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <div className="flex-1 overflow-hidden rounded-[5px] border border-border">
                                  <img
                                    src={activity.details.afterImage}
                                    alt="After"
                                    className="h-[100px] w-full object-cover"
                                  />
                                  <p className="py-1 text-center text-[10px] text-primary" style={RV}>After</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Multi-location platform badge */}
                          {activity.type === 'multi_location_edit' && activity.details.locations && (
                            <div className="rounded-[6px] border border-border bg-muted px-3.5 py-3">
                              <p
                                className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground"
                                style={RV}
                              >
                                Platform
                              </p>
                              <span
                                className="inline-block rounded-[99px] bg-[#eef2f6] px-2.5 py-0.5 text-[11px] text-muted-foreground"
                                style={RV}
                              >
                                {activity.details.locations[0]}
                              </span>
                            </div>
                          )}

                          {/* Expandable locations list */}
                          {activity.details.locations && activity.details.locations.length > 0 &&
                            (activity.type === 'scheduled' || activity.type === 'partial_approval' ||
                             activity.type === 'approved' || activity.type === 'location_added') && (
                            <div>
                              <button
                                onClick={() => toggleItem(activity.id)}
                                className="flex items-center gap-1 text-[12px] font-medium text-primary transition-opacity hover:opacity-75"
                                style={RV}
                              >
                                {isExpanded ? 'Hide' : 'View'} {activity.details.locations.length} location{activity.details.locations.length > 1 ? 's' : ''}
                                <svg
                                  width="12" height="12" viewBox="0 0 12 12" fill="none"
                                  className="transition-transform duration-150"
                                  style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }}
                                >
                                  <path d="M9 4.5L6 7.5L3 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>

                              {isExpanded && (
                                <div className="mt-2 space-y-1.5 rounded-[6px] border border-border bg-muted px-3.5 py-3">
                                  {activity.details.locations.map((loc, idx) => (
                                    <div key={idx} className="flex items-center gap-2.5">
                                      <div
                                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-medium text-[#4a3f8a]"
                                        style={{ backgroundImage: 'linear-gradient(135deg, rgb(211,220,255) 0%, rgb(236,227,252) 100%)' }}
                                      >
                                        {loc.slice(0, 1).toUpperCase()}
                                      </div>
                                      <p className="text-[12px] text-foreground" style={RV}>{loc}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Media updated badge */}
                          {activity.type === 'media_updated' && activity.details.count && (
                            <span
                              className="inline-block rounded-[99px] bg-[#ebf4ff] px-2.5 py-0.5 text-[11px] text-primary"
                              style={RV}
                            >
                              Updated for {activity.details.count} locations
                            </span>
                          )}

                          {/* Location removed badge */}
                          {activity.type === 'location_removed' && activity.details.locations && (
                            <span
                              className="inline-block rounded-[99px] bg-muted px-2.5 py-0.5 text-[11px] text-[#d14334]"
                              style={RV}
                            >
                              {activity.details.locations[0]}
                            </span>
                          )}

                          {/* Rejected with reason */}
                          {activity.type === 'rejected' &&
                            (activity.details.locations || activity.details.rejectionReason) && (
                            <div className="space-y-2">
                              {activity.details.locations && (
                                <span
                                  className="inline-block rounded-[99px] bg-muted px-2.5 py-0.5 text-[11px] text-[#d14334]"
                                  style={RV}
                                >
                                  {activity.details.locations[0]}
                                </span>
                              )}
                              {activity.details.rejectionReason && (
                                <div className="rounded-[6px] border border-[#fad3cf] bg-muted px-3.5 py-3">
                                  <p
                                    className="mb-1 text-[10px] font-medium uppercase tracking-[0.06em] text-[#d14334]"
                                    style={RV}
                                  >
                                    Reason
                                  </p>
                                  <p className="text-[12px] leading-[18px] text-[#9f2f25] " style={RV}>
                                    {activity.details.rejectionReason}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
