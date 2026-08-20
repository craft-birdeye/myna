/** Measured height of a standard trigger/task/control card (header + step + description). */
export const FLOW_STANDARD_NODE_HEIGHT = 116;

/**
 * Width of the centered spine / branch-arm card wrapper (matches canvas node shells).
 * Passed to React Flow as `initialWidth` (with `initialHeight`) so nodes pass
 * `nodeHasDimensions` immediately — XYFlow keeps undimensioned nodes
 * `visibility:hidden`, which made freshly dropped cards vanish on scratch create.
 */
export const FLOW_CARD_WIDTH = 432;

export const FLOW_START_GAP = 150;
/** Measured height of the Start pill (icon + title + locations link). */
export const FLOW_START_NODE_HEIGHT = 74;

/**
 * Gap between node bottom and the next node top — also used by EndNode connector.
 * Matches the visual Start → first-node gap (FLOW_START_GAP − FLOW_START_NODE_HEIGHT).
 */
export const FLOW_CONNECTOR_GAP = FLOW_START_GAP - FLOW_START_NODE_HEIGHT;

/** Vertical spacing between workflow nodes on the canvas (buildFlow + End connector). */
export const FLOW_NODE_STEP = FLOW_STANDARD_NODE_HEIGHT + FLOW_CONNECTOR_GAP;

/** Measured height of the dashed "Add a trigger" placeholder slot (reserves step 1). */
export const FLOW_TRIGGER_PLACEHOLDER_HEIGHT = 62;
