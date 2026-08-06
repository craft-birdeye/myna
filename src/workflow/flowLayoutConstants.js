/** Vertical spacing between workflow nodes on the canvas (buildFlow + End connector). */
export const FLOW_NODE_STEP = 250;

/** Measured height of a standard trigger/task/control card (header + step + description). */
export const FLOW_STANDARD_NODE_HEIGHT = 94;

/** Gap between node bottom and the next node top — also used by EndNode connector. */
export const FLOW_CONNECTOR_GAP = FLOW_NODE_STEP - FLOW_STANDARD_NODE_HEIGHT;

export const FLOW_START_GAP = 150;
export const FLOW_START_NODE_HEIGHT = 62;
