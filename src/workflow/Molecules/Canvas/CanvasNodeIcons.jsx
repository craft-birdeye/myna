/* Same assets as the left floater / canvas node headers. */
import iconRrTrigger from '../../../assets/rr-chrome/icon-trigger.svg';
import iconRrProcedures from '../../../assets/rr-chrome/icon-procedures.svg';

export function TriggerIcon() {
  return (
    <img src={iconRrTrigger} alt="" width={14} height={14} draggable={false} />
  );
}

export function ProcedureIcon() {
  return (
    <img src={iconRrProcedures} alt="" width={14} height={14} draggable={false} />
  );
}
