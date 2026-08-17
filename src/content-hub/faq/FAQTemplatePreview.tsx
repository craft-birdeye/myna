import React from 'react';

interface FAQPair {
  q: string;
  a: string;
}

interface TemplatePreviewData {
  badge: string;
  pairs: FAQPair[];
  estimatedCount: number;
  estimatedTime: string;
}

const PREVIEWS: Record<string, TemplatePreviewData> = {
  aeo: {
    badge: '~12 FAQs · ~45 sec',
    pairs: [
      { q: 'How much does professional landscaping cost?', a: 'Professional landscaping typically costs $50–$150 per hour depending on scope, complexity, and location. Most residential projects range from $500 to $3,000.' },
      { q: "What's the difference between hardscaping and landscaping?", a: 'Landscaping refers to living elements like plants and turf, while hardscaping covers non-living features such as patios, walls, and pathways.' },
    ],
    estimatedCount: 12,
    estimatedTime: '45 sec',
  },
  newpage: {
    badge: '~10 FAQs · ~40 sec',
    pairs: [
      { q: 'What landscaping services do you offer?', a: 'We offer a full range of services including lawn maintenance, garden design, irrigation installation, and seasonal clean-ups tailored to your property.' },
      { q: 'Do you offer free consultations?', a: 'Yes! We offer complimentary yard design consultations. Book online or call us to schedule a visit at your convenience.' },
    ],
    estimatedCount: 10,
    estimatedTime: '40 sec',
  },
  optimizer: {
    badge: '~8 FAQs · ~35 sec',
    pairs: [
      { q: 'How often should I water my lawn?', a: '(Before) Most lawns need 1–1.5 inches per week. (After: Optimized) Your lawn needs about 1–1.5 inches of water per week — ideally in one or two deep sessions rather than daily light watering, which promotes stronger root growth.' },
    ],
    estimatedCount: 8,
    estimatedTime: '35 sec',
  },
  support: {
    badge: '~14 FAQs · ~50 sec',
    pairs: [
      { q: 'Do you clean up after the job is done?', a: 'Absolutely. Our crew removes all debris, trimmings, and waste at the end of every visit. We leave your property cleaner than we found it.' },
      { q: 'What if I am not happy with the results?', a: 'We stand behind our work with a satisfaction guarantee. If something isn\'t right, contact us within 48 hours and we\'ll make it right at no extra charge.' },
    ],
    estimatedCount: 14,
    estimatedTime: '50 sec',
  },
  location: {
    badge: '~12 FAQs · ~45 sec',
    pairs: [
      { q: 'Do you serve the Northside area?', a: 'Yes! Our Northside Branch serves all neighborhoods within a 15-mile radius. Same-day appointments may be available — call to check availability.' },
      { q: 'What are your hours at the Downtown location?', a: 'Our Downtown - Main St location is open Monday through Saturday, 7 AM to 6 PM. Emergency services are available on request.' },
    ],
    estimatedCount: 12,
    estimatedTime: '45 sec',
  },
  custom: {
    badge: '~10 FAQs · ~40 sec',
    pairs: [
      { q: 'Your question 1 will appear here', a: 'Your custom-generated answer will be tailored to the context, tone, and audience you define in the next steps.' },
      { q: 'Your question 2 will appear here', a: 'The AI will generate answers based on your source material, brand identity, and goal settings.' },
    ],
    estimatedCount: 10,
    estimatedTime: '40 sec',
  },
};

const PLACEHOLDER: TemplatePreviewData = {
  badge: '',
  pairs: [],
  estimatedCount: 0,
  estimatedTime: '',
};

interface FAQTemplatePreviewProps {
  template: string;
}

export const FAQTemplatePreview = ({ template }: FAQTemplatePreviewProps) => {
  const data = template ? (PREVIEWS[template] || PLACEHOLDER) : PLACEHOLDER;

  if (!template) {
    return (
      <div className="h-full bg-muted rounded-lg flex flex-col items-center justify-center p-8 text-center gap-2">
        <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center border border-border">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="2" y="3" width="14" height="12" rx="2" stroke="#888" strokeWidth="1.4" />
            <path d="M5 7h8M5 10h5" stroke="#888" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </div>
        <p className="text-[13px] text-muted-foreground">Select a template to see a preview</p>
      </div>
    );
  }

  return (
    <div className="bg-muted rounded-lg p-4 h-full flex flex-col gap-4 overflow-y-auto">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Example output</span>
        {data.badge && (
          <span className="text-[11px] bg-background border border-border rounded-md px-2 py-0.5 text-muted-foreground">
            {data.badge}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {data.pairs.map((pair, i) => (
          <div key={i} className="bg-background rounded-lg border border-border p-4 flex flex-col gap-2">
            <p className="text-[13px] text-foreground leading-snug">{pair.q}</p>
            <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-4">{pair.a}</p>
          </div>
        ))}
      </div>

      {data.estimatedCount > 0 && (
        <p className="text-[11px] text-muted-foreground text-center mt-auto">
          Up to {Math.round(data.estimatedCount * 1.5)} candidates generated · best {data.estimatedCount} selected
        </p>
      )}
    </div>
  );
};
