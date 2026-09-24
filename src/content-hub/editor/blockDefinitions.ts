import { type BlockCategory, type BlockEditorMode, type BlockType } from './blockTypes';

export type InspectorControl =
  | 'text'
  | 'textarea'
  | 'url'
  | 'select'
  | 'segmented'
  | 'color'
  | 'number'
  | 'image'
  | 'slider'
  | 'toggle'
  | 'repeater'
  | 'alignment'
  | 'spacing'
  | 'link';

export interface InspectorOption {
  label: string;
  value: string | number | boolean;
}

export interface InspectorField {
  id: string;
  label: string;
  path: string;
  control: InspectorControl;
  placeholder?: string;
  options?: InspectorOption[];
  min?: number;
  max?: number;
  step?: number;
  itemLabel?: string;
  itemFields?: InspectorField[];
}

export interface InspectorGroup {
  id: 'content' | 'layout' | 'style' | 'behavior' | 'advanced';
  label: string;
  fields: InspectorField[];
}

export interface BlockDefinition {
  type: BlockType;
  label: string;
  icon: string;
  category: BlockCategory;
  modes?: BlockEditorMode[];
  supportsGenericSettings?: boolean;
  inspector: InspectorGroup[];
}

const alignOptions: InspectorOption[] = [
  { label: 'Left', value: 'left' },
  { label: 'Center', value: 'center' },
  { label: 'Right', value: 'right' },
];

const widthOptions: InspectorOption[] = [
  { label: 'Contained', value: 'contained' },
  { label: 'Full', value: 'full' },
];

const spacingOptions: InspectorOption[] = [
  { label: 'Small', value: 'sm' },
  { label: 'Medium', value: 'md' },
  { label: 'Large', value: 'lg' },
];

const colorOptions: InspectorOption[] = [
  { label: 'Default', value: '' },
  { label: 'Primary', value: 'primary' },
  { label: 'Muted', value: 'muted' },
  { label: 'Accent', value: 'accent' },
  { label: 'Dark', value: 'dark' },
];

const buttonVariantOptions: InspectorOption[] = [
  { label: 'Primary', value: 'primary' },
  { label: 'Secondary', value: 'secondary' },
  { label: 'Outline', value: 'outline' },
];

const basicLayoutGroup: InspectorGroup = {
  id: 'layout',
  label: 'Layout',
  fields: [
    { id: 'width', label: 'Width', path: 'settings.width', control: 'segmented', options: widthOptions },
    { id: 'paddingTop', label: 'Padding top', path: 'settings.paddingTop', control: 'segmented', options: spacingOptions },
    { id: 'paddingBottom', label: 'Padding bottom', path: 'settings.paddingBottom', control: 'segmented', options: spacingOptions },
  ],
};

const advancedGroup: InspectorGroup = {
  id: 'advanced',
  label: 'Advanced',
  fields: [
    { id: 'anchorId', label: 'Anchor ID', path: 'settings.anchorId', control: 'text', placeholder: 'section-id' },
    { id: 'trackingLabel', label: 'Tracking label', path: 'settings.trackingLabel', control: 'text', placeholder: 'Analytics label' },
    { id: 'visibleDesktop', label: 'Show on desktop', path: 'settings.visibility.desktop', control: 'toggle' },
    { id: 'visibleTablet', label: 'Show on tablet', path: 'settings.visibility.tablet', control: 'toggle' },
    { id: 'visibleMobile', label: 'Show on mobile', path: 'settings.visibility.mobile', control: 'toggle' },
  ],
};

const linkBehaviorGroup: InspectorGroup = {
  id: 'behavior',
  label: 'Behavior',
  fields: [
    { id: 'url', label: 'URL', path: 'content.url', control: 'url', placeholder: 'https://...' },
    { id: 'openInNewTab', label: 'Open in new tab', path: 'behavior.openInNewTab', control: 'toggle' },
  ],
};

function textLike(label: string, type: BlockType, contentPath = 'content.text'): BlockDefinition {
  return {
    type,
    label,
    icon: type === 'heading' ? 'T' : 'P',
    category: 'basic',
    supportsGenericSettings: true,
    inspector: [
      {
        id: 'content',
        label: 'Content',
        fields: [
          { id: 'text', label, path: contentPath, control: type === 'paragraph' ? 'textarea' : 'text' },
          ...(type === 'heading'
            ? [{ id: 'level', label: 'Level', path: 'content.level', control: 'segmented' as const, options: [
              { label: 'H1', value: 'h1' },
              { label: 'H2', value: 'h2' },
              { label: 'H3', value: 'h3' },
            ] }]
            : []),
        ],
      },
      {
        id: 'style',
        label: 'Style',
        fields: [
          { id: 'align', label: 'Alignment', path: 'content.align', control: 'alignment', options: alignOptions },
          { id: 'textColor', label: 'Text color', path: 'style.textColor', control: 'color', options: colorOptions },
          { id: 'maxWidth', label: 'Max width', path: 'style.maxWidth', control: 'select', options: [
            { label: 'Small', value: 'sm' },
            { label: 'Medium', value: 'md' },
            { label: 'Large', value: 'lg' },
            { label: 'Full', value: 'full' },
          ] },
        ],
      },
      basicLayoutGroup,
      advancedGroup,
    ],
  };
}

const repeaterTextField = (id: string, label: string): InspectorField => ({
  id,
  label,
  path: id,
  control: 'text',
});

export const BLOCK_DEFINITIONS: Record<BlockType, BlockDefinition> = {
  heading: textLike('Title', 'heading'),
  paragraph: textLike('Text', 'paragraph'),
  list: {
    type: 'list',
    label: 'Bullet list',
    icon: 'List',
    category: 'basic',
    supportsGenericSettings: true,
    inspector: [
      { id: 'content', label: 'Content', fields: [
        { id: 'items', label: 'Items', path: 'content.items', control: 'repeater', itemLabel: 'Item', itemFields: [repeaterTextField('value', 'Text')] },
        { id: 'ordered', label: 'Numbered list', path: 'content.ordered', control: 'toggle' },
      ] },
      { id: 'style', label: 'Style', fields: [
        { id: 'iconStyle', label: 'Icon style', path: 'style.iconStyle', control: 'select', options: [
          { label: 'Bullets', value: 'bullets' },
          { label: 'Checks', value: 'checks' },
          { label: 'Numbers', value: 'numbers' },
        ] },
      ] },
      basicLayoutGroup,
      advancedGroup,
    ],
  },
  cta: {
    type: 'cta',
    label: 'Button',
    icon: 'Button',
    category: 'basic',
    supportsGenericSettings: true,
    inspector: [
      { id: 'content', label: 'Content', fields: [
        { id: 'label', label: 'Label', path: 'content.label', control: 'text', placeholder: 'Book now' },
        { id: 'url', label: 'Hyperlink', path: 'content.url', control: 'url', placeholder: 'https://...' },
      ] },
      { id: 'style', label: 'Style', fields: [
        { id: 'variant', label: 'Variant', path: 'content.variant', control: 'segmented', options: buttonVariantOptions },
        { id: 'size', label: 'Size', path: 'style.size', control: 'segmented', options: [
          { label: 'Small', value: 'sm' },
          { label: 'Medium', value: 'md' },
          { label: 'Large', value: 'lg' },
        ] },
        { id: 'color', label: 'Color', path: 'style.color', control: 'color', options: colorOptions },
        { id: 'radius', label: 'Radius', path: 'style.radius', control: 'slider', min: 0, max: 24, step: 2 },
        { id: 'align', label: 'Alignment', path: 'content.align', control: 'alignment', options: alignOptions },
      ] },
      linkBehaviorGroup,
      advancedGroup,
    ],
  },
  image: {
    type: 'image',
    label: 'Image',
    icon: 'Image',
    category: 'basic',
    supportsGenericSettings: true,
    inspector: [
      { id: 'content', label: 'Content', fields: [
        { id: 'src', label: 'Image', path: 'content.src', control: 'image' },
        { id: 'alt', label: 'Alt text', path: 'content.alt', control: 'text' },
        { id: 'caption', label: 'Caption', path: 'content.caption', control: 'text' },
      ] },
      { id: 'style', label: 'Style', fields: [
        { id: 'align', label: 'Alignment', path: 'style.align', control: 'alignment', options: alignOptions },
        { id: 'width', label: 'Width', path: 'style.width', control: 'segmented', options: widthOptions },
        { id: 'aspectRatio', label: 'Aspect ratio', path: 'style.aspectRatio', control: 'select', options: [
          { label: 'Auto', value: 'auto' },
          { label: '16:9', value: '16/9' },
          { label: '4:3', value: '4/3' },
          { label: 'Square', value: '1/1' },
        ] },
        { id: 'objectFit', label: 'Object fit', path: 'content.objectFit', control: 'segmented', options: [
          { label: 'Cover', value: 'cover' },
          { label: 'Contain', value: 'contain' },
          { label: 'Fill', value: 'fill' },
        ] },
        { id: 'radius', label: 'Corner radius', path: 'style.radius', control: 'slider', min: 0, max: 24, step: 2 },
      ] },
      { id: 'behavior', label: 'Behavior', fields: [
        { id: 'link', label: 'Image link', path: 'behavior.link', control: 'url' },
      ] },
      advancedGroup,
    ],
  },
  divider: {
    type: 'divider',
    label: 'Divider',
    icon: 'Divider',
    category: 'basic',
    inspector: [
      { id: 'style', label: 'Style', fields: [
        { id: 'thickness', label: 'Thickness', path: 'style.thickness', control: 'slider', min: 1, max: 8, step: 1 },
        { id: 'width', label: 'Width', path: 'style.width', control: 'segmented', options: widthOptions },
        { id: 'color', label: 'Color', path: 'style.color', control: 'color', options: colorOptions },
      ] },
      basicLayoutGroup,
      advancedGroup,
    ],
  },
  spacer: {
    type: 'spacer',
    label: 'Spacer',
    icon: 'Spacer',
    category: 'basic',
    inspector: [
      { id: 'layout', label: 'Layout', fields: [
        { id: 'height', label: 'Desktop height', path: 'content.height', control: 'slider', min: 8, max: 160, step: 4 },
        { id: 'tabletHeight', label: 'Tablet height', path: 'content.tabletHeight', control: 'slider', min: 8, max: 160, step: 4 },
        { id: 'mobileHeight', label: 'Mobile height', path: 'content.mobileHeight', control: 'slider', min: 8, max: 160, step: 4 },
      ] },
      advancedGroup,
    ],
  },
  quote: {
    type: 'quote',
    label: 'Quote',
    icon: 'Quote',
    category: 'content',
    supportsGenericSettings: true,
    inspector: [
      { id: 'content', label: 'Content', fields: [
        { id: 'text', label: 'Quote', path: 'content.text', control: 'textarea' },
        { id: 'attribution', label: 'Attribution', path: 'content.attribution', control: 'text' },
      ] },
      { id: 'style', label: 'Style', fields: [
        { id: 'align', label: 'Alignment', path: 'content.align', control: 'alignment', options: alignOptions },
        { id: 'style', label: 'Quote style', path: 'style.quoteStyle', control: 'select', options: [
          { label: 'Simple', value: 'simple' },
          { label: 'Card', value: 'card' },
          { label: 'Callout', value: 'callout' },
        ] },
      ] },
      basicLayoutGroup,
      advancedGroup,
    ],
  },
  'video-embed': {
    type: 'video-embed',
    label: 'Video',
    icon: 'Video',
    category: 'basic',
    supportsGenericSettings: true,
    inspector: [
      { id: 'content', label: 'Content', fields: [
        { id: 'url', label: 'Video URL', path: 'content.url', control: 'url' },
        { id: 'caption', label: 'Caption', path: 'content.caption', control: 'text' },
      ] },
      { id: 'style', label: 'Style', fields: [
        { id: 'aspectRatio', label: 'Aspect ratio', path: 'style.aspectRatio', control: 'select', options: [
          { label: '16:9', value: '16/9' },
          { label: '4:3', value: '4/3' },
          { label: 'Square', value: '1/1' },
        ] },
      ] },
      { id: 'behavior', label: 'Behavior', fields: [
        { id: 'autoplay', label: 'Autoplay', path: 'behavior.autoplay', control: 'toggle' },
        { id: 'controls', label: 'Show controls', path: 'behavior.controls', control: 'toggle' },
      ] },
      advancedGroup,
    ],
  },
  'faq-section': {
    type: 'faq-section',
    label: 'FAQ',
    icon: 'FAQ',
    category: 'basic',
    inspector: [
      { id: 'content', label: 'Content', fields: [
        { id: 'title', label: 'Section title', path: 'content.title', control: 'text' },
        { id: 'items', label: 'Questions', path: 'content.items', control: 'repeater', itemLabel: 'Question', itemFields: [
          { id: 'question', label: 'Question', path: 'question', control: 'text' },
          { id: 'answer', label: 'Answer', path: 'answer', control: 'textarea' },
        ] },
      ] },
      { id: 'behavior', label: 'Behavior', fields: [
        { id: 'accordion', label: 'Use accordion', path: 'behavior.accordion', control: 'toggle' },
        { id: 'defaultExpanded', label: 'Default expanded', path: 'behavior.defaultExpanded', control: 'toggle' },
      ] },
      advancedGroup,
    ],
  },
  'faq-qa': {
    type: 'faq-qa',
    label: 'Q&A pair',
    icon: 'FAQ',
    category: 'content',
    modes: ['faq'],
    inspector: [
      { id: 'content', label: 'Content', fields: [
        { id: 'question', label: 'Question', path: 'content.question', control: 'text' },
        { id: 'answer', label: 'Answer', path: 'content.answer', control: 'textarea' },
      ] },
      advancedGroup,
    ],
  },
  hero: {
    type: 'hero',
    label: 'Hero section',
    icon: 'Hero',
    category: 'landing',
    modes: ['landing'],
    supportsGenericSettings: true,
    inspector: [
      { id: 'content', label: 'Content', fields: [
        { id: 'headline', label: 'Headline', path: 'content.headline', control: 'textarea' },
        { id: 'subheadline', label: 'Subheadline', path: 'content.subheadline', control: 'textarea' },
        { id: 'ctaLabel', label: 'Primary CTA', path: 'content.ctaLabel', control: 'text' },
        { id: 'ctaUrl', label: 'CTA URL', path: 'content.ctaUrl', control: 'url' },
        { id: 'imageSrc', label: 'Hero image', path: 'content.imageSrc', control: 'image' },
        { id: 'imageAlt', label: 'Image alt text', path: 'content.imageAlt', control: 'text' },
      ] },
      { id: 'layout', label: 'Layout', fields: [
        { id: 'imagePosition', label: 'Image position', path: 'content.imagePosition', control: 'segmented', options: [
          { label: 'None', value: 'none' },
          { label: 'Top', value: 'top' },
          { label: 'Left', value: 'left' },
          { label: 'Right', value: 'right' },
          { label: 'Background', value: 'background' },
        ] },
        { id: 'align', label: 'Content alignment', path: 'style.align', control: 'alignment', options: alignOptions },
        { id: 'maxWidth', label: 'Content width', path: 'style.maxWidth', control: 'select', options: [
          { label: 'Small', value: 'sm' },
          { label: 'Medium', value: 'md' },
          { label: 'Large', value: 'lg' },
          { label: 'Full', value: 'full' },
        ] },
      ] },
      { id: 'style', label: 'Style', fields: [
        { id: 'background', label: 'Background', path: 'settings.background', control: 'color', options: colorOptions },
        { id: 'imageRadius', label: 'Image radius', path: 'style.imageRadius', control: 'slider', min: 0, max: 24, step: 2 },
        { id: 'buttonRadius', label: 'Button radius', path: 'style.buttonRadius', control: 'slider', min: 0, max: 24, step: 2 },
      ] },
      advancedGroup,
    ],
  },
  'feature-grid': {
    type: 'feature-grid',
    label: 'Feature grid',
    icon: 'Grid',
    category: 'landing',
    modes: ['landing'],
    supportsGenericSettings: true,
    inspector: [
      { id: 'content', label: 'Features', fields: [
        { id: 'features', label: 'Feature cards', path: 'content.features', control: 'repeater', itemLabel: 'Feature', itemFields: [
          { id: 'icon', label: 'Icon', path: 'icon', control: 'text' },
          { id: 'title', label: 'Title', path: 'title', control: 'text' },
          { id: 'description', label: 'Description', path: 'description', control: 'textarea' },
        ] },
      ] },
      { id: 'layout', label: 'Layout', fields: [
        { id: 'columns', label: 'Columns', path: 'style.columns', control: 'segmented', options: [
          { label: '2', value: 2 },
          { label: '3', value: 3 },
          { label: '4', value: 4 },
        ] },
        { id: 'cardStyle', label: 'Card style', path: 'style.cardStyle', control: 'select', options: [
          { label: 'Subtle', value: 'subtle' },
          { label: 'Outlined', value: 'outlined' },
          { label: 'Elevated', value: 'elevated' },
        ] },
      ] },
      advancedGroup,
    ],
  },
  'stats-row': {
    type: 'stats-row',
    label: 'Stats row',
    icon: 'Stats',
    category: 'landing',
    modes: ['landing'],
    supportsGenericSettings: true,
    inspector: [
      { id: 'content', label: 'Stats', fields: [
        { id: 'stats', label: 'Stats', path: 'content.stats', control: 'repeater', itemLabel: 'Stat', itemFields: [
          { id: 'value', label: 'Value', path: 'value', control: 'text' },
          { id: 'label', label: 'Label', path: 'label', control: 'text' },
        ] },
      ] },
      { id: 'behavior', label: 'Behavior', fields: [
        { id: 'animate', label: 'Animate numbers', path: 'behavior.animate', control: 'toggle' },
      ] },
      advancedGroup,
    ],
  },
  'image-text': {
    type: 'image-text',
    label: 'Image + text',
    icon: 'ImageText',
    category: 'landing',
    modes: ['landing'],
    supportsGenericSettings: true,
    inspector: [
      { id: 'content', label: 'Content', fields: [
        { id: 'src', label: 'Image', path: 'content.src', control: 'image' },
        { id: 'alt', label: 'Alt text', path: 'content.alt', control: 'text' },
        { id: 'headline', label: 'Headline', path: 'content.headline', control: 'text' },
        { id: 'body', label: 'Body', path: 'content.body', control: 'textarea' },
      ] },
      { id: 'layout', label: 'Layout', fields: [
        { id: 'imagePosition', label: 'Image position', path: 'content.imagePosition', control: 'segmented', options: [
          { label: 'Left', value: 'left' },
          { label: 'Right', value: 'right' },
        ] },
        { id: 'verticalAlign', label: 'Vertical align', path: 'style.verticalAlign', control: 'select', options: [
          { label: 'Top', value: 'top' },
          { label: 'Center', value: 'center' },
          { label: 'Bottom', value: 'bottom' },
        ] },
        { id: 'imageRadius', label: 'Image radius', path: 'style.imageRadius', control: 'slider', min: 0, max: 24, step: 2 },
      ] },
      advancedGroup,
    ],
  },
  testimonials: {
    type: 'testimonials',
    label: 'Testimonials',
    icon: 'Reviews',
    category: 'social-proof',
    modes: ['landing'],
    supportsGenericSettings: true,
    inspector: [
      { id: 'content', label: 'Testimonials', fields: [
        { id: 'items', label: 'Items', path: 'content.items', control: 'repeater', itemLabel: 'Testimonial', itemFields: [
          { id: 'quote', label: 'Quote', path: 'quote', control: 'textarea' },
          { id: 'author', label: 'Author', path: 'author', control: 'text' },
          { id: 'role', label: 'Role', path: 'role', control: 'text' },
        ] },
      ] },
      advancedGroup,
    ],
  },
  'author-bar': {
    type: 'author-bar',
    label: 'Author bar',
    icon: 'Author',
    category: 'blog',
    modes: ['blog'],
    inspector: [
      { id: 'content', label: 'Author', fields: [
        { id: 'name', label: 'Name', path: 'content.name', control: 'text' },
        { id: 'date', label: 'Date', path: 'content.date', control: 'text' },
        { id: 'readingTime', label: 'Reading time', path: 'content.readingTime', control: 'text' },
      ] },
      advancedGroup,
    ],
  },
  code: {
    type: 'code',
    label: 'Code block',
    icon: 'Code',
    category: 'blog',
    modes: ['blog'],
    inspector: [
      { id: 'content', label: 'Code', fields: [
        { id: 'language', label: 'Language', path: 'content.language', control: 'select', options: ['javascript','typescript','python','html','css','json','bash','sql'].map(value => ({ label: value, value })) },
        { id: 'code', label: 'Code', path: 'content.code', control: 'textarea' },
      ] },
      { id: 'behavior', label: 'Behavior', fields: [
        { id: 'copyButton', label: 'Show copy button', path: 'behavior.copyButton', control: 'toggle' },
      ] },
      advancedGroup,
    ],
  },
  ...(Object.fromEntries(([
    ['header-nav', 'Header'],
    ['custom-embed', 'Embed'],
    ['gallery', 'Gallery'],
    ['review', 'Review'],
    ['cta-section', 'CTA section'],
    ['table-of-contents', 'Table of contents'],
    ['key-takeaways', 'Key takeaways'],
    ['related-posts', 'Related posts'],
    ['social-share', 'Social share'],
    ['newsletter-signup', 'Newsletter signup'],
    ['seo-meta', 'SEO/meta'],
    ['benefits', 'Benefits'],
    ['logo-strip', 'Logo strip'],
    ['pricing-table', 'Pricing table'],
    ['lead-form', 'Lead form'],
    ['contact-block', 'Contact block'],
    ['map-block', 'Map/location'],
    ['review-wall', 'Review wall'],
    ['comparison-table', 'Comparison table'],
    ['process-steps', 'Process steps'],
    ['team-grid', 'Team grid'],
    ['announcement-bar', 'Announcement'],
    ['footer', 'Footer'],
  ] as Array<[BlockType, string]>).map(([type, label]) => [
    type,
    {
      type,
      label,
      icon: label,
      category: type.includes('review') || type === 'logo-strip' ? 'social-proof' : type.includes('form') || type.includes('pricing') || type.includes('contact') || type.includes('map') || type.includes('cta') ? 'conversion' : type.includes('seo') || type.includes('posts') || type.includes('share') || type.includes('newsletter') || type.includes('contents') || type.includes('takeaways') ? 'blog' : 'landing',
      modes: type.includes('seo') || type.includes('posts') || type.includes('share') || type.includes('newsletter') || type.includes('contents') || type.includes('takeaways') ? ['blog'] : type === 'cta-section' || type === 'custom-embed' || type === 'gallery' || type === 'review' ? undefined : ['landing'],
      supportsGenericSettings: true,
      inspector: marketingInspector(label, type),
    } satisfies BlockDefinition,
  ])) as Record<BlockType, BlockDefinition>),
};

function marketingInspector(label: string, type: BlockType): InspectorGroup[] {
  const contentFields: InspectorField[] = [
    { id: 'title', label: 'Title', path: 'content.title', control: 'text', placeholder: label },
    { id: 'headline', label: 'Headline', path: 'content.headline', control: 'text', placeholder: label },
    { id: 'body', label: 'Body', path: 'content.body', control: 'textarea' },
  ];

  if (type === 'lead-form') {
    contentFields.push({
      id: 'fields',
      label: 'Fields',
      path: 'content.fields',
      control: 'repeater',
      itemLabel: 'Field',
      itemFields: [
        { id: 'label', label: 'Label', path: 'label', control: 'text' },
        { id: 'type', label: 'Type', path: 'type', control: 'select', options: [
          { label: 'Text', value: 'text' },
          { label: 'Email', value: 'email' },
          { label: 'Phone', value: 'phone' },
          { label: 'Textarea', value: 'textarea' },
        ] },
        { id: 'required', label: 'Required', path: 'required', control: 'toggle' },
      ],
    });
  } else if (type === 'pricing-table') {
    contentFields.push({
      id: 'plans',
      label: 'Plans',
      path: 'content.plans',
      control: 'repeater',
      itemLabel: 'Plan',
      itemFields: [
        { id: 'name', label: 'Name', path: 'name', control: 'text' },
        { id: 'price', label: 'Price', path: 'price', control: 'text' },
        { id: 'ctaLabel', label: 'CTA label', path: 'ctaLabel', control: 'text' },
        { id: 'highlighted', label: 'Highlighted', path: 'highlighted', control: 'toggle' },
      ],
    });
  } else if (type === 'gallery') {
    contentFields.push({
      id: 'images',
      label: 'Images',
      path: 'content.images',
      control: 'repeater',
      itemLabel: 'Image',
      itemFields: [
        { id: 'src', label: 'Image URL', path: 'src', control: 'url' },
        { id: 'caption', label: 'Caption', path: 'caption', control: 'text' },
      ],
    });
  }

  return [
    { id: 'content', label: 'Content', fields: contentFields },
    { id: 'layout', label: 'Layout', fields: [
      { id: 'columns', label: 'Columns', path: 'style.columns', control: 'segmented', options: [
        { label: '1', value: 1 },
        { label: '2', value: 2 },
        { label: '3', value: 3 },
      ] },
      { id: 'alignment', label: 'Alignment', path: 'style.align', control: 'alignment', options: alignOptions },
    ] },
    { id: 'style', label: 'Style', fields: [
      { id: 'background', label: 'Background', path: 'settings.background', control: 'color', options: colorOptions },
      { id: 'cardStyle', label: 'Card style', path: 'style.cardStyle', control: 'select', options: [
        { label: 'Simple', value: 'simple' },
        { label: 'Outlined', value: 'outlined' },
        { label: 'Elevated', value: 'elevated' },
      ] },
    ] },
    { id: 'behavior', label: 'Behavior', fields: [
      { id: 'ctaUrl', label: 'CTA URL', path: 'content.ctaUrl', control: 'url' },
      { id: 'submitAction', label: 'Submit action', path: 'behavior.submitAction', control: 'text' },
    ] },
    advancedGroup,
  ];
}

export function getBlockDefinition(type: BlockType): BlockDefinition {
  return BLOCK_DEFINITIONS[type];
}
