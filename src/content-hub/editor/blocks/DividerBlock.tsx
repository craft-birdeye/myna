import React from 'react';
import { type BlockComponentProps } from '../blockTypes';

export function DividerBlock(_props: BlockComponentProps) {
  return <hr className="border-t border-border w-full my-1" />;
}
