export interface CallRecordingPlayerHandle {
  seekTo: (secs: number) => void
}

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
  /** Fires whenever the playhead moves (playback ticking, or a seek/scrub on the waveform). */
  onProgress?: (elapsedSecs: number, totalSecs: number) => void
  /** Fires when the user seeks via click/drag on the waveform (or via `seekTo`). */
  onSeek?: (elapsedSecs: number, totalSecs: number) => void
  /** When true, force-show the vertical seeker (line + time pill). Otherwise hover/drag only. */
  showSeeker?: boolean
  onPlayingChange?: (playing: boolean) => void
}
