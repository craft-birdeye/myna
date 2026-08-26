/** Shared field-picker catalog — flat entity fields + nested workflow step trees. */

export const SAMPLE_COLOR = {
  number: '#1976d2',
  string: '#37a248',
  boolean: '#1976d2',
};

const REVIEW_COMMENT = 'This is a great place for boon...';
const REVIEW_DATE = 'Fri, Mar 27, 2026 12:46 AM';

function leaf(name, value, sample, valueType = 'string') {
  return { type: 'field', name, value, sample, valueType };
}

function group(id, label, children, opts = {}) {
  return { type: 'group', id, label, children, ...opts };
}

function objectNode(name, value, children) {
  return {
    type: 'object',
    name,
    value,
    children,
    propertyCount: children.length,
  };
}

export const BASE_CATEGORIES = [
  {
    id: 'business',
    label: 'Business fields',
    sectionLabel: 'Business fields',
    description: 'Fields from your business profile, branding, and account settings.',
    fields: [
      leaf('Business name', 'Business.name', 'Aspen Dental'),
      leaf('Business phone', 'Business.phone', '+1 415-555-0100'),
      leaf('Business email', 'Business.email', 'frontdesk@aspendental.com'),
      leaf('Business address', 'Business.address', '720 Castro St'),
      leaf('Business hours', 'Business.hours', '9:00 AM – 6:00 PM'),
      leaf('Business website', 'Business.website', 'www.aspendental.com'),
      leaf('Business category', 'Business.category', 'Healthcare'),
      leaf('Business rating', 'Business.rating', '4.6', 'number'),
      leaf('Total reviews', 'Business.totalReviews', '1284', 'number'),
      leaf('Response rate', 'Business.responseRate', '92%'),
      leaf('NPS score', 'Business.npsScore', '68', 'number'),
      leaf('Active since', 'Business.activeSince', '2018', 'number'),
      leaf('Owner name', 'Business.ownerName', 'Jane Smith'),
      leaf('Owner email', 'Business.ownerEmail', 'jane@aspendental.com'),
      leaf('Region', 'Business.region', 'West'),
      leaf('Tax ID', 'Business.taxId', '94-1234567'),
      leaf('License number', 'Business.licenseNumber', 'HC-88421'),
      leaf('EHR provider', 'Business.ehrProvider', 'Epic'),
      leaf('Timezone', 'Business.timezone', 'America/Los_Angeles'),
      leaf('Locale', 'Business.locale', 'en-US'),
    ],
  },
  {
    id: 'location',
    label: 'Location fields',
    sectionLabel: 'Location fields',
    description: 'Fields from the location or site where this workflow is running.',
    fields: [
      leaf('Location name', 'Location.name', 'Downtown clinic'),
      leaf('Location address', 'Location.address', '100 Main St'),
      leaf('Location phone', 'Location.phone', '+1 650-555-0110'),
      leaf('Location email', 'Location.email', 'downtown@aspendental.com'),
      leaf('Location hours', 'Location.hours', 'Mon–Sat 8–7'),
      leaf('Exam rooms', 'Location.examRooms', '12', 'number'),
      leaf('Staff count', 'Location.staffCount', '18', 'number'),
      leaf('Manager name', 'Location.managerName', 'Alex Rivera'),
      leaf('Manager email', 'Location.managerEmail', 'alex@aspendental.com'),
      leaf('City', 'Location.city', 'San Mateo'),
      leaf('State', 'Location.state', 'CA'),
      leaf('Zip code', 'Location.zipCode', '94401', 'number'),
    ],
  },
  {
    id: 'contacts',
    label: 'Contact fields',
    sectionLabel: 'Contact fields',
    description: 'Fields from the customer or contact record linked to this run.',
    fields: [
      leaf('Contact first name', 'Contact.firstName', 'John'),
      leaf('Contact last name', 'Contact.lastName', 'Doe'),
      leaf('Contact phone', 'Contact.phone', '+1 415-555-0199'),
      leaf('Contact email', 'Contact.email', 'john.doe@example.com'),
      leaf('Patient ID', 'Contact.patientId', '27679', 'number'),
      leaf('Date of birth', 'Contact.dateOfBirth', '1988-04-12'),
      leaf('Insurance plan', 'Contact.insurancePlan', 'Aetna PPO'),
      leaf('Preferred provider', 'Contact.preferredProvider', 'Dr.John'),
      leaf('Last visit date', 'Contact.lastVisitDate', '2026-03-12'),
      leaf('Last visit reason', 'Contact.lastVisitReason', 'Cleaning'),
      leaf('Patient since', 'Contact.patientSince', '2021', 'number'),
      leaf('Preferred channel', 'Contact.preferredChannel', 'SMS'),
    ],
  },
];

/** Workflow step outputs shown when the picker is opened from an agent canvas. */
export const WORKFLOW_CATEGORIES = [
  {
    id: 'trigger',
    label: '1. Trigger',
    description: 'Outputs available from the trigger that started this workflow.',
    trees: [
      group('trigger-output', '1. Trigger output', [
        leaf('id', 'Trigger.id', '545043398', 'number'),
        leaf('source', 'Trigger.source', 'Google'),
        leaf('rating', 'Trigger.rating', '5', 'number'),
        leaf('receivedAt', 'Trigger.receivedAt', REVIEW_DATE),
      ]),
    ],
  },
  {
    id: 'task-identify',
    label: '2. Action: Identify relevant mentions',
    description: 'Outputs from the identify-relevant-mentions action.',
    trees: [
      group('identify-output', '2. Action output', [
        leaf('mentionCount', 'Identify.mentionCount', '4', 'number'),
        leaf('matched', 'Identify.matched', 'true', 'boolean'),
        leaf('keywords', 'Identify.keywords', 'wait, billing'),
        leaf('confidence', 'Identify.confidence', '0.92', 'number'),
      ]),
    ],
  },
  {
    id: 'task-tokens',
    label: '3. Action: custom tokens',
    description: 'Custom token values produced by this action.',
    trees: [
      group('tokens-output', '3. Action output', [
        leaf('greeting', 'Tokens.greeting', 'Hi there'),
        leaf('signOff', 'Tokens.signOff', 'Best regards'),
        leaf('promo', 'Tokens.promo', 'Book online'),
        leaf('locationName', 'Tokens.locationName', 'Downtown'),
        leaf('agentName', 'Tokens.agentName', 'Reviews AI'),
      ]),
    ],
  },
  {
    id: 'task-generate-response',
    label: '4. Action: Generate review response',
    description: 'Action and tool outputs from generating the review response.',
    // Sidebar count matches top-level sections (Action output + Tool), not leaf fields.
    count: 2,
    trees: [
      group('gen-task-output', '4. Action output', [
        leaf('id', 'GenerateResponse.id', '545043398', 'number'),
        leaf('overallRating', 'GenerateResponse.overallRating', '5', 'number'),
        leaf('comments', 'GenerateResponse.comments', REVIEW_COMMENT),
        leaf('businessAggregationId', 'GenerateResponse.businessAggregationId', '96515331', 'number'),
        leaf('sourceType', 'GenerateResponse.sourceType', 'Google'),
      ]),
      group(
        'gen-tool-responder',
        'Tool : Review responder',
        [
          leaf('comments', 'ReviewResponder.comments', REVIEW_COMMENT),
          leaf('sourceType', 'ReviewResponder.sourceType', 'Google'),
          leaf('reviewDate', 'ReviewResponder.reviewDate', REVIEW_DATE),
          objectNode('reviewer', 'ReviewResponder.reviewer', [
            leaf('comments', 'ReviewResponder.reviewer.comments', REVIEW_COMMENT),
            leaf('sourceType', 'ReviewResponder.reviewer.sourceType', 'Google'),
          ]),
          leaf('status', 'ReviewResponder.status', '2', 'number'),
          leaf('featured', 'ReviewResponder.featured', 'false', 'boolean'),
        ],
        { showPropertyCount: true },
      ),
    ],
  },
  {
    id: 'task-send-response',
    label: '5. Action: Send a review response',
    description: 'Outputs from posting the review response.',
    trees: [
      group('send-output', '5. Action output', [
        leaf('posted', 'SendResponse.posted', 'true', 'boolean'),
        leaf('channel', 'SendResponse.channel', 'Google'),
        leaf('responseId', 'SendResponse.responseId', 'resp_8821'),
        leaf('postedAt', 'SendResponse.postedAt', REVIEW_DATE),
        leaf('status', 'SendResponse.status', 'delivered'),
      ]),
    ],
  },
  {
    id: 'task-send-response-followup',
    label: '6. Action: Send a review response',
    description: 'Outputs from a follow-up send of the review response.',
    trees: [
      group('send-followup-output', '6. Action output', [
        leaf('posted', 'SendFollowup.posted', 'true', 'boolean'),
        leaf('channel', 'SendFollowup.channel', 'Google'),
        leaf('responseId', 'SendFollowup.responseId', 'resp_9902'),
        leaf('postedAt', 'SendFollowup.postedAt', REVIEW_DATE),
        leaf('status', 'SendFollowup.status', 'queued'),
      ]),
    ],
  },
];

export function countLeaves(nodes = []) {
  return nodes.reduce((sum, node) => {
    if (node.type === 'field') return sum + 1;
    return sum + countLeaves(node.children || []);
  }, 0);
}

/** Normalize flat `fields` categories into a single tree group. */
export function normalizeCategory(cat) {
  if (Array.isArray(cat.trees) && cat.trees.length > 0) {
    return {
      ...cat,
      trees: cat.trees,
      count: cat.count ?? countLeaves(cat.trees),
    };
  }
  const fields = cat.fields || [];
  const trees = [
    group(`${cat.id}-fields`, cat.sectionLabel || cat.label, fields),
  ];
  return {
    ...cat,
    trees,
    count: fields.length,
  };
}

export function formatSample(sample, valueType) {
  if (sample == null) return '';
  const text = String(sample);
  if (valueType === 'string') {
    const bare = text.replace(/^"|"$/g, '');
    return `"${bare}"`;
  }
  return text;
}

/** Depth-first filter: keep nodes that match or have matching descendants. */
export function filterTrees(trees, query) {
  const q = query.toLowerCase();
  const unquoted = q.replace(/"/g, '');

  function matchField(f) {
    return (
      f.name.toLowerCase().includes(q)
      || String(f.value || '').toLowerCase().includes(q)
      || String(f.sample || '').toLowerCase().includes(unquoted)
    );
  }

  function walk(nodes) {
    const out = [];
    for (const node of nodes) {
      if (node.type === 'field') {
        if (matchField(node)) out.push(node);
        continue;
      }
      const kids = walk(node.children || []);
      const labelHit = String(node.label || node.name || '').toLowerCase().includes(q);
      if (kids.length > 0 || labelHit) {
        out.push({
          ...node,
          children: kids.length > 0 ? kids : node.children,
          propertyCount: kids.length > 0 ? kids.length : node.propertyCount,
        });
      }
    }
    return out;
  }

  return walk(trees);
}
