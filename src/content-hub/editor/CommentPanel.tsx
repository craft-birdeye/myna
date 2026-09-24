/**
 * CommentPanel
 *
 * Right-side slide-in panel for comment management inside ContentEditorShell.
 * Mirrors EditorScorePanel in structure (zero-width when closed, 300px when open).
 *
 * Features:
 *  - Comment cards with resolve, reply, and more actions (Edit, Delete, Copy link, Report)
 *  - New comment input at the bottom
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Check,
  Copy,
  Edit2,
  Flag,
  MoreHorizontal,
  Send,
  Trash2,
  X,
  CornerDownRight,
} from 'lucide-react';
import { cn } from '@/contenthub-ui/utils';
import { Button } from '@/contenthub-ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/contenthub-ui/dropdown-menu';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Reply {
  id: string;
  author: string;
  initials: string;
  color: string;
  timestamp: string;
  text: string;
}

interface Comment {
  id: string;
  author: string;
  initials: string;
  color: string;
  timestamp: string;
  text: string;
  anchor?: string;
  resolved: boolean;
  replies: Reply[];
}

// ── Mock data ──────────────────────────────────────────────────────────────────

const INITIAL_COMMENTS: Comment[] = [
  {
    id: 'c1',
    author: 'Maya Singh',
    initials: 'MS',
    color: '#7c3aed',
    timestamp: '2 hours ago',
    text: 'This section needs more specific location keywords to improve local SEO.',
    anchor: 'FAQ overview',
    resolved: false,
    replies: [
      {
        id: 'r1',
        author: 'You',
        initials: 'YO',
        color: '#2552ED',
        timestamp: '1 hour ago',
        text: 'Good point, will update with city-specific terms.',
      },
    ],
  },
  {
    id: 'c2',
    author: 'Jon Bell',
    initials: 'JB',
    color: '#0891b2',
    timestamp: '3 hours ago',
    text: 'The answer to Q3 could be more concise. Recommend cutting the last two sentences.',
    anchor: 'Question 3',
    resolved: false,
    replies: [],
  },
  {
    id: 'c3',
    author: 'Nina Patel',
    initials: 'NP',
    color: '#d97706',
    timestamp: 'Yesterday',
    text: 'Can we add a schema markup reference here? It would help the AEO score significantly.',
    anchor: 'FAQ overview',
    resolved: false,
    replies: [],
  },
  {
    id: 'c4',
    author: 'Maya Singh',
    initials: 'MS',
    color: '#7c3aed',
    timestamp: '2 days ago',
    text: 'Approved the tone adjustments on this section.',
    resolved: true,
    replies: [],
  },
];

// ── Avatar ─────────────────────────────────────────────────────────────────────

function Avatar({ initials, color, size = 'md' }: { initials: string; color: string; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'size-6 text-[10px]' : 'size-[34px] text-[12px]';
  return (
    <div
      className={cn('flex shrink-0 items-center justify-center rounded-full text-white', sizeClass)}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}

// ── Reply input ────────────────────────────────────────────────────────────────

function ReplyInput({
  onSubmit,
  onCancel,
}: {
  onSubmit: (text: string) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (text.trim()) onSubmit(text.trim());
    }
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div className="mt-2 flex flex-col gap-1.5 rounded-lg border border-border bg-background p-2">
      <textarea
        ref={ref}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Reply..."
        rows={2}
        className="w-full resize-none bg-transparent text-[12px] text-foreground outline-none placeholder:text-muted-foreground"
      />
      <div className="flex items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
        >
          Cancel
        </button>
        <Button
          type="button"
          size="sm"
          onClick={() => { if (text.trim()) onSubmit(text.trim()); }}
          disabled={!text.trim()}
          className="h-6 px-2.5 text-[11px]"
        >
          Reply
        </Button>
      </div>
    </div>
  );
}

// ── Comment card ───────────────────────────────────────────────────────────────

function CommentCard({
  comment,
  onResolve,
  onDelete,
  onEdit,
  onAddReply,
}: {
  comment: Comment;
  onResolve: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onAddReply: (commentId: string, text: string) => void;
}) {
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [showReplies, setShowReplies] = useState(true);

  const handleEditSubmit = () => {
    if (editText.trim()) {
      onEdit(comment.id, editText.trim());
      setEditing(false);
    }
  };

  return (
    <div
      className={cn(
        'rounded-lg border px-2 py-2 transition-colors',
        comment.resolved
          ? 'border-border/40 bg-muted/20 opacity-60'
          : 'border-border/60 bg-background',
      )}
    >
      {/* Anchor label */}
      {comment.anchor && (
        <p className="mb-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
          {comment.anchor}
        </p>
      )}

      {/* Author row */}
      <div className="flex items-start gap-2">
        <Avatar initials={comment.initials} color={comment.color} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] text-foreground">{comment.author}</span>
              <span className="text-[11px] text-muted-foreground">{comment.timestamp}</span>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              {/* Resolve toggle */}
              <button
                type="button"
                onClick={() => onResolve(comment.id)}
                title={comment.resolved ? 'Unresolve' : 'Resolve'}
                className={cn(
                  'flex size-6 items-center justify-center rounded-md transition-colors',
                  comment.resolved
                    ? 'text-primary hover:bg-surface-hover'
                    : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground',
                )}
              >
                <Check size={13} strokeWidth={1.6} absoluteStrokeWidth />
              </button>

              {/* More actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
                  >
                    <MoreHorizontal size={13} strokeWidth={1.6} absoluteStrokeWidth />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem className="gap-2 text-[13px]" onSelect={() => setEditing(true)}>
                    <Edit2 size={13} strokeWidth={1.6} absoluteStrokeWidth />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="gap-2 text-[13px] text-destructive focus:text-destructive"
                    onSelect={() => onDelete(comment.id)}
                  >
                    <Trash2 size={13} strokeWidth={1.6} absoluteStrokeWidth />
                    Delete
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 text-[13px]">
                    <Copy size={13} strokeWidth={1.6} absoluteStrokeWidth />
                    Copy link
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 text-[13px]">
                    <Flag size={13} strokeWidth={1.6} absoluteStrokeWidth />
                    Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Comment body */}
          {editing ? (
            <div className="mt-1.5 flex flex-col gap-1.5">
              <textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                rows={2}
                autoFocus
                className="w-full resize-none rounded-md border border-border bg-background px-2 py-1.5 text-[12px] text-foreground outline-none focus:border-primary"
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditSubmit(); }
                  if (e.key === 'Escape') { setEditing(false); setEditText(comment.text); }
                }}
              />
              <div className="flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => { setEditing(false); setEditText(comment.text); }}
                  className="rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:bg-surface-hover"
                >
                  Cancel
                </button>
                <Button
                  size="sm"
                  onClick={handleEditSubmit}
                  disabled={!editText.trim()}
                  className="h-6 px-2.5 text-[11px]"
                >
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-1 text-[12px] leading-5 text-foreground">{comment.text}</p>
          )}

          {/* Replies */}
          {comment.replies.length > 0 && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setShowReplies(v => !v)}
                className="flex items-center gap-1 text-[11px] text-primary hover:underline"
              >
                <CornerDownRight size={11} strokeWidth={1.6} absoluteStrokeWidth />
                {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
              </button>
              {showReplies && (
                <div className="mt-2 flex flex-col gap-2 border-l-2 border-border pl-3">
                  {comment.replies.map(reply => (
                    <div key={reply.id} className="flex items-start gap-2">
                      <Avatar initials={reply.initials} color={reply.color} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-foreground">{reply.author}</span>
                          <span className="text-[10px] text-muted-foreground">{reply.timestamp}</span>
                        </div>
                        <p className="mt-0.5 text-[12px] leading-5 text-foreground">{reply.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reply action */}
          {!comment.resolved && !replying && (
            <button
              type="button"
              onClick={() => setReplying(true)}
              className="mt-1.5 text-[11px] text-muted-foreground transition-colors hover:text-primary"
            >
              Reply
            </button>
          )}

          {replying && (
            <ReplyInput
              onSubmit={text => { onAddReply(comment.id, text); setReplying(false); }}
              onCancel={() => setReplying(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Panel inner content ────────────────────────────────────────────────────────

function CommentPanelContent({ onClose }: { onClose: () => void }) {
  const [comments, setComments] = useState<Comment[]>(INITIAL_COMMENTS);
  const [newText, setNewText] = useState('');
  const newCommentIdRef = useRef(100);

  const visibleComments = comments
    .filter(c => !c.resolved)
    .sort((a, b) => (a.anchor ?? '').localeCompare(b.anchor ?? ''));

  const handleResolve = (id: string) => {
    setComments(prev => prev.map(c => c.id === id ? { ...c, resolved: !c.resolved } : c));
  };

  const handleDelete = (id: string) => {
    setComments(prev => prev.filter(c => c.id !== id));
  };

  const handleEdit = (id: string, text: string) => {
    setComments(prev => prev.map(c => c.id === id ? { ...c, text } : c));
  };

  const handleAddReply = (commentId: string, text: string) => {
    setComments(prev => prev.map(c =>
      c.id === commentId
        ? {
            ...c,
            replies: [...c.replies, {
              id: `r${++newCommentIdRef.current}`,
              author: 'You',
              initials: 'YO',
              color: '#2552ED',
              timestamp: 'Just now',
              text,
            }],
          }
        : c,
    ));
  };

  const handleAddComment = () => {
    if (!newText.trim()) return;
    setComments(prev => [{
      id: `c${++newCommentIdRef.current}`,
      author: 'You',
      initials: 'YO',
      color: '#2552ED',
      timestamp: 'Just now',
      text: newText.trim(),
      resolved: false,
      replies: [],
    }, ...prev]);
    setNewText('');
  };

  const unresolvedCount = comments.filter(c => !c.resolved).length;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between bg-surface px-2xl py-xl">
        <div className="flex items-center gap-2">
          <span className="text-[14px] text-foreground">Comments</span>
          {unresolvedCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">
              {unresolvedCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
            aria-label="Close comments"
          >
            <X size={14} strokeWidth={1.6} absoluteStrokeWidth />
          </button>
        </div>
      </div>

      {/* Comment list */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {visibleComments.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="text-[13px] text-foreground">No comments</p>
            <p className="text-[12px] text-muted-foreground">
              Be the first to leave a comment.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {visibleComments.map(comment => (
              <CommentCard
                key={comment.id}
                comment={comment}
                onResolve={handleResolve}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onAddReply={handleAddReply}
              />
            ))}
          </div>
        )}
      </div>

      {/* New comment input */}
      <div className="shrink-0 border-t border-border px-2 py-2">
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-background p-2 transition-colors focus-within:border-primary/60">
          <textarea
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); }
            }}
            placeholder="Add a comment or @mention"
            rows={2}
            className="w-full resize-none bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-muted-foreground">
              <button type="button" className="flex size-6 items-center justify-center rounded-md transition-colors hover:bg-surface-hover hover:text-foreground" title="Mention">
                <span className="text-[13px]">@</span>
              </button>
            </div>
            <button
              type="button"
              onClick={handleAddComment}
              disabled={!newText.trim()}
              className={cn(
                'flex size-6 items-center justify-center rounded-full transition-colors',
                newText.trim()
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground',
              )}
              aria-label="Submit comment"
            >
              <Send size={12} strokeWidth={1.6} absoluteStrokeWidth />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Exported panel wrapper ─────────────────────────────────────────────────────

export interface CommentPanelProps {
  open: boolean;
  onClose: () => void;
}

export function CommentPanel({ open, onClose }: CommentPanelProps) {
  return (
    <div
      className={cn(
        'flex-none flex flex-col h-full transition-all duration-200 overflow-hidden',
        open ? 'w-[300px]' : 'w-0',
      )}
      aria-hidden={!open}
    >
      {/* Fixed-width inner so content doesn't squish during slide */}
      <div className="w-[300px] flex flex-col flex-1 min-h-0 rounded-xl border border-border/60 bg-background overflow-hidden">
        {open && <CommentPanelContent onClose={onClose} />}
      </div>
    </div>
  );
}
