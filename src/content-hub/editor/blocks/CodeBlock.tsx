import React from 'react';
import { type BlockComponentProps } from '../blockTypes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/contenthub-ui/select';

interface CodeContent { language: string; code: string }

const LANGUAGES = ['javascript', 'typescript', 'python', 'html', 'css', 'json', 'bash', 'sql'];

export function CodeBlock({ content, focused, onChange }: BlockComponentProps<CodeContent>) {
  const { language, code } = content;

  return (
    <div className="w-full rounded-lg overflow-hidden border border-border bg-surface">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface border-b border-zinc-800">
        <Select
          value={language}
          onValueChange={value => onChange({ language: value })}
        >
          <SelectTrigger size="sm" className="h-[34px] w-[140px] border-zinc-700 bg-surface text-[11px] capitalize text-text-secondary">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start">
            {LANGUAGES.map(l => (
              <SelectItem key={l} value={l}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1.5">
          <div className="size-2.5 rounded-full bg-surface" />
          <div className="size-2.5 rounded-full bg-surface" />
          <div className="size-2.5 rounded-full bg-surface" />
        </div>
      </div>

      {/* Code textarea */}
      <textarea
        value={code}
        onChange={e => onChange({ code: e.target.value })}
        placeholder={`// ${language} code…`}
        spellCheck={false}
        rows={Math.max(4, code.split('\n').length + 1)}
        className="w-full bg-transparent text-[13px] font-mono text-text-secondary px-4 py-2 outline-none resize-none leading-relaxed placeholder:text-text-secondary"
      />
    </div>
  );
}
