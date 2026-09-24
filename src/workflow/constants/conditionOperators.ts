/** Canonical condition-operator options for trigger / branch condition dropdowns. */
export const CONDITION_OPERATORS = [
  { value: 'is_blank', label: 'Is blank' },
  { value: 'is_not_blank', label: 'Is not blank' },
  { value: 'is_within', label: 'Is within' },
  { value: 'between', label: 'Between' },
  { value: 'before', label: 'Before' },
  { value: 'after', label: 'After' },
  { value: 'equals', label: 'Equals to' },
] as const

const VALUELESS_OPERATORS = new Set(['is_blank', 'is_not_blank'])

/** True when the operator requires a value dropdown (e.g. false for Is blank / Is not blank). */
export function operatorNeedsValue(operatorValue?: string | null) {
  if (!operatorValue) return false
  return !VALUELESS_OPERATORS.has(operatorValue)
}
