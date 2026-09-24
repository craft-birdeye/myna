import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../Icon/Icon'
import { Chip } from '../Chip/Chip'
import { ReviewCardBody, StarRating } from '../ReviewCard/ReviewCard'
import { TestRunStepRow } from '../TestRunPanel/TestRunPanel'
import { Tabs } from '../Tabs/Tabs'
import type { Tab } from '../Tabs/Tabs.types'
import { SelectMenu } from '../SelectMenu/SelectMenu'
import { GhostwriterTestRunEditor } from '../GhostwriterTestRunEditor/GhostwriterTestRunEditor'
import { GhostwriterTestRunReport } from '../GhostwriterTestRunReport/GhostwriterTestRunReport'
import { useTestRun } from '../../hooks/useTestRun'
import type { TestRunStatus } from '../../hooks/useTestRun'
import { buildTestRunSteps } from '../../data/testRunSteps'
import { REVIEW_RESPONSE_WORKFLOW } from '../../data/agentWorkflows'
import { ALL_REVIEWS } from '../../data/reviewsData'
import type { Review } from '../../data/reviewsData'
import type {
  GhostwriterTestRunPanelProps,
  TestRunBatch,
  TestSuite,
  TestSuiteCondition,
} from './GhostwriterTestRunPanel.types'

const TEST_RESULT_TABS: Tab[] = [
  { id: 'details', label: 'Details' },
  { id: 'preview', label: 'Preview' },
]

/** 23 Sep only — mock pass/fail rule: reviews rated below 3★ "fail" (the workflow's fallback
 *  branch didn't send a reply). Jay & Robin never calls this — it always treats reviews as
 *  passed. Only consulted through `reviewPassedInBatch` below, not directly. */
function reviewPassed(review: Review) {
  return review.rating >= 3
}

/** 23 Sep only — real pass/fail only applies to a batch that came from "Use test suite"
 *  (`batch.suiteName` set); a manually-tested batch (the plain review picker or the Upload tab)
 *  always reads as passed, in green, regardless of rating. */
export function reviewPassedInBatch(review: Review, batch: TestRunBatch) {
  return !batch.suiteName || reviewPassed(review)
}

/** 23 Sep only — how bad a failure is, mocked off the same rating rule `reviewPassed` uses:
 *  1★ reviews are the more urgent case, so they read "High"; 2★ reads "Medium". */
type RecommendationSeverity = 'high' | 'medium'

function getRecommendationSeverity(review: Review): RecommendationSeverity {
  return review.rating <= 1 ? 'high' : 'medium'
}

const SEVERITY_LABEL: Record<RecommendationSeverity, string> = { high: 'High', medium: 'Medium' }
const SEVERITY_CHIP_VARIANT: Record<RecommendationSeverity, 'danger' | 'warning'> = { high: 'danger', medium: 'warning' }

/** 23 Sep only — the batch-level "Recommendations" tab groups failed reviews by severity
 *  rather than repeating one near-identical card per reviewer, since they all share the same
 *  underlying fix; each group's text is reviewer-agnostic and reports how many reviews it
 *  covers. */
export interface RecommendationGroup {
  severity: RecommendationSeverity
  text: string
  reviews: Review[]
}

/** 23 Sep only — the (mocked) file a Test suite's "Add reviews" upload produced. */
interface UploadedReviewsFile {
  name: string
  reviewCount: number
}

function getGroupRecommendationText(severity: RecommendationSeverity) {
  return severity === 'high'
    ? '1-star reviews are falling through to the fallback branch without a reply. Update "Evaluate conditions" so very low ratings still route to a response instead of being skipped.'
    : '2-star reviews are also being skipped by the fallback branch. Update "Evaluate conditions" so these ratings route to a response too.'
}

export function getBatchRecommendationGroups(batch: TestRunBatch): RecommendationGroup[] {
  const bySeverity = new Map<RecommendationSeverity, Review[]>()
  batch.reviews
    .filter((r) => !reviewPassedInBatch(r, batch))
    .forEach((r) => {
      const severity = getRecommendationSeverity(r)
      bySeverity.set(severity, [...(bySeverity.get(severity) ?? []), r])
    })
  return (['high', 'medium'] as RecommendationSeverity[])
    .filter((severity) => bySeverity.has(severity))
    .map((severity) => ({ severity, text: getGroupRecommendationText(severity), reviews: bySeverity.get(severity)! }))
}

/** 23 Sep's left-panel sections. 'cycles' still exists as a type (the generic empty-state
 *  fallback branch below still handles it) but is hidden from `TEST_SECTIONS`/the nav — no
 *  real spec for it yet, and it clutters the tab with a dead end. */
type TestSection = 'cases' | 'suite' | 'cycles'

const TEST_SECTIONS: { id: TestSection; label: string; icon: string; emptyCaption: string }[] = [
  { id: 'cases', label: 'Test runs', icon: 'science', emptyCaption: 'Select a variety of reviews in your test case for best results.' },
  { id: 'suite', label: 'Test suite', icon: 'fact_check', emptyCaption: 'No test suites yet.' },
]

/** 23 Sep only — Test suite condition builder. Each field maps to a fixed operator set and,
 *  for operators that need one, a value control: rating → a star-rating picker, date → a
 *  single date or a range, source → a multi-select. Picking a field resets the row to that
 *  field's default operator instead of leaving a stale operator/value combination around. */
type ConditionField = TestSuiteCondition['field']

const CONDITION_FIELD_OPTIONS: { value: ConditionField; label: string }[] = [
  { value: 'rating', label: 'Latest review rating' },
  { value: 'date', label: 'Latest review date' },
  { value: 'source', label: 'Latest review source' },
]

const CONDITION_OPERATORS: Record<ConditionField, { value: string; label: string }[]> = {
  rating: [
    { value: 'is_blank', label: 'is blank' },
    { value: 'is_not_blank', label: 'is not blank' },
    { value: 'equals', label: 'equals to' },
    { value: 'not_equals', label: 'not equals to' },
    { value: 'greater_than', label: 'is greater than' },
    { value: 'less_than', label: 'is less than' },
  ],
  date: [
    { value: 'is_blank', label: 'is blank' },
    { value: 'is_not_blank', label: 'is not blank' },
    { value: 'between', label: 'between' },
    { value: 'before', label: 'before' },
    { value: 'after', label: 'after' },
    { value: 'is', label: 'is' },
  ],
  source: [{ value: 'in', label: 'in' }],
}

/** The default-selected operator per field — not just the first entry in
 *  `CONDITION_OPERATORS`, since that list's display order doesn't match which one starts
 *  checked. */
const DEFAULT_OPERATOR: Record<ConditionField, string> = {
  rating: 'is_not_blank',
  date: 'between',
  source: 'in',
}

/** Rating operators that need a star-rating value; the other rating operators (is/is not
 *  blank) don't. */
const RATING_VALUE_OPERATORS = ['equals', 'not_equals', 'greater_than', 'less_than']
/** Date operators that need a single date value, as opposed to "between"'s range or
 *  "is/is not blank"'s no value. */
const DATE_SINGLE_VALUE_OPERATORS = ['before', 'after', 'is']

const RATING_VALUE_OPTIONS = [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} star${n === 1 ? '' : 's'}` }))

const REVIEW_SOURCE_OPTIONS = [
  { value: 'google', label: 'Google' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'yelp', label: 'Yelp' },
  { value: 'instagram', label: 'Instagram' },
]

let conditionIdSeq = 0
function makeConditionId() {
  conditionIdSeq += 1
  return `cond-${conditionIdSeq}`
}

function defaultConditionForField(field: ConditionField): TestSuiteCondition {
  return {
    id: makeConditionId(),
    field,
    operator: DEFAULT_OPERATOR[field],
    dateRange: field === 'date' ? 'Sep 1, 2026 to Oct 31, 2026' : undefined,
    sourceValues: field === 'source' ? ['google', 'facebook'] : undefined,
  }
}

/** Applies an operator change, filling in that operator's value with a sensible default the
 *  first time it's picked (so switching to e.g. "is greater than" doesn't show an empty
 *  control) while leaving an already-set value alone if the operator is picked again. */
function applyOperatorChange(condition: TestSuiteCondition, operator: string): TestSuiteCondition {
  const next: TestSuiteCondition = { ...condition, operator }
  if (condition.field === 'rating' && RATING_VALUE_OPERATORS.includes(operator) && !next.ratingValue) {
    next.ratingValue = '3'
  }
  if (condition.field === 'date' && operator === 'between' && !next.dateRange) {
    next.dateRange = 'Sep 1, 2026 to Oct 31, 2026'
  }
  if (condition.field === 'date' && DATE_SINGLE_VALUE_OPERATORS.includes(operator) && !next.dateValue) {
    next.dateValue = 'Sep 1, 2026'
  }
  return next
}

/** Small dropdown trigger — pill button + anchored `SelectMenu` popover, same
 *  getBoundingClientRect anchoring `FilterPanel` uses for its own field popovers. Multi-select
 *  buffers picks locally until "Apply" (matching `SelectMenu`'s own multi+onApply contract);
 *  single-select commits immediately and closes. */
function InlineSelectTrigger({
  label,
  options,
  value,
  multi = false,
  searchable = false,
  onChange,
}: {
  label: string
  options: { value: string; label: string }[]
  value: string[]
  multi?: boolean
  searchable?: boolean
  onChange: (value: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null)
  const [pending, setPending] = useState<string[]>(value)

  function handleToggle(e: React.MouseEvent<HTMLButtonElement>) {
    if (open) {
      setOpen(false)
      return
    }
    const r = e.currentTarget.getBoundingClientRect()
    setAnchor({ top: r.bottom + 4, left: r.left })
    setPending(value)
    setOpen(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={handleToggle}
        className="flex h-9 min-w-[160px] items-center gap-xs rounded-sm border border-border bg-surface-l2 px-md text-left text-body text-text-primary hover:bg-surface-hover"
      >
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <Icon name="expand_more" size={16} className="shrink-0 text-text-icon" />
      </button>
      {open && anchor && (
        <>
          <div className="fixed inset-0 z-[105]" onClick={() => setOpen(false)} />
          <div className="fixed z-[110] w-[240px]" style={{ top: anchor.top, left: anchor.left }}>
            <SelectMenu
              options={options}
              value={multi ? pending : value}
              multi={multi}
              searchable={searchable}
              onChange={multi ? setPending : (v) => {
                onChange(v)
                setOpen(false)
              }}
              onApply={
                multi
                  ? () => {
                      onChange(pending)
                      setOpen(false)
                    }
                  : undefined
              }
            />
          </div>
        </>
      )}
    </>
  )
}

/** One condition row — "Where"/"and" prefix, field + operator pills, the field-specific value
 *  control, and a delete icon. */
function TestSuiteConditionRow({
  condition,
  isFirst,
  onChange,
  onRemove,
}: {
  condition: TestSuiteCondition
  isFirst: boolean
  onChange: (next: TestSuiteCondition) => void
  onRemove: () => void
}) {
  const fieldLabel = CONDITION_FIELD_OPTIONS.find((f) => f.value === condition.field)?.label ?? ''
  const operatorOptions = CONDITION_OPERATORS[condition.field]
  const operatorLabel = operatorOptions.find((o) => o.value === condition.operator)?.label ?? ''

  return (
    <div className="flex items-center gap-sm">
      <span className="w-12 shrink-0 text-body text-text-secondary">{isFirst ? 'Where' : 'and'}</span>
      <InlineSelectTrigger
        label={fieldLabel}
        options={CONDITION_FIELD_OPTIONS}
        value={[condition.field]}
        onChange={([val]) => onChange(defaultConditionForField(val as ConditionField))}
      />
      <InlineSelectTrigger
        label={operatorLabel}
        options={operatorOptions}
        value={[condition.operator]}
        onChange={([val]) => onChange(applyOperatorChange(condition, val))}
      />
      {condition.field === 'rating' && RATING_VALUE_OPERATORS.includes(condition.operator) && (
        <InlineSelectTrigger
          label={RATING_VALUE_OPTIONS.find((o) => o.value === condition.ratingValue)?.label ?? 'Select rating'}
          options={RATING_VALUE_OPTIONS}
          value={[condition.ratingValue ?? '3']}
          onChange={([val]) => onChange({ ...condition, ratingValue: val })}
        />
      )}
      {condition.field === 'date' && condition.operator === 'between' && (
        <input
          value={condition.dateRange ?? ''}
          onChange={(e) => onChange({ ...condition, dateRange: e.target.value })}
          className="h-9 flex-1 rounded-sm border border-border bg-surface px-md text-body text-text-primary outline-none focus:border-primary"
        />
      )}
      {condition.field === 'date' && DATE_SINGLE_VALUE_OPERATORS.includes(condition.operator) && (
        <input
          value={condition.dateValue ?? ''}
          onChange={(e) => onChange({ ...condition, dateValue: e.target.value })}
          className="h-9 flex-1 rounded-sm border border-border bg-surface px-md text-body text-text-primary outline-none focus:border-primary"
        />
      )}
      {condition.field === 'source' && (
        <InlineSelectTrigger
          label={
            condition.sourceValues && condition.sourceValues.length > 0
              ? `${condition.sourceValues.length} latest review source`
              : 'Select sources'
          }
          options={REVIEW_SOURCE_OPTIONS}
          value={condition.sourceValues ?? []}
          multi
          searchable
          onChange={(vals) => onChange({ ...condition, sourceValues: vals })}
        />
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove condition"
        className="flex size-8 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
      >
        <Icon name="delete" size={18} />
      </button>
    </div>
  )
}

/** 23 Sep only — Test suite "Add reviews from" source picker: which of the three ways to
 *  populate a suite's reviews is currently selected. */
type TestSuiteReviewsSource = 'customer' | 'upload' | 'generate'

function testSuiteSourceLabel(source: TestSuiteReviewsSource | undefined): string {
  if (source === 'upload') return 'File uploaded'
  if (source === 'generate') return 'Generated by AI'
  return 'Conditional customer reviews'
}

/** Plain circular radio, same look as `EstimateSavingsModal`'s time/cost picker — reused here
 *  rather than exported since the two live in unrelated features. */
function TestSuiteSourceRadio({
  checked,
  onClick,
  label,
}: {
  checked: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-sm">
      <span
        className={`flex size-4 shrink-0 items-center justify-center rounded-full border-2 ${
          checked ? 'border-primary' : 'border-border-selected'
        }`}
      >
        {checked && <span className="size-2 rounded-full bg-primary" />}
      </span>
      <span className="text-body text-text-primary">{label}</span>
    </button>
  )
}

/** A suite's reviews source — "Add reviews from" card in the Test suite editor. Three mutually
 *  exclusive ways to populate it, picked via radio rather than tabs since exactly one always
 *  applies and none is a secondary/advanced option: "Customer reviews" (the condition-builder
 *  rows, default), "Upload reviews" (a spreadsheet dropzone inline on the page — this used to
 *  live in its own pop-up modal, now shown directly here instead), and "Generate reviews with
 *  AI" (a free-text prompt describing what to generate). */
function TestSuiteReviewsBlock({
  source,
  onChangeSource,
  conditions,
  onChangeConditions,
  uploadedFile,
  onUpload,
  onRemoveUpload,
  aiPrompt,
  onChangeAiPrompt,
  aiGenerating,
  onGenerateReviews,
}: {
  source: TestSuiteReviewsSource
  onChangeSource: (next: TestSuiteReviewsSource) => void
  conditions: TestSuiteCondition[]
  onChangeConditions: (next: TestSuiteCondition[]) => void
  uploadedFile: UploadedReviewsFile | null
  onUpload: () => void
  onRemoveUpload: () => void
  aiPrompt: string
  onChangeAiPrompt: (next: string) => void
  aiGenerating: boolean
  onGenerateReviews: () => void
}) {
  return (
    <div className="rounded-md border border-border p-lg">
      <p className="m-0 text-body text-text-primary">Add reviews from</p>
      <div className="mt-md flex items-center gap-2xl">
        <TestSuiteSourceRadio
          checked={source === 'customer'}
          onClick={() => onChangeSource('customer')}
          label="Customer reviews"
        />
        <TestSuiteSourceRadio
          checked={source === 'upload'}
          onClick={() => onChangeSource('upload')}
          label="Upload reviews"
        />
        <TestSuiteSourceRadio
          checked={source === 'generate'}
          onClick={() => onChangeSource('generate')}
          label="Generate reviews with AI"
        />
      </div>
      <div className="mt-lg">
        {source === 'customer' ? (
          <>
            <div className="flex flex-col gap-md">
              {conditions.map((condition, i) => (
                <TestSuiteConditionRow
                  key={condition.id}
                  condition={condition}
                  isFirst={i === 0}
                  onChange={(next) => onChangeConditions(conditions.map((c, ci) => (ci === i ? next : c)))}
                  onRemove={() => onChangeConditions(conditions.filter((_, ci) => ci !== i))}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => onChangeConditions([...conditions, defaultConditionForField('rating')])}
              className="mt-lg flex items-center gap-xs rounded-sm py-xs text-body text-text-action hover:bg-surface-hover"
            >
              <Icon name="add_circle" size={18} />
              Add condition
            </button>
          </>
        ) : source === 'upload' ? (
          uploadedFile ? (
            <div className="flex items-center gap-md rounded-md border border-border p-md">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-surface-selected text-text-action">
                <Icon name="table_chart" size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="m-0 truncate text-body text-text-primary">{uploadedFile.name}</p>
                <p className="m-0 text-small text-text-tertiary">
                  {uploadedFile.reviewCount} review{uploadedFile.reviewCount === 1 ? '' : 's'}
                </p>
              </div>
              <button
                type="button"
                onClick={onRemoveUpload}
                aria-label="Remove file"
                className="flex size-7 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
              >
                <Icon name="close" size={16} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-sm rounded-md border border-dashed border-border-strong px-lg py-3xl text-center">
              <Icon name="arrow_upward" size={28} className="text-text-icon" />
              <button type="button" onClick={onUpload} className="text-body text-text-action hover:underline">
                Upload spreadsheet
              </button>
              <p className="m-0 text-body text-text-secondary">Drag and drop to upload your reviews</p>
              <p className="m-0 text-small text-text-tertiary">All .xlsx and .xls file types are supported</p>
            </div>
          )
        ) : (
          <div className="flex flex-col gap-sm">
            <textarea
              rows={3}
              value={aiPrompt}
              onChange={(e) => onChangeAiPrompt(e.target.value)}
              placeholder="Describe the reviews you'd like generated — rating range, source, topic…"
              className="w-full resize-none rounded-sm border border-border bg-surface px-md py-sm text-body text-text-primary outline-none focus:border-primary"
            />
            <button
              type="button"
              disabled={!aiPrompt.trim() || aiGenerating}
              onClick={onGenerateReviews}
              className={`flex h-9 items-center self-start rounded-sm px-lg text-body transition-colors ${
                !aiPrompt.trim() || aiGenerating
                  ? 'cursor-not-allowed bg-surface-selected text-text-tertiary'
                  : 'bg-primary text-white hover:bg-primary-hover'
              }`}
            >
              {aiGenerating ? 'Generating…' : 'Generate reviews'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/** Mock "matching reviews" total for the Test suite preview — a real app would recompute this
 *  from the actual conditions; this prototype has no filtering engine behind it, so every
 *  suite reports the same plausible total (matching the "1,035 total reviews" figure the View
 *  all reviews screen already uses), while the preview rows below still come from the small
 *  real `ALL_REVIEWS` pool. */
const MATCHING_REVIEWS_TOTAL = 1035
const MATCHING_REVIEWS_PREVIEW_LIMIT = 10

/** Sits below the Add reviews from block. 'empty' before any source has produced reviews yet
 *  (no conditions, no upload, prompt not generated), 'loading' only reachable from "Generate
 *  reviews with AI" while its mocked 3s wait runs, 'ready' shows the same collapsible
 *  "Reviews {count}" preview regardless of which source produced it — customer conditions,
 *  an uploaded file, or a generated prompt all read as an equally real result. */
function TestSuiteReviewsPreview({ status }: { status: 'empty' | 'loading' | 'ready' }) {
  const [expanded, setExpanded] = useState(true)

  if (status === 'empty') {
    return (
      <div className="flex flex-col items-center justify-center gap-md rounded-md border border-border px-lg py-3xl text-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-surface-selected text-text-tertiary">
          <Icon name="rate_review" size={20} />
        </span>
        <p className="m-0 text-body text-text-secondary">Matching reviews will appear here.</p>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center gap-md rounded-md border border-border px-lg py-3xl text-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-surface-selected text-text-tertiary">
          <span className="size-5 animate-spin rounded-full border-2 border-border border-t-primary" />
        </span>
        <p className="m-0 text-body text-text-secondary">Generating reviews…</p>
      </div>
    )
  }

  const preview = ALL_REVIEWS.slice(0, MATCHING_REVIEWS_PREVIEW_LIMIT)

  return (
    <div className="rounded-md border border-border">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between px-lg py-md"
      >
        <span className="flex items-center gap-sm">
          <span className="text-body text-text-primary">Reviews</span>
          <span className="rounded-full bg-chip-neutral-bg px-sm py-[2px] text-small text-chip-neutral-text">
            {MATCHING_REVIEWS_TOTAL.toLocaleString()}
          </span>
        </span>
        <Icon name={expanded ? 'expand_less' : 'expand_more'} size={20} className="text-text-icon" />
      </button>
      {expanded && (
        <>
          <div className="flex items-start gap-sm border-t border-border bg-chip-info-bg px-lg py-sm">
            <Icon name="info" size={18} className="mt-px shrink-0 text-chip-info-text" />
            <p className="m-0 text-small text-chip-info-text">
              Showing you a preview of the first {MATCHING_REVIEWS_PREVIEW_LIMIT} reviews that match
            </p>
          </div>
          <div className="flex flex-col divide-y divide-border px-lg">
            {preview.map((review) => (
              <div key={review.id} className="py-lg">
                <ReviewCardBody review={{ ...review, reply: undefined }} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/** Create (and edit) page for a Test suite — back arrow + editable name (defaults to "New test
 *  suite", or the existing name when `existingSuite` is set) + a "Save test suite" CTA sharing
 *  that header row, then the Conditions block and a live "Matching reviews" preview below it.
 *  Fills the same central-workspace column the Tests cards sit in. */
function TestSuiteEditorPage({
  existingSuite,
  onBack,
  onSave,
}: {
  existingSuite?: TestSuite | null
  onBack: () => void
  onSave: (suite: TestSuite) => void
}) {
  const [name, setName] = useState(existingSuite?.name ?? 'New test suite')
  const [source, setSource] = useState<TestSuiteReviewsSource>(existingSuite?.reviewsSource ?? 'customer')
  const [conditions, setConditions] = useState<TestSuiteCondition[]>(
    existingSuite?.conditions ?? [defaultConditionForField('rating')],
  )
  const [uploadedFile, setUploadedFile] = useState<UploadedReviewsFile | null>(null)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiGenerated, setAiGenerated] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const handleGenerateReviews = () => {
    setAiGenerating(true)
    setAiGenerated(false)
    setTimeout(() => {
      setAiGenerating(false)
      setAiGenerated(true)
    }, 3000)
  }

  const previewStatus: 'empty' | 'loading' | 'ready' =
    source === 'customer'
      ? conditions.length > 0 ? 'ready' : 'empty'
      : source === 'upload'
        ? uploadedFile ? 'ready' : 'empty'
        : aiGenerating ? 'loading' : aiGenerated ? 'ready' : 'empty'

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex items-center justify-between gap-sm">
        <div className="flex min-w-0 items-center gap-sm">
          <button
            type="button"
            aria-label="Back"
            onClick={onBack}
            className="flex size-8 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
          >
            <Icon name="arrow_back" size={20} />
          </button>
          <input
            ref={nameInputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ fieldSizing: 'content' } as React.CSSProperties}
            className="max-w-full shrink border-0 border-b-2 border-transparent bg-transparent text-h3 text-text-primary outline-none focus:border-primary"
          />
          <button
            type="button"
            aria-label="Edit name"
            onClick={() => nameInputRef.current?.focus()}
            className="flex size-7 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
          >
            <Icon name="edit" size={16} />
          </button>
        </div>
        <button
          type="button"
          onClick={() =>
            onSave({
              id: existingSuite?.id ?? `suite-${Date.now()}`,
              name: name.trim() || 'New test suite',
              conditions,
              reviewCount: MATCHING_REVIEWS_TOTAL,
              reviewsSource: source,
            })
          }
          className="flex h-9 shrink-0 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
        >
          Save test suite
        </button>
      </div>
      <TestSuiteReviewsBlock
        source={source}
        onChangeSource={setSource}
        conditions={conditions}
        onChangeConditions={setConditions}
        uploadedFile={uploadedFile}
        onUpload={() => setUploadedFile({ name: 'reviews.xlsx', reviewCount: ALL_REVIEWS.length })}
        onRemoveUpload={() => setUploadedFile(null)}
        aiPrompt={aiPrompt}
        onChangeAiPrompt={setAiPrompt}
        aiGenerating={aiGenerating}
        onGenerateReviews={handleGenerateReviews}
      />
      <TestSuiteReviewsPreview status={previewStatus} />
    </div>
  )
}

/** Test suite section's empty state (no suites saved yet) — explains what a suite is (a saved
 *  collection of curated/uploaded reviews) rather than the generic "Select a variety..." copy
 *  Test cases uses, since a suite isn't built the same way a test case is. */
function TestSuiteEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="mt-[15%] flex flex-col items-center gap-md px-lg text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-surface-selected text-text-tertiary">
        <Icon name="fact_check" size={20} />
      </span>
      <p className="m-0 max-w-[360px] text-body text-text-secondary">
        A test suite is a saved collection of curated or uploaded reviews you can reuse across test runs.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="flex h-9 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
      >
        Create test suite
      </button>
    </div>
  )
}

/** One saved Test suite, listed in the central workspace once at least one exists. The review
 *  count (now on the right, swapped with the condition count) doubles as an edit trigger: on
 *  hover it's replaced by a pencil icon, and clicking it reopens the editor pre-filled with
 *  this suite via `onEdit`. */
function TestSuiteCard({ suite, onEdit }: { suite: TestSuite; onEdit: () => void }) {
  return (
    <div className="flex w-full items-center justify-between gap-lg rounded-md border border-border p-lg text-left">
      <div>
        <p className="m-0 text-body text-text-primary">{suite.name}</p>
        <p className="m-0 mt-2xs text-small text-text-tertiary">
          {testSuiteSourceLabel(suite.reviewsSource)}
        </p>
      </div>
      <button
        type="button"
        onClick={onEdit}
        aria-label="Edit test suite"
        className="group flex h-9 w-[140px] shrink-0 items-center justify-end gap-xs rounded-sm px-sm hover:bg-surface-hover"
      >
        <span className="truncate text-small text-text-tertiary group-hover:hidden">
          {(suite.reviewCount ?? 0).toLocaleString()} review{suite.reviewCount === 1 ? '' : 's'}
        </span>
        <span className="hidden group-hover:block">
          <Icon name="edit" size={16} className="text-text-icon" />
        </span>
      </button>
    </div>
  )
}

/** 23 Sep only — the "Run test" CTA (header pill and centered empty-state button both use
 *  this). Opens `GhostwriterTestRunEditor`'s full test-run page directly; no chevron and no
 *  menu — same "no menu" simplification Front desk (Sep 23)'s `FrontdeskRunTestCtaButton`
 *  already made. */
function TestCaseCtaButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-9 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
    >
      Run test
    </button>
  )
}

/** Vertical section switcher pinned above the list — 23 Sep only. Same row treatment as
 *  `SideNav`'s flat leaves, 8px taller (h-9 / 36px vs h-7). */
function TestSectionNav({
  active,
  onSelect,
}: {
  active: TestSection
  onSelect: (section: TestSection) => void
}) {
  return (
    <nav className="flex flex-col gap-2xs px-sm py-xs">
      {TEST_SECTIONS.map((section) => (
        <button
          key={section.id}
          type="button"
          aria-current={section.id === active ? 'page' : undefined}
          onClick={() => onSelect(section.id)}
          className={`flex h-9 w-full items-center gap-sm rounded-sm px-sm text-left transition-colors ${
            section.id === active ? 'bg-surface-selected' : 'hover:bg-surface-selected'
          }`}
        >
          <Icon name={section.icon} size={16} className="shrink-0 text-text-icon" />
          <span className="min-w-0 flex-1 truncate text-body text-text-primary">{section.label}</span>
        </button>
      ))}
    </nav>
  )
}

/** Plain empty state for the not-yet-built 'suite'/'cycles' sections. */
function TestSectionEmptyState({ icon, caption }: { icon: string; caption: string }) {
  return (
    <div className="mt-[15%] flex flex-col items-center gap-md px-lg text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-surface-selected text-text-tertiary">
        <Icon name={icon} size={20} />
      </span>
      <p className="m-0 text-body text-text-secondary">{caption}</p>
    </div>
  )
}

/** Same shell the canvas's own floating LHS ("Edit with AI") and RHS (node config / Test
 *  details) panels use: inset from the edges, rounded, elevated — not a flush column. Jay &
 *  Robin only — 23 Sep's `layout="fullpage"` never uses this. */
const FLOATING_PANEL_CLASS =
  'absolute top-lg bottom-lg z-10 overflow-y-auto scrollbar-subtle rounded-2xl border border-border bg-surface shadow-[0_2px_12px_1px_rgba(13,13,18,0.08)]'

/** Same steps the canvas's own "Run test" walks — built once from the static workflow data
 *  (title-identical to what the canvas cards show; the copy patching `WorkflowEditorScreen`
 *  does elsewhere only rewrites descriptions/goals, not the titles this reads). */
const JAY_ROBIN_TEST_RUN_STEPS = buildTestRunSteps(
  REVIEW_RESPONSE_WORKFLOW.nodes,
  REVIEW_RESPONSE_WORKFLOW.nodeDetails,
)

/** Left panel header, shared by the empty and filled states — the panel is titled "Test
 *  cases" regardless of whether any have been run yet. The "+ Add test case" button is only
 *  shown once there's already a list to add to; the empty state has its own centered CTA. */
function TestCasesPanelHeader({
  onAddTestCase,
  showAddButton = true,
}: {
  onAddTestCase?: () => void
  showAddButton?: boolean
}) {
  return (
    <div className="flex items-center justify-between px-sm py-xs">
      <p className="m-0 text-body text-text-primary">Test cases</p>
      {showAddButton && (
        <button
          type="button"
          onClick={onAddTestCase}
          className="flex items-center gap-xs rounded-sm px-sm py-xs text-body text-text-action transition-colors hover:bg-surface-hover"
        >
          <Icon name="add" size={16} />
          Add test case
        </button>
      )}
    </div>
  )
}

/** LHS empty state — the centered "Add test case" CTA. Shared by both layouts; the caller
 *  supplies the outer chrome (floating card vs. plain full-page column). `ctaLabel` lets 23
 *  Sep read "Test case" while Jay & Robin keeps its original wording. */
function LhsEmptyContent({ onRunTest, ctaLabel = 'Add test case' }: { onRunTest?: () => void; ctaLabel?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-md px-lg text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-surface-selected text-text-tertiary">
        <Icon name="science" size={20} />
      </span>
      <p className="m-0 text-body text-text-secondary">
        Select a variety of reviews in your test case for best results.
      </p>
      <button
        type="button"
        onClick={onRunTest}
        className="flex h-9 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
      >
        {ctaLabel}
      </button>
    </div>
  )
}

/** One review row — reviewer, star rating, snippet, pass/fail icon. Shared by Jay & Robin's
 *  inline list (below) and 23 Sep's `TestBatchReviewsPanel` slide-in. `passed` (23 Sep only,
 *  computed by the caller via `reviewPassedInBatch`) swaps the icon to red when false, instead
 *  of always showing the green check Jay & Robin uses (leaving `passed` unset). */
function ReviewRow({
  review,
  active,
  onSelect,
  passed,
}: {
  review: Review
  active: boolean
  onSelect: (id: string) => void
  passed?: boolean
}) {
  const failed = passed === false
  return (
    <button
      type="button"
      onClick={() => onSelect(review.id)}
      className={`flex items-start gap-sm rounded-sm px-sm py-sm text-left transition-colors ${
        active ? 'bg-surface-selected' : 'hover:bg-surface-hover'
      }`}
    >
      <Icon
        name={failed ? 'cancel' : 'check_circle'}
        size={18}
        className={`mt-[2px] shrink-0 ${failed ? 'text-chip-danger-text' : 'text-accent-positive'}`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-sm">
          <span className="min-w-0 truncate text-body text-text-primary">{review.reviewerName}</span>
          <StarRating rating={review.rating} size={14} />
        </div>
        <p className="m-0 mt-2xs line-clamp-2 text-small text-text-tertiary">{review.text}</p>
      </div>
    </button>
  )
}

/** LHS filled state — Jay & Robin only (23 Sep's fullpage layout shows batch cards in the
 *  main/central workspace instead, via `TestBatchSummaryCard`). One group per batch, newest
 *  first (display only; the caller's default "most recent" selection still reads the batches
 *  array in run order), each with its reviews listed inline underneath. */
function LhsBatchesContent({
  batches,
  selectedId,
  onSelect,
}: {
  batches: TestRunBatch[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div className="flex flex-col">
      {[...batches].reverse().map((batch, batchIndex) => (
        <div key={batchIndex} className={`flex flex-col gap-2xs ${batchIndex > 0 ? 'mt-lg' : ''}`}>
          <div className="flex items-center justify-between px-sm py-xs">
            <p className="m-0 text-small text-text-secondary">
              {batch.reviews.length} review{batch.reviews.length === 1 ? '' : 's'} tested
            </p>
            <p className="m-0 text-small text-text-secondary">{batch.testedAt}</p>
          </div>
          {batch.reviews.map((review) => (
            <ReviewRow key={review.id} review={review} active={review.id === selectedId} onSelect={onSelect} />
          ))}
        </div>
      ))}
    </div>
  )
}

/** The "N reviews" count to display for a batch — `displayReviewCount` when the batch sets one
 *  (a suite run, so the number agrees with that suite's own card), else the real list length. */
export function batchReviewCount(batch: TestRunBatch) {
  return batch.displayReviewCount ?? batch.reviews.length
}

const BATCH_PANEL_TABS: Tab[] = [
  { id: 'reviews', label: 'Reviews tested' },
  { id: 'recommendations', label: 'Recommendations' },
]

/** One recommendation group card in the panel's Recommendations tab — severity chip, the fix
 *  text, how many reviews it covers, and an Accept CTA that behaves exactly like a single
 *  review's own Accept (see `TestResultBody`). */
export function RecommendationGroupCard({
  group,
  onAccept,
}: {
  group: RecommendationGroup
  onAccept: (text: string) => void
}) {
  return (
    <div className="flex flex-col gap-md rounded-md border border-border p-lg">
      <div className="flex items-center justify-between">
        <Chip label={`${SEVERITY_LABEL[group.severity]} severity`} variant={SEVERITY_CHIP_VARIANT[group.severity]} />
        <p className="m-0 text-small text-text-secondary">Reviews impacted: {group.reviews.length}</p>
      </div>
      <p className="m-0 text-body text-text-primary">{group.text}</p>
      <button
        type="button"
        onClick={() => onAccept(group.text)}
        className="flex h-9 w-fit items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
      >
        Accept
      </button>
    </div>
  )
}

/** 23 Sep only — slide-in panel (same convention as `TranscriptSidePanel`/`ProcedureSidePanel`)
 *  opened by clicking a batch's header row in the collapsed LHS list. Portalled to `<body>`,
 *  same reason `GhostwriterRunTestModal` is: the Ghostwriter shell's tab bar is a pinned z-30.
 *  Two tabs: "Reviews tested" (the original flat list) and "Recommendations" (every failed
 *  review's fix, grouped by severity). */
function TestBatchReviewsPanel({
  open,
  batch,
  selectedId,
  onSelect,
  onClose,
  onAcceptRecommendation,
}: {
  open: boolean
  batch: TestRunBatch | null
  selectedId: string | null
  onSelect: (id: string) => void
  onClose: () => void
  onAcceptRecommendation?: (text: string) => void
}) {
  const [panelTab, setPanelTab] = useState<'reviews' | 'recommendations'>('reviews')
  const groups = batch ? getBatchRecommendationGroups(batch) : []

  return createPortal(
    <div className={`fixed inset-0 z-[110] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/20 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
      />
      <aside
        className={`absolute right-0 top-0 flex h-full w-[480px] max-w-[92vw] flex-col bg-surface shadow-dropdown transition-transform duration-200 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {batch && (
          <>
            <div className="flex shrink-0 items-center justify-between gap-sm border-b border-border px-2xl py-lg">
              <div>
                <p className="m-0 text-h3 text-text-primary">
                  {batchReviewCount(batch).toLocaleString()} review{batchReviewCount(batch) === 1 ? '' : 's'} tested
                </p>
                <p className="m-0 mt-2xs text-small text-text-tertiary">{batch.testedAt}</p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="flex size-7 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
              >
                <Icon name="close" size={20} />
              </button>
            </div>
            <div className="shrink-0 px-lg pt-md">
              <Tabs tabs={BATCH_PANEL_TABS} activeTab={panelTab} onChange={(id) => setPanelTab(id as 'reviews' | 'recommendations')} />
            </div>
            <div className="scrollbar-subtle flex-1 overflow-y-auto px-lg py-md">
              {panelTab === 'reviews' ? (
                <div className="flex flex-col">
                  {batch.reviews.map((review) => (
                    <ReviewRow
                      key={review.id}
                      review={review}
                      active={review.id === selectedId}
                      passed={reviewPassedInBatch(review, batch)}
                      onSelect={(id) => {
                        onSelect(id)
                        onClose()
                      }}
                    />
                  ))}
                </div>
              ) : groups.length > 0 ? (
                <div className="flex flex-col gap-md">
                  {groups.map((group) => (
                    <RecommendationGroupCard
                      key={group.severity}
                      group={group}
                      onAccept={(text) => {
                        onAcceptRecommendation?.(text)
                        onClose()
                      }}
                    />
                  ))}
                </div>
              ) : (
                <p className="m-0 text-body text-text-tertiary">No recommendations — every review in this run passed.</p>
              )}
            </div>
          </>
        )}
      </aside>
    </div>,
    document.body,
  )
}

/** RHS empty state — placeholder line, no result yet. */
function RhsEmptyContent() {
  return (
    <div className="flex flex-1 items-center justify-center text-center">
      <p className="m-0 text-body text-text-tertiary">Add a test case to see the result here.</p>
    </div>
  )
}

/** RHS filled state's body — title/chip, tabs, then the run's own step list or the review's
 *  simulated reply. Pure presentation: takes the running test's state as props so both layouts
 *  can share this markup without duplicating it — the floating layout (Jay & Robin) drives it
 *  from the same `useTestRun` call feeding the canvas behind it, the full-page layout (23 Sep,
 *  no canvas) drives it from its own independent call. 23 Sep's `TestReviewDetailModal` sets
 *  `showReviewerHeader` so this row reads reviewer name + star rating instead of the plain
 *  "Test" label, and passes the batch-aware `passed` (see `reviewPassedInBatch`) that decides
 *  the Passed/Failed chip — no per-review Recommendation tab here; that lives one level up, on
 *  the batch's own aggregate Recommendations tab (`RecommendationGroupCard`) instead. */
function TestResultBody({
  review,
  status,
  stepStatuses,
  showReviewerHeader = false,
  passed = true,
}: {
  review: Review
  status: TestRunStatus
  stepStatuses: ('pending' | 'running' | 'done')[]
  showReviewerHeader?: boolean
  passed?: boolean
}) {
  const [resultTab, setResultTab] = useState<'details' | 'preview'>('details')

  return (
    <div className="flex flex-col gap-md">
      <div className="flex items-center justify-between">
        {showReviewerHeader ? (
          <div>
            <p className="m-0 text-body text-text-primary">{review.reviewerName}</p>
            <div className="mt-2xs">
              <StarRating rating={review.rating} size={14} />
            </div>
          </div>
        ) : (
          <p className="m-0 text-body text-text-primary">Test</p>
        )}
        <Chip label={passed ? 'Passed' : 'Failed'} variant={passed ? 'success' : 'danger'} />
      </div>
      <Tabs
        tabs={TEST_RESULT_TABS}
        activeTab={resultTab}
        onChange={(id) => setResultTab(id as 'details' | 'preview')}
        showBaseline={false}
      />
      {resultTab === 'details' ? (
        <div className="rounded-md border border-border p-lg">
          {JAY_ROBIN_TEST_RUN_STEPS.map((step, i) => (
            <TestRunStepRow
              key={step.id}
              step={step}
              status={stepStatuses[i] ?? 'pending'}
              isLast={i === JAY_ROBIN_TEST_RUN_STEPS.length - 1 && status !== 'complete'}
            />
          ))}
          {status === 'complete' && (
            <div className="flex items-center gap-md">
              <Icon name="check_circle" size={20} fill className="shrink-0 text-accent-positive" />
              <span className="text-small text-text-tertiary">Completed</span>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-md border border-border p-lg">
          <ReviewCardBody review={review} />
        </div>
      )}
    </div>
  )
}

/** Jay & Robin's floating layout: owns the one `useTestRun` call shared by the center canvas
 *  (highlighted nodes) and the floating right panel's step list, so they stay in lockstep —
 *  mounted fresh (via `key={review.id}` at the call site) every time the selected review
 *  changes, restarting the run instead of freezing on whichever review finished first. */
function ReviewWorkflowRun({
  review,
  centerContent,
}: {
  review: Review
  centerContent: GhostwriterTestRunPanelProps['centerContent']
}) {
  const { activeNodeId, doneNodeIds, status, stepStatuses } = useTestRun(JAY_ROBIN_TEST_RUN_STEPS)

  return (
    <>
      <div className="absolute inset-0">{centerContent({ activeNodeId, doneNodeIds })}</div>
      <div className={`${FLOATING_PANEL_CLASS} right-lg w-[420px] p-lg`}>
        <TestResultBody review={review} status={status} stepStatuses={stepStatuses} />
      </div>
    </>
  )
}

/** 23 Sep's full-page layout has no canvas to drive, so its RHS just needs its own
 *  independent `useTestRun` call — same restart-on-review-change trick via `key`. */
function FullPageResultPanel({
  review,
  showReviewerHeader,
  passed,
}: {
  review: Review
  showReviewerHeader?: boolean
  passed?: boolean
}) {
  const { status, stepStatuses } = useTestRun(JAY_ROBIN_TEST_RUN_STEPS)
  return (
    <TestResultBody
      review={review}
      status={status}
      stepStatuses={stepStatuses}
      showReviewerHeader={showReviewerHeader}
      passed={passed}
    />
  )
}

/** Same "By {name}" pool the agent directory cards already use (Rupa/Akhil/Raynil/Haresh/John),
 *  so a mocked tester reads as one of this account's existing people rather than a stranger.
 *  Exported so `GhostwriterTestRunReport`'s header shows the identical name for the same run
 *  instead of picking its own. */
export const TESTER_NAMES = ['Rupa', 'Akhil', 'Raynil', 'Haresh', 'John']

function hashSeed(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return hash
}

/** Deterministic, not truly random — picked once per run (seeded off its own name + timestamp)
 *  so the same batch always attributes to the same person, in the list card and the detail
 *  page alike. */
export function pickTesterName(batch: TestRunBatch) {
  return TESTER_NAMES[hashSeed(`${batch.runName}:${batch.testedAt}`) % TESTER_NAMES.length]
}

/** The line shown under a run's name — same in `TestBatchSummaryCard`'s row and
 *  `GhostwriterTestRunReport`'s header, so clicking through doesn't repeat some of the same
 *  details while dropping others. Only runs (`batch.runName` set) attribute to a tester; the
 *  older plain-picker batches never had one. */
export function testRunSubtitle(batch: TestRunBatch, total: number) {
  return [
    batch.runName ? `Run by ${pickTesterName(batch)}` : null,
    batch.suiteName ? `Test suite: ${batch.suiteName}` : null,
    `${total.toLocaleString()} review${total === 1 ? '' : 's'} tested`,
    batch.testedAt,
  ]
    .filter(Boolean)
    .join(' · ')
}

/** 23 Sep only — one card per test run, stacked in the central workspace (newest on top),
 *  summarizing how many reviews, who ran it, when, and the pass count. Some reviews genuinely
 *  fail, but only for a suite run (`reviewPassedInBatch`) — a manually-tested batch is always
 *  all-passed. For a suite run the displayed total is scaled up from the small real `reviews`
 *  array (see `batchReviewCount`), so the passed count is scaled by the same ratio to stay
 *  proportional. Clicking a card opens `TestBatchReviewsPanel` for that batch. */
function TestBatchSummaryCard({ batch, onClick }: { batch: TestRunBatch; onClick: () => void }) {
  const total = batchReviewCount(batch)
  const realTotal = batch.reviews.length
  const realPassed = batch.reviews.filter((r) => reviewPassedInBatch(r, batch)).length
  const passedCount = batch.displayReviewCount && realTotal > 0 ? Math.round((realPassed / realTotal) * total) : realPassed
  const score = total > 0 ? (passedCount / total) * 100 : 0
  const subtitle = testRunSubtitle(batch, total)
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-lg rounded-md border border-border p-lg text-left transition-colors hover:bg-surface-hover"
    >
      <div>
        <p className="m-0 text-body text-text-primary">
          {batch.runName
            ? batch.runName
            : `${batch.suiteName ? `${batch.suiteName} - ` : ''}${total.toLocaleString()} review${total === 1 ? '' : 's'} tested`}
        </p>
        <p className="m-0 mt-2xs text-small text-text-secondary">{subtitle}</p>
      </div>
      <div className="text-right">
        <Chip label={`${score.toFixed(1)}%`} variant={score === 100 ? 'success' : 'warning'} />
      </div>
    </button>
  )
}

/** 23 Sep only — centered pop-up (same convention as `GhostwriterRunTestModal`) showing one
 *  review's full test result: the same `TestResultBody` (Chip + Details/Preview tabs + stepper)
 *  that used to sit inline on the RHS. Opened by picking a review inside
 *  `TestBatchReviewsPanel`. */
export function TestReviewDetailModal({
  open,
  review,
  passed,
  onClose,
}: {
  open: boolean
  review: Review | null
  passed?: boolean
  onClose: () => void
}) {
  if (!open || !review) return null

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center" aria-hidden={!open}>
      <div onClick={onClose} className="absolute inset-0 bg-black/20" />
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex h-[calc(100vh-130px)] w-full max-w-[720px] flex-col overflow-hidden rounded-md bg-surface shadow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-sm border-b border-border px-2xl py-lg">
          <p className="m-0 text-h3 text-text-primary">Review Details</p>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex size-8 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
          >
            <Icon name="close" size={20} />
          </button>
        </div>
        <div className="scrollbar-subtle flex-1 overflow-y-auto px-2xl py-lg">
          <FullPageResultPanel key={review.id} review={review} showReviewerHeader passed={passed} />
        </div>
      </div>
    </div>,
    document.body,
  )
}

/** 23 Sep only — persistent page header for a section on the RHS ("main screen"/central
 *  workspace): title on the left, a "+ {ctaLabel}" CTA on the right. Test cases always shows
 *  its CTA, empty or not; Test suite passes `showCta={testSuites.length > 0}` so the header CTA
 *  only appears once there's a suite to show — the empty state carries its own centered CTA
 *  until then. */
function TestPageHeader({
  title,
  ctaLabel,
  onClickCta,
  showCta = true,
}: {
  title: string
  ctaLabel: string
  onClickCta?: () => void
  showCta?: boolean
}) {
  return (
    <div className="mb-lg flex items-center justify-between">
      <h1 className="m-0 text-h3 text-text-primary">{title}</h1>
      {showCta && (
        <button
          type="button"
          onClick={onClickCta}
          className="flex h-9 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  )
}

/** Create agent CTA — the Test tab, both before and after "Run test" is confirmed in
 *  `GhostwriterRunTestModal`. Two layouts:
 *
 *  - `layout="floating"` (default, Jay & Robin): the canvas (mounted by the caller via
 *    `centerContent`) fills the whole area full-bleed, with the reviews list and the result
 *    detail floating over it on the left/right — not flex columns dividing the width, and not
 *    swapped out for a different screen while empty.
 *  - `layout="fullpage"` (23 Sep): a plain full-page list+detail layout (`bg-surface`) — no
 *    canvas at all, so `centerContent` is never called. The section nav stays pinned to the
 *    left of the page; the central workspace grows with the viewport.
 *
 *  Every picked review already has a simulated reply in `data/reviewsData.ts`, so each one
 *  reads as a passing run. */
export function GhostwriterTestRunPanel({
  batches,
  centerContent,
  onRunTest,
  className = '',
  layout = 'floating',
  testSuites = [],
  onSaveTestSuite,
  onUpdateTestSuite,
  onAcceptRecommendation,
  onRunTestWithSuite,
}: GhostwriterTestRunPanelProps) {
  const allReviews = batches.flatMap((batch) => batch.reviews)
  const lastBatch = batches[batches.length - 1]
  const [selectedId, setSelectedId] = useState(lastBatch?.reviews[0]?.id ?? null)
  const selected = allReviews.find((r) => r.id === selectedId) ?? lastBatch?.reviews[0] ?? null
  const [section, setSection] = useState<TestSection>('cases')
  const [openBatch, setOpenBatch] = useState<TestRunBatch | null>(null)
  const [detailReview, setDetailReview] = useState<Review | null>(null)
  const [detailBatch, setDetailBatch] = useState<TestRunBatch | null>(null)
  const [suiteEditorOpen, setSuiteEditorOpen] = useState(false)
  const [editingSuite, setEditingSuite] = useState<TestSuite | null>(null)
  /** 23 Sep only — Front desk (Sep 23) mirrors this exact pattern with its own
   *  `createRunOpen`/`FrontdeskTestRunEditor`. */
  const [createRunOpen, setCreateRunOpen] = useState(false)
  /** 23 Sep only — a completed run (`batch.runName` set, i.e. one created via
   *  `GhostwriterTestRunEditor`) opens `GhostwriterTestRunReport` in place of the Tests list
   *  instead of the plain-batch `TestBatchReviewsPanel` slide-in; older batches have no
   *  evaluation metrics to show and keep using `openBatch`. */
  const [openRunReport, setOpenRunReport] = useState<TestRunBatch | null>(null)

  if (layout === 'fullpage') {
    const sectionMeta = TEST_SECTIONS.find((s) => s.id === section) ?? TEST_SECTIONS[0]

    return (
      <div className={`scrollbar-subtle flex h-full min-h-0 w-full flex-col overflow-y-auto bg-surface px-lg py-xl ${className}`}>
        <div className="flex w-full flex-1 gap-2xl">
          <div className="flex w-[200px] shrink-0 flex-col border-r border-border pr-lg">
            <TestSectionNav active={section} onSelect={setSection} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col pl-lg">
            {section === 'cases' ? (
              createRunOpen ? (
                <GhostwriterTestRunEditor
                  key={batches.filter((batch) => batch.runName).length}
                  defaultName={`#${batches.filter((batch) => batch.runName).length + 1} test run`}
                  testSuites={testSuites}
                  onBack={() => setCreateRunOpen(false)}
                  onRun={(draft) => {
                    onRunTestWithSuite?.(draft)
                    setCreateRunOpen(false)
                  }}
                />
              ) : openRunReport ? (
                <GhostwriterTestRunReport
                  batch={openRunReport}
                  onBack={() => setOpenRunReport(null)}
                  onAcceptRecommendation={onAcceptRecommendation}
                />
              ) : (
              <>
                <div className="mb-lg flex items-center justify-between">
                  <h1 className="m-0 text-h3 text-text-primary">Test runs</h1>
                  {batches.length > 0 && (
                    <TestCaseCtaButton onClick={() => setCreateRunOpen(true)} />
                  )}
                </div>
                {batches.length > 0 ? (
                  <div className="flex flex-col gap-md">
                    {[...batches].reverse().map((batch, i) => (
                      <TestBatchSummaryCard
                        key={i}
                        batch={batch}
                        onClick={() => (batch.runName ? setOpenRunReport(batch) : setOpenBatch(batch))}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="mt-[15%] flex flex-col items-center gap-md px-lg text-center">
                    <span className="flex size-10 items-center justify-center rounded-full bg-surface-selected text-text-tertiary">
                      <Icon name="science" size={20} />
                    </span>
                    <p className="m-0 text-body text-text-secondary">
                      Select a variety of reviews in your test case for best results.
                    </p>
                    <TestCaseCtaButton onClick={() => setCreateRunOpen(true)} />
                  </div>
                )}
              </>
              )
            ) : section === 'suite' ? (
              suiteEditorOpen ? (
                <TestSuiteEditorPage
                  existingSuite={editingSuite}
                  onBack={() => {
                    setSuiteEditorOpen(false)
                    setEditingSuite(null)
                  }}
                  onSave={(suite) => {
                    if (editingSuite) onUpdateTestSuite?.(suite)
                    else onSaveTestSuite?.(suite)
                    setSuiteEditorOpen(false)
                    setEditingSuite(null)
                  }}
                />
              ) : (
                <>
                  <TestPageHeader
                    title="Test suite"
                    ctaLabel="Add test suite"
                    onClickCta={() => {
                      setEditingSuite(null)
                      setSuiteEditorOpen(true)
                    }}
                    showCta={testSuites.length > 0}
                  />
                  {testSuites.length > 0 ? (
                    <div className="flex flex-col gap-md">
                      {testSuites.map((suite) => (
                        <TestSuiteCard
                          key={suite.id}
                          suite={suite}
                          onEdit={() => {
                            setEditingSuite(suite)
                            setSuiteEditorOpen(true)
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <TestSuiteEmptyState
                      onCreate={() => {
                        setEditingSuite(null)
                        setSuiteEditorOpen(true)
                      }}
                    />
                  )}
                </>
              )
            ) : (
              <>
                <p className="m-0 text-body text-text-primary">{sectionMeta.label}</p>
                <TestSectionEmptyState icon={sectionMeta.icon} caption={sectionMeta.emptyCaption} />
              </>
            )}
          </div>
        </div>
        <TestBatchReviewsPanel
          open={openBatch !== null}
          batch={openBatch}
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id)
            setDetailReview(allReviews.find((r) => r.id === id) ?? null)
            setDetailBatch(openBatch)
            setOpenBatch(null)
          }}
          onClose={() => setOpenBatch(null)}
          onAcceptRecommendation={onAcceptRecommendation}
        />
        <TestReviewDetailModal
          open={detailReview !== null}
          review={detailReview}
          passed={detailReview && detailBatch ? reviewPassedInBatch(detailReview, detailBatch) : true}
          onClose={() => setDetailReview(null)}
        />
      </div>
    )
  }

  if (!selected) {
    return (
      <div className={`relative h-full min-h-0 w-full overflow-hidden ${className}`}>
        <div className="absolute inset-0">{centerContent({ activeNodeId: null, doneNodeIds: [] })}</div>
        <div className={`${FLOATING_PANEL_CLASS} left-lg flex w-[320px] flex-col p-md`}>
          <TestCasesPanelHeader showAddButton={false} />
          <LhsEmptyContent onRunTest={onRunTest} />
        </div>
        <div className={`${FLOATING_PANEL_CLASS} right-lg flex w-[420px] flex-col p-lg`}>
          <p className="m-0 text-body text-text-primary">Test</p>
          <RhsEmptyContent />
        </div>
      </div>
    )
  }

  return (
    <div className={`relative h-full min-h-0 w-full overflow-hidden ${className}`}>
      <div className={`${FLOATING_PANEL_CLASS} left-lg flex w-[320px] flex-col p-md`}>
        <TestCasesPanelHeader onAddTestCase={onRunTest} />
        <LhsBatchesContent batches={batches} selectedId={selectedId} onSelect={setSelectedId} />
      </div>

      <ReviewWorkflowRun key={selected.id} review={selected} centerContent={centerContent} />
    </div>
  )
}
