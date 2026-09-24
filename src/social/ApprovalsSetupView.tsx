import { useState, useRef, useEffect } from 'react';
import {
  Search, Plus, MoreVertical, ChevronDown, X, Info,
  Check, Pencil, SlidersHorizontal, AlertTriangle
} from 'lucide-react';

// ─── Coverage helper ────────────────────────────────────────────────────────────
function hasAllLocationsApprover(step: { approvers: { locationType: string }[] }) {
  return step.approvers.some(a => a.locationType === 'all');
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Approver {
  id: string;
  name: string;
  initials: string;
  color: string;
  locationType: 'all' | 'partial';
  locations: string[];
}

interface Step {
  id: number;
  name: string;
  approvers: Approver[];
  requireMode: 'any' | 'all';
}

interface Workflow {
  id: string;
  name: string;
  status: 'Enabled' | 'Disabled';
  lastUpdated: string;
  updatedBy: string;
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const WORKFLOWS: Workflow[] = [
  { id: 'wf1', name: 'Compliance check',           status: 'Enabled',  lastUpdated: 'Mar 13, 2026', updatedBy: 'Emma'   },
  { id: 'wf2', name: 'Manager review',             status: 'Disabled', lastUpdated: 'Mar 12, 2026', updatedBy: 'Samuel' },
  { id: 'wf3', name: 'Team lead sign-off',         status: 'Enabled',  lastUpdated: 'Mar 11, 2026', updatedBy: 'James'  },
  { id: 'wf4', name: 'Local store manager approval', status: 'Disabled', lastUpdated: 'Mar 10, 2026', updatedBy: 'Ethan'  },
  { id: 'wf5', name: 'Brand & Legal approval',     status: 'Enabled',  lastUpdated: 'Mar 10, 2026', updatedBy: 'Evelyn' },
];

const ALL_APPROVERS: Approver[] = [
  { id: 'u1', name: 'Aaron Blake',    initials: 'AB', color: '#1976d2', locationType: 'partial', locations: ['Boston, MA','Culver City, CA','Corvallis, OR','Fremont, CA','Kansas City, MO','Manchester, LA','Springfield, IL','Tampa, FL','Tucson, AZ','Austin, TX'] },
  { id: 'u2', name: 'Brian Carter',   initials: 'BC', color: '#e67e22', locationType: 'partial', locations: ['Boston, MA','Culver City, CA'] },
  { id: 'u3', name: 'Daniel Foster',  initials: 'DF', color: '#27ae60', locationType: 'all',     locations: [] },
  { id: 'u4', name: 'Michael Turner', initials: 'MT', color: '#8e44ad', locationType: 'partial', locations: ['Boston, MA','Culver City, CA','Corvallis, OR','Fremont, CA','Kansas City, MO'] },
  { id: 'u5', name: 'Steven Walker',  initials: 'SW', color: '#c0392b', locationType: 'partial', locations: ['Boston, MA','Culver City, CA','Corvallis, OR','Fremont, CA','Kansas City, MO','Manchester, LA','Springfield, IL','Tampa, FL','Tucson, AZ','Austin, TX'] },
  { id: 'u6', name: 'William Smith',  initials: 'WS', color: '#5b7fff', locationType: 'all',     locations: [] },
  { id: 'u7', name: 'John Doe',       initials: 'JD', color: '#e67e22', locationType: 'partial', locations: ['Atlanta, GA','Denver, CO'] },
];

const DEFAULT_STEPS: Step[] = [
  {
    id: 1,
    name: 'Step 1',
    approvers: [
      ALL_APPROVERS.find(a => a.id === 'u6')!,
      ALL_APPROVERS.find(a => a.id === 'u7')!,
    ],
    requireMode: 'any',
  },
];

// ─── Avatar ─────────────────────────────────────────────────────────────────────

function Avatar({ initials, color, size = 24 }: { initials: string; color: string; size?: number }) {
  return (
    <div
      style={{ width: size, height: size, backgroundColor: color, borderRadius: '50%', flexShrink: 0, fontSize: size * 0.38, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      className=""
    >
      {initials}
    </div>
  );
}

// ─── Location count label ────────────────────────────────────────────────────────

function LocationLabel({ approver }: { approver: Approver }) {
  if (approver.locationType === 'all') {
    return <span className="text-[12px] text-[#1976d2] ">All locations</span>;
  }
  return <span className="text-[12px] text-muted-foreground ">{approver.locations.length} location{approver.locations.length !== 1 ? 's' : ''}</span>;
}

// ─── Approver Chip (inline in the input box) ────────────────────────────────────

function ApproverChip({ approver, onRemove }: { approver: Approver; onRemove: () => void }) {
  return (
    <div className="inline-flex items-center gap-[6px] h-[28px] pl-[4px] pr-[6px] rounded-[4px] border border-border bg-background shrink-0">
      <Avatar initials={approver.initials} color={approver.color} size={20} />
      <span className="text-[13px] text-foreground whitespace-nowrap">{approver.name}</span>
      <button className="text-muted-foreground hover:text-[#555] dark:hover:text-[#9ba2b0] flex items-center" onClick={e => { e.stopPropagation(); }}>
        <Info size={14} />
      </button>
      <button className="text-muted-foreground hover:text-[#555] dark:hover:text-[#9ba2b0] flex items-center" onClick={e => { e.stopPropagation(); onRemove(); }}>
        <X size={13} />
      </button>
    </div>
  );
}

// ─── Location Popover ──────────────────────────────────────────────────────────

function LocationPopover({ locations }: { locations: string[] }) {
  return (
    <div className="absolute left-full top-0 ml-[4px] z-30 bg-background border border-border rounded-[8px] shadow-[0_4px_16px_rgba(0,0,0,0.12)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.4)] w-[200px] py-[8px]">
      <div className="px-[16px] pb-[6px]">
        <span className="text-[12px] text-muted-foreground uppercase tracking-[0.5px]">Locations</span>
      </div>
      {locations.slice(0, 6).map(loc => (
        <div key={loc} className="px-[16px] py-[5px] text-[13px] text-foreground hover:bg-muted cursor-default">{loc}</div>
      ))}
    </div>
  );
}

// ─── Approver Dropdown ─────────────────────────────────────────────────────────

function ApproverDropdown({
  available, onAdd, onClose,
}: {
  available: Approver[];
  onAdd: (a: Approver) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState<'all' | 'partial'>('all');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const filtered = available.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const hoveredApprover = filtered.find(a => a.id === hoveredId);

  return (
    <div ref={ref} className="absolute top-full left-0 mt-[4px] z-20 bg-background border border-border rounded-[8px] shadow-[0_4px_20px_rgba(0,0,0,0.12)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]" style={{ width: 460 }}>
      {/* Filter header */}
      <div className="flex items-center gap-[4px] px-[16px] pt-[12px] pb-[8px]">
        <span className="text-[13px] text-muted-foreground">Filter users</span>
        <button
          className="inline-flex items-center gap-[2px] text-[13px] text-[#1976d2] "
          onClick={() => setLocationFilter(locationFilter === 'all' ? 'partial' : 'all')}
        >
          {locationFilter === 'all' ? 'All locations' : 'Specific locations'}
          <ChevronDown size={14} />
        </button>
      </div>

      {/* Search */}
      <div className="relative px-[8px] pb-[8px]">
        <Search size={14} className="absolute left-[20px] top-[50%] -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          autoFocus
          type="text"
          placeholder="Search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-[36px] pl-[34px] pr-[12px] border border-border bg-background rounded-[6px] text-[13px] text-foreground outline-none focus:border-[#1976d2] dark:focus:border-[#5b9cf6] placeholder-[#aaa] dark:placeholder:text-[#6b7a94]"
        />
      </div>

      {/* User list */}
      <div className="max-h-[240px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-[16px] py-[12px] text-[13px] text-muted-foreground">No users found</div>
        ) : (() => {
          const allLoc   = filtered.filter(a => a.locationType === 'all');
          const partial  = filtered.filter(a => a.locationType === 'partial');
          const renderRow = (approver: Approver) => (
            <div
              key={approver.id}
              className="relative flex items-center gap-[10px] px-[12px] py-[8px] cursor-pointer hover:bg-muted"
              onClick={() => { onAdd(approver); onClose(); }}
              onMouseEnter={() => setHoveredId(approver.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <Avatar initials={approver.initials} color={approver.color} size={28} />
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-[13px] text-foreground">{approver.name}</span>
                <div className="flex items-center gap-[4px]">
                  {approver.locationType === 'all' ? (
                    <span className="text-[12px] text-[#1976d2] ">All locations</span>
                  ) : (
                    <>
                      <span className="text-[12px] text-muted-foreground">
                        {approver.locations.length} location{approver.locations.length !== 1 ? 's' : ''}
                      </span>
                      <ChevronDown size={13} className="text-muted-foreground" />
                    </>
                  )}
                </div>
              </div>
              {hoveredId === approver.id && approver.locationType === 'partial' && approver.locations.length > 0 && (
                <LocationPopover locations={approver.locations} />
              )}
            </div>
          );
          return (
            <>
              {allLoc.length > 0 && (
                <>
                  {/* Recommended section label — subtle */}
                  <div className="px-[12px] pt-[6px] pb-[2px] flex items-center gap-[4px]">
                    <span className="text-[11px] text-[#1976d2] uppercase tracking-[0.5px]">Recommended</span>
                    <span className="text-[11px] text-muted-foreground">· covers all locations</span>
                  </div>
                  {allLoc.map(renderRow)}
                  {partial.length > 0 && <div className="mx-[12px] my-[4px] border-t border-border" />}
                </>
              )}
              {partial.map(renderRow)}
            </>
          );
        })()}
      </div>
    </div>
  );
}

// ─── Step Card ─────────────────────────────────────────────────────────────────

function StepCard({
  step, stepIndex, onUpdate, onDelete, canDelete,
}: {
  step: Step;
  stepIndex: number;
  onUpdate: (updated: Step) => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(step.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const chipAreaRef = useRef<HTMLDivElement>(null);

  const available = ALL_APPROVERS.filter(a => !step.approvers.find(s => s.id === a.id));
  const approversLeft = ALL_APPROVERS.length - step.approvers.length;
  const covered = hasAllLocationsApprover(step);

  const removeApprover = (id: string) => {
    onUpdate({ ...step, approvers: step.approvers.filter(a => a.id !== id) });
  };

  const addApprover = (a: Approver) => {
    onUpdate({ ...step, approvers: [...step.approvers, a] });
  };

  const finishEditName = () => {
    setEditingName(false);
    onUpdate({ ...step, name: nameValue || `Step ${stepIndex + 1}` });
  };

  return (
    <div className="bg-background border border-border rounded-[8px] overflow-visible">
      {/* Step header */}
      <div className="flex items-center gap-[10px] px-[20px] pt-[20px] pb-[12px]">
        {/* Status circle — green when covered, amber when not */}
        <div
          className="w-[24px] h-[24px] rounded-full flex items-center justify-center shrink-0 transition-colors"
          style={{ backgroundColor: covered ? '#34a853' : '#f59e0b' }}
        >
          {covered
            ? <Check size={14} color="white" strokeWidth={2.5} />
            : <AlertTriangle size={13} color="white" strokeWidth={2.5} />
          }
        </div>

        {/* Step name + edit */}
        {editingName ? (
          <input
            ref={inputRef}
            autoFocus
            value={nameValue}
            onChange={e => setNameValue(e.target.value)}
            onBlur={finishEditName}
            onKeyDown={e => { if (e.key === 'Enter') finishEditName(); }}
            className="text-[16px] text-foreground border-b border-[#1976d2] outline-none bg-transparent"
          />
        ) : (
          <span className="text-[16px] text-foreground">
            {step.name}
          </span>
        )}

        <button
          className="text-muted-foreground hover:text-[#1976d2] dark:hover:text-[#5b9cf6]"
          onClick={() => { setEditingName(true); setTimeout(() => inputRef.current?.focus(), 0); }}
        >
          <Pencil size={15} />
        </button>

        {canDelete && (
          <button className="ml-auto text-muted-foreground hover:text-[#de1b0c]" onClick={onDelete}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Require mode row */}
      <div className="px-[20px] pb-[12px] flex items-center gap-[6px]">
        <span className="text-[13px] text-muted-foreground">Require approval from</span>
        <button className="inline-flex items-center gap-[2px] text-[13px] text-[#1976d2] ">
          {step.requireMode === 'any' ? 'any' : 'all'}
          <ChevronDown size={14} />
        </button>
        <span className="text-[13px] text-muted-foreground">of these approvers</span>
      </div>

      {/* Approvers label + chip input box */}
      <div className="px-[20px] pb-[20px]">
        <div className="mb-[6px]">
          <span className="text-[12px] text-muted-foreground">Approvers<span className="text-[#de1b0c]">*</span></span>
        </div>

        {/* Chip input area */}
        <div className="relative">
          <div
            ref={chipAreaRef}
            className="flex flex-wrap items-center gap-[6px] min-h-[44px] px-[8px] py-[6px] border border-border bg-background rounded-[6px] cursor-text focus-within:border-[#1976d2] dark:focus-within:border-[#5b9cf6] transition-colors"
            onClick={() => { if (!showDropdown && available.length > 0) setShowDropdown(true); }}
          >
            {step.approvers.map(a => (
              <ApproverChip key={a.id} approver={a} onRemove={() => removeApprover(a.id)} />
            ))}
            {/* Blinking cursor input */}
            <input
              type="text"
              className="outline-none border-none bg-transparent text-[13px] text-foreground placeholder-[#bbb] dark:placeholder:text-[#6b7a94] min-w-[40px] flex-1"
              placeholder={step.approvers.length === 0 ? 'Aa' : ''}
              onFocus={() => { if (available.length > 0) setShowDropdown(true); }}
              readOnly
            />
          </div>

          {/* Dropdown */}
          {showDropdown && (
            <ApproverDropdown
              available={available}
              onAdd={addApprover}
              onClose={() => setShowDropdown(false)}
            />
          )}
        </div>

        {/* Approvers left + subtle coverage hint */}
        <div className="mt-[6px] flex items-center justify-between">
          <span className="text-[12px] text-muted-foreground">
            {approversLeft} approver{approversLeft !== 1 ? 's' : ''} left
          </span>
          {!covered && step.approvers.length > 0 && (
            <span className="flex items-center gap-[4px] text-[12px] text-[#f59e0b]">
              <AlertTriangle size={12} />
              Add an all-locations approver to avoid unattended posts
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Workflow Editor ────────────────────────────────────────────────────────────

function WorkflowEditor({ workflow, onBack }: { workflow: Workflow; onBack: () => void }) {
  const [name, setName] = useState(workflow.name);
  const [editingName, setEditingName] = useState(false);
  const [steps, setSteps] = useState<Step[]>(DEFAULT_STEPS);
  const [saved, setSaved] = useState(false);
  const [showCoverageWarning, setShowCoverageWarning] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const allStepsCovered = steps.every(hasAllLocationsApprover);

  const updateStep = (id: number, updated: Step) => {
    setSteps(prev => prev.map(s => s.id === id ? updated : s));
  };

  const deleteStep = (id: number) => {
    setSteps(prev => prev.filter(s => s.id !== id));
  };

  const addStep = () => {
    if (steps.length >= 10) return;
    const newId = Math.max(...steps.map(s => s.id), 0) + 1;
    setSteps(prev => [...prev, { id: newId, name: `Step ${newId}`, approvers: [], requireMode: 'any' }]);
  };

  const handleSave = () => {
    if (!allStepsCovered && !showCoverageWarning) {
      // First click: surface the warning, don't block
      setShowCoverageWarning(true);
      return;
    }
    setSaved(true);
    setShowCoverageWarning(false);
    setTimeout(() => { setSaved(false); onBack(); }, 1200);
  };

  return (
    <div className="flex flex-col h-full bg-background transition-colors duration-300">
      {/* Breadcrumb + header row */}
      <div className="border-b border-border px-[24px] shrink-0">
        {/* Breadcrumb */}
        <div className="flex items-center gap-[6px] pt-[12px] pb-[4px]">
          <button
            onClick={onBack}
            className="text-[13px] text-[#1976d2] hover:underline"
          >
            Approvals
          </button>
          <ChevronDown size={13} className="text-muted-foreground -rotate-90" />
          <span className="text-[13px] text-[#1976d2] ">{name}</span>
        </div>

        {/* Title + actions */}
        <div className="flex items-center justify-between py-[10px]">
          <div className="flex items-center gap-[8px]">
            {editingName ? (
              <input
                ref={nameRef}
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                onBlur={() => setEditingName(false)}
                onKeyDown={e => { if (e.key === 'Enter') setEditingName(false); }}
                className="font-normal text-[22px] text-foreground border-b-2 border-[#1976d2] outline-none bg-transparent"
              />
            ) : (
              <h1
                className="font-normal text-[22px] text-foreground tracking-[-0.44px]"
              >
                {name}
              </h1>
            )}
            <button
              className="text-muted-foreground hover:text-[#1976d2] dark:hover:text-[#5b9cf6] mt-[2px]"
              onClick={() => { setEditingName(true); setTimeout(() => nameRef.current?.focus(), 0); }}
            >
              <Pencil size={16} />
            </button>
          </div>

          <div className="flex items-center gap-[8px]">
            {saved && (
              <span className="text-[13px] text-[#34a853] flex items-center gap-[4px]">
                <Check size={14} /> Saved
              </span>
            )}
            {/* Subtle coverage warning — only shown on first save attempt if gaps exist */}
            {showCoverageWarning && !saved && (
              <span className="text-[12px] text-[#f59e0b] flex items-center gap-[4px]">
                <AlertTriangle size={13} />
                Some steps may leave posts unattended. Save anyway?
              </span>
            )}
            <button
              onClick={handleSave}
              className="h-[36px] px-[20px] rounded-md bg-[#1976d2] text-[14px] text-white hover:bg-primary/90 transition-colors"
            >
              {showCoverageWarning ? 'Save anyway' : 'Save'}
            </button>
            <button className="h-[36px] w-[36px] flex items-center justify-center rounded-md border border-border bg-background hover:bg-muted">
              <MoreVertical size={16} className="text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="flex-1 overflow-y-auto px-[24px] py-[20px] bg-muted ">
        <div className="max-w-[860px] mx-auto flex flex-col gap-[12px]">
          {steps.map((step, i) => (
            <StepCard
              key={step.id}
              step={step}
              stepIndex={i}
              onUpdate={updated => updateStep(step.id, updated)}
              onDelete={() => deleteStep(step.id)}
              canDelete={steps.length > 1}
            />
          ))}

          {/* Add step button */}
          {steps.length < 10 && (
            <button
              onClick={addStep}
              className="flex items-center gap-[10px] w-full px-[20px] py-[14px] border border-dashed border-border rounded-[8px] text-[#1976d2] hover:border-[#1976d2] dark:hover:border-[#5b9cf6] hover:bg-muted transition-colors"
            >
              <div className="w-[22px] h-[22px] rounded-full border-2 border-[#1976d2] flex items-center justify-center shrink-0">
                <Plus size={13} strokeWidth={2.5} />
              </div>
              <span className="text-[14px]">Add step</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Workflow List ──────────────────────────────────────────────────────────────

function WorkflowList({ onEdit, onCreate }: { onEdit: (wf: Workflow) => void; onCreate: () => void }) {
  const [workflows, setWorkflows] = useState(WORKFLOWS);
  const [sortCol, setSortCol] = useState<'name' | 'status' | 'lastUpdated' | 'updatedBy'>('lastUpdated');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState('');

  const toggleSort = (col: typeof sortCol) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const filtered = workflows.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  const SortIcon = ({ col }: { col: typeof sortCol }) => (
    <ChevronDown
      size={13}
      className={`text-[#aaa] transition-transform ${sortCol === col && sortDir === 'asc' ? 'rotate-180' : ''}`}
    />
  );

  const ColHeader = ({ col, label }: { col: typeof sortCol; label: string }) => (
    <th
      className="text-left py-[10px] px-[16px] cursor-pointer select-none"
      onClick={() => toggleSort(col)}
    >
      <div className="flex items-center gap-[4px]">
        <span className="text-[13px] text-muted-foreground">{label}</span>
        <SortIcon col={col} />
      </div>
    </th>
  );

  const toggleStatus = (id: string) => {
    setWorkflows(prev => prev.map(w =>
      w.id === id ? { ...w, status: w.status === 'Enabled' ? 'Disabled' : 'Enabled' } : w
    ));
  };

  return (
    <div className="flex flex-col h-full transition-colors duration-300">
      {/* Page header */}
      <div className="border-b border-border px-[24px] h-[64px] flex items-center justify-between shrink-0 bg-background">
        <h1 className="font-normal text-[20px] text-foreground tracking-[-0.4px]">
          {workflows.length} Approvals
        </h1>
        <div className="flex items-center gap-[8px]">
          <button className="h-[36px] w-[36px] flex items-center justify-center rounded-md hover:bg-muted">
            <Search size={18} className="text-muted-foreground" />
          </button>
          <button
            onClick={onCreate}
            className="h-[36px] px-[16px] flex items-center gap-[6px] rounded-md bg-[#1976d2] text-[14px] text-white hover:bg-primary/90 transition-colors"
          >
            Create approval
          </button>
          <button className="h-[36px] w-[36px] flex items-center justify-center rounded-md hover:bg-muted">
            <MoreVertical size={18} className="text-muted-foreground" />
          </button>
          <button className="h-[36px] w-[36px] flex items-center justify-center rounded-md hover:bg-muted">
            <SlidersHorizontal size={18} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto bg-background">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border bg-background sticky top-0">
              <ColHeader col="name" label="Name" />
              <ColHeader col="status" label="Status" />
              <ColHeader col="lastUpdated" label="Last updated" />
              <ColHeader col="updatedBy" label="Updated by" />
              <th className="w-[60px]" />
            </tr>
          </thead>
          <tbody>
            {filtered.map(wf => (
              <tr
                key={wf.id}
                className="border-b border-border hover:bg-muted cursor-pointer group"
                onClick={() => onEdit(wf)}
              >
                <td className="py-[14px] px-[16px]">
                  <span className="text-[14px] text-foreground">{wf.name}</span>
                </td>
                <td className="py-[14px] px-[16px]">
                  <span
                    className="px-[10px] py-[3px] rounded-[4px] text-[13px] cursor-pointer select-none"
                    style={{
                      background: wf.status === 'Enabled' ? '#e8f5e9' : '#f5f5f5',
                      color:      wf.status === 'Enabled' ? '#2e7d32' : '#757575',
                    }}
                    onClick={e => { e.stopPropagation(); toggleStatus(wf.id); }}
                  >
                    {wf.status}
                  </span>
                </td>
                <td className="py-[14px] px-[16px]">
                  <span className="text-[14px] text-muted-foreground">{wf.lastUpdated}</span>
                </td>
                <td className="py-[14px] px-[16px]">
                  <span className="text-[14px] text-muted-foreground">{wf.updatedBy}</span>
                </td>
                <td className="py-[14px] px-[16px]">
                  <button
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-[#555] dark:hover:text-[#9ba2b0]"
                    onClick={e => { e.stopPropagation(); }}
                  >
                    <MoreVertical size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Export ────────────────────────────────────────────────────────────────

export function ApprovalsSetupView() {
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);

  const newWorkflow: Workflow = {
    id: 'new',
    name: 'New workflow',
    status: 'Disabled',
    lastUpdated: 'Today',
    updatedBy: 'You',
  };

  if (editingWorkflow) {
    return (
      <WorkflowEditor
        workflow={editingWorkflow}
        onBack={() => setEditingWorkflow(null)}
      />
    );
  }

  return (
    <WorkflowList
      onEdit={setEditingWorkflow}
      onCreate={() => setEditingWorkflow(newWorkflow)}
    />
  );
}
