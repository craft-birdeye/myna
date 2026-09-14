export interface SuperAgentEnterCommand {
  /** a new value every time the host opens the Super agent overlay, so the
   *  postMessage effect fires again on a repeat visit */
  ts: number
  /** true = the Website gate's "New user" choice — a genuine "sign up from
   *  scratch" (mirrors the prototype's own replayOnboarding(): auth sign-up
   *  then the full onboarding question flow, resetting any prior setup).
   *  false/undefined = re-entry via the TopBar AppSwitcher or the L1 rail
   *  item (mirrors the prototype's own openSuper(): skip straight to a
   *  short onboarding the first time, or straight to the workspace after). */
  isNewUser?: boolean
}

export interface SuperAgentAppProps {
  /** true renders this as a full-viewport fixed overlay on top of everything else;
   *  false keeps the iframe mounted but hidden, so it only boots once */
  active: boolean
  title?: string
  /** bumped once every time the host opens the overlay — see SuperAgentEnterCommand */
  enter?: SuperAgentEnterCommand | null
  /** called when the person clicks the prototype's own "Back to Birdeye" switcher
   *  inside the iframe — the host closes the overlay to reveal its real Dashboard. */
  onBackToBirdeye?: () => void
}
