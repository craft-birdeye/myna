/**
 * blockTypes.ts
 *
 * Central type definitions, block catalog, and default content factory
 * for the block-based WYSIWYG editor used by Blog, Landing page, and FAQ.
 */

// ── Block types ────────────────────────────────────────────────────────────────

export type BlockType =
  // ─ Shared ─────────────────────────────────────────────────────────────────
  | 'heading'
  | 'paragraph'
  | 'image'
  | 'divider'
  | 'spacer'
  | 'list'
  | 'quote'
  | 'cta'
  | 'header-nav'
  | 'custom-embed'
  | 'gallery'
  | 'review'
  | 'cta-section'
  // ─ Blog ───────────────────────────────────────────────────────────────────
  | 'author-bar'
  | 'code'
  | 'video-embed'
  | 'table-of-contents'
  | 'key-takeaways'
  | 'related-posts'
  | 'social-share'
  | 'newsletter-signup'
  | 'seo-meta'
  // ─ Landing ────────────────────────────────────────────────────────────────
  | 'hero'
  | 'feature-grid'
  | 'benefits'
  | 'stats-row'
  | 'image-text'
  | 'testimonials'
  | 'logo-strip'
  | 'pricing-table'
  | 'lead-form'
  | 'contact-block'
  | 'map-block'
  | 'review-wall'
  | 'comparison-table'
  | 'process-steps'
  | 'team-grid'
  | 'announcement-bar'
  | 'footer'
  // ─ FAQ ────────────────────────────────────────────────────────────────────
  | 'faq-section'
  | 'faq-qa';

export type BlockCategory =
  | 'basic'
  | 'text'
  | 'media'
  | 'layout'
  | 'content'
  | 'conversion'
  | 'social-proof'
  | 'blog'
  | 'landing';

export type BlockEditorMode = 'blog' | 'landing' | 'faq';

export interface BlockSettings {
  alignment?: 'left' | 'center' | 'right';
  width?: 'full' | 'contained';
  paddingTop?: 'sm' | 'md' | 'lg';
  paddingBottom?: 'sm' | 'md' | 'lg';
  background?: string;
  anchorId?: string;
  trackingLabel?: string;
  visibility?: {
    desktop?: boolean;
    tablet?: boolean;
    mobile?: boolean;
  };
}

export interface Block {
  id: string;
  type: BlockType;
  /** Type-specific content fields — each block owns its own shape */
  content: Record<string, unknown>;
  /** Visual style fields owned by the inspector. */
  style?: Record<string, unknown>;
  /** Link, submit, visibility, and integration behaviour fields. */
  behavior?: Record<string, unknown>;
  settings: BlockSettings;
}

// ── Props shared by all block renderer components ─────────────────────────────

export interface BlockComponentProps<C extends Record<string, unknown> = Record<string, unknown>> {
  blockId: string;
  content: C;
  style?: Record<string, unknown>;
  behavior?: Record<string, unknown>;
  settings: BlockSettings;
  focused: boolean;
  onChange: (patch: Partial<C>) => void;
}

// ── Catalog ────────────────────────────────────────────────────────────────────

export interface BlockCatalogEntry {
  type: BlockType;
  label: string;
  description: string;
  icon: string;
  category: BlockCategory;
  /** Modes this block appears in. Undefined = all modes. */
  modes?: BlockEditorMode[];
}

export const BLOCK_CATALOG: BlockCatalogEntry[] = [
  // ── Shared basic ───────────────────────────────────────────────────────────
  { type: 'header-nav',   label: 'Header',       description: 'Logo, nav links, and CTA',  icon: '☰',   category: 'basic', modes: ['landing'] },
  { type: 'heading',      label: 'Title',        description: 'H1 / H2 / H3 title',        icon: 'T',   category: 'basic' },
  { type: 'paragraph',    label: 'Text',         description: 'Body text',                 icon: '¶',   category: 'basic' },
  { type: 'cta',          label: 'Button',       description: 'Call-to-action button',     icon: '↗',   category: 'basic' },
  { type: 'image',        label: 'Image',        description: 'Upload or paste a URL',     icon: '▧',   category: 'basic' },
  { type: 'video-embed',  label: 'Video',        description: 'YouTube or Vimeo',          icon: '▶',   category: 'basic' },
  { type: 'list',         label: 'Bullet list',  description: 'Bullet or numbered list',   icon: '☷',   category: 'basic' },
  { type: 'divider',      label: 'Divider',      description: 'Horizontal separator',      icon: '—',   category: 'basic' },
  { type: 'spacer',       label: 'Spacer',       description: 'Responsive vertical space', icon: '━',   category: 'basic' },
  { type: 'faq-section',  label: 'FAQ',          description: 'Grouped category + Q&As',   icon: '?',   category: 'basic', modes: ['blog', 'landing'] },
  // ── Shared content / conversion ────────────────────────────────────────────
  { type: 'quote',        label: 'Quote',        description: 'Pull quote or callout',     icon: '"',   category: 'content' },
  { type: 'custom-embed', label: 'Embed',        description: 'Custom HTML or app embed',  icon: '<>',  category: 'media' },
  { type: 'gallery',      label: 'Gallery',      description: 'Image grid or carousel',    icon: '▦',   category: 'media' },
  { type: 'review',       label: 'Review',       description: 'Single testimonial card',   icon: '★',   category: 'social-proof' },
  { type: 'cta-section',  label: 'CTA section',  description: 'Headline, body and action', icon: '◎',   category: 'conversion' },
  // ── Blog ───────────────────────────────────────────────────────────────────
  { type: 'author-bar',   label: 'Author bar',   description: 'Name · date · tags',        icon: '👤',  category: 'blog', modes: ['blog'] },
  { type: 'table-of-contents', label: 'Table of contents', description: 'Auto-linked article outline', icon: '☰', category: 'blog', modes: ['blog'] },
  { type: 'key-takeaways',label: 'Key takeaways',description: 'Scannable summary bullets', icon: '✓',   category: 'blog', modes: ['blog'] },
  { type: 'code',         label: 'Code block',   description: 'Syntax-highlighted code',   icon: '</>', category: 'blog', modes: ['blog'] },
  { type: 'related-posts',label: 'Related posts',description: 'Recommended article cards', icon: '↔',   category: 'blog', modes: ['blog'] },
  { type: 'social-share', label: 'Social share', description: 'Share links for channels',  icon: '↗',   category: 'blog', modes: ['blog'] },
  { type: 'newsletter-signup', label: 'Newsletter signup', description: 'Email capture form', icon: '@', category: 'blog', modes: ['blog'] },
  { type: 'seo-meta',     label: 'SEO/meta',     description: 'Meta title and description',icon: 'SEO', category: 'blog', modes: ['blog'] },
  // ── Landing ────────────────────────────────────────────────────────────────
  { type: 'hero',         label: 'Hero section', description: 'Headline + sub + CTA',      icon: '★',   category: 'landing', modes: ['landing'] },
  { type: 'feature-grid', label: 'Feature grid', description: '2–4 feature cards',         icon: '⊞',   category: 'landing', modes: ['landing'] },
  { type: 'benefits',     label: 'Benefits',     description: 'Benefit rows or cards',     icon: '✓',   category: 'landing', modes: ['landing'] },
  { type: 'stats-row',    label: 'Stats row',    description: 'Key numbers side by side',  icon: '📊',  category: 'landing', modes: ['landing'] },
  { type: 'image-text',   label: 'Image + text', description: 'Side-by-side layout',       icon: '⬚T',  category: 'landing', modes: ['landing'] },
  { type: 'logo-strip',   label: 'Logo strip',   description: 'Customer or partner logos', icon: '▤',   category: 'social-proof', modes: ['landing'] },
  { type: 'pricing-table',label: 'Pricing table',description: 'Plan cards with features',  icon: '$',   category: 'conversion', modes: ['landing'] },
  { type: 'lead-form',    label: 'Lead form',    description: 'Fields and submit action',  icon: '□',   category: 'conversion', modes: ['landing'] },
  { type: 'contact-block',label: 'Contact block',description: 'Address, phone and hours',  icon: '☎',   category: 'conversion', modes: ['landing'] },
  { type: 'map-block',    label: 'Map/location', description: 'Map embed and directions',  icon: '⌖',   category: 'conversion', modes: ['landing'] },
  { type: 'testimonials', label: 'Testimonials', description: 'Customer review cards',     icon: '⭐',  category: 'social-proof', modes: ['landing'] },
  { type: 'review-wall',  label: 'Review wall',  description: 'Curated review cards',      icon: '★★',  category: 'social-proof', modes: ['landing'] },
  { type: 'comparison-table', label: 'Comparison table', description: 'Compare plans or options', icon: '▥', category: 'landing', modes: ['landing'] },
  { type: 'process-steps',label: 'Process steps',description: 'Numbered workflow steps',   icon: '①',   category: 'landing', modes: ['landing'] },
  { type: 'team-grid',    label: 'Team grid',    description: 'People profile cards',      icon: '◉',   category: 'landing', modes: ['landing'] },
  { type: 'announcement-bar', label: 'Announcement', description: 'Dismissible banner',    icon: '!',   category: 'landing', modes: ['landing'] },
  { type: 'footer',       label: 'Footer',       description: 'Links, social and legal',   icon: '▔',   category: 'landing', modes: ['landing'] },
  // ── FAQ ────────────────────────────────────────────────────────────────────
  { type: 'faq-section',  label: 'FAQ section',  description: 'Grouped category + Q&As',   icon: '📂',  category: 'content', modes: ['faq'] },
  { type: 'faq-qa',       label: 'Q&A pair',     description: 'Single question + answer',  icon: '❓',  category: 'content', modes: ['faq'] },
];

// Blocks visible in a given mode (shared + mode-specific)
export function catalogForMode(mode: BlockEditorMode): BlockCatalogEntry[] {
  return BLOCK_CATALOG.filter(b => !b.modes || b.modes.includes(mode));
}

// ── Default content factory ────────────────────────────────────────────────────

export function defaultContent(type: BlockType): Record<string, unknown> {
  switch (type) {
    case 'heading':
      return { text: '', level: 'h2' };
    case 'paragraph':
      return { text: '' };
    case 'list':
      return { items: [''], ordered: false };
    case 'quote':
      return { text: '', attribution: '' };
    case 'cta':
      return { label: 'Book now', url: '', variant: 'primary' };
    case 'header-nav':
      return { logo: 'Brand', links: ['Services', 'Reviews', 'Contact'], ctaLabel: 'Book now', ctaUrl: '' };
    case 'image':
      return { src: '', alt: '', caption: '', objectFit: 'cover' };
    case 'divider':
      return {};
    case 'spacer':
      return { height: 48, tabletHeight: 40, mobileHeight: 32 };
    case 'custom-embed':
      return { title: 'Embedded content', embedCode: '', height: 320 };
    case 'gallery':
      return { images: [{ src: '', alt: '', caption: '' }], layout: 'grid' };
    case 'review':
      return { quote: 'Add a customer quote here.', author: 'Customer name', rating: 5, source: 'Google' };
    case 'cta-section':
      return { headline: 'Ready to get started?', body: 'Give customers a clear next step.', ctaLabel: 'Book now', ctaUrl: '' };
    case 'author-bar':
      return { name: '', date: new Date().toISOString().split('T')[0], tags: [] };
    case 'table-of-contents':
      return { title: 'In this article', sticky: false };
    case 'key-takeaways':
      return { title: 'Key takeaways', items: [''] };
    case 'code':
      return { language: 'javascript', code: '' };
    case 'video-embed':
      return { url: '', caption: '' };
    case 'related-posts':
      return { title: 'Related posts', posts: [{ title: '', url: '' }], cardCount: 3 };
    case 'social-share':
      return { label: 'Share this article', channels: ['LinkedIn', 'Facebook', 'X'] };
    case 'newsletter-signup':
      return { headline: 'Get local marketing insights', helperText: 'Monthly tips, no spam.', buttonLabel: 'Subscribe', submitAction: 'email' };
    case 'seo-meta':
      return { metaTitle: '', metaDescription: '', slug: '', canonicalUrl: '' };
    case 'hero':
      return { headline: '', subheadline: '', ctaLabel: 'Get started', ctaUrl: '', imageSrc: '', imageAlt: '', imagePosition: 'none' };
    case 'feature-grid':
      return {
        features: [
          { icon: '⚡', title: '', description: '' },
          { icon: '🎯', title: '', description: '' },
          { icon: '✨', title: '', description: '' },
        ],
      };
    case 'benefits':
      return { title: 'Why customers choose us', benefits: [{ title: '', description: '' }, { title: '', description: '' }, { title: '', description: '' }] };
    case 'stats-row':
      return {
        stats: [
          { value: '', label: '' },
          { value: '', label: '' },
          { value: '', label: '' },
        ],
      };
    case 'image-text':
      return { src: '', alt: '', headline: '', body: '', imagePosition: 'left' };
    case 'logo-strip':
      return { title: 'Trusted by local teams', logos: [{ name: 'Acme' }, { name: 'Northstar' }, { name: 'Summit' }], grayscale: true };
    case 'pricing-table':
      return { plans: [{ name: 'Starter', price: '$99', features: ['Core features'], ctaLabel: 'Choose plan', highlighted: true }] };
    case 'lead-form':
      return { headline: 'Request a consultation', helperText: 'We will get back to you within one business day.', fields: [{ label: 'Name', type: 'text', required: true }, { label: 'Email', type: 'email', required: true }], buttonLabel: 'Submit', successMessage: 'Thanks, we will be in touch.' };
    case 'contact-block':
      return { title: 'Contact us', address: '123 Main Street', phone: '(555) 010-0100', email: 'hello@example.com', hours: 'Mon-Fri, 9am-5pm' };
    case 'map-block':
      return { address: '123 Main Street', mapUrl: '', directionsUrl: '' };
    case 'testimonials':
      return { items: [{ quote: '', author: '', role: '' }] };
    case 'review-wall':
      return { title: 'What customers are saying', reviews: [{ quote: '', author: '', rating: 5, source: 'Google' }] };
    case 'comparison-table':
      return { title: 'Compare options', columns: ['You', 'Alternative'], rows: [{ label: 'Feature', values: ['Included', 'Limited'] }] };
    case 'process-steps':
      return { title: 'How it works', steps: [{ title: 'Step one', description: '' }, { title: 'Step two', description: '' }, { title: 'Step three', description: '' }] };
    case 'team-grid':
      return { title: 'Meet the team', people: [{ name: '', role: '', bio: '' }] };
    case 'announcement-bar':
      return { message: 'Limited-time offer', ctaLabel: 'Learn more', ctaUrl: '', dismissible: true };
    case 'footer':
      return { brand: 'Brand', columns: [{ title: 'Company', links: ['About', 'Contact'] }], legalText: '© 2026 Brand. All rights reserved.' };
    case 'faq-section':
      return { title: 'General questions', items: [{ id: crypto.randomUUID(), question: '', answer: '' }] };
    case 'faq-qa':
      return { question: '', answer: '' };
    default:
      return {};
  }
}
