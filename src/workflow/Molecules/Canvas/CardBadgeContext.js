import { createContext, useContext } from 'react';

/** Whether the floating type-badge treatment (Trigger/Action/Branch pill above each card,
 *  no inline icon+label inside) is active — true only for the "Response agents (Full canvas)"
 *  nav segment, a design sandbox. Avoids threading a prop through every FlowCanvas node
 *  wrapper; CanvasNodeHeader/StartNode read it directly. */
const CardBadgeContext = createContext(false);

export function useCardBadge() {
  return useContext(CardBadgeContext);
}

export default CardBadgeContext;
