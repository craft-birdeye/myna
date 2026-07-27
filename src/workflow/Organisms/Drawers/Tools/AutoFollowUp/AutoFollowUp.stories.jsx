import { fn } from 'storybook/test';
import AutoFollowUp from './AutoFollowUp';

export default {
  title: 'Conversation Builder/Organisms/Drawer/Tools/Auto Follow Up',
  component: AutoFollowUp,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    onBack: fn(),
    onSave: fn(),
  },
};

export const Default = {
  args: {
    title: 'Auto follow up',
  },
};
