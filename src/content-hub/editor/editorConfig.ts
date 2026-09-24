/**
 * Per-mode configuration for the unified ContentEditorShell.
 *
 * Each mode drives:
 *  - The AI copilot question sequence (left panel, AI tab)
 *  - The manual form fields (left panel, Manual tab)
 *  - The score panel dimensions + labels (right panel)
 *  - Default card type(s) seeded into the canvas on creation
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type ContentMode =
  | 'project'
  | 'blog'
  | 'social'
  | 'email'
  | 'faq'
  | 'landing'
  | 'video';

export type ContentItemType =
  | 'blog'
  | 'social'
  | 'email'
  | 'faq'
  | 'landing'
  | 'video';

export interface EditorTemplate {
  id: string;
  title: string;
  emoji: string;
  typesLabel: string;
  /** HSL hue for gradient preview card */
  hue: number;
  /** Secondary hue for gradient stop */
  hue2: number;
}

export interface CopilotQuestion {
  id: string;
  question: string;
  inputType: 'text' | 'chips' | 'multiselect';
  chips?: string[];
  placeholder?: string;
}

export interface ManualField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  placeholder?: string;
  options?: string[];
}

export interface ScoreDimension {
  label: string;
  score: number;    // 0–100 mock value shown in right panel
  color: 'green' | 'orange' | 'red';
  description?: string;
}

export interface QuickWin {
  label: string;
  description: string;
  action: string;
}

export interface EditorConfig {
  label: string;
  pluralLabel: string;
  /** Lucide icon name (string, resolved in components) */
  iconName: string;
  copilotGreeting: string;
  copilotQuestions: CopilotQuestion[];
  manualFields: ManualField[];
  scoreDimensions: ScoreDimension[];
  quickWins: QuickWin[];
  /** For project mode: which content types appear in "Add content" menu */
  addableTypes?: ContentItemType[];
  /** Template cards shown in the empty canvas "Select from library" section */
  templates: EditorTemplate[];
}

// ── Configs ───────────────────────────────────────────────────────────────────

export const EDITOR_CONFIGS: Record<ContentMode, EditorConfig> = {

  project: {
    label: 'Project',
    pluralLabel: 'Projects',
    iconName: 'FolderPlus',
    copilotGreeting: "Hey there! 👋 Let's build your content project. I'll ask a few quick questions.",
    copilotQuestions: [
      {
        id: 'goal',
        question: "What's the main goal for this project?",
        inputType: 'text',
        placeholder: 'e.g. Drive awareness of our spring outdoor seating…',
      },
      {
        id: 'audience',
        question: "Who's your target audience?",
        inputType: 'chips',
        chips: ['Local customers', 'New visitors', 'Loyal regulars', 'Business owners', 'Families'],
      },
      {
        id: 'content_types',
        question: 'Which content types do you want to include?',
        inputType: 'multiselect',
        chips: ['Blog post', 'Social post', 'Email campaign', 'FAQ page', 'Landing page', 'Video post'],
      },
      {
        id: 'duration',
        question: "What's the campaign duration?",
        inputType: 'chips',
        chips: ['1 week', '2 weeks', '1 month', '3 months', 'Ongoing'],
      },
      {
        id: 'locations',
        question: 'Which locations should this target?',
        inputType: 'chips',
        chips: ['All locations', 'Select specific locations', 'Top 10 locations'],
      },
    ],
    manualFields: [
      { id: 'name',     label: 'Project name',    type: 'text',     placeholder: 'e.g. Spring promotion — Olive Garden' },
      { id: 'goal',     label: 'Campaign goal',   type: 'textarea', placeholder: 'Describe the outcome you want…' },
      { id: 'audience', label: 'Target audience', type: 'text',     placeholder: 'e.g. Local families, new visitors' },
      { id: 'duration', label: 'Duration',        type: 'select',   options: ['1 week', '2 weeks', '1 month', '3 months', 'Ongoing'] },
    ],
    scoreDimensions: [
      { label: 'Brand voice',        score: 91, color: 'green'  },
      { label: 'Factual accuracy',   score: 88, color: 'green'  },
      { label: 'Content readability',score: 85, color: 'green'  },
      { label: 'Originality',        score: 74, color: 'orange' },
    ],
    quickWins: [
      { label: 'Add location keywords', description: 'Mention 2–3 city names to lift local citation probability.', action: 'Make it local' },
      { label: 'Expand short answers',  description: 'Answers under 40 words rank lower in AI-generated summaries.', action: 'Expand answers' },
    ],
    addableTypes: ['blog', 'social', 'email', 'faq', 'landing', 'video'],
    templates: [
      { id: 'p-new-product',   title: 'New product launch',          emoji: '🚀', typesLabel: 'Social posts & 5 more',  hue: 160, hue2: 190 },
      { id: 'p-customer',      title: 'Customer stories & reviews',   emoji: '⭐', typesLabel: 'Social posts & 5 more',  hue: 260, hue2: 290 },
      { id: 'p-seasonal',      title: 'Seasonal promotion',           emoji: '🎃', typesLabel: 'Social posts & 5 more',  hue: 120, hue2: 80  },
      { id: 'p-brand',         title: 'Brand awareness campaign',     emoji: '🌿', typesLabel: 'Social posts & 5 more',  hue: 140, hue2: 100 },
      { id: 'p-loyalty',       title: 'Loyalty program launch',       emoji: '🎁', typesLabel: 'Email & 4 more',         hue: 30,  hue2: 10  },
      { id: 'p-grand-opening', title: 'Grand opening / re-launch',    emoji: '🎉', typesLabel: 'Social posts & 5 more',  hue: 340, hue2: 20  },
    ],
  },

  blog: {
    label: 'Blog post',
    pluralLabel: 'Blog posts',
    iconName: 'FileText',
    copilotGreeting: "Let's write a great blog post. A few quick questions first.",
    copilotQuestions: [
      {
        id: 'topic',
        question: "What's the topic or title idea?",
        inputType: 'text',
        placeholder: 'e.g. How local businesses can use AI to respond to reviews…',
      },
      {
        id: 'tone',
        question: 'What tone should the post have?',
        inputType: 'chips',
        chips: ['Educational', 'Thought leadership', 'How-to guide', 'News & updates', 'Storytelling'],
      },
      {
        id: 'audience',
        question: 'Who is this blog post for?',
        inputType: 'chips',
        chips: ['Existing customers', 'Prospects', 'Industry peers', 'General public'],
      },
      {
        id: 'length',
        question: 'Roughly how long should it be?',
        inputType: 'chips',
        chips: ['Short (300–500 words)', 'Medium (700–1,000 words)', 'Long (1,500+ words)'],
      },
    ],
    manualFields: [
      { id: 'title',    label: 'Title',            type: 'text',     placeholder: 'Enter a blog post title…' },
      { id: 'topic',    label: 'Topic / angle',    type: 'textarea', placeholder: 'What should this post cover?' },
      { id: 'tone',     label: 'Tone',             type: 'select',   options: ['Educational', 'Thought leadership', 'How-to guide', 'News & updates'] },
      { id: 'keywords', label: 'Target keywords',  type: 'text',     placeholder: 'e.g. local SEO, review management' },
    ],
    scoreDimensions: [
      { label: 'Intent Match',         score: 88, color: 'green'  },
      { label: 'Search Visibility',    score: 82, color: 'green'  },
      { label: 'Content Depth',        score: 85, color: 'green'  },
      { label: 'Brand Alignment',      score: 90, color: 'green'  },
      { label: 'Publishing Readiness', score: 75, color: 'orange' },
    ],
    quickWins: [
      { label: 'Add internal links',  description: 'Add 2+ internal links to boost SEO authority.', action: 'Add links' },
      { label: 'Add an FAQ section',  description: 'FAQ sections increase AEO score by up to 20%.', action: 'Add FAQ' },
    ],
    addableTypes: ['blog'],
    templates: [
      { id: 'b-seo-tips',    title: 'Local SEO tips for restaurants',   emoji: '🔍', typesLabel: 'Blog post',  hue: 200, hue2: 220 },
      { id: 'b-ai-reviews',  title: 'AI-powered review responses',       emoji: '🤖', typesLabel: 'Blog post',  hue: 250, hue2: 280 },
      { id: 'b-guest-exp',   title: 'Improving the guest experience',    emoji: '🍽️', typesLabel: 'Blog post',  hue: 30,  hue2: 50  },
      { id: 'b-sustainability', title: 'Our sustainability commitment',  emoji: '🌱', typesLabel: 'Blog post',  hue: 130, hue2: 160 },
    ],
  },

  social: {
    label: 'Social post',
    pluralLabel: 'Social posts',
    iconName: 'Share2',
    copilotGreeting: "Let's craft a social post that gets engagement.",
    copilotQuestions: [
      {
        id: 'platform',
        question: 'Which platform is this for?',
        inputType: 'chips',
        chips: ['Instagram', 'Facebook', 'LinkedIn', 'X (Twitter)', 'All platforms'],
      },
      {
        id: 'message',
        question: "What's the core message or announcement?",
        inputType: 'text',
        placeholder: 'e.g. Announce our new outdoor seating this spring…',
      },
      {
        id: 'cta',
        question: 'What action should people take?',
        inputType: 'chips',
        chips: ['Visit us', 'Book a table', 'Learn more', 'Share this', 'Tag a friend'],
      },
      {
        id: 'tone',
        question: 'What vibe?',
        inputType: 'chips',
        chips: ['Casual & friendly', 'Professional', 'Exciting & urgent', 'Informative'],
      },
    ],
    manualFields: [
      { id: 'platform', label: 'Platform',       type: 'select',   options: ['Instagram', 'Facebook', 'LinkedIn', 'X (Twitter)'] },
      { id: 'caption',  label: 'Caption',         type: 'textarea', placeholder: 'Write your post caption…' },
      { id: 'hashtags', label: 'Hashtags',        type: 'text',     placeholder: '#localbusiness #restaurant' },
      { id: 'cta',      label: 'Call to action',  type: 'text',     placeholder: 'e.g. Book now at the link in bio' },
    ],
    scoreDimensions: [
      { label: 'Brand voice',         score: 88, color: 'green'  },
      { label: 'Engagement potential',score: 84, color: 'green'  },
      { label: 'Platform fit',        score: 79, color: 'orange' },
      { label: 'Hashtag quality',     score: 76, color: 'orange' },
    ],
    quickWins: [
      { label: 'Improve hashtags',    description: 'Use 5–10 niche hashtags for better reach on Instagram.', action: 'Suggest hashtags' },
      { label: 'Add a stronger hook', description: 'First line determines if people stop scrolling.', action: 'Rewrite hook' },
    ],
    addableTypes: ['social'],
    templates: [
      { id: 's-new-product',  title: 'New product launch post',    emoji: '🚀', typesLabel: 'Social post', hue: 160, hue2: 190 },
      { id: 's-behind',       title: 'Behind the scenes',          emoji: '📸', typesLabel: 'Social post', hue: 260, hue2: 300 },
      { id: 's-promo',        title: 'Flash sale promotion',       emoji: '⚡', typesLabel: 'Social post', hue: 40,  hue2: 20  },
      { id: 's-community',    title: 'Community spotlight',        emoji: '🤝', typesLabel: 'Social post', hue: 190, hue2: 210 },
    ],
  },

  email: {
    label: 'Email campaign',
    pluralLabel: 'Email campaigns',
    iconName: 'Mail',
    copilotGreeting: "Let's create an email your subscribers will actually open.",
    copilotQuestions: [
      {
        id: 'subject',
        question: "What's the subject line idea?",
        inputType: 'text',
        placeholder: 'e.g. Your table is waiting this spring…',
      },
      {
        id: 'segment',
        question: "Who's this going to?",
        inputType: 'chips',
        chips: ['All subscribers', 'Loyal customers', 'Lapsed customers', 'New sign-ups'],
      },
      {
        id: 'goal',
        question: "What's the goal?",
        inputType: 'chips',
        chips: ['Drive reservations', 'Announce a promotion', 'Share an update', 'Re-engage customers'],
      },
      {
        id: 'tone',
        question: 'What tone?',
        inputType: 'chips',
        chips: ['Warm & personal', 'Promotional', 'Informative', 'Urgent'],
      },
    ],
    manualFields: [
      { id: 'subject',      label: 'Subject line',  type: 'text',     placeholder: 'Enter subject line…' },
      { id: 'preview_text', label: 'Preview text',  type: 'text',     placeholder: 'Short preview shown in inbox…' },
      { id: 'segment',      label: 'Audience',      type: 'select',   options: ['All subscribers', 'Loyal customers', 'Lapsed customers', 'New sign-ups'] },
      { id: 'goal',         label: 'Campaign goal', type: 'text',     placeholder: 'e.g. Drive reservation bookings' },
    ],
    scoreDimensions: [
      { label: 'Subject line strength', score: 86, color: 'green'  },
      { label: 'CTA clarity',           score: 82, color: 'green'  },
      { label: 'Deliverability',        score: 78, color: 'orange' },
      { label: 'Personalization',       score: 84, color: 'green'  },
    ],
    quickWins: [
      { label: 'Add personalization', description: 'Emails with first names in subject get 26% more opens.', action: 'Personalize' },
      { label: 'Strengthen CTA',      description: 'Use action verbs — "Reserve your table" beats "Click here".', action: 'Rewrite CTA' },
    ],
    addableTypes: ['email'],
    templates: [
      { id: 'e-welcome',      title: 'Welcome series — new guests',  emoji: '👋', typesLabel: 'Email', hue: 200, hue2: 220 },
      { id: 'e-reservation',  title: 'Reservation reminder',         emoji: '📅', typesLabel: 'Email', hue: 340, hue2: 360 },
      { id: 'e-re-engage',    title: 'Win-back: lapsed customers',   emoji: '💌', typesLabel: 'Email', hue: 280, hue2: 310 },
      { id: 'e-promo',        title: 'Seasonal promo announcement',  emoji: '🌸', typesLabel: 'Email', hue: 330, hue2: 10  },
    ],
  },

  faq: {
    label: 'FAQ page',
    pluralLabel: 'FAQ pages',
    iconName: 'MessageSquare',
    copilotGreeting: "Let's build an FAQ page that answers your customers and ranks in AI search.",
    copilotQuestions: [
      {
        id: 'product',
        question: 'What is this FAQ page about?',
        inputType: 'chips',
        chips: ['Restaurant dining', 'Landscaping', 'Real estate', 'Healthcare', 'Home services', 'Salon & beauty', 'Retail'],
        placeholder: 'or describe your business…',
      },
      {
        id: 'audience',
        question: 'Who is your target audience?',
        inputType: 'chips',
        chips: ['Local customers', 'Homeowners', 'Families', 'Business owners', 'First-time buyers'],
        placeholder: 'or type your audience…',
      },
      {
        id: 'topics',
        question: 'What topics should the FAQ cover?',
        inputType: 'multiselect',
        chips: ['Pricing', 'Booking & availability', 'Services offered', 'Cancellations', 'Hours & location', 'Dietary options'],
      },
      {
        id: 'tone',
        question: 'What tone should the answers use?',
        inputType: 'chips',
        chips: ['Friendly & conversational', 'Professional', 'Concise & direct', 'Authoritative'],
      },
      {
        id: 'count',
        question: 'How many FAQ items do you need?',
        inputType: 'chips',
        chips: ['5', '10', '15', '20', '30+'],
      },
      {
        id: 'locations',
        question: 'Which locations should be referenced?',
        inputType: 'chips',
        chips: ['All locations', 'Select specific', 'Skip'],
      },
    ],
    manualFields: [
      { id: 'title',     label: 'Page title',            type: 'text',     placeholder: 'e.g. Frequently asked questions' },
      { id: 'product',   label: 'Topic / business type', type: 'text',     placeholder: 'What is this FAQ about?' },
      { id: 'audience',  label: 'Target audience',       type: 'text',     placeholder: 'e.g. Local homeowners' },
      { id: 'topics',    label: 'Topics to cover',       type: 'textarea', placeholder: 'e.g. Pricing, booking, cancellations…' },
      { id: 'tone',      label: 'Tone',                  type: 'select',   options: ['Friendly & conversational', 'Professional', 'Concise & direct', 'Authoritative'] },
    ],
    scoreDimensions: [
      { label: 'Intent Match',         score: 90, color: 'green'  },
      { label: 'Search Visibility',    score: 74, color: 'orange' },
      { label: 'Content Depth',        score: 88, color: 'green'  },
      { label: 'Brand Alignment',      score: 82, color: 'green'  },
      { label: 'Publishing Readiness', score: 78, color: 'orange' },
    ],
    quickWins: [
      { label: 'Add location keywords', description: 'Mention city names in 2–3 answers to lift local citation probability.', action: 'Make it local' },
      { label: 'Expand short answers',  description: 'Answers under 40 words rank lower in AI-generated summaries.', action: 'Expand answers' },
    ],
    addableTypes: ['faq'],
    templates: [
      { id: 'f-restaurant',   title: 'Restaurant dining FAQ',        emoji: '🍽️', typesLabel: 'FAQ page', hue: 160, hue2: 190 },
      { id: 'f-reservations', title: 'Reservations & bookings FAQ',  emoji: '📋', typesLabel: 'FAQ page', hue: 210, hue2: 240 },
      { id: 'f-menu',         title: 'Menu & dietary options FAQ',   emoji: '🥗', typesLabel: 'FAQ page', hue: 120, hue2: 150 },
      { id: 'f-locations',    title: 'Locations & hours FAQ',        emoji: '📍', typesLabel: 'FAQ page', hue: 30,  hue2: 55  },
    ],
  },

  landing: {
    label: 'Landing page',
    pluralLabel: 'Landing pages',
    iconName: 'Monitor',
    copilotGreeting: "Let's build a landing page that converts visitors into customers.",
    copilotQuestions: [
      {
        id: 'goal',
        question: 'What should visitors do on this page?',
        inputType: 'chips',
        chips: ['Book a table', 'Sign up', 'Learn more', 'Make a purchase', 'Get directions'],
      },
      {
        id: 'headline',
        question: "What's the main value proposition?",
        inputType: 'text',
        placeholder: 'e.g. Fresh ingredients, local sourcing, great service…',
      },
      {
        id: 'location',
        question: 'Is this for a specific location?',
        inputType: 'chips',
        chips: ['All locations', 'Specific location'],
      },
      {
        id: 'tone',
        question: 'What tone?',
        inputType: 'chips',
        chips: ['Warm & inviting', 'Bold & promotional', 'Clean & minimal'],
      },
    ],
    manualFields: [
      { id: 'headline',    label: 'Headline',           type: 'text',     placeholder: 'Main page headline…' },
      { id: 'subheadline', label: 'Subheadline',        type: 'text',     placeholder: 'Supporting text below headline…' },
      { id: 'cta',         label: 'CTA button text',    type: 'text',     placeholder: 'e.g. Book your table now' },
      { id: 'goal',        label: 'Page goal',          type: 'select',   options: ['Book a table', 'Sign up', 'Learn more', 'Make a purchase'] },
    ],
    scoreDimensions: [
      { label: 'Headline clarity', score: 87, color: 'green'  },
      { label: 'CTA strength',     score: 76, color: 'orange' },
      { label: 'Brand voice',      score: 90, color: 'green'  },
      { label: 'SEO optimization', score: 73, color: 'orange' },
    ],
    quickWins: [
      { label: 'Strengthen the CTA',    description: 'Action-oriented CTAs convert 2× better than generic "Click here".', action: 'Rewrite CTA' },
      { label: 'Add social proof',      description: 'Include a review quote or star rating above the fold.', action: 'Add proof' },
    ],
    addableTypes: ['landing'],
    templates: [
      { id: 'l-spring',    title: 'Spring dining experience',    emoji: '🌸', typesLabel: 'Landing page', hue: 330, hue2: 10  },
      { id: 'l-catering',  title: 'Catering & events page',      emoji: '🎊', typesLabel: 'Landing page', hue: 280, hue2: 310 },
      { id: 'l-promo',     title: 'Limited-time offer page',     emoji: '⏰', typesLabel: 'Landing page', hue: 40,  hue2: 20  },
      { id: 'l-local',     title: 'Location-specific page',      emoji: '📍', typesLabel: 'Landing page', hue: 190, hue2: 210 },
    ],
  },

  video: {
    label: 'Video post',
    pluralLabel: 'Video posts',
    iconName: 'Video',
    copilotGreeting: "Let's plan a video post your audience will watch to the end.",
    copilotQuestions: [
      {
        id: 'platform',
        question: 'Where will this video be posted?',
        inputType: 'chips',
        chips: ['YouTube', 'Instagram Reels', 'TikTok', 'Facebook', 'LinkedIn'],
      },
      {
        id: 'topic',
        question: "What's the video about?",
        inputType: 'text',
        placeholder: 'e.g. Behind-the-scenes kitchen tour…',
      },
      {
        id: 'length',
        question: 'Roughly how long?',
        inputType: 'chips',
        chips: ['Under 60 seconds', '1–3 minutes', '5–10 minutes', '10+ minutes'],
      },
      {
        id: 'tone',
        question: 'What vibe?',
        inputType: 'chips',
        chips: ['Fun & energetic', 'Educational', 'Emotional & story-driven', 'Professional'],
      },
    ],
    manualFields: [
      { id: 'title',       label: 'Video title',    type: 'text',     placeholder: 'e.g. Behind the scenes at Olive Garden' },
      { id: 'description', label: 'Description',    type: 'textarea', placeholder: 'Video description / script outline…' },
      { id: 'platform',    label: 'Platform',       type: 'select',   options: ['YouTube', 'Instagram Reels', 'TikTok', 'Facebook', 'LinkedIn'] },
      { id: 'length',      label: 'Target length',  type: 'select',   options: ['Under 60 seconds', '1–3 minutes', '5–10 minutes', '10+ minutes'] },
    ],
    scoreDimensions: [
      { label: 'Title SEO',          score: 83, color: 'green'  },
      { label: 'Description quality',score: 77, color: 'orange' },
      { label: 'Engagement hooks',   score: 85, color: 'green'  },
      { label: 'Platform fit',       score: 80, color: 'orange' },
    ],
    quickWins: [
      { label: 'Improve title SEO',     description: 'Add target keyword in first 60 characters of title.', action: 'Optimize title' },
      { label: 'Add chapter timestamps', description: 'Chapters improve watch time by up to 40% on YouTube.', action: 'Add chapters' },
    ],
    addableTypes: ['video'],
    templates: [
      { id: 'v-behind',   title: 'Behind the scenes kitchen',   emoji: '🎬', typesLabel: 'Video post', hue: 200, hue2: 230 },
      { id: 'v-tutorial', title: 'How-to recipe tutorial',      emoji: '👨‍🍳', typesLabel: 'Video post', hue: 30,  hue2: 50  },
      { id: 'v-story',    title: 'Customer story spotlight',    emoji: '💬', typesLabel: 'Video post', hue: 260, hue2: 290 },
      { id: 'v-tour',     title: 'Restaurant location tour',    emoji: '🏡', typesLabel: 'Video post', hue: 150, hue2: 170 },
    ],
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Map a content item type to its display label */
export const ITEM_TYPE_LABEL: Record<ContentItemType, string> = {
  blog:    'Blog post',
  social:  'Social post',
  email:   'Email campaign',
  faq:     'FAQ page',
  landing: 'Landing page',
  video:   'Video post',
};

/** Map a content item type to its lucide icon name */
export const ITEM_TYPE_ICON: Record<ContentItemType, string> = {
  blog:    'FileText',
  social:  'Share2',
  email:   'Mail',
  faq:     'MessageSquare',
  landing: 'Monitor',
  video:   'Video',
};

/** Score color thresholds (shared with MiniScoreRing) */
export function scoreColor(score: number): string {
  if (score >= 85) return '#4CAE3D';
  if (score >= 70) return '#D97706';
  return '#DC2626';
}
