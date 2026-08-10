import React, { useState } from 'react';
import { MoreVertical, Share2, Copy, FolderInput, Pencil, Trash2, PlusCircle, ChevronDown } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import styles from './TemplateLibrary.module.css';

const DEFAULT_TEMPLATES = [
  { id: '1', title: 'Review response agent replying using templates',        description: 'Uses pre-defined templates and responds to reviews automatically.' },
  { id: '2', title: 'Review response agent replying autonomously',           description: 'Uses AI to analyze review sentiment, generates and posts unique, context aware replies automatically.' },
  { id: '3', title: 'Review response agent replying after human approval',   description: 'Uses AI to analyze review sentiment, generates and sends unique, context-aware replies for a human approval before posting.' },
  { id: '4', title: 'Review response agent suggesting replies in dashboard', description: 'Uses AI to analyze review sentiment, generates and shows unique, context-aware replies in the dashboard for one-click manual posting.' },
];

const emptyDraft = { title: '', description: '' };

function TemplateForm({ initialTemplate = emptyDraft, onCancel, onSave }) {
  const [draft, setDraft] = useState({
    title: initialTemplate.title || '',
    description: initialTemplate.description || '',
  });
  const canSave = draft.title.trim() && draft.description.trim();

  return (
    <div className={styles.form}>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Template title</label>
        <input
          type="text"
          placeholder="Enter template title"
          value={draft.title}
          onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
          className="h-[34px] rounded-md border border-border bg-background px-2 text-[13px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Template description</label>
        <textarea
          placeholder="Describe what this template should create"
          value={draft.description}
          onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
          rows={3}
          className="rounded-md border border-border bg-background px-2 py-2 text-[13px] text-foreground outline-none resize-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>
      <div className={styles.formActions}>
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" disabled={!canSave} onClick={() => onSave({ ...initialTemplate, title: draft.title.trim(), description: draft.description.trim() })}>
          Save
        </Button>
      </div>
    </div>
  );
}

function CardMenu({ template, onShare, onDuplicate, onMove, onEdit, onDelete }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`h-7 w-7 ${styles.hoverBtn}`}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-3.5 w-3.5" strokeWidth={1.6} absoluteStrokeWidth />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        <DropdownMenuItem onClick={() => onShare?.(template)}>
          <Share2 className="h-3.5 w-3.5" strokeWidth={1.6} absoluteStrokeWidth />
          Share
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDuplicate?.(template)}>
          <Copy className="h-3.5 w-3.5" strokeWidth={1.6} absoluteStrokeWidth />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onMove?.(template)}>
          <FolderInput className="h-3.5 w-3.5" strokeWidth={1.6} absoluteStrokeWidth />
          Move to
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit?.()}>
          <Pencil className="h-3.5 w-3.5" strokeWidth={1.6} absoluteStrokeWidth />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => onDelete?.(template.id)}
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.6} absoluteStrokeWidth />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TemplateGridCard({ template, onDelete, onSave, onUse, onShare, onDuplicate, onMove, viewOnly = false }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className={styles.card}>
        <TemplateForm
          initialTemplate={template}
          onCancel={() => setEditing(false)}
          onSave={(next) => { onSave?.(next); setEditing(false); }}
        />
      </div>
    );
  }

  if (viewOnly) {
    return (
      <div className={styles.card}>
        <div className={styles.cardBody}>
          <p className={`${styles.title} ${styles.clampTitle}`}>{template.title}</p>
          <p className={`${styles.description} ${styles.clampDescription}`}>{template.description}</p>
        </div>
        <div className={styles.cardActions}>
          <Button size="sm" className={styles.useAgentBtn} onClick={() => onUse?.(template.id)}>
            Use agent
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardBody}>
        <p className={`${styles.title} ${styles.clampTitle}`}>{template.title}</p>
        <p className={`${styles.description} ${styles.clampDescription}`}>{template.description}</p>
      </div>
      <div className={styles.cardActions}>
        <Button size="sm" className={styles.useAgentBtn} onClick={() => onUse?.(template.id)}>
          Use agent
        </Button>
        <CardMenu
          template={template}
          onShare={onShare}
          onDuplicate={onDuplicate}
          onMove={onMove}
          onEdit={() => setEditing(true)}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}

function AddTemplateCard({ onSave }) {
  const [adding, setAdding] = useState(false);

  if (adding) {
    return (
      <div className={styles.card}>
        <TemplateForm
          onCancel={() => setAdding(false)}
          onSave={(tmpl) => { onSave?.(tmpl); setAdding(false); }}
        />
      </div>
    );
  }

  return (
    <button className={`${styles.card} ${styles.addCard}`} type="button" onClick={() => setAdding(true)}>
      <PlusCircle className={styles.addIcon} strokeWidth={1.6} />
      <span className={styles.title}>Add template</span>
    </button>
  );
}

function TemplateListView({ templates, onCreateTemplate, onDeleteTemplate, onSaveTemplate, onUseTemplate, onShareTemplate, onDuplicateTemplate, onMoveTemplate, viewOnly = false }) {
  return (
    <div className={styles.list}>
      <div className={styles.listHeader}>
        <div className={styles.listHeaderName}>
          <span>Name</span>
          <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.6} absoluteStrokeWidth />
        </div>
      </div>

      {templates.map((template) => (
        <div key={template.id} className={`${styles.row} ${viewOnly ? styles.rowViewOnly : ''}`}>
          <div className={styles.rowBody}>
            <span className={styles.rowTitle}>{template.title}</span>
            <span className={styles.rowDescription}>{template.description}</span>
          </div>
          {viewOnly ? (
            <Button size="sm" className={styles.useAgentBtn} onClick={() => onUseTemplate?.(template.id)}>
              Use agent
            </Button>
          ) : (
            <div className={styles.rowActions}>
              <Button size="sm" className={styles.useAgentBtn} onClick={() => onUseTemplate?.(template.id)}>
                Use agent
              </Button>
              <CardMenu
                template={template}
                onShare={onShareTemplate}
                onDuplicate={onDuplicateTemplate}
                onMove={onMoveTemplate}
                onEdit={() => onSaveTemplate?.({ ...template, editRequested: true })}
                onDelete={onDeleteTemplate}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function TemplateLibrary({
  templates = DEFAULT_TEMPLATES,
  variant = 'grid',
  initialCount = 3,
  onCreateTemplate,
  onDeleteTemplate,
  onSaveTemplate,
  onUseTemplate,
  onShareTemplate,
  onDuplicateTemplate,
  onMoveTemplate,
  onSeeMore,
  viewOnly = false,
}) {
  const [listEditTemplate, setListEditTemplate] = useState(null);
  const visible = variant === 'see-more' ? templates.slice(0, initialCount) : templates;
  const hasMore = variant === 'see-more' && templates.length > initialCount;

  if (variant === 'list') {
    if (listEditTemplate) {
      return (
        <div className={styles.card}>
          <TemplateForm
            initialTemplate={listEditTemplate}
            onCancel={() => setListEditTemplate(null)}
            onSave={(tmpl) => { onSaveTemplate?.(tmpl); setListEditTemplate(null); }}
          />
        </div>
      );
    }
    return (
      <TemplateListView
        templates={templates}
        onCreateTemplate={onCreateTemplate}
        onDeleteTemplate={onDeleteTemplate}
        onSaveTemplate={setListEditTemplate}
        onUseTemplate={onUseTemplate}
        onShareTemplate={onShareTemplate}
        onDuplicateTemplate={onDuplicateTemplate}
        onMoveTemplate={onMoveTemplate}
        viewOnly={viewOnly}
      />
    );
  }

  return (
    <div className={styles.library}>
      <div className={styles.grid}>
        {visible.map((template) => (
          <TemplateGridCard
            key={template.id}
            template={template}
            onDelete={onDeleteTemplate}
            onSave={onSaveTemplate}
            onUse={onUseTemplate}
            onShare={onShareTemplate}
            onDuplicate={onDuplicateTemplate}
            onMove={onMoveTemplate}
            viewOnly={viewOnly}
          />
        ))}
        {variant !== 'see-more' && !viewOnly && <AddTemplateCard onSave={onCreateTemplate} />}
      </div>

      {hasMore && (
        <button className={styles.seeMore} type="button" onClick={() => onSeeMore?.()}>
          See more
        </button>
      )}
    </div>
  );
}
