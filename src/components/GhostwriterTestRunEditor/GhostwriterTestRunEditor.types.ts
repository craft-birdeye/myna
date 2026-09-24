import type { TestSuite } from '../GhostwriterTestRunPanel/GhostwriterTestRunPanel.types'

/** 23 Sep only — what "Run test" hands back once the test-run page is submitted. */
export interface GhostwriterTestRunDraft {
  name: string
  suite: TestSuite | null
  qualityEvaluationIds: string[]
}

export interface GhostwriterTestRunEditorProps {
  defaultName: string
  testSuites: TestSuite[]
  onBack: () => void
  onRun: (draft: GhostwriterTestRunDraft) => void
}
