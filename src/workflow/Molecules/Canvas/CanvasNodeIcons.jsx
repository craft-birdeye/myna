/* Same assets as the left floater / canvas node headers. */
import iconRrTrigger from '../../../assets/rr-chrome/icon-trigger.svg';
import iconRrTasks from '../../../assets/rr-chrome/icon-tasks.svg';
import iconRrControls from '../../../assets/rr-chrome/icon-controls.svg';
import iconRrProcedures from '../../../assets/rr-chrome/icon-procedures.svg';

function CanvasTypeIcon({ src, size = 14 }) {
  return <img src={src} alt="" width={size} height={size} draggable={false} className="block shrink-0" />;
}

export function TriggerIcon({ size = 14 } = {}) {
  return <CanvasTypeIcon src={iconRrTrigger} size={size} />;
}

export function TaskIcon({ size = 14 } = {}) {
  return <CanvasTypeIcon src={iconRrTasks} size={size} />;
}

export function BranchIcon({ size = 14 } = {}) {
  return <CanvasTypeIcon src={iconRrControls} size={size} />;
}

export function ProcedureIcon({ size = 14 } = {}) {
  return <CanvasTypeIcon src={iconRrProcedures} size={size} />;
}
