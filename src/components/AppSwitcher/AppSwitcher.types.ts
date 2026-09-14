export interface AppSwitcherProps {
  /** true while the Super agent module is the active rail item */
  onSuperAgent: boolean
  /** switch into the Birdeye dashboard (Overview) */
  onSelectBirdeye: () => void
  /** switch into the Super agent workspace */
  onSelectSuperAgent: () => void
}
