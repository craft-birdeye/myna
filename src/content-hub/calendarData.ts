/**
 * calendarData.ts
 *
 * Mock data for the Content Hub calendar.
 * Projects: use a colorKey (one of 8 semantic names) — never raw hex/rgba.
 * ScheduledItems: support all content types — social, blog, faq, email, landing.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type ProjectColor =
  | 'purple' | 'green' | 'amber' | 'blue'
  | 'rose'   | 'teal'  | 'orange'| 'slate';

/** Maps a ProjectColor key to Tailwind classes for bg / text / border. */
export const PROJECT_COLOR_MAP: Record<
  ProjectColor,
  { bg: string; text: string; border: string }
> = {
  purple: { bg: 'bg-primary/[0.08]',      text: 'text-primary',       border: 'border-primary/20' },
  green:  { bg: 'bg-primary/[0.08]',    text: 'text-primary',     border: 'border-primary/20' },
  amber:  { bg: 'bg-surface-hover',             text: 'text-text-secondary',     border: 'border-border' },
  blue:   { bg: 'bg-primary/5',              text: 'text-primary',      border: 'border-primary/30' },
  rose:   { bg: 'bg-rose-50',              text: 'text-rose-600',      border: 'border-rose-200' },
  teal:   { bg: 'bg-teal-50',              text: 'text-teal-700',      border: 'border-teal-200' },
  orange: { bg: 'bg-orange-50',            text: 'text-orange-700',    border: 'border-orange-200' },
  slate:  { bg: 'bg-slate-100',            text: 'text-slate-600',     border: 'border-slate-200' },
};

export type ContentType = 'social' | 'blog' | 'faq' | 'email' | 'landing';

export type SocialPlatform = 'facebook' | 'instagram' | 'linkedin' | 'twitter';

export interface Project {
  id: string;
  name: string;
  colorKey: ProjectColor;
  startDate: Date;
  endDate: Date;
}

export interface ScheduledItem {
  id: string;
  projectId: string;
  contentType: ContentType;
  /** Only set when contentType === 'social' */
  platform?: SocialPlatform;
  date: Date;
  time: string;
  status: 'Scheduled' | 'Draft' | 'Published';
  title: string;
  caption: string;
  image?: string;
}

// ── Helper ────────────────────────────────────────────────────────────────────

const Y = 2026;
const M = 4;
const d = (day: number, h = 10, m = 0): Date => new Date(Y, M, day, h, m);

// ── Projects ──────────────────────────────────────────────────────────────────

export const mockProjects: Project[] = [
  { id: '1',  name: 'Spring Garden Cleanup',         colorKey: 'blue',   startDate: d(1),  endDate: d(31) },
  { id: '2',  name: 'Sustainable Lawn Care Launch',  colorKey: 'green',  startDate: d(1),  endDate: d(10) },
  { id: '3',  name: 'Customer Testimonial Campaign', colorKey: 'amber',  startDate: d(5),  endDate: d(15) },
  { id: '4',  name: 'Winter Maintenance Tips',       colorKey: 'slate',  startDate: d(12), endDate: d(25) },
  { id: '5',  name: 'New Year Special Offers',       colorKey: 'rose',   startDate: d(1),  endDate: d(7)  },
  { id: '6',  name: 'Summer Pool Maintenance',       colorKey: 'teal',   startDate: d(3),  endDate: d(20) },
  { id: '7',  name: 'Fall Leaf Removal Campaign',    colorKey: 'orange', startDate: d(8),  endDate: d(28) },
  { id: '8',  name: 'Holiday Lighting Installation', colorKey: 'purple', startDate: d(2),  endDate: d(18) },
  { id: '9',  name: 'Irrigation System Upgrade',     colorKey: 'blue',   startDate: d(6),  endDate: d(22) },
  { id: '10', name: 'Pest Control Awareness',        colorKey: 'green',  startDate: d(4),  endDate: d(16) },
  { id: '11', name: 'Landscape Design Contest',      colorKey: 'amber',  startDate: d(1),  endDate: d(31) },
  { id: '12', name: 'Organic Fertilizer Promotion',  colorKey: 'green',  startDate: d(10), endDate: d(24) },
  { id: '13', name: 'Tree Trimming Service Launch',  colorKey: 'teal',   startDate: d(5),  endDate: d(19) },
  { id: '14', name: 'Garden Tool Sale Event',        colorKey: 'rose',   startDate: d(11), endDate: d(27) },
  { id: '15', name: 'Native Plants Campaign',        colorKey: 'purple', startDate: d(7),  endDate: d(21) },
];

// ── Scheduled Items ───────────────────────────────────────────────────────────

export const mockScheduledItems: ScheduledItem[] = [
  // --- Social posts ---
  {
    id: 'p1', projectId: '1', contentType: 'social', platform: 'instagram',
    date: d(2, 10, 0), time: '10:00 AM', status: 'Scheduled',
    title: 'Spring Cleanup Early Bird',
    caption: 'Professional garden cleanup services available now — book your slot!',
  },
  {
    id: 'p2', projectId: '5', contentType: 'social', platform: 'facebook',
    date: d(3, 14, 30), time: '2:30 PM', status: 'Scheduled',
    title: 'New Year Special Offers',
    caption: 'Start your year fresh with our special offers!',
  },
  {
    id: 'p3', projectId: '2', contentType: 'social', platform: 'instagram',
    date: d(4, 9, 15), time: '9:15 AM', status: 'Scheduled',
    title: 'Go Green This Season',
    caption: 'Sustainable lawn care tips for a greener future.',
  },
  {
    id: 'p4', projectId: '1', contentType: 'social', platform: 'linkedin',
    date: d(5, 11, 0), time: '11:00 AM', status: 'Scheduled',
    title: 'Spring Cleanup Professional',
    caption: 'Professional garden cleanup services available now.',
  },
  {
    id: 'p5', projectId: '3', contentType: 'social', platform: 'instagram',
    date: d(6, 10, 28), time: '10:28 AM', status: 'Scheduled',
    title: 'Customer Love Stories',
    caption: 'Hear what our customers have to say!',
  },
  {
    id: 'p6', projectId: '3', contentType: 'social', platform: 'facebook',
    date: d(6, 15, 0), time: '3:00 PM', status: 'Scheduled',
    title: 'Testimonial Tuesday',
    caption: '5-star reviews from happy customers.',
  },
  {
    id: 'p7', projectId: '2', contentType: 'social', platform: 'twitter',
    date: d(7, 8, 30), time: '8:30 AM', status: 'Scheduled',
    title: 'Eco-Friendly Tips',
    caption: 'Did you know? Sustainable practices save water!',
  },
  {
    id: 'p8', projectId: '3', contentType: 'social', platform: 'instagram',
    date: d(8, 10, 0), time: '10:00 AM', status: 'Scheduled',
    title: 'Before and After',
    caption: 'Before and after transformations — incredible results.',
  },
  {
    id: 'p9', projectId: '1', contentType: 'social', platform: 'facebook',
    date: d(9, 12, 0), time: '12:00 PM', status: 'Scheduled',
    title: 'Spring Prep Guide',
    caption: 'Garden cleanup checklist for homeowners.',
  },
  {
    id: 'p10', projectId: '2', contentType: 'social', platform: 'instagram',
    date: d(10, 9, 0), time: '9:00 AM', status: 'Scheduled',
    title: 'Natural Lawn Care',
    caption: 'Organic fertilizers for a healthier lawn.',
  },
  {
    id: 'p11', projectId: '3', contentType: 'social', platform: 'linkedin',
    date: d(11, 16, 0), time: '4:00 PM', status: 'Published',
    title: 'B2B Success Stories',
    caption: 'Professional testimonials from commercial clients.',
  },
  {
    id: 'p12', projectId: '4', contentType: 'social', platform: 'instagram',
    date: d(12, 10, 0), time: '10:00 AM', status: 'Scheduled',
    title: 'Winter Care Tips',
    caption: 'Winter lawn maintenance essentials.',
  },
  {
    id: 'p13', projectId: '4', contentType: 'social', platform: 'facebook',
    date: d(13, 14, 30), time: '2:30 PM', status: 'Draft',
    title: 'Cold Weather Guide',
    caption: 'Protect your lawn during cold weather.',
  },
  {
    id: 'p14', projectId: '3', contentType: 'social', platform: 'twitter',
    date: d(14, 11, 0), time: '11:00 AM', status: 'Scheduled',
    title: 'Happy Customers',
    caption: 'Customer satisfaction is our priority.',
  },
  {
    id: 'p22', projectId: '1', contentType: 'social', platform: 'instagram',
    date: d(22, 10, 0), time: '10:00 AM', status: 'Scheduled',
    title: 'Limited Slots Available',
    caption: 'Last chance for early bird spring cleanup — book today!',
  },
  {
    id: 'p24', projectId: '1', contentType: 'social', platform: 'facebook',
    date: d(24, 12, 0), time: '12:00 PM', status: 'Scheduled',
    title: 'Dream Lawn Awaits',
    caption: 'Transform your outdoor space this spring.',
  },
  {
    id: 'p26', projectId: '1', contentType: 'social', platform: 'twitter',
    date: d(26, 13, 30), time: '1:30 PM', status: 'Draft',
    title: 'Book Your Cleanup',
    caption: 'Spring cleanup packages available now.',
  },

  // --- Blog posts ---
  {
    id: 'b1', projectId: '2', contentType: 'blog',
    date: d(3, 8, 0), time: '8:00 AM', status: 'Published',
    title: '10 Sustainable Lawn Care Practices',
    caption: 'A comprehensive guide to eco-friendly lawn maintenance that saves water and money.',
  },
  {
    id: 'b2', projectId: '1', contentType: 'blog',
    date: d(7, 9, 0), time: '9:00 AM', status: 'Scheduled',
    title: 'Spring Cleanup Checklist for Homeowners',
    caption: 'Everything you need to prepare your garden for spring — a step-by-step guide.',
  },
  {
    id: 'b3', projectId: '3', contentType: 'blog',
    date: d(12, 11, 0), time: '11:00 AM', status: 'Draft',
    title: 'How Customer Reviews Shape Our Service',
    caption: 'Behind the scenes of how we use customer feedback to constantly improve.',
  },
  {
    id: 'b4', projectId: '4', contentType: 'blog',
    date: d(18, 10, 0), time: '10:00 AM', status: 'Scheduled',
    title: 'Winter Lawn Care Myths Debunked',
    caption: 'Common misconceptions about winter lawn care — and what you should actually do.',
  },
  {
    id: 'b5', projectId: '6', contentType: 'blog',
    date: d(25, 9, 30), time: '9:30 AM', status: 'Scheduled',
    title: 'Pool Maintenance 101 for Summer',
    caption: 'Keep your pool sparkling clean all summer long with these expert tips.',
  },

  // --- FAQ pages ---
  {
    id: 'f1', projectId: '2', contentType: 'faq',
    date: d(5, 9, 0), time: '9:00 AM', status: 'Published',
    title: 'Sustainable Lawn Care FAQ',
    caption: 'Answers to the most common questions about eco-friendly lawn treatments.',
  },
  {
    id: 'f2', projectId: '1', contentType: 'faq',
    date: d(10, 14, 0), time: '2:00 PM', status: 'Scheduled',
    title: 'Spring Cleanup Services FAQ',
    caption: 'Everything customers ask about our spring garden cleanup packages.',
  },
  {
    id: 'f3', projectId: '6', contentType: 'faq',
    date: d(16, 10, 0), time: '10:00 AM', status: 'Draft',
    title: 'Pool Maintenance FAQ',
    caption: 'Common pool maintenance questions answered by our certified technicians.',
  },
  {
    id: 'f4', projectId: '3', contentType: 'faq',
    date: d(22, 15, 0), time: '3:00 PM', status: 'Scheduled',
    title: 'Customer Review Process FAQ',
    caption: 'How we collect, verify and display customer testimonials on our site.',
  },

  // --- Email campaigns ---
  {
    id: 'e1', projectId: '5', contentType: 'email',
    date: d(2, 8, 0), time: '8:00 AM', status: 'Scheduled',
    title: 'New Year Offer — 20% Off All Services',
    caption: 'Exclusive new year discount newsletter to our subscriber list.',
  },
  {
    id: 'e2', projectId: '1', contentType: 'email',
    date: d(8, 7, 0), time: '7:00 AM', status: 'Published',
    title: 'Spring Cleanup Reminder',
    caption: 'Friendly reminder to book spring garden cleanup before slots fill up.',
  },
  {
    id: 'e3', projectId: '4', contentType: 'email',
    date: d(14, 8, 0), time: '8:00 AM', status: 'Scheduled',
    title: 'Winter Lawn Care Tips Newsletter',
    caption: 'Monthly newsletter with winter lawn maintenance advice and service offers.',
  },
  {
    id: 'e4', projectId: '6', contentType: 'email',
    date: d(20, 7, 30), time: '7:30 AM', status: 'Draft',
    title: 'Summer Pool Season Kickoff',
    caption: 'Announce pool maintenance packages and early season discount for subscribers.',
  },
  {
    id: 'e5', projectId: '3', contentType: 'email',
    date: d(27, 8, 0), time: '8:00 AM', status: 'Scheduled',
    title: 'Customer Testimonials Monthly Digest',
    caption: 'Curated collection of our best customer reviews from the past month.',
  },

  // --- Landing pages ---
  {
    id: 'l1', projectId: '1', contentType: 'landing',
    date: d(4, 12, 0), time: '12:00 PM', status: 'Published',
    title: 'Spring Cleanup Landing Page',
    caption: 'High-conversion landing page for spring garden cleanup bookings.',
  },
  {
    id: 'l2', projectId: '5', contentType: 'landing',
    date: d(11, 11, 0), time: '11:00 AM', status: 'Scheduled',
    title: 'New Year Offers Landing Page',
    caption: 'Promotional landing page for all new year service discounts.',
  },
  {
    id: 'l3', projectId: '6', contentType: 'landing',
    date: d(17, 9, 0), time: '9:00 AM', status: 'Draft',
    title: 'Summer Pool Services Page',
    caption: 'Conversion-optimised page for summer pool maintenance bookings.',
  },
  {
    id: 'l4', projectId: '2', contentType: 'landing',
    date: d(23, 10, 0), time: '10:00 AM', status: 'Scheduled',
    title: 'Eco-Friendly Lawn Services',
    caption: 'Landing page targeting eco-conscious homeowners searching for organic options.',
  },
];

// Keep backward-compatible alias so any file importing mockScheduledPosts still compiles.
export const mockScheduledPosts = mockScheduledItems;
