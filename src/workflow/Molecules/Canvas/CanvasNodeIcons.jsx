/* Same assets as the left floater / canvas node headers. */
import iconRrTrigger from '../../../assets/rr-chrome/icon-trigger.svg';
import iconRrTasks from '../../../assets/rr-chrome/icon-tasks.svg';
import iconRrControls from '../../../assets/rr-chrome/icon-controls.svg';
import iconRrProcedures from '../../../assets/rr-chrome/icon-procedures.svg';

function CanvasTypeIcon({ src, size = 14 }) {
  return <img src={src} alt="" width={size} height={size} draggable={false} className="block shrink-0" />;
}

/** Same trigger glyph as canvas nodes / left floater; grey via `text-text-icon` + currentColor. */
const TRIGGER_ICON_PATH =
  'M11.9355 3.00012C12.0204 2.75964 12.021 2.49747 11.9373 2.25658C11.8536 2.01569 11.6906 1.81037 11.4749 1.67429C11.2593 1.53822 11.0038 1.47945 10.7503 1.50762C10.4969 1.5358 10.2605 1.64924 10.08 1.82937L3.32999 8.57937C3.1726 8.73666 3.06538 8.93709 3.02191 9.15532C2.97844 9.37354 3.00065 9.59976 3.08575 9.80536C3.17085 10.011 3.315 10.1867 3.49999 10.3104C3.68497 10.434 3.90248 10.5001 4.12499 10.5001H7.12649C7.1864 10.5002 7.24541 10.5146 7.2986 10.5422C7.35178 10.5698 7.39759 10.6097 7.43218 10.6586C7.46677 10.7075 7.48914 10.764 7.49742 10.8233C7.50569 10.8827 7.49963 10.9431 7.47974 10.9996L6.06449 15.0001C5.9796 15.2407 5.97898 15.5029 6.06275 15.7439C6.14651 15.9849 6.30968 16.1902 6.52549 16.3262C6.7413 16.4622 6.99694 16.5209 7.25046 16.4925C7.50398 16.4642 7.74033 16.3505 7.92074 16.1701L14.6707 9.42012C14.8279 9.26274 14.9349 9.06231 14.9782 8.84414C15.0215 8.62597 14.9992 8.39986 14.914 8.19439C14.8289 7.98891 14.6847 7.81329 14.4998 7.68972C14.3148 7.56614 14.0974 7.50016 13.875 7.50012H10.8772C10.8172 7.5002 10.758 7.48586 10.7046 7.4583C10.6513 7.43074 10.6053 7.39076 10.5706 7.34173C10.5359 7.29271 10.5135 7.23606 10.5053 7.17657C10.497 7.11708 10.5032 7.05648 10.5232 6.99987L11.9355 3.00012Z';

export function GreyTriggerIcon({
  size = 16,
  className = 'text-text-secondary',
  /** Match AiAvatarChatIcon column (24×24) with the glyph centered inside. */
  inAvatarColumn = false,
}) {
  const icon = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`block shrink-0 ${className}`.trim()}
      aria-hidden
    >
      <path
        d={TRIGGER_ICON_PATH}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )

  if (!inAvatarColumn) return icon

  return (
    <span className="inline-flex size-6 shrink-0 items-center justify-center">
      {icon}
    </span>
  )
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
