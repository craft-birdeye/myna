import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/contenthub-ui/button';
import { SegmentedToggle } from '@/contenthub-ui/segmented-toggle';
import { cn } from '@/contenthub-ui/utils';
import { STATUS_COLORS } from '../shared/scoreColors';
import { ContentFlowInfoLabel, ContentFlowTextarea, ContentFlowTextInput } from '../shared/ContentFlowControls';

interface FAQWizardStep2Props {
  template: string;
  onSourceDataChange: (data: Record<string, unknown>) => void;
}

type TabId = 'upload' | 'url' | 'paste';

export const FAQWizardStep2 = ({ template, onSourceDataChange }: FAQWizardStep2Props) => {
  const [urlValue, setUrlValue] = useState('');
  const [urlScraped, setUrlScraped] = useState(false);
  const [urlScraping, setUrlScraping] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('upload');
  const [pasteText, setPasteText] = useState('');
  const [autoFilled, setAutoFilled] = useState(false);
  const [supportToggles, setSupportToggles] = useState({ reviews: true, tickets: false, nps: false });
  const [selectedLocations, setSelectedLocations] = useState<string[]>(['Downtown - Main St', 'Northside Branch', 'Westside Location']);
  const [showAllLocations, setShowAllLocations] = useState(false);
  const [customContext, setCustomContext] = useState('');
  const [customSources, setCustomSources] = useState<string[]>([]);

  const allLocations = ['Downtown - Main St', 'Northside Branch', 'Westside Location', 'East Side Branch', 'Southgate', 'Midtown', 'Harbor View', 'West End', 'Lakewood', 'Riverside'];
  const visibleLocations = showAllLocations ? allLocations : allLocations.slice(0, 3);

  const handleAutoFill = () => {
    setUrlValue('https://lushgreen.com/services');
    setAutoFilled(true);
    onSourceDataChange({ url: 'https://lushgreen.com/services', autoFilled: true });
  };

  const handleScrape = () => {
    if (!urlValue) return;
    setUrlScraping(true);
    setTimeout(() => {
      setUrlScraping(false);
      setUrlScraped(true);
      onSourceDataChange({ url: urlValue, scraped: true });
    }, 1500);
  };

  const toggleLocation = (loc: string) => {
    setSelectedLocations(prev =>
      prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]
    );
  };

  const toggleCustomSource = (src: string) => {
    setCustomSources(prev =>
      prev.includes(src) ? prev.filter(s => s !== src) : [...prev, src]
    );
  };

  return (
    <div className="p-6 flex flex-col gap-6 max-w-2xl">
      {/* Birdeye auto-suggest banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-[8px] p-4 flex items-center gap-2">
        <Sparkles size={16} strokeWidth={1.6} className="text-primary shrink-0" />
        <div className="flex-1">
          <p className="text-[13px] text-foreground">Use your project context</p>
          <p className="text-[12px] text-muted-foreground">We found lushgreen.com/services from your brand identity</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleAutoFill}>
          Use this
        </Button>
      </div>

      {/* Template-specific inputs */}
      {(template === 'aeo' || template === 'newpage') && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <ContentFlowInfoLabel required tooltip="We'll extract questions your customers are already asking.">
              {template === 'aeo' ? 'Page to optimize' : 'Page URL'}
            </ContentFlowInfoLabel>
            {autoFilled && (
              <span className="text-[11px] px-2 py-0.5 rounded-md" style={{ background: STATUS_COLORS.ready.bg, color: STATUS_COLORS.ready.text }}>Auto-filled</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ContentFlowTextInput
              required
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              placeholder="https://example.com/services"
              className="flex-1"
            />
            <Button variant="outline" size="sm" onClick={handleScrape} disabled={!urlValue || urlScraping}>
              {urlScraping ? 'Scraping...' : 'Scrape page'}
            </Button>
          </div>
          {urlScraped && (
            <div className="flex items-center gap-2 text-[12px] rounded-md px-2 py-2 border" style={{ color: STATUS_COLORS.ready.text, background: STATUS_COLORS.ready.bg, borderColor: STATUS_COLORS.ready.bg }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" fill="#4CAE3D" />
                <path d="M4 7l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              LushGreen Landscapes · Services page
              <button className="ml-auto text-muted-foreground hover:text-foreground" onClick={() => setUrlScraped(false)}>✕</button>
            </div>
          )}
        </div>
      )}

      {template === 'optimizer' && (
        <div className="flex flex-col gap-4">
          <p className="text-[13px] text-foreground">Import your existing FAQs</p>
          {/* Tab switcher */}
          <SegmentedToggle<TabId>
            items={[
              { value: 'upload', label: 'Upload file' },
              { value: 'url',    label: 'Paste URL'   },
              { value: 'paste',  label: 'Paste text'  },
            ]}
            value={activeTab}
            onChange={setActiveTab}
          />
          {activeTab === 'upload' && (
            <div className="border-2 border-dashed border-border rounded-[8px] p-8 text-center flex flex-col items-center gap-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-muted-foreground">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-[13px] text-foreground">Drop your FAQ document or click to browse</p>
              <p className="text-[12px] text-muted-foreground">Accepts .docx .pdf .txt</p>
            </div>
          )}
          {activeTab === 'url' && (
            <ContentFlowTextInput
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              placeholder="https://yoursite.com/faq"
            />
          )}
          {activeTab === 'paste' && (
            <ContentFlowTextarea
              rows={8}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste your existing FAQ content here..."
            />
          )}
        </div>
      )}

      {template === 'support' && (
        <div className="flex flex-col gap-4">
          <p className="text-[13px] text-foreground">Connect your customer data</p>
          {[
            { key: 'reviews' as const, label: 'Birdeye reviews', sub: '3,421 reviews available', hasUpload: false },
            { key: 'tickets' as const, label: 'Support tickets', sub: 'Upload CSV', hasUpload: true },
            { key: 'nps' as const, label: 'NPS responses', sub: 'Upload CSV', hasUpload: true },
          ].map(({ key, label, sub, hasUpload }) => (
            <div key={key} className="border border-border rounded-[8px] p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSupportToggles(prev => ({ ...prev, [key]: !prev[key] }))}
                  className={cn(
                    'w-[34px] h-5 rounded-full transition-colors relative',
                    supportToggles[key] ? 'bg-primary' : 'bg-muted border border-border'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform',
                      supportToggles[key] ? 'translate-x-4' : 'translate-x-0.5'
                    )}
                  />
                </button>
                <div>
                  <p className="text-[13px] text-foreground">{label}</p>
                  <p className="text-[12px] text-muted-foreground">{sub}</p>
                </div>
              </div>
              {hasUpload && supportToggles[key as 'tickets' | 'nps'] && (
                <div className="border border-dashed border-border rounded-md p-2 text-center text-[12px] text-muted-foreground">
                  Drop CSV file here or click to browse
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {template === 'location' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-foreground">Select locations to generate FAQs for</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedLocations(allLocations)}
                className="text-[12px] text-primary hover:underline"
              >
                Select all
              </button>
              <button
                onClick={() => setSelectedLocations([])}
                className="text-[12px] text-muted-foreground hover:text-foreground"
              >
                Deselect all
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {visibleLocations.map(loc => (
              <label key={loc} className="flex items-center gap-2 p-4 rounded-[8px] border border-border bg-background cursor-pointer hover:bg-surface-hover">
                <input
                  type="checkbox"
                  checked={selectedLocations.includes(loc)}
                  onChange={() => toggleLocation(loc)}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-[13px] text-foreground">{loc}</span>
              </label>
            ))}
          </div>
          {!showAllLocations && allLocations.length > 3 && (
            <button
              onClick={() => setShowAllLocations(true)}
              className="text-[12px] text-primary hover:underline text-left"
            >
              Show all {allLocations.length} locations
            </button>
          )}
        </div>
      )}

      {template === 'custom' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[13px] text-foreground">Describe this FAQ page</label>
            <ContentFlowTextarea
              rows={5}
              value={customContext}
              onChange={(e) => setCustomContext(e.target.value)}
              placeholder="Describe what this FAQ page is about and who it's for..."
            />
          </div>
          <div className="flex flex-col gap-2">
            <ContentFlowInfoLabel tooltip="Add source material to guide the FAQ output.">
              Add sources
            </ContentFlowInfoLabel>
            {[
              { id: 'scrape', label: 'Scrape a URL' },
              { id: 'upload', label: 'Upload a document' },
              { id: 'reviews', label: 'Use Birdeye reviews' },
              { id: 'support', label: 'Use support data' },
            ].map(src => (
              <label key={src.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={customSources.includes(src.id)}
                  onChange={() => toggleCustomSource(src.id)}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-[13px] text-foreground">{src.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {!template && (
        <div className="py-8 text-center text-[13px] text-muted-foreground">
          Go back to step 1 to select a template first
        </div>
      )}
    </div>
  );
};
