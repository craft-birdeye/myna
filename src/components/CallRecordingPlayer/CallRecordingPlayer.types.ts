export interface CallRecordingPlayerProps {
  /** Audio source URL. When omitted, controls stay disabled and durationSecs is shown. */
  audioUrl?: string
  /** Fallback duration shown before WaveSurfer is ready. */
  durationSecs?: number
  /** When false, playback pauses and progress resets (e.g. drawer closed). Defaults to true. */
  active?: boolean
  /** Optional section label above the waveform (e.g. "Call recording"). */
  title?: string
  /** Apply the drawer player padding (16px 20px). Default true. */
  padded?: boolean
  className?: string
}
