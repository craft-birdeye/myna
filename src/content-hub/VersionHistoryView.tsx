import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Sheet, SheetContent } from '@/contenthub-ui/sheet';

interface Version {
  id: string;
  timestamp: string;
  author: string;
  authorInitials: string;
  authorColor: string;
  content: string;
  isCurrent: boolean;
}

// Mock version data
const versions: Version[] = [
  {
    id: 'v1',
    timestamp: '5:18 PM, Feb 21, 2024',
    author: 'Mohammed Hussain',
    authorInitials: 'MH',
    authorColor: '#fff9ea',
    content: `Transform your yard into a living masterpiece 🌱
Whether you're dreaming of a peaceful garden corner, a vibrant outdoor hangout, or a low-maintenance modern lawn — LushGreen Landscapes brings your vision to life.

🌼 Native, drought-tolerant plants
💧 Smart irrigation that saves water
♻️ Eco-friendly materials built to last
✨ Designs crafted for beauty in every season

Ready to upgrade your outdoor space?
👉 Book your free yard design consultation today!`,
    isCurrent: true,
  },
  {
    id: 'v2',
    timestamp: '4:45 PM, Feb 21, 2024',
    author: 'Sarah Chen',
    authorInitials: 'SC',
    authorColor: '#f1faf0',
    content: `Transform your yard into a living work of art 🌱
Whether you're dreaming of a peaceful garden retreat, a vibrant outdoor entertainment space, or a low-maintenance modern lawn — LushGreen Landscapes brings your vision to life.

🌼 Native, drought-resistant plants
💧 Efficient irrigation that conserves water
♻️ Sustainable materials built to endure
✨ Custom designs for year-round beauty

Ready to enhance your outdoor space?
👉 Schedule your complimentary yard design consultation today!`,
    isCurrent: false,
  },
  {
    id: 'v3',
    timestamp: '3:22 PM, Feb 21, 2024',
    author: 'David Park',
    authorInitials: 'DP',
    authorColor: '#ecf5fd',
    content: `Transform your yard into a living masterpiece 🌱
Whether you're envisioning a peaceful garden sanctuary, a vibrant outdoor gathering area, or a low-maintenance contemporary lawn — LushGreen Landscapes realizes your vision.

🌼 Indigenous, drought-tolerant plants
💧 Smart irrigation that saves water
♻️ Eco-friendly materials built to last
✨ Designs crafted for seasonal beauty

Ready to upgrade your outdoor space?
👉 Book your free yard design consultation today!`,
    isCurrent: false,
  },
];

// Function to compare two strings and return an array of text segments with highlight flags
const compareTexts = (currentText: string, comparedText: string) => {
  const currentWords = currentText.split(/(\s+)/);
  const comparedWords = comparedText.split(/(\s+)/);
  const result: Array<{ text: string; isHighlighted: boolean }> = [];
  const maxLength = Math.max(currentWords.length, comparedWords.length);

  for (let i = 0; i < maxLength; i++) {
    const currentWord = currentWords[i] || '';
    const comparedWord = comparedWords[i] || '';
    if (currentWord !== comparedWord) {
      result.push({ text: currentWord, isHighlighted: true });
    } else {
      result.push({ text: currentWord, isHighlighted: false });
    }
  }
  return result;
};

interface VersionHistoryViewProps {
  onBack: () => void;
}

export const VersionHistoryView = ({ onBack }: VersionHistoryViewProps) => {
  const [selectedVersionId, setSelectedVersionId] = useState('v1');

  const selectedVersion = versions.find(v => v.id === selectedVersionId) || versions[0];
  const currentVersion = versions[0];
  const showDiff = selectedVersionId !== 'v1';
  const isCurrentVersion = selectedVersionId === 'v1';

  const highlightedSegments =
    showDiff && !selectedVersion.isCurrent
      ? compareTexts(currentVersion.content, selectedVersion.content)
      : null;

  return (
    <div className="bg-muted relative size-full flex flex-col">
      {/* Top Bar */}
      <div className="w-full bg-background border-b border-border h-[52px] flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex gap-1 items-center">
          <button
            onClick={onBack}
            className="flex h-[26px] items-center hover:opacity-70 transition-opacity"
          >
            <ArrowLeft size={20} strokeWidth={1.6} className="text-foreground" />
          </button>
          <div className="flex flex-col items-start">
            <span className="text-[13px] text-foreground">Version history</span>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => !isCurrentVersion && onBack()}
            className={`flex gap-2 h-[34px] items-center justify-center px-4 py-2 rounded-md transition-colors text-[13px] ${
              isCurrentVersion
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:opacity-90'
            }`}
            disabled={isCurrentVersion}
          >
            Restore
          </button>
        </div>
      </div>

      {/* Content Area + Version List */}
      <div className="flex-1 overflow-hidden flex">
        {/* Preview */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[600px] mx-auto mt-16 mb-8 px-6">
            <div className="bg-background flex flex-col gap-2 p-4 rounded-lg border border-border">
              {/* Post type header */}
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="10" fill="#1877F2" />
                  <path d="M13.5 10H11.5V16H9V10H7.5V8H9V6.5C9 5.1 9.9 4 11.5 4H13V6H12C11.4 6 11.5 6.3 11.5 6.8V8H13L13.5 10Z" fill="white" />
                </svg>
                <span className="text-[13px] text-foreground">Facebook post</span>
              </div>

              {/* Content */}
              <div className="rounded-lg border border-border">
                <div className="flex flex-col gap-4 p-4">
                  <div className="text-[13px] text-foreground whitespace-pre-wrap leading-relaxed">
                    {highlightedSegments ? (
                      highlightedSegments.map((segment, index) => (
                        <span
                          key={index}
                          className={segment.isHighlighted ? 'bg-yellow-100' : ''}
                        >
                          {segment.text}
                        </span>
                      ))
                    ) : (
                      selectedVersion.content
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Version List Panel */}
        <Sheet open={true} onOpenChange={() => {}}>
        <SheetContent side="right" className="w-[360px] flex flex-col p-0">
          <div className="flex flex-col items-start w-full h-full overflow-y-auto p-5">
            <div className="flex flex-col items-start w-full">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className={`rounded-md shrink-0 w-full mb-1 ${selectedVersionId === version.id ? 'bg-primary/5' : 'bg-background'}`}
                >
                  <button
                    onClick={() => setSelectedVersionId(version.id)}
                    className={`flex gap-1 items-start pl-3 pr-2 py-4 w-full text-left transition-colors rounded-md relative ${
                      selectedVersionId === version.id ? 'hover:bg-primary/10' : 'hover:bg-surface-hover'
                    }`}
                  >
                    <div className="flex-1 flex flex-col gap-1">
                      <p className="text-[13px] text-foreground">
                        {version.isCurrent ? 'Current version' : version.timestamp}
                      </p>
                      <div className="flex items-center gap-1">
                        <div
                          className="relative rounded-full shrink-0 size-6 flex items-center justify-center text-[12px]"
                          style={{ backgroundColor: version.authorColor }}
                        >
                          {version.authorInitials}
                        </div>
                        <p className="text-xs text-muted-foreground">{version.author}</p>
                      </div>
                    </div>
                    {selectedVersionId === version.id && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path d="M4 10l4 4 8-8" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};
