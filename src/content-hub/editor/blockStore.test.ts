import { describe, expect, it } from 'vitest';
import { type Block } from './blockTypes';
import { applyBlockPatch } from './blockStore';

const baseBlock: Block = {
  id: 'block-1',
  type: 'cta',
  content: { label: 'Book now', url: '' },
  style: { size: 'md' },
  behavior: { openInNewTab: false },
  settings: {
    alignment: 'left',
    width: 'contained',
    visibility: { desktop: true, tablet: true, mobile: true },
  },
};

describe('applyBlockPatch', () => {
  it('keeps legacy content patches working', () => {
    const next = applyBlockPatch(baseBlock, { label: 'Get started' });

    expect(next.content).toMatchObject({
      label: 'Get started',
      url: '',
    });
  });

  it('patches normalized block roots without losing sibling values', () => {
    const next = applyBlockPatch(baseBlock, {
      content: { url: 'https://example.com' },
      style: { color: 'primary' },
      behavior: { openInNewTab: true },
      settings: { visibility: { mobile: false } },
    });

    expect(next.content).toMatchObject({ label: 'Book now', url: 'https://example.com' });
    expect(next.style).toMatchObject({ size: 'md', color: 'primary' });
    expect(next.behavior).toMatchObject({ openInNewTab: true });
    expect(next.settings.visibility).toEqual({ desktop: true, tablet: true, mobile: false });
  });
});
