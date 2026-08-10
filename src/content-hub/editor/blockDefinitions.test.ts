import { describe, expect, it } from 'vitest';
import { BLOCK_CATALOG, defaultContent, type BlockType } from './blockTypes';
import { BLOCK_DEFINITIONS } from './blockDefinitions';

describe('BLOCK_DEFINITIONS', () => {
  it('defines every catalog block with defaults and inspector fields', () => {
    const uniqueTypes = Array.from(new Set(BLOCK_CATALOG.map(block => block.type)));

    uniqueTypes.forEach(type => {
      const definition = BLOCK_DEFINITIONS[type];
      expect(definition, type).toBeTruthy();
      expect(defaultContent(type)).toBeTypeOf('object');
      expect(definition.inspector.length, type).toBeGreaterThan(0);
      expect(definition.inspector.some(group => group.fields.length > 0), type).toBe(true);
    });
  });

  it.each<BlockType>(['cta', 'hero', 'image', 'lead-form', 'pricing-table', 'faq-section', 'author-bar'])(
    'includes representative inspector controls for %s',
    type => {
      const fields = BLOCK_DEFINITIONS[type].inspector.flatMap(group => group.fields);
      expect(fields.length).toBeGreaterThan(0);
      expect(fields.some(field => field.path.startsWith('content.'))).toBe(true);
    },
  );
});
