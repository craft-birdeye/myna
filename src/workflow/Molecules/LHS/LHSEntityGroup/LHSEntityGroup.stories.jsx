import LHSEntityGroup from './LHSEntityGroup';

export default {
  title: 'Agent Builder/Molecules/LHS/LHSEntityGroup',
  component: LHSEntityGroup,
  parameters: { layout: 'padded' },
};

export const ReviewEvent = {
  args: {
    title: 'Review event',
    nodeType: 'trigger',
    parentLabel: 'Reviews',
    readOnly: true,
    dragAlwaysVisible: true,
    items: [
      {
        label: 'When a new review is received',
        description: 'Fires when a customer leaves a new review on any connected source or location.',
      },
      {
        label: 'When a review is updated',
        description: 'Fires when an existing review is edited, including rating or comment changes.',
      },
      {
        label: 'When a new review is received or updated',
        description: 'Fires on both new reviews and updates so one workflow can cover either event.',
      },
    ],
  },
};

export const ReviewTasks = {
  args: {
    title: 'Review',
    nodeType: 'task',
    parentLabel: 'Review',
    readOnly: true,
    dragAlwaysVisible: true,
    items: [
      {
        label: 'Triage review',
        ai: true,
        description:
          'The system checks the review to decide whether a response is required based on whether it is a genuine customer review or spam content that is irrelevant to the business or in any way violates the content policy of the source.',
      },
      {
        label: 'Extract review details',
        description:
          'Identifies what the reviewer means, matches it to the business\'s terms, scores severity, and flags staff or competitors mentioned',
      },
      {
        label: 'Review responder',
        ai: true,
        description: 'Reply to the review using the generated response',
      },
      {
        label: 'Generate response',
        description:
          'Assembles the response using the drafted strategy, extracted details, and brand voice',
      },
      {
        label: 'Message assembly',
        description:
          'Combine the crafted approach, extracted insights, and brand voice to create the final reply.',
      },
    ],
  },
};

export const InboxEvent = {
  args: {
    title: 'Inbox event',
    nodeType: 'trigger',
    parentLabel: 'Inbox',
    items: [
      'When a new message is received',
      'When a conversation is assigned',
      'When a conversation is closed',
    ],
  },
};
