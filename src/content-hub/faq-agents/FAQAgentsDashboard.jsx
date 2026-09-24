import React, { useState } from 'react';
import { Search, SlidersHorizontal, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { MAIN_VIEW_HEADER_BAND_CLASS, MAIN_VIEW_PRIMARY_HEADING_CLASS } from '@/app/components/layout/mainViewTitleClasses';
import AgentsTable from './Organisms/DataViews/AgentsTable/AgentsTable';
import TemplateLibrary from './Organisms/TemplateLibrary/TemplateLibrary';
import EmptyStates from './Patterns/EmptyStates/EmptyStates';

const INITIAL_AGENTS = [
  { id: 'a1',  name: 'Search AI metric enhancer FAQ agent', status: 'Draft',   generatedFAQs: 30, acceptedFAQs: 28, timeSaved: '1h', locations: 2 },
  { id: 'a2',  name: 'Search AI metric enhancer FAQ agent', status: 'Draft',   generatedFAQs: 24, acceptedFAQs: 22, timeSaved: '1h', locations: 3 },
  { id: 'a3',  name: 'Search AI metric enhancer FAQ agent', status: 'Running', generatedFAQs: 40, acceptedFAQs: 38, timeSaved: '2h', locations: 5 },
  { id: 'a4',  name: 'Search AI metric enhancer FAQ agent', status: 'Draft',   generatedFAQs: 18, acceptedFAQs: 16, timeSaved: '45m', locations: 1 },
  { id: 'a5',  name: 'Search AI metric enhancer FAQ agent', status: 'Draft',   generatedFAQs: 22, acceptedFAQs: 20, timeSaved: '1h', locations: 2 },
  { id: 'a6',  name: 'Search AI metric enhancer FAQ agent', status: 'Draft',   generatedFAQs: 28, acceptedFAQs: 26, timeSaved: '1h', locations: 4 },
  { id: 'a7',  name: 'Search AI metric enhancer FAQ agent', status: 'Draft',   generatedFAQs: 15, acceptedFAQs: 14, timeSaved: '30m', locations: 1 },
  { id: 'a8',  name: 'Search AI metric enhancer FAQ agent', status: 'Running', generatedFAQs: 35, acceptedFAQs: 33, timeSaved: '1h 30m', locations: 3 },
  { id: 'a9',  name: 'Search AI metric enhancer FAQ agent', status: 'Draft',   generatedFAQs: 20, acceptedFAQs: 18, timeSaved: '45m', locations: 2 },
  { id: 'a10', name: 'Search AI metric enhancer FAQ agent', status: 'Draft',   generatedFAQs: 19, acceptedFAQs: 17, timeSaved: '30m', locations: 2 },
  { id: 'a11', name: 'Search AI metric enhancer FAQ agent', status: 'Draft',   generatedFAQs: 14, acceptedFAQs: 13, timeSaved: '15m', locations: 1 },
];

const METRICS = [
  { label: 'Generated FAQs', value: '265' },
  { label: 'Accepted FAQs',  value: '265' },
  { label: 'Time saved',     value: '9h'  },
];

const DEFAULT_TEMPLATES = [
  {
    id: 't1',
    title: 'Search AI metric enhancer FAQ agent',
    description: 'Automatically generates and updates FAQs targeting AI search metrics and People Also Ask questions.',
    source: 'default',
  },
  {
    id: 't2',
    title: 'Competitor FAQ gap analysis agent',
    description: 'Scans competitor sites for FAQ content and identifies gaps in your own FAQ coverage.',
    source: 'default',
  },
  {
    id: 't3',
    title: 'Local SEO FAQ generation agent',
    description: 'Generates location-specific FAQs based on local search queries and business listings data.',
    source: 'default',
  },
  {
    id: 't4',
    title: 'Review-based FAQ extraction agent',
    description: 'Extracts common questions from customer reviews and converts them into structured FAQ entries.',
    source: 'default',
  },
];

const TABS = [
  { id: 'agents', label: 'Agents' },
  { id: 'library', label: 'Library' },
];

function MetricsStrip() {
  return (
    <div className="flex gap-4 px-6 pt-4 shrink-0">
      {METRICS.map((m) => (
        <div
          key={m.label}
          className="flex-1 flex flex-col gap-1 bg-background border border-border rounded-lg px-4 py-3.5 min-w-0"
        >
          <span className="text-xl font-semibold tracking-tight text-foreground leading-7">{m.value}</span>
          <span className="text-xs text-muted-foreground">{m.label}</span>
        </div>
      ))}
    </div>
  );
}

function InlineTabs({ tabs, activeTab, onTabClick }) {
  return (
    <div className="flex border-b border-border pl-6 shrink-0">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onTabClick(tab.id)}
            className={[
              'px-4 py-2.5 text-sm leading-5 border-b-2 -mb-px transition-colors',
              isActive
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground font-normal',
            ].join(' ')}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default function FAQAgentsDashboard({ onOpenAgent, onCreateAgent }) {
  const [activeTab, setActiveTab] = useState('agents');
  const [libraryView, setLibraryView] = useState('grid');
  const [agents, setAgents] = useState(INITIAL_AGENTS);
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);

  const handleCreateAgent = () => {
    const newId = `a-${Date.now()}`;
    const newAgent = {
      id: newId,
      name: 'Untitled FAQ agent',
      status: 'Draft',
      generatedFAQs: 0,
      acceptedFAQs: 0,
      timeSaved: '—',
      locations: 0,
    };
    setAgents((prev) => [...prev, newAgent]);
    onCreateAgent?.(newAgent);
  };

  const handleDeleteAgent = (agentId) => {
    setAgents((prev) => prev.filter((a) => a.id !== agentId));
  };

  const handleDuplicateAgent = (agentId) => {
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) return;
    const copy = { ...agent, id: `a-${Date.now()}`, name: `${agent.name} (copy)`, status: 'Draft', generatedFAQs: 0, acceptedFAQs: 0 };
    setAgents((prev) => [...prev, copy]);
  };

  const handleAgentUpdate = (rowId, colId, value) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === rowId ? { ...a, [colId]: value } : a))
    );
  };

  const handleCreateTemplate = (template) => {
    const newId = `t-${Date.now()}`;
    setTemplates((prev) => [...prev, { ...template, id: newId, source: 'custom' }]);
  };

  const handleDeleteTemplate = (templateId) => {
    setTemplates((prev) => prev.filter((t) => t.id !== templateId));
  };

  const handleSaveTemplate = (template) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === template.id ? { ...t, ...template } : t))
    );
  };

  const handleUseTemplate = (templateId) => {
    const tmpl = templates.find((t) => t.id === templateId);
    if (!tmpl) return;
    const newId = `a-${Date.now()}`;
    const newAgent = {
      id: newId,
      name: tmpl.title,
      status: 'Draft',
      generatedFAQs: 0,
      acceptedFAQs: 0,
      timeSaved: '—',
      locations: 0,
      fromTemplate: templateId,
    };
    setAgents((prev) => [...prev, newAgent]);
    onCreateAgent?.(newAgent);
  };

  const isEmpty = agents.length === 0;

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className={MAIN_VIEW_HEADER_BAND_CLASS}>
        <h1 className={MAIN_VIEW_PRIMARY_HEADING_CLASS}>FAQ generation agents</h1>

        {activeTab === 'library' ? (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Search className="h-4 w-4" strokeWidth={1.6} />
            </Button>
            <div className="flex items-center gap-1 h-[34px] border border-border rounded-md bg-background px-1">
              <button
                onClick={() => setLibraryView('grid')}
                className={[
                  'w-6 h-6 rounded flex items-center justify-center transition-colors',
                  libraryView === 'grid'
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                ].join(' ')}
              >
                <LayoutGrid className="h-3.5 w-3.5" strokeWidth={1.6} absoluteStrokeWidth />
              </button>
              <button
                onClick={() => setLibraryView('table')}
                className={[
                  'w-6 h-6 rounded flex items-center justify-center transition-colors',
                  libraryView === 'table'
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                ].join(' ')}
              >
                <List className="h-3.5 w-3.5" strokeWidth={1.6} absoluteStrokeWidth />
              </button>
            </div>
            <Button variant="outline" size="icon">
              <SlidersHorizontal className="h-4 w-4" strokeWidth={1.6} />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Search className="h-4 w-4" strokeWidth={1.6} />
            </Button>
            <Button onClick={handleCreateAgent}>Create agent</Button>
            <Button variant="outline" size="icon">
              <SlidersHorizontal className="h-4 w-4" strokeWidth={1.6} />
            </Button>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col overflow-auto min-h-0">
        <div className="shrink-0">
          <InlineTabs tabs={TABS} activeTab={activeTab} onTabClick={setActiveTab} />
        </div>

        {activeTab === 'agents' && (
          isEmpty ? (
            <EmptyStates
              title="Create your first FAQ generation agent"
              description="Automatically generate and update FAQs from your business content and customer questions"
              actionLabel="Create agent"
              onAction={handleCreateAgent}
            />
          ) : (
            <>
              <MetricsStrip />
              <div className="px-6 pt-4 pb-6">
                <AgentsTable
                  agents={agents}
                  onRowClick={(agent) => onOpenAgent?.(agent.id, agents)}
                  onDeleteAgent={handleDeleteAgent}
                  onDuplicateAgent={handleDuplicateAgent}
                  onAgentUpdate={handleAgentUpdate}
                />
              </div>
            </>
          )
        )}

        {activeTab === 'library' && (
          <div className="p-6">
            <TemplateLibrary
              templates={templates}
              variant={libraryView === 'table' ? 'list' : 'grid'}
              onCreateTemplate={handleCreateTemplate}
              onDeleteTemplate={handleDeleteTemplate}
              onSaveTemplate={handleSaveTemplate}
              onUseTemplate={handleUseTemplate}
            />
          </div>
        )}
      </div>
    </div>
  );
}
